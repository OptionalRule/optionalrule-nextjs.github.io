import type { CompanionRelationshipMode } from '../../types'

export function separationToMode(separation: string): CompanionRelationshipMode {
  switch (separation) {
    case 'Contact / near-contact':
      return 'volatile'
    case 'Close binary':
    case 'Tight binary':
      return 'circumbinary'
    case 'Moderate binary':
    case 'Wide binary':
      return 'orbital-sibling'
    case 'Very wide':
      return 'linked-independent'
    case 'Hierarchical triple':
      return 'orbital-sibling'
    default:
      return 'orbital-sibling'
  }
}
