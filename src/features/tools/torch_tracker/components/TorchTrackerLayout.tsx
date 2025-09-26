'use client'

import type { ReactNode } from 'react'

export interface TorchTrackerLayoutProps {
  header: ReactNode
  activeList: ReactNode
  expired: ReactNode
  className?: string
}

export function TorchTrackerLayout({ header, activeList, expired, className }: TorchTrackerLayoutProps) {
  return (
    <div className={`mx-auto flex w-full max-w-6xl flex-col gap-8 ${className ?? ''}`.trim()}>
      {header}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-8">{activeList}</div>
        <aside className="flex flex-col gap-6">{expired}</aside>
      </div>
    </div>
  )
}
