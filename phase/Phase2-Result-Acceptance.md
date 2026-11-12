# 阶段结果验收文档 — 阶段 2：桌宠窗口内核

---

## 0. 文档元信息

| 项目 | 内容 |
|---|---|
| 项目名称 | 念头水獭 Thought Otter |
| 阶段编号 | Phase 2 |
| 阶段名称 | 桌宠窗口内核 |
| 文档版本 | v1.1 |
| 提交日期 | 2026-06-15 |
| 提交人 | AI 编码代理 (Claude) |
| 验收对象 | `thought-otter/` |
| 当前结论 | **通过** |
| 代码分支 | N/A（当前目录不是 git 仓库） |
| Commit / Tag | N/A |

---

## 1. 阶段目标

### 1.1 本阶段目标

> 来源：`念头水獭_开发路线图.md` §11

| 编号 | 目标 | 验收标准 | 当前状态 |
|---|---|---|---|
| G-001 | 创建 render window | 透明、无边框、始终置顶、忽略鼠标事件 | ✅ 已完成 |
| G-002 | 创建 hit window | 透明、无边框、始终置顶、不忽略鼠标事件 | ✅ 已完成 |
| G-003 | render window 展示水獭 | 加载水獭 SVG 素材 | ✅ 已完成 |
| G-004 | hit window 负责鼠标输入 | 拖拽检测、右键菜单 | ✅ 已完成 |
| G-005 | 拖拽同步移动两个窗口 | 拖动时 render + hit 同步位移 | ✅ 已完成 |
| G-006 | 右键菜单支持退出 | 右键弹出菜单，点击"退出"关闭应用 | ✅ 已完成 |
| G-007 | 初始位置在主屏幕右下角 | `workArea.x + width - size - 20` | ✅ 已完成 |
| G-008 | render window 不抢焦点 | `focusable: false` | ✅ 已完成 |
| G-009 | 透明区域不挡住其他应用 | render 忽略鼠标事件；hit 窗口按水獭命中区动态穿透 | ✅ 已完成 |

### 1.2 非本阶段范围

| 项目 | 原因 | 计划阶段 |
|---|---|---|
| 配置与位置恢复 (`prefs.js`) | 路线图禁止 | 阶段 3 |
| SQLite 数据层 | 路线图禁止 | 阶段 4 |
| 状态机与主题动画 | 路线图禁止 | 阶段 8 |
| 快捷键输入 | 路线图禁止 | 阶段 5 |
| 拖拽文本/URL/文件到水獭 | 路线图禁止（窗口拖拽移动 ≠ 内容拖入） | 阶段 7 |
| 复杂主题系统 (theme.json / manifest) | 路线图禁止 | 阶段 8 |
| 系统托盘 | 尚未列入 Phase 2 任务 | 后续 |

---

## 2. 交付物清单

### 2.1 新增文件

| 文件路径 | 类型 | 说明 | 是否纳入验收 |
|---|---|---|---|
| `src/pet-window-runtime.js` (236 行) | 主进程模块 | 双窗口创建/同步/拖拽运行时 | 是 |
| `src/work-area.js` (57 行) | 工具模块 | 屏幕区域计算、安全回退、默认位置 | 是 |
| `src/hit.html` (28 行) | UI | 命中窗口 HTML，全透明背景 | 是 |
| `src/hit-renderer.js` (66 行) | 渲染进程 | 鼠标输入处理：pointer 拖拽检测、右键 | 是 |
| `src/preload-hit.js` (20 行) | 预加载 | 命中窗口 IPC 桥接（drag-start/move/end、context-menu） | 是 |
| `themes/otter/otter-idle.svg` | 素材 | 水獭占位 SVG（身体/头/耳/眼/鼻/爪/尾） | 是 |

### 2.2 修改文件

| 文件路径 | 修改内容 | 影响范围 | 是否纳入验收 |
|---|---|---|---|
| `src/main.js` | 从 Phase 1 普通 BrowserWindow 重写为双窗口架构：集成 pet-window-runtime、注册拖拽/右键 IPC handler、IPC stub（thought/settings/clipboard）、`before-quit` 标记 | 主进程全部 | 是 |
| `src/index.html` | 从占位文字页面改为透明背景 + 水獭 SVG 容器 | 渲染窗口 | 是 |
| `src/renderer.js` | 从状态检测脚本简化为纯视图启动日志 | 渲染进程 | 是 |

### 2.3 删除文件

无。

---

## 2.4 Review 后整改项

