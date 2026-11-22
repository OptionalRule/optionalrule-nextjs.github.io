// Trivial change to invalidate cache
import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  test: {
    environment: 'happy-dom',
    environmentOptions: {
      happyDOM: {
        settings: {
          enableIframePageLoading: true,
          navigation: {
            disableChildFrameNavigation: true,
          },
        },
      },
    },
    server: {
      deps: {
        inline: [/@react-three\//],
      },
    },
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts,tsx}'],
    exclude: ['src/**/*.stories.{js,ts,tsx}', 'node_modules/**/*'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx,js,jsx}'],
      exclude: [
        'src/**/*.test.{js,ts,tsx}',
        'src/**/*.spec.{js,ts,tsx}',
        'src/**/*.stories.{js,ts,tsx}',
        'src/stories/**',
        'src/test-setup.ts',
        'src/**/__generated__/**',
        'src/**/__snapshots__/**',
        'src/**/*.d.ts',
        'src/app/\\(interactive\\)/**',
      ],
      thresholds: {
        statements: 81,
        branches: 79,
        functions: 78,
        lines: 82,
      },
    },
    pool: 'threads',
    maxWorkers: 1,
    isolate: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'zod': path.resolve(__dirname, './src/lib/zod.ts'),
      '@react-three/fiber': path.resolve(__dirname, './node_modules/@react-three/fiber/dist/react-three-fiber.esm.js'),
    },
  },
});
