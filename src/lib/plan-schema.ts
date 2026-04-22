import { z } from "zod";

/** Structured plan from LLM — must match prompt instructions. */
const plannedExercise = z.object({
  name: z.string().min(1).max(200),
  targetSets: z.number().int().min(1).max(20),
  targetReps: z.string().min(1).max(100),
  rpe: z.string().max(20).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

const plannedDay = z.object({
  name: z.string().min(1).max(200),
  dayIndex: z.number().int().min(0).max(6),
  exercises: z.array(plannedExercise).min(1).max(30),
  notes: z.string().max(2000).optional().nullable(),
});

const plannedWeek = z.object({
  week: z.number().int().min(1).max(52),
  days: z.array(plannedDay).min(1).max(7),
  notes: z.string().max(2000).optional().nullable(),
});

const planInner = z.object({
  kind: z.enum(["strength_hypertrophy", "run"]).optional(),
  title: z.string().min(1).max(200),
  weeks: z.array(plannedWeek).min(1).max(12),
  summary: z.string().max(2000).optional().nullable(),
});

export const planContentSchema = planInner.transform((c) => ({
  ...c,
  kind: c.kind ?? "strength_hypertrophy",
  summary: c.summary ?? null,
}));

export type PlanContent = z.infer<typeof planContentSchema>;

/**
 * Unwrap common API wrappers, then Zod-validate.
 */
export function parsePlanContent(data: unknown) {
  let d: unknown = data;
  if (d && typeof d === "object" && "content" in d) d = (d as { content: unknown }).content;
  if (d && typeof d === "object" && "data" in d) d = (d as { data: unknown }).data;
  if (typeof d === "string") {
    try {
      d = JSON.parse(d) as unknown;
    } catch {
      return planContentSchema.safeParse(null);
    }
  }
  return planContentSchema.safeParse(d);
}
