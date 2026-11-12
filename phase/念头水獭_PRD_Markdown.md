<!-- 本文档由原 Word 产品需求文档整理为 Markdown，保留 V1 MVP 范围、业务流程、数据结构与验收标准。 -->

# 念头水獭（Thought Otter）V1.0 产品需求文档

## 文档属性

| 字段 | 内容 |
| --- | --- |
| 项目名称 | 念头水獭 Thought Otter |
| 文档版本 | v1.0 MVP |
| 文档状态 | 初始开发版 / 适合 AI 辅助开发 |
| 目标平台 | Windows 10 / Windows 11 |
| 主要开发方式 | 个人原型开发 + AI 辅助编码 |
| 核心目标 | 打造一个常驻桌面、零打扰、低摩擦的念头捕捉工具 |
| 核心隐喻 | 小水獭帮用户接住、收纳、轻轻翻看念头 |
| V1 重点 | 编程、学习、做项目时快速记录，不打断当前心流 |
| V1 不做 | 语音输入、云同步、账号系统、复杂 AI 知识库 |

# 01. 项目概述

## 1.1 项目是什么

念头水獭 Thought Otter 是一个常驻桌面的轻量级虚拟宠物效率工具。

用户在编程、学习、做项目时，经常会突然冒出待办、灵感、问题、资料链接或临时想法。传统记录方式需要切换窗口、打开笔记软件、手动分类，容易打断心流。

Thought Otter 的目标是让用户可以用极低摩擦的方式，把这些念头“递给”桌面上的小水獭。小水獭会用轻量动画接住念头，并把它们本地保存起来。用户稍后可以通过悬停、右键面板或每日回顾查看这些念头。

## 1.2 项目不是什么
- Thought Otter 不是完整笔记软件。
- 不是 Notion、Obsidian、Todoist 的替代品。
- 不是聊天机器人。
- 不是云端 AI 助手。
- 不是情绪陪伴游戏。

它首先是一个不打断心流的念头入口。

## 1.3 一句话定位

一只常驻桌面的小水獭，帮你在编程、学习和做项目时，快速接住突然冒出来的念头。

## 1.4 核心价值

| 用户问题 | Thought Otter 的解决方式 |
| --- | --- |
| 想法突然出现，但不想切换窗口 | 使用全局快捷键快速输入 |
| 看到资料链接或文件想暂存 | 拖拽给小水獭 |
| 记录后容易散落各处 | 本地统一保存到念头库 |
| 工具太重，影响专注 | 无弹窗、无声音、无强通知 |
| 记录工具没有反馈感 | 小水獭通过吃下、抱住、收进小窝等动画提供轻量反馈 |

# 02. 目标用户

## 2.1 主要用户

| 用户类型 | 场景 |
| --- | --- |
| 程序员 | 写代码时记录 bug、优化点、接口想法、临时待办 |
| 学生 | 学习时记录问题、知识点、作业提醒、资料链接 |
| 项目制作者 | 做项目时记录需求、灵感、待补充事项 |
| 知识工作者 | 阅读、研究、写作时快速捕捉想法 |

## 2.2 当前原型的核心用户

当前 V1 原型主要服务于个人使用，优先满足：
- 我正在编程 / 学习 / 做项目
- 突然想到一件事
- 我不想切换窗口
- 我把它快速递给小水獭
- 我继续做当前任务
- 稍后再统一查看

## 2.3 用户特征

| 特征 | 说明 |
| --- | --- |
| 长时间使用电脑 | 每天在桌面环境工作数小时 |
| 重视专注 | 不喜欢频繁弹窗和通知 |
| 有碎片想法 | 经常出现临时待办、灵感、问题 |
| 喜欢轻量工具 | 不想维护复杂知识库 |
| 接受可爱界面 | 愿意让一个小动物常驻桌面 |

# 03. V1 目标

## 3.1 V1 核心目标

V1 只验证一个问题：

用户是否愿意每天多次把念头递给小水獭，并在稍后回顾它们？

因此 V1 必须优先做好：
- 桌面小水獭常驻
- 快捷键输入念头
- 拖拽文本 / 链接 / 文件给小水獭
- 本地保存念头
- 今日念头面板
- 低打扰回顾
- 基础分类与搜索

## 3.2 V1 成功标准

| 指标 | 标准 |
| --- | --- |
| 捕捉速度 | 用户按快捷键后 1 秒内可以开始输入 |
| 输入完成 | 回车后立即保存，不出现阻塞弹窗 |
| 视觉反馈 | 小水獭有明确“接住念头”的动画 |
| 数据可靠 | 关闭应用后重新打开，历史念头仍存在 |
| 零打扰 | 不使用系统通知、声音、闪烁动画 |
| 原型可用 | 单人可长期作为日常工具使用 |

