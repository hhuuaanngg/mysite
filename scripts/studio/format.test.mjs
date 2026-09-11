import assert from "node:assert/strict";
import test from "node:test";
import {
  applyHeading,
  insertSnippet,
  toggleLinePrefix,
  wrapSelection,
} from "./format.mjs";

test("wrapSelection bolds and unwraps", () => {
  const wrapped = wrapSelection("hello", 0, 5, "**");
  assert.equal(wrapped.value, "**hello**");
  const unwrapped = wrapSelection(wrapped.value, wrapped.start, wrapped.end, "**");
  assert.equal(unwrapped.value, "hello");
});

test("applyHeading prefixes and toggles off", () => {
  const once = applyHeading("海边", 0, 2, 2);
  assert.equal(once.value, "## 海边");
  const twice = applyHeading(once.value, once.start, once.end, 2);
  assert.equal(twice.value, "海边");
});

test("toggleLinePrefix quotes selected lines", () => {
  const quoted = toggleLinePrefix("风很大。\n水很亮。", 0, 12, "> ");
  assert.equal(quoted.value, "> 风很大。\n> 水很亮。");
  const undone = toggleLinePrefix(quoted.value, quoted.start, quoted.end, "> ");
  assert.equal(undone.value, "风很大。\n水很亮。");
});

test("insertSnippet adds an image with spacing", () => {
  const next = insertSnippet("前文", 2, 2, "![](/pic.jpg)");
  assert.equal(next.value, "前文\n\n![](/pic.jpg)\n");
});
