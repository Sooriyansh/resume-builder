import { AppShell } from "@/components/app-shell";
import { SettingsActions } from "@/components/settings-actions";

export default function SettingsPage() {
  return <AppShell><p className="eyebrow">Preferences</p><h1 className="mt-2 text-3xl font-black">Workspace settings</h1>
    <section className="card mt-7 p-6"><h2 className="font-black">Guest workspace</h2><p className="muted mt-3 text-sm">No login is required. Saved resumes and analyses are available directly in this local workspace.</p></section>
    <section className="card mt-5 p-6"><h2 className="font-black">Privacy controls</h2><div className="muted mt-4 space-y-2 text-sm"><p>✓ Resume files are private and never exposed through public URLs.</p><p>✓ Vector searches are filtered by your account and resume ID.</p><p>✓ Deleting your account removes database records, embeddings, chats, and stored files.</p></div></section>
    <section className="mt-5 rounded-2xl border border-red-200 bg-white p-6"><h2 className="font-black text-red-700">Danger zone</h2><p className="muted mt-2 mb-5 text-sm">Permanently clear locally saved resumes, analyses, and uploaded files.</p><SettingsActions /></section>
  </AppShell>;
}
