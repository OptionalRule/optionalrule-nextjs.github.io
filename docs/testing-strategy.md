# Testing Strategy

This document outlines the testing approach for the Optional Rule Games Next.js blog to ensure basic functionality and catch breaks during upgrades and updates.

## Overview

The testing strategy focuses on critical functionality that could break during dependency updates, Next.js upgrades, or content changes. It uses a three-tier approach to provide comprehensive coverage while remaining lightweight and maintainable.

## Test Structure

### 1. Unit Tests (Vitest)
**Purpose**: Test individual functions and utilities  
**Location**: `src/**/*.test.ts`  
**Config**: `vitest.unit.config.ts`  
**Environment**: `happy-dom` for React components, `node` for utilities

**Core Areas Covered**:
- **Date utilities** (`src/lib/utils.test.ts`):
  - Date parsing and formatting
  - URL generation with proper date formatting
  - UTC handling to prevent timezone issues

- **String utilities**:
  - Text processing and normalization
  - Slug generation and conversion
  - Heading ID generation

- **Content management** (`src/lib/content.test.ts`):
  - Draft detection logic
  - File filtering (production vs development)
  - MDX file processing

- **Search functionality** (`src/lib/search.test.ts`):
  - Search index loading and validation
  - Query processing and filtering
  - Result ranking and limiting

- **Component logic** (`src/components/Pagination.test.ts`):
  - Pagination calculations
  - Page range generation

- **React components** (`src/components/__tests__/*.test.tsx`):
  - SearchInput: Debouncing, keyboard shortcuts, URL handling
  - User interactions and state management
  - Props validation and rendering

### 2. Build Verification Tests
**Purpose**: Ensure build process and static generation work correctly  
**Location**: `src/__tests__/build.test.ts`

**Coverage**:
- Configuration file presence and validity
- Required directory structure
- Content file validation
- Build artifact verification
- Search index generation

### 3. Integration Tests
**Purpose**: Test workflows and cross-system interactions  
**Location**: `src/__tests__/integration.test.ts`

**Coverage**:
- Content processing to search pipeline
- URL generation consistency
- Pagination integration
- Draft filtering across operations

### 4. SSG-Specific Tests
**Purpose**: Validate static site generation requirements  
**Location**: `src/__tests__/ssg.test.ts`

**Coverage**:
- Dynamic route generation
- Trailing slash enforcement
- Image path normalization
- Build-time content processing

### 5. Accessibility Tests
**Purpose**: Ensure WCAG compliance and screen reader support  
**Location**: `src/__tests__/accessibility.test.tsx`

**Coverage**:
- ARIA attributes and roles
- Keyboard navigation
- Color contrast (semantic verification)
- Screen reader compatibility

### 6. Component Tests (Storybook + Vitest)
**Purpose**: Visual component testing and interaction verification  
**Config**: `vitest.config.ts` (Storybook integration)

**Coverage**:
- Component rendering
- User interactions  
- Visual regression detection

## Test Commands

```bash
# Run all unit tests
npm run test

# Run tests in watch mode during development
npm run test:watch

# Run tests with UI (browser-based)
npm run test:ui

# Run tests with coverage reporting
npm run test:coverage

# Run integration tests
npm run test:integration

# Run SSG-specific tests
npm run test:ssg

# Run accessibility tests
npm run test:a11y

# Run build verification (includes build + static tests)
npm run test:build

# Run just the static verification
npm run test:static

# Run all tests (unit + a11y + build)
npm run test:all
```

## Critical Test Scenarios

### 1. Date Handling
- **Why Critical**: URL generation depends on correct date parsing
- **Tests**: UTC date parsing, URL path generation, timezone consistency
- **Prevents**: Broken post URLs after timezone/date library changes

### 2. Content Processing
- **Why Critical**: Core functionality for blog content management
- **Tests**: Draft filtering, MDX parsing, metadata extraction
- **Prevents**: Draft posts appearing in production, missing content

