import type { SeededRng } from '../rng'
import type { EdgeType } from '../graph/types'
import type { ConflictTemperature } from './types'

export const DEFAULT_SIGNS: Record<ConflictTemperature, readonly string[]> = {
  simmering: [
    'Cargo manifests between the two camps now travel with notarized seals nobody used to bother with.',
    'The joint maintenance schedule still runs, but each side sends its own inspector to watch the other\'s.',
    'Prices quoted to {aggressor} and {defender} differ by a margin every vendor denies.',
    'Meeting rooms get booked for "routine coordination" that ends earlier every week.',
    'Somebody keeps updating the evacuation postings, and somebody keeps taking them down.',
  ],
  open: [
    'Dock crews from {aggressor} and {defender} unload under separate armed escorts that pretend not to watch each other.',
    'Every shift change, someone repaints the boundary line around {stake} a hand-width farther out.',
    'The public channel carries two incompatible traffic advisories for the same lane.',
    'Freight insurance for the contested run now costs more than the freight.',
    'Recruiters from both sides work the same ration queue, one table apart.',
  ],
  aftermath: [
    'The memorial wall lists the dead by name; the plaque naming a cause has been replaced twice.',
    'Salvage from the worst of it is still being sold with the serial numbers filed off.',
    'Both sides run ferries past the wreck site, and both slow down without announcing why.',
    'The reconstruction levy is itemized on every invoice, and nobody asks what it rebuilt.',
    'Children play a game with the old checkpoint hand-signals; their parents make them stop.',
  ],
  frozen: [
    'Weapons lockers on both sides are inventoried weekly, publicly, and pointedly.',
    'The two fleets keep station close enough to read each other\'s hull patches, and have for years.',
    'Every negotiation ends with the same joint statement, dusted off and re-dated.',
    'Cold-war courtesy holds: each side reports the other\'s distress beacons, promptly and without comment.',
    'The contingency plans are open secrets, printed and yellowing on both command decks.',
  ],
}

export const SIGNS: Partial<Record<EdgeType, Partial<Record<ConflictTemperature, readonly string[]>>>> = {
  CONTESTS: {
    simmering: [
      'Legal filings over {stake} arrive faster than the courts can docket them.',
      '{aggressor} audits every ledger {defender} publishes, and publishes the audits.',
      'Both camps bid on the same salvage lots just to keep them from each other.',
    ],
    open: [
      'Tug crews working {stake} fly transponders from whichever side paid most recently.',
      'The arbitration hall stands empty; its clerks now work security rotations.',
      '{defender} moved its families off-station last month and denies it moved anything.',
    ],
    aftermath: [
      'The settlement terms are posted at every airlock, annotated in two hands.',
      'What remains of {stake} is administered by a trustee neither side will name in public.',
      'Veterans of the dispute drink in the same hall, at tables an aisle apart.',
    ],
    frozen: [
      'Claims on {stake} are renewed annually, ceremonially, and never enforced.',
      'The boundary buoys are repainted by joint crews who do not speak.',
      'Both sides fund the lighthouse neither will let the other operate.',
    ],
  },
  DESTABILIZES: {
    simmering: [
      'Structural survey drones sweep {defender} twice a day now instead of twice a season.',
      'The hazard bulletin has used the phrase "within tolerances" for six straight cycles.',
      'Longshore crews demand danger pay in scrip that clears the same day.',
    ],
    open: [
      'Evacuation lighters hold at ready-station through every work shift.',
      'The last cargo run out of {defender} carried archives instead of ore.',
      'Alarm drills stopped being announced; nobody needed the announcements.',
    ],
    aftermath: [
      'Rebuild crews work the damaged ring under floodlights, around the clock, without press.',
      'Hull plates recovered from the event sell as talismans in the port market.',
      'The survivors\' registry is still pinned to the exchange board, edges soft with handling.',
    ],
    frozen: [
      'Monitoring stations ring the threat like a shrine nobody prays at anymore.',
      'The exclusion perimeter is walked, logged, and never mentioned in the port guide.',
      'Insurance renewals price the danger as permanent, and everyone pays.',
    ],
  },
  DEPENDS_ON: {
    simmering: [
      'Requisition forms for {stake} now require a counter-signature from off-station.',
      'The reserve tanks get gauged at shift start, and the numbers travel by hand.',
      'Substitute suppliers keep visiting; their samples keep failing certification.',
    ],
    open: [
      'Rationing began with a memo that never used the word.',
      'Armed escorts ride the supply run for {stake} both directions now.',
      'The dependency ledger leaked, and everyone finally saw the multiplier.',
    ],
    aftermath: [
      'The shortage memorial is a single empty tank, left ungauged on purpose.',
      'New storage capacity gets built at triple redundancy and nobody calls it overreaction.',
      'Contracts for {stake} run decade-length now; trust runs shorter.',
    ],
    frozen: [
      'The supply schedule for {stake} is the one document both sides keep sacrosanct.',
      'Neither party inspects the pipeline; both watch the flow meters instead.',
      'The renewal clause rolls over annually in a meeting that lasts four minutes.',
    ],
  },
  CONTROLS: {
    simmering: [
      'Access badges for {stake} were reissued in new colors, and the old ones quietly stopped working.',
      'Petition queues outside the administrator\'s office start forming before first shift.',
      'The fee schedule is posted in a font smaller than the appeals process deserves.',
    ],
    open: [
      'Checkpoint crews at {stake} doubled overnight and dress for trouble.',
      'A rival schedule circulates hand-to-hand, priced in favors.',
      'Cargo that skips inspection moves at night, along routes everyone can name.',
    ],
    aftermath: [
      'The old checkpoint booth stands unmanned; people still slow down passing it.',
      'The transfer-of-authority notice hangs behind glass, corners curling.',
      'Fee refunds from the settlement arrive in envelopes nobody expected to see.',
    ],
    frozen: [
      'Control of {stake} rotates on paper every year and in practice never has.',
      'The oversight committee meets quarterly to table the same motion.',
      'Two sets of keys exist; one set has never been used.',
    ],
  },
}

export function composeVisibleSign(
  edgeType: EdgeType,
  temperature: ConflictTemperature,
  rng: SeededRng,
): string {
  const typed = SIGNS[edgeType]?.[temperature]
  const pool = typed && typed.length > 0 ? [...typed, ...DEFAULT_SIGNS[temperature]] : DEFAULT_SIGNS[temperature]
  return pool[rng.int(0, pool.length - 1)]
}
