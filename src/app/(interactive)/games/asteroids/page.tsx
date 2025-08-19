'use client'

import dynamic from 'next/dynamic'

// Dynamically import the game with no SSR for client-side only rendering
const AsteroidsGame = dynamic(() => import('@/features/games/asteroids'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl font-mono text-game-neon-green mb-4">
          LOADING ASTEROIDS...
        </div>
        <div className="w-8 h-8 border-2 border-game-neon-green border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  ),
})

export default function AsteroidsPage() {
  return <AsteroidsGame />
}