import { LocalStorage } from "./local-storage";
import { SupabaseStorage } from "./supabase-storage";

export const storage =
  process.env.STORAGE_PROVIDER === "supabase"
    ? new SupabaseStorage()
    : new LocalStorage();
