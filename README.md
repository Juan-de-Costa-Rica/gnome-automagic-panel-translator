# DeepL Translator for GNOME Shell

> Quick translations using DeepL API with secure key storage, smart language detection, and clipboard integration.

[![GNOME Shell](https://img.shields.io/badge/GNOME%20Shell-48-blue)](https://www.gnome.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Version](https://img.shields.io/badge/version-3.0-blue)](CHANGELOG.md)

<!-- TODO: Add screenshot here once extension is live -->

## Features

- **Simple** - Select text, click panel icon, done
- **Secure** - API keys encrypted with GNOME Keyring
- **Smart** - Auto-detects language and translation direction
- **Integrated** - Auto-copy results, no window switching
- **30+ Languages** - All DeepL-supported languages
- **Customizable** - Choose which language buttons appear

## Installation

### From GNOME Extensions (Recommended)
*Coming soon - extension under review*

<!-- Once approved, uncomment:
Visit [extensions.gnome.org](https://extensions.gnome.org/extension/...) and click "Install"
-->

### Manual Installation

```bash
git clone https://github.com/juan-de-costa-rica/gnome-deepl-translator.git
cd gnome-deepl-translator
./install.sh
```

**Important:** Log out and log back in (required), then enable:
```bash
gnome-extensions enable deepl-translator@juan-de-costa-rica
```

## Quick Start

1. Get your free API key at [deepl.com/pro-api](https://www.deepl.com/pro-api) (500K chars/month free)
2. Right-click the panel icon → Preferences
3. Enter your API key
4. Set your main language (default: English)
5. Choose which secondary languages appear as buttons (default: Spanish, Italian, French, German, Portuguese)

## Usage

The extension translates text with a single click:

1. **Select or copy text** - Selected text (highlighted) takes priority; clipboard (Ctrl+C) is used if nothing is selected
2. **Click the panel icon** - Translation appears instantly in the popup
3. **Auto-copy** - Translation is automatically copied to clipboard (configurable in settings)

### Translation Logic

The extension automatically detects the source language and translates:
- **Foreign language detected** → Translates FROM foreign language TO your main language (e.g., Spanish → English)
- **Main language detected** → Translates FROM main language TO selected secondary language (e.g., English → Spanish)

Click language buttons in the popup to change which secondary language to translate to.

## Security

Your API key is **encrypted at rest** using GNOME Keyring (libsecret), never stored in plain text.

## Requirements

- GNOME Shell 48+
- DeepL API key ([get free key](https://www.deepl.com/pro-api))
- `libsecret` (usually pre-installed)

## Contributing

Contributions welcome! Please check [CHANGELOG.md](CHANGELOG.md) for recent changes.

## Bug Reports

Bugs should be reported to the [GitHub issue tracker](https://github.com/juan-de-costa-rica/gnome-deepl-translator/issues).

## License

[MIT](LICENSE) © juan-de-costa-rica

---

**Note**: This extension requires a DeepL API key and makes requests to api-free.deepl.com when you click "Translate". Your data is sent only to DeepL, not to any other service.
