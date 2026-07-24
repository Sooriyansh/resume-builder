"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, BarChart3, Check, Download, Eye,
  GripVertical, Loader2, Plus, Printer, RotateCcw, Save, Share2,
  Sparkles, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  defaultResumeSettings, emptyResumeData, resumeCompletion,
  type ResumeData, type ResumeEntry, type ResumeSettings, type SectionId,
} from "@/lib/resume-builder";
import { ResumePreview } from "./resume-preview";
import { ExportFeedbackDialog } from "./export-feedback-dialog";
import type { AtsReport, ResumeChange } from "@/lib/resume/ats-optimizer";

const templates = [
  ["big-tech", "Big Tech ATS"], ["microsoft", "Microsoft Inspired"], ["google", "Google Minimal"],
  ["amazon", "Amazon Results"], ["software-engineer", "Software Engineer"],
  ["professional-developer", "Professional Developer"], ["fresher", "Fresher ATS"],
  ["internship", "Internship"], ["experienced", "Experienced"], ["corporate", "Corporate"],
  ["simple", "Minimal"], ["executive", "Executive"], ["data-analyst", "Data Analyst"],
  ["designer", "Designer"], ["modern", "Modern"], ["ats", "ATS Friendly"],
  ["developer", "Developer"], ["creative", "Creative"],
] as const;
const multiSections = [
  ["experience", "Work Experience"], ["internships", "Internships"], ["education", "Education"],
  ["projects", "Projects"], ["certifications", "Certifications"], ["achievements", "Achievements"],
  ["references", "References"],
] as const;
const sectionLabels: Record<SectionId, string> = {
  summary: "Professional Summary", objective: "Career Objective", experience: "Work Experience",
  internships: "Internships", education: "Education", projects: "Projects",
  technicalSkills: "Technical Skills", softSkills: "Soft Skills",
  certifications: "Certifications", achievements: "Achievements", languages: "Languages",
  hobbies: "Hobbies", references: "References",
};

type Analysis = {
  atsScore: number; jobCompatibilityScore: number; missingKeywords: string[];
  matchedKeywords: string[];
  skillSuggestions: string[]; grammarIssues: number; experienceSuggestions: string[];
  sectionRecommendations: string[];
  categories?: AtsReport["categories"]; issues?: string[]; passed?: string[];
};
type UpdateResume = <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => void;

function newEntry(): ResumeEntry {
  return { id: crypto.randomUUID(), title: "", subtitle: "", date: "", description: "" };
}

function Field({ label, value, onChange, type = "text", placeholder, error }: {
  label: string; value: string; onChange: (value: string) => void; type?: string;
  placeholder?: string; error?: string;
}) {
  return <label className="block text-sm font-bold">{label}<input className={`input mt-2 ${error ? "border-red-400" : ""}`} value={value} type={type} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />{error && <span className="mt-1 block text-xs text-red-600">{error}</span>}</label>;
}

