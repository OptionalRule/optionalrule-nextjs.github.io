import type { EdgeTemplateFamily } from './types'

// DESTABILIZES edges: subject = phenomenon or guHazard (nounPhrase, surfaced
// with the :article modifier so a noun-phrase head reads as "the bleed
// season" rather than a bare noun); object = settlement, body, or faction
// (properNoun or nounPhrase).
//
// Phase C bodyByTone variants:
//   cinematic — dread, encroachment, tide-of-darkness register.
//   astronomy — perturbations, amplitudes, phase-shift register.
//   balanced — falls back to family.body[] (existing voice-neutral templates).
export const destabilizesTemplates: EdgeTemplateFamily = {
  edgeType: 'DESTABILIZES',
  body: [
    { text: '{subject:article} is corroding {object:article}.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
    { text: '{subject:article} keeps shifting under {object}.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
    { text: "Each pass of {subject:article} costs {object} a margin it doesn't have.", expects: { subject: 'nounPhrase', object: 'properNoun' } },
    { text: "{object} can't plan around {subject:lower} anymore.", expects: { subject: 'nounPhrase', object: 'properNoun' } },
  ],
  bodyByTone: {
    cinematic: [
      { text: '{subject:article} is closing on {object} like a tide.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
      { text: 'Something is wrong under {object}, and {subject:lower} is the name people whisper for it.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
      { text: '{object} has been watching {subject:lower} eat its margins for a generation.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
      { text: '{subject:article} is hollowing {object} from underneath.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
    ],
    astronomy: [
      { text: '{subject:article} introduces a measurable perturbation in {object}.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
      { text: 'The amplitude of {subject:lower} exceeds the operating envelope of {object}.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
      { text: '{subject:article} drifts the baselines {object} relies on.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
      { text: '{object} records a phase shift each time {subject:lower} passes through.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
    ],
  },
  spineSummary: {
    text: '{subject:article} is rewriting the constants {object} was built around.',
    expects: { subject: 'nounPhrase', object: 'properNoun' },
  },
  spineSummaryByTone: {
    cinematic: [
      { text: '{subject:article} is hunting {object} a degree at a time.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
      { text: 'Everything {object} was built to outlast is being unmade by {subject:lower}.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
      { text: '{subject:article} is the wound {object} cannot dress.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
    ],
    astronomy: [
      { text: '{subject:article} is shifting the operating envelope {object} was calibrated against.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
      { text: 'The perturbation from {subject:lower} now exceeds {object}\'s tolerance margin.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
      { text: '{subject:article} is drifting the baselines on which {object} was sited.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
    ],
  },
  historicalBridge: {
    text: '{subject} took shape {historical:era|after a flawed founding},',
    expects: { subject: 'nounPhrase' },
  },
  hook: [
    { text: 'Whose models predicted {subject:lower} would behave?', expects: { subject: 'nounPhrase' } },
    { text: "Who profits from {object}'s loss of cushion?", expects: { object: 'properNoun' } },
  ],
}
