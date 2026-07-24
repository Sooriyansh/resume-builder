import { z } from "zod";
import type { ParsedResume } from "./schemas";

const url = z.union([z.literal(""), z.string().url()]);
const entry = z.object({
  id: z.string(),
  title: z.string().max(160),
  subtitle: z.string().max(160),
  date: z.string().max(100),
  description: z.string().max(4_000),
});

export const resumeDataSchema = z.object({
  fullName: z.string().max(120),
  professionalTitle: z.string().max(120),
  photo: z.string().max(2_000_000),
  email: z.union([z.literal(""), z.string().email()]),
  phone: z.string().max(30),
  location: z.string().max(120),
  linkedin: url,
  github: url,
  portfolio: url,
  summary: z.string().max(2_500),
  objective: z.string().max(2_500),
  technicalSkills: z.array(z.string().max(80)).max(100),
  softSkills: z.array(z.string().max(80)).max(100),
  languages: z.array(z.string().max(80)).max(30),
  hobbies: z.array(z.string().max(80)).max(30),
  education: z.array(entry).max(20),
  experience: z.array(entry).max(30),
  internships: z.array(entry).max(20),
  projects: z.array(entry).max(30),
  certifications: z.array(entry).max(30),
  achievements: z.array(entry).max(30),
  references: z.array(entry).max(10),
});

export const sectionIds = [
  "summary", "objective", "experience", "internships", "education", "projects",
  "technicalSkills", "softSkills", "certifications", "achievements", "languages",
  "hobbies", "references",
] as const;

export const resumeSettingsSchema = z.object({
  font: z.enum(["Inter", "Georgia", "Arial", "Times New Roman"]),
  fontSize: z.number().min(9).max(14),
  headingStyle: z.enum(["line", "block", "minimal"]),
  alignment: z.enum(["left", "center"]),
  spacing: z.number().min(8).max(28),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  showPhoto: z.boolean(),
  hiddenSections: z.array(z.enum(sectionIds)),
  sectionOrder: z.array(z.enum(sectionIds)),
});

export const builderResumeSchema = z.object({
  title: z.string().trim().min(1).max(120),
  template: z.enum([
    "modern", "simple", "corporate", "creative", "ats", "fresher",
    "experienced", "developer", "designer",
    "big-tech", "microsoft", "google", "amazon", "software-engineer",
    "professional-developer", "internship", "executive", "data-analyst",
  ]),
  data: resumeDataSchema,
  settings: resumeSettingsSchema,
});

export type ResumeData = z.infer<typeof resumeDataSchema>;
export type ResumeSettings = z.infer<typeof resumeSettingsSchema>;
export type ResumeEntry = z.infer<typeof entry>;
export type SectionId = (typeof sectionIds)[number];

export const emptyResumeData: ResumeData = {
  fullName: "", professionalTitle: "", photo: "", email: "", phone: "",
  location: "", linkedin: "", github: "", portfolio: "", summary: "", objective: "",
  technicalSkills: [], softSkills: [], languages: [], hobbies: [],
  education: [], experience: [], internships: [], projects: [],
  certifications: [], achievements: [], references: [],
};

export const defaultResumeSettings: ResumeSettings = {
  font: "Arial", fontSize: 10.5, headingStyle: "line", alignment: "left",
  spacing: 14, color: "#111827", showPhoto: false, hiddenSections: ["hobbies", "references"],
  sectionOrder: [...sectionIds],
};

export const sampleResumeData: ResumeData = {
  ...emptyResumeData,
  fullName: "Aarav Sharma",
  professionalTitle: "Full Stack Developer",
  email: "aarav@example.com",
  phone: "+91 98765 43210",
  location: "Bengaluru, India",
  linkedin: "https://linkedin.com/in/aarav",
  github: "https://github.com/aarav",
  summary: "Full stack developer focused on reliable, accessible web products. Experienced in building React and Node.js applications with measurable business impact.",
  technicalSkills: ["JavaScript", "TypeScript", "React", "Next.js", "Node.js", "PostgreSQL", "Docker"],
  softSkills: ["Communication", "Problem solving", "Collaboration"],
  experience: [{ id: "sample-exp", title: "Software Developer", subtitle: "Acme Technologies", date: "2024 – Present", description: "• Built customer-facing workflows used by 10,000+ monthly users.\n• Reduced API response times by 35% through caching and query optimization." }],
  education: [{ id: "sample-edu", title: "Bachelor of Computer Applications", subtitle: "City University", date: "2021 – 2024", description: "Graduated with distinction." }],
  projects: [{ id: "sample-project", title: "Team Planning Platform", subtitle: "Next.js · Node.js · PostgreSQL", date: "2024", description: "Designed and shipped a collaborative planning tool with role-based access and real-time updates." }],
  certifications: [{ id: "sample-cert", title: "AWS Cloud Practitioner", subtitle: "Amazon Web Services", date: "2024", description: "" }],
  languages: ["English", "Hindi"],
};

export function resumeCompletion(data: ResumeData) {
  const checks = [
    data.fullName, data.professionalTitle, data.email, data.phone, data.summary,
    data.technicalSkills.length, data.education.length,
    data.experience.length || data.internships.length || data.projects.length,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function parsedResumeToBuilderData(parsed: ParsedResume): ResumeData {
  const entry = (title: string | null, subtitle: string | null, date: string, description: string) => ({
    id: crypto.randomUUID(),
    title: (title ?? "").slice(0, 160),
    subtitle: (subtitle ?? "").slice(0, 160),
    date,
    description: description.slice(0, 4_000),
  });
  const normalizeUrl = (value: string | null) =>
    value && !/^https?:\/\//i.test(value) ? `https://${value}` : value ?? "";
  return {
    ...emptyResumeData,
    fullName: parsed.personalInfo.name ?? "",
    professionalTitle: (parsed.headline ?? "").slice(0, 120),
    email: parsed.personalInfo.email ?? "",
    phone: parsed.personalInfo.phone ?? "",
    location: parsed.personalInfo.location ?? "",
    linkedin: normalizeUrl(parsed.personalInfo.linkedinUrl),
    github: normalizeUrl(parsed.personalInfo.githubUrl),
    portfolio: normalizeUrl(parsed.personalInfo.portfolioUrl),
    summary: parsed.summary ?? "",
    technicalSkills: [...new Set([
      ...parsed.skills.technical, ...parsed.skills.frameworks, ...parsed.skills.tools,
      ...parsed.skills.databases, ...parsed.skills.cloudPlatforms,
    ])],
    softSkills: parsed.skills.soft,
    languages: parsed.languages,
    hobbies: parsed.interests,
    experience: parsed.experience.map((item) => entry(
      item.jobTitle,
      item.company,
      [item.startDate, item.endDate].filter(Boolean).join(" – "),
      [...item.description, ...item.achievements].map((line) => `• ${line.replace(/^•\s*/, "")}`).join("\n"),
    )),
    education: parsed.education.map((item) => entry(
      item.degree,
      item.institution,
      [item.startYear, item.graduationYear].filter(Boolean).join(" – "),
      [item.fieldOfStudy, item.grade].filter(Boolean).join(" · "),
    )),
    projects: parsed.projects.map((item) => entry(
      item.name,
      item.technologies.join(" · "),
      "",
      [item.description, ...item.achievements, item.url].filter(Boolean).join("\n"),
    )),
    certifications: parsed.certifications.map((item) => entry(
      item.name,
      item.issuer,
      item.issueDate ?? "",
      "",
    )),
    achievements: parsed.awards.map((award) => entry(award, "", "", "")),
    internships: [],
    references: [],
  };
}
