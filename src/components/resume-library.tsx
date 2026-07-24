"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, FilePlus2, FileText, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { defaultResumeSettings, emptyResumeData, sampleResumeData } from "@/lib/resume-builder";

type Item = { id: string; title: string; template: string; updatedAt: string; data: { professionalTitle?: string } };

export function ResumeLibrary() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const response = await fetch("/api/builder-resumes");
    const body = await response.json();
    if (body.success) setItems(body.data);
    setLoading(false);
  }
  useEffect(() => {
    fetch("/api/builder-resumes").then((response) => response.json()).then((body) => {
      if (body.success) setItems(body.data);
      setLoading(false);
    });
  }, []);

  async function create(sample = false) {
    const response = await fetch("/api/builder-resumes", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: sample ? "Sample Full Stack Resume" : "Untitled Resume",
        template: "modern", data: sample ? sampleResumeData : emptyResumeData,
        settings: defaultResumeSettings,
      }),
    });
    const body = await response.json();
    if (!body.success) return toast.error(body.error.message);
    location.href = `/resume-builder/${body.data.id}`;
  }

  async function duplicate(item: Item) {
    const detail = await fetch(`/api/builder-resumes/${item.id}`).then((response) => response.json());
    if (!detail.success) return toast.error("Could not duplicate resume.");
    const response = await fetch("/api/builder-resumes", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...detail.data, title: `${item.title} Copy` }),
    });
    if (response.ok) { toast.success("Resume duplicated."); void load(); }
  }

  async function remove(item: Item) {
    if (!confirm(`Delete “${item.title}”? This cannot be undone.`)) return;
    const response = await fetch(`/api/builder-resumes/${item.id}`, { method: "DELETE" });
    if (response.ok) { toast.success("Resume deleted."); setItems((current) => current.filter(({ id }) => id !== item.id)); }
  }

  return <div>
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="eyebrow">Resume studio</p><h1 className="mt-2 text-3xl font-black">Create a professional resume</h1><p className="muted mt-2">Build, customize, save, analyze, and export role-specific resumes.</p></div>
      <div className="flex gap-2"><button className="btn btn-secondary" onClick={() => create(true)}>Use sample data</button><button className="btn btn-primary" onClick={() => create()}><FilePlus2 size={18} /> Create Resume</button></div>
    </div>
    {loading ? <div className="card mt-7 p-12 text-center">Loading resumes…</div> : items.length ? <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => <article className="card p-5" key={item.id}>
        <span className="grid size-11 place-items-center rounded-xl bg-[#efedff] text-[#5948e8]"><FileText /></span>
        <h2 className="mt-4 truncate font-black">{item.title}</h2>
        <p className="muted mt-1 text-sm">{item.data.professionalTitle || "No professional title"} · {item.template}</p>
        <p className="muted mt-3 text-xs">Updated {new Date(item.updatedAt).toLocaleString()}</p>
        <div className="mt-5 flex gap-2">
          <Link href={`/resume-builder/${item.id}`} className="btn btn-primary flex-1"><Pencil size={15} /> Edit</Link>
          <button aria-label="Duplicate resume" className="btn btn-secondary" onClick={() => duplicate(item)}><Copy size={15} /></button>
          <button aria-label="Delete resume" className="btn btn-secondary text-red-600" onClick={() => remove(item)}><Trash2 size={15} /></button>
        </div>
      </article>)}
    </div> : <div className="card mt-7 grid place-items-center p-14 text-center"><FileText className="text-[#6d5dfc]" size={36} /><h2 className="mt-4 text-xl font-black">No saved resumes</h2><p className="muted mt-2 max-w-md">Create your first resume from scratch or start with realistic sample data.</p><button className="btn btn-primary mt-5" onClick={() => create()}><FilePlus2 size={17} /> Create Resume</button></div>}
  </div>;
}
