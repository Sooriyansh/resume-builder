"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, LockKeyhole, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";

async function api<T>(url: string, options: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const body = await response.json();
  if (!response.ok || !body.success) throw new Error(body.error?.message ?? "Request failed.");
  return body.data;
}

export function AnalyzerForm() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function choose(selected?: File) {
    if (!selected) return;
    if (selected.size > 5 * 1024 * 1024) return toast.error("Maximum file size is 5 MB.");
    if (!selected.name.toLowerCase().match(/\.(pdf|docx)$/)) return toast.error("Choose a PDF or DOCX file.");
    setFile(selected);
  }

  async function submit(formData: FormData) {
    if (!file) {
      toast.error("Choose a resume first.");
      return;
    }
    setLoading(true);
    try {
      setStatus("Securely uploading and extracting text…"); setProgress(15);
      const upload = new FormData(); upload.set("file", file);
      const uploaded = await api<{ resume: { id: string } }>("/api/resumes/upload", { method: "POST", body: upload });
      setStatus("Structuring resume details…"); setProgress(35);
      await api(`/api/resumes/${uploaded.resume.id}/parse`, { method: "POST" });
      setStatus("Understanding the job requirements…"); setProgress(55);
      const job = await api<{ id: string }>("/api/job-descriptions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"), companyName: formData.get("company"),
          rawText: formData.get("jobDescription"),
        }),
      });
      setStatus("Calculating your transparent match score…"); setProgress(75);
      const analysis = await api<{ id: string }>("/api/analyses", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId: uploaded.resume.id, jobDescriptionId: job.id }),
      });
      setStatus("Building private resume search index…"); setProgress(90);
      await api(`/api/resumes/${uploaded.resume.id}/index`, { method: "POST" });
      setProgress(100); toast.success("Your analysis is ready.");
      router.push(`/analysis/${analysis.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Analysis failed.");
    } finally { setLoading(false); }
  }

  return (
    <form action={submit} className="grid gap-6">
      <div className="card p-6">
        <div className="flex items-center justify-between"><div><span className="eyebrow">Step 1</span><h2 className="mt-1 text-xl font-black">Upload your resume</h2></div><span className="muted text-xs">PDF or DOCX · 5 MB max</span></div>
        {!file ? <button type="button" onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); choose(event.dataTransfer.files[0]); }} className={`mt-5 grid w-full place-items-center rounded-2xl border-2 border-dashed p-12 transition ${dragging ? "border-[#6d5dfc] bg-[#efedff]" : "border-[#d9dce8] bg-[#fbfbfd] hover:border-[#a99fff]"}`}>
          <UploadCloud className="text-[#6d5dfc]" size={34} /><strong className="mt-4">Drop your resume here</strong><span className="muted mt-1 text-sm">or click to browse</span>
        </button> : <div className="mt-5 flex items-center gap-4 rounded-2xl border border-[#d9dce8] bg-[#fbfbfd] p-4"><span className="grid size-12 place-items-center rounded-xl bg-[#efedff] text-[#6d5dfc]"><FileText /></span><div className="min-w-0 flex-1"><p className="truncate font-bold">{file.name}</p><p className="muted mt-1 text-xs">{(file.size / 1024).toFixed(1)} KB</p></div><button type="button" aria-label="Remove file" onClick={() => setFile(null)}><X /></button></div>}
        <input ref={inputRef} hidden type="file" accept=".pdf,.docx" onChange={(event) => choose(event.target.files?.[0])} />
      </div>
      <div className="card p-6">
        <span className="eyebrow">Step 2</span><h2 className="mt-1 text-xl font-black">Add the target role</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">Job title <span className="muted font-normal">(optional)</span><input className="input mt-2" name="title" maxLength={120} placeholder="Senior Frontend Engineer" /></label><label className="text-sm font-bold">Company <span className="muted font-normal">(optional)</span><input className="input mt-2" name="company" maxLength={120} placeholder="Acme Inc." /></label></div>
        <label className="mt-4 block text-sm font-bold">Job description<textarea className="input mt-2 min-h-56 resize-y leading-6" name="jobDescription" minLength={100} maxLength={50000} required placeholder="Paste the full job description here…" /></label>
      </div>
      {loading && <div className="card p-5"><div className="mb-3 flex justify-between text-sm font-bold"><span>{status}</span><span>{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-[#ececf3]"><div className="h-full rounded-full bg-[#6d5dfc] transition-all" style={{ width: `${progress}%` }} /></div></div>}
      <div className="flex flex-wrap items-center justify-between gap-4"><p className="muted flex items-center gap-2 text-xs"><LockKeyhole size={15} /> Files are private and scoped to your account.</p><button disabled={loading} className="btn btn-primary px-8">{loading ? "Analyzing…" : "Analyze resume"}</button></div>
    </form>
  );
}
