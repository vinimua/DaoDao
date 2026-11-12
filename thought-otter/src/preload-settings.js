"use strict";

const { contextBridge, ipcRenderer } = require("electron");
const settingsRuntime = require("./settings-runtime");

contextBridge.exposeInMainWorld("settingsAPI", {
  getSettings: () => ipcRenderer.invoke("settings:get"),
  updateSettings: (partial) =>
    ipcRenderer.invoke("settings:update", settingsRuntime.normalizeSettingsPatch(partial)),
  close: () => ipcRenderer.send("settings:close"),
});
