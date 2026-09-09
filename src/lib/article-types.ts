export type Article = {
  slug: string;
  title: string;
  date: string;
  category: string;
  summary: string;
  cover: string;
};

export type ArticleDocument = Article & {
  content: string;
};
