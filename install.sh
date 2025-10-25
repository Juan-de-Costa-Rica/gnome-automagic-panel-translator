#!/bin/bash

# Installation script for DeepL Translator GNOME Extension

set -e

EXTENSION_UUID="deepl-translator@juan-de-costa-rica"

echo "Building extension package..."

# Create package using the flat packaging script
./package-flat.sh

# Get the zip filename
VERSION=$(grep -oP '"version":\s*\K\d+' metadata.json)
ZIP_FILE="${EXTENSION_UUID}-v${VERSION}-flat.zip"

if [ ! -f "$ZIP_FILE" ]; then
    echo "Error: Package file $ZIP_FILE not found"
    exit 1
fi

echo "Installing extension using gnome-extensions install..."
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
