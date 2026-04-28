import type {
  BodyCategory,
  BodyPhysicalHints,
  Fact,
  GeneratedSystem,
  GenerationOptions,
  GuPreference,
  HumanRemnant,
  Moon,
  OrbitingBody,
  PlanetaryDetail,
  RingSystem,
  Settlement,
  Star,
  StellarCompanion,
  SystemPhenomenon,
} from '../../types'
import { calculateHabitableZone, calculateInsolation, calculateSnowLine, classifyThermalZone, roundTo } from './calculations'
import { d8, d12, d20, d100, pickOne, pickTable, twoD6 } from './dice'
import { createSeededRng, type SeededRng } from './rng'
import {
  ageStates,
  architectures,
  frontierStarTypes,
  metallicities,
  reachabilityClasses,
  realisticStarTypes,
  siteOptions,
} from './tables'

const systemPrefixes = ['Keid', 'Vesper', 'Lumen', 'Harrow', 'Sable', 'Marrow', 'Orison', 'Nadir', 'Calder', 'Pale']
const systemSuffixes = ['Ladder', 'Verge', 'Crown', 'Breach', 'Harbor', 'Glass', 'Wake', 'Cairn', 'Tide', 'Gate']
const bodyNames = [
  'Ashkey',
  'Red Vane',
  'Sable',
  'Harrowglass',
  'Cinder',
  'Pale Belt',
  'Mourn',
  'Chime',
  'Vey',
  'Dross',
  'Siren',
  'Gath',
  'Low Lantern',
  'Blackwater',
  'Pilgrim',
  'Rook',
  'Kestrel',
  'Vigilance',
  'Old Copper',
  'Ninth Choir',
  'Cold Chapel',
  'Ravel',
  'Warden',
  'Glasswake',
]
const moonNames = ['Silt', 'Brine', 'Kettle', 'Palehook', 'Vigil', 'Thresh', 'Low Bell', 'Cairnlet']

const activityLabels = [
  { max: 3, value: 'Dormant / unusually quiet' },
  { max: 6, value: 'Quiet' },
  { max: 8, value: 'Normal' },
  { max: 10, value: 'Active' },
  { max: 12, value: 'Flare-prone' },
  { max: 14, value: 'Violent flare cycle' },
  { max: Number.POSITIVE_INFINITY, value: 'Extreme activity / metric-amplified events' },
] as const

const guIntensityTable = [
  { max: 4, value: 'Geometrically quiet' },
  { max: 6, value: 'Low bleed' },
  { max: 8, value: 'Useful bleed' },
  { max: 10, value: 'Rich bleed' },
  { max: 12, value: 'Dangerous fracture system' },
  { max: Number.POSITIVE_INFINITY, value: 'Major observiverse shear zone' },
] as const

const bleedLocationTable = [
  'Inner star-skimming orbit',
  'Flare-coupled magnetosphere',
  'Tidally locked planet terminator',
  'Planetary nightside cold trap',
  'Resonant orbit between two planets',
  'Lagrange point',
  'Trojan swarm',
  'Asteroid belt seam',
  'Snow-line volatile belt',
  'Ring arc',
  'Gas giant radiation belt',
  'Major moon tidal corridor',
  'Ice-shell ocean vent field',
  'Circumbinary barycenter region',
  'Wide-binary transfer corridor',
  'Comet stream',
  'Derelict Iggygate wake',
  'Pinchdrive calibration scar',
  'Moving node with no fixed orbit',
  'System-wide metric storm cycle',
] as const

const bleedBehaviorTable = [
  'Stable and charted',
  'Stable but weakening',
  'Seasonal/orbital cycle',
  'Flare-triggered',
  'Tidal-cycle triggered',
  'Migrates slowly',
  'Splits and recombines',
  'Appears only during eclipses',
  'Follows cometary bodies',
  'Reacts to Pinchdrives',
  'Reacts to narrow observiverse AIs',
  'Apparently anticipatory, but not intelligent',
] as const

const guResourceTable = [
  'Left-handed chiral silicates',
  'Right-handed chiral ice phases',
  'Chiral volatile reservoirs',
  'Metric shear condensates',
  'Phase-stable superconductive lattice',
  'Dark-sector doped ore',
  'Gravity-skewed heavy isotopes',
  'Programmable-matter microseeds',
  'Self-ordering regolith',
  'Observiverse-reactive crystal foam',
  'Flare-imprinted chiral aerosols',
  'Ring-arc phase dust',
  'Snow-line organochemical feedstock',
  'Deep-ocean catalytic vent matter',
  'Iggygate-compatible anchor mass',
  'Pinchdrive calibration medium',
  'Narrow-AI stabilizer substrate',
  'Shielding-grade chiral plating feedstock',
  'Medical chirality stock',
  'Illegal Sol-prohibited geometry sample',
] as const

const guHazardTable = [
  'Metric shear damages hulls',
  'Local gravity fluctuates',
  'Navigation baselines drift',
  'Clocks desynchronize',
  'AI perception errors',
  'False sensor returns',
  'Human vestibular/neurological effects',
  'Chiral contamination',
  'Matter phase instability',
  'Programmed regolith growth',
  'Radiation/metric storm coupling',
  'Pinchdrive misjump risk',
  'Iggygate throat instability',
  'Legal quarantine',
  'Corporate claim war',
  'Pirate ambush zone',
  'Gardener attention risk',
  'Narrow-AI fragmentation risk',
  'Settlement madness rumor, actually environmental',
  'Systemic cascade',
] as const

interface WorldClassOption {
  className: string
  category: BodyCategory
  massClass: string
}

interface FilteredWorldClass {
  bodyClass: WorldClassOption
  physical: BodyPhysicalHints
  filterNotes: Array<Fact<string>>
}

type BodyPlanKind =
  | 'rocky'
  | 'super-earth'
  | 'sub-neptune'
  | 'belt'
  | 'ice-belt'
  | 'gas-giant'
  | 'ice-giant'
  | 'dwarf'
  | 'rogue'
  | 'anomaly'
  | 'thermal'

type SettlementSiteCategory =
  | 'Surface settlement'
  | 'Orbital station'
  | 'Asteroid or belt base'
  | 'Moon base'
  | 'Deep-space platform'
  | 'Gate or route node'
  | 'Mobile site'
  | 'Derelict or restricted site'

interface SettlementLocationOption {
  label: string
  category: SettlementSiteCategory
}

interface SettlementAnchor {
  kind: string
  name: string
  detail: string
  moonId?: string
}

const worldClassesByThermalZone: Record<string, readonly WorldClassOption[]> = {
  Furnace: [
    { className: 'Iron remnant core', category: 'rocky-planet', massClass: 'Mercury-scale remnant' },
    { className: 'Ultra-dense super-Mercury', category: 'rocky-planet', massClass: 'Dense terrestrial' },
    { className: 'Lava planet', category: 'rocky-planet', massClass: 'Terrestrial' },
    { className: 'Magma ocean world', category: 'super-earth', massClass: 'Super-Earth' },
    { className: 'Carbon-rich furnace world', category: 'rocky-planet', massClass: 'Carbon-rich terrestrial' },
    { className: 'Dayside glass world', category: 'rocky-planet', massClass: 'Terrestrial' },
    { className: 'Nightside mineral frost world', category: 'rocky-planet', massClass: 'Tide-locked terrestrial' },
    { className: 'Stripped mini-Neptune core', category: 'super-earth', massClass: 'Stripped core' },
    { className: 'Hot Neptune desert survivor', category: 'sub-neptune', massClass: 'Rare close-in Neptunian' },
    { className: 'Hot Jupiter', category: 'gas-giant', massClass: 'Hot gas giant' },
    { className: 'Ultra-hot Jupiter', category: 'gas-giant', massClass: 'Ultra-hot gas giant' },
    { className: 'Captured close-in body', category: 'rogue-captured', massClass: 'Captured close-in body' },
    { className: 'Artificially shielded human facility world', category: 'anomaly', massClass: 'Shielded facility world' },
    { className: 'GU-scarred chiral furnace world', category: 'anomaly', massClass: 'Chiral furnace anomaly' },
  ],
  Inferno: [
    { className: 'Rock-vapor atmosphere world', category: 'rocky-planet', massClass: 'Terrestrial' },
    { className: 'Hot super-Earth', category: 'super-earth', massClass: 'Super-Earth' },
    { className: 'Carbon-rich furnace world', category: 'rocky-planet', massClass: 'Carbon-rich terrestrial' },
    { className: 'Ultra-dense super-Mercury', category: 'rocky-planet', massClass: 'Dense terrestrial' },
    { className: 'Tidally stretched volcanic world', category: 'rocky-planet', massClass: 'Tidal volcanic terrestrial' },
    { className: 'Evaporating rocky planet with dust tail', category: 'rocky-planet', massClass: 'Ablating terrestrial' },
    { className: 'Hot sub-Neptune, unstable atmosphere', category: 'sub-neptune', massClass: 'Unstable sub-Neptune' },
    { className: 'Hot Jupiter', category: 'gas-giant', massClass: 'Hot gas giant' },
    { className: 'Ultra-hot Jupiter', category: 'gas-giant', massClass: 'Ultra-hot gas giant' },
    { className: 'Roche-distorted world', category: 'anomaly', massClass: 'Tidal remnant' },
    { className: 'Captured close-in body', category: 'rogue-captured', massClass: 'Captured close-in body' },
  ],
  Hot: [
    { className: 'Airless scorched rock', category: 'rocky-planet', massClass: 'Terrestrial' },
    { className: 'Desert Mercury-like world', category: 'rocky-planet', massClass: 'Mercury-like terrestrial' },
    { className: 'Basaltic super-Earth', category: 'super-earth', massClass: 'Super-Earth' },
    { className: 'Venus-like greenhouse', category: 'rocky-planet', massClass: 'Terrestrial' },
    { className: 'Steam greenhouse', category: 'rocky-planet', massClass: 'Terrestrial' },
    { className: 'Sulfur-cloud world', category: 'rocky-planet', massClass: 'Toxic terrestrial' },
    { className: 'Chlorine/perchlorate desert', category: 'rocky-planet', massClass: 'Reactive-chemistry terrestrial' },
    { className: 'Dry supercontinent world', category: 'rocky-planet', massClass: 'Terrestrial' },
    { className: 'Hot ocean remnant', category: 'super-earth', massClass: 'Super-Earth' },
    { className: 'Dense-atmosphere pressure world', category: 'super-earth', massClass: 'High-pressure super-Earth' },
    { className: 'Tidal-locked eyeball desert', category: 'rocky-planet', massClass: 'Tide-locked terrestrial' },
    { className: 'Super-Earth with high gravity', category: 'super-earth', massClass: 'High-gravity super-Earth' },
    { className: 'Mini-Neptune', category: 'sub-neptune', massClass: 'Sub-Neptune' },
    { className: 'Puffy low-density sub-Neptune', category: 'sub-neptune', massClass: 'Low-density sub-Neptune' },
    { className: 'Warm Neptune', category: 'ice-giant', massClass: 'Warm Neptunian' },
    { className: 'Migrated giant', category: 'gas-giant', massClass: 'Migrated gas giant' },
    { className: 'Resonant inner-chain world', category: 'super-earth', massClass: 'Resonant chain world' },
    { className: 'Chiral mineral harvest world', category: 'anomaly', massClass: 'Chiral resource world' },
    { className: 'Corporate solar-furnace industry world', category: 'anomaly', massClass: 'Industrial facility world' },
    { className: 'Bleed-heated geological anomaly', category: 'anomaly', massClass: 'GU geological anomaly' },
  ],
  'Temperate band': [
    { className: 'Airless rock in nominal HZ', category: 'rocky-planet', massClass: 'Terrestrial' },
    { className: 'Mars-like cold desert', category: 'rocky-planet', massClass: 'Terrestrial' },
    { className: 'Dry terrestrial', category: 'rocky-planet', massClass: 'Terrestrial' },
    { className: 'Thin-atmosphere terrestrial', category: 'rocky-planet', massClass: 'Terrestrial' },
    { className: 'Earth-sized terrestrial', category: 'rocky-planet', massClass: 'Terrestrial' },
    { className: 'Super-terrestrial', category: 'super-earth', massClass: 'Super-Earth' },
    { className: 'Ocean-continent world', category: 'rocky-planet', massClass: 'Terrestrial' },
    { className: 'Waterworld', category: 'rocky-planet', massClass: 'Ocean terrestrial' },
    { className: 'Ice-capped ocean world', category: 'rocky-planet', massClass: 'Ocean terrestrial' },
    { className: 'Tidally locked terminator world', category: 'rocky-planet', massClass: 'Terrestrial' },
    { className: 'Cloudy greenhouse edge world', category: 'rocky-planet', massClass: 'Greenhouse-edge terrestrial' },
    { className: 'Snowball world with subsurface ocean', category: 'rocky-planet', massClass: 'Snowball ocean world' },
    { className: 'High-pressure super-Earth', category: 'super-earth', massClass: 'High-pressure super-Earth' },
    { className: 'Volatile-rich sub-Neptune', category: 'sub-neptune', massClass: 'Sub-Neptune' },
    { className: 'Hycean-like candidate', category: 'sub-neptune', massClass: 'H2-rich ocean candidate' },
    { className: 'Captured eccentric world', category: 'rogue-captured', massClass: 'Captured eccentric planet' },
    { className: 'Terraforming candidate', category: 'super-earth', massClass: 'Super-Earth' },
    { className: 'Failed terraforming site', category: 'rocky-planet', massClass: 'Human-altered terrestrial' },
    { className: 'Native microbial biosphere world', category: 'rocky-planet', massClass: 'Biosphere terrestrial' },
    { className: 'GU-active habitable-zone anomaly', category: 'anomaly', massClass: 'GU habitable-zone anomaly' },
  ],
  Cold: [
    { className: 'Airless ice-rock', category: 'rocky-planet', massClass: 'Ice-rock terrestrial' },
    { className: 'Frozen Mars-like world', category: 'rocky-planet', massClass: 'Ice-rock terrestrial' },
    { className: 'Buried-ocean ice world', category: 'rocky-planet', massClass: 'Ice-rock terrestrial' },
    { className: 'Nitrogen glacier world', category: 'dwarf-body', massClass: 'Dwarf planet' },
    { className: 'Methane frost world', category: 'dwarf-body', massClass: 'Dwarf planet' },
    { className: 'Ammonia-water cryoworld', category: 'rocky-planet', massClass: 'Ice-rock terrestrial' },
    { className: 'Carbon dioxide ice world', category: 'dwarf-body', massClass: 'CO2 ice dwarf' },
    { className: 'Ice-shell ocean world', category: 'rocky-planet', massClass: 'Ice-shell world' },
    { className: 'Cryovolcanic world', category: 'rocky-planet', massClass: 'Cryovolcanic terrestrial' },
    { className: 'Captured dwarf planet', category: 'dwarf-body', massClass: 'Captured dwarf planet' },
    { className: 'Cold super-Earth', category: 'super-earth', massClass: 'Super-Earth' },
    { className: 'Ice-rich asteroid belt', category: 'belt', massClass: 'Minor-body belt' },
    { className: 'Cometary swarm', category: 'belt', massClass: 'Comet reservoir' },
    { className: 'Small ice giant', category: 'ice-giant', massClass: 'Small ice giant' },
    { className: 'Neptune-like ice giant', category: 'ice-giant', massClass: 'Ice giant' },
    { className: 'Gas giant near snow line', category: 'gas-giant', massClass: 'Snow-line gas giant' },
    { className: 'Ringed giant with moons', category: 'gas-giant', massClass: 'Gas giant' },
    { className: 'Trojan settlement zone', category: 'belt', massClass: 'Trojan swarm' },
    { className: 'Dark-sector density anomaly', category: 'anomaly', massClass: 'Dark-sector anomaly' },
    { className: 'Moving bleed node nursery', category: 'anomaly', massClass: 'Moving GU node' },
  ],
  Cryogenic: [
    { className: 'Dwarf planet', category: 'dwarf-body', massClass: 'Dwarf planet' },
    { className: 'Kuiper-like belt', category: 'belt', massClass: 'Outer debris belt' },
    { className: 'Scattered disk object', category: 'dwarf-body', massClass: 'Scattered disk object' },
    { className: 'Ice giant', category: 'ice-giant', massClass: 'Ice giant' },
    { className: 'Cometary swarm', category: 'belt', massClass: 'Comet reservoir' },
    { className: 'Rogue captured planet', category: 'rogue-captured', massClass: 'Captured planet' },
    { className: 'Free-floating planet bound at extreme distance', category: 'rogue-captured', massClass: 'Distant bound rogue' },
    { className: 'Frozen super-Earth', category: 'super-earth', massClass: 'Frozen super-Earth' },
    { className: 'Hydrogen-atmosphere rogue world', category: 'rogue-captured', massClass: 'Hydrogen rogue world' },
    { className: 'Cold gas giant', category: 'gas-giant', massClass: 'Cold gas giant' },
    { className: 'Super-Jovian', category: 'gas-giant', massClass: 'Super-Jovian' },
    { className: 'Brown-dwarf companion', category: 'anomaly', massClass: 'Brown-dwarf companion' },
    { className: 'Ancient impact family', category: 'belt', massClass: 'Impact-family debris' },
    { className: 'Dark refueling body', category: 'dwarf-body', massClass: 'Dwarf planet' },
    { className: 'Long-period comet storm source', category: 'belt', massClass: 'Comet storm source' },
    { className: 'Smuggler ice depot', category: 'dwarf-body', massClass: 'Hidden depot body' },
    { className: 'Exile habitat', category: 'dwarf-body', massClass: 'Hidden habitat body' },
    { className: 'Black-lab platform', category: 'anomaly', massClass: 'Hidden facility platform' },
    { className: 'Gardener-shadowed forbidden zone', category: 'anomaly', massClass: 'Interdicted zone' },
    { className: 'Deep observiverse fracture', category: 'anomaly', massClass: 'Metric anomaly' },
  ],
  Dark: [
    { className: 'Dwarf planet', category: 'dwarf-body', massClass: 'Dwarf planet' },
    { className: 'Kuiper-like belt', category: 'belt', massClass: 'Outer debris belt' },
    { className: 'Scattered disk object', category: 'dwarf-body', massClass: 'Scattered disk object' },
    { className: 'Comet reservoir', category: 'belt', massClass: 'Outer comet cloud' },
    { className: 'Rogue captured planet', category: 'rogue-captured', massClass: 'Captured planet' },
    { className: 'Free-floating planet bound at extreme distance', category: 'rogue-captured', massClass: 'Distant bound rogue' },
    { className: 'Frozen super-Earth', category: 'super-earth', massClass: 'Frozen super-Earth' },
    { className: 'Hydrogen-atmosphere rogue world', category: 'rogue-captured', massClass: 'Hydrogen rogue world' },
    { className: 'Ice giant', category: 'ice-giant', massClass: 'Ice giant' },
    { className: 'Cold gas giant', category: 'gas-giant', massClass: 'Cold gas giant' },
    { className: 'Super-Jovian', category: 'gas-giant', massClass: 'Super-Jovian' },
    { className: 'Brown-dwarf companion', category: 'anomaly', massClass: 'Brown-dwarf companion' },
    { className: 'Ancient impact family', category: 'belt', massClass: 'Impact-family debris' },
    { className: 'Dark refueling body', category: 'dwarf-body', massClass: 'Dwarf planet' },
    { className: 'Long-period comet storm source', category: 'belt', massClass: 'Comet storm source' },
    { className: 'Exile habitat', category: 'dwarf-body', massClass: 'Hidden habitat body' },
    { className: 'Black-lab platform', category: 'anomaly', massClass: 'Hidden facility platform' },
    { className: 'Gardener-shadowed forbidden zone', category: 'anomaly', massClass: 'Interdicted zone' },
    { className: 'Deep observiverse fracture', category: 'anomaly', massClass: 'Metric anomaly' },
  ],
}

