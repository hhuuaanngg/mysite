import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { createStudioServer } from "./studio-server.mjs";

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve(`http://127.0.0.1:${address.port}`);
    });
  });
}

test("studio API lists and reads works", async () => {
  const root = path.resolve(import.meta.dirname, "..");
  const server = createStudioServer({ root });
  const base = await listen(server);
  try {
    const listed = await fetch(`${base}/api/works`).then((res) => res.json());
    assert.equal(listed.works[0].slug, "frpc-editor");
    const one = await fetch(`${base}/api/works/champiere`).then((res) => res.json());
    assert.equal(one.work.title, "Champiere");
    assert.equal(one.work.url, "https://champiere.com");
  } finally {
    server.close();
  }
});
