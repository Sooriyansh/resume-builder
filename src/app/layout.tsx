import type { Metadata } from "next";
import Link from "next/link";
import { FileSearch2 } from "lucide-react";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "ResumeLens AI", template: "%s · ResumeLens AI" },
  description: "Private, evidence-based AI resume analysis and ATS readiness scoring.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-[#e7e9f2] bg-white/85 backdrop-blur">
          <div className="container flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-lg font-black">
              <span className="grid size-9 place-items-center rounded-xl bg-[#6d5dfc] text-white">
                <FileSearch2 size={19} />
              </span>
              ResumeLens <span className="text-[#6d5dfc]">AI</span>
            </Link>
            <nav className="hidden items-center gap-7 text-sm font-semibold text-[#667085] md:flex">
              <Link href="/#features">Features</Link>
              <Link href="/#how">How it works</Link>
              <Link href="/#privacy">Privacy</Link>
            </nav>
            <div className="flex gap-2"><Link href="/analyzer" className="btn btn-secondary">Analyze Resume</Link><Link href="/resume-builder" className="btn btn-primary hidden sm:inline-flex">Create Resume</Link></div>
          </div>
        </header>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
