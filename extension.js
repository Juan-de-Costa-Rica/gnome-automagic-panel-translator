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

const TranslatorIndicator = GObject.registerClass(
class TranslatorIndicator extends PanelMenu.Button {
    _init(extension) {
        super._init(0.0, 'DeepL Translator', false);

        this._extension = extension;
        this._settings = extension.getSettings();
        this._translator = null;

        // Create panel icon
        this._icon = new St.Icon({
            icon_name: 'accessories-character-map-symbolic',
            style_class: 'system-status-icon',
        });
        this.add_child(this._icon);

        // Build the UI
        this._buildUI();

        // Initialize translator with API key from settings
        this._updateTranslator();

        // No longer need to set focus since we removed the text entry

        // Clear result field when menu closes
        this._menuOpenStateChangedId = this.menu.connect('open-state-changed', (menu, isOpen) => {
            if (!isOpen) {
                // Menu is closing - clear the result and hide copied indicator
                this._resultLabel.set_text('');
                this._copiedIndicator.visible = false;
            }
        });

        // Watch for settings changes
        this._settingsChangedId = this._settings.connect('changed::api-key', () => {
            this._updateTranslator();
        });
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
            style: 'padding: 10px; min-width: 400px;',
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

        // Translate button (tries PRIMARY selection first, falls back to CLIPBOARD)
        this._translateButton = new St.Button({
            label: 'Translate',
            style_class: 'deepl-translate-button',
            style: 'margin-bottom: 10px;',
        });
        this._translateButton.connect('clicked', () => {
            this._doTranslation();
        });
        box.add_child(this._translateButton);

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

        // Translation result display
        this._resultLabel = new St.Label({
            text: '',
            style: 'background-color: rgba(255, 255, 255, 0.05); padding: 10px; border-radius: 4px; min-height: 60px;',
        });
        this._resultLabel.clutter_text.set_line_wrap(true);
        this._resultLabel.clutter_text.set_line_wrap_mode(Pango.WrapMode.WORD_CHAR);
        box.add_child(this._resultLabel);

        menuItem.add_child(box);
        this.menu.addMenuItem(menuItem);

        // Initialize languages from settings
        this._mainLanguage = this._settings.get_string('main-language');
        this._currentSecondaryLang = this._settings.get_string('last-used-language');

        // Build language buttons dynamically from settings
        this._rebuildLanguageButtons();

        // Watch for language settings changes
        this._availableLangsChangedId = this._settings.connect('changed::available-languages', () => {
            this._rebuildLanguageButtons();
        });
    }

    _rebuildLanguageButtons() {
        // Clear existing buttons
        this._langButtonsBox.destroy_all_children();
        this._langButtons = {};

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

        // Get available languages from settings (comma-separated string)
        const availableLangsStr = this._settings.get_string('available-languages');
        const languageCodes = availableLangsStr.split(',').map(code => code.trim()).filter(code => code);

        // Create a button for each language
        languageCodes.forEach(code => {
            const label = languageNames[code] || code; // Fallback to code if name not found
            const button = new St.Button({
                label: label,
                style_class: 'deepl-lang-button',
            });
            button.connect('clicked', () => {
                this._currentSecondaryLang = code;
                this._settings.set_string('last-used-language', code);
                this._updateButtonStates();
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

    _updateTranslator() {
        const apiKey = this._settings.get_string('api-key');
        if (this._translator) {
            this._translator.destroy();
        }
        this._translator = new DeepLTranslator(apiKey);
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

    _performTranslation(sourceText) {
        if (!sourceText || sourceText.trim() === '') {
            this._resultLabel.set_text('No text found. Select or copy text first.');
            return;
        }

        // Show loading state
        this._resultLabel.set_text('Translating...');
        this._translateButton.set_label('...');

        // Use auto-detect (null source language) and let API detect
        // Then decide target language based on detected source
        this._translator.translate(
            sourceText,
            null, // Auto-detect source language
            this._currentSecondaryLang, // Use secondary lang as initial target
            (translatedText, detectedSourceLang, error) => {
                this._translateButton.set_label('Translate');

                        if (error) {
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
                                        this._resultLabel.set_text(`Error: ${err}`);
                                    } else {
                                        this._resultLabel.set_text(finalText);
                                        this._lastTranslation = finalText;
                                        // Auto-copy to clipboard after successful translation
                                        this._autoCopyToClipboard(finalText);
                                    }
                                }
                            );
                        } else {
                            // Detected language IS our main language (or couldn't detect)
                            // Use the translation to secondary language we already got
                            this._resultLabel.set_text(translatedText);
                            this._lastTranslation = translatedText;
                            // Auto-copy to clipboard after successful translation
                            this._autoCopyToClipboard(translatedText);
                        }
                    }
                );
            }
        );
    }

    _autoCopyToClipboard(text) {
        // Automatically copy translation to clipboard
        St.Clipboard.get_default().set_text(
            St.ClipboardType.CLIPBOARD,
            text
        );

        // Visual feedback - show "✓ Copied!" indicator
        // Will stay visible until menu closes (handled by open-state-changed signal)
        this._copiedIndicator.visible = true;
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