const forcedWorldClasses = {
  rocky: { className: 'Rocky terrestrial world', category: 'rocky-planet', massClass: 'Terrestrial' },
  superEarth: { className: 'Super-terrestrial world', category: 'super-earth', massClass: 'Super-Earth' },
  subNeptune: { className: 'Volatile-rich sub-Neptune', category: 'sub-neptune', massClass: 'Sub-Neptune' },
  belt: { className: 'Main debris belt', category: 'belt', massClass: 'Minor-body belt' },
  iceBelt: { className: 'Outer ice belt', category: 'belt', massClass: 'Outer debris belt' },
  gasGiant: { className: 'Ringed giant with moons', category: 'gas-giant', massClass: 'Gas giant' },
  iceGiant: { className: 'Neptune-like ice giant', category: 'ice-giant', massClass: 'Ice giant' },
  dwarf: { className: 'Dwarf planet', category: 'dwarf-body', massClass: 'Dwarf planet' },
  rogue: { className: 'Rogue captured planet', category: 'rogue-captured', massClass: 'Captured planet' },
} satisfies Record<string, WorldClassOption>

const beltClassTable: Array<{ min: number; max: number; value: WorldClassOption }> = [
  { min: 1, max: 1, value: { className: 'Sparse rubble', category: 'belt', massClass: 'Minor-body belt' } },
  { min: 2, max: 2, value: { className: 'Metal-rich asteroid belt', category: 'belt', massClass: 'Metal-rich belt' } },
  { min: 3, max: 3, value: { className: 'Carbonaceous belt', category: 'belt', massClass: 'Carbonaceous belt' } },
  { min: 4, max: 4, value: { className: 'Ice-rich belt', category: 'belt', massClass: 'Ice-rich belt' } },
  { min: 5, max: 5, value: { className: 'Trojan swarm', category: 'belt', massClass: 'Trojan swarm' } },
  { min: 6, max: 6, value: { className: 'Resonant fragments', category: 'belt', massClass: 'Resonant debris belt' } },
  { min: 7, max: 7, value: { className: 'Recent collision belt', category: 'belt', massClass: 'Collision debris belt' } },
  { min: 8, max: 8, value: { className: 'Unstable crossing belt', category: 'belt', massClass: 'Crossing-orbit debris' } },
  { min: 9, max: 9, value: { className: 'Circumbinary debris band', category: 'belt', massClass: 'Circumbinary debris band' } },
  { min: 10, max: 10, value: { className: 'White-dwarf metal debris', category: 'belt', massClass: 'Remnant metal debris' } },
  { min: 11, max: 11, value: { className: 'Chiral ore belt', category: 'belt', massClass: 'Chiral ore belt' } },
  { min: 12, max: 12, value: { className: 'Programmable-matter microcluster belt', category: 'belt', massClass: 'Programmable-matter debris' } },
]

const hotThermalZones = new Set(['Furnace', 'Inferno', 'Hot'])
const extremeHotThermalZones = new Set(['Furnace', 'Inferno'])

function isClassAvailableInThermalZone(thermalZone: string, bodyClass: WorldClassOption): boolean {
  return worldClassesByThermalZone[thermalZone]?.some((option) =>
    option.className === bodyClass.className && option.category === bodyClass.category
  ) ?? false
}

const traitOptions = [
  'tidal stress',
  'flare pressure',
  'thin volatile inventory',
  'subsurface ocean candidate',
  'metric survey anomaly',
  'resource-rich regolith',
  'unstable crossing orbit',
  'old first-wave traffic',
] as const

const atmosphereTable = [
  { min: 1, max: 1, value: 'None / hard vacuum' },
  { min: 2, max: 2, value: 'Trace exosphere' },
  { min: 3, max: 3, value: 'Thin CO2/N2' },
  { min: 4, max: 4, value: 'Thin but usable with pressure gear' },
  { min: 5, max: 5, value: 'Moderate inert atmosphere' },
  { min: 6, max: 6, value: 'Moderate toxic atmosphere' },
  { min: 7, max: 7, value: 'Dense CO2/N2' },
  { min: 8, max: 8, value: 'Dense greenhouse' },
  { min: 9, max: 9, value: 'Steam atmosphere' },
  { min: 10, max: 10, value: 'Sulfur/chlorine/ammonia haze' },
  { min: 11, max: 11, value: 'Hydrogen/helium envelope' },
  { min: 12, max: 12, value: 'Chiral-active or GU-distorted atmosphere' },
]
const extremeHotAtmospheres = ['None / hard vacuum', 'Trace exosphere', 'Rock-vapor atmosphere', 'Metal vapor atmosphere', 'Chiral-active atmosphere'] as const
const hydrosphereTable = [
  { min: 1, max: 1, value: 'Bone dry' },
  { min: 2, max: 2, value: 'Hydrated minerals only' },
  { min: 3, max: 3, value: 'Subsurface ice' },
  { min: 4, max: 4, value: 'Polar caps / buried glaciers' },
  { min: 5, max: 5, value: 'Briny aquifers' },
  { min: 6, max: 6, value: 'Local seas' },
  { min: 7, max: 7, value: 'Ocean-continent balance' },
  { min: 8, max: 8, value: 'Global ocean' },
  { min: 9, max: 9, value: 'High-pressure deep ocean' },
  { min: 10, max: 10, value: 'Ice-shell subsurface ocean' },
  { min: 11, max: 11, value: 'Hydrocarbon lakes/seas' },
  { min: 12, max: 12, value: 'Exotic solvent or GU-stabilized fluid chemistry' },
]
const extremeHotVolatiles = ['Bone dry', 'Hydrated minerals only', 'Vaporized volatile traces', 'Nightside mineral frost'] as const
const geologyTable = [
  { min: 1, max: 1, value: 'Dead interior' },
  { min: 2, max: 2, value: 'Ancient cratered crust' },
  { min: 3, max: 3, value: 'Low volcanism' },
  { min: 4, max: 4, value: 'Static lid' },
  { min: 5, max: 5, value: 'Active volcanism' },
  { min: 6, max: 6, value: 'Plate tectonic analogue' },
  { min: 7, max: 7, value: 'Supercontinent cycle' },
  { min: 8, max: 8, value: 'Cryovolcanism' },
  { min: 9, max: 9, value: 'Tidal heating' },
  { min: 10, max: 10, value: 'Extreme plume provinces' },
  { min: 11, max: 11, value: 'Global resurfacing' },
  { min: 12, max: 12, value: 'Programmable-matter geological behavior' },
]
const envelopeGeologies = ['Deep atmospheric circulation', 'Metallic hydrogen interior', 'Layered volatile mantle', 'Magnetosphere-driven weather'] as const
const climateSourceTable = [
  { min: 1, max: 1, value: 'Runaway greenhouse' },
  { min: 2, max: 2, value: 'Moist greenhouse edge' },
  { min: 3, max: 3, value: 'Snowball' },
  { min: 4, max: 4, value: 'Cold desert' },
  { min: 5, max: 5, value: 'Hot desert' },
  { min: 6, max: 6, value: 'Eyeball world' },
  { min: 7, max: 7, value: 'Terminator belt' },
  { min: 8, max: 8, value: 'Permanent storm tracks' },
  { min: 9, max: 9, value: 'Global monsoon' },
  { min: 10, max: 10, value: 'Hypercanes' },
  { min: 11, max: 11, value: 'Twilight ocean' },
  { min: 12, max: 12, value: 'Aerosol winter' },
  { min: 13, max: 13, value: 'Thin-air alpine world' },
  { min: 14, max: 14, value: 'Dense lowland pressure seas' },
  { min: 15, max: 15, value: 'Methane cycle' },
  { min: 16, max: 16, value: 'CO2 glacier cycle' },
  { min: 17, max: 17, value: 'Chiral cloud chemistry' },
  { min: 18, max: 18, value: 'Dark-sector gravity tides' },
  { min: 19, max: 19, value: 'Artificial climate lattice' },
  { min: 20, max: 20, value: 'Recently failed terraforming climate' },
]
const extremeHotClimateTags = ['Runaway greenhouse', 'Hot desert', 'Dayside glass fields', 'Nightside mineral frost', 'Hypercanes', 'Chiral cloud chemistry'] as const
const hotClimateTags = ['Runaway greenhouse', 'Moist greenhouse edge', 'Hot desert', 'Permanent storm tracks', 'Hypercanes', 'Aerosol winter'] as const
const temperateClimateTags = ['Cold desert', 'Hot desert', 'Eyeball world', 'Terminator belt', 'Permanent storm tracks', 'Global monsoon', 'Twilight ocean', 'Recently failed terraforming climate'] as const
const coldClimateTags = ['Snowball', 'Cold desert', 'Aerosol winter', 'Methane cycle', 'CO2 glacier cycle', 'Dark-sector gravity tides'] as const
const extremeHotEnvelopeClimateTags = ['Permanent storm tracks', 'Hypercanes', 'Chiral cloud chemistry', 'Dark-sector gravity tides'] as const
const envelopeClimateTags = ['Permanent storm tracks', 'Hypercanes', 'Methane cycle', 'Chiral cloud chemistry', 'Dark-sector gravity tides'] as const
const radiationTable = [
  { min: 1, max: 1, value: 'Benign' },
  { min: 2, max: 2, value: 'Manageable' },
  { min: 3, max: 3, value: 'Chronic exposure' },
  { min: 4, max: 4, value: 'Storm-dependent hazard' },
  { min: 5, max: 5, value: 'Severe radiation belts' },
  { min: 6, max: 6, value: 'Flare-lethal surface' },
  { min: 7, max: 7, value: 'Electronics-disruptive metric/radiation mix' },
  { min: 8, max: 8, value: 'Only deep shielded habitats survive' },
]
const biospheres = ['Sterile', 'Prebiotic chemistry', 'Ambiguous biosignatures', 'Microbial life', 'Extremophile microbial ecology', 'Simple macroscopic non-sapient life'] as const
const moonTypes = ['Airless rock', 'Cratered ice-rock', 'Captured asteroid', 'Captured dwarf', 'Subsurface ocean moon', 'Thick ice-shell moon', 'Cryovolcanic moon', 'Volcanic tidal moon', 'Dense-atmosphere moon', 'Hydrocarbon moon', 'Habitable-zone moon', 'Radiation-scorched inner moon', 'Ring-shepherd moon', 'Chiral ice moon', 'Dark-sector density moon', 'Programmable regolith moon', 'Former settlement moon', 'Active mining moon', 'Quarantine moon', 'Moving bleed node moon'] as const
const moonScales = ['minor captured moonlet', 'small major moon', 'mid-sized icy moon', 'large differentiated moon', 'planet-scale major moon'] as const
const ringTypeTable: Array<{ min: number; max: number; value: string }> = [
  { min: 1, max: 4, value: 'None or faint' },
  { min: 5, max: 5, value: 'Dust ring' },
  { min: 6, max: 6, value: 'Ice ring' },
  { min: 7, max: 7, value: 'Rocky ring' },
  { min: 8, max: 8, value: 'Shepherded bright rings' },
  { min: 9, max: 9, value: 'Warped inclined rings' },
  { min: 10, max: 10, value: 'Radiation-charged rings' },
  { min: 11, max: 11, value: 'Industrialized ring arc' },
  { min: 12, max: 12, value: 'GU-reactive ring lattice' },
]
const surveyFunctions = ['Survey station', 'Astrometry/nav beacon', 'Sensor picket', 'Weather/flare monitoring', 'Planetology lab'] as const
const extractionFunctions = ['Metal mine', 'Volatile mine', 'Chiral harvesting site', 'Dark-sector ore extraction', 'Refinery'] as const
const orbitalFunctions = ['Fuel depot', 'Ship repair yard', 'Full shipyard', 'Drone foundry', 'Shielding/chiral plating works', 'Freeport', 'Smuggler port'] as const
const routeFunctions = ['Iggygate control station', 'Pinchdrive tuning station', 'Corporate customs post', 'Freeport', 'Astrometry/nav beacon', 'Quarantine station'] as const
const securityFunctions = ['Military base', 'Listening post', 'Naval logistics depot', 'Weapons test range', 'Quarantine station', 'Intelligence black site'] as const
const civilFunctions = ['Civilian colony', 'Terraforming camp', 'Refugee settlement', 'Prison or debt-labor site', 'Religious/ideological enclave', 'Narrow-AI observiverse facility'] as const
const guFractureFunctionsBySiteCategory: Record<SettlementSiteCategory, readonly string[]> = {
  'Surface settlement': ['Chiral harvesting site', 'Programmable-matter containment site', 'Narrow-AI observiverse facility', 'Quarantine station'],
  'Orbital station': ['Chiral harvesting site', 'Programmable-matter containment site', 'Narrow-AI observiverse facility', 'Quarantine station', 'Pinchdrive tuning station'],
  'Asteroid or belt base': ['Chiral harvesting site', 'Dark-sector ore extraction', 'Programmable-matter containment site', 'Quarantine station'],
  'Moon base': ['Chiral harvesting site', 'Dark-sector ore extraction', 'Narrow-AI observiverse facility', 'Quarantine station'],
  'Deep-space platform': ['Moving bleed-node tracking platform', 'Pinchdrive tuning station', 'Narrow-AI observiverse facility', 'Quarantine station'],
  'Gate or route node': ['Iggygate control station', 'Pinchdrive tuning station', 'Quarantine station', 'Narrow-AI observiverse facility'],
  'Mobile site': ['Moving bleed-node harvest fleet', 'Freeport', 'Smuggler port', 'Refugee settlement', 'Naval logistics depot'],
  'Derelict or restricted site': ['Programmable-matter containment site', 'Intelligence black site', 'Quarantine station', 'Weapons test range'],
}
const orbitalBuiltForms = ['Inflatable modules', 'Rotating cylinder', 'Non-rotating microgravity stack', 'Modular orbital lattice', 'Ring-habitat arc', 'Corporate luxury enclave', 'Slum raft cluster'] as const
const asteroidBuiltForms = ['Buried pressure cans', 'Ice-shielded tunnels', 'Asteroid hollow', 'Modular orbital lattice', 'Shielded military bunker', 'First-wave retrofitted ruin'] as const
const moonBuiltForms = ['Buried pressure cans', 'Ice-shielded tunnels', 'Dome cluster', 'Borehole habitat', 'Shielded military bunker', 'First-wave retrofitted ruin'] as const
const surfaceBuiltForms = ['Buried pressure cans', 'Ice-shielded tunnels', 'Lava-tube arcology', 'Dome cluster', 'Rail-linked terminator city', 'Aerostat city', 'Submarine habitat', 'Borehole habitat', 'Shielded military bunker', 'Corporate luxury enclave', 'First-wave retrofitted ruin'] as const
const gateBuiltForms = ['Non-rotating microgravity stack', 'Modular orbital lattice', 'Ring-habitat arc', 'Shielded military bunker', 'Partly self-growing programmable structure'] as const
const mobileBuiltForms = ['Inflatable modules', 'Crawling mobile base', 'Modular orbital lattice', 'Rotating cylinder', 'Shielded military bunker'] as const
const derelictBuiltForms = ['Asteroid hollow', 'Shielded military bunker', 'First-wave retrofitted ruin', 'Partly self-growing programmable structure'] as const
const settlementAuthorities = ['No recognized authority', 'Direct democracy / crew vote', 'Family syndicate', 'Worker council', 'Frontier sheriff or magistrate', 'Emergency commander', 'Minor corporation', 'Megacorp concession', 'Trade house', 'Banking or debt trust', 'Insurance-backed administrator', 'Extraction guild', 'Local militia', 'System navy', 'Interstellar navy', 'Intelligence service', 'Quarantine authority', 'Gate authority', 'Academic institute', 'Research consortium', 'Medical/biosafety board', 'AI-supervised technocracy', 'Terraforming directorate', 'Chiral-harvest cartel', 'Religious commune', 'Exile council', 'Pirate clan', 'Smuggler compact', 'Revolutionary cell', 'Criminal protection racket', 'Sol-interdiction compliance office', 'Gardener-fear cult', 'Independent captain assembly', 'Mercenary company', 'Unknown sponsor', 'Official records are falsified'] as const
const aiSituations = ['No AI; dangerously manual', 'Obsolete but loyal AI', 'Overworked single AI', 'Multiple narrow AIs in stable partition', 'AI heavily censored after incident', 'AI speaks only through approved operators', 'AI is beloved as local crew', 'AI treated as property', 'AI manages life support flawlessly', 'AI handles navigation/traffic only', 'AI controls mining drones', 'AI controls security', 'AI has memory gaps', 'AI predicts bleed shifts too well', 'AI refuses certain commands', 'AI gives contradictory but valid advice', 'AI has a hidden emergency protocol', 'AI is being illegally expanded', 'AI has split into rival task-fragments', 'AI is compromised by chiral contamination', 'AI hallucinates during metric storms', 'AI is under corporate remote override', 'AI is being interrogated by investigators', 'AI wants evacuation but cannot say why', 'AI is the only witness to a disaster', 'AI is protecting illegal residents', 'AI is running the settlement better than humans admit', 'AI is blamed for human corruption', 'AI may trigger Gardener attention if pushed', 'AI was cut down from a more capable illegal architecture', 'AI is missing', 'AI has been replaced by an impostor system', 'AI runs a secret simulation of the settlement', 'AI is obeying old first-wave orders', 'AI is loyal to the wrong authority', 'AI is one bad command away from catastrophe'] as const
const settlementConditions = ['Pristine and overfunded', 'Efficient but joyless', 'Wealthy core enclave', 'Militarized and tense', 'Corporate showroom', 'Secretly brittle', 'Functional frontier town', 'Expanding too fast', 'Poor but cooperative', 'Improvised repairs everywhere', 'Understaffed', 'Supply-starved', 'Decaying first-wave infrastructure', 'Half-abandoned', 'Recently attacked', 'Recently evacuated', 'Reoccupied ruin', 'Built on bad survey data', 'Overrun by debt labor', 'Divided by class zones', 'Split between surface and orbital populations', 'Officially safe, actually hazardous', 'Life support near failure', 'Radiation shielding degraded', 'Under quarantine', 'Under blockade', 'Under corporate lockdown', 'Under military occupation', 'Under legal dispute', 'Under quiet Gardener warning', 'Hidden prosperity', 'Hidden famine', 'Hidden epidemic or contamination', 'Hidden AI incident', 'Hidden civil war', 'Hidden reason it cannot be abandoned'] as const
const settlementTags = ['Abandoned First Wave', 'Air Is Money', 'AI Whisper Cult', 'Anti-Corporate Commune', 'Aristocratic Dome', 'Automated but Haunted', 'Bleed-Chaser Port', 'Border Fort', 'Broken Terraformer', 'Chiral Monopoly', 'Debt Labor', 'Deep Ice', 'Derelict Yard', 'Elegant Core Enclave', 'Exile Haven', 'Flare Refuge', 'Free Captain Nest', 'Gate Shadow', 'Ghost City, Human', 'High-G Research', 'Hidden Navy', 'Hydrocarbon Frontier', 'Kessler Cloud', 'Machine-Run Town', 'Memory-Loss Zone', 'Migrant Swarm', 'Moving Node Rush', 'Narrow-AI Schism', 'Old War Minefield', 'Outlaw Court', 'Penal Extraction', 'Perfect Dome, Rotten Outside', 'Plague/Biosafety Fear', 'Precious Water', 'Religious Geometry', 'Strikebreaker City'] as const
const settlementCrises = ['Life-support cascade', 'Water ration failure', 'Food culture contamination', 'Radiation storm incoming', 'Flare season arrived early', 'Hull breach hidden from public', 'Bleed node changed course', 'Chiral harvest turned toxic', 'Metric storm trapped ships', 'Iggygate schedule failure', 'Pinchdrive calibration accident', 'AI refuses unsafe operation', 'Labor strike', 'Debt revolt', 'Corporate security crackdown', 'Pirate protection demand', 'Smuggler war', 'Refugee surge', 'Quarantine violation', 'Unknown native microbial hazard', 'Failed terraforming release', 'Medical supplies stolen', 'Illegal AI expansion discovered', 'Sol/Gardener warning sign detected', 'Military coup', 'Election or succession crisis', 'Sabotage of refinery/gate/AI', 'Essential expert missing', 'Salvage claim dispute', 'Old first-wave map found', 'Children or civilians trapped', 'Ship full of dead arrives', 'A whole district goes silent', 'The base broadcasts two contradictory distress calls', 'Everyone is lying about casualty numbers', 'Crisis is staged to hide something worse'] as const
const hiddenTruths = ['The settlement is insolvent', 'The mine is nearly exhausted', 'The resource is richer than reported', 'The hazard is artificial/human-caused', 'The official death toll is false', 'The founders committed a crime', 'Corporate records were altered', 'The local AI deleted evidence', 'The local AI preserved forbidden evidence', 'The base is built on unstable ground/orbit', 'The settlement cannot survive evacuation', 'The workers are legally trapped', 'The site is a weapons lab', 'The site is an illegal AI lab', 'The site is a black prison', 'The site is a military listening post', 'The site is a fake colony masking extraction', 'The site is a smuggling hub', 'A first-wave expedition survived in hiding', 'The ghosts are old human recordings', 'The curse is chiral neurochemistry', 'The miracle is illegal terraforming tech', 'The supposed unknown signal is human encryption', 'The artifact rumor is a natural GU formation', 'The Gardener has already intervened once', 'Sol interdiction files are sealed here', 'A faction is provoking Gardener attention', 'The Iggygate is misaligned on purpose', 'The bleed node is being illegally stabilized', 'The settlement has an evacuation ark nobody knows about', 'The leader is a proxy for a distant faction', 'The pirate threat is staged', 'The quarantine is political', 'The plague is industrial poisoning', 'The AI is sane; the humans are not listening', 'The system official survey is deliberately wrong'] as const
const encounterSites = ['Half-flooded maintenance tunnels', 'Shielding crawlspace district', 'Dockside free market', 'Drone hangar', 'AI core vault', 'Chiral refinery floor', 'Bleed-harvest control room', 'Closed habitat ring', 'Quarantine ward', 'Black-market clinic', 'Corporate executive dome', 'Worker barracks', 'Religious geometry chapel', 'Old first-wave command bunker', 'Illegal pinchdrive test chamber', 'Radiation storm shelter', 'Water plant', 'Courtroom / debt registry', 'Hidden launch bay', 'Place the maps say does not exist'] as const
const settlementScaleTable = ['Abandoned', 'Automated only', '1-20 people', '21-100 people', '101-1,000 people', '1,001-10,000 people', '10,001-100,000 people', '100,001-1 million people', '1-10 million people', '10+ million people', 'Distributed swarm settlement', 'Population unknown or deliberately falsified'] as const
const humanRemnants = ['Survey probe field', 'Dead relay buoy', 'Abandoned mining claim', 'Burned-out research dome', 'First-wave colony shell', 'Ruined terraforming plant', 'Frozen refugee convoy', 'Derelict refinery', 'Old navy depot', 'Illegal AI growth chamber', 'Pinchdrive accident scar', 'Iggygate construction failure', 'Sol-struck outpost', 'Records surgically erased', 'Still broadcasting old distress call'] as const
const remnantHooks = ['claimed by three legal owners', 'contains deleted survey records', 'appears abandoned but still runs automated routines', 'sits inside a drifting hazard zone', 'was erased from corporate maps', 'is used as bait by criminals', 'contains evidence that would alter local politics'] as const
const phenomena = ['Dense debris disk', 'Recent planetary collision', 'Resonant compact chain', 'Trojan megaswarm', 'Long-period comet storm', 'Captured rogue world', 'Flare-amplified bleed season', 'Hot Neptune desert survivor', 'Snow-line chiral belt', 'Ring arc with phase dust', 'Ice-shell plume moon', 'Gas giant radiation maze', 'Failed Iggygate wake', 'Moving bleed-node river', 'Metric mirage zone', 'Native microbial biosphere', 'Failed terraforming biosphere', 'First-wave ghost colony', 'Derelict fleet cluster', 'Gardener warning beacon'] as const

