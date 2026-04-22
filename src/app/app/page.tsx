import { auth } from "@/auth";
import { getOverloadHints, getRecoverySignals } from "@/lib/dashboard";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id;
  const [overloads, recovery, recent, openCount] = await Promise.all([
    getOverloadHints(userId, 4),
    getRecoverySignals(userId),
    prisma.workoutSession.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take: 5,
      include: { _count: { select: { sets: true } } },
    }),
    prisma.workoutSession.count({ where: { userId, completedAt: null } }),
  ]);
  const recoveryBad = recovery.filter((r) => r.lastTrained && !r.ok);

  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">Progressive overload hints and recovery at a glance.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/app/log"
          className="rounded-lg bg-emerald-500/90 px-4 py-2 text-sm font-medium text-zinc-950"
        >
          {openCount > 0 ? "Continue or start workout" : "Start a workout"}
        </Link>
        <Link
          href="/app/plans"
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-200"
        >
          Create plan from prompt
        </Link>
        <Link href="/app/progress" className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-200">
          View progress
        </Link>
      </div>

      {recoveryBad.length > 0 && (
        <section className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-4">
          <h2 className="text-sm font-medium text-amber-200">Recovery</h2>
          <ul className="mt-2 space-y-1 text-sm text-amber-100/90">
            {recoveryBad.map((r) => (
              <li key={r.pattern}>{r.message}</li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-sm font-medium text-zinc-300">Progressive overload</h2>
        {overloads.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">Log a few sets to get suggestions for your key lifts.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {overloads.map((o) => (
              <li
                key={o.exerciseId}
                className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm"
              >
                <span className="font-medium text-zinc-200">{o.name}</span>
                {o.last && (
                  <p className="mt-1 text-zinc-400">
                    Last: {o.last.weight}×{o.last.reps} (est. 1RM {o.last.e1rm.toFixed(1)})
                  </p>
                )}
                <p className="mt-1 text-zinc-500">{o.suggestion}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-medium text-zinc-300">Recent sessions</h2>
        {recent.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No sessions yet. Start a workout to log your first one.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {recent.map((r) => (
              <li key={r.id}>
                <Link href={`/app/log/${r.id}`} className="text-emerald-400/90 hover:underline">
                  {r.startedAt.toLocaleString()} — {r._count.sets} set{r._count.sets !== 1 ? "s" : ""}
                  {r.completedAt ? " · done" : " · in progress"}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
