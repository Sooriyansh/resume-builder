import { fileTypeFromBuffer } from "file-type";
import { cleanText } from "./clean-text";
import { extractDocx } from "./extract-docx";
import { extractPdf } from "./extract-pdf";
import type { ExtractedDocument } from "./types";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export async function extractText(
  buffer: Buffer,
  originalFilename: string,
): Promise<ExtractedDocument> {
  const detected = await fileTypeFromBuffer(buffer);
  const isText = originalFilename.toLowerCase().endsWith(".txt");
  if ((!detected || !ALLOWED_MIME_TYPES.has(detected.mime)) && !isText) {
    throw new Error("File signature is not a valid PDF or DOCX.");
  }

  const warnings: string[] = [];
  const extracted = isText
    ? (() => {
        if (buffer.includes(0)) throw new Error("The TXT file contains invalid binary data.");
        const decoded = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
        return { text: decoded, pageCount: 1 };
      })()
    : detected!.mime === "application/pdf"
      ? await extractPdf(buffer)
      : await extractDocx(buffer);
  const text = cleanText(extracted.text);
  if ("warnings" in extracted) warnings.push(...extracted.warnings);
  const wordCount = text ? text.split(/\s+/).length : 0;
  if (wordCount < 30) {
    throw new Error(
      "Very little text was found. This may be a scanned document that requires OCR.",
    );
  }
  if (extracted.text.length > 100_000) {
    warnings.push("Document text was truncated to the safe processing limit.");
  }

  return {
    text,
    pageCount: extracted.pageCount,
    wordCount,
    characterCount: text.length,
    mimeType: isText ? "text/plain" : detected!.mime,
    originalFilename,
    extractionWarnings: warnings,
  };
}
