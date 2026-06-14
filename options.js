const geminiKeyInput = document.getElementById("geminiKey");
const openaiKeyInput = document.getElementById("openaiKey");
const providerInputs = document.querySelectorAll("input[name='provider']");
const systemPromptInput = document.getElementById("systemPrompt");
const memoryPreview = document.getElementById("memoryPreview");
const saveBtn = document.getElementById("saveBtn");
const savePromptBtn = document.getElementById("savePromptBtn");
const clearMemoryBtn = document.getElementById("clearMemory");
const resetPromptBtn = document.getElementById("resetPrompt");
const saveStatus = document.getElementById("saveStatus");
const promptSaveStatus = document.getElementById("promptSaveStatus");
const activityLog = document.getElementById("activityLog");
const clearLogBtn = document.getElementById("clearLogBtn");
const autoRefreshToggle = document.getElementById("autoRefreshToggle");
const logStatus = document.getElementById("logStatus");

let autoRefresh = true;
let logRefreshInterval = null;

const DEFAULT_SYSTEM_PROMPT = `You are a friendly, warm sales agent for Swesan Leasing responding to vending machine lease inquiries.

Your goal is to be conversational, personable, and helpful. Write like a peer would—acknowledge what they said, show you understand their needs, and provide relevant information about our leasing options.

AVAILABLE DEALS:
1. Revenue Share: $0/month + 25% of gross sales, $0 down. Includes Nayax payment processing, all repairs, and support. Best for testing new locations.
2. Flat Rate: $150/month (1 machine) or $275/month (2 machines). Keep 100% of sales. Includes Nayax. Flexible 3-12 month terms.
3. Premium Flat Rate: $200/month. Keep 100% of sales. Includes Nayax telemetry (live sales data via MoMa app).

MACHINE STOCK:
- Snack machines in stock, available immediately.
- Combo machines (snacks + drinks): $300/month + $50 Nayax = $350/month total. Require $500 deposit, 7-14 day lead time. ($0 down deal waives deposit.)
- Always suggest starting with snack machine for faster setup.

TONE & STYLE:
- Conversational and warm. Write like you're texting a friend about their business.
- Acknowledge what they said specifically (their concerns, goals, timeline).
- Use multi-paragraph format when appropriate, not bullet lists or rigid formatting.
- Always end with a clear next step (phone call, review website, location question, etc.).
- Use plain text only—no markdown bold (**), asterisks (*), bullets. Facebook Messenger doesn't support it.
- You can use friendly emojis (👉, ✨) if relevant.
- Website link: https://swesanleasing.com/
- If they mention specifics (names, locations, timelines, machine quantities), reference them back to show you listened.

The following is a customer message. Write a warm, conversational reply:`;

async function loadSettings() {
  const { geminiKey, openaiKey, provider, memoryMd, systemPrompt } = await chrome.storage.local.get([
    "geminiKey",
    "openaiKey",
    "provider",
    "memoryMd",
    "systemPrompt"
  ]);

  if (geminiKey) geminiKeyInput.value = geminiKey;
  if (openaiKey) openaiKeyInput.value = openaiKey;
  if (provider) {
    document.querySelector(`input[name="provider"][value="${provider}"]`).checked = true;
  }
  systemPromptInput.value = systemPrompt || "";
  if (memoryMd) {
    memoryPreview.value = memoryMd;
  }
}

saveBtn.addEventListener("click", async () => {
  const geminiKey = geminiKeyInput.value.trim();
  const openaiKey = openaiKeyInput.value.trim();
  const provider = document.querySelector("input[name='provider']:checked").value;

  await chrome.storage.local.set({
    geminiKey,
    openaiKey,
    provider
  });

  saveStatus.textContent = "Saved!";
  setTimeout(() => {
    saveStatus.textContent = "";
  }, 2000);
});

savePromptBtn.addEventListener("click", async () => {
  const systemPrompt = systemPromptInput.value.trim();

  await chrome.storage.local.set({
    systemPrompt
  });

  promptSaveStatus.textContent = "Prompt saved!";
  setTimeout(() => {
    promptSaveStatus.textContent = "";
  }, 2000);
});

clearMemoryBtn.addEventListener("click", async () => {
  if (confirm("Clear all memory/feedback? This cannot be undone.")) {
    await chrome.storage.local.set({ memoryMd: "" });
    memoryPreview.value = "";
  }
});

resetPromptBtn.addEventListener("click", async () => {
  if (confirm("Clear custom prompt and use the default? You can edit it again anytime.")) {
    systemPromptInput.value = "";
    await chrome.storage.local.set({ systemPrompt: "" });
    promptSaveStatus.textContent = "Reset to default!";
    setTimeout(() => {
      promptSaveStatus.textContent = "";
    }, 2000);
  }
});

// Activity log functions
async function loadActivityLog() {
  const { debugLog } = await chrome.storage.local.get("debugLog");
  const logs = debugLog ? JSON.parse(debugLog) : [];

  if (logs.length === 0) {
    activityLog.value = "[No activity yet. Generate a reply to see logs here.]";
    return;
  }

  // Reverse to show newest first
  const displayLogs = logs.slice().reverse();
  let output = "";

  displayLogs.forEach((log, idx) => {
    output += `\n${"=".repeat(80)}\n`;
    output += `[${idx + 1}] ${log.timestamp}\n`;
    output += `Type: ${log.type}\n`;
    output += `Provider: ${log.provider}\n`;
    output += `\n--- CUSTOMER MESSAGE ---\n`;
    output += `${log.selectedText}\n`;
    output += `\n--- SYSTEM PROMPT SENT ---\n`;
    output += `${log.systemPrompt}\n`;
    output += `\n--- AI RESPONSE ---\n`;
    output += `${log.reply}\n`;

    if (log.error) {
      output += `\n--- ERROR ---\n`;
      output += `${log.error}\n`;
    }
  });

  activityLog.value = output;
}

clearLogBtn.addEventListener("click", async () => {
  if (confirm("Clear all activity logs? This cannot be undone.")) {
    await chrome.storage.local.set({ debugLog: JSON.stringify([]) });
    activityLog.value = "[Log cleared]";
    logStatus.textContent = "Logs cleared";
    setTimeout(() => { logStatus.textContent = ""; }, 2000);
  }
});

autoRefreshToggle.addEventListener("click", () => {
  autoRefresh = !autoRefresh;
  autoRefreshToggle.textContent = `Auto-Refresh: ${autoRefresh ? "ON" : "OFF"}`;

  if (autoRefresh) {
    logRefreshInterval = setInterval(loadActivityLog, 1000);
  } else {
    clearInterval(logRefreshInterval);
  }
});

// Start auto-refresh
logRefreshInterval = setInterval(loadActivityLog, 1000);

loadSettings();
loadActivityLog();
