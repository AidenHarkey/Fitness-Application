import { NextResponse } from "next/server";
import { z } from "zod";
import OpenAI from "openai";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parsePlanContent, planContentSchema, type PlanContent } from "@/lib/plan-schema";

const bodySchema = z.object({
  prompt: z.string().min(1).max(4000),
  name: z.string().min(1).max(200).optional(),
  daysPerWeek: z.number().int().min(1).max(7).default(4),
  goal: z.string().max(500).optional().nullable(),
  isRunPlan: z.boolean().optional().default(false),
  weeks: z.number().int().min(1).max(8).default(4),
});

const SYSTEM = `You are a strength and conditioning coach. Output **only** valid minified JSON matching this shape (no markdown, no commentary):
{
  "kind": "strength_hypertrophy" or "run",
  "title": string,
  "summary": string optional,
  "weeks": [ { "week": number, "days": [ { "name": string, "dayIndex": 0-6, "exercises": [ { "name": string, "targetSets": number, "targetReps": string, "rpe": string optional, "notes": string optional } ] } ], "notes": string optional } ]
}
dayIndex: 0=Mon ... 6=Sun. For run plans, kind is "run"; exercises may be "Easy 40 min" with targetReps as time/pace.`;

function tryExtractJson(s: string): unknown {
  const t = s.trim();
  if (t.startsWith("{") || t.startsWith("[")) {
    return JSON.parse(t) as unknown;
  }
  const a = t.indexOf("{");
  const b = t.lastIndexOf("}");
  if (a >= 0 && b > a) {
    return JSON.parse(t.slice(a, b + 1)) as unknown;
  }
  throw new Error("No JSON in response");
}

function coalescePlan(raw: unknown): { ok: true; data: PlanContent } | { ok: false; details: z.ZodError } {
  const a = planContentSchema.safeParse(raw);
  if (a.success) return { ok: true, data: a.data };
  const b = parsePlanContent(raw);
  if (b.success) return { ok: true, data: b.data };
  return { ok: false, details: a.error };
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI is not configured. Set OPENAI_API_KEY in .env" },
      { status: 503 },
    );
  }
  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { prompt, name, daysPerWeek, goal, isRunPlan, weeks } = parsed.data;

  const userPrompt = `User request:
${prompt}

Parameters: ${daysPerWeek} days per week, ${weeks} weeks, goal: ${goal || "not specified"}. ${isRunPlan ? "This is a running / cardio progression plan (kind: run)." : "This is a lifting / gym plan (kind: strength_hypertrophy)."}
Output only JSON.`;

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  let final: PlanContent;
  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 4000,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userPrompt },
      ],
    });
    const t = res.choices[0]?.message?.content ?? "";
    if (!t) {
      return NextResponse.json({ error: "Empty model response" }, { status: 502 });
    }
    let data: unknown;
    try {
      data = tryExtractJson(t);
    } catch {
      return NextResponse.json(
        { error: "Model did not return valid JSON", preview: t.slice(0, 2000) },
        { status: 502 },
      );
    }
    const co = coalescePlan(data);
    if (!co.ok) {
      return NextResponse.json(
        { error: "Invalid plan shape", zod: co.details.flatten() },
        { status: 422 },
      );
    }
    final = { ...co.data, kind: isRunPlan ? "run" : co.data.kind };
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "LLM or parse failed" }, { status: 502 });
  }

  const planName = name || final.title;
  const row = await prisma.workoutPlan.create({
    data: {
      userId: session.user.id,
      name: planName,
      prompt,
      daysPerWeek,
      goal: goal || null,
      isRunPlan,
      content: final as object,
    },
  });
  return NextResponse.json({ plan: row });
}
