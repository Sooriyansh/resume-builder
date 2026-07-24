export type StoredFile = { path: string; size: number };

export interface StorageProvider {
  save(userId: string, data: Buffer): Promise<StoredFile>;
  read(path: string): Promise<Buffer>;
  delete(path: string): Promise<void>;
}
