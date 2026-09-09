---
name: add-article
description: Add a new site article using the local new:article command. Use when the user wants to publish, create, or import a blog post, photography post, or Markdown article.
---

# 新增文章

不要改 TypeScript、组件或 JSON。不要手写 `article-blocks.json`。用仓库里的命令一次生成文件。

```bash
npm run new:article -- --title "标题" --slug english-slug --category 摄影 --summary "一两句" --images /path/to/photos
```

中文标题必须带 `--slug`。

若用户给了草稿目录（里面有 `article.md`、`cover.jpg`、其它图片）：

```bash
npm run new:article -- --from /path/to/draft-folder
```

生成后只允许改 `src/content/articles/<slug>.md` 的正文。不要为了发文去改 `src/lib`、`src/components` 或 `src/app`。

没有图片时加 `--allow-empty`，并告诉用户封面路径。

跑完打印预览地址 `http://localhost:3000/articles/<slug>/`，不要反复追问格式。
