import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { resumeDataSchema, resumeSettingsSchema } from "@/lib/resume-builder";
import { ResumePreview } from "@/components/resume-preview";
import { SharedResumeActions } from "@/components/shared-resume-actions";

export default async function SharedResumePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const resume = await db.builderResume.findFirst({
    where: { shareToken: token, shareEnabled: true },
    select: { title: true, template: true, data: true, settings: true, updatedAt: true },
  });
  if (!resume) notFound();
  const data = resumeDataSchema.safeParse(resume.data);
  const settings = resumeSettingsSchema.safeParse(resume.settings);
  if (!data.success || !settings.success) notFound();
  return <main className="min-h-screen bg-[#dfe2e8] py-7">
    <div className="container mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
      <div><p className="font-black">{resume.title}</p><p className="muted mt-1 flex items-center gap-1 text-xs"><ShieldCheck size={13} /> Read-only shared resume · updated {resume.updatedAt.toLocaleDateString()}</p></div>
      <SharedResumeActions resumeTitle={resume.title} />
    </div>
    <ResumePreview data={data.data} settings={settings.data} template={resume.template} />
  </main>;
}