function fact<T>(value: T, confidence: Fact<T>['confidence'], source?: string): Fact<T> {
  return { value, confidence, source }
}

function generateSystemName(rng: SeededRng): string {
  return `${pickOne(rng, systemPrefixes)}'s ${pickOne(rng, systemSuffixes)}`
}

function activityFromRoll(roll: number): string {
  return activityLabels.find((entry) => roll <= entry.max)?.value ?? activityLabels[activityLabels.length - 1].value
}

function generatePrimaryStar(rng: SeededRng, options: GenerationOptions, systemName: string): Star {
  const profile = pickTable(
    rng,
    d100(rng),
    options.distribution === 'realistic' ? realisticStarTypes : frontierStarTypes
  )
  const massSolar = roundTo(rng.float(profile.massRange[0], profile.massRange[1]), 3)
  const luminositySolar = roundTo(rng.float(profile.luminosityRange[0], profile.luminosityRange[1]), 4)
  const ageState = pickTable(rng, twoD6(rng), ageStates)
  const metallicity = pickTable(rng, twoD6(rng), metallicities)

  let activityRoll = twoD6(rng)
  const activityModifiers: Array<Fact<string>> = []
  if (ageState === 'Young') {
    activityRoll += 2
    activityModifiers.push(fact('+2 young star', 'inferred', 'MASS-GU stellar activity modifiers'))
  }
  if (ageState === 'Embryonic/very young') {
    activityRoll += 1
    activityModifiers.push(fact('+1 very young star', 'inferred', 'MASS-GU stellar activity modifiers'))
  }
  if (profile.type === 'M dwarf') {
    activityRoll += 2
    activityModifiers.push(fact('+2 M dwarf', 'inferred', 'MASS-GU stellar activity modifiers'))
  }
  if (ageState === 'Old') {
    activityRoll -= 1
    activityModifiers.push(fact('-1 old star', 'inferred', 'MASS-GU stellar activity modifiers'))
  }
  if (ageState === 'Very old' || ageState === 'Ancient/remnant-associated') {
    activityRoll -= 2
    activityModifiers.push(fact('-2 ancient or remnant-associated star', 'inferred', 'MASS-GU stellar activity modifiers'))
  }
  if (options.gu === 'high' || options.gu === 'fracture') {
    activityRoll += 1
    activityModifiers.push(fact('+1 strong GU bleed preference', 'gu-layer', 'MASS-GU stellar activity modifiers'))
  }

  const activity = activityFromRoll(activityRoll)

  return {
    id: 'primary',
    name: fact(`${systemName} Primary`, 'inferred', 'Generated fictional star'),
    spectralType: fact(profile.type, 'inferred', 'MASS-GU stellar distribution'),
    massSolar: fact(massSolar, 'inferred', 'Generated stellar profile'),
    luminositySolar: fact(luminositySolar, 'inferred', 'Generated stellar profile'),
    ageState: fact(ageState, 'inferred', 'MASS-GU stellar age table'),
    metallicity: fact(metallicity, 'inferred', 'MASS-GU metallicity table'),
    activity: fact(activity, 'inferred', 'MASS-GU activity modifiers'),
    activityRoll: fact(activityRoll, 'derived', 'Modified 2d6 stellar activity roll'),
    activityModifiers,
  }
}

function isHighActivity(activity: string): boolean {
  return activity === 'Flare-prone' || activity === 'Violent flare cycle' || activity === 'Extreme activity / metric-amplified events'
}

function hasCloseBinary(companions: StellarCompanion[]): boolean {
  return companions.some((companion) =>
    companion.separation.value === 'Contact / near-contact' ||
    companion.separation.value === 'Close binary' ||
    companion.separation.value === 'Tight binary'
  )
}

function applyCompanionActivityModifier(primary: Star, companions: StellarCompanion[]): Star {
  if (!hasCloseBinary(companions)) return primary

  const activityRoll = primary.activityRoll.value + 1
  return {
    ...primary,
    activity: fact(activityFromRoll(activityRoll), 'inferred', 'MASS-GU activity modifiers'),
    activityRoll: fact(activityRoll, 'derived', 'Modified 2d6 stellar activity roll'),
    activityModifiers: [
      ...primary.activityModifiers,
      fact('+1 close binary', 'inferred', 'MASS-GU stellar activity modifiers'),
    ],
  }
}

function generateReachability(rng: SeededRng, options: GenerationOptions, primary: Star, companions: StellarCompanion[]) {
  let roll = d12(rng)
  const modifiers: Array<Fact<string>> = []

  if (companions.length > 0) {
    roll += 1
    modifiers.push(fact('+1 multi-star resonance geometry', 'gu-layer', 'MASS-GU reachability modifiers'))
  }
  if (primary.spectralType.value === 'M dwarf' && isHighActivity(primary.activity.value)) {
    roll += 1
    modifiers.push(fact('+1 flare-driven M-dwarf bleed behavior', 'gu-layer', 'MASS-GU reachability modifiers'))
  }
  if (options.gu === 'high' || options.gu === 'fracture') {
    roll += 1
    modifiers.push(fact('+1 chiral or high-bleed resource bias', 'gu-layer', 'MASS-GU reachability modifiers'))
  }

  roll = Math.max(1, Math.min(12, roll))
  const result = pickTable(rng, roll, reachabilityClasses)
  return {
    className: fact(result.className, 'gu-layer', 'MASS-GU reachability class'),
    routeNote: fact(result.routeNote, 'gu-layer', 'Reachable-volume bias'),
    pinchDifficulty: fact(result.pinchDifficulty, 'gu-layer', 'Route geometry'),
    roll: fact(roll, 'derived', 'Modified d12 reachability roll'),
    modifiers,
  }
}

function companionThreshold(spectralType: string): number {
  if (spectralType === 'Brown dwarf/substellar primary') return 11
  if (spectralType === 'M dwarf') return 10
  if (spectralType === 'K star') return 9
  if (spectralType === 'G star') return 8
  if (spectralType === 'F star') return 7
  if (spectralType === 'O/B/A bright star') return 6
  if (spectralType === 'White dwarf/remnant') return 9
  return 8
}

function companionTypeFromMargin(margin: number): string {
  if (margin >= 4) return 'Triple or higher-order system'
  if (margin >= 2) return 'Binary with distant substellar companion'
  return 'Binary'
}

function binarySeparationProfile(roll: number): Pick<StellarCompanion, 'separation' | 'planetaryConsequence' | 'guConsequence'> {
  const profile =
    roll <= 2 ? {
      separation: 'Contact / near-contact',
      planetaryConsequence: 'Ordinary planets unlikely.',
      guConsequence: 'Extreme bleed, dangerous research site.',
    } :
    roll <= 4 ? {
      separation: 'Close binary',
      planetaryConsequence: 'Circumbinary planets likely.',
      guConsequence: 'Strong rhythmic metric tides.',
    } :
    roll <= 6 ? {
      separation: 'Tight binary',
      planetaryConsequence: 'Inner circumbinary zone, truncated outer zones.',
      guConsequence: 'Good Iggygate anchor candidate.',
    } :
    roll <= 8 ? {
      separation: 'Moderate binary',
      planetaryConsequence: 'Circumstellar and circumbinary niches.',
      guConsequence: 'Rich Lagrange shear zones.',
    } :
    roll <= 10 ? {
      separation: 'Wide binary',
      planetaryConsequence: 'Treat stars as linked sub-systems.',
      guConsequence: 'Smuggler gaps, dark-route habitats.',
    } :
    roll === 11 ? {
      separation: 'Very wide',
      planetaryConsequence: 'Two semi-independent systems.',
      guConsequence: 'Long-haul intra-system frontier.',
    } : {
      separation: 'Hierarchical triple',
      planetaryConsequence: 'Complex but stable if hierarchical.',
      guConsequence: 'Major bleed economy, high military value.',
    }

  return {
    separation: fact(profile.separation, 'inferred', `MASS-GU binary separation roll ${roll}`),
    planetaryConsequence: fact(profile.planetaryConsequence, 'inferred', 'MASS-GU binary separation table'),
    guConsequence: fact(profile.guConsequence, 'gu-layer', 'MASS-GU binary separation table'),
  }
}

function generateStellarCompanions(rng: SeededRng, primary: Star): StellarCompanion[] {
  const threshold = companionThreshold(primary.spectralType.value)
  let roll = twoD6(rng)
  const modifiers: string[] = ['+1 major reachable system']
  roll += 1

  const margin = roll - threshold
  if (margin < 0) return []

  const separationRoll = twoD6(rng)
  const separationProfile = binarySeparationProfile(separationRoll)

  return [
    {
      id: 'companion-1',
      companionType: fact(companionTypeFromMargin(margin), 'inferred', `MASS-GU companion threshold ${threshold}; modifiers ${modifiers.join(', ')}`),
      ...separationProfile,
      rollMargin: fact(margin, 'derived', `Modified 2d6 companion roll ${roll} vs threshold ${threshold}`),
    },
  ]
}

function generateArchitecture(rng: SeededRng, options: GenerationOptions, primary: Star, reachabilityClass: string) {
  let roll = twoD6(rng)
  if (options.tone === 'cinematic') roll += 1
  if (options.tone === 'astronomy') roll -= 1
  if (primary.metallicity.value === 'Metal-rich') roll += 1
  if (primary.metallicity.value === 'Very metal-rich') roll += 2
  if (['K star', 'G star', 'F star'].includes(primary.spectralType.value)) roll += 1
  if (primary.metallicity.value === 'Metal-poor' || primary.metallicity.value === 'Very metal-poor') roll -= 1
  if (primary.massSolar.value < 0.18 && primary.spectralType.value === 'M dwarf') roll -= 1
  if (reachabilityClass === 'Resource corridor' || reachabilityClass === 'Resonance hub') roll += 1
  roll = Math.max(2, Math.min(13, roll))
  const result = pickTable(rng, roll, architectures)
  return {
    architecture: {
      name: fact(result.name, 'inferred', 'MASS-GU architecture table'),
      description: fact(result.description, 'inferred', `Modified 2d6 architecture roll ${roll}`),
    },
  }
}

function generateOrbitSeries(rng: SeededRng, luminositySolar: number, count: number): number[] {
  const start = Math.max(0.025, Math.sqrt(Math.max(luminositySolar, 0.0001)) * rng.float(0.16, 0.34))
  const spacing = rng.float(1.55, 2.05)
  return Array.from({ length: count }, (_, index) => roundTo(start * spacing ** index, 3))
}

function estimateOrbitalPeriodDays(orbitAu: number, stellarMassSolar: number): number {
  return roundTo(365.25 * Math.sqrt(orbitAu ** 3 / Math.max(stellarMassSolar, 0.01)), 1)
}

function estimateRadiusEarth(rng: SeededRng, category: BodyCategory): number {
  const range: Record<BodyCategory, [number, number]> = {
    'rocky-planet': [0.45, 1.35],
    'super-earth': [1.25, 1.95],
    'sub-neptune': [2.05, 3.8],
    'gas-giant': [8.0, 13.0],
    'ice-giant': [3.5, 5.5],
    belt: [0.01, 0.25],
    'dwarf-body': [0.08, 0.45],
    'rogue-captured': [0.7, 2.5],
    anomaly: [0.5, 4.0],
  }
  const [min, max] = range[category]
  return roundTo(rng.float(min, max), 2)
}

function estimateMassEarth(radiusEarth: number, category: BodyCategory): number | null {
  if (category === 'belt') return null
  if (category === 'rocky-planet') return roundTo(radiusEarth ** 3.7, 2)
  if (category === 'super-earth') return roundTo(Math.min(12, radiusEarth ** 3.4), 2)
  if (category === 'dwarf-body') return roundTo(Math.max(0.001, radiusEarth ** 3 * 0.2), 3)
  if (category === 'rogue-captured') return roundTo(Math.max(0.05, radiusEarth ** 2.7), 2)
  if (category === 'sub-neptune') return roundTo(Math.max(2, radiusEarth ** 2.1), 2)
  if (category === 'ice-giant') return roundTo(radiusEarth ** 1.85, 2)
  if (category === 'gas-giant') return roundTo(radiusEarth ** 1.4, 2)
  if (category === 'anomaly') return null
  return null
}

function gravityLabel(category: BodyCategory, gravityG: number | null): string {
  if (category === 'belt') return 'Not applicable: distributed belt or swarm.'
  if (category === 'anomaly' || gravityG === null) return 'Unreliable: anomaly or artificial structure.'
  const prefix =
    category === 'gas-giant' || category === 'ice-giant' || category === 'sub-neptune'
      ? 'Cloud-top/envelope estimate'
      : 'Estimated surface gravity'
  return `${prefix}: ${gravityG}g`
}

function hasVolatileEnvelope(category: BodyCategory): boolean {
  return category === 'sub-neptune' || category === 'gas-giant' || category === 'ice-giant'
}

function buildPhysicalHints(
  rng: SeededRng,
  bodyClass: WorldClassOption,
  orbitAu: number,
  primary: Star
): BodyPhysicalHints {
  const periodDays = estimateOrbitalPeriodDays(orbitAu, primary.massSolar.value)
  const radiusEarth = estimateRadiusEarth(rng, bodyClass.category)
  const massEarth = estimateMassEarth(radiusEarth, bodyClass.category)
  const surfaceGravityG = massEarth === null ? null : roundTo(massEarth / radiusEarth ** 2, 2)
  return {
    radiusEarth: fact(radiusEarth, 'inferred', bodyClass.category === 'anomaly' ? 'Operational scale estimate for anomaly' : 'Category-based radius estimate'),
    massEarth: fact(massEarth, 'inferred', 'Mass estimate from category and radius'),
    surfaceGravityG: fact(surfaceGravityG, massEarth === null ? 'inferred' : 'derived', 'Estimated mass divided by radius squared'),
    gravityLabel: fact(gravityLabel(bodyClass.category, surfaceGravityG), 'derived', 'Surface gravity estimate'),
    periodDays: fact(periodDays, 'derived', 'Kepler approximation from orbit and stellar mass'),
    closeIn: fact(periodDays < 100, 'derived', 'Period under 100 days'),
    volatileEnvelope: fact(hasVolatileEnvelope(bodyClass.category), 'inferred', 'Category-based volatile envelope flag'),
  }
}

