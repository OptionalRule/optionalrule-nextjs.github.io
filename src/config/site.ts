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
  }
} as const;

export type SiteConfig = typeof siteConfig;
