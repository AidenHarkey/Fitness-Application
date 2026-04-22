import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const postSchema = z.object({
  notes: z.string().max(2000).optional(),
  planId: z.string().cuid().optional(),
  weekIndex: z.number().int().min(0).optional(),
  dayIndex: z.number().int().min(0).optional(),
  dayName: z.string().max(200).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sessions = await prisma.workoutSession.findMany({
    where: { userId: session.user.id },
    orderBy: { startedAt: "desc" },
    take: 20,
    include: {
      _count: { select: { sets: true } },
    },
  });
  return NextResponse.json({ sessions });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { notes, planId, weekIndex, dayIndex, dayName } = parsed.data;
  if (planId) {
    const plan = await prisma.workoutPlan.findFirst({
      where: { id: planId, userId: session.user.id },
    });
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }
  }
  const ws = await prisma.workoutSession.create({
    data: {
      userId: session.user.id,
      notes: notes || null,
      planId: planId || null,
      weekIndex: weekIndex ?? null,
      dayIndex: dayIndex ?? null,
      dayName: dayName || null,
    },
  });
  return NextResponse.json({ session: ws });
}
