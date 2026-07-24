import { z } from "zod";
import { db } from "@/lib/db";
import { fail, ok } from "@/lib/api";

const feedbackSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(100),
  rating: z.number().int().min(1).max(5),
  builderResumeId: z.string().max(100).optional(),
  resumeTitle: z.string().max(120).optional(),
  source: z.enum(["builder", "shared"]).default("builder"),
});

export async function POST(request: Request) {
  const input = feedbackSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) {
    return fail("INVALID_FEEDBACK", "Name and a 1–5 star rating are required.", 400);
  }
  const feedback = await db.exportFeedback.create({
    data: input.data,
    select: { id: true, rating: true },
  });
  return ok(feedback, 201);
}
