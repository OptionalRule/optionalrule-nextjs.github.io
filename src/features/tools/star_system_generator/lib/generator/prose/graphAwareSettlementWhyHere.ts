import type { Settlement, GeneratorTone } from '../../../types'
import type { SeededRng } from '../rng'
import type { SystemRelationshipGraph, RelationshipEdge } from '../graph'

// Slot contract: {settlement} is the grammatical actor (the people/site),
// {anchor} is the place it occupies, {host}/{dep}/{hazard}/{faction} are
// graph-derived referents. The anchor never takes a volitional verb.

const STRUCTURAL_BOTH: Record<GeneratorTone, readonly string[]> = {
  balanced: [
    '{settlement} occupies {host} and is held in place by {dep}.',
    '{settlement} is anchored to {host}, with {dep} keeping it viable.',
    '{settlement} keeps a footprint on {host} only because of {dep}.',
  ],
  astronomy: [
    '{settlement} is sited on {host} and operates within the envelope set by {dep}.',
    'Per the survey, {settlement} occupies {host} and draws its margin from {dep}.',
    '{settlement} maintains station on {host} against the baseline imposed by {dep}.',
  ],
  cinematic: [
    '{settlement} clings to {host}, and only {dep} keeps it breathing.',
    '{settlement} was driven onto {host}, and {dep} is the reason it still answers.',
    '{settlement} holds ground on {host} on borrowed time, paid for by {dep}.',
  ],
}

const STRUCTURAL_DEPENDS_ONLY: Record<GeneratorTone, readonly string[]> = {
  balanced: [
    '{settlement} keeps its footing only because of {dep}.',
    '{settlement} is wholly tied to {dep} for its continued operation.',
    '{settlement} would not exist in this volume without {dep}.',
  ],
  astronomy: [
    '{settlement} operates inside the envelope defined by {dep}.',
    'Per the dependency record, {settlement} draws its viability from {dep}.',
    '{settlement} is calibrated entirely against the constants {dep} provides.',
  ],
  cinematic: [
    '{settlement} is breathing on the lungs of {dep}, and nothing else.',
    'Cut {dep} loose, and {settlement} goes dark within a season.',
    '{settlement} owes every lit window to {dep}, and the bill is overdue.',
  ],
}

const STRUCTURAL_HOSTS_ONLY: Record<GeneratorTone, readonly string[]> = {
  balanced: [
    '{settlement} maintains its footprint on the ground beneath it.',
    '{settlement} is built into {host} and works the surface from there.',
    '{settlement} took root on {host} and has not moved since.',
  ],
  astronomy: [
    '{settlement} is sited on the host body and operates from that surface.',
    '{settlement} maintains station on its anchor per the original siting record.',
    'Per the survey, {settlement} occupies a fixed footprint on {host}.',
  ],
  cinematic: [
    '{settlement} dug into the ground it occupies and refused to leave.',
    '{settlement} was bolted onto its anchor a long time ago, and it shows.',
    '{settlement} clings to {host} like it grew out of the rock.',
  ],
}

const PRESSURE_HAZARD: Record<GeneratorTone, readonly string[]> = {
  balanced: [
    '{hazard} sits across the approach, and {settlement} works around it daily.',
    '{settlement} operates inside the reach of {hazard}, and the margin is thin.',
    'The presence of {hazard} is the standing condition {settlement} plans against.',
  ],
  astronomy: [
    '{hazard} introduces a perturbation that {settlement} corrects against on every cycle.',
    "The amplitude of {hazard} now sits at the edge of {settlement}'s tolerance margin.",
    '{settlement} logs each pass of {hazard} as a shift in its operating envelope.',
  ],
  cinematic: [
    '{hazard} is closing on {settlement} the way weather closes on a low roof.',
    '{settlement} can hear {hazard} eating at the edges, and nobody talks about it loudly.',
    '{hazard} is the wound {settlement} has stopped trying to dress.',
  ],
}

