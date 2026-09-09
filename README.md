# mysite

Joey Huang 的个人站点。浅色 Notion 卡通风，格子纸背景。

页面结构：作品、文章、关于、联系。项目详情在 `/work/[slug]`，文章全文外链到 [blog.hjy.me](https://blog.hjy.me)。

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

改姓名、社交账号、项目和文章列表：编辑 `src/content/site.ts`、`src/content/projects.ts` 与 `src/content/articles.ts`。
