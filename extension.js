import St from 'gi://St';
import Clutter from 'gi://Clutter';
import Pango from 'gi://Pango';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Shell from 'gi://Shell';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import {DeepLTranslator} from './translator.js';
import {SecureStorage} from './lib/keyring.js';
import {LANGUAGE_NAMES, SUPPORTED_LANGUAGES} from './lib/languageMap.js';

const TranslatorIndicator = GObject.registerClass(
    class TranslatorIndicator extends PanelMenu.Button {
        _init(extension) {
            super._init(0.0, 'DeepL Translator', false);

            this._extension = extension;
            this._settings = extension.getSettings();
            this._translator = null;
            this._lastSourceText = ''; // Track last translated source text for smart auto-translate
            this._cancellable = new Gio.Cancellable(); // Cancellable for async operations to prevent memory leaks

            // Create panel icon
            this._icon = new St.Icon({
                icon_name: 'accessories-character-map-symbolic',
                style_class: 'system-status-icon',
            });
            this.add_child(this._icon);

            // Build the UI
            this._buildUI();

            // Initialize translator with API key from keyring
            this._initializeTranslator();

            // No longer need to set focus since we removed the text entry

            // Auto-translate on menu open if clipboard has new text
            this._menuOpenStateChangedId = this.menu.connect('open-state-changed', (menu, isOpen) => {
                if (isOpen) {
                // Menu is opening - check for new text and auto-translate
                    this._checkAndAutoTranslate();
                } else {
                // Menu is closing - clear the result and hide copied indicator
                    this._resultLabel.set_text('');
                    this._copiedIndicator.visible = false;
                // Don't clear _lastSourceText - we need it to compare on next open
                }
            });

        // API key updates are handled directly in prefs.js via keyring
        // No need to watch for settings changes here
        }

        _buildUI() {
        // Create a custom menu item container
            const menuItem = new PopupMenu.PopupBaseMenuItem({
                reactive: false,
                can_focus: false,
            });

            // Main container
            const box = new St.BoxLayout({
                vertical: true,
                style_class: 'deepl-translator-box',
                style: 'padding: 10px; min-width: 400px; max-width: 500px;',
            });

            // Header with title and settings button
            const headerBox = new St.BoxLayout({
                vertical: false,
                style: 'margin-bottom: 10px;',
            });

            const titleLabel = new St.Label({
                text: 'DeepL Translator',
                style: 'font-weight: bold; font-size: 1.1em;',
                x_expand: true,
            });
            headerBox.add_child(titleLabel);

            const settingsButton = new St.Button({
                style_class: 'button',
                can_focus: true,
                child: new St.Icon({
                    icon_name: 'emblem-system-symbolic',
                    style_class: 'popup-menu-icon',
                }),
            });
            settingsButton.connect('clicked', () => {
                this._extension.openPreferences();
                this.menu.close();
            });
            headerBox.add_child(settingsButton);

            box.add_child(headerBox);

            // Secondary language selector label
            const secondaryLangLabel = new St.Label({
                text: 'Secondary Language:',
                style: 'font-weight: bold; margin-bottom: 5px;',
            });
            box.add_child(secondaryLangLabel);

            // Secondary language buttons row
            this._langButtonsBox = new St.BoxLayout({
                style: 'margin-bottom: 10px; spacing: 5px;',
            });

            this._langButtons = {};

            box.add_child(this._langButtonsBox);

            // Translation result label with copied indicator
            const resultHeaderBox = new St.BoxLayout({
                style: 'margin-bottom: 5px;',
            });

            const resultLabel = new St.Label({
                text: 'Translation:',
                style: 'font-weight: bold;',
            });
            resultHeaderBox.add_child(resultLabel);

            // Copied indicator (initially hidden)
            this._copiedIndicator = new St.Label({
                text: '  ✓ Copied!',
                style: 'color: #4CAF50; font-weight: bold; margin-left: 10px;',
                visible: false,
            });
            resultHeaderBox.add_child(this._copiedIndicator);

            box.add_child(resultHeaderBox);

            // Translation result display with scrolling for long text
            const scrollView = new St.ScrollView({
                style: 'max-height: 300px;',
                x_expand: true,
                overlay_scrollbars: true,
            });
            scrollView.set_policy(St.PolicyType.NEVER, St.PolicyType.AUTOMATIC);

            // Create scrollable container (St.BoxLayout implements StScrollable)
            const scrollBox = new St.BoxLayout({
                vertical: true,
                x_expand: true,
            });

            this._resultLabel = new St.Label({
                text: '',
                style: 'background-color: rgba(255, 255, 255, 0.05); padding: 10px; border-radius: 4px; min-height: 60px;',
                x_expand: true,
            });
            this._resultLabel.clutter_text.line_wrap = true;
            this._resultLabel.clutter_text.line_wrap_mode = Pango.WrapMode.WORD_CHAR;
            this._resultLabel.clutter_text.ellipsize = Pango.EllipsizeMode.NONE;

            scrollBox.add_child(this._resultLabel);
            scrollView.set_child(scrollBox);
            box.add_child(scrollView);

            menuItem.add_child(box);
            this.menu.addMenuItem(menuItem);

            // Initialize languages from settings with validation
            this._mainLanguage = this._settings.get_string('main-language');
            if (!SUPPORTED_LANGUAGES.includes(this._mainLanguage)) {
                console.warn(`DeepL Translator: Invalid main language ${this._mainLanguage}, using EN`);
                this._mainLanguage = 'EN';
                this._settings.set_string('main-language', 'EN');
            }
            this._currentSecondaryLang = this._settings.get_string('last-used-language');

            // Build language buttons dynamically from settings
            this._rebuildLanguageButtons();

            // Watch for language settings changes
            this._availableLangsChangedId = this._settings.connect('changed::available-languages', () => {
                this._rebuildLanguageButtons();
            });
        }

        _rebuildLanguageButtons() {

            // Get available languages from settings (comma-separated string)
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

            // Validate language codes
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

        _updateButtonStates() {
        // Update button styling to show which secondary language is selected
            for (const [code, button] of Object.entries(this._langButtons)) {
                if (code === this._currentSecondaryLang) {
                    button.add_style_class_name('deepl-lang-button-active');
                } else {
                    button.remove_style_class_name('deepl-lang-button-active');
                }
            }
        }

        _checkAndAutoTranslate() {
        // Try PRIMARY selection first (selected text), fall back to CLIPBOARD
            St.Clipboard.get_default().get_text(
                St.ClipboardType.PRIMARY,
                (clipboard, primaryText) => {
                // If PRIMARY is empty, try CLIPBOARD
                    if (!primaryText || primaryText.trim() === '') {
                        St.Clipboard.get_default().get_text(
                            St.ClipboardType.CLIPBOARD,
                            (clipboard, clipboardText) => {
                                this._autoTranslateIfNew(clipboardText);
                            }
                        );
                        return;
                    }
                    this._autoTranslateIfNew(primaryText);
                }
            );
        }

        _autoTranslateIfNew(text) {
        // Only auto-translate if:
        // 1. Text is not empty
        // 2. Text is different from what we last translated
            if (text && text.trim() !== '' && text.trim() !== this._lastSourceText) {
                this._performTranslation(text.trim());
            }
        // Otherwise, do nothing (show previous translation or empty state)
        }

        async _initializeTranslator() {
            try {
            // Attempt one-time migration from dconf to keyring
                await SecureStorage.migrateFromSettings(this._settings);

                // Retrieve API key from keyring
                const apiKey = await SecureStorage.retrieveApiKey();

                // Create or recreate translator with API key from keyring
                if (this._translator) {
                    this._translator.destroy();
                }
                this._translator = new DeepLTranslator(apiKey);

            } catch (error) {
                console.error('DeepL Translator: Failed to initialize translator:', error);
                // Create translator with empty key as fallback
                if (this._translator) {
                    this._translator.destroy();
                }
                this._translator = new DeepLTranslator('');
            }
        }

        _doTranslation() {
        // Try PRIMARY selection first (selected text), fall back to CLIPBOARD
            St.Clipboard.get_default().get_text(
                St.ClipboardType.PRIMARY,
                (clipboard, primaryText) => {
                // If PRIMARY is empty, try CLIPBOARD
                    if (!primaryText || primaryText.trim() === '') {
                        St.Clipboard.get_default().get_text(
                            St.ClipboardType.CLIPBOARD,
                            (clipboard, clipboardText) => {
                                if (!clipboardText || clipboardText.trim() === '') {
                                    console.warn('DeepL Translator: No text in clipboard');
                                    this._resultLabel.set_text('No text found. Select or copy text first.');
                                    return;
                                }
                                this._performTranslation(clipboardText);
                            }
                        );
                        return;
                    }
                    this._performTranslation(primaryText);
                }
            );
        }

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

        _autoCopyToClipboard(text, targetLanguage) {
        // Check settings to determine if we should auto-copy based on target language
            let shouldCopy = false;

            if (targetLanguage === this._mainLanguage) {
            // Translating to primary language (reading mode)
                shouldCopy = this._settings.get_boolean('auto-copy-to-primary');
            } else {
            // Translating to secondary language (writing mode)
                shouldCopy = this._settings.get_boolean('auto-copy-to-secondary');
            }

            if (shouldCopy) {
            // Copy translation to clipboard
                St.Clipboard.get_default().set_text(
                    St.ClipboardType.CLIPBOARD,
                    text
                );

                // Visual feedback - show "✓ Copied!" indicator
                // Will stay visible until menu closes (handled by open-state-changed signal)
                this._copiedIndicator.visible = true;
            } else {
            // Don't copy, and don't show the copied indicator
                this._copiedIndicator.visible = false;
            }
        }

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

            // Cancel any pending async operations
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
    });

export default class DeepLTranslatorExtension extends Extension {
    enable() {
        this._indicator = new TranslatorIndicator(this);
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
    }
}
