import type { EdgeTemplateFamily } from './types'

// SUPPRESSES edges: subject = namedFaction; object = phenomenon, gu.bleedLocation,
// settlement, or settlement.hiddenTruth-bearing settlement. Visibility may be
// 'contested' (visible interdiction) or 'hidden' (covert suppression of own
// hidden truth). Body templates apply to the visible case; hooks apply to both.
// Hidden-visibility edges never reach body[] (cluster filter).
export const suppressesTemplates: EdgeTemplateFamily = {
  edgeType: 'SUPPRESSES',
  body: [
    { text: '{subject} keeps {object:article} off the official record.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
    { text: '{subject} runs interdiction patrols around {object}.', expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: "Anything {subject} flags about {object} stops at {subject}'s threshold.", expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: '{subject} treats {object:article} as a compliance problem.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
    { text: 'The bulletin {subject} issues about {object:article} runs shorter every quarter, and the redactions run longer.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
    { text: 'Too many people handled the original evidence about {object:article} for {subject}\'s silence to hold cleanly.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
    { text: '{subject} cites a danger in {object:article} that nobody has been cleared to verify.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
    { text: 'A copy of what {subject} buried about {object:article} exists, and both facts are priced into every negotiation.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
  ],
  bodyByTone: {
    cinematic: [
      { text: '{subject} did not silence {object:article}; it taught the whole system to change the subject.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'Ask {subject} about {object:article} and watch how fast the docking fees find your ship.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'The quiet around {object:article} is manufactured, maintained, and invoiced by {subject}.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: '{subject} keeps a list of everyone who has asked about {object:article}. The list is the punishment.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'Somewhere in {subject}\'s archive is a folder about {object:article} that three people can open and none will.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'What {subject} buried about {object:article} is patient. Buried things out here usually are.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'The children of the people who saw {object:article} are taught, gently, that they didn\'t.', expects: { object: 'nounPhrase' } },
      { text: '{subject} pays well for silence about {object:article}, and better for forgetting.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
    ],
    astronomy: [
      { text: 'Data products referencing {object:article} are withheld by {subject} under a classification with no published criteria.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: '{subject} maintains an exclusion zone around {object:article} whose stated radius has tripled without stated cause.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'Independent measurements of {object:article} exist; {subject} contests their calibration rather than their content.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'The public catalog entry for {object:article} was last updated before {subject} assumed custody.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'Requests to observe {object:article} return a standard deferral over {subject}\'s signature block.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: '{subject}\'s embargo on {object:article} is procedurally perfect and scientifically unexplained.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'Archival gaps concerning {object:article} correlate exactly with {subject}\'s custody intervals.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'The instrumentation ring around {object:article} reports to {subject} and to nothing else.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
    ],
  },
  spineSummary: {
    text: '{subject} is making sure no one says {object:article} out loud.',
    expects: { subject: 'properNoun', object: 'nounPhrase' },
  },
  spineSummaryByTone: {
    balanced: [
      { text: '{subject} is making sure no one says {object:article} out loud.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'The organizing fact of this system is a silence: {subject} keeps {object:article} off every record that leaves.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'Everyone here knows about {object:article}; the system\'s economy is built on not knowing officially, and {subject} audits the difference.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'What {subject} suppresses about {object:article} gets heavier every season it stays buried.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
    ],
    cinematic: [
      { text: 'This system has a hole in its story, {object:article} is the hole, and {subject} stands in front of it.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'The most expensive thing in this system is the quiet around {object:article}, and {subject} pays it monthly.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: '{subject} built a wall of paperwork around {object:article}; walls out here have doors, and doors have prices.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'Sooner or later {object:article} surfaces. Everything {subject} does is about making it later.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
    ],
    astronomy: [
      { text: 'The defining gap in this system\'s dataset is administrative: {subject} embargoes everything touching {object:article}.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'Every public model of this system fits poorly for one reason — {object:article}, whose data {subject} withholds.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'This system is fully surveyed except where {subject}\'s exclusion zone covers {object:article}, which is the part that matters.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'The record of this system has a custodian and a blind spot, and {subject} maintains both.', expects: { subject: 'properNoun' } },
    ],
  },
  historicalBridge: [
    {
      text: '{subject} took control {historical:era|in a broken compact},',
      expects: { subject: 'properNoun' },
    },
    {
      text: '{subject} assumed emergency powers {historical:era|after an incident the record keeps vague},',
      expects: { subject: 'properNoun' },
    },
    {
      text: 'The suppression order was first issued {historical:era|in a panic long since renamed prudence},',
      expects: {},
    },
    {
      text: '{subject} started sealing the record {historical:era|before most residents arrived},',
      expects: { subject: 'properNoun' },
    },
    {
      text: 'The first cover-up happened {historical:era|in a quieter emergency},',
      expects: {},
    },
  ],
  hook: [
    { text: 'What does {subject} stand to lose if {object} stops being a secret?', expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: 'Who already knows about {object} and is waiting to use it?', expects: { object: 'properNoun' } },
    { text: "What price would buy {subject}'s silence about {object}?", expects: { subject: 'properNoun', object: 'properNoun' } },
  ],
}
