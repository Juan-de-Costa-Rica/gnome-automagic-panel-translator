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

        // Available languages row (comma-separated)
        const availableLangsRow = new Adw.EntryRow({
            title: 'Available Languages',
        });
        langGroup.add(availableLangsRow);

        // Bind available languages to settings
        settings.bind(
            'available-languages',
            availableLangsRow,
            'text',
            Gio.SettingsBindFlags.DEFAULT
        );

        // Language codes help
        const langHelpRow = new Adw.ActionRow({
            title: 'Enter comma-separated language codes:',
            subtitle: 'Examples: ES,IT,FR,DE,PT-BR or JA,ZH,KO,RU,AR',
        });
        langGroup.add(langHelpRow);

        // How it works explanation
        const explanationRow = new Adw.ActionRow({
            title: 'How auto-detection works:',
            subtitle: 'Extension auto-detects clipboard language. If not your main language → translates to main. If it is your main language → translates to selected button language.',
        });
        langGroup.add(explanationRow);
    }
}
