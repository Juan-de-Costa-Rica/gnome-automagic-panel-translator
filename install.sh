#!/bin/bash

# Installation script for DeepL Translator GNOME Extension

EXTENSION_UUID="deepl-translator@juan-de-costa-rica"
INSTALL_DIR="$HOME/.local/share/gnome-shell/extensions/$EXTENSION_UUID"

echo "Installing DeepL Translator extension..."

# Create installation directory
mkdir -p "$INSTALL_DIR"

# Copy extension files
cp extension.js "$INSTALL_DIR/"
cp prefs.js "$INSTALL_DIR/"
cp translator.js "$INSTALL_DIR/"
cp metadata.json "$INSTALL_DIR/"
cp README.md "$INSTALL_DIR/"

# Copy schemas
cp -r schemas "$INSTALL_DIR/"

# Compile schemas
echo "Compiling GSettings schemas..."
glib-compile-schemas "$INSTALL_DIR/schemas/"

echo "Extension installed to: $INSTALL_DIR"
echo ""
echo "To enable the extension, run:"
echo "  gnome-extensions enable $EXTENSION_UUID"
echo ""
echo "Then restart GNOME Shell (logout/login or Alt+F2, type 'r' on X11)"
echo ""
echo "Configure your DeepL API key in the extension preferences."
