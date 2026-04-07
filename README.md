# ✨ GitHub / Gitlab Magic Issue

Because automatic issue modifications via GitHub Actions lack fine-grained control.
This extension brings AI directly into the GitHub interface, allowing you to generate concise issue titles in real time based on your description.

## Features

- 🌐 **Auto-translate**: Translates issue descriptions to English using Google Translate
- ✨ **Title generation**: Generates concise GitHub issue titles using LLM API
- 🚀 **Magic button**: One-click generation on new issues and edit forms
- 📝 **Works on**: New issues and existing issue edits

## Setup

### 1. Configure API Keys

Copy the config template and add your API key:

```bash
cp config.example.js config.js
```

Edit `config.js` and replace with your actual credentials:

```javascript
const CONFIG = {
  OPENAI_API_KEY: "your-actual-api-key-here",
  LLM_API_URL: "<LLM_URL>/v1/chat/completions",
  LLM_MODEL: "openai/gpt-4.1-mini",
};
```

### 2. Load Extension in Chrome

1. Go to `chrome://extensions/`
2. Enable **Developer mode** (top right)
<img width="172" height="45" alt="image" src="https://github.com/user-attachments/assets/b6e2be76-d22b-45bd-8059-4744090e9105" />

3. Click **Load unpacked**
5. Select this folder
<img width="417" height="225" alt="image" src="https://github.com/user-attachments/assets/d1c3d303-91b1-4166-931c-58b28adf5090" />


### 3. Update Manifest

Edit `manifest.json` and update the content script matches pattern:

```json
"host_permissions": ["<LLM_URL>"]
```

## Usage

- **New Issues**: Click the ✨ magic button next to the title input
- **Edit Issues**: Click the ✨ magic button next to Cancel button
  <img width="736" height="361" alt="image" src="https://github.com/user-attachments/assets/bbab95cd-9c2e-42aa-b7ab-b43132489413" />


The button will:

1. Translate the content to English
2. Generate an appropriate title
3. Fill it automatically

## Security

The `config.js` file is excluded from git and contains sensitive information. Never commit it!
