import js from "@eslint/js";
import ts from "typescript-eslint";
import astro from "eslint-plugin-astro";
import globals from "globals";

export default [
  { ignores: ["node_modules/**", ".astro/**", ".next/**", "out/**", "build/**", ".studio/**", "test-results/**", "playwright-report/**"] },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...astro.configs.recommended,
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  { files: ["scripts/**/*.mjs", "scripts/**/*.js"], rules: { "@typescript-eslint/no-unused-vars": "off", "@typescript-eslint/no-require-imports": "off" } },
];
