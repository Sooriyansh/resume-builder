import { PDFParse } from "pdf-parse";

export async function extractPdf(buffer: Buffer) {
  // PDF.js may transfer/detach the supplied ArrayBuffer. Give it an isolated
  // Uint8Array so Node Buffers used elsewhere in the upload remain intact.
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return { text: result.text, pageCount: result.pages.length };
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (message.includes("password")) {
      throw new Error("Password-protected PDFs are not supported.");
    }
    if (message.includes("invalid pdf") || message.includes("format error")) {
      throw new Error("The PDF file structure is invalid or damaged.", { cause: error });
    }
    console.error("PDF extraction failed:", error);
    throw new Error(
      "The PDF could not be read. Try downloading it again or exporting it as a standard PDF.",
      { cause: error },
    );
  } finally {
    await parser.destroy();
  }
}
