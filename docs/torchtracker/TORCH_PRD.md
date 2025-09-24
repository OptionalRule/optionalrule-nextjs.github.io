# Shadowdark Torch Tracker — Product Requirements Document

## 1. Product Context
- **Purpose**: Deliver a focused Shadowdark Game Master tool that tracks active light sources, their burn time, and party visibility in real time during a session.
- **Experience Type**: Client-only interactive feature rendered under the Optional Rule static site. The tool ships as a standalone React module dynamically imported at runtime (no SSR) to preserve the global static export.
- **Placement**: `/tools/torch_tracker/` within the App Router `(interactive)` group. The route is backed by `src/app/(interactive)/tools/torch_tracker/page.tsx` and consumes a feature entry point in `src/features/tools/torch_tracker`.
- **Primary Users**: Shadowdark GMs who need a fast, legible way to track torches/lanterns/spells without leaving the table. Secondary users include players checking light status on a companion display.

## 2. Integration With Optional Rule Site Architecture
- Route metadata is generated with `generateMetadata` using `urlPaths.tool('torch_tracker')` for canonical URLs and trailing slashes, aligning with the SEO helpers defined in `src/lib/seo.ts`.
- The page component renders a thin client wrapper (e.g., `TorchTrackerClient`) that dynamically imports the feature module with `ssr: false`, matching the `KCD2 Alchemy` pattern (`src/app/(interactive)/tools/kcd2_alchemy`).
- Feature code lives in `src/features/tools/torch_tracker/` with subfolders for `components`, `hooks`, `lib` (logic utilities), and `data`. Shared types are exposed via a local `types.ts` file to encourage reuse and unit testing.
- Static assets (icons, sounds if chosen) reside under `public/tools/torch_tracker/`; metadata should reference these assets via absolute paths to remain compatible with static export.
- Site navigation updates use existing helpers in `src/components/Header.tsx` and `Footer.tsx` to add a Tools navigation item. Friendly name appears in nav while URLs always leverage `urlPaths.tool` to keep trailing slashes correct.

## 3. Primary User Scenarios
1. **Add Light Source From Catalog** – GM selects a predefined archetype (torch, lantern, light spell, campfire, custom) and instantly sees it in the active roster with default burn duration and brightness range.
2. **Monitor Burn Down** – Each active source shows remaining rounds/turns and real-time clock, decrementing automatically every 10 in-game minutes (Shadowdark dungeon turn) or via manual step controls.
3. **Pause or Adjust** – GM can pause global time, hold individual sources (e.g., someone pockets a torch), or adjust remaining time when the party rests.
4. **Handle Expiration** – When a source expires, the tool surfaces a prominent alert, dims the card, and optionally moves it to an "expired" tray until dismissed.
5. **Customize & Annotate** – GM can rename instances ("Torch – Front rank"), edit duration for improvised light, and toggle whether a source affects global visibility (useful for hooded lanterns).

## 4. Functional Requirements

### 4.1 Light Source Catalog & Data Model
- Define `lightSources` in `src/features/tools/torch_tracker/data/lightSources.ts` using strongly typed entries (`TorchCatalogEntry`). Base fields:
  - `id`, `name`, `category` (`'mundane' | 'magical' | 'environmental' | 'custom'`), `baseDurationMinutes`, `turnLengthMinutes` (default 10), `radius` (bright/dim in feet), `icon`, `color`, `description`, `mishapNote?`.
- Provide helper functions in `lib/catalog.ts` to retrieve entries by `id`, compute default rounds (`baseDurationMinutes / turnLengthMinutes`), and clone entries into instance objects.
- Support a "Custom" archetype that prompts for duration, radius, and optional note on instantiation while still flowing through standard state.

