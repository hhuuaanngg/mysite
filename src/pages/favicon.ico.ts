import { readFileSync } from "node:fs";
import path from "node:path";

export function GET() {
  const icon = readFileSync(path.resolve("src/assets/favicon.ico"));
  return new Response(new Uint8Array(icon), { headers: { "Content-Type": "image/x-icon" } });
}
