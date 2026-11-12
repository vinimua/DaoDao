"use strict";

const { contextBridge, ipcRenderer } = require("electron");

// ── Quick input window preload ──
// Exposes submit/cancel IPC for the quick input window.

contextBridge.exposeInMainWorld("quickInputAPI", {
  // Submit a thought → main creates it and closes the window
  submit: (content) => ipcRenderer.invoke("quick-input:submit", { content }),

  // Cancel → main closes the window without saving
  cancel: () => ipcRenderer.send("quick-input:cancel"),

  onPrefill: (callback) => {
    if (typeof callback !== "function") return () => {};
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("quick-input:prefill", listener);
    return () => ipcRenderer.removeListener("quick-input:prefill", listener);
  },
});
