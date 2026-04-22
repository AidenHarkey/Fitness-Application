import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProgressCharts } from "./progress-charts";

export default async function ProgressPage() {
  const session = await auth();
  const exs = await prisma.exercise.findMany({
    where: { OR: [{ userId: null }, { userId: session!.user!.id }] },
    orderBy: { name: "asc" },
  });
  const logRows = await prisma.setLog.findMany({
    where: { session: { userId: session!.user!.id } },
    select: { exerciseId: true },
    distinct: ["exerciseId"],
  });
  const withLogs = new Set(logRows.map((r) => r.exerciseId));

  const logged = exs.filter((e) => withLogs.has(e.id));
  const toChart = logged.length > 0 ? logged : exs.slice(0, 8);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Progress</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Volume and estimated 1RM (Epley) per week for any exercise you have logged.
        </p>
      </div>
      {exs.length === 0 || toChart.length === 0 ? (
        <p className="text-sm text-zinc-500">Log workouts first, then return here to chart load and strength trends.</p>
      ) : (
        <ProgressCharts exercisers={toChart.map((e) => ({ id: e.id, name: e.name }))} />
      )}
    </div>
  );
}
