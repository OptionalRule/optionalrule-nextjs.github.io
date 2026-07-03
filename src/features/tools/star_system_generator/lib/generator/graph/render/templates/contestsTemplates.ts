import type { EdgeTemplateFamily } from './types'

// CONTESTS edges: subject = namedFaction; object = namedFaction or settlement.
// Qualifier (when present) is the displayName of a real entity in the system;
// surface it with {qualifier:article|...} so proper nouns stay bare and
// lowercase phrases pick up "the".
// Tone registers:
//   balanced — plainspoken dispatch; administrative dread.
//   cinematic — short, agentive, threatened. Knife/oath/blood register.
//   astronomy — passive, technical, dated. Standards-dispute / measurement-court register.
export const contestsTemplates: EdgeTemplateFamily = {
  edgeType: 'CONTESTS',
  body: [
    { text: '{subject} and {object} both want {qualifier:article|the same leverage}.', expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'properNoun' } },
    { text: "{subject} disputes {object}'s claim.", expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: "{subject} refuses to recognize {object}'s authority.", expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: 'The compact between {subject} and {object} has gone bad.', expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: '{subject} files claims faster than {object} can contest them, and both sides know the docket is the battlefield.', expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: 'The ledger says one thing, the manifests say another, and {subject} bills {object} for the difference.', expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: 'Every neutral broker between {subject} and {object} has recused, relocated, or stopped answering.', expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: '{subject} hires from the same ration queue {object} polices.', expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: 'Arbitration between {subject} and {object} is still scheduled, quarterly, in a hall neither attends.', expects: { subject: 'properNoun', object: 'properNoun' } },
  ],
  bodyByTone: {
    cinematic: [
      { text: '{subject} wants {object} to bleed first.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'Between {subject} and {object} the knife is already drawn.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: '{subject} keeps the receipts. {object} keeps the witnesses.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: '{subject} swore the pact would hold; {object} swore otherwise.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: "{subject} buries its dead facing {object}'s docks.", expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'What {subject} calls justice, {object} prices as war.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: "{subject} counts {object}'s ships the way widows count storms.", expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: "One chair sits at the head of this table, and {subject} and {object} have stopped pretending they'd share it.", expects: { subject: 'properNoun', object: 'properNoun' } },
    ],
    astronomy: [
      { text: '{subject} and {object} report incompatible measurements of {qualifier:article|the same instrument-time}.', expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'properNoun' } },
      { text: "{subject}'s observation cohort and {object}'s cohort cannot agree on the calibration record.", expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'A standards dispute between {subject} and {object} is open in the measurement court.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'Two operators dispute jurisdiction; {subject} and {object} cannot reconcile their logs.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'Survey passes filed by {subject} and {object} diverge beyond stated error, and neither will re-run the pass.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: "{subject} publishes corrections to {object}'s ephemerides without being asked.", expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'Priority over {qualifier:article|the contested find} is claimed by both {subject} and {object}, with disjoint timestamp chains.', expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'properNoun' } },
      { text: 'The registry lists two license holders for one band; {subject} and {object} both renew on time.', expects: { subject: 'properNoun', object: 'properNoun' } },
    ],
  },
  spineSummary: {
    text: "{subject} and {object} can't both set the rules — and the rest of the system knows it.",
    expects: { subject: 'properNoun', object: 'properNoun' },
  },
  spineSummaryByTone: {
    balanced: [
      { text: "{subject} and {object} can't both set the rules — and the rest of the system knows it.", expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'Everything else in this system is priced against the quarrel between {subject} and {object}.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'The dispute between {subject} and {object} has outlived three mediators and shows no sign of joining them.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: "Ask at any dock who runs this system and you'll get two answers — {subject} or {object} — depending on who's in earshot.", expects: { subject: 'properNoun', object: 'properNoun' } },
    ],
    cinematic: [
      { text: '{subject} and {object} are bleeding each other dry, and the system cheers them on.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'Between {subject} and {object} the war is already lost; only the funerals remain.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: '{subject} wants {object} broken before the next thaw.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'This system is a duel that forgot to end: {subject} on one side, {object} on the other, everyone else holding coats.', expects: { subject: 'properNoun', object: 'properNoun' } },
    ],
    astronomy: [
      { text: '{subject} and {object} hold incompatible records on the same observation; the resolution is jurisdictional.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: "A standards dispute between {subject} and {object} is the system's open question.", expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: '{subject} and {object} maintain conflicting calibration baselines — neither side will defer.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'The defining variable in this system is institutional: {subject} and {object} cannot agree on who certifies the numbers.', expects: { subject: 'properNoun', object: 'properNoun' } },
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