function applyRadiusValleyFilter(rng: SeededRng, input: FilteredWorldClass): FilteredWorldClass {
  const { bodyClass, physical, filterNotes } = input
  if (!physical.closeIn.value || physical.radiusEarth.value < 1.5 || physical.radiusEarth.value > 2.0) return input
  if (bodyClass.category !== 'super-earth' && bodyClass.category !== 'sub-neptune') return input

  const roll = rng.int(1, 5)
  if (roll === 1 || roll === 4) {
    return {
      bodyClass: { className: 'Stripped rocky super-Earth', category: 'super-earth', massClass: 'Stripped super-Earth' },
      physical: {
        ...physical,
        radiusEarth: fact(roundTo(Math.min(1.45, physical.radiusEarth.value - 0.15), 2), 'inferred', 'Radius valley filter'),
        massEarth: fact(null, 'inferred', 'Recomputed after exoplanet filters'),
        surfaceGravityG: fact(null, 'inferred', 'Recomputed after exoplanet filters'),
        gravityLabel: fact('Pending recomputation after exoplanet filters.', 'inferred', 'Recomputed after exoplanet filters'),
        volatileEnvelope: fact(false, 'inferred', 'Radius valley filter'),
      },
      filterNotes: [...filterNotes, fact('Radius valley: volatile envelope stripped or reduced.', 'inferred', 'Modern exoplanet filter')],
    }
  }
  if (roll === 2) {
    return {
      bodyClass: { className: 'Volatile-rich sub-Neptune', category: 'sub-neptune', massClass: 'Sub-Neptune' },
      physical: {
        ...physical,
        radiusEarth: fact(roundTo(Math.max(2.05, physical.radiusEarth.value + 0.25), 2), 'inferred', 'Radius valley filter'),
        massEarth: fact(null, 'inferred', 'Recomputed after exoplanet filters'),
        surfaceGravityG: fact(null, 'inferred', 'Recomputed after exoplanet filters'),
        gravityLabel: fact('Pending recomputation after exoplanet filters.', 'inferred', 'Recomputed after exoplanet filters'),
        volatileEnvelope: fact(true, 'inferred', 'Radius valley filter'),
      },
      filterNotes: [...filterNotes, fact('Radius valley: expanded into volatile-rich sub-Neptune regime.', 'inferred', 'Modern exoplanet filter')],
    }
  }
  if (roll === 3) {
    return {
      ...input,
      filterNotes: [...filterNotes, fact('Radius valley: rare transitional science target.', 'inferred', 'Modern exoplanet filter')],
    }
  }
  return {
    ...input,
    filterNotes: [...filterNotes, fact('Radius valley: GU-stabilized exception.', 'gu-layer', 'Modern exoplanet filter')],
  }
}

function applyHotNeptuneDesertFilter(rng: SeededRng, thermalZone: string, input: FilteredWorldClass): FilteredWorldClass {
  const { bodyClass, physical, filterNotes } = input
  const isNeptuneLike = bodyClass.category === 'sub-neptune' || bodyClass.category === 'ice-giant'
  if (!isNeptuneLike || !physical.closeIn.value || !['Furnace', 'Inferno', 'Hot'].includes(thermalZone)) return input

  const roll = rng.int(1, 6)
  if (roll <= 2) {
    return {
      bodyClass: { className: 'Hot super-Earth', category: 'super-earth', massClass: 'Super-Earth' },
      physical: {
        ...physical,
        radiusEarth: fact(roundTo(rng.float(1.25, 1.9), 2), 'inferred', 'Hot Neptune desert filter'),
        massEarth: fact(null, 'inferred', 'Recomputed after exoplanet filters'),
        surfaceGravityG: fact(null, 'inferred', 'Recomputed after exoplanet filters'),
        gravityLabel: fact('Pending recomputation after exoplanet filters.', 'inferred', 'Recomputed after exoplanet filters'),
        volatileEnvelope: fact(false, 'inferred', 'Hot Neptune desert filter'),
      },
      filterNotes: [...filterNotes, fact('Hot Neptune desert: rerolled as hot super-Earth.', 'inferred', 'Modern exoplanet filter')],
    }
  }
  if (roll === 3) {
    return {
      bodyClass: { className: 'Stripped mini-Neptune core', category: 'super-earth', massClass: 'Stripped core' },
      physical: {
        ...physical,
        radiusEarth: fact(roundTo(rng.float(1.1, 1.65), 2), 'inferred', 'Hot Neptune desert filter'),
        massEarth: fact(null, 'inferred', 'Recomputed after exoplanet filters'),
        surfaceGravityG: fact(null, 'inferred', 'Recomputed after exoplanet filters'),
        gravityLabel: fact('Pending recomputation after exoplanet filters.', 'inferred', 'Recomputed after exoplanet filters'),
        volatileEnvelope: fact(false, 'inferred', 'Hot Neptune desert filter'),
      },
      filterNotes: [...filterNotes, fact('Hot Neptune desert: converted to stripped core.', 'inferred', 'Modern exoplanet filter')],
    }
  }
  if (roll === 4) {
    return {
      ...input,
      filterNotes: [...filterNotes, fact('Hot Neptune desert survivor: rare high-interest world.', 'inferred', 'Modern exoplanet filter')],
    }
  }
  if (roll === 5) {
    return {
      ...input,
      filterNotes: [...filterNotes, fact('Hot Neptune desert: major corporate/military research interest.', 'human-layer', 'Modern exoplanet filter')],
    }
  }
  return {
    ...input,
    filterNotes: [...filterNotes, fact('Hot Neptune desert: GU-assisted atmosphere retention.', 'gu-layer', 'Modern exoplanet filter')],
  }
}

function applyPeasInPodFilter(
  rng: SeededRng,
  architectureName: string,
  thermalZone: string,
  previous: FilteredWorldClass | null,
  input: FilteredWorldClass
): FilteredWorldClass {
  if (!(architectureName === 'Compact inner system' || architectureName === 'Peas-in-a-pod chain') || !previous) return input
  if (input.bodyClass.category === 'belt' || previous.bodyClass.category === 'belt') return input
  if (
    input.bodyClass.category === 'gas-giant' ||
    input.bodyClass.category === 'ice-giant' ||
    previous.bodyClass.category === 'gas-giant' ||
    previous.bodyClass.category === 'ice-giant'
  ) return input

  const roll = rng.int(1, 6)
  if (roll >= 2 && roll <= 4) {
    const radius = roundTo(previous.physical.radiusEarth.value * rng.float(0.85, 1.18), 2)
    const canReusePreviousClass = isClassAvailableInThermalZone(thermalZone, previous.bodyClass)

    return {
      bodyClass: canReusePreviousClass ? previous.bodyClass : input.bodyClass,
      physical: {
        ...input.physical,
        radiusEarth: fact(radius, 'inferred', 'Peas-in-a-pod filter'),
        massEarth: fact(null, 'inferred', 'Recomputed after exoplanet filters'),
        surfaceGravityG: fact(null, 'inferred', 'Recomputed after exoplanet filters'),
        gravityLabel: fact('Pending recomputation after exoplanet filters.', 'inferred', 'Recomputed after exoplanet filters'),
        volatileEnvelope: fact(canReusePreviousClass ? previous.physical.volatileEnvelope.value : input.physical.volatileEnvelope.value, 'inferred', 'Peas-in-a-pod filter'),
      },
      filterNotes: [
        ...input.filterNotes,
        fact(
          canReusePreviousClass
            ? 'Peas-in-a-pod: adjacent planet made similar in size/composition.'
            : 'Peas-in-a-pod: adjacent planet made similar in size, but class was revalidated against its thermal zone.',
          'inferred',
          'Modern exoplanet filter'
        ),
      ],
    }
  }
  if (roll === 1) {
    return {
      ...input,
      filterNotes: [...input.filterNotes, fact('Peas-in-a-pod: inner neighbor trend breaks smaller/stripped.', 'inferred', 'Modern exoplanet filter')],
    }
  }
  if (roll === 5) {
    return {
      ...input,
      filterNotes: [...input.filterNotes, fact('Peas-in-a-pod: outer neighbor trends larger or more volatile-rich.', 'inferred', 'Modern exoplanet filter')],
    }
  }
  return {
    ...input,
    filterNotes: [...input.filterNotes, fact('Peas-in-a-pod exception: migrated, captured, or disrupted body.', 'inferred', 'Modern exoplanet filter')],
  }
}

function mDwarfHabitabilityNotes(rng: SeededRng, primary: Star, thermalZone: string, category: BodyCategory): Array<Fact<string>> {
  if (primary.spectralType.value !== 'M dwarf' || thermalZone !== 'Temperate band') return []
  if (category !== 'rocky-planet' && category !== 'super-earth') return []

  const tidalRoll = rng.int(1, 6)
  const atmosphereRoll = rng.int(1, 6)
  const tidalState =
    tidalRoll <= 3 ? 'likely tidally locked' :
    tidalRoll === 4 ? 'spin-orbit resonance' :
    tidalRoll === 5 ? 'slow rotation' :
    'unusual rotation, moon, migration, or GU effect'
  const atmosphereState =
    atmosphereRoll === 1 ? 'stripped or nearly stripped atmosphere risk' :
    atmosphereRoll === 2 ? 'thin remnant atmosphere' :
    atmosphereRoll === 3 ? 'atmosphere replenished by volcanism' :
    atmosphereRoll === 4 ? 'stable dense atmosphere candidate' :
    atmosphereRoll === 5 ? 'ocean/ice protected volatiles' :
    'GU/chiral/magnetic anomaly helps retention'

  return [
    fact(`M-dwarf habitability: ${tidalState}.`, 'inferred', 'Modern exoplanet filter'),
    fact(`M-dwarf atmosphere survival: ${atmosphereState}.`, atmosphereRoll === 6 ? 'gu-layer' : 'inferred', 'Modern exoplanet filter'),
  ]
}

function applyModernExoplanetFilters(
  rng: SeededRng,
  bodyClass: WorldClassOption,
  physical: BodyPhysicalHints,
  thermalZone: string,
  architectureName: string,
  previous: FilteredWorldClass | null
): FilteredWorldClass {
  let current: FilteredWorldClass = { bodyClass, physical, filterNotes: [] }
  const preservePlannedGiant = architectureName === 'Giant-rich or chaotic' && (bodyClass.category === 'gas-giant' || bodyClass.category === 'ice-giant')
  if (!preservePlannedGiant) current = applyHotNeptuneDesertFilter(rng, thermalZone, current)
  current = applyRadiusValleyFilter(rng, current)
  current = applyPeasInPodFilter(rng, architectureName, thermalZone, previous, current)
  if (!preservePlannedGiant) current = applyHotNeptuneDesertFilter(rng, thermalZone, current)
  current = applyRadiusValleyFilter(rng, current)
  if (!preservePlannedGiant) current = applyHotNeptuneDesertFilter(rng, thermalZone, current)
  return current
}

function withRecomputedGravity(input: FilteredWorldClass): FilteredWorldClass {
  const massEarth = estimateMassEarth(input.physical.radiusEarth.value, input.bodyClass.category)
  const surfaceGravityG = massEarth === null ? null : roundTo(massEarth / input.physical.radiusEarth.value ** 2, 2)

  return {
    ...input,
    physical: {
      ...input.physical,
      massEarth: fact(massEarth, 'inferred', 'Mass estimate from category and filtered radius'),
      surfaceGravityG: fact(surfaceGravityG, massEarth === null ? 'inferred' : 'derived', 'Estimated mass divided by radius squared'),
      gravityLabel: fact(gravityLabel(input.bodyClass.category, surfaceGravityG), 'derived', 'Surface gravity estimate'),
    },
  }
}


function hasLiquidOrProtectedWater(hydrosphere: string): boolean {
  return [
    'Briny aquifers',
    'Deep briny aquifers',
    'Local seas',
    'Ocean-continent balance',
    'Ice-shell subsurface ocean',
    'High-pressure condensate decks',
  ].includes(hydrosphere)
}

function supportsComplexSurfaceEnvironment(category: BodyCategory): boolean {
  return category === 'rocky-planet' || category === 'super-earth'
}

function clampTableRoll(roll: number, max: number): number {
  return Math.max(1, Math.min(max, roll))
}

function isHighActivityStar(primary: Star): boolean {
  return ['Flare-prone', 'Violent flare cycle', 'Extreme activity / metric-amplified events'].includes(primary.activity.value)
}

function isVolatileRichWorld(bodyClass: WorldClassOption, category: BodyCategory, thermalZone: string): boolean {
  return (
    category === 'sub-neptune' ||
    category === 'gas-giant' ||
    category === 'ice-giant' ||
    thermalZone === 'Cold' ||
    thermalZone === 'Cryogenic' ||
    thermalZone === 'Dark' ||
    bodyClass.className.includes('ocean') ||
    bodyClass.className.includes('Ocean') ||
    bodyClass.className.includes('Hycean') ||
    bodyClass.className.includes('Ice') ||
    bodyClass.className.includes('Hydrogen')
  )
}

function isArtificialOrTerraformed(bodyClass: WorldClassOption): boolean {
  return (
    bodyClass.className.includes('Artificial') ||
    bodyClass.className.includes('Terraforming') ||
    bodyClass.className.includes('terraformed') ||
    bodyClass.className.includes('facility') ||
    bodyClass.className.includes('platform')
  )
}

function rollGeology(rng: SeededRng, category: BodyCategory, thermalZone: string, bodyClass: WorldClassOption): string {
  if (category === 'belt') return 'Minor-body rubble and collision families'
  if (category === 'sub-neptune' || category === 'gas-giant' || category === 'ice-giant') return pickOne(rng, envelopeGeologies)

  let roll = d12(rng)
  if (thermalZone === 'Furnace' || thermalZone === 'Inferno' || thermalZone === 'Hot') roll += 1
  if (thermalZone === 'Cold' || thermalZone === 'Cryogenic' || thermalZone === 'Dark') roll += 1
  if (bodyClass.className.includes('Tidal') || bodyClass.className.includes('Volcanic') || bodyClass.className.includes('Cryovolcanic')) roll += 2
  if (bodyClass.className.includes('Programmable') || bodyClass.className.includes('GU')) roll += 2

  return pickTable(rng, clampTableRoll(roll, 12), geologyTable)
}

function rollAtmosphere(
  rng: SeededRng,
  category: BodyCategory,
  thermalZone: string,
  primary: Star,
  bodyClass: WorldClassOption,
  physical: BodyPhysicalHints,
  geology: string
): string {
  if (category === 'belt') return 'None / dispersed volatiles'
  if (category === 'sub-neptune' || category === 'gas-giant' || category === 'ice-giant') {
    return pickTable(rng, clampTableRoll(d12(rng) + 3, 12), atmosphereTable)
  }
  if (extremeHotThermalZones.has(thermalZone)) return pickOne(rng, extremeHotAtmospheres)

  let roll = d12(rng)
  if (category === 'super-earth') roll += 1
  if (isVolatileRichWorld(bodyClass, category, thermalZone)) roll += 1
  if (physical.radiusEarth.value < 0.8 || category === 'dwarf-body') roll -= 1
  if (thermalZone === 'Hot') roll -= 1
  if (isHighActivityStar(primary)) roll -= primary.activity.value === 'Extreme activity / metric-amplified events' ? 3 : 2
  if (geology === 'Active volcanism' || geology === 'Extreme plume provinces' || geology === 'Global resurfacing') roll += 1
  if (isArtificialOrTerraformed(bodyClass)) roll += 1

  return pickTable(rng, clampTableRoll(roll, 12), atmosphereTable)
}

function rollHydrosphere(rng: SeededRng, category: BodyCategory, thermalZone: string, bodyClass: WorldClassOption): string {
  if (category === 'belt') return pickOne(rng, ['Subsurface ice', 'Cometary volatiles', 'Hydrated minerals only'])
  if (category === 'sub-neptune' || category === 'gas-giant' || category === 'ice-giant') {
    return pickOne(rng, ['Deep atmospheric volatile layers', 'High-pressure condensate decks', 'No accessible surface volatiles'])
  }
  if (extremeHotThermalZones.has(thermalZone)) return pickOne(rng, extremeHotVolatiles)

  let roll = d12(rng)
  if (thermalZone === 'Hot') roll -= 2
  if (thermalZone === 'Cold' || thermalZone === 'Cryogenic' || thermalZone === 'Dark') roll += 2
  if (bodyClass.className.includes('Ocean') || bodyClass.className.includes('Waterworld') || bodyClass.className.includes('Hycean')) roll += 3
  if (bodyClass.className.includes('Dry') || bodyClass.className.includes('desert') || bodyClass.className.includes('Airless')) roll -= 3
  if (bodyClass.className.includes('Hydrogen') || bodyClass.className.includes('Exotic')) roll += 1

  return pickTable(rng, clampTableRoll(roll, 12), hydrosphereTable)
}

function generateClimate(rng: SeededRng, category: BodyCategory, thermalZone: string, count: number) {
  const climateOptions =
    thermalZone === 'Furnace' || thermalZone === 'Inferno'
      ? category === 'gas-giant' || category === 'ice-giant' || category === 'sub-neptune'
        ? extremeHotEnvelopeClimateTags
        : extremeHotClimateTags
      : category === 'gas-giant' || category === 'ice-giant' || category === 'sub-neptune'
        ? envelopeClimateTags
        : thermalZone === 'Hot'
          ? hotClimateTags
          : thermalZone === 'Temperate band'
            ? temperateClimateTags
            : coldClimateTags

  return Array.from({ length: count }, () => {
    const sourceClimate = pickTable(rng, d20(rng), climateSourceTable)
    const value = (climateOptions as readonly string[]).includes(sourceClimate) ? sourceClimate : pickOne(rng, climateOptions)
    return fact(value, 'inferred', 'MASS-GU climate tag d20 table with thermal-zone constraints')
  })
}

function generateRadiation(rng: SeededRng, category: BodyCategory, thermalZone: string, primary: Star): string {
  const isEnvelopeWorld = category === 'sub-neptune' || category === 'gas-giant' || category === 'ice-giant'
  let roll = d8(rng)
  if (isEnvelopeWorld) roll += 2
  if (isHighActivityStar(primary)) roll += primary.activity.value === 'Extreme activity / metric-amplified events' ? 3 : 2
  if (thermalZone === 'Furnace' || thermalZone === 'Inferno') roll += 2
  if (thermalZone === 'Hot') roll += 1

  return pickTable(rng, clampTableRoll(roll, 8), radiationTable)
}

function generateBiosphere(rng: SeededRng, category: BodyCategory, thermalZone: string, detail: Omit<PlanetaryDetail, 'biosphere'>, primary: Star): string {
  if (!supportsComplexSurfaceEnvironment(category)) return 'Sterile'
  if (thermalZone === 'Furnace' || thermalZone === 'Inferno') return 'Sterile'
  if (detail.atmosphere.value === 'None / hard vacuum' || detail.atmosphere.value === 'Trace exosphere') return 'Sterile'

  let score = twoD6(rng)
  if (thermalZone === 'Temperate band') score += 1
  if (hasLiquidOrProtectedWater(detail.hydrosphere.value)) score += 1
  if (['Benign', 'Manageable', 'Chronic exposure'].includes(detail.radiation.value)) score += 1
  if (['Active volcanism', 'Plate tectonic analogue', 'Cryovolcanism', 'Tidal heating'].includes(detail.geology.value)) score += 1
  if (primary.ageState.value === 'Mature' || primary.ageState.value === 'Old') score += 1
  if (primary.activity.value === 'Quiet' || primary.activity.value === 'Normal') score += 1
  if (primary.activity.value === 'Active') score -= 1
  if (['Flare-prone', 'Violent flare cycle', 'Extreme activity / metric-amplified events'].includes(primary.activity.value)) score -= 2
  if (['Severe radiation belts', 'Flare-lethal surface', 'Only deep shielded habitats survive'].includes(detail.radiation.value)) score -= 1
  if (thermalZone === 'Cryogenic' || thermalZone === 'Dark') score -= 2
  if (detail.climate.some((tag) => tag.value === 'Recently failed terraforming climate')) score -= 2

  if (score <= 5) return 'Sterile'
  if (score === 6) return 'Prebiotic chemistry'
  if (score === 7) return 'Ambiguous biosignatures'
  if (score === 8) return 'Microbial life'
  if (score === 9) return 'Extremophile microbial ecology'
  if (score === 10) return 'Mats or planktonic biosphere'
  return pickOne(rng, biospheres.filter((value) => value !== 'Sterile' && value !== 'Prebiotic chemistry'))
}

