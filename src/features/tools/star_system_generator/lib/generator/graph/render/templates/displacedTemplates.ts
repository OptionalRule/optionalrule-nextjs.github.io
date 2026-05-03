import type { EdgeTemplateFamily } from './types'

// DISPLACED edges: subject = the displaced population (the dependent);
// object = the resource or location they now depend on. Era values are
// preposition-self-contained ("in the first wave" / "before the quarantine"),
// so templates surface qualifier as a complete adjunct without a hanging
// preposition before it.
export const displacedTemplates: EdgeTemplateFamily = {
  edgeType: 'DISPLACED',
  body: [
    {
      text: '{subject} was driven onto {object:article} {qualifier|in the great compaction}.',
      expects: { subject: 'properNoun', object: 'nounPhrase', qualifier: 'era' },
    },
    {
      text: '{subject} ended up dependent on {object:article} {qualifier|in the first wave}.',
      expects: { subject: 'properNoun', object: 'nounPhrase', qualifier: 'era' },
    },
    {
      text: '{subject} settled on {object:article} when migration came {qualifier|in the long quiet}.',
      expects: { subject: 'properNoun', object: 'nounPhrase', qualifier: 'era' },
    },
  ],
  spineSummary: { text: '', expects: {} },
  historicalBridge: { text: '', expects: {} },
  hook: [],
}
