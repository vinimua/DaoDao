# 阶段 6-7 问题与解决方案汇总

项目：念头水獭 Thought Otter  
范围：阶段 6 今日念头面板、阶段 7 拖拽输入  
更新时间：2026-06-18

---

## 1. 背景

阶段 6 的目标是实现“今日念头面板”，让用户可以查看、展开、复制、删除今天记录的念头。

阶段 7 的目标是实现“拖拽输入”，支持把文本、URL、文件拖给小水獭，并保存到本地 SQLite。

本次修复以验收发现的问题为依据。用户明确决策：删除采用**硬删除**，不采用路线图原本写的软删除，以减少本地数据占用。

---

## 2. 阶段 6：今日念头面板

### 2.1 问题一：今日面板可能出屏

**问题表现**

今日面板最初直接放在水獭右侧：

```text
x = petBounds.x + petSize + 12
```

当水獭位于屏幕右侧或右下角时，面板会被放到屏幕外，导致用户右键打开“今日念头”后看不到窗口。

**影响**

- “右键打开今日面板”不稳定。
- 默认位置在右下角时尤其容易复现。

**解决方案**

新增 `src/today-panel-runtime.js`，把今日面板定位逻辑抽成纯函数：

- 优先放在水獭右侧。
- 右侧空间不足时自动放到水獭左侧。
- 最终按屏幕 workArea clamp，保证不出屏。

相关文件：

- `src/today-panel-runtime.js`
- `src/main.js`
- `test/today-panel-runtime.test.js`

---

### 2.2 问题二：缺少双击复制

**问题表现**

阶段 6 要求：

```text
双击复制
```

但原实现只有“复制”按钮，双击念头项不会复制。

**影响**

- 不满足阶段 6 任务要求。
- 今日面板操作效率不足。

**解决方案**

在 `src/today-panel.js` 中新增 `dblclick` 监听：

- 双击念头项时调用复制逻辑。
- 复制按钮和双击共用同一个 `copyThought()` 函数。
- 复制后调用 `clipboard:write-text`。
- 复制成功后调用 `thought:mark-copied`。

相关文件：

- `src/today-panel.js`

---

### 2.3 问题三：IPC 参数解构风险

**问题表现**

部分 IPC handler 在参数位置直接解构 payload，例如：

```js
ipcMain.handle("thought:delete", async (_event, { id }) => ...)
```

如果 renderer 传入 `null`、`undefined` 或非对象，异常会发生在函数体 try/catch 之前。

**影响**

- 非法 payload 可能导致不可控异常。
- 这是阶段 4 曾经修过的问题，在阶段 6 中出现回归风险。

**解决方案**

改为在函数体内读取和校验 payload：

```js
ipcMain.handle("thought:delete", async (_event, payload) => {
  const id = payload && payload.id;
  ...
});
```

已处理的 IPC：

- `thought:delete`
- `thought:mark-copied`
- `clipboard:write-text`

相关文件：

- `src/main.js`

---

### 2.4 问题四：删除语义与用户目标不一致

**问题表现**

路线图原本写的是软删除，但用户希望硬删除，避免长期占用本地空间。

**决策**

保留硬删除：

```sql
DELETE FROM thoughts WHERE id = ?
```

**解决方案**

- 不改回软删除。
- 将 `thought-service.js` 中关于删除的注释改成“永久删除”，避免文档和代码语义冲突。
- 保留现有 hard delete 测试。

相关文件：

- `src/thought-service.js`
- `test/thought-service.test.js`

---

## 3. 阶段 7：拖拽输入

### 3.1 问题一：`drag-parser.js` 未接入真实链路

**问题表现**

阶段 7 要求创建 `src/drag-parser.js`，但原主进程 `hit:drop-content` 里没有使用它，而是重新手写了一套解析逻辑。

**影响**

- `drag-parser.js` 成为“摆设”。
- 修改 parser 不会影响真实拖拽行为。
- 测试 parser 也无法证明真实链路正确。

**解决方案**

重写 `src/drag-parser.js` 为真实 drop payload 的唯一解析入口。

主进程 `hit:drop-content` 改为：

```js
const parsed = dragParser.parse(payload);
```

主进程只负责：

- 调用 parser。
- 调用 `thoughtService.createThought()`。
- 设置成功或失败状态。

相关文件：

- `src/drag-parser.js`
- `src/main.js`
- `test/drag-parser.test.js`

---

### 3.2 问题二：URL 拖拽兼容性不足

**问题表现**

hit renderer 判断 `text/uri-list` 是可拖拽类型，但 drop payload 只传了：

- `text/plain`
- `text/html`

没有传 `text/uri-list`。

很多浏览器或应用拖链接时主要提供 `text/uri-list`，这会导致 URL 拖拽失败。

**解决方案**

drop payload 增加：

```js
uriList: dt.getData("text/uri-list") || null
```

parser 中新增 `firstUriFromList()`：

- 跳过 `# comment` 行。
- 取第一个有效 URI。
- 识别为 `drag_url`。

相关文件：

- `src/hit-renderer.js`
- `src/drag-parser.js`
- `test/drag-parser.test.js`

