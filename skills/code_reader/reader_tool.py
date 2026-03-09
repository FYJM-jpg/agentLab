import os
from pathlib import Path
from pydantic_ai import RunContext

def read_local_file(ctx: RunContext, file_path: str) -> str:

    """
    读取本地文件内容的工具。
    """
    # 安全性检查：禁止读取敏感文件
    sensitive_files = ['.env', 'secrets.json', '.git']
    path = Path(file_path)
    
    if any(s in path.name for s in sensitive_files):
        return f"❌ 错误：处于安全原因，禁止访问文件 '{file_path}'。"

    if not path.exists():
        return f"❌ 错误：文件 '{file_path}' 不存在。"

    try:
        content = path.read_text(encoding='utf-8')
        # 简单处理超大文件
        lines = content.splitlines()
        if len(lines) > 500:
            content = "\n".join(lines[:500]) + "\n\n...(内容过多，仅显示前 500 行)..."
            
        return f"--- 文件路径: {file_path} ---\n```python\n{content}\n```"
    except Exception as e:
        return f"❌ 读取文件时发生错误: {str(e)}"