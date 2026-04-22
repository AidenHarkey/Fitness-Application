"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type Row = { weekKey: string; weekStart: string; volume: number; bestE1rm: number; bestWeight: number; bestReps: number; sessions: number };
type E = { id: string; name: string };

export function ProgressCharts({ exercisers }: { exercisers: E[] }) {
  const [eid, setEid] = useState(exercisers[0]?.id ?? "");
  const [data, setData] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!eid) return;
    let cancel = false;
    setData(null);
    (async () => {
      const r = await fetch(`/api/progress?exerciseId=${eid}`);
      if (!r.ok) {
        setErr("Failed to load");
        return;
      }
      const j = (await r.json()) as { weekly: Row[]; exercise: { name: string } };
      if (!cancel) {
        setErr(null);
        setData(j.weekly);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [eid]);

  const exName = exercisers.find((e) => e.id === eid)?.name;

  if (exercisers.length === 0) return null;

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-zinc-500">Exercise</label>
        <select
          className="mt-1 w-full max-w-sm rounded border border-white/10 bg-black/30 px-2 py-1.5 text-sm"
          value={eid}
          onChange={(e) => setEid(e.target.value)}
        >
          {exercisers.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </div>
      {err && <p className="text-sm text-red-400">{err}</p>}
      {data && data.length === 0 && !err && (
        <p className="text-sm text-zinc-500">No sets in the last 12 months for {exName}. Log some sessions to see a chart.</p>
      )}
      {data && data.length > 0 && (
        <>
          <h2 className="text-sm font-medium text-zinc-300">Weekly volume ({exName})</h2>
          <div className="h-64 w-full min-w-0 max-w-3xl">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-700" />
                <XAxis dataKey="weekKey" className="text-xs" stroke="#71717a" tick={{ fontSize: 10 }} />
                <YAxis className="text-xs" stroke="#71717a" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", fontSize: 12 }}
                />
                <Legend />
                <Line type="monotone" name="Volume (load×reps)" dataKey="volume" stroke="#34d399" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <h2 className="pt-6 text-sm font-medium text-zinc-300">Est. 1RM (Epley) per week (best in week)</h2>
          <div className="h-64 w-full min-w-0 max-w-3xl">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-700" />
                <XAxis dataKey="weekKey" className="text-xs" stroke="#71717a" tick={{ fontSize: 10 }} />
                <YAxis className="text-xs" stroke="#71717a" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", fontSize: 12 }}
                />
                <Legend />
                <Line
                  type="monotone"
                  name="e1RM"
                  dataKey="bestE1rm"
                  stroke="#a78bfa"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
