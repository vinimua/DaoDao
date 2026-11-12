# 阶段 1 Review 问题整改报告

---

## 0. 文档元信息

| 项目 | 内容 |
|---|---|
| 项目名称 | 念头水獭 Thought Otter |
| 阶段编号 | Phase 1 |
| 文档类型 | Review 问题整改报告 |
| 文档版本 | v1.0 |
| 日期 | 2026-06-15 |
| 整改对象 | `thought-otter/` 与 `phase/Phase1-Result-Acceptance.md` |
| 当前结论 | 已整改，阶段 1 通过 |

---

## 1. 背景

对 `phase/Phase1-Result-Acceptance.md` 进行 review 后，发现原验收结论存在几类问题：

1. 文档把尚未完成 GUI 补验的启动流程写成“有条件通过”，但阶段 1 的核心能力是“空白窗口运行”，证据不足。
2. `preload.js` 暴露了不属于当前主窗口或不属于路线图 §7 的接口。
3. 部分 IPC payload 直接透传对象，不符合“payload 必须小而明确，不透传任意对象”的约束。
4. Electron renderer sandbox 被关闭，验收文档没有记录该安全风险。
5. 启动器缺少 Electron spawn 失败时的错误处理。
6. 验收文档未准确区分“代码层面存在”和“实际运行已验证”。

整改目标是：先修代码边界和安全问题，再补齐 GUI 启动验证，最后更新验收文档，让结论可复核。

---

## 2. 整改摘要

| 编号 | 问题 | 处理结果 |
|---|---|---|
| FIX-001 | `preload.js` 暴露 `quick-input:show`，但该 channel 是 `main internal` | 已移除 |
| FIX-002 | `preload.js` 暴露 `state-change` listener，但路线图 §7 未定义该 channel | 已移除 |
| FIX-003 | `preload.js` 对对象 payload 直接透传 | 已增加基础类型检查和 payload 规整 |
| FIX-004 | `main.js` 设置 `sandbox: false` | 已改为 `sandbox: true` |
| FIX-005 | `main.js` 有未使用变量 `isWin` | 已删除 |
| FIX-006 | `launch.js` 未处理 spawn error | 已增加 `child.on("error")` 处理 |
| FIX-007 | 验收文档结论与证据不匹配 | 已重写为 v1.1，并记录 GUI 验证结果 |

---

## 3. 代码改动说明

### 3.1 `src/preload.js`

整改前，preload 同时暴露了当前主窗口 renderer API、hit 窗口拖拽 API、main internal API 和未定义事件监听。整改后：

1. 保留 renderer-facing API：
   - `createThought`
   - `listTodayThoughts`
   - `deleteThought`
   - `markCopied`
   - `writeClipboardText`
   - `setOtterState`
   - `getSettings`
   - `updateSettings`

2. 移除不应在阶段 1 主窗口暴露的 API：
   - `dragStart`
   - `dragMove`
   - `dragEnd`
   - `showQuickInput`
   - `showTodayPanel`
   - `onStateChange`

3. 增加基础规整函数：
   - `normalizeThoughtInput(input)`
   - `normalizeListOptions(options)`
   - `normalizeSettingsPatch(partial)`
   - `requiredString(value, name)`
   - `optionalString(value, name)`
   - `requirePlainObject(value, name)`

4. `OtterState` 枚举按路线图 §6.3 对齐：
   - `idle`
   - `hover`
   - `input_open`
   - `receiving`
   - `storing`
   - `reviewing`
   - `quiet`
   - `hidden`
   - `error_hint`

说明：这些检查只负责 preload 边界的基础安全和形状规整。业务完整校验仍应在后续 main/service 层实现。

### 3.2 `src/main.js`

整改内容：

1. 删除未使用的 `isWin`。
2. 将 BrowserWindow 的 `webPreferences.sandbox` 从 `false` 改为 `true`。

整改后主窗口仍保持：

1. `contextIsolation: true`
2. `nodeIntegration: false`
3. 使用 `preload.js`
4. 使用 `requestSingleInstanceLock()`
5. 非 macOS 下 `window-all-closed` 触发 `app.quit()`

### 3.3 `launch.js`

整改前，启动器只监听 `close`。如果 Electron 二进制缺失、路径异常或权限异常，错误输出不够明确。

整改后增加：

```js
child.on("error", (error) => {
  console.error(`[launch] Failed to start Electron: ${error.message}`);
  process.exit(1);
});
```

这使启动失败可见、可诊断，并返回明确的非 0 退出码。

### 3.4 `phase/Phase1-Result-Acceptance.md`

原文档将若干未验证事项写成通过。整改后：

1. 文档版本更新为 `v1.1`。
2. 增加 “本次 Review 后已整改项”。
3. 明确当前 preload 暴露范围。
4. 明确尚未暴露的 hit/main internal channel。
5. 记录 renderer sandbox 已启用。
6. 记录 `npm start` GUI 验证结果。
7. 将最终结论更新为“通过”。
8. 保留非阻塞风险：
   - 重复启动并发场景尚未单独执行。
   - GUI 验证未保留截图证据。
   - CSP 仍有 `style-src 'unsafe-inline'`。
   - 业务 IPC handler 尚未注册。

---

## 4. 验证记录

### 4.1 静态语法检查

执行命令：

```bash
node --check .\thought-otter\src\main.js
node --check .\thought-otter\src\preload.js
node --check .\thought-otter\launch.js
```

结果：全部通过，未发现语法错误。

### 4.2 GUI 启动验证

执行命令：

```bash
cd C:\ZhuoChong\thought-otter
npm start
```

结果：

1. `npm start` 返回退出码 `0`。
2. 关闭后检查进程列表，未发现残留 Electron/Thought 进程。

补充说明：本次没有保留窗口截图，也没有单独执行“两个实例同时启动”的并发验证。因此这两项作为低风险跟进项记录在验收文档中。

---

## 5. 当前结论

阶段 1 当前可以判定为通过：

1. Electron 项目骨架已存在。
2. `npm start` 已可启动并正常退出。
3. 主窗口创建代码存在，GUI 启动验证已完成。
4. preload 不暴露完整 `ipcRenderer`。
5. preload 暴露面已收紧到当前主窗口需要的 renderer-facing API。
6. renderer sandbox 已启用。
7. 启动器错误处理已补齐。
8. 验收文档已修正为可复核状态。

---

## 6. 后续跟进项

| 项目 | 严重级别 | 建议阶段 | 说明 |
|---|---|---|---|
| 重复启动并发验证 | 低 | Phase 2 | 实现窗口内核时顺手验证第二实例退出 |
| CSP 收紧 | 低 | Phase 2 或 Phase 3 | 将内联样式拆到 `styles.css` 后移除 `unsafe-inline` |
| Electron smoke test / 截图证据 | 低 | Phase 4 或更早 | 引入测试链路后补自动化启动验证 |
| 业务 IPC handler | 正常后续工作 | Phase 4+ | 数据层、快捷输入、设置页等阶段逐步实现 |

---

## 7. 涉及文件

| 文件 | 变更类型 |
|---|---|
| `thought-otter/src/preload.js` | 收紧 IPC 暴露面，增加 payload 规整 |
| `thought-otter/src/main.js` | 启用 sandbox，删除未使用变量 |
| `thought-otter/launch.js` | 增加启动错误处理 |
| `phase/Phase1-Result-Acceptance.md` | 更新验收结论和证据 |
| `phase/Phase1-Review-Fix-Report.md` | 新增本整改报告 |
