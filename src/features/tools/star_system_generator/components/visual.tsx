import type { ComponentType, ReactNode, SVGProps } from 'react'
import {
  Circle,
  CircleDashed,
  CircleDot,
  Flame,
  Globe2,
  Leaf,
  Mountain,
  Snowflake,
  Sparkles,
  Sun,
  Thermometer,
} from 'lucide-react'

export type Layer = 'physical' | 'gu' | 'human' | 'neutral'

interface LayerTokens {
  bar: string
  iconBg: string
  iconColor: string
  ring: string
}

const layerTokens: Record<Layer, LayerTokens> = {
  physical: {
    bar: 'bg-[var(--accent)]',
    iconBg: 'bg-[var(--accent-light)]',
    iconColor: 'text-[var(--accent)]',
    ring: 'ring-1 ring-inset ring-[var(--accent)]/20',
  },
  gu: {
    bar: 'bg-[var(--accent-mystical)]',
    iconBg: 'bg-[var(--accent-mystical-light)]',
    iconColor: 'text-[var(--accent-mystical)]',
    ring: 'ring-1 ring-inset ring-[var(--accent-mystical)]/25',
  },
  human: {
    bar: 'bg-[var(--accent-warm)]',
    iconBg: 'bg-[var(--accent-warm-light)]',
    iconColor: 'text-[var(--accent-warm)]',
    ring: 'ring-1 ring-inset ring-[var(--accent-warm)]/25',
  },
  neutral: {
    bar: 'bg-[var(--border-strong)]',
    iconBg: 'bg-[var(--surface-2)]',
    iconColor: 'text-[var(--text-secondary)]',
    ring: 'ring-1 ring-inset ring-[var(--border)]',
  },
}

const layerBarClasses: Record<Layer, string> = {
  physical: 'before:bg-[var(--accent)]',
  gu: 'before:bg-[var(--accent-mystical)]',
  human: 'before:bg-[var(--accent-warm)]',
  neutral: 'before:bg-[var(--border-strong)]',
}

type IconType = ComponentType<SVGProps<SVGSVGElement>>

interface SectionHeaderProps {
  layer: Layer
  icon: IconType
  title: string
  caption?: ReactNode
  actions?: ReactNode
  as?: 'h2' | 'h3'
}

