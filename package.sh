#!/bin/bash
# Package extension for GNOME Extensions website submission

set -e

EXTENSION_NAME="deepl-translator@juan-de-costa-rica"
VERSION=$(grep -oP '"version":\s*\K\d+' metadata.json)

echo "Packaging ${EXTENSION_NAME} v${VERSION}..."

# Create temporary directory
TMP_DIR=$(mktemp -d)
PACKAGE_DIR="${TMP_DIR}/${EXTENSION_NAME}"

mkdir -p "${PACKAGE_DIR}"

# Copy essential extension files only
cp extension.js "${PACKAGE_DIR}/"
cp translator.js "${PACKAGE_DIR}/"
cp prefs.js "${PACKAGE_DIR}/"
cp metadata.json "${PACKAGE_DIR}/"
cp stylesheet.css "${PACKAGE_DIR}/"

# Copy lib directory
mkdir -p "${PACKAGE_DIR}/lib"
cp lib/*.js "${PACKAGE_DIR}/lib/"

# Copy and compile schemas
mkdir -p "${PACKAGE_DIR}/schemas"
cp schemas/*.xml "${PACKAGE_DIR}/schemas/"
glib-compile-schemas "${PACKAGE_DIR}/schemas/"

# Create zip file
cd "${TMP_DIR}"
ZIP_FILE="${EXTENSION_NAME}-v${VERSION}.zip"
zip -r "${ZIP_FILE}" "${EXTENSION_NAME}"

# Move zip to original directory
mv "${ZIP_FILE}" "${OLDPWD}/"

# Cleanup
rm -rf "${TMP_DIR}"

echo "✓ Package created: ${ZIP_FILE}"
echo ""
echo "To upload to GNOME Extensions:"
echo "1. Go to https://extensions.gnome.org/upload/"
echo "2. Create an account if you haven't already"
echo "3. Upload ${ZIP_FILE}"
echo "4. Fill in the extension details"
echo "5. Submit for review"
