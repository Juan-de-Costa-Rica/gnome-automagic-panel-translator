import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class DeepLTranslatorPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        // Create preferences page
        const page = new Adw.PreferencesPage();
        window.add(page);

        // API Configuration group
        const apiGroup = new Adw.PreferencesGroup({
            title: 'API Configuration',
            description: 'Configure your DeepL API settings',
        });
        page.add(apiGroup);

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

        // Help text for API key
        const apiHelpRow = new Adw.ActionRow({
            title: 'Get your free API key at:',
            subtitle: 'https://www.deepl.com/pro-api',
        });
        apiGroup.add(apiHelpRow);

        // Language Preferences group
        const langGroup = new Adw.PreferencesGroup({
            title: 'Language Settings',
            description: 'Configure your main and secondary languages',
        });
        page.add(langGroup);

        // Main language row
        const mainLangRow = new Adw.EntryRow({
            title: 'Main Language',
        });
        langGroup.add(mainLangRow);

        // Bind main language to settings
        settings.bind(
            'main-language',
            mainLangRow,
            'text',
            Gio.SettingsBindFlags.DEFAULT
        );

        // Secondary language row
        const secondaryLangRow = new Adw.EntryRow({
            title: 'Secondary Language',
        });
        langGroup.add(secondaryLangRow);

        // Bind secondary language to settings
        settings.bind(
            'secondary-language',
            secondaryLangRow,
            'text',
            Gio.SettingsBindFlags.DEFAULT
        );

        // Language codes help
        const langHelpRow = new Adw.ActionRow({
            title: 'Common language codes:',
            subtitle: 'EN, ES, IT, FR, DE, PT-BR, PT-PT, JA, ZH, RU, etc.',
        });
        langGroup.add(langHelpRow);

        // How it works explanation
        const explanationRow = new Adw.ActionRow({
            title: 'How auto-detection works:',
            subtitle: 'Extension auto-detects clipboard language. If not your main language → translates to main. If it is your main language → translates to secondary.',
        });
        langGroup.add(explanationRow);
    }
}
