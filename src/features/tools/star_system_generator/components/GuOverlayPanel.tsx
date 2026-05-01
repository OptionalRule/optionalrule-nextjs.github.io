import { Sparkles } from 'lucide-react'
import type { GeneratedSystem } from '../types'
import { FieldRow, SectionHeader, sectionShellClasses } from './visual'

export function GuOverlayPanel({ system, compact = false }: { system: GeneratedSystem; compact?: boolean }) {
  return (
    <section className={sectionShellClasses('gu')}>
      <SectionHeader
        layer="gu"
        icon={Sparkles}
        title="Geometric Unity Overlay"
        caption="Fictional pressure points layered on the physical system."
      />
      <dl className={`mt-4 grid gap-2 text-sm ${compact ? 'sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
        <FieldRow label="Intensity" layer="gu">{system.guOverlay.intensity.value}</FieldRow>
        <FieldRow label="Bleed Location" layer="gu">{system.guOverlay.bleedLocation.value}</FieldRow>
        <FieldRow label="Behavior" layer="gu">{system.guOverlay.bleedBehavior.value}</FieldRow>
        <FieldRow label="Resource" layer="gu">{system.guOverlay.resource.value}</FieldRow>
        <FieldRow label="Hazard" layer="gu">{system.guOverlay.hazard.value}</FieldRow>
        <FieldRow label="Intensity Roll" layer="gu">
          <span className="font-mono">{system.guOverlay.intensityRoll.value}</span>
        </FieldRow>
      </dl>
    </section>
  )
}
