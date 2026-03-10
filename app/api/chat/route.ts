import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, selectedSkills } = body;

    // 1. 获取你的 Render 后端地址（确保 Vercel 环境变量已填）
    const RENDER_BACKEND = process.env.NEXT_PUBLIC_API_URL || "https://agentlab-l8sa.onrender.com";

    // 2. 将请求转发给你的 Python Agent
    // 注意：这里的接口路径 /chat 要对应你 FastAPI 里的定义
    const res = await fetch(`${RENDER_BACKEND}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
        skills: selectedSkills // 把前端选中的技能传给后端
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Render Error:", errText);
      return NextResponse.json(
        { reply: `后端 Agent 暂时离线 (${res.status})，请稍后再试。` },
        { status: 502 }
      );
    }

    const data = await res.json();
    
    // 3. 解析 Python 返回的结果
    // 如果你 FastAPI 返回的是 {"response": "..."}, 就取 data.response
    const aiReply = data.response || data.reply || "Agent 思考中，暂无文字回复";

    return NextResponse.json({ reply: aiReply });

  } catch (error) {
    console.error("Vercel Router Error:", error);
    return NextResponse.json(
      { reply: "连接 Agent 实验室失败，请检查网络或后端状态。" },
      { status: 500 }
    );
  }
}