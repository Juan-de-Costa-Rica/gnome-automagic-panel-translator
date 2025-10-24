import Soup from 'gi://Soup';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';

export class DeepLTranslator {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.session = new Soup.Session();
    }

    /**
     * Translate text using DeepL API
     * @param {string} text - Text to translate
     * @param {string|null} sourceLang - Source language code (e.g., 'EN', 'ES') or null for auto-detect
     * @param {string} targetLang - Target language code (e.g., 'EN', 'ES')
     * @param {Function} callback - Callback function(translatedText, detectedSourceLang, error)
     * @param {Gio.Cancellable|null} cancellable - Optional cancellable for async operation
     */
    translate(text, sourceLang, targetLang, callback, cancellable = null) {
        if (!this.apiKey || this.apiKey === '') {
            console.error('DeepL Translator: API key not configured');
            callback(null, null, 'API key not configured. Please set it in preferences.');
            return;
        }

        if (!text || text.trim() === '') {
            console.warn('DeepL Translator: Empty text provided for translation');
            callback(null, null, 'No text to translate.');
            return;
        }

        try {
            // Create the message
            const message = Soup.Message.new('POST', DEEPL_API_URL);

            // Build form data (omit source_lang if null for auto-detect)
            let formData = `auth_key=${encodeURIComponent(this.apiKey)}&text=${encodeURIComponent(text)}`;
            if (sourceLang !== null) {
                formData += `&source_lang=${encodeURIComponent(sourceLang)}`;
            }
            formData += `&target_lang=${encodeURIComponent(targetLang)}`;

            // Set request body
            message.set_request_body_from_bytes(
                'application/x-www-form-urlencoded',
                new GLib.Bytes(new TextEncoder().encode(formData))
            );

            // Send async request with cancellable
            this.session.send_and_read_async(
                message,
                GLib.PRIORITY_DEFAULT,
                cancellable,
                (session, result) => {
                    try {
                        // Check if operation was cancelled
                        if (cancellable && cancellable.is_cancelled()) {
                            callback(null, null, 'Translation cancelled');
                            return;
                        }

                        const bytes = session.send_and_read_finish(result);
                        const decoder = new TextDecoder('utf-8');
                        const responseText = decoder.decode(bytes.get_data());

                        // Check HTTP status
                        const statusCode = message.get_status();

                        if (statusCode !== 200) {
                            this._handleError(statusCode, responseText, callback);
                            return;
                        }

                        // Parse JSON response
                        const response = JSON.parse(responseText);

                        if (response.translations && response.translations.length > 0) {
                            const translatedText = response.translations[0].text;
                            const detectedSourceLang = response.translations[0].detected_source_language || null;
                            callback(translatedText, detectedSourceLang, null);
                        } else {
                            callback(null, null, 'No translation received from DeepL.');
                        }

                    } catch (error) {
                        // Check for cancellation errors
                        if (error.matches && error.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED)) {
                            callback(null, null, 'Translation cancelled');
                            return;
                        }
                        console.error('DeepL Translator: Error parsing API response:', error);
                        callback(null, null, `Error parsing response: ${error.message}`);
                    }
                }
            );

        } catch (error) {
            // Check for cancellation errors
            if (error.matches && error.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED)) {
                callback(null, null, 'Translation cancelled');
                return;
            }
            console.error('DeepL Translator: Request error:', error);
            callback(null, null, `Request error: ${error.message}`);
        }
    }

    /**
     * Handle API errors
     * @private
     */
    _handleError(statusCode, responseText, callback) {
        console.error(`DeepL Translator: API error ${statusCode}:`, responseText);

        let errorMessage;

        switch (statusCode) {
            case 403:
                errorMessage = 'Authentication failed. Check your API key in preferences.';
                break;
            case 456:
                errorMessage = 'Quota exceeded. You have used all your translation quota.';
                break;
            case 400:
                errorMessage = 'Bad request. Check your language codes.';
                break;
            default:
                errorMessage = `API error (${statusCode}): ${responseText}`;
        }

        callback(null, null, errorMessage);
    }

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
