import { LocalStorage } from "./local-storage";
import { SupabaseStorage } from "./supabase-storage";

const provider = process.env.STORAGE_PROVIDER ?? (process.env.NODE_ENV === "production" ? "supabase" : "local");

if (provider !== "local" && provider !== "supabase") {
  throw new Error(`Unsupported STORAGE_PROVIDER: ${provider}`);
}

if (process.env.NODE_ENV === "production" && provider === "local") {
  throw new Error(
    "Local file storage is not persistent on Vercel. Set STORAGE_PROVIDER=supabase.",
  );
}

export const storage = provider === "supabase" ? new SupabaseStorage() : new LocalStorage();
