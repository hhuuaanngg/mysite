# mysite

Joey Huang 的个人作品集。深色极简，中文正文，项目详情写在 `/work/[slug]`。

博客仍在 [blog.hjy.me](https://blog.hjy.me)，本仓库只做主站。

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

改姓名、邮箱、项目列表：编辑 `src/content/site.ts` 与 `src/content/projects.ts`。
