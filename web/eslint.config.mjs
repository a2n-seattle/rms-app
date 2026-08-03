import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Jest config files are conventionally CommonJS (Jest's own docs use
    // require/module.exports), not part of the app's TS source.
    "jest.config.js",
    "jest.setup.js",
  ]),
]);

export default eslintConfig;
