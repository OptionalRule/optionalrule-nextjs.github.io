import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Interactive Features',
  description: 'Games and tools for tabletop RPG enthusiasts, built as hobby game development projects',
}

export default function InteractiveLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
