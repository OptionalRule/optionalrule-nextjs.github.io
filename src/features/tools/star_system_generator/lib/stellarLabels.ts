const labels: Record<string, string> = {
  'M dwarf': 'M-type star',
  'K star': 'K-type star',
  'G star': 'G-type star',
  'F star': 'F-type star',
  'O/B/A bright star': 'O/B/A bright star',
  'White dwarf/remnant': 'White dwarf/remnant',
  'Brown dwarf/substellar primary': 'Brown dwarf/substellar primary',
  'Gate-selected anomaly': 'Gate-selected stellar anomaly',
}

const notes: Record<string, string> = {
  'M dwarf': 'Red dwarf; common, long-lived, and often flare-relevant.',
  'K star': 'Excellent long-term colony candidate: stable, long-lived, and less flare-prone than many M dwarfs.',
  'G star': 'Solar-like, familiar, valuable, and politically contested.',
  'F star': 'Bright star with a wider habitable zone, shorter stable era, and more radiation stress.',
  'O/B/A bright star': 'Rare, luminous, young, dangerous, and visible across long distances.',
  'White dwarf/remnant': 'Ancient remnant system with stripped worlds, relic stations, and exotic hazards.',
  'Brown dwarf/substellar primary': 'Dark system suited to rogue refuel sites, ice moons, and hidden bases.',
  'Gate-selected anomaly': 'Reachability or GU geometry matters more than normal census weighting.',
}

export function formatStellarClass(spectralType: string): string {
  return labels[spectralType] ?? spectralType
}

export function stellarClassNote(spectralType: string): string {
  return notes[spectralType] ?? 'Generated stellar class from the MASS-GU distribution.'
}
