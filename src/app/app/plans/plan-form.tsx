"use client";

import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";

export function PlanForm() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("4-day upper/lower, focus on main compounds, RPE 7–8");
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("hypertrophy and strength");
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [weeks, setWeeks] = useState(4);
  const [isRun, setIsRun] = useState(false);
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setPending(true);
    const r = await fetch("/api/plans/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, name: name || undefined, goal, daysPerWeek, weeks, isRunPlan: isRun }),
    });
    setPending(false);
    if (!r.ok) {
      const d = (await r.json().catch(() => ({}))) as { error?: string; preview?: string };
      setErr(d.error + (d.preview ? ` — ${d.preview?.slice(0, 200)}` : "") || "Failed to generate");
      return;
    }
    const j = (await r.json()) as { plan: { id: string } };
    router.push(`/app/plans/${j.plan.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-white/10 p-4">
      <h2 className="text-sm font-medium">Generate from prompt</h2>
      {err && <p className="text-sm text-amber-400/90">{err}</p>}
      <div>
        <label className="text-xs text-zinc-500">Prompt (describe your situation, equipment, time)</label>
        <textarea
          className="mt-1 w-full min-h-28 rounded border border-white/10 bg-black/30 px-3 py-2 text-sm"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs text-zinc-500">Plan name (optional)</label>
          <input
            className="mt-1 w-full rounded border border-white/10 bg-black/30 px-2 py-1.5 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Auto from model title if empty"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500">Goal (short words)</label>
          <input
            className="mt-1 w-full rounded border border-white/10 bg-black/30 px-2 py-1.5 text-sm"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500">Days / week</label>
          <input
            type="number"
            min={1}
            max={7}
            className="mt-1 w-full rounded border border-white/10 bg-black/30 px-2 py-1.5 text-sm"
            value={daysPerWeek}
            onChange={(e) => setDaysPerWeek(+e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500">Weeks</label>
          <input
            type="number"
            min={1}
            max={8}
            className="mt-1 w-full rounded border border-white/10 bg-black/30 px-2 py-1.5 text-sm"
            value={weeks}
            onChange={(e) => setWeeks(+e.target.value)}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <input type="checkbox" checked={isRun} onChange={(e) => setIsRun(e.target.checked)} />
        Running / cardio plan (couch to 5k, intervals, etc.)
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-500/90 px-4 py-2 text-sm font-medium text-zinc-950 disabled:opacity-50"
      >
        {pending ? "Calling model…" : "Generate plan"}
      </button>
    </form>
  );
}
