'use client'

import React from 'react'
import './styles.css'

export interface TorchTrackerProps {
  className?: string
}

function TorchTrackerPlaceholder({ className }: TorchTrackerProps) {
  return (
    <div className={`torch-tracker-surface ${className ?? ''}`}>
      <div className="torch-tracker-shell">
        <h1 className="torch-tracker-title">Shadowdark Torch Tracker</h1>
        <p className="torch-tracker-description">
          Torch management for Shadowdark RPG is coming soon. We are scaffolding the tracker feature module now.
        </p>
      </div>
    </div>
  )
}

export default function TorchTracker(props: TorchTrackerProps) {
  return <TorchTrackerPlaceholder {...props} />
}

export { TorchTrackerPlaceholder as TorchTracker }
