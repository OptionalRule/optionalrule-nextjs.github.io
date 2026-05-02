import { describe, expect, it } from 'vitest'
import { lowerFirst, sentenceFragment, sentenceStart, stripTerminalPunctuation } from '../helpers'

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
