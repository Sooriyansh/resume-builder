"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function AnalysisActions({ id }: { id: string }) {
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  async function remove() {
    if (!confirm("Delete this analysis and its chat history?")) return;
    setDeleting(true);
    const response = await fetch(`/api/analyses/${id}`, { method: "DELETE" });
    if (response.ok) { toast.success("Analysis deleted."); router.push("/history"); router.refresh(); }
    else { toast.error("Could not delete analysis."); setDeleting(false); }
  }
  return <div className="flex gap-2"><button onClick={() => window.print()} className="btn btn-secondary"><Download size={17} /> Export report</button><button disabled={deleting} onClick={remove} className="btn btn-secondary text-red-600"><Trash2 size={17} /> Delete</button></div>;
}
