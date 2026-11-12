"use strict";

const listEl = document.getElementById("list");
const countEl = document.getElementById("count");

const CAT_LABELS = { todo: "待办", idea: "灵感", question: "问题", note: "随记" };
const CAT_ICONS = { todo: "[]", idea: "*", question: "?", note: "-" };
const SOURCE_LABELS = {
  quick_input: "输入",
  drag_text: "拖文本",
  drag_url: "拖链接",
  drag_file: "拖文件",
};

function formatTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const today = new Date();
  const isToday = d.getFullYear() === today.getFullYear()
    && d.getMonth() === today.getMonth()
    && d.getDate() === today.getDate();
  if (isToday) return `${h}:${m}`;
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${month}-${day} ${h}:${m}`;
}

async function loadToday() {
  try {
    const thoughts = await window.todayPanelAPI.listAll();
    render(thoughts);
  } catch (err) {
    listEl.innerHTML = `<div id="empty">加载失败: ${escapeHtml(err.message)}</div>`;
    countEl.textContent = "";
  }
}

function render(thoughts) {
  countEl.textContent = `${thoughts.length} 条`;
  if (!thoughts.length) {
    listEl.innerHTML = '<div id="empty">还没有记录过念头</div>';
    return;
  }

  listEl.innerHTML = "";
  for (const t of thoughts) {
    const item = document.createElement("div");
    item.className = "thought-item";
    item.innerHTML = `
      <div class="meta">
        <span class="time">${formatTime(t.createdAt)}</span>
        <span class="cat ${escapeAttr(t.category)}">${CAT_ICONS[t.category] || ""} ${CAT_LABELS[t.category] || escapeHtml(t.category)}</span>
        <span class="source">${SOURCE_LABELS[t.source] || escapeHtml(t.source)}</span>
      </div>
      <div class="content">${escapeHtml(t.contentPreview || t.content)}</div>
      <div class="actions">
        <button class="copy-btn">复制</button>
        ${t.filePath ? '<button class="open-btn">打开文件</button>' : ""}
        <button class="delete-btn danger">删除</button>
      </div>
    `;

    const contentDiv = item.querySelector(".content");
    const copyBtn = item.querySelector(".copy-btn");
    const openBtn = item.querySelector(".open-btn");

    async function copyThought() {
      try {
        await window.todayPanelAPI.copyText(t.content);
        await window.todayPanelAPI.markCopied(t.id);
        copyBtn.textContent = "已复制";
        copyBtn.classList.add("copied-flash");
        setTimeout(() => {
          copyBtn.textContent = "复制";
          copyBtn.classList.remove("copied-flash");
        }, 1500);
      } catch (err) {
        console.error("copy failed:", err);
      }
    }

    item.addEventListener("click", (e) => {
      if (e.target.tagName === "BUTTON") return;
      item.classList.toggle("expanded");
      if (item.classList.contains("expanded")) {
        contentDiv.textContent = t.content;
        contentDiv.classList.add("expanded");
      } else {
        contentDiv.textContent = t.contentPreview || t.content;
        contentDiv.classList.remove("expanded");
      }
    });

    item.addEventListener("dblclick", async (e) => {
      if (e.target.tagName === "BUTTON") return;
      e.preventDefault();
      await copyThought();
    });

    copyBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await copyThought();
    });

    if (openBtn) {
      openBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (!t.filePath) return;
        try {
          const result = await window.todayPanelAPI.openPath(t.filePath);
          if (!result || !result.ok) {
            console.error("open failed:", result && result.reason);
          }
        } catch (err) {
          console.error("open failed:", err);
        }
      });
    }

    item.querySelector(".delete-btn").addEventListener("click", async (e) => {
      e.stopPropagation();
      try {
        await window.todayPanelAPI.deleteThought(t.id);
        loadToday();
      } catch (err) {
        console.error("delete failed:", err);
      }
    });

    listEl.appendChild(item);
  }
}

function escapeHtml(text) {
  const el = document.createElement("span");
  el.textContent = text || "";
  return el.innerHTML;
}

function escapeAttr(text) {
  return String(text || "").replace(/[^a-z0-9_-]/gi, "");
}

loadToday();
