import type { Settlement, GeneratorTone } from '../../../types'
import type { SeededRng } from '../rng'
import type { SystemRelationshipGraph, RelationshipEdge } from '../graph'

const STRUCTURAL_BOTH: Record<GeneratorTone, readonly string[]> = {
  balanced: [
    '{anchor} occupies {host} and is held in place by {dep}.',
    '{anchor} is anchored to {host}, with {dep} keeping it viable.',
    '{anchor} keeps a footprint on {host} only because of {dep}.',
  ],
  astronomy: [
    '{anchor} is sited on {host} and operates within the envelope set by {dep}.',
    'Per the survey, {anchor} occupies {host} and draws its margin from {dep}.',
    '{anchor} maintains station on {host} against the baseline imposed by {dep}.',
  ],
  cinematic: [
    '{anchor} clings to {host}, and only {dep} keeps it breathing.',
    '{anchor} was driven onto {host}, and {dep} is the reason it still answers.',
    '{anchor} holds ground on {host} on borrowed time, paid for by {dep}.',
  ],
}

const STRUCTURAL_DEPENDS_ONLY: Record<GeneratorTone, readonly string[]> = {
  balanced: [
    '{anchor} keeps its footing only because of {dep}.',
    '{anchor} is wholly tied to {dep} for its continued operation.',
    '{anchor} would not exist in this volume without {dep}.',
  ],
  astronomy: [
    '{anchor} operates inside the envelope defined by {dep}.',
    'Per the dependency record, {anchor} draws its viability from {dep}.',
    '{anchor} is calibrated entirely against the constants {dep} provides.',
  ],
  cinematic: [
    '{anchor} is breathing on the lungs of {dep}, and nothing else.',
    'Cut {dep} loose, and {anchor} goes dark within a season.',
    '{anchor} owes every lit window to {dep}, and the bill is overdue.',
  ],
}

const STRUCTURAL_HOSTS_ONLY: Record<GeneratorTone, readonly string[]> = {
  balanced: [
    '{anchor} maintains its footprint on the body it occupies.',
    '{anchor} is built into this orbital and works the surface from there.',
    '{anchor} took root on {host} and has not moved since.',
  ],
  astronomy: [
    '{anchor} is sited on the host body and operates from that surface.',
    '{anchor} maintains station on this orbital per the original siting record.',
    'Per the survey, {anchor} occupies a fixed footprint on {host}.',
  ],
  cinematic: [
    '{anchor} dug into the body it occupies and refused to leave.',
    '{anchor} was bolted onto this orbital a long time ago, and it shows.',
    '{anchor} clings to {host} like it grew out of the rock.',
  ],
}

const PRESSURE_HAZARD: Record<GeneratorTone, readonly string[]> = {
  balanced: [
    '{hazard} sits across the approach, and {anchor} works around it daily.',
    '{anchor} operates inside the reach of {hazard}, and the margin is thin.',
    'The presence of {hazard} is the standing condition {anchor} plans against.',
  ],
  astronomy: [
    '{hazard} introduces a perturbation that {anchor} corrects against on every cycle.',
    'The amplitude of {hazard} now sits at the edge of {anchor}\'s tolerance margin.',
    '{anchor} logs each pass of {hazard} as a shift in its operating envelope.',
  ],
  cinematic: [
    '{hazard} is closing on {anchor} the way weather closes on a low roof.',
    '{anchor} can hear {hazard} eating at the edges, and nobody talks about it loudly.',
    '{hazard} is the wound {anchor} has stopped trying to dress.',
  ],
}

const PRESSURE_GU: Record<GeneratorTone, readonly string[]> = {
  balanced: [
    'The reading here is high enough that {anchor} accepts the risk and the silence.',
    'There is enough of value under {anchor} to justify both the danger and the secrecy.',
    '{anchor} stays because the yield outweighs everything that wants it gone.',
  ],
  astronomy: [
    'Per the field readings, the local index alone justifies the siting of {anchor}.',
    'The recorded values exceed the threshold at which {anchor} can be cleanly relocated.',
    '{anchor} is sited against an anomaly whose magnitude rules out abandonment.',
  ],
  cinematic: [
    'What lies under {anchor} is rare enough that people stay through worse than this.',
    '{anchor} sits on something hungry, and everyone here has decided to feed it.',
    'The thing beneath {anchor} is worth the bodies it has already cost.',
  ],
}

