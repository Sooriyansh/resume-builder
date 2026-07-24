import { z } from "zod";
import { fail, ok } from "@/lib/api";
import { requireUser } from "@/lib/require-user";

const inputSchema = z.object({
  action: z.enum(["summary", "objective", "improve", "project", "skills", "grammar", "bullets", "missing"]),
  text: z.string().max(8_000),
  skills: z.array(z.string()).max(100).default([]),
  title: z.string().max(120).default("professional"),
});

function sentences(text: string) {
  return text.split(/[\n.!?]+/).map((item) => item.trim()).filter(Boolean);
}

export async function POST(request: Request) {
  const userId = await requireUser();
  if (!userId) return fail("UNAUTHENTICATED", "Please sign in.", 401);
  const input = inputSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return fail("INVALID_INPUT", "Add some text or skills first.", 400);
  const { action, text, skills, title } = input.data;
  const skillText = skills.slice(0, 8).join(", ");
  const cleaned = sentences(text).map((sentence) =>
    sentence.charAt(0).toUpperCase() + sentence.slice(1).replace(/\s+/g, " "),
  );
  const result = {
    summary: `Results-focused ${title || "professional"} with practical experience in ${skillText || "delivering high-quality work"}. Known for solving problems, collaborating effectively, and turning requirements into measurable outcomes.`,
    objective: `Motivated ${title || "graduate"} seeking an opportunity to apply ${skillText || "strong foundational skills"}, contribute to meaningful projects, and grow through hands-on professional experience.`,
    improve: cleaned.map((line) => `Delivered ${line.charAt(0).toLowerCase()}${line.slice(1)}`).join(". "),
    project: `Designed and delivered ${text || "a production-ready project"} using ${skillText || "modern tools"}, focusing on usability, reliability, and maintainable implementation.`,
    skills: [...new Set([...skills, "Communication", "Problem solving", "Git", "Testing"])].join(", "),
    grammar: cleaned.join(". ") + (cleaned.length ? "." : ""),
    bullets: cleaned.map((line) => `• ${/^(built|created|developed|designed|implemented|led)/i.test(line) ? line : `Improved ${line.charAt(0).toLowerCase()}${line.slice(1)}`}`).join("\n"),
    missing: ["Professional summary", "Measurable achievements", "Relevant projects", "Technical skills", "LinkedIn profile"].filter((item) => !text.toLowerCase().includes(item.toLowerCase())).join(", "),
  }[action];
  return ok({ text: result, mode: "local" });
}
