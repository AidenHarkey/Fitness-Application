import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { WorkoutLogger } from "./workout-logger";

type PageProps = { params: Promise<{ sessionId: string }> };

export default async function SessionLogPage({ params }: PageProps) {
  const session = await auth();
  const { sessionId } = await params;
  if (!session?.user?.id) redirect("/login");

  const [ws, settings, exs] = await Promise.all([
    prisma.workoutSession.findFirst({
      where: { id: sessionId, userId: session.user.id },
      include: {
        plan: { select: { id: true, name: true, content: true } },
        sets: { include: { exercise: true }, orderBy: [{ setOrder: "asc" }] },
      },
    }),
    prisma.userSettings.findUnique({ where: { userId: session.user.id } }),
    prisma.exercise.findMany({
      where: { OR: [{ userId: null }, { userId: session.user.id }] },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!ws) notFound();
  const rest = settings?.defaultRestSeconds ?? 120;

  const s = {
    id: ws.id,
    startedAt: ws.startedAt.toISOString(),
    completedAt: ws.completedAt?.toISOString() ?? null,
    dayName: ws.dayName,
    weekIndex: ws.weekIndex,
    dayIndex: ws.dayIndex,
    plan: ws.plan,
    sets: ws.sets.map((l) => ({
      id: l.id,
      weight: l.weight,
      reps: l.reps,
      rpe: l.rpe,
      restAfterSeconds: l.restAfterSeconds,
      setOrder: l.setOrder,
      exercise: {
        id: l.exercise.id,
        name: l.exercise.name,
        pattern: l.exercise.pattern,
      },
    })),
  };

  return (
    <WorkoutLogger
      session={s}
      defaultRest={rest}
      exercises={exs.map((e) => ({ id: e.id, name: e.name, pattern: e.pattern }))}
    />
  );
}
