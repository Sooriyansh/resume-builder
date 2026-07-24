import { fail, ok } from "@/lib/api";
import { requireUser } from "@/lib/require-user";
import { defaultResumeSettings, resumeDataSchema } from "@/lib/resume-builder";
import { analyzeBuilderResume } from "@/lib/resume/ats-optimizer";
import { z } from "zod";

const inputSchema = z.object({
  data: resumeDataSchema,
  jobDescription: z.string().trim().max(50_000).default(""),
});

const STOP_WORDS = new Set([
  "and", "the", "with", "for", "that", "this", "from", "your", "you", "our",
  "are", "will", "have", "has", "job", "role", "work", "team", "years", "using",
  "into", "who", "but", "not", "all", "can", "skills", "experience",
  "need", "needs", "needed", "looking", "seeking", "experienced", "candidate",
  "responsible", "responsibilities", "requirements", "required", "preferred",
]);

function keywords(text: string) {
  const frequencies = new Map<string, number>();
  for (const word of text.toLowerCase().match(/[a-z][a-z0-9+#.-]{2,}/g) ?? []) {
    if (!STOP_WORDS.has(word)) frequencies.set(word, (frequencies.get(word) ?? 0) + 1);
  }
  return [...frequencies].sort((left, right) => right[1] - left[1]).map(([word]) => word);
}

export async function POST(request: Request) {
  const userId = await requireUser();
  if (!userId) return fail("UNAUTHENTICATED", "Please sign in.", 401);
  const raw = await request.json().catch(() => null);
  const input = inputSchema.safeParse(raw?.data ? raw : { data: raw, jobDescription: "" });
  if (!input.success) return fail("INVALID_RESUME", "Complete the important fields first.", 400);
  const { data, jobDescription } = input.data;
  const detailed = analyzeBuilderResume(data, jobDescription, defaultResumeSettings);
  const resumeText = JSON.stringify(data).toLowerCase();
  const jobKeywords = keywords(jobDescription).slice(0, 30);
  const matchedKeywords = jobKeywords.filter((keyword) => resumeText.includes(keyword));
  const missingKeywords = jobKeywords.filter((keyword) => !resumeText.includes(keyword)).slice(0, 12);
  const skillCount = data.technicalSkills.length + data.softSkills.length;
  const checks = [
    data.fullName, data.email, data.phone, data.summary,
    data.education.length, data.experience.length || data.projects.length,
    data.technicalSkills.length >= 4,
  ];
  const structureScore = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  const keywordScore = jobKeywords.length
    ? Math.round((matchedKeywords.length / jobKeywords.length) * 100)
    : structureScore;
  const grammarIssues = [data.summary, ...data.experience.map((item) => item.description)]
    .filter((text) => text && !/[.!?]$/.test(text.trim()))
    .length;
  return ok({
    atsScore: detailed.overall,
    categories: detailed.categories,
    issues: detailed.issues,
    passed: detailed.passed,
    jobCompatibilityScore: jobKeywords.length ? keywordScore : Math.min(100, 45 + skillCount * 4),
    matchedKeywords,
    missingKeywords: jobKeywords.length
      ? missingKeywords
      : skillCount < 6 ? ["Add role-specific tools", "Add job-description keywords"] : [],
    skillSuggestions: data.technicalSkills.length < 5 ? ["Git", "Testing", "REST APIs"] : [],
    grammarIssues,
    experienceSuggestions: data.experience.some((item) => !/\d/.test(item.description))
      ? ["Add measurable impact to experience bullets."] : [],
    sectionRecommendations: [
      !data.summary && "Add a professional summary.",
      !data.projects.length && "Add relevant projects.",
      !data.achievements.length && "Add measurable achievements.",
    ].filter(Boolean),
  });
}
