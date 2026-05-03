import type { EdgeTemplateFamily } from './types'

// BETRAYED edges: subject = the actor that broke the compact;
// object = the actor or institution betrayed. Era values are
// preposition-self-contained ("in the first wave" / "before the quarantine"),
// so templates surface qualifier as a complete adjunct without a hanging
// preposition before it.
export const betrayedTemplates: EdgeTemplateFamily = {
  edgeType: 'BETRAYED',
  body: [
    {
      text: '{subject} broke faith with {object} {qualifier|in an earlier reckoning}.',
      expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'era' },
    },
    {
      text: 'The compact between {subject} and {object} fractured {qualifier|in the long quiet}.',
      expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'era' },
    },
    {
      text: '{subject} turned on {object} {qualifier|in the bleed years}.',
      expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'era' },
    },
  ],
  spineSummary: { text: '', expects: {} },
  historicalBridge: { text: '', expects: {} },
  hook: [],
}