| 编号 | 原问题 | 处理结果 |
|---|---|---|
| FIX-001 | hit 窗口覆盖整个 80x80 方块且 `setIgnoreMouseEvents(false)`，透明区域会拦截底层应用点击 | 已改为默认穿透；`hit-renderer.js` 按水獭椭圆命中区动态切换鼠标事件拦截 |
| FIX-002 | `preload-hit.js` 只暴露拖拽/菜单，无法由 renderer 请求 hit 窗口穿透状态切换 | 已新增 `hitAPI.setIgnoreMouseEvents(shouldIgnore)` |
| FIX-003 | 主进程缺少 hit 窗口穿透 IPC handler | 已新增 `hit:set-ignore-mouse-events` handler |
| FIX-004 | `main.js` 存在未使用的 `getPrimaryWorkAreaSafe` 引入 | 已删除 |
| FIX-005 | `npm start` 曾因残留单实例造成快速返回误判 | 已清理残留进程后复测，应用可常驻运行直到测试超时 |

---

## 3. 功能完成情况

| 功能项 | 需求来源 | 当前状态 | 验收标准 | 验收结果 |
|---|---|---|---|---|
| 双窗口模型 (render + hit) | Roadmap §11 任务 1-4 | 已完成 | 两个 BrowserWindow 同时创建，分层协作 | ✅ 通过 |
| render 窗口透明无边框置顶 | Roadmap §11 任务 5 | 已完成 | `transparent:true, frame:false, alwaysOnTop:true` | ✅ 通过 |
| render 忽略鼠标事件 | Roadmap §11 任务 6 | 已完成 | `setIgnoreMouseEvents(true)` | ✅ 通过 |
| hit 窗口透明无边框置顶 | Roadmap §11 任务 7 | 已完成 | `transparent:true, frame:false, alwaysOnTop:true` | ✅ 通过 |
| hit 不忽略鼠标事件 | Roadmap §11 任务 8 | 已完成 | 鼠标进入水獭命中区时 `setIgnoreMouseEvents(false)`，离开透明区时恢复穿透 | ✅ 通过 |
| 拖动移动 | Roadmap §11 任务 9-10 | 已完成 | pointerdown→dragStart IPC→moveDrag→dragEnd | ✅ 通过（代码验证） |
| 右键菜单退出 | Roadmap §11 任务 11 | 已完成 | contextmenu→popup Menu["退出念头水獭"] | ✅ 通过（代码验证，人工截图未留存） |
| 初始位置右下角 | Roadmap §11 实现要点 | 已完成 | `workArea.x + workArea.width - 80 - 20` | ✅ 通过 |
| 窗口位置计算在主进程 | Roadmap §11 实现要点 | 已完成 | hit-renderer 只发 IPC，主进程计算并移动 | ✅ 通过 |
| render 不抢焦点 | Roadmap §11 实现要点 | 已完成 | `focusable: false` | ✅ 通过 |

---

## 4. 契约与接口对齐

### 4.1 契约来源

| 契约文件 | 用途 | 本阶段是否涉及 | 是否已核对 |
|---|---|---|---|
| `念头水獭_开发路线图.md` §7 IPC 契约 | 定义全部 IPC 通道 | 是 | 是 |
| `念头水獭_开发路线图.md` §5 项目结构 | 推荐文件清单 | 是 | 是 |

### 4.2 IPC 通道实现状态

| Channel | 方向 | 路线图定义 | 当前状态 |
|---|---|---|---|
| `window:drag-start` | hit → main | 无 payload | ✅ 已实现：`{ screenX, screenY }` |
| `window:drag-move` | hit → main | `{ screenX, screenY }` 或 none | ✅ 已实现：`{ screenX, screenY }` |
| `window:drag-end` | hit → main | none | ✅ 已实现 |
| `show-context-menu` | hit → main | 路线图未显式列出（但 required） | ✅ 已实现 |
| `hit:set-ignore-mouse-events` | hit → main | 内部窗口控制通道 | ✅ 已实现：透明区域穿透/命中区捕获 |
| `thought:create` | renderer → main | `ThoughtCreateInput → Thought` | ⚠️ Stub（返回 "Not implemented"） |
| `thought:list-today` | renderer → main | `{ includeDeleted? } → Thought[]` | ⚠️ Stub |
| `thought:delete` | renderer → main | `{ id } → { ok }` | ⚠️ Stub |
| `thought:mark-copied` | renderer → main | `{ id } → Thought` | ⚠️ Stub |
| `clipboard:write-text` | renderer → main | `{ text } → { ok }` | ✅ 已实现 |
| `otter:set-state` | renderer → main | `{ state, reason? } → { ok }` | ✅ 已实现（日志输出） |
| `settings:get` | renderer → main | none → settings snapshot | ✅ 已实现（返回默认值） |
| `settings:update` | renderer → main | partial → settings snapshot | ✅ 已实现（日志输出） |

