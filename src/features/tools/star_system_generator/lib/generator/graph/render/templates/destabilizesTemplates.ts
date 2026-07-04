import type { EdgeTemplateFamily } from './types'

// DESTABILIZES edges: subject = phenomenon or guHazard (nounPhrase, surfaced
// with the :article modifier so a noun-phrase head reads as "the bleed
// season" rather than a bare noun); object = settlement, body, or faction
// (properNoun or nounPhrase).
// Tone registers:
//   balanced — attrition ledger; maintenance dread.
//   cinematic — dread, encroachment, tide-of-darkness register.
//   astronomy — perturbations, amplitudes, phase-shift register.
export const destabilizesTemplates: EdgeTemplateFamily = {
  edgeType: 'DESTABILIZES',
  body: [
    { text: '{subject:article} is corroding {object:article}.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
    { text: '{subject:article} keeps shifting under {object}.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
    { text: "Each pass of {subject:article} costs {object} a margin it doesn't have.", expects: { subject: 'nounPhrase', object: 'properNoun' } },
    { text: "{object} can't plan around {subject:article} anymore.", expects: { subject: 'nounPhrase', object: 'properNoun' } },
    { text: 'Repair crews on {object} stopped filing overtime; the paperwork lags {subject:article} by weeks.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
    { text: 'The safety margins around {subject:article} were written for what it used to be, and {object} operates inside them anyway.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
    { text: 'Insurance on {object} now carries an exclusion clause that names {subject:article} without naming it.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
    { text: 'Every mitigation contract {object} has written against {subject:article} has lapsed, failed, or been bought out.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
    { text: 'Evacuation drills on {object} went from annual to weekly the season {subject:article} changed course, and nobody issued a bulletin about why.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
  ],
  bodyByTone: {
    cinematic: [
      { text: '{subject:article} is closing on {object} like a tide.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
      { text: 'Something is wrong under {object}, and {subject:lower} is the name people whisper for it.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
      { text: '{object} has been watching {subject:article} eat its margins for a generation.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
      { text: '{subject:article} is hollowing {object} from underneath.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
      { text: '{object} sleeps in shifts now, and {subject:article} does not sleep at all.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
      { text: 'The old-timers on {object} can read {subject:article} in the hull groans; the young ones are learning fast.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
      { text: '{subject:article} took the buffer zones first. {object} is what comes after the buffer zones.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
      { text: 'Nobody on {object} says dying. They say "operating around {subject:lower}".', expects: { subject: 'nounPhrase', object: 'properNoun' } },
    ],
    astronomy: [
      { text: '{subject:article} introduces a measurable perturbation in {object}.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
      { text: 'The amplitude of {subject:article} exceeds the operating envelope of {object}.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
      { text: '{subject:article} drifts the baselines {object} relies on.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
      { text: '{object} records a phase shift each time {subject:article} passes through.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
      { text: 'Structural telemetry from {object} shows secular degradation correlated with {subject:article} at high confidence.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
      { text: 'The recurrence interval of {subject:article} has shortened past the maintenance cycle {object} was budgeted for.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
      { text: 'Models fitted to {subject:article} five years ago now underpredict its reach by an order of magnitude at {object}.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
      { text: '{object} has re-baselined its instruments twice this cycle; {subject:article} moved both baselines.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
    ],
  },
  spineSummary: {
    text: '{subject:article} is rewriting the constants {object} was built around.',
    expects: { subject: 'nounPhrase', object: 'properNoun' },
  },
  spineSummaryByTone: {
    balanced: [
      { text: '{subject:article} is rewriting the constants {object} was built around.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
      { text: 'The question hanging over this system is not whether {subject:article} reaches {object}, but what {object} becomes while waiting.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
      { text: 'Every schedule in this system bends around {subject:article}, and {object} bends furthest.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
      { text: '{object} keeps operating because stopping costs more — {subject:article} has made sure both numbers keep rising.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
    ],
    cinematic: [
      { text: '{subject:article} is hunting {object} a degree at a time.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
      { text: 'Everything {object} was built to outlast is being unmade by {subject:article}.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
      { text: '{subject:article} is the wound {object} cannot dress.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
      { text: 'This system has a clock in it, and {subject:article} is the hand that moves.', expects: { subject: 'nounPhrase' } },
    ],
    astronomy: [
      { text: '{subject:article} is shifting the operating envelope {object} was calibrated against.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
      { text: "The perturbation from {subject:article} now exceeds {object}'s tolerance margin.", expects: { subject: 'nounPhrase', object: 'properNoun' } },
      { text: '{subject:article} is drifting the baselines on which {object} was sited.', expects: { subject: 'nounPhrase', object: 'properNoun' } },
      { text: 'The dominant term in every forecast for this system is {subject:article}, and the error bars on it keep widening.', expects: { subject: 'nounPhrase' } },
    ],
  },
  historicalBridge: [
    {
      text: '{subject} took shape {historical:era|after a flawed founding},',
      expects: { subject: 'nounPhrase' },
    },
    {
      text: '{subject:article} first showed up in the surveys {historical:era|before anyone thought to worry},',
      expects: { subject: 'nounPhrase' },
    },
    {
      text: 'The earliest records of {subject:article} were filed {historical:era|in the first survey pass},',
      expects: { subject: 'nounPhrase' },
    },
    {
      text: '{subject:article} was already growing {historical:era|before the earliest instrument logs},',
      expects: { subject: 'nounPhrase' },
    },
    {
      text: 'Nobody logged when {subject:article} began; the first complaints came {historical:era|generations back},',
      expects: { subject: 'nounPhrase' },
    },
  ],
  hook: [
    { text: 'Whose models predicted {subject:article} would behave?', expects: { subject: 'nounPhrase' } },
    { text: "Who profits from {object}'s loss of cushion?", expects: { object: 'properNoun' } },
    { text: 'What did {object} have to give up to keep operating around {subject:article}?', expects: { subject: 'nounPhrase', object: 'properNoun' } },
    { text: 'Who knew {subject:article} would reach {object} and stayed quiet?', expects: { subject: 'nounPhrase', object: 'properNoun' } },
  ],
}
