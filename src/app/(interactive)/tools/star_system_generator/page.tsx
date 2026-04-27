import type { Metadata } from 'next'
import { generateMetadata } from '@/lib/seo'
import { urlPaths } from '@/lib/urls'
import StarSystemGeneratorClient from './StarSystemGeneratorClient'

export const metadata: Metadata = generateMetadata({
  title: 'Sci-Fi TTRPG Star System Generator',
  description:
    'Generate seeded, astronomy-grounded star systems with Geometric Unity hazards, resources, and settlements for sci-fi tabletop RPG play.',
  canonical: urlPaths.tool('star_system_generator'),
})

export default function StarSystemGeneratorPage() {
  return <StarSystemGeneratorClient />
}
