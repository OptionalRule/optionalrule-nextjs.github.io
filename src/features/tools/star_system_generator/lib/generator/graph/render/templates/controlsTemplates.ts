import type { EdgeTemplateFamily } from './types'

// CONTROLS edges: subject = namedFaction; object = body, settlement, or system.
// Tone: matter-of-fact, present-tense. Qualifier (when present) is the control
// domain ('route', 'compliance', 'transit', etc.) — surface it as a noun phrase.
export const controlsTemplates: EdgeTemplateFamily = {
  edgeType: 'CONTROLS',
  body: [
    {
      text: '{subject} controls {object}.',
      expects: { subject: 'properNoun', object: 'properNoun' },
    },
    {
      text: '{subject} sets the {qualifier|terms} for {object}.',
      expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'nounPhrase' },
    },
    {
      text: '{object} answers to {subject}.',
      expects: { subject: 'properNoun', object: 'properNoun' },
    },
    {
      text: "Nothing moves through {object} without {subject}'s sign-off.",
      expects: { subject: 'properNoun', object: 'properNoun' },
    },
  ],
  spineSummary: {
    text: '{subject} writes the rules everything in {object} has to live by.',
    expects: { subject: 'properNoun', object: 'properNoun' },
  },
  historicalBridge: { text: '', expects: {} },
  hook: [
    {
      text: 'What did {subject} pay to lock down {object}?',
      expects: { subject: 'properNoun', object: 'properNoun' },
    },
    {
      text: 'Who in {object} wants {subject} gone?',
      expects: { subject: 'properNoun', object: 'properNoun' },
    },
  ],
}
