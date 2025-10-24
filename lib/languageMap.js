/**
 * DeepL language code to friendly name mapping
 *
 * This is the single source of truth for supported languages.
 * Used by both extension.js and prefs.js to ensure consistency.
 *
 * @see https://www.deepl.com/docs-api/translate-text/
 */

/**
 * Map of DeepL language codes to human-readable names
 */
export const LANGUAGE_NAMES = {
    'BG': 'Bulgarian',
    'CS': 'Czech',
    'DA': 'Danish',
    'DE': 'German',
    'EL': 'Greek',
    'EN': 'English',
    'ES': 'Spanish',
    'ET': 'Estonian',
    'FI': 'Finnish',
    'FR': 'French',
    'HU': 'Hungarian',
    'ID': 'Indonesian',
    'IT': 'Italian',
    'JA': 'Japanese',
    'KO': 'Korean',
    'LT': 'Lithuanian',
    'LV': 'Latvian',
    'NB': 'Norwegian',
    'NL': 'Dutch',
    'PL': 'Polish',
    'PT-BR': 'Portuguese (Brazil)',
    'PT-PT': 'Portuguese (Portugal)',
    'RO': 'Romanian',
    'RU': 'Russian',
    'SK': 'Slovak',
    'SL': 'Slovenian',
    'SV': 'Swedish',
    'TR': 'Turkish',
    'UK': 'Ukrainian',
    'ZH': 'Chinese'
};

/**
 * Array of all supported language codes
 */
export const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_NAMES);

/**
 * Get friendly name for a language code
 * @param {string} code - Language code (e.g., 'EN', 'ES')
 * @returns {string} Friendly name or the code itself if not found
 */
export function getLanguageName(code) {
    return LANGUAGE_NAMES[code] || code;
}

/**
 * Check if a language code is supported
 * @param {string} code - Language code to check
 * @returns {boolean} True if supported
 */
export function isValidLanguage(code) {
    return SUPPORTED_LANGUAGES.includes(code);
}

/**
 * Get array of {code, name} objects for dropdowns
 * @param {boolean} includeNone - Whether to include a "None" option
 * @returns {Array<{code: string, name: string}>}
 */
export function getLanguageOptions(includeNone = false) {
    const options = [];

    if (includeNone) {
        options.push({code: '', name: 'None'});
    }

    for (const [code, name] of Object.entries(LANGUAGE_NAMES)) {
        options.push({code, name});
    }

    return options;
}
