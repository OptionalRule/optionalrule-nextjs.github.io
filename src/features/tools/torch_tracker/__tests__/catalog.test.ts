import { describe, expect, it } from 'vitest'

import {
  baseLightSources,
  createCustomLightSource,
  DEFAULT_TURN_MINUTES,
} from '../data/lightSources'
import {
  cloneCatalogEntry,
  createActiveSourceFromCatalog,
  createCatalogIndex,
  ensureCatalogEntryDefaults,
  validateCatalog,
  validateCatalogEntry,
} from '../lib/catalog'

const getSampleEntry = () => cloneCatalogEntry(baseLightSources[0])

describe('catalog utilities', () => {
  it('clones catalog entries without retaining references', () => {
    const original = getSampleEntry()
    const cloned = cloneCatalogEntry(original)

    expect(cloned).not.toBe(original)
    expect(cloned.radius).not.toBe(original.radius)
    expect(cloned.radius).toEqual(original.radius)

    expect(cloned.tags).toEqual(original.tags)
    if (cloned.tags) {
      expect(cloned.tags).not.toBe(original.tags)
    }
  })

  it('applies default guards for duration, turn length, and radius', () => {
    const entry = ensureCatalogEntryDefaults({
      ...getSampleEntry(),
      baseDurationMinutes: 0,
      turnLengthMinutes: 0,
      radius: { bright: -5, dim: 0 },
      description: '  Light with extra whitespace.  ',
    })

    expect(entry.baseDurationMinutes).toBe(DEFAULT_TURN_MINUTES)
    expect(entry.turnLengthMinutes).toBe(DEFAULT_TURN_MINUTES)
    expect(entry.radius.bright).toBeGreaterThanOrEqual(0)
    expect(entry.radius.dim).toBeGreaterThanOrEqual(entry.radius.bright)
    expect(entry.description).toBe('Light with extra whitespace.')
  })

  it('creates active sources with derived counters and metadata', () => {
    const catalogEntry = getSampleEntry()
    catalogEntry.baseDurationMinutes = 60
    catalogEntry.turnLengthMinutes = 10

    const active = createActiveSourceFromCatalog(catalogEntry, {
      label: 'Front rank torch',
    })

    expect(active.catalogId).toBe(catalogEntry.id)
    expect(active.label).toBe('Front rank torch')
    expect(active.totalSeconds).toBe(3600)
    expect(active.totalRounds).toBe(6)
    expect(active.remainingSeconds).toBe(active.totalSeconds)
    expect(active.remainingRounds).toBe(active.totalRounds)
    expect(active.status).toBe('active')
    expect(active.isPaused).toBe(false)
    expect(active.isAffectingVisibility).toBe(true)
  })

  it('marks new instances as expired when remainingSeconds start at zero', () => {
    const catalogEntry = getSampleEntry()
    const active = createActiveSourceFromCatalog(catalogEntry, {
      remainingSeconds: 0,
    })

    expect(active.status).toBe('expired')
    expect(active.remainingRounds).toBe(0)
    expect(active.isPaused).toBe(false)
  })

  it('validates catalog entries for structural issues', () => {
    const invalidEntry = {
      ...getSampleEntry(),
      id: '',
      name: '',
      baseDurationMinutes: 0,
      turnLengthMinutes: 0,
      radius: { bright: 20, dim: 10 },
      icon: '',
      color: '',
    }

    const report = validateCatalogEntry(invalidEntry)
    expect(report.errors.length).toBeGreaterThanOrEqual(3)
    expect(report.warnings.length).toBeGreaterThanOrEqual(2)
  })

  it('detects duplicate ids when validating an entire catalog', () => {
    const entry = getSampleEntry()
    const catalog = [entry, { ...entry }]

    const report = validateCatalog(catalog)
    expect(report.errors.find((issue) => issue.field === 'id')).toBeTruthy()
  })

  it('creates indexes of catalog entries using cloned values', () => {
    const catalog = [getSampleEntry(), cloneCatalogEntry(baseLightSources[1])]
    const index = createCatalogIndex(catalog)
    const torch = index.get(catalog[0].id)

    expect(index.size).toBe(2)
    expect(torch).toBeDefined()
    expect(torch).not.toBe(catalog[0])
  })

  it('builds custom light archetypes with sanitized ids and defaults', () => {
    const custom = createCustomLightSource('Gleaming Crystal', 25, {
      radius: { bright: 15 },
    })

    expect(custom.id.startsWith('custom-gleaming-crystal')).toBe(true)
    expect(custom.radius.bright).toBe(15)
    expect(custom.radius.dim).toBeGreaterThanOrEqual(custom.radius.bright)
    expect(custom.isCustomArchetype).toBe(true)
  })
})

