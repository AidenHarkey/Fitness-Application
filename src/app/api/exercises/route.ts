import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MovementPattern } from "@prisma/client";

const postSchema = z.object({
  name: z.string().min(1).max(200),
  pattern: z.nativeEnum(MovementPattern).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const exercises = await prisma.exercise.findMany({
    where: {
      OR: [{ userId: null }, { userId: session.user.id }],
    },
    orderBy: [{ name: "asc" }],
  });
  return NextResponse.json({ exercises });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
  const e = await prisma.exercise.create({
    data: {
      name: parsed.data.name,
      pattern: parsed.data.pattern ?? "OTHER",
      userId: session.user.id,
    },
  });
  return NextResponse.json({ exercise: e });
}
