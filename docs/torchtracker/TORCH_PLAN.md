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

15. **App Header Improvements** *(Status: Completed)*
   - **Header Cleanup & Structure**: Remove active sources count span and auto-advance toggle functionality. Simplify header layout to: Title + Play/Pause controls + ADD buttons + Countdown timer. Remove all `autoAdvance` state, toggle controls, and related logic from components and state management.
   
   - **Circular Countdown Timer Implementation**: Create new `CircularCountdownTimer` component with SVG-based circular progress ring displaying remaining time from central timer. Use fiery red color (`text-red-600` equivalent) for progress ring that shrinks as time decreases. Display remaining time in MM:SS format centered within circle. Show "00:00" when no timer is active. Implement smooth animation for progress ring updates.
   
   - **Mobile Responsiveness & Layout**: Implement responsive design using existing app mobile breakpoint (`md:` in Tailwind). Desktop: Timer positioned on right side of header row. Mobile: Timer moves below header/helper text area (similar to current count span positioning). ADD buttons become circular with Unicode symbols only on mobile, retain current desktop text style. Ensure both ADD buttons and countdown timer scale appropriately for small screens.
   
   - **Accessibility Enhancements**: Add proper ARIA labels and screen reader support. Mobile circular ADD buttons use `title` attribute with full desktop text for hover tooltips. Implement timer announcements via `aria-live` region that announces remaining time every 10 minutes. Ensure countdown text respects dark/light mode for readability while progress ring maintains consistent fiery red color.
   
   - **State Management Updates**: Remove `autoAdvance` from state interface, reducer actions, and all related conditional logic. Add countdown calculation helper `getRemainingTime(centralTimer)` for converting elapsed time to remaining time display. Maintain existing central timer behavior: starts with first active light source, expires all lights when reaching zero.
   
   - **Component Integration & Testing**: Add comprehensive test coverage for new `CircularCountdownTimer` component including rendering, time updates, responsive behavior, and accessibility features. Update existing header tests to reflect removed elements (count span, auto-advance toggle). Test responsive layout switching between desktop and mobile views. Verify timer state handling for active/inactive/expired scenarios and proper screen reader announcements.

16. **Start & Reset Button Changes** *(Status: Completed)*
   - **Icon Updates**: Replace the Start button's current double-circle icon with the Lucide React `Play` icon to provide clearer visual indication of the play function. Maintain the same circular button styling and size for consistency with existing header controls.
   
   - **Skip Forward Button Implementation**: Add new circular button using Lucide React `FastForward` icon positioned after the Reset All button in the control group. Button should match existing control button styling (same size, circular design, visual grouping). Implement "Skip 1 min" functionality with tooltip text on mouseover.
   
   - **Skip Forward Functionality**: Create `advanceTimer` action in reducer that simultaneously reduces central timer remaining time by 60 seconds AND advances elapsed time on each active light source by 60 seconds. If advancing would make central timer reach zero or go negative, set timer to zero and trigger normal expiration behavior (extinguish and remove all active lights).
   
   - **Button State Management**: Implement conditional button states - disable Skip Forward button when no lights are active or when central timer is paused. Button remains enabled even when less than 1 minute remains (will trigger immediate expiration). Ensure proper visual feedback for disabled states using existing Tailwind disabled styling patterns.
   
   - **Visual Grouping & Layout**: Group all three control buttons (Play/Pause, Reset All, Skip Forward) together visually in header using consistent spacing and styling. Maintain existing responsive behavior where buttons use icon-only display on both desktop and mobile. Ensure proper keyboard navigation order through the control group.
   
   - **State Integration & Testing**: Add `advanceTimer` action to reducer with comprehensive test coverage for edge cases (timer expiration, disabled states, light source elapsed time updates). Update existing header component tests to include new button interactions and state management. Verify proper tooltip display and accessibility attributes for the new Skip Forward button.

