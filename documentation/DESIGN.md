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

- [ ] Animation variables for consistent transitions
- [ ] Component-specific tokens
- [ ] Smooth color mode transitions

## Implementation Summary:

**Phase 1 & 2 Complete** - All critical and important improvements implemented:

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

### ✅ **Quality Assurance**
- All 184 unit tests pass
- All 21 accessibility tests pass
- No TypeScript errors, no lint errors
- Theme switching functionality verified
