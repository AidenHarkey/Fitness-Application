import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const p = await prisma.workoutPlan.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!p) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ plan: p });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const own = await prisma.workoutPlan.findFirst({ where: { id, userId: session.user.id } });
  if (!own) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.workoutPlan.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
