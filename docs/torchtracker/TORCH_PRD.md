# Torch Tracker - Product Requirements Document

## 1. Product Context
- **Purpose**: Provide Shadowdark Game Masters with a fast, legible way to track every light source in play, including elapsed burn time, current status, and overall party illumination.
- **Experience Type**: Client-only interactive feature imported dynamically inside the Optional Rule static site; no server rendering or runtime APIs are required so the static export remains compatible with GitHub Pages deployment.
- **Placement**: `/tools/torch_tracker/` in the App Router `(interactive)` group. The route shells in `TorchTrackerClient` which hydrates the feature entry point at `src/features/tools/torch_tracker`.
- **Primary Users**: Shadowdark referees running live sessions. Secondary viewers include players checking the shared timer from a second screen.
- **Value Proposition**: A single shared countdown governs all lights, reducing manual bookkeeping and making it obvious when the dungeon goes dark.

## 2. Site Integration & Architecture
- Metadata is produced via `generateMetadata` using `urlPaths.tool('torch_tracker')`, matching the site-wide SEO helpers and enforcing trailing slashes.
- Navigation updates add the tool to both header and footer menus using `urlPaths.tool` so links stay in sync with sitemap and RSS generation.
- Feature code follows the project standards: `components/`, `hooks/`, `lib/`, `data/`, `types.ts`, and colocated tests under `__tests__/`.
- Static art assets for light cards live in `public/tools/torch_tracker/`; helper utilities preload the active/inactive variants on mount to avoid flicker.
- The client bundle relies only on browser APIs (localStorage, timers) and is safe to execute in the static deployment sandbox.

## 3. Primary User Scenarios
1. **Start a Session Quickly**: Tap an icon in the catalog bar to add a torch, lantern, spell, or campfire. The light appears as a card and the global timer begins counting down.
2. **Run the Shared Clock**: Use the play/pause control to start or halt all lights at once; optionally skip forward exactly one minute to represent an in-world turn passing.
3. **Pause Specific Lights**: Flip an individual card (click, tap, or press Space/Enter) to extinguish or relight it while retaining total burn time for that source.
4. **Handle Expiration & Cleanup**: When a light reaches zero remaining seconds it is removed automatically. The GM can also remove cards manually with the inline delete control.
5. **Preserve Progress Between Sessions**: Auto-save keeps the roster, timer, and settings in localStorage; users can disable saving at any time and the stored snapshot is cleared immediately.

## 4. Functional Requirements

### 4.1 Catalog & Data Model
- Catalog definitions live in `data/lightSources.ts` and cover four canonical archetypes: Torch, Lantern, Light Spell, and Campfire.
- `TorchCatalogEntry` fields: `id`, `name`, `sourceType` (`'torch' | 'lantern' | 'spell' | 'fire'`), `category` (`'mundane' | 'magical' | 'environmental'`), `baseDurationMinutes`, `turnLengthMinutes`, `brightRadius`, `icon`, `color`, `description`, plus optional `brightness`, `mishapNote`, and `tags`.
- `lib/catalog.ts` exposes helpers (`ensureCatalogEntryDefaults`, `cloneCatalogEntry`, `createActiveSourceFromCatalog`, `validateCatalog`) so state logic always operates on normalized data.
- Instances are represented by `ActiveLightSource` objects containing immutable catalog metadata plus dynamic fields: `instanceId`, `remainingSeconds`, `elapsedSeconds`, `totalSeconds`, `isPaused`, `status`, `lastTickTimestamp`, and timestamps for creation/update auditing.
- Global state (`TorchTrackerState`) is composed of `catalog`, `active`, `settings`, and a `centralTimer` snapshot. Settings currently track `isClockRunning` and `lastTickTimestamp` only.

### 4.2 Timing & State Management
- `useTorchTrackerState` wraps a reducer that supports the following actions: catalog registration/refresh, add/update/remove/reset light instances, pause/resume, apply elapsed time ticks, advance the timer by an arbitrary delta (default 60 seconds), toggle clock running state, synchronise timestamps, and hydrate from persisted snapshots.
- `useGameClock` drives real-time ticking. When the clock is running it dispatches `active/tick` using `setInterval` (or `requestAnimationFrame` for very small intervals). Stopping the clock clears all timers.
- Central timer behaviour:
  - Initializes when the first light is added using that light's remaining duration.
  - Pauses automatically when all lights are inactive and resets completely when the roster empties.
  - When remaining time hits zero it extinguishes all active sources, clears the roster, and stops the clock.