17. **Local Persistence & Small Changes** *(Status: Pending)*
    - **Header Text Update**: Change subtitle text to "Manage your party's light sources in real time. Add a light to begin." for clearer action-oriented messaging.

    - **Persistent State Implementation**: Add localStorage-based state persistence to prevent data loss on page refresh/close during active sessions. All active light sources, central timer state, and settings should be saved and restored automatically.

    - **Persistence Toggle Control**: Add toggle button in header (suggest: "Save Session" or "Auto-Save") that controls localStorage persistence. Toggle should be active by default. When deactivated, immediately clear all saved state from localStorage. Button should use appropriate Lucide icon (e.g., `Save` when active, `SaveOff` when inactive).

    - **State Management Integration**: Implement `useEffect` hooks to sync state changes to localStorage when persistence toggle is enabled. On component mount, check for saved state and restore if valid. Add state versioning to handle future schema changes gracefully.

    - **Button State Logic - Start/Pause Button**:
      - **Disabled when**: No light sources exist in tracker
      - **Enabled when**: Light sources exist AND (tracker is paused OR inactive lights can be restarted)
      - Button shows `Play` icon when paused/stopped, `Pause` icon when running

    - **Button State Logic - Reset Button**:
      - **Disabled when**: No light sources exist in tracker
      - **Enabled when**: One or more light sources are present (active or inactive)
      - Clicking should prompt confirmation before clearing all state

    - **Visual Feedback**: Ensure disabled buttons use appropriate opacity and cursor styles. Add tooltip text explaining why buttons are disabled when applicable (e.g., "No lights to reset" when Reset is disabled).

    - **Testing Coverage**: Add tests for localStorage persistence (save/restore/clear), button enable/disable logic for various state combinations, persistence toggle behavior, and edge cases (corrupted localStorage data, quota exceeded errors).

## UI/UX Enhancement Plan

Based on design analysis of the current implementation, the following phased improvements will enhance visual hierarchy, polish, accessibility, and overall user experience. Each phase targets specific areas while maintaining backward compatibility with existing functionality.

### Phase 1: Control Hierarchy & Visual Clarity *(Priority: High)*

**Goal**: Improve button hierarchy and visual feedback to make primary actions more obvious and provide better state communication to users.

#### 1.1 Control Button Visual Hierarchy
- **Primary Action Styling**: Make Play/Pause button visually prominent as the primary control
  - Increase size from `h-11 w-11` to `h-14 w-14` for Play/Pause button only
  - Apply accent color background (`bg-[var(--accent-warm)]`) when active/enabled
  - Use hover state with `hover:bg-[var(--accent-warm-hover)]`
  - Keep border styling but make it more pronounced for the primary button

- **Secondary Action Styling**: Maintain current size for Reset, Skip, and Save buttons
  - Keep existing neutral color scheme for secondary actions
  - Ensure consistent spacing between all control buttons

- **Color Coding** (optional enhancement):
  - Consider subtle color hints: Play (green accent), Pause (amber), Reset (red tint), Skip (blue), Save (neutral)
  - Implement only if it improves usability without creating visual clutter

**Implementation**: Modify [TorchTrackerHeader.tsx](src/features/tools/torch_tracker/components/TorchTrackerHeader.tsx:85-133) button styling classes.

**Testing**: Verify button hierarchy is clear in both light and dark modes. Test that disabled states remain visually distinct.

