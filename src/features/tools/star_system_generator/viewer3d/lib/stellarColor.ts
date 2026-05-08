export interface StellarVisuals {
  coreColor: string
  coronaColor: string
  coronaRadius: number
  rayCount: number
  bloomStrength: number
}

const LETTER_RAMP: Record<string, { core: string; corona: string }> = {
  O: { core: '#cfe0ff', corona: '#7fa6ff' },
  B: { core: '#dbe8ff', corona: '#9ec0ff' },
  A: { core: '#f0f4ff', corona: '#cdd9ff' },
  F: { core: '#fff5e0', corona: '#ffe9b8' },
  G: { core: '#fff8d8', corona: '#ffd97a' },
  K: { core: '#ffd6a8', corona: '#ff9d4a' },
  M: { core: '#ffb38a', corona: '#ff6b3a' },
}

const CLASS_RADIUS: Record<string, number> = {
  V: 38,
  IV: 44,
  III: 56,
  II: 70,
  I: 88,
}

const CLASS_PATTERN = /(Ia|Ib|II|III|IV|V)/

export function spectralVisuals(spectralType: string, activityRoll: number): StellarVisuals {
  const letter = (spectralType.match(/^[OBAFGKM]/i)?.[0] ?? 'G').toUpperCase()
  const ramp = LETTER_RAMP[letter] ?? LETTER_RAMP.G
  const classMatch = spectralType.match(CLASS_PATTERN)?.[0] ?? 'V'
  const normalizedClass = classMatch === 'Ia' || classMatch === 'Ib' ? 'I' : classMatch
  const coronaRadius = CLASS_RADIUS[normalizedClass] ?? CLASS_RADIUS.V
  const activityT = Math.min(Math.max(activityRoll, 0), 100) / 100

  return {
    coreColor: ramp.core,
    coronaColor: ramp.corona,
    coronaRadius,
    rayCount: Math.round(6 + activityT * 6),
    bloomStrength: 0.4 + activityT * 0.8,
  }
}
