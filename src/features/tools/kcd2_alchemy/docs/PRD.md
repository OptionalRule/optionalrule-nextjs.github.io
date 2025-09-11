# KCD2 Alchemy Scholar — Product Requirements Document (PRD)

## 1. Overview

Client-only tool integrated at `/tools/kcd2_alchemy/` to browse and filter Kingdom Come: Deliverance 2 alchemy recipes. Data is loaded from a static JSON file in `public/tools/kcd2_alchemy/potions.json`. The route is statically exported (no server runtime) and follows trailing slash semantics per site standards.

- Route: `src/app/(interactive)/tools/kcd2_alchemy/page.tsx`
- Feature: `src/features/tools/kcd2_alchemy/`
- Data: `public/tools/kcd2_alchemy/potions.json`
- Reference PRD: `documentation/PRD.md` (Interactive section)

## 2. Goals & Non-Goals

Goals
- List and filter potions by text, alchemy level, ingredient, and effect.
- Display detailed potion info: ingredients, effects, quantity perks, instructions (default/optimized), and notes.
- Keep UI accessible, performant, and client-only.

Non-Goals
- No authoring or editing UI.
- No server APIs or SSR.
- No authentication or persistence beyond URL state.

## 3. Users & Use Cases

- Players wanting to quickly find recipes by available ingredients or desired effects.
- Players filtering by their current alchemy level and seeing optimized instructions availability.
- Sharing a filtered view via URL parameters.

## 4. Data Model

Ingredients follow this schema (short form):

```
{
  id: string
  name: string
}
```

Recipes follow this schema (short form):

```
{
  id: string,
  name: string,
  ingredients: { liquid: string, items: [{ id: string, quantity: number }] },
  instructions: { default: string[], optimized?: { minLevel: number, steps: string[] } },
  quantity: {
    base: number,
    withSecretOfMatterI: number,
    withSecretOfMatterII: number,
    withBothSecrets: number,
    withSecretOfSecrets?: Record<string, number>
  },
  effects: [{ quality: string, description: string }],
  notes?: string,
}
```

Note: Recipes.ingredents.items.id is a foreign key to Ingredients.id

## 5. UX & Flows

- Search and filters: query (text), ingredients (multi‑select) with match mode toggle (Any/All).
- Text search clear: input includes an inline clear (X) control.
- Results list: shows matching potions, count, empty state with guidance.
- Details: each recipe card shows ingredients, effects, quantities with perk toggles, and instructions with Default/Optimized tabs.
- Ingredient highlight: when ingredient filters are active, matching ingredients in each card are highlighted.
- URL state: `?q=&ingredients=&ingMode=`; reload/links preserve filters. `ingMode` defaults to `any` and may be omitted when at default.

## 6. Accessibility

- Keyboard operable filters and tabs; labeled inputs; proper roles/ARIA for disclosures.
- Sufficient color contrast with existing theme tokens.

## 7. Performance

- Dynamic import (`ssr: false`) isolates bundle.
- Debounced search; memoized filters; simple O(n) filtering suitable for local dataset.

## 8. Acceptance Criteria

- Tool loads client-side at `/tools/kcd2_alchemy/` without SSR.
- Loads data from JSON and renders a list with basic fields.
- Filters operate per spec, with URL query param sync. Effect quality filtering is removed. Ingredient filtering supports Any/All mode.
- A11y smoke tests pass; no console errors; build succeeds via `npm run build`.

## 9. Risks & Open Questions

- Inconsistent free-text effects may reduce filter precision; consider curated tags later.
- Confirm whether `requiredLevel` will be provided in data; otherwise UI shows “N/A”.

## 10. References

- Repository PRD: `documentation/PRD.md`
- Standards: `documentation/STANDARDS.md`
- Asteroids PRD: `documentation/asteroids/PRD.md`
