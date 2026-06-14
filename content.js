chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "SHOW_LOADING") {
    showLoadingPopup();
  } else if (msg.type === "SHOW_REPLY") {
    showPopup(msg.reply, msg.selectedText, msg.isFollowUp);
  }
});

function removeExistingPopup() {
  const existing = document.getElementById("woolly-sloth-popup");
  if (existing) existing.remove();
}

function showLoadingPopup() {
  removeExistingPopup();

  const popup = document.createElement("div");
  popup.id = "woolly-sloth-popup";
  popup.className = "ws-popup";

  const header = document.createElement("div");
  header.className = "ws-header";
  header.innerHTML = `
    <span>Woolly Sloth — Generating Reply...</span>
    <button class="ws-close" disabled style="opacity: 0.5;">✕</button>
  `;

  const body = document.createElement("div");
  body.className = "ws-body";
  body.style.textAlign = "center";
  body.style.padding = "40px 16px";
  body.innerHTML = `
    <div style="font-size: 14px; color: #666;">
      <div style="margin-bottom: 12px;">⏳ Generating your reply...</div>
      <div style="font-size: 12px; color: #999;">This usually takes 3-5 seconds</div>
    </div>
  `;

  popup.appendChild(header);
  popup.appendChild(body);

  const target = document.body || document.documentElement;
  target.appendChild(popup);

  // Make it draggable even while loading
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  header.addEventListener("mousedown", (e) => {
    if (e.target.classList.contains("ws-close")) return;
    isDragging = true;
    dragOffsetX = e.clientX - popup.offsetLeft;
    dragOffsetY = e.clientY - popup.offsetTop;
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    let x = e.clientX - dragOffsetX;
    let y = e.clientY - dragOffsetY;
    x = Math.max(0, Math.min(x, window.innerWidth - popup.offsetWidth));
    y = Math.max(0, Math.min(y, window.innerHeight - popup.offsetHeight));
    popup.style.left = x + "px";
    popup.style.top = y + "px";
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });
}

function showPopup(reply, selectedText, isFollowUp) {
  removeExistingPopup();

  // Store for regenerate
  window.lastRequest = { selectedText, isFollowUp };

  const popup = document.createElement("div");
  popup.id = "woolly-sloth-popup";
  popup.className = "ws-popup";

  const headerTitle = isFollowUp ? "Follow-up Reply" : "Lease Reply";
  const header = document.createElement("div");
  header.className = "ws-header";
  header.innerHTML = `
    <span>Woolly Sloth — ${headerTitle}</span>
    <button class="ws-close">✕</button>
  `;

  const body = document.createElement("div");
  body.className = "ws-body";
  body.innerHTML = `<div class="ws-reply-text"></div>`;
  body.querySelector(".ws-reply-text").textContent = reply;

  const copyBtn = document.createElement("button");
  copyBtn.className = "ws-copy";
  copyBtn.textContent = "Copy to Clipboard";

  const regenerateBtn = document.createElement("button");
  regenerateBtn.className = "ws-regenerate";
  regenerateBtn.textContent = "Regenerate";

  const feedbackLabel = document.createElement("div");
  feedbackLabel.style.fontSize = "12px";
  feedbackLabel.style.color = "#666";
  feedbackLabel.style.marginTop = "8px";
  feedbackLabel.textContent = "Feedback (what was good & what could improve):";

  const feedbackText = document.createElement("textarea");
  feedbackText.className = "ws-feedback-text";
  feedbackText.placeholder = "E.g., 'Great tone, but missing the $0 down option. Too long for Messenger.'";
  feedbackText.rows = "3";

  const submitFeedbackBtn = document.createElement("button");
  submitFeedbackBtn.className = "ws-submit-feedback";
  submitFeedbackBtn.textContent = "Save Feedback";

  const thankYou = document.createElement("div");
  thankYou.className = "ws-feedback-thanks";
  thankYou.style.display = "none";
  thankYou.textContent = "Thanks for the feedback!";

  const actions = document.createElement("div");
  actions.className = "ws-actions";
  actions.appendChild(copyBtn);
  actions.appendChild(regenerateBtn);
  actions.appendChild(feedbackLabel);
  actions.appendChild(feedbackText);
  actions.appendChild(submitFeedbackBtn);
  actions.appendChild(thankYou);

  popup.appendChild(header);
  popup.appendChild(body);
  popup.appendChild(actions);

  const target = document.body || document.documentElement;
  target.appendChild(popup);

  // Draggability
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  header.addEventListener("mousedown", (e) => {
    isDragging = true;
    dragOffsetX = e.clientX - popup.offsetLeft;
    dragOffsetY = e.clientY - popup.offsetTop;
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    let x = e.clientX - dragOffsetX;
    let y = e.clientY - dragOffsetY;
    x = Math.max(0, Math.min(x, window.innerWidth - popup.offsetWidth));
    y = Math.max(0, Math.min(y, window.innerHeight - popup.offsetHeight));
    popup.style.left = x + "px";
    popup.style.top = y + "px";
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });

  // Close button
  header.querySelector(".ws-close").addEventListener("click", () => {
    popup.remove();
  });

  // Copy to clipboard
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(reply);
      copyBtn.textContent = "Copied!";
      setTimeout(() => { copyBtn.textContent = "Copy to Clipboard"; }, 1500);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = reply;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      copyBtn.textContent = "Copied!";
      setTimeout(() => { copyBtn.textContent = "Copy to Clipboard"; }, 1500);
    }
  });

  // Regenerate button
  regenerateBtn.addEventListener("click", async () => {
    regenerateBtn.textContent = "Regenerating...";
    regenerateBtn.disabled = true;

    chrome.runtime.sendMessage({
      type: "REGENERATE_REPLY",
      selectedText,
      isFollowUp
    });
  });

  // Submit feedback
  submitFeedbackBtn.addEventListener("click", () => {
    const feedbackContent = feedbackText.value.trim();

    if (!feedbackContent) {
      alert("Please provide some feedback before submitting.");
      return;
    }

    chrome.runtime.sendMessage({
      type: "SAVE_FEEDBACK",
      feedback: feedbackContent,
      selectedText,
      reply
    }, () => {
      feedbackText.value = "";
      submitFeedbackBtn.disabled = true;
      thankYou.style.display = "block";
      setTimeout(() => {
        thankYou.style.display = "none";
        submitFeedbackBtn.disabled = false;
      }, 2500);
    });
  });
}
