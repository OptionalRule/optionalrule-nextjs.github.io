import type { Metadata } from 'next'
import AsteroidsGameClient from './AsteroidsGameClient'

export const metadata: Metadata = {
  title: "Asteroids Game - Optional Rule",
  description: "Play the classic Asteroids arcade game reimagined with modern web technologies. Destroy asteroids, avoid collisions, and rack up points!",
  alternates: {
    canonical: "/games/asteroids/"
  },
  openGraph: {
    title: "Asteroids Game - Optional Rule",
    description: "Play the classic Asteroids arcade game reimagined with modern web technologies.",
    images: [
      {
        url: "/images/interactive/asteroids-splashscreen.webp",
        width: 1200,
        height: 800,
        alt: "Asteroids Splashscreen"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Asteroids Game - Optional Rule",
    description: "Play the classic Asteroids arcade game reimagined with modern web technologies.",
    images: ["/images/interactive/asteroids-splashscreen.webp"] // Case sensative
  }
}

export default function AsteroidsPage() {
  return <AsteroidsGameClient />
}