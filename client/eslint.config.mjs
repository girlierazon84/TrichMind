// client/eslint.config.mjs

import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  // ✅ JavaScript base config
  js.configs.recommended,

  // ✅ Next.js + React rules
  ...nextCoreWebVitals,
  ...nextTypescript,

  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
    rules: {
      "react/react-in-jsx-scope": "off",
      "@next/next/no-html-link-for-pages": "off",
      "react/no-unescaped-entities": "off"
    }
  }
]);
