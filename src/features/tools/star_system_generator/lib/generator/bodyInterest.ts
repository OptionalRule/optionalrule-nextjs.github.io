import type { BodyCategory, Fact, Moon, PlanetaryDetail, RingSystem } from '../../types'
import type { WorldClassOption } from './domain'
import { bodyInterestPools, type BodyInterestGroup, type BodyInterestPool, type BodyInterestSlot } from './bodyInterestPools'
import { pickOne } from './dice'
import type { SeededRng } from './rng'

function fact<T>(value: T, confidence: Fact<T>['confidence'], source?: string): Fact<T> {
  return { value, confidence, source }
}

function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return count === 1 ? singular : pluralForm
}

function numberWord(count: number): string {
  const words: Record<number, string> = {
    1: 'one',
    2: 'two',
    3: 'three',
    4: 'four',
    5: 'five',
    6: 'six',
    7: 'seven',
    8: 'eight',
    9: 'nine',
    10: 'ten',
  }
  return words[count] ?? String(count)
}

function sentenceCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function ensureSentence(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return trimmed
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`
}

function joinSentences(parts: string[]): string {
  return parts.filter(Boolean).map((part) => ensureSentence(sentenceCase(part))).join(' ')
}

function thermalLocationPhrase(thermalZone: string): string {
  if (thermalZone === 'Furnace') return 'in furnace-close orbit'
  if (thermalZone === 'Inferno') return 'in an inferno inner orbit'
  if (thermalZone === 'Hot') return 'in the hot inner system'
  if (thermalZone === 'Temperate band') return 'in the habitable-zone band'
  if (thermalZone === 'Cold') return 'in cold outer orbits'
  if (thermalZone === 'Cryogenic') return 'in cryogenic outer space'
  if (thermalZone === 'Dark') return 'in the dark outer system'
  return `in the ${thermalZone.toLowerCase()} region`
}

function moonAnchorFragment(count: number): string {
  const moonText = `${numberWord(count)} major ${plural(count, 'moon')}`
  return `${moonText} as travel, mining, and conflict anchors`
}

export function generateGiantEconomy(bodyClass: WorldClassOption, moons: Moon[], rings?: RingSystem): Fact<string> | undefined {
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
      ? ` ${numberWord(moons.length)} major ${plural(moons.length, 'moon')} support a dispersed service economy.`
      : ' The economy is orbital rather than moon-led.'
  const resourceNote = moonResources.length ? ` Main draws: ${moonResources.join('; ')}.` : ''

  return fact(`${traffic}.${moonNote}${resourceNote}${ringNote}`, 'human-layer', 'Generated giant-planet moon economy note')
}

export function generateBodyProfile(bodyClass: WorldClassOption, detail: PlanetaryDetail, moons: Moon[], rings?: RingSystem): Fact<string> | undefined {
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
      bodyClass.className.includes('GU') || bodyClass.className.includes('observerse') || bodyClass.className.includes('bleed')
        ? 'GU-active body where metric behavior matters as much as normal geology.'
        : bodyClass.className.includes('facility') || bodyClass.className.includes('platform')
          ? 'Human-altered facility world where infrastructure is the main point of interest.'
          : 'Anomalous body with unusual survey, hazard, or setting-layer value.'
    return fact(profile, profile.includes('GU') ? 'gu-layer' : 'human-layer', 'MASS-GU anomaly interpretation')
  }

  if (moons.length > 0 || rings) {
    const moonText = moons.length ? ` with ${numberWord(moons.length)} major ${plural(moons.length, 'moon')}` : ''
    return fact(`${bodyClass.className}${moonText}${rings ? ' and notable rings' : ''}.`, 'inferred', 'Generated orbital companion summary')
  }

  return undefined
}

const bodyInterestSlots: BodyInterestSlot[] = [
  'operationalUse',
  'localConflict',
  'visualCue',
  'settlementStrain',
  'surveyQuestion',
  'operationalConstraint',
]

const bodyInterestGroupByCategory: Record<BodyCategory, BodyInterestGroup> = {
  'rocky-planet': 'rocky',
  'super-earth': 'heavySolid',
  'sub-neptune': 'envelope',
  'gas-giant': 'gasGiant',
  'ice-giant': 'iceGiant',
  belt: 'belt',
  'dwarf-body': 'minorFrontier',
  'rogue-captured': 'minorFrontier',
  anomaly: 'anomaly',
}

const bodyInterestModifierPools: Record<string, Partial<BodyInterestPool>> = {
  hydrosphereResource: {
    operationalUse: [
      'volatile handling, refueling, and sample custody',
      'ice-hauling contracts tied to narrow transfer windows',
      'brine and solvent sampling that pulls crews off main routes',
    ],
    surveyQuestion: [
      'whether the volatile budget is stable or being depleted',
      'which reservoirs can support long-term extraction',
      'where hidden ice or brine pockets remain unclaimed',
    ],
    operationalConstraint: [
      'volatile contamination rules slowing every transfer',
      'ice and brine handling requiring narrow thermal windows',
      'refueling traffic competing with survey access',
    ],
  },
  biosphere: {
    localConflict: [
      'quarantine law colliding with extraction permits',
      'biosignature claims threatening established land grants',
      'research preserves limiting where crews can expand',
    ],
    settlementStrain: [
      'clean-room movement rules slowing local work',
      'habitats built around microbial preserve boundaries',
      'medical and survey authorities competing for scarce access',
    ],
    surveyQuestion: [
      'whether the biosignature is native, imported, or engineered',
      'which sites can be sampled without corrupting the record',
      'how far the living chemistry has spread',
    ],
    operationalConstraint: [
      'sterile handling requirements for routine field work',
      'quarantine corridors narrowing crew movement',
      'sample custody rules delaying salvage and extraction',
    ],
  },
  radiation: {
    visualCue: [
      'auroral curtains crawling over shielded work zones',
      'radiation alarms pulsing through every exterior shift',
      'blue-white static crawling across exposed sensors',
    ],
    settlementStrain: [
      'shielded volume setting the real population limit',
      'dose budgets rationing labor rotations',
      'medical capacity lagging behind exposure incidents',
    ],
    operationalConstraint: [
      'strict dose limits near exposed worksites',
      'shadow-cycle scheduling for exterior labor',
      'electronics hardening requirements on even simple trips',
    ],
  },
  gu: {
    localConflict: [
      'GU readings turning routine claims into interdiction cases',
      'survey authorities disputing which measurements are legal evidence',
      'patrols closing access faster than crews can evacuate',
    ],
    visualCue: [
      'metric shimmer bending ordinary range markers',
      'instrument panels reporting impossible mass returns',
      'shadow bands crossing with no visible occluder',
    ],
    surveyQuestion: [
      'why GU instruments disagree with normal gravimetry',
      'which readings are physical and which are planted',
      'whether the anomaly is fading, moving, or being managed',
    ],
    operationalConstraint: [
      'constant recalibration of range and mass readings',
      'route updates expiring before crews can trust them',
      'interdiction challenges triggered by active scans',
    ],
  },
  moons: {
    operationalUse: [
      'major-moon anchor points for travel and conflict',
      'moon transfer routes that concentrate traffic and repairs',
      'satellite depots with cheaper staging than the primary body',
    ],
    localConflict: [
      'moon access rights and transfer fees',
      'rival ports competing for shielded berths',
      'satellite claims outrunning enforceable law',
    ],
  },
  rings: {
    operationalUse: [
      'ring-plane survey and debris-control work',
      'ring-arc sampling tied to navigation safety',
      'shepherd traffic around valuable ring material',
    ],
    visualCue: [
      'ring shadows cutting across work zones',
      'charged dust glittering along the ring plane',
      'thin arcs flashing through station lights',
    ],
    operationalConstraint: [
      'ring-plane debris hazards',
      'strict clearance windows through shepherded arcs',
      'collision-control orders overriding private traffic',
    ],
  },
  rogueCaptured: {
    operationalUse: [
      'deep-cold refuge outside normal traffic models',
      'black-route depots with deniable ownership',
      'survey prizes with unclear origin paths',
    ],
    localConflict: [
      'claimants weaponizing incomplete orbital data',
      'survey houses suppressing trajectory evidence',
      'exiles refusing relocation after discovery',
    ],
    visualCue: [
      'starless ice under worklamp glare',
      'engine heat blooming in absolute dark',
      'radar ghosts from broken capture debris',
    ],
    settlementStrain: [
      'habitats dependent on imported warmth',
      'settlements isolated by unstable transfer windows',
      'claim filings delayed by jurisdiction gaps',
    ],
    surveyQuestion: [
      'where it traveled before capture',
      'what altered its path into the system',
      'how stable the current orbit really is',
    ],
    operationalConstraint: [
      'dangerous transfer timing and high fuel costs',
      'extreme cold without steady solar input',
      'communications delayed by remote orbital geometry',
    ],
  },
}

function candidatePoolFrom(pool: BodyInterestPool): Record<BodyInterestSlot, string[]> {
  return {
    operationalUse: [...pool.operationalUse],
    localConflict: [...pool.localConflict],
    visualCue: [...pool.visualCue],
    settlementStrain: [...pool.settlementStrain],
    surveyQuestion: [...pool.surveyQuestion],
    operationalConstraint: [...pool.operationalConstraint],
  }
}

function addPool(candidates: Record<BodyInterestSlot, string[]>, pool: Partial<BodyInterestPool>): void {
  for (const slot of bodyInterestSlots) {
    const values = pool[slot]
    if (values?.length) candidates[slot].push(...values)
  }
}

function preferPool(candidates: Record<BodyInterestSlot, string[]>, pool: Partial<BodyInterestPool>, preferredSlots: BodyInterestSlot[]): void {
  for (const slot of bodyInterestSlots) {
    const values = pool[slot]
    if (!values?.length) continue
    candidates[slot] = preferredSlots.includes(slot)
      ? [...values, ...candidates[slot]]
      : [...candidates[slot], ...values]
  }
}

function uniquePhrases(values: readonly string[]): string[] {
  const seen = new Set<string>()
  return values.filter((value) => {
    const key = value.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function pickSlot(rng: SeededRng, candidates: Record<BodyInterestSlot, string[]>, slot: BodyInterestSlot): string {
  return pickOne(rng, uniquePhrases(candidates[slot]))
}

function hasHydrosphereResource(detail: PlanetaryDetail): boolean {
  return /ocean|ice|volatile|brine|aquifer|glacier|sea|solvent|recycled/i.test(detail.hydrosphere.value)
}

function hasSevereRadiation(detail: PlanetaryDetail): boolean {
  return /severe|flare-lethal|only deep|electronics-disruptive/i.test(detail.radiation.value)
}

function isGuTouched(bodyClass: WorldClassOption, moons: Moon[], filterNotes: Array<Fact<string>>): boolean {
  const text = [
    bodyClass.className,
    ...(bodyClass.physicalTags ?? []),
    ...moons.map((moon) => `${moon.moonType.value} ${moon.resource.value} ${moon.hazard.value}`),
    ...filterNotes.map((note) => note.value),
  ].join(' ')
  return /GU|chiral|bleed|metric|observerse|dark-sector|programmable/i.test(text)
}

function isHumanAltered(bodyClass: WorldClassOption, bodyProfile?: Fact<string>): boolean {
  const text = [
    bodyClass.className,
    bodyClass.massClass,
    bodyProfile?.value ?? '',
    ...(bodyClass.physicalTags ?? []),
    ...(bodyClass.specialHandling ?? []),
  ].join(' ')
  return /facility|platform|terraform|settlement|habitat|quarantine|shield|engineered|corporate|extraction|transit|docking|black-lab|artificial/i.test(text)
}

function assembleBodyInterestCandidates(
  bodyClass: WorldClassOption,
  detail: PlanetaryDetail,
  moons: Moon[],
  rings: RingSystem | undefined,
  filterNotes: Array<Fact<string>>,
  bodyProfile?: Fact<string>
): Record<BodyInterestSlot, string[]> {
  const group = bodyInterestGroupByCategory[bodyClass.category]
  const candidates = candidatePoolFrom(bodyInterestPools[group])

  if (isHumanAltered(bodyClass, bodyProfile)) {
    preferPool(candidates, bodyInterestPools.humanAltered, ['operationalUse', 'localConflict', 'settlementStrain', 'surveyQuestion'])
  }
  if (hasHydrosphereResource(detail)) addPool(candidates, bodyInterestModifierPools.hydrosphereResource)
  if (detail.biosphere.value !== 'Sterile') addPool(candidates, bodyInterestModifierPools.biosphere)
  if (hasSevereRadiation(detail)) addPool(candidates, bodyInterestModifierPools.radiation)
  if (isGuTouched(bodyClass, moons, filterNotes)) addPool(candidates, bodyInterestModifierPools.gu)
  if (moons.length > 0) {
    addPool(candidates, {
      ...bodyInterestModifierPools.moons,
      operationalUse: [
        moonAnchorFragment(moons.length),
        ...(bodyInterestModifierPools.moons.operationalUse ?? []),
      ],
    })
  }
  if (rings) addPool(candidates, bodyInterestModifierPools.rings)
  if (bodyClass.category === 'rogue-captured') addPool(candidates, bodyInterestModifierPools.rogueCaptured)

  return candidates
}

function bodyInterestConfidence(selected: readonly string[], bodyClass: WorldClassOption): Fact<string>['confidence'] {
  if (bodyClass.category === 'anomaly') return 'gu-layer'
  return selected.some((reason) => /\b(?:GU|chiral|bleed|metric|observerse|dark-sector|programmable)\b/i.test(reason))
    ? 'gu-layer'
    : 'inferred'
}

export function generateBodyInterest(
  rng: SeededRng,
  bodyClass: WorldClassOption,
  thermalZone: string,
  detail: PlanetaryDetail,
  moons: Moon[],
  rings: RingSystem | undefined,
  filterNotes: Array<Fact<string>>,
  bodyProfile?: Fact<string>,
  giantEconomy?: Fact<string>
): Fact<string> {
  const candidates = assembleBodyInterestCandidates(bodyClass, detail, moons, rings, filterNotes, bodyProfile)
  if (giantEconomy && (bodyClass.category === 'gas-giant' || bodyClass.category === 'ice-giant')) {
    candidates.operationalUse.push('moon service routes and shielded depot traffic')
    candidates.localConflict.push('service economies competing over moon-to-moon traffic')
  }
  const operationalUse = pickSlot(rng, candidates, 'operationalUse')
  const localConflict = pickSlot(rng, candidates, 'localConflict')
  const visualCue = pickSlot(rng, candidates, 'visualCue')
  const settlementStrain = pickSlot(rng, candidates, 'settlementStrain')
  const surveyQuestion = pickSlot(rng, candidates, 'surveyQuestion')
  const operationalConstraint = pickSlot(rng, candidates, 'operationalConstraint')
  const categoryFact = `${bodyClass.className} ${thermalLocationPhrase(thermalZone)}`
  const selected = [operationalUse, localConflict, visualCue, settlementStrain, surveyQuestion, operationalConstraint, categoryFact]

  const template = rng.int(1, 12)
  const summary =
    template === 1 ? joinSentences([`operational value centers on ${operationalUse}`, `local tension follows from ${localConflict}`, `surveyors still need to know ${surveyQuestion}`]) :
    template === 2 ? joinSentences([`crews notice ${visualCue}`, `settlements are strained by ${settlementStrain}`, `crews must plan around ${operationalConstraint}`]) :
    template === 3 ? joinSentences([`the site remains useful for ${operationalUse}`, `conflict usually starts with ${localConflict}`, `the unresolved question is ${surveyQuestion}`]) :
    template === 4 ? joinSentences([`first impressions are dominated by ${visualCue}`, `long-term habitation depends on ${settlementStrain}`, `every approach is shaped by ${operationalConstraint}`]) :
    template === 5 ? joinSentences([categoryFact, `maps mark it for ${operationalUse}`, `but local tension follows from ${localConflict}`]) :
    template === 6 ? joinSentences([`local tension follows from ${localConflict}`, `crews notice ${visualCue}`, `crews must plan around ${operationalConstraint}`]) :
    template === 7 ? joinSentences([`operational value centers on ${operationalUse}`, `settlements are strained by ${settlementStrain}`, `the unresolved question is ${surveyQuestion}`]) :
    template === 8 ? joinSentences([`every approach is shaped by ${operationalConstraint}`, `the site remains useful for ${operationalUse}`, `crews notice ${visualCue}`]) :
    template === 9 ? joinSentences([`maps mark it for ${operationalUse}`, `local authorities worry about ${settlementStrain}`, `surveyors still need to know ${surveyQuestion}`]) :
    template === 10 ? joinSentences([`conflict usually starts with ${localConflict}`, `crews notice ${visualCue}`, `operations depend on ${operationalConstraint}`]) :
    template === 11 ? joinSentences([`long-term habitation depends on ${settlementStrain}`, `operational value centers on ${operationalUse}`, `the unresolved question is ${surveyQuestion}`]) :
    joinSentences([`crews must plan around ${operationalConstraint}`, `local tension follows from ${localConflict}`, `the clearest table image is ${visualCue}`])

  return fact(summary, bodyInterestConfidence(selected, bodyClass), 'Generated body interest summary')
}
