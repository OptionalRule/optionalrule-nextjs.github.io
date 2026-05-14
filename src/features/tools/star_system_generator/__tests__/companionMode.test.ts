import { describe, expect, it } from 'vitest'
import { separationToMode } from '../lib/generator/companionMode'

describe('separationToMode', () => {
  it('maps Contact / near-contact to volatile', () => {
    expect(separationToMode('Contact / near-contact')).toBe('volatile')
  })

  it('maps Close binary and Tight binary to circumbinary', () => {
    expect(separationToMode('Close binary')).toBe('circumbinary')
    expect(separationToMode('Tight binary')).toBe('circumbinary')
  })

  it('maps Moderate binary and Wide binary to orbital-sibling', () => {
    expect(separationToMode('Moderate binary')).toBe('orbital-sibling')
    expect(separationToMode('Wide binary')).toBe('orbital-sibling')
  })

  it('maps Very wide to linked-independent', () => {
    expect(separationToMode('Very wide')).toBe('linked-independent')
  })

  it('maps Hierarchical triple inner entry to orbital-sibling', () => {
    expect(separationToMode('Hierarchical triple')).toBe('orbital-sibling')
  })
})
