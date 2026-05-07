import type { EdgeTemplateFamily } from './types'

// CONTRADICTS edges: subject = ruin or settlement; object = settlement, faction, or system.
// Theme: two records on the same topic disagree. Templates emphasize the
// discrepancy as the noteworthy fact, not the resolution.
export const contradictsTemplates: EdgeTemplateFamily = {
  edgeType: 'CONTRADICTS',
  body: [
    {
      text: "{subject}'s record disagrees with {object}'s on the {qualifier|same point}.",
      expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'nounPhrase' },
    },
    {
      text: '{subject} says one thing about the {qualifier|matter at hand}; {object} says another.',
      expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'nounPhrase' },
    },
    {
      text: "The story {subject} tells doesn't match the one {object} keeps.",
      expects: { subject: 'properNoun', object: 'properNoun' },
    },
    {
      text: '{subject} and {object} both claim authority over the {qualifier|record}.',
      expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'nounPhrase' },
    },
  ],
  spineSummary: {
    text: '{subject} and {object} are telling two different stories about the {qualifier|matter at hand}.',
    expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'nounPhrase' },
  },
  historicalBridge: {
    text: 'The records were edited {historical:era|after a public-trust breach},',
    expects: {},
  },
  hook: [
    {
      text: 'Whose version of the {qualifier|record} would survive a third-party audit?',
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
    {
      text: 'What does {object} stand to lose if {subject} is believed?',
      expects: { subject: 'properNoun', object: 'properNoun' },
    },
    {
      text: "What evidence about the {qualifier|record} could {subject} surface that {object} can't refute?",
      expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'nounPhrase' },
    },
  ],
}
