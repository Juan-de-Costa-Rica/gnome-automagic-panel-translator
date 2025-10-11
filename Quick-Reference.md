# DeepL Translator Extension - Quick Reference

## 📍 Quick Facts
- **Extension UUID:** `deepl-translator@juan-de-costa-rica`
- **Code Location:** `/var/home/juan/Desktop/Code/gnome-deepl-translator/`
- **Install Location:** `~/.local/share/gnome-shell/extensions/deepl-translator@juan-de-costa-rica/`
- **GitHub:** https://github.com/Juan-de-Costa-Rica/gnome-deepl-translator
- **Status:** ✅ Production Ready - Dropdown Selectors & Settings Gear Complete (27 commits)

## 🚀 Quick Commands

### Enable Extension
```bash
gnome-extensions enable deepl-translator@juan-de-costa-rica
```

### Disable Extension
```bash
gnome-extensions disable deepl-translator@juan-de-costa-rica
```

### Check if Enabled
```bash
gnome-extensions list --enabled | grep deepl
```

### View Logs
```bash
journalctl -f -o cat /usr/bin/gnome-shell | grep -i deepl
```

### Reinstall/Update
```bash
cd /var/home/juan/Desktop/Code/gnome-deepl-translator
./install.sh
```

### Open Preferences
```bash
gnome-extensions prefs deepl-translator@juan-de-costa-rica
```

## 🔑 API Key Setup
1. Get free key: https://www.deepl.com/pro-api
2. Free tier: 500,000 chars/month
3. Use FREE tier key (not Pro)
4. Enter in extension preferences

## 🐛 Debug Checklist

If extension doesn't work:
- [ ] ⚠️ **CRITICAL:** Logged out and back in? (REQUIRED on Wayland after code changes)
- [ ] Extension enabled? `gnome-extensions list --enabled | grep deepl`
- [ ] Check state: `gnome-extensions info deepl-translator@juan-de-costa-rica | grep State`
- [ ] Schema compiled? `ls ~/.local/share/gnome-shell/extensions/deepl-translator@juan-de-costa-rica/schemas/gschemas.compiled`
- [ ] Settings exist? `dconf dump /org/gnome/shell/extensions/deepl-translator/`
- [ ] API key configured? Check in preferences
- [ ] Check logs: `journalctl -f -o cat /usr/bin/gnome-shell`

## 📝 Common Issues

### Extension not appearing
→ Log out/in required on Wayland

### Toggle on but not blue, State: ERROR
→ Fixed in commit 0b6b237 (Pango import)
→ Log out/in to reload fixed code

### 403 Authentication Failed
→ Check API key is correct FREE tier key

### 456 Quota Exceeded
→ Wait until next month or upgrade to Pro

### Menu closes when clicking entry
→ Already fixed with Clutter.EVENT_STOP

### WrapMode undefined error
→ Fixed: Now uses Pango.WrapMode instead of Clutter.WrapMode

### Can't type in text entry
→ Fixed and removed: Now uses clipboard-based workflow instead

## 🔧 Files to Edit

- **extension.js** - Main UI and logic (~312 lines) - includes settings gear icon
- **translator.js** - DeepL API calls (~112 lines)
- **prefs.js** - Preferences window (~197 lines) - includes dropdown selectors
- **schemas/....gschema.xml** - Settings schema

After editing, copy to install location and restart extension.

## 📊 Git Workflow

```bash
cd /var/home/juan/Desktop/Code/gnome-deepl-translator

# Make changes
nano extension.js

# Test changes
cp extension.js ~/.local/share/gnome-shell/extensions/deepl-translator@juan-de-costa-rica/
gnome-extensions disable deepl-translator@juan-de-costa-rica
gnome-extensions enable deepl-translator@juan-de-costa-rica

# Commit
git add extension.js
git commit -m "Description"
git push
```

## 🎯 Testing Checklist

- [ ] Extension appears in panel
- [ ] Clicking opens popup menu
- [ ] **Header shows "DeepL Translator" title with gear icon on right**
- [ ] **Clicking gear icon opens preferences window**
- [ ] Secondary language buttons show (1-3 configurable languages)
- [ ] Selected language has blue highlight
- [ ] Clipboard-based translation works
- [ ] "Translate from Clipboard" button works
- [ ] Translation appears in result area
- [ ] "✓ Copied!" indicator appears next to "Translation:" label
- [ ] Translation auto-copied to clipboard
- [ ] Indicator stays visible until menu closes
- [ ] Result persists until menu closes
- [ ] Error handling works (empty clipboard, bad API key)
- [ ] **Preferences window shows dropdown selectors (not text entry)**
- [ ] **Main language dropdown works (30 languages)**
- [ ] **3 secondary language dropdowns work (includes "None" option)**
- [ ] **Changing dropdown selections updates buttons in popup**
- [ ] API key saves correctly

## 📋 How to Use

### Intelligent Auto-Detect Workflow:
1. **Copy text** from any application (Ctrl+C) - any language!
2. **Look for the translation icon** in the top panel (right side)
3. **Click the icon** to open the popup
4. **Select target language** - Click a language button
   - Default buttons: Spanish, Italian, French, German, Portuguese
   - Customizable in preferences! (e.g., add Japanese, Chinese, Korean, etc.)
   - Blue highlight shows which is selected
5. **Click "Translate from Clipboard"** button
6. **Magic happens:**
   - Extension auto-detects the language
   - If foreign language → translates to your main language (default: English)
   - If main language → translates to your selected button language
7. Translation appears with **"Translation: ✓ Copied!"** indicator
8. **Translation is automatically copied to clipboard** - just paste it!
9. Translation stays visible until you close the menu

### Customizing Language Buttons:
1. **Open Preferences:** Click gear icon in popup menu OR right-click panel icon → Preferences
2. **Select Main Language:** Choose from dropdown (Bulgarian, Czech, Danish, German, Greek, English, Spanish, etc.)
3. **Select Secondary Languages:** Use 3 dropdown slots to choose up to 3 languages
   - Set any slot to "None" if you only want 1 or 2 languages
   - Example: Slot 1 = Spanish, Slot 2 = Japanese, Slot 3 = None
4. **Buttons update automatically** in the popup menu
5. **Supports all 30 DeepL languages** with automatic validation

### Examples:
- Copy "Hola" → Translates to "Hello" (Spanish detected → English)
- Copy "Hello" → Translates to "Hola" (English detected → Spanish if selected)
- Copy "Bonjour" → Translates to "Hello" (French detected → English)
- Select Italian, copy "Hello" → "Ciao" (English → Italian)
- Configure Japanese/Chinese in preferences → Translate to Asian languages!

---

**Latest Update:** ✅ Production-ready enhancements (commits ab8ac8e, 7cd7031):
- Dropdown language selectors with automatic validation
- Settings gear icon in popup menu for easy access to preferences
- Professional UX ready for extensions.gnome.org submission
