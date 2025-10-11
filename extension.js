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
            icon_name: 'preferences-desktop-locale-symbolic',
            style_class: 'system-status-icon',
        });
        this.add_child(this._icon);

        // Build the UI
        this._buildUI();

        // Initialize translator with API key from settings
        this._updateTranslator();

        // No longer need to set focus since we removed the text entry

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

        // Removed source text label and entry - now using clipboard instead

        // Language buttons row
        const langButtonsBox = new St.BoxLayout({
            style: 'margin-bottom: 10px; spacing: 5px;',
        });

        // EN → ES button
        this._enToEsButton = new St.Button({
            label: 'EN → ES',
            style_class: 'deepl-lang-button',
        });
        this._enToEsButton.connect('clicked', () => {
            this._currentSourceLang = 'EN';
            this._currentTargetLang = 'ES';
            this._updateButtonStates();
        });
        langButtonsBox.add_child(this._enToEsButton);

        // ES → EN button
        this._esToEnButton = new St.Button({
            label: 'ES → EN',
            style_class: 'deepl-lang-button',
        });
        this._esToEnButton.connect('clicked', () => {
            this._currentSourceLang = 'ES';
            this._currentTargetLang = 'EN';
            this._updateButtonStates();
        });
        langButtonsBox.add_child(this._esToEnButton);

        box.add_child(langButtonsBox);

        // Translate from Clipboard button (on its own line)
        this._translateButton = new St.Button({
            label: 'Translate from Clipboard',
            style_class: 'deepl-translate-button',
            style: 'margin-bottom: 10px;',
        });
        this._translateButton.connect('clicked', () => {
            this._doTranslation();
        });
        box.add_child(this._translateButton);

        // Translation result label
        const resultLabel = new St.Label({
            text: 'Translation:',
            style: 'font-weight: bold; margin-bottom: 5px;',
        });
        box.add_child(resultLabel);

        // Translation result display
        this._resultLabel = new St.Label({
            text: '',
            style: 'background-color: rgba(255, 255, 255, 0.05); padding: 10px; border-radius: 4px; margin-bottom: 10px; min-height: 60px;',
        });
        this._resultLabel.clutter_text.set_line_wrap(true);
        this._resultLabel.clutter_text.set_line_wrap_mode(Pango.WrapMode.WORD_CHAR);
        box.add_child(this._resultLabel);

        // Copy button
        this._copyButton = new St.Button({
            label: 'Copy to Clipboard',
            style_class: 'deepl-copy-button',
        });
        this._copyButton.connect('clicked', () => {
            this._copyToClipboard();
        });
        box.add_child(this._copyButton);

        menuItem.add_child(box);
        this.menu.addMenuItem(menuItem);

        // Initialize language direction from settings
        this._currentSourceLang = this._settings.get_string('default-source-lang');
        this._currentTargetLang = this._settings.get_string('default-target-lang');
        this._updateButtonStates();
    }

    _updateButtonStates() {
        // Update button styling to show which is active
        if (this._currentSourceLang === 'EN' && this._currentTargetLang === 'ES') {
            this._enToEsButton.add_style_class_name('deepl-lang-button-active');
            this._esToEnButton.remove_style_class_name('deepl-lang-button-active');
        } else if (this._currentSourceLang === 'ES' && this._currentTargetLang === 'EN') {
            this._esToEnButton.add_style_class_name('deepl-lang-button-active');
            this._enToEsButton.remove_style_class_name('deepl-lang-button-active');
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
        // Read text from clipboard
        St.Clipboard.get_default().get_text(
            St.ClipboardType.CLIPBOARD,
            (clipboard, sourceText) => {
                if (!sourceText || sourceText.trim() === '') {
                    this._resultLabel.set_text('Clipboard is empty. Copy text first.');
                    return;
                }

                // Show loading state
                this._resultLabel.set_text('Translating...');
                this._translateButton.set_label('...');

                // Perform translation
                this._translator.translate(
                    sourceText,
                    this._currentSourceLang,
                    this._currentTargetLang,
                    (translatedText, error) => {
                        this._translateButton.set_label('Translate from Clipboard');

                        if (error) {
                            this._resultLabel.set_text(`Error: ${error}`);
                        } else {
                            this._resultLabel.set_text(translatedText);
                            this._lastTranslation = translatedText;
                        }
                    }
                );
            }
        );
    }

    _copyToClipboard() {
        const text = this._resultLabel.get_text();

        if (!text || text === '') {
            return;
        }

        St.Clipboard.get_default().set_text(
            St.ClipboardType.CLIPBOARD,
            text
        );

        // Visual feedback
        const originalLabel = this._copyButton.get_label();
        this._copyButton.set_label('Copied!');

        // Reset after 1.5 seconds
        if (this._copyTimeoutId) {
            GLib.Source.remove(this._copyTimeoutId);
        }

        this._copyTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1500, () => {
            this._copyButton.set_label(originalLabel);
            this._copyTimeoutId = null;

            // Clear result field after copy confirmation
            this._resultLabel.set_text('');

            return GLib.SOURCE_REMOVE;
        });
    }

    destroy() {
        if (this._settingsChangedId) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = null;
        }

        if (this._copyTimeoutId) {
            GLib.Source.remove(this._copyTimeoutId);
            this._copyTimeoutId = null;
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
