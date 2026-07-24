import { z } from "zod";
import { db } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { requireUser } from "@/lib/require-user";
import { parsedJobDescriptionSchema, parsedResumeSchema } from "@/lib/schemas";
import { scoreResume } from "@/lib/scoring";
import { getAIConfig } from "@/lib/ai/provider";

const inputSchema = z.object({ resumeId: z.string(), jobDescriptionId: z.string() });

export async function POST(request: Request) {
  const userId = await requireUser();
  if (!userId) return fail("UNAUTHENTICATED", "Please sign in.", 401);
  const input = inputSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return fail("INVALID_INPUT", "Resume and job description are required.", 400);
  const [resume, job] = await Promise.all([
    db.resume.findFirst({ where: { id: input.data.resumeId, userId } }),
    db.jobDescription.findFirst({ where: { id: input.data.jobDescriptionId, userId } }),
  ]);
  if (!resume || !job) return fail("NOT_FOUND", "Resume or job description not found.", 404);
  const parsedResume = parsedResumeSchema.safeParse(resume.parsedData);
  const parsedJob = parsedJobDescriptionSchema.safeParse(job.parsedData);
  if (!parsedResume.success || !parsedJob.success) {
    return fail("NOT_PARSED", "Parse the resume and job description first.", 422);
  }
  const score = scoreResume(parsedResume.data, parsedJob.data);
  const missingContact = [
    !parsedResume.data.personalInfo.email && "email",
    !parsedResume.data.personalInfo.phone && "phone",
    !parsedResume.data.personalInfo.location && "location",
  ].filter((item): item is string => Boolean(item));
  const result = {
    ...score,
    strengths: [
      score.matchedSkills.length
        ? `Matches ${score.matchedSkills.length} required skills.`
        : "Resume contains readable structured sections.",
    ],
    weaknesses: score.missingRequiredSkills.map((skill) => `Required skill not evidenced: ${skill}`),
    atsIssues: missingContact.map((field, index) => ({
      id: `contact-${index}`,
      category: "Contact information",
      issue: `Missing ${field}`,
      severity: "medium",
      recommendation: `Add your ${field} so recruiters can contact you.`,
      evidence: null,
    })),
    experienceAnalysis: {
      requiredExperienceYears: parsedJob.data.minimumExperienceYears,
      estimatedCandidateExperienceYears: parsedResume.data.estimatedExperienceYears,
      relevantExperienceSummary: `${score.scoreBreakdown.relevantExperience}% evidence-based experience alignment.`,
      isExperienceSuitable: score.scoreBreakdown.relevantExperience >= 60,
      explanation: "Based on stated years, technologies, and responsibility keyword overlap.",
    },
    educationAnalysis: {
      requiredEducation: parsedJob.data.requiredEducation,
      candidateEducation: parsedResume.data.education.map((item) => item.degree).filter((item): item is string => Boolean(item)),
      matchedRequirements: [],
      missingRequirements: parsedJob.data.requiredEducation,
      explanation: "Only explicitly listed education is considered.",
    },
    improvementSuggestions: score.missingRequiredSkills.map((skill, index) => ({
      id: `skill-${index}`,
      section: "Skills",
      priority: "high",
      currentIssue: `${skill} is not evidenced in the resume.`,
      recommendation: `Add ${skill} only if you have genuine hands-on experience with it.`,
      example: null,
      requiresUserVerification: true,
    })),
    suggestedBulletRewrites: [],
    interviewQuestions: score.missingRequiredSkills.slice(0, 5).map((skill) => ({
      question: `Can you describe any hands-on experience you have with ${skill}?`,
      reason: "Verify a role requirement not evidenced in the resume.",
      category: "Skills gap",
    })),
    recruiterSummary: `${score.verdict} with an ATS readiness estimate of ${score.overallScore}%.`,
    createdAt: new Date().toISOString(),
  };
  const analysis = await db.analysis.create({
    data: {
      userId,
      resumeId: resume.id,
      jobDescriptionId: job.id,
      overallScore: score.overallScore,
      verdict: score.verdict.replace(" ", "_").toUpperCase() as "POOR_MATCH" | "AVERAGE_MATCH" | "GOOD_MATCH" | "STRONG_MATCH",
      scoreBreakdown: score.scoreBreakdown,
      result,
      modelName: getAIConfig().chatModel,
    },
  });
  return ok({ ...analysis, result: { ...result, id: analysis.id, resumeId: resume.id } }, 201);
}

export async function GET(request: Request) {
  const userId = await requireUser();
  if (!userId) return fail("UNAUTHENTICATED", "Please sign in.", 401);
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.slice(0, 100);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const analyses = await db.analysis.findMany({
    where: {
      userId,
      ...(query ? { OR: [
        { resume: { originalFilename: { contains: query } } },
        { jobDescription: { title: { contains: query } } },
      ] } : {}),
    },
    include: { resume: { select: { originalFilename: true } }, jobDescription: { select: { title: true, companyName: true } } },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * 10,
    take: 10,
  });
  return ok(analyses);
}
