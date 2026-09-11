import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { stateDir, validId } from "./publish-store.mjs";

export function run(command, args, { cwd, input, timeout = 600_000, onOutput = () => {}, env } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env: env || process.env, stdio: ["pipe", "pipe", "pipe"] });
    let output = "", stdout = "";
    const timer = setTimeout(() => child.kill("SIGKILL"), timeout);
    const collect = (data) => { const text = data.toString(); output = (output + text).slice(-24_000); onOutput(text); };
    child.stdout.on("data", (data) => { stdout = (stdout + data.toString()).slice(-24_000); collect(data); });
    child.stderr.on("data", collect);
    child.stdin.on("error", () => {});
    child.on("error", (error) => { clearTimeout(timer); reject(error); });
    child.on("close", (code) => { clearTimeout(timer); if (code === 0) resolve(stdout.trim()); else reject(new Error(`${command} 执行失败（${code ?? "超时"}）\n${output}`)); });
    child.stdin.end(input || "");
  });
}
export function validateSettings(input) {
  const host = String(input.host || "").trim();
  const user = String(input.user || "").trim();
  const port = Number(input.port || 22);
  const remotePath = String(input.remotePath || "").trim().replace(/\/$/, "");
  const siteUrl = new URL(input.siteUrl);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9.-]*$/.test(host) || host.length > 253) throw new Error("请填写服务器 IP 或主机名");
  if (!/^[a-z_][a-z0-9_-]*$/i.test(user)) throw new Error("SSH 用户名不合法");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("SSH 端口不合法");
  if (!/^\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)+$/.test(remotePath)) throw new Error("发布目录至少两层，例如 /srv/mysite；只使用英文、数字、短横线和下划线");
  if (!["https:", "http:"].includes(siteUrl.protocol) || siteUrl.username || siteUrl.password || siteUrl.pathname !== "/" || siteUrl.search || siteUrl.hash) throw new Error("网站地址应是完整域名，例如 https://hjy.me（不带子目录）");
  return { host, user, port, remotePath, siteUrl: siteUrl.origin };
}
export const targetKey = (config) => crypto.createHash("sha256").update(JSON.stringify([config.host, config.port, config.user, config.remotePath, config.siteUrl])).digest("hex");
const quote = (value) => `'${String(value).replaceAll("'", "'\\''")}'`;
function sshArgs(root, config) {
  const dir = path.join(stateDir(root), "ssh");
  for (const name of ["id_ed25519", "known_hosts"]) if (!fs.existsSync(path.join(dir, name))) throw new Error("请先在发布设置中导入专用 SSH 私钥和服务器指纹文件");
  return ["-F", "/dev/null", "-i", path.join(dir, "id_ed25519"), "-o", "IdentitiesOnly=yes", "-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=yes", "-o", `UserKnownHostsFile=${path.join(dir, "known_hosts")}`, "-o", "ConnectTimeout=15", "-o", "ServerAliveInterval=15", "-o", "ServerAliveCountMax=3", "-p", String(config.port)];
}
function remote(root, config, script, args = [], options = {}) {
  return run("ssh", [...sshArgs(root, config), `${config.user}@${config.host}`, `sh -s -- ${[config.remotePath, ...args].map(quote).join(" ")}`], { input: `set -eu\n${script}\n`, timeout: 60_000, ...options });
}
export async function checkConnection(root, config) {
  await remote(root, config, `
command -v rsync >/dev/null
command -v sha256sum >/dev/null
command -v flock >/dev/null
command -v readlink >/dev/null
if [ -e "$1/current" ] && [ ! -L "$1/current" ]; then echo 'current 必须是符号链接，请使用独立发布目录'; exit 1; fi
if [ -d "$1" ]; then test -w "$1"; else test -d "$(dirname "$1")"; test -w "$(dirname "$1")"; fi
echo 'SSH 连接、服务器指纹、依赖和目录权限正常'
`);
  return { ok: true, message: "连接成功。请确认网站服务的根目录指向发布目录下的 current。" };
}
export async function remoteCurrent(root, config) {
  return remote(root, config, `if [ -L "$1/current" ]; then readlink "$1/current"; elif [ -e "$1/current" ]; then exit 1; fi`);
}
export async function verifyRemote(root, config, id) {
  if (!validId(id)) throw new Error("版本无效");
  await remote(root, config, `test "$(readlink "$1/current")" = "releases/$2"; test "$(cat "$1/current/__release.txt")" = "$2"; (cd "$1/current" && sha256sum --quiet -c SHA256SUMS)`, [id]);
}
const SWITCH = `
base="$1"; id="$2"; expected="$3"
mkdir -p "$base"
exec 9>"$base/.publish.lock"
flock -w 10 9
actual="$(readlink "$base/current" || true)"
test "$actual" = "$expected" || { echo '线上版本已变化，请先核对发布记录'; exit 1; }
test ! -e "$base/current" || test -L "$base/current"
test -f "$base/releases/$id/index.html"
test "$(cat "$base/releases/$id/__release.txt")" = "$id"
(cd "$base/releases/$id" && sha256sum --quiet -c SHA256SUMS)
ln -sfn "releases/$id" "$base/.current-$id"
mv -Tf "$base/.current-$id" "$base/current"
`;
export async function deploy(root, config, id, outputDir, expected = "", onOutput) {
  if (!validId(id)) throw new Error("发布版本无效");
  const actual = await remoteCurrent(root, config);
  if (actual !== expected) throw new Error("服务器当前版本与本地记录不一致，请核对服务器和发布目录；首次发布应使用空的独立目录");
  await remote(root, config, `mkdir -p "$1/releases"; test ! -e "$1/releases/$2"; mkdir -p "$1/.incoming-$2"`, [id]);
  try {
    const transport = ["ssh", ...sshArgs(root, config)].map(quote).join(" ");
    await run("rsync", ["-az", "--delete", "-e", transport, `${outputDir}/`, `${config.user}@${config.host}:${config.remotePath}/.incoming-${id}/`], { onOutput });
    await remote(root, config, `test -f "$1/.incoming-$2/index.html"; (cd "$1/.incoming-$2" && sha256sum --quiet -c SHA256SUMS); mv "$1/.incoming-$2" "$1/releases/$2"`, [id]);
    await remote(root, config, SWITCH, [id, expected]);
  } catch (error) {
    // A dropped connection after the atomic switch is reconciled before reporting failure.
    try { if (await remoteCurrent(root, config) === `releases/${id}`) return; } catch { /* State may be unknown; preserve artifacts. */ }
    throw error;
  }
}
export async function rollback(root, config, id, expected) {
  if (!validId(id)) throw new Error("回退版本无效");
  try { await remote(root, config, SWITCH, [id, expected]); }
  catch (error) {
    try { if (await remoteCurrent(root, config) === `releases/${id}`) return; } catch { /* Keep both versions. */ }
    throw error;
  }
}
