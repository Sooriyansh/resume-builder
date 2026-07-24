import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2, Target, XCircle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AnalysisActions } from "@/components/analysis-actions";
import { ResumeChat } from "@/components/resume-chat";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/require-user";

type Detail = {
  matchedSkills?: string[];
  missingRequiredSkills?: string[];
  missingPreferredSkills?: string[];
  matchedKeywords?: string[];
  missingKeywords?: string[];
  strengths?: string[];
  weaknesses?: string[];
  atsIssues?: Array<{ id: string; issue: string; severity: string; recommendation: string }>;
  improvementSuggestions?: Array<{ id: string; section: string; priority: string; currentIssue: string; recommendation: string }>;
  interviewQuestions?: Array<{ question: string; reason: string; category: string }>;
  recruiterSummary?: string;
};

export default async function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUser();
  const { id } = await params;
  const analysis = userId ? await db.analysis.findFirst({
    where: { id, userId },
    include: { resume: { select: { originalFilename: true } }, jobDescription: true },
  }) : null;
  if (!analysis) notFound();
  const detail = analysis.result as Detail;
  const breakdown = analysis.scoreBreakdown as Record<string, number>;
  const verdict = analysis.verdict.split("_").map((word) => word[0] + word.slice(1).toLowerCase()).join(" ");
  return <AppShell>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Analysis report</p><h1 className="mt-2 text-3xl font-black">{analysis.jobDescription.title || "Target role"}</h1><p className="muted mt-2">{analysis.resume.originalFilename} {analysis.jobDescription.companyName ? `· ${analysis.jobDescription.companyName}` : ""}</p></div><AnalysisActions id={analysis.id} /></div>
    <div className="mt-7 grid gap-5 lg:grid-cols-[280px_1fr]">
      <div className="card grid place-items-center p-7 text-center"><div className="grid size-40 place-items-center rounded-full border-[14px] border-[#6d5dfc]"><div><strong className="text-5xl">{analysis.overallScore}</strong><p className="muted text-xs">out of 100</p></div></div><span className="mt-5 rounded-full bg-[#efedff] px-4 py-2 text-sm font-black text-[#5948e8]">{verdict}</span><p className="muted mt-4 text-sm">Evidence-based ATS readiness estimate</p></div>
      <div className="card p-6"><h2 className="font-black">Score breakdown</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">{Object.entries(breakdown).map(([key, value]) => <div key={key}><div className="mb-1.5 flex justify-between text-sm font-bold"><span>{key.replace(/([A-Z])/g, " $1")}</span><span>{value}%</span></div><div className="h-2 rounded-full bg-[#ececf3]"><div className="h-2 rounded-full bg-[#6d5dfc]" style={{ width: `${value}%` }} /></div></div>)}</div></div>
    </div>
    <div className="mt-5 grid gap-5 md:grid-cols-2">
      <section className="card p-6"><h2 className="flex items-center gap-2 font-black text-emerald-700"><CheckCircle2 size={19} /> Matched skills</h2><div className="mt-4 flex flex-wrap gap-2">{detail.matchedSkills?.length ? detail.matchedSkills.map((skill) => <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700" key={skill}>{skill}</span>) : <p className="muted text-sm">No required skill matches were found.</p>}</div></section>
      <section className="card p-6"><h2 className="flex items-center gap-2 font-black text-amber-700"><XCircle size={19} /> Missing required skills</h2><div className="mt-4 flex flex-wrap gap-2">{detail.missingRequiredSkills?.length ? detail.missingRequiredSkills.map((skill) => <span className="rounded-full bg-amber-50 px-3 py-1.5 text-sm font-bold text-amber-700" key={skill}>{skill}</span>) : <p className="muted text-sm">No required skill gaps detected.</p>}</div></section>
    </div>
    <section className="card mt-5 p-6"><h2 className="flex items-center gap-2 font-black"><AlertTriangle className="text-amber-500" size={19} /> ATS issues & improvements</h2><div className="mt-4 grid gap-3">{[...(detail.atsIssues ?? []).map((item) => ({ id: item.id, title: item.issue, text: item.recommendation, priority: item.severity })), ...(detail.improvementSuggestions ?? []).map((item) => ({ id: item.id, title: item.currentIssue, text: item.recommendation, priority: item.priority }))].map((item) => <article key={item.id} className="rounded-xl border border-[#e7e9f2] p-4"><div className="flex justify-between gap-3"><strong className="text-sm">{item.title}</strong><span className="h-fit rounded-full bg-[#f2f3f7] px-2 py-1 text-[10px] font-black uppercase">{item.priority}</span></div><p className="muted mt-2 text-sm">{item.text}</p></article>)}</div></section>
    <section className="card mt-5 p-6"><div className="flex items-center gap-2"><Target className="text-[#6d5dfc]" /><h2 className="font-black">Recruiter summary</h2></div><p className="muted mt-4 leading-7">{detail.recruiterSummary}</p></section>
    <div className="mt-5"><ResumeChat analysisId={analysis.id} /></div>
  </AppShell>;
}
