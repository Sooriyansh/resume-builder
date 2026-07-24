import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { requireUser } from "@/lib/require-user";

type Context = { params: Promise<{ id: string }> };

export async function POST(_: Request, { params }: Context) {
  const userId = await requireUser();
  if (!userId) return fail("UNAUTHENTICATED", "Please sign in.", 401);
  const { id } = await params;
  const resume = await db.builderResume.findFirst({ where: { id, userId } });
  if (!resume) return fail("NOT_FOUND", "Resume not found.", 404);
  const updated = await db.builderResume.update({
    where: { id },
    data: {
      shareEnabled: true,
      shareToken: resume.shareToken ?? randomBytes(24).toString("base64url"),
    },
    select: { shareToken: true },
  });
  return ok({ path: `/resume/shared/${updated.shareToken}` });
}

export async function DELETE(_: Request, { params }: Context) {
  const userId = await requireUser();
  if (!userId) return fail("UNAUTHENTICATED", "Please sign in.", 401);
  const { id } = await params;
  const updated = await db.builderResume.updateMany({
    where: { id, userId },
    data: { shareEnabled: false },
  });
  return updated.count ? ok({ disabled: true }) : fail("NOT_FOUND", "Resume not found.", 404);
}
