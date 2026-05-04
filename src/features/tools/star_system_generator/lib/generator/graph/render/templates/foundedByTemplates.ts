import type { EdgeTemplateFamily } from './types'

// FOUNDED_BY edges: subject = founding actor (faction or institution);
// object = the founded entity (settlement, body, or institution).
// Qualifier (when set) is the era; the body templates render the historical
// summary string used in approxEra-aware spine summaries. Era values are
// preposition-self-contained ("in the first wave" / "before the quarantine"),
// so templates surface qualifier as a complete adjunct without a hanging
// preposition before it.
export const foundedByTemplates: EdgeTemplateFamily = {
  edgeType: 'FOUNDED_BY',
  body: [
    {
      text: '{subject} founded {object} {qualifier|in the early charters}.',
      expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'era' },
    },
    {
      text: '{object} traces its origin to {subject}, {qualifier|in an earlier era}.',
      expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'era' },
    },
    {
      text: '{subject} chartered {object} {qualifier|in the formative years}.',
      expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'era' },
    },
  ],
  spineSummary: { text: '', expects: {} },
  historicalBridge: { text: '', expects: {} },
  hook: [],
}
