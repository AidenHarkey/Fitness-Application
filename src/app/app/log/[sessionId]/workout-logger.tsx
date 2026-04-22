"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Exercise = { id: string; name: string; pattern: string };
type SetRow = {
  id: string;
  weight: number;
  reps: number;
  rpe: number | null;
  restAfterSeconds: number | null;
  setOrder: number;
  exercise: Exercise;
};

type Session = {
  id: string;
  startedAt: string;
  completedAt: string | null;
  dayName: string | null;
  weekIndex: number | null;
  dayIndex: number | null;
  plan: { id: string; name: string; content: unknown } | null;
  sets: SetRow[];
};

export function WorkoutLogger({ session: initial, defaultRest, exercises }: { session: Session; defaultRest: number; exercises: Exercise[] }) {
  const router = useRouter();
  const [session, setSession] = useState(initial);
  const [exId, setExId] = useState(exercises[0]?.id ?? "");
  const [weight, setWeight] = useState(45);
  const [reps, setReps] = useState(8);
  const [rpe, setRpe] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [newExName, setNewExName] = useState("");
  const [timerSec, setTimerSec] = useState<number | null>(null);
  const [exList, setExList] = useState(exercises);

  const addCustom = useCallback(async () => {
    if (!newExName.trim()) return;
    const r = await fetch("/api/exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newExName.trim() }),
    });
    if (r.ok) {
      const j = (await r.json()) as { exercise: Exercise };
      setExList((x) => [...x, j.exercise].sort((a, b) => a.name.localeCompare(b.name)));
      setExId(j.exercise.id);
      setNewExName("");
    }
  }, [newExName]);

  const addSet = useCallback(async () => {
    if (!exId) return;
    setSaving(true);
    const r = await fetch(`/api/sessions/${session.id}/sets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exerciseId: exId,
        weight,
        reps,
        rpe: rpe ? +rpe : null,
        restAfterSeconds: defaultRest,
      }),
    });
    setSaving(false);
    if (r.ok) {
      const re = await fetch(`/api/sessions/${session.id}`);
      if (re.ok) {
        const j = (await re.json()) as { session: Session };
        setSession({
          ...j.session,
          startedAt: j.session.startedAt,
        });
        setTimerSec(defaultRest);
      }
    }
  }, [exId, weight, reps, rpe, defaultRest, session.id]);

  useEffect(() => {
    if (timerSec === null || timerSec <= 0) {
      if (timerSec === 0) {
        if (typeof AudioContext !== "undefined" || typeof window !== "undefined") {
          try {
            const ctx = new AudioContext();
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g);
            g.connect(ctx.destination);
            o.frequency.value = 880;
            g.gain.value = 0.1;
            o.start();
            setTimeout(() => o.stop(), 200);
          } catch {
            // ignore
          }
        }
      }
      if (timerSec === 0) {
        setTimerSec(null);
      }
      return;
    }
    const t = setTimeout(() => setTimerSec((s) => (s === null ? null : s - 1)), 1000);
    return () => clearTimeout(t);
  }, [timerSec]);

  const finish = async () => {
    const r = await fetch(`/api/sessions/${session.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true }),
    });
    if (r.ok) router.push("/app");
  };

  const byEx = (session.sets || []).reduce<Record<string, SetRow[]>>((acc, s) => {
    const k = s.exercise.id;
    if (!acc[k]) acc[k] = [];
    acc[k]!.push(s);
    return acc;
  }, {});

  const planList =
    (session.plan?.content as { weeks?: { week: number; days?: { exercises?: { name: string; targetSets: number; targetReps: string; rpe?: string | null }[] }[] }[] } | null) ||
    null;
  const focus =
    session.weekIndex != null && planList?.weeks
      ? planList.weeks[session.weekIndex]?.days?.[session.dayIndex ?? 0]?.exercises
      : null;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Log workout</h1>
          {session.dayName && (
            <p className="text-sm text-zinc-500">
              Plan: {session.plan?.name} · {session.dayName}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={finish}
          className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-zinc-200"
        >
          Mark complete
        </button>
      </div>

      {focus && focus.length > 0 && (
        <section className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-3 text-sm">
          <h2 className="font-medium text-emerald-200/90">Today&apos;s plan targets</h2>
          <ul className="mt-2 space-y-1 text-zinc-300">
            {focus.map((x, i) => (
              <li key={i}>
                {x.name} — {x.targetSets}×{x.targetReps}
                {x.rpe ? ` @ RPE ${x.rpe}` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}

      {timerSec !== null && (
        <div className="rounded-lg border border-white/10 bg-black/40 p-4 text-center">
          <p className="text-xs text-zinc-500">Rest</p>
          <p className="text-4xl font-mono font-semibold tabular-nums text-emerald-300">{timerSec}</p>
          <button
            type="button"
            className="mt-2 text-sm text-zinc-400"
            onClick={() => setTimerSec(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="space-y-3 rounded-xl border border-white/10 p-4">
        <h2 className="text-sm font-medium">Add set</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="text-xs text-zinc-500">Exercise</label>
            <select
              className="mt-1 w-full rounded border border-white/10 bg-black/30 px-2 py-1.5 text-sm"
              value={exId}
              onChange={(e) => setExId(e.target.value)}
            >
              {exList.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500">Custom exercise</label>
            <div className="mt-1 flex gap-1">
              <input
                className="w-full rounded border border-white/10 bg-black/30 px-2 py-1.5 text-sm"
                value={newExName}
                onChange={(e) => setNewExName(e.target.value)}
                placeholder="e.g. Cable row"
              />
              <button type="button" onClick={addCustom} className="shrink-0 rounded bg-white/10 px-2 text-xs">
                Add
              </button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          <div>
            <label className="text-xs text-zinc-500">Weight</label>
            <input
              type="number"
              className="mt-1 w-full rounded border border-white/10 bg-black/30 px-2 py-1.5 text-sm"
              value={weight}
              onChange={(e) => setWeight(+e.target.value)}
              step={0.5}
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500">Reps</label>
            <input
              type="number"
              className="mt-1 w-full rounded border border-white/10 bg-black/30 px-2 py-1.5 text-sm"
              value={reps}
              onChange={(e) => setReps(+e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500">RPE (1–10)</label>
            <input
              className="mt-1 w-full rounded border border-white/10 bg-black/30 px-2 py-1.5 text-sm"
              value={rpe}
              onChange={(e) => setRpe(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={addSet}
            disabled={saving || !exId}
            className="rounded-lg bg-emerald-500/90 px-4 py-2 text-sm font-medium text-zinc-950"
          >
            {saving ? "Saving…" : "Log set"}
          </button>
          <span className="text-xs text-zinc-500">After logging, a {defaultRest}s rest timer starts (adjust in Settings).</span>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-zinc-400">This session</h2>
        {Object.keys(byEx).length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No sets yet.</p>
        ) : (
          <ul className="mt-2 space-y-4 text-sm">
            {Object.entries(byEx).map(([eid, rows]) => {
              const name = rows[0].exercise.name;
              return (
                <li key={eid} className="rounded border border-white/5 p-2">
                  <div className="font-medium text-zinc-200">{name}</div>
                  <ul className="mt-1">
                    {rows
                      .sort((a, b) => a.setOrder - b.setOrder)
                      .map((r) => (
                        <li key={r.id} className="flex items-center justify-between text-zinc-400">
                          <span>
                            {r.weight}×{r.reps}
                            {r.rpe != null ? ` RPE${r.rpe}` : ""}
                          </span>
                          <Deleter setId={r.id} onDone={() => router.refresh()} sessionId={session.id} setSession={setSession} />
                        </li>
                      ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Deleter({
  setId,
  sessionId,
  onDone,
  setSession,
}: {
  setId: string;
  sessionId: string;
  setSession: (s: Session) => void;
  onDone: () => void;
}) {
  return (
    <button
      type="button"
      className="text-xs text-red-400/80"
      onClick={async () => {
        await fetch(`/api/sets/${setId}`, { method: "DELETE" });
        const re = await fetch(`/api/sessions/${sessionId}`);
        if (re.ok) {
          const j = (await re.json()) as { session: Session };
          setSession(j.session);
        }
        onDone();
      }}
    >
      Remove
    </button>
  );
}
