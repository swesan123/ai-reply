# Woolly Sloth — Chrome Extension for Swesan Leasing

A private Chrome extension that speeds up your workflow for handling inbound vending machine leasing leads on Facebook Messenger. Highlight a customer's message, right-click, and get an AI-generated reply in seconds.

## Features

- **Context Menu Integration**: Right-click on highlighted text and select "Generate Lease Reply"
- **AI-Powered Replies**: Uses Gemini (gemini-2.5-flash) or OpenAI (gpt-4o-mini) to generate professional responses
- **Draggable Popup**: Results appear in a clean, movable popup overlay
- **One-Click Copy**: Copy replies to clipboard instantly
- **Feedback Loop**: Rate replies and add notes — feedback updates a persistent memory log that the AI uses to improve future responses
- **Zero Cost**: Free Gemini API tier available; no build step required

## How It Works

1. Highlight text on any webpage (especially Facebook Messenger)
2. Right-click → **"Generate Lease Reply"**
3. AI generates a contextual response based on:
   - Your three vending machine leasing deals
   - Current machine availability
   - Your past feedback (stored in memory log)
4. Reply appears in a draggable popup
5. Click **"Copy to Clipboard"** and paste into Messenger
6. Rate the reply (👍/👎) and optionally add feedback
7. Next time you generate a reply, the AI remembers your preferences

## Installation

### Prerequisites

- Google Chrome or Chromium (version 88+)
- A free Gemini API key OR an OpenAI API key

### Step-by-Step Setup

#### 1. Get an API Key

**Option A: Gemini (Recommended — Free)**
- Go to https://aistudio.google.com/app/apikey
- Sign in with your Google account
- Click **"Create API key"**
- Copy the key

**Option B: OpenAI**
- Go to https://platform.openai.com/api-keys
- Sign in
- Click **"Create new secret key"**
- Copy the key

#### 2. Load the Extension

1. Open Chrome and navigate to `chrome://extensions` in the address bar
2. Toggle **"Developer mode"** on (top-right corner)
3. Click **"Load unpacked"**
4. Navigate to and select the **ai-reply** folder (the one containing `manifest.json`)
5. Click **"Select Folder"**

You should now see "Woolly Sloth" in your extensions list.

#### 3. Configure Settings

1. Click the puzzle-piece icon in Chrome's toolbar (top-right)
2. Find **"Woolly Sloth"** and pin it (click the pin icon)
3. Click the **Woolly Sloth icon** → **"Open Settings"**
4. Paste your API key:
   - For Gemini: Paste into the "Gemini API Key" field
   - For OpenAI: Paste into the "OpenAI API Key" field
5. Select your preferred provider (Gemini is recommended)
6. Click **"Save Settings"**

#### 4. Test It

1. Go to any webpage (e.g., https://www.google.com)
2. Select some text with your cursor
3. Right-click → You should see **"Generate Lease Reply"**
4. Click it and wait ~3-5 seconds
5. The reply popup should appear in the bottom-right corner

#### 5. Use on Messenger

1. Open https://www.messenger.com or Facebook Messages
2. Highlight the text of a customer's lead message
3. Right-click → **"Generate Lease Reply"**
4. Wait for the reply
5. Click **"Copy to Clipboard"**
6. Click in the chat message box and paste the reply
7. Rate the reply and optionally add feedback
8. Send!

## Troubleshooting

### "Generate Lease Reply" option doesn't appear
- Make sure you have text selected (highlighted) on the page
- Reload the extension: Go to `chrome://extensions`, find Woolly Sloth, and click the reload icon
- Refresh the webpage you're on

### "Error: API key not set"
- Open Settings (click Woolly Sloth icon → "Open Settings")
- Paste your API key into the appropriate field
- Click "Save Settings"

### Reply takes too long or times out
- Check your internet connection
- Verify your API key is correct and has available quota
- For Gemini: Check https://aistudio.google.com for free tier limits
- For OpenAI: Check your account balance on https://platform.openai.com

### Extension stops working after reload
- Go to `chrome://extensions`
- Toggle Developer Mode off, then back on
- Click the reload icon on Woolly Sloth

## Files & Structure

```
ai-reply/
├── manifest.json          # Extension declaration (MV3)
├── background.js          # Service worker: API calls, context menu
├── content.js             # Page injection: popup UI, copy, feedback
├── content.css            # Popup styling
├── options.html           # Settings page
├── options.js             # Settings logic
├── popup.html             # Toolbar popup
├── popup.js               # Toolbar popup logic
├── icons/                 # Toolbar icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md              # This file
```

## How the AI Prompt Works

The AI is instructed to:

1. **Act as a Swesan Leasing sales agent** — friendly, professional, concise
2. **Know your three deals**:
   - **Revenue Share**: $0/month + 25% gross sales, $0 down, Nayax + repairs included
   - **Flat Rate**: $150/month (or 2 for $275), keep 100% sales, 3-12 month terms
   - **Premium Flat Rate**: $200/month, keep 100%, includes Nayax telemetry
3. **Know your stock**: Only snack machines in stock; combos are $350/month, require $500 deposit (waived on Revenue Share), 7-14 days wait
4. **Learn from your feedback**: Every reply you rate gets stored in a memory log that's appended to the AI prompt next time, helping the AI improve over time

## Memory Log

Your feedback is stored in the extension's `chrome.storage.local` as a markdown-like log. View it anytime by going to **Settings → "Memory Log"**.

Format:
```
## 2026-06-14 [GOOD] — great tone, concise
**Customer message:** ...first 120 chars...
**Reply snippet:** ...first 120 chars...

## 2026-06-14 [BAD] — too salesy
**Customer message:** ...first 120 chars...
**Reply snippet:** ...first 120 chars...
```

To **clear your memory**, open Settings → Click **"Clear Memory"** (you'll be asked to confirm).

## Privacy

- Your API key is stored locally in your Chrome profile (`chrome.storage.local`)
- The extension does NOT collect or send your data anywhere except to the AI API you choose
- Memory logs are stored locally only; they're never sent to any server
- This is a **private extension** — it's not published on the Chrome Web Store

## Updating After Code Changes

If you edit any files in the extension:

1. Go to `chrome://extensions`
2. Find **Woolly Sloth**
3. Click the **reload icon** (circular arrow)
4. Refresh any webpages where the extension is active (for content script changes)

## API Costs

- **Gemini (Free Tier)**: Up to 60 requests per minute, free. Paid plans available.
- **OpenAI (gpt-4o-mini)**: Pay-as-you-go. Typically $0.15 per 1M input tokens, $0.60 per 1M output tokens.

## Support

If you encounter issues:

1. Check the **Troubleshooting** section above
2. Open the Chrome DevTools console:
   - `chrome://extensions` → Woolly Sloth → "Details" → "Inspect views: service worker"
   - Check for error messages
3. Verify your API key and internet connection
4. Try on a different webpage to isolate the problem

## License

This extension is private and for your personal use.

---

**Built with ❤️ for Swesan Leasing vending machine leads**