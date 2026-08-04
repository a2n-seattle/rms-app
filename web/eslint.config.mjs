import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import globals from "globals";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // eslint-config-next doesn't declare Jest's globals (test, expect,
    // afterEach, ...) -- without this, every *.test.ts file's use of them
    // is flagged as no-undef.
    files: ["**/*.test.ts", "**/*.test.tsx"],
    languageOptions: {
      globals: globals.jest,
    },
  },
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