#### 1.2 Countdown Timer Enhancement
- **Dynamic Color States**: Implement urgency-based color coding for the timer progress ring
  - **>50% remaining**: Blue/neutral (`var(--accent)` - #2563eb)
  - **25-50% remaining**: Amber warning (`var(--accent-warm)` - #ea580c)
  - **<25% remaining**: Red alert (`var(--error)` - #dc2626)
  - **<10% remaining**: Add subtle pulsing animation to red state (respects `prefers-reduced-motion`)

- **Size Adjustment**: Increase default timer size from 104px to 120px on desktop for better prominence
  - Keep mobile size responsive and appropriate for smaller screens
  - Ensure timer remains visually balanced in header layout

**Implementation**: Modify [CircularCountdownTimer.tsx](src/features/tools/torch_tracker/components/CircularCountdownTimer.tsx:15-19) color logic and size props.

**Testing**: Test color transitions at various time thresholds. Verify pulsing animation has proper reduced-motion fallback.

#### 1.3 Focus Ring Enhancement
- **Visibility Improvement**: Strengthen keyboard focus indicators across all interactive elements
  - Increase focus ring width from default to 3px
  - Use higher contrast color (`--focus-ring` with increased opacity)
  - Ensure focus rings are visible against all background colors
  - Add focus-visible states to all catalog buttons, control buttons, and cards

**Implementation**: Update focus-visible styles in [TorchTrackerHeader.tsx](src/features/tools/torch_tracker/components/TorchTrackerHeader.tsx), [CatalogButton.tsx](src/features/tools/torch_tracker/components/CatalogButton.tsx), and [ActiveLightCard.tsx](src/features/tools/torch_tracker/components/ActiveLightCard.tsx).

**Testing**: Navigate entire interface with keyboard only. Verify focus indicators are always visible and properly positioned.

### Phase 2: Empty State & First-Time Experience *(Priority: High)*

**Goal**: Create a more inviting and instructional empty state that guides new users toward their first action.

#### 2.1 Enhanced Empty State Design
- **Visual Elements**:
  - Add flame icon (🔥 or Lucide `Flame` icon) centered above text
  - Increase icon size to 48px for better visual presence
  - Add subtle glow effect around icon using CSS

- **Improved Messaging**:
  - Primary text: "🔥 **Light up the dungeon!**" (bold, larger font)
  - Secondary text: "Choose a light source from above to begin tracking" (smaller, muted color)
  - Remove generic "No active lights yet" text

- **Optional Enhancement**: Ghost Card Preview
  - Show semi-transparent example card (opacity: 0.3) in the grid
  - Label it with "Your lights will appear here" overlay
  - Consider if this adds value without cluttering the empty state

**Implementation**: Modify empty state rendering in [index.tsx](src/features/tools/torch_tracker/index.tsx:248-252).

**Testing**: Verify empty state appears correctly on initial load. Test responsive behavior on mobile devices.

#### 2.2 Tutorial Button Enhancement
- **Positioning**: Ensure "Quick Tutorial" button is visually distinct
- **Styling**: Consider subtle pulsing animation on first visit (using localStorage flag)
- **Content**: Link tutorial to comprehensive help documentation when available

**Implementation**: Enhance tutorial button in [TorchTrackerHeader.tsx](src/features/tools/torch_tracker/components/TorchTrackerHeader.tsx:66-74).

### Phase 3: Card Design Refinements *(Priority: Medium)*

**Goal**: Improve card readability, color balance, and responsive spacing for better visual flow.

#### 3.1 Card Typography & Contrast
- **Background Opacity Enhancement**:
  - Increase opacity on `.torch-card-label`, `.torch-card-metric`, and `.torch-card-timer` backgrounds
  - Change from `rgba(8, 5, 3, 0.75)` to `rgba(8, 5, 3, 0.85)` for better text contrast
  - Ensure text meets WCAG AA contrast standards (4.5:1 minimum)

- **Dark Mode Compatibility**:
  - Test card text colors against dark mode backgrounds
  - Adjust card gradient overlays if needed for better dark mode appearance
  - Consider using CSS custom properties for card text colors to respect theme

**Implementation**: Modify [styles.css](src/features/tools/torch_tracker/styles.css:311-334) for card label/timer backgrounds.

**Testing**: Test contrast ratios using browser dev tools. Verify readability in both light and dark modes.

#### 3.2 Inactive Card Visual Distinction
- **Color Temperature Shift**:
  - Adjust inactive card gradient from warm browns to cooler grays/blues
  - Change `.torch-card-face--inactive` background gradient:
    - From: `radial-gradient(circle at 60% 30%, rgba(44, 32, 28, 0.95), rgba(8, 6, 5, 0.95))`
    - To: `radial-gradient(circle at 60% 30%, rgba(28, 32, 44, 0.95), rgba(5, 6, 8, 0.95))`
  - Makes "extinguished" state more dramatically different from active

**Implementation**: Update [styles.css](src/features/tools/torch_tracker/styles.css:127-130) inactive card gradient.

**Testing**: Compare active and inactive card states side by side. Verify flip animation shows clear visual difference.

#### 3.3 Responsive Grid Spacing
- **Mobile Spacing Improvement**:
  - Increase gap between cards on mobile from `gap-4` (1rem) to `gap-6` (1.5rem)
  - Desktop spacing increases from `gap-4` to `gap-6` on md breakpoint and `gap-8` on lg breakpoint
  - Provides better breathing room and touch target separation

- **Touch Target Optimization**:
  - Verify all interactive elements meet 44×44px minimum (currently compliant ✓)
  - Ensure adequate spacing around remove button on mobile

**Implementation**: Modify grid classes in [index.tsx](src/features/tools/torch_tracker/index.tsx:253).

**Testing**: Test on various mobile devices and screen sizes. Verify cards don't feel cramped on tablets.

### Phase 4: Catalog & Header Polish *(Priority: Medium)*

**Goal**: Improve catalog button visual presentation and header layout consistency.

#### 4.1 Catalog Section Visual Enhancement
- **"Add:" Label Styling**:
  - Convert plain text to styled badge/pill element
  - Apply subtle background color (`bg-[var(--surface-2)]`)
  - Add padding and border-radius for badge appearance
  - Ensure vertical alignment with catalog buttons

- **Section Divider**:
  - Add subtle vertical divider between control buttons and catalog section
  - Use border or background gradient for visual separation
  - Ensure divider respects responsive layout (hidden on mobile if needed)

**Implementation**: Modify catalog rendering in [TorchTrackerHeader.tsx](src/features/tools/torch_tracker/components/TorchTrackerHeader.tsx:135).

**Testing**: Verify catalog section looks intentional and well-integrated in header. Test responsive behavior.

#### 4.2 Mobile Catalog Button Context
- **Icon-Only Enhancement**:
  - Current mobile buttons show only icons (🔥, etc.) which is good for space
  - Ensure tooltips (`title` attribute) provide full context on hover/long-press
  - Consider micro-labels below icons if user testing shows confusion
  - Example: "🔥\nTorch" with smaller text below icon

**Implementation**: Evaluate current [CatalogButton.tsx](src/features/tools/torch_tracker/components/CatalogButton.tsx) mobile behavior and adjust if needed.

**Testing**: Conduct usability testing on mobile devices. Verify tooltips appear on long-press.

#### 4.3 Header Title Hierarchy
- **Size Adjustment**:
  - Increase title from `text-2xl` (24px) to `text-3xl` (30px) for better prominence
  - Keep uppercase and letter-spacing for thematic consistency
  - Ensure subtitle maintains proper hierarchy (smaller, muted color)

- **Subtitle Line Height**:
  - Increase line-height from default to `leading-relaxed` for better readability
  - Provides more breathing room in multi-line subtitle text

**Implementation**: Modify heading classes in [TorchTrackerHeader.tsx](src/features/tools/torch_tracker/components/TorchTrackerHeader.tsx:59-64).

**Testing**: Test header layout on various screen sizes. Ensure title doesn't wrap awkwardly on mobile.

### Phase 5: Animation & Performance Optimization *(Priority: Low)*

**Goal**: Optimize animations for smoother performance and better visual polish.

#### 5.1 Animation Performance Enhancements
- **GPU Acceleration Hints**:
  - Add `will-change: transform, opacity` to animated card elements
  - Apply to `.torch-card-glow`, `.torch-card-flare`, and `.torch-card-smoke`
  - Remove `will-change` after animation completes to avoid memory overhead

- **Animation Complexity Reduction**:
  - Consider media query for lower-end devices
  - Reduce animation frequency or complexity on devices with limited GPU
  - Maintain accessibility with `prefers-reduced-motion` (already implemented ✓)

**Implementation**: Add `will-change` declarations to [styles.css](src/features/tools/torch_tracker/styles.css:144-200) animated elements.

**Testing**: Test on various devices and browsers. Monitor frame rates and GPU usage.

#### 5.2 Timer Update Frequency
- **Announcement Interval Adjustment**:
  - Current: Announces every 10 minutes
  - Consider: Adjust to every 5 minutes for better user awareness
  - Alternative: Announce at specific thresholds (30min, 15min, 10min, 5min, 1min)

- **Visual Update Smoothness**:
  - Verify timer progress ring updates smoothly (already implemented with CSS transitions ✓)
  - Ensure no visual jank during rapid state changes

**Implementation**: Modify announcement logic in [CircularCountdownTimer.tsx](src/features/tools/torch_tracker/components/CircularCountdownTimer.tsx:64-80).

**Testing**: Monitor timer over extended session. Verify announcements are helpful without being intrusive.

### Phase 6: Accessibility & Screen Reader Enhancements *(Priority: Medium)*

**Goal**: Enhance screen reader experience and improve accessibility beyond current WCAG compliance.

#### 6.1 Enhanced State Announcements
- **Card Flip Announcements**:
  - Current: Announces "Active" / "Inactive" state changes ✓
  - Enhancement: Add more descriptive announcements
    - "Torch relit and burning" (when activated)
    - "Torch extinguished" (when paused)
    - Include remaining time in announcement

- **Timer Expiration Alerts**:
  - Add assertive announcement when any light source expires
  - Example: "Torch expired after 60 minutes"
  - Use `aria-live="assertive"` for critical expiration events

**Implementation**: Enhance announcements in [ActiveLightCard.tsx](src/features/tools/torch_tracker/components/ActiveLightCard.tsx:40-42) and add expiration announcements to state controller.

**Testing**: Test with screen readers (NVDA, JAWS, VoiceOver). Verify announcements are clear and timely.

#### 6.2 Keyboard Navigation Enhancements
- **Navigation Order**:
  - Verify logical tab order through header controls → catalog buttons → light cards
  - Ensure remove buttons are accessible via keyboard (currently implemented ✓)
  - Test skip navigation links for complex interactions

- **Keyboard Shortcuts** (optional future enhancement):
  - Consider adding keyboard shortcuts for common actions
  - Example: Space = toggle clock, R = reset, etc.
  - Document shortcuts in help section

**Implementation**: Test current keyboard navigation and document any gaps. Implement shortcuts only if user research supports need.

**Testing**: Navigate entire app using only keyboard. Test with screen reader keyboard commands.

### Implementation Strategy

**Recommended Phased Rollout**:

1. **Quick Wins** (1-2 hours): Phase 1 (Sections 1.1, 1.3) + Phase 2.1
   - Immediate visual impact with button hierarchy and empty state
   - Low risk, high user-facing value

2. **Visual Polish** (2-3 hours): Phase 1.2 + Phase 3 (all sections)
   - Timer color states and card refinements
   - Noticeable quality improvements

3. **Layout Refinements** (1-2 hours): Phase 4 (all sections)
   - Catalog styling and header hierarchy
   - Completes visual consistency

4. **Advanced Enhancements** (2-4 hours): Phase 5 + Phase 6
   - Performance optimizations and accessibility
   - Polish for production readiness

**Testing Requirements**: After each phase, verify:
- Light and dark mode appearance
- Responsive behavior across breakpoints (mobile, tablet, desktop)
- Keyboard navigation and focus states
- Screen reader announcements (if accessibility changes)
- Browser compatibility (Chrome, Firefox, Safari, Edge)

**Rollback Strategy**: Each phase is independent and can be reverted without affecting other changes. Use git commits per phase for easy rollback if issues arise.

## Bugs

The following bugs have been noticed.

- Reset button leaves lightsources on the board, all timers are at 0, do not restart, and cannot be started.