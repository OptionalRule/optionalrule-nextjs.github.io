import path from "path";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { siteConfig } from "@/config/site";

const projectRoot = process.cwd();
const virtualFiles = new Map<string, string>();

const normalizePath = (target: string): string => {
  const absolute = path.isAbsolute(target) ? target : path.join(projectRoot, target);
  return path.normalize(absolute);
};

const listDirectoryEntries = (dir: string): string[] => {
  const normalizedDir = normalizePath(dir);
  const prefix = normalizedDir.endsWith(path.sep) ? normalizedDir : normalizedDir + path.sep;
  const entries = new Set<string>();

  for (const filePath of virtualFiles.keys()) {
    if (filePath.startsWith(prefix)) {
      const remainder = filePath.slice(prefix.length);
      const [entry] = remainder.split(path.sep);
      if (entry) {
        entries.add(entry);
      }
    }
  }

  return Array.from(entries);
};

type MockStats = {
  isFile: () => boolean;
  isDirectory: () => boolean;
};

vi.mock("fs", () => {
  const fsMock = {
    existsSync(target: string) {
      const normalized = normalizePath(target);
      return virtualFiles.has(normalized) || listDirectoryEntries(normalized).length > 0;
    },
    readdirSync(dir: string) {
      const entries = listDirectoryEntries(dir);
      if (!virtualFiles.has(normalizePath(dir)) && entries.length === 0) {
        throw new Error(`ENOENT: no such file or directory, scandir '${dir}'`);
      }
      return entries;
    },
    readFileSync(file: string) {
      const normalized = normalizePath(file);
      const content = virtualFiles.get(normalized);
      if (content === undefined) {
        throw new Error(`ENOENT: no such file or directory, open '${file}'`);
      }
      return content;
    },
    statSync(target: string): MockStats {
      const normalized = normalizePath(target);
      const isFile = virtualFiles.has(normalized);
      const isDirectory = !isFile && listDirectoryEntries(normalized).length > 0;

      if (!isFile && !isDirectory) {
        throw new Error(`ENOENT: no such file or directory, stat '${target}'`);
      }

      return {
        isFile: () => isFile,
        isDirectory: () => isDirectory,
      } satisfies MockStats;
    },
  };

  return {
    default: fsMock,
    ...fsMock,
  };
});

const writeVirtualFile = (relativePath: string, content: string) => {
  const absolute = normalizePath(relativePath);
  virtualFiles.set(absolute, content);
};

const markdownWithFrontmatter = (
  frontmatter: Record<string, unknown>,
  body: string,
): string => {
  const lines: string[] = ["---"];

  for (const [key, value] of Object.entries(frontmatter)) {
    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      lines.push(`${key}: ${JSON.stringify(value)}`);
      continue;
    }

    if (typeof value === "string") {
      lines.push(`${key}: "${value.replace(/"/g, '\\"')}"`);
      continue;
    }

    lines.push(`${key}: ${String(value)}`);
  }

  lines.push("---", body);
  return `${lines.join("\n")}\n`;
};

const seedPosts = () => {
  writeVirtualFile(
    path.join("content", "posts", "2024-01-12-custom-post.mdx"),
    markdownWithFrontmatter(
      {
        title: "Custom Post",
        date: "2024-01-12",
        excerpt: "Hand-written excerpt",
        tags: ["Guides", "How-To"],
        slug: "custom-slug",
      },
      "# Intro\nContent for the custom post.",
    ),
  );

  writeVirtualFile(
    path.join("content", "posts", "2024-01-11-draft-post.mdx"),
    markdownWithFrontmatter(
      {
        title: "Draft Post",
        date: "2024-01-11",
        draft: true,
      },
      "Draft content that should not ship.",
    ),
  );

  writeVirtualFile(
    path.join("content", "posts", "2024-01-10-first-post.mdx"),
    markdownWithFrontmatter(
      {
        title: "First Post",
        date: "2024-01-10",
        tags: ["News"],
      },
      "Introductory content for the first post.",
    ),
  );
};

const originalNodeEnv = process.env.NODE_ENV;

describe("Content and feed integration", () => {
  beforeEach(() => {
    virtualFiles.clear();
    vi.resetModules();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("filters drafts in production while preserving post metadata", async () => {
    seedPosts();
    process.env.NODE_ENV = "production";

    const { getAllPostsMeta, getPaginatedPosts } = await import("@/lib/content");

    const published = getAllPostsMeta();
    expect(published.map((post) => post.title)).toEqual(["Custom Post", "First Post"]);
    expect(published.every((post) => post.title !== "Draft Post")).toBe(true);
    expect(published[0].slug).toBe("custom-slug");
    expect(published[0].excerpt).toBe("Hand-written excerpt");
    expect(published[0].readingTime).toBeGreaterThanOrEqual(1);

    const pagination = getPaginatedPosts(1);
    expect(pagination.totalPages).toBe(1);
    expect(pagination.posts).toHaveLength(2);
    expect(pagination.hasNextPage).toBe(false);

    process.env.NODE_ENV = "development";
    const allPostsIncludingDrafts = getAllPostsMeta();
    expect(allPostsIncludingDrafts.some((post) => post.title === "Draft Post")).toBe(true);
  });

  it("generates RSS feed entries for published posts only", async () => {
    seedPosts();
    process.env.NODE_ENV = "production";

    const { generateRSSFeed } = await import("@/lib/feeds");
    const rss = generateRSSFeed();

    expect(rss).toContain("<title><![CDATA[Custom Post]]></title>");
    expect(rss).toContain(`${siteConfig.url}/2024/01/12/custom-slug/`);
    expect(rss).toContain("Guides, How-To");
    expect(rss).not.toContain("Draft Post");
  });
});





