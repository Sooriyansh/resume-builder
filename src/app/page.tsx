import Link from "next/link";
import {
  ArrowRight, BrainCircuit, CheckCircle2, FileSearch2, LockKeyhole,
  MessageSquareText, ShieldCheck, Sparkles, Target,
} from "lucide-react";

const features = [
  { icon: Target, title: "Transparent ATS score", text: "See exactly how skills, experience, keywords, education, and resume quality shape your score." },
  { icon: BrainCircuit, title: "Evidence-based AI", text: "Structured analysis that never invents experience, qualifications, or metrics." },
  { icon: MessageSquareText, title: "Chat with your resume", text: "Ask focused questions and get answers grounded in retrieved resume sections." },
];

export default function Home() {
  return (
    <main>
      <section className="container grid min-h-[650px] items-center gap-14 py-16 lg:grid-cols-[1.05fr_.95fr]">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#ddd9ff] bg-[#f1efff] px-3 py-1.5 text-xs font-bold text-[#5948e8]">
            <Sparkles size={14} /> Built for honest, better applications
          </div>
          <h1 className="max-w-3xl text-5xl leading-[1.04] font-black tracking-[-.045em] sm:text-6xl">
            Turn your resume into your <span className="text-[#6d5dfc]">strongest application.</span>
          </h1>
          <p className="muted mt-6 max-w-2xl text-lg leading-8">
            Compare your resume to any role, uncover missing keywords, fix ATS issues,
            and improve every bullet—with no fabricated claims.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="btn btn-primary px-6" href="/analyzer">Analyze Existing Resume <ArrowRight size={17} /></Link>
            <Link className="btn btn-secondary px-6" href="/resume-builder">Create New Resume</Link>
          </div>
          <div className="muted mt-7 flex flex-wrap gap-5 text-sm">
            <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Free to start</span>
            <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> PDF & DOCX</span>
            <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Private by default</span>
          </div>
        </div>
        <div className="card relative overflow-hidden p-5 sm:p-7">
          <div className="absolute -top-16 -right-16 size-44 rounded-full bg-[#ddd9ff] blur-2xl" />
          <div className="relative flex items-center justify-between border-b border-[#ececf3] pb-5">
            <div><p className="text-sm font-bold">Senior Product Designer</p><p className="muted mt-1 text-xs">Resume analysis complete</p></div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Good match</span>
          </div>
          <div className="grid gap-5 py-6 sm:grid-cols-[140px_1fr]">
            <div className="grid place-items-center">
              <div className="grid size-28 place-items-center rounded-full border-[10px] border-[#6d5dfc] text-center">
                <div><strong className="text-3xl">78</strong><p className="muted text-xs">Match score</p></div>
              </div>
            </div>
            <div className="space-y-4">
              {[["Required skills", 85], ["Experience", 74], ["Keywords", 70]].map(([name, score]) => (
                <div key={name}>
                  <div className="mb-1 flex justify-between text-xs font-bold"><span>{name}</span><span>{score}%</span></div>
                  <div className="h-2 rounded-full bg-[#ececf3]"><div className="h-2 rounded-full bg-[#6d5dfc]" style={{ width: `${score}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-emerald-50 p-4"><p className="text-xs font-bold text-emerald-700">MATCHED</p><p className="mt-2 text-sm font-bold">Figma · Research · Prototyping</p></div>
            <div className="rounded-xl bg-amber-50 p-4"><p className="text-xs font-bold text-amber-700">OPPORTUNITY</p><p className="mt-2 text-sm font-bold">Design systems · Analytics</p></div>
          </div>
        </div>
      </section>

      <section id="features" className="border-y border-[#e7e9f2] bg-white py-24">
        <div className="container">
          <div className="text-center"><p className="eyebrow">A clearer way to improve</p><h2 className="mt-3 text-4xl font-black tracking-tight">Know what recruiters will see</h2></div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <article key={title} className="card p-7">
                <span className="grid size-12 place-items-center rounded-xl bg-[#efedff] text-[#6d5dfc]"><Icon /></span>
                <h3 className="mt-5 text-lg font-extrabold">{title}</h3><p className="muted mt-2 leading-7">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="container py-24">
        <p className="eyebrow">Three simple steps</p><h2 className="mt-3 text-4xl font-black">From upload to interview-ready</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            ["01", "Upload your resume", "Securely add a PDF or DOCX up to 5 MB."],
            ["02", "Add the job description", "We separate required and preferred qualifications."],
            ["03", "Get your action plan", "Review the score, evidence, gaps, and safe improvements."],
          ].map(([number, title, text]) => <div key={number} className="border-l-2 border-[#cbc5ff] pl-5"><span className="text-sm font-black text-[#6d5dfc]">{number}</span><h3 className="mt-2 font-extrabold">{title}</h3><p className="muted mt-2">{text}</p></div>)}
        </div>
      </section>

      <section id="privacy" className="container mb-24">
        <div className="overflow-hidden rounded-[2rem] bg-[#17152f] p-9 text-white sm:p-14">
          <div className="grid gap-10 md:grid-cols-[1fr_.7fr] md:items-center">
            <div><ShieldCheck className="text-[#a99fff]" size={36} /><h2 className="mt-5 text-3xl font-black">Your career data stays yours.</h2><p className="mt-4 max-w-2xl leading-7 text-[#bebbd1]">Private storage, strict account isolation, scoped vector retrieval, and complete deletion controls are built into every layer.</p></div>
            <div className="space-y-3 text-sm text-[#dedcec]"><p className="flex gap-3"><LockKeyhole size={18} /> User-scoped database access</p><p className="flex gap-3"><FileSearch2 size={18} /> No cross-resume retrieval</p><p className="flex gap-3"><ShieldCheck size={18} /> Prompt-injection defenses</p></div>
          </div>
        </div>
      </section>
    </main>
  );
}