- Type definitions now live in `src/features/tools/torch_tracker/types.ts` and codify the three core domains:
  - `TorchCatalogEntry` captures canonical data (source type, category, duration, radius, iconography, theming metadata, and mishap guidance) with default guards for turn length and radius normalization.
  - `ActiveLightSource` models instances on the table, including timer derivatives (`totalSeconds`, `remainingRounds`), visibility toggles, pause state, and timestamps for upcoming reducer hooks.
  - `TorchTrackerState`, `TorchTrackerSettings`, and the `TorchTrackerReducerAction` union describe how catalog, active roster, expired tray, and global clock settings move through the reducer planned in Phase 3. Selector signatures (`TorchTrackerSelector<TResult>`) define memoizer contracts for aggregate reads (brightest radius, next expiration, etc.).
- Catalog data is seeded via `baseLightSources` and `lightSourceCatalog` in `data/lightSources.ts`, incorporating Shadowdark archetypes (torch, oil lantern, light spell, campfire) plus a `createCustomLightSource` helper that sanitizes ids, enforces radius sanity, and ensures custom archetypes surface uniformly in the UI.
- `src/features/tools/torch_tracker/lib/catalog.ts` implements reusable utilities:
  - `ensureCatalogEntryDefaults` and `cloneCatalogEntry` normalize incoming data and produce immutable copies for state usage.
  - `createCatalogIndex` and `findCatalogEntry` centralize lookups for upcoming reducers and hooks.
  - `createActiveSourceFromCatalog` converts catalog entries into fully populated `ActiveLightSource` records with derived counters, pause/visibility flags, and status detection.
  - `validateCatalogEntry` / `validateCatalog` surface structural issues (duplicate ids, invalid radii or durations) for use in unit tests and future build-time assertions.

### 4.2 State Management & Types
- Introduce an `ActiveLightSource` type composed of catalog data plus instance-level overrides: `instanceId`, `label`, `remainingSeconds`, `remainingRounds`, `isPaused`, `createdAt`, `notes?`, `isAffectingVisibility`.
- Manage active sources with a reducer in `hooks/useTorchTrackerState.ts` to keep logic isolated and testable (actions: `add`, `remove`, `update`, `tick`, `pause`, `resume`, `reset`, `expire`). Persist state in memory only; session storage persistence can be an enhancement toggle.
- Derive aggregate status (brightest radius, any light active, time to darkness) via memoized selectors housed in `lib/selectors.ts`.
- The reducer is exported for testing alongside a `useTorchTrackerState` controller hook that exposes memoized helpers (catalog registration, ticking, pause/resume, reset) in compliance with `docs/testing-strategy.md` coverage expectations.
- Time automation helpers live in `hooks/useGameClock.ts`, providing a requestAnimationFrame/setInterval bridge that respects global clock settings and supports manual tick advances.

### 4.3 User Interface & Layout
- Use an outer layout wrapper with Tailwind utility classes consistent with site tokens (`bg-surface-1`, `text-foreground`, container max width).
- Header section contains tool title, quick rules reminder, and controls for global time flow (start/pause, advance round, reset all). Provide optional "Tutorial" popover accessible via `aria-described` help button.
- The catalog is rendered as responsive buttons or cards with accessible labels and consistent color tokens. Buttons use `aria-pressed` where toggled, support keyboard activation, and visually group by category.
- Active source cards appear in a CSS grid (min 280px). Cards include:
  - Label with editing inline control (`contentEditable` avoided; prefer input dialog or modal to stay accessible).
  - Bright/dim radius badges using Tailwind tokens.
  - Burn timeline: stacked progress bars showing rounds remaining and total absolute time (minutes:seconds). Provide textual countdown for screen readers.
  - Controls: pause/resume (per source), advance one round, restore defaults, delete (with confirmation/undo pattern optional).
- Expired sources shift to a secondary panel beneath the grid, highlighting the need to replace light with call to action.
- UI primitives (e.g., `CatalogButton`, `CatalogPanel`, `ActiveLightCard`, `TorchTrackerHeader`, `ExpiredTray`, `TorchTrackerLayout`) are implemented under `src/features/tools/torch_tracker/components/` and designed for reuse across future contexts (story previews, docs) while preserving accessibility hooks.
- The feature entry (`src/features/tools/torch_tracker/index.tsx`) orchestrates catalog selection, active roster controls, auto-advance timing (via `useGameClock`), and insight banners, delivering a cohesive client-side experience ready for dynamic import in the App Router.
- App Router integration lives under `src/app/(interactive)/tools/torch_tracker/`, where `page.tsx` wires metadata/canonical URLs and `TorchTrackerClient.tsx` dynamically imports the client bundle with `ssr: false` to preserve static export compatibility.

