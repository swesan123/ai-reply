# 🦙 Woolly Sloth — START HERE

Welcome! You've got a complete, ready-to-use Chrome Extension for handling vending machine sales leads on Messenger.

## What Is This?

A private Chrome Extension that turns:
```
Highlight text → copy → paste into AI → get reply → paste back
```

Into:
```
Highlight text → right-click → "Generate Lease Reply" → copy → paste
```

## What You Get

- **No build tools needed** — load directly into Chrome
- **AI-powered replies** — uses free Gemini API (or OpenAI)
- **Feedback loop** — AI learns from your ratings (like CLAUDE.md)
- **Draggable popup** — appears on any page, easy to move
- **One-click copy** — paste into Messenger instantly

## 5-Minute Setup

### 1. Get API Key (2 minutes)

Go to: **https://aistudio.google.com/app/apikey**

- Sign in with Google
- Click **"Create API key"**
- Copy the key

(Or use OpenAI at https://platform.openai.com/api-keys if you prefer)

### 2. Load Extension (2 minutes)

1. Open Chrome → Go to **`chrome://extensions`**
2. Toggle **"Developer mode"** (top-right)
3. Click **"Load unpacked"**
4. Select the **ai-reply** folder
5. Click **"Select Folder"**

### 3. Configure (1 minute)

1. Click extension icon → **"Open Settings"**
2. Paste your API key
3. Click **"Save Settings"**

### 4. Test It

1. Go to any webpage
2. Highlight some text
3. Right-click → **"Generate Lease Reply"**
4. Wait 3-5 seconds
5. Click **"Copy to Clipboard"**

### 5. Use on Messenger

1. Open **messenger.com**
2. Highlight a customer's message
3. Right-click → **"Generate Lease Reply"**
4. Wait for reply
5. Click **"Copy to Clipboard"**
6. Paste into message box
7. Rate with 👍 or 👎
8. Send!

## Documentation

Read these in order based on what you need:

1. **QUICKSTART.md** — Same 5-minute setup (if you want to follow along)
2. **README.md** — Full documentation, troubleshooting, API costs
3. **SETUP_CHECKLIST.md** — Verify everything works step-by-step
4. **ARCHITECTURE.md** — How it works internally (data flow, memory system)
5. **PROJECT_SUMMARY.txt** — Complete project overview

## Key Features Explained

### 🎯 Context Menu
Right-click on highlighted text anywhere → "Generate Lease Reply"

### 🤖 AI Replies
Generates replies as a Swesan Leasing sales agent with knowledge of:
- Your 3 vending machine deals
- Current machine availability
- Your past feedback/preferences

### 💾 Memory/Feedback System
1. AI generates a reply
2. You rate it (👍 good or 👎 bad)
3. Optionally add feedback ("too salesy", "great tone", etc.)
4. Next time, AI sees your feedback in the system prompt
5. AI learns and improves over time

### 📋 The Deals (Built Into AI)

**Revenue Share**
- $0/month + 25% of gross sales
- $0 down
- Perfect for testing new locations

**Flat Rate**
- $150/month (1 machine) or $275/month (2 machines)
- Keep 100% of sales
- Flexible 3-12 month terms

**Premium Flat Rate**
- $200/month
- Keep 100% of sales
- Includes Nayax telemetry (live sales data via MoMa app)

**Stock Status**
- Snack machines: In stock, ship immediately
- Combo machines: Can order, $350/month ($300 + $50 Nayax), $500 deposit, 7-14 day wait
- AI always encourages starting with snack machine first

## File Overview

```
ai-reply/
├── Core Extension Files
│   ├── manifest.json      - Extension metadata (Chrome reads this)
│   ├── background.js      - Service worker (handles API calls)
│   ├── content.js         - Page injection (popup UI)
│   ├── content.css        - Popup styling
│   ├── options.html/js    - Settings page
│   ├── popup.html/js      - Toolbar popup (minimal)
│   └── icons/             - 3 extension icons
│
└── Documentation
    ├── README.md          - Full docs
    ├── QUICKSTART.md      - 5-minute setup
    ├── SETUP_CHECKLIST.md - Verification
    ├── ARCHITECTURE.md    - How it works
    └── PROJECT_SUMMARY.txt - Overview
```

## Troubleshooting

### "Generate Lease Reply" doesn't appear
- Make sure text is highlighted (selected)
- Right-click directly on the highlighted text
- Reload extension: `chrome://extensions` → reload button

### "Error: API key not set"
- Open Settings (click extension icon → "Open Settings")
- Paste your API key
- Click "Save Settings"

### Reply takes too long
- Check your internet connection
- Verify API key is correct
- Gemini free tier is limited to 60 requests/minute

### Still stuck?
- See README.md for full troubleshooting section
- Check SETUP_CHECKLIST.md for step-by-step verification

## Privacy & Security

✓ API keys stored locally on your device
✓ No data sent except to Gemini/OpenAI
✓ Memory logs stay on your device
✓ Private extension (not published to Web Store)
✓ No tracking or telemetry

## Next Steps

1. Follow the **5-Minute Setup** above
2. Test on any webpage
3. Use on Messenger with real customer leads
4. Rate replies and add feedback to train the AI
5. Check your memory log anytime in Settings

## API Costs

- **Gemini (Recommended)**: Free tier available, generous limits
- **OpenAI**: Pay-as-you-go, typically cheap for `gpt-4o-mini`

## Questions?

- Detailed setup? → **README.md**
- How it works? → **ARCHITECTURE.md**
- Step-by-step verification? → **SETUP_CHECKLIST.md**

---

**Built for Swesan Leasing • Zero-Cost AI • Private & Secure**

Ready to go? Follow the 5-Minute Setup above! 🚀
