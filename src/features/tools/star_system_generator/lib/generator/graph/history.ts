import type { SeededRng } from '../rng'
import type {
  EdgeType,
  EntityRef,
  RelationshipEdge,
} from './types'
import { mintEdgeId, stableHashString } from './rules'
import { pickEra, type Era } from './data/eras'
import { templateFor } from './render/templates'
import { resolveSlots, type EdgeRenderContext } from './render/slotResolver'
import { capitalizeForPosition, guardDoubledNoun } from './render/grammarSafety'

type SpineNeedsBackstoryScore = number

const NEEDS_BACKSTORY_BY_TYPE: Record<EdgeType, SpineNeedsBackstoryScore> = {
  HOSTS: 0.0,
  WITNESSES: 0.0,
  CONTROLS: 1.0,
  CONTESTS: 1.0,
  DEPENDS_ON: 1.0,
  CONTRADICTS: 1.0,
  DESTABILIZES: 0.6,
  SUPPRESSES: 0.6,
  HIDES_FROM: 0.0,
  FOUNDED_BY: 0.0,
  BETRAYED: 0.0,
  DISPLACED: 0.0,
}

const PRESENT_TO_HISTORICAL: Partial<Record<EdgeType, EdgeType>> = {
  CONTROLS: 'FOUNDED_BY',
  CONTESTS: 'BETRAYED',
  DEPENDS_ON: 'DISPLACED',
  DESTABILIZES: 'FOUNDED_BY',
  SUPPRESSES: 'BETRAYED',
  CONTRADICTS: 'BETRAYED',
}

export const HISTORICAL_ELIGIBLE_TYPES: ReadonlySet<EdgeType> = new Set(
  Object.keys(PRESENT_TO_HISTORICAL) as EdgeType[]
)

const MAX_HISTORICAL_EDGES = 2

export interface AttachInput {
  spineEdges: RelationshipEdge[]
  rng: SeededRng
}

export interface AttachResult {
  historicalEdges: RelationshipEdge[]
}

export function attachHistoricalEvents(input: AttachInput): AttachResult {
  const candidates = scoreSpineEdges(input.spineEdges)
  if (candidates.length === 0) return { historicalEdges: [] }

  const historyRng = input.rng.fork('history')
  const out: RelationshipEdge[] = []
  for (const candidate of candidates) {
    if (out.length >= MAX_HISTORICAL_EDGES) break
    const histType = PRESENT_TO_HISTORICAL[candidate.edge.type]
    if (!histType) continue

    const era = pickEra(historyRng)
    const histEdge = mintHistoricalEdge(candidate.edge, histType, era)
    if (histEdge !== null) out.push(histEdge)
  }
  return { historicalEdges: out }
}

interface ScoredSpine {
  edge: RelationshipEdge
  score: SpineNeedsBackstoryScore
}

function scoreSpineEdges(spine: ReadonlyArray<RelationshipEdge>): ScoredSpine[] {
  const out: ScoredSpine[] = []
  for (const edge of spine) {
    const score = NEEDS_BACKSTORY_BY_TYPE[edge.type] ?? 0.0
    if (score > 0) out.push({ edge, score })
  }
  out.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return stableHashString(a.edge.id) - stableHashString(b.edge.id)
  })
  return out
}

function mintHistoricalEdge(
  presentEdge: RelationshipEdge,
  histType: EdgeType,
  era: Era,
): RelationshipEdge | null {
  const { subject, object } = pickHistoricalEndpoints(presentEdge, histType)
  if (!subject || !object) return null

  const summary = renderHistoricalSummary({
    subject,
    object,
    qualifier: era,
    edgeType: histType,
    visibility: 'public',
  })
  if (summary === '') return null

  const id = mintEdgeId(`HISTORY:${histType}`, subject.id, object.id, era)
  return {
    id,
    type: histType,
    subject,
    object,
    qualifier: era,
    visibility: 'public',
    confidence: 'inferred',
    groundingFactIds: [...presentEdge.groundingFactIds],
    era: 'historical',
    weight: presentEdge.weight * 0.7,
    approxEra: era,
    summary,
    consequenceEdgeIds: [presentEdge.id],
  }
}

function pickHistoricalEndpoints(
  presentEdge: RelationshipEdge,
  histType: EdgeType,
): { subject: EntityRef | undefined; object: EntityRef | undefined } {
  if (histType === 'DISPLACED') {
    // DISPLACED: subject = the displaced population (dependent = subject of DEPENDS_ON);
    // object = the resource (object of DEPENDS_ON).
    return { subject: presentEdge.subject, object: presentEdge.object }
  }
  return { subject: presentEdge.subject, object: presentEdge.object }
}

function renderHistoricalSummary(ctx: EdgeRenderContext): string {
  const family = templateFor(ctx.edgeType)
  if (family.body.length === 0 || family.body[0].text === '') return ''
  const variant = family.body[0]
  let text = resolveSlots(variant.text, ctx, variant.expects)
  text = capitalizeForPosition(text, 'sentence-start')
  text = guardDoubledNoun(text)
  return text
}
