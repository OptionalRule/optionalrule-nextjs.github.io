import type { EdgeTemplateFamily } from './types'

export const destabilizesTemplates: EdgeTemplateFamily = {
  edgeType: 'DESTABILIZES',
  body: [
    { text: '{subject:article} is corroding {object:article}.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
    { text: '{subject:article} keeps shifting under {object}.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
    { text: "Each pass of {subject:article} costs {object} a margin it doesn't have.", expects: { subject: 'nounPhrase', object: 'properNoun' } },
    { text: "{object} can't plan around {subject:lower} anymore.", expects: { subject: 'nounPhrase', object: 'properNoun' } },
  ],
  spineSummary: {
    text: '{subject:article} is rewriting the constants {object} was built around.',
    expects: { subject: 'nounPhrase', object: 'properNoun' },
  },
  historicalBridge: {
    text: '{subject} traces back to {historical:era|a flawed founding},',
    expects: { subject: 'properNoun' },
  },
  hook: [
    { text: 'Whose models predicted {subject:lower} would behave?', expects: { subject: 'nounPhrase' } },
    { text: "Who profits from {object}'s loss of cushion?", expects: { object: 'properNoun' } },
  ],
}
