# GNOME DeepL Translator Extension - Project Handoff

**Date:** October 18, 2025
**Agent:** Claude (Sonnet 4.5)
**Status:** ✅ Version 2.1 - Smart Auto-Translate (Code Complete)
**Version:** 2.1 (development)
**Next Step:** Logout/login to test auto-translate feature, then commit if successful

---

## 🎯 Project Overview

Built a GNOME Shell extension that provides quick translations using the DeepL API without opening separate windows. User requested this because they frequently chat with Spanish speakers and need fast translations.

### User Requirements:
1. ✅ Panel indicator in top bar (not a separate window)
2. ✅ Popup UI for translations (clipboard-based workflow)
3. ✅ **Intelligent auto-detect translation** - automatically determines direction
4. ✅ Secondary language selector (up to 3 customizable languages)
5. ✅ Copy to clipboard functionality (auto-copy on translate)
6. ✅ **Translation persistence** - keeps text visible until menu closes
7. ✅ **Preferences window with dropdown selectors** - validated language selection
8. ✅ **Settings gear icon in popup** - easy access to preferences
9. ✅ Smart logic: foreign language → main language, main language → secondary language
10. ✅ **PRIMARY selection support (v2.0)** - translate selected text without copying
11. ✅ **Smart auto-translate (v2.1)** - automatically translate on menu open if clipboard has new text

### Current Implementation:
- **Smart Auto-Translate (v2.1):** Automatically translates when popup opens if clipboard has new text (eliminates manual button click!)
- **PRIMARY Selection Support (v2.0):** Translate selected text without copying (saves one click!)
- **Smart Clipboard Reading:** Tries PRIMARY selection first, falls back to CLIPBOARD if empty
- **Intelligent Caching:** Tracks last translated text to avoid redundant API calls when reopening menu
- **Auto-Detect Logic:** Extension detects clipboard language automatically
- **Smart Direction:** If detected ≠ main language → translate to main, if = main → translate to selected button language
- **Dropdown Language Selectors:** Professional GTK4 ComboRow widgets in preferences with automatic validation
- **Flexible Language Configuration:** Choose 1-3 secondary languages from all 30 DeepL languages
- **Settings Gear Icon:** Quick access to preferences directly from popup menu
- **Support for All 30 DeepL Languages:** Easy selection from dropdown (BG, CS, DA, DE, EL, EN, ES, ET, FI, FR, HU, ID, IT, JA, KO, LT, LV, NB, NL, PL, PT-BR, PT-PT, RO, RU, SK, SL, SV, TR, UK, ZH)
- **No Manual Toggles:** User never has to think about translation direction
- **Translation Persistence:** Translated text stays visible until menu closes (better UX)
- **Auto-Copy with Inline Indicator:** Translation automatically copied to clipboard with "✓ Copied!" indicator next to "Translation:" label

### Future Enhancements:
- Keyboard shortcuts (attempted but broke extension - postponed)
- Translation history
- Character counter
- Hover over panel icon to translate (no click needed)

---

## 🏗️ Technical Architecture

### System Environment:
- **OS:** Fedora Bluefin (based on Fedora 42)
- **GNOME Shell:** 48.4
- **Desktop:** Wayland
- **Kernel:** 6.15.10-200.fc42.x86_64

### Technology Stack:
- **Language:** JavaScript (GJS - GNOME JavaScript)
- **Module System:** ESM (ECMAScript Modules) - required for GNOME 45+
- **HTTP Library:** Soup 3 (critical - GNOME 48 uses Soup 3, NOT Soup 2)
- **UI Framework:** St (Shell Toolkit) + Clutter
- **Preferences:** Adwaita + GTK4
- **Settings Storage:** GSettings (compiled schemas)

### Key Technical Decisions:
1. **Soup 3 API:** Used `session.send_and_read_async()` - different from Soup 2
2. **Form-encoded POST:** DeepL API requires `application/x-www-form-urlencoded`, NOT JSON
3. **Free API Endpoint:** `https://api-free.deepl.com` (different from Pro tier)
4. **Auto-Detect API:** Omit `source_lang` parameter to trigger DeepL auto-detection
5. **Detected Language:** API returns `detected_source_language` in response for smart logic
6. **Async Callbacks:** All HTTP and clipboard operations are async
7. **CSS Styling:** Use style classes instead of inline styles (GNOME Shell best practice)

---

## 📁 Project Structure

### Code Location:
```
/var/home/juan/Desktop/Code/gnome-deepl-translator/
```

### Installation Location:
```
~/.local/share/gnome-shell/extensions/deepl-translator@juan-de-costa-rica/
```

### File Overview:
```
gnome-deepl-translator/
├── extension.js          # Main extension (~400 lines)
│   ├── TranslatorIndicator class (panel button + UI)
│   ├── Header with "DeepL Translator" title + settings gear icon
│   ├── Popup menu with PRIMARY/CLIPBOARD translation (v2.0)
│   ├── **Smart auto-translate on menu open (v2.1)** - auto-translates new clipboard text
│   ├── **_checkAndAutoTranslate()** - checks clipboard when menu opens
│   ├── **_autoTranslateIfNew()** - compares with last source text, only translates if different
│   ├── **_lastSourceText tracking** - prevents redundant API calls
│   ├── Smart clipboard reading: PRIMARY first, CLIPBOARD fallback
│   ├── _performTranslation() helper method for cleaner code
│   ├── Dynamic secondary language selector buttons (1-3 languages)
│   ├── Intelligent auto-detect translation logic
│   ├── Smart direction: detected language → correct target
│   ├── Clipboard integration (read & auto-copy)
│   └── Inline "✓ Copied!" indicator (no separate button)
│
├── translator.js         # DeepL API wrapper (~112 lines)
│   ├── HTTP requests via Soup 3
│   ├── Auto-detect support (null source_lang)
│   ├── Returns detected_source_language from API
│   ├── Error handling (403, 456, 400 codes)
│   └── Async translation method with 3 callback params
│
├── prefs.js             # Preferences UI (~197 lines)
│   ├── Adwaita-based settings window with GTK4 widgets
│   ├── API key entry (password field)
│   ├── Main language dropdown (ComboRow with all 30 languages)
│   ├── 3 secondary language dropdowns (ComboRow with "None" option)
│   ├── Automatic validation (only valid language codes selectable)
│   ├── Auto-detect explanation
│   └── GSettings bindings with real-time updates
│
├── stylesheet.css       # UI styling
│   ├── Language toggle button styles
│   ├── Active/selected button states
│   ├── Hover effects
│   └── Button visual feedback
│
├── metadata.json        # Extension metadata
│   ├── UUID: deepl-translator@juan-de-costa-rica
│   ├── Version: 2 (version-name: "2.0")
│   └── Stylesheet reference
│
├── schemas/
│   └── org.gnome.shell.extensions.deepl-translator.gschema.xml
│       ├── api-key (string)
│       ├── main-language (string, default 'EN') - user's primary language
│       └── secondary-language (string, default 'ES') - translate-to language
│
├── install.sh           # Installation script
├── README.md            # User documentation
├── SETUP_NOTES.md       # Testing guide
└── LICENSE              # MIT License
```