const PRESSURE_LEGAL: Record<GeneratorTone, readonly string[]> = {
  balanced: [
    'Outside scrutiny is the standing pressure {anchor} plans every shift around.',
    '{anchor} runs quiet because interdiction sits one bad manifest away.',
    'Legal exposure is what shapes {anchor}\'s daily routine more than weather.',
  ],
  astronomy: [
    'Per the standing interdiction filings, {anchor} operates under recurrent legal exposure.',
    'The regulatory amplitude on this site keeps {anchor}\'s public footprint at minimum.',
    'Enforcement perturbations against {anchor} are recorded on a near-quarterly baseline.',
  ],
  cinematic: [
    '{anchor} keeps the lights low because the wrong cutter is always one orbit away.',
    'Every clean week at {anchor} is a week the warrants forgot to land.',
    '{anchor} hides in plain register, and the law is what its people fear by name.',
  ],
}

const PRESSURE_FACTION: Record<GeneratorTone, readonly string[]> = {
  balanced: [
    '{faction} holds authority over {anchor} and sets the terms of its operation.',
    '{anchor} answers to {faction}, even where the paperwork says otherwise.',
    'Control of {anchor} sits with {faction}, and that decides what gets done here.',
  ],
  astronomy: [
    'Per the registry, {faction} retains administrative control over {anchor}.',
    '{anchor} operates under the standing jurisdiction asserted by {faction}.',
    'The control filings on {anchor} resolve to {faction} across every recent interval.',
  ],
  cinematic: [
    '{faction} owns {anchor} in every way that matters, and the locals know it.',
    '{anchor} bends its head to {faction}, and dissent is a quiet career.',
    '{faction} is the hand on the throat of {anchor}, and it has not loosened in years.',
  ],
}

const PRESSURE_HAZARD_PLUS_FACTION: Record<GeneratorTone, readonly string[]> = {
  balanced: [
    'Despite the pressure from {hazard}, {faction} still holds authority over {anchor}.',
    '{faction} keeps its grip on {anchor} even as {hazard} eats at the margins.',
    'Even with {hazard} working against the site, {anchor} remains under {faction}.',
  ],
  astronomy: [
    'Despite the perturbation from {hazard}, {faction} retains operational control of {anchor}.',
    'The amplitude of {hazard} has not displaced {faction}\'s standing claim over {anchor}.',
    '{anchor} continues to register under {faction} across the interval {hazard} has been active.',
  ],
  cinematic: [
    'Even as {hazard} closes in, {faction} will not loosen its grip on {anchor}.',
    '{hazard} is hollowing the ground, and still {faction} holds {anchor} by the collar.',
    '{faction} owns {anchor} through every season of {hazard}, and intends to own it after.',
  ],
}

const PRESENCE_FALLBACK_GU: Record<GeneratorTone, readonly string[]> = {
  balanced: [
    'The local readings alone are enough to justify why {anchor} accepts this exposure.',
    'There is something rare in this volume, and {anchor} is the answer to it.',
    '{anchor} stays because the yield here is not duplicated anywhere nearby.',
  ],
  astronomy: [
    'Per the field index, the local values alone account for the siting of {anchor}.',
    'The recorded magnitude here places {anchor} firmly above the relocation threshold.',
    '{anchor} is calibrated against an anomaly whose values do not appear elsewhere.',
  ],
  cinematic: [
    'Something rare is bleeding through this volume, and {anchor} is here to drink it.',
    'The pull of this place is what built {anchor}, and what keeps it from leaving.',
    '{anchor} stays because what hides here is worth every grave on the manifest.',
  ],
}

