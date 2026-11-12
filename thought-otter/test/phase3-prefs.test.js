"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const prefs = require("../src/prefs");
const createPetWindowRuntime = require("../src/pet-window-runtime");

function testPrefs() {
  const dir = path.join(__dirname, ".tmp-phase3-prefs");
  const file = path.join(dir, "prefs.json");

  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });

  try {
    const defaultsA = prefs.getDefaults();
    const defaultsB = prefs.getDefaults();
    defaultsA.reviewTimes.push("22:00");
    assert(!defaultsB.reviewTimes.includes("22:00"), "getDefaults must not share reviewTimes");

    let loaded = prefs.load(file);
    assert.strictEqual(loaded.locked, false);
    assert.strictEqual(loaded.snapshot.size, 80);
    assert.strictEqual(loaded.snapshot.shortcut, "CommandOrControl+Alt+T");

    prefs.save(file, {
      ...prefs.getDefaults(),
      x: 123,
      y: 456,
      positionSaved: true,
      size: 120,
      unknown: "drop",
    });

    loaded = prefs.load(file);
    assert.strictEqual(loaded.snapshot.x, 123);
    assert.strictEqual(loaded.snapshot.y, 456);
    assert.strictEqual(loaded.snapshot.positionSaved, true);
    assert.strictEqual(loaded.snapshot.size, 120);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(loaded.snapshot, "unknown"), false);

    const merged = prefs.merge(loaded.snapshot, { size: 999, x: 321, unknown: "drop" });
    assert.strictEqual(merged.size, 120, "invalid partial size should preserve old value");
    assert.strictEqual(merged.x, 321, "valid partial x should be applied");
    assert.strictEqual(Object.prototype.hasOwnProperty.call(merged, "unknown"), false);

    fs.writeFileSync(file, "{corrupt", "utf8");
    loaded = prefs.load(file);
    assert.strictEqual(loaded.snapshot.size, 80);

    fs.writeFileSync(file, JSON.stringify({ version: 999, size: 90 }), "utf8");
    loaded = prefs.load(file);
    assert.strictEqual(loaded.locked, true);
    assert.strictEqual(loaded.snapshot.size, 90);

    fs.writeFileSync(file, JSON.stringify({
      version: 1,
      shortcut: "CommandOrControl+Alt+Space",
    }), "utf8");
    loaded = prefs.load(file);
    assert.strictEqual(loaded.snapshot.shortcut, "CommandOrControl+Alt+T");

    fs.writeFileSync(file, JSON.stringify({
      version: 1,
      shortcut: "CommandOrControl+Alt+Shift+O",
    }), "utf8");
    loaded = prefs.load(file);
    assert.strictEqual(loaded.snapshot.shortcut, "CommandOrControl+Alt+T");

    fs.writeFileSync(file, JSON.stringify({
      version: 1,
      shortcut: "CommandOrControl+Alt+O",
    }), "utf8");
    loaded = prefs.load(file);
    assert.strictEqual(loaded.snapshot.shortcut, "CommandOrControl+Alt+T");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function testPetRuntime() {
  const workArea = { x: 0, y: 0, width: 1000, height: 800 };
  const screen = { getPrimaryDisplay: () => ({ workArea }) };
  const windows = [];

  class FakeWindow {
    constructor(options) {
      this.options = options;
      this.bounds = {
        x: options.x,
        y: options.y,
        width: options.width,
        height: options.height,
      };
      this.destroyed = false;
      windows.push(this);
    }

    isDestroyed() { return this.destroyed; }
    getBounds() { return { ...this.bounds }; }
    setBounds(bounds) { this.bounds = { ...this.bounds, ...bounds }; }
    setIgnoreMouseEvents() {}
    setAlwaysOnTop() {}
    on() {}
    loadFile() {}
    showInactive() {}
  }

  let savedPosition = null;
  let savedSize = null;
  const runtime = createPetWindowRuntime({
    screen,
    BrowserWindow: FakeWindow,
    preloadPath: "preload.js",
    hitPreloadPath: "preload-hit.js",
    indexPath: "index.html",
    hitPath: "hit.html",
    initialSize: 80,
    initialX: 123,
    initialY: 234,
    onPositionChanged: (bounds) => { savedPosition = bounds; },
    onSizeChanged: (size) => { savedSize = size; },
  });

  runtime.createRenderWindow();
  runtime.createHitWindow();

  assert.strictEqual(windows[0].bounds.x, 123);
  assert.strictEqual(windows[0].bounds.y, 234);
  assert.strictEqual(windows[1].bounds.x, 123);
  assert.strictEqual(windows[1].bounds.y, 234);

  runtime.beginDrag(200, 200);
  runtime.moveDrag(250, 260);
  runtime.endDrag();

  assert.deepStrictEqual(
    { x: savedPosition.x, y: savedPosition.y },
    { x: 173, y: 294 }
  );

  runtime.resizePet(999);
  assert.strictEqual(runtime.getSize(), 720);
  assert.strictEqual(savedSize, 720);
}

testPrefs();
testPetRuntime();
console.log("phase3 prefs/runtime tests passed");