const PRESSURE_GU: Record<GeneratorTone, readonly string[]> = {
  balanced: [
    'The reading here is high enough that {settlement} accepts the risk and the silence.',
    'There is enough of value under {anchor} to justify both the danger and the secrecy.',
    '{settlement} stays because the yield outweighs everything that wants it gone.',
  ],
  astronomy: [
    'Per the field readings, the local index alone justifies the siting of {settlement}.',
    'The recorded values exceed the threshold at which {settlement} can be cleanly relocated.',
    '{settlement} is sited against an anomaly whose magnitude rules out abandonment.',
  ],
  cinematic: [
    'What lies under {anchor} is rare enough that people stay through worse than this.',
    '{settlement} sits on something hungry, and everyone here has decided to feed it.',
    'The thing beneath {anchor} is worth the bodies it has already cost.',
  ],
}

const PRESSURE_LEGAL: Record<GeneratorTone, readonly string[]> = {
  balanced: [
    'Outside scrutiny is the standing pressure {settlement} plans every shift around.',
    '{settlement} runs quiet because interdiction sits one bad manifest away.',
    "Legal exposure is what shapes {settlement}'s daily routine more than weather.",
  ],
  astronomy: [
    'Per the standing interdiction filings, {settlement} operates under recurrent legal exposure.',
    "The regulatory amplitude on this site keeps {settlement}'s public footprint at minimum.",
    'Enforcement perturbations against {settlement} are recorded on a near-quarterly baseline.',
  ],
  cinematic: [
    '{settlement} keeps the lights low because the wrong cutter is always one orbit away.',
    'Every clean week at {settlement} is a week the warrants forgot to land.',
    '{settlement} hides in plain register, and the law is what its people fear by name.',
  ],
}

const PRESSURE_FACTION: Record<GeneratorTone, readonly string[]> = {
  balanced: [
    '{faction} holds authority over {settlement} and sets the terms of its operation.',
    '{settlement} answers to {faction}, even where the paperwork says otherwise.',
    'Control of {settlement} sits with {faction}, and that decides what gets done here.',
  ],
  astronomy: [
    'Per the registry, {faction} retains administrative control over {settlement}.',
    '{settlement} operates under the standing jurisdiction asserted by {faction}.',
    'The control filings on {settlement} resolve to {faction} across every recent interval.',
  ],
  cinematic: [
    '{faction} owns {settlement} in every way that matters, and the locals know it.',
    '{settlement} bends its head to {faction}, and dissent is a quiet career.',
    '{faction} is the hand on the throat of {settlement}, and it has not loosened in years.',
  ],
}

const PRESSURE_HAZARD_PLUS_FACTION: Record<GeneratorTone, readonly string[]> = {
  balanced: [
    'Despite the pressure from {hazard}, {faction} still holds authority over {settlement}.',
    '{faction} keeps its grip on {settlement} even as {hazard} eats at the margins.',
    'Even with {hazard} working against the site, {settlement} remains under {faction}.',
  ],
  astronomy: [
    'Despite the perturbation from {hazard}, {faction} retains operational control of {settlement}.',
    "The amplitude of {hazard} has not displaced {faction}'s standing claim over {settlement}.",
    '{settlement} continues to register under {faction} across the interval {hazard} has been active.',
  ],
  cinematic: [
    'Even as {hazard} closes in, {faction} will not loosen its grip on {settlement}.',
    '{hazard} is hollowing the ground, and still {faction} holds {settlement} by the collar.',
    '{faction} owns {settlement} through every season of {hazard}, and intends to own it after.',
  ],
}