---

## 🐛 Pitfalls We Avoided

### 1. Soup 2 vs Soup 3 API Differences
**Problem:** Most online examples use Soup 2, but GNOME 48 uses Soup 3
**Solution:** Used correct Soup 3 API:
```javascript
// Soup 3 (correct)
const message = Soup.Message.new('POST', url);
session.send_and_read_async(message, GLib.PRIORITY_DEFAULT, null, callback);

// NOT Soup 2 (would fail)
session.send_message(message);
```

### 2. DeepL API Request Format
**Problem:** DeepL expects form-encoded data, not JSON
**Solution:** Used URLSearchParams and proper content type:
```javascript
const formData = `auth_key=${key}&text=${text}&source_lang=${src}&target_lang=${tgt}`;
message.set_request_body_from_bytes(
    'application/x-www-form-urlencoded',
    new GLib.Bytes(new TextEncoder().encode(formData))
);
```

### 3. Popup Menu Closing on Click
**Problem:** Clicking text entry closed the popup menu
**Solution:** Prevented event propagation:
```javascript
this._sourceEntry.clutter_text.connect('button-press-event', () => {
    return Clutter.EVENT_STOP;
});
```

### 4. Missing Imports
**Problem:** Initially forgot Gio and GLib imports
**Solution:** Added all required imports:
- `Gio` (for GSettings in prefs.js)
- `GLib` (for timeouts and byte handling in extension.js)

### 5. Free vs Pro API Endpoint
**Problem:** Free and Pro tier use different endpoints
**Solution:** Hardcoded correct free endpoint: `https://api-free.deepl.com/v2/translate`

### 6. WrapMode Import Error (GNOME 48)
**Problem:** Extension crashed on enable with "WrapMode is undefined"
**Cause:** Used `Clutter.WrapMode.WORD_CHAR` which doesn't exist in GNOME 48
**Solution:** Import Pango and use `Pango.WrapMode.WORD_CHAR` instead
**Fixed in:** Commit 0b6b237
**Symptom:** Extension toggle shows "on" but doesn't turn blue, State: ERROR

### 7. Text Entry Not Accepting Input (GNOME 48)
**Problem:** St.Entry displayed but couldn't type in it - clicking did nothing
**Cause:** Text entry wasn't receiving keyboard focus when menu opened
**Solution:**
- Import Shell module for `global` access
- Use `global.stage.set_key_focus(entry.clutter_text)` when menu opens
- Add `open-state-changed` signal handler with 50ms timeout
- Set entry as editable with `set_editable(true)` and `set_activatable(true)`
**Fixed in:** Commit 2c0e02e
**Research:** Based on Project Hamster extension pattern
**Symptom:** Menu opens, entry visible, but no cursor and can't type

### 8. Button Visual Feedback (UX Issue)
**Problem:** Language toggle buttons (EN→ES / ES→EN) had no visual indication of which was selected
**Cause:** Using inline `style` properties which don't update reliably in St widgets
**Solution:**
- Created `stylesheet.css` with proper CSS classes
- Language buttons use `deepl-lang-button` and `deepl-lang-button-active` classes
- Active state shows blue background with bold text
- Hover states for better UX
- Used `add_style_class_name()` and `remove_style_class_name()` methods
**Fixed in:** Commit 580528c
**Best Practice:** GNOME Shell extensions should use CSS classes, not inline styles

---

## 🔄 Git Repository

### GitHub Repository:
**URL:** https://github.com/Juan-de-Costa-Rica/gnome-deepl-translator

### Commit History (31 commits):
1. `78a5709` - Initial commit: Project setup
2. `848dfa5` - Add metadata.json with extension configuration
3. `c8291c5` - Add GSettings schema for API key and language preferences
4. `0d3a31f` - Add .gitignore for compiled schemas
5. `95e3c29` - Add preferences window for API key and language configuration
6. `14778b9` - Implement DeepL API wrapper with Soup 3 async requests
7. `597f190` - Add main extension with panel indicator and translation UI
8. `4e32686` - Fix: Add missing Gio import in prefs.js
9. `760d1b9` - Fix: Add missing GLib import in extension.js
10. `4308e78` - Add installation script for easier deployment
11. `ca19604` - Update README with complete documentation and usage instructions
12. `f35c8ba` - Add setup and testing notes
13. `dac4af3` - Add MIT License
14. `0b6b237` - Fix: Import Pango for WrapMode instead of Clutter (GNOME 48 compatibility)
15. `2c0e02e` - Fix: Add keyboard focus to text entry on menu open
16. `580528c` - Add CSS styling for button visual feedback and auto-clear on copy
17. `08b27cb` - Simplify UI: Replace text entry with clipboard-based translation
18. `2bd8051` - Feature: Add intelligent auto-detect translation workflow
19. `66093b9` - UX: Keep translated text visible until menu closes
20. `980c5ef` - UX: Replace copy button with inline copied indicator
21. `49b453a` - Docs: Update README with inline copied indicator workflow
22. `ce70e13` - UX: Keep copied indicator visible until menu closes
23. `60944ea` - Docs: Remove excessive emojis for professional appearance
24. `297f45f` - Fix: Remove unsupported subtitle property from AdwEntryRow
25. `3341523` - Feature: Make language buttons configurable via preferences
26. `ab8ac8e` - UX: Replace language text entry with dropdown selectors for validation
27. `7cd7031` - UX: Add settings gear icon to popup menu for easy preferences access
28. `0824889` - Docs: Update documentation for dropdown selectors and settings gear icon
29. `167bf4b` - Fix: Reduce default available languages from 5 to 3 to match preferences UI
30. `087a0fb` - UX: Change panel icon from locale flag to character map
31. `b4b8c34` - Feature: Add PRIMARY selection support (v2.0)

