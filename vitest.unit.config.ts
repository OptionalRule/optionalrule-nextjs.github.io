import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  esbuild: {
    target: 'node20',
    jsx: 'automatic',
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts,tsx}'],
    exclude: ['src/**/*.stories.{js,ts,tsx}', 'node_modules/**/*'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*'],
      exclude: [
        'src/**/*.test.{js,ts,tsx}',
        'src/**/*.spec.{js,ts,tsx}',
        'src/**/*.stories.{js,ts,tsx}',
        'src/stories/**',
        'src/test-setup.ts',
        'src/**/__generated__/**',
        'src/**/*.d.ts',
        'src/app/(interactive)/**',
        'src/features/games/**'
      ],
      thresholds: {
        statements: 60,
        branches: 45,
        functions: 55,
        lines: 60,
      },
    },
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'zod': path.resolve(__dirname, './src/lib/zod.ts'),
    },
  },
});
