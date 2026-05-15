import type { GlyphComponent, GlyphId, GlyphMeta } from './types'
import { SurfaceCity } from './glyphs/SurfaceCity'
import { SurfaceOutpost } from './glyphs/SurfaceOutpost'
import { SurfaceDome } from './glyphs/SurfaceDome'
import { BeltRockBase } from './glyphs/BeltRockBase'
import { DriftHabitat } from './glyphs/DriftHabitat'
import { OrbitalCoriolis } from './glyphs/OrbitalCoriolis'
import { OrbitalOrbis } from './glyphs/OrbitalOrbis'
import { OrbitalCitadel } from './glyphs/OrbitalCitadel'
import { OrbitalGantry } from './glyphs/OrbitalGantry'
import { OrbitalModular } from './glyphs/OrbitalModular'
import { OrbitalTPlatform } from './glyphs/OrbitalTPlatform'
import { OrbitalCluster } from './glyphs/OrbitalCluster'
import { Gate } from './glyphs/Gate'
import { Ruin } from './glyphs/Ruin'
import { Phenomenon } from './glyphs/Phenomenon'
import { HazardLabel } from './glyphs/HazardLabel'
import { GuBleedLabel } from './glyphs/GuBleedLabel'
import { Habitation } from './glyphs/Habitation'

export const GLYPH_COMPONENTS: Record<GlyphId, GlyphComponent> = {
  A1: SurfaceCity,
  A2: SurfaceOutpost,
  A3: SurfaceDome,
  BR: BeltRockBase,
  DR: DriftHabitat,
  B1: OrbitalCoriolis,
  B2: OrbitalOrbis,
  B3: OrbitalCitadel,
  B4: OrbitalGantry,
  B5: OrbitalModular,
  B6: OrbitalTPlatform,
  B7: OrbitalCluster,
  GT: Gate,
  RU: Ruin,
  PH: Phenomenon,
  HZ: HazardLabel,
  GU: GuBleedLabel,
  HB: Habitation,
}

export const GLYPH_META: Record<GlyphId, GlyphMeta> = {
  A1: { id: 'A1', name: 'Surface · City skyline', register: 'human', description: 'Large-population surface settlement' },
  A2: { id: 'A2', name: 'Surface · Outpost cluster', register: 'human', description: 'Small surface base, sky platform, tethered tower' },
  A3: { id: 'A3', name: 'Surface · Dome habitat', register: 'human', description: 'Sealed arcology, dome colony' },
  BR: { id: 'BR', name: 'Belt/Rock base', register: 'human', description: 'Asteroid base, hollow asteroid, belt cluster, moon base' },
  DR: { id: 'DR', name: 'Drift habitat', register: 'human', description: 'Drift colony, distributed swarm, generation ship, deep-space platform' },
  B1: { id: 'B1', name: 'Orbital · Coriolis', register: 'human', description: 'Octagonal hull, central docking slot, radial antennas' },
  B2: { id: 'B2', name: 'Orbital · Orbis', register: 'human', description: 'Wide flat ring transected by central spindle' },
  B3: { id: 'B3', name: 'Orbital · Citadel', register: 'human', description: 'Asymmetric fortress hull, dorsal spires' },
  B4: { id: 'B4', name: 'Orbital · Industrial gantry', register: 'human', description: 'Vertical spine threading stacked platform discs' },
  B5: { id: 'B5', name: 'Orbital · Modular cross', register: 'human', description: 'Octagonal core with cross-arrangement of modules' },
  B6: { id: 'B6', name: 'Orbital · T-platform outpost', register: 'human', description: 'Cross truss with single habitat module + side dock' },
  B7: { id: 'B7', name: 'Orbital · Module cluster', register: 'human', description: 'Tiny core with bolt-on cylinder, supply tank, solar array' },
  GT: { id: 'GT', name: 'Gate', register: 'gate', description: 'Route node — outer ring + dashed aperture + cardinal struts' },
  RU: { id: 'RU', name: 'Ruin', register: 'ruin', description: 'Standing fragment with broken roof + collapsed structure' },
  PH: { id: 'PH', name: 'Phenomenon', register: 'phenomenon', description: 'System anomaly · magenta' },
  HZ: { id: 'HZ', name: 'Hazard label', register: 'hazard', description: 'Companion glyph for HazardVolume · orange' },
  GU: { id: 'GU', name: 'GU bleed label', register: 'gu', description: 'Companion glyph for GuBleedVolume · violet-pink' },
  HB: { id: 'HB', name: 'Habitation · Inhabited body', register: 'human', description: 'Shelter ideogram on bodies with background population beyond the named settlements' },
}

export const GLYPH_IDS: ReadonlyArray<GlyphId> = [
  'A1', 'A2', 'A3', 'BR', 'DR',
  'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7',
  'GT', 'RU', 'PH', 'HZ', 'GU', 'HB',
]
