export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export interface PostAuthor {
  name: string;
  url?: string;
  twitter?: string;
}

export interface PostImage {
  path: string;
  lqip?: string;
  alt?: string;
}

export interface PostItem {
  slug: string;
  url: string;
  title: string;
  date: string;
  updated?: string;
  author: PostAuthor;
  categories: string[];
  tags: string[];
  pin: boolean;
  math: boolean;
  mermaid: boolean;
  image?: PostImage;
  description: string;
  excerpt: string;
  toc: TocItem[];
  hasToc: boolean;
  readingTime: {
    words: number;
    minutes: number;
  };
  html: string;
}

export interface CategorySubItem {
  name: string;
  count: number;
  posts: string[];
}

export interface CategoryItem {
  name: string;
  count: number;
  posts: string[];
  children: Record<string, CategorySubItem>;
}

export interface TagItem {
  name: string;
  count: number;
  posts: string[];
}

export interface ArchiveYear {
  year: string;
  posts: Array<{
    slug: string;
    title: string;
    date: string;
    url: string;
  }>;
}

export interface TabItem {
  title: string;
  icon?: string;
  order?: number;
  html?: string;
}

export interface SearchItem {
  id: string;
  title: string;
  snippet: string;
  content: string;
  categories: string[];
  tags: string[];
  url: string;
  date: string;
}

export interface SiteConfig {
  title: string;
  tagline: string;
  description: string;
  url: string;
  lang: string;
  timezone: string;
  avatar: string;
  cdn: string;
  theme_mode: string;
  toc: boolean;
  github?: { username: string };
  twitter?: { username: string };
  social?: {
    name: string;
    email: string;
    fediverse_handle?: string;
    links?: string[];
  };
  contact?: Array<{ type: string; icon: string; url?: string; noblank?: boolean }>;
  share?: { platforms: Array<{ type: string; icon: string; link: string }> };
  authors?: Record<string, { name: string; twitter?: string; url?: string }>;
  locales?: Record<string, any>;
}
