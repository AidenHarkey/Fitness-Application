import { prisma } from "@/lib/prisma";
import { MovementPattern } from "@prisma/client";
import { epleyE1rm, setVolume } from "./e1rm";

const PATTERNS: MovementPattern[] = [
  "PUSH",
  "PULL",
  "LEGS",
  "CORE",
  "FULL_BODY",
  "OTHER",
];

type BestInSession = { weight: number; reps: number; e1rm: number; volume: number; sessionId: string; at: Date };

/**
 * Best top set in a session (by e1rm) for an exercise, plus session volume.
 */
function bestInSession(sets: { weight: number; reps: number }[]): { best: { w: number; r: number; e1: number } | null; vol: number } {
  let vol = 0;
  let bestE = 0;
  let best: { w: number; r: number; e1: number } | null = null;
  for (const s of sets) {
    vol += setVolume(s.weight, s.reps);
    const e = epleyE1rm(s.weight, s.reps);
    if (e > bestE) {
      bestE = e;
      best = { w: s.weight, r: s.reps, e1: e };
    }
  }
  return { best, vol };
}

/**
 * Last two distinct sessions' stats per exercise (for progressive overload copy).
 */
export async function getOverloadHints(
  userId: string,
  takeExercises = 5,
): Promise<
  {
    exerciseId: string;
    name: string;
    last: BestInSession | null;
    previous: BestInSession | null;
    suggestion: string;
  }[]
> {
  const allSets = await prisma.setLog.findMany({
    where: { session: { userId } },
    select: { exerciseId: true },
  });
  const countBy = new Map<string, number>();
  for (const s of allSets) {
    countBy.set(s.exerciseId, (countBy.get(s.exerciseId) ?? 0) + 1);
  }
  const exIds = [...countBy.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id)
    .slice(0, takeExercises);
  const out: Awaited<ReturnType<typeof getOverloadHints>> = [];

  for (const exerciseId of exIds) {
    const sessions = await prisma.workoutSession.findMany({
      where: { userId, sets: { some: { exerciseId } } },
      orderBy: { startedAt: "desc" },
      take: 2,
      select: {
        id: true,
        startedAt: true,
        sets: { where: { exerciseId }, select: { weight: true, reps: true } },
      },
    });
    const withSets = sessions.filter((s) => s.sets.length > 0);
    const [lastS, prevS] = withSets;
    if (!lastS) continue;
    const ex = await prisma.exercise.findUniqueOrThrow({ where: { id: exerciseId } });
    const a = bestInSession(lastS.sets);
    const b = prevS ? bestInSession(prevS.sets) : { best: null, vol: 0 };
    const last: BestInSession | null = a.best
      ? {
          weight: a.best.w,
          reps: a.best.r,
          e1rm: a.best.e1,
          volume: a.vol,
          sessionId: lastS.id,
          at: lastS.startedAt,
        }
      : null;
    const previous: BestInSession | null = b.best && prevS
      ? {
          weight: b.best.w,
          reps: b.best.r,
          e1rm: b.best.e1,
          volume: b.vol,
          sessionId: prevS.id,
          at: prevS.startedAt,
        }
      : null;
    let suggestion = "Log another session to establish a baseline to beat.";
    if (last && previous) {
      if (last.e1rm > previous.e1rm) {
        suggestion = `Up from last time — keep the trend: similar or +2.5–5% load if RPE was low.`;
      } else if (last.e1rm < previous.e1rm) {
        suggestion = `Below your prior peak. Focus on form or consider a light week if stress is high.`;
      } else {
        suggestion = `Match last time, then add a rep or 2.5% weight if the last set felt RPE 8 or below.`;
      }
    } else if (last) {
      suggestion = `Build on: ${last.weight}×${last.reps} — add reps until form breaks, then increase weight.`;
    }
    out.push({ exerciseId, name: ex.name, last, previous, suggestion });
  }
  return out;
}

/**
 * Last trained date per movement pattern, vs recovery threshold in days.
 */
export async function getRecoverySignals(
  userId: string,
): Promise<{ pattern: MovementPattern; lastTrained: Date | null; daysAgo: number | null; ok: boolean; message: string }[]> {
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  const minDays = settings?.recoveryMinDays ?? 1;
  const now = new Date();
  const results: Awaited<ReturnType<typeof getRecoverySignals>> = [];

  for (const pattern of PATTERNS) {
    const last = await prisma.workoutSession.findFirst({
      where: {
        userId,
        sets: { some: { exercise: { pattern } } },
      },
      orderBy: { startedAt: "desc" },
      select: { startedAt: true },
    });
    const d = last?.startedAt;
    if (!d) {
      results.push({ pattern, lastTrained: null, daysAgo: null, ok: true, message: "Not trained in this log yet — fresh." });
      continue;
    }
    const daysAgo = Math.floor((+now - +d) / (1000 * 60 * 60 * 24));
    const ok = daysAgo >= minDays;
    const message = ok
      ? `${daysAgo}d since last ${pattern} session (threshold ${minDays}d).`
      : `Only ${daysAgo}d since last ${pattern} session — you may need more recovery (threshold ${minDays}d).`;
    results.push({ pattern, lastTrained: d, daysAgo, ok, message });
  }
  return results;
}
