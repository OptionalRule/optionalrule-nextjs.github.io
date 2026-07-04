import type { EdgeTemplateFamily } from './types'

// HIDES_FROM edges: subject = settlement; object = faction. Visibility is always
// 'hidden' — the edge never reaches body[]. Templates here are used ONLY for
// hooks (Phase 3's body cluster filter excludes hidden epistemic edges).
// The body[] entries are still authored so that if future phases relax the
// filter, the templates exist; they're harmless until then.
export const hidesFromTemplates: EdgeTemplateFamily = {
  edgeType: 'HIDES_FROM',
  body: [
    { text: "{subject} works hard to keep what it knows out of {object}'s reach.", expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: "Whatever {subject} is hiding, it's hiding it specifically from {object}.", expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: "{subject}'s records are clean — except in the places {object} would look.", expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: "{subject} rehearses its answers for the day {object} finally asks the precise question.", expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: 'Staying invisible to {object} costs {subject} more every audit cycle.', expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: "The cover story {subject} maintains for {object}'s benefit has outlived the people who could maintain it.", expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: "{object} has widened its sweep pattern two seasons running, and {subject} has noticed.", expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: "{subject}'s books balance perfectly, which is exactly what would worry {object} if {object} ever read them twice.", expects: { subject: 'properNoun', object: 'properNoun' } },
  ],
  bodyByTone: {
    cinematic: [
      { text: '{subject} sleeps with one eye on the docking registry, watching for {object}\'s hull codes.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'Every stranger who asks the wrong question at {subject} is assumed to carry {object}\'s money.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'What {subject} buried, it buried deep; what it fears is that {object} owns better shovels.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: '{subject} has a second set of records and a third set of exits, all rated against {object}.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'The lie {subject} tells {object} is old enough that the children believe it too.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: '{subject} pays its taxes early and its informants better, and both line items are about {object}.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'One good inspection by {object} ends {subject} as anyone knows it; the inspection schedule is {subject}\'s real religion.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'Whatever {subject} is protecting from {object}, it has decided the protecting is worth the slow bleed.', expects: { subject: 'properNoun', object: 'properNoun' } },
    ],
    astronomy: [
      { text: '{subject} files complete returns with {object}; the completeness is the anomaly.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'Emissions from {subject} drop below survey threshold whenever {object}\'s patrol window opens.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: '{subject}\'s declared throughput and its measured station-keeping budget do not close, and {object} has not yet run the reconciliation.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'The sensor shadow {subject} sits in is natural; its permanence of address within it is not, and {object} maps shadows.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: '{subject} answers {object}\'s standard queries with standard answers, at latencies slightly too consistent to be unrehearsed.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'Records at {subject} show a gap where {object}\'s jurisdiction would begin.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: '{subject} maintains calibration standards it never publishes, against instruments only {object} fields.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'Statistically, {subject} is the only site in the system that has never once been flagged by {object}; statisticians would call that a flag.', expects: { subject: 'properNoun', object: 'properNoun' } },
    ],
  },
  spineSummary: {
    text: "{subject} has something specific it can't let {object} find.",
    expects: { subject: 'properNoun', object: 'properNoun' },
  },
  spineSummaryByTone: {
    balanced: [
      { text: "{subject} has something specific it can't let {object} find.", expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'This system keeps one secret that matters, {subject} keeps it, and {object} keeps looking.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'The distance between what {subject} is and what it declares to {object} is the most carefully maintained measurement in the system.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'Everything {subject} builds, schedules, and says is shaped by one requirement: {object} must not look closely.', expects: { subject: 'properNoun', object: 'properNoun' } },
    ],
    cinematic: [
      { text: 'This system holds its breath every time {object}\'s patrol cycles past {subject}.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: '{subject} lives like a lamp turned low, and {object} is the reason for the darkness.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'The secret at {subject} has a shape, a weight, and a countdown; {object} supplies the countdown.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'One day {object} asks the precise question, and everything {subject} is ends or begins.', expects: { subject: 'properNoun', object: 'properNoun' } },
    ],
    astronomy: [
      { text: 'The residual in this system\'s accounts traces to {subject}, and the auditor it evades is {object}.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: '{subject} is the system\'s one dataset {object} has never successfully sampled.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'Model this system without {subject}\'s undeclared variables and the fit is perfect; {object} keeps getting perfect fits.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'Somewhere in {subject}\'s clean returns to {object} is a term that absorbs everything unexplained.', expects: { subject: 'properNoun', object: 'properNoun' } },
    ],
  },
  historicalBridge: [],
  hook: [
    { text: 'What does {subject} need to keep from {object}?', expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: "Who could broker an exchange of what {subject} has for {object}'s silence?", expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: 'How long can {subject} keep this from {object} before slipping?', expects: { subject: 'properNoun', object: 'properNoun' } },
  ],
}
