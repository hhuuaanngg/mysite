export type Project = {
  slug: string;
  title: string;
  year: string;
  summary: string;
  problem: string;
  solution: string;
  highlights: string[];
  stack: string[];
  repo?: string;
  url?: string;
  featured?: boolean;
  cover: {
    mark: string;
    from: string;
    to: string;
    accent: string;
  };
};

export const projects: Project[] = [
  {
    slug: "frpc-editor",
    title: "frpc-editor",
    year: "2026",
    featured: true,
    summary: "图形化编辑并运行 frpc.toml 的桌面客户端。",
    problem:
      "frp 客户端配置写在 TOML 里，代理类型多、字段分散。改错一行就要对照文档，命令行启停也缺少状态反馈。",
    solution:
      "用表单覆盖常用配置，同时保留 TOML 实时预览与校验；可选择本地 frpc 可执行文件，启动或停止进程，托盘里也能操作。",
    highlights: [
      "全局、认证、传输、日志与 Web 管理等常用配置用表单维护",
      "支持 tcp、udp、http、https、stcp、xtcp 等代理类型与 visitor",
      "Monaco 预览 TOML，解析失败会直接标出来",
      "启动、停止本地 frpc，显示运行状态和 PID",
      "系统托盘、开机启动编辑器，可选随后自动拉起 frpc",
    ],
    stack: [
      "Tauri 2",
      "React 19",
      "TypeScript",
      "Vite",
      "Tailwind CSS",
      "Zustand",
      "Monaco Editor",
    ],
    repo: "https://github.com/hhuuaanngg/remote-frpc3",
    cover: {
      mark: "fr",
      from: "#fde8d8",
      to: "#f7c9b4",
      accent: "#c4552a",
    },
  },
  {
    slug: "blog-hjy-me",
    title: "个人博客",
    year: "2026",
    summary: "以前的独立写作站，用 Markdown 生成页面。文章已经迁到这个站。",
    problem:
      "旧文散落在 WordPress 和静态页里，写作和部署不在同一条链路上，改主题或迁域名都要重做一遍。",
    solution:
      "用 Next.js App Router 读本地 Markdown，构建时生成页面；支持从 WordPress feed 导入，评论交给 Giscus。文章现已收进本站。",
    highlights: [
      "Markdown + front matter，文章和站点配置分开",
      "可从 WordPress feed 导入历史文章",
      "正文已迁入本站 /articles",
    ],
    stack: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Markdown"],
    repo: "https://github.com/hhuuaanngg/blog-hjy-me",
    cover: {
      mark: "hjy",
      from: "#d8f3ea",
      to: "#b7e4d4",
      accent: "#0f7b6c",
    },
  },
  {
    slug: "champiere",
    title: "Champiere",
    year: "2020",
    summary: "早期独立上线的站点，从页面到域名完整走通。",
    problem:
      "当时需要一块能公开访问的门面：有域名、有页面、改完能立刻看到，而不是停在本地预览。",
    solution:
      "用静态 HTML 搭站点并挂到 champiere.com。重点是上线闭环，而不是堆功能。",
    highlights: [
      "静态页面，托管在 GitHub Pages",
      "绑定独立域名 champiere.com",
    ],
    stack: ["HTML", "GitHub Pages"],
    url: "https://champiere.com",
    repo: "https://github.com/hhuuaanngg/Champiere",
    cover: {
      mark: "ch",
      from: "#fff3d6",
      to: "#ffe08a",
      accent: "#c19100",
    },
  },
  {
    slug: "damowang",
    title: "damowang.net",
    year: "2020",
    summary: "早期内容站，走过从写作到静态生成、域名托管的整条链路。",
    problem:
      "需要一个能长期放文章的地方：要有列表、归档和订阅，还要能自己改主题。",
    solution:
      "做成静态内容站并绑定 damowang.net，包含文章页、标签和 feed，后面的博客实践从这里开始。",
    highlights: [
      "文章、标签、订阅源等完整内容结构",
      "静态生成后绑定 damowang.net",
    ],
    stack: ["HTML", "静态站点"],
    url: "https://damowang.net",
    repo: "https://github.com/hhuuaanngg/damowang.net",
    cover: {
      mark: "dw",
      from: "#d6eaf8",
      to: "#b7d8f5",
      accent: "#2383e2",
    },
  },
  {
    slug: "net-assistant",
    title: "NetAssistant",
    year: "早期",
    summary: "面向本地调试的 UDP/TCP 助手，用来发报文、看回包。",
    problem:
      "调试网络程序时，临时写脚本发几个包太慢，通用抓包工具又重，只想要一个能指定协议、地址和载荷的小工具。",
    solution:
      "做了一个 UDP/TCP 网络调试助手，把发送、接收和基本会话放在同一个窗口里。",
    highlights: [
      "支持 UDP / TCP 收发",
      "面向本地联调，而不是替代 Wireshark",
    ],
    stack: ["网络调试", "UDP", "TCP"],
    repo: "https://github.com/hhuuaanngg/NetAssistant",
    cover: {
      mark: "na",
      from: "#e8f4d8",
      to: "#cfe8b4",
      accent: "#4d7c0f",
    },
  },
  {
    slug: "iplay-theme",
    title: "iplay",
    year: "2020",
    summary: "给技术站用的 WordPress 主题，先发了 alpha，挂在 iplay.codes。",
    problem:
      "技术站需要一个自己能改的主题：样式要可控，小改动不能每次求人。现成主题改起来反而更慢。",
    solution:
      "自己做了一套偏工具站的 WordPress 主题，两天出了 alpha，直接用在 iplay.codes 上看效果。",
    highlights: [
      "面向个人技术站，而不是杂志型博客",
      "样式自己写，改需求不用绕开别人的框架",
    ],
    stack: ["WordPress", "PHP", "CSS"],
    url: "http://iplay.codes",
    cover: {
      mark: "ip",
      from: "#efe4fb",
      to: "#d9c4f5",
      accent: "#7c3aed",
    },
  },
  {
    slug: "custom-html-code",
    title: "Custom HTML Code",
    year: "2013",
    summary: "把统计代码从主题文件里拆出来的 WordPress 插件。",
    problem:
      "统计代码写在主题里，一换主题就丢。流量不看也罢，过半年想翻一下却发现数据断了。",
    solution:
      "做了个很小的插件，专门存自定义 HTML / 统计代码，和主题脱钩。",
    highlights: [
      "统计代码与主题分离",
      "换主题不再丢追踪代码",
    ],
    stack: ["WordPress", "PHP"],
    repo: "https://github.com/hhuuaanngg/iplay-AnalyticsCodes",
    url: "http://iplay.codes/wp-plugin-ac/",
    cover: {
      mark: "ac",
      from: "#fde8d8",
      to: "#f5c9a8",
      accent: "#c2410c",
    },
  },
  {
    slug: "theme-2c",
    title: "主题 2C",
    year: "2013",
    summary: "基于 Twenty Twelve 的 WordPress 主题，给个人日志站用。",
    problem:
      "当时同时养两个站，需要一个够简单、加载快、自己还能改 logo 的主题。",
    solution:
      "在 Twenty Twelve 上收成一套个人日志主题，带社交挂件，后来两个站合并就只做维护。",
    highlights: [
      "基于 Twenty Twelve，结构简单",
      "带社交 Widget，适合个人日志",
    ],
    stack: ["WordPress", "PHP", "CSS"],
    cover: {
      mark: "2c",
      from: "#dbeafe",
      to: "#bfdbfe",
      accent: "#1d4ed8",
    },
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

export function getFeaturedProjects(): Project[] {
  return projects.filter((project) => project.featured);
}

export function getOtherProjects(): Project[] {
  return projects.filter((project) => !project.featured);
}

export function getProjectsInDisplayOrder(): Project[] {
  return [...getFeaturedProjects(), ...getOtherProjects()];
}
