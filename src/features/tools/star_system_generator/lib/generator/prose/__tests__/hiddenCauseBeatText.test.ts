import { describe, expect, it } from 'vitest'
import { hiddenCauseBeatText } from '../../index'

describe('hiddenCauseBeatText (characterization, retired in Phase 8)', () => {
  it('handles secret starting with "records" with plural verb', () => {
    expect(hiddenCauseBeatText('Records show the false casualty list'))
      .toBe('Records show the false casualty list are driving the conflict.')
  })
  it('handles secret starting with "evidence" with singular verb', () => {
    expect(hiddenCauseBeatText('Evidence of labor massacre'))
      .toBe('Evidence of labor massacre is driving the conflict.')
  })
  it('handles secret starting with "proof" with singular verb', () => {
    expect(hiddenCauseBeatText('Proof of the falsified order'))
      .toBe('Proof of the falsified order is driving the conflict.')
  })
  it('uses "the hidden cause is that" for "the X is/are/..." secrets', () => {
    expect(hiddenCauseBeatText('The settlement is insolvent'))
      .toBe('The hidden cause is that the settlement is insolvent.')
    expect(hiddenCauseBeatText('A debt ledger nobody wants is being audited'))
      .toBe('The hidden cause is that a debt ledger nobody wants is being audited.')
  })
  it('falls back to "the hidden evidence is" for unmatched shapes', () => {
    expect(hiddenCauseBeatText('community funeral compact protects the site'))
      .toBe('The hidden evidence is community funeral compact protects the site.')
  })
  it('strips terminal punctuation from input', () => {
    expect(hiddenCauseBeatText('Evidence of labor massacre.'))
      .toBe('Evidence of labor massacre is driving the conflict.')
  })
})
