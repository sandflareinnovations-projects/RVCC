import js from "@eslint/js";
import tseslint from "typescript-eslint";
import turboPlugin from "eslint-plugin-turbo";
import importPlugin from "eslint-plugin-import";

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const baseConfig = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin,
      import: importPlugin,
    },
    rules: {
      "turbo/no-undeclared-env-vars": "error",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      
      // Industrial Boundaries
      "import/no-relative-packages": "error",
      "import/no-self-import": "error",
      "import/no-cycle": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/app/*", "@/app"],
              message: "Avoid importing from the 'app' directory inside components. Use props or shared types instead.",
            },
          ],
        },
      ],
    },
  },
  {
    ignores: ["dist/**", "node_modules/**", ".next/**"],
  },
];
