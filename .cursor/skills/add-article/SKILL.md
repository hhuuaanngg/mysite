---
name: add-article
description: Add or edit a site article in the local visual studio or with new:article. Use when the user wants to publish, create, or import a blog post, photography post, or Markdown article.
---

# 新增文章

优先让用户用本机可视化「内容工坊」，不要改 TypeScript / 组件。

1. 确认 `npm run dev` 在跑（会同时启动工坊）
2. 打开 http://127.0.0.1:5681#articles 或站点导航里的「写内容」
3. 填标题、slug、分类、摘要，拖入封面和相册，点「保存到仓库」
4. 预览 http://127.0.0.1:5680/articles/<slug>/
5. 提交 git 即发布。不要从工坊里执行 git 推送，除非用户明确要求。

命令行备选：

```bash
npm run new:article -- --title "标题" --slug english-slug --category 摄影 --summary "一两句" --images /path/to/photos
```

中文标题必须带 `--slug`。不要手写 JSON 块，不要为了发文去改 `src/lib` 或 `src/app`。
