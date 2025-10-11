# Setup & Testing Notes

## Extension Status
✅ Extension code complete with all features
✅ Intelligent auto-detect translation implemented
✅ Auto-copy to clipboard implemented
✅ Multiple secondary languages (ES, IT, FR, DE, PT-BR)
✅ Git repository on GitHub (main branch)
✅ Installed to: ~/.local/share/gnome-shell/extensions/deepl-translator@juan-de-costa-rica/

## Quick Start

1. **Log out and log back in** (REQUIRED on Wayland/GNOME 48)
   - This is necessary for GNOME Shell to load the extension

2. **Enable the extension**:
   ```bash
   gnome-extensions enable deepl-translator@juan-de-costa-rica
   ```

3. **Configure API key**:
   - Get free API key: https://www.deepl.com/pro-api
   - Right-click panel icon → Preferences
   - Enter API key (use FREE tier key, not Pro)
   - Set main language (default: EN)
   - Set secondary language (default: ES)

4. **Test intelligent translation**:
   - Select secondary language (Spanish, Italian, French, German, or Portuguese)
   - Copy some text (any language) with Ctrl+C
   - Click panel icon
   - Click "Translate from Clipboard"
   - Translation automatically copies to clipboard - button shows "✓ Copied!"
   - Paste anywhere with Ctrl+V
   - Result clears after 1.5 seconds

## Project Location
`/var/home/juan/Desktop/Code/gnome-deepl-translator/`

## Files Created
- extension.js (main extension + UI)
- translator.js (DeepL API wrapper)
- prefs.js (preferences window)
- metadata.json (extension metadata)
- schemas/org.gnome.shell.extensions.deepl-translator.gschema.xml
- install.sh (installation script)
- README.md (documentation)

## Git Commits
All changes committed with clear messages - ready for GitHub push!

## Known Technical Details
- Uses Soup 3 for HTTP (GNOME 48 compatible)
- ESM module syntax (GNOME 45+)
- Form-encoded POST to DeepL API (not JSON)
- GSettings for secure API key storage
- Async callbacks for non-blocking translation

## Wayland Development Notes

### Code Changes Require Logout/Login
**Important:** On Wayland, GNOME Shell caches extension code in memory and cannot reload it dynamically.

#### Why Logout is Required:
- GNOME Shell on Wayland IS the display server (unlike X11)
- JavaScript runtimes can't easily "unload" code once loaded
- `ReloadExtension` D-Bus method is deprecated and doesn't work
- Disable/enable only stops/starts cached code, doesn't reload from disk

#### Development Workflow Options:

**Option 1: Logout/Login (Simple, Reliable)**
```bash
# Make changes
nano extension.js
# Copy to install location
cp extension.js ~/.local/share/gnome-shell/extensions/deepl-translator@juan-de-costa-rica/
# MUST logout and login to reload code
```

**Option 2: Nested GNOME Shell (For Heavy Development)**
```bash
# Start nested shell in a window
dbus-run-session -- gnome-shell --nested --wayland
# Enable extension in nested shell
gnome-extensions enable deepl-translator@juan-de-costa-rica
# Make changes in main session, restart nested window (Ctrl+Q) to test
```

**Option 3: Disable/Enable (Only for Minor Tweaks)**
```bash
gnome-extensions disable deepl-translator@juan-de-costa-rica
gnome-extensions enable deepl-translator@juan-de-costa-rica
# May work for small changes, but not guaranteed to reload code
```

## Potential Issues & Solutions
- **Extension not appearing**: Log out/in required on Wayland
- **Code changes not working**: Must log out/in to reload extension code
- **API errors**: Check free tier key (not Pro), verify quota
- **Translation direction wrong**: Use auto-detect - it determines direction automatically
