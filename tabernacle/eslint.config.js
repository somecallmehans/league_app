import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";

export default [
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // This disables the react/prop-types rule globally
      "react/prop-types": "off",
    },
  },
  pluginJs.configs.recommended,
  {
    ...pluginReact.configs.flat.recommended,
    rules: {
      ...pluginReact.configs.flat.recommended.rules,
      // Disable the rule in react plugin directly here
      "react/prop-types": "off",
      "react/display-name": "off",
    },
  },
];