export function ResumeBuilder({ id }: { id: string }) {
  const [title, setTitle] = useState("Untitled Resume");
  const [template, setTemplate] = useState("modern");
  const [data, setData] = useState<ResumeData>(emptyResumeData);
  const [settings, setSettings] = useState<ResumeSettings>(defaultResumeSettings);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(true);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [targetOpen, setTargetOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [proposal, setProposal] = useState<null | { data: ResumeData; settings: ResumeSettings; changes: ResumeChange[]; report: AtsReport; before: { data: ResumeData; settings: ResumeSettings } }>(null);
  const [history, setHistory] = useState<Array<{ data: ResumeData; settings: ResumeSettings }>>([]);
  const [dragging, setDragging] = useState<SectionId | null>(null);
  const firstLoad = useRef(true);
  const completion = useMemo(() => resumeCompletion(data), [data]);

  useEffect(() => {
    fetch(`/api/builder-resumes/${id}`).then((response) => response.json()).then((body) => {
      if (!body.success) return toast.error(body.error.message);
      setTitle(body.data.title); setTemplate(body.data.template);
      setData(body.data.data); setSettings(body.data.settings); setReady(true);
    });
  }, [id]);

  async function save(showToast = false) {
    setSaving(true);
    const response = await fetch(`/api/builder-resumes/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, template, data, settings }),
    });
    const body = await response.json();
    setSaving(false);
    if (!body.success) return toast.error(body.error.message);
    setSaved(true);
    if (showToast) toast.success("Resume saved.");
  }

  useEffect(() => {
    if (!ready) return;
    if (firstLoad.current) { firstLoad.current = false; return; }
    setSaved(false);
    const timeout = setTimeout(() => void save(), 1_000);
    return () => clearTimeout(timeout);
    // save is deliberately excluded so autosave only reacts to document changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, title, template, data, settings]);

  function update<K extends keyof ResumeData>(key: K, value: ResumeData[K]) {
    setData((current) => ({ ...current, [key]: value }));
  }
  function updateEntry(key: typeof multiSections[number][0], entryId: string, patch: Partial<ResumeEntry>) {
    update(key, data[key].map((item) => item.id === entryId ? { ...item, ...patch } : item));
  }
  function removeEntry(key: typeof multiSections[number][0], entryId: string) {
    update(key, data[key].filter((item) => item.id !== entryId));
  }
  function skills(key: "technicalSkills" | "softSkills" | "languages" | "hobbies", value: string) {
    update(key, [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))]);
  }
  async function assist(action: string, text: string, apply: (value: string) => void) {
    const response = await fetch("/api/builder-resumes/assist", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, text, skills: data.technicalSkills, title: data.professionalTitle }),
    });
    const body = await response.json();
    if (!body.success) return toast.error(body.error.message);
    apply(body.data.text); toast.success("Writing improved.");
  }
  async function runAnalysis(targetText = jobDescription) {
    setAnalyzing(true);
    const response = await fetch("/api/builder-resumes/analyze", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data, jobDescription: targetText }),
    });
    const body = await response.json(); setAnalyzing(false);
    if (!body.success) return toast.error(body.error.message);
    setAnalysis(body.data); setTargetOpen(false);
  }
  async function optimizeResume() {
    setAnalyzing(true);
    const response = await fetch("/api/builder-resumes/optimize", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data, settings, jobDescription }),
    });
    const body = await response.json(); setAnalyzing(false);
    if (!body.success) return toast.error(body.error.message);
    setProposal({ ...body.data, before: { data, settings } });
    setTargetOpen(false);
  }
  function applyAll() {
    if (!proposal) return;
    setHistory((items) => [...items.slice(-9), proposal.before]);
    setData(proposal.data); setSettings(proposal.settings); setTemplate("ats"); setAnalysis(reportToAnalysis(proposal.report));
    setProposal(null); toast.success("All reviewed ATS improvements applied.");
  }
  function applySelected(selected: ResumeChange[]) {
    if (!proposal) return;
    const next = structuredClone(proposal.before.data) as ResumeData;
    let nextSettings = proposal.before.settings;
    for (const change of selected) {
      if (change.field === "format") { nextSettings = proposal.settings; continue; }
      const parts = change.field.split(".");
      if (parts.length === 1) {
        const key = parts[0] as keyof ResumeData;
        (next as Record<string, unknown>)[key] = ["technicalSkills", "softSkills", "languages"].includes(key)
          ? change.after.split(",").map((x) => x.trim()).filter(Boolean)
          : change.after;
      } else {
        const [section, index, field] = parts;
        const entries = (next as unknown as Record<string, ResumeEntry[]>)[section];
        if (entries?.[Number(index)]) entries[Number(index)] = { ...entries[Number(index)], [field]: change.after };
      }
    }
    setHistory((items) => [...items.slice(-9), proposal.before]);
    setData(next); setSettings(nextSettings); setTemplate("ats"); setAnalysis(reportToAnalysis(proposal.report)); setProposal(null);
    toast.success(`${selected.length} accepted improvement${selected.length === 1 ? "" : "s"} applied.`);
  }
  function undo() {
    const previous = history.at(-1);
    if (!previous) return toast.error("Nothing to undo.");
    setData(previous.data); setSettings(previous.settings); setHistory((items) => items.slice(0, -1));
    toast.success("Last AI change set undone.");
  }
  function photo(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return toast.error("Use a JPG, PNG, or WebP image.");
    if (file.size > 1_000_000) return toast.error("Profile image must be under 1 MB.");
    const reader = new FileReader(); reader.onload = () => update("photo", String(reader.result)); reader.readAsDataURL(file);
  }
  function reset() {
    if (confirm("Reset all resume content? This cannot be undone.")) { setData(emptyResumeData); setSettings(defaultResumeSettings); }
  }
  function exportResume() {
    if (!data.fullName.trim() || !data.professionalTitle.trim() || !data.email.trim()) {
      setTab("edit");
      return toast.error("Add your full name, professional title, and email before exporting.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      setTab("edit");
      return toast.error("Enter a valid email before exporting.");
    }
    setFeedbackOpen(true);
  }
  async function downloadPdf() {
    if (!data.fullName.trim() || !data.professionalTitle.trim() || !data.email.trim()) {
      setTab("edit");
      return toast.error("Add your full name, professional title, and email before exporting.");
    }
    await save();
    window.location.assign(`/api/builder-resumes/${id}/pdf`);
  }
  async function share() {
    await save();
    const response = await fetch(`/api/builder-resumes/${id}/share`, { method: "POST" });
    const body = await response.json();
    if (!body.success) return toast.error(body.error.message);
    const url = new URL(body.data.path, location.origin).toString();
    if (navigator.share) await navigator.share({ title, text: "View my resume", url });
    else { await navigator.clipboard.writeText(url); toast.success("Public read-only resume link copied."); }
  }
  function reorder(target: SectionId) {
    if (!dragging || dragging === target) return;
    const order = [...settings.sectionOrder];
    const from = order.indexOf(dragging), to = order.indexOf(target);
    order.splice(from, 1); order.splice(to, 0, dragging);
    setSettings({ ...settings, sectionOrder: order }); setDragging(null);
  }

  if (!ready) {
    return <div className="card grid min-h-80 place-items-center"><Loader2 className="animate-spin text-[#6d5dfc]" /></div>;
  }
  return (<div className="resume-builder-shell">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
      <div className="flex items-center gap-3"><Link href="/resume-builder" className="btn btn-secondary"><ArrowLeft size={16} /></Link><input className="input max-w-xs font-black" value={title} onChange={(event) => setTitle(event.target.value)} /></div>
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-2 text-xs font-bold text-[#667085]">{saving ? <><Loader2 size={14} className="animate-spin" /> Saving</> : saved ? <><Check size={14} /> Saved</> : "Unsaved"}</span>
        <button className="btn btn-secondary" onClick={() => save(true)}><Save size={16} /> Save</button>
        <button className="btn btn-secondary" onClick={() => setTargetOpen(true)} disabled={analyzing}><BarChart3 size={16} /> Analyze</button>
        <button className="btn btn-secondary" onClick={undo} disabled={!history.length}><RotateCcw size={16} /> Undo</button>
        <button className="btn btn-secondary" onClick={share}><Share2 size={16} /> Share</button>
        <button className="btn btn-secondary" onClick={exportResume}><Printer size={16} /> Print</button>
        <button className="btn btn-primary" onClick={downloadPdf}><Download size={16} /> Download PDF</button>
        <a className="btn btn-primary" href={`/api/builder-resumes/${id}/docx`}><Download size={16} /> Download DOCX</a>
      </div>
    </div>
    <div className="mb-4 grid grid-cols-2 gap-2 lg:hidden print:hidden"><button className={`btn ${tab === "edit" ? "btn-primary" : "btn-secondary"}`} onClick={() => setTab("edit")}>Edit</button><button className={`btn ${tab === "preview" ? "btn-primary" : "btn-secondary"}`} onClick={() => setTab("preview")}><Eye size={16} /> Preview</button></div>
    <div className="mb-5 rounded-2xl bg-white p-4 shadow-sm print:hidden"><div className="mb-2 flex justify-between text-sm font-bold"><span>Resume completion</span><span>{completion}%</span></div><div className="h-2 rounded-full bg-[#ececf3]"><div className="h-2 rounded-full bg-[#6d5dfc]" style={{ width: `${completion}%` }} /></div></div>
    {analysis?.categories && <Scorecard analysis={analysis} onFix={optimizeResume} />}
    <div className="grid gap-6 xl:grid-cols-[minmax(440px,0.85fr)_minmax(0,1.15fr)]">
      <div className={`${tab === "preview" ? "hidden lg:block" : ""} space-y-5 print:hidden`}>
        <Editor data={data} update={update} updateEntry={updateEntry} removeEntry={removeEntry} skills={skills} assist={assist} photo={photo} />
        <div className="card p-5"><h2 className="font-black">Templates</h2><p className="muted mt-1 text-sm">Preview or switch without losing content.</p><div className="mt-4 grid grid-cols-3 gap-2">{templates.map(([value, label]) => <button key={value} onClick={() => setTemplate(value)} className={`rounded-xl border p-3 text-xs font-bold ${template === value ? "border-[#6d5dfc] bg-[#efedff] text-[#5948e8]" : "border-[#e2e4ec]"}`}><span className="mx-auto mb-2 block h-12 w-9 rounded-sm border bg-white shadow-sm" style={{ borderTop: `8px solid ${value === "ats" ? "#111827" : settings.color}` }} />{label}</button>)}</div></div>
        <Customization settings={settings} setSettings={setSettings} dragging={dragging} setDragging={setDragging} reorder={reorder} />
        <div className="flex justify-end"><button className="btn btn-secondary text-red-600" onClick={reset}><RotateCcw size={16} /> Reset resume</button></div>
      </div>
      <div className={`${tab === "edit" ? "hidden lg:block" : ""} overflow-auto rounded-2xl bg-[#dfe2e8] p-3 sm:p-6 print:block print:overflow-visible print:bg-white print:p-0`}><ResumePreview data={data} settings={settings} template={template} /></div>
    </div>
    {analysis && <AnalysisPanel analysis={analysis} data={data} update={update} close={() => setAnalysis(null)} />}
    {proposal && <ChangeReview proposal={proposal} onApplyAll={applyAll} onApplySelected={applySelected} onReject={() => setProposal(null)} onRegenerate={optimizeResume} />}
    <ExportFeedbackDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} onComplete={() => window.print()} builderResumeId={id} resumeTitle={title} />
    {targetOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 print:hidden"><div className="card w-full max-w-xl p-6"><div className="flex justify-between"><div><p className="eyebrow">ATS quality studio</p><h2 className="mt-1 text-xl font-black">Analyze, rebuild, and tailor</h2></div><button onClick={() => setTargetOpen(false)}>✕</button></div><p className="muted mt-2 text-sm">Paste a job description for role-specific ordering and keyword alignment. Only information already in your resume can be used.</p><textarea className="input mt-4 min-h-52" value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} placeholder="Optional job description…" maxLength={50_000} /><div className="mt-4 flex flex-wrap justify-end gap-2"><button className="btn btn-secondary" onClick={() => { setJobDescription(""); void runAnalysis(""); }}>General ATS check</button><button className="btn btn-secondary" disabled={analyzing} onClick={optimizeResume}>{analyzing ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />} Auto-fix & review</button><button className="btn btn-primary" disabled={analyzing || (!!jobDescription && jobDescription.trim().length < 50)} onClick={() => runAnalysis()}>{analyzing ? <Loader2 className="animate-spin" size={16} /> : <BarChart3 size={16} />} Analyze</button></div></div></div>}
  </div>);
}

function Editor({ data, update, updateEntry, removeEntry, skills, assist, photo }: {
  data: ResumeData; update: UpdateResume;
  updateEntry: (key: typeof multiSections[number][0], id: string, patch: Partial<ResumeEntry>) => void;
  removeEntry: (key: typeof multiSections[number][0], id: string) => void;
  skills: (key: "technicalSkills" | "softSkills" | "languages" | "hobbies", value: string) => void;
  assist: (action: string, text: string, apply: (value: string) => void) => void; photo: (file?: File) => void;
}) {
  return <div className="space-y-5">
    <details className="card p-5" open><summary className="cursor-pointer font-black">Personal information</summary><div className="mt-4 grid gap-4 sm:grid-cols-2">
      <Field label="Full name *" value={data.fullName} onChange={(value) => update("fullName", value)} error={!data.fullName ? "Full name is required." : undefined} />
      <Field label="Professional title *" value={data.professionalTitle} onChange={(value) => update("professionalTitle", value)} />
      <Field label="Email *" type="email" value={data.email} onChange={(value) => update("email", value)} error={data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) ? "Enter a valid email." : undefined} />
      <Field label="Phone" type="tel" value={data.phone} onChange={(value) => update("phone", value)} error={data.phone && !/^[+\d()\s-]{7,30}$/.test(data.phone) ? "Enter a valid phone number." : undefined} />
      <Field label="Location" value={data.location} onChange={(value) => update("location", value)} />
      <label className="text-sm font-bold">Profile photo<input className="input mt-2" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => photo(event.target.files?.[0])} /></label>
      <Field label="LinkedIn URL" type="url" value={data.linkedin} onChange={(value) => update("linkedin", value)} />
      <Field label="GitHub URL" type="url" value={data.github} onChange={(value) => update("github", value)} />
      <Field label="Portfolio URL" type="url" value={data.portfolio} onChange={(value) => update("portfolio", value)} />
    </div></details>
    {(["summary", "objective"] as const).map((key) => <details className="card p-5" open key={key}><summary className="cursor-pointer font-black">{sectionLabels[key]}</summary><label className="mt-4 block text-sm font-bold">{sectionLabels[key]}<textarea className="input mt-2 min-h-28" value={data[key]} onChange={(event) => update(key, event.target.value)} /></label><button className="btn btn-secondary mt-3" onClick={() => assist(key, data[key], (value) => update(key, value))}><Sparkles size={15} /> Generate with AI</button></details>)}
    {multiSections.map(([key, label]) => <details className="card p-5" key={key} open={["experience", "education", "projects"].includes(key)}><summary className="cursor-pointer font-black">{label} <span className="muted">({data[key].length})</span></summary><div className="mt-4 space-y-4">{data[key].map((item, index) => <div className="rounded-xl border border-[#e2e4ec] p-4" key={item.id}><div className="mb-3 flex justify-between"><strong className="text-sm">{label} #{index + 1}</strong><button className="text-red-600" onClick={() => removeEntry(key, item.id)}><Trash2 size={16} /></button></div><div className="grid gap-3 sm:grid-cols-2"><Field label={key === "education" ? "Degree" : "Title"} value={item.title} onChange={(value) => updateEntry(key, item.id, { title: value })} /><Field label={key === "education" ? "Institution" : "Organization / technologies"} value={item.subtitle} onChange={(value) => updateEntry(key, item.id, { subtitle: value })} /><Field label="Date / duration" value={item.date} onChange={(value) => updateEntry(key, item.id, { date: value })} /></div><label className="mt-3 block text-sm font-bold">Description<textarea className="input mt-2 min-h-24" value={item.description} onChange={(event) => updateEntry(key, item.id, { description: event.target.value })} /></label>{["experience", "internships", "projects"].includes(key) && <button className="btn btn-secondary mt-3" onClick={() => assist(key === "projects" ? "project" : "bullets", item.description, (value) => updateEntry(key, item.id, { description: value }))}><Sparkles size={15} /> Improve description</button>}</div>)}</div><button className="btn btn-secondary mt-4" onClick={() => update(key, [...data[key], newEntry()])}><Plus size={15} /> Add {label}</button></details>)}
    {(["technicalSkills", "softSkills", "languages", "hobbies"] as const).map((key) => <details className="card p-5" key={key}><summary className="cursor-pointer font-black">{sectionLabels[key]}</summary><label className="mt-4 block text-sm font-bold">Comma-separated values<textarea className="input mt-2 min-h-20" value={data[key].join(", ")} onChange={(event) => skills(key, event.target.value)} /></label>{key === "technicalSkills" && <button className="btn btn-secondary mt-3" onClick={() => assist("skills", data[key].join(", "), (value) => skills(key, value))}><Sparkles size={15} /> Suggest skills</button>}</details>)}
  </div>;
}

function Customization({ settings, setSettings, dragging, setDragging, reorder }: {
  settings: ResumeSettings; setSettings: (value: ResumeSettings) => void;
  dragging: SectionId | null; setDragging: (value: SectionId | null) => void; reorder: (target: SectionId) => void;
}) {
  return <div className="card p-5"><h2 className="font-black">Design & sections</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">
    <label className="text-sm font-bold">Font<select className="input mt-2" value={settings.font} onChange={(event) => setSettings({ ...settings, font: event.target.value as ResumeSettings["font"] })}>{["Inter", "Georgia", "Arial", "Times New Roman"].map((font) => <option key={font}>{font}</option>)}</select></label>
    <label className="text-sm font-bold">Font size<input className="mt-3 w-full" type="range" min="9" max="14" step=".5" value={settings.fontSize} onChange={(event) => setSettings({ ...settings, fontSize: Number(event.target.value) })} /></label>
    <label className="text-sm font-bold">Heading style<select className="input mt-2" value={settings.headingStyle} onChange={(event) => setSettings({ ...settings, headingStyle: event.target.value as ResumeSettings["headingStyle"] })}><option value="line">Line</option><option value="block">Block</option><option value="minimal">Minimal</option></select></label>
    <label className="text-sm font-bold">Alignment<select className="input mt-2" value={settings.alignment} onChange={(event) => setSettings({ ...settings, alignment: event.target.value as ResumeSettings["alignment"] })}><option value="left">Left</option><option value="center">Center</option></select></label>
    <label className="text-sm font-bold">Theme color<input className="mt-2 h-11 w-full" type="color" value={settings.color} onChange={(event) => setSettings({ ...settings, color: event.target.value })} /></label>
    <label className="text-sm font-bold">Section spacing<input className="mt-3 w-full" type="range" min="8" max="28" value={settings.spacing} onChange={(event) => setSettings({ ...settings, spacing: Number(event.target.value) })} /></label>
    <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={settings.showPhoto} onChange={(event) => setSettings({ ...settings, showPhoto: event.target.checked })} /> Show profile photo</label>
  </div><h3 className="mt-5 text-sm font-black">Drag to reorder · uncheck to hide</h3><div className="mt-3 space-y-2">{settings.sectionOrder.map((id) => <div key={id} draggable onDragStart={() => setDragging(id)} onDragOver={(event) => event.preventDefault()} onDrop={() => reorder(id)} className={`flex items-center gap-2 rounded-lg border p-2 ${dragging === id ? "opacity-40" : ""}`}><GripVertical size={15} /><input type="checkbox" checked={!settings.hiddenSections.includes(id)} onChange={(event) => setSettings({ ...settings, hiddenSections: event.target.checked ? settings.hiddenSections.filter((item) => item !== id) : [...settings.hiddenSections, id] })} /><span className="flex-1 text-sm font-bold">{sectionLabels[id]}</span></div>)}</div></div>;
}

function reportToAnalysis(report: AtsReport): Analysis {
  return {
    atsScore: report.overall,
    jobCompatibilityScore: report.categories["Job Tailoring"],
    missingKeywords: [], matchedKeywords: [], skillSuggestions: [],
    grammarIssues: 0, experienceSuggestions: [],
    sectionRecommendations: report.issues,
    categories: report.categories, issues: report.issues, passed: report.passed,
  };
}

function Scorecard({ analysis, onFix }: { analysis: Analysis; onFix: () => void }) {
  return <section className="card mb-5 p-5 print:hidden">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">Live ATS ratings</p><h2 className="mt-1 text-xl font-black">{analysis.atsScore}/100 overall readiness</h2></div><button className="btn btn-primary" onClick={onFix}><Sparkles size={16} /> Fix remaining issues</button></div>
    <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">{Object.entries(analysis.categories ?? {}).map(([label, score]) => <div className="rounded-xl border border-[#e7e9f2] p-3" key={label}><p className="text-[11px] font-bold text-[#667085]">{label}</p><p className={`mt-1 text-xl font-black ${score >= 85 ? "text-emerald-700" : score >= 65 ? "text-amber-700" : "text-red-700"}`}>{score}%</p></div>)}</div>
    {!!analysis.issues?.length && <div className="mt-4 rounded-xl bg-amber-50 p-3"><p className="text-sm font-black text-amber-900">Remaining issues</p><ul className="mt-1 list-disc pl-5 text-sm text-amber-800">{analysis.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul></div>}
    {!!analysis.passed?.length && <p className="mt-3 text-xs text-emerald-700">Passed: {analysis.passed.join(" · ")}</p>}
  </section>;
}

function ChangeReview({ proposal, onApplyAll, onApplySelected, onReject, onRegenerate }: {
  proposal: { changes: ResumeChange[]; report: AtsReport };
  onApplyAll: () => void;
  onApplySelected: (changes: ResumeChange[]) => void;
  onReject: () => void;
  onRegenerate: () => void;
}) {
  const [accepted, setAccepted] = useState(() => new Set(proposal.changes.map((change) => change.id)));
  const [editing, setEditing] = useState<string | null>(null);
  const [changes, setChanges] = useState(proposal.changes);
  const toggle = (id: string) => setAccepted((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  return <div className="fixed inset-0 z-[55] grid place-items-center bg-black/50 p-4 print:hidden">
    <div className="card max-h-[92vh] w-full max-w-4xl overflow-auto p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="eyebrow">AI change review</p><h2 className="mt-1 text-2xl font-black">{proposal.report.overall}/100 internal ATS readiness</h2><p className="muted mt-1 text-sm">External checkers use different rules, so this is the highest evidence-safe score—not a universal 100% guarantee.</p></div>
        <button className="btn btn-secondary" onClick={onReject}>Reject all</button>
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(proposal.report.categories).map(([label, score]) => <div className="rounded-xl border border-[#e7e9f2] p-3" key={label}><p className="text-xs font-bold text-[#667085]">{label}</p><p className="mt-1 text-xl font-black">{score}%</p></div>)}
      </div>
      <div className="mt-5 space-y-3">
        {changes.length ? changes.map((change) => <article key={change.id} className={`rounded-xl border p-4 ${accepted.has(change.id) ? "border-emerald-300 bg-emerald-50/50" : "border-[#e7e9f2]"}`}>
          <div className="flex flex-wrap items-start justify-between gap-2"><div><span className="rounded-full bg-white px-2 py-1 text-xs font-bold">{change.category}</span><p className="mt-2 text-sm font-bold">{change.reason}</p></div><div className="flex gap-2"><button className="btn btn-secondary" onClick={() => toggle(change.id)}>{accepted.has(change.id) ? "Reject" : "Accept"}</button><button className="btn btn-secondary" onClick={() => setEditing(editing === change.id ? null : change.id)}>Edit</button></div></div>
          {editing === change.id ? <textarea className="input mt-3 min-h-24" value={change.after} onChange={(event) => setChanges((items) => items.map((item) => item.id === change.id ? { ...item, after: event.target.value } : item))} /> : <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2"><div><strong>Before</strong><p className="mt-1 whitespace-pre-wrap text-[#667085]">{change.before.slice(0, 500) || "Empty"}</p></div><div><strong>After</strong><p className="mt-1 whitespace-pre-wrap">{change.after.slice(0, 500) || "Removed"}</p></div></div>}
        </article>) : <p className="rounded-xl bg-emerald-50 p-4 text-emerald-800">No safe automatic edits were needed.</p>}
      </div>
      <div className="mt-5 flex flex-wrap justify-end gap-2"><button className="btn btn-secondary" onClick={onRegenerate}>Regenerate</button><button className="btn btn-secondary" onClick={() => onApplySelected(changes.filter((change) => accepted.has(change.id)))}>Apply accepted ({accepted.size})</button><button className="btn btn-primary" onClick={onApplyAll}>Apply All</button></div>
    </div>
  </div>;
}

function AnalysisPanel({ analysis, data, update, close }: { analysis: Analysis; data: ResumeData; update: UpdateResume; close: () => void }) {
  const suggestions = [...analysis.missingKeywords, ...analysis.skillSuggestions, ...analysis.experienceSuggestions, ...analysis.sectionRecommendations];
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 print:hidden"><div className="card max-h-[90vh] w-full max-w-2xl overflow-auto p-6"><div className="flex justify-between"><div><p className="eyebrow">Builder analysis</p><h2 className="mt-1 text-2xl font-black">Resume improvement report</h2></div><button onClick={close}>✕</button></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-[#efedff] p-4"><strong className="text-3xl text-[#5948e8]">{analysis.atsScore}%</strong><p className="muted text-sm">ATS score</p></div><div className="rounded-xl bg-emerald-50 p-4"><strong className="text-3xl text-emerald-700">{analysis.jobCompatibilityScore}%</strong><p className="muted text-sm">Compatibility estimate</p></div></div><p className="mt-4 text-sm font-bold">Grammar issues detected: {analysis.grammarIssues}</p><div className="mt-5 space-y-2">{suggestions.length ? suggestions.map((suggestion) => <div key={suggestion} className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm"><span>{suggestion}</span>{analysis.skillSuggestions.includes(suggestion) && <button className="btn btn-secondary" onClick={() => update("technicalSkills", [...new Set([...data.technicalSkills, suggestion])])}>Apply</button>}</div>) : <p className="rounded-xl bg-emerald-50 p-4 text-emerald-700">No major gaps found.</p>}</div></div></div>;
}
