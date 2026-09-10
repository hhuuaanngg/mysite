import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SITE_ORIGIN, SITE_PORT, STUDIO_ORIGIN, STUDIO_PORT } from "./ports.mjs";
import { startStudio } from "./studio-server.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextBin = path.join(root, "node_modules", ".bin", "next");
const extra = process.argv.slice(2);
const hasPortFlag = extra.some(
  (arg) => arg === "-p" || arg === "--port" || arg.startsWith("--port="),
);
const nextArgs = hasPortFlag
  ? ["dev", ...extra]
  : ["dev", "-p", String(SITE_PORT), ...extra];

let studio;
try {
  studio = await startStudio({ port: STUDIO_PORT, root });
  console.log(`内容工坊  ${studio.url}`);
} catch (error) {
  if (error && error.code === "EADDRINUSE") {
    console.log(`内容工坊已在 ${STUDIO_ORIGIN}`);
  } else {
    console.error(error);
    process.exit(1);
  }
}

const child = spawn(nextBin, nextArgs, {
  stdio: "inherit",
  cwd: root,
  env: {
    ...process.env,
    PORT: String(SITE_PORT),
    SITE_PORT: String(SITE_PORT),
    STUDIO_PORT: String(STUDIO_PORT),
    STUDIO_ORIGIN,
    SITE_ORIGIN,
  },
});

console.log(`站点      ${SITE_ORIGIN}`);

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