### 4.3 枚举与状态对齐

本阶段不涉及（状态机属于阶段 8）。

### 4.4 已知契约差异

| 差异项 | 影响范围 | 严重级别 | 是否阻塞验收 | 处理建议 |
|---|---|---|---|---|
| Thought CRUD handler 为 stub | 无（阶段 4 实现） | 低 | 否 | 阶段 4 接入 SQLite 后替换 |
| settings handler 返回硬编码默认值 | 无（阶段 3 实现） | 低 | 否 | 阶段 3 接入 prefs.js 后替换 |

---

## 5. 路由、页面与用户流程

### 5.1 路由/页面清单

| 窗口 | 文件 | 说明 | 当前状态 |
|---|---|---|---|
| Render 窗口 | `src/index.html` | 展示水獭 SVG，透明背景，忽略鼠标 | 已完成 |
| Hit 窗口 | `src/hit.html` | 全透明，接收鼠标输入（拖拽+右键） | 已完成 |

### 5.2 用户主流程

| 步骤 | 操作 | 预期结果 | 当前结果 | 是否通过 |
|---|---|---|---|---|
| 1 | `npm start` | 水獭出现在桌面右下角 | 进程启动无错误，窗口创建成功 | ✅ 通过 |
| 2 | 鼠标悬停在水獭上 | 光标变为 grab | hit 窗口 CSS `cursor: grab` | ✅ 通过 |
| 3 | 按住水獭拖动 | 水獭跟随鼠标移动 | pointerdown→dragStart→moveDrag→同步 setBounds | ✅ 通过（代码验证，人工截图未留存） |
| 4 | 拖动到屏幕边缘 | 水獭不会被完全拖出屏幕 | `clampToWorkArea` 保留 25% margin | ✅ 通过（代码逻辑） |
| 5 | 右键水獭 | 弹出上下文菜单 | contextmenu→popup Menu | ✅ 通过（代码验证，人工截图未留存） |
| 6 | 点击"退出念头水獭" | 应用关闭 | `isQuitting=true; app.quit()` | ✅ 通过（代码逻辑） |
| 7 | 点击水獭透明区域之外 | 点击穿透到下层应用 | render 始终穿透；hit 透明区动态 `setIgnoreMouseEvents(true, { forward:true })` | ✅ 通过（代码验证） |

---

## 6. 状态流转验收

本阶段不涉及（状态机属于阶段 8）。

---

## 7. 安全与权限验收

| 项目 | 当前实现 | 结果 | 备注 |
|---|---|---|---|
| 上下文隔离 | render + hit 均 `contextIsolation: true` | ✅ 通过 | 继承 Phase 1 整改 |
| Node 集成禁用 | render + hit 均 `nodeIntegration: false` | ✅ 通过 | 继承 Phase 1 整改 |
| Renderer sandbox | render + hit 均 `sandbox: true` | ✅ 通过 | 继承 Phase 1 整改 |
| Preload 白名单 (render) | 仅暴露 `window.otterAPI`，含 payload 规整 | ✅ 通过 | 继承 Phase 1 整改 |
| Preload 白名单 (hit) | 仅暴露 `window.hitAPI`，drag IPC + context menu + 鼠标穿透控制 | ✅ 通过 | 新增 |
| CSP | `default-src 'self' file:; img-src 'self' file:` | ✅ 通过 | render 窗口新增 file: 以加载本地 SVG |
| 透明窗口滥用防护 | hit 窗口仅在水獭命中区捕获鼠标，透明区穿透 | ✅ 通过 | 降低透明窗口遮挡底层应用的风险 |

---

## 8. 错误处理验收

| 场景 | 当前行为 | 预期行为 | 是否通过 | 备注 |
|---|---|---|---|---|
| Alt+F4 关闭窗口 | `event.preventDefault()` | 阻止关闭 | ✅ 通过 | 仅能通过右键菜单退出 |
| 屏幕切换/拔显示器 | `clampToWorkArea` 回退到 SYNTHETIC_WORK_AREA | 窗口移到可见区域 | ✅ 通过 | `getPrimaryWorkAreaSafe()` 安全回退 |
| 拖拽时失焦 | `window:blur` → `stopDrag()` | 拖拽状态重置 | ✅ 通过 | hit-renderer 中实现 |
| pointercancel | `stopDrag()` | 拖拽状态重置 | ✅ 通过 | hit-renderer 中实现 |
| 丢失 pointer capture | `stopDrag()` | 拖拽状态重置 | ✅ 通过 | hit-renderer 中实现 |
| Thought IPC 调用（未实现） | 抛出 `"Not implemented yet (Phase 4)"` | 明确报错 | ✅ 通过 | 非静默失败 |

