# Automagic Panel Translator for GNOME Shell

> Quick translations using DeepL API with secure key storage, smart language detection, and clipboard integration.

[![GNOME Shell](https://img.shields.io/badge/GNOME%20Shell-48-blue)](https://www.gnome.org/)
[![License](https://img.shields.io/badge/license-GPL--2.0--or--later-green)](LICENSE)
[![Version](https://img.shields.io/badge/version-4.0-blue)](CHANGELOG.md)
[![Website](https://img.shields.io/badge/website-live-blue)](https://juan-de-costa-rica.github.io/gnome-automagic-panel-translator/)

**[View Website](https://juan-de-costa-rica.github.io/gnome-automagic-panel-translator/)**

<!-- TODO: Add screenshot here once extension is live -->

## Features

- **Simple** - Select text, click panel icon, done
- **Secure** - API keys encrypted with GNOME Keyring
- **Smart** - Auto-detects language and translation direction
- **Integrated** - Auto-copy results, no window switching
- **30+ Languages** - All DeepL-supported languages
- **Customizable** - Choose which language buttons appear

## Installation

### From GNOME Extensions
*Extension is under review - use manual installation below for now*

<!-- Once approved, uncomment:
Visit [extensions.gnome.org](https://extensions.gnome.org/extension/8668/deepl-translator/) and click "Install"
-->

### Manual Installation (Recommended)

Download and install the latest release:

```bash
# Download the extension package
wget https://github.com/juan-de-costa-rica/gnome-automagic-panel-translator/releases/download/v4.0/automagic-panel-translator@juan-de-costa-rica-v4.zip

# Install
gnome-extensions install automagic-panel-translator@juan-de-costa-rica-v4.zip
```

**Important:** Log out and log back in (required), then enable:
```bash
gnome-extensions enable automagic-panel-translator@juan-de-costa-rica
```

### Install from Source

```bash
git clone https://github.com/juan-de-costa-rica/gnome-automagic-panel-translator.git
cd gnome-automagic-panel-translator
./install.sh
```

Then log out/in and enable as shown above.

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

Bugs should be reported to the [GitHub issue tracker](https://github.com/juan-de-costa-rica/gnome-automagic-panel-translator/issues).

## Support Development

If you find this extension useful, consider supporting its development:

**Ethereum:** `0x55DE05974F8590ee9F4d013E1b63FcC68661136E`

## License

[GPL-2.0-or-later](LICENSE) © juan-de-costa-rica

---

**Note**: This extension requires a DeepL API key and makes requests to api-free.deepl.com when you click "Translate". Your data is sent only to DeepL, not to any other service.
