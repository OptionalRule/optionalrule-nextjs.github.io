'use client'

import type { ReactNode } from 'react'

export interface TorchTrackerLayoutProps {
  header: ReactNode
  main: ReactNode
  sidebar?: ReactNode
  className?: string
}

export function TorchTrackerLayout({ header, main, sidebar, className }: TorchTrackerLayoutProps) {
  return (
    <div className={`mx-auto flex w-full max-w-6xl flex-col gap-8 ${className ?? ''}`.trim()}>
      {header}
      {sidebar ? (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-8">{main}</div>
          <aside className="flex flex-col gap-6">{sidebar}</aside>
        </div>
      ) : (
        <div className="flex flex-col gap-8">{main}</div>
      )}
    </div>
  )
}
