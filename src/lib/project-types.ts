export type ProjectCover = {
  mark: string;
  from: string;
  to: string;
  accent: string;
  image?: string;
};

export type Project = {
  slug: string;
  title: string;
  year: string;
  summary: string;
  stack: string[];
  repo?: string;
  url?: string;
  featured?: boolean;
  order: number;
  cover: ProjectCover;
};

export type ProjectDocument = Project & {
  content: string;
};
