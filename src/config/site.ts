export const siteConfig = {
  name: 'Optional Rule',
  description: 'TTRPGs, game design, and all that happy stuff!',
  url: 'https://optionalrule-nextjs.github.io',
  author: 'Optional Rule',
  logo: '/brand/OptionalRuleIcon50x50XparentBG.png',
  socialImage: '/images/optionalrule-escaping-fireball.png',
  twitterHandle: '@optionalrule',
  language: 'en',
  themeColor: '#3b82f6',
  keywords: ['TTRPG', 'D&D', 'game design', 'RPG', 'tabletop games'],
} as const;

export type SiteConfig = typeof siteConfig;
