import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getWeeklyProgress } from "@/lib/progress-aggregates";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const exerciseId = searchParams.get("exerciseId");
  if (!exerciseId) {
    return NextResponse.json({ error: "exerciseId required" }, { status: 400 });
  }
  const ex = await prisma.exercise.findFirst({
    where: { id: exerciseId, OR: [{ userId: null }, { userId: session.user.id }] },
  });
  if (!ex) {
    return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
  }
  const to = new Date();
  const from = new Date();
  from.setFullYear(from.getFullYear() - 1);
  if (searchParams.get("from")) {
    const f = new Date(searchParams.get("from")!);
    if (!isNaN(+f)) from.setTime(+f);
  }
  if (searchParams.get("to")) {
    const t = new Date(searchParams.get("to")!);
    if (!isNaN(+t)) to.setTime(+t);
  }
  const weekly = await getWeeklyProgress(session.user.id, exerciseId, from, to);
  return NextResponse.json({ exercise: { id: ex.id, name: ex.name }, weekly });
}
