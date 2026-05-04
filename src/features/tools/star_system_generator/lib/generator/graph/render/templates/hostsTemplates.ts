import type { EdgeTemplateFamily } from './types'

export const hostsTemplates: EdgeTemplateFamily = {
  edgeType: 'HOSTS',
  body: [
    {
      text: '{object} sits on {subject}.',
      expects: { subject: 'properNoun', object: 'properNoun' },
    },
    {
      text: '{subject} hosts {object}.',
      expects: { subject: 'properNoun', object: 'properNoun' },
    },
    {
      text: '{object} is the only major foothold on {subject}.',
      expects: { subject: 'properNoun', object: 'properNoun' },
    },
    {
      text: '{subject} carries {object} on its surface.',
      expects: { subject: 'properNoun', object: 'properNoun' },
    },
  ],
  spineSummary: {
    text: '{object} clings to {subject} — the only thing keeping the system human.',
    expects: { subject: 'properNoun', object: 'properNoun' },
  },
  historicalBridge: { text: '', expects: {} },
  hook: [
    {
      text: 'What gave {object} its claim to {subject} in the first place?',
      expects: { subject: 'properNoun', object: 'properNoun' },
    },
    {
      text: 'Who else has tried to settle {subject} since {object} arrived?',
      expects: { subject: 'properNoun', object: 'properNoun' },
    },
  ],
}
