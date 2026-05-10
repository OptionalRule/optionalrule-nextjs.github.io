import type { Metadata } from 'next'
import {
  GLYPH_COMPONENTS,
  GLYPH_IDS,
  GLYPH_META,
} from '@/features/tools/star_system_generator/viewer3d/scene/overlay/glyphRegistry'
import {
  REGISTER_COLORS,
  STATUS_HUMAN,
} from '@/features/tools/star_system_generator/viewer3d/scene/overlay/statusPalette'
import {
  pickSettlementGlyph,
} from '@/features/tools/star_system_generator/viewer3d/scene/overlay/pickGlyph'
import type {
  GlyphId,
  GlyphRegister,
  GlyphStatus,
} from '@/features/tools/star_system_generator/viewer3d/scene/overlay/types'
import type {
  SettlementHabitationPattern,
  SettlementPopulation,
} from '@/features/tools/star_system_generator/types'

export const metadata: Metadata = {
  title: 'Symbol Guide · Star System Generator',
  description:
    'Reference for every glyph in the Star System Viewer overlay — settlements, gates, ruins, phenomena, hazards, and GU bleeds, with status palette and habitation-pattern mapping.',
}

const REGISTER_COLOR: Record<GlyphRegister, string> = {
  human: STATUS_HUMAN.active.color,
  ...REGISTER_COLORS,
}

interface GlyphCellProps {
  id: GlyphId
  status?: GlyphStatus
  size?: number
}

function GlyphCell({ id, status = 'active', size = 64 }: GlyphCellProps) {
  const meta = GLYPH_META[id]
  const Glyph = GLYPH_COMPONENTS[id]
  const color = meta.register === 'human' ? STATUS_HUMAN[status].color : REGISTER_COLOR[meta.register]
  const dashed = meta.register === 'human' ? STATUS_HUMAN[status].dashed : false
  return (
    <div
      style={{ color }}
      className="flex flex-col items-center gap-2 rounded-md border border-white/10 bg-[#0a0e12] p-3"
    >
      <Glyph size={size} dashed={dashed} />
      <span className="text-[11px] uppercase tracking-wider opacity-90">{meta.id}</span>
      <span className="text-[10px] opacity-50 text-center max-w-[160px] leading-tight">{meta.name}</span>
    </div>
  )
}

function SizePair({ id, status }: { id: GlyphId; status?: GlyphStatus }) {
  const meta = GLYPH_META[id]
  const Glyph = GLYPH_COMPONENTS[id]
  const color = meta.register === 'human' ? STATUS_HUMAN[status ?? 'active'].color : REGISTER_COLOR[meta.register]
  const dashed = meta.register === 'human' ? STATUS_HUMAN[status ?? 'active'].dashed : false
  return (
    <div className="flex flex-col items-center gap-2 rounded-md border border-white/10 bg-[#0a0e12] p-3" style={{ color }}>
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center gap-1">
          <Glyph size={64} dashed={dashed} />
          <span className="text-[8px] opacity-40 uppercase tracking-wider">64px</span>
        </div>
        <div className="h-9 w-px bg-white/10" />
        <div className="flex flex-col items-center gap-1">
          <Glyph size={24} dashed={dashed} />
          <span className="text-[8px] opacity-40 uppercase tracking-wider">24px</span>
        </div>
      </div>
      <span className="text-[11px] uppercase tracking-wider opacity-90">{meta.id} · {meta.name}</span>
      <span className="text-[10px] opacity-50 text-center max-w-[220px] leading-tight">{meta.description}</span>
    </div>
  )
}