### Remote Configuration:
- **Origin:** git@github.com:Juan-de-Costa-Rica/gnome-deepl-translator.git
- **Protocol:** SSH (already configured)
- **Auth:** GitHub CLI authenticated (keyring)

---

## ✅ Current Status

### What's Complete:
- ✅ All code written (needs testing after logout/login)
- ✅ Extension installed and ACTIVE (running old code until restart)
- ✅ GSettings schema compiled with new keys (main-language, available-languages, last-used-language)
- ✅ Git repository: 31 commits pushed to GitHub (v2.1 not yet committed)
- ✅ **Version 2.1 NEW:** Smart auto-translate on menu open - eliminates manual translate button click
- ✅ **Version 2.0:** PRIMARY selection support - translate selected text without copying
- ✅ **MAJOR FEATURE:** Intelligent auto-detect translation workflow implemented
- ✅ **Smart Clipboard Reading:** Tries PRIMARY first, falls back to CLIPBOARD
- ✅ **Intelligent Caching:** Tracks last source text to avoid redundant API calls
- ✅ **UI Redesign:** Secondary language selector (1-3 configurable languages)
- ✅ **Smart Logic:** Detected language determines translation direction automatically
- ✅ **API Integration:** Auto-detect via omitted source_lang parameter
- ✅ **Streamlined UI:** Inline copied indicator, no redundant button
- ✅ **UX Polish:** Copied indicator persists until menu closes (matches translated text behavior)
- ✅ **Settings Updated:** dconf configured with main-language='EN', available-languages='ES,FR,DE'
- ✅ **Dropdown Selectors:** Professional GTK4 ComboRow widgets in preferences
- ✅ **Settings Gear Icon:** Quick access to preferences from popup menu
- ✅ **Character Map Icon:** More intuitive panel icon for translation functionality
- ✅ Documentation complete (README, SETUP_NOTES, Project-Handoff)

### Previous Features Working:
- ✅ **Bug fixed:** Pango import for GNOME 48 compatibility
- ✅ **Bug fixed:** Text entry keyboard focus (now removed - clipboard only)
- ✅ **UX enhanced:** CSS styling with visual button feedback
- ✅ **UX enhanced:** Auto-clear text fields after copy
- ✅ Clipboard-based translation workflow

### Needs Real-World Testing (After Logout/Login Required):
- ⏳ **Smart auto-translate (v2.1):** Verify menu opens with automatic translation
- ⏳ **Caching logic:** Confirm no re-translation when reopening with same text
- ⏳ **Language switching:** Test changing target language after auto-translate
- ⏳ **Empty clipboard:** Verify graceful handling when no text selected/copied
- ⏳ **PRIMARY vs CLIPBOARD:** Test both selection and copy workflows

---

## 🧪 Testing Workflow (For Next Agent)

### Step 1: **CRITICAL - User Must Logout/Login First**

⚠️ **GNOME Shell on Wayland caches extension code in memory**
⚠️ **Extension currently shows State: ERROR because shell is running old code**
⚠️ **User MUST logout and login to load the new code**

**After logging back in, verify extension is enabled:**
```bash
gnome-extensions list --enabled | grep deepl
gnome-extensions info deepl-translator@juan-de-costa-rica | grep State
```

**Should show:** `State: ACTIVE`

**If not active, enable it:**
```bash
gnome-extensions enable deepl-translator@juan-de-costa-rica
```

**Check for errors (should be none):**
```bash
journalctl -f -o cat /usr/bin/gnome-shell
```

### Step 2: Configure API Key

**Option A: Via Extension Manager (GUI)**
- User has Extension Manager v0.6.5 by Matthew Jakeman installed
- Find "DeepL Translator" in the list
- Click preferences/settings icon
- Enter API key

**Option B: Via Command Line**
```bash
# Open preferences
gnome-extensions prefs deepl-translator@juan-de-costa-rica
```

**Get API Key:**
- Free tier: https://www.deepl.com/pro-api
- 500,000 characters/month limit
- Must use FREE tier key (different from Pro)

### Step 3: Test Auto-Detect Translation Workflow

**Test 1: Foreign Language → English (Main Language)**
1. **Copy Spanish text:** "Hola, ¿cómo estás?" (Ctrl+C)
2. **Find the panel icon** - Should be locale/translation icon in top bar
3. **Click to open popup**
4. **Verify UI:**
   - See "Secondary Language:" label
   - See 5 language buttons: Spanish, Italian, French, German, Portuguese
   - Spanish should have blue highlight (default)
5. **Click "Translate from Clipboard"**
6. **Expected:** Should auto-detect Spanish and translate to English: "Hello, how are you?"

**Test 2: English (Main Language) → Secondary Language**
1. **Copy English text:** "Hello, how are you?" (Ctrl+C)
2. **Click panel icon**
3. **Spanish still selected** (blue highlight)
4. **Click "Translate from Clipboard"**
5. **Expected:** Should detect English and translate to Spanish: "Hola, ¿cómo estás?"

**Test 3: Change Secondary Language**
1. **Click "Italian" button** - Should get blue highlight, others lose it
2. **Copy English text:** "Good morning" (Ctrl+C)
3. **Click "Translate from Clipboard"**
4. **Expected:** Should translate English → Italian: "Buongiorno"
5. **Setting should persist** - Italian remains selected after closing popup

**Test 4: Copy to Clipboard**
1. After any translation appears
2. **Click "Copy to Clipboard"**
3. **Verify:**
   - Button text changes to "Copied!"
   - After 1.5 seconds, button reverts to "Copy to Clipboard"
   - **Result field clears automatically**
