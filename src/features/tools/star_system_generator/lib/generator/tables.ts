import type { TableEntry } from './dice'

export interface StarTypeProfile {
  type: string
  massRange: [number, number]
  luminosityRange: [number, number]
}

export const realisticStarTypes: Array<TableEntry<StarTypeProfile>> = [
  { min: 1, max: 1, value: { type: 'O/B/A bright star', massRange: [1.5, 8.0], luminosityRange: [8.0, 5000.0] } },
  { min: 2, max: 4, value: { type: 'F star', massRange: [1.1, 1.45], luminosityRange: [1.5, 5.0] } },
  { min: 5, max: 11, value: { type: 'G star', massRange: [0.85, 1.1], luminosityRange: [0.6, 1.5] } },
  { min: 12, max: 24, value: { type: 'K star', massRange: [0.55, 0.85], luminosityRange: [0.08, 0.45] } },
  { min: 25, max: 94, value: { type: 'M dwarf', massRange: [0.12, 0.55], luminosityRange: [0.003, 0.08] } },
  { min: 95, max: 98, value: { type: 'White dwarf/remnant', massRange: [0.5, 1.2], luminosityRange: [0.0005, 0.02] } },
  { min: 99, max: 100, value: { type: 'Brown dwarf/substellar primary', massRange: [0.02, 0.08], luminosityRange: [0.00001, 0.0005] } },
]

export const frontierStarTypes: Array<TableEntry<StarTypeProfile>> = [
  { min: 1, max: 48, value: { type: 'M dwarf', massRange: [0.12, 0.55], luminosityRange: [0.003, 0.08] } },
  { min: 49, max: 68, value: { type: 'K star', massRange: [0.55, 0.85], luminosityRange: [0.08, 0.45] } },
  { min: 69, max: 80, value: { type: 'G star', massRange: [0.85, 1.1], luminosityRange: [0.6, 1.5] } },
  { min: 81, max: 87, value: { type: 'F star', massRange: [1.1, 1.45], luminosityRange: [1.5, 5.0] } },
  { min: 88, max: 91, value: { type: 'O/B/A bright star', massRange: [1.5, 8.0], luminosityRange: [8.0, 5000.0] } },
  { min: 92, max: 95, value: { type: 'White dwarf/remnant', massRange: [0.5, 1.2], luminosityRange: [0.0005, 0.02] } },
  { min: 96, max: 98, value: { type: 'Brown dwarf/substellar primary', massRange: [0.02, 0.08], luminosityRange: [0.00001, 0.0005] } },
  { min: 99, max: 100, value: { type: 'Gate-selected anomaly', massRange: [0.2, 1.4], luminosityRange: [0.01, 2.0] } },
]

export const ageStates: Array<TableEntry<string>> = [
  { min: 2, max: 2, value: 'Embryonic/very young' },
  { min: 3, max: 4, value: 'Young' },
  { min: 5, max: 8, value: 'Mature' },
  { min: 9, max: 10, value: 'Old' },
  { min: 11, max: 11, value: 'Very old' },
  { min: 12, max: 12, value: 'Ancient/remnant-associated' },
]

export const metallicities: Array<TableEntry<string>> = [
  { min: 2, max: 2, value: 'Very metal-poor' },
  { min: 3, max: 4, value: 'Metal-poor' },
  { min: 5, max: 8, value: 'Solar-ish' },
  { min: 9, max: 10, value: 'Metal-rich' },
  { min: 11, max: 12, value: 'Very metal-rich' },
]

