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

        // Create string list for ComboRow
        const languageListMain = new Gtk.StringList();
        const languageListSecondary = [
            new Gtk.StringList(),
            new Gtk.StringList(),
            new Gtk.StringList(),
        ];

        // Populate string lists
        languages.forEach(lang => {
            if (lang.code !== '') { // Main language shouldn't be "None"
                languageListMain.append(lang.name);
            }
            languageListSecondary.forEach(list => {
                list.append(lang.name);
            });
        });

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

        // Main language dropdown
        const mainLangRow = new Adw.ComboRow({
            title: 'Main Language',
            subtitle: 'Your primary language for translations',
            model: languageListMain,
        });

        // Set initial value for main language
        const currentMainLang = settings.get_string('main-language');
        mainLangRow.set_selected(findLanguageIndex(currentMainLang, false));

        // Handle main language changes
        mainLangRow.connect('notify::selected', () => {
            const index = mainLangRow.get_selected();
            const code = getLanguageCode(index, false);
            if (code) {
                settings.set_string('main-language', code);
            }
        });

        langGroup.add(mainLangRow);

        // Secondary languages label
        const secondaryLangLabel = new Adw.ActionRow({
            title: 'Secondary Languages',
            subtitle: 'Choose up to 3 languages to translate to (leave as "None" if not needed)',
        });
        langGroup.add(secondaryLangLabel);

        // Parse current available languages
        const availableLangsStr = settings.get_string('available-languages');
        const currentLangCodes = availableLangsStr.split(',').map(code => code.trim()).filter(code => code);

        // Ensure we have exactly 3 slots (pad with empty strings)
        while (currentLangCodes.length < 3) {
            currentLangCodes.push('');
        }

        const secondaryLangRows = [];

        // Create 3 language selector dropdowns
        for (let i = 0; i < 3; i++) {
            const langRow = new Adw.ComboRow({
                title: `Language Slot ${i + 1}`,
                model: languageListSecondary[i],
            });

            // Set initial value
            const currentCode = currentLangCodes[i] || '';
            langRow.set_selected(findLanguageIndex(currentCode, true));

            // Handle changes - update available-languages setting
            langRow.connect('notify::selected', () => {
                const codes = secondaryLangRows
                    .map(row => {
                        const index = row.get_selected();
                        return getLanguageCode(index, true);
                    })
                    .filter(code => code !== ''); // Remove empty slots

                settings.set_string('available-languages', codes.join(','));
            });

            secondaryLangRows.push(langRow);
            langGroup.add(langRow);
        }

        // How it works explanation
        const explanationRow = new Adw.ActionRow({
            title: 'How auto-detection works:',
            subtitle: 'Extension auto-detects clipboard language. If not your main language → translates to main. If it is your main language → translates to selected button language.',
        });
        langGroup.add(explanationRow);
    }
}
