import Soup from 'gi://Soup';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import {isValidLanguage} from './lib/languageMap.js';

const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';

/**
 * DeepL API Translation Service
 *
 * Handles communication with the DeepL API for text translation.
 * Uses GNOME Soup 3 for HTTP requests with async/await pattern.
 * Includes input validation, proper error handling, and cancellation support.
 *
 * @example
 * const translator = new DeepLTranslator(apiKey);
 * try {
 *   const result = await translator.translate('Hello', null, 'ES');
 *   console.log(result.text); // "Hola"
 *   console.log(result.detectedSourceLang); // "EN"
 * } catch (error) {
 *   console.error('Translation failed:', error.message);
 * }
 */
export class DeepLTranslator {
    /**
     * Create a new DeepL translator instance
     *
     * @param {string} apiKey - DeepL API key (free or pro tier)
     */
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.session = new Soup.Session();
    }

    /**
     * Translate text using DeepL API
     *
     * Supports auto-detection when sourceLang is null.
     * Returns both translated text and detected source language.
     * Validates all inputs before making API request.
     *
     * @param {string} text - Text to translate (max 50,000 characters for free tier)
     * @param {string|null} sourceLang - Source language code (e.g., 'EN', 'ES') or null for auto-detect
     * @param {string} targetLang - Target language code (e.g., 'EN', 'ES')
     * @param {Gio.Cancellable|null} cancellable - Optional cancellable for async operation
     * @returns {Promise<{text: string, detectedSourceLang: string|null}>} Translation result
     * @throws {Error} If API key is invalid, quota exceeded, invalid language code, or network error
     *
     * @example
     * // Auto-detect source language
     * const result = await translator.translate('Hello world', null, 'ES');
     * console.log(result.text); // "Hola mundo"
     * console.log(result.detectedSourceLang); // "EN"
     *
     * @example
     * // Explicit source language
     * const result = await translator.translate('Hello', 'EN', 'FR');
     * console.log(result.text); // "Bonjour"
     *
     * @example
     * // With cancellation support
     * const cancellable = new Gio.Cancellable();
     * const result = await translator.translate('Hello', null, 'DE', cancellable);
     * // Later: cancellable.cancel();
     */
    async translate(text, sourceLang, targetLang, cancellable = null) {
        // Validate inputs
        if (!this.apiKey || this.apiKey === '') {
            console.error('DeepL Translator: API key not configured');
            throw new Error('API key not configured. Please set it in preferences.');
        }

        // Validate target language (source can be null for auto-detect)
        if (!targetLang || !isValidLanguage(targetLang)) {
            console.error('DeepL Translator: Invalid target language code:', targetLang);
            throw new Error(`Invalid target language code: ${targetLang}`);
        }

        // Validate source language if provided
        if (sourceLang !== null && !isValidLanguage(sourceLang)) {
            console.error('DeepL Translator: Invalid source language code:', sourceLang);
            throw new Error(`Invalid source language code: ${sourceLang}`);
        }

        if (!text || text.trim() === '') {
            console.warn('DeepL Translator: Empty text provided for translation');
            throw new Error('No text to translate.');
        }

        // Build request
        const message = Soup.Message.new('POST', DEEPL_API_URL);

        let formData = `auth_key=${encodeURIComponent(this.apiKey)}&text=${encodeURIComponent(text)}`;
        if (sourceLang !== null) {
            formData += `&source_lang=${encodeURIComponent(sourceLang)}`;
        }
        formData += `&target_lang=${encodeURIComponent(targetLang)}`;

        message.set_request_body_from_bytes(
            'application/x-www-form-urlencoded',
            new GLib.Bytes(new TextEncoder().encode(formData))
        );

        // Wrap async operation in Promise
        return new Promise((resolve, reject) => {
            this.session.send_and_read_async(
                message,
                GLib.PRIORITY_DEFAULT,
                cancellable,
                (session, result) => {
                    try {
                        // Check cancellation
                        if (cancellable && cancellable.is_cancelled()) {
                            reject(new Error('Translation cancelled'));
                            return;
                        }

                        const bytes = session.send_and_read_finish(result);
                        const decoder = new TextDecoder('utf-8');
                        const responseText = decoder.decode(bytes.get_data());
                        const statusCode = message.get_status();

                        if (statusCode !== 200) {
                            const error = this._createErrorFromStatus(statusCode, responseText);
                            reject(error);
                            return;
                        }

                        const response = JSON.parse(responseText);

                        if (response.translations && response.translations.length > 0) {
                            resolve({
                                text: response.translations[0].text,
                                detectedSourceLang: response.translations[0].detected_source_language || null
                            });
                        } else {
                            reject(new Error('No translation received from DeepL.'));
                        }
                    } catch (error) {
                        // Check for cancellation
                        if (error.matches && error.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED)) {
                            reject(new Error('Translation cancelled'));
                            return;
                        }
                        console.error('DeepL Translator: Error parsing API response:', error);
                        reject(new Error(`Error parsing response: ${error.message}`));
                    }
                }
            );
        });
    }

    /**
     * Create error object from API status code
     * @private
     * @param {number} statusCode - HTTP status code
     * @param {string} responseText - Response body
     * @returns {Error} Error object with appropriate message
     */
    _createErrorFromStatus(statusCode, responseText) {
        console.error(`DeepL Translator: API error ${statusCode}:`, responseText);

        let message;
        switch (statusCode) {
        case 403:
            message = 'Authentication failed. Check your API key in preferences.';
            break;
        case 456:
            message = 'Quota exceeded. You have used all your translation quota.';
            break;
        case 400:
            message = 'Bad request. Check your language codes.';
            break;
        default:
            message = `API error (${statusCode}): ${responseText}`;
        }

        return new Error(message);
    }

    /**
     * Cleanup translator resources
     *
     * Aborts any pending HTTP requests and clears sensitive data from memory.
     * Should be called when the translator is no longer needed to prevent memory leaks.
     */
    destroy() {
        // Properly cleanup Soup.Session
        if (this.session) {
            // Abort any pending requests
            this.session.abort();
            // Allow GC to cleanup
            this.session = null;
        }
        // Clear API key from memory
        this.apiKey = null;
    }
}
