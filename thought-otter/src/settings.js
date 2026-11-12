"use strict";

const shortcutEl = document.getElementById("shortcut");
const sizeRangeEl = document.getElementById("size-range");
const sizeNumberEl = document.getElementById("size-number");
const reviewTimesEl = document.getElementById("review-times");
const openAtLoginEl = document.getElementById("open-at-login");
const hoverPreviewEl = document.getElementById("hover-preview");
const saveBtn = document.getElementById("save-btn");
const closeBtn = document.getElementById("close-btn");
const statusEl = document.getElementById("status");

function setStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = type || "";
}

function formatReviewTimes(values) {
  return Array.isArray(values) ? values.join(", ") : "";
}

function syncSize(value) {
  const size = Math.max(24, Math.min(720, Number(value) || 260));
  sizeRangeEl.value = String(size);
  sizeNumberEl.value = String(size);
}

function applySettings(settings) {
  shortcutEl.value = settings.shortcut || "CommandOrControl+Alt+T";
  syncSize(settings.size || 260);
  reviewTimesEl.value = formatReviewTimes(settings.reviewTimes || ["10:30", "16:00"]);
  openAtLoginEl.checked = Boolean(settings.openAtLogin);
  hoverPreviewEl.checked = settings.hoverPreview !== false;
}

function collectPatch() {
  return {
    shortcut: shortcutEl.value,
    size: Number(sizeNumberEl.value),
    reviewTimes: reviewTimesEl.value,
    openAtLogin: openAtLoginEl.checked,
    hoverPreview: hoverPreviewEl.checked,
  };
}

async function loadSettings() {
  try {
    const settings = await window.settingsAPI.getSettings();
    applySettings(settings);
    setStatus("已加载", "ok");
  } catch (err) {
    setStatus(err.message || "加载失败", "error");
  }
}

async function saveSettings() {
  saveBtn.disabled = true;
  setStatus("保存中...");
  try {
    const result = await window.settingsAPI.updateSettings(collectPatch());
    applySettings(result);
    if (result.shortcutStatus && result.shortcutStatus.ok === false) {
      setStatus(`已保存；快捷键注册失败：${result.shortcutStatus.reason || "可能被占用"}`, "error");
    } else {
      setStatus("已保存", "ok");
    }
  } catch (err) {
    setStatus(err.message || "保存失败", "error");
  } finally {
    saveBtn.disabled = false;
  }
}

sizeRangeEl.addEventListener("input", () => syncSize(sizeRangeEl.value));
sizeNumberEl.addEventListener("input", () => syncSize(sizeNumberEl.value));
saveBtn.addEventListener("click", saveSettings);
closeBtn.addEventListener("click", () => window.settingsAPI.close());

window.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
    event.preventDefault();
    saveSettings();
  } else if (event.key === "Escape") {
    event.preventDefault();
    window.settingsAPI.close();
  }
});

loadSettings();
