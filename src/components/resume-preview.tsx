"use client";

import type { ResumeData, ResumeEntry, ResumeSettings, SectionId } from "@/lib/resume-builder";

const labels: Record<SectionId, string> = {
  summary: "Professional Summary", objective: "Career Objective",
  experience: "Work Experience", internships: "Internships", education: "Education",
  projects: "Projects", technicalSkills: "Technical Skills", softSkills: "Soft Skills",
  certifications: "Certifications", achievements: "Achievements", languages: "Languages",
  hobbies: "Hobbies", references: "References",
};

const templateStyles: Record<string, { accent: string; header: string; columns: boolean }> = {
  modern: { accent: "border-l-4", header: "bg-slate-900 text-white", columns: true },
  simple: { accent: "border-b", header: "", columns: false },
  corporate: { accent: "border-l-8", header: "bg-slate-100", columns: false },
  creative: { accent: "rounded-lg border", header: "rounded-b-[2rem] text-white", columns: true },
  ats: { accent: "border-b-2", header: "", columns: false },
  fresher: { accent: "border-b", header: "bg-blue-50", columns: false },
  experienced: { accent: "border-l-4", header: "bg-neutral-900 text-white", columns: false },
  developer: { accent: "border-l-4", header: "bg-[#111827] text-white", columns: true },
  designer: { accent: "rounded-full border", header: "rounded-3xl text-white", columns: true },
  "big-tech": { accent: "border-b-2", header: "", columns: false },
  microsoft: { accent: "border-b-2", header: "bg-slate-50", columns: false },
  google: { accent: "border-b", header: "", columns: false },
  amazon: { accent: "border-l-4", header: "bg-slate-950 text-white", columns: false },
  "software-engineer": { accent: "border-b-2", header: "", columns: false },
  "professional-developer": { accent: "border-l-4", header: "bg-[#111827] text-white", columns: false },
  internship: { accent: "border-b", header: "bg-blue-50", columns: false },
  executive: { accent: "border-l-8", header: "bg-neutral-900 text-white", columns: false },
  "data-analyst": { accent: "border-b-2", header: "bg-slate-100", columns: false },
};

function Entries({ items }: { items: ResumeEntry[] }) {
  return <div className="space-y-3">{items.map((item) => <div key={item.id} className="break-inside-avoid">
    <div className="flex items-start justify-between gap-4"><div><strong>{item.title}</strong>{item.subtitle && <p className="opacity-75">{item.subtitle}</p>}</div><span className="shrink-0 text-[.9em] opacity-70">{item.date}</span></div>
    {item.description && <div className="mt-1 whitespace-pre-line leading-relaxed">{item.description}</div>}
  </div>)}</div>;
}

export function ResumePreview({ data, settings, template }: {
  data: ResumeData;
  settings: ResumeSettings;
  template: string;
}) {
  const style = templateStyles[template] ?? templateStyles.modern;
  const hidden = new Set(settings.hiddenSections);
  const sections: Partial<Record<SectionId, React.ReactNode>> = {
    summary: data.summary && <p className="leading-relaxed">{data.summary}</p>,
    objective: data.objective && <p className="leading-relaxed">{data.objective}</p>,
    experience: data.experience.length > 0 && <Entries items={data.experience} />,
    internships: data.internships.length > 0 && <Entries items={data.internships} />,
    education: data.education.length > 0 && <Entries items={data.education} />,
    projects: data.projects.length > 0 && <Entries items={data.projects} />,
    certifications: data.certifications.length > 0 && <Entries items={data.certifications} />,
    achievements: data.achievements.length > 0 && <Entries items={data.achievements} />,
    references: data.references.length > 0 && <Entries items={data.references} />,
    technicalSkills: data.technicalSkills.length > 0 && <p>{data.technicalSkills.join(" · ")}</p>,
    softSkills: data.softSkills.length > 0 && <p>{data.softSkills.join(" · ")}</p>,
    languages: data.languages.length > 0 && <p>{data.languages.join(" · ")}</p>,
    hobbies: data.hobbies.length > 0 && <p>{data.hobbies.join(" · ")}</p>,
  };
  const visibleSections = settings.sectionOrder.filter((id) => !hidden.has(id) && sections[id]);

  return <article
    id="resume-print-area"
    className="resume-page mx-auto min-h-[297mm] w-[210mm] max-w-full bg-white text-slate-800 shadow-xl print:shadow-none"
    style={{ fontFamily: settings.font, fontSize: `${settings.fontSize}pt`, lineHeight: 1.45 }}
  >
    <header className={`p-8 ${style.header}`} style={{ backgroundColor: style.header.includes("text-white") ? settings.color : undefined, textAlign: settings.alignment }}>
      <div className="flex items-center gap-5">
        <div className="flex-1">
          <h1 className="text-3xl font-black tracking-tight">{data.fullName || "Your Name"}</h1>
          <p className="mt-1 text-lg opacity-80">{data.professionalTitle || "Professional Title"}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[.9em]">
            {[data.email, data.phone, data.location].filter(Boolean).map((value) => <span key={value}>{value}</span>)}
            {[data.linkedin, data.github, data.portfolio].filter(Boolean).map((value) => <a key={value} href={value} target="_blank" rel="noreferrer">{value}</a>)}
          </div>
        </div>
      </div>
    </header>
    <div className="p-8">
      {visibleSections.map((id) => <section key={id} className="mb-4 break-inside-avoid" style={{ marginBottom: settings.spacing }}>
        <h2
          className={`mb-2 text-[1.08em] font-black uppercase tracking-[.12em] ${style.accent} ${settings.headingStyle === "block" ? "px-2 py-1 text-white" : "pb-1"}`}
          style={{
            borderColor: settings.color,
            color: settings.headingStyle === "block" ? "white" : settings.color,
            backgroundColor: settings.headingStyle === "block" ? settings.color : undefined,
          }}
        >{labels[id]}</h2>
        {sections[id]}
      </section>)}
    </div>
  </article>;
}