### 3. Search Functionality
- **Why Critical**: Primary user interaction feature
- **Tests**: Index loading, query processing, result validation
- **Prevents**: Search breaking after Fuse.js or API changes

### 4. Build Process
- **Why Critical**: Static site generation must work for deployment
- **Tests**: Configuration validation, artifact generation, file structure
- **Prevents**: Failed deployments, missing static files

## Upgrade Testing Workflow

When updating dependencies or Next.js:

1. **Run existing tests**: `npm run test`
2. **Test build process**: `npm run test:build`
3. **Manual verification**:
   - Start dev server: `npm run dev`
   - Verify search functionality
   - Check post navigation
   - Validate draft filtering

## Test Data Strategy

Tests use mocked data and file system operations to ensure:
- **Deterministic results**: Tests don't depend on actual content files
- **Fast execution**: No real file I/O during testing
- **Isolation**: Tests don't affect real content or build artifacts

## Maintenance Guidelines

### Adding New Tests
1. **New utility functions**: Add tests to respective `.test.ts` files
2. **New components**: Create Storybook stories with interaction tests
3. **New content features**: Extend `content.test.ts` coverage

### Test Hygiene
- Keep tests focused on behavior, not implementation
- Use descriptive test names that explain the scenario
- Mock external dependencies (file system, network calls)
- Test both success and error conditions

### Performance Considerations
- Unit tests should run in under 5 seconds
- Build tests can take longer but should complete under 30 seconds
- Use `vi.mock()` to avoid slow operations

## Continuous Integration

The testing strategy is designed to work in CI environments:
- No external dependencies required
- Deterministic test results
- Clear failure messages
- Separate test categories for different CI stages

## Coverage Goals

- **Utility functions**: 90%+ coverage
- **Content processing**: 80%+ coverage
- **Search functionality**: 85%+ coverage
- **Build verification**: Critical paths covered

## Coverage Scope Updates

- **Interactive experiences**: Treat the Asteroids bundle as an embedded app. Exclude `src/app/(interactive)/**` and `src/features/games/**` from the main coverage run so the core editorial stack is measured without the game engine skewing the report.
- **Dedicated suite later**: Keep the option open to add a second Vitest config (for example `vitest.games.config.ts`) that targets the excluded files with thresholds that match their complexity and browser needs.
- **Route integration focus**: Replace the removed E2E smoke checks with focused component or static-render tests that exercise `generateStaticParams`, pagination wiring, and fallback states using fixtures. This keeps confidence high without reintroducing brittle page-load tests.
- **Navigation guarantees**: Expand RTL coverage for `Header`, `Footer`, `SmartLink`, `MarkdownLink`, and `MediaEmbed` so link integrity, analytics guards, and content sanitisation are locked in.

## Immediate Development Plan

1. Update `vitest.unit.config.ts` to exclude the interactive game paths and rerun `npm run test:coverage` to confirm the core stack sits near the 45-48% mark. - IMPLEMENTED
2. Add targeted RTL suites for the navigation and content primitives listed above, asserting trailing slashes, GA opt-in/out, and external link handling. - IMPLEMENTED
3. Introduce lightweight integration tests for representative paginated/tag routes that render the exported components with fixture content and validate metadata helpers.
4. Re-assess the global thresholds once the new tests land; bump toward 55% if coverage rises accordingly, otherwise keep 50% and document the remaining gaps.
5. Spin up the optional `vitest.games.config.ts` (or a Storybook-driven Playwright suite) when you are ready to harden the interactive bundle without impacting the primary CI gate.

## Future Enhancements

As the project grows, consider adding:
- End-to-end tests with Playwright
- Visual regression testing
- Performance benchmarking
- Accessibility testing automation
- RSS feed validation
- Image optimization verification

This testing strategy provides a solid foundation for catching breaking changes while remaining maintainable and focused on the most critical functionality.


