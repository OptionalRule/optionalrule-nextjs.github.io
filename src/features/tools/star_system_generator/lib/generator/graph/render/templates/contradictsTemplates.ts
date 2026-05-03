import type { EdgeTemplateFamily } from './types'

// CONTRADICTS edges: subject = ruin or settlement; object = settlement, faction, or system.
// Theme: two records on the same topic disagree. Templates emphasize the
// discrepancy as the noteworthy fact, not the resolution.
export const contradictsTemplates: EdgeTemplateFamily = {
  edgeType: 'CONTRADICTS',
  body: [
    {
      text: "{subject}'s record disagrees with {object}'s on {qualifier|the same point}.",
      expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'nounPhrase' },
    },
    {
      text: '{subject} says one thing about {qualifier|what happened}; {object} says another.',
      expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'nounPhrase' },
    },
    {
      text: "The story {subject} tells doesn't match the one {object} keeps.",
      expects: { subject: 'properNoun', object: 'properNoun' },
    },
    {
      text: '{subject} and {object} both claim authority over {qualifier|the record}.',
      expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'nounPhrase' },
    },
  ],
  spineSummary: {
    text: '{subject} and {object} are telling two different stories about {qualifier|what really happened}.',
    expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'nounPhrase' },
  },
  historicalBridge: { text: '', expects: {} },
  hook: [
    {
      text: 'Whose version of {qualifier|the record} would survive a third-party audit?',
      expects: { qualifier: 'nounPhrase' },
    },
    {
      text: 'Who edited the version everyone reads?',
      expects: {},
    },
    {
      text: "What changes if {subject}'s version turns out to be the true one?",
      expects: { subject: 'properNoun' },
    },
  ],
}
