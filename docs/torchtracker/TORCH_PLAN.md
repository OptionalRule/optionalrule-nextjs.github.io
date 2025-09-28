# Torch Tracker - Development Plan

Goal: Torch Tracker is a real-time light source management tool for TTRPG groups playing Shadowdark RPG. The app features a unified central timer that governs all active light sources, starting when the first light is added. Players can quickly add light sources (torch, lantern, spell, campfire) from a streamlined catalog in the header, with each source displaying its bright light radius and elapsed time. Individual light sources can be paused/resumed independently while tracking their total active time, and automatically expire when reaching their duration limit. The central timer controls the overall session - when paused, all lights are extinguished; when it reaches zero, all active lights expire and are removed. The interface emphasizes the active light source cards as the primary content, with icon-based controls in a compact header for starting/pausing the clock, and resetting all sources.

For Product Requirements see `docs/torchtracker/TORCH_PRD.md`

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

13. **Removed Unused Features & Data** *(Status: Complete)*
   - When a light source is Removed either manually or by expiring, just remove it entirely from the tracker.  We do not need the Expired Sources tracking functionality. Also remove the expired indicator from the header.
   - Light source cast no Dim light so we want to remove that from the lightsource type, and all relevant data entries. We also want to dremove that from the UI display so only the bright distance shows as the range.  This includes the Brightness Radius test display.
   - Rounds are not a concept in 60 minute timers.  Remove the features that track or advance rounds from the app including in the header, in th expiration explaination text, and from each light source card.  
   - Restore Defaults button on each light card should be removed. We do not need this on each card, it should only be controlled from the header Reset All button.
   - The 'Time active' line in the light source card should only show the time elapsed and not the duration.  
   - The 'Time remaining' display in each light source card should be removed including the values and progress bar.
   - The Next expiration bar is not needed and should be removed. 
   - The central timer should start when the first light source is added and not reset when a new light source is added.

14. **Light Source Card** *(Status: Complete)*
   - **Card Structure & Styling**: Implement playing card dimensions (2.5:3.5 aspect ratio) with dramatic beveled CSS borders and rounded edges using Tailwind classes. Add subtle CSS pattern texture to simulate aged playing card appearance.
   - **Dual-State Design**: Create two visual states - active side with soft animated glow background, inactive side with dark gradient background. Background colors render behind the center image to indicate card state.
   - **Center Images**: Integrate 8 preloaded WebP images from `public/tools/torch_tracker/` following `<type>_<status>.webp` naming convention (campfire, lantern, spell, torch × active/inactive). Create `getImagePath(type, status)` utility function for dynamic path generation. Images take up most card space with text overlays.
   - **Content Layout**: Position title in centered outlined box at top, light radius in cutout box (upper left), timer value in bordered box near bottom. All text elements use solid colored "cutout" boxes with borders overlaying the center image for readability.
   - **Flip Animation**: Implement horizontal card flip (500ms duration) using CSS transforms and Tailwind classes when toggling active/inactive state. Provide fade transition fallback for `prefers-reduced-motion` users.
   - **Interactions**: Card click toggles active/inactive state (removes separate pause controls). Circular X remove button appears at bottom edge on hover. Support keyboard navigation (Space/Enter on focus).
   - **Accessibility**: Add descriptive alt text for images ("Extinguished Torch", "Lit Campfire"). Screen reader announces "Active"/"Inactive" state changes during transitions.
   - **Technical Implementation**: Use pure CSS transforms with Tailwind to avoid additional dependencies. Preload all 8 images on component mount for smooth state transitions. Handle image loading failures with background color fallback.
   - **Testing**: Add component tests for flip animations, state transitions, keyboard interactions, hover states, and image loading scenarios under `__tests__/components.test.tsx`.
   - **Visual Polish**: Add layered glow and flare animations to the lit face plus drifting smoke on the unlit face, all with `prefers-reduced-motion` fallbacks. Apply a fast fade-out animation when removing a card.
   - **Interaction & Timing Notes**: Clicking or pressing Space/Enter flips the card, resumes the light when reactivated, and restarts the central timer if no other sources are active. Remove actions delay briefly to allow the fade-out before dispatching state updates.
   - **Image Optimization**: Render center art with `next/image` for lint compliance while retaining icon fallback when assets fail to load. Asset preloading covers all active/inactive variants for smooth state changes.
   - **Regression Coverage**: Extend component tests to cover removal timing, hidden radius metrics on inactive faces, image fallback, and the new accessibility attributes introduced during implementation.

15. **App Header Improvements** *(Status: Not Started)*
   - **Header Cleanup & Structure**: Remove active sources count span and auto-advance toggle functionality. Simplify header layout to: Title + Play/Pause controls + ADD buttons + Countdown timer. Remove all `autoAdvance` state, toggle controls, and related logic from components and state management.
   
   - **Circular Countdown Timer Implementation**: Create new `CircularCountdownTimer` component with SVG-based circular progress ring displaying remaining time from central timer. Use fiery red color (`text-red-600` equivalent) for progress ring that shrinks as time decreases. Display remaining time in MM:SS format centered within circle. Show "00:00" when no timer is active. Implement smooth animation for progress ring updates.
   
   - **Mobile Responsiveness & Layout**: Implement responsive design using existing app mobile breakpoint (`md:` in Tailwind). Desktop: Timer positioned on right side of header row. Mobile: Timer moves below header/helper text area (similar to current count span positioning). ADD buttons become circular with Unicode symbols only on mobile, retain current desktop text style. Ensure both ADD buttons and countdown timer scale appropriately for small screens.
   
   - **Accessibility Enhancements**: Add proper ARIA labels and screen reader support. Mobile circular ADD buttons use `title` attribute with full desktop text for hover tooltips. Implement timer announcements via `aria-live` region that announces remaining time every 10 minutes. Ensure countdown text respects dark/light mode for readability while progress ring maintains consistent fiery red color.
   
   - **State Management Updates**: Remove `autoAdvance` from state interface, reducer actions, and all related conditional logic. Add countdown calculation helper `getRemainingTime(centralTimer)` for converting elapsed time to remaining time display. Maintain existing central timer behavior: starts with first active light source, expires all lights when reaching zero.
   
   - **Component Integration & Testing**: Add comprehensive test coverage for new `CircularCountdownTimer` component including rendering, time updates, responsive behavior, and accessibility features. Update existing header tests to reflect removed elements (count span, auto-advance toggle). Test responsive layout switching between desktop and mobile views. Verify timer state handling for active/inactive/expired scenarios and proper screen reader announcements.