---

### 3.3 问题三：空文本/无内容 drop 没有错误反馈

**问题表现**

阶段 7 要求失败后状态进入 `error_hint`。

原实现里，空文本或无内容直接返回：

```js
return { ok: false, reason: "empty content" }
```

没有触发 `setOtterState("error_hint")`。

**影响**

用户拖拽失败时没有明确反馈。

**解决方案**

新增统一失败出口：

```js
function finishDropFailure(reason) {
  setOtterState("error_hint", "drop_failed");
  setTimeout(() => setOtterState("idle", "error_done"), 3000);
  return { ok: false, reason };
}
```

所有 drop 失败路径统一走该函数。

相关文件：

- `src/main.js`

---

### 3.4 问题四：文件 metadata 不足

**问题表现**

阶段 7 要求：

```text
文件不存在仍保存路径并写 metadata
多文件只取第一个
```

原 metadata 只记录了：

- `fileName`
- `multipleFiles`

缺少更明确的信息。

**解决方案**

parser 记录：

- `fileName`
- `droppedFileCount`
- `multipleFiles`

主进程补充：

- `fileExists`

说明：

- 不读取文件内容。
- 只保存第一个文件路径。
- 即使文件不存在，也保存路径，并用 `fileExists` 标记。

相关文件：

- `src/drag-parser.js`
- `src/main.js`
- `test/drag-parser.test.js`

---

### 3.5 问题五：阶段 7 缺少自动化测试

**问题表现**

原测试套件没有 `drag-parser.test.js`，即使 `npm test` 全绿，也无法证明拖拽解析满足阶段 7 验收。

**解决方案**

新增 `test/drag-parser.test.js`，覆盖：

- 拖文本保存为 `drag_text`
- 拖 URL 保存为 `drag_url`
- `text/uri-list` URL 解析
- 拖文件保存为 `drag_file`
- 多文件只取第一个
- 空文本不保存
- 空 payload 返回错误

并将该测试加入 `test/run-tests.js`。

相关文件：

- `test/drag-parser.test.js`
- `test/run-tests.js`

---

### 3.6 问题六：hit window 初始鼠标穿透可能影响 drop

**问题表现**

hit window 初始设置为：

```js
setIgnoreMouseEvents(true)
```

在 Electron/Windows 上，透明窗口如果忽略鼠标事件，可能也收不到外部拖拽事件。

**影响**

用户把文本、URL、文件拖到水獭上时，drop 事件可能根本无法触发。

**解决方案**

调整为：

```js
window.hitAPI.setIgnoreMouseEvents(false);
```

让 hit window 默认可以接收拖拽事件。

说明：

这可能会牺牲一部分鼠标穿透体验，但能优先保证阶段 7 的核心目标：拖拽输入可用。

相关文件：

- `src/hit-renderer.js`

---

## 4. 验证结果

已执行语法检查：

```text
node --check src/main.js
node --check src/today-panel-runtime.js
node --check src/today-panel.js
node --check src/drag-parser.js
node --check src/hit-renderer.js
node --check test/today-panel-runtime.test.js
node --check test/drag-parser.test.js
```

已执行完整测试：

```text
npm.cmd test
```

测试结果：

```text
6 suites passed
Classification: 25 passed
Thought CRUD: 17 passed
Phase 5 Quick Input: 12 passed
Shortcut Runtime: 3 passed
Today Panel Runtime: 3 passed
Drag Parser: 6 passed
```

备注：

Windows 下测试结束时仍可能出现 Electron crashpad 日志：

```text
CreateFile: 拒绝访问。 (0x5)
```

该日志不影响测试退出码，当前 `npm.cmd test` 退出码为 0。

---

## 5. 当前状态

### 阶段 6

已修复：

- 今日面板出屏问题。
- 双击复制缺失。
- IPC 参数解构风险。
- 删除语义注释与硬删除决策不一致。

当前结论：

```text
阶段 6 可继续进入人工桌面验收。
```

### 阶段 7

已修复：

- parser 未接入真实链路。
- URL `text/uri-list` 兼容性不足。
- drop 失败没有 `error_hint`。
- 文件 metadata 不足。
- 缺少 drag parser 自动化测试。
- hit window 初始穿透可能影响 drop。

当前结论：

```text
阶段 7 自动化与代码级验收已补齐。
仍建议进行真实桌面人工验收：从浏览器拖 URL、从文本编辑器拖文本、从资源管理器拖文件到水獭。
```

---

## 6. 后续建议

1. 在真实桌面执行拖拽验收：
   - 拖文本到水獭。
   - 拖 URL 到水獭。
   - 拖单个文件到水獭。
   - 拖多个文件到水獭，确认只保存第一个。

2. 如果 hit window 不再穿透鼠标导致桌面操作不舒服，可在阶段 8 或后续专门优化：
   - 保持拖拽可接收。
   - 同时尽量恢复非水獭区域鼠标穿透。

3. 阶段 8 状态机实现后，可把当前手写的 `receiving` / `error_hint` 临时状态切换迁移到统一状态机。
