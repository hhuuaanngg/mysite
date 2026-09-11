import fs from "node:fs";
import path from "node:path";
import { createPublisher } from "./publisher.mjs";
const root = path.resolve(import.meta.dirname, "..");
const publisher = createPublisher(root);
console.log("生成已发布内容（初次为项目原有内容）。新草稿请在内容工坊中勾选后生成。 ");
const { completion } = await publisher.start({ mode: "generate", selection: [] });
const job = await completion;
if (job.status !== "generated") { console.error(job.error); process.exitCode = 1; }
else {
  fs.rmSync(path.join(root, "out"), { recursive: true, force: true });
  fs.cpSync(path.join(root, ".studio/releases", job.id, "site"), path.join(root, "out"), { recursive: true });
  console.log("静态网站已生成到 out/；尚未上传云端。");
}
