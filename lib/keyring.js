import Secret from 'gi://Secret';

/**
 * Secure storage wrapper for API key using GNOME Keyring (libsecret)
 *
 * Based on keyring implementation from gnome-shell-extension-gsconnect
 * Copyright: Andy Holmes <andrew.g.r.holmes@gmail.com>
 * License: GPL-2.0-or-later
 *
 * Benefits:
 * - API key encrypted at rest
 * - Only accessible to user who stored it
 * - Integrates with system keyring (seahorse)
 * - Requires authentication to access (if keyring is locked)
 */
export class SecureStorage {
    /**
     * Get the Secret.Schema for API key storage
     * Uses lazy initialization to avoid creating objects in global scope
     * @returns {Secret.Schema}
     * @private
     */
    static _getSchema() {
        if (!this._schema) {
            this._schema = new Secret.Schema(
                'org.gnome.shell.extensions.automagic-panel-translator',
                Secret.SchemaFlags.NONE,
                {
                    'api-key': Secret.SchemaAttributeType.STRING,
                }
            );
        }
        return this._schema;
    }
    /**
     * Store API key securely in GNOME Keyring
     * @param {string} apiKey - The translation API key to store
     * @returns {Promise<void>}
     */
    static async storeApiKey(apiKey) {
        return new Promise((resolve, reject) => {
            Secret.password_store(
                SecureStorage._getSchema(),
                {'api-key': 'translator'},
                Secret.COLLECTION_DEFAULT,
                'Translation API Key',
                apiKey,
                null,
                (source, result) => {
                    try {
                        Secret.password_store_finish(result);
                        console.log('Automagic Panel Translator: API key stored securely in keyring');
                        resolve();
                    } catch (error) {
                        console.error('Automagic Panel Translator: Failed to store API key in keyring:', error);
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
                SecureStorage._getSchema(),
                {'api-key': 'translator'},
                null,
                (source, result) => {
                    try {
                        const password = Secret.password_lookup_finish(result);
                        if (password) {
                            console.log('Automagic Panel Translator: API key retrieved from keyring');
                        } else {
                            console.log('Automagic Panel Translator: No API key found in keyring');
                        }
                        resolve(password || '');
                    } catch (error) {
                        console.error('Automagic Panel Translator: Failed to retrieve API key from keyring:', error);
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
                SecureStorage._getSchema(),
                {'api-key': 'translator'},
                null,
                (source, result) => {
                    try {
                        Secret.password_clear_finish(result);
                        console.log('Automagic Panel Translator: API key cleared from keyring');
                        resolve();
                    } catch (error) {
                        console.error('Automagic Panel Translator: Failed to clear API key from keyring:', error);
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
            console.log('Automagic Panel Translator: No API key in settings to migrate');
            return false;
        }

        try {
            // Store in keyring
            await this.storeApiKey(oldApiKey);

            // Clear from settings
            settings.set_string('api-key', '');

            console.log('Automagic Panel Translator: Successfully migrated API key from settings to keyring');
            return true;
        } catch (error) {
            console.error('Automagic Panel Translator: Migration failed:', error);
            throw error;
        }
    }
}
