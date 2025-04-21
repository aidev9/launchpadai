import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import reactRefresh from "eslint-plugin-react-refresh";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Ignore patterns (replacing .eslintignore)
  {
    ignores: [
      ".next/**",
      "out/**",
      "dist/**",
      "build/**",
      "node_modules/**",
      "*.log",
      "coverage/**",
    ],
  },

  // Extend Next.js core configs
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Custom rules for all files
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    plugins: {
      "react-refresh": reactRefresh,
    },
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // Disable unused expressions errors (many false positives in JSX and optional chaining)
      "@typescript-eslint/no-unused-expressions": "off",

      // Warning instead of error for unused variables
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      // Allow explicit any in specific cases where needed
      "@typescript-eslint/no-explicit-any": "warn",

      // Relax rules on function types
      "@typescript-eslint/no-unsafe-function-type": "off",

      // Allow empty object types
      "@typescript-eslint/no-empty-object-type": "off",

      // Don't enforce primitive over wrapper
      "@typescript-eslint/no-wrapper-object-types": "off",

      // Allow this alias in some cases
      "@typescript-eslint/no-this-alias": "warn",

      // Allow for react-refresh references to work
      "react-refresh/only-export-components": "off",

      // Fix unescaped entities in JSX
      "react/no-unescaped-entities": "off",

      // Fix React hooks exhaustive deps warnings
      "react-hooks/exhaustive-deps": "warn",

      // Don't require default export naming
      "import/no-anonymous-default-export": "off",
    },
  },
];

export default eslintConfig;
