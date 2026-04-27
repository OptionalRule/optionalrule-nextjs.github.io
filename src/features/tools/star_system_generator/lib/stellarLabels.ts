const labels: Record<string, string> = {
  'M dwarf': 'M-type main-sequence star',
  'K dwarf': 'K-type main-sequence star',
  'G dwarf': 'G-type main-sequence star',
  'F dwarf': 'F-type main-sequence star',
  'A/B bright star': 'A/B bright star',
  'White dwarf': 'White dwarf remnant',
  'Brown dwarf': 'Brown dwarf / substellar primary',
  'Gate-selected anomaly': 'Gate-selected stellar anomaly',
}

const notes: Record<string, string> = {
  'M dwarf': 'Red dwarf; common, long-lived, and often flare-relevant.',
  'K dwarf': 'Orange main-sequence star; stable and valuable for colony systems.',
  'G dwarf': 'Sun-like main-sequence star; "dwarf" is the normal luminosity class.',
  'F dwarf': 'Bright main-sequence star; hotter and shorter-lived than the Sun.',
  'A/B bright star': 'Massive bright primary; rare in reachable frontier samples.',
  'White dwarf': 'Stellar remnant; useful for relic systems and debris salvage.',
  'Brown dwarf': 'Substellar primary; dark, cold, and useful for hidden systems.',
  'Gate-selected anomaly': 'Reachability or GU geometry matters more than normal census weighting.',
}

export function formatStellarClass(spectralType: string): string {
  return labels[spectralType] ?? spectralType
}

export function stellarClassNote(spectralType: string): string {
  return notes[spectralType] ?? 'Generated stellar class from the MASS-GU distribution.'
}
