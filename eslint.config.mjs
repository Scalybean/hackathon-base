/**
 * Lint rules. The security rules here are not style preferences: each one maps
 * to a rule in CLAUDE.md that an agent must not be able to forget.
 */
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "coverage/**"]),
  {
    name: "hackathon-base/security",
    rules: {
      // Rule: no dangerouslySetInnerHTML. SafeHtml is the single exception and
      // is un-ignored below.
      "react/no-danger": "error",

      // Unused vars usually mean a half-finished refactor of an auth check.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      "no-restricted-syntax": [
        "error",
        {
          // getSession() only decodes a cookie the client controls. Every
          // access decision must come from getUser(), which revalidates it.
          selector:
            "CallExpression[callee.property.name='getSession'][callee.object.property.name='auth']",
          message:
            "Use supabase.auth.getUser(): getSession() trusts the cookie without revalidating it.",
        },
        {
          // Ownership never travels in a request body.
          selector: "Property[key.name='user_id'][value.type!='Literal'] > Identifier.value[name=/^(body|input|payload|params|query)$/]",
          message: "Never set user_id from request input. Ownership comes from auth.uid().",
        },
      ],

      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@supabase/auth-helpers-nextjs",
              message: "Deprecated. Use @supabase/ssr via @/lib/supabase/*.",
            },
            {
              name: "dompurify",
              message: "Import sanitizeHtml from @/lib/sanitize instead.",
            },
          ],
        },
      ],
    },
  },
  {
    // The one file allowed to render HTML. It only ever receives sanitised input.
    name: "hackathon-base/safe-html",
    files: ["src/components/ui/safe-html.tsx"],
    rules: { "react/no-danger": "off" },
  },
  {
    name: "hackathon-base/scripts",
    files: ["scripts/**/*.ts", "vitest.config.ts", "*.config.*"],
    rules: { "no-console": "off" },
  },
]);

export default eslintConfig;
