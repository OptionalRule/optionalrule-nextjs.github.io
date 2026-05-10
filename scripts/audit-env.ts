import { generateSystem } from '../src/features/tools/star_system_generator/lib/generator/index'

interface Body {
  zone: string
  cls: string
  cat: string
  hydro: string
  atm: string
  geo: string
  climates: string[]
  bio: string
  rad: string
}

const bodies: Body[] = []
const N = 600
for (let i = 0; i < N; i++) {
  const sys = generateSystem({
    seed: `audit-${i.toString(16).padStart(4, '0')}`,
    distribution: i % 2 === 0 ? 'frontier' : 'realistic',
    tone: 'balanced',
    gu: 'normal',
    settlements: 'normal',
  })
  for (const b of sys.bodies) {
    bodies.push({
      zone: b.thermalZone.value,
      cls: b.bodyClass.value,
      cat: b.category.value,
      hydro: b.detail.hydrosphere.value,
      atm: b.detail.atmosphere.value,
      geo: b.detail.geology.value,
      climates: b.detail.climate.map((c) => c.value),
      bio: b.detail.biosphere.value,
      rad: b.detail.radiation.value,
    })
  }
}
console.log(`sampled bodies: ${bodies.length}`)

// =========================================================
// 1) ATMOSPHERE × THERMAL ZONE holes
// =========================================================
const heatRequired = new Set(['Steam atmosphere', 'Sulfur/chlorine/ammonia haze', 'Dense greenhouse'])
const coldAtmHits = bodies.filter((b) => (b.zone === 'Cold' || b.zone === 'Cryogenic' || b.zone === 'Dark') && heatRequired.has(b.atm))
console.log(`\n[ATM-1] heat-requiring atmospheres in Cold/Cryogenic/Dark zones: ${coldAtmHits.length}`)
const coldAtmGroups = new Map<string, number>()
for (const h of coldAtmHits) {
  const k = `${h.zone} | ${h.cls} → atm=${h.atm}`
  coldAtmGroups.set(k, (coldAtmGroups.get(k) ?? 0) + 1)
}
;[...coldAtmGroups.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).forEach(([k, n]) => console.log(`  ${String(n).padStart(3)}  ${k}`))

const rockVapor = new Set(['Rock-vapor atmosphere', 'Metal vapor atmosphere'])
const rockVaporCold = bodies.filter((b) => (b.zone === 'Cold' || b.zone === 'Cryogenic' || b.zone === 'Dark') && rockVapor.has(b.atm))
console.log(`\n[ATM-2] rock-vapor atmosphere in Cold/Cryogenic/Dark zones: ${rockVaporCold.length}`)
rockVaporCold.slice(0, 10).forEach((h) => console.log(`  ${h.zone} | ${h.cls} → atm=${h.atm}`))

// Hydrogen envelope on solid body (already gated, but let's verify)
const hydEnv = bodies.filter((b) => b.atm === 'Hydrogen/helium envelope' && !['sub-neptune', 'gas-giant', 'ice-giant'].includes(b.cat))
console.log(`\n[ATM-3] Hydrogen/helium envelope on non-envelope body: ${hydEnv.length}`)
hydEnv.slice(0, 5).forEach((h) => console.log(`  ${h.zone} | ${h.cat} ${h.cls} → atm=${h.atm}`))

// Vacuum-equivalent atmospheres on classes that should have something
const vacuumLike = new Set(['None / hard vacuum', 'Trace exosphere'])
const denseClasses = bodies.filter((b) => /dense|greenhouse|hub|hycean|sub-neptune|gas giant|ice giant/i.test(b.cls) && vacuumLike.has(b.atm) && !/airless|stripped|remnant/i.test(b.cls))
console.log(`\n[ATM-4] Vacuum-like atmosphere on a dense/greenhouse/giant-named class: ${denseClasses.length}`)
denseClasses.slice(0, 8).forEach((h) => console.log(`  ${h.zone} | ${h.cls} → atm=${h.atm}`))

// =========================================================
// 2) ATM × HYDRO coherency
// =========================================================
// Steam atmosphere needs a water source. Vaporized volatile traces COUNTS as water (it's the vapor).
const steamNoWater = bodies.filter((b) => b.atm === 'Steam atmosphere' && (b.hydro === 'Bone dry' || b.hydro === 'Hydrated minerals only' || b.hydro === 'Magma seas / lava lakes' || b.hydro === 'Salt / perchlorate flats' || b.hydro === 'No accessible surface volatiles'))
console.log(`\n[ATMHYD-1] Steam atmosphere on a body without surface water: ${steamNoWater.length}`)
steamNoWater.slice(0, 8).forEach((h) => console.log(`  ${h.zone} | ${h.cls} | atm=${h.atm} | hydro=${h.hydro}`))

