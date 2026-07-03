import type { SeededRng } from '../rng'
import type { EdgeType, EntityRef, RelationshipEdge } from '../graph/types'

export const PRESSURE_POOLS: Record<EdgeType, readonly string[]> = {
  CONTESTS: [
    'there is only one {stake}, and two charters that each name it',
    'the arbitration that used to settle this dissolved with its sponsor',
    'prices around {stake} have tripled since the last safe-window season',
    'both sides armed their inspectors in the same quarter',
    'every neutral broker who touched this dispute has since recused or vanished',
  ],
  DESTABILIZES: [
    '{subject} does not negotiate and does not stop',
    'the safety margins were drawn before {subject} started moving',
    'every mitigation contract written against {subject} has lapsed or failed',
    'the insurers have quietly reclassified everything near {subject}',
    'evacuation drills have gone from annual to weekly without an announcement',
  ],
  DEPENDS_ON: [
    'there is no second source for {stake}, and everyone has done the math',
    'the dependency was supposed to be temporary; the paperwork still says so',
    'stockpiles cover weeks, and the renegotiation is scheduled in months',
    'the supply contract renews on terms nobody has seen yet',
    'redundancy was cut three budgets ago and never restored',
  ],
  CONTROLS: [
    'control of {stake} was granted in an emergency that officially ended years ago',
    'the charter behind the control clause has never survived a public reading',
    'fees at {stake} rise each quarter and the ledger explaining why is sealed',
    'the inspection that would confirm the control is legal keeps being postponed',
    'every appeal routes through the office that profits from denying it',
  ],
  SUPPRESSES: [
    'the record being sat on gets heavier every season it stays buried',
    'too many people handled the original evidence for the silence to hold',
    'the suppression order cites a danger nobody has been allowed to verify',
    'a copy exists, and both sides price their choices as if it will surface',
    'the officials enforcing the quiet no longer agree on what they are protecting',
  ],
  CONTRADICTS: [
    'two instruments read the same event and disagree, and both are certified',
    'the official account requires a timeline the physical evidence refuses',
    'each side archives its own version and audits the other\'s',
    'the discrepancy is small enough to ignore and expensive enough not to',
    'someone corrected the record, and the correction is what does not fit',
  ],
  WITNESSES: [
    'the only account of what happened lives in memory nobody can subpoena',
    'the witness was never supposed to be running during the event',
    'what was seen contradicts what was filed, and the filer has rank',
    'the testimony is complete, timestamped, and inadmissible',
    'every year the witness survives, the official version gets harder to keep',
  ],
  HIDES_FROM: [
    'staying invisible costs more each audit cycle',
    'the hiding place was chosen in a hurry and has been permanent ever since',
    'the seekers have widened their sweep pattern two seasons running',
    'somebody outside the secret has started asking precise questions',
    'the cover story has outlived the people who could maintain it',
  ],
  HOSTS: [
    'the site holds more than it was rated for and the ratings office knows',
    'the ground lease predates the settlement built on top of it',
    'what the site hosts and what it declares have drifted apart',
    'expansion ate the buffer zones years ago',
    'the anchor infrastructure is original, and original is now a warning label',
  ],
  FOUNDED_BY: [
    'the founding charter names obligations nobody alive has read',
    'the founders\' debts did not dissolve with the founders',
    'what the founding was for and what it became no longer share a purpose',
    'the founding claim survives on documents stored with the rival who disputes them',
    'every anniversary the founding story gets retold with one fewer inconvenient name',
  ],
  BETRAYED: [
    'the betrayal was priced in long ago; the interest was not',
    'both successors inherited the feud without inheriting the reasons',
    'the reconciliation everyone cites was never actually signed',
    'the side that broke faith kept the assets, and the assets kept appreciating',
    'the last neutral witness to the break just died, and the story is loose',
  ],
  DISPLACED: [
    'the displaced kept their claim registered and their children angry',
    'the land taken has appreciated; the apology has not',
    'resettlement was recorded as voluntary by the office that ordered it',
    'the displacement route is still walked once a year, and attendance is growing',
    'the compensation fund exists, is solvent, and has never approved a claim',
  ],
}

export function derivePressure(
  edge: RelationshipEdge,
  stakeRef: EntityRef | null,
  rng: SeededRng,
): string {
  const pool = PRESSURE_POOLS[edge.type]
  const phrase = pool[rng.int(0, pool.length - 1)]
  return phrase
    .replaceAll('{subject}', edge.subject.displayName)
    .replaceAll('{stake}', stakeRef ? stakeRef.displayName : 'the prize')
}
