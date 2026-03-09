"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X } from "lucide-react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type AgentDrawerProps = {
  open: boolean;
  onClose: () => void;
  enabledSkillNames: string[];
  selectedSkillIds: string[];
};

export default function AgentDrawer({
  open,
  onClose,
  enabledSkillNames,
  selectedSkillIds
}: AgentDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          selectedSkills: selectedSkillIds
        })
      });
      const data = await response.json();
      const replyContent = response.ok ? data.reply : "请求失败，请重试。";
      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        role: "assistant",
        content: replyContent
      };
      setMessages((prev) => [...prev, agentMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `agent-${Date.now()}`,
          role: "assistant",
          content: "网络错误，请检查连接后重试。"
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md flex flex-col bg-slate-950 border-l border-slate-800 shadow-[0_0_60px_rgba(15,23,42,0.9)]"
          >
            {/* 头部：当前加载技能 */}
            <div className="shrink-0 px-5 py-4 border-b border-slate-800 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  测试 Agent
                </p>
                <p className="mt-1 text-sm text-slate-200">
                  当前加载技能：
                  <span className="text-purple-300 ml-1">
                    {enabledSkillNames.length > 0
                      ? enabledSkillNames.join("、")
                      : "暂无"}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 p-1.5 rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition"
                aria-label="关闭"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 聊天记录区域 */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0"
            >
              {messages.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-8">
                  发送一条消息开始测试
                </p>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-blue-900/90 text-slate-100 rounded-br-md"
                        : "bg-slate-800 text-slate-200 rounded-bl-md"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            {/* 输入区域 */}
            <form
              onSubmit={handleSend}
              className="shrink-0 p-4 border-t border-slate-800 flex items-end gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="输入消息，Enter 发送"
                className="flex-1 min-w-0 rounded-xl bg-slate-900 border border-slate-700 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="shrink-0 p-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(129,140,248,0.4)] transition"
                aria-label="发送"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
