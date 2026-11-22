import remarkGfm from 'remark-gfm';
import type { CompileOptions } from '@mdx-js/mdx';
import rehypeSanitize from './rehype-sanitize';
import rehypeHeadingIds from './rehype-heading-ids';
import { sanitizeSchema } from './sanitize-schema';

export const mdxOptions: CompileOptions = {
  remarkPlugins: [remarkGfm],
  rehypePlugins: [[rehypeSanitize, sanitizeSchema], rehypeHeadingIds],
};
