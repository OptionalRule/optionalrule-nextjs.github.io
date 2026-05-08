import type { GeneratedSystem, OrbitingBody, Settlement, SystemHook, SystemHooks } from '../../types'
import { formatStellarClass } from '../stellarLabels'

export function exportSystemMarkdown(system: GeneratedSystem): string {
  const lines: string[] = [
    `# ${system.name.value}`,
    '',
    `**System Name:** ${system.name.value}`,
    `**Data Basis:** ${system.dataBasis.value}`,
    `**Primary:** ${formatPrimary(system)}`,
    `**Companions:** ${formatCompanions(system)}`,
    `**Reachability:** ${system.reachability.className.value}; ${system.reachability.routeNote.value}; pinch difficulty ${system.reachability.pinchDifficulty.value}.`,
    `**Architecture:** ${system.architecture.name.value}; ${system.architecture.description.value}`,
    `**HZ:** ${system.zones.habitableInnerAu.value} / ${system.zones.habitableCenterAu.value} / ${system.zones.habitableOuterAu.value} AU.`,
    `**Snow Line:** ${system.zones.snowLineAu.value} AU.`,
    `**GU Intensity:** ${system.guOverlay.intensity.value}; ${system.guOverlay.bleedLocation.value}; ${system.guOverlay.bleedBehavior.value}.`,
    `**Primary Economy:** ${formatPrimaryEconomy(system)}`,
    `**Major Hazards:** ${formatMajorHazards(system)}`,
    `**No-Alien Check:** ${system.noAlienCheck.passed ? 'Passed' : 'Needs review'}; ${system.noAlienCheck.note}`,
    '',
    '## Orbital Bodies',
    '',
    '| Orbit | Body | Class | Key traits | Sites |',
    '| ---: | --- | --- | --- | --- |',
    ...formatBodyRows(system),
  ]

  if (system.settlements.length) {
    lines.push('', '## Settlement Profiles', '')
    for (const settlement of system.settlements) {
      lines.push(...formatSettlement(settlement), '')
    }
  }

  if (system.ruins.length) {
    lines.push('## Human Remnants', '')
    for (const ruin of system.ruins) {
      lines.push(
        `### ${ruin.remnantType.value}`,
        `**Location:** ${ruin.location.value}`,
        '',
        ruin.hook.value,
        ''
      )
    }
  }

  if (system.phenomena.length) {
    lines.push('## System Phenomena', '')
    for (const phenomenon of system.phenomena) {
      lines.push(
        `- **${phenomenon.phenomenon.value}**`,
        `  - Transit: ${phenomenon.travelEffect.value}`,
        `  - Question: ${phenomenon.surveyQuestion.value}`,
        `  - Hook: ${phenomenon.conflictHook.value}`,
        `  - Image: ${phenomenon.sceneAnchor.value}`
      )
    }
  }

  if (system.hooks && hasAnyHooks(system.hooks)) {
    lines.push('', '## Stories at Port', '')
    lines.push(...formatSystemHooks(system.hooks))
  }

  return `${lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`
}

function hasAnyHooks(hooks: SystemHooks): boolean {
  return (
    hooks.rumors.length +
      hooks.contracts.length +
      hooks.encounters.length +
      hooks.npcs.length +
      hooks.twists.length >
    0
  )
}

function formatSystemHooks(hooks: SystemHooks): string[] {
  const lines: string[] = []
  const renderGroup = (title: string, group: readonly SystemHook[]): void => {
    if (group.length === 0) return
    lines.push(`### ${title}`, '')
    for (const hook of group) {
      const tagSuffix = hook.tags.length ? ` _[${hook.tags.join(', ')}]_` : ''
      lines.push(`- ${hook.text.value}${tagSuffix}`)
    }
    lines.push('')
  }
  renderGroup('Rumors', hooks.rumors)
  renderGroup('Contracts on Offer', hooks.contracts)
  renderGroup('People You Meet', hooks.npcs)
  renderGroup('Encounter en Route', hooks.encounters)
  renderGroup('Mid-Session Twist', hooks.twists)
  return lines
}