export const reachabilityClasses: Array<TableEntry<{ className: string; routeNote: string; pinchDifficulty: string }>> = [
  { min: 1, max: 1, value: { className: 'Marginal pinch', routeNote: 'Reachable only with careful fuel, timing, or specialist navigation.', pinchDifficulty: 'Hard' } },
  { min: 2, max: 2, value: { className: 'Dead-end system', routeNote: 'One viable route in and out; useful for prisons, labs, and black sites.', pinchDifficulty: 'Hard' } },
  { min: 3, max: 3, value: { className: 'Slow route', routeNote: 'Stable but costly transit keeps settlement underdeveloped.', pinchDifficulty: 'Moderate' } },
  { min: 4, max: 4, value: { className: 'Ordinary route', routeNote: 'Normal reachable system with predictable traffic.', pinchDifficulty: 'Routine' } },
  { min: 5, max: 5, value: { className: 'Trade spoke', routeNote: 'Connects to one major hub.', pinchDifficulty: 'Routine' } },
  { min: 6, max: 6, value: { className: 'Survey crossroads', routeNote: 'Useful to scouts, independents, and smugglers.', pinchDifficulty: 'Routine' } },
  { min: 7, max: 7, value: { className: 'Resource corridor', routeNote: 'Reachability is tied to chiral or bleed resources.', pinchDifficulty: 'Volatile' } },
  { min: 8, max: 8, value: { className: 'Military lane', routeNote: 'Strategically valuable transit geometry.', pinchDifficulty: 'Restricted' } },
  { min: 9, max: 9, value: { className: 'Corporate gate route', routeNote: 'Stable enough for extraction monopolies.', pinchDifficulty: 'Controlled' } },
  { min: 10, max: 10, value: { className: 'Iggygate anchor', routeNote: 'Permanent or semi-permanent gate infrastructure.', pinchDifficulty: 'Managed' } },
  { min: 11, max: 11, value: { className: 'Resonance hub', routeNote: 'Multiple stable routes due to rich orbital geometry.', pinchDifficulty: 'Complex' } },
  { min: 12, max: 12, value: { className: 'Gardener-shadowed', routeNote: 'Reachable, but Sol or its ASI may monitor or interfere.', pinchDifficulty: 'Politically dangerous' } },
]

export const architectures: Array<TableEntry<{ name: string; description: string; bodyCount: [number, number] }>> = [
  { min: 1, max: 8, value: { name: 'Debris-dominated', description: 'Belts, rubble, impact hazards, and few major planets.', bodyCount: [4, 7] } },
  { min: 9, max: 21, value: { name: 'Compact rocky chain', description: 'Close-in rocky and super-Earth worlds in tight orbits.', bodyCount: [5, 8] } },
  { min: 22, max: 36, value: { name: 'Compact mixed chain', description: 'Rock worlds mixed with sub-Neptunes and regular spacing.', bodyCount: [5, 8] } },
  { min: 37, max: 51, value: { name: 'K-star colony candidate', description: 'Stable inner worlds with cold outer resources.', bodyCount: [6, 9] } },
  { min: 52, max: 64, value: { name: 'Solar-ish mixed', description: 'Inner rocks, belt, outer giants, and ice-zone resources.', bodyCount: [7, 10] } },
  { min: 65, max: 75, value: { name: 'Giant-bearing system', description: 'One or two outer giants with moon economies.', bodyCount: [7, 10] } },
  { min: 76, max: 88, value: { name: 'Disrupted inner system', description: 'Migration, heat, or binary forcing has scarred the inner orbits.', bodyCount: [5, 8] } },
  { min: 89, max: 98, value: { name: 'Relic or dark-sector system', description: 'Remnants, cold bodies, and unusual metric hazards dominate.', bodyCount: [5, 8] } },
  { min: 99, max: 100, value: { name: 'Major GU fracture system', description: 'High-value resources, unstable bleed zones, and major factions.', bodyCount: [7, 10] } },
]

export const guIntensities = ['Geometrically quiet', 'Low bleed', 'Useful bleed', 'Rich bleed', 'Dangerous fracture system', 'Major observerse shear zone'] as const
export const bleedLocations = ['Lagrange point', 'Asteroid belt seam', 'Snow-line volatile belt', 'Gas giant radiation belt', 'Moving node with no fixed orbit', 'System-wide metric storm cycle'] as const
export const guResources = ['Chiral volatile reservoirs', 'Metric shear condensates', 'Dark-sector doped ore', 'Observerse-reactive crystal foam', 'Pinchdrive calibration medium', 'Medical chirality stock'] as const
export const guHazards = ['Navigation baselines drift', 'AI perception errors', 'Chiral contamination', 'Pinchdrive misjump risk', 'Corporate claim war', 'Gardener attention risk'] as const

export const siteOptions = ['automated survey rig', 'chiral mining claim', 'fuel depot', 'quarantine beacon', 'first-wave ruin', 'free captain hideout'] as const
export const settlementLocations = ['Lagrange anchor', 'asteroid tunnel town', 'polar ice mine', 'ring-arc platform', 'Iggygate throat complex', 'moon crater base'] as const
export const settlementScales = ['rotating crew', 'small permanent outpost', 'settlement', 'major industrial site', 'freeport', 'regional power center'] as const
export const authorities = ['worker council', 'megacorp concession', 'gate authority', 'free captain assembly', 'quarantine authority', 'unknown sponsor'] as const
export const crises = ['Flare season arrived early', 'Bleed node changed course', 'AI refuses unsafe operation', 'Labor strike', 'Quarantine violation', 'The official survey is deliberately wrong'] as const
