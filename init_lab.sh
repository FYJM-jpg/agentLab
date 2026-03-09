#!/bin/bash

# 1. 颜色定义，让输出更酷炫
GREEN='\033[0.32m'
BLUE='\033[0.34m'
PURPLE='\033[0.35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🚀 开始构建 Agent Lab 酷炫前端界面...${NC}"

# 2. 初始化 Next.js 项目 (使用当前目录 .)
# 自动回答：Yes(TypeScript), Yes(ESLint), Yes(Tailwind), No(src/), Yes(App Router), No(import alias)
echo -e "${BLUE}📦 正在运行 Next.js 初始化程序...${NC}"
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm --skip-install

# 3. 安装资深开发必备的 UI 库和动画库
echo -e "${BLUE}✨ 安装全栈开发利器 (shadcn/ui 相关依赖 & framer-motion)...${NC}"
npm install lucide-react framer-motion clsx tailwind-merge

# 4. 创建基础目录结构 (符合你的 agent_lab 规范)
echo -e "${BLUE}📂 正在对齐目录结构...${NC}"
mkdir -p components/ui
mkdir -p app/api/skills
mkdir -p app/api/chat
mkdir -p lib

# 5. 提示下一步
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}✅ 前端基础架构已搭建完毕！${NC}"
echo -e "${PURPLE}接下来，你可以直接在 Cursor 中使用我给你的提示词：${NC}"
echo -e "1. ${BLUE}提示词 1${NC}: 解析 skills 文件夹并生成 API。"
echo -e "2. ${BLUE}提示词 2${NC}: 设计深色系 Dashboard 界面。"
echo -e "${GREEN}=========================================${NC}"