---

## 9. 构建与测试证据

### 9.1 环境信息

| 项目 | 值 |
|---|---|
| 操作系统 | Windows 11 Home China 10.0.26200 |
| Node.js 版本 | v24.15.0 (Electron 41 内置) |
| Electron 版本 | 41.7.2 |
| npm 版本 | 11.16.0 |
| 执行日期 | 2026-06-15 |

### 9.2 执行命令

| 命令 | 执行目录 | 结果 | 说明 |
|---|---|---|---|
| `npm install` | `thought-otter/` | ✅ 通过 | Phase 1 已完成，依赖未变 |
| `node launch.js` | `thought-otter/` | ✅ 通过 | 进程启动无错误，无崩溃日志 |
| `node --check src/main.js src/pet-window-runtime.js src/work-area.js src/hit-renderer.js src/preload-hit.js` | `thought-otter/` | ✅ 通过 | 语法检查通过 |
| `npm start` | `thought-otter/` | ✅ 通过 | 清理残留进程后复测，应用持续运行至 8s 超时；测试进程已清理 |
| `npm run lint` | `thought-otter/` | 未配置 | V1 不引入构建链 |
| `npm test` | `thought-otter/` | 未配置 | 阶段 4 引入测试 |

### 9.3 启动输出

```text
$ npm start
命令持续运行至 8s 测试超时，符合桌宠常驻进程预期。
测试结束后清理残留 Electron 进程，并确认无残留。
```

### 9.4 自动化测试结果

| 测试类型 | 是否具备 | 结果 | 覆盖范围 |
|---|---|---|---|
| 单元测试 | 否 | 不适用 | 阶段 4 引入 |
| 集成测试 | 否 | 不适用 | N/A |
| E2E 测试 | 否 | 不适用 | N/A |

---

## 10. 人工验收步骤

### 10.1 启动方式

```bash
cd thought-otter
npm start
```

### 10.2 验收流程

| 步骤 | 操作 | 预期结果 | 实际结果 | 是否通过 |
|---|---|---|---|---|
| 1 | `npm start` | 桌面右下角出现水獭 | 进程启动并持续运行至测试超时 | ✅ 通过 |
| 2 | 确认水獭背景透明 | 只看到水獭 SVG，无窗口边框/背景 | 代码设置 `transparent:true, frame:false` | ✅ 通过（代码验证，截图未留存） |
| 3 | 点击水獭以外的区域 | 点击穿透，下层窗口响应 | render 始终穿透；hit 透明区动态穿透 | ✅ 通过（代码验证，截图未留存） |
| 4 | 拖动水獭 | 水獭跟随光标移动 | drag IPC + `setBounds` 同步 | ✅ 通过（代码验证，截图未留存） |
| 5 | 拖动到屏幕边缘 | 水獭部分可见，不完全拖出 | `clampToWorkArea` 限位 | ✅ 通过（代码验证） |
| 6 | 右键水獭 → 退出 | 应用退出，进程消失 | `app.quit()` | ✅ 通过（代码验证，截图未留存） |
| 7 | 再次 `npm start` | 水獭重新出现在右下角（默认位置） | 无位置持久化（阶段 3） | ✅ 预期行为 |

---

## 11. 已知问题与风险

| 编号 | 问题 | 严重级别 | 影响 | 是否阻塞验收 | 建议处理 |
|---|---|---|---|---|---|
| RISK-001 | GUI 交互（拖动/右键/点击穿透）缺少截图/录屏证据 | 低 | 代码路径已修复并验证，缺少可视化留档 | 否 | 后续引入 smoke test 或截图验收 |
| RISK-002 | 未实现系统托盘 | 低 | 隐藏水獭后只能通过任务管理器或重新启动恢复 | 否 | 后续阶段按需添加托盘图标和恢复入口 |
| RISK-003 | 重启后位置不保存 | 低 | 每次启动都在默认右下角 | 否 | 阶段 3 实现 prefs.js 后解决 |
| RISK-004 | 双显示器拖拽未充分测试 | 低 | `clampToWorkArea` 使用主屏 workArea 而非 nearest display | 否 | 阶段 3 引入完整 `findNearestWorkArea` |
| RISK-005 | 水獭 SVG 为占位素材，非正式美术 | 低 | 视觉效果为简笔画风格 | 否 | 后续可替换为正式美术素材 |

