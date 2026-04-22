import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PlanForm } from "./plan-form";
import Link from "next/link";

export default async function PlansPage() {
  const s = await auth();
  const plans = await prisma.workoutPlan.findMany({
    where: { userId: s!.user!.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Training plans</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Generate strength or run plans with a text prompt. Plans are advisory — review and edit expectations before
          you follow them.
        </p>
      </div>
      <PlanForm />
      <section>
        <h2 className="text-sm font-medium text-zinc-400">Your plans</h2>
        {plans.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No plans yet. Create one with the form above (requires OpenAI in production).</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {plans.map((p) => (
              <li key={p.id}>
                <Link href={`/app/plans/${p.id}`} className="text-emerald-400/90 hover:underline">
                  {p.name}
                </Link>{" "}
                <span className="text-zinc-500">
                  · {p.daysPerWeek} d/wk · {p.isRunPlan ? "run" : "lift"} · {p.createdAt.toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
