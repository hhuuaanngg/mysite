# Astro 7 迁移验收

日期：2026-09-11。工作分支：`codex/astro7-rebuild`。

## 交付缺陷修复：生成网站后首页交互区块消失

初验遗漏了“预览服务运行时构建，再刷新预览”的场景。Docker 的 22 个 HTTP 200 不能证明客户端区块正常。用户报告后，已在用户实际使用的 5780 内置浏览器页面复现：SiteHeader、Showcase、Contact 的内容全部为空，控制台报 `_jsxDEV is not a function`。

根因是发布构建通过符号链接共享 `node_modules`，Vite 默认缓存也位于此目录。生产构建覆盖开发依赖缓存后，预览页面取到生产版 `react/jsx-dev-runtime`，其中 `jsxDEV` 为 `undefined`，React 接管页面时清空了三个区块。另发现临时快照中的配置文件会触发预览重启。

修复将 Vite 缓存移至每个工作目录独立的 `.astro/vite/development` 或 `.astro/vite/production`，并让开发监听忽略 `.studio` 和 `out`。新增 `test:preview` 真正运行预览和发布构建，断言构建前后开发运行时完全相同；新增三个交互区块完成加载后仍可见的浏览器测试。浏览器测试可通过 `SITE_TEST_ORIGIN` 指向实际 Docker 入口。

后续验收必须包含构建完成后的实际页面交互，不能仅依据构建成功、HTTP 状态或构建前的截图。

本次修复后已在用户当前内置浏览器中验证：作品、文章都切到第 2 页 → Docker 内执行 `npm run build` → 生成后两个列表仍保留各自第 2 页，三个交互区块仍有内容 → 刷新后导航、作品/文章和联系区块继续正常显示。随后针对实际 `http://127.0.0.1:5780` 运行桌面和手机浏览器测试，10 项全部通过；`test:preview` 的并行预览/构建回归、类型检查和 lint 也通过。

## 交付范围

- Astro 7.3.2、官方 React 6.0.5 集成、React 19.2.8、Tailwind CSS 4。
- 首页、12 篇文章、9 个作品详情、404、robots、sitemap 和图标迁移为 Astro 路由，详情地址与末尾斜杠保持一致。
- 全局样式原样移动至 `src/styles/globals.css`。Nunito / Geist Mono 使用迁移前相同字体文件和 fallback metrics，连同 OFL 授权文件保存在 `src/assets/fonts`。
- 静态 JSX 由 Astro 在构建时输出；仅导航、Showcase、联系方式加载交互代码。Next.js 依赖和专属页面入口已移除。
- 两个列表始终挂载，通过 `hidden` 切换可见性；作品页码和文章页码分别保存在各自列表组件中。本文的分页保留指当前页面内切换标签，不扩展为刷新或跨页面持久化。
- Markdown 文件格式、工坊保存规则、图片路径和原始内容保留。内容加载使用 Vite 跟踪的 raw Markdown imports，保存、新增、删除均可更新本地预览；保留原有字段校验和 Markdown 渲染规则。
- 发布器在选定内容快照内执行 Astro 构建，产物仍为 `out/`；服务器上传、版本切换、恢复逻辑保留。
- 本地开发与静态预览使用受管的 Astro JavaScript API，避免 Astro 7 在代理环境下自动转入后台导致工坊关闭或测试服务失去管理。这一 API 在官方类型中标记 experimental，项目固定 Astro 版本，升级时应重新验证启动、停止与工坊预览。

## 验证结果

| 验证 | 结果 |
| --- | --- |
| `npm run check` | 0 errors，0 warnings；原复制按钮保留一个 `execCommand` 兼容分支的弃用提示 |
| `npm run lint` | 通过 |
| `npm test` | 原有 43 项测试全部通过 |
| `npm run test:publishing` | 真实 Astro 隔离构建通过；已发布正文保留，选中稿件生成，未选稿件及其内容/图片不进入 HTML、JS、sitemap 或其它文本产物 |
| `npm run build` | 通过，沿用工坊的快照生成流程输出 `out/` |
| `npm run test:e2e` | 桌面 / 手机合计 8 项通过 |
| 工坊预览刷新 | 临时项目中通过工坊保存函数新建、修改文章，删除文件后返回 404；测试后清理临时目录 |
| Docker | 已重新构建并启动，容器中的 Astro 实测版本为 7.3.2；站点地图中的 22 个页面均返回 HTTP 200，工坊和健康接口正常；Linux 容器内真实隔离构建测试也通过 |
| `git diff --check` | 通过 |

浏览器测试验证了：作品切至第 2 页 → 文章切至第 2 页 → 反复切换三个来回后，两者仍显示各自第 2 页及原列表内容；文章单独退回第 1 页后，作品仍为第 2 页。另覆盖键盘切换、直接进入 `/#articles`、重复导航、手机菜单关闭、目录目标、图片加载、详情返回、元数据、图标和 404。

## 外观对比

使用相同 Chrome、字体文件、视口和减少动画设置，比较迁移前后的全页 PNG。开发环境六组截图尺寸全部一致。pixelmatch 阈值为 0.15；差异比例是该条件下的像素比较结果，不表示所有浏览器均经过逐像素验收。

| 页面 | 不同像素比例 |
| --- | ---: |
| 桌面首页 | 0.024% |
| 桌面文章标签 | 0.031% |
| frpc-editor 详情 | 0.000% |
| 工业制造文章 | 0.000% |
| 手机首页 | 0.071% |
| 手机文章标签 | 0.087% |

首页关于段落中的“站点用 Next.js”已按实际技术栈更新为“站点用 Astro”，其余布局与样式保持原有设计。生产版不显示本地“写内容”入口。

- [迁移前桌面首页](qa/astro7/before-home.png)
- [迁移后桌面首页](qa/astro7/after-home.png)
- [迁移前手机文章](qa/astro7/before-mobile-articles.png)
- [迁移后手机文章](qa/astro7/after-mobile-articles.png)
- [对比数据](qa/astro7/visual-comparison.json)

## 使用与工作区说明

- Docker 预览：<http://127.0.0.1:5780>；内容工坊：<http://127.0.0.1:5781>。
- 普通开发预览：<http://127.0.0.1:5680>；内容工坊：<http://127.0.0.1:5681>。
- 正式生成继续使用工坊或 `npm run build`。不要直接执行 `astro build` 发布整个草稿目录。
- 云端 Nginx 的静态缓存路径示例已由 `/_next/static/` 更新为 `/_astro/`，见本地发布指南。此次没有执行云端发布。
- 新分支基于当前工作区创建，原本未提交的内容工坊/发布修改完整保留，并与 Astro 迁移分别保存为提交；迁移前源码副本在本机 `/tmp/mysite-before-astro7-20260911`，是临时恢复辅助，不代替 Git 历史或正式备份。

框架依据：[Astro 7 发布说明](https://astro.build/blog/astro-7/)、[React 集成](https://docs.astro.build/en/guides/integrations-guide/react/)、[样式接入](https://docs.astro.build/en/guides/styling/)。
