import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
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
            title: 'Default Languages',
            description: 'Set your preferred translation languages',
        });
        page.add(langGroup);

        // Source language row
        const sourceLangRow = new Adw.EntryRow({
            title: 'Default Source Language',
        });
        langGroup.add(sourceLangRow);

        // Bind source language to settings
        settings.bind(
            'default-source-lang',
            sourceLangRow,
            'text',
            Gio.SettingsBindFlags.DEFAULT
        );

        // Target language row
        const targetLangRow = new Adw.EntryRow({
            title: 'Default Target Language',
        });
        langGroup.add(targetLangRow);

        // Bind target language to settings
        settings.bind(
            'default-target-lang',
            targetLangRow,
            'text',
            Gio.SettingsBindFlags.DEFAULT
        );

        // Language codes help
        const langHelpRow = new Adw.ActionRow({
            title: 'Supported language codes:',
            subtitle: 'EN (English), ES (Spanish), FR (French), DE (German), IT (Italian), PT (Portuguese), etc.',
        });
        langGroup.add(langHelpRow);
    }
}
