# Shadowdark Torch Tracker - Development Plan

## Development Plan

1. **Scaffold Feature Module** *(Status: Complete)*
   - Create `src/features/tools/torch_tracker/` with `components/`, `hooks/`, `lib/`, `data/`, and `__tests__/` subdirectories plus `index.tsx` entry point.
   - Stub `index.tsx` with client component wrapper exporting `<TorchTracker />` placeholder and default styles hook-up.

2. **Author Data Models & Catalog** *(Status: Complete)*
   - Implement `types.ts` defining `TorchCatalogEntry`, `ActiveLightSource`, reducer action types, and selectors.
   - Populate `data/lightSources.ts` with canonical Shadowdark light sources and a `createCustomLightSource` helper.
   - Add `lib/catalog.ts` utilities (clone, defaults, validation) with unit tests executed via the shared `vitest.unit.config.ts` configuration to stay aligned with `docs/testing-strategy.md`.

3. **Build State Management Hooks** *(Status: Complete)*
   - Implemented `hooks/useTorchTrackerState.ts` with a typed reducer, action controller helpers, and memoized selectors wired to catalog utilities.
   - Added Vitest coverage for reducer transitions (`add`, `update`, `remove`, `expire`, `pause`, `resume`, `reset`, `tick`) under `__tests__/state.test.ts`, running through `npm run test` (Vitest unit suite).
   - Created `hooks/useGameClock.ts` to provide interval/requestAnimationFrame ticking helpers that integrate with the reducer’s timing semantics.

4. **Construct UI Components** *(Status: Complete)*
   - Implemented catalog controls (`CatalogButton`, `CatalogPanel`), active card (`ActiveLightCard`), expired tray, global header, and layout scaffolding with Tailwind tokens and accessible labelling.
   - Added component tests in `__tests__/components.test.tsx` to verify interaction callbacks, switch semantics, and empty states via Testing Library + Vitest.

5. **Wire Feature Entry Point** *(Status: Complete)*
   - Composed the feature in `index.tsx`, wiring state hooks, catalog interactions, auto-advance clock integration, and insights output with the new components.
   - `TorchTracker` exports a client component that manages add/pause/resume/reset/remove flows, global toolbar actions (play/pause, advance round, reset all, auto-advance toggle), and renders catalog/active/expired sections via `TorchTrackerLayout`.

6. **Integrate With App Router** *(Status: Complete)*
   - Added `src/app/(interactive)/tools/torch_tracker/page.tsx` generating metadata via `generateMetadata` with canonical from `urlPaths.tool('torch_tracker')`.
   - Implemented `TorchTrackerClient.tsx` to dynamically import the feature (`ssr: false`) with a lightweight loading fallback aligned to site styling.

7. **Update Navigation & URLs** *(Status: Complete)*
   - Updated header and footer navigation to include `urlPaths.tool('torch_tracker')`, surfacing the feature alongside other tools.
   - Confirmed route helpers rely on `urlPaths.tool`, keeping canonical URLs consistent for sitemap/feed generation.

8. **Styling & Assets**
   - Add dedicated CSS (if needed) under `src/features/tools/torch_tracker/styles.css` or inline Tailwind classes; ensure reduced-motion variants.
   - Place icons/sounds in `public/tools/torch_tracker/` and document usage in README.

9. **Testing & QA Pass**
   - Run `npm run lint`, `npm run test` (Vitest unit suite via `vitest.unit.config.ts`), and `npm run test:a11y` per the repository testing cadence.
   - Execute manual QA: add/edit/remove lights, pause/resume, auto-advance toggle, expiration alert, navigation to/from other tools.
   - Capture screenshots/GIFs for release notes.

10. **Documentation & Launch Prep**
    - Update `docs/torchtracker/README.md` (usage guide) and site changelog.
    - Prepare release announcement content, ensure sitemap includes the new route, and verify static export (`npm run build`) succeeds with the tool enabled.

11. **Central Timer & Small Changes** *(Status: Complete)*
   - The Header Title and link should remove mentions of Shadowrun and be called "Torch Tracker" instead.
   - A single timer should govern all of the light sources that begins when the first light soruce is added. The single timer should be presented in the Header.
   - When the central timer runs out, all light sources made inactive and moved to the expired. 
   - Each individual lightsource should track total time active for convienence.
   - When an individual lightsource is paused it is marked as inactive and the total time active is paused too.
   - When an individual lightsource reaches it's total time active, it becomes inactive and moved to expended.
   - Pausing the central timer extinguishes all light sources.

12. **Consolodated Header & Catalog** *(Status: Complete)*
   - The Catalog section should be simplified.  Give it an ID of catalog so it can be differentiated. It should contain only only the label 'Add:' Followed by buttons for each type of light source by title.  Other details abouit time burning, short description, and notes should appear as a mouseover popup.
   - The Catalog section should be moved into the header as a bar to save space.  We want the main content of the page to be the light soruce cards. 
   - The Header buttonss should use lucide-react icons instead of text and the text should appear as mouseover help text.  Start Clock should use circle-start, Pause Clock should use circle-pause, Advance Round use skip-forward, Reset All use timer-reset.

13. **Removed Unused Features & Data**
   - When a light source is Removed either manually or by expiring, just remove it entirely from the tracker.  We do not need the Expired Sources tracking functionality. Also remove the expired indicator from the header.
   - Light source cast no Dim light so we want to remove that from the lightsource type, and all relevant data entries. We also want to dremove that from the UI display so only the bright distance shows as the range.  This includes the Brightness Radius test display.
   - Rounds are not a concept in 60 minute timers.  Remove the features that track or advance rounds from the app including in the header, in th expiration explaination text, and from each light source card.  
   - Restore Defaults button on each light card should be removed. We do not need this on each card, it should only be controlled from the header Reset All button.
   - The 'Time active' line in the light source card should only show the time elapsed and not the duration.  
   - The 'Time remaining' display in each light source card should be removed including the values and progress bar.
   - The Next expiration bar is not needed and should be removed. 
   - The central timer should start when the first light source is added and not reset when a new light source is added.
