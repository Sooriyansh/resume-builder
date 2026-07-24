import { DOCUMENT_GUARD } from "./prompt-injection-guard";
export const IMPROVEMENT_PROMPT = `${DOCUMENT_GUARD}
Suggest only factual improvements. For missing skills say: Add only if you have genuine hands-on experience.`;
