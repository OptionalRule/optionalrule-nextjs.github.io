'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { ComponentType } from 'react'
import { ChevronDown, ChevronRight, Copy, Download, FileJson, FileText } from 'lucide-react'
import type { GeneratedSystem } from '../types'
import { exportSystemJson, exportSystemMarkdown } from '../lib/export'
import { SectionHeader, sectionShellClasses } from './visual'

type ExportKind = 'markdown' | 'json'
type CopyStatus = 'idle' | 'markdown-copied' | 'json-copied' | 'failed'

export function ExportPanel({ system }: { system: GeneratedSystem }) {
  const markdown = useMemo(() => exportSystemMarkdown(system), [system])
  const json = useMemo(() => exportSystemJson(system), [system])
  const [isExpanded, setIsExpanded] = useState(false)
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle')
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  async function copyExport(kind: ExportKind) {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(kind === 'markdown' ? markdown : json)
      setCopyStatus(kind === 'markdown' ? 'markdown-copied' : 'json-copied')
    } catch {
      setCopyStatus('failed')
    }

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = window.setTimeout(() => setCopyStatus('idle'), 2200)
  }

  function downloadExport(kind: ExportKind) {
    const text = kind === 'markdown' ? markdown : json
    const extension = kind === 'markdown' ? 'md' : 'json'
    const mimeType = kind === 'markdown' ? 'text/markdown;charset=utf-8' : 'application/json;charset=utf-8'
    const filename = `${slugify(system.name.value)}-${system.seed}.${extension}`
    const blob = new Blob([text], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section id="export" className={sectionShellClasses('neutral')}>
      <SectionHeader
        layer="neutral"
        icon={Download}
        title="Export"
        caption="Copy or download the generated system for campaign notes and future tooling."
        actions={
          <button
            type="button"
            onClick={() => setIsExpanded((current) => !current)}
            aria-expanded={isExpanded}
            aria-controls="star-system-export-content"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--card-elevated)] px-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
          >
            {isExpanded ? (
              <ChevronDown aria-hidden="true" className="h-4 w-4" />
            ) : (
              <ChevronRight aria-hidden="true" className="h-4 w-4" />
            )}
            {isExpanded ? 'Hide exports' : 'Show exports'}
          </button>
        }
      />

      {isExpanded ? (
        <div id="star-system-export-content" className="mt-4 grid gap-4 lg:grid-cols-2">
          <ExportPreview
            id="star-system-markdown-export"
            title="Markdown"
            icon={FileText}
            value={markdown}
            rows={16}
            onCopy={() => void copyExport('markdown')}
            onDownload={() => downloadExport('markdown')}
            copyLabel="Copy Markdown"
            downloadLabel="Download Markdown"
          />
          <ExportPreview
            id="star-system-json-export"
            title="JSON"
            icon={FileJson}
            value={json}
            rows={16}
            onCopy={() => void copyExport('json')}
            onDownload={() => downloadExport('json')}
            copyLabel="Copy JSON"
            downloadLabel="Download JSON"
          />
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--text-tertiary)]">
          <ExportSize label="Markdown" value={markdown} />
          <ExportSize label="JSON" value={json} />
        </div>
      )}

      {copyStatus !== 'idle' ? (
        <div
          role="status"
          aria-live="polite"
          className="mt-3 rounded-md border border-[var(--border-light)] bg-[var(--card-elevated)] px-3 py-2 text-sm font-medium text-[var(--text-primary)]"
        >
          {copyStatus === 'markdown-copied'
            ? 'Markdown copied'
            : copyStatus === 'json-copied'
              ? 'JSON copied'
              : 'Could not copy export'}
        </div>
      ) : null}
    </section>
  )
}

function ExportSize({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <span className="font-medium text-[var(--text-secondary)]">{label}</span>{' '}
      <span className="font-mono">{formatBytes(value.length)}</span>
    </span>
  )
}

interface ExportPreviewProps {
  id: string
  title: string
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
  value: string
  rows: number
  onCopy: () => void
  onDownload: () => void
  copyLabel: string
  downloadLabel: string
}

function ExportPreview({
  id,
  title,
  icon: Icon,
  value,
  rows,
  onCopy,
  onDownload,
  copyLabel,
  downloadLabel,
}: ExportPreviewProps) {
  return (
    <article className="rounded-md border border-[var(--border-light)] bg-[var(--card-elevated)] p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
          <Icon aria-hidden="true" className="h-4 w-4 text-[var(--text-secondary)]" />
          {title}
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--card)] px-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
          >
            <Copy className="h-4 w-4" />
            {copyLabel}
          </button>
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--card)] px-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
          >
            <Download className="h-4 w-4" />
            {downloadLabel}
          </button>
        </div>
      </div>
      <label htmlFor={id} className="sr-only">
        {title} export
      </label>
      <textarea
        id={id}
        value={value}
        readOnly
        rows={rows}
        className="mt-3 w-full resize-y rounded-md border border-[var(--border)] bg-[var(--background)] p-3 font-mono text-xs leading-relaxed text-[var(--text-secondary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        spellCheck={false}
      />
    </article>
  )
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'star-system'
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}
