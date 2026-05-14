import type { OrbitingBody, SystemPhenomenon, BodyPhysicalHints, PlanetaryDetail } from '../../types'
import { fact } from './index'

function emptyPhysical(): BodyPhysicalHints {
  return {
    radiusEarth: fact(0, 'derived', 'Belt has no aggregate radius'),
    massEarth: fact(null, 'derived', 'Belt has no aggregate mass'),
    surfaceGravityG: fact(null, 'derived', 'Belt has no surface'),
    gravityLabel: fact('No surface', 'inferred', 'Belt'),
    periodDays: fact(365, 'derived', 'Approximate inner belt period'),
    closeIn: fact(true, 'derived', 'Belt sits just outside the binary contact zone'),
    volatileEnvelope: fact(false, 'derived', 'Belt'),
  }
}

function emptyDetail(): PlanetaryDetail {
  const blank = (label: string) => fact(label, 'inferred', 'Binary contact belt — no surface detail')
  return {
    atmosphere: blank('No atmosphere'),
    hydrosphere: blank('None'),
    geology: blank('Debris fragments, post-contact ejecta'),
    climate: [blank('None — vacuum')],
    radiation: blank('Severe — overlapping stellar fields'),
    biosphere: blank('Sterile'),
    mineralComposition: blank('Heavy-element-rich post-contact ejecta'),
    magneticField: blank('Chaotic, sourced from both stars'),
    atmosphericTraces: blank('None'),
    hydrology: blank('None'),
    topography: blank('Dispersed debris'),
    rotationProfile: blank('Tumbling fragments'),
    seismicActivity: blank('Continuous fragmentation'),
    surfaceHazards: blank('Hypervelocity debris, paired stellar flares, GU bleed'),
    dayLength: blank('Not applicable'),
    surfaceLight: blank('Twin-star glare from all directions'),
    axialTilt: blank('Not applicable'),
    skyPhenomena: blank('Stars appear to touch from anywhere in the belt'),
    atmosphericPressure: blank('Vacuum'),
    windRegime: blank('Not applicable'),
    tidalRegime: blank('Extreme — chaotic, time-varying'),
    acousticEnvironment: blank('Silent vacuum'),
    resourceAccess: blank('Hazardous; high-yield post-stellar elements at lethal risk'),
    biosphereDistribution: blank('None'),
  }
}

export function buildVolatileHazardBelt(systemName: string): OrbitingBody {
  return {
    id: 'volatile-contact-belt',
    orbitAu: fact(0.6, 'inferred', 'Just outside binary contact zone'),
    name: fact(`${systemName} Contact Belt`, 'human-layer', 'Binary contact debris belt'),
    category: fact('belt', 'inferred', 'Binary contact ejecta'),
    massClass: fact('Asteroid belt', 'inferred', 'Belt'),
    bodyClass: fact('Hazardous binary contact belt', 'inferred', 'Volatile companion mode'),
    whyInteresting: fact('Post-contact stellar ejecta produces unstable, mineral-rich, lethally hazardous debris.', 'human-layer', 'Volatile mode flavor'),
    thermalZone: fact('Furnace', 'inferred', 'Inner binary zone'),
    physical: emptyPhysical(),
    detail: emptyDetail(),
    moons: [],
    filterNotes: [fact('Volatile binary: ordinary planets cannot form here.', 'inferred', 'Volatile companion mode')],
    traits: [
      fact('Hypervelocity debris', 'inferred', 'Volatile mode hazard'),
      fact('Overlapping stellar flares', 'inferred', 'Volatile mode hazard'),
    ],
    sites: [],
  }
}

export function buildBinaryContactPhenomenon(): SystemPhenomenon {
  return {
    id: 'phenomenon-binary-contact',
    phenomenon: fact('Binary contact zone', 'inferred', 'Volatile companion mode'),
    note: fact('Two stars in physical contact or near-contact; their atmospheres mix and their gravity wells overlap.', 'inferred', 'Volatile mode'),
    travelEffect: fact('Approach corridors are constantly redrawn; lanes inside 1 AU lose viability hour-to-hour.', 'inferred', 'Volatile mode'),
    surveyQuestion: fact('Where is the next stable debris stream, and how long before paired flares close it?', 'inferred', 'Volatile mode'),
    conflictHook: fact('Salvage operators race paired flare cycles to extract rare post-stellar elements.', 'inferred', 'Volatile mode'),
    sceneAnchor: fact('A skiff threading between two suns whose coronas are visibly touching.', 'inferred', 'Volatile mode'),
  }
}
