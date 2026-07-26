import { db } from "@/lib/db";
import { fail, ok } from "@/lib/api";

export async function GET() {
  try {
    await db.$runCommandRaw({ ping: 1 });
    return ok({ status: "healthy", database: "connected" });
  } catch {
    return fail("DATABASE_UNAVAILABLE", "Database is unavailable.", 503);
  }
}
