# GNOME DeepL Translator Extension

A GNOME Shell extension for quick translations using the DeepL API. No separate windows - just click the panel icon and translate instantly!

## Features
- 🌐 Panel indicator for instant access
- ⚡ Quick translation popup interface (no separate window!)
- 🔄 Easy language switching (EN ↔ ES buttons)
- 📋 Copy translations to clipboard with one click
- 🔑 Secure API key storage via GSettings
- ⚙️ Configurable default languages

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
4. (Optional) Set your preferred default languages

## Usage

1. Click the translation icon in the top panel
2. Enter text to translate
3. Click "EN → ES" or "ES → EN" to set direction
4. Click "Translate"
5. Click "Copy to Clipboard" to copy the result

## Supported Languages

Common language codes (use 2-letter codes in preferences):
- EN (English)
- ES (Spanish)
- FR (French)
- DE (German)
- IT (Italian)
- PT (Portuguese)
- And many more!

See [DeepL's supported languages](https://www.deepl.com/docs-api/translate-text/) for the full list.

## Troubleshooting

### Extension doesn't appear after installation
- Make sure you logged out and back in (required on Wayland)
- Check if it's enabled: `gnome-extensions list`
- Enable it: `gnome-extensions enable deepl-translator@juan-de-costa-rica`

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
- [ ] Keyboard shortcut support
- [ ] Auto-detect source language
- [ ] Translation history
- [ ] Translate from clipboard
- [ ] More language pairs
- [ ] Character count display

## License
MIT

## Credits
Created by juan-de-costa-rica
