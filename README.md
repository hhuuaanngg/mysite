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

## 新增文章

不要改 TypeScript，也不用找 AI 来回改渲染。一条命令生成 Markdown、封面和相册：

```bash
npm run new:article -- --title "青岛" --slug qingdao-2026 --category 摄影 --summary "海边走了一圈。" --images ~/Pictures/qingdao
```

只输入命令、按提示填，也可以：

```bash
npm run new:article
```

**更快：丢一个草稿文件夹**

```
drafts/qingdao-2026/
  article.md     # 标题、分类、摘要、正文
  cover.jpg      # 封面（不会进正文相册）
  01.jpg
  02.jpg
```

```bash
npm run new:article -- --from drafts/qingdao-2026
```

`article.md` 示例：

```markdown
---
title: 青岛
category: 摄影
summary: 海边走了一圈。
---

风很大，水很亮。
```

中文标题必须给 `--slug`（英文短名）。图片会拷到 `public/articles/`，正文写在 `src/content/articles/<slug>.md`。保存后刷新 `http://localhost:3000/articles/<slug>/`。

封面单独指定：`--cover ~/Pictures/cover.jpg`。暂时没图：`--allow-empty`。

## 改其它内容

- 姓名、社交账号：`src/content/site.ts`
- 作品：`src/content/projects.ts`
