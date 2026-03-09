import os
import asyncio
import importlib
import inspect
from pathlib import Path
from dotenv import load_dotenv
from pydantic_ai import Agent, RunContext
from pydantic_ai.models.openai import OpenAIChatModel

# 1. 初始化环境
load_dotenv()

# 配置 DeepSeek
os.environ["OPENAI_BASE_URL"] = "https://api.deepseek.com/v1"
os.environ["OPENAI_API_KEY"] = os.getenv("DEEPSEEK_API_KEY")

# 2. 自动化加载引擎
def load_skills_and_register(agent_instance):
    """
    遍历 skills 目录，读取 skill.md 注入 Prompt，并动态注册 logic.py 中的函数作为工具。
    """
    skills_path = Path("skills")
    all_knowledge = []

    for skill_dir in skills_path.iterdir():
        if skill_dir.is_dir():
            # A. 读取魂魄 (skill.md)
            md_file = skill_dir / "skill.md"
            if md_file.exists():
                all_knowledge.append(f"### {skill_dir.name} 规范:\n{md_file.read_text(encoding='utf-8')}")

            # B. 注入肌肉 (自动注册 logic.py 中的工具)
            # 兼容你的命名，尝试寻找 logic.py 或以 _tool.py 结尾的文件
            logic_files = list(skill_dir.glob("logic.py")) + list(skill_dir.glob("*_tool.py"))
            
            for logic_file in logic_files:
                # 转换路径为模块格式，例如 skills.web_search.search_tool
                module_path = f"skills.{skill_dir.name}.{logic_file.stem}"
                try:
                    module = importlib.import_module(module_path)
                    # 遍历模块中所有非私有函数
                    for name, func in inspect.getmembers(module, inspect.isfunction):
                        if not name.startswith("_"):
                            agent_instance.tool(func)
                            print(f"✅ 自动注册技能: {skill_dir.name} -> {name}")
                except Exception as e:
                    print(f"❌ 加载技能失败 {module_path}: {e}")

    return "\n\n".join(all_knowledge)

# 3. 预初始化 Agent (先给个空的，后面通过注入完善)
model = OpenAIChatModel('deepseek-chat')
agent = Agent(model)

# 4. 执行自动化装配
knowledge = load_skills_and_register(agent)

# 5. 更新 Agent 的系统提示词
agent.system_prompt = (
    "你是一个高度模块化的 AI 助手。你拥有以下技能规范，请严格遵守：\n\n"
    f"{knowledge}\n\n"
    "当你需要执行任务时，请根据规范调用相应的工具。请始终用中文回答。"
)

# 6. 唯一的主运行入口
async def main():
    print("\n🚀 Agent Lab 启动完毕，大脑已接通技能库。")
    print("------------------------------------------")
    
    # 这里可以测试任何你已有的技能
    # 比如测试 code_reader
    test_task = """
        1. 先读取 skills/web_search/skill.md 看看搜索技能的规范。
        2. 然后搜索 '2026年3月 AI Agent 框架最新排名'。
        3. 结合你读取到的规范和搜索结果，给出一份简短报告。
        """
    
    try:
        result = await agent.run(test_task)
        print("\n" + "="*50)
        print("🤖 Agent 回复:")
        print("-" * 50)
        # 使用万能兼容打印
        print(getattr(result, 'data', str(result)))
        print("="*50)
    except Exception as e:
        print(f"❌ 运行报错: {e}")

if __name__ == "__main__":
    asyncio.run(main())