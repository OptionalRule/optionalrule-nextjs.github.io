import type { EdgeTemplateFamily } from './types'

export const contestsTemplates: EdgeTemplateFamily = {
  edgeType: 'CONTESTS',
  body: [
    { text: '{subject} and {object} both want {qualifier|the same leverage}.', expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'nounPhrase' } },
    { text: "{subject} disputes {object}'s claim.", expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: "{subject} refuses to recognize {object}'s authority.", expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: 'The compact between {subject:lower} and {object:lower} has gone bad.', expects: { subject: 'properNoun', object: 'properNoun' } },
  ],
  spineSummary: {
    text: "{subject} and {object} can't both set the rules — and the rest of the system knows it.",
    expects: { subject: 'properNoun', object: 'properNoun' },
  },
  historicalBridge: { text: '', expects: {} },
  hook: [
    { text: 'Who profits if {subject} and {object} stay locked in this fight?', expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: 'A neutral broker between {subject} and {object} would have leverage.', expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: "What's the original wrong neither side will name?", expects: {} },
  ],
}
