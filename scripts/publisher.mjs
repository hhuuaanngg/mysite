import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {
  initializePublishing, stateDir, releaseId, validId, readJson, writeJson,
  pendingChanges, snapshot, saveRevision, copyTree,
} from "./publish-store.mjs";
import { run, validateSettings, targetKey, checkConnection, deploy, rollback, remoteCurrent, verifyRemote } from "./ssh-deploy.mjs";

const APP_FILES = ["src", "scripts", "package.json", "package-lock.json", "astro.config.mjs", "tsconfig.json", "eslint.config.mjs"];

export async function buildRelease(root, source, output, { siteUrl, onOutput } = {}) {
  const work = path.join(path.dirname(source), "build");
  fs.mkdirSync(work, { recursive: true });
  try {
    for (const name of APP_FILES) copyTree(path.join(root, name), path.join(work, name));
    for (const name of ["src/content/articles", "src/content/works", "public"]) {
      fs.rmSync(path.join(work, name), { recursive: true, force: true });
      copyTree(path.join(source, name), path.join(work, name));
    }
    fs.symlinkSync(path.join(root, "node_modules"), path.join(work, "node_modules"), "dir");
    await run(process.execPath, [path.join(root, "node_modules/.bin/astro"), "build"], {
      cwd: work, onOutput,
      env: { ...process.env, NODE_ENV: "production", ASTRO_TELEMETRY_DISABLED: "1", ...(siteUrl ? { SITE_URL: siteUrl } : {}) },
    });
    if (!fs.existsSync(path.join(work, "out/index.html"))) throw new Error("没有生成完整网站");
    fs.renameSync(path.join(work, "out"), output);
  } finally { fs.rmSync(work, { recursive: true, force: true }); }
}
function manifest(output, id) {
  fs.writeFileSync(path.join(output, "__release.txt"), id + "\n");
  const sums = [];
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const file = path.join(dir, name);
      if (fs.statSync(file).isDirectory()) walk(file);
      else {
        const rel = path.relative(output, file).split(path.sep).join("/");
        if (/[\r\n\\]/.test(rel)) throw new Error("导出文件名不合法");
        sums.push(`${crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex")}  ${rel}`);
      }
    }
  }
  walk(output);
  fs.writeFileSync(path.join(output, "SHA256SUMS"), sums.join("\n") + "\n");
}

