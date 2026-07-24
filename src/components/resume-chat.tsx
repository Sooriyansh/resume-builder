"use client";

import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { toast } from "sonner";

type Message = { role: "user" | "assistant"; content: string; sources?: Array<{ section: string; similarity: number }> };

export function ResumeChat({ analysisId }: { analysisId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  async function ask(formData: FormData) {
    const question = String(formData.get("question")).trim();
    if (!question) return;
    setMessages((items) => [...items, { role: "user", content: question }]);
    setLoading(true);
    try {
      const response = await fetch(`/api/analyses/${analysisId}/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message);
      setMessages((items) => [...items, { role: "assistant", content: body.data.answer, sources: body.data.sources }]);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Chat failed."); }
    finally { setLoading(false); }
  }
  return <div className="card p-6"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#efedff] text-[#6d5dfc]"><Sparkles size={19} /></span><div><h2 className="font-black">Chat with this resume</h2><p className="muted text-xs">Answers use only retrieved resume evidence.</p></div></div>
    <div className="mt-5 max-h-96 space-y-3 overflow-auto">
      {messages.length === 0 && <div className="rounded-xl bg-[#f8f7ff] p-4 text-sm text-[#667085]">Try: “Which projects show leadership?” or “What experience supports this role?”</div>}
      {messages.map((message, index) => <div key={index} className={`max-w-[85%] rounded-xl p-3 text-sm leading-6 ${message.role === "user" ? "ml-auto bg-[#6d5dfc] text-white" : "bg-[#f2f3f7]"}`}><p>{message.content}</p>{message.sources?.length ? <p className="mt-2 text-[11px] opacity-70">Sources: {[...new Set(message.sources.map((source) => source.section))].join(", ")}</p> : null}</div>)}
      {loading && <p className="muted text-sm">Searching your resume…</p>}
    </div>
    <form action={ask} className="mt-4 flex gap-2"><input className="input" name="question" maxLength={1000} placeholder="Ask about this resume…" /><button disabled={loading} className="btn btn-primary" aria-label="Send"><Send size={18} /></button></form>
  </div>;
}
