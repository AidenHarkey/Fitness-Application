"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

const units = ["LB", "KG"] as const;

export function SettingsForm({
  initial,
}: {
  initial: { defaultRestSeconds: number; recoveryMinDays: number; weightUnit: (typeof units)[number] };
}) {
  const router = useRouter();
  const [defaultRestSeconds, setRest] = useState(initial.defaultRestSeconds);
  const [recoveryMinDays, setRec] = useState(initial.recoveryMinDays);
  const [weightUnit, setW] = useState<string>(initial.weightUnit);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setP] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setP(true);
    setStatus(null);
    const r = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ defaultRestSeconds, recoveryMinDays, weightUnit }),
    });
    setP(false);
    if (r.ok) {
      setStatus("Saved.");
      router.refresh();
    } else {
      setStatus("Failed to save.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-white/10 p-4">
      <div>
        <label className="text-xs text-zinc-500">Default rest after each set (seconds)</label>
        <input
          type="number"
          min={15}
          max={600}
          className="mt-1 w-full rounded border border-white/10 bg-black/30 px-2 py-1.5 text-sm"
          value={defaultRestSeconds}
          onChange={(e) => setRest(+e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs text-zinc-500">Minimum rest days (same push/pull/legs pattern) before a soft warning</label>
        <input
          type="number"
          min={0}
          max={14}
          className="mt-1 w-full rounded border border-white/10 bg-black/30 px-2 py-1.5 text-sm"
          value={recoveryMinDays}
          onChange={(e) => setRec(+e.target.value)}
        />
        <p className="mt-1 text-xs text-zinc-600">0 = never warn. Default 1 means training pull two days in a row may warn.</p>
      </div>
      <div>
        <label className="text-xs text-zinc-500">Display unit</label>
        <select
          className="mt-1 w-full rounded border border-white/10 bg-black/30 px-2 py-1.5 text-sm"
          value={weightUnit}
          onChange={(e) => setW(e.target.value)}
        >
          {units.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>
      {status && <p className="text-sm text-emerald-300/90">{status}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-500/90 px-4 py-2 text-sm font-medium text-zinc-950"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
