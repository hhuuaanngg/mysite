import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import matter from "gray-matter";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/content-schemas.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
}).outputText.replace(/from "([^"]+)"/g, (_, name) => `from "${import.meta.resolve(name)}"`);
const { articleSchema, workSchema } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

test("all existing Markdown frontmatter remains compatible without rewriting content", () => {
  for (const [collection, schema] of [["articles", articleSchema], ["works", workSchema]]) {
    const dir = new URL(`../src/content/${collection}/`, import.meta.url);
    for (const name of readdirSync(dir).filter((name) => name.endsWith(".md"))) {
      const data = matter(readFileSync(new URL(name, dir), "utf8")).data;
      assert.doesNotThrow(() => schema.parse(data), name);
    }
  }
});

test("article schema accepts YAML dates and rejects impossible dates or missing required fields", () => {
  const article = { title: "测试", date: new Date("2026-09-11"), category: "生活", summary: "摘要" };
  assert.equal(articleSchema.parse(article).date, "2026-09-11");
  for (const date of ["2026-02-30", "2026-13-01", "not-a-date"]) {
    assert.equal(articleSchema.safeParse({ ...article, date }).success, false, date);
  }
  for (const field of ["title", "date", "category", "summary"]) {
    assert.equal(articleSchema.safeParse({ ...article, [field]: undefined }).success, false, field);
  }
});

test("work schema retains text years and validates ordering, stack and cover colors", () => {
  const work = { title: "测试", year: "早期", order: 0, summary: "摘要", stack: ["Astro"], cover: { mark: "A", from: "#ABCDEF", to: "#123456", accent: "#654321" } };
  assert.equal(workSchema.parse(work).year, "早期");
  assert.equal(workSchema.parse({ ...work, year: 2026 }).year, "2026");
  assert.equal(workSchema.parse(work).cover.from, "#abcdef");
  for (const patch of [{ order: -1 }, { order: 0.5 }, { stack: [] }, { stack: [""] }, { cover: { ...work.cover, from: "bad" } }]) {
    assert.equal(workSchema.safeParse({ ...work, ...patch }).success, false);
  }
});
