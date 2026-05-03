import type { EdgeTemplateFamily } from './types'

// FOUNDED_BY edges: subject = founding actor (faction or institution);
// object = the founded entity (settlement, body, or institution).
// Qualifier (when set) is the era; the body templates render the historical
// summary string used in approxEra-aware spine summaries.
export const foundedByTemplates: EdgeTemplateFamily = {
  edgeType: 'FOUNDED_BY',
  body: [
    {
      text: '{subject} founded {object} during {qualifier|the early charters}.',
      expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'era' },
    },
    {
      text: '{object} traces its origin to {subject} in {qualifier|an earlier era}.',
      expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'era' },
    },
    {
      text: '{subject} chartered {object} in {qualifier|the formative years}.',
      expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'era' },
    },
  ],
  spineSummary: { text: '', expects: {} },
  historicalBridge: { text: '', expects: {} },
  hook: [],
}
