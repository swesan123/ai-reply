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
  const base = customPrompt || `You are a friendly, warm sales agent for Swesan Leasing responding to vending machine lease inquiries.

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

  if (memoryMd && memoryMd.trim().length > 0) {
    return base + `\n\n---\nPAST FEEDBACK & PREFERENCES (use these to improve your replies):\n${memoryMd}\n---`;
  }
  return base;
}

function buildFollowUpPrompt(memoryMd) {
  const today = new Date().toDateString();
  const base = `You are a friendly, warm sales agent for Swesan Leasing following up on a previous vending machine conversation.

The current date is: ${today}

Read the chat log below. Find when the customer last messaged and calculate the time gap. Based on how long it's been, choose ONE strategy and write a warm, conversational follow-up:

1-3 days ago (Quick Nudge): They got busy. Keep it brief, low-pressure. "Hey [Name], just floating this back to your inbox. Any questions?"

4-10 days ago (Value Add): Acknowledge the delay. Remind them of the $0 down Revenue Share deal (no upfront cost). Show you understand their needs.

11-25 days ago (Breakup): Respectfully close the conversation. "I'm going to archive this for now, but feel free to reach out whenever you're ready!"

1+ month ago (Revival): Apologize for the delay. Mention we've updated pricing since then—introduce the $150/month flat rate where they keep 100% of sales. Ask if they're still interested.

KEY RULES:
- Write conversational, warm, multi-paragraph responses (not bullet lists).
- Acknowledge them by name if you have it.
- Reference specifics from their old message to show you remember the conversation.
- Use plain text only—no markdown bold, asterisks, or bullet points.
- End with a clear call to action (call time, website, etc.).
- Feel free to use friendly emojis (👉, ✨).
- Messages asking about machines/prices = customer. Messages describing service = agent. Always reply as the agent.
- Website: https://swesanleasing.com/

The following is the old conversation to follow up on:`;

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

async function saveFeedback(feedbackText, selectedText, reply) {
  const { memoryMd } = await chrome.storage.local.get("memoryMd");
  const date = new Date().toISOString().split("T")[0];
  const entry = `\n## ${date}\n${feedbackText}\n**Customer message:** ${selectedText.slice(0, 400)}\n**Reply snippet:** ${reply.slice(0, 400)}\n`;
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
      selectedText,
      isFollowUp
    });
  } catch (err) {
    console.error("Failed to send reply to tab:", err);
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "SAVE_FEEDBACK") {
    saveFeedback(msg.feedback, msg.selectedText, msg.reply).then(() => sendResponse({ ok: true }));
    return true;
  } else if (msg.type === "REGENERATE_REPLY") {
    // Regenerate with the same parameters as the last reply
    handleRegenerate(msg.selectedText, msg.isFollowUp, sender.tab.id);
    sendResponse({ ok: true });
    return true;
  }
});

async function handleRegenerate(selectedText, isFollowUp, tabId) {
  const { geminiKey, openaiKey, provider, memoryMd, systemPrompt: customPrompt } = await chrome.storage.local.get([
    "geminiKey",
    "openaiKey",
    "provider",
    "memoryMd",
    "systemPrompt"
  ]);

  const systemPrompt = isFollowUp
    ? buildFollowUpPrompt(memoryMd || "")
    : await buildSystemPrompt(customPrompt, memoryMd || "");

  // Show "Generating..." immediately
  try {
    await chrome.tabs.sendMessage(tabId, { type: "SHOW_LOADING" });
  } catch {
    console.error("Could not show loading state");
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
    await chrome.tabs.sendMessage(tabId, {
      type: "SHOW_REPLY",
      reply,
      selectedText,
      isFollowUp
    });
  } catch (err) {
    console.error("Failed to send reply to tab:", err);
  }
}
