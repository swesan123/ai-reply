const geminiKeyInput = document.getElementById("geminiKey");
const openaiKeyInput = document.getElementById("openaiKey");
const providerInputs = document.querySelectorAll("input[name='provider']");
const memoryPreview = document.getElementById("memoryPreview");
const saveBtn = document.getElementById("saveBtn");
const clearMemoryBtn = document.getElementById("clearMemory");
const saveStatus = document.getElementById("saveStatus");

async function loadSettings() {
  const { geminiKey, openaiKey, provider, memoryMd } = await chrome.storage.local.get([
    "geminiKey",
    "openaiKey",
    "provider",
    "memoryMd"
  ]);

  if (geminiKey) geminiKeyInput.value = geminiKey;
  if (openaiKey) openaiKeyInput.value = openaiKey;
  if (provider) {
    document.querySelector(`input[name="provider"][value="${provider}"]`).checked = true;
  }
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

clearMemoryBtn.addEventListener("click", async () => {
  if (confirm("Clear all memory/feedback? This cannot be undone.")) {
    await chrome.storage.local.set({ memoryMd: "" });
    memoryPreview.value = "";
  }
});

loadSettings();
