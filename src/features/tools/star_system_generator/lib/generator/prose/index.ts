// Folder marker for narrative-prose helpers. Phase 0 standardised on direct
// sub-module imports (e.g. `import { lowerFirst } from './prose/helpers'`) to
// keep symbol provenance explicit, so this barrel intentionally re-exports
// nothing. If a future phase needs an aggregate barrel, prefer named re-exports
// (`export { foo, bar } from './module'`) over `export * from` to avoid silent
// symbol collisions across files.
export {}
