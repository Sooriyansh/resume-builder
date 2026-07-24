import { z } from "zod";
import { fail, ok } from "@/lib/api";
import { requireUser } from "@/lib/require-user";
import { resumeDataSchema } from "@/lib/resume-builder";

const inputSchema = z.object({
  data: resumeDataSchema,
  jobDescription: z.string().trim().min(50).max(50_000),
});

function sentence(text: string) {
  const trimmed = text.trim().replace(/\s+/g, " ");
  return trimmed && !/[.!?]$/.test(trimmed) ? `${trimmed}.` : trimmed;
}

function relevance(text: string, terms: string[]) {
  const lower = text.toLowerCase();
  return terms.filter((term) => lower.includes(term.toLowerCase())).length;
}

export async function POST(request: Request) {
  const userId = await requireUser();
  if (!userId) return fail("UNAUTHENTICATED", "Please sign in.", 401);
  const input = inputSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return fail("INVALID_INPUT", "Add a complete job description first.", 400);
  const { data, jobDescription } = input.data;
  const lowerJob = jobDescription.toLowerCase();

  // Only prioritize skills the user already entered. Never invent qualifications.
  const matchedTechnical = data.technicalSkills.filter((skill) =>
    lowerJob.includes(skill.toLowerCase()),
  );
  const unmatchedTechnical = data.technicalSkills.filter((skill) =>
    !matchedTechnical.includes(skill),
  );
  const matchedSoft = data.softSkills.filter((skill) =>
    lowerJob.includes(skill.toLowerCase()),
  );
  const emphasis = [...matchedTechnical, ...matchedSoft].slice(0, 8);
  const role = data.professionalTitle || "Professional";
  const existingSummary = sentence(data.summary);
  const tailoredSummary = emphasis.length
    ? `${role} with demonstrated experience in ${emphasis.join(", ")}. ${existingSummary}`.trim()
    : existingSummary || `${role} focused on reliable execution, measurable outcomes, and continuous improvement.`;

  const improveEntries = <T extends { description: string }>(items: T[]) =>
    [...items]
      .sort((left, right) =>
        relevance(right.description, emphasis) - relevance(left.description, emphasis),
      )
      .map((item) => ({
        ...item,
        description: item.description
          .split("\n")
          .map((line) => sentence(line.replace(/^•\s*/, "")))
          .filter(Boolean)
          .map((line) => `• ${line}`)
          .join("\n"),
      }));

  const tailored = {
    ...data,
    summary: tailoredSummary,
    objective: data.objective
      ? sentence(data.objective)
      : data.experience.length === 0
        ? `Seeking a ${role} opportunity to apply ${emphasis.join(", ") || "relevant skills"} while contributing to company goals and growing through hands-on responsibility.`
        : "",
    technicalSkills: [...matchedTechnical, ...unmatchedTechnical],
    softSkills: [...matchedSoft, ...data.softSkills.filter((skill) => !matchedSoft.includes(skill))],
    experience: improveEntries(data.experience),
    internships: improveEntries(data.internships),
    projects: improveEntries(data.projects),
  };

  return ok({
    data: tailored,
    matchedSkills: matchedTechnical,
    changes: [
      "Prioritized skills found in the job description.",
      "Rewrote the summary around evidenced matching skills.",
      "Moved the most relevant experience and projects higher.",
      "Standardized existing descriptions into action-oriented bullets.",
    ],
    safety: "No new skills, employers, dates, achievements, or metrics were added.",
  });
}
