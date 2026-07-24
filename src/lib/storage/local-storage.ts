import { randomUUID } from "crypto";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import type { StorageProvider } from "./storage-provider";

const ROOT = path.resolve(process.cwd(), ".private-uploads");

function safePath(relativePath: string) {
  const resolved = path.resolve(ROOT, relativePath);
  if (!resolved.startsWith(`${ROOT}${path.sep}`)) throw new Error("Invalid storage path");
  return resolved;
}

export class LocalStorage implements StorageProvider {
  async save(userId: string, data: Buffer) {
    const relativePath = path.join(userId, randomUUID());
    const destination = safePath(relativePath);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, data, { flag: "wx" });
    return { path: relativePath, size: data.byteLength };
  }

  read(relativePath: string) {
    return readFile(safePath(relativePath));
  }

  async delete(relativePath: string) {
    await rm(safePath(relativePath), { force: true });
  }
}
