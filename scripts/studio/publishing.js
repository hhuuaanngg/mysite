const $ = (selector) => document.querySelector(selector);
let latest;
let pendingRequest = false;
let initializedSettings = false;
let lastRendered = "";
let currentJob = null;
const chosen = new Map();
const labels = { snapshot: "固定内容快照", building: "正在生成网站", uploading: "正在上传并校验", generated: "已生成 · 未上传", published: "已发布", failed: "失败" };
const message = (selector, text, error = false) => { $(selector).textContent = text; $(selector).classList.toggle("err", error); };
async function api(action = "", method = "GET", payload) {
  const response = await fetch(`/api/publishing${action ? `/${action}` : ""}`, {
    method, ...(payload !== undefined ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) } : {}),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "操作失败");
  return data;
}
function element(tag, text, className) {
  const el = document.createElement(tag);
  if (text) el.textContent = text;
  if (className) el.className = className;
  return el;
}
function render(data) {
  latest = data;
  const signature = JSON.stringify([data, pendingRequest]);
  if (signature === lastRendered) return;
  lastRendered = signature;
  const focused = document.activeElement?.dataset.focusKey;
  const expanded = new Set([...document.querySelectorAll("#publish-history details[open]")].map((el) => el.dataset.release));
  const changes = $("#publish-changes");
  changes.replaceChildren();
  for (const change of data.changes) {
    if (chosen.get(change.key) !== change.revision) chosen.delete(change.key);
    const row = element("label", "", "publish-change");
    const check = document.createElement("input");
    check.type = "checkbox";
    check.dataset.focusKey = change.key;
    check.checked = chosen.has(change.key);
    check.disabled = data.busy;
    check.addEventListener("change", () => { if (check.checked) chosen.set(change.key, change.revision); else chosen.delete(change.key); });
    row.append(check, element("span", `${change.change} · ${change.kind} · ${change.title}`));
    changes.append(row);
  }
  if (!data.changes.length) changes.append(element("p", "没有待发布的草稿。你仍可重新生成或发布现有网站。", "hint"));
  const canDeploy = data.settings && data.credentials.key && data.credentials.hosts;
  $("#generate-site").disabled = data.busy || pendingRequest;
  $("#deploy-site").disabled = data.busy || pendingRequest || !canDeploy;
  $("#backup-source").disabled = data.busy || pendingRequest;
  $("#publish-help").textContent = data.busy ? "任务处理中，请稍候。原稿已固定，当前暂不能保存新修改。" : canDeploy ? "点击发布会生成整站，只纳入勾选的草稿。" : "先在下方保存服务器设置、导入密钥并测试连接，即可启用云端发布。也可以先仅生成网站。";
  const history = $("#publish-history");
  history.replaceChildren();
  for (const job of data.releases.slice(0, 20)) {
    const row = element("article", "", "release-row");
    row.append(element("strong", `${job.interrupted ? "任务中断 · 请检查线上版本" : labels[job.status]}${data.state.current === job.id ? " · 当前线上版本" : ""}`));
    row.append(element("p", new Date(job.startedAt).toLocaleString() + ` · ${job.selected.length} 项草稿`, "hint"));
    if (job.error) row.append(element("p", job.error, "release-error"));
    if (["generated", "published"].includes(job.status)) {
      const link = element("a", "下载静态网页包", "ghost");
      link.href = `/api/publishing/artifacts/${job.id}`;
      row.append(link);
    }
    if (job.status === "published" && data.state.current === job.id) {
      const link = element("a", "查看线上网站", "ghost");
      link.href = job.siteUrl; link.target = "_blank"; link.rel = "noreferrer"; row.append(link);
    }
    if (job.status === "published" && data.state.current !== job.id) {
      const button = element("button", "回退到此版本", "ghost");
      button.type = "button"; button.disabled = data.busy || pendingRequest;
      button.addEventListener("click", () => {
        if (confirm("让线上网站回到这个版本？本地草稿会保留。")) act("#publish-status", () => api("rollback", "POST", { id: job.id }), "线上网站已回退；本地草稿已保留。");
      });
      row.append(button);
    }
    if (job.log) { const details = element("details"); details.dataset.release = job.id; details.open = expanded.has(job.id); details.append(element("summary", "查看生成记录"), element("pre", job.log)); row.append(details); }
    history.append(row);
  }
  if (!data.releases.length) history.append(element("p", "还没有发布记录。", "hint"));
  if (!initializedSettings && data.settings) {
    for (const [name, value] of Object.entries(data.settings)) $("#publish-settings").elements.namedItem(name).value = value;
    initializedSettings = true;
  }
  $("#ssh-key-state").textContent = data.credentials.key ? "已保存专用私钥" : "尚未导入";
  $("#ssh-hosts-state").textContent = data.credentials.hosts ? "已保存指纹文件" : "尚未导入";
  const job = data.releases.find((item) => item.id === currentJob);
  if (job && ["published", "generated", "failed"].includes(job.status)) {
    message("#publish-status", job.status === "published" ? "发布成功。可在记录中打开线上网站。" : job.status === "generated" ? "网站已生成，可以下载网页包；尚未上传云端。" : "发布失败，详情见下方记录。若中途断网，请核对线上版本。", job.status === "failed");
    currentJob = null;
  }
  if (focused) [...document.querySelectorAll("[data-focus-key]")].find((el) => el.dataset.focusKey === focused)?.focus({ preventScroll: true });
}
async function refresh() { render(await api()); }
async function act(target, callback, success) {
  if (pendingRequest) return;
  pendingRequest = true;
  if (latest) render(latest);
  message(target, "正在处理…");
  try { await callback(); message(target, success); }
  catch (error) { message(target, error.message, true); }
  finally { pendingRequest = false; await refresh().catch((error) => message(target, error.message, true)); }
}
for (const [id, mode] of [["generate-site", "generate"], ["deploy-site", "deploy"]]) {
  $(`#${id}`).addEventListener("click", () => act("#publish-status", async () => {
    const selection = latest.changes.filter((c) => chosen.get(c.key) === c.revision).map(({ key, revision }) => ({ key, revision }));
    currentJob = (await api("start", "POST", { mode, selection })).id;
  }, mode === "deploy" ? "发布任务已开始，进度见下方记录。" : "开始生成网站，完成后可在下方下载。"));
}
$("#refresh-publishing").addEventListener("click", () => refresh().catch((error) => message("#publish-status", error.message, true)));
$("#recover-publish").addEventListener("click", () => act("#publish-status", () => api("recover", "POST", {}), "版本记录已核对，可以继续操作。"));
$("#publish-settings").addEventListener("submit", (event) => {
  event.preventDefault();
  act("#settings-status", () => api("settings", "PUT", Object.fromEntries(new FormData(event.currentTarget))), "设置已保存。");
});
$("#check-server").addEventListener("click", () => act("#settings-status", async () => { await api("check", "POST", {}); }, "连接成功。请确认网站服务根目录指向发布目录下的 current。"));
for (const [id, type] of [["ssh-key-file", "key"], ["ssh-hosts-file", "hosts"]]) {
  $(`#${id}`).addEventListener("change", (event) => {
    const file = event.target.files[0]; event.target.value = "";
    if (file) act("#settings-status", async () => api("credentials", "PUT", { type, data: await file.text() }), "文件已安全保存在本机。");
  });
}
$("#backup-source").addEventListener("click", () => act("#backup-status", async () => {
  const backup = await api("backup", "POST", {});
  const link = element("a"); link.href = backup.url; link.download = "";
  document.body.append(link); link.click(); link.remove();
}, "备份已生成并开始下载，请保存到其他硬盘或云盘。"));
window.addEventListener("publishing-open", () => refresh().catch((error) => message("#publish-status", error.message, true)));
setInterval(() => {
  if (document.body.dataset.mode === "publishing" && !document.hidden) refresh().catch(() => {});
}, 3000);
refresh().catch((error) => message("#publish-status", error.message, true));
