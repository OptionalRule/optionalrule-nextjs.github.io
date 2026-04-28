export interface NameRepairContext {
  bodyName?: string
  anchorName?: string
  anchorKind?: string
  location?: string
  siteCategory?: string
  authority?: string
  functionName?: string
  settlementId?: string
  ordinal: number
}

export function canonicalNameKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function descriptorForSiteCategory(siteCategory?: string): string | undefined {
  if (siteCategory === 'Surface settlement') return 'Dome'
  if (siteCategory === 'Moon base') return 'Base'
  if (siteCategory === 'Asteroid or belt base') return 'Bore'
  if (siteCategory === 'Gate or route node') return 'Node'
  if (siteCategory === 'Mobile site') return 'Fleet'
  if (siteCategory === 'Derelict or restricted site') return 'Redoubt'
  if (siteCategory === 'Deep-space platform') return 'Platform'
  if (siteCategory === 'Orbital station') return 'Station'
  return undefined
}

function descriptorForFunction(functionName?: string): string | undefined {
  const value = functionName?.toLowerCase() ?? ''
  if (value.includes('mine') || value.includes('extraction') || value.includes('harvest')) return 'Claim'
  if (value.includes('refinery') || value.includes('foundry') || value.includes('works')) return 'Works'
  if (value.includes('freeport') || value.includes('smuggler')) return 'Freeport'
  if (value.includes('quarantine')) return 'Cordon'
  if (value.includes('military') || value.includes('naval') || value.includes('weapons')) return 'Bastion'
  if (value.includes('iggygate') || value.includes('pinchdrive') || value.includes('customs')) return 'Gate'
  if (value.includes('lab') || value.includes('observ')) return 'Laboratory'
  if (value.includes('colony') || value.includes('refugee') || value.includes('enclave')) return 'Habitat'
  return undefined
}

function descriptorForAuthority(authority?: string): string | undefined {
  const value = authority?.toLowerCase() ?? ''
  if (value.includes('corp')) return 'Concession'
  if (value.includes('military') || value.includes('navy')) return 'Command'
  if (value.includes('quarantine')) return 'Cordon'
  if (value.includes('council')) return 'Commons'
  if (value.includes('free') || value.includes('captain')) return 'Compact'
  return undefined
}

function descriptorForAnchor(anchorKind?: string, location?: string): string | undefined {
  const value = `${anchorKind ?? ''} ${location ?? ''}`.toLowerCase()
  if (value.includes('route') || value.includes('gate') || value.includes('traffic') || value.includes('transit')) return 'Transit'
  if (value.includes('moon')) return 'Moonward'
  if (value.includes('belt') || value.includes('asteroid')) return 'Beltward'
  if (value.includes('orbit')) return 'Orbital'
  if (value.includes('surface') || value.includes('crater') || value.includes('terminator')) return 'Ground'
  return undefined
}

function stem(value?: string): string | undefined {
  const clean = value
    ?.split(',')[0]
    .replace(/\s+(orbital space|route geometry|traffic pattern|transit geometry)$/i, '')
    .trim()
  return clean || undefined
}

function appendQualifier(baseName: string, qualifier: string): string {
  const key = canonicalNameKey(baseName)
  const qualifierKey = canonicalNameKey(qualifier)
  if (!qualifierKey || key.split(' ').includes(qualifierKey)) return baseName
  return `${baseName} ${qualifier}`
}

export class NameRegistry {
  private readonly used = new Set<string>()

  reserve(name: string): void {
    const key = canonicalNameKey(name)
    if (key) this.used.add(key)
  }

  has(name: string): boolean {
    return this.used.has(canonicalNameKey(name))
  }

  uniqueGeneratedName(baseName: string, context: NameRepairContext): string {
    if (!this.has(baseName)) {
      this.reserve(baseName)
      return baseName
    }

    const candidates = [
      descriptorForSiteCategory(context.siteCategory),
      descriptorForFunction(context.functionName),
      descriptorForAuthority(context.authority),
      descriptorForAnchor(context.anchorKind, context.location),
      stem(context.anchorName),
      stem(context.bodyName),
      context.settlementId,
      context.ordinal.toString().padStart(2, '0'),
    ]
      .filter((candidate): candidate is string => Boolean(candidate))
      .map((candidate) => appendQualifier(baseName, candidate))

    for (const candidate of candidates) {
      if (!this.has(candidate)) {
        this.reserve(candidate)
        return candidate
      }
    }

    const fallback = `${baseName} ${context.ordinal.toString().padStart(2, '0')}`
    this.reserve(fallback)
    return fallback
  }
}
