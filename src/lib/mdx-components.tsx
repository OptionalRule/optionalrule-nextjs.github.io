import type { MDXComponents } from 'mdx/types';
import MarkdownLink from '@/components/MarkdownLink';
import MediaEmbed from '@/components/MediaEmbed';
import HeadingAnchor from '@/components/HeadingAnchor';
import YouTubeEmbed from '@/components/YouTubeEmbed';

export const mdxComponents: MDXComponents = {
  a: MarkdownLink,
  MediaEmbed,
  YouTubeEmbed,
  h1: (props) => <HeadingAnchor level={1} {...props} />,
  h2: (props) => <HeadingAnchor level={2} {...props} />,
  h3: (props) => <HeadingAnchor level={3} {...props} />,
  h4: (props) => <HeadingAnchor level={4} {...props} />,
  h5: (props) => <HeadingAnchor level={5} {...props} />,
  h6: (props) => <HeadingAnchor level={6} {...props} />,
};
