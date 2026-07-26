import Link from "next/link";
import { Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/require-user";

// This page reads request-time data and must not connect to the database while
// Vercel is building the application.
export const dynamic = "force-dynamic";

export default async function HistoryPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const userId = await requireUser();
  const filters = await searchParams;
  const page = Math.max(1, Number(filters.page) || 1);
  const minScore = Math.max(0, Number(filters.minScore) || 0);
  const verdict = ["POOR_MATCH", "AVERAGE_MATCH", "GOOD_MATCH", "STRONG_MATCH"].includes(filters.verdict ?? "")
    ? filters.verdict as "POOR_MATCH" | "AVERAGE_MATCH" | "GOOD_MATCH" | "STRONG_MATCH"
    : undefined;
  const where = {
    userId: userId!,
    overallScore: { gte: minScore },
    ...(verdict ? { verdict } : {}),
    ...(filters.q ? { OR: [
      { resume: { originalFilename: { contains: filters.q } } },
      { jobDescription: { title: { contains: filters.q } } },
    ] } : {}),
  };
  const [items, count] = userId ? await Promise.all([
    db.analysis.findMany({
      where, include: { resume: { select: { originalFilename: true } }, jobDescription: { select: { title: true, companyName: true } } },
      orderBy: filters.sort === "score" ? { overallScore: "desc" } : { createdAt: "desc" },
      skip: (page - 1) * 10, take: 10,
    }),
    db.analysis.count({ where }),
  ]) : [[], 0];
  return <AppShell><div><p className="eyebrow">Your archive</p><h1 className="mt-2 text-3xl font-black">Analysis history</h1><p className="muted mt-2">Search, filter, and revisit every application.</p></div>
    <form className="card mt-7 grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto_auto]">
      <label className="relative"><Search className="absolute top-3 left-3 text-[#98a2b3]" size={18} /><input className="input pl-10" name="q" defaultValue={filters.q} placeholder="Search role or resume…" /></label>
      <select className="input" name="minScore" defaultValue={filters.minScore}><option value="">Any score</option><option value="40">40%+</option><option value="60">60%+</option><option value="80">80%+</option></select>
      <select className="input" name="verdict" defaultValue={filters.verdict}><option value="">Any verdict</option><option value="POOR_MATCH">Poor match</option><option value="AVERAGE_MATCH">Average match</option><option value="GOOD_MATCH">Good match</option><option value="STRONG_MATCH">Strong match</option></select>
      <button className="btn btn-primary">Apply</button>
    </form>
    <div className="card mt-5 overflow-hidden">{items.length ? <div className="divide-y divide-[#ececf3]">{items.map((item) => <Link className="grid items-center gap-3 p-5 hover:bg-[#faf9ff] sm:grid-cols-[1fr_160px_80px]" key={item.id} href={`/analysis/${item.id}`}><div><p className="font-black">{item.jobDescription.title || "Untitled role"}</p><p className="muted mt-1 text-xs">{item.resume.originalFilename} {item.jobDescription.companyName ? `· ${item.jobDescription.companyName}` : ""}</p></div><p className="muted text-sm">{item.createdAt.toLocaleDateString()}</p><strong className="text-lg text-[#5948e8]">{item.overallScore}%</strong></Link>)}</div> : <p className="muted p-12 text-center">No analyses match these filters.</p>}</div>
    <div className="mt-4 flex justify-between text-sm"><span className="muted">{count} total analyses</span><div className="flex gap-2">{page > 1 && <Link className="btn btn-secondary" href={{ query: { ...filters, page: page - 1 } }}>Previous</Link>}{page * 10 < count && <Link className="btn btn-secondary" href={{ query: { ...filters, page: page + 1 } }}>Next</Link>}</div></div>
  </AppShell>;
}
