# Asteroids (Interactive Game)

Desktop-only Asteroids clone built with TypeScript + React and HTML5 Canvas. Loaded client-side via dynamic import and integrated under `/games/asteroids/`.

- Play route: `/games/asteroids/`
- App page: `src/app/(interactive)/games/asteroids/page.tsx`
- Feature code: `src/features/games/asteroids/`
- Audio assets: `public/games/asteroids/sounds/`

## Quick Start

- Dev: `npm run dev` then open `/games/asteroids/`
- Build: `npm run build` (static export); serve with `npm start`
- Lint/tests: `npm run lint`, `npm run test`

## Controls

- Arrow Left/Right: rotate
- Arrow Up: thrust
- Space: fire (cooldown, max bullets)
- Esc: pause/resume
- Enter: restart (when game over)
- Start: click on canvas (menu) or press any key

## Notes

- Mobile: not supported (shows overlay)
- Audio: requires user interaction to unlock; uses sound variants for variety
- High score persists in `localStorage` (`asteroids_highscore`)

## Structure

- `engine/`: entities (Ship, Asteroid, Bullet, Saucer, Explosion) and systems (Render, Collision, Sound)
- `components/`: `GameCanvas`, `GameUI`, `ScorePanel`, `ControlsPanel`
- `hooks/`: `useAsteroids`, `useGameInput`, `useGameLoop`
- `config/`: game settings, sound config
- `assets/`: development assets (see `public/` for deployed sounds)

## Links

- Detailed PRD: `../../../../documentation/asteroids/PRD.md`
- Main PRD summary (section 6.6): `../../../../documentation/PRD.md`

