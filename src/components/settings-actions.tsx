"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function SettingsActions() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  async function deleteAccount() {
    if (!confirm("Permanently clear all local resumes, analyses, embeddings, and chats?")) return;
    setLoading(true);
    const response = await fetch("/api/account", { method: "DELETE" });
    if (response.ok) { toast.success("Local workspace data was cleared."); router.push("/"); router.refresh(); }
    else { toast.error("Account deletion failed."); setLoading(false); }
  }
  return <button onClick={deleteAccount} disabled={loading} className="btn border border-red-200 bg-red-50 text-red-700 hover:bg-red-100">{loading ? "Deleting…" : "Delete my account and data"}</button>;
}