const PRESENCE_FALLBACK_RESOURCE: Record<GeneratorTone, readonly string[]> = {
  balanced: [
    'The yields under {anchor} are concrete enough to keep crews on station year over year.',
    '{anchor} exists because the local extraction numbers still close on paper.',
    'There is enough material here that {anchor} pays for itself before midyear.',
  ],
  astronomy: [
    'Per the assay record, the local resource density justifies {anchor}\'s continued operation.',
    'The extraction baselines under {anchor} remain above the threshold for sustained siting.',
    '{anchor} is sited against measured deposits that exceed the regional median.',
  ],
  cinematic: [
    'The ground under {anchor} gives up enough wealth to make staying worth the cost.',
    '{anchor} digs because the seam under it has not run thin in any lifetime here.',
    'What comes out of {anchor} feeds whole markets, and that is the only argument needed.',
  ],
}

const PRESENCE_FALLBACK_STRATEGIC: Record<GeneratorTone, readonly string[]> = {
  balanced: [
    '{anchor} sits on a route that nothing in this volume can move around easily.',
    'Whoever holds {anchor} controls a chokepoint everyone else has to negotiate.',
    '{anchor} occupies the seat from which the surrounding traffic is most easily watched.',
  ],
  astronomy: [
    'Per the trajectory survey, {anchor} occupies a position of high transit leverage.',
    '{anchor} is sited on a corridor whose alternatives carry significantly higher cost.',
    'The geometry around {anchor} concentrates approach vectors into a narrow band.',
  ],
  cinematic: [
    '{anchor} is the door, and everyone who wants through has to knock here.',
    'Holding {anchor} means holding the throat of every route that matters in this volume.',
    '{anchor} sits where ships have to slow, and slow ships always pay.',
  ],
}

const PRESENCE_FALLBACK_HABITABILITY: Record<GeneratorTone, readonly string[]> = {
  balanced: [
    'The local conditions are forgiving enough that {anchor} has never needed heavy shielding.',
    '{anchor} grew here because the body underneath asks less of its people than most.',
    'There is enough breathable margin around {anchor} to keep crews settled long-term.',
  ],
  astronomy: [
    'Per the environmental survey, {anchor} sits within an unusually wide habitability band.',
    'The local atmospheric and thermal baselines fall well inside {anchor}\'s comfort envelope.',
    '{anchor} is sited against tolerances that significantly exceed the regional norm.',
  ],
  cinematic: [
    'The air here is kind, and {anchor} grew the way settlements grow where the world allows it.',
    '{anchor} stayed because for once the ground did not try to kill anyone who landed.',
    'People came to {anchor} for the rare crime of being able to breathe without paying for it.',
  ],
}

const PRESENCE_FALLBACK_GENERIC: Record<GeneratorTone, readonly string[]> = {
  balanced: [
    '{anchor} persists on accumulated infrastructure and the inertia of routine.',
    '{anchor} stays because leaving has always cost more than staying has.',
    '{anchor} is here because someone built it here, and the reasons no longer need re-litigating.',
  ],
  astronomy: [
    'Per the standing record, {anchor} continues to operate within sustainable parameters.',
    'The siting of {anchor} is preserved by installed infrastructure rather than any single peak metric.',
    '{anchor} maintains its position against no dominant factor; the local envelope is simply tolerable.',
  ],
  cinematic: [
    '{anchor} is here because once you build a place, leaving it costs more than enduring it.',
    '{anchor} stays because someone planted a flag, and now the flag is the reason.',
    'No one remembers why {anchor} was first laid down, only that it has not been uprooted.',
  ],
}

export function graphAwareSettlementWhyHere(
  settlement: Settlement,
  graph: SystemRelationshipGraph,
  rng: SeededRng,
  tone: GeneratorTone,
): string {
  const incidentEdgeIds = graph.edgesByEntity[settlement.id] ?? []
  const incidentEdges = incidentEdgeIds
    .map(id => graph.edges.find(e => e.id === id))
    .filter((e): e is RelationshipEdge => e !== undefined)

  const dependsOn = incidentEdges.find(e =>
    e.type === 'DEPENDS_ON' && e.subject.id === settlement.id,
  )
  const hosts = incidentEdges.find(e =>
    e.type === 'HOSTS' && e.object.id === settlement.id,
  )
  const destabilizes = incidentEdges.find(e =>
    e.type === 'DESTABILIZES' && e.object.id === settlement.id,
  )
  const controls = incidentEdges.find(e =>
    e.type === 'CONTROLS' && e.object.id === settlement.id,
  )
  const contests = incidentEdges.find(e => e.type === 'CONTESTS')
  const factionEdge = controls ?? contests

  const anchor = settlement.anchorName.value

  const sentence1 = buildStructuralSentence(anchor, hosts, dependsOn, rng, tone)

  if (sentence1 === null) {
    return buildPresenceFallback(settlement, anchor, rng, tone)
  }

  const sentence2 = buildPressureSentence(
    anchor,
    settlement.id,
    settlement.presence,
    destabilizes,
    factionEdge,
    rng,
    tone,
  )

  return sentence2 ? `${sentence1} ${sentence2}` : sentence1
}