// Open ocean hydrosphere with vacuum atmosphere (water boils away)
const oceanVacuum = bodies.filter((b) => ['Global ocean', 'Ocean-continent balance', 'Local seas', 'Hydrocarbon lakes/seas'].includes(b.hydro) && vacuumLike.has(b.atm))
console.log(`\n[ATMHYD-2] Open ocean / lakes with vacuum atmosphere: ${oceanVacuum.length}`)
oceanVacuum.slice(0, 8).forEach((h) => console.log(`  ${h.zone} | ${h.cls} | atm=${h.atm} | hydro=${h.hydro}`))

// =========================================================
// 3) HYDRO × THERMAL ZONE residual holes (sanity recheck)
// =========================================================
const hotForbidden = new Set(['Ocean-continent balance', 'Global ocean', 'High-pressure deep ocean', 'Ice-shell subsurface ocean', 'Hydrocarbon lakes/seas'])
const hotHydroHits = bodies.filter((b) => b.zone === 'Hot' && b.cat !== 'belt' && !['sub-neptune', 'gas-giant', 'ice-giant'].includes(b.cat) && hotForbidden.has(b.hydro))
console.log(`\n[HYD-1] Hot zone with forbidden ocean/hydrocarbon hydrosphere (should be 0 after recent fix unless ocean-class): ${hotHydroHits.length}`)
const hotHydroBreakdown = new Map<string, number>()
for (const h of hotHydroHits) {
  const k = `${h.cls} → hydro=${h.hydro}`
  hotHydroBreakdown.set(k, (hotHydroBreakdown.get(k) ?? 0) + 1)
}
;[...hotHydroBreakdown.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([k, n]) => console.log(`  ${String(n).padStart(3)}  ${k}`))

// Cold hot-only hydrospheres
const coldForbidden = new Set(['Vaporized volatile traces', 'Nightside mineral frost', 'Magma seas / lava lakes', 'Salt / perchlorate flats'])
const coldHydroHits = bodies.filter((b) => (b.zone === 'Cold' || b.zone === 'Cryogenic' || b.zone === 'Dark') && coldForbidden.has(b.hydro))
console.log(`\n[HYD-2] Cold/Cryo/Dark with hot-only hydrosphere: ${coldHydroHits.length}`)
coldHydroHits.slice(0, 5).forEach((h) => console.log(`  ${h.zone} | ${h.cls} → hydro=${h.hydro}`))

// =========================================================
// 4) GEOLOGY × CATEGORY
// =========================================================
// Active volcanism on dead/airless tiny bodies
const deadBig = bodies.filter((b) => ['Dead interior', 'Ancient cratered crust'].includes(b.geo) && /super-earth|dense super-earth|high-gravity/i.test(b.cls) && b.zone === 'Hot')
console.log(`\n[GEO-1] Dead interior on Hot super-Earth-class: ${deadBig.length}`)
deadBig.slice(0, 5).forEach((h) => console.log(`  ${h.zone} | ${h.cls} → geo=${h.geo}`))

// Cryovolcanism on Hot
const cryoHot = bodies.filter((b) => b.geo === 'Cryovolcanism' && (b.zone === 'Hot' || b.zone === 'Furnace' || b.zone === 'Inferno'))
console.log(`\n[GEO-2] Cryovolcanism in Hot/Furnace/Inferno: ${cryoHot.length}`)
cryoHot.slice(0, 5).forEach((h) => console.log(`  ${h.zone} | ${h.cls} → geo=${h.geo}`))

// Active volcanism on extremely cold airless
const volcanismDark = bodies.filter((b) => ['Active volcanism', 'Extreme plume provinces', 'Global resurfacing'].includes(b.geo) && b.zone === 'Dark')
console.log(`\n[GEO-3] Hot-style volcanism in Dark zone: ${volcanismDark.length}`)
volcanismDark.slice(0, 5).forEach((h) => console.log(`  ${h.zone} | ${h.cls} → geo=${h.geo}`))

