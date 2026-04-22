import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  weight: z.number().positive().max(2000).optional(),
  reps: z.number().int().min(0).max(200).optional(),
  rpe: z.number().min(1).max(10).optional().nullable(),
  restAfterSeconds: z.number().int().min(0).max(3600).optional().nullable(),
});

type RouteContext = { params: Promise<{ setId: string }> };

export async function PATCH(req: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { setId } = await context.params;
  const set = await prisma.setLog.findFirst({
    where: { id: setId, session: { userId: session.user.id } },
  });
  if (!set) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
  const row = await prisma.setLog.update({
    where: { id: setId },
    data: {
      ...parsed.data,
    },
  });
  return NextResponse.json({ set: row });
}

export async function DELETE(_req: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { setId } = await context.params;
  const set = await prisma.setLog.findFirst({
    where: { id: setId, session: { userId: session.user.id } },
  });
  if (!set) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.setLog.delete({ where: { id: setId } });
  return NextResponse.json({ ok: true });
}
