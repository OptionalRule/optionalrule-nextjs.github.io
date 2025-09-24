# Shadowdark Light Source Tracker — Product Requirements

## 1. Product Context
- **Purpose**: Provide Shadowdark GMs with a lightweight web tool to monitor active light sources, visualize their attributes, and track remaining real-time burn duration during sessions.
- **Form Factor**: Single-page React web application rendered within a Vite bundle; no backend services or persistence.
- **Primary User**: Game Masters (GMs) running live Shadowdark sessions who need fast access to light source status.

## 2. Core Scenarios
- **Add a light source**: GM selects a light type button to add a corresponding card to the active grid.
- **Monitor burn time**: When at least one source is active, a one-hour countdown timer appears and begins running automatically.
- **Pause or reset tracking**: GM can pause, resume, or reset the shared timer as table needs arise.
- **Remove a spent source**: GM dismisses a light source card via its close control, automatically updating the active list (and hiding the timer if none remain).

## 3. Functional Requirements
### 3.1 Light Source Catalog
- **Catalog definition**: `src/types/LightSource.ts` exports the canonical catalog (`lightSources`) of four archetypes (Standard Torch, Oil Lantern, Light Spell, Fire) with metadata fields `id`, `name`, `type`, `brightness`, `duration`, `icon`, `description`, `color`.
- **Extensibility**: Additional archetypes require catalog edits only; UI renders buttons/cards dynamically from the array.

### 3.2 Light Source Instantiation
- **Add control**: `LightSourceManager` renders one primary button per catalog entry with the label `<icon> <name>` and the catalog `color` as background.
- **Instance creation**: Clicking a button clones the archetype and assigns an instance-specific `id` of the form `${catalogId}-${Date.now()}` to guarantee uniqueness even for duplicates.
- **State tracking**: Active instances live in the local React state array `activeLightSources`.

### 3.3 Active Light Source Grid
- **Card rendering**: For every active instance, `LightSourceCard` displays a playing-card styled tile containing:
  - icon, name header, and removable `×` button.
  - catalog description paragraph.
  - Brightness stat visualized as a horizontal progress bar with width equal to `brightness%` and bar color equal to the catalog `color`.
  - Duration stat rendered as immutable text (`<duration> minutes`).
- **Visual theme**: Cards share the `glow-background` class (see `src/App.css`) for a radial gradient and flicker animation, evoking torchlight.
- **Layout**: Cards flow in a responsive CSS grid (`.active-light-sources`) with auto-fitting columns minimum 300px.
- **Removal control**: The `×` button invokes `onRemove` with the instance id, removing it from `activeLightSources`.

### 3.4 Countdown Timer Module
- **Visibility rule**: Timer container renders only when `activeLightSources.length > 0`.
- **Duration source**: Whenever the active list transitions between empty/non-empty, a `useEffect` sets `timerDuration` to `60` minutes when non-empty or `0` otherwise. Current implementation disregards individual light `duration` values—every stack shares a universal 60-minute timer.
- **Component contract**: `CountdownTimer` accepts `initialTimeInMinutes` (defaults to `60` if omitted); here it is supplied via state (`timerDuration`).
- **Initialization**: On mount or when `initialTimeInMinutes` changes, internal `timeLeft` is reset to `minutes * 60` seconds.
- **Auto-start**: If the incoming duration is greater than zero, the timer calls `startTimer` immediately, beginning a one-second interval tick.
- **Tick mechanics**: While running and not paused, `timeLeft` decrements by one second until reaching zero, at which point ticking stops without auto-reset.
- **Controls**: UI exposes `Start` (when idle), `Pause`, `Resume`, and `Reset` buttons. `Reset` restores `timeLeft` to the current `initialTimeInMinutes` and stops the clock.

### 3.5 App Header & Structure
- `App.tsx` renders a static title "Shadowdark Light Source Tracker" above the `LightSourceManager`.
- `main.tsx` boots the app within `<React.StrictMode>`; no routing or multi-page structure exists.

## 4. Non-functional Requirements
- **Technology stack**: React 18 + TypeScript + Vite. Styling via local CSS modules; Tailwind/DaisyUI configuration is present but unused by current components.
- **State scope**: All state is ephemeral and client-side; page refresh clears active light sources and resets the timer.
- **Accessibility**: Buttons rely on text + emoji icons; no ARIA enhancements are present. Keyboard interaction defaults to native button behavior.
- **Performance**: Minimal; operations confined to lightweight React state updates and CSS animations.

## 5. Known Gaps vs. Design Intent
- Cards lack ignited/extinguished toggles, per-light burn tracking, and customizable titles noted in `docs/DesignNotes.md`.
- Theme does not auto-switch between lit/dark states based on active lights.
- Timer length ignores each light source’s catalog `duration` and treats all active lights as a single 60-minute pool.
- `Torch.tsx` and `src/Tourch.css` are unused remnants (no flame animation currently displayed).

## 6. Future Enhancements (Examples)
1. Allow per-card state (ignite/extinguish, accumulated burn time, editable label) and reflect state in visuals.
2. Support different timer strategies (per-instance timers, staggered burn down, or stacked redundancy rules from Shadowdark).
3. Integrate theme switching and ambient informational copy describing effects of total darkness vs. lit areas.
4. Surface light mishap tables or quick-reference rules using contextual popovers.
