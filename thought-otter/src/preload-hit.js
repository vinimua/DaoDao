"use strict";

const { contextBridge, ipcRenderer, webUtils } = require("electron");

// ── Hit window preload ──
// Handles: drag-to-move, right-click menu, content drop, mouse passthrough

contextBridge.exposeInMainWorld("hitAPI", {
  // ── Drag move IPC (hit → main) ──
  dragStart: (screenX, screenY) =>
    ipcRenderer.send("window:drag-start", { screenX, screenY }),
  dragMove: (screenX, screenY) =>
    ipcRenderer.send("window:drag-move", { screenX, screenY }),
  dragEnd: () =>
    ipcRenderer.send("window:drag-end"),

  // 3D model rotation IPC (hit -> main -> render)
  rotateStart: () =>
    ipcRenderer.send("model:rotate-start"),
  rotateMove: (deltaX, deltaY) =>
    ipcRenderer.send("model:rotate-move", { deltaX, deltaY }),
  rotateEnd: () =>
    ipcRenderer.send("model:rotate-end"),

  // ── Context menu ──
  showContextMenu: () => ipcRenderer.send("show-context-menu"),
  openQuickInput: () => ipcRenderer.send("quick-input:open"),
  openTodayPanel: () => ipcRenderer.send("today-panel:open"),

  // ── Hover bubble ──
  hoverStart: (screenX, screenY) =>
    ipcRenderer.send("hover:start", { screenX, screenY }),
  hoverEnd: () =>
    ipcRenderer.send("hover:end"),

  // ── Hit-test passthrough ──
  setIgnoreMouseEvents: (shouldIgnore) =>
    ipcRenderer.send("hit:set-ignore-mouse-events", Boolean(shouldIgnore)),

  // ── Content drop (drag text/URL/file onto otter) ──
  // Resolves file paths via webUtils in the preload (Electron 32+ removed
  // File.path from the renderer for security).
  dropContent: (payload) => {
    // Resolve file paths from File objects before sending to main
    if (payload.files && Array.isArray(payload.files)) {
      const paths = [];
      for (const file of payload.files) {
        try {
          const p = webUtils.getPathForFile(file);
          if (p) paths.push(p);
        } catch {}
      }
      payload.filePaths = paths;
      // Don't send File objects over IPC (they're not serializable)
      delete payload.files;
    }
    return ipcRenderer.invoke("hit:drop-content", payload);
  },
});
