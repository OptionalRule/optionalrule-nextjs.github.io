import nextConfig from "eslint-config-next";
import tsEslintPlugin from "@typescript-eslint/eslint-plugin";

const eslintConfig = [
  // Project-specific ignores (Next config already ignores .next/out/build)
  {
    ignores: [
      "node_modules/**",
      "coverage/**",
      "public/**",
      "next-env.d.ts",
    ],
  },
  ...nextConfig,
  {
    plugins: {
      "@typescript-eslint": tsEslintPlugin,
    },
    rules: {
      // Allow underscore-prefixed names for intentional unused vars/args (tests, mocks, destructuring)
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // The new React Hooks rules in eslint-config-next 16 are too strict for our current patterns
      "react-hooks/error-boundaries": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/features/tools/star_system_generator/viewer3d/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "three", message: "Import three only inside viewer3d/." },
            { name: "@react-three/fiber", message: "Import @react-three/fiber only inside viewer3d/." },
            { name: "@react-three/drei", message: "Import @react-three/drei only inside viewer3d/." },
          ],
          patterns: [
            { group: ["three/*"], message: "Import three only inside viewer3d/." },
            { group: ["@react-three/*"], message: "Import @react-three/* only inside viewer3d/." },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
