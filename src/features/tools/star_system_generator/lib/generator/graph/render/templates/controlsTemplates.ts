import type { EdgeTemplateFamily } from './types'

// CONTROLS edges: subject = namedFaction; object = body, settlement, or system.
// Tone: matter-of-fact, present-tense. Qualifier (when present) is the control
// domain ('route', 'compliance', 'transit', etc.) — surface it as a noun phrase.
export const controlsTemplates: EdgeTemplateFamily = {
  edgeType: 'CONTROLS',
  body: [
    { text: '{subject} controls {object}.', expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: '{subject} sets the {qualifier|terms} for {object}.', expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'nounPhrase' } },
    { text: '{object} answers to {subject}.', expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: "Nothing moves through {object} without {subject}'s sign-off.", expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: "{subject}'s authority over {object} rests on an emergency charter whose emergency officially ended years ago.", expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: 'The fee schedule {subject} posts at {object} rises every quarter; the ledger explaining why is sealed.', expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: 'Appeals from {object} against {subject} route through an office {subject} staffs.', expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: '{subject} reissued the access badges for {object} in new colors, and the old ones quietly stopped working.', expects: { subject: 'properNoun', object: 'properNoun' } },
  ],
  bodyByTone: {
    cinematic: [
      { text: '{subject} holds {object} the way a hand holds a throat: gently, for now.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'Everyone at {object} works for {subject}; some of them even know it.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: "{subject} doesn't post guards at {object} anymore. It doesn't need to.", expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'The keys to {object} changed hands once, at gunpoint, politely. {subject} kept the receipts.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: "{subject}'s flag doesn't fly over {object}. Its prices do.", expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'People at {object} lower their voices when they mention {subject}, even in their own quarters.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'What {subject} permits at {object} is called commerce. What it forbids is called smuggling. The line moves.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: '{object} belongs to {subject} the way the drowned belong to the river.', expects: { subject: 'properNoun', object: 'properNoun' } },
    ],
    astronomy: [
      { text: 'Operational authority over {object} is registered to {subject} and has not been re-tendered since issue.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: '{subject} holds the sole operating license for {object}; the renewal process has no public docket.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'All telemetry from {object} clears through relays {subject} maintains.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'Access windows at {object} are allocated by {subject} under a priority formula {subject} declines to publish.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'Independent observation of {object} requires equipment certifications only {subject} issues.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'The audit trail for {object} is complete, consistent, and custodied entirely by {subject}.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: '{subject} classifies the {qualifier|operations} data from {object} as proprietary, including the classification criteria.', expects: { subject: 'properNoun', object: 'properNoun', qualifier: 'nounPhrase' } },
      { text: 'Requests to inspect {object} are neither denied nor scheduled; {subject} maintains the queue.', expects: { subject: 'properNoun', object: 'properNoun' } },
    ],
  },
  spineSummary: {
    text: '{subject} writes the rules everything in {object} has to live by.',
    expects: { subject: 'properNoun', object: 'properNoun' },
  },
  spineSummaryByTone: {
    balanced: [
      { text: '{subject} writes the rules everything in {object} has to live by.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'Whatever else this system argues about, {subject} decides what moves through {object}, and that decides the rest.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'Control of {object} was supposed to be temporary; {subject} has made temporary a form of government.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'The quiet fact under every transaction here: {subject} can close {object}, and everyone prices accordingly.', expects: { subject: 'properNoun', object: 'properNoun' } },
    ],
    cinematic: [
      { text: 'This system has one door, {object} is the door, and {subject} decides who walks through upright.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: '{subject} owns the chokepoint, so {subject} owns the choking.', expects: { subject: 'properNoun' } },
      { text: 'Everything in this system is negotiable except what {subject} says about {object}.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'The system pays its tithe at {object} and calls it a docking fee; {subject} counts it either way.', expects: { subject: 'properNoun', object: 'properNoun' } },
    ],
    astronomy: [
      { text: 'The controlling boundary condition in this system is administrative: {subject} operates {object} without oversight.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'Access to {object} — and therefore to most of what this system produces — is a single-operator function of {subject}.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'Every dataset from this system passes through {object} under {subject}\'s custody chain.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: '{subject}\'s license over {object} predates current standards and is grandfathered past all of them.', expects: { subject: 'properNoun', object: 'properNoun' } },
    ],
  },
  historicalBridge: {
    text: '{subject} founded {object} {historical:era|in the early charters},',
    expects: { subject: 'properNoun', object: 'properNoun' },
  },
  hook: [
    { text: 'What did {subject} pay to lock down {object}?', expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: 'Who in {object} wants {subject} gone?', expects: { subject: 'properNoun', object: 'properNoun' } },
  ],
}