function buildStructuralSentence(
  anchor: string,
  hosts: RelationshipEdge | undefined,
  dependsOn: RelationshipEdge | undefined,
  rng: SeededRng,
  tone: GeneratorTone,
): string | null {
  const host = hosts?.subject.displayName
  const dep = dependsOn?.object.displayName

  if (host && dep) {
    return pickAndFill(STRUCTURAL_BOTH[tone], { anchor, host, dep }, rng)
  }
  if (dep) {
    return pickAndFill(STRUCTURAL_DEPENDS_ONLY[tone], { anchor, dep }, rng)
  }
  if (host) {
    const variants = sharesPrefix(anchor, host)
      ? STRUCTURAL_HOSTS_ONLY[tone].filter(t => !t.includes('{host}'))
      : STRUCTURAL_HOSTS_ONLY[tone]
    if (variants.length === 0) return null
    return pickAndFill(variants, { anchor, host }, rng)
  }
  return null
}

function buildPressureSentence(
  anchor: string,
  settlementId: string,
  presence: Settlement['presence'],
  destabilizes: RelationshipEdge | undefined,
  factionEdge: RelationshipEdge | undefined,
  rng: SeededRng,
  tone: GeneratorTone,
): string | null {
  const hazard = destabilizes?.subject.displayName
  const faction = factionEdge ? factionNameFrom(factionEdge, settlementId) : undefined

  if (hazard && faction) {
    return pickAndFill(PRESSURE_HAZARD_PLUS_FACTION[tone], { anchor, hazard, faction }, rng)
  }
  if (hazard) {
    return pickAndFill(PRESSURE_HAZARD[tone], { anchor, hazard }, rng)
  }
  if (faction) {
    return pickAndFill(PRESSURE_FACTION[tone], { anchor, faction }, rng)
  }
  if (presence.guValue.value >= 2) {
    return pickAndFill(PRESSURE_GU[tone], { anchor }, rng)
  }
  if (presence.legalHeat.value >= 2) {
    return pickAndFill(PRESSURE_LEGAL[tone], { anchor }, rng)
  }
  return null
}

function buildPresenceFallback(
  settlement: Settlement,
  anchor: string,
  rng: SeededRng,
  tone: GeneratorTone,
): string {
  const p = settlement.presence
  if (p.guValue.value >= 3) return pickAndFill(PRESENCE_FALLBACK_GU[tone], { anchor }, rng)
  if (p.resource.value >= 3) return pickAndFill(PRESENCE_FALLBACK_RESOURCE[tone], { anchor }, rng)
  if (p.strategic.value >= 3) return pickAndFill(PRESENCE_FALLBACK_STRATEGIC[tone], { anchor }, rng)
  if (p.habitability.value >= 2) return pickAndFill(PRESENCE_FALLBACK_HABITABILITY[tone], { anchor }, rng)
  return pickAndFill(PRESENCE_FALLBACK_GENERIC[tone], { anchor }, rng)
}

function pickAndFill(
  variants: readonly string[],
  slots: Record<string, string>,
  rng: SeededRng,
): string {
  const template = variants[rng.int(0, variants.length - 1)]
  return Object.entries(slots).reduce(
    (acc, [key, val]) => acc.replaceAll(`{${key}}`, val),
    template,
  )
}

function factionNameFrom(edge: RelationshipEdge, settlementId: string): string {
  return edge.subject.id === settlementId ? edge.object.displayName : edge.subject.displayName
}

function sharesPrefix(a: string, b: string): boolean {
  return a.startsWith(b) || b.startsWith(a)
}
