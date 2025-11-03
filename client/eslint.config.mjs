// client/eslint.config.mjs

import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

export default defineConfig([
  js.configs.recommended,
  ...nextCoreWebVitals,
  ...nextTypescript,
  prettier, // ✅ disables ESLint rules that conflict with Prettier

  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
    plugins: ["prettier"], // ✅ adds Prettier as a plugin
    rules: {
      "react/react-in-jsx-scope": "off",
      "@next/next/no-html-link-for-pages": "off",
      "react/no-unescaped-entities": "off",
      "prettier/prettier": ["error"], // ✅ enforces Prettier formatting
    },
  },
]);
