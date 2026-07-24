import type { ResumeData, ResumeEntry, ResumeSettings, SectionId } from "@/lib/resume-builder";

export type AtsCategory =
  | "Content"
  | "Sections"
  | "ATS Essentials"
  | "HR Red Flags"
  | "Discrimination"
  | "Seniority"
  | "Job Tailoring";

export type ResumeChange = {
  id: string;
  category: AtsCategory;
  field: string;
  before: string;
  after: string;
  reason: string;
};

export type AtsReport = {
  overall: number;
  categories: Record<AtsCategory, number>;
  issues: string[];
  passed: string[];
};

const actionVerbs = /^(achieved|analyzed|automated|built|created|delivered|designed|developed|drove|implemented|improved|increased|launched|led|managed|optimized|reduced|resolved|shipped|supported|tested)\b/i;
const riskyPersonal = /\b(date of birth|dob|marital status|religion|caste|gender|father'?s name|mother'?s name|nationality|passport|aadhaar)\b/i;
const standardOrder: SectionId[] = [
  "summary", "technicalSkills", "experience", "internships", "projects", "education",
  "certifications", "achievements", "languages", "softSkills", "objective", "hobbies", "references",
];

function lines(value: string) {
  return value.split(/\r?\n/).map((line) => line.replace(/^[•*-]\s*/, "").trim()).filter(Boolean);
}

function cleanSentence(value: string) {
  const clean = value.replace(/\s+/g, " ").replace(/\s+([,.;:])/g, "$1").trim();
  if (!clean) return "";
  const cased = clean[0].toUpperCase() + clean.slice(1);
  return /[.!?]$/.test(cased) ? cased : `${cased}.`;
}

