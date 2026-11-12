"use strict";

const bubble = document.getElementById("bubble");

const CAT_ICONS = { todo: "📋", idea: "💡", question: "❓", note: "📝" };

function formatTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function showBubble(thoughts) {
  if (!thoughts || thoughts.length === 0) {
    bubble.classList.remove("visible");
    return;
  }

  const items = thoughts.map((t) => `
    <div class="item">
      <span class="time">${formatTime(t.createdAt)}</span>
      <span>${CAT_ICONS[t.category] || ""}</span>
      <span class="content">${escapeHtml(t.contentPreview || t.content)}</span>
    </div>
  `).join("");

  bubble.innerHTML = items;
  bubble.classList.add("visible");
}

function hideBubble() {
  bubble.classList.remove("visible");
}

function escapeHtml(text) {
  const el = document.createElement("span");
  el.textContent = text || "";
  return el.innerHTML;
}

window.bubbleAPI.onShowBubble((thoughts) => showBubble(thoughts));
window.bubbleAPI.onHideBubble(() => hideBubble());
