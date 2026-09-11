import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { articleSchema, workSchema } from "./lib/content-schemas";

const articles = defineCollection({
  loader: glob({
    pattern: "*.md",
    base: "./src/content/articles",
    // Article URLs have always followed the filename, including its case.
    generateId: ({ entry }) => entry.slice(0, -3),
  }),
  schema: articleSchema,
});

const works = defineCollection({
  loader: glob({
    pattern: "*.md",
    base: "./src/content/works",
    generateId: ({ entry, data }) => String(data.slug ?? entry.slice(0, -3)).trim(),
  }),
  schema: workSchema,
});

export const collections = { articles, works };
