import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { WeightUnit } from "@prisma/client";

const patchSchema = z.object({
  defaultRestSeconds: z.number().int().min(15).max(600).optional(),
  recoveryMinDays: z.number().int().min(0).max(14).optional(),
  weightUnit: z.nativeEnum(WeightUnit).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let s = await prisma.userSettings.findUnique({ where: { userId: session.user.id } });
  if (!s) {
    s = await prisma.userSettings.create({ data: { userId: session.user.id } });
  }
  return NextResponse.json({ settings: s });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
  const s = await prisma.userSettings.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...parsed.data },
    update: parsed.data,
  });
  return NextResponse.json({ settings: s });
}
