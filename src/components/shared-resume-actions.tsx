"use client";

import { Download, Printer } from "lucide-react";
import { useState } from "react";
import { ExportFeedbackDialog } from "./export-feedback-dialog";

export function SharedResumeActions({ resumeTitle }: { resumeTitle: string }) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  return <><div className="flex gap-2">
    <button className="btn btn-secondary" onClick={() => setFeedbackOpen(true)}><Printer size={16} /> Print</button>
    <button className="btn btn-primary" onClick={() => setFeedbackOpen(true)}><Download size={16} /> Save PDF</button>
  </div><ExportFeedbackDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} onComplete={() => window.print()} resumeTitle={resumeTitle} source="shared" /></>;
}
