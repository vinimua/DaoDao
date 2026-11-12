"use strict";

// ── Hit window renderer ──
// The "controller" — all mouse input decisions happen here.
// The render window is pure "view" — it just displays the otter.

const area = document.getElementById("hit-area");

// ── Drag-move state ──
let isDragging = false;
let didDrag = false;
let mouseDownX = 0;
let mouseDownY = 0;
let lastDragX = 0;
let lastDragY = 0;
let dragMode = null;
const DRAG_THRESHOLD = 3;
let isIgnoringMouse = false;

// ── Content drop state ──
let dragOverCount = 0;

function isPointOnOtter(clientX, clientY) {
  const rect = area.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return false;

  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const rx = rect.width * 0.42;
  const ry = rect.height * 0.46;
  const nx = (clientX - cx) / rx;
  const ny = (clientY - cy) / ry;

  return nx * nx + ny * ny <= 1;
}

function setMousePassthrough(shouldIgnore) {
  if (isIgnoringMouse === shouldIgnore) return;
  isIgnoringMouse = shouldIgnore;
  window.hitAPI.setIgnoreMouseEvents(shouldIgnore);
}

function updateMousePassthrough(e) {
  if (isDragging) {
    setMousePassthrough(false);
    return;
  }

  setMousePassthrough(!isPointOnOtter(e.clientX, e.clientY));
}

window.hitAPI.setIgnoreMouseEvents(false);

// ── Pointer handlers (drag to move otter) ──
area.addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return; // left button only
  if (!isPointOnOtter(e.clientX, e.clientY)) return;
  area.setPointerCapture(e.pointerId);
  isDragging = true;
  didDrag = false;
  mouseDownX = e.clientX;
  mouseDownY = e.clientY;
  lastDragX = e.screenX;
  lastDragY = e.screenY;
  dragMode = e.shiftKey ? "move" : "rotate";
  if (dragMode === "move") {
    window.hitAPI.dragStart(e.screenX, e.screenY);
  } else {
    window.hitAPI.rotateStart();
  }
  area.classList.add("dragging");
});

document.addEventListener("pointermove", (e) => {
  updateMousePassthrough(e);
  if (!isDragging) return;
  if (!didDrag) {
    const dx = e.clientX - mouseDownX;
    const dy = e.clientY - mouseDownY;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      didDrag = true;
    }
  }
  if (didDrag) {
    if (dragMode === "move") {
      window.hitAPI.dragMove(e.screenX, e.screenY);
    } else {
      window.hitAPI.rotateMove(e.screenX - lastDragX, e.screenY - lastDragY);
    }
    lastDragX = e.screenX;
    lastDragY = e.screenY;
  }
});

function stopDrag() {
  if (!isDragging) return;
  isDragging = false;
  area.classList.remove("dragging");
  if (didDrag) {
    if (dragMode === "move") {
      window.hitAPI.dragEnd();
    } else {
      window.hitAPI.rotateEnd();
    }
  } else if (dragMode === "rotate") {
    window.hitAPI.rotateEnd();
  }
  dragMode = null;
}

let clickTimer = null;
let clickCount = 0;
const DOUBLE_CLICK_MS = 350;

document.addEventListener("pointerup", (e) => {
  if (e.button !== 0) return;
  const wasClick = isDragging && !didDrag && isPointOnOtter(e.clientX, e.clientY);
  stopDrag();
  updateMousePassthrough(e);

  if (wasClick) {
    clickCount++;
    if (clickCount === 1) {
      clickTimer = setTimeout(() => {
        clickTimer = null;
        clickCount = 0;
        window.hitAPI.openQuickInput(); // single click → record
      }, DOUBLE_CLICK_MS);
    } else if (clickCount >= 2) {
      clearTimeout(clickTimer);
      clickTimer = null;
      clickCount = 0;
      window.hitAPI.openTodayPanel(); // double click → show all
    }
  }
});

