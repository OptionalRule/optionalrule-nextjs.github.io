import type { EdgeTemplateFamily } from './types'

// HOSTS edges: subject = body (properNoun); object = settlement (properNoun).
// Theme: physical containment; the ground and what people built on it.
export const hostsTemplates: EdgeTemplateFamily = {
  edgeType: 'HOSTS',
  body: [
    { text: '{object} sits on {subject}.', expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: '{subject} hosts {object}.', expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: '{object} is the only major foothold on {subject}.', expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: '{subject} carries {object} on its surface.', expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: '{object} holds more people than {subject} was ever surveyed to carry, and the ratings office knows.', expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: 'The ground lease under {object} predates half the law that governs {subject}.', expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: 'Expansion at {object} ate the buffer zones on {subject} years ago.', expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: 'The anchor infrastructure joining {object} to {subject} is original-issue, and original-issue is now a warning label.', expects: { subject: 'properNoun', object: 'properNoun' } },
  ],
  bodyByTone: {
    cinematic: [
      { text: '{object} clings to {subject} like frost to a hull.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: '{subject} tolerates {object} the way a scarred back tolerates a brand.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'At night the lights of {object} are the only argument that {subject} belongs to anyone.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'Every generation at {object} swears it will leave {subject}; every generation digs one level deeper.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: '{subject} was here first, and everything about {object} apologizes for it.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'The bones of {object} go down into {subject} further than the charts admit.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: '{object} rides {subject} the way a tick rides a wolf: profitably, and with attention.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'What {subject} gives, {subject} can take back; {object} builds accordingly.', expects: { subject: 'properNoun', object: 'properNoun' } },
    ],
    astronomy: [
      { text: '{object} occupies the only long-term habitable site surveyed on {subject}.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'Structural loads at {object} run at the upper bound of what {subject}\'s substrate was rated for.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'Site selection for {object} optimized for access, not stability; {subject} has been reminding them since.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'The environmental envelope of {subject} constrains every expansion plan {object} files.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: '{object} maintains the only continuous instrument record of conditions on {subject}.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'Seismic and thermal baselines for {subject} are extrapolated from {object}\'s single-point coverage.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'Ground truth for {subject} means, in practice, whatever {object}\'s sensors report.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: '{object}\'s foundation survey on {subject} is overdue by two inspection cycles.', expects: { subject: 'properNoun', object: 'properNoun' } },
    ],
  },
  spineSummary: {
    text: '{object} clings to {subject} — the only thing keeping the system human.',
    expects: { subject: 'properNoun', object: 'properNoun' },
  },
  spineSummaryByTone: {
    balanced: [
      { text: '{object} clings to {subject} — the only thing keeping the system human.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'Whatever happens in this system happens, eventually, to {object} on {subject}.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'The human ledger of this system is written at {object}, on ground {subject} never promised anyone.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'This system has one address that matters: {object}, {subject}.', expects: { subject: 'properNoun', object: 'properNoun' } },
    ],
    cinematic: [
      { text: 'Everything human in this system fits inside {object}, and {subject} holds it like a held breath.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: '{subject} is the anvil; {object} is what got forged and stayed.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'If {object} goes dark, {subject} goes back to being a number in a catalog.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'The system keeps its heart in one place — {object} — and {subject} is the ribcage.', expects: { subject: 'properNoun', object: 'properNoun' } },
    ],
    astronomy: [
      { text: 'The system\'s entire human presence resolves to a single site: {object} on {subject}.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'All habitability claims for this system reduce to conditions at {object}, {subject}.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: '{subject} hosts the system\'s only permanent instrumented settlement, {object}.', expects: { subject: 'properNoun', object: 'properNoun' } },
      { text: 'Population, industry, and records for this system concentrate at one coordinates block: {object}, {subject}.', expects: { subject: 'properNoun', object: 'properNoun' } },
    ],
  },
  historicalBridge: [],
  hook: [
    { text: 'What gave {object} its claim to {subject} in the first place?', expects: { subject: 'properNoun', object: 'properNoun' } },
    { text: 'Who else has tried to settle {subject} since {object} arrived?', expects: { subject: 'properNoun', object: 'properNoun' } },
  ],
}
