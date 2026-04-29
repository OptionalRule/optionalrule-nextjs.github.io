import type { GeneratedSystem } from '../types'

export function GuOverlayPanel({ system }: { system: GeneratedSystem }) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Geometric Unity Overlay</h2>
          <p className="text-sm text-[var(--text-tertiary)]">
            Fictional pressure points layered on the physical system.
          </p>
        </div>
      </div>
      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <Detail label="Intensity" value={system.guOverlay.intensity.value} />
        <Detail label="Bleed Location" value={system.guOverlay.bleedLocation.value} />
        <Detail label="Behavior" value={system.guOverlay.bleedBehavior.value} />
        <Detail label="Resource" value={system.guOverlay.resource.value} />
        <Detail label="Hazard" value={system.guOverlay.hazard.value} />
        <Detail label="Intensity Roll" value={`${system.guOverlay.intensityRoll.value}`} />
      </dl>
    </section>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-[var(--border)] bg-[var(--card-elevated)] p-2.5">
      <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">{label}</dt>
      <dd className="mt-1 text-[var(--text-primary)]">{value}</dd>
    </div>
  )
}
