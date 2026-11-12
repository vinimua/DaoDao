"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("bubbleAPI", {
  // Receive latest thought data from main
  onShowBubble: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("bubble:show", listener);
    return () => ipcRenderer.removeListener("bubble:show", listener);
  },
  onHideBubble: (callback) => {
    const listener = () => callback();
    ipcRenderer.on("bubble:hide", listener);
    return () => ipcRenderer.removeListener("bubble:hide", listener);
  },
});