const PRESENCE_FALLBACK_GU: Record<GeneratorTone, readonly string[]> = {
  balanced: [
    'The local readings alone are enough to justify why {settlement} accepts this exposure.',
    'There is something rare in this volume, and {settlement} is the answer to it.',
    '{settlement} stays because the yield here is not duplicated anywhere nearby.',
  ],
  astronomy: [
    'Per the field index, the local values alone account for the siting of {settlement}.',
    'The recorded magnitude here places {settlement} firmly above the relocation threshold.',
    '{settlement} is calibrated against an anomaly whose values do not appear elsewhere.',
  ],
  cinematic: [
    'Something rare is bleeding through this volume, and {settlement} is here to drink it.',
    'The pull of this place is what built {settlement}, and what keeps it from leaving.',
    '{settlement} stays because what hides here is worth every grave on the manifest.',
  ],
}

const PRESENCE_FALLBACK_RESOURCE: Record<GeneratorTone, readonly string[]> = {
  balanced: [
    'The yields under {anchor} are concrete enough to keep crews on station year over year.',
    '{settlement} exists because the local extraction numbers still close on paper.',
    'There is enough material here that {settlement} pays for itself before midyear.',
  ],
  astronomy: [
    "Per the assay record, the local resource density justifies {settlement}'s continued operation.",
    'The extraction baselines under {anchor} remain above the threshold for sustained siting.',
    '{settlement} is sited against measured deposits that exceed the regional median.',
  ],
  cinematic: [
    'The ground under {anchor} gives up enough wealth to make staying worth the cost.',
    '{settlement} digs because the seam under it has not run thin in any lifetime here.',
    'What comes out of {settlement} feeds whole markets, and that is the only argument needed.',
  ],
}

const PRESENCE_FALLBACK_STRATEGIC: Record<GeneratorTone, readonly string[]> = {
  balanced: [
    '{settlement} sits on a route that nothing in this volume can move around easily.',
    'Whoever holds {settlement} controls a chokepoint everyone else has to negotiate.',
    '{settlement} occupies the seat from which the surrounding traffic is most easily watched.',
  ],
  astronomy: [
    'Per the trajectory survey, {settlement} occupies a position of high transit leverage.',
    '{settlement} is sited on a corridor whose alternatives carry significantly higher cost.',
    'The geometry around {anchor} concentrates approach vectors into a narrow band.',
  ],
  cinematic: [
    '{settlement} is the door, and everyone who wants through has to knock here.',
    'Holding {settlement} means holding the throat of every route that matters in this volume.',
    '{settlement} sits where ships have to slow, and slow ships always pay.',
  ],
}

const PRESENCE_FALLBACK_HABITABILITY: Record<GeneratorTone, readonly string[]> = {
  balanced: [
    'The local conditions are forgiving enough that {settlement} has never needed heavy shielding.',
    '{settlement} grew here because the ground underneath asks less of its people than most.',
    'There is enough breathable margin around {anchor} to keep crews settled long-term.',
  ],
  astronomy: [
    'Per the environmental survey, {settlement} sits within an unusually wide habitability band.',
    "The local atmospheric and thermal baselines fall well inside {settlement}'s comfort envelope.",
    '{settlement} is sited against tolerances that significantly exceed the regional norm.',
  ],
  cinematic: [
    'The air here is kind, and {settlement} grew the way settlements grow where the world allows it.',
    '{settlement} stayed because for once the ground did not try to kill anyone who landed.',
    'People came to {settlement} for the rare crime of being able to breathe without paying for it.',
  ],
}

const PRESENCE_FALLBACK_GENERIC: Record<GeneratorTone, readonly string[]> = {
  balanced: [
    '{settlement} persists on accumulated infrastructure and the inertia of routine.',
    '{settlement} stays because leaving has always cost more than staying has.',
    '{settlement} is here because someone built it here, and the reasons no longer need re-litigating.',
  ],
  astronomy: [
    'Per the standing record, {settlement} continues to operate within sustainable parameters.',
    'The siting of {settlement} is preserved by installed infrastructure rather than any single peak metric.',
    '{settlement} maintains its position against no dominant factor; the local envelope is simply tolerable.',
  ],
  cinematic: [
    '{settlement} is here because once you build a place, leaving it costs more than enduring it.',
    '{settlement} stays because someone planted a flag, and now the flag is the reason.',
    'No one remembers why {settlement} was first laid down, only that it has not been uprooted.',
  ],
}

