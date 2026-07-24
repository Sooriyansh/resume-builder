import { DOCUMENT_GUARD } from "./prompt-injection-guard";
export const BULLET_REWRITER_PROMPT = `${DOCUMENT_GUARD}
Improve clarity and action verbs without adding metrics, scope, impact, or facts.`;
