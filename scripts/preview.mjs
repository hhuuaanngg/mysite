import path from "node:path";
import { parseArgs } from "node:util";
import { preview } from "astro";

const { values } = parseArgs({ options: {
  port: { type: "string", short: "p", default: process.env.SITE_PORT || "5680" },
  host: { type: "string", default: "127.0.0.1" },
} });
// Keep the preview attached so test runners can start and stop it reliably.
const server = await preview({ root: path.resolve(import.meta.dirname, ".."), server: {
  port: Number(values.port), host: values.host,
} });
process.on("SIGINT", () => void server.stop());
process.on("SIGTERM", () => void server.stop());
await server.closed();
