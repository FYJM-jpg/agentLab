import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

type ChatBody = {
  message: string;
  selectedSkills: string[];
};

type SkillContent = {
  id: string;
  name: string;
  content: string;
};

function getSkillsRoot(): string {
  return path.join(process.cwd(), "skills");
}

function parseSkillMarkdown(raw: string): { name: string; content: string } {
  const normalized = raw
    .replace(/^\uFEFF/, "")
    .replace(/\r\n|\r/g, "\n")
    .trim();
  const firstLineMatch = normalized.match(/^#\s+(.+?)(?:\n|$)/);
  const name = firstLineMatch ? firstLineMatch[1].trim() : "未命名技能";
  const content = firstLineMatch
    ? normalized.slice(firstLineMatch[0].length).trim()
    : normalized;
  return { name, content };
}

async function loadSkillsForPrompt(
  skillsRoot: string,
  selectedSkills: string[]
): Promise<SkillContent[]> {
  const result: SkillContent[] = [];
  for (const id of selectedSkills) {
    const mdPath = path.join(skillsRoot, id, "skill.md");
    try {
      const raw = await fs.readFile(mdPath, "utf8");
      const { name, content } = parseSkillMarkdown(raw);
      result.push({ id, name, content });
    } catch {
      // 忽略单个技能读取失败
    }
  }
  return result;
}

function buildSystemPrompt(skills: SkillContent[]): string {
  if (skills.length === 0) {
    return "你是智能助手，根据用户输入友好回复。";
  }
  const parts = skills.map(
    (s) => `## 技能：${s.name}\n\n${s.content}`
  );
  return `你是一个具备以下技能的 Agent。请严格按各技能规范回答；若用户请求涉及某技能，请遵循该技能的描述与约束。\n\n${parts.join("\n\n---\n\n")}`;
}

function buildAgentLogLines(skills: SkillContent[]): string {
  return skills
    .map((s) => `[Agent 正在使用 ${s.name}]`)
    .join("\n");
}

export async function POST(request: Request) {
  try {
    const body: ChatBody = await request.json();
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const selectedSkills = Array.isArray(body.selectedSkills)
      ? body.selectedSkills.filter((s) => typeof s === "string")
      : [];

    if (!message) {
      return NextResponse.json(
        { reply: "请输入消息。" },
        { status: 400 }
      );
    }

    const skillsRoot = getSkillsRoot();
    const skills = await loadSkillsForPrompt(skillsRoot, selectedSkills);
    const systemPrompt = buildSystemPrompt(skills);

    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
    const baseUrl =
      process.env.OPENAI_BASE_URL || "https://api.deepseek.com/v1";
    const model = process.env.CHAT_MODEL || "deepseek-chat";

    if (!apiKey) {
      return NextResponse.json(
        {
          reply:
            "未配置 DEEPSEEK_API_KEY 或 OPENAI_API_KEY，请在环境变量中设置。"
        },
        { status: 503 }
      );
    }

    const chatUrl = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
    const res = await fetch(chatUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        max_tokens: 2048
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("LLM API error:", res.status, errText);
      return NextResponse.json(
        {
          reply: `调用 AI 接口失败（${res.status}），请检查密钥与网络。`
        },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const aiContent =
      data.choices?.[0]?.message?.content?.trim() || "（无回复内容）";

    const logLines = buildAgentLogLines(skills);
    const reply =
      logLines.length > 0
        ? `${logLines}\n\n${aiContent}`
        : aiContent;

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("chat API error:", error);
    return NextResponse.json(
      { reply: "请求处理失败，请重试。" },
      { status: 500 }
    );
  }
}
