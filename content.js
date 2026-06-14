chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "SHOW_REPLY") {
    showPopup(msg.reply, msg.selectedText);
  }
});

function removeExistingPopup() {
  const existing = document.getElementById("woolly-sloth-popup");
  if (existing) existing.remove();
}

function showPopup(reply, selectedText) {
  removeExistingPopup();

  const popup = document.createElement("div");
  popup.id = "woolly-sloth-popup";
  popup.className = "ws-popup";

  const header = document.createElement("div");
  header.className = "ws-header";
  header.innerHTML = `
    <span>Woolly Sloth — Lease Reply</span>
    <button class="ws-close">✕</button>
  `;

  const body = document.createElement("div");
  body.className = "ws-body";
  body.innerHTML = `<div class="ws-reply-text"></div>`;
  body.querySelector(".ws-reply-text").textContent = reply;

  const copyBtn = document.createElement("button");
  copyBtn.className = "ws-copy";
  copyBtn.textContent = "Copy to Clipboard";

  const feedbackRow = document.createElement("div");
  feedbackRow.className = "ws-feedback-row";
  feedbackRow.innerHTML = `
    <span>Helpful?</span>
    <button class="ws-thumb-up">👍</button>
    <button class="ws-thumb-down">👎</button>
  `;

  const feedbackForm = document.createElement("div");
  feedbackForm.className = "ws-feedback-form";
  feedbackForm.style.display = "none";
  feedbackForm.innerHTML = `
    <textarea class="ws-feedback-text" placeholder="Optional note..." rows="3"></textarea>
    <button class="ws-submit-feedback">Submit</button>
  `;

  const thankYou = document.createElement("div");
  thankYou.className = "ws-feedback-thanks";
  thankYou.style.display = "none";
  thankYou.textContent = "Thanks for the feedback!";

  const actions = document.createElement("div");
  actions.className = "ws-actions";
  actions.appendChild(copyBtn);
  actions.appendChild(feedbackRow);
  actions.appendChild(feedbackForm);
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

  // Feedback buttons
  const thumbUp = feedbackRow.querySelector(".ws-thumb-up");
  const thumbDown = feedbackRow.querySelector(".ws-thumb-down");
  let selectedRating = 0;

  thumbUp.addEventListener("click", () => {
    if (selectedRating === 1) {
      selectedRating = 0;
      thumbUp.classList.remove("active");
      feedbackForm.style.display = "none";
    } else {
      selectedRating = 1;
      thumbUp.classList.add("active");
      thumbDown.classList.remove("active");
      feedbackForm.style.display = "block";
    }
  });

  thumbDown.addEventListener("click", () => {
    if (selectedRating === -1) {
      selectedRating = 0;
      thumbDown.classList.remove("active");
      feedbackForm.style.display = "none";
    } else {
      selectedRating = -1;
      thumbDown.classList.add("active");
      thumbUp.classList.remove("active");
      feedbackForm.style.display = "block";
    }
  });

  // Submit feedback
  const submitBtn = feedbackForm.querySelector(".ws-submit-feedback");
  const textArea = feedbackForm.querySelector(".ws-feedback-text");

  submitBtn.addEventListener("click", () => {
    const comment = textArea.value.trim();
    const feedback = { rating: selectedRating, comment };
    chrome.runtime.sendMessage({
      type: "SAVE_FEEDBACK",
      feedback,
      selectedText,
      reply
    }, () => {
      feedbackForm.style.display = "none";
      thumbUp.classList.remove("active");
      thumbDown.classList.remove("active");
      thankYou.style.display = "block";
      setTimeout(() => {
        thankYou.style.display = "none";
      }, 2500);
    });
  });
}
