import type { EdgeTemplateFamily } from './types'

// WITNESSES edges: subject = settlement (with AI) or ruin; object = ruin or system.
// Qualifier (when set) is an era marker like 'first wave' or 'before the quarantine'.
export const witnessesTemplates: EdgeTemplateFamily = {
  edgeType: 'WITNESSES',
  body: [
    {
      text: '{subject} is the only thing in the system that remembers {object} firsthand.',
      expects: { subject: 'properNoun', object: 'properNoun' },
    },
    {
      text: '{subject} carries an unbroken chain of records back to {object}.',
      expects: { subject: 'properNoun', object: 'properNoun' },
    },
    {
      text: 'What {object} was, only {subject} can still describe.',
      expects: { subject: 'properNoun', object: 'properNoun' },
    },
    {
      text: '{subject} watched {object} happen and never deleted the logs.',
      expects: { subject: 'properNoun', object: 'properNoun' },
    },
  ],
  spineSummary: {
    text: '{subject} is the last living memory of {object}.',
    expects: { subject: 'properNoun', object: 'properNoun' },
  },
  historicalBridge: { text: '', expects: {} },
  hook: [
    {
      text: 'Who would pay to read what {subject} actually saw?',
      expects: { subject: 'properNoun' },
    },
    {
      text: 'Who would pay to make sure {subject} forgets?',
      expects: { subject: 'properNoun' },
    },
    {
      text: 'What does {subject} remember about {qualifier|that era} that nothing else does?',
      expects: { subject: 'properNoun', qualifier: 'nounPhrase' },
    },
  ],
}
