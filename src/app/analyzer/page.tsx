import { AppShell } from "@/components/app-shell";
import { AnalyzerForm } from "@/components/analyzer-form";
export default function AnalyzerPage() {
  return <AppShell><div className="mb-7"><p className="eyebrow">New analysis</p><h1 className="mt-2 text-3xl font-black">Find the signal in your resume.</h1><p className="muted mt-2">Compare real evidence in your resume against one specific role.</p></div><AnalyzerForm /></AppShell>;
}
