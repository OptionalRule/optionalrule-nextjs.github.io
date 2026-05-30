import fs from 'fs'
import path from 'path'
import type { Metadata } from 'next'
import Link from 'next/link'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { mdxOptions } from '@/lib/mdx-options'
import { mdxComponents } from '@/lib/mdx-components'
import TableOfContents from '@/components/TableOfContents'
import { extractHeadings } from '@/lib/utils'
import { generateMetadata as buildMetadata } from '@/lib/seo'
import { urlPaths } from '@/lib/urls'

const GLOSSARY_PATH = path.join(
  process.cwd(),
  'src/features/tools/star_system_generator/docs/background/GU_GLOSSARY.md',
)

const toolHome = urlPaths.tool('star_system_generator')

interface LoadedGlossary {
  body: string
  version: string | null
}

function loadGlossary(): LoadedGlossary {
  const raw = fs.readFileSync(GLOSSARY_PATH, 'utf8')
  const lines = raw.split('\n')

  // The source file opens with a block of bold-only title lines (title,
  // companion note, usage note, version) rather than YAML frontmatter. Strip
  // that block so the page renders its own header, and lift the version out of
  // it. Stop at the first non-empty line that isn't bold-only — the intro
  // paragraph — so only the leading block is removed.
  let index = 0
  let version: string | null = null
  while (index < lines.length) {
    const line = lines[index].trim()
    if (line === '') {
      index += 1
      continue
    }
    const boldOnly = /^\*\*(.+)\*\*$/.exec(line)
    if (!boldOnly) {
      break
    }
    const versionMatch = /version\s+(.+)/i.exec(boldOnly[1])
    if (versionMatch) {
      version = versionMatch[1].trim()
    }
    index += 1
  }

  return { body: lines.slice(index).join('\n').trim(), version }
}

export const metadata: Metadata = buildMetadata({
  title: 'Star System Generator Setting Glossary',
  description:
    'A working glossary of the Geometric Unity setting — the thirteen hero concepts behind the Star System Generator, the variants that fold under each, and the play hooks they seed at the table.',
  image: '/images/star_system_generator.webp',
  canonical: `${toolHome}glossary/`,
})

export default function StarSystemGlossaryPage() {
  const { body, version } = loadGlossary()
  const headings = extractHeadings(body)

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <nav className="mb-8 text-sm text-[var(--muted-2)] flex flex-wrap items-center gap-x-2 gap-y-1">
        <Link
          href={urlPaths.home()}
          className="hover:text-[var(--foreground)] transition-colors"
        >
          Home
        </Link>
        <span>›</span>
        <Link
          href={toolHome}
          className="hover:text-[var(--foreground)] transition-colors"
        >
          Star System Generator
        </Link>
        <span>›</span>
        <span className="text-[var(--foreground)]">Setting Glossary</span>
      </nav>

      <article className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
        <div className="p-8 lg:p-12">
          <header className="mb-8">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-2)] mb-2">
              Geometric Unity · setting reference
            </p>
            <h1 className="text-4xl font-bold text-[var(--foreground)] mb-4 leading-tight">
              Setting Glossary
            </h1>
            {version && (
              <p className="text-sm text-[var(--muted-2)]">Version {version}</p>
            )}
          </header>

          <div className="mb-8 p-6 bg-[var(--surface-hover)] rounded-lg border border-[var(--border)]">
            <TableOfContents headings={headings} />
          </div>

          <div className="prose prose-lg max-w-none">
            <MDXRemote
              source={body}
              components={mdxComponents}
              options={{ mdxOptions }}
            />
          </div>
        </div>
      </article>

      <div className="mt-12 flex justify-between items-center">
        <Link href={toolHome} className="btn-secondary">
          ← Back to the generator
        </Link>
        <Link
          href={`${toolHome}glyphs/`}
          className="text-[var(--muted-2)] hover:text-[var(--foreground)] transition-colors"
        >
          Symbol Guide →
        </Link>
      </div>
    </div>
  )
}
