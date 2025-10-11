<!-- 894886eb-6781-489a-8476-b24caa42abff 46d6fb2a-0a15-44f0-b413-eaf974e8919f -->
# Add High Score Reset Feature

## Overview

Add a "(reset)" link next to the "HIGH:" label in the ScorePanel that triggers a confirmation modal, allowing users to clear their saved high score.

## Implementation Steps

### 1. Create Confirmation Modal Component

Create a new reusable modal component at `src/features/games/asteroids/components/ConfirmModal.tsx`:

- Simple centered modal overlay with dark backdrop
- Accept props: `isOpen`, `title`, `message`, `onConfirm`, `onCancel`
- Include "Confirm" and "Cancel" buttons
- Match the retro game aesthetic with mono font and neon colors
- Close on backdrop click or Cancel button
- Keyboard accessible (Escape to close)

### 2. Add clearHighScore Method to AsteroidsEngine

Update `src/features/games/asteroids/engine/AsteroidsEngine.ts`:

- Add public `clearHighScore()` method that:
- Removes the `asteroids_highscore` item from localStorage
- Updates `this.gameState.highScore` to 0
- Calls `this.events.onGameStateChange(this.gameState)` to notify React

### 3. Expose clearHighScore in useAsteroids Hook

Update `src/features/games/asteroids/hooks/useAsteroids.ts`:

- Add `clearHighScore` callback that calls `engineRef.current?.clearHighScore()`
- Include it in the `UseAsteroidsReturn` interface
- Return it from the hook

### 4. Update ScorePanel with Reset Button

Update `src/features/games/asteroids/components/ScorePanel.tsx`:

- Add optional `onResetHighScore` prop to `ScorePanelProps`
- Add state to manage modal visibility
- Modify the HIGH score row (lines 34-41):
- Change label from `"HIGH:"` to `"HIGH: "` with an inline reset button
- Style reset button as `"(reset)"` in muted color, clickable, with hover effect
- Only show reset button if `gameState.highScore > 0` and `onResetHighScore` is provided
- Add `<ConfirmModal>` component at end of JSX
- Handle confirmation by calling `onResetHighScore()` and closing modal

### 5. Wire Up the Feature

Update `src/features/games/asteroids/components/GameUI.tsx`:

- Accept `onResetHighScore` prop in `GameUIProps`
- Pass it through to `<ScorePanel>`

Update `src/features/games/asteroids/index.tsx`:

- Get `clearHighScore` from `useAsteroids()` hook
- Pass `onResetHighScore={clearHighScore}` to `<GameUI>`

## Key Files Modified

- `src/features/games/asteroids/components/ConfirmModal.tsx` (new)
- `src/features/games/asteroids/engine/AsteroidsEngine.ts`
- `src/features/games/asteroids/hooks/useAsteroids.ts`
- `src/features/games/asteroids/components/ScorePanel.tsx`
- `src/features/games/asteroids/components/GameUI.tsx`
- `src/features/games/asteroids/index.tsx`

## Design Decisions

- Reset link appears inline after "HIGH:" label for discoverability
- Only visible when high score > 0 (no need to reset if already 0)
- Confirmation modal prevents accidental resets
- Modal styled to match game's retro aesthetic
- Component reusable for future confirmation needs in the game

### To-dos

- [ ] Create ConfirmModal component with retro styling
- [ ] Add clearHighScore method to AsteroidsEngine
- [ ] Expose clearHighScore in useAsteroids hook
- [ ] Add reset button and modal to ScorePanel
- [ ] Wire up reset functionality through GameUI and AsteroidsGame