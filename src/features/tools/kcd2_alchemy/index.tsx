'use client'

import React from 'react'

export interface Kcd2AlchemyProps {
  className?: string
}

export default function Kcd2Alchemy({ className }: Kcd2AlchemyProps) {
  return (
    <div className={`min-h-screen bg-background text-foreground ${className || ''}`}>
      <header className="border-b border-[var(--border)] p-4">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold">KCD2 Alchemy Scholar</h1>
          <p className="text-[var(--muted-2)] mt-1">
            Browse and filter Kingdom Come: Deliverance 2 alchemy recipes.
          </p>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-md p-6">
          <p>
            Scaffold in place. Filters, data loading, and UI components will be
            implemented in subsequent milestones per docs/PLAN.md.
          </p>
        </div>
      </main>
    </div>
  )
}

export { Kcd2Alchemy }

