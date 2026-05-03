import type { SeededRng } from '../../rng'
import type {
  EdgeType, RelationshipEdge, SystemRelationshipGraph,
  SystemStoryOutput,
} from '../types'
import { resolveSlots, type EdgeRenderContext } from './slotResolver'
import {
  capitalizeForPosition, guardDoubledNoun,
  type Position,
} from './grammarSafety'
import { connectiveFor } from './connectives'
import { clusterEdges } from './clusters'
import { templateFor, type EdgeTemplate } from './templates'

export function renderSystemStory(
  graph: SystemRelationshipGraph,
  rng: SeededRng,
): SystemStoryOutput {
  const clusters = clusterEdges(graph)
  const bodyRng = rng.fork('body')

  const body: string[] = []
  const para1 = renderParagraph(clusters.spineCluster, bodyRng)
  if (para1.length > 0) body.push(para1)
  const para2 = renderParagraph(clusters.activeCluster, bodyRng)
  if (para2.length > 0) body.push(para2)
  const para3 = renderParagraph(clusters.epistemicCluster, bodyRng)
  if (para3.length > 0) body.push(para3)

  const spineSummary = renderSpineSummary(graph)
  return {
    spineSummary,
    body,
    hooks: renderHooks(graph, rng.fork('hooks')),
  }
}

function renderHooks(graph: SystemRelationshipGraph, rng: SeededRng): string[] {
  const eligibleEdges = pickHookEligibleEdges(graph)
  const hooks: string[] = []
  const seen = new Set<string>()
  for (const edge of eligibleEdges) {
    if (hooks.length >= 5) break
    const family = templateFor(edge.type)
    if (family.hook.length === 0) continue
    const template = pickVariant(family.hook, rng)
    if (template.text === '') continue
    const ctx: EdgeRenderContext = {
      subject: edge.subject, object: edge.object, qualifier: edge.qualifier,
      edgeType: edge.type, visibility: edge.visibility,
    }
    let rendered = resolveSlots(template.text, ctx, template.expects)
    rendered = capitalizeForPosition(rendered, 'sentence-start')
    rendered = guardDoubledNoun(rendered)
    if (seen.has(rendered)) continue
    seen.add(rendered)
    hooks.push(rendered)
  }
  return hooks
}

function pickHookEligibleEdges(graph: SystemRelationshipGraph): RelationshipEdge[] {
  const spineIds = new Set(graph.spineEdgeIds)
  const seenIds = new Set<string>()
  const out: RelationshipEdge[] = []

  for (const e of graph.edges) {
    if (e.visibility === 'contested' && !seenIds.has(e.id)) {
      out.push(e)
      seenIds.add(e.id)
    }
  }
  for (const e of graph.edges) {
    if (e.visibility === 'hidden' && !seenIds.has(e.id)) {
      out.push(e)
      seenIds.add(e.id)
    }
  }
  for (const e of graph.edges) {
    if (spineIds.has(e.id)) continue
    if (seenIds.has(e.id)) continue
    if (e.type === 'CONTESTS' || e.type === 'DESTABILIZES' || e.type === 'SUPPRESSES') {
      out.push(e)
      seenIds.add(e.id)
    }
  }
  return out
}

function renderSpineSummary(graph: SystemRelationshipGraph): string {
  const topSpineId = graph.spineEdgeIds[0]
  if (!topSpineId) return ''
  const edge = graph.edges.find(e => e.id === topSpineId)
  if (!edge) return ''
  const family = templateFor(edge.type)
  if (family.spineSummary.text === '') return ''

  const linkedHistorical = findLinkedHistoricalEdge(graph, edge.id)
  const ctx: EdgeRenderContext = {
    subject: edge.subject,
    object: edge.object,
    qualifier: edge.qualifier,
    edgeType: edge.type,
    visibility: edge.visibility,
    historical: linkedHistorical
      ? { summary: linkedHistorical.summary, era: linkedHistorical.approxEra }
      : undefined,
  }

  const bridgeText = (linkedHistorical && family.historicalBridge.text !== '')
    ? renderClause(family.historicalBridge, ctx)
    : ''
  const summaryText = renderClause(family.spineSummary, ctx)

  if (bridgeText === '') return summaryText
  return composeSpineSummary(bridgeText, summaryText)
}

function findLinkedHistoricalEdge(
  graph: SystemRelationshipGraph,
  spineEdgeId: string,
): RelationshipEdge | undefined {
  for (const edge of graph.edges) {
    if (edge.era !== 'historical') continue
    if (edge.consequenceEdgeIds?.includes(spineEdgeId)) return edge
  }
  return undefined
}

function renderClause(template: EdgeTemplate, ctx: EdgeRenderContext): string {
  let result = resolveSlots(template.text, ctx, template.expects)
  result = capitalizeForPosition(result, 'sentence-start')
  result = guardDoubledNoun(result)
  return result
}

function composeSpineSummary(bridge: string, summary: string): string {
  if (summary.length === 0) return bridge
  const first = summary[0]
  // Bridge ends mid-sentence (',' or '—'), so the summary continues the same
  // sentence. Lowercase a leading uppercase-alphabetic char (proper-noun head);
  // leave already-lowercase or non-alphabetic leads (quote, digit) intact.
  const isUppercaseAlpha = first === first.toUpperCase() && first !== first.toLowerCase()
  const head = isUppercaseAlpha ? first.toLowerCase() : first
  return `${bridge} ${head}${summary.slice(1)}`
}

function renderParagraph(edges: ReadonlyArray<RelationshipEdge>, rng: SeededRng): string {
  if (edges.length === 0) return ''
  const sentences: string[] = []
  let prev: EdgeType | undefined
  for (const edge of edges) {
    const sentence = renderEdgeSentence(edge, prev, rng)
    if (sentence.length === 0) continue
    sentences.push(sentence)
    prev = edge.type
  }
  return sentences.join(' ')
}

function renderEdgeSentence(
  edge: RelationshipEdge,
  prev: EdgeType | undefined,
  rng: SeededRng,
): string {
  const family = templateFor(edge.type)
  if (family.body.length === 0 || family.body[0].text === '') return ''
  const variant = pickVariant(family.body, rng)
  const ctx: EdgeRenderContext = {
    subject: edge.subject,
    object: edge.object,
    qualifier: edge.qualifier,
    edgeType: edge.type,
    visibility: edge.visibility,
  }
  const rendered = renderTemplate(variant, ctx, prev === undefined ? 'sentence-start' : 'mid-clause')
  const connective = connectiveFor(prev, edge.type)
  return connective + rendered
}

function renderTemplate(
  template: EdgeTemplate,
  ctx: EdgeRenderContext,
  position: Position,
): string {
  let result = resolveSlots(template.text, ctx, template.expects)
  result = capitalizeForPosition(result, position)
  result = guardDoubledNoun(result)
  return result
}

function pickVariant(variants: ReadonlyArray<EdgeTemplate>, rng: SeededRng): EdgeTemplate {
  if (variants.length === 0) throw new Error('renderSystemStory: empty variants array')
  if (variants.length === 1) return variants[0]
  const index = Math.floor(rng.next() * variants.length)
  return variants[index]
}
