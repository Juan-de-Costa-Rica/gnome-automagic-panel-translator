# GNOME DeepL Translator Extension

A GNOME Shell extension for quick translations using the DeepL API. No separate windows - just click the panel icon and translate instantly!

## Features
- Panel indicator for instant access
- Clipboard-based translation workflow (no typing needed)
- **Intelligent auto-detect** - automatically determines translation direction
- **Customizable language buttons** - configure which languages appear in the UI
- One-click translate from clipboard
- **Auto-copy to clipboard** - translations automatically copied after completion
- Smart logic: foreign language → English, English → selected language
- Secure API key storage via GSettings
- Support for all 30 DeepL languages

## Requirements
- GNOME Shell 48+
- DeepL API key (free tier: 500,000 characters/month)

## Installation

### Quick Install
```bash
cd /path/to/gnome-deepl-translator
./install.sh
```

Then **log out and log back in** to load the extension.

### Manual Install
1. Copy the extension to your extensions directory:
   ```bash
   cp -r . ~/.local/share/gnome-shell/extensions/deepl-translator@juan-de-costa-rica/
   ```

2. Compile the GSettings schema:
   ```bash
   glib-compile-schemas ~/.local/share/gnome-shell/extensions/deepl-translator@juan-de-costa-rica/schemas/
   ```

3. Log out and log back in

4. Enable the extension:
   ```bash
   gnome-extensions enable deepl-translator@juan-de-costa-rica
   ```

## Configuration

1. Get your free DeepL API key at: https://www.deepl.com/pro-api
2. Open extension preferences: Right-click the panel icon → Preferences
3. Enter your API key
4. (Optional) Set your main language (default: EN)
5. (Optional) Customize available languages: Enter comma-separated codes like `ES,IT,FR,JA,ZH`

## Usage

1. **Select your target language** - Click one of the language buttons in the popup
2. **Copy text** from any application (Ctrl+C) - any language!
3. **Click the translation icon** in the top panel
4. **Click "Translate from Clipboard"**
5. **Translation appears with "✓ Copied!" indicator** - automatically copied to clipboard!
6. **Paste anywhere** (Ctrl+V) - translation is ready immediately!
7. Translation stays visible until you close the menu

### Smart Translation Logic
- **Foreign language detected** → Translates to your main language (default: English)
- **Main language detected** → Translates to your selected button language
- **No manual direction switching needed** - it just works!

### Customizing Language Buttons
The extension shows buttons for your configured languages (default: Spanish, Italian, French, German, Portuguese). To customize:
1. Open Preferences
2. Edit "Available Languages" field with comma-separated codes: `JA,ZH,KO,RU,AR`
3. Buttons will update automatically
4. Supports all 30 DeepL languages!

## Supported Languages

All DeepL-supported languages (use these codes in preferences):
- **Western European:** EN, ES, FR, DE, IT, PT-BR, PT-PT, NL, DA, SV, NB, FI
- **Eastern European:** PL, CS, SK, HU, RO, BG, SL, LT, LV, ET, UK, RU, TR, EL
- **Asian:** JA, ZH, KO, ID

See [DeepL's supported languages](https://www.deepl.com/docs-api/translate-text/) for the full list.

## Troubleshooting

### Extension doesn't appear after installation
- **Make sure you logged out and back in** (required on Wayland)
- Check if it's enabled: `gnome-extensions list`
- Enable it: `gnome-extensions enable deepl-translator@juan-de-costa-rica`

### Code changes not taking effect
**Important:** On Wayland, GNOME Shell caches extension code in memory.
- **After updating extension code, you MUST log out and log back in**
- Disable/enable does NOT reload the code
- `ReloadExtension` D-Bus method is deprecated and doesn't work
- For development: Use nested GNOME Shell (`dbus-run-session -- gnome-shell --nested --wayland`)

### Translation errors
- Verify your API key is correct in preferences
- Check you haven't exceeded your quota (500,000 chars/month for free tier)
- Ensure you have internet connectivity

### API Key Issues
- Use the FREE API endpoint key (not the Pro key)
- The free key is different from the Pro tier key

## Development

Built with:
- GJS (GNOME JavaScript)
- Soup 3 for HTTP requests
- ESM modules (GNOME 45+)
- GSettings for configuration

## Future Enhancements
- [x] Translate from clipboard (Implemented)
- [x] Auto-detect source language (Implemented)
- [x] Auto-copy to clipboard (Implemented)
- [x] Multiple language pairs (Implemented)
- [x] Customizable language buttons (Implemented)
- [ ] Dropdown language selector UI in preferences
- [ ] Keyboard shortcut support
- [ ] Translation history
- [ ] Character count display

## License
MIT

## Credits
Created by juan-de-costa-rica
