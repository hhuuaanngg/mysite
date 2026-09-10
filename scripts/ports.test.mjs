import assert from "node:assert/strict";
import test from "node:test";
import { SITE_PORT, STUDIO_PORT } from "./ports.mjs";

test("dev ports are not 3000 or 8787", () => {
  assert.equal(SITE_PORT, 3100);
  assert.equal(STUDIO_PORT, 4310);
});
