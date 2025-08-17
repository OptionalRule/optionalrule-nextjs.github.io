export const siteConfig = {
  name: 'Optional Rule',
  title: 'Optional Rule',
  description: 'A modern blog about TTRPG and RPG design.',
  url: 'https://www.optionalrule.com',
  author: {
    name: 'Scott Turnbull',
    email: 'scott@optionalrule.com',
    twitter: '@optionalrule',
    url: 'https://optionalrule.com'
  },
  creator: 'Tech-Tavern',
  publisher: 'Optional Rule Games',
  logo: '/brand/OptionalRuleIcon50x50XparentBG.png',
  socialImage: '/images/optionalrule-escaping-fireball.png',
  defaultImage: '/images/optionalrule-escaping-fireball.png',
  language: 'en',
  locale: 'en_US',
  themeColor: '#3b82f6',
  keywords: ['ttrpg', 'gaming', 'rpg', 'dungeons and dragons', 'shadowdark', 'role-playing', 'game design'] as string[],
  social: {
    twitter: '@optionalrule',
    github: 'streamweaver',
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: '',
    bing: '',
  },
  analytics: {
    googleAnalyticsId: 'G-RXH8EZ5E8J',
  },
  // Site-wide theme tokens for light/dark (used to populate CSS variables)
  theme: {
    light: {
      background: '#ffffff',
      foreground: '#171717',
      surface: '#f1f5f9', // slate-100
      card: '#fafafa', // zinc-50
      muted: '#4b5563', // gray-700
      muted2: '#6b7280', // gray-600
      border: '#e5e7eb', // gray-200
      surfaceHover: '#f3f4f6', // gray-100
      link: '#2563eb', // blue-600
      linkHover: '#1e40af', // blue-800
      chipBg: '#f3f4f6', // gray-100
      chipText: '#374151', // gray-700
      highlightBg: '#fde68a', // yellow-200
    },
    dark: {
      background: '#0a0a0a',
      foreground: '#ededed',
      surface: '#111827', // gray-900
      card: '#1f2937', // gray-800
      muted: '#d1d5db', // gray-300
      muted2: '#9ca3af', // gray-400
      border: '#374151', // gray-700
      surfaceHover: '#1f2937', // gray-800
      link: '#60a5fa', // blue-400
      linkHover: '#bfdbfe', // blue-200
      chipBg: '#374151', // gray-700
      chipText: '#d1d5db', // gray-300
      highlightBg: '#854d0e', // yellow-800
    },
  },
} as const;

export type SiteConfig = typeof siteConfig;

export type ThemeTokens = {
  background: string;
  foreground: string;
  surface: string;
  card: string;
  muted: string;
  muted2: string;
  border: string;
  surfaceHover: string;
  link: string;
  linkHover: string;
  chipBg: string;
  chipText: string;
  highlightBg: string;
};
