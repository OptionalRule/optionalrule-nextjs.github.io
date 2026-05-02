import { sentenceFragment, smoothTechnicalPhrase } from './helpers'

export function conditionAsPressure(value: string, place: string): string {
  const condition = sentenceFragment(value)
  if (/recently evacuated/i.test(value)) return `the recent evacuation of ${place}`
  if (/under quarantine/i.test(value)) return `the quarantine at ${place}`
  if (/divided by class zones/i.test(value)) return `class-zone divisions at ${place}`
  if (/pristine and overfunded/i.test(value)) return `the overfunded order at ${place}`
  if (/efficient but joyless/i.test(value)) return `joyless efficiency at ${place}`
  if (/population unknown|falsified/i.test(value)) return `falsified population records at ${place}`
  return `${condition} conditions at ${place}`
}

export function crisisAsPressure(value: string): string {
  const crisis = smoothTechnicalPhrase(sentenceFragment(value))
  if (/the base broadcasts two contradictory distress calls/i.test(value)) return 'contradictory distress calls from the base'
  if (/a whole district goes silent/i.test(value)) return 'a silent district'
  if (/ship full of dead arrives/i.test(value)) return 'the arrival of a ship full of dead'
  if (/everyone is lying about casualty numbers/i.test(value)) return 'lies about casualty numbers'
  if (/crisis is staged to hide something worse/i.test(value)) return 'a staged crisis'
  if (/children or civilians trapped/i.test(value)) return 'trapped civilians'
  if (/essential expert missing/i.test(value)) return 'a missing essential expert'
  if (/old first-wave map found/i.test(value)) return 'a newly found first-wave map'
  if (/Sol\/Gardener warning sign detected/i.test(value)) return 'a detected Sol or Gardener warning sign'
  if (/AI refuses unsafe operation/i.test(value)) return 'AI refusal to operate unsafely'
  if (/illegal AI expansion discovered/i.test(value)) return 'a discovered illegal AI expansion'
  if (/medical supplies stolen/i.test(value)) return 'stolen medical supplies'
  if (/hull breach hidden from public/i.test(value)) return 'a hidden hull breach'
  if (/bleed node changed course/i.test(value)) return 'a drifting bleed node'
  if (/flare season arrived early/i.test(value)) return 'an early flare season'
  if (/chiral harvest turned toxic/i.test(value)) return 'a toxic chiral harvest'
  if (/radiation storm incoming/i.test(value)) return 'an incoming radiation storm'
  if (/metric storm trapped ships/i.test(value)) return 'ships trapped by a metric storm'
  if (/election or succession crisis/i.test(value)) return 'an election or succession crisis'
  if (/^sabotage of (.+)$/i.test(value)) return crisis.replace(/^sabotage of /i, 'sabotage against ')
  if (/^(labor strike|debt revolt|corporate security crackdown|pirate protection demand|smuggler war|refugee surge|quarantine violation|unknown native microbial hazard|failed terraforming release|medical supplies stolen|military coup|salvage claim dispute|life-support cascade|radiation storm incoming|flare season arrived early|hull breach hidden from public|bleed node changed course|chiral harvest turned toxic|Iggygate schedule failure|pinchdrive calibration accident)$/i.test(crisis)) {
    const article = /^[aeiou]/i.test(crisis) ? 'an' : 'a'
    return `${article} ${crisis}`
  }
  return crisis
}
