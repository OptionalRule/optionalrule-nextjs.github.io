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
    hooks: [],
  }
}

function renderSpineSummary(graph: SystemRelationshipGraph): string {
  const topSpineId = graph.spineEdgeIds[0]
  if (!topSpineId) return ''
  const edge = graph.edges.find(e => e.id === topSpineId)
  if (!edge) return ''
  const family = templateFor(edge.type)
  const template = family.spineSummary
  if (template.text === '') return ''
  const ctx: EdgeRenderContext = {
    subject: edge.subject,
    object: edge.object,
    qualifier: edge.qualifier,
    edgeType: edge.type,
    visibility: edge.visibility,
  }
  let result = resolveSlots(template.text, ctx)
  result = capitalizeForPosition(result, 'sentence-start')
  result = guardDoubledNoun(result)
  return result
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
  let result = resolveSlots(template.text, ctx)
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
