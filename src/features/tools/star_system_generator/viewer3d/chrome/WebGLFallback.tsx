'use client'

export function WebGLFallback({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#02040a] text-center text-sm text-[var(--text-secondary)]">
      <div className="max-w-md space-y-3 px-6">
        <p className="text-base font-semibold text-[var(--text-primary)]">3D view unavailable on this device.</p>
        <p>Your browser does not appear to support WebGL or has lost the rendering context.</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-[var(--accent)]/40 bg-[var(--accent-light)] px-3 py-1.5 text-sm font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/15"
        >
          Close — return to orbital table
        </button>
      </div>
    </div>
  )
}
