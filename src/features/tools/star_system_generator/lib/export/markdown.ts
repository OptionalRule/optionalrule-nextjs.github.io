import type { GeneratedSystem, Gate, OrbitingBody, Settlement, SystemHook, SystemHooks } from '../../types'
import { formatStellarClass } from '../stellarLabels'
import {
  bandLabel,
  formatBodyPopulationSuffix,
  formatSystemPopulationLine,
} from '../populationDisplay'

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
    `**Population:** ${formatSystemPopulationLine(system)}`,
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

  if (system.gates.length) {
    lines.push('', '## Gates', '')
    for (const gate of system.gates) {
      lines.push(...formatGate(gate), '')
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

  for (const companion of system.companions) {
    if (companion.mode === 'orbital-sibling' && companion.subSystem) {
      lines.push('', `## Companion System: ${companion.star.name.value}`, '')
      lines.push(
        `*${formatStellarClass(companion.star.spectralType.value)} · ${companion.star.massSolar.value} M☉*`,
        ''
      )
      lines.push(
        `HZ ${companion.subSystem.zones.habitableInnerAu.value}–${companion.subSystem.zones.habitableOuterAu.value} AU · Snow line ${companion.subSystem.zones.snowLineAu.value} AU`,
        ''
      )
      lines.push('### Bodies', '')
      for (const body of companion.subSystem.bodies) {
        lines.push(`- **${body.name.value}** (${body.category.value}) at ${body.orbitAu.value} AU`)
      }
      lines.push('')

      if (companion.subSystem.settlements.length) {
        lines.push('### Settlement Profiles', '')
        for (const settlement of companion.subSystem.settlements) {
          lines.push(...formatSettlement(settlement), '')
        }
      }

      if (companion.subSystem.gates.length) {
        lines.push('### Gates', '')
        for (const gate of companion.subSystem.gates) {
          lines.push(...formatGate(gate), '')
        }
      }

      if (companion.subSystem.ruins.length) {
        lines.push('### Human Remnants', '')
        for (const ruin of companion.subSystem.ruins) {
          lines.push(
            `#### ${ruin.remnantType.value}`,
            `**Location:** ${ruin.location.value}`,
            '',
            ruin.hook.value,
            ''
          )
        }
      }

      if (companion.subSystem.phenomena.length) {
        lines.push('### System Phenomena', '')
        for (const phenomenon of companion.subSystem.phenomena) {
          lines.push(
            `- **${phenomenon.phenomenon.value}**`,
            `  - Transit: ${phenomenon.travelEffect.value}`,
            `  - Question: ${phenomenon.surveyQuestion.value}`,
            `  - Hook: ${phenomenon.conflictHook.value}`,
            `  - Image: ${phenomenon.sceneAnchor.value}`
          )
        }
        lines.push('')
      }
    } else if (companion.mode === 'linked-independent' && companion.linkedSeed) {
      lines.push('', '## Linked Companion System', '')
      lines.push(`${companion.companionType.value} · ${companion.separation.value}`, '')
      lines.push(`Linked system: \`?seed=${companion.linkedSeed.value}\``, '')
    }
  }

  const systemStory = formatSystemStory(system)
  if (systemStory.length) {
    lines.push('', '## System Story', '', ...systemStory)
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

function formatSystemStory(system: GeneratedSystem): string[] {
  const story = system.systemStory
  const lines: string[] = []
  const body = story.body.filter((paragraph) => paragraph.trim())
  const hooks = story.hooks.filter((hook) => hook.trim())

  if (story.spineSummary) {
    lines.push(`**Spine:** ${story.spineSummary}`, '')
  }

  for (const paragraph of body) {
    lines.push(paragraph, '')
  }

  if (hooks.length) {
    lines.push('### Hooks', '')
    for (const hook of hooks) {
      lines.push(`- ${hook}`)
    }
    lines.push('')
  }

  return lines
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
  const sitesText = body.sites.length ? body.sites.map((site) => site.value).join(', ') : ''
  const populationSuffix = formatBodyPopulationSuffix(body)
  const populationLabel = body.population?.value.band
  if (!sitesText && !populationSuffix && !populationLabel) return '-'
  const parts: string[] = []
  if (sitesText) parts.push(sitesText)
  if (populationLabel) {
    const label = bandLabel(body.population!.value.band)
    parts.push(populationSuffix ? `${label.toLowerCase()} + ${populationSuffix}` : label.toLowerCase())
  }
  return parts.join('; ')
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

function formatGate(gate: Gate): string[] {
  return [
    `### ${gate.name.value}`,
    '',
    `**Location:** ${gate.location.value}; ${gate.anchorName.value} (${gate.anchorKind.value}).`,
    `**Authority:** ${gate.authority.value}.`,
    `**Route Note:** ${gate.routeNote.value}.`,
    `**Built Form:** ${gate.builtForm.value}.`,
    `**Condition:** ${gate.condition.value}.`,
    ...(gate.pinchDifficulty ? [`**Pinch Difficulty:** ${gate.pinchDifficulty.value}.`] : []),
    ...(gate.whyHere.value ? [`**Why Here:** ${gate.whyHere.value}.`] : []),
    `**Hook:** ${gate.tagHook.value}.`,
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
