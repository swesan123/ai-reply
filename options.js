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

loadSettings();
