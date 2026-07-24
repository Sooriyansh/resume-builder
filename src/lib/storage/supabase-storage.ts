import { randomUUID } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { StorageProvider } from "./storage-provider";

export class SupabaseStorage implements StorageProvider {
  private client: SupabaseClient;
  private bucket: string;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    this.bucket = process.env.SUPABASE_RESUME_BUCKET ?? "private-resumes";
    if (!url || !serviceKey) {
      throw new Error("Supabase storage environment variables are missing.");
    }
    this.client = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  async save(userId: string, data: Buffer) {
    const path = `${userId}/${randomUUID()}`;
    const { error } = await this.client.storage.from(this.bucket).upload(path, data, {
      contentType: "application/octet-stream",
      upsert: false,
    });
    if (error) throw new Error("Private resume upload failed.");
    return { path, size: data.byteLength };
  }

  async read(path: string) {
    const { data, error } = await this.client.storage.from(this.bucket).download(path);
    if (error) throw new Error("Private resume download failed.");
    return Buffer.from(await data.arrayBuffer());
  }

  async delete(path: string) {
    const { error } = await this.client.storage.from(this.bucket).remove([path]);
    if (error) throw new Error("Private resume deletion failed.");
  }
}
