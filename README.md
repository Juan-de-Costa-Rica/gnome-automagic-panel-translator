# DeepL Translator for GNOME Shell

> Quick translations using DeepL API with secure key storage, smart language detection, and clipboard integration.

[![GNOME Shell](https://img.shields.io/badge/GNOME%20Shell-48-blue)](https://www.gnome.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Version](https://img.shields.io/badge/version-3.0-blue)](CHANGELOG.md)

<!-- TODO: Add screenshot here once extension is live -->

## Features

- 🔐 **Secure** - API keys encrypted with GNOME Keyring
- 🧠 **Smart** - Auto-detects language and translation direction
- ⚡ **Fast** - One-click translate from clipboard
- 📋 **Integrated** - Auto-copy results, no window switching
- 🌍 **30+ Languages** - All DeepL-supported languages
- ⚙️ **Customizable** - Choose which language buttons appear

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

Log out and back in, then enable the extension:
```bash
gnome-extensions enable deepl-translator@juan-de-costa-rica
```

## Quick Start

1. **Get API Key** - Sign up for free at [deepl.com/pro-api](https://www.deepl.com/pro-api) (500K chars/month free)
2. **Configure** - Right-click the panel icon → Preferences → Enter API key
3. **Translate** - Copy any text (Ctrl+C), click the panel icon, select language
4. **Done** - Translation auto-copied to clipboard, ready to paste!

### Smart Translation

- **Reading mode**: Foreign text → Your main language (e.g., Spanish → English)
- **Writing mode**: Your main language → Selected language (e.g., English → Spanish)

No manual switching needed - it just works!

## Security

Your API key is **encrypted at rest** using GNOME Keyring (libsecret), never stored in plain text.

## Requirements

- GNOME Shell 48+
- DeepL API key ([get free key](https://www.deepl.com/pro-api))
- `libsecret` (usually pre-installed)

## Contributing

Contributions welcome! Please check [CHANGELOG.md](CHANGELOG.md) for recent changes.

### For Developers

Built with modern GNOME best practices:
- Async/await patterns
- Memory leak prevention (Gio.Cancellable)
- ESLint with zero warnings
- Comprehensive JSDoc documentation

See the code for architecture details.

## Support

- 🐛 **Bug reports**: [GitHub Issues](https://github.com/juan-de-costa-rica/gnome-deepl-translator/issues)
- 💬 **Questions**: [GNOME Extensions Matrix](https://matrix.to/#/#extensions:gnome.org)

## License

[MIT](LICENSE) © juan-de-costa-rica

---

**Note**: This extension requires a DeepL API key and makes requests to api-free.deepl.com when you click "Translate". Your data is sent only to DeepL, not to any other service.
