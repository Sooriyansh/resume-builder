"use client";

import { useState } from "react";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";

export function ExportFeedbackDialog({ open, onClose, onComplete, builderResumeId, resumeTitle, source = "builder" }: {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  builderResumeId?: string;
  resumeTitle?: string;
  source?: "builder" | "shared";
}) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [saving, setSaving] = useState(false);
  if (!open) return null;

  async function submit() {
    if (name.trim().length < 2) return toast.error("PDF download करने के लिए अपना नाम लिखें।");
    if (!rating) return toast.error("PDF download करने के लिए 1–5 star rating दें।");
    setSaving(true);
    const response = await fetch("/api/feedback", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, rating, builderResumeId, resumeTitle, source }),
    });
    const body = await response.json();
    setSaving(false);
    if (!body.success) return toast.error(body.error.message);
    toast.success("Thank you for your feedback!");
    onClose();
    setTimeout(onComplete, 150);
  }

  return <div className="fixed inset-0 z-[60] grid place-items-center bg-black/50 p-4 print:hidden">
    <div className="card w-full max-w-md p-6">
      <div className="flex items-start justify-between gap-4"><div><p className="eyebrow">One quick step</p><h2 className="mt-1 text-2xl font-black">Rate your experience</h2></div><button aria-label="Close" onClick={onClose}>✕</button></div>
      <p className="muted mt-2 text-sm">PDF download करने से पहले अपना नाम और rating देना जरूरी है।</p>
      <label className="mt-5 block text-sm font-bold">Your name *<input className="input mt-2" value={name} maxLength={100} autoFocus placeholder="Enter your name" onChange={(event) => setName(event.target.value)} /></label>
      <div className="mt-5"><p className="text-sm font-bold">Your rating *</p><div className="mt-2 flex gap-2" onMouseLeave={() => setHovered(0)}>{[1, 2, 3, 4, 5].map((star) => <button key={star} type="button" aria-label={`${star} star`} onMouseEnter={() => setHovered(star)} onClick={() => setRating(star)} className="rounded-lg p-1 transition hover:scale-110"><Star size={34} className={star <= (hovered || rating) ? "fill-amber-400 text-amber-400" : "text-[#c8ccd6]"} /></button>)}</div><p className="muted mt-1 text-xs">{rating ? `${rating} out of 5 selected` : "Select 1 to 5 stars"}</p></div>
      <button className="btn btn-primary mt-6 w-full" disabled={saving || name.trim().length < 2 || !rating} onClick={submit}>{saving ? <Loader2 size={17} className="animate-spin" /> : null} Submit & Download PDF</button>
    </div>
  </div>;
}
