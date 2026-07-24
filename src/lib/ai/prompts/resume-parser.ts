import { DOCUMENT_GUARD } from "./prompt-injection-guard";

export const RESUME_PARSER_PROMPT = `${DOCUMENT_GUARD}
Extract the resume into the supplied schema. Do not infer a technology from a job title.
Normalize duplicate skills and preserve every factual number exactly.`;
