export type Confidence = 'confirmed' | 'derived' | 'inferred' | 'gu-layer' | 'human-layer'

export interface Fact<T> {
  value: T
  confidence: Confidence
  source?: string
  locked?: boolean
}

export type GeneratorDistribution = 'frontier' | 'realistic'
export type GeneratorTone = 'balanced' | 'astronomy' | 'cinematic'
export type GuPreference = 'normal' | 'low' | 'high' | 'fracture'
export type SettlementDensity = 'normal' | 'sparse' | 'crowded' | 'hub'

export interface GenerationOptions {
  seed: string
  distribution: GeneratorDistribution
  tone: GeneratorTone
  gu: GuPreference
  settlements: SettlementDensity
}

export interface Star {
  id: string
  name: Fact<string>
  spectralType: Fact<string>
  massSolar: Fact<number>
  luminositySolar: Fact<number>
  ageState: Fact<string>
  metallicity: Fact<string>
  activity: Fact<string>
}

export interface Reachability {
  className: Fact<string>
  routeNote: Fact<string>
  pinchDifficulty: Fact<string>
}

export interface SystemArchitecture {
  name: Fact<string>
  description: Fact<string>
}

export interface SystemZones {
  habitableInnerAu: Fact<number>
  habitableCenterAu: Fact<number>
  habitableOuterAu: Fact<number>
  snowLineAu: Fact<number>
}

export type BodyCategory =
  | 'rocky-planet'
  | 'super-earth'
  | 'sub-neptune'
  | 'gas-giant'
  | 'ice-giant'
  | 'belt'
  | 'dwarf-body'
  | 'rogue-captured'
  | 'anomaly'

export interface PlanetaryDetail {
  atmosphere: Fact<string>
  hydrosphere: Fact<string>
  geology: Fact<string>
  climate: Array<Fact<string>>
  radiation: Fact<string>
  biosphere: Fact<string>
}

export interface Moon {
  id: string
  name: Fact<string>
  moonType: Fact<string>
  scale: Fact<string>
  resource: Fact<string>
  hazard: Fact<string>
  use: Fact<string>
}

export interface RingSystem {
  type: Fact<string>
}

export interface BodyPhysicalHints {
  radiusEarth: Fact<number>
  periodDays: Fact<number>
  closeIn: Fact<boolean>
  volatileEnvelope: Fact<boolean>
}

export interface OrbitingBody {
  id: string
  orbitAu: Fact<number>
  name: Fact<string>
  category: Fact<BodyCategory>
  massClass: Fact<string>
  bodyClass: Fact<string>
  thermalZone: Fact<string>
  physical: BodyPhysicalHints
  detail: PlanetaryDetail
  moons: Moon[]
  rings?: RingSystem
  giantEconomy?: Fact<string>
  filterNotes: Array<Fact<string>>
  traits: Array<Fact<string>>
  sites: Array<Fact<string>>
}

export interface GuOverlay {
  intensity: Fact<string>
  bleedLocation: Fact<string>
  resource: Fact<string>
  hazard: Fact<string>
}

export interface Settlement {
  id: string
  name: Fact<string>
  bodyId?: string
  moonId?: string
  anchorKind: Fact<string>
  anchorName: Fact<string>
  anchorDetail: Fact<string>
  siteCategory: Fact<string>
  location: Fact<string>
  function: Fact<string>
  scale: Fact<string>
  authority: Fact<string>
  builtForm: Fact<string>
  aiSituation: Fact<string>
  condition: Fact<string>
  tags: Array<Fact<string>>
  tagHook: Fact<string>
  crisis: Fact<string>
  hiddenTruth: Fact<string>
  encounterSites: Array<Fact<string>>
  whyHere: Fact<string>
  methodNotes: Array<Fact<string>>
  presence: {
    score: Fact<number>
    resource: Fact<number>
    access: Fact<number>
    strategic: Fact<number>
    guValue: Fact<number>
    habitability: Fact<number>
    hazard: Fact<number>
    legalHeat: Fact<number>
  }
}

export interface HumanRemnant {
  id: string
  location: Fact<string>
  remnantType: Fact<string>
  hook: Fact<string>
}

export interface SystemPhenomenon {
  id: string
  phenomenon: Fact<string>
  note: Fact<string>
}

export interface NoAlienCheck {
  passed: boolean
  note: string
}

export interface GeneratedSystem {
  id: string
  seed: string
  options: GenerationOptions
  name: Fact<string>
  dataBasis: Fact<string>
  primary: Star
  reachability: Reachability
  architecture: SystemArchitecture
  zones: SystemZones
  bodies: OrbitingBody[]
  guOverlay: GuOverlay
  settlements: Settlement[]
  ruins: HumanRemnant[]
  phenomena: SystemPhenomenon[]
  majorHazards: Array<Fact<string>>
  noAlienCheck: NoAlienCheck
}
