'use client'

import dynamic from 'next/dynamic'

const TorchTrackerFeature = dynamic(() => import('@/features/tools/torch_tracker'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[50vh] bg-background flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="text-2xl font-semibold tracking-wide text-[var(--accent)]">
          Igniting torch tracker…
        </div>
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
      </div>
    </div>
  ),
})

export default function TorchTrackerClient() {
  return <TorchTrackerFeature />
}

