// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Ignore build artifacts and generated/static output
  { ignores: [
    'node_modules/**',
    '.next/**',
    'out/**',
    'coverage/**',
    'public/**',
    'next-env.d.ts'
  ] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // Local rule overrides
  {
    rules: {
      // Allow underscore-prefixed names for intentional unused vars/args (tests, mocks, destructuring)
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  ...storybook.configs["flat/recommended"]
];

export default eslintConfig;
