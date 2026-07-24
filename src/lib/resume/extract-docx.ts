import mammoth from "mammoth";

export async function extractDocx(buffer: Buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return {
      text: result.value,
      pageCount: null,
      warnings: result.messages.map((message) => message.message),
    };
  } catch (error) {
    throw new Error("The DOCX is corrupted or could not be read.", { cause: error });
  }
}
