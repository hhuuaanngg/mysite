export const site = {
  name: "Joey Huang",
  shortName: "hjy",
  title: "独立开发者",
  tagline: "做桌面工具、个人站点与全栈小产品。",
  description:
    "Joey Huang 的个人站点。作品、文章、关于与社交媒体。",
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
    "技术栈以 TypeScript 为主，桌面端用 Tauri，站点用 Next.js。作品和文章都放在这个站，长文仍在 blog.hjy.me。",
  ],
} as const;

export const nav = [
  { href: "/#work", label: "作品" },
  { href: "/#articles", label: "文章" },
  { href: "/#about", label: "关于" },
  { href: "/#contact", label: "联系" },
] as const;

export const socials = [
  {
    id: "github",
    label: "GitHub",
    handle: "hhuuaanngg",
    href: "https://github.com/hhuuaanngg",
    description: "仓库、代码，和正在做的东西。",
    tint: "#fde8d8",
    icon: "github",
  },
  {
    id: "blog",
    label: "博客",
    handle: "blog.hjy.me",
    href: "https://blog.hjy.me",
    description: "文章全文写在这边，按日期翻。",
    tint: "#d8f3ea",
    icon: "blog",
  },
  {
    id: "email",
    label: "Email",
    handle: "hhuuaanngg2020@gmail.com",
    href: "mailto:hhuuaanngg2020@gmail.com",
    description: "有事直接写信，比表单快。",
    tint: "#fff4b8",
    icon: "email",
    copy: true,
  },
] as const;
