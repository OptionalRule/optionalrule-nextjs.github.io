import { describe, expect, it } from 'vitest'

import { baseLightSources, DEFAULT_TURN_MINUTES } from '../data/lightSources'
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
    expect(cloned.brightRadius).toEqual(original.brightRadius)

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
      brightRadius: -5,
      description: '  Light with extra whitespace.  ',
    })

    expect(entry.baseDurationMinutes).toBe(DEFAULT_TURN_MINUTES)
    expect(entry.turnLengthMinutes).toBe(DEFAULT_TURN_MINUTES)
    expect(entry.brightRadius).toBeGreaterThanOrEqual(0)
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
    expect(active.remainingSeconds).toBe(active.totalSeconds)
    expect(active.status).toBe('active')
    expect(active.isPaused).toBe(false)
    expect(active.isAffectingVisibility).toBe(true)
  })

  it('allows explicit zero remaining seconds without pausing the instance', () => {
    const catalogEntry = getSampleEntry()
    const active = createActiveSourceFromCatalog(catalogEntry, {
      remainingSeconds: 0,
    })

    expect(active.status).toBe('active')
    expect(active.remainingSeconds).toBe(0)
    expect(active.isPaused).toBe(false)
  })

  it('validates catalog entries for structural issues', () => {
    const invalidEntry = {
      ...getSampleEntry(),
      id: '',
      name: '',
      baseDurationMinutes: 0,
      turnLengthMinutes: 0,
      brightRadius: -10,
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
})
