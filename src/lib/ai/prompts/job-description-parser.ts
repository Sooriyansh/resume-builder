import { DOCUMENT_GUARD } from "./prompt-injection-guard";

export const JOB_DESCRIPTION_PARSER_PROMPT = `${DOCUMENT_GUARD}
Extract the job description into the supplied schema. Carefully separate mandatory
requirements from preferred or nice-to-have requirements. Do not invent requirements.`;
