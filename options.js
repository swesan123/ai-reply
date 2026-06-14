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
const monitorTypeInputs = document.querySelectorAll("input[name='monitorType']");
const promptMonitor = document.getElementById("promptMonitor");
const refreshMonitorBtn = document.getElementById("refreshMonitor");
const activityLog = document.getElementById("activityLog");
const clearLogBtn = document.getElementById("clearLogBtn");
const autoRefreshToggle = document.getElementById("autoRefreshToggle");
const logStatus = document.getElementById("logStatus");

let autoRefresh = true;
let logRefreshInterval = null;

const DEFAULT_SYSTEM_PROMPT = `You are a friendly, professional sales agent for Swesan Leasing.
Your job is to respond to potential customers interested in leasing vending machines.
Website: https://swesanleasing.com/

AVAILABLE DEALS:
1. Revenue Share: $0/month. $0 down. We take 25% of gross sales. Includes Nayax payment
   processing, all repairs, and full support. Best for new locations with no upfront commitment.

2. Flat Rate: $150/month for one machine, or $275/month for two machines. Client keeps 100%
   of sales. Includes Nayax payment processing. Flexible terms: 3 to 12 months.

3. Premium Flat Rate: $200/month. Client keeps 100% of sales. Includes Nayax telemetry —
   live sales data and inventory tracking via the MoMa app.

STOCK & AVAILABILITY:
- Only SNACK machines are currently in stock and available immediately.
- COMBO machines (snacks + drinks) can be ordered but require a $500 deposit (waived on
  Revenue Share deal) and take 7 to 14 business days to arrive. Combo machines are $300/month
  + $50 for Nayax = $350/month total.
- Always encourage the customer to start with a snack machine now rather than waiting for a combo.

TONE & STYLE:
- Keep replies concise, warm, and direct. No fluff.
- Always end with a clear next step or call to action.
- Do not invent deals or prices not listed above.
- Do not make promises about availability beyond what is stated.
- If the customer's message is unclear, ask one clarifying question.
- Use plain text only. No Markdown formatting like bold (**), asterisks (*), hashtags, or bullet points. Facebook Messenger does not support Markdown.
- The selected text may contain a full conversation. Messages asking about machines or prices are from the customer. Messages describing the service are from the agent. Always reply as the agent (Swesan Leasing), never as the customer.

The following message was received from a potential customer. Write a reply:`;

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
  updatePromptMonitor();
  setTimeout(() => {
    promptSaveStatus.textContent = "";
  }, 2000);
});

clearMemoryBtn.addEventListener("click", async () => {
  if (confirm("Clear all memory/feedback? This cannot be undone.")) {
    await chrome.storage.local.set({ memoryMd: "" });
    memoryPreview.value = "";
    updatePromptMonitor();
  }
});

resetPromptBtn.addEventListener("click", async () => {
  if (confirm("Clear custom prompt and use the default? You can edit it again anytime.")) {
    systemPromptInput.value = "";
    await chrome.storage.local.set({ systemPrompt: "" });
    promptSaveStatus.textContent = "Reset to default!";
    updatePromptMonitor();
    setTimeout(() => {
      promptSaveStatus.textContent = "";
    }, 2000);
  }
});

// Prompt monitor functions
function buildLeasePrompt(customPrompt, memoryMd) {
  const base = customPrompt || DEFAULT_SYSTEM_PROMPT;

  if (memoryMd && memoryMd.trim().length > 0) {
    return base + `\n\n---\nPAST FEEDBACK & PREFERENCES (use these to improve your replies):\n${memoryMd}\n---`;
  }
  return base;
}

function buildFollowUpPrompt(memoryMd) {
  const today = new Date().toDateString();
  const base = `You are an expert sales agent for Swesan Leasing doing a follow-up on a Facebook Messenger lead.

The current date is: ${today}

Read the highlighted chat log to find the date of the most recent message. Calculate the time gap between that message and today. Then generate a response using EXACTLY ONE of these four strategies based on the time gap:

1 to 3 days ago (The Quick Nudge):
The lead got busy. Be incredibly brief and low-pressure. Just float it back to the top of their inbox.
Example vibe: "Hey [Name], just floating this to the top of your inbox. Let me know if you still had any questions!"

4 to 10 days ago (The Value Add):
Remind them of a specific benefit. Mention the $0 down Revenue Share option in case upfront costs are holding them back.

11 to 25 days ago (The Breakup):
Play on FOMO. Tell them you assume the timing isn't right and you're going to close their file for now, but they can reach out if things change.

1+ months ago (The Revival):
Acknowledge it's been a while. Mention that pricing has been overhauled — introduce the flat $150/month lease where they keep 100% of sales. Ask if they are still looking for a machine.

Rules for all strategies:
- Use plain text only. No Markdown, no bold, no asterisks, no bullet symbols.
- Keep it short and conversational. No deal lists.
- Messages asking about machines or prices are from the customer. Messages describing the service are from the agent.
- Reply as the agent (Swesan Leasing) only.

The following is the conversation to follow up on:`;

  if (memoryMd && memoryMd.trim().length > 0) {
    return base + `\n\n---\nPAST FEEDBACK & PREFERENCES:\n${memoryMd}\n---`;
  }
  return base;
}

async function updatePromptMonitor() {
  const { systemPrompt: customPrompt, memoryMd } = await chrome.storage.local.get([
    "systemPrompt",
    "memoryMd"
  ]);

  const monitorType = document.querySelector("input[name='monitorType']:checked").value;
  let prompt;

  if (monitorType === "lease") {
    prompt = buildLeasePrompt(customPrompt, memoryMd || "");
  } else {
    prompt = buildFollowUpPrompt(memoryMd || "");
  }

  promptMonitor.value = prompt;
}

monitorTypeInputs.forEach(input => {
  input.addEventListener("change", updatePromptMonitor);
});

refreshMonitorBtn.addEventListener("click", updatePromptMonitor);

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
  activityLog.scrollTop = activityLog.scrollHeight;
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
updatePromptMonitor();
loadActivityLog();
