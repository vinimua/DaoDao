# 阶段结果验收文档 - 阶段 1：项目骨架

---

## 0. 文档元信息

| 项目 | 内容 |
|---|---|
| 项目名称 | 念头水獭 Thought Otter |
| 阶段编号 | Phase 1 |
| 阶段名称 | 项目骨架 |
| 文档版本 | v1.1 |
| 修订日期 | 2026-06-15 |
| 修订人 | Codex review |
| 验收对象 | `thought-otter/` |
| 当前结论 | **通过** |
| 代码分支 | N/A（当前目录不是 git 仓库） |
| Commit / Tag | N/A |

---

## 1. 阶段目标核对

> 来源：`念头水獭_开发路线图.md` §10

| 编号 | 目标 | 验收标准 | 当前状态 |
|---|---|---|---|
| G-001 | 创建独立 Electron 项目目录 `thought-otter/` | 目录存在，不在 `clawd-on-desk` 内 | 已完成 |
| G-002 | 创建 `package.json` | 含 Electron 依赖、`npm start` 脚本 | 已完成 |
| G-003 | 安装 Electron | `node_modules/electron` 存在，版本正确 | 已完成 |
| G-004 | 创建 `src/main.js` | Electron app 能启动，创建 BrowserWindow | 已完成，`npm start` GUI 启动返回 0 |
| G-005 | 创建 `src/index.html` | 基础 HTML 页面 | 已完成 |
| G-006 | 创建 `src/renderer.js` | 基础渲染进程脚本 | 已完成 |
| G-007 | 创建 `src/preload.js` | 白名单 API 桥接，不暴露完整 ipcRenderer | 已完成，已收紧为 renderer-facing API |
| G-008 | `npm start` 可启动 | 窗口可正常打开并退出 | 已完成，`npm start` 返回 0 且无残留 Electron 进程 |

---

## 2. 交付物清单

| 文件路径 | 类型 | 当前说明 |
|---|---|---|
| `thought-otter/package.json` | 配置 | 项目元信息、Electron 依赖、`npm start` 脚本 |
| `thought-otter/package-lock.json` | 锁文件 | 锁定 Electron 41.7.2 等依赖 |
| `thought-otter/launch.js` | 启动器 | 剥离 `ELECTRON_RUN_AS_NODE`，并已增加 spawn error 处理 |
| `thought-otter/src/main.js` | 主进程 | 创建 BrowserWindow、单实例锁、生命周期；已启用 renderer sandbox |
| `thought-otter/src/index.html` | UI | 主窗口 HTML，含 CSP meta |
| `thought-otter/src/renderer.js` | 渲染进程 | 基础启动状态展示 |
| `thought-otter/src/preload.js` | 预加载 | 仅暴露 renderer-facing IPC API，且进行基础 payload 规整 |
| `thought-otter/.gitignore` | 配置 | 忽略依赖、构建产物、IDE/OS 文件 |

---

## 3. 本次 Review 后已整改项

| 编号 | 原问题 | 处理结果 |
|---|---|---|
| FIX-001 | `preload.js` 暴露了 `quick-input:show` 这类 `main internal` channel | 已移除 |
| FIX-002 | `preload.js` 暴露了路线图 §7 未定义的 `state-change` listener | 已移除 |
| FIX-003 | `preload.js` 对部分对象 payload 直接透传 | 已增加 `ThoughtCreateInput`、list options、settings patch、id/text/state 的基础规整和类型检查 |
| FIX-004 | `main.js` 显式 `sandbox: false` | 已改为 `sandbox: true` |
| FIX-005 | `main.js` 存在未使用变量 `isWin` | 已移除 |
| FIX-006 | `launch.js` 未监听 `spawn` error | 已增加 error handler，启动失败时输出错误并返回退出码 1 |
| FIX-007 | 验收文档把未验证项写成“通过/整改项无” | 已补充整改和 GUI 启动证据 |

---

## 4. 契约与接口对齐

### 4.1 当前 preload 暴露范围

阶段 1 当前只有 `src/index.html` 主窗口，因此 `src/preload.js` 只暴露 renderer-facing API：

