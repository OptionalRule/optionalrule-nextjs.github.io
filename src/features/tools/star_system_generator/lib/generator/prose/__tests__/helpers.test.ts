import { describe, expect, it } from 'vitest'
import { lowerFirst, sentenceFragment, sentenceStart, stripTerminalPunctuation, smoothTechnicalPhrase, definiteNounPhrase } from '../helpers'

describe('lowerFirst', () => {
  it('lowercases the first character', () => {
    expect(lowerFirst('Orison Hold')).toBe('orison Hold')
  })
  it('preserves AI prefix', () => {
    expect(lowerFirst('AI custody')).toBe('AI custody')
  })
  it('preserves GU prefix', () => {
    expect(lowerFirst('GU resource')).toBe('GU resource')
  })
  it('preserves Sol prefix', () => {
    expect(lowerFirst('Sol/Gardener watch')).toBe('Sol/Gardener watch')
  })
  it('preserves Iggygate prefix', () => {
    expect(lowerFirst('Iggygate Nosaxa-IV')).toBe('Iggygate Nosaxa-IV')
  })
  it('preserves Pinchdrive prefix', () => {
    expect(lowerFirst('Pinchdrive incident')).toBe('Pinchdrive incident')
  })
  it('returns empty string unchanged', () => {
    expect(lowerFirst('')).toBe('')
  })
})

describe('sentenceFragment', () => {
  it('lowercases first character for ordinary phrase', () => {
    expect(sentenceFragment('Compliance team seizes the port')).toBe('compliance team seizes the port')
  })
  it('preserves AI/GU/Sol/Iggygate/Pinchdrive prefixes', () => {
    expect(sentenceFragment('Sol or Gardener watch')).toBe('Sol or Gardener watch')
    expect(sentenceFragment('AI witness core')).toBe('AI witness core')
  })
  it('lowercases proper-noun-only phrases entirely', () => {
    expect(sentenceFragment('Kestrel Free Compact')).toBe('kestrel free compact')
  })
})

describe('sentenceStart', () => {
  it('uppercases the first character', () => {
    expect(sentenceStart('compliance team')).toBe('Compliance team')
  })
  it('returns empty string unchanged', () => {
    expect(sentenceStart('')).toBe('')
  })
})

describe('stripTerminalPunctuation', () => {
  it('removes trailing period', () => {
    expect(stripTerminalPunctuation('Hello.')).toBe('Hello')
  })
  it('removes trailing question mark', () => {
    expect(stripTerminalPunctuation('Hello?')).toBe('Hello')
  })
  it('removes trailing exclamation', () => {
    expect(stripTerminalPunctuation('Hello!')).toBe('Hello')
  })
  it('removes multiple trailing punctuation', () => {
    expect(stripTerminalPunctuation('Hello!?.')).toBe('Hello')
  })
  it('preserves internal punctuation', () => {
    expect(stripTerminalPunctuation('Hello, world.')).toBe('Hello, world')
  })
})

describe('smoothTechnicalPhrase', () => {
  it('smooths refinery/gate/AI compound', () => {
    expect(smoothTechnicalPhrase('a refinery/gate/AI seizure'))
      .toBe('a the refinery, gate, or AI systems seizure')
  })
  it('smooths metric/radiation', () => {
    expect(smoothTechnicalPhrase('metric/radiation hazard'))
      .toBe('metric and radiation hazard')
  })
  it('smooths shielding/chiral', () => {
    expect(smoothTechnicalPhrase('shielding/chiral overlap'))
      .toBe('shielding and chiral overlap')
  })
  it('smooths Sol/Gardener', () => {
    expect(smoothTechnicalPhrase('Sol/Gardener compliance team'))
      .toBe('Sol or Gardener compliance team')
  })
  it('passes through unchanged when no patterns match', () => {
    expect(smoothTechnicalPhrase('the chiral ice belt'))
      .toBe('the chiral ice belt')
  })
})

describe('definiteNounPhrase', () => {
  it('adds "the" prefix to bare noun', () => {
    expect(definiteNounPhrase('Iggygate control station'))
      .toBe('the Iggygate control station')
  })
  it('preserves existing "the" prefix', () => {
    expect(definiteNounPhrase('the loading dock'))
      .toBe('the loading dock')
  })
  it('preserves "a"/"an" prefixes', () => {
    expect(definiteNounPhrase('a fueling depot')).toBe('a fueling depot')
    expect(definiteNounPhrase('an outpost')).toBe('an outpost')
  })
  it('preserves "access to"/"control of"/"custody of" leads', () => {
    expect(definiteNounPhrase('access to the gate')).toBe('access to the gate')
    expect(definiteNounPhrase('control of quotas')).toBe('control of quotas')
    expect(definiteNounPhrase('custody of records')).toBe('custody of records')
  })
  it('strips terminal punctuation before processing', () => {
    expect(definiteNounPhrase('Iggygate.')).toBe('the Iggygate')
  })
  it('returns empty string unchanged', () => {
    expect(definiteNounPhrase('')).toBe('')
  })
})
