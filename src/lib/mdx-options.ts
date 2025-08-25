import remarkGfm from 'remark-gfm';
import rehypeSanitize from './rehype-sanitize';
import { sanitizeSchema } from './sanitize-schema';

export const mdxOptions = {
  mdxOptions: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [[rehypeSanitize, sanitizeSchema]],
  },
};
