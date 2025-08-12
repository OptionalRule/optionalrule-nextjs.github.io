export interface Post {
  slug: string;
  title: string;
  date: string;
  excerpt?: string;
  tags: string[];
  featured_image?: string;
  content: string;
  readingTime: number;
}

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  excerpt?: string;
  tags: string[];
  featured_image?: string;
  readingTime: number;
}

export interface Page {
  slug: string;
  title: string;
  description?: string;
  content: string;
}

export interface PostFrontmatter {
  title: string;
  date: string;
  excerpt?: string;
  tags: string[];
  featured_image?: string;
  slug?: string;
  draft?: boolean;
}

export interface PageFrontmatter {
  title: string;
  description?: string;
  draft?: boolean;
}

export interface PaginatedPosts {
  posts: PostMeta[];
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface TagPage extends PaginatedPosts {
  tag: string;
}