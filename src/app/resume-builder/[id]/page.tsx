import { AppShell } from "@/components/app-shell";
import { ResumeBuilder } from "@/components/resume-builder";

export default async function ResumeBuilderEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AppShell><ResumeBuilder id={id} /></AppShell>;
}