function generateDetail(
  rng: SeededRng,
  bodyClass: WorldClassOption,
  physical: BodyPhysicalHints,
  thermalZone: string,
  primary: Star
): PlanetaryDetail {
  const category = bodyClass.category
  if (category === 'anomaly') {
    const isFacilityLike = rng.chance(0.45)
    const detailWithoutBiosphere = {
      atmosphere: fact(
        isFacilityLike ? 'Controlled habitat envelopes' : 'No ordinary atmosphere',
        'gu-layer',
        'MASS-GU anomaly environment constraint'
      ),
      hydrosphere: fact(
        isFacilityLike ? 'Imported or recycled volatiles' : 'Not applicable: metric or route phenomenon',
        'gu-layer',
        'MASS-GU anomaly environment constraint'
      ),
      geology: fact(
        isFacilityLike ? 'Artificial platform or engineered substrate' : 'Metric shear geometry',
        'gu-layer',
        'MASS-GU anomaly environment constraint'
      ),
      climate: [
        fact(
          isFacilityLike ? 'Managed facility microclimates' : 'No planetary climate',
          'gu-layer',
          'MASS-GU anomaly environment constraint'
        ),
      ],
      radiation: fact(
        pickOne(rng, ['Electronics-disruptive metric/radiation mix', 'Only deep shielded habitats survive', 'Storm-dependent hazard']),
        'gu-layer',
        'MASS-GU anomaly radiation constraint'
      ),
    }

    return {
      ...detailWithoutBiosphere,
      biosphere: fact('Sterile', 'inferred', 'Anomaly bodies do not roll ordinary biospheres'),
    }
  }

  const isEnvelopeWorld = category === 'sub-neptune' || category === 'gas-giant' || category === 'ice-giant'
  const isBelt = category === 'belt'
  const climateCount = rng.chance(0.4) ? 2 : 1
  const geology = rollGeology(rng, category, thermalZone, bodyClass)
  const atmosphere = rollAtmosphere(rng, category, thermalZone, primary, bodyClass, physical, geology)
  const hydrosphere = rollHydrosphere(rng, category, thermalZone, bodyClass)

  const detailWithoutBiosphere = {
    atmosphere: fact(
      atmosphere,
      'inferred',
      'MASS-GU 14 atmosphere d12 table with source modifiers'
    ),
    hydrosphere: fact(
      hydrosphere,
      'inferred',
      'MASS-GU 14 hydrosphere d12 table with volatile-state modifiers'
    ),
    geology: fact(
      geology,
      'inferred',
      isBelt || isEnvelopeWorld ? 'MASS-GU 14 geology table with category constraints' : 'MASS-GU 14 geology d12 table with source modifiers'
    ),
    climate: generateClimate(rng, category, thermalZone, climateCount),
    radiation: fact(
      generateRadiation(rng, category, thermalZone, primary),
      'inferred',
      'MASS-GU 14 radiation d8 table with source modifiers'
    ),
  }

  return {
    ...detailWithoutBiosphere,
    biosphere: fact(
      generateBiosphere(rng, category, thermalZone, detailWithoutBiosphere, primary),
      'inferred',
      'MASS-GU biosphere score'
    ),
  }
}

function moonProfile(moonType: string): Pick<Moon, 'resource' | 'hazard' | 'use'> {
  const profiles: Record<string, { resource: string; hazard: string; use: string }> = {
    'Airless rock': {
      resource: 'metals, regolith, and vacuum construction sites',
      hazard: 'hard radiation and thermal cycling',
      use: 'mines, mass drivers, or bare-rock observatories',
    },
    'Cratered ice-rock': {
      resource: 'accessible ice mixed with rocky feedstock',
      hazard: 'fractured terrain and weak anchoring',
      use: 'volatile depots, buried habitats, and repair yards',
    },
    'Captured asteroid': {
      resource: 'metal-rich rubble and unusual impact history',
      hazard: 'irregular gravity and unstable debris',
      use: 'prospecting camps, salvage claims, and hidden docks',
    },
    'Captured dwarf': {
      resource: 'deep volatiles and differentiated mineral layers',
      hazard: 'distant, cold, and hard to police',
      use: 'bunkers, long-term archives, or high-autonomy settlements',
    },
    'Subsurface ocean moon': {
      resource: 'ocean chemistry, plumes, and protected volatiles',
      hazard: 'biosafety risk and ice-shell access failures',
      use: 'bore stations, biosafety labs, and plume harvesters',
    },
    'Thick ice-shell moon': {
      resource: 'massive water ice reserves',
      hazard: 'deep drilling risk and pressure faults',
      use: 'water monopolies, shielded habitats, and fuel production',
    },
    'Cryovolcanic moon': {
      resource: 'fresh volatiles and plume chemistry',
      hazard: 'eruptive ice terrain and corrosive deposits',
      use: 'plume skimmers, chemistry labs, and hazard-pay mines',
    },
    'Volcanic tidal moon': {
      resource: 'sulfur, metals, heat, and tidal power',
      hazard: 'surface eruptions and extreme tidal stress',
      use: 'power sites, hardened bunkers, and dangerous extraction towns',
    },
    'Dense-atmosphere moon': {
      resource: 'atmospheric feedstock and protected aerostat sites',
      hazard: 'weather, corrosive chemistry, and difficult evacuation',
      use: 'aerostats, research stations, and atmospheric harvesters',
    },
    'Hydrocarbon moon': {
      resource: 'hydrocarbon lakes and organic feedstock',
      hazard: 'cryogenic weather and flammable chemistry',
      use: 'fuel chemistry, frontier ports, and cold industrial settlements',
    },
    'Habitable-zone moon': {
      resource: 'temperate real estate and accessible volatiles',
      hazard: 'planetary radiation belts and contamination politics',
      use: 'treaty colonies, farms under shielding, and high-value research',
    },
    'Radiation-scorched inner moon': {
      resource: 'inner-system access and magnetospheric data',
      hazard: 'severe radiation belts',
      use: 'fortresses, listening posts, and automated observatories',
    },
    'Ring-shepherd moon': {
      resource: 'ring access and traffic-control leverage',
      hazard: 'debris lanes and collision risk',
      use: 'ring ports, customs posts, and shepherding stations',
    },
    'Chiral ice moon': {
      resource: 'chiral ice and metric-sensitive volatiles',
      hazard: 'chiral contamination and claim wars',
      use: 'sealed harvest sites, quarantine labs, and cartel enclaves',
    },
    'Dark-sector density moon': {
      resource: 'dark-sector doped ore and anomalous gravity gradients',
      hazard: 'navigation errors and instrumentation drift',
      use: 'black-budget extraction, observiverse labs, and interdicted mines',
    },
    'Programmable regolith moon': {
      resource: 'programmable-matter regolith deposits',
      hazard: 'containment failure and illegal replication claims',
      use: 'containment sites, forensic labs, and military contractors',
    },
    'Former settlement moon': {
      resource: 'first-wave infrastructure and buried records',
      hazard: 'structural decay and legal ghosts',
      use: 'salvage towns, reoccupied ruins, and disputed inheritance claims',
    },
    'Active mining moon': {
      resource: 'proven industrial ore or volatile extraction',
      hazard: 'labor conflict and industrial accidents',
      use: 'mines, refineries, and company towns',
    },
    'Quarantine moon': {
      resource: 'sealed research value and forbidden records',
      hazard: 'biosafety, AI, or chiral quarantine',
      use: 'cordons, medical boards, and illegal entry jobs',
    },
    'Moving bleed node moon': {
      resource: 'mobile GU extraction and route prediction value',
      hazard: 'metric storms and unstable navigation baselines',
      use: 'bleed-chaser fleets, observiverse AIs, and high-risk harvest crews',
    },
  }
  const profile = profiles[moonType] ?? {
    resource: 'survey value and local materials',
    hazard: 'ordinary frontier risk',
    use: 'survey crews and small outposts',
  }

  return {
    resource: fact(profile.resource, moonType.includes('Chiral') || moonType.includes('Dark-sector') || moonType.includes('Moving bleed') || moonType.includes('Programmable') ? 'gu-layer' : 'inferred', 'MASS-GU moon resource interpretation'),
    hazard: fact(profile.hazard, moonType.includes('Chiral') || moonType.includes('Dark-sector') || moonType.includes('Moving bleed') ? 'gu-layer' : 'inferred', 'MASS-GU moon hazard interpretation'),
    use: fact(profile.use, 'human-layer', 'MASS-GU moon playable-use interpretation'),
  }
}

function terrestrialMoonResult(roll: number): { count: number; scale?: string; typeHints?: readonly string[] } {
  if (roll <= 5) return { count: 0 }
  if (roll <= 8) return { count: 1, scale: 'minor captured moonlet', typeHints: ['Captured asteroid', 'Airless rock', 'Cratered ice-rock'] }
  if (roll === 9) return { count: 1, scale: 'small major moon' }
  if (roll === 10) return { count: 1, scale: 'mid-sized icy moon' }
  if (roll === 11) return { count: 1, scale: 'large differentiated moon' }
  return { count: 1, scale: 'planet-scale major moon' }
}

function moonNameForIndex(bodyIndex: number, moonIndex: number): string {
  const offset = bodyIndex + moonIndex
  const baseName = moonNames[offset % moonNames.length]
  const cycle = Math.floor(offset / moonNames.length)
  return cycle === 0 ? baseName : `${baseName} ${cycle + 1}`
}

function generateMoons(
  rng: SeededRng,
  bodyClass: WorldClassOption,
  physical: BodyPhysicalHints,
  bodyIndex: number,
  thermalZone: string,
  primary: Star,
  architectureName: string
): Moon[] {
  const category = bodyClass.category
  if (category === 'anomaly' || extremeHotThermalZones.has(thermalZone)) return []
  let moonCount = 0
  let scaleOverride: string | undefined
  let typeHints: readonly string[] | undefined

  if (category === 'gas-giant' || category === 'ice-giant') {
    let roll = rng.int(1, 6)
    if (category === 'gas-giant') roll += 1
    if (bodyClass.className === 'Super-Jovian') roll += 2
    if (category === 'ice-giant') roll -= 1
    if (thermalZone === 'Cold' || thermalZone === 'Cryogenic' || thermalZone === 'Dark') roll += 1
    if (primary.ageState.value === 'Embryonic/very young' || primary.ageState.value === 'Young' || architectureName === 'Debris-dominated' || architectureName === 'Giant-rich or chaotic') roll += 1
    moonCount = Math.max(0, Math.min(10, roll))
  } else if (category === 'rocky-planet' || category === 'super-earth' || category === 'dwarf-body' || category === 'rogue-captured') {
    let roll = twoD6(rng)
    if (category === 'super-earth' || physical.radiusEarth.value >= 1.2) roll += 1
    if (architectureName === 'Giant-rich or chaotic' || architectureName === 'Debris-dominated') roll += 1
    if (thermalZone === 'Hot') roll -= 1
    if (physical.closeIn.value) roll -= 1
    if (category === 'dwarf-body' || category === 'rogue-captured') roll -= 1
    const result = terrestrialMoonResult(roll)
    moonCount = result.count
    scaleOverride = result.scale
    typeHints = result.typeHints
  }

  return Array.from({ length: moonCount }, (_, index) => {
    const moonType = typeHints ? pickOne(rng, typeHints) : pickOne(rng, moonTypes)
    const profile = moonProfile(moonType)
    return {
      id: `body-${bodyIndex + 1}-moon-${index + 1}`,
      name: fact(moonNameForIndex(bodyIndex, index), 'human-layer', 'Generated moon name'),
      moonType: fact(moonType, moonType.includes('Chiral') || moonType.includes('Dark-sector') || moonType.includes('Moving bleed') || moonType.includes('Programmable') ? 'gu-layer' : 'inferred', 'MASS-GU 17 moon type table'),
      scale: fact(scaleOverride ?? (category === 'gas-giant' || category === 'ice-giant' ? pickOne(rng, moonScales.slice(1)) : pickOne(rng, moonScales.slice(0, 3))), 'inferred', 'MASS-GU 17 moon scale from moon count table'),
      ...profile,
    }
  })
}

function generateRingSystem(rng: SeededRng, category: BodyCategory): RingSystem | undefined {
  if (category !== 'gas-giant' && category !== 'ice-giant') return undefined
  const type = pickTable(rng, d12(rng), [...ringTypeTable])
  if (type === 'None or faint') return undefined
  return { type: fact(type, type.includes('GU') ? 'gu-layer' : 'inferred', 'MASS-GU 17 ring type d12 table') }
}

function generateGiantEconomy(bodyClass: WorldClassOption, moons: Moon[], rings?: RingSystem): Fact<string> | undefined {
  if (bodyClass.category !== 'gas-giant' && bodyClass.category !== 'ice-giant') return undefined

  const moonResources = moons
    .map((moon) => moon.resource.value)
    .filter((value, index, values) => values.indexOf(value) === index)
    .slice(0, 2)
  const activeMoons = moons
    .filter((moon) =>
      moon.moonType.value.includes('ocean') ||
      moon.moonType.value.includes('mining') ||
      moon.moonType.value.includes('Chiral') ||
      moon.moonType.value.includes('Quarantine') ||
      moon.moonType.value.includes('Moving bleed')
    )
    .map((moon) => moon.name.value)
    .slice(0, 2)

  const traffic = bodyClass.category === 'gas-giant'
    ? 'fuel skimming, radiation-belt logistics, and moon-to-moon traffic'
    : 'cold volatile extraction, shielded depots, and slow outer-system traffic'
  const ringNote = rings ? ` ${rings.type.value} add ring traffic and collision-control work.` : ''
  const moonNote = activeMoons.length
    ? ` Key moons: ${activeMoons.join(', ')}.`
    : moons.length
      ? ` ${moons.length} major moons support a dispersed service economy.`
      : ' The economy is orbital rather than moon-led.'
  const resourceNote = moonResources.length ? ` Main draws: ${moonResources.join('; ')}.` : ''

  return fact(`${traffic}.${moonNote}${resourceNote}${ringNote}`, 'human-layer', 'Generated giant-planet moon economy note')
}

function generateBodyProfile(bodyClass: WorldClassOption, detail: PlanetaryDetail, moons: Moon[], rings?: RingSystem): Fact<string> | undefined {
  if (bodyClass.category === 'belt') {
    const profile =
      bodyClass.className.includes('Trojan') ? 'Trojan swarm with stable co-orbital traffic lanes and hidden habitat potential.' :
      bodyClass.className.includes('Chiral') ? 'Chiral ore belt with high extraction value and contamination risk.' :
      bodyClass.className.includes('Programmable') ? 'Programmable-matter microcluster belt with containment law, military interest, and replication risk.' :
      bodyClass.className.includes('Comet') ? 'Cometary reservoir with volatiles, fuel value, and unpredictable inbound traffic.' :
      bodyClass.className.includes('Metal-rich') ? 'Metal-rich asteroid belt with proven industrial value and claim conflicts.' :
      bodyClass.className.includes('Carbonaceous') ? 'Carbonaceous belt with organochemical feedstock, water-bearing minerals, and quiet logistics sites.' :
      bodyClass.className.includes('Resonant') ? 'Resonant fragment field with dangerous traffic lanes and useful navigation geometry.' :
      bodyClass.className.includes('Unstable crossing') ? 'Unstable crossing belt with impact hazards, salvage prospects, and disputed exclusions.' :
      bodyClass.className.includes('Circumbinary') ? 'Circumbinary debris band with complex station-keeping and unusual survey value.' :
      bodyClass.className.includes('White-dwarf') ? 'White-dwarf metal debris with remnant archaeology, exotic alloys, and radiation exposure.' :
      bodyClass.className.includes('impact') || bodyClass.className.includes('Impact') ? 'Ancient impact family with mixed metals, rubble hazards, and salvage rights disputes.' :
      bodyClass.className.includes('Kuiper') ? 'Outer icy belt with long-cycle claims, comet capture, and cold storage sites.' :
      bodyClass.className.includes('Ice-rich') ? 'Ice-rich asteroid belt with volatile extraction and refueling infrastructure.' :
      bodyClass.className.includes('Sparse rubble') ? 'Sparse rubble field with low-grade mining, navigation clutter, and hidden-cache potential.' :
      'Minor-body belt with mining, navigation hazards, and distributed claims.'
    return fact(profile, profile.includes('Chiral') ? 'gu-layer' : 'inferred', 'MASS-GU 17 belt type interpretation')
  }

  if (bodyClass.category === 'dwarf-body' || bodyClass.category === 'rogue-captured') {
    const profile =
      bodyClass.className.includes('Smuggler') ? 'Small cold body used as a hidden logistics depot or illicit harbor.' :
      bodyClass.className.includes('Exile') ? 'Remote body suitable for political refuge, outlaw courts, or abandoned habitats.' :
      bodyClass.className.includes('Dark refueling') ? 'Cold refueling body with valuable volatiles and poor oversight.' :
      bodyClass.className.includes('Rogue') || bodyClass.className.includes('Free-floating') ? 'Captured or distant rogue world with unusual orbit history and survey value.' :
      `${bodyClass.className} with ${detail.hydrosphere.value.toLowerCase()} and low-traffic frontier value.`
    return fact(profile, 'inferred', 'MASS-GU minor-body interpretation')
  }

  if (bodyClass.category === 'anomaly') {
    const profile =
      bodyClass.className.includes('GU') || bodyClass.className.includes('observiverse') || bodyClass.className.includes('bleed')
        ? 'GU-active body where metric behavior matters as much as normal geology.'
        : bodyClass.className.includes('facility') || bodyClass.className.includes('platform')
          ? 'Human-altered facility world where infrastructure is the main point of interest.'
          : 'Anomalous body with unusual survey, hazard, or setting-layer value.'
    return fact(profile, profile.includes('GU') ? 'gu-layer' : 'human-layer', 'MASS-GU anomaly interpretation')
  }

  if (moons.length > 0 || rings) {
    return fact(`${bodyClass.className} with ${moons.length} major moon${moons.length === 1 ? '' : 's'}${rings ? ' and notable rings' : ''}.`, 'inferred', 'Generated orbital companion summary')
  }

  return undefined
}

function generateBodyInterest(
  bodyClass: WorldClassOption,
  thermalZone: string,
  detail: PlanetaryDetail,
  moons: Moon[],
  filterNotes: Array<Fact<string>>,
  bodyProfile?: Fact<string>,
  giantEconomy?: Fact<string>
): Fact<string> {
  const reasons: string[] = []

  if (bodyProfile) reasons.push(bodyProfile.value)
  if (giantEconomy) reasons.push(giantEconomy.value)
  if (detail.biosphere.value !== 'Sterile') reasons.push(`${detail.biosphere.value} creates science, quarantine, or settlement pressure`)
  if (detail.hydrosphere.value.includes('ocean') || detail.hydrosphere.value.includes('ice') || detail.hydrosphere.value.includes('volatiles')) {
    reasons.push(`${detail.hydrosphere.value} makes local volatiles important`)
  }
  if (detail.radiation.value.includes('Severe') || detail.radiation.value.includes('Flare-lethal') || detail.radiation.value.includes('Only deep')) {
    reasons.push(`${detail.radiation.value} makes operations dangerous`)
  }
  if (filterNotes.some((note) => note.value.includes('Hot Neptune desert') || note.value.includes('Radius valley') || note.value.includes('M-dwarf'))) {
    reasons.push('modern exoplanet filters make this a notable survey target')
  }
  if (moons.some((moon) => moon.resource.confidence === 'gu-layer') || bodyClass.className.includes('GU') || bodyClass.className.includes('Chiral') || bodyClass.className.includes('bleed')) {
    reasons.push('GU value may attract research, extraction, or interdiction')
  }
  if (thermalZone === 'Temperate band' && (bodyClass.category === 'rocky-planet' || bodyClass.category === 'super-earth')) {
    reasons.push('its nominal habitable-zone position gives it political and survey value even if conditions are harsh')
  }

  const selected = reasons.slice(0, 3)
  if (selected.length === 0) selected.push(`${bodyClass.className} is mainly useful as orbital context and navigation terrain`)

  return fact(selected.join(' '), selected.some((reason) => reason.includes('GU')) ? 'gu-layer' : 'inferred', 'Generated body interest summary')
}

