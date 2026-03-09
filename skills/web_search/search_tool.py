import os
from tavily import TavilyClient
from pydantic_ai import RunContext  # 必须导入这个

# 第一个参数必须是 ctx: RunContext，即使你函数体内没用到它
def run_web_search(ctx: RunContext, query: str) -> str:
    """执行联网搜索"""
    client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))
    print(f"🔍 正在检索: {query}")
    result = client.search(query=query, search_depth="basic")
    return str(result.get('results', []))