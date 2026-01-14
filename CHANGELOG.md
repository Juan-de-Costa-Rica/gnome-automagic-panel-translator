# Changelog

All notable changes to the Automagic Panel Translator extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-13

Initial public release of the rebranded and modernized extension.

### Added
- **Secure API key storage** using GNOME Keyring (libsecret).
- **Strict Privacy:** Only translates highlighted text (PRIMARY selection); never reads your system clipboard.
- **Smart Logic:** Automatically detects if text is in your main language or a foreign one and translates accordingly.
- **Split Auto-copy:** Separate settings to auto-copy translations to your main language vs. secondary languages.
- **Click-to-copy:** Manually click any translation result to copy it to the clipboard.
- **Internationalization:** Full `gettext` support for community translations.
- **Modern UI:** Clean, flat header bar with standard GNOME symbolism.
- **Modern Architecture:** Fully modernized for GNOME 45-49 (ESM, async/await, Soup 3).

### Security
- API keys are encrypted at rest in the GNOME Keyring, never stored in plain text dconf settings.

### Technical Notes
- Support for GNOME Shell 48 and 49.
- Built-in automatic migration for legacy users.