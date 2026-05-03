import type { EdgeTemplateFamily } from './types'

// BETRAYED edges: subject = the actor that broke the compact;
// object = the actor or institution betrayed.
export const betrayedTemplates: EdgeTemplateFamily = {
  edgeType: 'BETRAYED',
  body: [
    {
      text: '{subject} broke faith with {object} during {qualifier|an earlier reckoning}.',
      expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'era' },
    },
    {
      text: 'The compact between {subject} and {object} fractured in {qualifier|the long quiet}.',
      expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'era' },
    },
    {
      text: '{subject} turned on {object} during {qualifier|the bleed years}.',
      expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'era' },
    },
  ],
  spineSummary: { text: '', expects: {} },
  historicalBridge: { text: '', expects: {} },
  hook: [],
}