const HUMAN_IDS: GlyphId[] = ['A1', 'A2', 'A3', 'BR', 'DR', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7']
const NON_HUMAN_IDS: GlyphId[] = ['GT', 'RU', 'PH', 'HZ', 'GU']

const STATUS_DEMO_IDS: GlyphId[] = ['A1', 'A2', 'A3', 'BR', 'B1']

const MAPPING_SAMPLES: ReadonlyArray<{
  pattern: SettlementHabitationPattern
  population: SettlementPopulation
}> = [
  { pattern: 'Surface settlement', population: '10+ million' },
  { pattern: 'Surface settlement', population: '21-100' },
  { pattern: 'Sealed arcology', population: '1,001-10,000' },
  { pattern: 'Sky platform', population: '101-1,000' },
  { pattern: 'Tethered tower', population: '100,001-1 million' },
  { pattern: 'Asteroid or belt base', population: '1-20' },
  { pattern: 'Hollow asteroid', population: '21-100' },
  { pattern: 'Belt cluster', population: '1,001-10,000' },
  { pattern: 'Moon base', population: '21-100' },
  { pattern: 'Distributed swarm', population: '10,001-100,000' },
  { pattern: 'Drift colony', population: '1-10 million' },
  { pattern: 'Generation ship', population: '100,001-1 million' },
  { pattern: 'Deep-space platform', population: '21-100' },
  { pattern: 'Ring station', population: '10+ million' },
  { pattern: 'Ring station', population: '1,001-10,000' },
  { pattern: "O'Neill cylinder", population: '10+ million' },
  { pattern: 'Hub complex', population: '10+ million' },
  { pattern: 'Hub complex', population: '1,001-10,000' },
  { pattern: 'Hub complex', population: '101-1,000' },
  { pattern: 'Modular island station', population: '1-10 million' },
  { pattern: 'Modular island station', population: '101-1,000' },
  { pattern: 'Orbital station', population: '10+ million' },
  { pattern: 'Orbital station', population: '10,001-100,000' },
  { pattern: 'Orbital station', population: '101-1,000' },
  { pattern: 'Underground city', population: '100,001-1 million' },
  { pattern: 'Gate or route node', population: 'Unknown' },
]

export default function GlyphPreviewPage() {
  return (
    <main className="min-h-screen bg-[#04070b] px-6 py-10 text-[#c8d6df] font-mono">
      <div className="mx-auto max-w-6xl space-y-12">
        <header className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.2em] opacity-50">Star System Viewer · symbol reference</p>
          <h1 className="text-2xl font-semibold text-white">HUD Overlay Symbol Guide</h1>
          <p className="text-sm opacity-60 max-w-3xl">
            Every glyph used in the 3D system viewer. Shape carries category; hue carries status (for
            human-built objects) or domain (for non-human phenomena). Each glyph appears at display size
            (64px) and scene size (24px) — the size it reads at when the camera pulls back.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-sm uppercase tracking-[0.18em] text-[#f4b860] border-b border-white/10 pb-2">
            Human-layer · {HUMAN_IDS.length} glyphs · hue = status (active amber)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {HUMAN_IDS.map((id) => <SizePair key={id} id={id} />)}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm uppercase tracking-[0.18em] text-[#b594ff] border-b border-white/10 pb-2">
            Non-human / phenomenal · hue = domain
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {NON_HUMAN_IDS.map((id) => <SizePair key={id} id={id} />)}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm uppercase tracking-[0.18em] text-[#5fc9b8] border-b border-white/10 pb-2">
            Status palette · human-layer registers
          </h2>
          <p className="text-xs opacity-60 max-w-2xl">
            Active (amber, solid), Abandoned (gray, dashed), Automated (teal, solid). Contested and Hostile are
            spec&apos;d but deferred to v2. Same glyph rendered three ways:
          </p>
          <div className="space-y-6">
            {STATUS_DEMO_IDS.map((id) => (
              <div key={id} className="flex items-center gap-6 rounded-md border border-white/10 bg-[#0a0e12] p-4">
                <span className="text-xs uppercase tracking-wider opacity-60 w-24">{id} · {GLYPH_META[id].name.split('·')[0].trim()}</span>
                <div className="flex items-center gap-8">
                  {(['active', 'abandoned', 'automated'] as GlyphStatus[]).map((status) => (
                    <div key={status} className="flex flex-col items-center gap-2">
                      <GlyphCell id={id} status={status} size={56} />
                      <span className="text-[10px] uppercase tracking-wider opacity-60">{status}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm uppercase tracking-[0.18em] text-[#f4b860] border-b border-white/10 pb-2">
            Habitation pattern → glyph mapping
          </h2>
          <p className="text-xs opacity-60 max-w-2xl">
            <code>pickSettlementGlyph()</code> applied to representative (pattern, population) inputs. Confirms
            family + scale logic from spec §7.1.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {MAPPING_SAMPLES.map(({ pattern, population }) => {
              const id = pickSettlementGlyph(pattern, population)
              const Glyph = GLYPH_COMPONENTS[id]
              const meta = GLYPH_META[id]
              const color = meta.register === 'human' ? STATUS_HUMAN.active.color : REGISTER_COLOR[meta.register]
              return (
                <div
                  key={`${pattern}-${population}`}
                  className="flex items-center gap-4 rounded-md border border-white/10 bg-[#0a0e12] p-3"
                >
                  <div style={{ color }} className="shrink-0">
                    <Glyph size={40} />
                  </div>
                  <div className="flex flex-col text-[11px] leading-tight">
                    <span className="opacity-90">{pattern}</span>
                    <span className="opacity-50">{population}</span>
                    <span className="text-[10px] uppercase tracking-wider opacity-70 mt-1" style={{ color }}>→ {id}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm uppercase tracking-[0.18em] opacity-60 border-b border-white/10 pb-2">
            All glyphs at scene size (24px)
          </h2>
          <p className="text-xs opacity-60 max-w-2xl">
            Survey-chart readability check: every glyph rendered at the size it would appear when the camera
            pulls back. Anything that mushes here needs to be redrawn.
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-9 gap-3">
            {GLYPH_IDS.map((id) => {
              const meta = GLYPH_META[id]
              const Glyph = GLYPH_COMPONENTS[id]
              const color = meta.register === 'human' ? STATUS_HUMAN.active.color : REGISTER_COLOR[meta.register]
              return (
                <div key={id} className="flex flex-col items-center gap-1 rounded-md border border-white/10 bg-[#0a0e12] p-2" style={{ color }}>
                  <Glyph size={24} />
                  <span className="text-[10px] opacity-70">{id}</span>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}
