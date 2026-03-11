<img width="1145" height="913" alt="image" src="https://github.com/user-attachments/assets/8e966fc8-aa7f-4601-bbe0-6c7aabc39efa" />
<img width="1144" height="910" alt="image" src="https://github.com/user-attachments/assets/bd743c0f-30e5-400f-b976-7cbe245fead1" />

WHY：项目驱动力与核心痛点
作为一名在金融风控领域深耕的 BA，我始终在寻找一种能够平衡“开发灵活性”与“逻辑透明度”的 AI 协作方式。
核心痛点：
黑盒焦虑：主流 Agent 平台（如 Coze, Dify）虽强，但在处理多技能调度时，底层逻辑不够透明，难以进行精细化调试。
开发路径分歧：传统的“自上而下”设计预设了过多场景。我需要一种**“自下而上”**的构建方式，从原子级需求出发，逐步编织协作网。
基础设施限制：在特定网络环境下，需要一个极度轻量、可随时迁移、且能完美绕过网络干扰的私有实验场。

WHAT：项目定义与预期效果
Agent Lab 是一个基于 Pydantic AI 框架构建的、可扩展的 AI Agent 底层实验平台，旨在作为后续复杂项目（如 OpenClaw）的试验田。
核心功能：
文件夹即技能（Folder-as-a-Skill）：
魂（System Prompt）：.md 文件定义认知边界。
肉（Tool Logic）：.py 文件定义具象执行能力。
动态渲染 Dashboard：前端实时扫描后端挂载技能，支持能力“热插拔”。
确定性链路：通过 Web Search 技能实测，实现从“深度检索”到“逻辑推理”的完整闭环。
---

本版本的体验链接：fyjm-agent-site-2026.vercel.app


## 功能概览

### 技能扫描接口 `/api/skills`

- 遍历项目根目录下的 `skills/` 文件夹。
- 对每个子文件夹读取 `skill.md`，解析：
  - 一级标题 `# xxx` 作为 **name**
  - 后续内容作为 **description**
- 返回统一结构：

```ts
{
  id: string;          // 子目录名，如 "code_reader"
  name: string;        // skill.md 一级标题
  description: string; // skill.md 后续 markdown 内容
  path: string;        // 相对路径，如 "skills/code_reader/skill.md"
}[]
```

> 目录不存在、单个 skill 解析失败等异常会被安全处理，接口始终返回数组，不会让前端崩。

### Dashboard 页面 `/`（`app/page.tsx`）

#### 布局与视觉

- **深色科技感**：整体 `bg-slate-950`，大量使用 `from-purple-500 to-blue-500` 渐变光效。
- **左侧窄边栏**：
  - 顶部 Logo + “Agent Lab / Control Center” 文案。
  - 导航项：`Dashboard` / `Settings`。
- **顶部统计区域**：
  - `Total Skills`：扫描到的技能总数。
  - `Active Agents`：当前被标记为启用的技能数量。
  - `System Health`：启用技能占比的百分比（无技能时为 100%）。
- **技能卡片 Grid**：
  - 响应式 `grid`（`sm:grid-cols-2` / `xl:grid-cols-3` / `2xl:grid-cols-4`）。
  - 每张卡片：半透明深色背景 + 边框阴影 + 紫蓝渐变高亮。
  - 展示：技能名称、路径、描述文案，及一个 `Enable/Disable` 开关。

#### 数据联动

- 页面加载时调用 `/api/skills` 获取技能列表。
- `enabledMap` 维护每个技能是否启用：
  - 默认全部启用。
  - 卡片上的开关实时更新该状态。
- 顶部统计卡实时基于 `skills` 与 `enabledMap` 计算并展示数据。

---

## Agent 测试面板（右侧 Drawer）

### 触发方式

- 页面右下角有一个 **带渐变光晕的浮动按钮**（`Test Agent`）。
- 点击后，从右侧滑出一个 **Agent Sandbox 抽屉面板**。

### 配置区：技能选择

- 抽屉顶部为一个配置区：
  - 标题：`Agent Sandbox / 测试面板`。
  - 说明文案：描述如何选择技能参与本次对话。
- 下方展示当前所有 **已启用技能** 的复选标签：
  - 每个技能是一个带边框和渐变高亮的 `chip`。
  - 支持选择 / 取消选择技能，默认勾选所有已启用技能。
  - 右上角有「关闭」按钮可收起抽屉。

### 对话流

- 中部为 **自动滚动的聊天区域**：
  - 用户消息：
    - 右对齐，渐变色气泡（紫 → 蓝），圆角，短文本风格。
  - Agent 消息：
    - 左对齐，深色等宽字体气泡，更适合展示代码/结构化文本（为后续接入真实代码高亮预留空间）。
- 若无任何消息，会展示一条浅色提示，引导用户输入指令开始测试。

### 输入框

- 抽屉底部为一个 **精致的深色输入条**：
  - 左侧是文本输入框，支持多行（Shift+Enter 换行）。
  - 右侧是渐变按钮（`发送`）。
  - 回车（Enter）默认发送当前内容。
- 发送逻辑（当前为模拟）：
  - 将用户输入追加到消息列表（user 气泡）。
  - 根据当前 **选中的技能集合**，构造一条带有技能信息的 Agent 回复。
  - 未来可以在这里对接后端 Agent 接口，将 `input + 选中技能列表` 发送给真实 Agent。

---

## 目录结构（核心部分）

```text
agent1/
├─ main.py              # Python 入口，负责加载 skills 并构建 Agent
├─ skills/              # 每个技能一个子目录，含 skill.md 和逻辑代码
│  ├─ code_reader/
│  │  ├─ skill.md
│  │  └─ reader_tool.py
│  └─ web_search/
│     ├─ skill.md
│     └─ search_tool.py
├─ app/
│  ├─ layout.tsx        # Next.js 根布局，加载全局样式
│  ├─ page.tsx          # Dashboard + Agent 测试面板
│  └─ api/
│     └─ skills/
│        └─ route.ts    # 解析 skills 目录并返回技能摘要
├─ app/globals.css      # Tailwind 全局样式（含深色背景 / 字体）
├─ next.config.mjs      # Next.js 配置（App Router）
├─ tailwind.config.ts   # Tailwind 配置
├─ postcss.config.mjs   # PostCSS 配置（tailwind + autoprefixer）
├─ tsconfig.json        # TypeScript 配置
└─ package.json         # 前端依赖与脚本
```



