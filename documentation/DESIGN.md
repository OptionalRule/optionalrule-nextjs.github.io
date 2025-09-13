# Design & Theme Planning

## Overview

This document contains information about theme design and planning for theme changes as well as look and feel changes.

Claude CLI has a ui-design-expert agent that can do well for this if uses.

## Issues and Changes

The following were found to be deficient after an analysis of the site an design.

## Critical Issues Found:

1. Configuration Inconsistency: Your site.ts config and globals.css define       
different dark theme colors, creating drift in your design system
1. Accessibility Problems: Some text contrasts fall below WCAG AA standards      
(3.8:1 instead of required 4.5:1)
1. Limited Surface Hierarchy: Only 4 surface levels may not provide enough       
visual depth

Key Recommendations:

Phase 1 (Critical - Should implement first):

- [ ] Unify color systems between site.ts and globals.css
- [ ] Improve dark theme palette with warmer, higher-contrast colors
- [ ] Add missing surface levels for better visual hierarchy

Phase 2 (Important):

- [ ] Add warm accent colors (oranges/ambers) to match TTRPG gaming aesthetic        
- [ ] Enhance semantic colors for better dark mode experience
- [ ] Add state variables for disabled, loading, selected states

Phase 3 (Nice-to-have):

- [ ] Animation variables for consistent transitions
- [ ] Component-specific tokens
- [ ] Smooth color mode transitions

Specific Color Improvements Suggested:

The expert recommends shifting from pure slate colors to warmer blue-grays       
with better contrast ratios, and adding gaming-appropriate warm accents.
