'use client'

import dynamic from 'next/dynamic'

const StarSystemGenerator = dynamic(() => import('@/features/tools/star_system_generator'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[50vh] bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl font-mono text-[var(--link)] mb-4">
          Loading Star System Generator...
        </div>
        <div className="w-8 h-8 border-2 border-[var(--link)] border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    </div>
  ),
})

export default function StarSystemGeneratorClient() {
  return <StarSystemGenerator />
}
