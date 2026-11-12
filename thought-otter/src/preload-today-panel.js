"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("todayPanelAPI", {
  // Fetch all thoughts (newest first, up to 100)
  listAll: () => ipcRenderer.invoke("thought:list-all", {}),

  // Copy text to clipboard
  copyText: (text) => ipcRenderer.invoke("clipboard:write-text", { text }),

  // Mark a thought as copied
  markCopied: (id) => ipcRenderer.invoke("thought:mark-copied", { id }),

  // Delete a thought
  deleteThought: (id) => ipcRenderer.invoke("thought:delete", { id }),

  // Open a file path in the system default application
  openPath: (filePath) => ipcRenderer.invoke("shell:open-path", { filePath }),
});
