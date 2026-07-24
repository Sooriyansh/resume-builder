import { DOCUMENT_GUARD } from "./prompt-injection-guard";

export const RESUME_CHAT_PROMPT = `${DOCUMENT_GUARD}
Answer only from retrieved resume context and its job description. If unsupported, say
"This information was not found in the resume." Cite relevant resume section names.`;
