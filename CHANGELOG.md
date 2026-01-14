# Changelog

All notable changes to the Automagic Panel Translator extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-01-13

### Added
- **Global Keyboard Shortcut:** Added support for a global shortcut (Default: `Super+T`) to translate the current selection and open the popup instantly.
- **Shortcut Settings:** New section in preferences to view the configured keyboard shortcut.

## [1.1.0] - 2026-01-13

### Changed
- **EGO Compliance:** Added explicit 'Translate Selection' button to comply with GNOME privacy guidelines (no automatic network requests on menu open).
- **UI:** Added a source text preview to the popup so users can verify text before sending to DeepL.
- **Packaging:** Removed compiled schemas from the zip package.

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