# 04. 范围与非范围

## 4.1 V1 必须做

| 模块 | 是否做 | 说明 |
| --- | --- | --- |
| 桌面水獭常驻 | 做 | 始终置顶，可拖拽移动 |
| 透明窗口与点击穿透 | 做 | 非水獭区域不阻挡鼠标 |
| 呼吸动画 | 做 | 低频、轻量、无打扰 |
| 快捷键输入 | 做 | 全局快捷键呼出迷你输入框 |
| 拖拽输入 | 做 | 支持文本、链接、文件路径 |
| 本地保存 | 做 | SQLite 或 JSON，本地离线 |
| 今日念头面板 | 做 | 右键打开，查看今天记录 |
| 悬停查看最新念头 | 做 | 鼠标停留 2 秒显示小气泡 |
| 简单分类 | 做 | 规则优先，分类为待办 / 灵感 / 问题 / 随记 |
| 设置页 | 做 | 修改快捷键、回顾时间、开机自启 |
| 数据备份 | 做 | 每日首次启动自动备份 |
| 全屏检测 | 做 | 全屏时不显示气泡或回顾 |

## 4.2 V1 不做

| 功能 | 不做原因 |
| --- | --- |
| 语音输入 | 原型阶段复杂度高，暂时砍掉 |
| 云同步 | V1 主打本地和隐私 |
| 账号登录 | 单用户本地工具不需要 |
| 多设备同步 | V2 再考虑 |
| 插件市场 | 非核心 |
| 大模型联网总结 | 会破坏完全离线定位 |
| 复杂知识图谱 | 不符合 V1 轻量目标 |
| OCR 图片识别 | V2 可扩展 |
| 团队协作 | 当前是个人效率工具 |
| 宠物养成系统 | V1 只做轻陪伴，不做游戏化 |

# 05. 技术栈

## 5.1 推荐技术栈

为了适合个人原型开发，V1 推荐使用：

| 层级 | 技术 |
| --- | --- |
| 桌面客户端 | Python + PySide6 |
| UI 动画 | PySide6 QMovie / QPropertyAnimation |
| 全局快捷键 | keyboard / pynput |
| 本地数据库 | SQLite |
| ORM / 数据访问 | sqlite3 / SQLAlchemy 二选一 |
| 配置存储 | JSON config 文件 |
| 打包 | PyInstaller |
| 日志 | Python logging |
| 自动备份 | 本地文件复制 |
| 分类引擎 | 规则分类优先，后续可接 ONNX 模型 |
| 测试 | pytest |
| 平台 | Windows 10 / 11 |

## 5.2 技术选择原则

V1 不追求技术先进，追求：
- 能跑起来
- 能每天自用
- 能快速迭代
- 能被 AI 辅助开发
- 能低成本维护

## 5.3 技术边界
- 客户端是唯一主程序。
- 不需要后端服务。
- 不需要云数据库。
- 不需要登录系统。
- 所有数据保存在本地。
- 所有分类逻辑在本地执行。
- 所有交互都围绕桌面小水獭完成。

# 06. 系统架构

## 6.1 V1 本地架构

```
Thought Otter Desktop App
  ├── Otter Window
  │     ├── 透明桌面窗口
  │     ├── 水獭动画
  │     ├── 拖拽接收
  │     └── 鼠标悬停检测
  │
  ├── Input Layer
  │     ├── 全局快捷键
  │     ├── 迷你输入框
  │     └── 拖拽文本 / 链接 / 文件
  │
  ├── Thought Service
  │     ├── 创建念头
  │     ├── 分类念头
  │     ├── 查询今日念头
  │     └── 更新念头状态
  │
  ├── Local Storage
  │     ├── SQLite 数据库
  │     ├── config.json
  │     └── backups/
  │
  ├── Review Layer
  │     ├── 悬停气泡
  │     ├── 今日面板
  │     └── 定时轻回顾
  │
  └── System Layer
        ├── 开机自启
        ├── 全屏检测
        ├── 日志
        └── 异常恢复
```

## 6.2 主流程

1. 用户产生念头
2. 使用快捷键或拖拽递给小水獭
3. 小水獭播放接收动画
4. Thought Service 创建 thought 记录
5. 分类引擎进行简单分类
6. 数据写入 SQLite
7. 小水獭更新状态
8. 用户稍后通过悬停或今日面板回顾

# 07. 用户角色与权限

V1 是单机本地应用，不做多用户权限系统。

| 角色 | 权限 |
| --- | --- |
| 本机用户 | 创建念头、查看念头、删除念头、复制念头、修改设置 |
| 系统进程 | 读取配置、监听快捷键、保存数据、执行备份 |
| 未来扩展：同步用户 | V2 才可能加入账号、云同步、多设备 |

