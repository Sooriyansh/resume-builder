"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, FileSearch, Loader2, LockKeyhole, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import type { AtsReport } from "@/lib/resume/ats-optimizer";

const steps = [
  "Uploading resume", "Reading resume", "Extracting information",
  "Analyzing content", "Improving structure", "Creating editable draft",
];

export function ResumeImporter() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<null | { id: string; title: string; warnings: string[]; wordCount: number; score: number; changes: number; report: AtsReport }>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!processing) return;
    const timer = setInterval(() => setStep((current) => Math.min(steps.length - 2, current + 1)), 700);
    return () => clearInterval(timer);
  }, [processing]);

  function choose(selected?: File) {
    if (!selected) return;
    const extension = selected.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx", "txt"].includes(extension ?? "")) return toast.error("Use a PDF, DOCX, or TXT resume.");
    if (selected.size > 5 * 1024 * 1024) return toast.error("Maximum file size is 5 MB.");
    if (!selected.size) return toast.error("The selected file is empty.");
    setFile(selected); setResult(null);
  }

  async function upload() {
    if (!file) return toast.error("Choose your old resume first.");
    setProcessing(true); setStep(0);
    const form = new FormData(); form.set("file", file); form.set("jobDescription", jobDescription);
    try {
      const response = await fetch("/api/builder-resumes/import", { method: "POST", body: form });
      const body = await response.json();
      if (!body.success) throw new Error(body.error.message);
      setStep(steps.length - 1);
      setResult({
        id: body.data.resume.id, title: body.data.resume.title,
        warnings: body.data.extraction.warnings, wordCount: body.data.extraction.wordCount,
        score: body.data.optimization.report.overall,
        changes: body.data.optimization.changes.length,
        report: body.data.optimization.report,
      });
      toast.success("Resume extracted into an editable draft.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not read this resume.");
    } finally {
      setProcessing(false);
    }
  }

  return <div>
    <div><p className="eyebrow">AI resume rebuild</p><h1 className="mt-2 text-3xl font-black">Turn your old resume into a modern draft</h1><p className="muted mt-2 max-w-3xl">Upload your existing resume, review every extracted field, then improve and tailor it without inventing information.</p></div>
    <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_.7fr]">
      <section className="card p-6">
        <div
          className={`grid min-h-72 cursor-pointer place-items-center rounded-2xl border-2 border-dashed p-8 text-center transition ${dragging ? "border-[#6d5dfc] bg-[#efedff]" : "border-[#d9dce8] bg-[#fbfbfd]"}`}
          onClick={() => input.current?.click()}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => { event.preventDefault(); setDragging(false); choose(event.dataTransfer.files[0]); }}
        >
          {file ? <div><FileSearch className="mx-auto text-[#6d5dfc]" size={42} /><p className="mt-4 font-black">{file.name}</p><p className="muted mt-1 text-sm">{(file.size / 1024).toFixed(1)} KB</p><button className="btn btn-secondary mt-4" onClick={(event) => { event.stopPropagation(); setFile(null); }}><X size={16} /> Remove</button></div> : <div><UploadCloud className="mx-auto text-[#6d5dfc]" size={44} /><p className="mt-4 text-lg font-black">Drag and drop your resume here</p><p className="muted mt-2 text-sm">or click to browse · PDF, DOCX, TXT · 5 MB max</p></div>}
        </div>
        <input ref={input} hidden type="file" accept=".pdf,.docx,.txt" onChange={(event) => choose(event.target.files?.[0])} />
        <label className="mt-4 block text-sm font-bold">Target job description <span className="muted font-normal">(optional)</span>
          <textarea className="input mt-2 min-h-36" value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} placeholder="Paste the job description to prioritize only your matching, evidenced experience and skills." maxLength={50_000} />
        </label>
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800"><LockKeyhole size={16} className="shrink-0" /> Your file is processed in memory. The original upload is not retained by the rebuild tool.</div>
        <button className="btn btn-primary mt-5 w-full" disabled={!file || processing} onClick={upload}>{processing ? <Loader2 className="animate-spin" size={18} /> : <UploadCloud size={18} />} Extract Resume Information</button>
      </section>
      <aside className="card p-6">
        <h2 className="font-black">Processing progress</h2><div className="mt-5 space-y-4">{steps.map((label, index) => <div className="flex items-center gap-3" key={label}>{index < step || result ? <CheckCircle2 className="text-emerald-500" size={20} /> : index === step && processing ? <Loader2 className="animate-spin text-[#6d5dfc]" size={20} /> : <span className="size-5 rounded-full border-2 border-[#d9dce8]" />}<span className={`text-sm font-bold ${index <= step ? "text-[#344054]" : "text-[#98a2b3]"}`}>{label}</span></div>)}</div>
        {result && <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="font-black text-emerald-800">ATS-optimized draft ready</p>
          <p className="mt-1 text-sm text-emerald-700"><strong>{result.score}/100 internal ATS readiness</strong> after {result.changes} evidence-safe improvements across {result.wordCount} extracted words.</p>
          <div className="mt-4 grid grid-cols-2 gap-2">{Object.entries(result.report.categories).map(([label, score]) => <div className="rounded-lg bg-white p-2" key={label}><p className="text-[11px] font-bold text-[#667085]">{label}</p><p className="text-lg font-black">{score}%</p></div>)}</div>
          {result.report.issues.length > 0 && <div className="mt-3 rounded-lg bg-amber-50 p-3"><p className="text-xs font-black text-amber-900">Remaining issues</p><ul className="mt-1 list-disc pl-4 text-xs text-amber-800">{result.report.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul></div>}
          <p className="mt-2 text-xs text-emerald-800">Scores vary by external checker; the app never promises a universal 100%.</p>
          {result.warnings.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-amber-800">{result.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>}
          <Link className="btn btn-primary mt-4 w-full" href={`/resume-builder/${result.id}`}>Review every AI change</Link>
        </div>}
      </aside>
    </div>
  </div>;
}