- Manual controls include `advanceTimer` (skip 60 seconds) and `resetAll`, which restarts every light back to full duration after a user confirmation.

### 4.3 User Interface & Interactions
- **Header Layout**: Displays the title, descriptive subtitle, optional "Quick Tutorial" button, the circular countdown timer, control buttons (play/pause, reset, skip forward, auto-save toggle), and the catalog bar.
- **Circular Countdown Timer**: SVG ring that shrinks as time elapses, shows an `MM:SS` label, and announces remaining time through an `aria-live` region whenever a 10-minute bucket changes or the timer expires.
- **Catalog Bar**: Inline list of icon buttons labelled "Add:". Buttons highlight when selected, surface duration/description via the `title` tooltip, and condense to icon-only variants on mobile widths.
- **Control Buttons**:
  - Play shows `Play` when stopped and `Pause` when running. Disabled until at least one light exists.
  - Reset shows `TimerReset`, is disabled with tooltip feedback when no lights exist, and prompts the user before clearing the roster.
  - Skip forward uses the `FastForward` icon and is only enabled when the clock is running and at least one light is active.
  - Auto-save toggle switches between `Save`/`SaveOff`, defaults to enabled, and immediately clears persisted data when turned off.
- **Active Light Cards**:
  - Render in a responsive grid (1 column on small screens, up to 3 columns on wide displays).
  - Each card is a 5x7 playing-card layout with animated glow/smoke layers, central artwork, bright radius badge, elapsed time display, and a remove button.
  - Clicking/tapping flips between active and inactive faces; keyboard interaction (Space/Enter) performs the same action. Removing a card triggers a short fade before dispatching the delete.
  - Screen readers receive SR-only instructions, state change announcements, and accessible labels for radius metrics.
- **Empty State**: When no lights are active a dashed, instructional panel invites the user to add one from the catalog.

### 4.4 Persistence & Recovery
- Auto-save stores snapshots in localStorage under `optionalrule.torch-tracker/state` using a versioned envelope. Saved data includes `active` sources, `settings`, and the `centralTimer` snapshot.
- Hydration occurs on first render when auto-save is enabled. Incoming data is sanitised to guard against missing fields, invalid numbers, or unsupported schema versions; corrupt payloads are discarded and the storage key is cleared.
- Disabling auto-save immediately removes the stored snapshot. When auto-save remains enabled but the roster becomes empty, persistence also clears to avoid stale data.
- Graceful failure handling: quota errors and JSON parsing issues are caught and logged without throwing, preventing crashes in constrained environments.

### 4.5 Accessibility, Responsiveness & Visual Polish
- All interactive elements support keyboard navigation and communicate state via `aria-pressed`, `aria-label`, and tooltips. Decorative effects honour `prefers-reduced-motion` fallbacks.
- Timer announcements use polite live regions so screen-reader users receive periodic updates without overwhelming chatter.
- Mobile breakpoint (`md`) reorganises the header: the timer drops beneath the hero copy and catalog buttons compress to circular icons while maintaining descriptive tooltips.
- Preloading of card artwork prevents perceived loading lag; failures gracefully degrade to emoji iconography without losing semantic information.

### 4.6 Quality & Testing
- Unit tests cover catalog utilities, reducer transitions (including persistence hydration and advance logic), component interactions (cards, header, countdown, catalog buttons), and persistence helpers.
- The Vitest suite (`npm run test`) executes under the shared `vitest.unit.config.ts` configuration using the `happy-dom` environment with global setup in `src/test-setup.ts`.
- Linting (`npm run lint`) enforces the project's TypeScript, accessibility, and stylistic rules; recent updates include escaping copy that contains apostrophes to satisfy `react/no-unescaped-entities`.

## 5. Non-Functional Requirements
- **Performance**: Feature should remain responsive with 12+ concurrent light sources; card animations and countdown updates must not block the main thread.
- **Offline Support**: All functionality runs without network access. Auto-save relies on localStorage availability; the UI should continue functioning if persistence fails.
- **Security & Privacy**: No user accounts or remote storage; persisted data never leaves the browser. Avoid embedding untrusted scripts or external resources beyond the prepackaged images and Lucide icons already bundled with the app.

## 6. Future Enhancements (Out of Scope)
- Custom light archetypes created on the fly (naming, duration overrides) surfaced through a richer catalog experience.
- Shared session links or multiplayer sync for distributed tables.
- Additional environmental cues (sound cues, vibration) when the central timer reaches defined thresholds.
