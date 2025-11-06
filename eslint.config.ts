// eslint.config.js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import prettierPlugin from "eslint-plugin-prettier";
import pluginImport from "eslint-plugin-import";

export default [
  {
    ignores: [
      "node_modules",
      "dist",
      "build",
      "coverage",
      "public",
      "**/*.config.js",
      "**/*.config.mjs"
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooks,
      prettier: prettierPlugin,
      import: pluginImport
    },
    rules: {
      "import/order": [
        "warn",
        {
          groups: [
            ["builtin", "external"],
            ["internal"],
            ["parent", "sibling", "index"],
          ],
          pathGroups: [
            {
              pattern: "@/**",
              group: "internal",
              position: "before",
            },
          ],
          pathGroupsExcludedImportTypes: ["builtin"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "react-hooks/exhaustive-deps": "off",
      // ✅ Style & formatting rules
      "max-len": ["warn", { code: 100 }],
      semi: ["error", "never"],
      quotes: ["error", "single"],
      "comma-dangle": ["error", "always-multiline"],

      // ✅ React-specific
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react-hooks/rules-of-hooks": "error",

      // ✅ Prettier integration
      "prettier/prettier": [
        "error",
        {
          printWidth: 100,
          singleQuote: true,
          semi: false,
          trailingComma: "all",
        },
      ],
    },
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        React: "readonly",
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: "detect" },
    },
  },
];
