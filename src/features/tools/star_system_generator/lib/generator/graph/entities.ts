import type { EntityRef } from './types'

export interface EntityInventoryInput {
  systemName: string
  primary: { spectralType: { value: string } }
  companions: ReadonlyArray<{ id?: string; spectralType?: { value: string }; name?: string }>
  bodies: ReadonlyArray<{ id: string; name: { value: string } }>
  settlements: ReadonlyArray<{ id: string; name: { value: string } }>
  guOverlay: { resource: { value: string }; hazard: { value: string } }
  phenomena: ReadonlyArray<{ id: string; phenomenon: { value: string } }>
  ruins: ReadonlyArray<{ id: string; remnantType: { value: string } }>
  narrativeFacts: ReadonlyArray<{ kind: string; value: { value: string } }>
}

export function buildEntityInventory(input: EntityInventoryInput): EntityRef[] {
  const refs: EntityRef[] = []

  refs.push({
    kind: 'system',
    id: 'system',
    displayName: input.systemName,
    layer: 'physical',
  })

  refs.push({
    kind: 'star',
    id: 'star-primary',
    displayName: input.primary.spectralType.value,
    layer: 'physical',
  })

  input.companions.forEach((companion, index) => {
    const id = companion.id ?? `star-companion-${index + 1}`
    const displayName = companion.spectralType?.value
      ?? companion.name
      ?? `companion-${index + 1}`
    refs.push({
      kind: 'star',
      id,
      displayName,
      layer: 'physical',
    })
  })

  for (const body of input.bodies) {
    refs.push({
      kind: 'body',
      id: body.id,
      displayName: body.name.value,
      layer: 'physical',
    })
  }

  for (const settlement of input.settlements) {
    refs.push({
      kind: 'settlement',
      id: settlement.id,
      displayName: settlement.name.value,
      layer: 'human',
    })
  }

  refs.push({
    kind: 'guResource',
    id: 'gu-resource',
    displayName: input.guOverlay.resource.value,
    layer: 'gu',
  })
  refs.push({
    kind: 'guHazard',
    id: 'gu-hazard',
    displayName: input.guOverlay.hazard.value,
    layer: 'gu',
  })

  for (const phenomenon of input.phenomena) {
    refs.push({
      kind: 'phenomenon',
      id: phenomenon.id,
      displayName: phenomenon.phenomenon.value,
      layer: 'gu',
    })
  }

  for (const ruin of input.ruins) {
    refs.push({
      kind: 'ruin',
      id: ruin.id,
      displayName: ruin.remnantType.value,
      layer: 'human',
    })
  }

  const seenFactions = new Set<string>()
  for (const fact of input.narrativeFacts) {
    if (fact.kind !== 'namedFaction') continue
    const name = fact.value.value
    if (seenFactions.has(name)) continue
    seenFactions.add(name)
    refs.push({
      kind: 'namedFaction',
      id: `faction-${slugify(name)}`,
      displayName: name,
      layer: 'human',
    })
  }

  return refs
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
