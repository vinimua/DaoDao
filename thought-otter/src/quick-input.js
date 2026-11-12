"use strict";

const input = document.getElementById("thought-input");
const resultPanel = document.getElementById("result-panel");
let submitting = false;

function setResult(message, state = "empty") {
  resultPanel.dataset.state = state;
  resultPanel.textContent = message;
}

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function renderToday(thoughts) {
  if (!Array.isArray(thoughts) || thoughts.length === 0) {
    setResult("今天还没有记录。输入 /delete 1 删除", "empty");
    return;
  }

  resultPanel.dataset.state = "today";
  resultPanel.textContent = "";
  const list = document.createElement("ul");
  list.className = "today-list";

  for (const thought of thoughts) {
    const item = document.createElement("li");
    item.className = "today-item";

    const num = document.createElement("span");
    num.className = "today-meta";
    num.textContent = (thought.index || "") + ". " + formatTime(thought.createdAt);

    const cat = document.createElement("span");
    cat.className = "today-meta";
    const icons = { todo: "[待办]", idea: "[灵感]", question: "[问题]", note: "[随记]" };
    cat.textContent = " " + (icons[thought.category] || "") + " ";

    const content = document.createElement("span");
    content.textContent = thought.preview || thought.content || "";

    item.append(num, cat, content);
    list.appendChild(item);
  }

  const hint = document.createElement("div");
  hint.className = "today-meta";
  hint.style.marginTop = "8px";
  hint.textContent = "/delete N 删除第N条";

  resultPanel.appendChild(list);
  resultPanel.appendChild(hint);
}

function resetSubmitting() {
  submitting = false;
  input.disabled = false;
  input.focus();
}

// Auto-resize textarea on input
input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = input.scrollHeight + "px";
});

input.focus();

async function submitCurrentInput() {
  if (submitting) return;

  const content = input.value.trim();
  if (!content) return;

  submitting = true;
  input.disabled = true;
  try {
    const result = await window.quickInputAPI.submit(content);
    if (result && result.ok && result.action === "today") {
      renderToday(result.thoughts);
      resetSubmitting();
      input.select();
      return;
    }

    if (!result || !result.ok) {
      setResult(result && result.reason ? result.reason : "提交失败", "error");
      resetSubmitting();
    }
  } catch (err) {
    setResult(err.message || "提交失败", "error");
    resetSubmitting();
  }
}

input.addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    submitCurrentInput();
  } else if (e.key === "Escape") {
    e.preventDefault();
    window.quickInputAPI.cancel();
  }
});

window.quickInputAPI.onPrefill((payload) => {
  if (!payload || typeof payload.content !== "string") return;
  input.value = payload.content;
  input.focus();
  input.select();
  if (payload.autoSubmit) {
    submitCurrentInput();
  }
});

window.addEventListener("blur", () => {
  setTimeout(() => {
    window.quickInputAPI.cancel();
  }, 100);
});
