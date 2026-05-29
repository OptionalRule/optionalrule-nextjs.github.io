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

// The smallest star core that ever reaches the screen is the smallest coronaRadius
// here multiplied by STAR_CORE_RATIO (see Star.tsx). Compact stars (white/brown
// dwarfs) are floored so even they stay larger than the biggest planet visual
// (gas-giant clamp max 1.55 in scale.ts) — they read as small + intense, never tiny.
const CLASS_RADIUS: Record<string, number> = {
  D: 3.6,
  V: 4,
  IV: 5.5,
  III: 8,
  II: 11,
  I: 15,
  L: 3.6,
  T: 3.6,
  Y: 3.6,
}

/**
 * Smallest coronaRadius any star can take. Paired with STAR_CORE_RATIO in Star.tsx,
 * this guarantees the minimum visible star core (3.6 * 0.56 ≈ 2.0) exceeds the
 * largest planet visual radius, so planets never out-size their host star.
 */
export const STAR_MIN_CORONA_RADIUS = 3.6

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

export interface SpectralDynamics {
  rotationSpeed: number
  pulseSpeed: number
  pulseAmplitude: number
}

const SPECTRAL_DYNAMICS: Record<string, SpectralDynamics> = {
  O: { rotationSpeed: 0.055, pulseSpeed: 1.4, pulseAmplitude: 0.045 },
  B: { rotationSpeed: 0.045, pulseSpeed: 1.2, pulseAmplitude: 0.045 },
  A: { rotationSpeed: 0.035, pulseSpeed: 0.95, pulseAmplitude: 0.055 },
  F: { rotationSpeed: 0.024, pulseSpeed: 0.65, pulseAmplitude: 0.06 },
  G: { rotationSpeed: 0.018, pulseSpeed: 0.4, pulseAmplitude: 0.07 },
  K: { rotationSpeed: 0.013, pulseSpeed: 0.3, pulseAmplitude: 0.09 },
  M: { rotationSpeed: 0.009, pulseSpeed: 0.22, pulseAmplitude: 0.14 },
  L: { rotationSpeed: 0.045, pulseSpeed: 0.55, pulseAmplitude: 0.085 },
  T: { rotationSpeed: 0.040, pulseSpeed: 0.5, pulseAmplitude: 0.065 },
  Y: { rotationSpeed: 0.038, pulseSpeed: 0.45, pulseAmplitude: 0.055 },
  D: { rotationSpeed: 0.060, pulseSpeed: 0.18, pulseAmplitude: 0.025 },
}

export function spectralDynamics(spectralType: string, activityRoll: number): SpectralDynamics {
  const base = SPECTRAL_DYNAMICS[spectralLetter(spectralType)] ?? SPECTRAL_DYNAMICS.G
  const activityT = Math.min(Math.max(activityRoll, 0), 100) / 100
  return {
    rotationSpeed: base.rotationSpeed,
    pulseSpeed: base.pulseSpeed * (0.85 + activityT * 0.4),
    pulseAmplitude: base.pulseAmplitude * (0.8 + activityT * 0.6),
  }
}
