---
title: "个人博客"
year: "2026"
order: 1
summary: "以前的独立写作站，用 Markdown 生成页面。文章已经迁到这个站。"
stack:
  - "Next.js"
  - "React"
  - "TypeScript"
  - "Tailwind CSS"
  - "Markdown"
repo: "https://github.com/hhuuaanngg/blog-hjy-me"
cover:
  mark: "hjy"
  from: "#d8f3ea"
  to: "#b7e4d4"
  accent: "#0f7b6c"
---

## 问题

旧文散落在 WordPress 和静态页里，写作和部署不在同一条链路上，改主题或迁域名都要重做一遍。

## 方案

用 Next.js App Router 读本地 Markdown，构建时生成页面；支持从 WordPress feed 导入，评论交给 Giscus。文章现已收进本站。

## 技术要点

- Markdown + front matter，文章和站点配置分开
- 可从 WordPress feed 导入历史文章
- 正文已迁入本站 /articles
