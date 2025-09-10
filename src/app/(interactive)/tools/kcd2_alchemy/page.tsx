import type { Metadata } from 'next'
import { generateMetadata } from '@/lib/seo'
import { urlPaths } from '@/lib/urls'
import Kcd2AlchemyClient from './Kcd2AlchemyClient'

export const metadata: Metadata = generateMetadata({
  title: 'KCD2 Alchemy Scholar',
  description:
    'Browse and filter Kingdom Come: Deliverance 2 alchemy recipes by level, ingredient, and effects.',
  canonical: urlPaths.tool ? urlPaths.tool('kcd2_alchemy') : '/tools/kcd2_alchemy/',
  image: '/images/interactive/asteroids-splashscreen.webp', // TODO: replace with a dedicated image
})

export default function Kcd2AlchemyPage() {
  return <Kcd2AlchemyClient />
}