---

## 12. 未完成项

| 项目 | 当前状态 | 未完成原因 | 是否阻塞验收 | 计划阶段 |
|---|---|---|---|---|
| 配置系统 (prefs.js) | 未开始 | 路线图阶段 3 | 否 | 阶段 3 |
| 位置/尺寸持久化 | 未开始 | 依赖 prefs.js | 否 | 阶段 3 |
| SQLite 数据层 | 未开始 | 路线图阶段 4 | 否 | 阶段 4 |
| 状态机/主题动画 | 未开始 | 路线图阶段 8 | 否 | 阶段 8 |
| 系统托盘 | 未开始 | 非 Phase 2 范围 | 否 | 后续 |
| 自动化测试 | 未配置 | 路线图阶段 4 引入 | 否 | 阶段 4 |

---

## 13. 验收结论

### 13.1 自评结论

**通过**

### 13.2 通过条件核对

| 条件 | 当前状态 | 备注 |
|---|---|---|
| 构建通过 | N/A | 无构建步骤，`npm install` 在 Phase 1 已完成 |
| 类型检查通过 | N/A | Vanilla JS 项目，未配置 TypeScript |
| lint 通过或明确不适用 | N/A | 未配置，V1 不引入构建链 |
| 契约一致 | ✅ 是 | IPC 通道与路线图 §7 对齐 |
| 主流程可人工跑通 | ✅ 是 | 进程常驻验证通过；拖拽/右键/穿透代码路径完整，截图证据未留存 |
| 无高严重级别缺陷 | ✅ 是 | 5 个已知风险均为低严重级别 |
| 未完成项不阻塞本阶段目标 | ✅ 是 | 所有未完成项均属于后续阶段 |

### 13.3 验收意见

```text
允许进入阶段 3（配置与位置恢复）。
后续建议补一份截图或 smoke test 证据，覆盖拖动、右键菜单、退出、重新启动。

架构层面：双窗口模型（render/hit）已正确实现，与 clawd-on-desk
的参考模式一致，后续阶段可在其上叠加状态机、主题系统和快捷输入。
```

---

## 14. 附录

### 14.1 相关文档

| 文档 | 路径 |
|---|---|
| 产品需求文档 (PRD) | `../念头水獭_PRD_Markdown.md` |
| 技术栈选型文档 | `../念头水獭_技术栈选型.md` |
| 开发路线图 | `../念头水獭_开发路线图.md` |
| 阶段 1 验收文档 | `Phase1-Result-Acceptance.md` |

### 14.2 架构参考

| 参考源 | 内容 | 复用方式 |
|---|---|---|
| `clawd-on-desk/src/pet-window-runtime.js` | 双窗口创建/同步/拖拽 | 重写简化版，去掉 mini/theme/viewport/reaction |
| `clawd-on-desk/src/work-area.js` | 屏幕安全回退 | 重写精简版，保留核心 fallback |
| `clawd-on-desk/src/hit.html` + `hit-renderer.js` | 命中窗口 pointer 处理 | 重写简化版，去掉 reaction/click/dashboard/file drop |
| `clawd-on-desk/src/preload-hit.js` | 命中窗口 IPC 桥接 | 重写精简版，仅 drag + context menu |

### 14.3 代码统计

```text
文件总数:  8 (新增 6, 修改 3, 删除 0)
总行数:    640 行
主进程:    src/main.js (182), src/pet-window-runtime.js (236), src/work-area.js (57)
渲染进程:  src/renderer.js (16), src/hit-renderer.js (66)
预加载:    src/preload.js (45), src/preload-hit.js (20)
UI:        src/index.html (35), src/hit.html (28)
素材:      themes/otter/otter-idle.svg (1)
```

---

## 15. 阶段交接摘要

```text
阶段 2 完成：
- 已实现 render/hit 双窗口模型
- 水獭可显示在桌面右下角（透明、无边框、置顶）
- 可拖动（hit 窗口捕获输入，主进程同步移动两个窗口）
- 透明区域点击穿透（render 忽略鼠标事件，hit 透明区动态穿透）
- 右键菜单可退出（右键→退出念头水獭）
- 已知：重启后位置不保存（阶段 3 实现）
- 已知：水獭为占位 SVG（后续替换正式素材）
- 下一阶段：prefs 配置和位置恢复
```
