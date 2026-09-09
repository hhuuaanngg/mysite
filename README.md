# mysite

Joey Huang 的个人站点。浅色 Notion 卡通风，格子纸背景。

页面结构：作品、文章、关于、联系。项目详情在 `/work/[slug]`，文章详情在 `/articles/[slug]`。

## 本地运行

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

## 构建

静态导出到 `out/`：

```bash
npm run build
```

## 改内容

- 姓名、社交账号：`src/content/site.ts`
- 作品：`src/content/projects.ts`
- 文章：在 `src/content/articles/` 新增一个 Markdown 文件，文件名即 slug。例如 `src/content/articles/my-post.md` 对应 `/articles/my-post/`。

```markdown
---
title: 标题
date: "2026-09-09"
category: 摄影
summary: 卡片上的一两句摘要。
cover: /articles/my-post.jpg
---

正文用 Markdown 写。

![图注](/articles/gallery/my-post/01.jpg)

> 引用

- 列表也可以
```

封面图放到 `public/articles/`，正文图片放到 `public/articles/gallery/<slug>/`。文章按 `date` 从新到旧排列。
