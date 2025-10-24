import { defineConfig, globalIgnores } from "eslint/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([
    globalIgnores(["**/node_modules/", "schemas/gschemas.compiled", "**/*.zip"]),
    {
        extends: compat.extends("eslint:recommended"),

        languageOptions: {
            globals: {
                imports: "readonly",
                global: "readonly",
                log: "readonly",
                logError: "readonly",
                print: "readonly",
                printerr: "readonly",
            },

            ecmaVersion: 12,
            sourceType: "module",
        },

        rules: {
            indent: ["error", 4],
            "linebreak-style": ["error", "unix"],
            quotes: ["error", "single"],
            semi: ["error", "always"],

            "no-unused-vars": ["warn", {
                argsIgnorePattern: "^_",
            }],

            "no-console": "off",
            "prefer-const": "warn",
        },
    },
]);