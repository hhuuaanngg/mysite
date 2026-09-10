# mysite

Joey Huang 的个人站点。浅色 Notion 卡通风，格子纸背景。

页面结构：作品、文章、关于、联系。项目详情在 `/work/[slug]`，文章详情在 `/articles/[slug]`。

## 本地运行

```bash
npm install
npm run dev
```

打开 [http://127.0.0.1:5680](http://127.0.0.1:5680)。导航里会出现 **写内容**，进入本机工坊（[http://127.0.0.1:5681](http://127.0.0.1:5681)）。文章和作品都在这里可视化新建、编辑。

站点不用 3000 / 3100，工坊不用 8787 / 4310，避免和本机其它服务抢端口。改端口：`SITE_PORT=5700 STUDIO_PORT=5701 npm run dev`。

## 构建

静态导出到 `out/`：

```bash
npm run build
```

## 新增 / 编辑文章

本机可视化：打开工坊 → 填标题、slug、摘要 → 拖封面和相册 → 用工具栏写正文（左原文、右预览）→ **保存到仓库**。会生成：

- `src/content/articles/<slug>.md`
- `public/articles/<slug>.jpg`
- `public/articles/gallery/<slug>/01.jpg` …

站点预览：`http://127.0.0.1:5680/articles/<slug>/`。确认无误后提交 git，部署即发布。工坊只监听 `127.0.0.1`，不会出现在线上站点。

也可以继续用命令：

```bash
npm run new:article -- --title "青岛" --slug qingdao-2026 --category 摄影 --summary "海边走了一圈。" --images ~/Pictures/qingdao
```

或把草稿丢进文件夹再导入：

```
drafts/qingdao-2026/article.md
drafts/qingdao-2026/cover.jpg
drafts/qingdao-2026/*.jpg
```

```bash
npm run new:article -- --from drafts/qingdao-2026
```

中文标题必须给英文 slug。`drafts/` 已忽略，不会进 git。

## 新增 / 编辑作品

本机可视化：工坊切到 **作品**（[http://127.0.0.1:5681/#works](http://127.0.0.1:5681/#works)）→ 填标题、年份、摘要、技术栈 → 用工具栏写 Markdown 正文（左原文、右预览）→ 调封面色块 → **保存到仓库**。会生成：

- `src/content/works/<slug>.md`
- 正文里的图：`public/works/gallery/<slug>/01.jpg` …

站点预览：`http://127.0.0.1:5680/work/<slug>/`。确认无误后提交 git，部署即发布。

中文标题必须给英文 slug。封面仍是色块+字母；正文可以插图。

## 改其它内容

- 姓名、社交账号：`src/content/site.ts`
