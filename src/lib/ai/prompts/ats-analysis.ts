import { DOCUMENT_GUARD } from "./prompt-injection-guard";
export const ATS_ANALYSIS_PROMPT = `${DOCUMENT_GUARD}
Identify objective ATS-readiness issues and cite evidence. Do not claim to reproduce a commercial ATS.`;
