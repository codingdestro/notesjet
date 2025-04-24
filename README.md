# Notes Chrome Extension

A simple Chrome extension for taking and managing notes, built with jQuery.

## Setup

1. Download jQuery (jquery.min.js) and place it in the root directory of this extension
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select this extension's directory

## Features

- Add and store notes
- Notes persist across browser sessions
- Simple and clean interface
- jQuery-powered functionality

## File Structure

- `manifest.json` - Extension configuration
- `popup.html` - Popup interface
- `popup.js` - Popup functionality
- `content.js` - Content script
- `jquery.min.js` - jQuery library (to be added)

## Development

To modify the extension:
1. Make changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card

## Permissions

This extension requires:
- `storage` - To save notes
- `activeTab` - To interact with web pages 