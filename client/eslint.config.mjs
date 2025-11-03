// eslint.config.mjs
import { defineConfig } from "eslint/config";
import next from "eslint-config-next";
import js from "@eslint/js";

export default defineConfig([
  // ✅ Base ESLint rules for modern JavaScript
  js.configs.recommended,

  // ✅ Next.js + React + TypeScript integration
  ...next(["core-web-vitals", "typescript"]),

  {
    // ✅ Custom rules or overrides
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],

    rules: {
      "react/react-in-jsx-scope": "off", // not needed in Next.js
      "@next/next/no-html-link-for-pages": "off", // optional if using App Router
      "react/no-unescaped-entities": "off",
    },
  },
]);
