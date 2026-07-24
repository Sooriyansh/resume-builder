import { createHash } from "crypto";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { db } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { requireUser } from "@/lib/require-user";
import { getAIConfig } from "@/lib/ai/provider";
import { getEmbeddings } from "@/lib/ai/embeddings";
import { localEmbedding } from "@/lib/ai/local-embeddings";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUser();
  if (!userId) return fail("UNAUTHENTICATED", "Please sign in.", 401);
  const { id } = await params;
  const resume = await db.resume.findFirst({ where: { id, userId } });
  if (!resume?.extractedText) return fail("NOT_FOUND", "Resume text not found.", 404);
  try {
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 150 });
    const documents = await splitter.createDocuments([resume.extractedText]);
    const model = getAIConfig().embeddingModel;
    let vectors: number[][];
    try {
      vectors = await getEmbeddings().embedDocuments(documents.map((doc) => doc.pageContent));
    } catch (error) {
      console.warn("AI embeddings unavailable; using local embeddings.", error);
      vectors = documents.map((document) => localEmbedding(document.pageContent));
    }
    await db.$transaction(async (tx) => {
      for (let index = 0; index < documents.length; index += 1) {
        const content = documents[index].pageContent;
        const contentHash = createHash("sha256").update(content).digest("hex");
        await tx.resumeChunk.upsert({
          where: { resumeId_contentHash_embeddingModel: { resumeId: id, contentHash, embeddingModel: model } },
          create: {
            userId,
            resumeId: id,
            content,
            section: "resume",
            chunkIndex: index,
            contentHash,
            embeddingModel: model,
            embedding: JSON.stringify(vectors[index]),
          },
          update: {
            chunkIndex: index,
            embedding: JSON.stringify(vectors[index]),
          },
        });
      }
      await tx.resume.update({ where: { id }, data: { status: "INDEXED" } });
    });
    return ok({ chunksIndexed: documents.length });
  } catch {
    return fail("INDEX_FAILED", "Resume indexing failed.", 422);
  }
}
