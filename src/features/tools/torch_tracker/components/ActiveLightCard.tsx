'use client'

import { useEffect, useMemo, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from 'react'

import type { ActiveLightSource } from '../types'
import { formatSecondsAsClock } from '../utils/time'
import { getImageAlt, getImagePath, type LightImageStatus } from '../utils/images'

export interface ActiveLightCardProps {
  source: ActiveLightSource
  onPause: (source: ActiveLightSource) => void
  onResume: (source: ActiveLightSource) => void
  onRemove: (source: ActiveLightSource) => void
  className?: string
}

type ImageState = 'ready' | 'fallback'

type CardFaceVariant = 'active' | 'inactive'

const statusText: Record<CardFaceVariant, string> = {
  active: 'Active',
  inactive: 'Inactive',
}

export function ActiveLightCard({ source, onPause, onResume, onRemove, className }: ActiveLightCardProps) {
  const isPaused = source.status === 'paused' || source.isPaused
  const cardState: CardFaceVariant = isPaused ? 'inactive' : 'active'
  const labelId = useMemo(() => `light-card-${source.instanceId}-label`, [source.instanceId])
  const descriptionId = useMemo(() => `${labelId}-description`, [labelId])
  const imageStatus: LightImageStatus = cardState
  const timeActiveLabel = formatSecondsAsClock(source.elapsedSeconds)
  const [imageState, setImageState] = useState<ImageState>('ready')
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => {
    setAnnouncement(`${source.label} ${statusText[cardState]}`)
  }, [cardState, source.label])

  const handleToggle = () => {
    if (cardState === 'active') {
      onPause(source)
    } else {
      onResume(source)
    }
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleToggle()
    }
  }

  const handleRemove = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    onRemove(source)
  }

  const handleImageError = () => {
    setImageState('fallback')
  }

  const sharedFaceContent = (variant: CardFaceVariant) => (
    <div className={`torch-card-face ${variant === 'active' ? 'torch-card-face--active' : 'torch-card-face--inactive'}`}>
      {variant === 'active' && <div className="torch-card-glow" aria-hidden="true" />}
      <div className="flex items-start justify-between gap-3">
        <span id={labelId} className="torch-card-label">
          {source.label}
        </span>
        <span className="torch-card-metric" aria-label={`Bright radius ${source.brightRadius} feet`}>
          {source.brightRadius} ft
        </span>
      </div>
      <div className="torch-card-image-shell" aria-hidden={variant !== cardState}>
        {imageState === 'ready' ? (
          <img
            src={getImagePath(source.sourceType, variant)}
            alt={variant === cardState ? getImageAlt(source.label, variant) : ''}
            onError={handleImageError}
          />
        ) : (
          <span
            role={variant === cardState ? 'img' : undefined}
            aria-label={variant === cardState ? getImageAlt(source.label, variant) : undefined}
            className="text-5xl"
          >
            {source.icon || '🔥'}
          </span>
        )}
      </div>
      <div className="flex items-end justify-between">
        <span className="torch-card-metric">{statusText[variant]}</span>
        <span className="torch-card-timer" aria-live={variant === cardState ? 'polite' : undefined}>
          {timeActiveLabel}
        </span>
      </div>
    </div>
  )

  return (
    <article
      className={`torch-card aspect-[5/7] w-full max-w-sm cursor-pointer select-none ${className ?? ''}`.trim()}
      data-state={cardState}
      data-image-state={imageState === 'fallback' ? 'fallback' : 'ready'}
      role="button"
      tabIndex={0}
      aria-pressed={cardState === 'active'}
      aria-labelledby={labelId}
      aria-describedby={descriptionId}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
    >
      <div className="sr-only" id={descriptionId}>
        Press Space or Enter to toggle this light source. Remove button appears at the bottom of the card.
      </div>
      <div className="sr-only" aria-live="polite">
        {announcement}
      </div>

      <div className="torch-card-inner">
        {sharedFaceContent('active')}
        {sharedFaceContent('inactive')}
      </div>

      <button
        type="button"
        className="torch-card-remove"
        onClick={handleRemove}
        aria-label={`Remove ${source.label}`}
      >
        ×
      </button>
    </article>
  )
}
