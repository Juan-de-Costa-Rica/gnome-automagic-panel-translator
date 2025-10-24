import Secret from 'gi://Secret';

/**
 * Schema for DeepL API key storage in GNOME Keyring
 */
const SCHEMA = new Secret.Schema(
    'org.gnome.shell.extensions.deepl-translator',
    Secret.SchemaFlags.NONE,
    {
        'api-key': Secret.SchemaAttributeType.STRING,
    }
);

/**
 * Secure storage wrapper for API key using GNOME Keyring (libsecret)
 *
 * Benefits:
 * - API key encrypted at rest
 * - Only accessible to user who stored it
 * - Integrates with system keyring (seahorse)
 * - Requires authentication to access (if keyring is locked)
 */
export class SecureStorage {
    /**
     * Store API key securely in GNOME Keyring
     * @param {string} apiKey - The DeepL API key to store
     * @returns {Promise<void>}
     */
    static async storeApiKey(apiKey) {
        return new Promise((resolve, reject) => {
            Secret.password_store(
                SCHEMA,
                {'api-key': 'deepl'},
                Secret.COLLECTION_DEFAULT,
                'DeepL API Key',
                apiKey,
                null,
                (source, result) => {
                    try {
                        Secret.password_store_finish(result);
                        console.log('DeepL Translator: API key stored securely in keyring');
                        resolve();
                    } catch (error) {
                        console.error('DeepL Translator: Failed to store API key in keyring:', error);
                        reject(error);
                    }
                }
            );
        });
    }

    /**
     * Retrieve API key from GNOME Keyring
     * @returns {Promise<string>} The API key, or empty string if not found
     */
    static async retrieveApiKey() {
        return new Promise((resolve, reject) => {
            Secret.password_lookup(
                SCHEMA,
                {'api-key': 'deepl'},
                null,
                (source, result) => {
                    try {
                        const password = Secret.password_lookup_finish(result);
                        if (password) {
                            console.log('DeepL Translator: API key retrieved from keyring');
                        } else {
                            console.log('DeepL Translator: No API key found in keyring');
                        }
                        resolve(password || '');
                    } catch (error) {
                        console.error('DeepL Translator: Failed to retrieve API key from keyring:', error);
                        reject(error);
                    }
                }
            );
        });
    }

    /**
     * Clear API key from keyring
     * @returns {Promise<void>}
     */
    static async clearApiKey() {
        return new Promise((resolve, reject) => {
            Secret.password_clear(
                SCHEMA,
                {'api-key': 'deepl'},
                null,
                (source, result) => {
                    try {
                        Secret.password_clear_finish(result);
                        console.log('DeepL Translator: API key cleared from keyring');
                        resolve();
                    } catch (error) {
                        console.error('DeepL Translator: Failed to clear API key from keyring:', error);
                        reject(error);
                    }
                }
            );
        });
    }

    /**
     * Migrate API key from GSettings (dconf) to keyring
     * This is a one-time migration for existing users
     * @param {Gio.Settings} settings - The extension settings object
     * @returns {Promise<boolean>} True if migration was needed and completed
     */
    static async migrateFromSettings(settings) {
        const oldApiKey = settings.get_string('api-key');

        if (!oldApiKey || oldApiKey === '') {
            console.log('DeepL Translator: No API key in settings to migrate');
            return false;
        }

        try {
            // Store in keyring
            await this.storeApiKey(oldApiKey);

            // Clear from settings
            settings.set_string('api-key', '');

            console.log('DeepL Translator: Successfully migrated API key from settings to keyring');
            return true;
        } catch (error) {
            console.error('DeepL Translator: Migration failed:', error);
            throw error;
        }
    }
}