## 7.1 权限原则
- V1 不联网。
- V1 不上传任何用户内容。
- V1 不读取用户文件内容，只保存用户主动拖入的文件路径。
- V1 不自动扫描桌面、浏览器、剪贴板。
- V1 不保留用户未提交的输入。

# 08. 页面 / 窗口清单

因为这是桌面应用，页面以窗口、浮层和面板形式存在。

| 页面 / 组件 | 类型 | 功能 |
| --- | --- | --- |
| 桌面水獭 | 常驻透明窗口 | 展示小水獭、接收拖拽、悬停触发 |
| 快捷输入框 | 浮层 | 输入一句念头 |
| 今日念头面板 | 半透明面板 | 查看今天所有念头 |
| 设置窗口 | 普通窗口 | 修改快捷键、位置、回顾时间等 |
| 右键菜单 | 轻量菜单 | 打开今日面板、隐藏、设置、退出 |
| 悬停气泡 | 小气泡 | 显示最新一条念头 |
| 定时回顾气泡 | 非交互气泡 | 轻量展示今日部分念头 |

# 09. 页面字段与交互

## 9.1 桌面水獭

### 显示要求

| 字段 | 要求 |
| --- | --- |
| 默认位置 | 桌面右下角 |
| 默认尺寸 | 80px × 80px，可配置 |
| 窗口层级 | 始终置顶 |
| 背景 | 透明 |
| 点击穿透 | 水獭透明区域必须穿透 |
| 可拖拽 | 用户可拖动水獭位置 |
| 动画 | 呼吸、眨眼、接住、抱住、潜水 |

### 状态表现

| 状态 | 水獭表现 |
| --- | --- |
| idle | 轻微呼吸，偶尔眨眼 |
| receiving | 伸手接住念头 |
| storing | 把念头抱进小窝 |
| has_many_thoughts | 抱着一堆小石头 |
| reviewing | 翻小石头 |
| quiet | 全屏时潜入水里，只露一点头 |
| error | 右键菜单出现小红点，不弹窗 |

## 9.2 快捷输入框

### 触发

默认快捷键：

```
Ctrl + Alt + Space
```

### 字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| content | text | 是 | 用户输入的念头 |
| source | enum | 是 | fixed = quick_input |
| created_at | datetime | 自动 | 创建时间 |

### 交互

1. 用户按 Ctrl + Alt + Space
2. 水獭头顶附近出现迷你输入框
3. 用户输入文字
4. 按 Enter 提交
5. 按 Esc 取消
6. 提交后输入框缩回水獭怀里
7. 水獭播放接住动画
8. 内容保存为 thought

### 约束
- 输入框不使用模态窗口。
- 输入框不抢占太多屏幕空间。
- 提交后不弹系统通知。
- 空内容不能提交。
- 超过 500 字时仍可保存，但面板中默认折叠显示。

## 9.3 拖拽输入

### 支持对象

| 对象 | 保存内容 |
| --- | --- |
| 文本 | 原始文本 |
| URL | URL 字符串 |
| 文件 | 文件名、文件路径、文件类型 |
| 图片 | 图片路径，不做 OCR |

### 交互

1. 用户拖拽文本 / 链接 / 文件到小水獭身上
2. 水獭进入 receiving 状态
3. 用户松手
4. 系统解析输入内容
5. 保存 thought
6. 水獭播放抱住动画

### 异常处理

| 场景 | 处理 |
| --- | --- |
| 拖入多个文件 | V1 只保存第一个，其他忽略 |
| 拖入空文本 | 不保存，水獭疑惑动画 |
| 文件路径不存在 | 仍保存路径，但标记 file_missing |
| 内容过长 | 保存完整内容，面板中截断显示 |

## 9.4 今日念头面板

### 打开方式

1. 右键水獭 → 今日念头

### 字段展示

| 字段 | 显示 |
| --- | --- |
| 时间 | HH:mm |
| 分类 | 图标显示 |
| 内容 | 最多两行，点击展开 |
| 来源 | 小图标 |
| 操作 | 复制 / 删除 / 标记已处理 |

### 交互

1. 点击念头 → 展开详情
2. 双击念头 → 复制内容
3. 点击复制按钮 → 复制到剪贴板
4. 点击删除按钮 → 二次确认后删除
5. 面板失去焦点 → 自动关闭，或用户可在设置中关闭该行为

## 9.5 设置窗口

### 字段

| 设置项 | 类型 | 默认值 |
| --- | --- | --- |
| 全局快捷键 | shortcut | Ctrl + Alt + Space |
| 开机自启 | boolean | false |
| 水獭尺寸 | number | 80 |
| 回顾时间 1 | time | 10:30 |
| 回顾时间 2 | time | 16:00 |
| 全屏静默 | boolean | true |
| 每日备份 | boolean | true |
| 数据目录 | path | 用户目录 / ThoughtOtter |
| 主题 | enum | system / light / dark |

