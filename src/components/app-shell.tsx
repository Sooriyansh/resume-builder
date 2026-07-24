import Link from "next/link";
import { BarChart3, FileClock, FilePenLine, FilePlus2, RefreshCw, Settings } from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/analyzer", label: "New analysis", icon: FilePlus2 },
  { href: "/resume-builder", label: "Create Resume", icon: FilePenLine },
  { href: "/resume-rebuild", label: "Rebuild Old Resume", icon: RefreshCw },
  { href: "/history", label: "History", icon: FileClock },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="container grid gap-6 py-7 lg:grid-cols-[220px_1fr]">
      <aside className="card h-fit p-3">
        <nav className="grid gap-1">
          {nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-[#475467] hover:bg-[#f1efff] hover:text-[#5948e8]"><Icon size={18} />{label}</Link>)}
        </nav>
        <p className="muted mt-3 border-t border-[#ececf3] px-3 pt-3 text-xs">No login required · data stays in this local workspace.</p>
      </aside>
      <section className="min-w-0">{children}</section>
    </div>
  );
}