const ALL_POOLS = [
  STRUCTURAL_BOTH, STRUCTURAL_DEPENDS_ONLY, STRUCTURAL_HOSTS_ONLY,
  PRESSURE_HAZARD, PRESSURE_GU, PRESSURE_LEGAL, PRESSURE_FACTION,
  PRESSURE_HAZARD_PLUS_FACTION, PRESENCE_FALLBACK_GU, PRESENCE_FALLBACK_RESOURCE,
  PRESENCE_FALLBACK_STRATEGIC, PRESENCE_FALLBACK_HABITABILITY, PRESENCE_FALLBACK_GENERIC,
]

export const ALL_WHY_HERE_TEMPLATES: readonly string[] = ALL_POOLS.flatMap(pool =>
  Object.values(pool).flat(),
)

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

  const site = settlement.name.value
  const anchor = settlement.anchorName.value

  const sentence1 = buildStructuralSentence(site, anchor, hosts, dependsOn, rng, tone)

  if (sentence1 === null) {
    return buildPresenceFallback(settlement, site, anchor, rng, tone)
  }

  const sentence2 = buildPressureSentence(
    site,
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
  site: string,
  anchor: string,
  hosts: RelationshipEdge | undefined,
  dependsOn: RelationshipEdge | undefined,
  rng: SeededRng,
  tone: GeneratorTone,
): string | null {
  const host = hosts?.subject.displayName
  const dep = dependsOn?.object.displayName

  if (host && dep) {
    return pickAndFill(STRUCTURAL_BOTH[tone], { settlement: site, anchor, host, dep }, rng)
  }
  if (dep) {
    return pickAndFill(STRUCTURAL_DEPENDS_ONLY[tone], { settlement: site, anchor, dep }, rng)
  }
  if (host) {
    const variants = sharesPrefix(site, host)
      ? STRUCTURAL_HOSTS_ONLY[tone].filter(t => !t.includes('{host}'))
      : STRUCTURAL_HOSTS_ONLY[tone]
    if (variants.length === 0) return null
    return pickAndFill(variants, { settlement: site, anchor, host }, rng)
  }
  return null
}

function buildPressureSentence(
  site: string,
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
    return pickAndFill(PRESSURE_HAZARD_PLUS_FACTION[tone], { settlement: site, anchor, hazard, faction }, rng)
  }
  if (hazard) {
    return pickAndFill(PRESSURE_HAZARD[tone], { settlement: site, anchor, hazard }, rng)
  }
  if (faction) {
    return pickAndFill(PRESSURE_FACTION[tone], { settlement: site, anchor, faction }, rng)
  }
  if (presence.guValue.value >= 2) {
    return pickAndFill(PRESSURE_GU[tone], { settlement: site, anchor }, rng)
  }
  if (presence.legalHeat.value >= 2) {
    return pickAndFill(PRESSURE_LEGAL[tone], { settlement: site, anchor }, rng)
  }
  return null
}

function buildPresenceFallback(
  settlement: Settlement,
  site: string,
  anchor: string,
  rng: SeededRng,
  tone: GeneratorTone,
): string {
  const p = settlement.presence
  if (p.guValue.value >= 3) return pickAndFill(PRESENCE_FALLBACK_GU[tone], { settlement: site, anchor }, rng)
  if (p.resource.value >= 3) return pickAndFill(PRESENCE_FALLBACK_RESOURCE[tone], { settlement: site, anchor }, rng)
  if (p.strategic.value >= 3) return pickAndFill(PRESENCE_FALLBACK_STRATEGIC[tone], { settlement: site, anchor }, rng)
  if (p.habitability.value >= 2) return pickAndFill(PRESENCE_FALLBACK_HABITABILITY[tone], { settlement: site, anchor }, rng)
  return pickAndFill(PRESENCE_FALLBACK_GENERIC[tone], { settlement: site, anchor }, rng)
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
