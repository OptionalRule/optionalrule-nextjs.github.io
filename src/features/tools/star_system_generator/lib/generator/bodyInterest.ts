import type { BodyCategory, Fact, Moon, PlanetaryDetail, RingSystem } from '../../types'
import type { WorldClassOption } from './domain'
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

function lowerFirst(value: string): string {
  return value.charAt(0).toLowerCase() + value.slice(1)
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

function moonAnchorClause(count: number): string {
  const moonText = `${numberWord(count)} major ${plural(count, 'moon')}`
  return `${moonText} ${count === 1 ? 'provides' : 'provide'} anchor points for travel, mining, or conflict`
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
      bodyClass.className.includes('GU') || bodyClass.className.includes('observiverse') || bodyClass.className.includes('bleed')
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

export function generateBodyInterest(
  rng: SeededRng,
  bodyClass: WorldClassOption,
  thermalZone: string,
  detail: PlanetaryDetail,
  moons: Moon[],
  filterNotes: Array<Fact<string>>,
  bodyProfile?: Fact<string>,
  giantEconomy?: Fact<string>
): Fact<string> {
  const astronomyFacts: string[] = [
    `${bodyClass.className} ${thermalLocationPhrase(thermalZone)}`,
  ]
  const pressurePoints: string[] = []
  const playUses: string[] = []

  if (bodyProfile) astronomyFacts.push(bodyProfile.value)
  if (giantEconomy) playUses.push(giantEconomy.value)
  if (detail.biosphere.value !== 'Sterile') pressurePoints.push(`${detail.biosphere.value} creates science, quarantine, or settlement pressure`)
  if (detail.hydrosphere.value.includes('ocean') || detail.hydrosphere.value.includes('ice') || detail.hydrosphere.value.includes('volatiles')) {
    playUses.push(`${detail.hydrosphere.value} makes local volatiles important`)
  }
  if (detail.radiation.value.includes('Severe') || detail.radiation.value.includes('Flare-lethal') || detail.radiation.value.includes('Only deep')) {
    pressurePoints.push(`${detail.radiation.value} makes operations dangerous`)
  }
  if (filterNotes.some((note) => note.value.includes('Hot Neptune desert') || note.value.includes('Radius valley') || note.value.includes('M-dwarf'))) {
    astronomyFacts.push('modern exoplanet filters make this a notable survey target')
  }
  if (moons.some((moon) => moon.resource.confidence === 'gu-layer') || bodyClass.className.includes('GU') || bodyClass.className.includes('Chiral') || bodyClass.className.includes('bleed')) {
    pressurePoints.push('GU value may attract research, extraction, or interdiction')
  }
  if (thermalZone === 'Temperate band' && (bodyClass.category === 'rocky-planet' || bodyClass.category === 'super-earth')) {
    astronomyFacts.push('its habitable-zone position gives it political and survey value even if conditions are harsh')
  }
  if (moons.length > 0 && !bodyProfile?.value.includes('major moon')) playUses.push(moonAnchorClause(moons.length))

  const selected = [
    pickOne(rng, astronomyFacts),
    pickOne(rng, pressurePoints.length ? pressurePoints : [`${detail.radiation.value.toLowerCase()} is the main operating constraint`]),
    pickOne(rng, playUses.length ? playUses : [`${bodyClass.className} is mainly useful as orbital context and navigation terrain`]),
  ]

  const subject = pickOne(rng, bodyInterestSubjects[bodyClass.category])
  const template = rng.int(1, 8)
  const [astronomy, pressure, utility] = selected
  const summary =
    template === 1 ? joinSentences([astronomy, pressure, utility]) :
    template === 2 ? joinSentences([`${subject} care because ${lowerFirst(astronomy)}`, pressure, utility]) :
    template === 3 ? joinSentences([`Survey crews flag ${bodyClass.className.toLowerCase()} because ${lowerFirst(astronomy)}`, pressure, utility]) :
    template === 4 ? joinSentences([`The playable tension is ${lowerFirst(pressure)}`, utility, astronomy]) :
    template === 5 ? joinSentences([`${subject} care because ${lowerFirst(pressure)}`, utility, astronomy]) :
    template === 6 ? joinSentences([`Local politics turn on ${lowerFirst(pressure)}`, utility, astronomy]) :
    template === 7 ? joinSentences([`Local maps mark it as useful because ${lowerFirst(utility)}`, pressure, astronomy]) :
    joinSentences([`Traffic concentrates where ${lowerFirst(utility)}`, pressure, astronomy])

  return fact(summary, selected.some((reason) => reason.includes('GU')) ? 'gu-layer' : 'inferred', 'Generated body interest summary')
}

const bodyInterestSubjects: Record<BodyCategory, readonly string[]> = {
  'rocky-planet': ['Colony planners', 'Prospectors', 'Surface crews', 'Survey offices'],
  'super-earth': ['Heavy-world crews', 'Habitat planners', 'Gravity-adapted teams', 'Survey offices'],
  'sub-neptune': ['Envelope miners', 'Atmospheric researchers', 'Transit crews', 'Survey offices'],
  'gas-giant': ['Orbital crews', 'Moon brokers', 'Fuel consortia', 'Magnetosphere researchers'],
  'ice-giant': ['Volatile miners', 'Outer-system crews', 'Fuel consortia', 'Magnetosphere researchers'],
  belt: ['Belt crews', 'Claim auditors', 'Navigation offices', 'Prospector combines'],
  'dwarf-body': ['Frontier crews', 'Ice miners', 'Hidden-harbor pilots', 'Survey offices'],
  'rogue-captured': ['Deep-range crews', 'Interdiction patrols', 'Refuel brokers', 'Survey offices'],
  anomaly: ['Research teams', 'Interdiction patrols', 'GU auditors', 'Survey offices'],
}
