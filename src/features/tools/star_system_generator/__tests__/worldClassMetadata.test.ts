import { describe, expect, it } from 'vitest'
import type { WorldClassOption } from '../lib/generator/domain'
import { deriveEnvironmentPolicy } from '../lib/generator/environmentPolicy'
import { allWorldClassOptions } from '../lib/generator'
import { deriveWorldClassMetadata, hasWorldClassPhysicalTag, metadataForClassName } from '../lib/generator/worldClassMetadata'

const star = {
  id: 'metadata-star',
  name: { value: 'Metadata Star', confidence: 'confirmed', source: 'Test fixture' },
  spectralType: { value: 'G star', confidence: 'confirmed', source: 'Test fixture' },
  massSolar: { value: 1, confidence: 'confirmed', source: 'Test fixture' },
  luminositySolar: { value: 1, confidence: 'confirmed', source: 'Test fixture' },
  ageGyr: { value: 5, confidence: 'confirmed', source: 'Test fixture' },
  ageState: { value: 'Mature main sequence', confidence: 'confirmed', source: 'Test fixture' },
  metallicity: { value: 'Solar', confidence: 'confirmed', source: 'Test fixture' },
  activity: { value: 'Normal', confidence: 'confirmed', source: 'Test fixture' },
  activityRoll: { value: 7, confidence: 'confirmed', source: 'Test fixture' },
  activityModifiers: [],
}

const runtimeCreatedClasses: WorldClassOption[] = [
  { className: 'Hot super-Earth', category: 'super-earth', massClass: 'Super-Earth' },
  { className: 'Stripped mini-Neptune core', category: 'super-earth', massClass: 'Stripped core' },
  { className: 'Hot Jupiter', category: 'gas-giant', massClass: 'Hot gas giant' },
  { className: 'Iron remnant core', category: 'rocky-planet', massClass: 'Mercury-scale remnant' },
  { className: 'Roche-distorted world', category: 'anomaly', massClass: 'Tidal remnant' },
  { className: 'Dark-sector density anomaly', category: 'anomaly', massClass: 'Dark-sector anomaly' },
  { className: 'Carbonaceous belt', category: 'belt', massClass: 'Carbonaceous belt' },
]

describe('world class metadata', () => {
  it('derives complete metadata for every registered and runtime-created world class', () => {
    for (const option of [...allWorldClassOptions, ...runtimeCreatedClasses]) {
      const metadata = deriveWorldClassMetadata(option)

      expect(metadata.environmentProfileHint).toBeTruthy()
      expect(metadata.architectureTags.length).toBeGreaterThan(0)
      expect(metadata.physicalTags).toBeDefined()
      expect(metadata.specialHandling).toBeDefined()
    }
  })

  it('uses explicit metadata hints so labels can change without breaking policy behavior', () => {
    const renamedAirlessWorld: WorldClassOption = {
      className: 'Catalog Kepler Test b',
      category: 'rocky-planet',
      massClass: 'Terrestrial',
      environmentProfileHint: 'airless',
      physicalTags: ['airless'],
    }

    expect(hasWorldClassPhysicalTag(renamedAirlessWorld, 'airless')).toBe(true)
    expect(deriveEnvironmentPolicy(renamedAirlessWorld, 'Temperate band', star).profile).toBe('airless')
  })

  it('classifies hot stripped cores and hot super-Earth conversions as desert worlds', () => {
    expect(metadataForClassName('Hot super-Earth').physicalTags).toContain('desert')
    expect(metadataForClassName('Stripped mini-Neptune core').physicalTags).toContain('desert')
    expect(metadataForClassName('Hot Neptune desert survivor').environmentProfileHint).toBe('desert')
  })

  it('marks qualitative environment tags without confusing magma with water oceans', () => {
    expect(deriveWorldClassMetadata({ className: 'Steam greenhouse', category: 'rocky-planet', massClass: 'Terrestrial' }).physicalTags).toEqual(expect.arrayContaining(['greenhouse', 'steam']))
    expect(deriveWorldClassMetadata({ className: 'Hycean-like candidate', category: 'sub-neptune', massClass: 'Mini-Neptune' }).physicalTags).toEqual(expect.arrayContaining(['hycean', 'water-ocean', 'ocean']))
    expect(deriveWorldClassMetadata({ className: 'Magma ocean world', category: 'rocky-planet', massClass: 'Molten terrestrial' }).physicalTags).not.toContain('water-ocean')
    expect(deriveWorldClassMetadata({ className: 'Magma ocean world', category: 'rocky-planet', massClass: 'Molten terrestrial' }).physicalTags).toContain('magma-ocean')
    expect(deriveWorldClassMetadata({ className: 'Stripped rocky super-Earth', category: 'super-earth', massClass: 'Stripped core' }).physicalTags).toContain('stripped-core')
  })

  it('classifies anomalies and facilities separately for later policy use', () => {
    expect(deriveWorldClassMetadata({ className: 'Deep observiverse fracture', category: 'anomaly', massClass: 'Metric anomaly' })).toMatchObject({
      environmentProfileHint: 'anomaly',
      specialHandling: expect.arrayContaining(['no-moons', 'no-rings', 'metric-phenomenon']),
    })
    expect(deriveWorldClassMetadata({ className: 'Black-lab platform', category: 'anomaly', massClass: 'Hidden facility platform' })).toMatchObject({
      environmentProfileHint: 'facility',
      physicalTags: expect.arrayContaining(['facility']),
    })
  })
})
