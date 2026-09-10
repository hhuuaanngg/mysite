---
name: add-work
description: Add or edit a portfolio project in the local visual studio. Use when the user wants to publish, create, or update a work / project on the site.
---

# 新增作品

优先让用户用本机可视化「内容工坊」的作品页，不要改 TypeScript / 组件，不要手写 `src/content/works` 以外的代码。

1. 确认 `npm run dev` 在跑（会同时启动工坊）
2. 打开 http://127.0.0.1:4310#works 或站点导航里的「写内容」，切到「作品」
3. 填标题、英文 slug、年份、摘要、技术栈，调封面字母和颜色
4. 用工具栏写 Markdown 正文（问题 / 方案 / 要点可当二级标题；可插图）
5. 点「保存到仓库」，生成 `src/content/works/<slug>.md`
6. 预览 http://127.0.0.1:3100/work/<slug>/
7. 提交 git 即发布。不要从工坊里执行 git 推送，除非用户明确要求。

中文标题必须给英文 slug。封面是色块+字母。勾选「精选」会成为首页大卡。