function weightedPick<T>(rng: SeededRng, entries: Array<{ weight: number; value: T }>): T {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0)
  let roll = rng.float(0, total)
  for (const entry of entries) {
    roll -= entry.weight
    if (roll <= 0) return entry.value
  }
  return entries[entries.length - 1].value
}

function pushRepeated(plan: BodyPlanKind[], count: number, create: () => BodyPlanKind): void {
  for (let index = 0; index < count; index++) {
    plan.push(create())
  }
}

function planetLikeKind(rng: SeededRng): BodyPlanKind {
  return weightedPick(rng, [
    { weight: 45, value: 'rocky' },
    { weight: 35, value: 'super-earth' },
    { weight: 19, value: 'sub-neptune' },
    { weight: 1, value: 'anomaly' },
  ])
}

function rockyOrSuperKind(rng: SeededRng): BodyPlanKind {
  return weightedPick(rng, [
    { weight: 58, value: 'rocky' },
    { weight: 34, value: 'super-earth' },
    { weight: 6, value: 'sub-neptune' },
    { weight: 2, value: 'anomaly' },
  ])
}

function failedRemnantKind(rng: SeededRng): BodyPlanKind {
  return weightedPick(rng, [
    { weight: 50, value: 'dwarf' },
    { weight: 30, value: 'rocky' },
    { weight: 12, value: 'super-earth' },
    { weight: 8, value: 'anomaly' },
  ])
}

function rockySurvivorKind(rng: SeededRng): BodyPlanKind {
  return weightedPick(rng, [
    { weight: 55, value: 'rocky' },
    { weight: 25, value: 'super-earth' },
    { weight: 10, value: 'sub-neptune' },
    { weight: 7, value: 'belt' },
    { weight: 3, value: 'anomaly' },
  ])
}

function debrisKind(rng: SeededRng): BodyPlanKind {
  return weightedPick(rng, [
    { weight: 42, value: 'belt' },
    { weight: 30, value: 'ice-belt' },
    { weight: 18, value: 'dwarf' },
    { weight: 6, value: 'rogue' },
    { weight: 4, value: 'anomaly' },
  ])
}

function giantKind(rng: SeededRng): BodyPlanKind {
  return rng.chance(0.62) ? 'gas-giant' : 'ice-giant'
}

function weightedCount(rng: SeededRng, entries: Array<{ weight: number; value: number }>): number {
  return weightedPick(rng, entries)
}

export const architectureBodyPlanRules = {
  'Failed system': {
    bodyRange: [4, 9],
    intent: 'Debris, dwarf bodies, and zero or one remnant full planet dominate.',
  },
  'Debris-dominated': {
    bodyRange: [5, 12],
    intent: 'Belts and minor bodies dominate, with zero to two full-planet survivors and rare giant/anomaly crossovers.',
  },
  'Sparse rocky': {
    bodyRange: [2, 8],
    intent: 'One to four rocky or super-terrestrial worlds lead, with limited debris and unusual crossovers.',
  },
  'Compact inner system': {
    bodyRange: [5, 10],
    intent: 'Three to eight rocky, super-Earth, or sub-Neptune worlds lead, with rare debris or giant exceptions.',
  },
  'Peas-in-a-pod chain': {
    bodyRange: [4, 9],
    intent: 'Four to seven similar-sized planets form the main chain, with rare debris or giant exceptions.',
  },
  'Solar-ish mixed': {
    bodyRange: [4, 19],
    intent: 'Variable inner rocks, variable belts, one to four giants, and outer minor bodies.',
  },
  'Migrated giant': {
    bodyRange: [3, 11],
    intent: 'At least one hot or warm gas giant plus disrupted survivors and outer remnants.',
  },
  'Giant-rich or chaotic': {
    bodyRange: [5, 16],
    intent: 'Multiple giants, survivor worlds, debris, and possible captured or anomalous bodies.',
  },
} as const

function generateBodyPlan(rng: SeededRng, architectureName: string): BodyPlanKind[] {
  const plan: BodyPlanKind[] = []

  if (architectureName === 'Failed system') {
    pushRepeated(plan, weightedCount(rng, [
      { weight: 45, value: 0 },
      { weight: 55, value: 1 },
    ]), () => failedRemnantKind(rng))
    pushRepeated(plan, rng.int(4, 8), () => debrisKind(rng))
    if (rng.chance(0.1)) plan.push('rogue')
    return plan
  }

  if (architectureName === 'Debris-dominated') {
    pushRepeated(plan, rng.int(0, 2), () => rockySurvivorKind(rng))
    pushRepeated(plan, rng.int(5, 9), () => debrisKind(rng))
    if (rng.chance(0.12)) plan.push(giantKind(rng))
    if (rng.chance(0.1)) plan.push('anomaly')
    return plan
  }

  if (architectureName === 'Sparse rocky') {
    pushRepeated(plan, rng.int(2, 4), () => rockyOrSuperKind(rng))
    pushRepeated(plan, rng.int(0, 2), () => debrisKind(rng))
    if (rng.chance(0.15)) plan.push(giantKind(rng))
    if (rng.chance(0.1)) plan.push(rng.chance(0.55) ? 'sub-neptune' : 'anomaly')
    return plan
  }

  if (architectureName === 'Compact inner system') {
    pushRepeated(plan, rng.int(5, 8), () => planetLikeKind(rng))
    pushRepeated(plan, rng.int(0, 1), () => rng.chance(0.7) ? 'belt' : 'dwarf')
    if (rng.chance(0.08)) plan.push(giantKind(rng))
    return plan
  }

  if (architectureName === 'Peas-in-a-pod chain') {
    const family = weightedPick(rng, [
      { weight: 45, value: 'rocky' as const },
      { weight: 35, value: 'super-earth' as const },
      { weight: 20, value: 'sub-neptune' as const },
    ])
    pushRepeated(plan, rng.int(4, 7), () => rng.chance(0.86) ? family : planetLikeKind(rng))
    pushRepeated(plan, rng.int(0, 1), () => debrisKind(rng))
    if (rng.chance(0.08)) plan.push(giantKind(rng))
    return plan
  }

  if (architectureName === 'Solar-ish mixed') {
    pushRepeated(plan, rng.int(2, 5), () => rockyOrSuperKind(rng))
    pushRepeated(plan, weightedCount(rng, [
      { weight: 12, value: 0 },
      { weight: 48, value: 1 },
      { weight: 30, value: 2 },
      { weight: 10, value: 3 },
    ]), () => rng.chance(0.7) ? 'belt' : 'ice-belt')
    const giantCount = weightedCount(rng, [
      { weight: 42, value: 1 },
      { weight: 38, value: 2 },
      { weight: 16, value: 3 },
      { weight: 4, value: 4 },
    ])
    plan.push('gas-giant')
    pushRepeated(plan, giantCount - 1, () => giantKind(rng))
    pushRepeated(plan, rng.int(1, 5), () => debrisKind(rng))
    if (rng.chance(0.14)) plan.push('rogue')
    if (rng.chance(0.08)) plan.push('anomaly')
    return plan
  }

  if (architectureName === 'Migrated giant') {
    plan.push('gas-giant')
    pushRepeated(plan, rng.int(1, 4), () => rockySurvivorKind(rng))
    pushRepeated(plan, rng.int(1, 4), () => rng.chance(0.35) ? giantKind(rng) : debrisKind(rng))
    if (rng.chance(0.25)) plan.splice(rng.int(0, plan.length - 1), 0, 'belt')
    if (rng.chance(0.15)) plan.push('anomaly')
    return plan
  }

  pushRepeated(plan, rng.int(1, 4), () => rockySurvivorKind(rng))
  pushRepeated(plan, rng.int(2, 5), () => giantKind(rng))
  pushRepeated(plan, rng.int(2, 5), () => debrisKind(rng))
  if (rng.chance(0.25)) plan.splice(0, 0, giantKind(rng))
  if (rng.chance(0.25)) plan.push('rogue')
  if (rng.chance(0.28)) plan.push('anomaly')
  return plan
}

function pickWorldClassByCategory(
  rng: SeededRng,
  thermalZone: string,
  categories: BodyCategory[],
  fallback: WorldClassOption
): WorldClassOption {
  const options = worldClassesByThermalZone[thermalZone].filter((option) => categories.includes(option.category))
  return options.length ? pickOne(rng, options) : fallback
}

function pickBeltClass(rng: SeededRng, thermalZone: string, preferIce: boolean): WorldClassOption {
  const sourceRoll = d12(rng)
  const sourceClass = pickTable(rng, sourceRoll, [...beltClassTable])

  if (extremeHotThermalZones.has(thermalZone)) return sourceClass
  if (preferIce && rng.chance(0.6)) {
    return pickOne(rng, [
      { className: 'Ice-rich belt', category: 'belt', massClass: 'Ice-rich belt' },
      { className: 'Cometary swarm', category: 'belt', massClass: 'Comet reservoir' },
      { className: 'Kuiper-like belt', category: 'belt', massClass: 'Outer debris belt' },
    ])
  }

  if (thermalZone === 'Hot' && sourceClass.className === 'Ice-rich belt') {
    return { className: 'Carbonaceous belt', category: 'belt', massClass: 'Carbonaceous belt' }
  }

  return sourceClass
}

function selectWorldClassForPlanKind(rng: SeededRng, thermalZone: string, planKind: BodyPlanKind): WorldClassOption {
  if (planKind === 'rocky') return pickWorldClassByCategory(rng, thermalZone, ['rocky-planet'], forcedWorldClasses.rocky)
  if (planKind === 'super-earth') return pickWorldClassByCategory(rng, thermalZone, ['super-earth'], forcedWorldClasses.superEarth)
  if (planKind === 'sub-neptune') return pickWorldClassByCategory(rng, thermalZone, ['sub-neptune'], forcedWorldClasses.subNeptune)
  if ((planKind === 'belt' || planKind === 'ice-belt') && extremeHotThermalZones.has(thermalZone)) {
    return pickWorldClassByCategory(rng, thermalZone, ['rocky-planet', 'super-earth', 'anomaly'], forcedWorldClasses.rocky)
  }
  if (planKind === 'belt') {
    return pickBeltClass(rng, thermalZone, thermalZone === 'Cold' || thermalZone === 'Cryogenic' || thermalZone === 'Dark')
  }
  if (planKind === 'ice-belt') return pickBeltClass(rng, thermalZone, thermalZone !== 'Hot')
  if (planKind === 'gas-giant') {
    return pickWorldClassByCategory(
      rng,
      thermalZone,
      ['gas-giant'],
      hotThermalZones.has(thermalZone)
        ? { className: 'Hot Jupiter', category: 'gas-giant', massClass: 'Hot gas giant' }
        : forcedWorldClasses.gasGiant
    )
  }
  if (planKind === 'ice-giant') {
    return pickWorldClassByCategory(
      rng,
      thermalZone,
      ['ice-giant'],
      hotThermalZones.has(thermalZone)
        ? { className: 'Hot Jupiter', category: 'gas-giant', massClass: 'Hot gas giant' }
        : forcedWorldClasses.iceGiant
    )
  }
  if (planKind === 'dwarf') {
    if (hotThermalZones.has(thermalZone)) {
      return pickWorldClassByCategory(rng, thermalZone, ['rocky-planet', 'super-earth', 'anomaly'], { className: 'Iron remnant core', category: 'rocky-planet', massClass: 'Mercury-scale remnant' })
    }
    return forcedWorldClasses.dwarf
  }
  if (planKind === 'rogue') {
    if (hotThermalZones.has(thermalZone)) {
      return pickWorldClassByCategory(rng, thermalZone, ['rocky-planet', 'super-earth', 'anomaly'], { className: 'Roche-distorted world', category: 'anomaly', massClass: 'Tidal remnant' })
    }
    return forcedWorldClasses.rogue
  }
  if (planKind === 'anomaly') return pickWorldClassByCategory(rng, thermalZone, ['anomaly'], { className: 'Dark-sector density anomaly', category: 'anomaly', massClass: 'Dark-sector anomaly' })
  return pickOne(rng, worldClassesByThermalZone[thermalZone])
}

function bodyNameForIndex(index: number): string {
  const baseName = bodyNames[index % bodyNames.length]
  const cycle = Math.floor(index / bodyNames.length)
  return cycle === 0 ? baseName : `${baseName} ${cycle + 1}`
}

function generateBodies(rng: SeededRng, primary: Star, architectureName: string): OrbitingBody[] {
  const bodyPlan = generateBodyPlan(rng.fork('body-plan'), architectureName)
  const orbits = generateOrbitSeries(rng, primary.luminositySolar.value, bodyPlan.length)
  const bodies: OrbitingBody[] = []
  let previousFiltered: FilteredWorldClass | null = null

  for (let index = 0; index < orbits.length; index++) {
    const orbitAu = orbits[index]
    const insolation = calculateInsolation(primary.luminositySolar.value, orbitAu)
    const thermalZone = classifyThermalZone(insolation)
    const baseBodyClass = selectWorldClassForPlanKind(rng, thermalZone, bodyPlan[index])
    const basePhysical = buildPhysicalHints(rng, baseBodyClass, orbitAu, primary)
    const filtered = withRecomputedGravity(applyModernExoplanetFilters(rng, baseBodyClass, basePhysical, thermalZone, architectureName, previousFiltered))
    const habitabilityNotes = mDwarfHabitabilityNotes(rng, primary, thermalZone, filtered.bodyClass.category)
    const siteCount = rng.chance(0.55) ? 1 : 0
    const detail = generateDetail(rng, filtered.bodyClass, filtered.physical, thermalZone, primary)
    const moons = generateMoons(rng, filtered.bodyClass, filtered.physical, index, thermalZone, primary, architectureName)
    const rings = generateRingSystem(rng, filtered.bodyClass.category)
    const giantEconomy = generateGiantEconomy(filtered.bodyClass, moons, rings)
    const bodyProfile = generateBodyProfile(filtered.bodyClass, detail, moons, rings)
    const whyInteresting = generateBodyInterest(filtered.bodyClass, thermalZone, detail, moons, [...filtered.filterNotes, ...habitabilityNotes], bodyProfile, giantEconomy)
    bodies.push({
      id: `body-${index + 1}`,
      orbitAu: fact(orbitAu, 'derived', 'Generated orbital spacing'),
      name: fact(bodyNameForIndex(index), 'human-layer', 'Generated system nomenclature'),
      category: fact(filtered.bodyClass.category, 'inferred', 'Thermal-zone body class table'),
      massClass: fact(filtered.bodyClass.massClass, 'inferred', 'Thermal-zone body class table'),
      bodyClass: fact(filtered.bodyClass.className, 'inferred', 'Thermal-zone, architecture, and exoplanet filters'),
      bodyProfile,
      whyInteresting,
      thermalZone: fact(thermalZone, 'derived', `Insolation ${roundTo(insolation, 3)} S`),
      physical: filtered.physical,
      detail,
      moons,
      rings,
      giantEconomy,
      filterNotes: [...filtered.filterNotes, ...habitabilityNotes],
      traits: [fact(pickOne(rng, traitOptions), 'inferred', 'Generated world trait')],
      sites: Array.from({ length: siteCount }, () => fact(pickOne(rng, siteOptions), 'human-layer', 'Generated site')),
    })
    previousFiltered = filtered
  }

  return bodies
}

function intensityFromRoll(roll: number): string {
  return guIntensityTable.find((entry) => roll <= entry.max)?.value ?? guIntensityTable[guIntensityTable.length - 1].value
}

function generateGuOverlay(rng: SeededRng, preference: GuPreference, primary: Star, companions: StellarCompanion[], bodies: OrbitingBody[], architectureName: string) {
  let intensityRoll = twoD6(rng)
  const intensityModifiers: Array<Fact<string>> = []

  if (preference === 'low') {
    intensityRoll -= 2
    intensityModifiers.push(fact('-2 low GU preference', 'gu-layer', 'Generator GU preference'))
  }
  if (preference === 'high') {
    intensityRoll += 2
    intensityModifiers.push(fact('+2 high GU preference', 'gu-layer', 'Generator GU preference'))
  }
  if (preference === 'fracture') {
    intensityRoll += 4
    intensityModifiers.push(fact('+4 fracture GU preference', 'gu-layer', 'Generator GU preference'))
  }
  if (companions.length > 0) {
    intensityRoll += 2
    intensityModifiers.push(fact('+2 multi-star', 'gu-layer', 'MASS-GU GU intensity modifiers'))
  }
  if (primary.spectralType.value === 'M dwarf' && isHighActivity(primary.activity.value)) {
    intensityRoll += 1
    intensityModifiers.push(fact('+1 M dwarf with high activity', 'gu-layer', 'MASS-GU GU intensity modifiers'))
  }
  if (architectureName === 'Compact inner system' || architectureName === 'Peas-in-a-pod chain') {
    intensityRoll += 1
    intensityModifiers.push(fact('+1 close-in resonant planetary chain', 'gu-layer', 'MASS-GU GU intensity modifiers'))
  }
  if (bodies.some((body) => body.category.value === 'gas-giant' || body.category.value === 'ice-giant')) {
    intensityRoll += 1
    intensityModifiers.push(fact('+1 strong giant magnetosphere', 'gu-layer', 'MASS-GU GU intensity modifiers'))
  }
  if (primary.spectralType.value === 'White dwarf/remnant' && bodies.some((body) => body.category.value === 'belt')) {
    intensityRoll += 1
    intensityModifiers.push(fact('+1 white dwarf debris system', 'gu-layer', 'MASS-GU GU intensity modifiers'))
  }
  if (primary.spectralType.value === 'G star' || primary.spectralType.value === 'K star') {
    if (primary.activity.value === 'Quiet' && companions.length === 0) {
      intensityRoll -= 1
      intensityModifiers.push(fact('-1 quiet single G/K system', 'gu-layer', 'MASS-GU GU intensity modifiers'))
    }
  }

  const locationRoll = d20(rng)
  const behaviorRoll = d12(rng)
  const resourceRoll = d20(rng)
  const hazardRoll = d20(rng)
  const hazard = guHazardTable[hazardRoll - 1]
  const resource = guResourceTable[resourceRoll - 1]

  return {
    intensity: fact(intensityFromRoll(intensityRoll), 'gu-layer', 'MASS-GU modified 2d6 GU intensity table'),
    bleedLocation: fact(bleedLocationTable[locationRoll - 1], 'gu-layer', `MASS-GU d20 bleed-zone location roll ${locationRoll}`),
    bleedBehavior: fact(bleedBehaviorTable[behaviorRoll - 1], 'gu-layer', `MASS-GU d12 bleed behavior roll ${behaviorRoll}`),
    resource: fact(resource, 'gu-layer', `MASS-GU d20 resource roll ${resourceRoll}`),
    hazard: fact(hazard === 'Systemic cascade' ? `Systemic cascade: ${pickOne(rng, guHazardTable.slice(0, 19))}; ${pickOne(rng, guHazardTable.slice(0, 19))}` : hazard, 'gu-layer', `MASS-GU d20 hazard roll ${hazardRoll}`),
    intensityRoll: fact(intensityRoll, 'derived', 'Modified 2d6 GU intensity roll'),
    intensityModifiers,
  }
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(5, value))
}

