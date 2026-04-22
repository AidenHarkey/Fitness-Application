import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { NewWorkoutForm } from "./new-workout-form";

export default async function LogListPage() {
  const session = await auth();
  const userId = session!.user!.id;
  const [plans, inProgress, settings] = await Promise.all([
    prisma.workoutPlan.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.workoutSession.findMany({
      where: { userId, completedAt: null },
      orderBy: { startedAt: "desc" },
      take: 5,
      include: { _count: { select: { sets: true } } },
    }),
    prisma.userSettings.findUnique({ where: { userId } }),
  ]);
  const rest = settings?.defaultRestSeconds ?? 120;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Workouts</h1>
        <p className="mt-1 text-sm text-zinc-500">Log sets, use the rest timer between sets, then finish the session.</p>
      </div>

      {inProgress.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-amber-200/90">In progress</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {inProgress.map((s) => (
              <li key={s.id}>
                <Link
                  className="text-emerald-400/90 hover:underline"
                  href={`/app/log/${s.id}`}
                >
                  {s.startedAt.toLocaleString()} — {s._count.sets} set{s._count.sets !== 1 ? "s" : ""} logged
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <NewWorkoutForm
        defaultRest={rest}
        planOptions={plans.map((p) => ({ id: p.id, name: p.name }))}
        contentByPlan={Object.fromEntries(plans.map((p) => [p.id, p.content] as const))}
      />
    </div>
  );
}
