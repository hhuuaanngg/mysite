import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startStudio, STUDIO_PORT } from "./studio-server.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextBin = path.join(root, "node_modules", ".bin", "next");

let studio;
try {
  studio = await startStudio({ port: STUDIO_PORT, root });
  console.log(`文章工坊  ${studio.url}`);
} catch (error) {
  if (error && error.code === "EADDRINUSE") {
    console.log(`文章工坊已在 http://127.0.0.1:${STUDIO_PORT}`);
  } else {
    console.error(error);
    process.exit(1);
  }
}

const child = spawn(nextBin, ["dev", ...process.argv.slice(2)], {
  stdio: "inherit",
  cwd: root,
  env: process.env,
});

function shutdown() {
  studio?.close();
  child.kill("SIGTERM");
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
child.on("exit", (code) => {
  studio?.close();
  process.exit(code ?? 0);
});
