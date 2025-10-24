# DeepL Translator Extension - Implementation Guide
# Phases 1, 2, and 3

**Version**: 2.5-2.7 Development Guide
**Author**: Claude (Sonnet 4.5)
**Date**: October 19, 2025
**Current Version**: 2.3
**Target**: Production-ready v2.7

---

## Table of Contents

1. [Overview](#overview)
2. [Phase 1: Critical Fixes (v2.5)](#phase-1-critical-fixes-v25)
3. [Phase 2: Code Quality (v2.6)](#phase-2-code-quality-v26)
4. [Phase 3: Polish & Documentation (v2.7)](#phase-3-polish--documentation-v27)
5. [Testing Procedures](#testing-procedures)
6. [Rollback Plan](#rollback-plan)

---

## Overview

This guide provides step-by-step instructions for implementing Phases 1-3 of the DeepL Translator extension improvement roadmap. Each task includes:

- Exact file locations and line numbers
- Complete code implementations
- Testing procedures
- Git commit messages
- Rollback instructions

**Estimated Total Time**: 7 hours (1 day + 4 hours + 2 hours)

**Prerequisites**:
- GNOME Shell 48.4 on Fedora 42
- Git repository initialized
- Text editor (VS Code, vim, etc.)
- Access to logout/login for testing

---

## Phase 1: Critical Fixes (v2.5)

**Goal**: Address security and stability issues
**Estimated Time**: 1 day (8 hours with testing)
**Priority**: CRITICAL

### Task 1.1: Add Gio.Cancellable Pattern

**Estimated Time**: 2 hours
**Files Modified**: `translator.js`, `extension.js`

#### Step 1: Modify translator.js to Accept Cancellable

**Location**: `/var/home/juan/Desktop/Code/gnome-deepl-translator/translator.js`

**Current Code** (line 1):
```javascript
import Soup from 'gi://Soup';
import GLib from 'gi://GLib';
```

**Action**: Add Gio import after line 2:
```javascript
import Soup from 'gi://Soup';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
```

**Current Code** (lines 19-86):
```javascript
translate(text, sourceLang, targetLang, callback) {
    // ... existing implementation
}
```

**Action**: Replace entire `translate` method (lines 19-86) with:

```javascript
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
        callback(null, null, 'API key not configured. Please set it in preferences.');
        return;
    }

    if (!text || text.trim() === '') {
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
            cancellable,  // ADDED: Pass cancellable to async operation
            (session, result) => {
                try {
                    // ADDED: Check if operation was cancelled
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
                    // ADDED: Check for cancellation errors
                    if (error.matches && error.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED)) {
                        callback(null, null, 'Translation cancelled');
                        return;
                    }
                    callback(null, null, `Error parsing response: ${error.message}`);
                }
            }
        );

    } catch (error) {
        // ADDED: Check for cancellation errors
        if (error.matches && error.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED)) {
            callback(null, null, 'Translation cancelled');
            return;
        }
        callback(null, null, `Request error: ${error.message}`);
    }
}
```

**Current Code** (lines 92-109):
```javascript
_handleError(statusCode, responseText, callback) {
    // ... existing implementation with 2 parameters
}
```

**Action**: Fix the callback call in `_handleError` (line 109):

**Change FROM**:
```javascript
callback(null, errorMessage);
```

**Change TO**:
```javascript
callback(null, null, errorMessage);
```

#### Step 2: Add Cancellable to extension.js

**Location**: `/var/home/juan/Desktop/Code/gnome-deepl-translator/extension.js`

**Current Code** (line 22):
```javascript
this._lastSourceText = ''; // Track last translated source text for smart auto-translate
```

**Action**: Add after line 22:
```javascript
this._lastSourceText = ''; // Track last translated source text for smart auto-translate

// ADDED: Cancellable for async operations to prevent memory leaks
this._cancellable = new Gio.Cancellable();
```

**Current Code** (lines 316-320):
```javascript
this._translator.translate(
    sourceText,
    null, // Auto-detect source language
    this._currentSecondaryLang, // Use secondary lang as initial target
    (translatedText, detectedSourceLang, error) => {
```

**Action**: Add cancellable parameter to ALL translate calls. There are 2 translate calls in `_performTranslation`:

**First call** (line 316-357):
```javascript
this._translator.translate(
    sourceText,
    null,
    this._currentSecondaryLang,
    (translatedText, detectedSourceLang, error) => {
        if (error) {
            this._resultLabel.set_text(`Error: ${error}`);
            return;
        }

        if (detectedSourceLang && detectedSourceLang !== this._mainLanguage) {
            // Second API call - translate to main language
            this._translator.translate(
                sourceText,
                null,
                this._mainLanguage,
                (finalText, detectedLang, err) => {
                    if (err) {
                        this._resultLabel.set_text(`Error: ${err}`);
                    } else {
                        this._resultLabel.set_text(finalText);
                        this._lastTranslation = finalText;
                        this._autoCopyToClipboard(finalText, this._mainLanguage);
                    }
                },
                this._cancellable  // ADDED
            );
        } else {
            this._resultLabel.set_text(translatedText);
            this._lastTranslation = translatedText;
            this._autoCopyToClipboard(translatedText, this._currentSecondaryLang);
        }
    },
    this._cancellable  // ADDED
);
```

**Current Code** (lines 388-410, destroy method):
```javascript
destroy() {
    if (this._settingsChangedId) {
        this._settings.disconnect(this._settingsChangedId);
        this._settingsChangedId = null;
    }

    if (this._availableLangsChangedId) {
        this._settings.disconnect(this._availableLangsChangedId);
        this._availableLangsChangedId = null;
    }

    if (this._menuOpenStateChangedId) {
        this.menu.disconnect(this._menuOpenStateChangedId);
        this._menuOpenStateChangedId = null;
    }

    if (this._translator) {
        this._translator.destroy();
        this._translator = null;
    }

    super.destroy();
}
```

**Action**: Add cancellable cleanup BEFORE translator cleanup (after line 402):
```javascript
destroy() {
    if (this._settingsChangedId) {
        this._settings.disconnect(this._settingsChangedId);
        this._settingsChangedId = null;
    }

    if (this._availableLangsChangedId) {
        this._settings.disconnect(this._availableLangsChangedId);
        this._availableLangsChangedId = null;
    }

    if (this._menuOpenStateChangedId) {
        this.menu.disconnect(this._menuOpenStateChangedId);
        this._menuOpenStateChangedId = null;
    }

    // ADDED: Cancel any pending async operations
    if (this._cancellable) {
        this._cancellable.cancel();
        this._cancellable = null;
    }

    if (this._translator) {
        this._translator.destroy();
        this._translator = null;
    }

    super.destroy();
}
```

#### Step 3: Test Cancellable Implementation

**Test Procedure**:

1. Copy updated files to installation directory:
```bash
cp translator.js ~/.local/share/gnome-shell/extensions/deepl-translator@juan-de-costa-rica/
cp extension.js ~/.local/share/gnome-shell/extensions/deepl-translator@juan-de-costa-rica/
```

2. Log out and log back in

3. Test normal translation:
   - Copy text: "Hello world"
   - Click extension icon
   - Verify translation appears

4. Test cancellation:
   - Copy long text
   - Click extension icon
   - Immediately click away (close menu)
   - Check journalctl for errors:
   ```bash
   journalctl -f -o cat /usr/bin/gnome-shell | grep deepl
   ```
   - Should see no errors

5. Test rapid open/close:
   - Rapidly click extension icon 10 times
   - Check for memory leaks or errors

**Expected Result**: No errors, clean cancellation

#### Step 4: Commit Changes

```bash
cd /var/home/juan/Desktop/Code/gnome-deepl-translator
git add translator.js extension.js
git commit -m "$(cat <<'EOF'
feat: Add Gio.Cancellable to prevent memory leaks from async operations

Implemented cancellable pattern for all async operations to prevent
memory leaks when the extension is destroyed while operations are pending.

Changes:
- Added Gio import to translator.js
- Modified translate() to accept optional Gio.Cancellable parameter
- Added cancellable to extension.js _init()
- Pass cancellable to all translate() calls
- Cancel operations in destroy() method
- Added cancellation checks in async callbacks

Benefits:
- Prevents memory leaks from pending Soup requests
- Properly handles extension disable/destroy
- Follows GNOME extension best practices

Testing:
- Verified normal translations work
- Verified rapid open/close doesn't leak memory
- Verified cancellation on menu close

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 1.2: Fix Soup.Session Cleanup

**Estimated Time**: 15 minutes
**Files Modified**: `translator.js`

#### Step 1: Update destroy() Method

**Location**: `/var/home/juan/Desktop/Code/gnome-deepl-translator/translator.js`

**Current Code** (lines 112-115):
```javascript
destroy() {
    // Cleanup
    this.session = null;
}
```

**Action**: Replace with proper cleanup:
```javascript
destroy() {
    // FIXED: Properly cleanup Soup.Session
    if (this.session) {
        // Abort any pending requests
        this.session.abort();
        // Allow GC to cleanup
        this.session = null;
    }
    // Clear API key from memory
    this.apiKey = null;
}
```

#### Step 2: Test Session Cleanup

**Test Procedure**:

1. Copy updated file:
```bash
cp translator.js ~/.local/share/gnome-shell/extensions/deepl-translator@juan-de-costa-rica/
```

2. Log out and log back in

3. Test session cleanup:
   - Start a translation
   - Disable extension: `gnome-extensions disable deepl-translator@juan-de-costa-rica`
   - Check journalctl for errors
   - Re-enable: `gnome-extensions enable deepl-translator@juan-de-costa-rica`

**Expected Result**: No errors, clean disable/enable

#### Step 3: Commit Changes

```bash
git add translator.js
git commit -m "$(cat <<'EOF'
fix: Properly cleanup Soup.Session in destroy()

Changed from setting session to null to calling session.abort()
before nullifying. This properly cancels pending HTTP requests
and prevents memory leaks.

Also added apiKey cleanup to clear sensitive data from memory.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 1.3: Migrate API Key to libsecret

**Estimated Time**: 3 hours
**Files Modified**: `prefs.js`, `translator.js`, `extension.js` (new file: `lib/keyring.js`)

**CRITICAL SECURITY FIX**

#### Step 1: Create lib Directory

```bash
mkdir -p /var/home/juan/Desktop/Code/gnome-deepl-translator/lib
```

#### Step 2: Create Keyring Wrapper

**Location**: `/var/home/juan/Desktop/Code/gnome-deepl-translator/lib/keyring.js`

**Action**: Create new file with complete implementation:

```javascript
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
```

#### Step 3: Update extension.js to Use Keyring

**Location**: `/var/home/juan/Desktop/Code/gnome-deepl-translator/extension.js`

**Current Code** (line 12):
```javascript
import {DeepLTranslator} from './translator.js';
```

**Action**: Add import after line 12:
```javascript
import {DeepLTranslator} from './translator.js';
import {SecureStorage} from './lib/keyring.js';
```

**Current Code** (lines 34-35):
```javascript
// Initialize translator with API key from settings
this._updateTranslator();
```

**Action**: Replace with async keyring initialization:
```javascript
// Initialize translator with API key from keyring
this._initializeTranslator();
```

**Current Code** (lines 270-276, `_updateTranslator` method):
```javascript
_updateTranslator() {
    const apiKey = this._settings.get_string('api-key');
    if (this._translator) {
        this._translator.destroy();
    }
    this._translator = new DeepLTranslator(apiKey);
}
```

**Action**: Replace entire method with async version:
```javascript
async _initializeTranslator() {
    try {
        // Check for migration from old settings-based storage
        const needsMigration = this._settings.get_string('api-key') !== '';
        if (needsMigration) {
            console.log('DeepL Translator: Migrating API key to keyring...');
            await SecureStorage.migrateFromSettings(this._settings);
        }

        // Retrieve API key from keyring
        const apiKey = await SecureStorage.retrieveApiKey();

        if (this._translator) {
            this._translator.destroy();
        }
        this._translator = new DeepLTranslator(apiKey);

        console.log('DeepL Translator: Initialized with API key from keyring');
    } catch (error) {
        console.error('DeepL Translator: Failed to initialize translator:', error);
        // Fallback to empty translator
        if (this._translator) {
            this._translator.destroy();
        }
        this._translator = new DeepLTranslator('');
    }
}

async _updateTranslator() {
    await this._initializeTranslator();
}
```

**Current Code** (lines 52-55, settings change handler):
```javascript
// Watch for settings changes
this._settingsChangedId = this._settings.connect('changed::api-key', () => {
    this._updateTranslator();
});
```

**Action**: Remove this handler (we'll handle key updates in prefs.js):
```javascript
// Watch for settings changes (removed api-key handler - now using keyring)
// API key updates are handled directly in prefs.js via keyring
```

#### Step 4: Update prefs.js to Use Keyring

**Location**: `/var/home/juan/Desktop/Code/gnome-deepl-translator/prefs.js`

**Current Code** (line 4):
```javascript
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
```

**Action**: Add import after line 3:
```javascript
import Gio from 'gi://Gio';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import {SecureStorage} from './lib/keyring.js';
```

**Current Code** (lines 22-33, API Key row binding):
```javascript
// API Key row
const apiKeyRow = new Adw.PasswordEntryRow({
    title: 'DeepL API Key',
});
apiGroup.add(apiKeyRow);

// Bind API key to settings
settings.bind(
    'api-key',
    apiKeyRow,
    'text',
    Gio.SettingsBindFlags.DEFAULT
);
```

**Action**: Replace with keyring integration:
```javascript
// API Key row with keyring integration
const apiKeyRow = new Adw.PasswordEntryRow({
    title: 'DeepL API Key',
});
apiGroup.add(apiKeyRow);

// Load API key from keyring on startup
SecureStorage.retrieveApiKey().then(apiKey => {
    apiKeyRow.set_text(apiKey);
}).catch(error => {
    console.error('DeepL Translator: Failed to load API key from keyring:', error);
});

// Save to keyring when changed (with debounce)
let saveTimeout = null;
apiKeyRow.connect('changed', () => {
    // Debounce saves (wait 500ms after last keystroke)
    if (saveTimeout) {
        GLib.Source.remove(saveTimeout);
    }

    saveTimeout = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 500, () => {
        const apiKey = apiKeyRow.get_text();
        SecureStorage.storeApiKey(apiKey).catch(error => {
            console.error('DeepL Translator: Failed to store API key in keyring:', error);
        });
        saveTimeout = null;
        return GLib.SOURCE_REMOVE;
    });
});
```

**Note**: We need GLib for timeout. Add import if not already present:

**Current Code** (line 1):
```javascript
import Adw from 'gi://Adw';
```

**Action**: Verify GLib is imported (if not, add):
```javascript
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
```

#### Step 5: Update metadata.json

**Location**: `/var/home/juan/Desktop/Code/gnome-deepl-translator/metadata.json`

**Current Content**:
```json
{
  "uuid": "deepl-translator@juan-de-costa-rica",
  "name": "DeepL Translator",
  "description": "Quick translations using DeepL API. Translate text between languages without opening a separate window.",
  "version": 2,
  "version-name": "2.0",
  "shell-version": [
    "48"
  ],
  "url": "https://github.com/Juan-de-Costa-Rica/gnome-deepl-translator",
  "settings-schema": "org.gnome.shell.extensions.deepl-translator",
  "gettext-domain": "deepl-translator"
}
```

**Action**: Update version (we'll change this in Phase 3, keep note for now)

#### Step 6: Test Keyring Integration

**Test Procedure**:

1. Install libsecret if not present:
```bash
sudo dnf install libsecret-devel
```

2. Copy all updated files:
```bash
cp lib/keyring.js ~/.local/share/gnome-shell/extensions/deepl-translator@juan-de-costa-rica/lib/
cp extension.js ~/.local/share/gnome-shell/extensions/deepl-translator@juan-de-costa-rica/
cp prefs.js ~/.local/share/gnome-shell/extensions/deepl-translator@juan-de-costa-rica/
```

3. Log out and log back in

4. Test migration (if you have an existing API key):
   - Check dconf before: `dconf read /org/gnome/shell/extensions/deepl-translator/api-key`
   - Open extension
   - Check logs: `journalctl -b -o cat /usr/bin/gnome-shell | grep "DeepL Translator"`
   - Should see "Migrating API key to keyring"
   - Check dconf after: should be empty
   - Check keyring: `secret-tool lookup api-key deepl`

5. Test new key storage:
   - Open preferences
   - Enter new API key
   - Wait 500ms
   - Check keyring: `secret-tool lookup api-key deepl`
   - Should show the key

6. Test retrieval:
   - Close preferences
   - Disable and re-enable extension
   - Open preferences
   - API key should be populated

7. Test translation with keyring:
   - Copy text: "Hello world"
   - Click extension icon
   - Verify translation works

**Expected Result**: API key stored securely in keyring, translation works

#### Step 7: Commit Changes

```bash
git add lib/keyring.js extension.js prefs.js
git commit -m "$(cat <<'EOF'
security: Migrate API key storage to GNOME Keyring (libsecret)

CRITICAL SECURITY FIX: API keys were stored in plain text in dconf.
Now using GNOME Keyring for encrypted storage.

Changes:
- Created lib/keyring.js wrapper for libsecret
- Implemented SecureStorage class with store/retrieve/clear/migrate
- Updated extension.js to load API key from keyring on startup
- Updated prefs.js to save API key to keyring (with 500ms debounce)
- Added automatic migration from dconf to keyring
- Removed API key from settings binding

Security improvements:
- API keys now encrypted at rest
- Only accessible to user who stored them
- Integrates with system keyring (seahorse)
- Requires authentication if keyring is locked

Migration:
- Automatic one-time migration from dconf to keyring
- Old keys cleared from dconf after migration

Testing:
- Verified migration from existing dconf storage
- Verified new key storage in keyring
- Verified key retrieval on extension load
- Verified translations work with keyring

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 1.4: Add Structured Error Logging

**Estimated Time**: 30 minutes
**Files Modified**: `extension.js`, `translator.js`

#### Step 1: Add Logging to translator.js

**Location**: `/var/home/juan/Desktop/Code/gnome-deepl-translator/translator.js`

**Current Code** (lines 20-23):
```javascript
if (!this.apiKey || this.apiKey === '') {
    callback(null, null, 'API key not configured. Please set it in preferences.');
    return;
}
```

**Action**: Add console.error before callback:
```javascript
if (!this.apiKey || this.apiKey === '') {
    console.error('DeepL Translator: API key not configured');
    callback(null, null, 'API key not configured. Please set it in preferences.');
    return;
}
```

**Current Code** (lines 25-28):
```javascript
if (!text || text.trim() === '') {
    callback(null, null, 'No text to translate.');
    return;
}
```

**Action**: Add console.warn:
```javascript
if (!text || text.trim() === '') {
    console.warn('DeepL Translator: Empty text provided for translation');
    callback(null, null, 'No text to translate.');
    return;
}
```

**Current Code** (line 78, parsing error):
```javascript
} catch (error) {
    callback(null, null, `Error parsing response: ${error.message}`);
}
```

**Action**: Add logging:
```javascript
} catch (error) {
    console.error('DeepL Translator: Error parsing API response:', error, 'Response text:', responseText);
    callback(null, null, `Error parsing response: ${error.message}`);
}
```

**Current Code** (line 84, request error):
```javascript
} catch (error) {
    callback(null, null, `Request error: ${error.message}`);
}
```

**Action**: Add logging:
```javascript
} catch (error) {
    console.error('DeepL Translator: Request error:', error);
    callback(null, null, `Request error: ${error.message}`);
}
```

**Current Code** (lines 96-107, _handleError):
```javascript
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

    callback(null, null, errorMessage);
}
```

**Action**: Add logging at the start:
```javascript
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
```

#### Step 2: Add Logging to extension.js

**Location**: `/var/home/juan/Desktop/Code/gnome-deepl-translator/extension.js`

**Current Code** (lines 287-291):
```javascript
if (!clipboardText || clipboardText.trim() === '') {
    this._resultLabel.set_text('No text found. Select or copy text first.');
    return;
}
```

**Action**: Add logging:
```javascript
if (!clipboardText || clipboardText.trim() === '') {
    console.warn('DeepL Translator: No text in clipboard');
    this._resultLabel.set_text('No text found. Select or copy text first.');
    return;
}
```

**Current Code** (lines 303-306):
```javascript
if (!sourceText || sourceText.trim() === '') {
    this._resultLabel.set_text('No text found. Select or copy text first.');
    return;
}
```

**Action**: Add logging:
```javascript
if (!sourceText || sourceText.trim() === '') {
    console.warn('DeepL Translator: Empty source text for translation');
    this._resultLabel.set_text('No text found. Select or copy text first.');
    return;
}
```

**Current Code** (line 322, error callback):
```javascript
if (error) {
    this._resultLabel.set_text(`Error: ${error}`);
    return;
}
```

**Action**: Add logging:
```javascript
if (error) {
    console.error('DeepL Translator: Translation error:', error);
    this._resultLabel.set_text(`Error: ${error}`);
    return;
}
```

**Current Code** (line 338, second error callback):
```javascript
if (err) {
    this._resultLabel.set_text(`Error: ${err}`);
}
```

**Action**: Add logging:
```javascript
if (err) {
    console.error('DeepL Translator: Translation error (to main language):', err);
    this._resultLabel.set_text(`Error: ${err}`);
}
```

#### Step 3: Test Error Logging

**Test Procedure**:

1. Copy updated files:
```bash
cp translator.js ~/.local/share/gnome-shell/extensions/deepl-translator@juan-de-costa-rica/
cp extension.js ~/.local/share/gnome-shell/extensions/deepl-translator@juan-de-costa-rica/
```

2. Log out and log back in

3. Watch logs in real-time:
```bash
journalctl -f -o cat /usr/bin/gnome-shell | grep "DeepL Translator"
```

4. Test various error conditions:
   - Empty clipboard (should see warning)
   - Invalid API key (should see error)
   - Network error (disconnect wifi, should see error)

5. Verify all errors are logged with context

**Expected Result**: All errors logged to journalctl with descriptive messages

#### Step 4: Commit Changes

```bash
git add translator.js extension.js
git commit -m "$(cat <<'EOF'
feat: Add structured error logging throughout extension

Added console.error() and console.warn() calls for all error paths
to improve debugging and production error monitoring.

Changes:
- Added logging to all error callbacks in translator.js
- Added logging to all error paths in extension.js
- Added context information to error logs
- Added warnings for empty text conditions

Benefits:
- Easier debugging via journalctl
- Production error monitoring capability
- Stack traces preserved for errors
- Clear error context for troubleshooting

View logs:
journalctl -f -o cat /usr/bin/gnome-shell | grep "DeepL Translator"

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Phase 1 Completion Checklist

- [ ] Task 1.1: Gio.Cancellable implemented and tested
- [ ] Task 1.2: Soup.Session cleanup fixed
- [ ] Task 1.3: API key migrated to keyring
- [ ] Task 1.4: Error logging added
- [ ] All tests passing
- [ ] All commits pushed to git
- [ ] Extension version ready for v2.5 tag

**Verification Commands**:
```bash
# Check extension status
gnome-extensions info deepl-translator@juan-de-costa-rica

# Check for errors
journalctl -b -o cat /usr/bin/gnome-shell | grep -i error | grep deepl

# Check API key is in keyring
secret-tool lookup api-key deepl

# Check API key is NOT in dconf
dconf read /org/gnome/shell/extensions/deepl-translator/api-key
```

**Tag v2.5**:
```bash
git tag -a v2.5 -m "Version 2.5 - Critical Fixes

- Added Gio.Cancellable to prevent memory leaks
- Fixed Soup.Session cleanup
- Migrated API key to GNOME Keyring (security fix)
- Added structured error logging"

git push origin v2.5
```

---

## Phase 2: Code Quality (v2.6)

**Goal**: Improve maintainability and developer experience
**Estimated Time**: 4 hours
**Priority**: HIGH

### Task 2.1: Modernize to Async/Await

**Estimated Time**: 2 hours
**Files Modified**: `translator.js`, `extension.js`

**Note**: This is a significant refactor. The callback-based code will be converted to Promise-based async/await.

#### Step 1: Convert translator.js to Promise-based

**Location**: `/var/home/juan/Desktop/Code/gnome-deepl-translator/translator.js`

**Current Code** (entire translate method, lines 19-86):
```javascript
translate(text, sourceLang, targetLang, callback, cancellable = null) {
    // ... callback-based implementation
}
```

**Action**: Replace entire translate method with Promise-based version:

```javascript
/**
 * Translate text using DeepL API (Promise-based)
 * @param {string} text - Text to translate
 * @param {string|null} sourceLang - Source language code or null for auto-detect
 * @param {string} targetLang - Target language code
 * @param {Gio.Cancellable|null} cancellable - Optional cancellable
 * @returns {Promise<{text: string, detectedSourceLang: string|null}>}
 * @throws {Error} If translation fails
 */
async translate(text, sourceLang, targetLang, cancellable = null) {
    // Validate inputs
    if (!this.apiKey || this.apiKey === '') {
        console.error('DeepL Translator: API key not configured');
        throw new Error('API key not configured. Please set it in preferences.');
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
                    console.error('DeepL Translator: Error parsing API response:', error, 'Response:', responseText);
                    reject(new Error(`Error parsing response: ${error.message}`));
                }
            }
        );
    });
}
```

**Current Code** (lines 92-109, _handleError):
```javascript
_handleError(statusCode, responseText, callback) {
    // ...
}
```

**Action**: Replace with error object creator:

```javascript
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
```

#### Step 2: Convert extension.js to async/await

**Location**: `/var/home/juan/Desktop/Code/gnome-deepl-translator/extension.js`

**Current Code** (lines 302-358, _performTranslation method):
```javascript
_performTranslation(sourceText) {
    if (!sourceText || sourceText.trim() === '') {
        console.warn('DeepL Translator: Empty source text for translation');
        this._resultLabel.set_text('No text found. Select or copy text first.');
        return;
    }

    // Store source text for comparison on next menu open
    this._lastSourceText = sourceText.trim();

    // Show loading state
    this._resultLabel.set_text('Translating...');

    // Use auto-detect (null source language) and let API detect
    // Then decide target language based on detected source
    this._translator.translate(
        sourceText,
        null, // Auto-detect source language
        this._currentSecondaryLang, // Use secondary lang as initial target
        (translatedText, detectedSourceLang, error) => {
            if (error) {
                console.error('DeepL Translator: Translation error:', error);
                this._resultLabel.set_text(`Error: ${error}`);
                return;
            }

            // Smart logic: if detected language is our main language,
            // we got it backwards - translate to secondary language (which we did)
            // If detected language is NOT our main language, we need to translate to main language

            if (detectedSourceLang && detectedSourceLang !== this._mainLanguage) {
                // Detected language is NOT our main language
                // So translate to our main language
                this._translator.translate(
                    sourceText,
                    null, // Keep auto-detect
                    this._mainLanguage,
                    (finalText, detectedLang, err) => {
                        if (err) {
                            console.error('DeepL Translator: Translation error (to main language):', err);
                            this._resultLabel.set_text(`Error: ${err}`);
                        } else {
                            this._resultLabel.set_text(finalText);
                            this._lastTranslation = finalText;
                            // Auto-copy to clipboard after successful translation (to primary language)
                            this._autoCopyToClipboard(finalText, this._mainLanguage);
                        }
                    },
                    this._cancellable
                );
            } else {
                // Detected language IS our main language (or couldn't detect)
                // Use the translation to secondary language we already got
                this._resultLabel.set_text(translatedText);
                this._lastTranslation = translatedText;
                // Auto-copy to clipboard after successful translation (to secondary language)
                this._autoCopyToClipboard(translatedText, this._currentSecondaryLang);
            }
        },
        this._cancellable
    );
}
```

**Action**: Replace with async/await version:

```javascript
/**
 * Perform translation with smart language detection
 * @param {string} sourceText - Text to translate
 */
async _performTranslation(sourceText) {
    if (!sourceText || sourceText.trim() === '') {
        console.warn('DeepL Translator: Empty source text for translation');
        this._resultLabel.set_text('No text found. Select or copy text first.');
        return;
    }

    // Store source text for comparison on next menu open
    this._lastSourceText = sourceText.trim();

    // Show loading state
    this._resultLabel.set_text('Translating...');

    try {
        // First translation: auto-detect source, translate to secondary language
        const result = await this._translator.translate(
            sourceText,
            null, // Auto-detect source language
            this._currentSecondaryLang,
            this._cancellable
        );

        // Smart logic: if detected language is NOT our main language,
        // re-translate to main language (reading mode)
        if (result.detectedSourceLang && result.detectedSourceLang !== this._mainLanguage) {
            // Detected foreign language -> translate to main language
            const finalResult = await this._translator.translate(
                sourceText,
                null,
                this._mainLanguage,
                this._cancellable
            );

            this._resultLabel.set_text(finalResult.text);
            this._lastTranslation = finalResult.text;
            this._autoCopyToClipboard(finalResult.text, this._mainLanguage);
        } else {
            // Detected main language -> use translation to secondary (writing mode)
            this._resultLabel.set_text(result.text);
            this._lastTranslation = result.text;
            this._autoCopyToClipboard(result.text, this._currentSecondaryLang);
        }
    } catch (error) {
        // Handle cancellation silently
        if (error.message === 'Translation cancelled') {
            console.log('DeepL Translator: Translation cancelled');
            return;
        }

        // Log and display other errors
        console.error('DeepL Translator: Translation failed:', error);
        this._resultLabel.set_text(`Error: ${error.message}`);
    }
}
```

#### Step 3: Test Async/Await Implementation

**Test Procedure**:

1. Copy updated files:
```bash
cp translator.js ~/.local/share/gnome-shell/extensions/deepl-translator@juan-de-costa-rica/
cp extension.js ~/.local/share/gnome-shell/extensions/deepl-translator@juan-de-costa-rica/
```

2. Log out and log back in

3. Test normal translation:
   - Copy text: "Hello world"
   - Click extension icon
   - Verify translation appears

4. Test error handling:
   - Clear API key from keyring: `secret-tool clear api-key deepl`
   - Try translating
   - Should see clean error message

5. Test cancellation:
   - Copy long text
   - Click extension icon
   - Immediately close menu
   - Check logs for clean cancellation

6. Test language detection:
   - Test foreign → main language
   - Test main → secondary language
   - Both should work

**Expected Result**: All translations work, cleaner error handling

#### Step 4: Commit Changes

```bash
git add translator.js extension.js
git commit -m "$(cat <<'EOF'
refactor: Modernize to async/await pattern

Converted callback-based async code to modern Promise-based async/await
for cleaner, more maintainable code.

Changes:
- Converted translator.translate() to return Promise
- Changed _handleError to _createErrorFromStatus (returns Error object)
- Converted _performTranslation to async function
- Replaced nested callbacks with sequential await calls
- Improved error handling with try/catch blocks

Benefits:
- Cleaner, more readable code
- Better error handling with try/catch
- Native ES6+ JavaScript patterns
- Easier to reason about control flow
- Reduced callback nesting (callback hell)

Code reduction: ~15 lines
Nesting levels: 4 -> 2

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 2.2: Extract Shared Language Map

**Estimated Time**: 30 minutes
**Files Modified**: `extension.js`, `prefs.js` (new file: `lib/languageMap.js`)

#### Step 1: Create Language Map Module

**Location**: `/var/home/juan/Desktop/Code/gnome-deepl-translator/lib/languageMap.js`

**Action**: Create new file:

```javascript
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
```

#### Step 2: Update extension.js to Use Language Map

**Location**: `/var/home/juan/Desktop/Code/gnome-deepl-translator/extension.js`

**Current Code** (line 13):
```javascript
import {SecureStorage} from './lib/keyring.js';
```

**Action**: Add import:
```javascript
import {SecureStorage} from './lib/keyring.js';
import {LANGUAGE_NAMES} from './lib/languageMap.js';
```

**Current Code** (lines 186-196):
```javascript
// Language code to friendly name mapping
const languageNames = {
    'BG': 'Bulgarian', 'CS': 'Czech', 'DA': 'Danish', 'DE': 'German',
    'EL': 'Greek', 'EN': 'English', 'ES': 'Spanish', 'ET': 'Estonian',
    'FI': 'Finnish', 'FR': 'French', 'HU': 'Hungarian', 'ID': 'Indonesian',
    'IT': 'Italian', 'JA': 'Japanese', 'KO': 'Korean', 'LT': 'Lithuanian',
    'LV': 'Latvian', 'NB': 'Norwegian', 'NL': 'Dutch', 'PL': 'Polish',
    'PT-BR': 'Portuguese', 'PT-PT': 'Portuguese (PT)', 'RO': 'Romanian',
    'RU': 'Russian', 'SK': 'Slovak', 'SL': 'Slovenian', 'SV': 'Swedish',
    'TR': 'Turkish', 'UK': 'Ukrainian', 'ZH': 'Chinese'
};
```

**Action**: Delete these lines (186-196) entirely

**Current Code** (line 203):
```javascript
const label = languageNames[code] || code; // Fallback to code if name not found
```

**Action**: Update to use imported constant:
```javascript
const label = LANGUAGE_NAMES[code] || code; // Fallback to code if name not found
```

#### Step 3: Update prefs.js to Use Language Map

**Location**: `/var/home/juan/Desktop/Code/gnome-deepl-translator/prefs.js`

**Current Code** (line 6):
```javascript
import {SecureStorage} from './lib/keyring.js';
```

**Action**: Add import:
```javascript
import {SecureStorage} from './lib/keyring.js';
import {getLanguageOptions} from './lib/languageMap.js';
```

**Current Code** (lines 50-82):
```javascript
// Define all supported DeepL languages
const languages = [
    { code: '', name: 'None' },
    { code: 'BG', name: 'Bulgarian' },
    { code: 'CS', name: 'Czech' },
    { code: 'DA', name: 'Danish' },
    { code: 'DE', name: 'German' },
    { code: 'EL', name: 'Greek' },
    { code: 'EN', name: 'English' },
    { code: 'ES', name: 'Spanish' },
    { code: 'ET', name: 'Estonian' },
    { code: 'FI', name: 'Finnish' },
    { code: 'FR', name: 'French' },
    { code: 'HU', name: 'Hungarian' },
    { code: 'ID', name: 'Indonesian' },
    { code: 'IT', name: 'Italian' },
    { code: 'JA', name: 'Japanese' },
    { code: 'KO', name: 'Korean' },
    { code: 'LT', name: 'Lithuanian' },
    { code: 'LV', name: 'Latvian' },
    { code: 'NB', name: 'Norwegian' },
    { code: 'NL', name: 'Dutch' },
    { code: 'PL', name: 'Polish' },
    { code: 'PT-BR', name: 'Portuguese (Brazil)' },
    { code: 'PT-PT', name: 'Portuguese (Portugal)' },
    { code: 'RO', name: 'Romanian' },
    { code: 'RU', name: 'Russian' },
    { code: 'SK', name: 'Slovak' },
    { code: 'SL', name: 'Slovenian' },
    { code: 'SV', name: 'Swedish' },
    { code: 'TR', name: 'Turkish' },
    { code: 'UK', name: 'Ukrainian' },
    { code: 'ZH', name: 'Chinese' },
];
```

**Action**: Replace with import:
```javascript
// Get language options from shared module
const languagesForMain = getLanguageOptions(false); // No "None" option for main language
const languagesForSecondary = getLanguageOptions(true); // Include "None" for secondary
```

**Current Code** (lines 92-100):
```javascript
// Populate string lists
languages.forEach(lang => {
    if (lang.code !== '') { // Main language shouldn't be "None"
        languageListMain.append(lang.name);
    }
    languageListSecondary.forEach(list => {
        list.append(lang.name);
    });
});
```

**Action**: Replace with:
```javascript
// Populate string lists from shared language data
languagesForMain.forEach(lang => {
    languageListMain.append(lang.name);
});

languagesForSecondary.forEach(lang => {
    languageListSecondary.forEach(list => {
        list.append(lang.name);
    });
});
```

**Current Code** (lines 102-120):
```javascript
// Helper function to find index from language code
const findLanguageIndex = (code, includeNone = false) => {
    const startIndex = includeNone ? 0 : 1;
    for (let i = startIndex; i < languages.length; i++) {
        if (languages[i].code === code) {
            return includeNone ? i : i - 1;
        }
    }
    return includeNone ? 0 : -1; // Default to "None" or -1
};

// Helper function to get language code from index
const getLanguageCode = (index, includeNone = false) => {
    const actualIndex = includeNone ? index : index + 1;
    if (actualIndex >= 0 && actualIndex < languages.length) {
        return languages[actualIndex].code;
    }
    return '';
};
```

**Action**: Update to use new data:
```javascript
// Helper function to find index from language code
const findLanguageIndex = (code, includeNone = false) => {
    const languages = includeNone ? languagesForSecondary : languagesForMain;
    for (let i = 0; i < languages.length; i++) {
        if (languages[i].code === code) {
            return i;
        }
    }
    return 0; // Default to first option
};

// Helper function to get language code from index
const getLanguageCode = (index, includeNone = false) => {
    const languages = includeNone ? languagesForSecondary : languagesForMain;
    if (index >= 0 && index < languages.length) {
        return languages[index].code;
    }
    return '';
};
```

#### Step 4: Test Language Map

**Test Procedure**:

1. Copy updated files:
```bash
cp lib/languageMap.js ~/.local/share/gnome-shell/extensions/deepl-translator@juan-de-costa-rica/lib/
cp extension.js ~/.local/share/gnome-shell/extensions/deepl-translator@juan-de-costa-rica/
cp prefs.js ~/.local/share/gnome-shell/extensions/deepl-translator@juan-de-costa-rica/
```

2. Log out and log back in

3. Test extension UI:
   - Click extension icon
   - Verify language buttons show correct names

4. Test preferences:
   - Open preferences
   - Verify all dropdowns show correct languages
   - Change main language
   - Change secondary languages
   - Verify changes are saved

5. Test translation with various languages:
   - Select different secondary languages
   - Verify translations work

**Expected Result**: All language names consistent, no errors

#### Step 5: Commit Changes

```bash
git add lib/languageMap.js extension.js prefs.js
git commit -m "$(cat <<'EOF'
refactor: Extract language mapping to shared module (DRY)

Eliminated code duplication by creating a shared language map module
used by both extension.js and prefs.js.

Changes:
- Created lib/languageMap.js with language data and utilities
- Removed duplicate language arrays from extension.js (11 lines)
- Removed duplicate language arrays from prefs.js (33 lines)
- Added helper functions: getLanguageName, isValidLanguage, getLanguageOptions
- Updated both files to import from shared module

Benefits:
- Single source of truth for language data
- Easier to add new languages (one place to update)
- Reduced code duplication (44 lines eliminated)
- Consistent language names across UI
- Added validation utilities for future use

Code reduction: ~44 lines

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 2.3: Add Input Validation

**Estimated Time**: 30 minutes
**Files Modified**: `extension.js`, `translator.js`

#### Step 1: Add Validation to translator.js

**Location**: `/var/home/juan/Desktop/Code/gnome-deepl-translator/translator.js`

**Current Code** (line 3):
```javascript
import Gio from 'gi://Gio';
```

**Action**: Add import after line 3:
```javascript
import Gio from 'gi://Gio';
import {isValidLanguage} from './lib/languageMap.js';
```

**Current Code** (lines 19-24):
```javascript
async translate(text, sourceLang, targetLang, cancellable = null) {
    // Validate inputs
    if (!this.apiKey || this.apiKey === '') {
        console.error('DeepL Translator: API key not configured');
        throw new Error('API key not configured. Please set it in preferences.');
    }
```

**Action**: Add language validation after API key check:
```javascript
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
```

#### Step 2: Add Validation to extension.js

**Location**: `/var/home/juan/Desktop/Code/gnome-deepl-translator/extension.js`

**Current Code** (line 14):
```javascript
import {LANGUAGE_NAMES} from './lib/languageMap.js';
```

**Action**: Add import:
```javascript
import {LANGUAGE_NAMES, SUPPORTED_LANGUAGES} from './lib/languageMap.js';
```

**Current Code** (lines 198-227, _rebuildLanguageButtons):
```javascript
_rebuildLanguageButtons() {
    // Clear existing buttons
    this._langButtonsBox.destroy_all_children();
    this._langButtons = {};

    // Get available languages from settings (comma-separated string)
    const availableLangsStr = this._settings.get_string('available-languages');
    const languageCodes = availableLangsStr.split(',').map(code => code.trim()).filter(code => code);

    // Create a button for each language
    languageCodes.forEach(code => {
        const label = LANGUAGE_NAMES[code] || code; // Fallback to code if name not found
        const button = new St.Button({
            label: label,
            style_class: 'deepl-lang-button',
        });
        button.connect('clicked', () => {
            this._currentSecondaryLang = code;
            this._settings.set_string('last-used-language', code);
            this._updateButtonStates();
            // Trigger translation immediately when language button is clicked
            this._doTranslation();
        });
        this._langButtons[code] = button;
        this._langButtonsBox.add_child(button);
    });

    // Ensure current language is still valid, reset to first if not
    if (languageCodes.length > 0 && !languageCodes.includes(this._currentSecondaryLang)) {
        this._currentSecondaryLang = languageCodes[0];
        this._settings.set_string('last-used-language', this._currentSecondaryLang);
    }

    this._updateButtonStates();
}
```

**Action**: Add validation at the start:
```javascript
_rebuildLanguageButtons() {
    // Clear existing buttons
    this._langButtonsBox.destroy_all_children();
    this._langButtons = {};

    // Get available languages from settings (comma-separated string)
    const availableLangsStr = this._settings.get_string('available-languages');
    const languageCodes = availableLangsStr.split(',')
        .map(code => code.trim())
        .filter(code => code);

    // ADDED: Validate language codes
    const validCodes = languageCodes.filter(code => {
        if (!SUPPORTED_LANGUAGES.includes(code)) {
            console.warn(`DeepL Translator: Invalid language code in settings: ${code}`);
            return false;
        }
        return true;
    });

    // If no valid codes, use default
    if (validCodes.length === 0) {
        console.warn('DeepL Translator: No valid language codes, using default ES');
        validCodes.push('ES');
    }

    // Create a button for each valid language
    validCodes.forEach(code => {
        const label = LANGUAGE_NAMES[code];
        const button = new St.Button({
            label: label,
            style_class: 'deepl-lang-button',
        });
        button.connect('clicked', () => {
            this._currentSecondaryLang = code;
            this._settings.set_string('last-used-language', code);
            this._updateButtonStates();
            // Trigger translation immediately when language button is clicked
            this._doTranslation();
        });
        this._langButtons[code] = button;
        this._langButtonsBox.add_child(button);
    });

    // Ensure current language is still valid, reset to first if not
    if (validCodes.length > 0 && !validCodes.includes(this._currentSecondaryLang)) {
        this._currentSecondaryLang = validCodes[0];
        this._settings.set_string('last-used-language', this._currentSecondaryLang);
    }

    this._updateButtonStates();
}
```

**Current Code** (lines 169-170):
```javascript
// Initialize languages from settings
this._mainLanguage = this._settings.get_string('main-language');
```

**Action**: Add validation:
```javascript
// Initialize languages from settings with validation
this._mainLanguage = this._settings.get_string('main-language');
if (!SUPPORTED_LANGUAGES.includes(this._mainLanguage)) {
    console.warn(`DeepL Translator: Invalid main language ${this._mainLanguage}, using EN`);
    this._mainLanguage = 'EN';
    this._settings.set_string('main-language', 'EN');
}
```

#### Step 3: Test Input Validation

**Test Procedure**:

1. Copy updated files:
```bash
cp translator.js ~/.local/share/gnome-shell/extensions/deepl-translator@juan-de-costa-rica/
cp extension.js ~/.local/share/gnome-shell/extensions/deepl-translator@juan-de-costa-rica/
```

2. Test invalid language code in settings:
```bash
# Temporarily set invalid language
dconf write /org/gnome/shell/extensions/deepl-translator/available-languages "'XX,YY,ZZ'"
```

3. Log out and log back in

4. Check logs:
```bash
journalctl -b -o cat /usr/bin/gnome-shell | grep "DeepL Translator" | grep -i invalid
```

5. Verify extension falls back to default (ES)

6. Reset to valid codes:
```bash
dconf write /org/gnome/shell/extensions/deepl-translator/available-languages "'ES,FR,DE'"
```

7. Test normal operation

**Expected Result**: Invalid codes logged and rejected, extension uses defaults

#### Step 4: Commit Changes

```bash
git add translator.js extension.js
git commit -m "$(cat <<'EOF'
feat: Add input validation for language codes

Added validation to prevent errors from invalid language codes
in settings or API calls.

Changes:
- Added validation in translator.translate() for source and target languages
- Added validation in extension._rebuildLanguageButtons() to filter invalid codes
- Added validation for main language on initialization
- Added fallback to defaults when invalid codes detected
- Added warning logs for invalid language codes

Benefits:
- Prevents API errors from invalid language codes
- Protects against manual settings corruption
- Provides clear error messages for debugging
- Fails gracefully with sensible defaults

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 2.4: Set Up ESLint

**Estimated Time**: 30 minutes
**Files Modified**: None (new files: `.eslintrc.json`, `.eslintignore`)

#### Step 1: Install ESLint

```bash
npm install -g eslint
```

#### Step 2: Create ESLint Configuration

**Location**: `/var/home/juan/Desktop/Code/gnome-deepl-translator/.eslintrc.json`

**Action**: Create new file:

```json
{
    "env": {
        "es2021": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 12,
        "sourceType": "module"
    },
    "globals": {
        "imports": "readonly",
        "global": "readonly",
        "log": "readonly",
        "logError": "readonly",
        "print": "readonly",
        "printerr": "readonly"
    },
    "rules": {
        "indent": ["error", 4],
        "linebreak-style": ["error", "unix"],
        "quotes": ["error", "single"],
        "semi": ["error", "always"],
        "no-unused-vars": ["warn", {"argsIgnorePattern": "^_"}],
        "no-console": "off",
        "prefer-const": "warn"
    }
}
```

#### Step 3: Create ESLint Ignore File

**Location**: `/var/home/juan/Desktop/Code/gnome-deepl-translator/.eslintignore`

**Action**: Create new file:

```
node_modules/
schemas/gschemas.compiled
*.zip
```

#### Step 4: Run ESLint and Fix Issues

```bash
cd /var/home/juan/Desktop/Code/gnome-deepl-translator
eslint extension.js translator.js prefs.js lib/*.js
```

Fix any errors reported. Common issues might be:
- Missing semicolons
- Inconsistent indentation
- Unused variables

**Auto-fix simple issues**:
```bash
eslint --fix extension.js translator.js prefs.js lib/*.js
```

#### Step 5: Add ESLint to Git

```bash
git add .eslintrc.json .eslintignore
git commit -m "$(cat <<'EOF'
chore: Add ESLint configuration for code quality

Added ESLint with recommended rules for consistent code style
and catching common errors.

Configuration:
- ES2021 environment
- ESLint recommended rules
- 4-space indentation
- Single quotes
- Semicolons required
- GNOME Shell globals defined

Files:
- .eslintrc.json: ESLint configuration
- .eslintignore: Files to ignore

Usage:
eslint extension.js translator.js prefs.js lib/*.js

Auto-fix:
eslint --fix extension.js translator.js prefs.js lib/*.js

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 2.5: Optimize Button Rebuilding

**Estimated Time**: 30 minutes
**Files Modified**: `extension.js`

#### Step 1: Add Optimization to _rebuildLanguageButtons

**Location**: `/var/home/juan/Desktop/Code/gnome-deepl-translator/extension.js`

**Current Code** (line 181, start of _rebuildLanguageButtons):
```javascript
_rebuildLanguageButtons() {
    // Clear existing buttons
    this._langButtonsBox.destroy_all_children();
    this._langButtons = {};
```

**Action**: Add comparison before rebuild:
```javascript
_rebuildLanguageButtons() {
    // Get available languages from settings
    const availableLangsStr = this._settings.get_string('available-languages');
    const languageCodes = availableLangsStr.split(',')
        .map(code => code.trim())
        .filter(code => code);

    // OPTIMIZATION: Check if codes actually changed before rebuilding
    const currentCodes = Object.keys(this._langButtons).sort().join(',');
    const newCodes = languageCodes.filter(code => SUPPORTED_LANGUAGES.includes(code)).sort().join(',');

    if (currentCodes === newCodes && Object.keys(this._langButtons).length > 0) {
        // Codes haven't changed, just update button states
        this._updateButtonStates();
        return;
    }

    // Codes changed, do full rebuild
    console.log('DeepL Translator: Rebuilding language buttons');

    // Clear existing buttons
    this._langButtonsBox.destroy_all_children();
    this._langButtons = {};
```

The rest of the method remains the same.

#### Step 2: Test Optimization

**Test Procedure**:

1. Copy updated file:
```bash
cp extension.js ~/.local/share/gnome-shell/extensions/deepl-translator@juan-de-costa-rica/
```

2. Log out and log back in

3. Monitor logs:
```bash
journalctl -f -o cat /usr/bin/gnome-shell | grep "DeepL Translator"
```

4. Click extension icon multiple times:
   - Should NOT see "Rebuilding language buttons" unless you change settings

5. Open preferences and change a language:
   - Should see "Rebuilding language buttons" once

**Expected Result**: Buttons only rebuild when necessary

#### Step 3: Commit Changes

```bash
git add extension.js
git commit -m "$(cat <<'EOF'
perf: Optimize language button rebuilding

Added comparison check to only rebuild buttons when language codes
actually change, reducing unnecessary UI operations.

Changes:
- Added code comparison before rebuilding buttons
- Only rebuild when codes change
- Just update styling when codes are same
- Added debug log when rebuilding occurs

Benefits:
- Reduced UI flicker
- Better responsiveness
- Fewer unnecessary widget destructions
- Cleaner logs

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Phase 2 Completion Checklist

- [ ] Task 2.1: Async/await implemented and tested
- [ ] Task 2.2: Shared language map created
- [ ] Task 2.3: Input validation added
- [ ] Task 2.4: ESLint configured
- [ ] Task 2.5: Button rebuilding optimized
- [ ] All tests passing
- [ ] ESLint passing with zero errors
- [ ] All commits pushed to git
- [ ] Extension version ready for v2.6 tag

**Verification Commands**:
```bash
# Run ESLint
eslint extension.js translator.js prefs.js lib/*.js

# Check extension status
gnome-extensions info deepl-translator@juan-de-costa-rica

# Count lines of code reduced
git diff v2.5 --stat

# Check for errors
journalctl -b -o cat /usr/bin/gnome-shell | grep -i error | grep deepl
```

**Tag v2.6**:
```bash
git tag -a v2.6 -m "Version 2.6 - Code Quality Improvements

- Modernized to async/await pattern
- Extracted shared language map (DRY principle)
- Added input validation for language codes
- Set up ESLint for code quality
- Optimized button rebuilding

Code reduction: ~50 lines
Quality: ESLint passing, zero errors"

git push origin v2.6
```

---

## Phase 3: Polish & Documentation (v2.7)

**Goal**: Prepare for public release
**Estimated Time**: 2 hours
**Priority**: MEDIUM

### Task 3.1: Add JSDoc Comments

**Estimated Time**: 1 hour
**Files Modified**: `translator.js`, `extension.js`, `lib/keyring.js`, `lib/languageMap.js`

**Note**: This task adds comprehensive documentation to all public methods.

#### Step 1: Document translator.js

**Location**: `/var/home/juan/Desktop/Code/gnome-deepl-translator/translator.js`

Add JSDoc comments to the class and all public methods:

```javascript
/**
 * DeepL API Translation Service
 *
 * Handles communication with the DeepL API for text translation.
 * Uses GNOME Soup 3 for HTTP requests with async/await pattern.
 *
 * @example
 * const translator = new DeepLTranslator(apiKey);
 * const result = await translator.translate('Hello', null, 'ES');
 * console.log(result.text); // "Hola"
 */
export class DeepLTranslator {
    /**
     * Create a new DeepL translator instance
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
     *
     * @param {string} text - Text to translate (max 50,000 characters)
     * @param {string|null} sourceLang - Source language code (e.g., 'EN', 'ES') or null for auto-detect
     * @param {string} targetLang - Target language code (e.g., 'EN', 'ES')
     * @param {Gio.Cancellable|null} cancellable - Optional cancellable for async operation
     * @returns {Promise<{text: string, detectedSourceLang: string|null}>} Translation result
     * @throws {Error} If API key is invalid, quota exceeded, or network error
     *
     * @example
     * // Auto-detect source language
     * const result = await translator.translate('Hello', null, 'ES');
     * console.log(result.text); // "Hola"
     * console.log(result.detectedSourceLang); // "EN"
     *
     * @example
     * // Explicit source language
     * const result = await translator.translate('Hello', 'EN', 'FR');
     * console.log(result.text); // "Bonjour"
     */
    async translate(text, sourceLang, targetLang, cancellable = null) {
        // ... existing implementation
    }

    /**
     * Cleanup translator resources
     *
     * Aborts any pending HTTP requests and clears sensitive data from memory.
     * Should be called when the translator is no longer needed.
     */
    destroy() {
        // ... existing implementation
    }
}
```

#### Step 2: Document extension.js (Key Methods)

Add JSDoc to key public/private methods in extension.js:

```javascript
/**
 * DeepL Translator Indicator
 *
 * GNOME Shell panel button that provides quick access to translation functionality.
 * Features auto-detection, smart language switching, and clipboard integration.
 */
const TranslatorIndicator = GObject.registerClass(
class TranslatorIndicator extends PanelMenu.Button {
    /**
     * Initialize the translator indicator
     * @param {Extension} extension - The extension instance
     */
    _init(extension) {
        // ... existing implementation
    }

    /**
     * Build the user interface for the translation popup
     *
     * Creates:
     * - Header with title and settings button
     * - Secondary language selector buttons
     * - Translation result display with scrolling
     * - Copied indicator
     *
     * @private
     */
    _buildUI() {
        // ... existing implementation
    }

    /**
     * Rebuild language buttons from settings
     *
     * Dynamically creates buttons based on available-languages setting.
     * Validates language codes and falls back to defaults if invalid.
     * Optimized to only rebuild when codes actually change.
     *
     * @private
     */
    _rebuildLanguageButtons() {
        // ... existing implementation
    }

    /**
     * Update button visual states to show selected language
     *
     * Adds 'deepl-lang-button-active' class to selected button,
     * removes from others.
     *
     * @private
     */
    _updateButtonStates() {
        // ... existing implementation
    }

    /**
     * Check clipboard and auto-translate if text is new
     *
     * Tries PRIMARY selection first (selected text), falls back to CLIPBOARD.
     * Only translates if text differs from last translation to avoid redundant API calls.
     *
     * @private
     */
    _checkAndAutoTranslate() {
        // ... existing implementation
    }

    /**
     * Perform translation with smart language detection
     *
     * Smart logic:
     * - If detected language ≠ main language → translate to main (reading mode)
     * - If detected language = main language → translate to secondary (writing mode)
     *
     * @param {string} sourceText - Text to translate
     * @private
     */
    async _performTranslation(sourceText) {
        // ... existing implementation
    }

    /**
     * Auto-copy translation to clipboard based on settings
     *
     * Checks user preferences:
     * - auto-copy-to-primary: Copy when translating to main language
     * - auto-copy-to-secondary: Copy when translating to secondary language
     *
     * Shows "✓ Copied!" indicator when copy occurs.
     *
     * @param {string} text - Translated text to copy
     * @param {string} targetLanguage - Language code of the translation
     * @private
     */
    _autoCopyToClipboard(text, targetLanguage) {
        // ... existing implementation
    }

    /**
     * Cleanup resources and disconnect signals
     *
     * Must be called when indicator is destroyed to prevent memory leaks.
     */
    destroy() {
        // ... existing implementation
    }
});
```

#### Step 3: Verify lib Files Are Documented

**lib/keyring.js** and **lib/languageMap.js** already have JSDoc comments from previous tasks.

#### Step 4: Test Documentation

```bash
# Generate documentation preview (optional, requires jsdoc)
npm install -g jsdoc
jsdoc translator.js extension.js lib/*.js -d docs/
```

#### Step 5: Commit Changes

```bash
git add translator.js extension.js
git commit -m "$(cat <<'EOF'
docs: Add comprehensive JSDoc comments to all modules

Added detailed JSDoc documentation to all classes and methods
for better code understanding and maintainability.

Changes:
- Added class-level documentation
- Documented all public methods with @param, @returns, @throws
- Added usage examples for key methods
- Documented private methods for developer reference
- Added descriptions of complex logic

Benefits:
- Better code understanding for contributors
- IDE autocomplete support
- Easier onboarding for new developers
- Foundation for automated documentation generation

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 3.2: Update README.md

**Estimated Time**: 30 minutes
**Files Modified**: `README.md`

#### Step 1: Update README with Security Notes

**Location**: `/var/home/juan/Desktop/Code/gnome-deepl-translator/README.md`

Add sections to the existing README (read it first to understand structure):

<function_calls>
<invoke name="Read">
<parameter name="file_path">/var/home/juan/Desktop/Code/gnome-deepl-translator/README.md