function assertNever(value: never): never {
  throw new Error(`Unhandled settlement category: ${value}`)
}

function settlementTagHook(obviousTag: string, deeperTag: string): string {
  const exactPair = `${obviousTag} + ${deeperTag}`
  if (exactPair === 'Air Is Money + Debt Labor') {
    return 'Air Is Money is visible in every meter and airlock; Debt Labor means workers cannot afford passage out.'
  }
  if (exactPair === 'Bleed-Chaser Port + Narrow-AI Schism') {
    return 'Bleed-Chaser Port draws ships racing moving nodes; Narrow-AI Schism means local AIs disagree over which predictions are safe.'
  }
  if (exactPair === 'Perfect Dome, Rotten Outside + Chiral Monopoly') {
    return 'Perfect Dome, Rotten Outside is the public shape; Chiral Monopoly is the toxic extraction chain everyone outside the dome must endure.'
  }

  const deeperPressures: Record<string, string> = {
    'Abandoned First Wave': 'old first-wave decisions still decide who has shelter, air, and legal standing.',
    'Air Is Money': 'life support has become the settlement currency and the main lever of control.',
    'AI Whisper Cult': 'residents read spiritual or political meaning into narrow-AI behavior.',
    'Anti-Corporate Commune': 'the public story hides a working political break with corporate control.',
    'Aristocratic Dome': 'elite protection and outside deprivation are tied together.',
    'Automated but Haunted': 'old automation keeps producing patterns locals treat as messages.',
    'Bleed-Chaser Port': 'travel, debt, and risk all orbit the next moving bleed opportunity.',
    'Border Fort': 'military necessity is being used to justify civilian restrictions.',
    'Broken Terraformer': 'a failed environmental project is still shaping the crisis.',
    'Chiral Monopoly': 'one faction controls access to the resource everyone needs.',
    'Debt Labor': 'contracts and life-support fees make departure functionally impossible.',
    'Deep Ice': 'buried volatiles or under-ice habitats conceal the real value of the site.',
    'Derelict Yard': 'salvage law and old wreckage hide the deeper conflict.',
    'Elegant Core Enclave': 'polished public spaces mask a harsher dependent economy.',
    'Exile Haven': 'people with incompatible pasts are forced to rely on each other.',
    'Flare Refuge': 'survival protocols double as social control.',
    'Free Captain Nest': 'independent crews set the local law when formal authority fails.',
    'Gate Shadow': 'route access determines who prospers and who is trapped.',
    'Ghost City, Human': 'the haunting is human history, not the supernatural.',
    'High-G Research': 'dangerous science is being treated as necessary infrastructure.',
    'Hidden Navy': 'military presence is deeper than the public registry admits.',
    'Hydrocarbon Frontier': 'volatile extraction keeps everyone solvent and vulnerable.',
    'Kessler Cloud': 'debris hazards make movement, rescue, and evacuation political.',
    'Machine-Run Town': 'humans depend on systems they do not fully control.',
    'Memory-Loss Zone': 'missing records and altered recollections decide the dispute.',
    'Migrant Swarm': 'temporary populations outnumber the institutions meant to govern them.',
    'Moving Node Rush': 'short-lived opportunity is pushing people into unsafe choices.',
    'Narrow-AI Schism': 'AIs agree on facts but not on which human orders can be obeyed.',
    'Old War Minefield': 'legacy weapons make ordinary operations into negotiations.',
    'Outlaw Court': 'local justice answers to power before law.',
    'Penal Extraction': 'punishment and resource production are the same system.',
    'Perfect Dome, Rotten Outside': 'comfort inside depends on sacrifice outside.',
    'Plague/Biosafety Fear': 'containment policy is shaping every personal choice.',
    'Precious Water': 'water ownership is the settlement constitution.',
    'Religious Geometry': 'belief and GU observation are tangled in local politics.',
    'Strikebreaker City': 'labor peace is being maintained by coercion.',
  }

  return `${obviousTag} is what visitors notice first; ${deeperPressures[deeperTag] ?? `${deeperTag.toLowerCase()} is the deeper pressure driving the site.`}`
}

function chooseSettlementTags(rng: SeededRng): [string, string] {
  const obviousTag = pickOne(rng, settlementTags)
  const deeperOptions = settlementTags.filter((tag) => tag !== obviousTag)
  const deeperTag = deeperOptions.length ? pickOne(rng, deeperOptions) : settlementTags[(settlementTags.indexOf(obviousTag) + 1) % settlementTags.length]
  return [obviousTag, deeperTag]
}

function settlementPresenceTier(score: number): string {
  if (score <= 2) return 'Empty except probes'
  if (score <= 4) return 'Beacon, cache, survey buoy'
  if (score === 5) return 'Automated monitor or claim marker'
  if (score === 6) return 'Temporary camp or rotating crew'
  if (score === 7) return 'Automated mine/refinery/research rig'
  if (score === 8) return 'Small permanent outpost'
  if (score === 9) return 'Settlement, dome, tunnel-town, or station'
  if (score === 10) return 'Major base or industrial site'
  if (score === 11) return 'Town, freeport, or military complex'
  if (score === 12) return 'Large colony, hub, or shipyard'
  if (score <= 14) return 'Regional power center'
  return 'Major campaign location'
}

function scoreSettlementPresence(rng: SeededRng, body: OrbitingBody, guOverlay: ReturnType<typeof generateGuOverlay>, reachability: ReturnType<typeof generateReachability>) {
  const roll = twoD6(rng)
  const resource = clampScore(
    (body.category.value === 'belt' || body.category.value === 'gas-giant' || body.category.value === 'ice-giant' ? 2 : 0) +
    (body.sites.length ? 1 : 0) +
    (body.traits.some((trait) => trait.value.includes('resource')) ? 1 : 0) +
    (guOverlay.resource.value ? 1 : 0)
  )
  const access = clampScore(
    (body.category.value === 'belt' || body.category.value === 'dwarf-body' ? 2 : 1) +
    (reachability.className.value.includes('hub') || reachability.className.value.includes('Iggygate') ? 2 : 0) +
    (reachability.className.value.includes('Trade') || reachability.className.value.includes('Corporate') ? 1 : 0)
  )
  const strategic = clampScore(
    (reachability.className.value.includes('Military') || reachability.className.value.includes('Iggygate') ? 3 : 0) +
    (reachability.className.value.includes('crossroads') || reachability.className.value.includes('hub') ? 2 : 0) +
    (body.rings ? 1 : 0)
  )
  const guValue = clampScore(
    (guOverlay.intensity.value.includes('Rich') ? 2 : 0) +
    (guOverlay.intensity.value.includes('fracture') || guOverlay.intensity.value.includes('shear') ? 3 : 0) +
    (body.traits.some((trait) => trait.value.includes('metric')) ? 1 : 0)
  )
  const habitability = clampScore(
    (body.thermalZone.value === 'Temperate band' ? 2 : 0) +
    (body.detail.biosphere.value !== 'Sterile' ? 1 : 0) +
    (body.detail.radiation.value === 'Benign' || body.detail.radiation.value === 'Manageable' ? 1 : 0)
  )
  const hazard = clampScore(
    (body.detail.radiation.value.includes('Severe') || body.detail.radiation.value.includes('Flare-lethal') ? 2 : 0) +
    (body.thermalZone.value === 'Furnace' || body.thermalZone.value === 'Inferno' ? 2 : 0) +
    (guOverlay.hazard.value ? 1 : 0)
  )
  const legalHeat = clampScore(
    (reachability.className.value.includes('Gardener') ? 3 : 0) +
    (guOverlay.hazard.value.includes('quarantine') ? 2 : 0) +
    (guOverlay.resource.value.includes('Illegal') ? 3 : 0)
  )
  const routeValue = reachability.className.value.includes('Iggygate') || reachability.className.value.includes('hub') ? 2 : 1
  const score = roll + resource + access + strategic + guValue + routeValue + habitability - hazard - legalHeat
  const tier = settlementPresenceTier(score)

  return { score, roll, tier, resource, access, strategic, guValue, habitability, hazard, legalHeat }
}

type SettlementPresenceScore = ReturnType<typeof scoreSettlementPresence>

interface ScoredSettlementBody {
  body: OrbitingBody
  presence: SettlementPresenceScore
}

function weightedSettlementBaseCount(rng: SeededRng, density: GenerationOptions['settlements']): number {
  const roll = rng.int(1, 100)
  if (density === 'sparse') {
    if (roll <= 35) return 0
    if (roll <= 85) return 1
    return 2
  }
  if (density === 'crowded') {
    if (roll <= 15) return 3
    if (roll <= 45) return 4
    if (roll <= 80) return 5
    return 6
  }
  if (density === 'hub') {
    if (roll <= 10) return 4
    if (roll <= 30) return 5
    if (roll <= 60) return 6
    if (roll <= 85) return 7
    return 8
  }

  if (roll <= 25) return 1
  if (roll <= 75) return 2
  if (roll <= 97) return 3
  return 4
}

function settlementCountBounds(density: GenerationOptions['settlements']): [number, number] {
  if (density === 'sparse') return [0, 2]
  if (density === 'crowded') return [3, 6]
  if (density === 'hub') return [4, 8]
  return [1, 4]
}

function targetSettlementCount(
  rng: SeededRng,
  options: GenerationOptions,
  scored: ScoredSettlementBody[],
  guOverlay: ReturnType<typeof generateGuOverlay>,
  reachability: ReturnType<typeof generateReachability>,
  architectureName: string
): number {
  const [min, max] = settlementCountBounds(options.settlements)
  let count = weightedSettlementBaseCount(rng, options.settlements)
  const topScores = scored.slice(0, Math.max(1, Math.min(3, scored.length))).map((entry) => entry.presence.score)
  const averageTopScore = topScores.length
    ? topScores.reduce((sum, score) => sum + score, 0) / topScores.length
    : 0
  const topScore = topScores[0] ?? 0

  if (options.settlements === 'sparse') {
    if (topScore < 8) count = 0
    if ((reachability.className.value.includes('Iggygate') || reachability.className.value.includes('hub')) && averageTopScore >= 12) count += 1
    return Math.max(0, Math.min(scored.length, Math.max(min, Math.min(max, count))))
  }

  if (options.settlements === 'normal') {
    if (reachability.className.value.includes('Dead-end') || reachability.className.value.includes('Marginal')) count -= 1
    if ((guOverlay.intensity.value.includes('Rich') || guOverlay.intensity.value.includes('fracture') || guOverlay.intensity.value.includes('shear')) && averageTopScore >= 14) count += 1
    if (topScore < 9) count -= 1
    if (scored.slice(0, 3).every((entry) => entry.presence.hazard >= 4)) count -= 1
    return Math.max(0, Math.min(scored.length, Math.max(min, Math.min(max, count))))
  }

  if ((reachability.className.value.includes('Iggygate') || reachability.className.value.includes('hub')) && averageTopScore >= 13) count += 1
  if (reachability.className.value.includes('Dead-end') || reachability.className.value.includes('Marginal')) count -= 1
  if (guOverlay.intensity.value.includes('Rich') || guOverlay.intensity.value.includes('fracture') || guOverlay.intensity.value.includes('shear')) count += 1
  if (architectureName === 'Giant-rich or chaotic') count += 1
  if (averageTopScore >= 14) count += 1
  if (topScore < 9) count -= 1
  if (scored.slice(0, 3).every((entry) => entry.presence.hazard >= 4)) count -= 1

  return Math.max(0, Math.min(scored.length, Math.max(min, Math.min(max, count))))
}

function settlementScaleFromRoll(rng: SeededRng, presence: SettlementPresenceScore): string {
  let roll = d12(rng)
  if (presence.score <= 6) roll -= 2
  if (presence.score === 7 || presence.score === 8) roll -= 1
  if (presence.score >= 12) roll += 1
  if (presence.score >= 15) roll += 2
  roll = Math.max(1, Math.min(12, roll))
  return settlementScaleTable[roll - 1]
}

function location(label: string, category: SettlementSiteCategory): SettlementLocationOption {
  return { label, category }
}

function chooseSettlementLocation(rng: SeededRng, body: OrbitingBody, reachability: ReturnType<typeof generateReachability>): SettlementLocationOption {
  const orbitalOptions = [
    location('Low-orbit station', 'Orbital station'),
    location('High-orbit station', 'Orbital station'),
    location('Lagrange anchor', 'Deep-space platform'),
    location('Trojan habitat', 'Deep-space platform'),
    location('Ring-arc platform', 'Orbital station'),
  ] satisfies SettlementLocationOption[]
  const routeOptions = [
    location('Iggygate throat complex', 'Gate or route node'),
    location('Pinchdrive calibration range', 'Gate or route node'),
    location('Quarantine perimeter station', 'Gate or route node'),
    location('Sol/Gardener exclusion picket', 'Gate or route node'),
    location('Military listening post', 'Gate or route node'),
  ] satisfies SettlementLocationOption[]
  const asteroidOptions = [
    location('Asteroid tunnel city', 'Asteroid or belt base'),
    location('Belt refinery', 'Asteroid or belt base'),
    location('Comet ice camp', 'Asteroid or belt base'),
    location('Dwarf-planet bunker', 'Asteroid or belt base'),
    location('Rogue-body hideout', 'Asteroid or belt base'),
    location('White-dwarf debris station', 'Asteroid or belt base'),
  ] satisfies SettlementLocationOption[]
  const surfaceOptions = [
    location('Planetary surface dome', 'Surface settlement'),
    location('Lava tube settlement', 'Surface settlement'),
    location('Polar ice mine', 'Surface settlement'),
    location('Terminator-line rail city', 'Surface settlement'),
    location('Floating aerostat', 'Surface settlement'),
    location('Seafloor or under-ice habitat', 'Surface settlement'),
    location('Deep canyon pressure habitat', 'Surface settlement'),
  ] satisfies SettlementLocationOption[]
  const moonOptions = [
    location('Moon crater base', 'Moon base'),
    location('Subsurface ocean bore station', 'Moon base'),
    location('Tidal-volcanic power site', 'Moon base'),
    location('Magnetic-pole observatory', 'Moon base'),
    location('Radiation-belt fortress', 'Moon base'),
  ] satisfies SettlementLocationOption[]
  const mobileOptions = [
    location('Moving bleed-node chase fleet', 'Mobile site'),
    location('Freeport cluster', 'Mobile site'),
  ] satisfies SettlementLocationOption[]
  const restrictedOptions = [
    location('First-wave human ruin', 'Derelict or restricted site'),
    location('Hidden black site', 'Derelict or restricted site'),
    location('Corporate enclave', 'Derelict or restricted site'),
    location('Penal extraction camp', 'Derelict or restricted site'),
    location('Religious/ideological refuge', 'Derelict or restricted site'),
  ] satisfies SettlementLocationOption[]

  if (reachability.className.value.includes('Iggygate') && rng.chance(0.6)) return pickOne(rng, routeOptions)
  if (body.category.value === 'belt') return pickOne(rng, [...asteroidOptions, ...orbitalOptions])
  if (body.category.value === 'gas-giant' || body.category.value === 'ice-giant' || body.category.value === 'sub-neptune') {
    return pickOne(rng, [
      location('Gas-giant skimmer', 'Orbital station'),
      ...orbitalOptions,
      ...(body.moons.length > 0 ? moonOptions : []),
      ...routeOptions.slice(1),
    ])
  }
  if (body.moons.length > 0 && rng.chance(0.35)) return pickOne(rng, moonOptions)
  if (body.thermalZone.value === 'Furnace' || body.thermalZone.value === 'Inferno') return pickOne(rng, [...orbitalOptions, ...routeOptions])
  if (body.thermalZone.value === 'Cold' || body.thermalZone.value === 'Cryogenic' || body.thermalZone.value === 'Dark') {
    return pickOne(rng, [...asteroidOptions, ...(body.moons.length > 0 ? moonOptions : []), ...restrictedOptions, ...mobileOptions])
  }
  if (rng.chance(0.2)) return pickOne(rng, [...routeOptions, ...mobileOptions, ...restrictedOptions])
  return pickOne(rng, [...surfaceOptions, ...(body.moons.length > 0 ? moonOptions : []), ...orbitalOptions])
}

function chooseSettlementFunction(
  rng: SeededRng,
  body: OrbitingBody,
  locationOption: SettlementLocationOption,
  guOverlay: ReturnType<typeof generateGuOverlay>
): string {
  if (guOverlay.intensity.value.includes('fracture') || guOverlay.intensity.value.includes('shear')) {
    return pickOne(rng, guFractureFunctionsBySiteCategory[locationOption.category])
  }
  if (body.detail.biosphere.value !== 'Sterile') return pickOne(rng, ['Biosphere research station', 'Quarantine station', 'Civilian colony', 'Planetology lab'])

  switch (locationOption.category) {
    case 'Surface settlement':
      if (locationOption.label.includes('ice') || locationOption.label.includes('under-ice')) return pickOne(rng, ['Volatile mine', 'Biosphere research station', 'Civilian colony', 'Refugee settlement'])
      if (locationOption.label.includes('Lava') || locationOption.label.includes('Polar')) return pickOne(rng, [...extractionFunctions, ...surveyFunctions])
      return pickOne(rng, [...civilFunctions, ...surveyFunctions, ...extractionFunctions])
    case 'Orbital station':
      if (body.category.value === 'gas-giant' || body.category.value === 'ice-giant' || body.category.value === 'sub-neptune') return pickOne(rng, ['Fuel depot', 'Ship repair yard', 'Survey station', 'Naval logistics depot'])
      return pickOne(rng, [...orbitalFunctions, ...surveyFunctions, ...securityFunctions])
    case 'Asteroid or belt base':
      return pickOne(rng, [...extractionFunctions, 'Fuel depot', 'Salvage yard', 'Smuggler port'])
    case 'Moon base':
      return pickOne(rng, [...extractionFunctions, ...surveyFunctions, 'Military base', 'Biosphere research station', 'Quarantine station'])
    case 'Deep-space platform':
      return pickOne(rng, [...orbitalFunctions, ...surveyFunctions, 'Listening post', 'Corporate customs post'])
    case 'Gate or route node':
      return pickOne(rng, [...routeFunctions, ...securityFunctions])
    case 'Mobile site':
      return pickOne(rng, ['Moving bleed-node harvest fleet', 'Freeport', 'Smuggler port', 'Refugee settlement', 'Naval logistics depot'])
    case 'Derelict or restricted site':
      return pickOne(rng, ['Survey station', 'Salvage yard', 'Intelligence black site', 'Prison or debt-labor site', 'Quarantine station', 'Weapons test range'])
    default:
      return assertNever(locationOption.category)
  }
}

