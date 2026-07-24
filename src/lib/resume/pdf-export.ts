import PDFDocument from "pdfkit";
import type { ResumeData, ResumeEntry } from "@/lib/resume-builder";

export function createResumePdf(data: ResumeData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const document = new PDFDocument({
      size: "A4",
      margins: { top: 42, right: 48, bottom: 42, left: 48 },
      info: { Title: `${data.fullName || "Candidate"} Resume`, Author: data.fullName || "Candidate" },
      bufferPages: true,
    });
    const chunks: Buffer[] = [];
    document.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);

    const width = document.page.width - document.page.margins.left - document.page.margins.right;
    const ensureSpace = (height: number) => {
      if (document.y + height > document.page.height - document.page.margins.bottom) document.addPage();
    };
    const heading = (title: string) => {
      ensureSpace(42);
      document.moveDown(0.65).font("Helvetica-Bold").fontSize(11).fillColor("#111827").text(title.toUpperCase(), { characterSpacing: 0.7 });
      document.moveDown(0.2).strokeColor("#111827").lineWidth(0.7).moveTo(document.x, document.y).lineTo(document.x + width, document.y).stroke();
      document.moveDown(0.45);
    };
    const paragraph = (text: string) => {
      if (!text.trim()) return;
      ensureSpace(32);
      document.font("Helvetica").fontSize(9.5).fillColor("#1f2937").text(text.trim(), { lineGap: 2, align: "left" });
    };
    const entries = (items: ResumeEntry[]) => {
      for (const item of items) {
        ensureSpace(54);
        document.font("Helvetica-Bold").fontSize(9.7).fillColor("#111827").text(item.title || "Untitled", { continued: Boolean(item.date) });
        if (item.date) document.font("Helvetica").fillColor("#4b5563").text(item.date, { align: "right" });
        if (item.subtitle) document.font("Helvetica-Oblique").fontSize(9.2).fillColor("#4b5563").text(item.subtitle);
        for (const line of item.description.split(/\r?\n/).map((value) => value.replace(/^[•*-]\s*/, "").trim()).filter(Boolean)) {
          ensureSpace(24);
          document.font("Helvetica").fontSize(9.2).fillColor("#1f2937").text(`•  ${line}`, { indent: 8, lineGap: 1.5 });
        }
        document.moveDown(0.35);
      }
    };

    document.font("Helvetica-Bold").fontSize(22).fillColor("#111827").text(data.fullName || "Your Name", { align: "left" });
    if (data.professionalTitle) document.moveDown(0.1).font("Helvetica").fontSize(12).fillColor("#374151").text(data.professionalTitle);
    document.moveDown(0.45);
    const contact = [data.email, data.phone, data.location].filter(Boolean).join(" | ");
    if (contact) document.font("Helvetica").fontSize(8.8).fillColor("#374151").text(contact);
    for (const link of [data.linkedin, data.github, data.portfolio].filter(Boolean)) {
      document.fillColor("#1d4ed8").text(link, { link, underline: true });
    }

    if (data.summary) { heading("Professional Summary"); paragraph(data.summary); }
    if (data.technicalSkills.length) { heading("Technical Skills"); paragraph(data.technicalSkills.join(", ")); }
    if (data.experience.length) { heading("Work Experience"); entries(data.experience); }
    if (data.internships.length) { heading("Internships"); entries(data.internships); }
    if (data.projects.length) { heading("Projects"); entries(data.projects); }
    if (data.education.length) { heading("Education"); entries(data.education); }
    if (data.certifications.length) { heading("Certifications"); entries(data.certifications); }
    if (data.achievements.length) { heading("Achievements"); entries(data.achievements); }
    if (data.languages.length) { heading("Languages"); paragraph(data.languages.join(", ")); }

    const pages = document.bufferedPageRange();
    for (let index = 0; index < pages.count; index += 1) {
      document.switchToPage(index);
      document.font("Helvetica").fontSize(7.5).fillColor("#6b7280")
        .text(`Page ${index + 1} of ${pages.count}`, document.page.margins.left, document.page.height - 28, { width, align: "center" });
    }
    document.end();
  });
}
