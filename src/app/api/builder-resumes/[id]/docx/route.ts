import { Document, ExternalHyperlink, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { db } from "@/lib/db";
import { fail } from "@/lib/api";
import { requireUser } from "@/lib/require-user";
import { resumeDataSchema } from "@/lib/resume-builder";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await requireUser();
  const { id } = await context.params;
  const record = await db.builderResume.findFirst({ where: { id, userId }, select: { title: true, data: true } });
  if (!record) return fail("NOT_FOUND", "Resume not found.", 404);
  const data = resumeDataSchema.parse(record.data);
  const children: Paragraph[] = [
    new Paragraph({ text: data.fullName, heading: HeadingLevel.TITLE }),
    new Paragraph({ text: data.professionalTitle }),
    new Paragraph({
      children: [
        ...[data.email, data.phone, data.location].filter(Boolean).flatMap((value, index) => [new TextRun(index ? ` | ${value}` : value)]),
        ...[data.linkedin, data.github, data.portfolio].filter(Boolean).map((url) => new ExternalHyperlink({ link: url, children: [new TextRun({ text: ` | ${url}`, style: "Hyperlink" })] })),
      ],
    }),
  ];
  const section = (title: string, paragraphs: Paragraph[]) => {
    if (!paragraphs.length) return;
    children.push(new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }), ...paragraphs);
  };
  section("Professional Summary", data.summary ? [new Paragraph(data.summary)] : []);
  section("Technical Skills", data.technicalSkills.length ? [new Paragraph(data.technicalSkills.join(", "))] : []);
  const entries = (items: typeof data.experience) => items.flatMap((item) => [
    new Paragraph({ children: [new TextRun({ text: item.title, bold: true }), new TextRun(item.subtitle ? ` — ${item.subtitle}` : ""), new TextRun(item.date ? ` | ${item.date}` : "")] }),
    ...item.description.split(/\r?\n/).map((line) => new Paragraph({ text: line.replace(/^[•*-]\s*/, ""), bullet: { level: 0 } })),
  ]);
  section("Work Experience", entries(data.experience));
  section("Projects", entries(data.projects));
  section("Education", entries(data.education));
  section("Certifications", entries(data.certifications));
  section("Achievements", entries(data.achievements));
  section("Languages", data.languages.length ? [new Paragraph(data.languages.join(", "))] : []);
  const document = new Document({ sections: [{ properties: {}, children }] });
  const buffer = await Packer.toBuffer(document);
  const filename = `${record.title.replace(/[^a-z0-9_-]+/gi, "-") || "resume"}.docx`;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