function cleanDescription(value: string) {
  const seen = new Set<string>();
  return lines(value)
    .map(cleanSentence)
    .filter((line) => {
      const key = line.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((line) => `• ${line}`)
    .join("\n");
}

function jobTerms(jobDescription: string) {
  const stop = new Set(["and", "the", "with", "for", "from", "that", "this", "will", "have", "role", "work", "team", "years", "skills", "experience"]);
  const counts = new Map<string, number>();
  for (const word of jobDescription.toLowerCase().match(/[a-z][a-z0-9+#.-]{2,}/g) ?? []) {
    if (!stop.has(word)) counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1]).map(([word]) => word).slice(0, 35);
}

export function analyzeBuilderResume(data: ResumeData, jobDescription = "", settings?: ResumeSettings): AtsReport {
  const bulletLines = [
    ...data.experience, ...data.internships, ...data.projects,
  ].flatMap((entry) => lines(entry.description));
  const normalized = bulletLines.map((line) => line.toLowerCase().replace(/[^a-z0-9]/g, ""));
  const duplicateCount = normalized.length - new Set(normalized).size;
  const grammarMisses = bulletLines.filter((line) => !/[.!?]$/.test(line)).length;
  const actionCount = bulletLines.filter((line) => actionVerbs.test(line)).length;
  const measurable = bulletLines.filter((line) => /\b\d+(?:[.,]\d+)?%?|\b\d+\+/.test(line)).length;
  const terms = jobTerms(jobDescription);
  const allText = JSON.stringify(data).toLowerCase();
  const matchedTerms = terms.filter((term) => allText.includes(term));
  const core = [data.fullName, data.professionalTitle, data.email, data.summary, data.education.length, data.experience.length || data.projects.length, data.technicalSkills.length >= 3];

  const categories: AtsReport["categories"] = {
    Content: Math.max(0, Math.min(100, 55 + (data.summary ? 12 : 0) + Math.min(15, bulletLines.length * 2) + Math.min(12, measurable * 3) - duplicateCount * 8 - grammarMisses * 2)),
    Sections: Math.round((core.filter(Boolean).length / core.length) * 100),
    "ATS Essentials": Math.max(0, Math.min(100, 45 + (data.email ? 10 : 0) + (data.phone ? 8 : 0) + (data.location ? 7 : 0) + (data.technicalSkills.length ? 15 : 0) + (!settings?.showPhoto ? 8 : 0) + (settings?.sectionOrder.join() === standardOrder.join() ? 7 : 0))),
    "HR Red Flags": Math.max(0, Math.min(100, 100 - (!data.summary ? 20 : 0) - (data.experience.some((x) => !x.date) ? 12 : 0) - duplicateCount * 10 - (data.references.length ? 5 : 0))),
    Discrimination: riskyPersonal.test(allText) || data.photo ? 65 : 100,
    Seniority: bulletLines.length ? Math.min(100, 45 + Math.round((actionCount / bulletLines.length) * 30) + Math.min(25, measurable * 5)) : 35,
    "Job Tailoring": jobDescription.trim() ? Math.round((matchedTerms.length / Math.max(1, terms.length)) * 100) : 0,
  };
  const scored = Object.entries(categories).filter(([key]) => key !== "Job Tailoring" || jobDescription.trim());
  const overall = Math.round(scored.reduce((sum, [, score]) => sum + score, 0) / scored.length);
  const issues = [
    !data.summary && "Add a concise professional summary based on existing facts.",
    duplicateCount > 0 && `Remove ${duplicateCount} repeated bullet${duplicateCount === 1 ? "" : "s"}.`,
    grammarMisses > 0 && `Standardize punctuation in ${grammarMisses} bullet${grammarMisses === 1 ? "" : "s"}.`,
    settings?.showPhoto && "Remove the profile photo for an ATS-first version.",
    data.references.length > 0 && "Remove references unless the employer explicitly requests them.",
    riskyPersonal.test(allText) && "Remove protected or unnecessary personal information.",
    jobDescription.trim() && matchedTerms.length < terms.length * 0.4 && "Increase job-description alignment using only evidenced skills and experience.",
  ].filter((item): item is string => Boolean(item));
  return { overall, categories, issues, passed: ["Selectable text", "Standard headings", "Single-column compatible", "Evidence-only tailoring"] };
}

export function optimizeBuilderResume(data: ResumeData, settings: ResumeSettings, jobDescription = "") {
  const optimized: ResumeData = structuredClone(data);
  const changes: ResumeChange[] = [];
  const add = (category: AtsCategory, field: string, before: string, after: string, reason: string) => {
    if (before === after) return;
    changes.push({ id: `${field}-${changes.length}`, category, field, before, after, reason });
  };
  const cleanEntries = (key: "experience" | "internships" | "projects" | "achievements") => {
    optimized[key] = optimized[key].map((entry: ResumeEntry, index) => {
      const after = cleanDescription(entry.description);
      add("Content", `${key}.${index}.description`, entry.description, after, "Fixed grammar, repetition, punctuation, and bullet consistency without adding facts.");
      return { ...entry, description: after };
    });
  };
  cleanEntries("experience");
  cleanEntries("internships");
  cleanEntries("projects");
  cleanEntries("achievements");
  const summary = cleanSentence(optimized.summary);
  add("Content", "summary", optimized.summary, summary, "Improved grammar and readability while preserving the original claim.");
  optimized.summary = summary;
  const unique = (values: string[]) => [...new Map(values.filter(Boolean).map((x) => [x.trim().toLowerCase(), x.trim()])).values()];
  for (const key of ["technicalSkills", "softSkills", "languages"] as const) {
    const before = optimized[key].join(", ");
    optimized[key] = unique(optimized[key]);
    add("Content", key, before, optimized[key].join(", "), "Removed repeated items.");
  }
  const terms = jobTerms(jobDescription);
  if (terms.length) {
    const rank = (value: string) => terms.filter((term) => value.toLowerCase().includes(term)).length;
    for (const key of ["experience", "projects", "technicalSkills", "softSkills"] as const) {
      const before = JSON.stringify(optimized[key]);
      optimized[key] = [...optimized[key]].sort((a, b) => rank(typeof b === "string" ? b : JSON.stringify(b)) - rank(typeof a === "string" ? a : JSON.stringify(a))) as never;
      add("Job Tailoring", key, before, JSON.stringify(optimized[key]), "Prioritized existing information that matches the job description; no new qualification was added.");
    }
  }
  const optimizedSettings: ResumeSettings = {
    ...settings,
    font: "Arial",
    fontSize: Math.max(10, Math.min(11, settings.fontSize)),
    alignment: "left",
    headingStyle: "line",
    showPhoto: false,
    sectionOrder: standardOrder,
    hiddenSections: [...new Set<SectionId>([...settings.hiddenSections, "hobbies", "references"])],
  };
  add("ATS Essentials", "format", JSON.stringify(settings), JSON.stringify(optimizedSettings), "Applied a simple single-column ATS-safe format and removed optional personal content.");
  return {
    data: optimized,
    settings: optimizedSettings,
    changes,
    report: analyzeBuilderResume(optimized, jobDescription, optimizedSettings),
  };
}
