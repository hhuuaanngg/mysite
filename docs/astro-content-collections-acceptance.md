# Astro 内容集合与 Markdown 迁移验收

日期：2026-09-11。分支：`codex/astro7-rebuild`。框架：Astro 7.3.2；官方 Unified 处理器：`@astrojs/markdown-remark` 7.3.1。

## 实际接入

- `src/content.config.ts` 使用 `defineCollection` 与 `glob` 读取原有文章、作品目录。
- `src/lib/content-schemas.ts` 集中校验 frontmatter；列表类型来自集合，不再手写两套类型。
- 首页、详情路径和站点地图都从 `getCollection()` 获取内容。
- 详情页调用 `render(entry)`，通过 `<Content />` 输出原生 Markdown；标题列表由同一次渲染提供，不再另行解析正文生成目录。
- 使用 Astro 7 官方 Unified 处理器及构建期插件，保留旧标题锚点、图片说明、表格横向滚动、链接行为和作品标题样式；禁用自动标点替换以保持原文。
- 开启 Shiki 代码高亮，保留原浅色卡片背景。删除 React Markdown 正文组件及项目直接依赖的 `react-markdown`、`remark-parse`、`remark-gfm`、`unified`。Astro 的官方处理器仍间接使用 Unified 生态依赖。
- 原稿、图片、地址、文章日期顺序、作品精选及排序、封面回退规则、两组独立分页与工坊发布选择规则保持兼容。

MDX 未接入。工坊编辑框右侧仍是原轻量 Markdown 即时预览器，站点「打开预览」使用本次原生渲染。没有对本站进行云端发布。

## 验证

- `npm run check`：0 错误、0 警告；仅保留原复制邮箱降级逻辑的 `execCommand` 弃用提示。
- `npm run lint`：通过。
- `npm test`：46 项通过，含所有现存文章/作品的 schema 兼容、非法日期/字段、原生目录、中文及重复标题、围栏代码、图片说明、表格、链接、原始 HTML 转义和代码高亮。
- `npm run test:publishing`：真实构建同时覆盖文章与作品；选中草稿可以导出，未选修改沿用旧版，新草稿及其图片不进入产物。无效日期会被内容集合拒绝，构建不成功。
- `npm run test:preview`：工坊存储函数新建/修改文章和作品后，运行中的 Astro 预览立即读取新内容；作品重命名及文章/作品删除后，旧路径返回 404；同时构建不会覆盖 React 开发缓存。
- `npm run build`：生成当前已发布快照到 `out/`。
- `npm run test:e2e`：静态产物上桌面/手机共 12 项通过，覆盖首页三个交互区、独立分页、直接文章锚点、目录链接、表格/照片正文、元数据及 404。

## Docker 实际页面验收

重新构建并更新 `mysite-local-studio-1`，网站/工坊仍使用 5780/5781。浏览器保持作品第 2 页、文章第 2 页时，在容器内执行真实的 `npm run build`；完成后切换页签，两者仍各自显示第 2 页。再次刷新后首页作品/文章、联系均可见，三个交互组件完成加载。

`SITE_TEST_ORIGIN=http://127.0.0.1:5780 npm run test:e2e`：12 项通过。实际应用内浏览器也检查了原生作品正文、表格与目录链接，未发现浏览器错误。

## 视觉对比

在相同浏览器、字体和视口下，对比迁移前 Docker 预览与迁移后本地预览：桌面首页、文章列表、作品详情、相册文章，以及手机首页、文章列表、作品长文、相册文章，共 9 组截图。其中 8 组尺寸一致，在 pixelmatch 阈值 0.15 下均为 0 个差异像素。手机作品长文另修复了迁移前就存在的宽表格撑开整页问题：390px 视口下，页面原本扩张到 596px，现在保持 390px，表格在正文内部滚动。浏览器测试改为对照真实视口宽度，避免移动浏览器自动扩大布局视口掩盖问题。这是所列页面的抽样对比，不代表所有未来 Markdown 内容都逐像素相同；新增代码高亮属于预期改进。

数据：[visual-comparison.json](qa/astro-content/visual-comparison.json)。示例：[手机作品正文](qa/astro-content/mobile-work.png)、[手机相册正文](qa/astro-content/mobile-gallery.png)。

## 后续修正：详情链接的末尾斜杠

用户实际点击文章卡片时发现 Astro 的 `trailingSlash: "always"` 提示页。原测试直接打开带斜杠的详情地址，遗漏了卡片和文章翻篇链接本身。已为 ArticleCard、WorkCard、ArticlePager 的详情链接补齐 `/`，保留原 URL 规则。新增测试实际点击首页文章、上一篇/下一篇和作品卡片，检查最终地址与正文。静态产物与更新后的 Docker 预览分别通过桌面/手机共 14 项浏览器测试。容器内运行发布构建后再次验证，并在应用内浏览器实际从首页点击 Goldencoast：进入带 `/` 的地址，标题与 5 张照片正常显示。
