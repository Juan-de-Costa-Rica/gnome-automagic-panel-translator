#!/bin/bash
# Package extension for GNOME Extensions website (flat structure)

set -e

VERSION=$(grep -oP '"version":\s*\K\d+' metadata.json)
ZIP_FILE="automagic-panel-translator@juan-de-costa-rica-v${VERSION}-flat.zip"

echo "Packaging extension v${VERSION} (flat structure)..."

# Create temporary directory
TMP_DIR=$(mktemp -d)

# Copy essential extension files to temp dir (flat, no subdirectory)
cp extension.js "${TMP_DIR}/"
cp translator.js "${TMP_DIR}/"
cp prefs.js "${TMP_DIR}/"
cp metadata.json "${TMP_DIR}/"
cp stylesheet.css "${TMP_DIR}/"

# Copy lib directory
mkdir -p "${TMP_DIR}/lib"
cp lib/*.js "${TMP_DIR}/lib/"

# Copy and compile schemas
mkdir -p "${TMP_DIR}/schemas"
cp schemas/*.xml "${TMP_DIR}/schemas/"
glib-compile-schemas "${TMP_DIR}/schemas/"

# Create zip file from inside temp directory (files at root)
cd "${TMP_DIR}"
zip -r "${ZIP_FILE}" *

# Move zip to original directory
mv "${ZIP_FILE}" "${OLDPWD}/"

# Cleanup
cd "${OLDPWD}"
rm -rf "${TMP_DIR}"

echo "✓ Package created: ${ZIP_FILE}"
echo ""
echo "Files are at the root of the zip (flat structure)."
echo "Try uploading this version to GNOME Extensions."
