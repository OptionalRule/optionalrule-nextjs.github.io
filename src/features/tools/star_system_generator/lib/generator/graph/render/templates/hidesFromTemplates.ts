import type { EdgeTemplateFamily } from './types'

// HIDES_FROM edges: subject = settlement; object = faction. Visibility is always
// 'hidden' — the edge never reaches body[]. Templates here are used ONLY for
// hooks (Phase 3's body cluster filter excludes hidden epistemic edges).
// The body[] entries are still authored so that if future phases relax the
// filter, the templates exist; they're harmless until then.
export const hidesFromTemplates: EdgeTemplateFamily = {
  edgeType: 'HIDES_FROM',
  body: [
    {
      text: '{subject} works hard to keep what it knows out of {object}\'s reach.',
      expects: { subject: 'properNoun', object: 'properNoun' },
    },
    {
      text: "Whatever {subject} is hiding, it's hiding it specifically from {object}.",
      expects: { subject: 'properNoun', object: 'properNoun' },
    },
    {
      text: "{subject}'s records are clean — except in the places {object} would look.",
      expects: { subject: 'properNoun', object: 'properNoun' },
    },
  ],
  spineSummary: {
    text: "{subject} has something specific it can't let {object} find.",
    expects: { subject: 'properNoun', object: 'properNoun' },
  },
  historicalBridge: { text: '', expects: {} },
  hook: [
    {
      text: 'What does {subject} need to keep from {object}?',
      expects: { subject: 'properNoun', object: 'properNoun' },
    },
    {
      text: "Who could broker an exchange of what {subject} has for {object}'s silence?",
      expects: { subject: 'properNoun', object: 'properNoun' },
    },
    {
      text: 'How long can {subject} keep this from {object} before slipping?',
      expects: { subject: 'properNoun', object: 'properNoun' },
    },
  ],
}
