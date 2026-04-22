import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  completed: z.boolean().optional(),
  notes: z.string().max(2000).optional().nullable(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const ws = await prisma.workoutSession.findFirst({
    where: { id, userId: session.user.id },
    include: {
      sets: { include: { exercise: true }, orderBy: [{ setOrder: "asc" }] },
      plan: { select: { id: true, name: true, content: true } },
    },
  });
  if (!ws) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ session: ws });
}

export async function PATCH(req: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const own = await prisma.workoutSession.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!own) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { completed, notes } = parsed.data;
  const updated = await prisma.workoutSession.update({
    where: { id },
    data: {
      ...(completed === true && { completedAt: new Date() }),
      ...(completed === false && { completedAt: null }),
      ...(notes !== undefined && { notes }),
    },
  });
  return NextResponse.json({ session: updated });
}

export async function DELETE(_req: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const own = await prisma.workoutSession.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!own) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.workoutSession.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