# 10. 核心业务流程

## 10.1 快捷键记录流程
- 1. 用户按下全局快捷键
- 2. 应用检测当前是否已打开输入框
- 3. 如果没有，则在水獭附近显示输入框
- 4. 用户输入内容
- 5. 用户按 Enter
- 6. 前端校验内容非空
- 7. 创建 ThoughtCreateInput
- 8. ThoughtService 保存 thought
- 9. ClassificationService 分类
- 10. StorageService 写入 SQLite
- 11. OtterWindow 播放 receiving 动画
- 12. 输入框关闭

## 10.2 拖拽记录流程
- 1. 用户拖拽对象到水獭窗口
- 2. OtterWindow 触发 dragEnter
- 3. 判断对象类型
- 4. 如果支持，则水獭进入 receiving 状态
- 5. 用户 drop
- 6. DragParser 解析内容
- 7. ThoughtService 创建记录
- 8. StorageService 保存
- 9. OtterWindow 播放 storing 动画

## 10.3 今日回顾流程
- 1. 用户右键水獭
- 2. 点击“今日念头”
- 3. ThoughtService 查询今天 00:00 至当前时间的 thoughts
- 4. 按 created_at 倒序排序
- 5. 面板展示列表
- 6. 用户可以复制、删除、标记已处理
- 7. 面板关闭后不改变数据，除非用户主动操作

## 10.4 定时轻回顾流程
- 1. Scheduler 到达设定时间
- 2. SystemService 检查是否处于全屏模式
- 3. 如果全屏，则跳过本次回顾
- 4. 如果非全屏，查询今日未处理 thoughts
- 5. 最多取 4 条
- 6. 水獭播放伸懒腰动画
- 7. 显示非交互小气泡
- 8. 5 秒后气泡自动消失

# 11. 状态机

## 11.1 Thought 状态

| 状态 | 含义 |
| --- | --- |
| raw | 刚创建，未分类 |
| classified | 已完成基础分类 |
| reviewed | 用户已经看过 |
| copied | 用户复制过 |
| archived | 用户归档 |
| deleted | 用户删除，软删除 |
| error | 保存或处理异常 |

### 状态流转

1. raw → classified
2. classified → reviewed
3. reviewed → copied
4. classified → archived
5. reviewed → archived
6. 任意状态 → deleted
7. raw → error
8. error → classified

## 11.2 Otter 状态

| 状态 | 含义 |
| --- | --- |
| idle | 默认待机 |
| hover | 鼠标悬停 |
| input_open | 输入框打开 |
| receiving | 正在接收念头 |
| storing | 正在收进小窝 |
| reviewing | 正在展示回顾 |
| quiet | 全屏静默 |
| hidden | 用户临时隐藏 |
| error_hint | 有错误提示 |

### 状态流转

1. idle → hover
2. hover → idle
3. idle → input_open
4. input_open → receiving
5. receiving → storing
6. storing → idle
7. idle → reviewing
8. reviewing → idle
9. idle → quiet
10. quiet → idle
11. idle → hidden
12. hidden → idle
13. 任意状态 → error_hint
14. error_hint → idle

# 12. 数据库设计

V1 使用 SQLite。

## 12.1 thoughts 表

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | text | UUID |
| content | text | 念头原文 |
| content_preview | text | 截断预览 |
| category | text | todo / idea / question / note |
| source | text | quick_input / drag_text / drag_url / drag_file |
| status | text | raw / classified / reviewed / copied / archived / deleted / error |
| keywords | text | JSON 字符串，关键词数组 |
| file_path | text | 文件路径，仅文件类念头使用 |
| url | text | 链接，仅 URL 类念头使用 |
| created_at | text | ISO 时间 |
| updated_at | text | ISO 时间 |
| reviewed_at | text | 用户查看时间 |
| error_message | text | 错误信息 |
| metadata_json | text | 扩展字段 |

## 12.2 settings 表

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| key | text | 设置名 |
| value | text | 设置值 |
| updated_at | text | 更新时间 |

## 12.3 app_events 表

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | text | UUID |
| event_type | text | input_submitted / drag_received / backup_created 等 |
| payload_json | text | 事件内容 |
| created_at | text | 创建时间 |

## 12.4 backups 表

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | text | UUID |
| backup_path | text | 备份文件路径 |
| created_at | text | 备份时间 |
| status | text | success / failed |
| error_message | text | 错误信息 |

# 13. 本地接口设计

V1 没有 HTTP API，但需要清楚定义本地模块接口，方便 AI 生成代码。

