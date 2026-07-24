import { db } from "@/lib/db";

export async function requireUser() {
  const guest = await db.user.upsert({
    where: { id: "local-guest-workspace" },
    update: {},
    create: { id: "local-guest-workspace", name: "Guest Workspace" },
    select: { id: true },
  });
  return guest.id;
}
