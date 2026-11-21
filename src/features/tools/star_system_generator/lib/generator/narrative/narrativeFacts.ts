import type {
  Fact,
  GenerationOptions,
  GuOverlay,
  HumanRemnant,
  NarrativeFact,
  OrbitingBody,
  Reachability,
  Settlement,
  Star,
  StellarCompanion,
  SystemPhenomenon,
} from '../../../types'
import { domainsForGuValue } from '../data/gu'
import { fact } from '../fact'
import { generateFactions } from '../factions'
import { lowerFirst, sentenceFragment } from '../prose/helpers'
import type { SeededRng } from '../rng'
import { classifyNarrativeDomains, type NarrativeDomain } from './domains'
import { uniqueStrings } from './uniqueStrings'

export interface NarrativeGenerationContext {
  options: GenerationOptions
  systemName: Fact<string>
  primary: Star
  companions: StellarCompanion[]
  reachability: Reachability
  architectureName: string
  bodies: OrbitingBody[]
  guOverlay: GuOverlay
  settlements: Settlement[]
  ruins: HumanRemnant[]
  phenomena: SystemPhenomenon[]
  factionRng: SeededRng
}

function narrativeFact(input: {
  id: string
  kind: string
  subjectType: NarrativeFact['subjectType']
  subjectId?: string
  value: string
  confidence: Fact<string>['confidence']
  source: string
  sourcePath: string
  tags?: string[]
  status?: NarrativeFact['status']
  domains?: NarrativeDomain[]
}): NarrativeFact {
  const tags = uniqueStrings([...(input.tags ?? []), input.kind, input.subjectType])
  const domains = uniqueStrings(input.domains ?? classifyNarrativeDomains(`${input.kind} ${input.value} ${tags.join(' ')}`))

  return {
    id: input.id,
    kind: input.kind,
    domains,
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    value: fact(input.value, input.confidence, input.source),
    tags,
    status: input.status ?? 'established',
    sourcePath: input.sourcePath,
  }
}

function radiationCreatesNarrativeHazard(value: string): boolean {
  return !/^(benign|manageable)$/i.test(value.trim())
}

