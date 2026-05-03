import type { EdgeTemplateFamily } from './types'

// SUPPRESSES edges: subject = namedFaction; object = phenomenon, gu.bleedLocation,
// settlement, or settlement.hiddenTruth-bearing settlement. Visibility may be
// 'contested' (visible interdiction) or 'hidden' (covert suppression of own
// hidden truth). Body templates apply to the visible case; hooks apply to both.
// Hidden-visibility edges never reach body[] (cluster filter).
export const suppressesTemplates: EdgeTemplateFamily = {
  edgeType: 'SUPPRESSES',
  body: [
    {
      text: '{subject} keeps {object:article} off the official record.',
      expects: { subject: 'properNoun', object: 'nounPhrase' },
    },
    {
      text: '{subject} runs interdiction patrols around {object}.',
      expects: { subject: 'properNoun', object: 'properNoun' },
    },
    {
      text: "Anything {subject} flags about {object} stops at {subject}'s threshold.",
      expects: { subject: 'properNoun', object: 'properNoun' },
    },
    {
      text: '{subject} treats {object:article} as a compliance problem.',
      expects: { subject: 'properNoun', object: 'nounPhrase' },
    },
  ],
  spineSummary: {
    text: '{subject} is making sure no one says {object:article} out loud.',
    expects: { subject: 'properNoun', object: 'nounPhrase' },
  },
  historicalBridge: { text: '', expects: {} },
  hook: [
    {
      text: 'What does {subject} stand to lose if {object} stops being a secret?',
      expects: { subject: 'properNoun', object: 'properNoun' },
    },
    {
      text: 'Who already knows about {object} and is waiting to use it?',
      expects: { object: 'properNoun' },
    },
    {
      text: "What price would buy {subject}'s silence about {object}?",
      expects: { subject: 'properNoun', object: 'properNoun' },
    },
  ],
}
