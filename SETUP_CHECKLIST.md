# Woolly Sloth Setup Checklist

Use this checklist to ensure you have everything set up correctly.

## ✅ Pre-Setup

- [ ] You have Google Chrome (or Chromium) version 88 or later
- [ ] You have a Google account (for Gemini API) or OpenAI account (optional)
- [ ] You have the ai-reply folder downloaded or cloned from GitHub

## ✅ API Key Setup

### Gemini (Recommended)
- [ ] Visit https://aistudio.google.com/app/apikey
- [ ] Sign in with your Google account
- [ ] Click "Create API key"
- [ ] Copy the key somewhere safe (keep it private!)
- [ ] Verify the key starts with `AIza`

### OpenAI (Optional)
- [ ] Visit https://platform.openai.com/api-keys
- [ ] Sign in with your OpenAI account
- [ ] Create a new secret key
- [ ] Copy the key (you can only see it once)
- [ ] Verify the key starts with `sk-`

## ✅ Load the Extension

- [ ] Open Chrome
- [ ] Navigate to `chrome://extensions`
- [ ] Toggle "Developer mode" ON (top-right corner)
- [ ] Click "Load unpacked"
- [ ] Select the **ai-reply** folder (containing manifest.json)
- [ ] Click "Select Folder"
- [ ] Verify "Woolly Sloth" appears in your extensions list with no errors
- [ ] Pin the extension to your toolbar (click the puzzle icon → click the pin next to Woolly Sloth)

## ✅ Configure Settings

- [ ] Click the Woolly Sloth icon in your toolbar
- [ ] Click "Open Settings"
- [ ] A new tab should open to the options page
- [ ] Choose your AI provider:
  - [ ] Gemini (recommended) OR
  - [ ] OpenAI
- [ ] Paste your API key into the correct field
- [ ] Leave the other API key field empty (optional)
- [ ] Click "Save Settings"
- [ ] Verify you see "Saved!" message
- [ ] Close the settings tab (or keep it open for reference)

## ✅ Test the Extension

- [ ] Open any webpage (e.g., https://www.google.com)
- [ ] Highlight/select some text on the page
- [ ] Right-click on the highlighted text
- [ ] Verify you see **"Generate Lease Reply"** in the context menu
- [ ] Click "Generate Lease Reply"
- [ ] Wait 3-5 seconds for the AI to respond
- [ ] Verify a popup appears in the **bottom-right corner** of the page
- [ ] Verify the popup contains an AI-generated reply
- [ ] Click "Copy to Clipboard"
- [ ] Verify the button text changes to "Copied!" for 1.5 seconds
- [ ] Verify the reply is now in your clipboard (paste it somewhere to test)

## ✅ Test Feedback Loop

- [ ] In the popup from your test, click the **👍** (thumbs up) button
- [ ] Verify a text area appears for optional feedback
- [ ] Type a test comment like "great reply" (or leave blank)
- [ ] Click "Submit"
- [ ] Verify a "Thanks for the feedback!" message appears briefly
- [ ] Open Settings again and check **"Memory Log"** section
- [ ] Verify your feedback entry appears in the log

## ✅ Test on Messenger

- [ ] Open https://www.messenger.com or Facebook Messages
- [ ] Wait for a message from someone (or find an existing conversation)
- [ ] Highlight part of a customer's message
- [ ] Right-click → "Generate Lease Reply"
- [ ] Wait for reply
- [ ] Click "Copy to Clipboard"
- [ ] Click in your reply message box
- [ ] Paste the reply
- [ ] Review and optionally add context to the message
- [ ] Click "Send"
- [ ] Rate the reply (👍/👎) in the popup
- [ ] Close the popup

## ✅ Troubleshooting Checks

If something doesn't work:

- [ ] Reload the extension:
  - Go to `chrome://extensions`
  - Find Woolly Sloth
  - Click the reload icon (circular arrow)
- [ ] Refresh the webpage (F5 or Cmd+R)
- [ ] Check that you have an internet connection
- [ ] Verify your API key is correct:
  - Go to Settings
  - Check your API key is pasted correctly (not blank)
  - For Gemini: should start with `AIza`
  - For OpenAI: should start with `sk-`
- [ ] Check that text is actually highlighted before right-clicking
- [ ] Try right-clicking directly on the highlighted text, not near it

## ✅ Advanced (Optional)

- [ ] Open Chrome DevTools (`F12`)
- [ ] Go to **Application** → **Storage** → **Local Storage** → **chrome-extension://...**
- [ ] Verify your keys are stored (look for entries like `geminiKey`, `memoryMd`)
- [ ] Check the **Console** tab for any red errors

---

## 🎉 You're All Set!

If everything is checked, you're ready to use Woolly Sloth on Messenger!

**Next Steps:**
- Use the extension on Messenger with real customer leads
- Rate replies and add feedback to train the AI
- Open Settings anytime to view your memory log
- Edit your API keys if needed

**For help:**
- See README.md for full documentation
- See QUICKSTART.md for a 5-minute overview
- See ARCHITECTURE.md to understand how it works
