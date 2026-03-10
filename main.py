import os
import asyncio
import importlib
import inspect
from pathlib import Path
from typing import List, Optional
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIChatModel

# 1. 初始化环境与配置
load_dotenv()
os.environ["OPENAI_BASE_URL"] = "https://api.deepseek.com/v1"
os.environ["OPENAI_API_KEY"] = os.getenv("DEEPSEEK_API_KEY")

app = FastAPI(title="Agent Lab Backend")

# 跨域配置：允许 Vercel 前端访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 定义前端请求的数据结构
class ChatRequest(BaseModel):
    message: str
    skills: Optional[List[str]] = None

# 2. 自动化加载引擎 (保持你的核心逻辑)
def load_skills_and_register(agent_instance):
    skills_path = Path("skills")
    all_knowledge = []
    
    if not skills_path.exists():
        return "暂无外部技能加载。"

    for skill_dir in skills_path.iterdir():
        if skill_dir.is_dir():
            # A. 加载 skill.md (注入 Prompt)
            md_file = skill_dir / "skill.md"
            if md_file.exists():
                all_knowledge.append(f"### {skill_dir.name} 规范:\n{md_file.read_text(encoding='utf-8')}")

            # B. 动态注册逻辑工具 (logic.py)
            logic_files = list(skill_dir.glob("logic.py")) + list(skill_dir.glob("*_tool.py"))
            for logic_file in logic_files:
                module_path = f"skills.{skill_dir.name}.{logic_file.stem}"
                try:
                    module = importlib.import_module(module_path)
                    for name, func in inspect.getmembers(module, inspect.isfunction):
                        if not name.startswith("_"):
                            agent_instance.tool(func)
                            print(f"✅ 自动注册技能: {skill_dir.name} -> {name}")
                except Exception as e:
                    print(f"❌ 加载技能失败 {module_path}: {e}")
    return "\n\n".join(all_knowledge)

# 3. 初始化 Agent
model = OpenAIChatModel('deepseek-chat')
agent = Agent(model)

# 执行装配并注入系统提示词
knowledge = load_skills_and_register(agent)
agent.system_prompt = (
    "你是一个高度模块化的 AI 助手。你拥有以下技能规范，请严格遵守：\n\n"
    f"{knowledge}\n\n"
    "当你需要执行任务时，请根据规范调用相应的工具。请始终用中文回答。"
)

# --- 接口定义 ---

@app.get("/")
def read_root():
    return {"status": "Agent Lab Backend is Running", "skills_loaded": True}

@app.post("/chat")
@app.post("/chat/") # 兼容处理 Vercel 可能带上的末尾斜杠
async def chat_endpoint(request: ChatRequest):
    """
    接收来自 Vercel 前端的 POST 请求
    """
    try:
        # 运行 Agent 处理用户消息
        result = await agent.run(request.message)
        
        # Pydantic AI 的结果通常在 result.data 中
        response_text = result.data if hasattr(result, 'data') else str(result)
        
        return {"response": response_text}
    except Exception as e:
        print(f"❌ 运行报错: {e}")
        return {"response": f"Agent 实验室内部错误: {str(e)}"}, 500

# 4. 启动逻辑
if __name__ == "__main__":
    import uvicorn
    # Render 等平台会自动设置 PORT 环境变量
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