export function SectionHeader({
  layer,
  icon: Icon,
  title,
  caption,
  actions,
  as: HeadingTag = 'h2',
}: SectionHeaderProps) {
  const tokens = layerTokens[layer]
  return (
    <div className="flex items-start gap-3">
      <div
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${tokens.iconBg} ${tokens.iconColor} ${tokens.ring}`}
        aria-hidden="true"
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <HeadingTag className="text-lg font-bold tracking-tight text-[var(--text-primary)] sm:text-xl">
            {title}
          </HeadingTag>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
        {caption ? <p className="mt-0.5 text-sm text-[var(--text-tertiary)]">{caption}</p> : null}
      </div>
    </div>
  )
}

export function sectionShellClasses(layer: Layer): string {
  return `relative h-full overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 before:absolute before:inset-y-0 before:left-0 before:w-[3px] ${layerBarClasses[layer]}`
}

interface SpectralChipProps {
  spectralType: string
  label?: string
}

const spectralColors: Record<string, { fill: string; ring: string }> = {
  'O/B/A bright star': { fill: 'bg-sky-400', ring: 'ring-sky-300/60' },
  'F star': { fill: 'bg-yellow-100', ring: 'ring-yellow-200/70' },
  'G star': { fill: 'bg-amber-300', ring: 'ring-amber-200/70' },
  'K star': { fill: 'bg-orange-400', ring: 'ring-orange-300/70' },
  'M dwarf': { fill: 'bg-red-500', ring: 'ring-red-400/60' },
  'White dwarf/remnant': { fill: 'bg-slate-100', ring: 'ring-slate-300' },
  'Brown dwarf/substellar primary': { fill: 'bg-amber-800', ring: 'ring-amber-700/60' },
  'Gate-selected anomaly': { fill: 'bg-[var(--accent-mystical)]', ring: 'ring-[var(--accent-mystical)]/40' },
}

export function SpectralChip({ spectralType, label }: SpectralChipProps) {
  const tokens = spectralColors[spectralType] ?? { fill: 'bg-slate-300', ring: 'ring-slate-300/60' }
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`inline-block h-3 w-3 shrink-0 rounded-full shadow-sm ring-2 ${tokens.fill} ${tokens.ring}`}
        aria-hidden="true"
      />
      {label ? <span>{label}</span> : null}
    </span>
  )
}

const thermalZoneTokens: Record<string, { dot: string; label: string }> = {
  Inferno: { dot: 'bg-red-600', label: 'text-red-700 dark:text-red-300' },
  Furnace: { dot: 'bg-orange-500', label: 'text-orange-700 dark:text-orange-300' },
  Hot: { dot: 'bg-amber-500', label: 'text-amber-700 dark:text-amber-300' },
  'Temperate band': { dot: 'bg-emerald-500', label: 'text-emerald-700 dark:text-emerald-300' },
  Cold: { dot: 'bg-sky-500', label: 'text-sky-700 dark:text-sky-300' },
  Cryogenic: { dot: 'bg-indigo-500', label: 'text-indigo-700 dark:text-indigo-300' },
  Dark: { dot: 'bg-violet-600', label: 'text-violet-700 dark:text-violet-300' },
}

export function ThermalZoneTag({ zone }: { zone: string }) {
  const tokens = thermalZoneTokens[zone] ?? { dot: 'bg-slate-400', label: 'text-[var(--text-secondary)]' }
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${tokens.dot}`} aria-hidden="true" />
      <span className={`font-medium ${tokens.label}`}>{zone}</span>
    </span>
  )
}

const categoryIcons: Record<string, IconType> = {
  'rocky-planet': Mountain,
  'super-earth': Globe2,
  'sub-neptune': Circle,
  'gas-giant': CircleDot,
  'ice-giant': Snowflake,
  belt: CircleDashed,
  'dwarf-body': Circle,
  'rogue-captured': Globe2,
  anomaly: Sparkles,
}

const categoryIconTint: Record<string, string> = {
  'rocky-planet': 'text-stone-600 dark:text-stone-300',
  'super-earth': 'text-emerald-700 dark:text-emerald-300',
  'sub-neptune': 'text-sky-700 dark:text-sky-300',
  'gas-giant': 'text-amber-700 dark:text-amber-300',
  'ice-giant': 'text-cyan-700 dark:text-cyan-300',
  belt: 'text-slate-500 dark:text-slate-400',
  'dwarf-body': 'text-stone-500 dark:text-stone-400',
  'rogue-captured': 'text-indigo-700 dark:text-indigo-300',
  anomaly: 'text-[var(--accent-mystical)]',
}

export function BodyCategoryIcon({ category, className }: { category: string; className?: string }) {
  const Icon = categoryIcons[category] ?? Circle
  const tint = categoryIconTint[category] ?? 'text-[var(--text-secondary)]'
  return <Icon aria-hidden="true" className={`${tint} ${className ?? 'h-4 w-4'}`} />
}

interface FieldProps {
  label: string
  children: ReactNode
  layer?: Layer
  className?: string
}

export function FieldRow({ label, children, layer = 'neutral', className = '' }: FieldProps) {
  const tokens = layerTokens[layer]
  return (
    <div className={`min-w-0 rounded-md border border-[var(--border-light)] bg-[var(--card-elevated)] p-2.5 ${className}`}>
      <dt className="flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
        <span className={`inline-block h-1 w-1 shrink-0 rounded-full ${tokens.bar}`} aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-[var(--text-primary)]">{children}</dd>
    </div>
  )
}

export const ZoneIcons = {
  hot: Flame,
  temperate: Leaf,
  cold: Snowflake,
  thermometer: Thermometer,
  star: Sun,
  sparkles: Sparkles,
}
