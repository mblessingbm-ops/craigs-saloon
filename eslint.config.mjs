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
    "public/sw.js",
  ]),
  {
    rules: {
      // Reading localStorage / starting a scripted flow on mount is an
      // intentional client-only init; keep visible but non-blocking.
      "react-hooks/set-state-in-effect": "warn",
      // Icon set is built from a factory; per-icon display names add no value.
      "react/display-name": "off",
    },
  },
]);

export default eslintConfig;
