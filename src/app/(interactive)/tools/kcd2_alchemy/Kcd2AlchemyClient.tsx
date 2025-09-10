'use client'

import dynamic from 'next/dynamic'

const Kcd2Alchemy = dynamic(() => import('@/features/tools/kcd2_alchemy'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[50vh] bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl font-mono text-[var(--link)] mb-4">
          Loading Alchemy Scholar...
        </div>
        <div className="w-8 h-8 border-2 border-[var(--link)] border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    </div>
  ),
})

export default function Kcd2AlchemyClient() {
  return <Kcd2Alchemy />
}

