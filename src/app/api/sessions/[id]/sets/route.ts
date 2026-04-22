import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const setSchema = z.object({
  exerciseId: z.string().cuid(),
  weight: z.number().positive().max(2000),
  reps: z.number().int().min(0).max(200),
  rpe: z.number().min(1).max(10).optional().nullable(),
  restAfterSeconds: z.number().int().min(0).max(3600).optional().nullable(),
  setOrder: z.number().int().min(0).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: sessionId } = await context.params;
  const ws = await prisma.workoutSession.findFirst({
    where: { id: sessionId, userId: session.user.id },
  });
  if (!ws) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = setSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid set", details: parsed.error.flatten() }, { status: 400 });
  }
  const { exerciseId, weight, reps, rpe, restAfterSeconds, setOrder: orderIn } = parsed.data;
  const ex = await prisma.exercise.findFirst({
    where: {
      id: exerciseId,
      OR: [{ userId: null }, { userId: session.user.id }],
    },
  });
  if (!ex) {
    return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
  }
  const maxOrder = await prisma.setLog.aggregate({
    where: { sessionId },
    _max: { setOrder: true },
  });
  const setOrder = orderIn ?? (maxOrder._max.setOrder ?? -1) + 1;
  const log = await prisma.setLog.create({
    data: {
      sessionId,
      exerciseId,
      setOrder,
      weight,
      reps,
      rpe: rpe ?? null,
      restAfterSeconds: restAfterSeconds ?? null,
    },
  });
  return NextResponse.json({ set: log });
}
