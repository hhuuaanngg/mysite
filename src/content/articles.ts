export type ArticleBlock =
  | { type: "p"; text: string }
  | { type: "quote"; text: string }
  | { type: "img"; src: string; alt: string };

export type Article = {
  slug: string;
  title: string;
  date: string;
  category: string;
  summary: string;
  cover: string;
};

export const articles: Article[] = [
  {
    slug: "goldencoast",
    title: "Goldencoast",
    date: "2026-01-28",
    category: "摄影",
    summary: "海边一组照片。沙、水和傍晚的光。",
    cover: "/articles/goldencoast.jpg",
  },
  {
    slug: "mayday-in-shanghai",
    title: "五月天上海",
    date: "2023-11-15",
    category: "摄影",
    summary: "上海的一场五月天。开场嘉宾，然后是整晚的合唱。",
    cover: "/articles/mayday-in-shanghai.jpg",
  },
  {
    slug: "behind-the-bustling",
    title: "繁华背后的岁月静好",
    date: "2023-10-30",
    category: "摄影",
    summary: "街道很吵的时候，角落里仍有一段段被定格的安静。",
    cover: "/articles/behind-the-bustling.jpg",
  },
  {
    slug: "food-and-love",
    title: "Food and Love",
    date: "2023-10-29",
    category: "摄影",
    summary: "唯有美食与爱不可辜负。",
    cover: "/articles/food-and-love.jpg",
  },
  {
    slug: "shanghai-2",
    title: "Shanghai",
    date: "2023-10-18",
    category: "生活",
    summary: "上海的一段日常，用照片记下路过的地方。",
    cover: "/articles/shanghai-2.jpg",
  },
  {
    slug: "cat-moon",
    title: "喵了个喵",
    date: "2023-04-05",
    category: "摄影",
    summary: "猫，和一点夜里的光。",
    cover: "/articles/cat-moon.jpg",
  },
  {
    slug: "would-you-like-a-piece-of-cake",
    title: "蛋糕来一块吗",
    date: "2023-04-01",
    category: "摄影",
    summary: "一块蛋糕，拍完再吃。",
    cover: "/articles/would-you-like-a-piece-of-cake.jpg",
  },
  {
    slug: "summer-beach-sunset",
    title: "夏日·海边·夕阳",
    date: "2022-09-26",
    category: "摄影",
    summary: "夏天的海边，太阳往下落的那一会儿。",
    cover: "/articles/summer-beach-sunset.jpg",
  },
  {
    slug: "mountain",
    title: "大山，深处。",
    date: "2021-07-02",
    category: "摄影",
    summary: "起雾了，快下雨了，那就快点起飞吧。云雾里看雨从天上落下。",
    cover: "/articles/mountain.jpg",
  },
  {
    slug: "wordpress-theme-iplay",
    title: "WordPress 主题 iplay 发布",
    date: "2020-04-14",
    category: "主题",
    summary: "想了几年，做了两天。给技术站用的主题，先发了个 alpha。",
    cover: "/articles/wordpress-theme-iplay.jpg",
  },
  {
    slug: "macbook-pro-16-open-box",
    title: "MacBook Pro 16 寸开箱照",
    date: "2020-03-15",
    category: "生活",
    summary: "换掉用了一年的 2012 款之后，拍了几张新电脑的开箱。",
    cover: "/articles/macbook-pro-16-open-box.jpg",
  },
  {
    slug: "manufacturing",
    title: "工业制造",
    date: "2020-03-05",
    category: "摄影",
    summary: "厂房、机器和还没离开的温度。",
    cover: "/articles/manufacturing.jpg",
  },
];

export function getArticles(): Article[] {
  return articles;
}

export function getArticle(slug: string): Article | undefined {
  return articles.find((article) => article.slug === slug);
}
