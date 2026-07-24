import { z } from "zod";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { db } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { requireUser } from "@/lib/require-user";
import { getEmbeddings } from "@/lib/ai/embeddings";
import { getChatModel } from "@/lib/ai/model";
import { RESUME_CHAT_PROMPT } from "@/lib/ai/prompts/resume-chat";
import { localEmbedding } from "@/lib/ai/local-embeddings";

type Context = { params: Promise<{ id: string }> };
type RetrievedRow = {
  id: string;
  section: string;
  content: string;
  similarity: number;
};

function cosineSimilarity(left: number[], right: number[]) {
  if (left.length !== right.length || left.length === 0) return 0;
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] ** 2;
    rightMagnitude += right[index] ** 2;
  }
  const denominator = Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude);
  return denominator === 0 ? 0 : dot / denominator;
}

export async function POST(request: Request, { params }: Context) {
  const userId = await requireUser();
  if (!userId) return fail("UNAUTHENTICATED", "Please sign in.", 401);
  const input = z.object({ question: z.string().trim().min(2).max(1_000) })
    .safeParse(await request.json().catch(() => null));
  if (!input.success) return fail("INVALID_QUESTION", "Ask a question under 1,000 characters.", 400);
  const { id } = await params;
  const analysis = await db.analysis.findFirst({
    where: { id, userId },
    include: { jobDescription: { select: { rawText: true } } },
  });
  if (!analysis) return fail("NOT_FOUND", "Analysis not found.", 404);

  try {
    let queryVector: number[];
    try {
      queryVector = await getEmbeddings().embedQuery(input.data.question);
    } catch {
      queryVector = localEmbedding(input.data.question);
    }
    const chunks = await db.resumeChunk.findMany({
      where: {
        userId,
        resumeId: analysis.resumeId,
        embedding: { not: null },
      },
      select: { id: true, section: true, content: true, embedding: true },
    });
    const sources: RetrievedRow[] = chunks
      .map((chunk) => {
        let embedding: number[] = [];
        try {
          embedding = JSON.parse(chunk.embedding ?? "[]") as number[];
        } catch {
          embedding = [];
        }
        return {
          id: chunk.id,
          section: chunk.section,
          content: chunk.content,
          similarity: cosineSimilarity(queryVector, embedding),
        };
      })
      .filter((source) => source.similarity >= 0.25)
      .sort((left, right) => right.similarity - left.similarity)
      .slice(0, 5);
    const uniqueSources = [...new Map(sources.map((source) => [source.id, source])).values()];
    const context = uniqueSources
      .map((source) => `[Section: ${source.section}]\n${source.content}`)
      .join("\n\n")
      .slice(0, 12_000);
    let answer: string;
    try {
      const response = await getChatModel().invoke([
        new SystemMessage(RESUME_CHAT_PROMPT),
        new HumanMessage(
          `RETRIEVED_RESUME_DATA:\n${context || "No relevant context."}\n\n` +
          `JOB_DESCRIPTION_DATA:\n${analysis.jobDescription.rawText.slice(0, 8_000)}\n\n` +
          `USER_QUESTION:\n${input.data.question}`,
        ),
      ]);
      answer = typeof response.content === "string"
        ? response.content
        : "This information was not found in the resume.";
    } catch {
      answer = context
        ? `Relevant resume information:\n\n${context.slice(0, 4_000)}`
        : "No relevant information was found in the resume.";
    }
    let chat = await db.chatSession.findFirst({ where: { userId, analysisId: id } });
    chat ??= await db.chatSession.create({
      data: { userId, analysisId: id, resumeId: analysis.resumeId },
    });
    await db.chatMessage.createMany({
      data: [
        { chatSessionId: chat.id, role: "user", content: input.data.question },
        { chatSessionId: chat.id, role: "assistant", content: answer, sources: uniqueSources },
      ],
    });
    return ok({ answer, sources: uniqueSources });
  } catch {
    return fail("CHAT_FAILED", "Resume chat is temporarily unavailable.", 503);
  }
}

export async function GET(_: Request, { params }: Context) {
  const userId = await requireUser();
  if (!userId) return fail("UNAUTHENTICATED", "Please sign in.", 401);
  const { id } = await params;
  const chat = await db.chatSession.findFirst({
    where: { userId, analysisId: id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  return ok(chat?.messages ?? []);
}