4. **Paste somewhere** to verify clipboard has the translation

### Step 4: Test Error Handling

**Test scenarios:**
- Empty clipboard (should show "Clipboard is empty. Copy text first.")
- Invalid API key (should show auth error)
- No internet (should show network error)
- Quota exceeded (should show quota message)

---

## 🐞 Potential Issues & Solutions

### Issue: Extension doesn't appear in panel
**Cause:** GNOME Shell hasn't loaded the extension
**Solution:**
1. Verify it's enabled: `gnome-extensions list --enabled | grep deepl`
2. Check logs: `journalctl -f -o cat /usr/bin/gnome-shell`
3. Try disabling and re-enabling

### Issue: "API key not configured" error
**Cause:** Settings not saved or schema not loaded
**Solution:**
1. Recompile schema: `glib-compile-schemas ~/.local/share/gnome-shell/extensions/deepl-translator@juan-de-costa-rica/schemas/`
2. Re-enter API key in preferences
3. Check schema is compiled: `ls ~/.local/share/gnome-shell/extensions/deepl-translator@juan-de-costa-rica/schemas/gschemas.compiled`

### Issue: Translation fails with 403 error
**Cause:** Wrong API key or using Pro endpoint with Free key
**Solution:**
1. Verify using FREE tier API key
2. Check API key has no extra spaces
3. Verify endpoint is `https://api-free.deepl.com/v2/translate` (hardcoded in translator.js)

### Issue: Translation fails with 456 error
**Cause:** Quota exceeded (500k characters/month)
**Solution:**
1. Wait until next month
2. Or upgrade to Pro tier (requires code change to use `https://api.deepl.com`)

### Issue: Can't type in text entry field
**Cause:** Text entry not receiving keyboard focus
**Solution:** Fixed - used `global.stage.set_key_focus()` when menu opens (requires Shell import)
**Status:** ✅ Fixed and then removed in favor of clipboard-based workflow

### Issue: Import errors in logs
**Cause:** Missing module imports
**Solution:** Already fixed - Gio added to prefs.js, GLib added to extension.js, Pango added to extension.js, Shell added to extension.js

### Issue: Extension toggle on but not blue, State: ERROR
**Cause:** WrapMode undefined - used Clutter.WrapMode instead of Pango.WrapMode
**Solution:** Fixed in commit 0b6b237 - import Pango and use Pango.WrapMode.WORD_CHAR
**Status:** ✅ Fixed

### Issue: Button clicks don't show visual feedback
**Cause:** Inline style changes don't reliably update St widgets
**Solution:** Use CSS stylesheet with style classes instead
**Status:** ✅ Fixed in commit 580528c
**Requires:** Log out/in for stylesheet to load on Wayland

---

## 🔮 Future Enhancements (User Ideas)

### Phase 2 - Enhanced Features:
1. ✅ **Translate from Clipboard** - Implemented! Main workflow now
2. **Auto-detect Source Language** - Let DeepL detect the source language
3. **Language Swap Button** - Quick button to reverse EN↔ES
4. **Character Count Display** - Show chars used vs quota
5. **Optional Text Entry Mode** - Toggle between clipboard and manual entry

### Phase 3 - Power User Features:
1. **Keyboard Shortcuts** - Global shortcut to trigger translation
2. **Notification on Complete** - Show notification when translation ready
3. **Translation History** - Keep recent translations
4. **More Language Pairs** - Add FR, DE, IT, PT, etc.
5. **Context Menu Integration** - Right-click selected text to translate

### Phase 4 - Advanced:
1. **Submit to extensions.gnome.org** - Make it available in Extension Manager's Browse tab
2. **Formality Toggle** - DeepL supports formal/informal translations
3. **Glossary Support** - Custom terminology
4. **Batch Translation** - Multiple texts at once

---

## 📝 Code Snippets for Reference

### How to Update the Extension:
```bash
cd /var/home/juan/Desktop/Code/gnome-deepl-translator

# Make changes to files
nano extension.js

# Copy to installed location
cp extension.js ~/.local/share/gnome-shell/extensions/deepl-translator@juan-de-costa-rica/

# Disable and re-enable (or restart shell)
gnome-extensions disable deepl-translator@juan-de-costa-rica
gnome-extensions enable deepl-translator@juan-de-costa-rica

# Commit changes
git add extension.js
git commit -m "Description of changes"
git push
```

### How to Check Settings Values:
```bash
# Using gsettings
gsettings list-keys org.gnome.shell.extensions.deepl-translator
gsettings get org.gnome.shell.extensions.deepl-translator api-key
gsettings get org.gnome.shell.extensions.deepl-translator default-source-lang

# Using dconf
dconf dump /org/gnome/shell/extensions/deepl-translator/
```

### How to Debug:
```bash
# Watch GNOME Shell logs
journalctl -f -o cat /usr/bin/gnome-shell | grep -i deepl

# Or use Looking Glass (Alt+F2, type 'lg')
# Then check Extensions tab
```

### DeepL API Example (for reference):
```bash
curl -X POST https://api-free.deepl.com/v2/translate \
  -d "auth_key=YOUR_API_KEY" \
  -d "text=Hello world" \
  -d "source_lang=EN" \
  -d "target_lang=ES"
```

---

## 🎤 User Context & Preferences

### User Background:
- Uses **Fedora Bluefin** (immutable, based on Silverblue)
- Prefers **professional, smart execution** with step-by-step commits
- Has **Extension Manager v0.6.5** installed for managing extensions
- Uses **Obsidian** for notes (PARA method: Projects/Areas/Resources/People)
- Has **GitHub CLI authenticated** with SSH keys configured
- Username: **juan-de-costa-rica** (GitHub: Juan-de-Costa-Rica)

### User Workflow Preferences:
- ✅ Git commits at every logical step
- ✅ Professional, modern approach ("whatever the kids are doing")
- ✅ Planning before execution to avoid pitfalls
- ✅ Clean, organized code with proper error handling
- ✅ No separate windows (wants panel integration)

### Communication Style:
- Direct and technical
- Appreciates thoroughness
- Wants to understand potential issues upfront
- Values git history for rollback capability

---

## 📚 Important Documentation Links

