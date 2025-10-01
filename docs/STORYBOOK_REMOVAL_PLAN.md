# Storybook Removal Plan

## Objective
- Retire Storybook from the Optional Rule blog codebase to simplify tooling, shrink dependencies, and reduce ongoing maintenance.
- Remove all Storybook-related code, configuration, documentation, and tests while preserving component coverage through existing Vitest + Testing Library workflows.

## Current Footprint Snapshot
- **npm scripts & tooling**: `storybook`, `build-storybook` scripts in `package.json`; Storybook-only dev dependencies (`storybook`, `@storybook/*`, `@chromatic-com/storybook`, `eslint-plugin-storybook`, `@vitest/browser`).
- **Configs**: `.storybook/` directory (main.ts, preview.ts, preview.css, vitest.setup.ts); `vitest.config.ts` registers the Storybook Vitest plugin/project; `eslint.config.mjs` pulls in Storybook lint configs; `.gitignore` ignores Storybook build artifacts.
- **Source files**: Storybook examples under `src/stories/**` and component stories in `src/components/*.stories.tsx`.
- **Docs & checklists**: Storybook-specific guide (`docs/storybook-guide.md`), sections in `docs/testing-strategy.md`, `docs/TDD.md`, `docs/PLAN.md`, `AGENTS.md`, and `src/features/tools/kcd2_alchemy/docs/PLAN.md` referencing Storybook usage.

## Removal Tasks

### 1. Package & Script Cleanup
- Remove `storybook` and `build-storybook` scripts from `package.json`.
- Drop Storybook-related devDependencies and lockfile entries: `storybook`, `@chromatic-com/storybook`, all `@storybook/*` packages, `eslint-plugin-storybook`, and the unused `@vitest/browser` (only required for the Storybook Vitest project).
- Run `npm install` to refresh `package-lock.json` and shrink the dependency tree.

### 2. Configuration & Tooling Adjustments
- Delete the entire `.storybook/` directory (main.ts, preview.ts, preview.css, vitest.setup.ts).
- Remove the Storybook project from `vitest.config.ts`; if no longer needed, delete the file entirely and have tooling rely on `vitest.unit.config.ts`.
- Remove the Storybook reference shim `vitest.shims.d.ts` if nothing else consumes `@vitest/browser` typings.
- Update `eslint.config.mjs` to drop the Storybook plugin configuration and verify lint still passes.
- Clean up `.gitignore` entries for Storybook artifacts (`*storybook.log`, `storybook-static`).

### 3. Source Cleanup
- Delete Storybook showcase files under `src/stories/**` (Button/Header/Page samples, MDX docs, assets).
- Remove component story files co-located with app code (`src/components/ComponentLibrary.stories.tsx`, `HeadingAnchor.stories.tsx`, `PostCard.stories.tsx`, `SmartLink.stories.tsx`, `TableOfContents.stories.tsx`).
- Confirm any Storybook-only helper components (e.g., `src/stories/Button.tsx`, `Header.tsx`) are not used elsewhere before deleting.
- Perform a final search (`rg "@storybook"` / `rg "\.stories"`) to ensure no imports or references remain.

### 4. Tests & Quality Gates
- Simplify Vitest configuration to a single project (`vitest.unit.config.ts`); ensure commands (`npm run test*`) reference the correct config.
- Update coverage settings to remove Storybook-specific exclusions (e.g., `src/**/*.stories.*`, `src/stories/**`) once those files are gone.
- Verify remaining unit/a11y tests provide adequate component coverage; add focused Testing Library specs if conversion from stories leaves gaps.

### 5. Documentation & Developer Guidance
- Delete `docs/storybook-guide.md`.
- Update Storybook references in:
  - `docs/testing-strategy.md` (remove Section 6 and replace with Testing Library guidance).
  - `docs/TDD.md` command summary.
  - `docs/PLAN.md` checklist items mentioning Storybook coverage exclusions.
  - `AGENTS.md` repository guidelines (structure, commands, linting expectations, PR checklist).
  - `src/features/tools/kcd2_alchemy/docs/PLAN.md` (testing/docs section).
- Audit additional docs (README, AGENTS, CLAUDE prompts, etc.) with `rg "Storybook"` to catch any stragglers.

### 6. Knowledge Transfer & Alternatives
- Decide where to document component usage states formerly captured by stories (e.g., short MDX usage docs under `docs/components/` or screenshots embedded in existing posts).
- If visual regression coverage is still desired, outline alternate approaches (e.g., add a Playwright smoke test or maintain a Storybook-like gallery page within the main site).

### 7. Verification & Housekeeping
- After removals, run `rg "storybook"` (case-insensitive) to confirm the repository is free of Storybook mentions.
- Execute `npm run lint`, `npm run test`, `npm run test:a11y`, and `npm run build` to ensure the project remains healthy without Storybook tooling.
- Remove any Storybook artefacts that may linger (`storybook-static/`, caches) and confirm `.next/` and `out/` builds stay unaffected.
- Prepare a conventional commit such as `chore: remove storybook tooling` once the cleanup is complete.

## Deliverables & Timeline
- One cleanup PR touching `package.json`, lockfile, config, source, and docs as outlined above.
- Optional follow-up PR (if needed) adding replacement component documentation/tests.
- Target completion: 1 dev cycle, depending on how much alternative component documentation you choose to add.
