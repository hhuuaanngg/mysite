export type ProjectCover = {
  mark: string;
  from: string;
  to: string;
  accent: string;
};

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
  order: number;
  cover: ProjectCover;
};
