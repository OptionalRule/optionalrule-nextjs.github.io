import type { EdgeTemplateFamily } from './types'

export const dependsOnTemplates: EdgeTemplateFamily = {
  edgeType: 'DEPENDS_ON',
  body: [
    { text: '{subject} depends on {object} for everything.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
    { text: '{subject} survives only because {object} keeps flowing.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
    { text: 'Without {object}, {subject:lower} would fold within a season.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
    { text: '{subject} draws everything it consumes from {object}.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
  ],
  spineSummary: {
    text: '{subject} runs on {object} — a single failure away from collapse.',
    expects: { subject: 'properNoun', object: 'nounPhrase' },
  },
  historicalBridge: {
    text: '{subject} ended up on {object:article} {historical:era|in the great compaction},',
    expects: { subject: 'properNoun', object: 'nounPhrase' },
  },
  hook: [
    { text: 'What does {subject} owe to keep {object} flowing?', expects: { subject: 'properNoun', object: 'nounPhrase' } },
    { text: 'How long can {subject:lower} last if {object} dries up?', expects: { subject: 'properNoun', object: 'nounPhrase' } },
  ],
}
