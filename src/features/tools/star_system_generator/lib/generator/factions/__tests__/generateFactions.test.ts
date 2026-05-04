import { describe, expect, it } from 'vitest'
import { generateFactions } from '../generateFactions'
import { createSeededRng } from '../../rng'
import { astronomyBank } from '../banks/astronomyBank'
import { balancedBank } from '../banks/balancedBank'
import { cinematicBank } from '../banks/cinematicBank'

describe('generateFactions', () => {
  it('produces deterministic output for same seed + tone + count', () => {
    const a = generateFactions(createSeededRng('seed-x'), 'cinematic', 8)
    const b = generateFactions(createSeededRng('seed-x'), 'cinematic', 8)
    expect(a).toEqual(b)
  })

  it('produces different sets for different tones with same seed', () => {
    const cinematic = generateFactions(createSeededRng('seed-x'), 'cinematic', 8)
    const astronomy = generateFactions(createSeededRng('seed-x'), 'astronomy', 8)
    const cinematicNames = new Set(cinematic.map((f) => f.name))
    const astronomyNames = new Set(astronomy.map((f) => f.name))
    const overlap = [...cinematicNames].filter((n) => astronomyNames.has(n))
    expect(overlap).toEqual([])
  })

  it('preserves seedFactions verbatim at balanced when count <= seedFactions.length', () => {
    const balanced = generateFactions(createSeededRng('seed-y'), 'balanced', 6)
    const seedNames = new Set(balancedBank.seedFactions.map((f) => f.name))
    expect(balanced).toHaveLength(6)
    for (const faction of balanced) {
      expect(seedNames.has(faction.name)).toBe(true)
    }
  })

  it('extends past seedFactions with generated names when count > seedFactions.length', () => {
    const balanced = generateFactions(createSeededRng('seed-z'), 'balanced', 15)
    expect(balanced).toHaveLength(15)
    const seedNames = new Set(balancedBank.seedFactions.map((f) => f.name))
    const generated = balanced.filter((f) => !seedNames.has(f.name))
    expect(generated.length).toBeGreaterThanOrEqual(5)
  })

  it('produces unique names within a single call', () => {
    const factions = generateFactions(createSeededRng('seed-unique'), 'astronomy', 12)
    const names = new Set(factions.map((f) => f.name))
    expect(names.size).toBe(factions.length)
  })

  it('faction-cohesion-within-system: cinematic call yields only cinematic-bank names', () => {
    const cinematic = generateFactions(createSeededRng('cohesion-test'), 'cinematic', 10)
    const astronomyMarkers = ['Bonn-Tycho', 'Stellar Survey', 'Calibration', 'Aperture', 'Pulsar Timing', 'Spectral Census', 'Coronagraph', 'Heliometric']
    const balancedMarkers = ['Kestrel', 'Red Vane', 'Glasshouse', 'Veyra', 'Orison', 'Helion', 'Sepulcher', 'Pale Choir']
    for (const faction of cinematic) {
      for (const marker of astronomyMarkers) {
        expect(faction.name.includes(marker)).toBe(false)
      }
      for (const marker of balancedMarkers) {
        expect(faction.name.includes(marker)).toBe(false)
      }
    }
  })

  it('faction-cohesion-within-system: astronomy call yields only astronomy-bank names', () => {
    const astronomy = generateFactions(createSeededRng('cohesion-test-astronomy'), 'astronomy', 10)
    const cinematicMarkers = ['Carrion', 'Brothers of', 'Sisters of', 'Pale Saint', 'Vow-Breaker', 'Black Comet', 'Bone Lantern', 'Gravewatch']
    for (const faction of astronomy) {
      for (const marker of cinematicMarkers) {
        expect(faction.name.includes(marker)).toBe(false)
      }
    }
  })

  it('all generated factions have non-empty name, kind, publicFace, and at least one domain', () => {
    for (const tone of ['balanced', 'astronomy', 'cinematic'] as const) {
      const factions = generateFactions(createSeededRng(`completeness-${tone}`), tone, 12)
      for (const faction of factions) {
        expect(faction.name.trim().length).toBeGreaterThan(0)
        expect(faction.kind.trim().length).toBeGreaterThan(0)
        expect(faction.publicFace.trim().length).toBeGreaterThan(0)
        expect(faction.domains.length).toBeGreaterThan(0)
        expect(faction.id.trim().length).toBeGreaterThan(0)
      }
    }
  })

  it('cinematic stems compose only from the cinematic bank', () => {
    const factions = generateFactions(createSeededRng('stem-check'), 'cinematic', 30)
    const cinematicStems = new Set(cinematicBank.stems)
    for (const faction of factions) {
      const matchedStem = cinematicBank.stems.find((stem) => faction.name.startsWith(stem))
      expect(matchedStem).toBeDefined()
      if (matchedStem) expect(cinematicStems.has(matchedStem)).toBe(true)
    }
  })

  it('astronomy stems compose only from the astronomy bank', () => {
    const factions = generateFactions(createSeededRng('stem-check-astronomy'), 'astronomy', 30)
    for (const faction of factions) {
      const matchedStem = astronomyBank.stems.find((stem) => faction.name.startsWith(stem))
      expect(matchedStem).toBeDefined()
    }
  })
})
