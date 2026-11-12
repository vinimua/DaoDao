# 阶段 2/3 问题与解决方案汇总

---

## 0. 文档元信息

| 项目 | 内容 |
|---|---|
| 项目名称 | 念头水獭 Thought Otter |
| 覆盖阶段 | Phase 2：桌宠窗口内核；Phase 3：配置与位置恢复 |
| 文档类型 | 问题与解决方案汇总 |
| 日期 | 2026-06-16 |
| 相关验收文档 | `phase/Phase2-Result-Acceptance.md`；`phase/Phase3-Result-Acceptance.md` |
| 当前结论 | Phase 2 已通过；Phase 3 有条件通过 |

---

## 1. 阶段 2：桌宠窗口内核

### 1.1 发现的问题

| 编号 | 问题 | 影响 | 严重级别 |
|---|---|---|---|
| P2-001 | hit 窗口覆盖整个 80x80 区域，并且 `setIgnoreMouseEvents(false)` | 透明区域会拦截底层应用点击，不满足“透明区域点击穿透”验收要求 | 高 |
| P2-002 | `npm start` 曾快速返回，但留下多个 Electron 进程 | 容易误判启动生命周期；残留进程会影响后续验收 | 中 |
| P2-003 | Phase 2 文档把未完成 GUI 目视验证的交互项写成“通过” | 验收证据和结论不一致 | 中 |
| P2-004 | `main.js` 存在未使用 import | 小的代码质量问题 | 低 |

### 1.2 解决方案

| 编号 | 解决方案 | 涉及文件 |
|---|---|---|
| P2-001 | hit 窗口默认穿透；`hit-renderer.js` 根据水獭椭圆命中区动态切换鼠标事件捕获；拖拽期间保持捕获 | `src/hit-renderer.js`；`src/preload-hit.js`；`src/main.js`；`src/pet-window-runtime.js` |
| P2-002 | 清理残留 Electron 进程后复测；确认 `npm start` 可常驻运行至测试超时 | 运行验证，无代码改动 |
| P2-003 | 更新 Phase 2 验收文档为 v1.1，记录整改项、验证证据和低风险项 | `phase/Phase2-Result-Acceptance.md` |
| P2-004 | 删除未使用 import | `src/main.js` |

### 1.3 当前状态

Phase 2 当前结论为 **通过**。

已验证：

```powershell
node --check .\thought-otter\src\main.js
node --check .\thought-otter\src\pet-window-runtime.js
node --check .\thought-otter\src\hit-renderer.js
node --check .\thought-otter\src\preload-hit.js
```

补充验证：

- `npm start` 可持续运行至测试超时，符合桌宠常驻预期。
- 测试后已清理残留 Electron 进程。

剩余低风险项：

- 缺少拖动、右键菜单、透明区穿透的截图或录屏证据。
- 后续可补 Electron smoke test 或 Playwright 截图验证。

---

## 2. 阶段 3：配置与位置恢复

### 2.1 发现的问题

| 编号 | 问题 | 影响 | 严重级别 |
|---|---|---|---|
| P3-001 | `settings:update` 收到非法 partial 时会把旧合法值重置成默认值 | 例如当前 `size=120`，更新 `{ size: 999 }` 后会变成默认 `80`，影响后续设置页可靠性 | 中 |
| P3-002 | 测试证据只写在文档中，没有可复现测试文件 | 后续改动容易破坏 prefs/runtime 行为，缺少回归保障 | 中 |
| P3-003 | 文档把端到端 GUI 位置恢复未验证的状态写成“通过” | 阶段 3 核心验收“拖动后退出重启位置恢复”尚未完成目视闭环 | 中 |

### 2.2 解决方案

| 编号 | 解决方案 | 涉及文件 |
|---|---|---|
| P3-001 | 新增 `prefs.merge(base, patch)`，设置更新时非法字段忽略并保留旧值；`settings:update` 改用 `merge()` | `src/prefs.js`；`src/main.js` |
| P3-002 | 新增 Phase 3 可复现测试脚本，并加入 `npm run test:phase3` | `test/phase3-prefs.test.js`；`package.json` |
| P3-003 | 更新 Phase 3 验收文档为 v1.1，结论改为“有条件通过”，保留 GUI 端到端验证为条件项 | `phase/Phase3-Result-Acceptance.md` |

### 2.3 当前状态

Phase 3 当前结论为 **有条件通过**。

已验证：

```powershell
node --check .\thought-otter\src\prefs.js
node --check .\thought-otter\src\main.js
node --check .\thought-otter\test\phase3-prefs.test.js
npm.cmd run test:phase3
```

`test:phase3` 覆盖：

- `getDefaults()` 不共享引用。
- prefs 缺失时返回默认值。
- prefs save/load 保存坐标、尺寸、`positionSaved`。
- unknown 字段被丢弃。
- `prefs.merge()` 遇到非法 partial 保留旧值。
- 坏 JSON 生成 `.bak` 并恢复默认值。
- 未来版本 prefs 返回 `locked=true`。
- pet runtime 启动恢复位置。
- pet runtime 拖拽结束触发位置保存回调。
- pet runtime 尺寸 clamp 到 40-200。

剩余条件项：

- 仍需在 Windows 桌面环境完成一次真实端到端验收：拖动水獭、右键退出、重启、确认水獭恢复到上次位置；删除 `prefs.json` 后确认回到默认右下角。

---

## 3. 总体结论

| 阶段 | 原主要问题 | 已解决 | 当前结论 |
|---|---|---|---|
| Phase 2 | 透明区域不穿透；启动生命周期误判；文档证据不一致 | 是 | 通过 |
| Phase 3 | 非法 settings partial 覆盖旧值；测试不可复现；文档结论过满 | 是 | 有条件通过 |

当前代码层面的主要问题已处理。Phase 3 剩余的是桌面端人工验收证据，不是已知代码缺陷。

---

## 4. 后续建议

1. 在进入 Phase 4 前或 Phase 4 早期补一次 GUI 端到端验收记录。
2. 后续引入正式测试框架时，把 `test/phase3-prefs.test.js` 纳入统一测试入口。
3. 为 Phase 2 增加 Electron smoke test 或截图验证，覆盖桌宠显示、透明区穿透、拖拽和右键退出。
4. 进入 Phase 4 后保持 prefs/runtime 测试常跑，避免数据库层开发时破坏启动流程。

