export type ExtractedDocument = {
  text: string;
  pageCount: number | null;
  wordCount: number;
  characterCount: number;
  mimeType: string;
  originalFilename: string;
  extractionWarnings: string[];
};
