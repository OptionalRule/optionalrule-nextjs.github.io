import type { Metadata } from 'next'

import { generateMetadata } from '@/lib/seo'
import { urlPaths } from '@/lib/urls'

import TorchTrackerClient from './TorchTrackerClient'

export const metadata: Metadata = generateMetadata({
  title: 'Shadowdark Torch Tracker',
  description:
    'Track torches, lanterns, spells, and fires with automatic burn timers and Shadowdark turn management.',
  canonical: urlPaths.tool ? urlPaths.tool('torch_tracker') : '/tools/torch_tracker/',
})

export default function TorchTrackerPage() {
  return <TorchTrackerClient />
}

