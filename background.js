chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "generateLeaseReply",
    title: "Generate Lease Reply",
    contexts: ["selection"]
  });
  chrome.contextMenus.create({
    id: "generateFollowUpReply",
    title: "Generate Follow-up Reply",
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
- Use plain text only. No Markdown formatting like bold (**), asterisks (*), hashtags, or bullet points. Facebook Messenger does not support Markdown.
- The selected text may contain a full conversation. Messages asking about machines or prices are from the customer. Messages describing the service are from the agent. Always reply as the agent (Swesan Leasing), never as the customer.

The following message was received from a potential customer. Write a reply:`;

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
  const entry = `\n## ${date} [${rating}]${comment}\n**Customer message:** ${selectedText.slice(0, 400)}\n**Reply snippet:** ${reply.slice(0, 400)}\n`;
  const updated = (memoryMd || "") + entry;
  await chrome.storage.local.set({ memoryMd: updated });
}

async function addDebugLog(logEntry) {
  const { debugLog } = await chrome.storage.local.get("debugLog");
  const logs = debugLog ? JSON.parse(debugLog) : [];
  logs.push({
    timestamp: new Date().toLocaleString(),
    ...logEntry
  });
  // Keep only last 50 logs
  if (logs.length > 50) logs.shift();
  await chrome.storage.local.set({ debugLog: JSON.stringify(logs) });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "generateLeaseReply" && info.menuItemId !== "generateFollowUpReply") return;
  const selectedText = info.selectionText;

  const { geminiKey, openaiKey, provider, memoryMd, systemPrompt: customPrompt } = await chrome.storage.local.get([
    "geminiKey",
    "openaiKey",
    "provider",
    "memoryMd",
    "systemPrompt"
  ]);

  const isFollowUp = info.menuItemId === "generateFollowUpReply";
  const systemPrompt = isFollowUp
    ? buildFollowUpPrompt(memoryMd || "")
    : await buildSystemPrompt(customPrompt, memoryMd || "");

  // Show "Generating..." immediately
  try {
    await chrome.tabs.sendMessage(tab.id, { type: "SHOW_LOADING" });
  } catch {
    // Content script not loaded, inject it and then show loading
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ["content.css"]
    });
    await chrome.tabs.sendMessage(tab.id, { type: "SHOW_LOADING" });
  }

  let reply;
  let error = null;
  try {
    if ((provider || "gemini") === "gemini") {
      reply = await callGemini(geminiKey, systemPrompt, selectedText);
    } else {
      reply = await callOpenAI(openaiKey, systemPrompt, selectedText);
    }
  } catch (err) {
    error = err.message;
    reply = `Error: ${err.message}`;
  }

  // Log the activity
  await addDebugLog({
    type: isFollowUp ? "Follow-up Reply" : "Lease Reply",
    provider: provider || "gemini",
    selectedText,
    systemPrompt,
    reply,
    error
  });

  // Send the actual reply
  try {
    await chrome.tabs.sendMessage(tab.id, {
      type: "SHOW_REPLY",
      reply,
      selectedText
    });
  } catch (err) {
    console.error("Failed to send reply to tab:", err);
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "SAVE_FEEDBACK") {
    saveFeedback(msg.feedback, msg.selectedText, msg.reply).then(() => sendResponse({ ok: true }));
    return true;
  }
});
