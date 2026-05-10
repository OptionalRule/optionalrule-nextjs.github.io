export interface StellarVisuals {
  coreColor: string
  coronaColor: string
  coronaRadius: number
  rayCount: number
  bloomStrength: number
}

const LETTER_RAMP: Record<string, { core: string; corona: string }> = {
  O: { core: '#d7e6ff', corona: '#6f9dff' },
  B: { core: '#e5efff', corona: '#8db4ff' },
  A: { core: '#f7f9ff', corona: '#c4d3ff' },
  F: { core: '#fff5df', corona: '#ffe4a8' },
  G: { core: '#fff6cf', corona: '#ffc85f' },
  K: { core: '#ffd1a0', corona: '#ff8f43' },
  M: { core: '#ffab82', corona: '#ff5632' },
  L: { core: '#e47b48', corona: '#9f3f28' },
  T: { core: '#bd6846', corona: '#66312a' },
  Y: { core: '#9b5842', corona: '#442621' },
  D: { core: '#f4fbff', corona: '#b5ddff' },
}

const CLASS_RADIUS: Record<string, number> = {
  D: 2.5,
  V: 4,
  IV: 5.5,
  III: 8,
  II: 11,
  I: 15,
  L: 3.1,
  T: 2.8,
  Y: 2.6,
}

const CLASS_PATTERN = /(Ia|Ib|II|III|IV|V)/

function spectralLetter(spectralType: string): string {
  const normalized = spectralType.trim().toUpperCase()
  if (normalized.includes('BROWN DWARF') || normalized.includes('SUBSTELLAR')) return 'L'
  if (/^D[A-Z]?/.test(normalized) || normalized.includes('WHITE DWARF')) return 'D'
  return normalized.match(/^[OBAFGKMLTY]/)?.[0] ?? 'G'
}

export function spectralVisuals(spectralType: string, activityRoll: number): StellarVisuals {
  const letter = spectralLetter(spectralType)
  const ramp = LETTER_RAMP[letter] ?? LETTER_RAMP.G
  const classMatch = spectralType.match(CLASS_PATTERN)?.[0] ?? 'V'
  const normalizedClass = classMatch === 'Ia' || classMatch === 'Ib' ? 'I' : classMatch
  const coronaRadius = CLASS_RADIUS[letter] ?? CLASS_RADIUS[normalizedClass] ?? CLASS_RADIUS.V
  const activityT = Math.min(Math.max(activityRoll, 0), 100) / 100

  return {
    coreColor: ramp.core,
    coronaColor: ramp.corona,
    coronaRadius,
    rayCount: Math.round(6 + activityT * 6),
    bloomStrength: 0.4 + activityT * 0.8,
  }
}