## 13.1 创建念头

```
ThoughtService.create_thought(input: ThoughtCreateInput) -> Thought
```

请求结构：

```json
{
  "content": "明天把登录页的错误提示优化一下",
  "source": "quick_input",
  "file_path": null,
  "url": null,
  "metadata": {}
}
```

返回结构：

```json
{
  "id": "thought_001",
  "content": "明天把登录页的错误提示优化一下",
  "category": "todo",
  "source": "quick_input",
  "status": "classified",
  "keywords": ["明天", "登录页", "错误提示"],
  "created_at": "2026-06-09T10:30:00"
}
```

## 13.2 查询今日念头

```
ThoughtService.get_today_thoughts(include_deleted: bool = False) -> list[Thought]
```

返回：

```json
[
  {
    "id": "thought_001",
    "content": "明天把登录页的错误提示优化一下",
    "category": "todo",
    "source": "quick_input",
    "status": "classified",
    "created_at": "2026-06-09T10:30:00"
  }
]
```

## 13.3 删除念头

```
ThoughtService.delete_thought(thought_id: str) -> bool
```

说明：
- V1 使用软删除。
- 将 status 更新为 deleted。
- 不直接从数据库物理删除。

## 13.4 复制念头

```
ThoughtService.mark_copied(thought_id: str) -> Thought
```

说明：
- 复制动作由 UI 写入剪贴板。
- ThoughtService 只负责更新状态。

## 13.5 更新设置

```
SettingsService.update_setting(key: str, value: str) -> Setting
```

## 13.6 创建备份

```
BackupService.create_daily_backup() -> BackupResult
```

# 14. 服务间接口

V1 为单进程桌面应用，但建议按服务模块拆分。

| 服务 | 职责 |
| --- | --- |
| OtterWindow | 桌面水獭窗口、动画、拖拽 |
| QuickInputWindow | 快捷输入框 |
| ThoughtService | 念头业务逻辑 |
| ClassificationService | 分类与关键词提取 |
| StorageService | SQLite 读写 |
| SettingsService | 设置读写 |
| BackupService | 每日备份 |
| SchedulerService | 定时回顾 |
| SystemService | 全屏检测、开机自启 |
| LoggerService | 日志记录 |

## 14.1 服务调用关系

1. OtterWindow
2. ThoughtService
3. ClassificationService
4. StorageService
5. LoggerService
6. QuickInputWindow
7. ThoughtService
8. SchedulerService
9. SystemService
10. ThoughtService
11. OtterWindow
12. SettingsWindow
13. SettingsService
14. AppStartup
15. StorageService
16. SettingsService
17. BackupService
18. OtterWindow

# 15. OtterActionManifest 规范

本项目不是视频渲染系统，因此本节定义桌面水獭动画和 UI 行为的 Manifest，作为 UI 与业务逻辑之间的合同。

## 15.1 Manifest 示例

```json
{
  "action": "receive_thought",
  "thoughtId": "thought_001",
  "animation": "otter_receive_pebble",
  "durationMs": 900,
  "bubble": {
    "enabled": false,
    "text": null
  },
  "sound": {
    "enabled": false
  },
  "nextState": "idle"
}
```

## 15.2 支持的 action

| action | 动画 | 说明 |
| --- | --- | --- |
| idle | otter_breathe | 默认呼吸 |
| receive_thought | otter_receive_pebble | 接收念头 |
| store_thought | otter_put_into_nest | 收进小窝 |
| hover_preview | otter_peek | 悬停展示 |
| daily_review | otter_stretch_bubbles | 定时轻回顾 |
| quiet_mode | otter_dive | 全屏静默 |
| error_hint | otter_confused | 出错提示 |
| hidden | none | 临时隐藏 |

## 15.3 动画约束
- 所有动画必须低频。
- 禁止闪烁。
- 禁止高亮强提醒。
- 禁止声音。
- 单次接收动画不超过 1.2 秒。
- 空闲呼吸动画频率低于 1Hz。

# 16. AI 输出 JSON 规范

V1 不强依赖大模型。分类使用规则优先，但为了后续接入本地模型，先定义统一输出格式。

## 16.1 分类输出

```json
{
  "category": "todo",
  "confidence": 0.82,
  "keywords": ["登录页", "错误提示", "明天"],
  "time_hint": {
    "has_time": true,
    "raw_text": "明天",
    "parsed_time": null
  },
  "summary": "优化登录页错误提示"
}
```

## 16.2 category 枚举

| category | 含义 | 示例 |
| --- | --- | --- |
| todo | 待办 | “明天改登录页按钮” |
| idea | 灵感 | “可以把项目做成桌面宠物” |
| question | 问题 | “为什么接口返回 403？” |
| note | 随记 | “React useEffect 这里要复习” |

