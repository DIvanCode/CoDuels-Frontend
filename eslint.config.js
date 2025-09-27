import js from "@eslint/js";
import globals from "globals";

import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";

import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
    globalIgnores(["dist"]),
    {
        files: ["**/*.{ts,tsx}"],
        extends: [
            js.configs.recommended,
            tseslint.configs.recommended,
            reactHooks.configs["recommended-latest"],
            reactRefresh.configs.vite,
            reactX.configs["recommended-typescript"],
            reactDom.configs.recommended,
        ],
        plugins: {
            import: importPlugin,
        },
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
        },
        rules: {
            "import/order": [
                "error",
                {
                    "groups": [
                        ["builtin", "external"],
                        ["internal"],
                        ["parent", "sibling", "index"],
                        ["type"],
                    ],
                    "pathGroups": [
                        {
                            pattern: "**/*.{css,scss,sass,less}",
                            group: "index",
                            position: "after",
                        },
                    ],
                    "pathGroupsExcludedImportTypes": [],
                    "newlines-between": "always",
                    "alphabetize": {
                        order: "asc",
                        caseInsensitive: true,
                    },
                },
            ],
            "import/first": "error",
            "import/newline-after-import": "error",
            "import/no-duplicates": "error",
            "@typescript-eslint/no-unused-vars": "warn",
        },
    },
]);
