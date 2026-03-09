"use client";

import { useState, useEffect } from "react";
import { Cpu, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AgentDrawer from "@/components/AgentDrawer";

type SkillSummary = {
  id: string;
  name: string;
  description: string;
  path: string;
};

export default function AgentLab() {
  const [skills, setSkills] = useState<SkillSummary[]>([]);
  const [enabledSkills, setEnabledSkills] = useState<Set<string>>(new Set());
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/skills")
      .then((res) => res.json())
      .then((data: SkillSummary[]) => {
        if (!cancelled) setSkills(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleSkill = (id: string) => {
    setEnabledSkills((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const enabledList = skills.filter((s) => enabledSkills.has(s.id));

  return (
    <main className="min-h-screen bg-[#020617] text-slate-100 p-8">
      {/* 顶部状态栏 */}
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
            Agent Lab <span className="text-sm font-mono text-slate-500 ml-2">v1.0</span>
          </h1>
          <p className="text-slate-400 mt-2">智能体技能管理与测试中心</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-slate-900/80 border border-slate-800 px-4 py-2 rounded-lg text-sm">
            <span className="text-purple-400">已激活技能:</span> {enabledSkills.size}
          </div>
        </div>
      </header>

      {/* 技能网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {skills.map((skill) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              key={skill.id}
              className={`p-6 rounded-2xl border transition-all duration-300 ${
                enabledSkills.has(skill.id)
                  ? "border-purple-500 bg-purple-500/5 shadow-[0_0_20px_rgba(168,85,247,0.1)]"
                  : "border-slate-800 bg-slate-900/40"
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-slate-800 rounded-lg">
                  <Cpu className="w-6 h-6 text-purple-400" />
                </div>
                <button
                  type="button"
                  onClick={() => toggleSkill(skill.id)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    enabledSkills.has(skill.id) ? "bg-purple-600" : "bg-slate-700"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                      enabledSkills.has(skill.id) ? "left-7" : "left-1"
                    }`}
                  />
                </button>
              </div>
              <h3 className="text-xl font-bold mb-2">{skill.name}</h3>
              <p className="text-slate-400 text-sm line-clamp-3 mb-4 h-15">
                {skill.description || "No description provided."}
              </p>
              <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
                ID: {skill.id}
              </div>
              <div className="text-[10px] font-mono text-slate-600 truncate mt-1">
                {skill.path}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {skills.length === 0 && (
        <div className="text-slate-500 text-sm border border-dashed border-slate-700 rounded-xl p-6 text-center">
          暂无技能。在 <code className="text-slate-300">skills/</code> 下添加带{" "}
          <code className="text-slate-300">skill.md</code> 的子目录即可在此展示。
        </div>
      )}

      {/* 右侧悬浮测试按钮 */}
      <button
        type="button"
        onClick={() => setIsPanelOpen(true)}
        className="fixed bottom-10 right-10 p-5 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:scale-110 transition-transform flex items-center gap-2 group z-30"
      >
        <MessageSquare className="w-6 h-6 shrink-0" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 font-bold whitespace-nowrap">
          测试 Agent
        </span>
      </button>

      <AgentDrawer
        open={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        enabledSkillNames={enabledList.map((s) => s.name)}
        selectedSkillIds={Array.from(enabledSkills)}
      />
    </main>
  );
}
