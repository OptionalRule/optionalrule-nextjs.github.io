import type { GeneratedSystem } from '../types'

export function PlayableLayerPanel({ system }: { system: GeneratedSystem }) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <article className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Human Remnants</h2>
        <div className="mt-3 space-y-3">
          {system.ruins.map((ruin) => (
            <div key={ruin.id} className="rounded-md border border-[var(--border)] bg-[var(--card-elevated)] p-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)]">{ruin.remnantType.value}</h3>
                  <p className="text-[var(--text-tertiary)]">{ruin.location.value}</p>
                </div>
              </div>
              <p className="mt-2 text-[var(--text-secondary)]">{ruin.hook.value}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">System Phenomena</h2>
        <div className="mt-3 space-y-3">
          {system.phenomena.map((phenomenon) => (
            <div key={phenomenon.id} className="rounded-md border border-[var(--border)] bg-[var(--card-elevated)] p-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-[var(--text-primary)]">{phenomenon.phenomenon.value}</h3>
              </div>
              <p className="mt-2 text-[var(--text-secondary)]">{phenomenon.note.value}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  )
}
