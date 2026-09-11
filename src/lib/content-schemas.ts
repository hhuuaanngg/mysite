import { z } from "astro/zod";

const text = z.string().trim().min(1, "不能为空");
const optionalText = z.string().trim().optional();
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, "必须是 #RRGGBB 颜色").transform((value) => value.toLowerCase());
const date = z.union([z.string(), z.date()])
  .transform((value) => value instanceof Date ? value.toISOString().slice(0, 10) : value.trim())
  .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(value))
    && new Date(value).toISOString().slice(0, 10) === value, "必须是有效日期（YYYY-MM-DD）");

export const articleSchema = z.object({
  title: text,
  date,
  category: text,
  summary: text,
  cover: z.string().trim().default(""),
});

export const workSchema = z.object({
  slug: text.optional(),
  title: text,
  year: z.union([text, z.number()]).transform(String),
  order: z.number().int().nonnegative(),
  summary: text,
  stack: z.array(text).min(1, "至少填写一项技术栈"),
  featured: z.boolean().default(false),
  repo: optionalText,
  url: optionalText,
  cover: z.object({
    mark: z.union([text, z.number()]).transform(String),
    from: color,
    to: color,
    accent: color,
    image: optionalText,
  }),
});
