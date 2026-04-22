import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { planContentSchema, type PlanContent } from "@/lib/plan-schema";
import Link from "next/link";

type PageProps = { params: Promise<{ id: string }> };

export default async function PlanDetailPage({ params }: PageProps) {
  const session = await auth();
  const { id } = await params;
  const p = await prisma.workoutPlan.findFirst({ where: { id, userId: session!.user!.id } });
  if (!p) notFound();

  const c = p.content;
  const parsed = planContentSchema.safeParse(c);
  const data: PlanContent | null = parsed.success ? parsed.data : null;

  return (
    <div className="max-w-2xl space-y-6">
      <p>
        <Link href="/app/plans" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Plans
        </Link>
      </p>
      <div>
        <h1 className="text-2xl font-semibold">{p.name}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {p.daysPerWeek} days / week · {p.isRunPlan ? "Run" : "Strength / hypertrophy"} · created {p.createdAt.toLocaleString()}
        </p>
      </div>
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-sm">
        <h2 className="font-medium text-zinc-300">Your prompt</h2>
        <p className="mt-2 whitespace-pre-wrap text-zinc-400">{p.prompt}</p>
        {p.goal && <p className="mt-2 text-zinc-500">Goal: {p.goal}</p>}
      </div>
      {data && (
        <>
          {data.summary && <p className="text-sm text-zinc-400">{data.summary}</p>}
          <ol className="list-decimal space-y-6 pl-4 text-sm">
            {data.weeks.map((w) => (
              <li key={w.week} className="pl-1">
                <h3 className="font-medium text-zinc-200">Week {w.week}</h3>
                {w.notes && <p className="text-zinc-500">{w.notes}</p>}
                <ul className="mt-2 space-y-3">
                  {w.days.map((d, i) => (
                    <li key={i} className="border-l-2 border-emerald-500/20 pl-3">
                      <div className="font-medium text-zinc-300">
                        {d.name}{" "}
                        <span className="text-xs text-zinc-500">(day {d.dayIndex + 1} of week, Mon=0)</span>
                      </div>
                      <ul className="mt-1 list-disc pl-4 text-zinc-400">
                        {d.exercises.map((e, j) => (
                          <li key={j}>
                            {e.name} — {e.targetSets}×{e.targetReps}
                            {e.rpe != null && e.rpe !== "" ? ` @ RPE ${e.rpe}` : ""}
                            {e.notes && ` — ${e.notes}`}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </>
      )}
      {!data && (
        <p className="text-sm text-amber-200/80">
          This plan is stored as JSON; format changed or not recognized. Delete and regenerate, or use raw
          <code className="mx-1 text-xs">content</code> in your database viewer.
        </p>
      )}
      <p className="pt-4 text-sm text-zinc-500">Start a session from the Workouts page and link this plan to pre-fill targets.</p>
    </div>
  );
}
