import type { EdgeTemplateFamily } from './types'

// CONTESTS edges: subject = namedFaction; object = namedFaction.
// Phase C bodyByTone variants:
//   cinematic — short, agentive, threatened. Knife/oath/blood register.
//   astronomy — passive, technical, dated. Standards-dispute / measurement-court register.
//   balanced — falls back to family.body[] (existing voice-neutral templates).
export const contestsTemplates: EdgeTemplateFamily = {
  edgeType: 'CONTESTS',
  body: [
    { text: '{subject} and {object} both want the {qualifier|same leverage}.', expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'nounPhrase' } },
    { text: "{subject} disputes {object}'s claim.", expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: "{subject} refuses to recognize {object}'s authority.", expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: 'The compact between {subject} and {object} has gone bad.', expects: { subject: 'properNoun', object: 'properNoun' } },
  ],
  bodyByTone: {
    cinematic: [
      { text: '{subject} wants {object} to bleed first.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'Between {subject} and {object} the knife is already drawn.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: '{subject} keeps the receipts. {object} keeps the witnesses.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: '{subject} swore the pact would hold; {object} swore otherwise.', expects: { subject: 'properNoun', object: 'properNoun' } },
    ],
    astronomy: [
      { text: '{subject} and {object} report incompatible measurements of the {qualifier|same instrument-time}.', expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'nounPhrase' } },
      { text: "{subject}'s observation cohort and {object}'s cohort cannot agree on the calibration record.", expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'A standards dispute between {subject} and {object} is open in the measurement court.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'Two operators dispute jurisdiction; {subject} and {object} cannot reconcile their logs.', expects: { subject: 'properNoun', object: 'properNoun' } },
    ],
  },
  spineSummary: {
    text: "{subject} and {object} can't both set the rules — and the rest of the system knows it.",
    expects: { subject: 'properNoun', object: 'properNoun' },
  },
  spineSummaryByTone: {
    cinematic: [
      { text: '{subject} and {object} are bleeding each other dry, and the system cheers them on.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'Between {subject} and {object} the war is already lost; only the funerals remain.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: '{subject} wants {object} broken before the next thaw.', expects: { subject: 'properNoun', object: 'properNoun' } },
    ],
    astronomy: [
      { text: '{subject} and {object} hold incompatible records on the same observation; the resolution is jurisdictional.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: "A standards dispute between {subject} and {object} is the system's open question.", expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: '{subject} and {object} maintain conflicting calibration baselines — neither side will defer.', expects: { subject: 'properNoun', object: 'properNoun' } },
    ],
  },
  historicalBridge: {
    text: 'The compact between {subject} and {object} broke {historical:era|in an earlier reckoning},',
    expects: { subject: 'properNoun', object: 'properNoun' },
  },
  hook: [
    { text: 'Who profits if {subject} and {object} stay locked in this fight?', expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: 'A neutral broker between {subject} and {object} would have leverage.', expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: "What's the original wrong neither side will name?", expects: {} },
    { text: "What did {subject} sign that {object} won't honor anymore?", expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: 'What can {subject} prove about {object} that no court will hear?', expects: { subject: 'properNoun', object: 'properNoun' } },
  ],
}