export function buildNarrativeFacts(ctx: NarrativeGenerationContext): NarrativeFact[] {
  const factions = generateFactions(ctx.factionRng, ctx.options.tone, 8)
  const facts: NarrativeFact[] = [
    narrativeFact({
      id: 'system.reachability',
      kind: 'route.reachability',
      subjectType: 'route',
      value: ctx.reachability.className.value,
      confidence: ctx.reachability.className.confidence,
      source: 'Narrative context from generated reachability class',
      sourcePath: 'reachability.className',
      tags: ['route', 'access'],
      domains: ['route-weather', 'trade', 'exploration', 'governance'],
    }),
    narrativeFact({
      id: 'system.architecture',
      kind: 'system.architecture',
      subjectType: 'system',
      value: ctx.architectureName,
      confidence: 'inferred',
      source: 'Narrative context from generated architecture',
      sourcePath: 'architecture.name',
      tags: ['physical'],
      domains: ['exploration', 'science'],
    }),
    narrativeFact({
      id: 'star.activity',
      kind: 'star.activity',
      subjectType: 'star',
      subjectId: ctx.primary.id,
      value: ctx.primary.activity.value,
      confidence: ctx.primary.activity.confidence,
      source: 'Narrative context from generated stellar activity',
      sourcePath: 'primary.activity',
      tags: ['physical', 'hazard'],
      domains: ['stellar-events', 'science', 'disaster', 'public-life'],
    }),
    narrativeFact({
      id: 'gu.intensity',
      kind: 'gu.intensity',
      subjectType: 'gu',
      value: ctx.guOverlay.intensity.value,
      confidence: ctx.guOverlay.intensity.confidence,
      source: 'Narrative context from generated GU intensity',
      sourcePath: 'guOverlay.intensity',
      tags: ['gu'],
      domains: ['route-weather', 'science', 'trade', 'disaster'],
    }),
    narrativeFact({
      id: 'gu.resource',
      kind: 'gu.resource',
      subjectType: 'gu',
      value: ctx.guOverlay.resource.value,
      confidence: ctx.guOverlay.resource.confidence,
      source: 'Narrative context from generated GU resource',
      sourcePath: 'guOverlay.resource',
      tags: ['gu', 'resource'],
      domains: domainsForGuValue('resources', ctx.guOverlay.resource.value, ['trade', 'science', 'crime']),
    }),
    narrativeFact({
      id: 'gu.hazard',
      kind: 'gu.hazard',
      subjectType: 'gu',
      value: ctx.guOverlay.hazard.value,
      confidence: ctx.guOverlay.hazard.confidence,
      source: 'Narrative context from generated GU hazard',
      sourcePath: 'guOverlay.hazard',
      tags: ['gu', 'hazard'],
      domains: domainsForGuValue('hazards', ctx.guOverlay.hazard.value, ['disaster', 'science', 'governance']),
    }),
    narrativeFact({
      id: 'gu.bleed-location',
      kind: 'gu.bleedLocation',
      subjectType: 'gu',
      value: ctx.guOverlay.bleedLocation.value,
      confidence: ctx.guOverlay.bleedLocation.confidence,
      source: 'Narrative context from generated GU bleed location',
      sourcePath: 'guOverlay.bleedLocation',
      tags: ['gu', 'routeAsset'],
      domains: domainsForGuValue('bleedLocations', ctx.guOverlay.bleedLocation.value, ['trade', 'science', 'exploration']),
    }),
    narrativeFact({
      id: 'gu.bleed-behavior',
      kind: 'gu.bleedBehavior',
      subjectType: 'gu',
      value: ctx.guOverlay.bleedBehavior.value,
      confidence: ctx.guOverlay.bleedBehavior.confidence,
      source: 'Narrative context from generated GU bleed behavior',
      sourcePath: 'guOverlay.bleedBehavior',
      tags: ['gu', 'pressure'],
      domains: domainsForGuValue('bleedBehaviors', ctx.guOverlay.bleedBehavior.value, ['science', 'disaster', 'trade']),
    }),
    ...factions.map((faction) => narrativeFact({
      id: `faction.${faction.id}`,
      kind: 'namedFaction',
      subjectType: 'faction' as const,
      value: faction.name,
      confidence: 'human-layer',
      source: `${faction.publicFace}; ${faction.kind}`,
      sourcePath: `factions.${faction.id}`,
      tags: ['actor', faction.kind],
      domains: [...faction.domains],
    })),
  ]

  ctx.bodies.forEach((body, bodyIndex) => {
    facts.push(
      narrativeFact({
        id: `body.${body.id}.class`,
        kind: 'body.class',
        subjectType: 'body',
        subjectId: body.id,
        value: `${body.name.value}: ${body.bodyClass.value}`,
        confidence: body.bodyClass.confidence,
        source: 'Narrative context from generated body class',
        sourcePath: `bodies[${bodyIndex}].bodyClass`,
        tags: ['physical', body.category.value],
        domains: ['exploration', 'science'],
      }),
      narrativeFact({
        id: `body.${body.id}.radiation`,
        kind: 'body.radiation',
        subjectType: 'body',
        subjectId: body.id,
        value: radiationCreatesNarrativeHazard(body.detail.radiation.value)
          ? `${sentenceFragment(body.detail.radiation.value)} near ${body.name.value}`
          : `stable radiation conditions near ${body.name.value}`,
        confidence: body.detail.radiation.confidence,
        source: 'Narrative context from generated body radiation',
        sourcePath: `bodies[${bodyIndex}].detail.radiation`,
        tags: radiationCreatesNarrativeHazard(body.detail.radiation.value) ? ['hazard', 'physical'] : ['physical'],
        domains: radiationCreatesNarrativeHazard(body.detail.radiation.value) ? ['stellar-events', 'disaster', 'medicine', 'public-life'] : ['public-life', 'science'],
      })
    )

    if (body.detail.biosphere.value !== 'Sterile') {
      facts.push(narrativeFact({
        id: `body.${body.id}.biosphere`,
        kind: 'body.biosphere',
        subjectType: 'body',
        subjectId: body.id,
        value: `${sentenceFragment(body.detail.biosphere.value)} on ${body.name.value}`,
        confidence: body.detail.biosphere.confidence,
        source: 'Narrative context from generated biosphere',
        sourcePath: `bodies[${bodyIndex}].detail.biosphere`,
        tags: ['biosphere', 'ecology'],
        domains: ['ecology', 'science', 'governance'],
      }))
    }

    body.sites.forEach((site, siteIndex) => {
      facts.push(narrativeFact({
        id: `body.${body.id}.site.${siteIndex + 1}`,
        kind: 'body.site',
        subjectType: 'body',
        subjectId: body.id,
        value: `${lowerFirst(site.value)} on ${body.name.value}`,
        confidence: site.confidence,
        source: 'Narrative context from generated body site',
        sourcePath: `bodies[${bodyIndex}].sites[${siteIndex}]`,
        tags: ['site'],
      }))
    })
  })

  ctx.settlements.forEach((settlement, settlementIndex) => {
    const settlementBase = `settlements[${settlementIndex}]`
    const settlementLabel = settlement.name.value
    const actorValue = lowerFirst(settlement.authority.value)

    facts.push(
      narrativeFact({
        id: `settlement.${settlement.id}.authority`,
        kind: 'settlement.authority',
        subjectType: 'settlement',
        subjectId: settlement.id,
        value: actorValue,
        confidence: settlement.authority.confidence,
        source: `Narrative context from ${settlementLabel} authority`,
        sourcePath: `${settlementBase}.authority`,
        tags: ['actor', settlement.siteCategory.value, settlement.function.value],
      }),
      narrativeFact({
        id: `settlement.${settlement.id}.function`,
        kind: 'settlement.function',
        subjectType: 'settlement',
        subjectId: settlement.id,
        value: `${lowerFirst(settlement.function.value)} at ${settlementLabel}`,
        confidence: settlement.function.confidence,
        source: `Narrative context from ${settlementLabel} function`,
        sourcePath: `${settlementBase}.function`,
        tags: ['stake', settlement.siteCategory.value],
      }),
      narrativeFact({
        id: `settlement.${settlement.id}.location`,
        kind: 'settlement.location',
        subjectType: 'settlement',
        subjectId: settlement.id,
        value: settlement.location.value,
        confidence: settlement.location.confidence,
        source: `Narrative context from ${settlementLabel} location`,
        sourcePath: `${settlementBase}.location`,
        tags: ['routeAsset', settlement.siteCategory.value],
      }),
      narrativeFact({
        id: `settlement.${settlement.id}.condition`,
        kind: 'settlement.condition',
        subjectType: 'settlement',
        subjectId: settlement.id,
        value: `${lowerFirst(settlement.condition.value)} at ${settlementLabel}`,
        confidence: settlement.condition.confidence,
        source: `Narrative context from ${settlementLabel} condition`,
        sourcePath: `${settlementBase}.condition`,
        tags: ['pressure'],
      }),
      narrativeFact({
        id: `settlement.${settlement.id}.crisis`,
        kind: 'settlement.crisis',
        subjectType: 'settlement',
        subjectId: settlement.id,
        value: settlement.crisis.value,
        confidence: settlement.crisis.confidence,
        source: `Narrative context from ${settlementLabel} crisis`,
        sourcePath: `${settlementBase}.crisis`,
        tags: ['pressure', 'crisis'],
      }),
      narrativeFact({
        id: `settlement.${settlement.id}.hiddenTruth`,
        kind: 'settlement.hiddenTruth',
        subjectType: 'settlement',
        subjectId: settlement.id,
        value: settlement.hiddenTruth.value,
        confidence: settlement.hiddenTruth.confidence,
        source: `Narrative context from ${settlementLabel} hidden truth`,
        sourcePath: `${settlementBase}.hiddenTruth`,
        tags: ['secret'],
        status: 'secret',
      }),
      narrativeFact({
        id: `settlement.${settlement.id}.ai`,
        kind: 'settlement.aiSituation',
        subjectType: 'settlement',
        subjectId: settlement.id,
        value: settlement.aiSituation.value,
        confidence: settlement.aiSituation.confidence,
        source: `Narrative context from ${settlementLabel} AI situation`,
        sourcePath: `${settlementBase}.aiSituation`,
        tags: ['ai', 'pressure'],
        domains: ['ai', ...classifyNarrativeDomains(settlement.aiSituation.value)],
      })
    )

    settlement.tags.forEach((tag, tagIndex) => {
      facts.push(narrativeFact({
        id: `settlement.${settlement.id}.tag.${tagIndex + 1}`,
        kind: 'settlement.tag',
        subjectType: 'settlement',
        subjectId: settlement.id,
        value: tag.value,
        confidence: tag.confidence,
        source: `Narrative context from ${settlementLabel} settlement tag`,
        sourcePath: `${settlementBase}.tags[${tagIndex}]`,
        tags: ['pressure'],
      }))
    })

    facts.push(narrativeFact({
      id: `settlement.${settlement.id}.tagHook`,
      kind: 'settlement.tagHook',
      subjectType: 'settlement',
      subjectId: settlement.id,
      value: settlement.tagHook.value,
      confidence: settlement.tagHook.confidence,
      source: `Narrative context from ${settlementLabel} settlement tag hook`,
      sourcePath: `${settlementBase}.tagHook`,
      tags: ['pressure', 'claim', 'secret'],
      domains: classifyNarrativeDomains(settlement.tagHook.value),
    }))

    settlement.encounterSites.forEach((site, siteIndex) => {
      facts.push(narrativeFact({
        id: `settlement.${settlement.id}.encounterSite.${siteIndex + 1}`,
        kind: 'settlement.encounterSite',
        subjectType: 'settlement',
        subjectId: settlement.id,
        value: site.value,
        confidence: site.confidence,
        source: `Narrative context from ${settlementLabel} encounter site`,
        sourcePath: `${settlementBase}.encounterSites[${siteIndex}]`,
        tags: ['sceneAnchor'],
      }))
    })
  })

  ctx.ruins.forEach((ruin, ruinIndex) => {
    facts.push(
      narrativeFact({
        id: `ruin.${ruin.id}.type`,
        kind: 'ruin.type',
        subjectType: 'ruin',
        subjectId: ruin.id,
        value: `${ruin.location.value}: ${ruin.remnantType.value}`,
        confidence: ruin.remnantType.confidence,
        source: 'Narrative context from generated human remnant',
        sourcePath: `ruins[${ruinIndex}].remnantType`,
        tags: ['remnant', 'first-wave'],
        domains: ['archaeology', 'trade', 'espionage'],
      }),
      narrativeFact({
        id: `ruin.${ruin.id}.hook`,
        kind: 'ruin.hook',
        subjectType: 'ruin',
        subjectId: ruin.id,
        value: ruin.hook.value,
        confidence: ruin.hook.confidence,
        source: 'Narrative context from generated human remnant hook',
        sourcePath: `ruins[${ruinIndex}].hook`,
        tags: ['claim', 'secret'],
      })
    )
  })

  ctx.phenomena.forEach((phenomenon, phenomenonIndex) => {
    facts.push(narrativeFact({
      id: `phenomenon.${phenomenon.id}`,
      kind: 'phenomenon',
      subjectType: 'phenomenon',
      subjectId: phenomenon.id,
      value: phenomenon.phenomenon.value,
      confidence: phenomenon.phenomenon.confidence,
      source: 'Narrative context from generated system phenomenon',
      sourcePath: `phenomena[${phenomenonIndex}].phenomenon`,
      tags: ['phenomenon'],
    }))
  })

  return facts
}
