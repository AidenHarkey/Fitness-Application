"use client";

import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";

type PlanOpt = { id: string; name: string };

export function NewWorkoutForm({
  defaultRest,
  planOptions,
  contentByPlan,
}: {
  defaultRest: number;
  planOptions: PlanOpt[];
  contentByPlan: Record<string, unknown>;
}) {
  const router = useRouter();
  const [planId, setPlanId] = useState<string>("");
  const [week, setWeek] = useState(0);
  const [day, setDay] = useState(0);
  const [pending, setPending] = useState(false);

  const content = planId ? (contentByPlan[planId] as { weeks?: { week: number; days?: { name?: string; dayIndex?: number }[] }[] } | null) : null;
  const wk = content?.weeks?.[week];
  const dayName = wk?.days?.[day]?.name ?? (wk?.days && wk.days.length > 0 ? wk.days[0]?.name : "Day");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    const r = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        planId
          ? {
              planId,
              weekIndex: week,
              dayIndex: day,
              dayName: dayName || undefined,
            }
          : {},
      ),
    });
    setPending(false);
    if (!r.ok) return;
    const j = (await r.json()) as { session: { id: string } };
    router.push(`/app/log/${j.session.id}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-white/10 p-4">
      <h2 className="text-sm font-medium">Start a new session</h2>
      {planOptions.length > 0 && (
        <div>
          <label className="block text-xs text-zinc-500">Link to a plan (optional)</label>
          <select
            className="mt-1 w-full max-w-md rounded border border-white/10 bg-black/30 px-2 py-1.5 text-sm"
            value={planId}
            onChange={(e) => {
              setPlanId(e.target.value);
              setWeek(0);
              setDay(0);
            }}
          >
            <option value="">None — ad hoc workout</option>
            {planOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {planId && content?.weeks && content.weeks.length > 0 && (
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <label className="text-xs text-zinc-500">Week</label>
            <select
              className="ml-1 rounded border border-white/10 bg-black/30 px-1 py-1"
              value={week}
              onChange={(e) => {
                setWeek(+e.target.value);
                setDay(0);
              }}
            >
              {content.weeks.map((w, i) => (
                <option key={w.week} value={i}>
                  {w.week}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500">Day</label>
            <select
              className="ml-1 rounded border border-white/10 bg-black/30 px-1 py-1"
              value={day}
              onChange={(e) => setDay(+e.target.value)}
            >
              {wk?.days?.map((d, i) => (
                <option key={d.name} value={i}>
                  {d.name || `Day ${i + 1}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
      <p className="text-xs text-zinc-500">Default rest after sets: {defaultRest}s (change in Settings).</p>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-500/90 px-4 py-2 text-sm font-medium text-zinc-950 disabled:opacity-50"
      >
        {pending ? "Starting…" : "Start session"}
      </button>
    </form>
  );
}
