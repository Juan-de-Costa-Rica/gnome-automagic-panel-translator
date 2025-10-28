# Project Overview

This project is a GNOME Shell extension called "Automagic Panel Translator". It provides a quick and easy way to translate text using the DeepL API. The extension adds an icon to the GNOME panel, and when clicked, it translates the currently selected text.

The extension is written in JavaScript (GJS) and uses several GNOME technologies, including:

*   **St (Shell Toolkit)**: For creating the user interface elements in the panel.
*   **Adw (Adwaita)** and **Gtk**: For the preferences window.
*   **Gio**: For handling settings and other asynchronous operations.
*   **libsecret (via `keyring.js`)**: For securely storing the user's DeepL API key in the GNOME Keyring.

The extension features:

*   Automatic language detection.
*   Smart translation direction (e.g., foreign to main language, or main to secondary language).

*   Customizable secondary languages.
*   Secure API key storage.

# Building and Running

## Installation

To install the extension from the source code, you can use the provided installation script:

```bash
./install.sh
```

This script will package the extension and install it using `gnome-extensions install`. After installation, you need to restart the GNOME Shell and then enable the extension.

## Development

For development and testing, you can run a nested GNOME Shell session to avoid disrupting your current desktop environment.

For GNOME 49 and later:

```bash
dbus-run-session -- gnome-shell --devkit
```

For GNOME 48 and earlier:

```bash
dbus-run-session -- gnome-shell --nested --wayland
```

## Packaging

To create a distributable zip file for the GNOME Extensions website, you can use the packaging script:

```bash
./package.sh
```

This will create a zip file in the format `deepl-translator@juan-de-costa-rica-v<version>.zip`.

# Development Conventions

*   **Coding Style**: The project uses ESLint for code linting. The configuration can be found in `eslint.config.mjs`. The style includes 4-space indentation, Unix line endings, single quotes, and semicolons.
*   **Testing**: There are no dedicated testing frameworks or test files in this project. Testing seems to be done manually by running the extension in a nested GNOME Shell session.
*   **Contribution**: The `README.md` file mentions that contributions are welcome and points to the `CHANGELOG.md` for recent changes. Bug reports should be filed on the GitHub issue tracker.