// =========================================================
// 5) CLIMATE × THERMAL ZONE
// =========================================================
const hotOnlyClimates = new Set(['Runaway greenhouse', 'Moist greenhouse edge', 'Hot desert', 'Dayside glass fields', 'Hypercanes', 'Steam atmosphere'])
const coldClimateMis = bodies.filter((b) => (b.zone === 'Cold' || b.zone === 'Cryogenic' || b.zone === 'Dark') && b.climates.some((c) => hotOnlyClimates.has(c)))
console.log(`\n[CLI-1] Cold/Cryo/Dark with hot-only climate tag: ${coldClimateMis.length}`)
coldClimateMis.slice(0, 8).forEach((h) => console.log(`  ${h.zone} | ${h.cls} → climates=${h.climates.join(', ')}`))

const coldOnlyClimates = new Set(['Snowball', 'Methane cycle', 'CO2 glacier cycle'])
const hotClimateMis = bodies.filter((b) => (b.zone === 'Hot' || b.zone === 'Furnace' || b.zone === 'Inferno') && b.climates.some((c) => coldOnlyClimates.has(c)))
console.log(`\n[CLI-2] Hot/Furnace/Inferno with cold-only climate tag: ${hotClimateMis.length}`)
hotClimateMis.slice(0, 5).forEach((h) => console.log(`  ${h.zone} | ${h.cls} → climates=${h.climates.join(', ')}`))

// =========================================================
// 6) BIOSPHERE × ENVIRONMENT
// =========================================================
const lifeOnVacuum = bodies.filter((b) => ['Microbial life', 'Extremophile microbial ecology', 'Simple macroscopic non-sapient life'].includes(b.bio) && b.atm === 'None / hard vacuum')
console.log(`\n[BIO-1] Life on hard-vacuum body: ${lifeOnVacuum.length}`)
lifeOnVacuum.slice(0, 5).forEach((h) => console.log(`  ${h.zone} | ${h.cls} | atm=${h.atm} → bio=${h.bio}`))

const lifeOnMagma = bodies.filter((b) => ['Microbial life', 'Extremophile microbial ecology', 'Simple macroscopic non-sapient life'].includes(b.bio) && (b.hydro === 'Magma seas / lava lakes' || b.atm === 'Rock-vapor atmosphere' || b.atm === 'Metal vapor atmosphere'))
console.log(`\n[BIO-2] Life on magma/vaporized-rock body: ${lifeOnMagma.length}`)
lifeOnMagma.slice(0, 5).forEach((h) => console.log(`  ${h.zone} | ${h.cls} | atm=${h.atm} | hydro=${h.hydro} → bio=${h.bio}`))

const lifeOnDry = bodies.filter((b) => ['Microbial life', 'Extremophile microbial ecology', 'Simple macroscopic non-sapient life'].includes(b.bio) && b.hydro === 'Bone dry')
console.log(`\n[BIO-3] Life on Bone dry world: ${lifeOnDry.length}`)
lifeOnDry.slice(0, 5).forEach((h) => console.log(`  ${h.zone} | ${h.cls} | hydro=${h.hydro} → bio=${h.bio}`))

// =========================================================
// 7) STRIPPED CORE / unusual rolls
// =========================================================
const strippedExotic = bodies.filter((b) => /stripped/i.test(b.cls) && b.hydro === 'Exotic solvent or GU-stabilized fluid chemistry')
console.log(`\n[CLS-1] Stripped-core class with Exotic solvent hydrosphere: ${strippedExotic.length}`)
strippedExotic.slice(0, 5).forEach((h) => console.log(`  ${h.zone} | ${h.cls} | hydro=${h.hydro}`))

// =========================================================
// 8) FREQUENCY DISTRIBUTIONS (sanity)
// =========================================================
const allHydros = new Map<string, number>()
for (const b of bodies) allHydros.set(b.hydro, (allHydros.get(b.hydro) ?? 0) + 1)
console.log('\n[FREQ] hydrosphere frequencies (top 25):')
;[...allHydros.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).forEach(([v, n]) => console.log(`  ${String(n).padStart(4)}  ${v}`))

const allAtms = new Map<string, number>()
for (const b of bodies) allAtms.set(b.atm, (allAtms.get(b.atm) ?? 0) + 1)
console.log('\n[FREQ] atmosphere frequencies:')
;[...allAtms.entries()].sort((a, b) => b[1] - a[1]).forEach(([v, n]) => console.log(`  ${String(n).padStart(4)}  ${v}`))