## 16.3 关键词规则
- 关键词最多 5 个。
- 优先提取名词、项目名、文件名、技术词。
- 不要生成过长关键词。
- 如果无法提取，返回空数组。

# 17. Prompt 规则

V1 默认不用联网大模型。如果后续使用本地 LLM 或本地小模型，必须遵守以下规则。

## 17.1 分类 Prompt 目标
- 你是一个本地离线的念头分类器。
- 你只需要把用户输入的一句话分类为 todo、idea、question、note。
- 你必须返回 JSON。
- 不要返回解释。
- 不要返回 Markdown。
- 不要编造用户没有输入的信息。

## 17.2 输入格式

```json
{
  "content": "下次重构一下这个配置读取逻辑",
  "source": "quick_input",
  "created_at": "2026-06-09T10:30:00"
}
```

## 17.3 输出格式

```json
{
  "category": "todo",
  "confidence": 0.8,
  "keywords": ["重构", "配置读取"],
  "summary": "重构配置读取逻辑"
}
```

## 17.4 禁止事项
- 禁止上传用户数据到云端。
- 禁止生成长篇解释。
- 禁止替用户做决策。
- 禁止自动删除念头。
- 禁止主动弹窗提示用户。

# 18. 错误处理与重试

## 18.1 错误场景

| 场景 | 处理 |
| --- | --- |
| 数据库写入失败 | 写日志，重试 2 次 |
| 重试仍失败 | 右键菜单显示红点 |
| 快捷键注册失败 | 启动后在设置页显示错误 |
| 拖拽解析失败 | 水獭疑惑动画，不保存 |
| 备份失败 | 写入 app_events，不打扰用户 |
| 全屏检测失败 | 默认不显示定时回顾 |
| 设置文件损坏 | 使用默认配置重新生成 |
| 数据库损坏 | 尝试读取最近备份 |

## 18.2 重试规则
- 数据库写入失败最多重试 2 次。
- 备份失败当天不再重复备份。
- 快捷键注册失败不反复重试，等待用户修改快捷键。
- 分类失败不影响保存，category 设置为 note。

## 18.3 用户可见错误

V1 坚持零打扰原则，因此错误不弹窗。

| 错误级别 | 用户可见方式 |
| --- | --- |
| 轻微错误 | 不显示，仅写日志 |
| 数据保存失败 | 右键菜单小红点 |
| 快捷键不可用 | 设置页显示提示 |
| 数据库不可用 | 启动时显示非模态错误页 |

# 19. 权限与安全

## 19.1 隐私原则
- 所有念头只保存在本地。
- 不联网。
- 不上传。
- 不创建账号。
- 不收集遥测数据。
- 不扫描用户文件。
- 拖入文件时只保存路径，不读取文件内容。

## 19.2 文件权限

| 文件 | 权限 |
| --- | --- |
| thought_otter.db | 本地读写 |
| config.json | 本地读写 |
| logs/app.log | 本地写入 |
| backups/ | 本地写入 |

## 19.3 数据目录

默认目录：

```
C:\Users\<username>\Documents\ThoughtOtter\
```

目录结构：

```
ThoughtOtter/
  ├── thought_otter.db
  ├── config.json
  ├── logs/
  │     └── app.log
  └── backups/
        ├── thought_otter_2026-06-09.db
        └── thought_otter_2026-06-10.db
```

# 20. 额度与成本控制

V1 是本地单机应用，没有云成本和用户额度。

## 20.1 本地资源限制

| 项目 | 限制 |
| --- | --- |
| 常驻内存 | 目标 ≤ 80MB |
| 空闲 CPU | 目标 ≤ 1% |
| 启动时间 | ≤ 3 秒 |
| 数据库大小 | V1 目标 ≤ 50MB |
| 日志保留 | 最近 7 天 |
| 备份保留 | 最近 7 次 |

## 20.2 性能原则
- 动画不能阻塞输入。
- 数据库写入不能卡住 UI。
- 分类失败不能影响保存。
- 定时回顾不能在全屏时触发。
- 所有后台任务都不能弹窗。

# 21. 日志与监控

V1 只做本地日志。

## 21.1 日志类型

| 类型 | 示例 |
| --- | --- |
| app_start | 应用启动 |
| thought_created | 创建念头 |
| thought_deleted | 删除念头 |
| shortcut_registered | 快捷键注册成功 |
| shortcut_failed | 快捷键注册失败 |
| backup_created | 备份成功 |
| backup_failed | 备份失败 |
| db_error | 数据库错误 |
| drag_received | 收到拖拽内容 |

## 21.2 日志格式

