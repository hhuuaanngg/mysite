export const site = {
  name: "Joey Huang",
  shortName: "hjy",
  title: "独立开发者",
  tagline: "做桌面工具、个人站点与全栈小产品。",
  description:
    "Joey Huang 的个人作品集。独立开发者，做桌面工具、个人站点与全栈小产品。",
  url: "https://hjy.me",
  locale: "zh-CN",
  email: "hhuuaanngg2020@gmail.com",
  github: {
    label: "GitHub",
    href: "https://github.com/hhuuaanngg",
  },
  blog: {
    label: "博客",
    href: "https://blog.hjy.me",
  },
  about: [
    "我更愿意把时间花在能反复用的工具上：配置要看得见、状态要说得清、部署要自己跑得通。",
    "技术栈以 TypeScript 为主，桌面端用 Tauri，站点用 Next.js。博客写在 blog.hjy.me，这里只放作品。",
  ],
} as const;

export const nav = [
  { href: "/#work", label: "作品" },
  { href: "/#about", label: "关于" },
  { href: site.blog.href, label: "博客", external: true },
  { href: "/#contact", label: "联系" },
] as const;

export const capabilities = [
  {
    id: "01",
    title: "桌面客户端",
    body: "把散落在配置文件和命令行里的操作收成窗口：表单编辑、进程启停、托盘与开机启动。",
    tags: ["Tauri", "Rust", "系统托盘"],
  },
  {
    id: "02",
    title: "Web 全栈",
    body: "用 TypeScript 把界面和逻辑写在同一套类型里。适合工具站、控制台和需要长期改的个人产品。",
    tags: ["Next.js", "React", "TypeScript"],
  },
  {
    id: "03",
    title: "站点与内容",
    body: "从 Markdown 到域名：静态生成、评论、导入旧文、自己托管。博客与作品集分开，各做一件事。",
    tags: ["Markdown", "静态导出", "GitHub Pages"],
  },
] as const;
