import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getRecoverySignals, getOverloadHints } from "@/lib/dashboard";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const [overloads, recovery] = await Promise.all([getOverloadHints(userId, 5), getRecoverySignals(userId)]);
  return NextResponse.json({ overloads, recovery });
}