### 4.4 Timekeeping & Automation
- A shared timer service (e.g., `useGameClock` hook) runs via `requestAnimationFrame` or `setInterval` at 1-second resolution while active. When global clock is paused, per-source countdown halts.
- Each source’s `remainingSeconds` decrements based on global clock ticks when `isPaused` is false. Manual adjustments (advance round, edit duration) dispatch reducer actions that update derived fields.
- Provide optional "auto advance" toggle: if disabled, the GM must press "Advance Round" to reduce timers, aligning with tables that track turns manually.
- When `remainingSeconds <= 0`, mark source `status: 'expired'`, trigger light loss alert (non-modal), play subtle sound if user has enabled audio (respect `prefers-reduced-motion`/`prefers-reduced-data`).

### 4.5 Accessibility & Internationalization
- All interactive elements must meet WCAG 2.1 AA: focus outlines, ARIA labels for timers (announce time remaining), button names describing actions.
- Support reduced motion by disabling animated glows when `prefers-reduced-motion` is true.
- Copy lives in a `locales/en/tool_torch_tracker.ts` dictionary for future translations; strings pulled via lightweight helper `t()`.

## 5. Non-Functional Requirements
- **Static Export Compatibility**: No runtime APIs, database calls, or server components. All data is local to the bundle and JSON files under `public/`.
- **Performance**: Defer loading heavy assets; dynamic import keeps bundle isolated. Keep feature initial JS < 80KB gzipped by splitting rarely used components (tutorial modal, sound toggles) via nested dynamic imports.
- **Security**: Sanitize any user-entered notes using existing `sanitize-html` helpers or simple escape functions. No inline `<script>` or `dangerouslySetInnerHTML`.
- **Theming**: Respect global light/dark tokens defined in `globals.css`. Provide consistent contrast ratios for card backgrounds.
- **Analytics**: Optionally emit GA events (e.g., "torch_tracker_add_light") through existing analytics helper; wrap behind a feature flag to avoid tight coupling.

## 6. Data & Asset Strategy
- Catalog defined in TypeScript for type safety; seed data optionally mirrored as JSON for documentation but runtime uses TS modules.
- Icons sourced from Lucide or custom SVG stored in `public/tools/torch_tracker/icons/`. Reference via `next/image` alternative? Because static export uses `<img>` with absolute path; follow existing pattern (no Next Image).
- Provide sample data and screenshots in `docs/torchtracker/README.md` for maintainers. Update `docs/torchtracker/PRD.md` later if deeper spec needed.

## 7. Testing & Quality Assurance
- **Unit Tests**: `src/features/tools/torch_tracker/__tests__/` covering reducers, selectors, catalog helpers with Vitest, executed through `npm run test` (`vitest.unit.config.ts`) to honour thresholds and practices outlined in `docs/testing-strategy.md` and `docs/STANDARDS.md`.
- **Component Tests**: Use Testing Library to validate rendering, keyboard interactions, time tick logic (mock timers), and expiration alerts.
- **Accessibility Tests**: Extend existing jest-axe suite with a scenario for `TorchTracker` to ensure no critical violations.
- **Visual Review**: Optional Storybook stories for catalog button states, active card, and global header added under `src/stories/tools/TorchTracker.stories.tsx` (client-only, uses `next/dynamic` story pattern).
- **CI Hooks**: Ensure new tests run via `npm run test` and align with `npm run test:all` expectations.

## 8. Documentation & Operational Notes
- Extend `docs/torchtracker/` with README (usage, rules references) and keep this plan as living document.
- Update changelog or release notes when feature ships. Ensure addition to sitemap via static route listing (Next export automatically picks page; confirm route included in sitemap generator tests).
