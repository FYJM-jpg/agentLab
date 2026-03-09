import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { existsSync, readFileSync } from "fs";
import { fileURLToPath } from "url";

export const runtime = "nodejs";

type SkillSummary = {
  id: string;
  name: string;
  description: string;
  path: string;
};

const PROJECT_NAME = "agent-lab-next";

/** 通过 package.json 的 name 定位本项目根，返回 skills 目录（避免读到错误目录的空文件） */
function getSkillsRoot(): string {
  const seen = new Set<string>();
  const candidates: string[] = [];
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    ["../../..", "../../../../", "../../../../../", "../../../../../../"].forEach((up) => {
      const r = path.resolve(__dirname, up);
      if (!seen.has(r)) {
        seen.add(r);
        candidates.push(r);
      }
    });
  } catch {
    // ignore
  }
  let dir = path.resolve(process.cwd());
  for (let i = 0; i < 12; i++) {
    if (!seen.has(dir)) {
      seen.add(dir);
      candidates.push(dir);
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  if (process.env.PWD) {
    const pwd = path.resolve(process.env.PWD);
    if (!seen.has(pwd)) candidates.push(pwd);
  }

  for (const root of candidates) {
    const pkgPath = path.join(root, "package.json");
    const skillsDir = path.join(root, "skills");
    if (!existsSync(pkgPath) || !existsSync(skillsDir)) continue;
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
      if (pkg && pkg.name === PROJECT_NAME) return skillsDir;
    } catch {
      // ignore
    }
  }
  return path.join(process.cwd(), "skills");
}

function parseSkillMarkdown(content: string): { name: string; description: string } {
  const normalized = content
    .replace(/^\uFEFF/, "")
    .replace(/\r\n|\r/g, "\n")
    .trim();
  const firstLineMatch = normalized.match(/^#\s+(.+?)(?:\n|$)/);
  const name = firstLineMatch ? firstLineMatch[1].trim() : "未命名技能";
  const description = firstLineMatch
    ? normalized.slice(firstLineMatch[0].length).trim()
    : normalized;
  return { name, description };
}

export async function GET(request: Request) {
  const debug = new URL(request.url).searchParams.get("debug") === "1";
  try {
    const skillsRoot = getSkillsRoot();
    const stats = await fs.stat(skillsRoot).catch(() => null);

    if (!stats || !stats.isDirectory()) {
      return NextResponse.json(debug ? { skills: [], _debug: { skillsRoot, error: "skills dir not found" } } : []);
    }

    const entries = await fs.readdir(skillsRoot, { withFileTypes: true });
    const result: SkillSummary[] = [];
    let firstContentLength = 0;
    let firstContentPreview = "";

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const dirName = entry.name;
      const mdPath = path.join(skillsRoot, dirName, "skill.md");
      const mdStats = await fs.stat(mdPath).catch(() => null);

      if (!mdStats || !mdStats.isFile()) continue;

      try {
        let content = await fs.readFile(mdPath, "utf8");
        if (!content || content.trim().length === 0) {
          try {
            content = readFileSync(mdPath, "utf8");
          } catch {
            // ignore
          }
        }
        if (result.length === 0) {
          firstContentLength = content.length;
          firstContentPreview = content.slice(0, 120).replace(/\s/g, " ");
        }
        if (!content || content.trim().length === 0) {
          const cwdPath = path.join(process.cwd(), "skills", dirName, "skill.md");
          if (cwdPath !== mdPath) {
            const fallback = await fs.readFile(cwdPath, "utf8").catch(() => "");
            if (fallback && fallback.trim().length > 0) content = fallback;
          }
          if (!content || content.trim().length === 0) {
            try {
              content = readFileSync(cwdPath, "utf8");
            } catch {
              // ignore
            }
          }
        }
        const { name, description } = parseSkillMarkdown(content);

        result.push({
          id: dirName,
          name,
          description,
          path: `skills/${dirName}/skill.md`
        });
      } catch (error) {
        console.error(`读取或解析技能失败: ${mdPath}`, error);
        continue;
      }
    }

    const _debugPayload: Record<string, unknown> = {
      skillsRoot,
      processCwd: process.cwd(),
      firstContentLength,
      firstContentPreview
    };
    if (firstContentLength === 0) {
      _debugPayload.hint = "skill.md 在磁盘上为空。请在编辑器中保存该文件 (Cmd+S / Ctrl+S)，再刷新。";
    }
    const body = debug ? { skills: result, _debug: _debugPayload } : result;
    return NextResponse.json(body);
  } catch (error) {
    console.error("遍历 skills 目录失败:", error);
    return NextResponse.json(debug ? { skills: [], _debug: { error: String(error) } } : []);
  }
}

