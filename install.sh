#!/bin/bash

# Installation script for DeepL Translator GNOME Extension

set -e

EXTENSION_UUID="deepl-translator@juan-de-costa-rica"
VERSION=$(grep -oP '"version":\s*\K\d+' metadata.json)
ZIP_FILE="${EXTENSION_UUID}-v${VERSION}-flat.zip"

# Check if zip exists, build if not
if [ ! -f "$ZIP_FILE" ]; then
    echo "Package not found. Building extension package..."
    ./package-flat.sh
fi

echo "Installing extension from $ZIP_FILE..."
gnome-extensions install --force "$ZIP_FILE"

echo ""
echo "✓ Extension installed successfully!"
echo ""
echo "IMPORTANT: You must restart GNOME Shell before enabling:"
echo "  - On Wayland: Log out and log back in"
echo "  - On X11: Press Alt+F2, type 'r', and press Enter"
echo ""
echo "After restarting, enable the extension with:"
echo "  gnome-extensions enable $EXTENSION_UUID"
echo ""
echo "Then configure your DeepL API key in preferences:"
echo "  Right-click the panel icon → Preferences"
