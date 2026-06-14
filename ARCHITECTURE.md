# Woolly Sloth Architecture

## How It Works

```
┌─────────────────────────────────────────────────────────────────────┐
│ MESSENGER / ANY WEBPAGE                                             │
├─────────────────────────────────────────────────────────────────────┤
│ [Customer's Message]                                                │
│ "Hey, I'm interested in a vending machine setup..."                 │
│                                                                     │
│ [User highlights text and right-clicks]                             │
└─────────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ CONTEXT MENU                                                        │
├─────────────────────────────────────────────────────────────────────┤
│ ✓ Copy                                                              │
│ ✓ Paste                                                             │
│ ✓ Search Google for...                                              │
│ ✓ Generate Lease Reply  ← [User clicks here]                        │
└─────────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ BACKGROUND.JS (Service Worker)                                      │
├─────────────────────────────────────────────────────────────────────┤
│ 1. Receives context menu click                                      │
│ 2. Reads selected text from clipboard                               │
│ 3. Loads settings from chrome.storage.local:                        │
│    - API key (Gemini or OpenAI)                                     │
│    - Provider choice                                                │
│    - Memory log (past feedback)                                     │
│ 4. Builds system prompt:                                            │
│    - Sales agent instructions                                       │
│    - Your 3 deals                                                   │
│    - Machine stock info                                             │
│    - Appends memory log (what you liked/disliked before)            │
│ 5. Calls AI API (fetch):                                            │
│    ┌────────────────────────────────────────────────────────┐      │
│    │ POST to Gemini API or OpenAI API                       │      │
│    │ Headers: API key auth                                  │      │
│    │ Body: system prompt + customer's message               │      │
│    └────────────────────────────────────────────────────────┘      │
│ 6. Receives AI-generated reply                                      │
│ 7. Sends reply to content script via chrome.tabs.sendMessage        │
└─────────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ CONTENT.JS (Injected into page)                                     │
├─────────────────────────────────────────────────────────────────────┤
│ Receives message with AI reply                                      │
│ Creates popup overlay (#woolly-sloth-popup):                        │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────┐        │
│ │ Woolly Sloth — Lease Reply                            ✕ │        │
│ ├─────────────────────────────────────────────────────────┤        │
│ │                                                         │        │
│ │ Hey! Thanks for reaching out. We'd love to help you    │        │
│ │ get started with a vending machine. Our Revenue Share  │        │
│ │ deal might be perfect for a new location...            │        │
│ │                                                         │        │
│ ├─────────────────────────────────────────────────────────┤        │
│ │ [Copy to Clipboard]                                    │        │
│ │ Helpful? 👍 👎                                          │        │
│ └─────────────────────────────────────────────────────────┘        │
│                                                                     │
│ Features:                                                           │
│ - Draggable (click header and drag)                                 │
│ - Copy button → clipboard ready to paste                            │
│ - Feedback buttons (👍/👎) trigger textarea + submit                │
│ - Runs at position:fixed (bottom-right)                             │
│ - z-index: 2147483647 (top of page)                                 │
└─────────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ USER FEEDBACK                                                       │
├─────────────────────────────────────────────────────────────────────┤
│ [User clicks 👍 or 👎]                                               │
│ [Optional: types feedback note]                                     │
│ [Clicks "Submit"]                                                   │
│                                                                     │
│ Sends feedback back to background.js:                               │
│ {                                                                   │
│   type: "SAVE_FEEDBACK",                                            │
│   feedback: { rating: 1, comment: "great tone" },                   │
│   selectedText: "customer's original message",                      │
│   reply: "ai-generated reply"                                       │
│ }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ BACKGROUND.JS (Save Feedback)                                       │
├─────────────────────────────────────────────────────────────────────┤
│ Appends entry to memoryMd:                                          │
│                                                                     │
│ ## 2026-06-14 [GOOD] — great tone                                   │
│ **Customer message:** Hey, I'm interested in a vending...            │
│ **Reply snippet:** Hey! Thanks for reaching out. We'd...             │
│                                                                     │
│ Saves to chrome.storage.local                                       │
│ Shows "Thanks for the feedback!" in popup                           │
└─────────────────────────────────────────────────────────────────────┘
                              ▼
        ┌───────────────────────────────────────┐
        │ NEXT TIME YOU GENERATE A REPLY...      │
        ├───────────────────────────────────────┤
        │ Background.js loads memory log from    │
        │ storage and appends it to system       │
        │ prompt under:                          │
        │                                       │
        │ "PAST FEEDBACK & PREFERENCES          │
        │  (use these to improve your replies)" │
        │                                       │
        │ AI sees your past feedback and        │
        │ learns what you liked/disliked!       │
        └───────────────────────────────────────┘
```

## File Responsibilities

| File | Role |
|------|------|
| **manifest.json** | Declares permissions, entry points, content scripts |
| **background.js** | Service worker: context menu, API calls, feedback storage |
| **content.js** | Injects popup UI, handles drag/copy/feedback |
| **content.css** | Popup styling, z-index, responsive sizing |
| **options.html** | Settings page markup |
| **options.js** | Load/save API keys and provider choice |
| **popup.html** | Toolbar popup (minimal) |
| **popup.js** | Opens settings page |

## Data Flow

```
chrome.storage.local
├── geminiKey: "AIza..."
├── openaiKey: "sk-..."
├── provider: "gemini"
└── memoryMd: "## 2026-06-14 [GOOD]...\n## 2026-06-14 [BAD]..."
         ▲
         │
    [Read on every API call]
    [Write when feedback submitted]
```

## How Memory Works

1. **First reply**: No memory → standard system prompt
2. **User rates reply**: Feedback saved to `memoryMd`
3. **Second reply**: `memoryMd` appended to system prompt
4. **Third reply**: Both previous feedbacks appended
5. **And so on**: AI learns your preferences over time

Example memory growth:

```
Initial (empty):
(no memory)

After 1st feedback:
## 2026-06-14 [GOOD] — concise tone
**Customer message:** Hey, interested in...
**Reply snippet:** Great! We have several options...

After 2nd feedback:
## 2026-06-14 [GOOD] — concise tone
**Customer message:** Hey, interested in...
**Reply snippet:** Great! We have several options...

## 2026-06-14 [BAD] — too salesy
**Customer message:** What's the minimum...
**Reply snippet:** Our Premium deal is ideal...
```

## Security Notes

- **API keys**: Stored in `chrome.storage.local` (your local Chrome profile), not encrypted
- **Memory**: Stored locally, never sent anywhere except to AI API
- **API calls**: Only to Gemini or OpenAI (your choice), not to any custom servers
- **Privacy**: This is a private extension, not published on Chrome Web Store

## Chrome Manifest V3 Notes

- Service worker (background.js) is ephemeral — Chrome stops it after ~30 seconds of inactivity
- All state stored in `chrome.storage.local` — never in global variables
- Content scripts are exempt from page CSP — popup injection works on all sites including Facebook
- `fetch()` to external APIs requires `host_permissions` in manifest
- Context menu is injected at OS level — pages cannot suppress it
