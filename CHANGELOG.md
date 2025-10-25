# Changelog

All notable changes to the Automagic Panel Translator extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.0] - 2025-10-25

Major rebranding release with new extension identity.

### Changed
- **Rebranded from "DeepL Translator" to "Automagic Panel Translator"**
- Updated extension UUID to `automagic-panel-translator@juan-de-costa-rica`
- Modernized extension name to emphasize automatic language detection and panel integration
- Updated all documentation, packaging scripts, and website with new branding
- Maintained full backward compatibility with DeepL API integration

### Technical Notes
- This is a breaking change requiring fresh installation (new UUID)
- Existing users of v3.0 will need to reinstall with the new UUID
- All code quality improvements and security features from v3.0 are preserved

## [3.0] - 2025-10-24

Major release with security improvements, code quality enhancements, and comprehensive documentation.

### Added
- **Secure API key storage** using GNOME Keyring (libsecret) - API keys now encrypted at rest
- Automatic migration from plain text dconf storage to encrypted keyring
- Gio.Cancellable pattern for all async operations to prevent memory leaks
- Comprehensive input validation for language codes
- Structured error logging throughout the codebase for easier debugging
- ESLint configuration with zero errors/warnings for code quality
- Comprehensive JSDoc documentation for all classes and methods
- Optimized UI button rebuilding - only rebuilds when language settings change
- Shared language mapping module (DRY principle)

### Changed
- **Modernized to async/await pattern** - Replaced callback hell with clean Promise-based code
- Improved Soup.Session cleanup with proper resource management
- Enhanced error messages with user-friendly descriptions
- Updated README with security notes and architecture documentation
- Improved extension description highlighting key features

### Fixed
- Memory leaks from uncancelled HTTP requests during extension disable/destroy
- Soup.Session not properly aborting pending requests on cleanup
- Missing validation for invalid language codes in settings
- Redundant UI rebuilding on menu open causing flicker

### Security
- **CRITICAL**: API keys no longer stored in plain text dconf
- API keys encrypted at rest in GNOME Keyring
- User-isolated secure storage (only accessible to owner)
- System keyring integration (managed by Seahorse)

### Performance
- Reduced unnecessary UI operations with smart button rebuild detection
- Cleaner async flow with modern JavaScript patterns
- Optimized code with ~50 lines reduction from refactoring

### Developer Experience
- Added ESLint for consistent code style
- Comprehensive inline documentation (JSDoc)
- Modular architecture with shared components
- Better error handling and logging for debugging

---

## [2.4] - 2024-10-10

### Added
- Scrollable text area for long translations
- Width constraint to prevent horizontal expansion
- Better handling of long translation results

### Fixed
- UI expanding too wide with long text
- Translations getting cut off

---

## [2.3] - 2024-10-09

### Added
- Auto-copy to clipboard after successful translation
- Separate settings for primary and secondary language auto-copy
- Visual "✓ Copied!" indicator when translation is copied
- Smart auto-translate on menu open (avoids redundant API calls)

### Changed
- Improved clipboard integration with PRIMARY and CLIPBOARD selection priority
- Better user feedback with copy status indicator

---

## [2.0] - 2024-09-15

### Added
- **Customizable language buttons** - Configure which languages appear in UI
- Settings for available languages (comma-separated codes)
- Dynamic button rebuilding when language settings change
- Last-used language persistence

### Changed
- Language button UI now dynamically generated from settings
- Improved preferences window with language customization

---

## [1.5] - 2024-08-20

### Added
- **Smart language detection** - Automatic translation direction based on detected language
- Reading mode: Foreign language → Main language
- Writing mode: Main language → Secondary language
- No manual direction switching needed

### Changed
- Simplified translation workflow with intelligent source detection
- Improved UX by removing manual language selection for source

---

## [1.0] - 2024-07-15

Initial public release.

### Added
- Panel indicator for quick access
- DeepL API integration with auto-detection
- Clipboard-based translation workflow
- Support for all 30+ DeepL languages
- Configurable main and secondary languages
- GSettings-based preferences
- One-click translate from clipboard
- Translation result display in popup menu

### Features
- GNOME Shell 48 support
- ESM module system
- Soup 3 for HTTP requests
- Clean, minimal UI
- Secure API key configuration

---

## Version History Summary

- **v3.0** - Security & Quality (GNOME Keyring, async/await, ESLint, documentation)
- **v2.4** - UI improvements (scrolling, width constraints)
- **v2.3** - Auto-copy feature with smart clipboard handling
- **v2.0** - Customizable language buttons
- **v1.5** - Smart language detection
- **v1.0** - Initial release

---

## Upgrade Notes

### Upgrading to v3.0
- **Automatic API key migration**: Your API key will be automatically migrated from dconf to GNOME Keyring on first run
- No manual intervention required
- Old dconf storage is cleared after successful migration
- API key can be viewed/managed in GNOME Keychain (Seahorse)

### Future Roadmap
- [ ] Keyboard shortcut support
- [ ] Translation history
- [ ] Character count display
- [ ] Dropdown language selector in preferences UI
- [ ] Support for additional GNOME Shell versions
