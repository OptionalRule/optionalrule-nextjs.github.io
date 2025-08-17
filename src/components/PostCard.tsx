import Link from 'next/link';
import Image from 'next/image';
import { PostMeta } from '@/lib/types';
import { formatDate, generatePostUrl, normalizeImagePath } from '@/lib/utils';

interface PostCardProps {
  post: PostMeta;
}

export function PostCard({ post }: PostCardProps) {
  const postUrl = generatePostUrl(post.date, post.slug);

  return (
    <article className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-200">
      
      {post.featured_image && (
        <Link href={postUrl} className="block">
          <div className="relative aspect-video bg-[var(--surface-hover)] overflow-hidden">
            <Image
              src={normalizeImagePath(post.featured_image)}
              alt={`Featured image for ${post.title}`}
              fill
              className="object-cover transition-transform duration-300 hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={false}
            />
          </div>
        </Link>
      )}

      <div className="p-6">
        <div className="flex items-center gap-2 mb-3 text-sm text-[var(--muted-2)]">
          <time dateTime={post.date}>
            {formatDate(post.date)}
          </time>
          <span>•</span>
          <span>{post.readingTime} min read</span>
        </div>

        <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">
          <Link 
            href={postUrl}
            className="hover:text-[var(--link)] transition-colors"
          >
            {post.title}
          </Link>
        </h2>

        {post.excerpt && (
          <p className="text-[var(--muted)] mb-4 leading-relaxed">
            {post.excerpt}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {post.tags?.map((tag) => (
              <Link
                key={tag}
                href={`/tag/${tag.toLowerCase()}/`}
                className="inline-block px-3 py-1 bg-[var(--chip-bg)] text-[var(--chip-text)] rounded-full text-sm hover:bg-[var(--surface-hover)] transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>

          <Link
            href={postUrl}
            className="text-[var(--link)] hover:text-[var(--link-hover)] font-medium text-sm transition-colors"
          >
            Read more →
          </Link>
        </div>
      </div>
    </article>
  );
}
