import js from '@eslint/js';

export default [
    // Global ignores
    {
        ignores: ['**/node_modules/', 'schemas/gschemas.compiled', '**/*.zip']
    },

    // Main configuration
    {
        ...js.configs.recommended,

        languageOptions: {
            ecmaVersion: 2021,
            sourceType: 'module',

            globals: {
                // GJS globals
                imports: 'readonly',
                global: 'readonly',
                log: 'readonly',
                logError: 'readonly',
                print: 'readonly',
                printerr: 'readonly',
                console: 'readonly',

                // Web APIs available in GJS
                TextEncoder: 'readonly',
                TextDecoder: 'readonly',
            }
        },

        rules: {
            'indent': ['error', 4],
            'linebreak-style': ['error', 'unix'],
            'quotes': ['error', 'single'],
            'semi': ['error', 'always'],
            'no-unused-vars': ['warn', {
                'argsIgnorePattern': '^_'
            }],
            'no-console': 'off',
            'prefer-const': 'warn'
        }
    }
];