```json
{
  "timestamp": "2026-06-09T10:30:00",
  "level": "INFO",
  "event": "thought_created",
  "message": "Thought created successfully",
  "payload": {
    "thoughtId": "thought_001",
    "source": "quick_input",
    "category": "todo"
  }
}
```

## 21.3 日志限制
- 日志不记录完整 thought content。
- 日志最多记录 thoughtId、source、category。
- 避免用户隐私泄露。

# 22. 验收标准

## 22.1 功能验收

| 功能 | 验收标准 |
| --- | --- |
| 桌面水獭 | 应用启动后显示在桌面右下角 |
| 窗口置顶 | 水獭显示在普通窗口上方 |
| 点击穿透 | 透明区域不阻挡鼠标操作 |
| 拖拽移动 | 用户可拖动水獭改变位置 |
| 位置保存 | 关闭后重新打开仍在上次位置 |
| 快捷输入 | Ctrl + Alt + Space 可呼出输入框 |
| 提交念头 | 输入文字后 Enter 可保存 |
| 取消输入 | Esc 可关闭输入框且不保存 |
| 拖拽文本 | 拖拽文本到水獭可保存 |
| 拖拽文件 | 拖拽文件到水獭可保存文件路径 |
| 今日面板 | 右键可打开今日念头列表 |
| 复制念头 | 双击或按钮可复制念头内容 |
| 删除念头 | 可删除指定念头 |
| 悬停气泡 | 悬停 2 秒显示最新念头 |
| 定时回顾 | 到设定时间展示最多 4 条气泡 |
| 全屏静默 | 全屏时不显示气泡和定时回顾 |
| 本地保存 | 重启应用后数据仍存在 |
| 自动备份 | 每日首次启动创建备份 |
| 设置页 | 可修改快捷键和回顾时间 |

## 22.2 体验验收

| 项目 | 标准 |
| --- | --- |
| 输入不中断 | 不出现模态弹窗 |
| 视觉轻量 | 无闪烁、无声音 |
| 动画自然 | 接收动画 ≤ 1.2 秒 |
| 回顾克制 | 气泡自动消失 |
| 数据可控 | 用户可找到本地数据库和备份 |

# 23. 测试用例

## 用例 1：快捷键创建念头
- Given 应用已经启动
- When 用户按下 Ctrl + Alt + Space
- Then 输入框出现在小水獭附近
- When 用户输入“明天优化设置页”
- And 按下 Enter
- Then 输入框关闭
- And 小水獭播放接收动画
- And 数据库中新增一条 thought
- And category 为 todo 或 note

## 用例 2：空输入不保存
- Given 输入框已经打开
- When 用户不输入任何内容
- And 按下 Enter
- Then 不创建 thought
- And 输入框保持打开或关闭
- And 数据库记录数量不变

## 用例 3：Esc 取消输入
- Given 输入框已经打开
- When 用户输入“临时内容”
- And 按下 Esc
- Then 输入框关闭
- And 不创建 thought

## 用例 4：拖拽文件
- Given 应用已经启动
- When 用户拖拽一个文件到水獭身上
- Then 水獭进入 receiving 状态
- And 松手后保存文件路径
- And source 为 drag_file

## 用例 5：查看今日面板
- Given 今天已经创建 3 条 thoughts
- When 用户右键水獭
- And 点击“今日念头”
- Then 今日面板打开
- And 展示 3 条 thoughts
- And 按 created_at 倒序排列

## 用例 6：复制念头
- Given 今日面板中存在一条 thought
- When 用户点击复制按钮
- Then thought.content 被写入剪贴板
- And thought.status 更新为 copied

## 用例 7：全屏静默
- Given 用户正在全屏应用中
- When 到达定时回顾时间
- Then 不显示回顾气泡
- And 水獭进入 quiet 状态或保持基础动画

## 用例 8：重启后恢复
- Given 用户已经创建 thoughts
- And 移动水獭到新位置
- When 用户关闭应用并重新打开
- Then thoughts 仍可查询
- And 水獭出现在上次位置

# 24. 开发任务拆分

## Sprint 1：基础桌面应用
- 1. 初始化 Python 项目
- 2. 安装 PySide6
- 3. 创建主窗口 OtterWindow
- 4. 实现透明背景
- 5. 实现始终置顶
- 6. 加载水獭 idle 图片或 GIF
- 7. 实现窗口拖拽移动
- 8. 保存窗口位置到 config.json

## Sprint 2：本地数据层
- 1. 创建 ThoughtOtter 数据目录
- 2. 初始化 SQLite 数据库
- 3. 创建 thoughts 表
- 4. 创建 settings 表
- 5. 实现 StorageService
- 6. 实现 ThoughtService.create_thought
- 7. 实现 ThoughtService.get_today_thoughts
- 8. 添加基础 pytest

