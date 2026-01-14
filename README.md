# Automagic Panel Translator for GNOME Shell

> Quick translations using DeepL API with secure key storage, smart language detection, and strict selection-based privacy.

[![GNOME Shell](https://img.shields.io/badge/GNOME%20Shell-48--49-blue)](https://www.gnome.org/)
[![License](https://img.shields.io/badge/license-GPL--2.0--or--later-green)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0-blue)](CHANGELOG.md)
[![Website](https://img.shields.io/badge/website-live-blue)](https://juan-de-costa-rica.github.io/gnome-automagic-panel-translator/)

**[View Website](https://juan-de-costa-rica.github.io/gnome-automagic-panel-translator/)**

## Features

- **Simple** - Highlight text and click the panel icon.
- **Private** - Strictly translates **selected text only**. Does not read your clipboard without permission.
- **Secure** - API keys encrypted with GNOME Keyring (libsecret).
- **Smart** - Auto-detects language and translation direction.
- **Configurable** - Split auto-copy settings for reading vs. writing modes.
- **30+ Languages** - Full support for all DeepL-provided languages.

## Installation

### From GNOME Extensions
*Extension is under review - use manual installation below for now*

### Manual Installation

Download and install the latest release:

```bash
# Download the extension package
wget https://github.com/juan-de-costa-rica/gnome-automagic-panel-translator/releases/latest/download/automagic-panel-translator@juan-de-costa-rica-v1.zip

# Install (--force overwrites any existing version)
gnome-extensions install --force automagic-panel-translator@juan-de-costa-rica-v1.zip
```

**Restart GNOME Shell:**
- **Wayland** (Default): Log out and log back in.
- **X11**: Press `Alt+F2`, type `r`, press Enter.

**Enable the extension:**
```bash
gnome-extensions enable automagic-panel-translator@juan-de-costa-rica
```

## Usage

The extension translates text with a single click:

1. **Select text** - Highlight the text you want to translate with your mouse.
2. **Click the panel icon** - Translation appears instantly in the popup.
3. **Copy** - Click the translation result to copy it manually, or enable "Auto-copy" in settings.

### Smart Translation Logic

The extension automatically determines the translation direction:
- **Foreign language detected** → Translates TO your **Main Language** (Reading mode).
- **Main language detected** → Translates TO selected **Secondary Language** (Writing mode).

## Security

Your API key is **encrypted at rest** using GNOME Keyring (libsecret). It is never stored in plain text and is isolated to your user account.

## Requirements

- GNOME Shell 48+
- DeepL API key ([get free key](https://www.deepl.com/pro-api))
- `libsecret` (usually pre-installed)

## License

[GPL-2.0-or-later](LICENSE) © juan-de-costa-rica