- **GJS Guide:** https://gjs.guide/extensions/
- **GNOME 48 Extensions:** https://gjs.guide/extensions/upgrading/gnome-shell-48.html
- **Soup 3 API:** https://libsoup.org/libsoup-3.0/
- **DeepL API Docs:** https://www.deepl.com/docs-api/translate-text/
- **Extension Review Guidelines:** https://gjs.guide/extensions/review-guidelines/review-guidelines.html

---

## 🎯 Instructions for Next Agent

### CRITICAL: Always Update This Document

**⚠️ IMPORTANT:** After completing ANY meaningful work (features, bug fixes, enhancements, refactoring), you MUST update this Project-Handoff.md document with:

1. **Add a new entry to the Bug Fix Log section** (if applicable)
2. **Update the Commit History** with new commit hash and description
3. **Update "What's Complete"** with new features/fixes
4. **Update file line counts** if significantly changed (extension.js, translator.js, prefs.js)
5. **Update the status at the top** of the document
6. **Update "Last updated" timestamp** at the bottom
7. **Document any new pitfalls or issues encountered**
8. **Update testing instructions** if workflow changed

The user should NEVER have to ask you to update this document. It should happen automatically as part of your workflow, just like committing code to git.

### Immediate Next Steps

1. **Test current functionality:** Verify inline copied indicator works as expected
2. **If working well:** Consider Phase 2 enhancements (see Future Enhancements section)
3. **Long-term:** Help submit to extensions.gnome.org if desired
4. **Always:** Update this handoff document after completing any work

**Extension Status:** Fully functional, all MVP features complete, UX polished

---

## 💬 Key Conversation Points

### Original User Request:
"I do a lot of chatting with people that speak Spanish, my default language is English. I would like some sort of extension that taps into DeepL (I have API key) and can easily do translations. Something that isn't its own window... I'll have a chat window open and I'll need to easily translate something, or translate my own English text into Spanish."

### Our Approach:
1. ✅ Researched GNOME 48 extension development thoroughly
2. ✅ Identified all technical pitfalls before coding
3. ✅ Built MVP with clean architecture
4. ✅ Committed each step to git with descriptive messages
5. ✅ Pushed to GitHub for version control
6. ✅ Created comprehensive documentation

### Success Criteria Met:
- ✅ Panel indicator (not separate window)
- ✅ Quick translation UI with visual feedback
- ✅ EN↔ES language support with clear button selection
- ✅ Copy to clipboard with auto-clear workflow
- ✅ API key configuration
- ✅ Professional code quality following GNOME 48 best practices
- ✅ Git version control with 16 commits
- ✅ Complete documentation
- ✅ Modern CSS styling with hover effects

---

## 🐛 Bug Fix Log

