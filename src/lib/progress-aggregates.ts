import { prisma } from "@/lib/prisma";
import { epleyE1rm, setVolume } from "./e1rm";

export type WeekPoint = {
  weekKey: string;
  weekStart: string;
  volume: number;
  bestE1rm: number;
  bestWeight: number;
  bestReps: number;
  sessions: number;
};

/**
 * Monday-start week key in user's locale: use ISO get week - simple: week of year
 */
function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay();
  const diff = (day + 6) % 7;
  x.setDate(x.getDate() - diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function keyWeek(d: Date) {
  const s = startOfWeek(d);
  return s.toISOString().slice(0, 10);
}

export async function getWeeklyProgress(
  userId: string,
  exerciseId: string,
  from: Date,
  to: Date,
): Promise<WeekPoint[]> {
  const sets = await prisma.setLog.findMany({
    where: {
      exerciseId,
      session: { userId, startedAt: { gte: from, lte: to } },
    },
    include: {
      session: { select: { id: true, startedAt: true } },
    },
  });
  const byWeek = new Map<
    string,
    { vol: number; bestE1: number; bestW: number; bestR: number; sessionIds: Set<string> }
  >();
  for (const s of sets) {
    const wk = keyWeek(s.session.startedAt);
    if (!byWeek.has(wk)) {
      byWeek.set(wk, { vol: 0, bestE1: 0, bestW: 0, bestR: 0, sessionIds: new Set() });
    }
    const agg = byWeek.get(wk)!;
    agg.sessionIds.add(s.session.id);
    agg.vol += setVolume(s.weight, s.reps);
    const e1 = epleyE1rm(s.weight, s.reps);
    if (e1 > agg.bestE1) {
      agg.bestE1 = e1;
      agg.bestW = s.weight;
      agg.bestR = s.reps;
    } else if (e1 === agg.bestE1 && s.weight > agg.bestW) {
      agg.bestW = s.weight;
      agg.bestR = s.reps;
    }
  }
  return [...byWeek.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([weekStart, v]) => ({
      weekKey: weekStart,
      weekStart,
      volume: v.vol,
      bestE1rm: v.bestE1,
      bestWeight: v.bestW,
      bestReps: v.bestR,
      sessions: v.sessionIds.size,
    }));
}
