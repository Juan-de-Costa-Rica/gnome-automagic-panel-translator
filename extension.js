import St from 'gi://St';
import Clutter from 'gi://Clutter';
import Pango from 'gi://Pango';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Shell from 'gi://Shell';
import Meta from 'gi://Meta';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import {DeepLTranslator} from './translator.js';
import {SecureStorage} from './lib/keyring.js';
import {LANGUAGE_NAMES, SUPPORTED_LANGUAGES} from './lib/languageMap.js';

/**
 * Automagic Panel Translator Indicator
 *
 * GNOME Shell panel button that provides quick access to translation functionality.
 * Features automatic language detection, and smart language switching.
 *
 * Modes:
 * - Reading mode: Foreign text → Main language (with auto-copy option)
 * - Writing mode: Main language → Secondary language (with auto-copy option)
 */
const TranslatorIndicator = GObject.registerClass(
    class TranslatorIndicator extends PanelMenu.Button {
        /**
         * Initialize the translator indicator
         *
         * Sets up the UI, initializes the translator with secure API key from keyring,
         * and establishes settings watchers for dynamic configuration updates.
         *
         * @param {Extension} extension - The extension instance
         */
        _init(extension) {
            super._init(0.0, _('Automagic Panel Translator'), false);

            this._extension = extension;
            this._settings = extension.getSettings();
            this._translator = null;
            this._lastSourceText = ''; // Track last translated source text for smart auto-translate
            this._currentSelection = ''; // Store the current selection to translate
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

            // Set up keyboard shortcut
            this._setupKeybinding();

            // No longer need to set focus since we removed the text entry

            // EGO COMPLIANCE: Don't translate on menu open.
            // Just grab the selection to show the user what text will be sent to DeepL.
            this._menuOpenStateChangedId = this.menu.connect('open-state-changed', (menu, isOpen) => {
                if (isOpen) {
                    this._updateSelectionPreview();
                } else {
                    // Menu is closing - clear the result and hide copied indicator
                    this._resultLabel.set_text('');
                    this._copiedIndicator.visible = false;
                }
            });

        // API key updates are handled directly in prefs.js via keyring
        // No need to watch for settings changes here
        }

        /**
         * Build the user interface for the translation popup
         *
         * Creates:
         * - Header with title and settings button
         * - Secondary language selector buttons
         * - Translation result display with scrolling support
         * - Copied indicator
         *
         * @private
         */
        _buildUI() {
        // Create a custom menu item container
            const menuItem = new PopupMenu.PopupBaseMenuItem({
                reactive: false,
                can_focus: false,
            });

            // Main container
            const box = new St.BoxLayout({
                vertical: true,
                style_class: 'automagic-translator-box',
                style: 'padding: 10px; min-width: 400px; max-width: 500px;',
            });

            const headerBox = new St.BoxLayout({
                vertical: false,
                style: 'margin-bottom: 10px;',
            });

            const titleLabel = new St.Label({
                text: _('Automagic Panel Translator'),
                style_class: 'automagic-header-title',
                x_expand: true,
                y_align: Clutter.ActorAlign.CENTER,
            });
            headerBox.add_child(titleLabel);

            const settingsButton = new St.Button({
                style_class: 'automagic-settings-button', // New flat style
                can_focus: true,
                x_align: Clutter.ActorAlign.END,
                y_align: Clutter.ActorAlign.CENTER,
                child: new St.Icon({
                    icon_name: 'preferences-system-symbolic', // Standard gear icon
                    style_class: 'popup-menu-icon',
                }),
            });
            settingsButton.connect('clicked', () => {
                this._extension.openPreferences();
                this.menu.close();
            });
            headerBox.add_child(settingsButton);

            box.add_child(headerBox);

            // Source text preview (EGO Compliance: User must see what is being sent)
            const sourcePreviewLabel = new St.Label({
                text: _('Selected Text:'),
                style: 'font-weight: bold; margin-bottom: 5px;',
            });
            box.add_child(sourcePreviewLabel);

            this._sourcePreview = new St.Label({
                text: '',
                style: 'background-color: rgba(255, 255, 255, 0.03); padding: 8px; border-radius: 4px; color: #ccc; font-style: italic; margin-bottom: 10px;',
            });
            this._sourcePreview.clutter_text.line_wrap = true;
            this._sourcePreview.clutter_text.max_width_chars = 40;
            this._sourcePreview.clutter_text.ellipsize = Pango.EllipsizeMode.END;
            box.add_child(this._sourcePreview);

            // Secondary language selector label
            const secondaryLangLabel = new St.Label({
                text: _('Translate to:'),
                style: 'font-weight: bold; margin-bottom: 5px;',
            });
            box.add_child(secondaryLangLabel);

            // Secondary language buttons row
            this._langButtonsBox = new St.BoxLayout({
                style: 'margin-bottom: 15px; spacing: 5px;',
            });

            this._langButtons = {};

            box.add_child(this._langButtonsBox);

            // Main Action Button (EGO Compliance: Explicit user action for network request)
            this._translateButton = new St.Button({
                label: _('Translate Selection'),
                style_class: 'automagic-translate-button',
                x_expand: true,
                can_focus: true,
            });
            this._translateButton.connect('clicked', () => {
                if (this._currentSelection && this._currentSelection.trim() !== '') {
                    this._performTranslation(this._currentSelection);
                }
            });
            box.add_child(this._translateButton);

            // Spacer
            box.add_child(new St.Widget({style: 'height: 15px;'}));

            // Translation result label with copied indicator
            const resultHeaderBox = new St.BoxLayout({
                style: 'margin-bottom: 5px;',
            });

            const resultLabel = new St.Label({
                text: _('Translation:'),
                style: 'font-weight: bold;',
            });
            resultHeaderBox.add_child(resultLabel);

            // Copied indicator (initially hidden)
            this._copiedIndicator = new St.Label({
                text: _('  ✓ Copied!'),
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
                reactive: true, // Make it clickable
            });
            this._resultLabel.clutter_text.line_wrap = true;
            this._resultLabel.clutter_text.line_wrap_mode = Pango.WrapMode.WORD_CHAR;
            this._resultLabel.clutter_text.ellipsize = Pango.EllipsizeMode.NONE;

            // Add click handler for manual copy
            this._resultLabel.connect('button-press-event', (actor, event) => {
                const text = actor.get_text();
                // Only copy if we have a valid translation and it matches the clicked text
                if (this._lastTranslation && this._lastTranslation === text) {
                    this._manualCopyToClipboard(text);
                    return Clutter.EVENT_STOP;
                }
                return Clutter.EVENT_PROPAGATE;
            });

            scrollBox.add_child(this._resultLabel);
            scrollView.set_child(scrollBox);
            box.add_child(scrollView);

            menuItem.add_child(box);
            this.menu.addMenuItem(menuItem);

            // Initialize languages from settings with validation
            this._mainLanguage = this._settings.get_string('main-language');
            if (!SUPPORTED_LANGUAGES.includes(this._mainLanguage)) {
                // console.warn(`Automagic Panel Translator: Invalid main language ${this._mainLanguage}, using EN`);
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

        /**
         * Rebuild language buttons from settings
         *
         * Dynamically creates buttons based on available-languages setting.
         * Validates language codes and falls back to defaults if invalid.
         * Only rebuilds when language codes actually change (optimized).
         *
         * @private
         */
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
            // console.log('Automagic Panel Translator: Rebuilding language buttons');

            // Clear existing buttons
            this._langButtonsBox.destroy_all_children();
            this._langButtons = {};

            // Validate language codes
            const validCodes = languageCodes.filter(code => {
                if (!SUPPORTED_LANGUAGES.includes(code)) {
                    // console.warn(`Automagic Panel Translator: Invalid language code in settings: ${code}`);
                    return false;
                }
                return true;
            });

            // If no valid codes, use default
            if (validCodes.length === 0) {
                // console.warn('Automagic Panel Translator: No valid language codes, using default ES');
                validCodes.push('ES');
            }

            // Create a button for each valid language
            validCodes.forEach(code => {
                const label = LANGUAGE_NAMES[code];
                const button = new St.Button({
                    label: label,
                    style_class: 'automagic-lang-button',
                });
                button.connect('clicked', () => {
                    this._currentSecondaryLang = code;
                    this._settings.set_string('last-used-language', code);
                    this._updateButtonStates();
                    // Don't re-translate automatically on button change (EGO Compliance)
                    // The user will see the new target language reflected in their next click
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

        /**
         * Update button visual states to show selected language
         *
         * Adds 'automagic-lang-button-active' class to selected button,
         * removes from others.
         *
         * @private
         */
        _updateButtonStates() {
        // Update button styling to show which secondary language is selected
            for (const [code, button] of Object.entries(this._langButtons)) {
                if (code === this._currentSecondaryLang) {
                    button.add_style_class_name('automagic-lang-button-active');
                } else {
                    button.remove_style_class_name('automagic-lang-button-active');
                }
            }
            this._updateButtonStates();
        }

        /**
         * Set up the global keyboard shortcut
         * @private
         */
        _setupKeybinding() {
            Main.wm.addKeybinding(
                'translate-shortcut',
                this._settings,
                Meta.KeyBindingFlags.NONE,
                Shell.ActionMode.ALL,
                () => {
                    this._onShortcutTriggered();
                }
            );
        }

        /**
         * Handle keyboard shortcut trigger
         * (EGO Compliance: User initiated action)
         * @private
         */
        _onShortcutTriggered() {
            // 1. Open the menu if not already open
            if (!this.menu.isOpen) {
                this.menu.open(true);
            }

            // 2. Perform translation after a tiny delay to ensure selection is updated
            // and the menu is ready
            GLib.timeout_add(GLib.PRIORITY_DEFAULT, 100, () => {
                if (this._currentSelection && this._currentSelection.trim() !== '') {
                    this._performTranslation(this._currentSelection);
                }
                return GLib.SOURCE_REMOVE;
            });
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
                // console.error('Automagic Panel Translator: Failed to initialize translator:', error);
                // Create translator with empty key as fallback
                if (this._translator) {
                    this._translator.destroy();
                }
                this._translator = new DeepLTranslator('');
            }
        }

        /**
         * Update the selection preview in the popup
         * (EGO Compliance: User must know what text is being sent to the server)
         * @private
         */
        _updateSelectionPreview() {
            St.Clipboard.get_default().get_text(
                St.ClipboardType.PRIMARY,
                (clipboard, primaryText) => {
                    this._currentSelection = primaryText ? primaryText.trim() : '';
                    if (!this._currentSelection) {
                        this._sourcePreview.set_text(_('(No text selected)'));
                        this._translateButton.set_reactive(false);
                    } else {
                        this._sourcePreview.set_text(this._currentSelection);
                        this._translateButton.set_reactive(true);
                    }
                }
            );
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
            if (!sourceText || sourceText.trim() === '') {
                // console.warn('Automagic Panel Translator: Empty source text for translation');
                this._resultLabel.set_text(_('No text found. Select or copy text first.'));
                return;
            }

            // Store source text for comparison on next menu open
            this._lastSourceText = sourceText.trim();

            // Show loading state
            this._resultLabel.set_text(_('Translating...'));

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
                    this._autoCopyToClipboard(finalResult.text, true);
                } else {
                // Detected main language -> use translation to secondary (writing mode)
                    this._resultLabel.set_text(result.text);
                    this._lastTranslation = result.text;
                    this._autoCopyToClipboard(result.text, false);
                }
            } catch (error) {
            // Handle cancellation silently
                if (error.message === 'Translation cancelled') {
                    // console.log('Automagic Panel Translator: Translation cancelled');
                    return;
                }

                // Log and display other errors
                // console.error('Automagic Panel Translator: Translation failed:', error);
                this._resultLabel.set_text(_('Error: %s').format(error.message));
            }
        }

        /**
         * Copy text to clipboard and show visual feedback
         * @param {string} text - Text to copy
         * @private
         */
        _manualCopyToClipboard(text) {
            // Copy translation to clipboard
            St.Clipboard.get_default().set_text(
                St.ClipboardType.CLIPBOARD,
                text
            );

            // Visual feedback - show "✓ Copied!" indicator
            this._copiedIndicator.visible = true;
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
         * @param {boolean} isMainLanguage - Whether the target language is the main language
         * @private
         */
        _autoCopyToClipboard(text, isMainLanguage) {
            let shouldCopy = false;

            if (isMainLanguage) {
                shouldCopy = this._settings.get_boolean('auto-copy-to-primary');
            } else {
                shouldCopy = this._settings.get_boolean('auto-copy-to-secondary');
            }

            if (shouldCopy) {
                this._manualCopyToClipboard(text);
            } else {
                this._copiedIndicator.visible = false;
            }
        }

        /**
         * Cleanup resources and disconnect signals
         *
         * Must be called when indicator is destroyed to prevent memory leaks.
         * Disconnects settings watchers, menu signals, cancels pending operations,
         * and destroys translator instance.
         */
        destroy() {
            // Unregister keyboard shortcut
            Main.wm.removeKeybinding('translate-shortcut');

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

export default class AutomagicPanelTranslatorExtension extends Extension {
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