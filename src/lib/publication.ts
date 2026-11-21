import fs from 'fs';
import matter from 'gray-matter';

export const INCLUDE_DRAFTS_ENV = 'INCLUDE_DRAFTS';

type Env = Record<string, string | undefined>;

export interface PublicationFrontmatter {
  draft?: unknown;
}

export function shouldIncludeDrafts(env: Env = process.env): boolean {
  return env[INCLUDE_DRAFTS_ENV] === 'true' && env.NODE_ENV !== 'production';
}

export function isPublished(
  frontmatter: PublicationFrontmatter,
  includeDrafts: boolean = shouldIncludeDrafts(),
): boolean {
  return includeDrafts || frontmatter.draft !== true;
}

export function isPublishedFile(
  filePath: string,
  includeDrafts: boolean = shouldIncludeDrafts(),
): boolean {
  try {
    const { data } = matter(fs.readFileSync(filePath, 'utf8'));
    return isPublished(data as PublicationFrontmatter, includeDrafts);
  } catch (error) {
    console.warn(`Warning: could not read ${filePath}; treating it as not published:`, error);
    return false;
  }
}