function chooseBuiltForm(rng: SeededRng, locationOption: SettlementLocationOption, settlementFunction: string): string {
  if (locationOption.label === 'Terminator-line rail city') return 'Rail-linked terminator city'
  if (locationOption.label === 'Floating aerostat') return 'Aerostat city'
  if (locationOption.label === 'Seafloor or under-ice habitat') return 'Submarine habitat'
  if (locationOption.label === 'Subsurface ocean bore station') return 'Borehole habitat'
  if (locationOption.label === 'Lava tube settlement') return 'Lava-tube arcology'
  if (locationOption.label === 'First-wave human ruin') return 'First-wave retrofitted ruin'
  if (locationOption.label === 'Asteroid tunnel city') return 'Asteroid hollow'
  if (locationOption.label === 'Moving bleed-node chase fleet') return pickOne(rng, mobileBuiltForms)
  if (settlementFunction.includes('mine') || settlementFunction.includes('extraction')) {
    if (locationOption.category === 'Asteroid or belt base') return pickOne(rng, ['Asteroid hollow', 'Buried pressure cans', 'Ice-shielded tunnels'])
    if (locationOption.category === 'Moon base') return pickOne(rng, ['Buried pressure cans', 'Ice-shielded tunnels', 'Borehole habitat', 'Shielded military bunker'])
    if (locationOption.category === 'Surface settlement') return pickOne(rng, ['Buried pressure cans', 'Ice-shielded tunnels', 'Lava-tube arcology', 'Dome cluster'])
    return pickOne(rng, ['Modular orbital lattice', 'Shielded military bunker'])
  }

  switch (locationOption.category) {
    case 'Orbital station':
      return pickOne(rng, orbitalBuiltForms)
    case 'Asteroid or belt base':
      return pickOne(rng, asteroidBuiltForms)
    case 'Surface settlement':
      return pickOne(rng, surfaceBuiltForms)
    case 'Moon base':
      return pickOne(rng, moonBuiltForms)
    case 'Gate or route node':
      return pickOne(rng, gateBuiltForms)
    case 'Mobile site':
      return pickOne(rng, mobileBuiltForms)
    case 'Deep-space platform':
      return pickOne(rng, orbitalBuiltForms)
    case 'Derelict or restricted site':
      return pickOne(rng, derelictBuiltForms)
    default:
      return assertNever(locationOption.category)
  }
}

function chooseSettlementAnchor(
  rng: SeededRng,
  systemName: string,
  body: OrbitingBody,
  locationOption: SettlementLocationOption
): SettlementAnchor {
  const bodyName = body.name.value

  if (locationOption.category === 'Moon base') {
    const moon = chooseMoonForLocation(rng, body.moons, locationOption.label)
    if (moon) {
      return {
        kind: 'major moon',
        name: `${moon.name.value}, moon of ${bodyName}`,
        detail: `${locationOption.label} on ${moon.name.value}, a ${moon.scale.value} ${moon.moonType.value.toLowerCase()} orbiting ${bodyName}. ${moon.use.value}.`,
        moonId: moon.id,
      }
    }
    return {
      kind: 'minor moonlet',
      name: `minor moonlet of ${bodyName}`,
      detail: `${locationOption.label} on a minor moonlet not otherwise detailed in the orbital profile.`,
    }
  }

  if (locationOption.category === 'Surface settlement') {
    return {
      kind: 'body surface',
      name: bodyName,
      detail: `${locationOption.label} on ${bodyName}, a ${body.bodyClass.value.toLowerCase()} in the ${body.thermalZone.value.toLowerCase()} zone.`,
    }
  }

  if (locationOption.category === 'Orbital station') {
    return {
      kind: 'orbit',
      name: `${bodyName} orbital space`,
      detail: `${locationOption.label} in operational orbit around ${bodyName}.`,
    }
  }

  if (locationOption.category === 'Asteroid or belt base') {
    const anchorName = body.category.value === 'belt' ? bodyName : `${bodyName} minor-body complex`
    return {
      kind: body.category.value === 'belt' ? 'belt' : 'nearby minor bodies',
      name: anchorName,
      detail: `${locationOption.label} tied to ${anchorName}.`,
    }
  }

  if (locationOption.category === 'Deep-space platform') {
    return {
      kind: 'orbital point',
      name: `${bodyName} route geometry`,
      detail: `${locationOption.label} at a stable traffic, Trojan, or Lagrange-adjacent point associated with ${bodyName}.`,
    }
  }

  if (locationOption.category === 'Gate or route node') {
    return {
      kind: 'route node',
      name: `${systemName} transit geometry`,
      detail: `${locationOption.label} positioned where system traffic, interdiction, or pinchdrive calibration passes through ${bodyName}'s region.`,
    }
  }

  if (locationOption.category === 'Mobile site') {
    return {
      kind: 'mobile route presence',
      name: `${systemName} traffic pattern`,
      detail: `${locationOption.label} operating across a moving resource, refugee, or freeport route near ${bodyName}.`,
    }
  }

  return {
    kind: 'restricted site',
    name: bodyName,
    detail: `${locationOption.label} associated with ${bodyName}, but its exact footprint is politically or legally obscured.`,
  }
}

function chooseMoonForLocation(rng: SeededRng, moons: Moon[], locationLabel: string): Moon | undefined {
  if (moons.length === 0) return undefined

  const preferred = moons.filter((moon) => {
    const moonType = moon.moonType.value
    if (locationLabel === 'Subsurface ocean bore station') return moonType.includes('ocean') || moonType.includes('ice-shell') || moonType.includes('Cryovolcanic')
    if (locationLabel === 'Tidal-volcanic power site') return moonType.includes('Volcanic') || moonType.includes('tidal')
    if (locationLabel === 'Magnetic-pole observatory' || locationLabel === 'Radiation-belt fortress') return moonType.includes('Radiation') || moonType.includes('Ring-shepherd') || moonType.includes('Dark-sector')
    if (locationLabel === 'Moon crater base') return moonType.includes('Airless') || moonType.includes('Cratered') || moonType.includes('Captured') || moonType.includes('Former settlement') || moonType.includes('Active mining')
    return true
  })

  return pickOne(rng, preferred.length ? preferred : moons)
}

function settlementWhyHere(
  body: OrbitingBody,
  presence: ReturnType<typeof scoreSettlementPresence>,
  guOverlay: ReturnType<typeof generateGuOverlay>,
  reachability: ReturnType<typeof generateReachability>,
  anchor: SettlementAnchor
): string {
  const reasons: string[] = []

  if (presence.resource >= 3) reasons.push(`resources are strong here, especially ${guOverlay.resource.value.toLowerCase()}`)
  else if (presence.resource >= 2) reasons.push('local materials, volatiles, or fuel justify permanent infrastructure')

  if (presence.access >= 3) reasons.push(`${reachability.className.value.toLowerCase()} access keeps traffic viable`)
  else if (presence.access >= 2) reasons.push('access is manageable for prepared crews')

  if (presence.strategic >= 3) reasons.push('the site controls a militarily or commercially important approach')
  else if (presence.strategic >= 2) reasons.push('the site watches a useful route or resource')

  if (presence.guValue >= 3) reasons.push('GU value is high enough to justify danger and secrecy')
  else if (presence.guValue >= 1) reasons.push('local metric signatures add research or extraction value')

  if (presence.habitability >= 2) reasons.push(`${body.name.value} offers unusually forgiving environmental support`)
  if (presence.hazard >= 3) reasons.push('hazards are severe, so the site exists because the payoff is worth the risk')
  else if (presence.hazard >= 1) reasons.push('hazards shape operations but do not prevent occupation')
  if (presence.legalHeat >= 2) reasons.push('legal or interdiction pressure explains the secrecy and tension')

  const selected = reasons.slice(0, 3)
  if (selected.length === 0) {
    selected.push(`${anchor.name} is the best available compromise between access, shelter, and useful work`)
  }

  return `${anchor.name}: ${selected.join('; ')}.`
}

function generateSettlements(
  rng: SeededRng,
  options: GenerationOptions,
  systemName: string,
  bodies: OrbitingBody[],
  guOverlay: ReturnType<typeof generateGuOverlay>,
  reachability: ReturnType<typeof generateReachability>,
  architectureName: string
): Settlement[] {
  const scored = bodies
    .map((body, bodyIndex) => ({ body, presence: scoreSettlementPresence(rng.fork(`presence-${bodyIndex + 1}`), body, guOverlay, reachability) }))
    .sort((a, b) => b.presence.score - a.presence.score)
  const targetCount = targetSettlementCount(rng, options, scored, guOverlay, reachability, architectureName)
  const selected = scored.slice(0, targetCount)

  return selected.map(({ body, presence }, index) => {
    const locationOption = chooseSettlementLocation(rng, body, reachability)
    const settlementFunction = chooseSettlementFunction(rng, body, locationOption, guOverlay)
    const builtForm = chooseBuiltForm(rng, locationOption, settlementFunction)
    const anchor = chooseSettlementAnchor(rng, systemName, body, locationOption)
    const whyHere = settlementWhyHere(body, presence, guOverlay, reachability, anchor)
    const tags = chooseSettlementTags(rng)
    const tagHook = settlementTagHook(tags[0], tags[1])
    return {
      id: `settlement-${index + 1}`,
      bodyId: body.id,
      moonId: anchor.moonId,
      name: fact(`${body.name.value} ${pickOne(rng, ['Freeport', 'Anchor', 'Bore', 'Picket', 'Yard', 'Station'])}`, 'human-layer', 'Generated settlement name'),
      anchorKind: fact(anchor.kind, 'human-layer', 'Generated site-to-body relationship'),
      anchorName: fact(anchor.name, 'human-layer', 'Generated site-to-body relationship'),
      anchorDetail: fact(anchor.detail, 'human-layer', 'Generated site-to-body relationship'),
      siteCategory: fact(locationOption.category, 'human-layer', 'MASS-GU section 18 constrained site category'),
      location: fact(locationOption.label, 'human-layer', 'MASS-GU 18.3 site location table with body constraints'),
      function: fact(settlementFunction, 'human-layer', 'MASS-GU settlement function table with body constraints'),
      scale: fact(settlementScaleFromRoll(rng, presence), 'human-layer', 'MASS-GU 18.2 settlement scale d12 table'),
      authority: fact(pickOne(rng, settlementAuthorities), 'human-layer', 'MASS-GU 18.5 authority table'),
      builtForm: fact(builtForm, 'human-layer', 'MASS-GU built form table with location/function constraints'),
      aiSituation: fact(pickOne(rng, aiSituations), 'human-layer', 'MASS-GU AI situation table'),
      condition: fact(pickOne(rng, settlementConditions), 'human-layer', 'MASS-GU settlement condition table'),
      tags: tags.map((tag, tagIndex) => fact(tag, 'human-layer', tagIndex === 0 ? 'MASS-GU 18.9 obvious settlement tag' : 'MASS-GU 18.9 deeper settlement tag')),
      tagHook: fact(tagHook, 'human-layer', 'Generated interpretation of MASS-GU 18.9 tag pair'),
      crisis: fact(pickOne(rng, settlementCrises), 'human-layer', 'MASS-GU 18.10 crisis table'),
      hiddenTruth: fact(pickOne(rng, hiddenTruths), 'human-layer', 'MASS-GU 18.11 hidden truth table; no-alien conversion applied where needed'),
      encounterSites: Array.from({ length: 2 }, () => fact(pickOne(rng, encounterSites), 'human-layer', 'MASS-GU 18.12 local encounter site table')),
      whyHere: fact(whyHere, 'human-layer', 'Generated from MASS-GU 18.1 presence score components'),
      methodNotes: [
        fact('Source-derived from MASS-GU section 18; current implementation adds compatibility constraints between body, site category, function, built form, and physical anchor.', 'human-layer', 'Implementation note'),
      ],
      presence: {
        score: fact(presence.score, 'human-layer', 'MASS-GU settlement presence score'),
        roll: fact(presence.roll, 'human-layer', 'MASS-GU 18.1 settlement presence 2d6 roll'),
        tier: fact(presence.tier, 'human-layer', 'MASS-GU 18.1 settlement presence result'),
        resource: fact(presence.resource, 'human-layer', 'Presence score component'),
        access: fact(presence.access, 'human-layer', 'Presence score component'),
        strategic: fact(presence.strategic, 'human-layer', 'Presence score component'),
        guValue: fact(presence.guValue, 'gu-layer', 'Presence score component'),
        habitability: fact(presence.habitability, 'inferred', 'Presence score component'),
        hazard: fact(presence.hazard, 'inferred', 'Presence score component'),
        legalHeat: fact(presence.legalHeat, 'human-layer', 'Presence score component'),
      },
    }
  })
}

function generateHumanRemnants(rng: SeededRng, bodies: OrbitingBody[], guOverlay: ReturnType<typeof generateGuOverlay>): HumanRemnant[] {
  const count = guOverlay.intensity.value.includes('fracture') || guOverlay.intensity.value.includes('shear') ? 3 : 2
  return Array.from({ length: count }, (_, index) => {
    const body = pickOne(rng, bodies)
    return {
      id: `remnant-${index + 1}`,
      location: fact(body.name.value, 'human-layer', 'Generated remnant location'),
      remnantType: fact(pickOne(rng, humanRemnants), 'human-layer', 'MASS-GU human remnant table'),
      hook: fact(pickOne(rng, remnantHooks), 'human-layer', 'Generated remnant hook'),
    }
  })
}

function generatePhenomena(rng: SeededRng, architectureName: string, guOverlay: ReturnType<typeof generateGuOverlay>): SystemPhenomenon[] {
  const count = guOverlay.intensity.value.includes('Rich') || architectureName.includes('Major') ? 3 : 2
  return Array.from({ length: count }, (_, index) => {
    const phenomenon = pickOne(rng, phenomena)
    return {
      id: `phenomenon-${index + 1}`,
      phenomenon: fact(phenomenon, phenomenon.includes('bleed') || phenomenon.includes('chiral') || phenomenon.includes('Iggygate') ? 'gu-layer' : 'inferred', 'MASS-GU expanded phenomena table'),
      note: fact(`${phenomenon} shapes travel, survey priorities, or local conflict.`, 'inferred', 'Generated phenomenon note'),
    }
  })
}

const noAlienReplacements: Array<{ pattern: RegExp; replacement: string; label: string }> = [
  { pattern: /\balien\s+civilizations?\b/gi, replacement: 'human polities', label: 'alien civilization -> human polity' },
  { pattern: /\balien\s+ruins?\b/gi, replacement: 'first-wave human ruins', label: 'alien ruin -> first-wave human ruin' },
  { pattern: /\balien\s+artifacts?\b/gi, replacement: 'natural GU formations', label: 'alien artifact -> natural GU formation' },
  { pattern: /\balien\s+signals?\b/gi, replacement: 'encrypted human beacons', label: 'alien signal -> encrypted human beacon' },
  { pattern: /\balien\s+megastructures?\b/gi, replacement: 'failed Iggygate collars', label: 'alien megastructure -> failed Iggygate collar' },
  { pattern: /\bforbidden\s+archaeology\b/gi, replacement: 'deleted expedition archive', label: 'forbidden archaeology -> deleted expedition archive' },
  { pattern: /\bnative\s+civilizations?\b/gi, replacement: 'native non-sapient ecologies', label: 'native civilization -> native non-sapient ecology' },
  { pattern: /\bancient\s+cities\b/gi, replacement: 'first-wave human cities', label: 'ancient city -> first-wave human city' },
  { pattern: /\balien\s+machines?\b/gi, replacement: 'human experimental devices', label: 'alien machine -> human experimental device' },
  { pattern: /\bnonhuman\s+signals?\b/gi, replacement: 'unknown human or natural signals', label: 'nonhuman signal -> human or natural signal' },
]

export function applyNoAlienTextGuard(value: string): { value: string; conversions: string[] } {
  const conversions: string[] = []
  let guarded = value

  for (const replacement of noAlienReplacements) {
    replacement.pattern.lastIndex = 0
    if (replacement.pattern.test(guarded)) {
      replacement.pattern.lastIndex = 0
      guarded = guarded.replace(replacement.pattern, replacement.replacement)
      conversions.push(replacement.label)
    }
  }

  return { value: guarded, conversions }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function guardGeneratedText<T>(input: T, conversions: string[]): T {
  if (typeof input === 'string') {
    return applyNoAlienTextGuard(input).value as T
  }

  if (Array.isArray(input)) {
    return input.map((entry) => guardGeneratedText(entry, conversions)) as T
  }

  if (!isRecord(input)) return input

  const output: Record<string, unknown> = { ...input }
  if (typeof input.value === 'string') {
    const guarded = applyNoAlienTextGuard(input.value)
    if (guarded.value !== input.value) {
      conversions.push(...guarded.conversions)
      output.value = guarded.value
      if (typeof input.source === 'string') output.source = `${input.source}; no-alien guard`
    }
  }

  for (const [key, value] of Object.entries(input)) {
    if (key === 'value' || key === 'source' || key === 'noAlienCheck') continue
    output[key] = guardGeneratedText(value, conversions)
  }

  return output as T
}

function runNoAlienGuard(system: Omit<GeneratedSystem, 'noAlienCheck'>): GeneratedSystem {
  const conversions: string[] = []
  const guardedSystem = guardGeneratedText(system, conversions)
  const uniqueConversions = [...new Set(conversions)]

  return {
    ...guardedSystem,
    noAlienCheck: {
      passed: true,
      note: uniqueConversions.length
        ? `No alien civilizations, ruins, artifacts, or megastructures generated. Converted ${uniqueConversions.length} old-style result${uniqueConversions.length === 1 ? '' : 's'}.`
        : 'No alien civilizations, ruins, artifacts, or megastructures generated.',
    },
  }
}

export function generateSystem(options: GenerationOptions): GeneratedSystem {
  const rootRng = createSeededRng(options.seed)
  const name = generateSystemName(rootRng.fork('name'))
  const basePrimary = generatePrimaryStar(rootRng.fork('star'), options, name)
  const companions = generateStellarCompanions(rootRng.fork('companions'), basePrimary)
  const primary = applyCompanionActivityModifier(basePrimary, companions)
  const reachability = generateReachability(rootRng.fork('reachability'), options, primary, companions)
  const architectureResult = generateArchitecture(rootRng.fork('architecture'), options, primary, reachability.className.value)
  const hz = calculateHabitableZone(primary.luminositySolar.value)
  const snowLine = calculateSnowLine(primary.luminositySolar.value)
  const bodies = generateBodies(rootRng.fork('bodies'), primary, architectureResult.architecture.name.value)
  const guOverlay = generateGuOverlay(rootRng.fork('gu'), options.gu, primary, companions, bodies, architectureResult.architecture.name.value)
  const settlements = generateSettlements(rootRng.fork('settlements'), options, name, bodies, guOverlay, reachability, architectureResult.architecture.name.value)
  const ruins = generateHumanRemnants(rootRng.fork('ruins'), bodies, guOverlay)
  const phenomena = generatePhenomena(rootRng.fork('phenomena'), architectureResult.architecture.name.value, guOverlay)

  return runNoAlienGuard({
    id: `system-${options.seed}`,
    seed: options.seed,
    options,
    name: fact(name, 'human-layer', 'Generated system name'),
    dataBasis: fact('Fictional generated system', 'human-layer', 'MVP fictional generation'),
    primary,
    companions,
    reachability,
    architecture: architectureResult.architecture,
    zones: {
      habitableInnerAu: fact(hz.inner, 'derived', '0.75 * sqrt(L)'),
      habitableCenterAu: fact(hz.center, 'derived', 'sqrt(L)'),
      habitableOuterAu: fact(hz.outer, 'derived', '1.77 * sqrt(L)'),
      snowLineAu: fact(snowLine, 'derived', '2.7 * sqrt(L)'),
    },
    bodies,
    guOverlay,
    settlements,
    ruins,
    phenomena,
    majorHazards: [guOverlay.hazard, fact(primary.activity.value, 'inferred', 'Stellar activity hazard')],
  })
}