| API | IPC Channel | Payload 处理 |
|---|---|---|
| `createThought(input)` | `thought:create` | 规整为 `{ content, source, filePath?, url?, metadata? }` |
| `listTodayThoughts(options)` | `thought:list-today` | 规整为 `{ includeDeleted?: boolean }` |
| `deleteThought(id)` | `thought:delete` | 规整为 `{ id: string }` |
| `markCopied(id)` | `thought:mark-copied` | 规整为 `{ id: string }` |
| `writeClipboardText(text)` | `clipboard:write-text` | 规整为 `{ text: string }` |
| `setOtterState(state, reason)` | `otter:set-state` | 规整为 `{ state: OtterState, reason?: string }` |
| `getSettings()` | `settings:get` | 无 payload |
| `updateSettings(partial)` | `settings:update` | 仅保留 string/number/boolean/null 值 |

### 4.2 尚未暴露或尚未实现的 channel

| Channel | 路线图方向 | 当前处理 |
|---|---|---|
| `window:drag-start` / `window:drag-move` / `window:drag-end` | hit -> main | 阶段 2 创建 `preload-hit.js` 时暴露 |
| `quick-input:show` | main internal | 不暴露给 renderer |
| `panel:show-today` | hit/main -> main | 阶段 6 或相关窗口实现时按窗口 preload 暴露 |

说明：当前主进程尚未注册业务 IPC handler。这些 handler 属于后续阶段；阶段 1 的目标是安全地建立项目骨架和 preload 边界。

---

## 5. 安全与权限验收

| 项目 | 当前实现 | 结果 | 备注 |
|---|---|---|---|
| 上下文隔离 | `contextIsolation: true` | 通过 | renderer 不直接访问 Electron API |
| Node 集成禁用 | `nodeIntegration: false` | 通过 | renderer 不直接获得 Node 能力 |
| Renderer sandbox | `sandbox: true` | 通过 | 已从 `false` 收紧 |
| preload 白名单 | 仅暴露 `window.otterAPI` | 通过 | 不暴露完整 `ipcRenderer` |
| IPC payload | preload 中做基础规整 | 通过 | 深层业务校验仍应在 main/service 层实现 |
| CSP | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'` | 有条件通过 | 内联 style 是阶段 1 简化项，后续可拆为 `styles.css` 后收紧 |

---

## 6. 构建与测试证据

| 命令 | 结果 | 说明 |
|---|---|---|
| `npm install` | 已完成 | Electron 41.7.2 已安装，lockfile 存在 |
| `node launch.js` | 已执行过 | 进程可启动，历史日志显示 timeout 后 SIGTERM 终止 |
| `npm start` GUI 验证 | 通过 | 命令返回退出码 0，关闭后未发现残留 Electron/Thought 进程 |
| `npm run lint` | 未配置 | Phase 1 未引入 lint |
| `npm test` | 未配置 | 路线图后续阶段引入测试 |

---

## 7. 仍需补验的问题

| 编号 | 问题 | 严重级别 | 是否阻塞阶段 1 最终验收 | 建议处理 |
|---|---|---|---|---|
| RISK-001 | 重复启动行为目前主要是代码层面确认，缺少同时启动两个实例的实际证据 | 低 | 否 | 后续阶段做窗口内核时顺手验证第二实例退出 |
| RISK-002 | GUI 验证未保留截图证据 | 低 | 否 | 后续可增加 Playwright/Electron smoke test 或截图证据 |
| RISK-003 | `style-src 'unsafe-inline'` 仍存在 | 低 | 否 | 后续拆出 `styles.css` 后收紧 CSP |
| RISK-004 | 业务 IPC handler 尚未注册 | 低 | 否 | 后续阶段实现数据层、设置页、快捷输入时逐步注册 |

---

## 8. 人工验证记录

```bash
cd thought-otter
npm start
```

结果：

1. `npm start` 返回退出码 0。
2. 关闭后检查进程列表，未发现残留 Electron/Thought 进程。
3. 重复启动并发场景未单独执行，保留为低风险跟进项。

---

## 9. 验收结论

**通过。**

当前代码层面的阶段 1 问题已整改：preload 暴露面已收紧、payload 不再大范围透传、renderer sandbox 已启用、启动器错误处理已补齐。`npm start` 已在桌面环境执行并正常退出，关闭后无残留进程。

允许进入阶段 2。重复启动并发验证、CSP 收紧和业务 IPC handler 注册按后续阶段跟进。
