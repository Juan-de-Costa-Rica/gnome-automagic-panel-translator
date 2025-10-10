import Soup from 'gi://Soup';
import GLib from 'gi://GLib';

const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';

export class DeepLTranslator {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.session = new Soup.Session();
    }

    /**
     * Translate text using DeepL API
     * @param {string} text - Text to translate
     * @param {string} sourceLang - Source language code (e.g., 'EN', 'ES')
     * @param {string} targetLang - Target language code (e.g., 'EN', 'ES')
     * @param {Function} callback - Callback function(translatedText, error)
     */
    translate(text, sourceLang, targetLang, callback) {
        if (!this.apiKey || this.apiKey === '') {
            callback(null, 'API key not configured. Please set it in preferences.');
            return;
        }

        if (!text || text.trim() === '') {
            callback(null, 'No text to translate.');
            return;
        }

        try {
            // Create the message
            const message = Soup.Message.new('POST', DEEPL_API_URL);

            // Build form data
            const formData = `auth_key=${encodeURIComponent(this.apiKey)}&text=${encodeURIComponent(text)}&source_lang=${encodeURIComponent(sourceLang)}&target_lang=${encodeURIComponent(targetLang)}`;

            // Set request body
            message.set_request_body_from_bytes(
                'application/x-www-form-urlencoded',
                new GLib.Bytes(new TextEncoder().encode(formData))
            );

            // Send async request
            this.session.send_and_read_async(
                message,
                GLib.PRIORITY_DEFAULT,
                null,
                (session, result) => {
                    try {
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
                            callback(translatedText, null);
                        } else {
                            callback(null, 'No translation received from DeepL.');
                        }

                    } catch (error) {
                        callback(null, `Error parsing response: ${error.message}`);
                    }
                }
            );

        } catch (error) {
            callback(null, `Request error: ${error.message}`);
        }
    }

    /**
     * Handle API errors
     * @private
     */
    _handleError(statusCode, responseText, callback) {
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

        callback(null, errorMessage);
    }

    destroy() {
        // Cleanup
        this.session = null;
    }
}
