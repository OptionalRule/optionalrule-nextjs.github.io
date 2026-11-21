import type {
  GuOverlay,
  HumanRemnant,
  Reachability,
  Settlement,
  SystemArchitecture,
  SystemPhenomenon,
} from '../../../types'
import type { HookTerm } from '../data/hooks'

export interface HookTermContext {
  guOverlay: GuOverlay
  settlements: readonly Settlement[]
  ruins: readonly HumanRemnant[]
  phenomena: readonly SystemPhenomenon[]
  architecture: SystemArchitecture
  reachability: Reachability
}

type DetectableTerm = Exclude<HookTerm, 'GU'>

const TERM_PATTERNS: Readonly<Record<DetectableTerm, readonly RegExp[]>> = {
  Bleed: [/\bbleed\b/i, /bleed-/i, /\bbloom\b/i, /\briver\b/i, /\bnode\b/i, /\bscar\b/i, /\bseep\b/i],
  Chirality: [/\bchiral/i, /handedness/i, /wrong-handed/i, /right-handed/i, /left-handed/i],
  Shiab: [/\bshiab/i, /\bblade\b/i],
  'Dark sector': [/dark[- ]sector/i, /anchor[- ]mass/i, /shadow[- ]lance/i, /gravity[- ]tide/i, /doped[- ]ore/i],
  'Programmable matter': [/programmable/i, /microseed/i, /self-ordering regolith/i, /crystal foam/i, /runaway growth/i],
  'Metric storm': [/metric[- ]storm/i, /\bshear\b/i, /clock desync/i, /phase instab/i, /metric mirage/i, /baseline drift/i],
  Pinchdrive: [/pinchdrive/i, /\bpinch\b/i, /calibration/i, /misjump/i],
  Iggygate: [/iggygate/i, /\bthroat\b/i, /\bwake\b/i, /\bpylon\b/i, /gate-selected/i, /gate authority/i],
  Gardener: [/gardener/i, /surgical strike/i, /sol[- ]interdiction/i, /warning beacon/i],
  'Sol Silence': [/\bsilence\b/i, /sol[- ]shadow/i, /exclusion zone/i],
  'Narrow AI': [/narrow[- ]ai/i, /narrow ai/i, /stabilizer/i, /perception error/i, /witness core/i, /asi[- ]fragment/i, /fragmentation/i],
  'First-wave': [/first[- ]wave/i, /\bheir\b/i, /\bcharter\b/i, /\bruin/i, /pre-silence/i],
}

function collectHaystack(context: HookTermContext): string {
  const parts: string[] = [
    context.guOverlay.intensity.value,
    context.guOverlay.bleedLocation.value,
    context.guOverlay.bleedBehavior.value,
    context.guOverlay.resource.value,
    context.guOverlay.hazard.value,
    context.architecture.name.value,
    context.architecture.description.value,
    context.reachability.className.value,
    context.reachability.routeNote.value,
  ]
  for (const settlement of context.settlements) {
    parts.push(
      settlement.tags.map((tag) => tag.value).join(' '),
      settlement.tagHook.value,
      settlement.aiSituation.value,
      settlement.function.value,
      settlement.habitationPattern.value,
      settlement.builtForm.value,
      settlement.crisis.value,
      settlement.hiddenTruth.value,
      settlement.location.value,
      settlement.siteCategory.value,
    )
  }
  for (const ruin of context.ruins) {
    parts.push(ruin.location.value, ruin.remnantType.value, ruin.hook.value)
  }
  for (const phenomenon of context.phenomena) {
    parts.push(
      phenomenon.phenomenon.value,
      phenomenon.note.value,
      phenomenon.travelEffect.value,
      phenomenon.surveyQuestion.value,
      phenomenon.conflictHook.value,
      phenomenon.sceneAnchor.value,
    )
  }
  return parts.join(' ')
}

export function detectHookTerms(context: HookTermContext): Set<HookTerm> {
  const haystack = collectHaystack(context)
  const detected = new Set<HookTerm>()
  for (const [term, patterns] of Object.entries(TERM_PATTERNS) as [DetectableTerm, readonly RegExp[]][]) {
    if (patterns.some((re) => re.test(haystack))) detected.add(term)
  }
  return detected
}
