# Shadowdark Torch Tracker - Development Plan

## Development Plan

1. **Scaffold Feature Module**
   - Create `src/features/tools/torch_tracker/` with `components/`, `hooks/`, `lib/`, `data/`, and `__tests__/` subdirectories plus `index.tsx` entry point.
   - Stub `index.tsx` with client component wrapper exporting `<TorchTracker />` placeholder and default styles hook-up.

2. **Author Data Models & Catalog**
   - Implement `types.ts` defining `TorchCatalogEntry`, `ActiveLightSource`, reducer action types, and selectors.
   - Populate `data/lightSources.ts` with canonical Shadowdark light sources and a `createCustomLightSource` helper.
   - Add `lib/catalog.ts` utilities (clone, defaults, validation) with unit tests.

3. **Build State Management Hooks**
   - Implement `hooks/useTorchTrackerState.ts` containing reducer, action creators, and selectors.
   - Write Vitest coverage for reducer transitions (add/remove/expire/pause/resume/edit).
   - Add optional `hooks/useGameClock.ts` to encapsulate interval logic with pause/resume control and requestAnimationFrame fallbacks.

4. **Construct UI Components**
   - Create catalog controls (`CatalogButton`, `CatalogPanel`), active card (`ActiveLightCard`), expired tray, global header, and layout components using Tailwind tokens.
   - Ensure accessible labels, keyboard handling, and responsive grid layout per standards.
   - Add component-level tests validating interactions and ARIA properties.

5. **Wire Feature Entry Point**
   - Compose components in `index.tsx`, connect hooks, and implement global clock toolbar (play/pause, advance round, reset all, auto-advance toggle).
   - Provide context provider if needed (`TorchTrackerProvider`) to share state across nested components while keeping reducer testable.

6. **Integrate With App Router**
   - Create `src/app/(interactive)/tools/torch_tracker/page.tsx` with metadata from `generateMetadata` and canonical via `urlPaths.tool('torch_tracker')`.
   - Add `TorchTrackerClient.tsx` wrapper that dynamically imports the feature with `ssr: false` and a loading placeholder respecting design tokens.

7. **Update Navigation & URLs**
   - Insert Tools link (or update existing section) in `src/components/Header.tsx` and `Footer.tsx` to surface the Torch Tracker.
   - Verify `urlPaths.tool` usage and adjust sitemap/feed generators if they require explicit tool registration.

8. **Styling & Assets**
   - Add dedicated CSS (if needed) under `src/features/tools/torch_tracker/styles.css` or inline Tailwind classes; ensure reduced-motion variants.
   - Place icons/sounds in `public/tools/torch_tracker/` and document usage in README.

9. **Testing & QA Pass**
   - Run `npm run lint`, `npm run test`, `npm run test:a11y` to confirm coverage.
   - Execute manual QA: add/edit/remove lights, pause/resume, auto-advance toggle, expiration alert, navigation to/from other tools.
   - Capture screenshots/GIFs for release notes.

10. **Documentation & Launch Prep**
    - Update `docs/torchtracker/README.md` (usage guide) and site changelog.
    - Prepare release announcement content, ensure sitemap includes the new route, and verify static export (`npm run build`) succeeds with the tool enabled.