area.addEventListener("pointercancel", () => stopDrag());
area.addEventListener("lostpointercapture", () => {
  if (isDragging) stopDrag();
});
window.addEventListener("blur", () => {
  stopDrag();
  setMousePassthrough(true);
});
document.addEventListener("mousemove", updateMousePassthrough);
document.addEventListener("mouseleave", () => {
  if (!isDragging) setMousePassthrough(true);
});

// ── Content drag-drop handlers (drag text/URL/file onto otter) ──

function hasDraggableContent(e) {
  const types = e.dataTransfer && e.dataTransfer.types;
  if (!types) return false;
  for (const t of types) {
    if (t === "Files" || t === "text/plain" || t === "text/uri-list" || t === "text/html") {
      return true;
    }
  }
  return false;
}

area.addEventListener("dragenter", (e) => {
  if (!hasDraggableContent(e)) return;
  e.preventDefault();
  dragOverCount++;
  area.classList.add("drag-over");
  setMousePassthrough(false);
});

area.addEventListener("dragover", (e) => {
  if (!hasDraggableContent(e)) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = "copy";
});

area.addEventListener("dragleave", (e) => {
  dragOverCount--;
  if (dragOverCount <= 0) {
    dragOverCount = 0;
    area.classList.remove("drag-over");
    setMousePassthrough(true);
  }
});

area.addEventListener("drop", async (e) => {
  e.preventDefault();
  dragOverCount = 0;
  area.classList.remove("drag-over");

  if (!hasDraggableContent(e)) {
    setMousePassthrough(true);
    return;
  }

  const dt = e.dataTransfer;
  const payload = {
    text: dt.getData("text/plain") || null,
    uriList: dt.getData("text/uri-list") || null,
    html: dt.getData("text/html") || null,
    files: dt.files && dt.files.length > 0 ? Array.from(dt.files) : null,
  };

  try {
    await window.hitAPI.dropContent(payload);
  } catch (err) {
    console.error("[hit] drop failed:", err);
  }

  setMousePassthrough(true);
});

// ── Hover detection (2s → bubble) ──
let hoverTimer = null;
let isHovering = false;
let bubbleAutoHideTimer = null;
const HOVER_DELAY = 2000;
const BUBBLE_AUTO_HIDE_MS = 8000; // safety net: auto-hide after 8s

function clearHoverTimer() {
  if (hoverTimer) {
    clearTimeout(hoverTimer);
    hoverTimer = null;
  }
}

function onHoverStart(e) {
  if (isDragging || dragOverCount > 0) return;
  if (!isPointOnOtter(e.clientX, e.clientY)) return;
  if (isHovering) return;
  isHovering = true;
  hoverTimer = setTimeout(() => {
    hoverTimer = null;
    window.hitAPI.hoverStart(e.screenX, e.screenY);
    // Safety net: auto-hide bubble if onHoverEnd isn't called
    clearTimeout(bubbleAutoHideTimer);
    bubbleAutoHideTimer = setTimeout(() => {
      bubbleAutoHideTimer = null;
      if (isHovering) onHoverEnd();
    }, BUBBLE_AUTO_HIDE_MS);
  }, HOVER_DELAY);
}

function onHoverEnd() {
  clearHoverTimer();
  clearTimeout(bubbleAutoHideTimer);
  bubbleAutoHideTimer = null;
  if (isHovering) {
    isHovering = false;
    window.hitAPI.hoverEnd();
  }
}

document.addEventListener("mousemove", (e) => {
  if (!isDragging && dragOverCount === 0) {
    if (isPointOnOtter(e.clientX, e.clientY)) {
      if (!isHovering) onHoverStart(e);
    } else {
      onHoverEnd();
    }
  }
  updateMousePassthrough(e); // AFTER hover check to avoid blocking events before onHoverEnd
});

// Hover end on leaving the area or the entire window
area.addEventListener("mouseenter", (e) => onHoverStart(e));
area.addEventListener("mouseleave", () => onHoverEnd());
document.addEventListener("mouseleave", () => onHoverEnd());

// ── Right-click context menu ──
document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  if (!isPointOnOtter(e.clientX, e.clientY)) return;
  window.hitAPI.showContextMenu();
});
