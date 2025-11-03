// client/eslint.config.mjs

import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";

export default defineConfig([
  // ✅ Base JS and Next.js configs
  js.configs.recommended,
  ...nextCoreWebVitals,
  ...nextTypescript,
  prettierConfig,

  {
    // ✅ Plugin registration (must be an object in ESLint 9)
    plugins: {
      prettier: prettierPlugin,
    },

    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],

    rules: {
      "react/react-in-jsx-scope": "off",
      "@next/next/no-html-link-for-pages": "off",
      "react/no-unescaped-entities": "off",
      // ✅ Enforce Prettier formatting
      "prettier/prettier": "error",
    },
  },
]);
