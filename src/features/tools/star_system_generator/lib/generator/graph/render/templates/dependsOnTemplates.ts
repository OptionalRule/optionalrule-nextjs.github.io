import type { EdgeTemplateFamily } from './types'

// DEPENDS_ON edges: subject = settlement (properNoun); object = resource or
// gu material (nounPhrase). Theme: single-source dependency as quiet leverage.
export const dependsOnTemplates: EdgeTemplateFamily = {
  edgeType: 'DEPENDS_ON',
  body: [
    { text: '{subject} depends on {object} for everything.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
    { text: '{subject} survives only because {object} keeps flowing.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
    { text: 'Without {object}, {subject} would fold within a season.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
    { text: '{subject} draws everything it consumes from {object}.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
    { text: 'There is no second source for {object}, and everyone at {subject} has done the math.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
    { text: 'The dependency of {subject} on {object} was filed as temporary; the filing is old enough to vote.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
    { text: '{subject} gauges its reserves of {object} at shift start, and the numbers travel by hand, not by channel.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
    { text: 'Redundancy for {object} was cut from {subject}\'s budget three cycles ago and never restored.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
  ],
  bodyByTone: {
    cinematic: [
      { text: '{subject} lives one shipment of {object} from the dark.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'Everyone at {subject} knows the number: days of {object} left if the run stops. Nobody says it aloud.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'The children of {subject} learn to read on supply manifests for {object}.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: '{subject} prays to whatever keeps {object} flowing, and its prayers are itemized.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'Cut the line that carries {object} and {subject} becomes a memorial with a docking ring.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'What holds {subject} together is not law or loyalty; it is {object}, metered.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: '{subject} was built on the promise of {object}, and promises out here have interest rates.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'Whoever touches {object} touches every throat at {subject} at once.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
    ],
    astronomy: [
      { text: '{subject} operates on a single-source supply chain for {object}; the failure mode is not modeled past day forty.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'Consumption curves at {subject} track availability of {object} with a correlation that leaves no slack term.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'The resupply interval for {object} exceeds {subject}\'s buffered reserve by a margin the safety filings round away.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: '{subject} has no certified substitute for {object}; the substitution trials all failed acceptance.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'Every load-balance projection for {subject} assumes uninterrupted {object}; none publishes the interrupted case.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'The dependency coefficient linking {subject} to {object} has grown every audit cycle since records began.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: '{subject}\'s life-support closure is nominal only when supplemented by {object}.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'Storage capacity for {object} at {subject} was designed for a smaller settlement and a calmer decade.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
    ],
  },
  spineSummary: {
    text: '{subject} runs on {object} — a single failure away from collapse.',
    expects: { subject: 'properNoun', object: 'nounPhrase' },
  },
  spineSummaryByTone: {
    balanced: [
      { text: '{subject} runs on {object} — a single failure away from collapse.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'Everything else about this system is negotiable; {subject}\'s need for {object} is not.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'The load-bearing fact of this system is a supply line: {object}, flowing to {subject}, on terms nobody renegotiates casually.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'Whoever controls {object} holds {subject} without firing a shot, and the whole system knows the arithmetic.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
    ],
    cinematic: [
      { text: 'This system has a heart, and it is {object}, and {subject} lives or dies by its beat.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: '{subject} hangs from a single thread of {object}, and everyone with a knife knows it.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'The quiet terror of this system: {object} runs late, and {subject} starts counting.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'Nobody rules {subject}. The supply of {object} rules {subject}; people just administer the shortage.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
    ],
    astronomy: [
      { text: 'The critical dependency in this system is material: {subject} cannot close its consumables budget without {object}.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'System stability here reduces to one flow rate — {object} into {subject}.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: '{subject}\'s viability curve tracks {object} availability with no independent term.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'Remove {object} from the model and {subject}\'s projections terminate inside a quarter.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
    ],
  },
  historicalBridge: {
    text: '{subject} ended up on {object:article} {historical:era|in the great compaction},',
    expects: { subject: 'properNoun', object: 'nounPhrase' },
  },
  hook: [
    { text: 'What does {subject} owe to keep {object} flowing?', expects: { subject: 'properNoun', object: 'nounPhrase' } },
    { text: 'How long can {subject} last if {object} dries up?', expects: { subject: 'properNoun', object: 'nounPhrase' } },
  ],
}
