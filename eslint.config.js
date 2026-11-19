// @ts-check
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

// Module boundaries (see docs/ARCHITECTURE.md): core is pure, viewer never reaches Node-side code.
const forbid = (...groups) => ({
  "no-restricted-imports": ["error", { patterns: [{ group: groups, message: "Crosses a module boundary." }] }],
});

export default tseslint.config(
  { ignores: ["dist/", "node_modules/", ".superpowers/", "coverage/"] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
    },
  },
  { files: ["**/*.js"], ...tseslint.configs.disableTypeChecked },
  { files: ["src/core/**"], rules: forbid("node:*", "../node/*", "../hooks/*", "../server/*", "../viewer/*") },
  { files: ["src/node/**"], rules: forbid("../hooks/*", "../server/*", "../viewer/*") },
  { files: ["src/server/**"], rules: forbid("../hooks/*", "../viewer/*") },
  { files: ["src/hooks/**"], rules: forbid("../viewer/*") },
  {
    files: ["src/viewer/**"],
    languageOptions: { globals: { ...globals.browser } },
    rules: forbid(
      "node:*",
      "../node/*",
      "../../node/*",
      "../server/*",
      "../../server/*",
      "../hooks/*",
      "../../hooks/*",
    ),
  },
);
