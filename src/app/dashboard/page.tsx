import Link from "next/link";
import { BriefcaseBusiness, FilePenLine, FilePlus2, FileText, FolderOpen, RefreshCw, Sparkles, Trophy } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/require-user";
import { db } from "@/lib/db";

export default async function DashboardPage() {
  const userId = await requireUser();
  const analyses = userId ? await db.analysis.findMany({
    where: { userId },
    include: { resume: { select: { originalFilename: true } }, jobDescription: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  }) : [];
  const scores = analyses.map((item) => item.overallScore);
  const stats = [
    { label: "Resumes analyzed", value: analyses.length, icon: FileText },
    { label: "Average match", value: scores.length ? `${Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)}%` : "—", icon: Sparkles },
    { label: "Strongest match", value: scores.length ? `${Math.max(...scores)}%` : "—", icon: Trophy },
  ];
  const actions = [
    { href: "/analyzer", title: "Analyze My Resume", text: "Upload a resume and compare it with a job description.", icon: FilePlus2 },
    { href: "/resume-rebuild", title: "Upload Old Resume", text: "Extract PDF, DOCX, or TXT content into an editable modern draft.", icon: RefreshCw },
    { href: "/resume-builder", title: "Create New Resume", text: "Start from scratch with ATS-friendly enterprise templates.", icon: FilePenLine },
    { href: "/resume-builder", title: "Generate Resume for a Job", text: "Create a draft, paste company requirements, and tailor safely.", icon: BriefcaseBusiness },
    { href: "/resume-builder", title: "My Resumes", text: "Open, duplicate, rename, export, or delete saved resume versions.", icon: FolderOpen },
  ];
  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="eyebrow">Your workspace</p><h1 className="mt-2 text-3xl font-black">Make your next application count.</h1><p className="muted mt-2">Review past insights or start a focused resume analysis.</p></div>
        <div className="flex gap-2"><Link className="btn btn-secondary" href="/resume-builder"><FilePenLine size={18} /> Create Resume</Link><Link className="btn btn-primary" href="/analyzer"><FilePlus2 size={18} /> Analyze Existing Resume</Link></div>
      </div>
      <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{actions.map(({ href, title, text, icon: Icon }) => <Link href={href} key={title} className="card group p-5 transition hover:-translate-y-1 hover:border-[#cbc5ff] hover:shadow-lg"><span className="grid size-11 place-items-center rounded-xl bg-[#efedff] text-[#5948e8] transition group-hover:bg-[#6d5dfc] group-hover:text-white"><Icon size={21} /></span><h2 className="mt-4 font-black">{title}</h2><p className="muted mt-2 text-sm leading-6">{text}</p><span className="mt-4 inline-block text-sm font-bold text-[#5948e8]">Open →</span></Link>)}</div>
      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => <div className="card p-5" key={label}><span className="grid size-10 place-items-center rounded-xl bg-[#efedff] text-[#6d5dfc]"><Icon size={20} /></span><p className="mt-4 text-2xl font-black">{value}</p><p className="muted mt-1 text-sm">{label}</p></div>)}
      </div>
      <div className="card mt-6 p-6">
        <div className="flex justify-between"><h2 className="text-lg font-black">Recent analyses</h2><Link href="/history" className="text-sm font-bold text-[#6d5dfc]">View all</Link></div>
        {analyses.length ? <div className="mt-4 divide-y divide-[#ececf3]">
          {analyses.map((item) => <Link href={`/analysis/${item.id}`} key={item.id} className="flex items-center justify-between gap-4 py-4 hover:text-[#5948e8]"><div><p className="font-bold">{item.jobDescription.title || "Untitled role"}</p><p className="muted mt-1 text-xs">{item.resume.originalFilename} · {item.createdAt.toLocaleDateString()}</p></div><strong className="rounded-full bg-[#efedff] px-3 py-1.5 text-sm text-[#5948e8]">{item.overallScore}%</strong></Link>)}
        </div> : <div className="grid place-items-center py-14 text-center"><span className="grid size-14 place-items-center rounded-2xl bg-[#efedff] text-[#6d5dfc]"><FileText /></span><h3 className="mt-4 font-black">No analyses yet</h3><p className="muted mt-2 max-w-sm text-sm">Upload your resume and add a job description to get your first evidence-based score.</p><Link className="btn btn-primary mt-5" href="/analyzer">Analyze a resume</Link></div>}
      </div>
    </AppShell>
  );
}