function formatPrimary(system: GeneratedSystem): string {
  const primary = system.primary
  return [
    formatStellarClass(primary.spectralType.value),
    `${primary.massSolar.value} solar masses`,
    `${primary.luminositySolar.value} solar luminosities`,
    primary.ageState.value,
    primary.metallicity.value,
    primary.activity.value,
  ].join(', ')
}

function formatCompanions(system: GeneratedSystem): string {
  if (!system.companions.length) return 'None; single-star system.'
  return system.companions
    .map((companion) =>
      `${companion.companionType.value} at ${companion.separation.value}; ${companion.planetaryConsequence.value}; ${companion.guConsequence.value}`
    )
    .join(' ')
}

function formatPrimaryEconomy(system: GeneratedSystem): string {
  const settlementFunctions = system.settlements.slice(0, 3).map((settlement) => settlement.function.value)
  return uniqueList([system.guOverlay.resource.value, ...settlementFunctions]).join(', ')
}

function formatMajorHazards(system: GeneratedSystem): string {
  return uniqueList([system.guOverlay.hazard.value, ...system.majorHazards.map((hazard) => hazard.value)]).join(', ')
}

function formatBodyRows(system: GeneratedSystem): string[] {
  return system.bodies.flatMap((body) => {
    const bodyRows = [
      [
        `${body.orbitAu.value} AU`,
        body.name.value,
        body.bodyClass.value,
        formatBodyTraits(body),
        formatSites(body),
      ],
    ]

    for (const moon of body.moons) {
      bodyRows.push([
        `${body.orbitAu.value} AU moon`,
        moon.name.value,
        moon.moonType.value,
        uniqueList([moon.scale.value, moon.resource.value, moon.hazard.value]).join(', '),
        moon.use.value,
      ])
    }

    return bodyRows.map((row) => `| ${row.map(markdownTableCell).join(' | ')} |`)
  })
}

function formatBodyTraits(body: OrbitingBody): string {
  const traits = [
    body.thermalZone.value,
    body.detail.atmosphere.value,
    body.detail.hydrosphere.value,
    ...body.traits.slice(0, 2).map((trait) => trait.value),
  ]

  if (body.rings) traits.push(`rings: ${body.rings.type.value}`)
  if (body.giantEconomy) traits.push(body.giantEconomy.value)
  return uniqueList(traits).join(', ')
}

function formatSites(body: OrbitingBody): string {
  if (!body.sites.length) return '-'
  return body.sites.map((site) => site.value).join(', ')
}

function formatSettlement(settlement: Settlement): string[] {
  return [
    `### ${settlement.name.value}`,
    '',
    `**Population:** ${settlement.population.value}.`,
    `**Habitation:** ${settlement.habitationPattern.value}.`,
    `**Location:** ${settlement.location.value}; ${settlement.anchorName.value} (${settlement.anchorKind.value}).`,
    `**Authority:** ${settlement.authority.value}.`,
    `**Function:** ${settlement.function.value}.`,
    `**Built Form:** ${settlement.builtForm.value}.`,
    `**Tags:** ${settlement.tags.map((tag) => tag.value).join(' + ')}.`,
    `**AI:** ${settlement.aiSituation.value}.`,
    `**Crisis:** ${settlement.crisis.value}.`,
    `**Hidden Truth:** ${settlement.hiddenTruth.value}.`,
    ...(settlement.whyHere.value ? [`**Why Here:** ${settlement.whyHere.value}.`] : []),
    `**Local Sites:** ${settlement.encounterSites.map((site) => site.value).join(', ')}.`,
  ]
}

function markdownTableCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim()
}

function uniqueList(values: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const value of values) {
    const trimmed = value.trim()
    const key = trimmed.toLowerCase()
    if (!trimmed || seen.has(key)) continue
    seen.add(key)
    result.push(trimmed)
  }

  return result.length ? result : ['-']
}