export function createPublisher(root, adapters = {}) {
  initializePublishing(root);
  const dir = stateDir(root);
  const lock = path.join(dir, "publish.lock");
  let active = null;
  const releaseDir = (id) => {
    if (!validId(id)) throw new Error("版本无效");
    return path.join(dir, "releases", id);
  };
  function acquire() {
    try { fs.writeFileSync(lock, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }), { flag: "wx", mode: 0o600 }); }
    catch (error) { if (error.code === "EEXIST") throw new Error("工坊正在处理任务，暂时不能保存或再次发布。若上次意外退出，请按使用说明恢复任务。"); throw error; }
  }
  const release = () => fs.rmSync(lock, { force: true });
  const settings = () => readJson(path.join(dir, "settings.json"));
  function status() {
    const config = settings();
    const ids = fs.existsSync(path.join(dir, "releases")) ? fs.readdirSync(path.join(dir, "releases")).filter(validId).sort().reverse() : [];
    return {
      busy: fs.existsSync(lock), active,
      state: readJson(path.join(dir, "state.json"), {}),
      changes: pendingChanges(root),
      settings: config,
      credentials: { key: fs.existsSync(path.join(dir, "ssh/id_ed25519")), hosts: fs.existsSync(path.join(dir, "ssh/known_hosts")) },
      releases: ids.map((id) => readJson(path.join(releaseDir(id), "job.json"))).filter(Boolean).map((job) => ({ ...job, interrupted: ["building", "uploading", "snapshot"].includes(job.status) && job.id !== active })),
    };
  }
  function configure(input) {
    acquire();
    try {
      const value = validateSettings(input);
      const state = readJson(path.join(dir, "state.json"), {});
      if (state.current && state.target !== targetKey(value)) throw new Error("此工坊已有发布记录。迁移服务器请使用新的项目副本，避免覆盖现有站点。");
      writeJson(path.join(dir, "settings.json"), value);
      return value;
    } finally { release(); }
  }
  function credential(type, data) {
    acquire();
    try {
      if (!["key", "hosts"].includes(type) || typeof data !== "string" || data.length > 65_536) throw new Error("凭据文件不合法");
      if (type === "key" && !/^-----BEGIN (?:OPENSSH|RSA|EC|PRIVATE).*PRIVATE KEY-----/m.test(data) && !/^-----BEGIN PRIVATE KEY-----/m.test(data)) throw new Error("请选择 PEM 或 OpenSSH 私钥文件");
      if (type === "hosts" && !data.split("\n").some((line) => /\S+\s+(ssh-|ecdsa-)/.test(line))) throw new Error("请选择已核验的 known_hosts 文件");
      const folder = path.join(dir, "ssh");
      fs.mkdirSync(folder, { recursive: true, mode: 0o700 });
      const file = path.join(folder, type === "key" ? "id_ed25519" : "known_hosts");
      fs.writeFileSync(file, data.trim() + "\n", { mode: 0o600 });
      fs.chmodSync(file, 0o600);
    } finally { release(); }
  }
  function mutate(callback) {
    acquire();
    try { saveRevision(root); return callback(); } finally { release(); }
  }
  async function start({ selection = [], mode = "generate" } = {}) {
    if (!["generate", "deploy"].includes(mode)) throw new Error("发布方式无效");
    const config = settings();
    if (mode === "deploy" && !config) throw new Error("请先填写发布设置并测试连接");
    if (mode === "deploy" && !adapters.deploy) {
      for (const name of ["id_ed25519", "known_hosts"]) if (!fs.existsSync(path.join(dir, "ssh", name))) throw new Error("请先导入 SSH 私钥和服务器指纹");
    }
    acquire();
    const id = releaseId();
    const folder = releaseDir(id);
    const job = { id, mode, status: "snapshot", startedAt: new Date().toISOString(), selected: selection, log: "", ...(config ? { target: targetKey(config), siteUrl: config.siteUrl } : {}) };
    const update = (patch) => { Object.assign(job, patch); writeJson(path.join(folder, "job.json"), job); };
    try {
      active = id;
      update({});
      snapshot(root, path.join(folder, "source"), selection);
    } catch (error) { update({ status: "failed", error: error.message }); active = null; release(); throw error; }
    const completion = (async () => {
      try {
        update({ status: "building" });
        await (adapters.build || buildRelease)(root, path.join(folder, "source"), path.join(folder, "site"), {
          siteUrl: config?.siteUrl,
          onOutput: (text) => update({ log: (job.log + text).slice(-16_000) }),
        });
        manifest(path.join(folder, "site"), id);
        await run("tar", ["-czf", path.join(folder, "website.tar.gz"), "-C", path.join(folder, "site"), "."]);
        if (mode === "deploy") {
          update({ status: "uploading" });
          const state = readJson(path.join(dir, "state.json"), {});
          await (adapters.deploy || deploy)(root, config, id, path.join(folder, "site"), state.current ? `releases/${state.current}` : "", (text) => update({ log: (job.log + text).slice(-16_000) }));
          writeJson(path.join(dir, "state.json"), { current: id, previous: state.current || null, target: targetKey(config), updatedAt: new Date().toISOString() });
        }
        update({ status: mode === "deploy" ? "published" : "generated", finishedAt: new Date().toISOString() });
      } catch (error) {
        update({ status: "failed", error: error.message, finishedAt: new Date().toISOString() });
      } finally { active = null; release(); }
      return job;
    })();
    return { id, completion };
  }
  async function revert(id) {
    const job = readJson(path.join(releaseDir(id), "job.json"));
    const config = settings();
    if (!config || job?.status !== "published" || job.target !== targetKey(config)) throw new Error("只能回退到此服务器上已成功发布的版本");
    acquire();
    try {
      const state = readJson(path.join(dir, "state.json"), {});
      if (!state.current || id === state.current) throw new Error("已经是该版本");
      await (adapters.rollback || rollback)(root, config, id, `releases/${state.current}`);
      writeJson(path.join(dir, "state.json"), { current: id, previous: state.current, target: targetKey(config), updatedAt: new Date().toISOString() });
      writeJson(path.join(dir, "rollbacks", `${releaseId()}.json`), { from: state.current, to: id });
      return { ok: true };
    } finally { release(); }
  }
  async function backup() {
    acquire();
    try {
      const id = releaseId();
      const folder = path.join(dir, "backups");
      fs.mkdirSync(folder, { recursive: true });
      const file = path.join(folder, `${id}.tar.gz`);
      const entries = [...APP_FILES, "public", "README.md", "Dockerfile", "compose.yaml", ".dockerignore", ".gitignore", "docs", ".studio/initial", ".studio/state.json", ".studio/releases", ".studio/revisions", ".studio/rollbacks"].filter((rel) => fs.existsSync(path.join(root, rel)));
      await run("tar", ["--exclude=build", "-czf", file, "-C", root, ...entries]);
      return { id, url: `/api/publishing/backups/${id}` };
    } finally { release(); }
  }
  async function recover() {
    if (active) throw new Error("任务仍在运行，请等它结束");
    if (fs.existsSync(lock)) {
      const owner = readJson(lock);
      if (owner?.pid !== process.pid) {
        let running = true;
        try { process.kill(owner.pid, 0); } catch (error) { if (error.code === "ESRCH") running = false; }
        if (running) throw new Error("另一个工坊进程仍在运行，请先关闭它再恢复");
      }
      release();
    }
    acquire();
    try {
      const config = settings();
      if (config) {
        const current = await (adapters.remoteCurrent || remoteCurrent)(root, config);
        if (current) {
          const id = current.replace(/^releases\//, "");
          const job = readJson(path.join(releaseDir(id), "job.json"));
          if (!job || job.mode !== "deploy" || job.target !== targetKey(config) || !fs.existsSync(path.join(releaseDir(id), "source"))) throw new Error("线上版本不属于本机发布记录，请先核对服务器配置和原稿备份");
          await (adapters.verifyRemote || verifyRemote)(root, config, id);
          const state = readJson(path.join(dir, "state.json"), {});
          writeJson(path.join(dir, "state.json"), { current: id, previous: state.current === id ? state.previous : state.current || null, target: targetKey(config), updatedAt: new Date().toISOString() });
          writeJson(path.join(releaseDir(id), "job.json"), { ...job, status: "published", error: null, recoveredAt: new Date().toISOString() });
        } else if (readJson(path.join(dir, "state.json"), {}).current) throw new Error("服务器上没有本地记录中的版本，请先恢复服务器文件");
      }
      const folder = path.join(dir, "releases");
      for (const id of fs.existsSync(folder) ? fs.readdirSync(folder).filter(validId) : []) {
        const file = path.join(releaseDir(id), "job.json");
        const job = readJson(file);
        if (job && ["snapshot", "building", "uploading"].includes(job.status)) writeJson(file, { ...job, status: "failed", error: "上次任务已中断，原稿和生成文件保留；可以重新生成发布。" });
      }
      return { ok: true };
    } finally { release(); }
  }
  return { status, configure, credential, mutate, start, revert, backup, recover,
    async check() { const config = settings(); if (!config) throw new Error("请先保存发布设置"); return (adapters.check || checkConnection)(root, config); },
    artifact(id) { return path.join(releaseDir(id), "website.tar.gz"); },
    backupFile(id) { if (!validId(id)) throw new Error("备份无效"); return path.join(dir, "backups", `${id}.tar.gz`); },
  };
}
