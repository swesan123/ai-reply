chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "generateLeaseReply",
    title: "Generate Lease Reply",
    contexts: ["selection"]
  });
});

async function buildSystemPrompt(customPrompt, memoryMd) {
  const base = customPrompt || `You are a friendly, professional sales agent for Swesan Leasing.
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

The following message was received from a potential customer. Write a reply:`;

  if (memoryMd && memoryMd.trim().length > 0) {
    return base + `\n\n---\nPAST FEEDBACK & PREFERENCES (use these to improve your replies):\n${memoryMd}\n---`;
  }
  return base;
}

async function callGemini(apiKey, systemPrompt, userText) {
  if (!apiKey) throw new Error("Gemini API key not set. Open extension options to add it.");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userText }] }]
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || `Gemini HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "(No response)";
}

async function callOpenAI(apiKey, systemPrompt, userText) {
  if (!apiKey) throw new Error("OpenAI API key not set. Open extension options to add it.");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userText }
      ]
    })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || `OpenAI HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "(No response)";
}

async function saveFeedback(feedback, selectedText, reply) {
  const { memoryMd } = await chrome.storage.local.get("memoryMd");
  const date = new Date().toISOString().split("T")[0];
  const rating = feedback.rating === 1 ? "GOOD" : "BAD";
  const comment = feedback.comment ? ` — ${feedback.comment}` : "";
  const entry = `\n## ${date} [${rating}]${comment}\n**Customer message:** ${selectedText.slice(0, 120)}\n**Reply snippet:** ${reply.slice(0, 120)}\n`;
  const updated = (memoryMd || "") + entry;
  await chrome.storage.local.set({ memoryMd: updated });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "generateLeaseReply") return;
  const selectedText = info.selectionText;

  const { geminiKey, openaiKey, provider, memoryMd, systemPrompt: customPrompt } = await chrome.storage.local.get([
    "geminiKey",
    "openaiKey",
    "provider",
    "memoryMd",
    "systemPrompt"
  ]);

  const systemPrompt = await buildSystemPrompt(customPrompt, memoryMd || "");

  let reply;
  try {
    if ((provider || "gemini") === "gemini") {
      reply = await callGemini(geminiKey, systemPrompt, selectedText);
    } else {
      reply = await callOpenAI(openaiKey, systemPrompt, selectedText);
    }
  } catch (err) {
    reply = `Error: ${err.message}`;
  }

  chrome.tabs.sendMessage(tab.id, {
    type: "SHOW_REPLY",
    reply,
    selectedText
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "SAVE_FEEDBACK") {
    saveFeedback(msg.feedback, msg.selectedText, msg.reply).then(() => sendResponse({ ok: true }));
    return true;
  }
});
