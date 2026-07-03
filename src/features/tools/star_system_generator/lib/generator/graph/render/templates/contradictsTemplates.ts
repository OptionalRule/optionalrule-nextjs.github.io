import type { EdgeTemplateFamily } from './types'

// CONTRADICTS edges: subject = ruin or settlement; object = settlement, faction, or system.
// Theme: two records on the same topic disagree. Templates emphasize the
// discrepancy as the noteworthy fact, not the resolution. Qualifier (when
// present) is the displayName of a real entity the dispute is about.
export const contradictsTemplates: EdgeTemplateFamily = {
  edgeType: 'CONTRADICTS',
  body: [
    { text: "{subject}'s record disagrees with {object}'s on {qualifier:article|the same point}.", expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'properNoun' } },
    { text: '{subject} says one thing about {qualifier:article|the matter at hand}; {object} says another.', expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'properNoun' } },
    { text: "The story {subject} tells doesn't match the one {object} keeps.", expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: '{subject} and {object} file the same event under different causes.', expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: "The dates line up everywhere except where {subject}'s account touches {object}'s, and there they miss by a season.", expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: "{object} certified its version; {subject}'s version never asked to be certified.", expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: 'Someone corrected the record {subject} keeps and the one {object} publishes, and the corrections are the parts that do not fit.', expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: "{subject} keeps its account where {object} can't audit it, which is itself an answer.", expects: { subject: 'properNoun', object: 'properNoun' } },
  ],
  bodyByTone: {
    cinematic: [
      { text: 'Two stories circulate about {qualifier:article|what happened}, and {subject} is the one the officials wish would stop.', expects: { subject: 'properNoun', qualifier: 'properNoun' } },
      { text: "{subject} remembers it differently, and {object} has spent money making sure remembering differently stays expensive.", expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: "What {object} calls the official version, dock crews call {object}'s version.", expects: { object: 'properNoun' } },
      { text: '{subject} is the crack in the account {object} has been painting over for years.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'The truth about {qualifier:article|the disputed matter} is buried shallow, and {subject} marks the spot.', expects: { subject: 'properNoun', qualifier: 'properNoun' } },
      { text: 'Ask {object} and the matter is settled. Ask anyone who was there.', expects: { object: 'properNoun' } },
      { text: "{subject} carries a version of events that would cost {object} everything it calls legitimacy.", expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'Every retelling from {object} loses one inconvenient name; {subject} kept the names.', expects: { subject: 'properNoun', object: 'properNoun' } },
    ],
    astronomy: [
      { text: "{subject}'s dataset and {object}'s dataset cannot both be calibrated correctly.", expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'Two certified instruments recorded {qualifier:article|the same event} and disagree beyond combined error.', expects: { qualifier: 'properNoun' } },
      { text: "The archival copy held by {subject} predates {object}'s master record and does not match it.", expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: "{object}'s published timeline requires an observation window {subject}'s logs show was never open.", expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'Independent reduction of the raw data reproduces {subject}\'s account, not {object}\'s.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'The discrepancy between {subject} and {object} is small, persistent, and survives every recalibration.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: "A checksum mismatch in {object}'s archive coincides with the interval {subject}'s record covers.", expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'Peer review of {qualifier:article|the contested record} stalled when both versions passed authentication.', expects: { qualifier: 'properNoun' } },
    ],
  },
  spineSummary: {
    text: '{subject} and {object} are telling two different stories about {qualifier:article|the matter at hand}.',
    expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'properNoun' },
  },
  spineSummaryByTone: {
    balanced: [
      { text: '{subject} and {object} are telling two different stories about {qualifier:article|the matter at hand}.', expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'properNoun' } },
      { text: 'This system runs on a record everyone cites and nobody trusts, because {subject} and {object} each keep a different original.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'The open question here is not what happened but whose account of it survives an audit — {subject}\'s or {object}\'s.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'Somewhere between {subject}\'s account and {object}\'s account is an event neither describes honestly.', expects: { subject: 'properNoun', object: 'properNoun' } },
    ],
    cinematic: [
      { text: 'This system keeps two sets of books about itself, and {subject} holds the set {object} wants burned.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'The lie at the center of this system has a shape, and {subject} traces one edge of it while {object} guards the other.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'Everyone here has picked a version: {subject}\'s, or {object}\'s, or silence.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'What this system remembers and what it admits are different things, and the distance between them runs through {subject}.', expects: { subject: 'properNoun' } },
    ],
    astronomy: [
      { text: 'The defining anomaly in this system is archival: {subject} and {object} hold irreconcilable records of the same event.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'Two authenticated datasets — {subject}\'s and {object}\'s — cannot both be true, and both keep passing verification.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'Every downstream measurement in this system inherits an unresolved discrepancy between {subject} and {object}.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'The reconciliation study between {subject}\'s record and {object}\'s has been "in progress" for longer than either archive existed.', expects: { subject: 'properNoun', object: 'properNoun' } },
    ],
  },
  historicalBridge: {
    text: 'The records were edited {historical:era|after a public-trust breach},',
    expects: {},
  },
  hook: [
    { text: 'Whose version of {qualifier:article|the record} would survive a third-party audit?', expects: { qualifier: 'properNoun' } },
    { text: 'Who edited the version everyone reads?', expects: {} },
    { text: "What changes if {subject}'s version turns out to be the true one?", expects: { subject: 'properNoun' } },
    { text: 'What does {object} stand to lose if {subject} is believed?', expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: "What evidence about {qualifier:article|the record} could {subject} surface that {object} can't refute?", expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'properNoun' } },
  ],
}
