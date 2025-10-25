#!/bin/bash
# Validate extension package before upload

set -e

ZIP_FILE="$1"

if [ -z "$ZIP_FILE" ]; then
    echo "Usage: $0 <zip-file>"
    exit 1
fi

if [ ! -f "$ZIP_FILE" ]; then
    echo "Error: File not found: $ZIP_FILE"
    exit 1
fi

echo "Validating extension package: $ZIP_FILE"
echo ""

# Create temp directory for extraction
TMP_DIR=$(mktemp -d)
unzip -q "$ZIP_FILE" -d "$TMP_DIR"

# Find the extension directory (root or subdirectory)
if [ -f "$TMP_DIR/metadata.json" ]; then
    EXT_DIR="$TMP_DIR"
else
    EXT_DIR=$(find "$TMP_DIR" -name "metadata.json" -exec dirname {} \; | head -1)
fi

if [ -z "$EXT_DIR" ]; then
    echo "❌ FAIL: No metadata.json found"
    rm -rf "$TMP_DIR"
    exit 1
fi

echo "✓ Found extension directory"
echo ""

# Required files check
echo "Checking required files..."
REQUIRED_FILES=("metadata.json" "extension.js")
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$EXT_DIR/$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ❌ MISSING: $file"
        rm -rf "$TMP_DIR"
        exit 1
    fi
done
echo ""

# Validate metadata.json
echo "Validating metadata.json..."
if ! python3 -m json.tool "$EXT_DIR/metadata.json" > /dev/null 2>&1; then
    echo "  ❌ FAIL: Invalid JSON syntax"
    rm -rf "$TMP_DIR"
    exit 1
fi
echo "  ✓ Valid JSON"

# Check required metadata fields
UUID=$(grep -oP '"uuid":\s*"\K[^"]+' "$EXT_DIR/metadata.json" || echo "")
NAME=$(grep -oP '"name":\s*"\K[^"]+' "$EXT_DIR/metadata.json" || echo "")
DESC=$(grep -oP '"description":\s*"\K[^"]+' "$EXT_DIR/metadata.json" || echo "")
SHELL_VER=$(grep -oP '"shell-version"' "$EXT_DIR/metadata.json" || echo "")

if [ -z "$UUID" ]; then
    echo "  ❌ MISSING: uuid field"
    rm -rf "$TMP_DIR"
    exit 1
fi
echo "  ✓ UUID: $UUID"

if [ -z "$NAME" ]; then
    echo "  ❌ MISSING: name field"
    rm -rf "$TMP_DIR"
    exit 1
fi
echo "  ✓ Name: $NAME"

if [ -z "$DESC" ]; then
    echo "  ❌ MISSING: description field"
    rm -rf "$TMP_DIR"
    exit 1
fi
echo "  ✓ Description present"

if [ -z "$SHELL_VER" ]; then
    echo "  ❌ MISSING: shell-version field"
    rm -rf "$TMP_DIR"
    exit 1
fi
echo "  ✓ Shell version(s) specified"
echo ""

# Check for schema files if settings-schema is defined
SCHEMA=$(grep -oP '"settings-schema":\s*"\K[^"]+' "$EXT_DIR/metadata.json" || echo "")
if [ -n "$SCHEMA" ]; then
    echo "Checking GSettings schema..."
    if [ -d "$EXT_DIR/schemas" ]; then
        echo "  ✓ schemas/ directory exists"
        if ls "$EXT_DIR/schemas"/*.xml > /dev/null 2>&1; then
            echo "  ✓ Schema XML file(s) found"
        else
            echo "  ⚠ WARNING: No .xml schema files found"
        fi
        if [ -f "$EXT_DIR/schemas/gschemas.compiled" ]; then
            echo "  ✓ Compiled schema present"
        else
            echo "  ⚠ WARNING: No compiled schema (gschemas.compiled)"
        fi
    else
        echo "  ❌ MISSING: schemas/ directory (required for settings-schema)"
        rm -rf "$TMP_DIR"
        exit 1
    fi
    echo ""
fi

# Check for common optional files
echo "Checking optional files..."
[ -f "$EXT_DIR/prefs.js" ] && echo "  ✓ prefs.js (preferences UI)"
[ -f "$EXT_DIR/stylesheet.css" ] && echo "  ✓ stylesheet.css"
[ -d "$EXT_DIR/lib" ] && echo "  ✓ lib/ directory"
echo ""

# List all files in package
echo "Package contents:"
if [ "$EXT_DIR" = "$TMP_DIR" ]; then
    # Flat structure
    echo "  Structure: FLAT (files at root) ✓"
else
    # Subdirectory structure
    echo "  Structure: NESTED (in subdirectory)"
fi
echo ""
echo "  Files:"
(cd "$EXT_DIR" && find . -type f | sed 's/^\.\//    /')
echo ""

# Cleanup
rm -rf "$TMP_DIR"

echo "✅ VALIDATION PASSED"
echo ""
echo "The package looks good for upload to extensions.gnome.org!"
