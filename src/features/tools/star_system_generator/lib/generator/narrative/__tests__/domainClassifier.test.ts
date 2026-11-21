import { describe, expect, it } from 'vitest'
import { classifyNarrativeDomainsV2, classifyNarrativeDomainsV3 } from '../domainClassifier'
import type { NarrativeDomain } from '../domains'

describe('v2 narrative domain classifier', () => {
  it('keeps the substring behaviour that v2 links depend on', () => {
    expect(classifyNarrativeDomainsV2('maintenance')).toEqual(expect.arrayContaining(['ai', 'infrastructure']))
    expect(classifyNarrativeDomainsV2('isolated')).toContain('religion')
    expect(classifyNarrativeDomainsV2('gold')).toContain('archaeology')
    expect(classifyNarrativeDomainsV2('dwarf')).toContain('war')
    expect(classifyNarrativeDomainsV2('')).toEqual(['public-life'])
  })
})

describe('v3 narrative domain classifier', () => {
  const traps: ReadonlyArray<readonly [string, NarrativeDomain]> = [
    ['maintenance', 'ai'],
    ['maintained', 'ai'],
    ['failure', 'ai'],
    ['airless', 'ai'],
    ['captain', 'ai'],
    ['isolation', 'religion'],
    ['insolvent', 'religion'],
    ['solar', 'religion'],
    ['sold', 'religion'],
    ['solvent', 'religion'],
    ['gold', 'archaeology'],
    ['cold', 'archaeology'],
    ['hold', 'archaeology'],
    ['threshold', 'archaeology'],
    ['older', 'archaeology'],
    ['core', 'trade'],
    ['borealis', 'trade'],
    ['forecast', 'trade'],
    ['dark-sector', 'migration'],
    ['market', 'migration'],
    ['marker', 'migration'],
    ['interrogated', 'exploration'],
    ['calibration', 'labor'],
    ['operations', 'daily-life'],
    ['corporation', 'daily-life'],
    ['dwarf', 'war'],
    ['swarm', 'war'],
    ['warning', 'war'],
    ['warden', 'war'],
    ['hardware', 'war'],
    ['wares', 'war'],
    ['labor', 'science'],
    ['forced-labor', 'science'],
    ['labeled', 'science'],
    ['flawlessly', 'law'],
    ['culture', 'religion'],
    ['agricultural', 'religion'],
    ['charter', 'exploration'],
    ['determines', 'trade'],
    ['famine', 'trade'],
    ['mineral', 'trade'],
    ['minefield', 'trade'],
    ['interstellar', 'stellar-events'],
    ['sceneanchor', 'exploration'],
    ['updraft', 'labor'],
    ['reclaim', 'law'],
    ['rerouted', 'exploration'],
    ['settlement.hiddentruth', 'espionage'],
  ]

  it.each(traps)('does not read %s as %s', (word, domain) => {
    expect(classifyNarrativeDomainsV3(word)).not.toContain(domain)
  })

  const kept: ReadonlyArray<readonly [string, NarrativeDomain]> = [
    ['AI', 'ai'],
    ['AIs', 'ai'],
    ['narrow-AI', 'ai'],
    ['AI-run office', 'ai'],
    ['Sol', 'religion'],
    ['sol-interdiction', 'gardener-interdiction'],
    ['old', 'archaeology'],
    ['ore', 'trade'],
    ['ores', 'trade'],
    ['ark', 'migration'],
    ['arks', 'migration'],
    ['gate', 'exploration'],
    ['gates', 'exploration'],
    ['iggygate', 'exploration'],
    ['ration', 'labor'],
    ['rations', 'public-life'],
    ['rationing', 'labor'],
    ['war', 'war'],
    ['wars', 'war'],
    ['weapons', 'war'],
    ['lab', 'science'],
    ['labs', 'science'],
    ['laboratory', 'science'],
    ['laboratories', 'science'],
    ['law', 'law'],
    ['laws', 'law'],
    ['lawful', 'law'],
    ['lawsuits', 'law'],
    ['outlaw', 'law'],
    ['illegal', 'law'],
    ['illegally', 'law'],
    ['legally', 'law'],
    ['cult', 'religion'],
    ['cults', 'religion'],
    ['chart', 'exploration'],
    ['charts', 'exploration'],
    ['charted', 'exploration'],
    ['charter', 'governance'],
    ['mine', 'trade'],
    ['mines', 'trade'],
    ['miners', 'trade'],
    ['mined', 'trade'],
    ['anchorage', 'exploration'],
    ['anchoring', 'exploration'],
    ['claims', 'law'],
    ['claimant', 'law'],
    ['claimants', 'law'],
    ['refueling', 'trade'],
    ['routes', 'exploration'],
    ['traded', 'trade'],
    ['banking', 'trade'],
    ['taxed', 'trade'],
    ['debts', 'trade'],
    ['secretly', 'espionage'],
    ['quarantined', 'ecology'],
    ['chirality', 'ecology'],
    ['ice-chirality', 'ecology'],
    ['terraforming', 'terraforming'],
    ['terraformer', 'science'],
    ['governance', 'governance'],
    ['government', 'governance'],
    ['strikebreaker', 'labor'],
    ['shielded', 'infrastructure'],
    ['shielding', 'infrastructure'],
    ['ruined', 'archaeology'],
    ['breached', 'disaster'],
    ['hazardous', 'disaster'],
    ['publicly', 'public-life'],
    ['criminalizes', 'crime'],
    ['pinchdrive', 'exploration'],
    ['courtroom', 'law'],
    ['first-wave', 'archaeology'],
    ['black site', 'espionage'],
    ['safe windows', 'route-weather'],
    ['white-dwarf', 'stellar-events'],
    ['traders', 'trade'],
    ['taxes', 'trade'],
    ['breaches', 'disaster'],
    ['weaponized', 'war'],
    ['governing', 'governance'],
    ['chartered', 'governance'],
    ['surveyed', 'science'],
    ['researchers', 'science'],
    ['clinical', 'medicine'],
    ['laborers', 'labor'],
    ['strikers', 'labor'],
    ['repaired', 'infrastructure'],
    ['exiled', 'migration'],
    ['archived', 'archaeology'],
    ['misjumped', 'disaster'],
    ['scouting', 'exploration'],
    ['gateway', 'exploration'],
  ]

  it.each(kept)('reads %s as %s', (word, domain) => {
    expect(classifyNarrativeDomainsV3(word)).toContain(domain)
  })

  it('falls back to public-life when nothing matches', () => {
    expect(classifyNarrativeDomainsV3('')).toEqual(['public-life'])
    expect(classifyNarrativeDomainsV3('maintenance of the gold hold')).toEqual(['infrastructure'])
  })

  it('keeps the v2 group order on trap-free text', () => {
    const text = 'Navy blockade of the trade depot; the council court hears the refugee title near the Iggygate'
    expect(classifyNarrativeDomainsV3(text)).toEqual(classifyNarrativeDomainsV2(text))
  })
})