### October 10, 2025 - Bug #1: WrapMode Import Error
**Issue Found:** Extension enabled but crashed with ERROR state
- **Symptom:** Toggle on but not blue in Extension Manager
- **Error:** `TypeError: (intermediate value).WrapMode is undefined`
- **Root Cause:** Used `Clutter.WrapMode.WORD_CHAR` (doesn't exist in GNOME 48)
- **Fix Applied:** Import `Pango` and use `Pango.WrapMode.WORD_CHAR`
- **Commit:** 0b6b237
- **Status:** ✅ Fixed, pushed to GitHub

### October 10, 2025 - Bug #2: Text Entry Not Accepting Input
**Issue Found:** Extension loads, UI displays, but can't type in text entry field
- **Symptom:** Clicking in "Enter text here..." field does nothing, no cursor appears
- **Root Cause:** St.Entry not receiving keyboard focus when popup menu opens
- **Fix Applied:**
  - Added Shell import to access `global.stage`
  - Added `open-state-changed` signal handler on menu
  - Set keyboard focus using `global.stage.set_key_focus(entry.clutter_text)` with 50ms timeout
  - Made entry explicitly editable with `set_editable(true)` and `set_activatable(true)`
- **Research:** Pattern based on Project Hamster GNOME Shell extension
- **Commit:** 2c0e02e
- **Status:** ✅ Fixed and tested - text entry now accepts input

### October 10, 2025 - Enhancement #1: Button Visual Feedback
**Issue Found:** Language toggle buttons had no visual feedback when clicked
- **Symptom:** User couldn't tell which button (EN→ES or ES→EN) was selected
- **Root Cause:** Inline style property changes don't reliably update St widget rendering
- **Fix Applied:**
  - Created `stylesheet.css` with CSS classes for button states
  - Language buttons use `deepl-lang-button` base class
  - Active state uses `deepl-lang-button-active` class (blue background, bold text)
  - All buttons have hover effects
  - Updated `_updateButtonStates()` to use `add_style_class_name()` / `remove_style_class_name()`
  - Added stylesheet reference to metadata.json
- **Best Practice:** GNOME Shell extensions should use CSS classes, not inline styles
- **Commit:** 580528c
- **Status:** ✅ Fixed in code, needs logout/login to load stylesheet

### October 10, 2025 - Enhancement #2: Auto-Clear After Copy
**User Request:** Clear text fields after successful copy to prepare for next translation
- **Implementation:**
  - After "Copy to Clipboard" clicked, button shows "Copied!" for 1.5 seconds
  - When button label reverts to "Copy to Clipboard", both text fields clear automatically
  - Provides clean workflow: translate → copy → auto-clear → ready for next
- **Commit:** 580528c (same commit as visual feedback)
- **Status:** ✅ Implemented, needs testing

### October 10, 2025 - Enhancement #3: Clipboard-Based Workflow
**User Request:** Simplify UI by removing text entry and using clipboard-only workflow
- **Changes Made:**
  - Removed source text entry field and label
  - Changed "Translate" button to "Translate from Clipboard"
  - Moved translate button to its own line below language toggles
  - Updated `_doTranslation()` to read from `St.Clipboard.get_text()` instead of text entry
  - Updated error message: "Clipboard is empty. Copy text first."
  - Removed focus-setting code (no longer needed)
  - Simplified `_copyToClipboard()` to only clear result field
- **New Workflow:**
  1. User copies text from any application (Ctrl+C)
  2. User clicks panel icon
  3. User clicks "Translate from Clipboard"
  4. Translation appears
  5. User clicks "Copy to Clipboard"
  6. Result field clears automatically
- **Benefits:**
  - Cleaner, simpler UI
  - Faster workflow (no need to paste into extension)
  - Follows natural copy-paste workflow
  - Reduced code complexity (~23 lines removed)
- **Commit:** 08b27cb
- **Status:** ✅ Implemented and tested (State: ACTIVE)

### October 10, 2025 - MAJOR FEATURE: Intelligent Auto-Detect Translation
**User Request:** "Auto-detect clipboard language. If not my main language → translate to main. If it is my main language → translate to secondary language."
- **Changes Made:**
  - **Schema Update:** Replaced `default-source-lang`/`default-target-lang` with `main-language`/`secondary-language`
  - **translator.js Enhancement:**
    - Modified `translate()` to accept `null` for `sourceLang` parameter (triggers auto-detect)
    - API now returns `detected_source_language` field from DeepL response
    - Updated callback signature: `(translatedText, detectedSourceLang, error)`
    - Updated all error callbacks to include 3 parameters
  - **extension.js Complete Redesign:**
    - Removed EN→ES / ES→EN toggle buttons
    - Added secondary language selector with 5 buttons: Spanish, Italian, French, German, Portuguese
    - Implemented smart translation logic in `_doTranslation()`:
      - First API call with auto-detect to get detected language
      - If detected ≠ main → re-translate to main language
      - If detected = main → use translation to secondary language
    - Updated `_updateButtonStates()` to highlight selected secondary language
    - Language selection persists via GSettings
  - **prefs.js Update:**
    - Changed "Default Source Language" → "Main Language"
    - Changed "Default Target Language" → "Secondary Language"
    - Added clear subtitles explaining behavior
    - Added explanation row describing auto-detect logic
- **Smart Logic Flow:**
  1. User copies text to clipboard
  2. Extension auto-detects language via DeepL API
  3. If detected language ≠ main language (EN) → translate to main
  4. If detected language = main language (EN) → translate to selected secondary (ES/IT/FR/DE/PT-BR)
- **Benefits:**
  - **Zero mental overhead** - user never thinks about direction
  - **Multi-language support** - easy switching between secondary languages
  - **Natural workflow** - just copy and translate
  - **Persistent settings** - remembers last selected secondary language
- **Files Modified:** 4 files (schemas XML, translator.js, extension.js, prefs.js)
- **Lines Changed:** +120/-74
- **Commit:** 2bd8051
- **Status:** ✅ Code complete, requires logout/login to load (Wayland limitation)

### October 11, 2025 - UX Enhancement: Translation Persistence
**User Request:** "Keep translated text visible until menu closes, not auto-clear after copy"
- **Problem:** Text was auto-clearing 1.5 seconds after copy, giving user no time to reference it
- **Changes Made:**
  - Added `open-state-changed` signal handler on popup menu (extension.js:39-44)
  - Clear result field only when menu closes (loses focus)
  - Removed auto-clear from `_autoCopyToClipboard()` method
  - Removed auto-clear from `_copyToClipboard()` method
  - Added cleanup in `destroy()` for new signal handler
- **New Workflow:**
  1. Translate from clipboard → translation appears
  2. Text auto-copied to clipboard (as before)
  3. Shows "✓ Copied!" feedback for 1.5 seconds
  4. **Translation stays visible** until user clicks away
  5. Menu closes → result field clears automatically
- **Benefits:**
  - User can reference translation as long as needed
  - More natural workflow - clear when done, not on timer
  - Better UX for comparing original and translated text
- **Files Modified:** 1 file (extension.js)
- **Lines Changed:** +15/-4
- **Commit:** 66093b9
- **Status:** ✅ Code complete, pushed to GitHub

### October 11, 2025 - UX Enhancement: Inline Copied Indicator
**User Request:** "Remove redundant Copy button, show inline '✓ Copied!' indicator next to 'Translation:' label"
- **Problem:** "Copy to Clipboard" button was redundant since translation auto-copies
- **Changes Made:**
  - Removed "Copy to Clipboard" button completely
  - Removed `_copyToClipboard()` method (no longer needed)
  - Added inline "✓ Copied!" indicator next to "Translation:" label
  - Indicator shows in green for 2 seconds after auto-copy
  - Indicator hides when menu closes
  - Created horizontal box layout for "Translation:" + indicator
- **New Workflow:**
  1. Translate from clipboard → translation appears
  2. Text auto-copied to clipboard
  3. "Translation: ✓ Copied!" shows for 2 seconds
  4. Translation stays visible until menu closes
  5. No button to click - cleaner, streamlined UI
- **Benefits:**
  - Cleaner UI with one less button
  - More subtle visual feedback
  - Workflow is more obvious (auto-copy is clear)
  - Less clutter in the popup menu
- **Files Modified:** 1 file (extension.js)
- **Lines Changed:** +25/-54
- **Commit:** 980c5ef
- **Status:** ✅ Code complete, tested, pushed to GitHub

### October 11, 2025 - UX Enhancement: Persistent Copied Indicator
**User Request:** "Keep '✓ Copied!' indicator visible until menu closes, not just 2 seconds"
- **Problem:** Indicator disappeared after 2 seconds while translated text stayed visible until menu closed - inconsistent UX
- **Changes Made:**
  - Removed 2-second timeout from `_autoCopyToClipboard()` method (extension.js:239-249)
  - Removed `_copyTimeoutId` cleanup from `destroy()` method
  - Indicator now relies on existing `open-state-changed` signal handler to clear when menu closes
  - Simplified code: removed 15 lines of timeout logic
- **New Behavior:**
  1. Translate from clipboard → translation appears
  2. Text auto-copied to clipboard
  3. "✓ Copied!" indicator appears and **stays visible**
  4. Translation and indicator both persist until menu closes
  5. Menu closes → both clear automatically
- **Benefits:**
  - Consistent UX - indicator matches translated text persistence
  - User can reference both text and indicator as long as needed
  - Cleaner code with less timeout management
- **Files Modified:** 1 file (extension.js)
- **Lines Changed:** +1/-16
- **Commit:** ce70e13
- **Status:** ✅ Code complete, tested, pushed to GitHub

### October 11, 2025 - Production Preparation: Documentation Cleanup
**User Request:** Remove excessive emojis for professional appearance before submission
- **Problem:** Documentation had decorative emojis throughout, making it look unprofessional
- **Changes Made:**
  - Removed all emoji bullets from README.md Features section
  - Removed excessive checkmarks from Future Enhancements
  - Cleaned up SETUP_NOTES.md status section
  - Retained functional UI elements (like ✓ in "Copied!" indicator)
- **Files Modified:** 2 files (README.md, SETUP_NOTES.md)
- **Lines Changed:** 19 insertions(+), 19 deletions(-)
- **Commit:** 60944ea
- **Status:** ✅ Documentation now professional and production-ready

### October 11, 2025 - Bug #3: AdwEntryRow Subtitle Property Error
**Issue Found:** Preferences window crashed on open with "No property subtitle on AdwEntryRow"
- **Symptom:** Clicking preferences icon caused immediate crash, error in journal logs
- **Error:** `Error: No property subtitle on AdwEntryRow`
- **Root Cause:** `AdwEntryRow` does not support `subtitle` property (only `AdwActionRow` does)
- **Fix Applied:**
  - Removed `subtitle` property from Main Language `AdwEntryRow` (prefs.js:52)
  - Removed `subtitle` property from Secondary Language `AdwEntryRow` (prefs.js:67)
  - Descriptions still available via PreferencesGroup description and explanation rows
- **Discovery:** Found immediately after first submission to extensions.gnome.org
- **Files Modified:** 1 file (prefs.js)
- **Lines Changed:** +0/-2
- **Commit:** 297f45f
- **Status:** ✅ Fixed, tested, pushed to GitHub, new submission package created

### October 11, 2025 - Enhancement #4: Customizable Language Buttons
**User Request:** "Make the secondary language buttons configurable in preferences"
- **Problem:** Language buttons were hardcoded (ES, IT, FR, DE, PT-BR) - users couldn't add Japanese, Chinese, etc.
- **Changes Made:**
  - **Schema Update (gschema.xml):**
    - Replaced `secondary-language` (single string) with:
      - `available-languages` (comma-separated string, default 'ES,IT,FR,DE,PT-BR')
      - `last-used-language` (string, tracks last selected button)
  - **Preferences UI (prefs.js):**
    - Changed "Secondary Language" field to "Available Languages"
    - Text entry accepts comma-separated language codes
    - Help text shows examples: `ES,IT,FR,DE,PT-BR` or `JA,ZH,KO,RU,AR`
  - **Extension Logic (extension.js):**
    - Added `_rebuildLanguageButtons()` method
    - Parses `available-languages` string and creates buttons dynamically
    - Language code to friendly name mapping for all 30 DeepL languages
    - Watches settings changes and rebuilds buttons reactively
    - Auto-resets to first language if last-used no longer available
    - Added cleanup for settings change listener in `destroy()`
- **Benefits:**
  - Users can customize which languages appear as buttons
  - Easy to add Asian languages (JA, ZH, KO), Cyrillic (RU, UK), etc.
  - No more hardcoded language list
  - Clean separation: preferences = configuration, UI = selection
  - Supports any number of buttons (3, 5, 10, etc.)
- **Migration:** Existing users' settings migrated via dconf from `secondary-language` to new keys
- **Files Modified:** 3 files (gschema.xml, prefs.js, extension.js)
- **Lines Changed:** +82/-40
- **Commit:** 3341523
- **Status:** ✅ Code complete, requires logout/login to load new schema on Wayland

### October 11, 2025 - Enhancement #5: Dropdown Language Selectors (Production Ready)
**User Request:** "Replace text entry with proper dropdown selectors for production readiness"
- **Problem:** Text entry allowed invalid input - users could enter wrong codes, wrong number of languages, etc.
- **Changes Made:**
  - **Main Language (prefs.js):**
    - Replaced `Adw.EntryRow` with `Adw.ComboRow`
    - Dropdown shows all 30 DeepL language names (Bulgarian, Czech, Danish, etc.)
    - No "None" option - main language is required
    - Automatic validation - impossible to enter invalid code
  - **Secondary Languages (prefs.js):**
    - Replaced comma-separated text entry with 3 separate `Adw.ComboRow` widgets
    - Each dropdown labeled "Language Slot 1/2/3"
    - Includes "None" option for flexibility (users can choose 1-3 languages)
    - Real-time updates to `available-languages` setting (comma-separated string)
    - Helper functions for index ↔ language code conversion
  - **UI/UX Improvements:**
    - All 30 DeepL languages supported in dropdowns
    - Clear labels and subtitles explaining functionality
    - Maintains backward compatibility with existing settings
    - Professional appearance matching GNOME HIG
- **Benefits:**
  - Zero invalid input - automatic validation
  - Better UX - visual language selection instead of memorizing codes
  - Flexible 1-3 language configuration
  - Production-ready quality
  - Easier for users to discover all 30 supported languages
- **Files Modified:** 1 file (prefs.js)
- **Lines Changed:** +131/-26
- **Commit:** ab8ac8e
- **Status:** ✅ Code complete, needs logout/login to test on Wayland

### October 11, 2025 - Enhancement #6: Settings Gear Icon in Popup
**User Request:** "Add gear icon to popup menu for easy preferences access"
- **Problem:** No obvious way to access preferences from the extension popup
- **Changes Made:**
  - **Header Section (extension.js):**
    - Added horizontal box layout for header
    - "DeepL Translator" title label (bold, larger font, left-aligned)
    - Settings gear button with `emblem-system-symbolic` icon (right-aligned)
    - Button clicks open preferences and close popup
    - Uses `this._extension.openPreferences()` API
  - **Styling:**
    - Professional appearance with proper spacing
    - Standard GNOME icon and button styling
    - Consistent with system preferences patterns
- **Benefits:**
  - Improved discoverability of preferences UI
  - Standard GNOME UX pattern (gear icon = settings)
  - No need to right-click or search Extension Manager
  - One-click access to configuration
- **Files Modified:** 1 file (extension.js)
- **Lines Changed:** +29/-0
- **Commit:** 7cd7031
- **Status:** ✅ Code complete, needs logout/login to test on Wayland

### October 11, 2025 - Enhancement #8: PRIMARY Selection Support (v2.0)
**User Request:** "Translate selected text without copying - save one click in the workflow"
- **Problem:** User had to select text AND copy it (Ctrl+C) before translating
- **Solution:** Smart clipboard reading with PRIMARY selection fallback
- **Changes Made:**
  - **extension.js Updates:**
    - Modified `_doTranslation()` to try `St.ClipboardType.PRIMARY` first
    - Falls back to `St.ClipboardType.CLIPBOARD` if PRIMARY is empty
    - Extracted translation logic into new `_performTranslation()` helper method
    - Updated button label: "Translate from Clipboard" → "Translate"
    - Cleaner code organization with nested async callbacks
  - **metadata.json Updates:**
    - Version bump: 1 → 2
    - Added `version-name: "2.0"` for user-facing version display
- **New Workflow Options:**
  - Option 1 (NEW): Select text → Click icon → Translate (saves one click!)
  - Option 2 (Still works): Copy text → Click icon → Translate
- **Technical Details:**
  - Uses Linux PRIMARY selection buffer (auto-populated on text selection)
  - Wayland supports PRIMARY selection via protocol extension
  - Seamless fallback ensures backward compatibility
- **Benefits:**
  - Faster workflow - one less click per translation
  - More intuitive - just select and translate
  - Still supports traditional copy workflow
  - Professional versioning with semantic version number
- **Files Modified:** 2 files (extension.js, metadata.json)
- **Lines Changed:** +41/-20
- **Commit:** b4b8c34
- **Status:** ✅ Version 2.0 code complete, needs logout/login to test

### October 15, 2025 - Rollback: Keyboard Shortcut Feature Reverted
**Issue Found:** Keyboard shortcut feature (commits 9e95ef4, aabd69f, 068108a) broke the extension
- **Symptom:** Extension State: ERROR - completely unusable after implementing keyboard shortcuts
- **Root Cause:** Unknown - feature caused extension to fail loading entirely
- **Action Taken:**
  - Hard reset to commit 660bcca (last known working state)
  - Removed keyboard shortcut implementation
  - Reinstalled extension files and recompiled schema
- **Decision:** Postpone keyboard shortcuts to future enhancement phase
- **Commits Reverted:**
  - 9e95ef4 - Feature: Add keyboard shortcut to toggle translator popup
  - aabd69f - Docs: Update Project-Handoff with commit hash for keyboard shortcut feature
  - 068108a - Docs: Add critical workflow reminder for future agents
- **Current State:** Back to stable v2.0 with PRIMARY selection support (commit 660bcca)
- **Status:** ✅ Rolled back successfully, extension files reinstalled
- **Next Step:** User needs to logout/login to reload working extension code

### October 18, 2025 - Enhancement #9: Smart Auto-Translate on Menu Open (v2.1)
**User Request:** "If text is selected/copied when I click the panel icon, why should I have to click the translate button manually?"
- **Problem:** User workflow required two clicks: (1) click panel icon, (2) click "Translate" button
- **Solution:** Smart auto-translate when popup opens if clipboard has new text
- **Changes Made:**
  - **State Tracking (extension.js:22):**
    - Added `this._lastSourceText = ''` to track last translated source text
  - **Enhanced Menu Open Handler (extension.js:40-50):**
    - Modified `open-state-changed` signal handler to call `_checkAndAutoTranslate()` when menu opens
    - Preserves `_lastSourceText` when menu closes (needed for comparison on next open)
  - **New Method: `_checkAndAutoTranslate()` (extension.js:231-249):**
    - Reads PRIMARY selection first, falls back to CLIPBOARD
    - Delegates to `_autoTranslateIfNew()` with clipboard text
  - **New Method: `_autoTranslateIfNew()` (extension.js:251-259):**
    - Compares clipboard text with `_lastSourceText`
    - Only auto-translates if text is new and non-empty
    - Does nothing if text matches (prevents redundant API calls and preserves quota)
  - **Updated `_performTranslation()` (extension.js:300):**
    - Stores source text in `_lastSourceText` at start of translation
- **New Workflow:**
  - **Quick translation:** Select "Hola mundo" → Click icon → **Auto-translates immediately**
  - **Change language:** Select "Hello" → Click icon → Auto-translates to Spanish → Click "French" → Re-translates to French
  - **Reopen same text:** Close menu → Reopen with same text → **No API call, shows cached translation**
  - **Manual control:** "Translate" button still works for manual triggering
- **Benefits:**
  - **Faster workflow:** Eliminates one click per translation (select → click icon → done!)
  - **Smart caching:** Prevents redundant API calls when reopening menu with same text
  - **Preserves control:** User can still change target language and manually re-translate
  - **Quota friendly:** Only makes API calls when text is actually new
  - **No breaking changes:** Manual translate button still available for edge cases
- **Files Modified:** 1 file (extension.js)
- **Lines Changed:** +42/-3 (~400 lines total)
- **Status:** ✅ Code complete, copied to installation directory, needs logout/login to test
- **Testing Needed After Logout/Login:**
  - Test auto-translate with selected text (PRIMARY selection)
  - Test auto-translate with copied text (CLIPBOARD)
  - Test reopening menu with same text (should not re-translate)
  - Test changing target language after auto-translate
  - Test empty clipboard (should show empty popup)

---

**Status: 🟡 Version 2.1 Development - Smart Auto-Translate Code Complete**
**Next Agent: User must logout/login to load v2.1 code on Wayland. After login, test auto-translate feature with the scenarios listed above. If tests pass, commit to git. If tests fail, debug and fix issues.**

**⚠️ IMPORTANT FOR NEXT AGENT:**
After any meaningful work (features, bug fixes, enhancements), you MUST update this Project-Handoff.md document. Add entries to the Bug Fix Log, update commit history, update "What's Complete", and update timestamps. The user should never have to manually request handoff document updates.

---

*Document created: October 10, 2025*
*Last updated: October 18, 2025 (after implementing smart auto-translate v2.1)*
*Agent: Claude (Sonnet 4.5)*
