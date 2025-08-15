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
    <article className="bg-zinc-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden drop-shadow-lg hover:shadow-lg transition-shadow duration-200">
      
      {post.featured_image && (
        <Link href={postUrl} className="block">
          <div className="relative aspect-video bg-gray-200 dark:bg-gray-700 overflow-hidden">
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
        <div className="flex items-center gap-2 mb-3 text-sm text-gray-600 dark:text-gray-400">
          <time dateTime={post.date}>
            {formatDate(post.date)}
          </time>
          <span>•</span>
          <span>{post.readingTime} min read</span>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
          <Link 
            href={postUrl}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {post.title}
          </Link>
        </h2>

        {post.excerpt && (
          <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
            {post.excerpt}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {post.tags?.map((tag) => (
              <Link
                key={tag}
                href={`/tag/${tag.toLowerCase()}/`}
                className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>

          <Link
            href={postUrl}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium text-sm transition-colors"
          >
            Read more →
          </Link>
        </div>
      </div>
    </article>
  );
}