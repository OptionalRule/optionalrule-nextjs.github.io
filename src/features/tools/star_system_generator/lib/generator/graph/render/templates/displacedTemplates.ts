import type { EdgeTemplateFamily } from './types'

// DISPLACED edges: subject = the displaced population (the dependent);
// object = the resource or location they now depend on.
export const displacedTemplates: EdgeTemplateFamily = {
  edgeType: 'DISPLACED',
  body: [
    {
      text: '{subject} was driven onto {object:article} during {qualifier|the great compaction}.',
      expects: { subject: 'properNoun', object: 'nounPhrase', qualifier: 'era' },
    },
    {
      text: '{subject} ended up dependent on {object:article} after {qualifier|the first wave}.',
      expects: { subject: 'properNoun', object: 'nounPhrase', qualifier: 'era' },
    },
    {
      text: '{subject} settled on {object:article} when {qualifier|the long quiet} forced the migration.',
      expects: { subject: 'properNoun', object: 'nounPhrase', qualifier: 'era' },
    },
  ],
  spineSummary: { text: '', expects: {} },
  historicalBridge: { text: '', expects: {} },
  hook: [],
}
