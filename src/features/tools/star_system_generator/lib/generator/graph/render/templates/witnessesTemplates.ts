import type { EdgeTemplateFamily } from './types'

// WITNESSES edges: subject = settlement (with AI) or ruin; object = ruin or system.
// Qualifier (when set) is an era marker like 'first wave' or 'before the quarantine'.
export const witnessesTemplates: EdgeTemplateFamily = {
  edgeType: 'WITNESSES',
  body: [
    { text: '{subject} is the only thing in the system that remembers {object:article} firsthand.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
    { text: '{subject} carries an unbroken chain of records back to {object:article}.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
    { text: 'What {object:article} was, only {subject} can still describe.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
    { text: '{subject} watched {object:article} happen and never deleted the logs.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
    { text: 'The testimony {subject} holds about {object:article} is complete, timestamped, and inadmissible.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
    { text: '{subject} was never supposed to be recording when {object:article} happened; that is precisely the value of the record.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
    { text: 'What {subject} saw of {object:article} contradicts what was filed, and the filer has rank.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
    { text: 'Every year {subject} survives, the official account of {object:article} gets harder to keep.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
  ],
  bodyByTone: {
    cinematic: [
      { text: '{subject} remembers {object:article}, and remembering out here is a form of ammunition.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'There is one witness left to {object:article}, and it is {subject}, and it does not blink.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'What {subject} knows about {object:article} would fill a courtroom nobody dares to build.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: '{subject} keeps the memory of {object:article} the way a family keeps a debt.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'People come to {subject} to ask about {object:article}, and leave having decided not to.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'The last honest account of {object:article} lives in {subject}, which is why certain parties price {subject}\'s decommissioning annually.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: '{subject} saw {object:article}. The system has been negotiating with that fact ever since.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'Memory is cheap to erase and expensive to have erased; {subject} knows the second price for {object:article}.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
    ],
    astronomy: [
      { text: '{subject} holds the only contemporaneous instrument record of {object:article}.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'Reconstruction of {object:article} depends on a single uncorroborated archive at {subject}.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'The observation logs at {subject} covering {object:article} predate every surviving cross-check.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: '{subject}\'s record of {object:article} has never been independently verified — and never impeached.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'Chain of custody for the {object:article} data runs unbroken through {subject} and nowhere else.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'Every published timeline of {object:article} footnotes the same source: {subject}.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'The raw frames of {object:article} exist only in {subject}\'s cold storage, on media past rated life.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'What is known about {object:article} and what {subject} recorded are, at present, the same dataset.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
    ],
  },
  spineSummary: {
    text: '{subject} is the last living memory of {object:article}.',
    expects: { subject: 'properNoun', object: 'nounPhrase' },
  },
  spineSummaryByTone: {
    balanced: [
      { text: '{subject} is the last living memory of {object:article}.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'This system\'s history has one custodian left — {subject} — and several parties who would prefer zero.', expects: { subject: 'properNoun' } },
      { text: 'Whatever this system decides to believe about {object:article}, {subject} holds the version that happened.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'The past of this system is not settled; it is stored, at {subject}, under conditions nobody audits.', expects: { subject: 'properNoun' } },
    ],
    cinematic: [
      { text: 'This system buried its history once already; {subject} is where the burial failed.', expects: { subject: 'properNoun' } },
      { text: 'One memory of {object:article} survives, it lives at {subject}, and half the system\'s politics is the question of how long.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: '{subject} remembers what the system agreed to forget, and the agreement is starting to show its seams.', expects: { subject: 'properNoun' } },
      { text: 'The truth about {object:article} is not lost. It is kept — at {subject} — which is a more dangerous condition.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
    ],
    astronomy: [
      { text: 'The evidentiary base for this system\'s history narrows to a single archive: {subject}.', expects: { subject: 'properNoun' } },
      { text: 'All reconstruction of {object:article} inherits the systematics of one source — {subject}.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
      { text: 'This system\'s deep record has a single point of failure, and it is {subject}.', expects: { subject: 'properNoun' } },
      { text: '{subject} is simultaneously the system\'s oldest instrument and its only witness to {object:article}; both facts appear in no maintenance budget.', expects: { subject: 'properNoun', object: 'nounPhrase' } },
    ],
  },
  historicalBridge: [],
  hook: [
    { text: 'Who would pay to read what {subject} actually saw?', expects: { subject: 'properNoun' } },
    { text: 'Who would pay to make sure {subject} forgets?', expects: { subject: 'properNoun' } },
    { text: 'What does {subject} remember about {qualifier|that era} that nothing else does?', expects: { subject: 'properNoun', qualifier: 'nounPhrase' } },
  ],
}
