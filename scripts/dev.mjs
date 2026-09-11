import path from "node:path";
import { parseArgs } from "node:util";
import { dev } from "astro";

const { values } = parseArgs({ options: {
  port: { type: "string", short: "p" },
  host: { type: "string" },
} });
if (values.port) process.env.SITE_PORT = values.port;
const { SITE_ORIGIN, SITE_PORT, STUDIO_ORIGIN, STUDIO_PORT } = await import("./ports.mjs");
const { startStudio } = await import("./studio-server.mjs");
const root = path.resolve(import.meta.dirname, "..");
let studio;
let website;
let stopping = false;

async function shutdown() {
  if (stopping) return;
  stopping = true;
  await website?.stop();
  studio?.close();
}

try {
  try {
    studio = await startStudio({ port: STUDIO_PORT, root });
    console.log(`内容工坊  ${studio.url}`);
  } catch (error) {
    if (error?.code !== "EADDRINUSE") throw error;
    console.log(`内容工坊已在 ${STUDIO_ORIGIN}`);
  }
  // Supervise both servers in this process. Astro 7's agent-aware CLI can detach
  // automatically, which would otherwise close the studio when the child exits.
  process.env.STUDIO_ORIGIN = STUDIO_ORIGIN;
  website = await dev({ root, server: {
    port: SITE_PORT,
    host: values.host || process.env.SITE_BIND_HOST || "127.0.0.1",
  } });
  console.log(`站点      ${SITE_ORIGIN}`);
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
} catch (error) {
  console.error(error);
  await shutdown();
  process.exitCode = 1;
}
