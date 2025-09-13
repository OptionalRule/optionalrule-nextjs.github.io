# Design & Theme Planning

## Overview

This document contains information about theme design and planning for theme changes as well as look and feel changes.

Claude CLI has a ui-design-expert agent that can do well for this if uses.

## Issues and Changes

The following were found to be deficient after an analysis of the site and design.

## Critical Issues Found (RESOLVED):

1. ✅ **Configuration Inconsistency**: site.ts config and globals.css defined different dark theme colors - **FIXED**: Removed unused theme config from site.ts, globals.css is now single source of truth
2. ✅ **Accessibility Problems**: Text contrasts fell below WCAG AA standards (3.8:1 instead of required 4.5:1) - **FIXED**: All text now meets ≥4.5:1 contrast ratios
3. ✅ **Limited Surface Hierarchy**: Only 4 surface levels - **FIXED**: Added 5-level surface hierarchy with `surface-4` and enhanced card variants

Key Recommendations:

Phase 1 (Critical - Should implement first):

- [x] Unify color systems between site.ts and globals.css
- [x] Improve dark theme palette with warmer, higher-contrast colors
- [x] Add missing surface levels for better visual hierarchy

Phase 2 (Important):

- [x] Add warm accent colors (oranges/ambers) to match TTRPG gaming aesthetic
- [x] Enhance semantic colors for better dark mode experience
- [x] Add state variables for disabled, loading, selected states

Phase 3 (Nice-to-have):

- [x] Animation variables for consistent transitions - **PRIORITY: HIGH**
- [ ] Component-specific tokens - **PRIORITY: LOW** (skip unless specific need identified)
- [x] Smooth color mode transitions - **PRIORITY: HIGH**

## Implementation Summary:

**Phase 1, 2 & 3 Complete** - All critical, important, and polish improvements implemented:

### ✅ **Unified Color System**
- Removed conflicting theme config from site.ts
- globals.css now single source of truth for all colors
- Clean Tailwind CSS v4 integration via @theme inline

### ✅ **Enhanced Dark Theme**
- Warmer blue-gray backgrounds (`#0c1220`, `#1a2332`, `#243447`, `#2e455c`, `#3a5670`)
- Improved text contrast ratios (all ≥4.5:1 WCAG AA compliant)
- 5-level surface hierarchy for better visual depth
- Softer brand colors (`#5b9eff` links, `#4285ff` accent)

### ✅ **TTRPG Gaming Personality**
- **Warm accents**: Orange colors (`accent-warm` - `#ff8c42` dark / `#ea580c` light)
- **Mystical accents**: Purple colors (`accent-mystical` - `#8b5cf6` dark / `#7c3aed` light)
- **Enhanced semantics**: Better success/warning/error colors for dark mode
- **State variables**: Disabled, loading, selected, hover states

### ✅ **Performance & Animation System**
- **Fast animations**: 0.15s-0.4s durations with GPU-accelerated properties
- **Smooth theme transitions**: Polished color switching without jarring jumps
- **Accessibility**: Full `prefers-reduced-motion` support for users with motion sensitivities
- **Performance-first**: Only transitions `background-color`, `border-color`, `color`, `box-shadow`

### ✅ **Available Animation Tokens**:
- `--transition-fast` (0.15s): Hover states, button presses
- `--transition-normal` (0.25s): Modal open/close, dropdowns
- `--transition-slow` (0.4s): Page transitions, large movements
- `--ease-smooth`, `--ease-swift`, `--ease-bounce`: Performance-optimized easing curves

### ✅ **Quality Assurance**
- All 184 unit tests pass
- All 21 accessibility tests pass
- No TypeScript errors, no lint errors
- Theme switching functionality verified
- Performance tested - no degradation detected

## Phase 3 Detailed Plan:

### **🚀 HIGH PRIORITY: Animation Variables**
**Goal**: Fast, subtle animations for better UX without performance impact

**Implementation**:
```css
/* Performance-optimized animation tokens */
--transition-fast: 0.15s ease-out;        /* Hover states, button presses */
--transition-normal: 0.25s ease-in-out;   /* Modal open/close, dropdowns */
--transition-slow: 0.4s ease-in-out;      /* Page transitions, large movements */

/* Easing curves optimized for performance */
--ease-smooth: cubic-bezier(0.25, 0.46, 0.45, 0.94);  /* Subtle, natural */
--ease-swift: cubic-bezier(0.55, 0.055, 0.675, 0.19); /* Fast start */
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55); /* Playful (sparingly) */
```

**Performance Focus**:
- Use `transform` and `opacity` only (GPU accelerated)
- Avoid animating `width`, `height`, `padding`, `margin`
- `will-change` property only when needed
- `prefers-reduced-motion` media query support

### **🚀 HIGH PRIORITY: Smooth Theme Transitions**
**Goal**: Polished theme switching without jarring color jumps

**Implementation Strategy**:
```css
/* Transition all CSS variables smoothly */
:root {
  transition:
    background-color var(--transition-normal),
    color var(--transition-normal);
}

/* Specific elements that benefit from theme transitions */
.theme-transition {
  transition:
    background-color var(--transition-normal),
    border-color var(--transition-normal),
    color var(--transition-normal);
}
```

**Performance Considerations**:
- Limit transitions to essential elements only
- Use `transition-property` instead of `transition: all`
- Test on mobile devices for performance
- Debounce theme toggle to prevent multiple rapid switches

### **🔽 LOW PRIORITY: Component-Specific Tokens**
**Status**: Skip unless specific styling inconsistencies are identified

**Future Consideration**: If components like buttons, cards, or modals show styling inconsistencies, add targeted tokens:
```css
/* Example - only if needed */
--button-padding-x: 1rem;
--button-padding-y: 0.5rem;
--card-border-radius: 0.5rem;
```

### **📋 Implementation Order**:
1. **Animation variables** - Add to globals.css with performance focus
2. **Theme transitions** - Implement smooth color transitions
3. **Performance testing** - Verify no performance degradation on mobile
4. **Accessibility** - Ensure `prefers-reduced-motion` support
