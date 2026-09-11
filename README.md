# mysite

Joey Huang 的个人站点。浅色 Notion 卡通风，格子纸背景。

使用 **Astro 7.3.2 + React 19 + Tailwind CSS 4**。Astro 生成静态页面；导航、作品/文章切换与联系方式作为 React 交互组件加载。作品和文章列表切换时持续挂载，各自保留分页状态。

页面结构：作品、文章、关于、联系。项目详情在 `/work/[slug]`，文章详情在 `/articles/[slug]`。

## 推荐使用：本地 Docker 写作和发布

```bash
docker compose up -d --build --wait
```

- 内容工坊：<http://127.0.0.1:5781>
- 本地预览：<http://127.0.0.1:5780>
- 发布与备份：<http://127.0.0.1:5781/#publishing>

日常操作：**写文章 → 保存草稿 → 打开预览 → 发布与备份 → 勾选这次要上线的草稿 → 发布到云端**。

首次需要在网页中填写 Linux 服务器设置、导入专用 SSH 私钥和已核验的 known_hosts，并测试连接。没有服务器也能点「仅生成网站」下载静态网页包。生成成功不代表云端发布成功。

原稿、图片和 `.studio` 历史直接挂载在电脑项目目录中，重建容器不会删除它们。端口只绑定本机；Docker 使用 5780 / 5781，与普通开发预览 5680 / 5681 分开。

**保存不会自动上线。未选中的新草稿及图片不会导出；已上线文章的未选修改会继续使用上次发布的正文和图片。** 删除/重命名也需要在发布清单中选中才会影响线上。首次启用时，项目原有内容作为初始版本；之后新增、修改的内容才显示为草稿。

完整说明（含服务器准备、备份恢复和故障处理）：[本地写作与发布指南](docs/local-publishing.md)。

## 本地运行

需要 Node.js 22.12 或更高版本。

```bash
npm install
npm run dev
```

打开 [http://127.0.0.1:5680](http://127.0.0.1:5680)。导航里会出现 **写内容**，进入本机工坊（[http://127.0.0.1:5681](http://127.0.0.1:5681)）。文章和作品都在这里可视化新建、编辑。

站点不用 3000 / 3100，工坊不用 8787 / 4310，避免和本机其它服务抢端口。改端口：`SITE_PORT=5700 STUDIO_PORT=5701 npm run dev`。

## 构建

生成已发布内容到 `out/`（初次为项目原有内容；新草稿需在工坊勾选生成）：

```bash
npm run build
```

`npm start` 预览生成的静态网站，默认端口 5680；已有开发服务时可以使用 `npm start -- --port 5692`。正式部署继续使用内容工坊的发布流程。

## 验证

```bash
npm run check
npm run lint
npm test
npm run test:publishing
npm run test:preview
npm run build
npx playwright install chromium
npm run test:e2e
```

`test:publishing` 使用临时内容执行真正的 Astro 构建，检查文章和作品的已发布正文、选中草稿与未选中草稿的隔离，并验证非法日期会阻止构建。浏览器测试使用 5690 端口，覆盖桌面和手机的独立分页保留、锚点导航、详情目录、图片、元数据和 404。

`test:preview` 先验证工坊新建、修改、重命名和删除内容能被内容集合立即读取，再在预览服务运行期间执行发布构建，检查构建不会覆盖预览的 React 依赖缓存。Docker 更新后，还需运行 `SITE_TEST_ORIGIN=http://127.0.0.1:5780 npm run test:e2e` 检查实际运行页面，并在工坊生成网站后再次验证。

迁移说明与验收记录：[Astro 7 迁移验收](docs/astro7-migration-acceptance.md)。

## Astro 内容层

文章和作品现在使用 **Content Collections + 原生 Markdown 渲染**：`src/content.config.ts` 定义两个集合，`getCollection()` 查询内容，详情页用 `render()` / `<Content />` 输出正文。字段校验和列表类型来自同一份 schema。

现有 Markdown、图片目录和工坊操作方式保持不变。标题、分类、摘要等必填项缺失，文章日期无效，或作品排序、技术栈、配色不合法时，构建会指出有问题的文件和字段。年份仍支持“早期”等文字。

正文支持标题与目录、图片说明、表格、任务列表，以及带语言名称的代码块高亮，例如三个反引号后填写 `ts`、`js`、`bash` 或 `toml`。高亮在构建时完成，访客不需要加载 Markdown 解析器。目录直接取自 Astro 渲染结果；原有标题锚点继续有效。

使用 Astro 7 官方 Unified 处理器，以保留现有排版和锚点插件。未接入 MDX；普通文章继续写 `.md` 即可。工坊右侧的即时编辑预览仍使用原来的轻量预览器，最终站点排版和高亮请以「打开预览」为准。

实施与验证：[Astro 内容集合验收](docs/astro-content-collections-acceptance.md)。

## 新增 / 编辑文章

本机可视化：打开工坊 → 填标题、slug、摘要 → 拖封面和相册 → 用工具栏写正文（左原文、右预览）→ **保存草稿**。会生成：

- `src/content/articles/<slug>.md`
- `public/articles/<slug>.jpg`
- `public/articles/gallery/<slug>/01.jpg` …

站点预览：`http://127.0.0.1:5680/articles/<slug>/`（Docker 为 5780）。确认无误后，到「发布与备份」选择这篇草稿，生成或发布。工坊不会包含在线上静态网站里。

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

本机可视化：工坊切到 **作品**（[http://127.0.0.1:5681/#works](http://127.0.0.1:5681/#works)）→ 填标题、年份、摘要、技术栈 → 用工具栏写 Markdown 正文（左原文、右预览）→ 上传封面图或选一套色块 → **保存草稿**。会生成：

- `src/content/works/<slug>.md`
- 封面图（可选）：`public/works/<slug>.jpg`
- 正文里的图：`public/works/gallery/<slug>/01.jpg` …

站点预览：`http://127.0.0.1:5680/work/<slug>/`（Docker 为 5780）。确认无误后，到「发布与备份」选择这个作品再发布。

中文标题必须给英文 slug。封面可以上传图片；没有图时从固定配色里选一套色块。正文也可以插图。

## 改其它内容

- 姓名、社交账号：`src/content/site.ts`
