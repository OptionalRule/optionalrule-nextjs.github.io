import type { Metadata } from 'next'
import AsteroidsGameClient from './AsteroidsGameClient'
import { generateMetadata } from '@/lib/seo'

export const metadata: Metadata = generateMetadata({
  title: 'Asteroids Game',
  description: 'Play the classic Asteroids arcade game reimagined with modern web technologies. Destroy asteroids, avoid collisions, and rack up points!',
  canonical: '/games/asteroids/',
  image: '/images/interactive/asteroids-splashscreen.webp',
})

export default function AsteroidsPage() {
  return <AsteroidsGameClient />
}