## Sprint 3：快捷键输入
- 1. 注册全局快捷键 Ctrl + Alt + Space
- 2. 创建 QuickInputWindow
- 3. 输入框定位到水獭附近
- 4. Enter 提交
- 5. Esc 取消
- 6. 提交后调用 ThoughtService
- 7. 播放接收动画

## Sprint 4：拖拽输入
- 1. OtterWindow 支持 dragEnterEvent
- 2. 判断拖拽对象类型
- 3. 支持文本拖入
- 4. 支持 URL 拖入
- 5. 支持文件拖入
- 6. 保存 source 和 metadata
- 7. 拖入成功播放动画

## Sprint 5：今日面板
- 1. 创建右键菜单
- 2. 创建 TodayPanel
- 3. 查询今日 thoughts
- 4. 列表展示时间、分类、内容
- 5. 实现复制功能
- 6. 实现软删除功能
- 7. 面板失焦自动关闭

## Sprint 6：分类与关键词
- 1. 实现 ClassificationService
- 2. 添加 todo 规则
- 3. 添加 question 规则
- 4. 添加 idea 规则
- 5. 默认 note
- 6. 提取简单关键词
- 7. 保存 category 和 keywords

## Sprint 7：轻量回顾与全屏静默
- 1. 实现 SchedulerService
- 2. 读取回顾时间设置
- 3. 查询今日未处理 thoughts
- 4. 实现悬停 2 秒气泡
- 5. 实现定时回顾气泡
- 6. 实现全屏检测
- 7. 全屏时跳过回顾

## Sprint 8：设置、备份、打包
- 1. 创建 SettingsWindow
- 2. 修改快捷键
- 3. 修改回顾时间
- 4. 设置开机自启
- 5. 实现每日备份
- 6. 实现日志轮转
- 7. 使用 PyInstaller 打包
- 8. 在 Windows 10 / 11 测试

# 25. 暂不实现功能

| 功能 | 计划版本 |
| --- | --- |
| 语音输入 | V2 |
| OCR 图片识别 | V2 |
| 本地大模型总结 | V2 |
| Markdown 导出 | V1.1 |
| Obsidian 导出 | V1.1 |
| 搜索面板 | V1.1 |
| 多动物皮肤 | V2 |
| 水獭成长系统 | V2 |
| 云同步 | V3 |
| 手机端同步 | V3 |
| 团队协作 | 不确定 |

# 26. 后续版本规划

## V1.1：更适合个人项目管理
- 1. 增加搜索功能
- 2. 增加按分类筛选
- 3. 增加 Markdown 导出
- 4. 增加“今天总结”
- 5. 增加“项目相关念头”标记
- 6. 增加 Obsidian / Logseq 友好导出

## V2.0：更聪明的小水獭
- 1. 本地 AI 总结今日念头
- 2. 自动发现重复主题
- 3. 把多条相关念头合并成项目清单
- 4. 支持语音输入
- 5. 支持 OCR 图片路径识别
- 6. 支持更多水獭动作

## V3.0：跨设备与生态
- 1. 可选云同步
- 2. 手机端快速记录
- 3. 浏览器插件
- 4. VS Code 插件
- 5. 多设备同步
- 6. 可选端到端加密

# 附录 A：水獭世界观命名

| 产品概念 | 水獭表达 |
| --- | --- |
| 记录念头 | 递给小水獭 |
| 保存念头 | 收进小窝 |
| 临时想法 | 小石头 |
| 重要想法 | 发光小石头 |
| 待办 | 贝壳 |
| 问题 | 问号贝壳 |
| 灵感 | 星星石头 |
| 今日面板 | 翻翻小窝 |
| 分类 | 搓一搓 |
| 定时回顾 | 小水獭吐泡泡 |
| 全屏静默 | 小水獭潜水 |

# 附录 B：默认分类规则

## todo

命中以下词汇时优先分类为 todo：

```
要、记得、待办、明天、下周、之后、完成、修改、优化、修复、提交、检查、提醒
```

## question

命中以下词汇时优先分类为 question：

```
为什么、怎么、如何、是否、报错、问题、bug、原因、403、404、失败
```

## idea

命中以下词汇时优先分类为 idea：

```
灵感、想法、可以做成、也许、试试、方案、脑洞、功能、设计
```

## note

默认分类。无法判断时全部进入 note。

# 附录 C：V1 最小可运行版本定义

如果需要进一步砍范围，最小可运行版本只做以下内容：
- 1. 桌面显示小水獭
- 2. 全局快捷键输入文字
- 3. Enter 保存到 SQLite
- 4. 右键查看今日念头
- 5. 重启后数据仍存在

只要这 5 件事跑通，Thought Otter 就已经具备原型价值。
