import assert from "node:assert/strict";
import test from "node:test";
import { SITE_PORT, STUDIO_PORT } from "./ports.mjs";

test("dev ports are not 3000, 3100, 8787 or 4310", () => {
  assert.equal(SITE_PORT, 5680);
  assert.equal(STUDIO_PORT, 5681);
});
