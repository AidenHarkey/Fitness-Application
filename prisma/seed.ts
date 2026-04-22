import { PrismaClient, MovementPattern } from "@prisma/client";

const prisma = new PrismaClient();

const library: { name: string; pattern: MovementPattern }[] = [
  { name: "Barbell bench press", pattern: "PUSH" },
  { name: "Incline dumbbell press", pattern: "PUSH" },
  { name: "Overhead press", pattern: "PUSH" },
  { name: "Dips", pattern: "PUSH" },
  { name: "Tricep pushdown", pattern: "PUSH" },
  { name: "Pull-ups", pattern: "PULL" },
  { name: "Barbell row", pattern: "PULL" },
  { name: "Lat pulldown", pattern: "PULL" },
  { name: "Face pull", pattern: "PULL" },
  { name: "Barbell curl", pattern: "PULL" },
  { name: "Back squat", pattern: "LEGS" },
  { name: "Romanian deadlift", pattern: "LEGS" },
  { name: "Leg press", pattern: "LEGS" },
  { name: "Leg curl", pattern: "LEGS" },
  { name: "Calf raise", pattern: "LEGS" },
  { name: "Hip thrust", pattern: "LEGS" },
  { name: "Plank", pattern: "CORE" },
  { name: "Treadmill run (easy)", pattern: "FULL_BODY" },
  { name: "Interval sprints", pattern: "LEGS" },
  { name: "Walking", pattern: "LEGS" },
];

async function main() {
  for (const e of library) {
    const existing = await prisma.exercise.findFirst({
      where: { name: e.name, userId: null },
    });
    if (existing) continue;
    await prisma.exercise.create({
      data: {
        name: e.name,
        pattern: e.pattern,
        userId: null,
      },
    });
  }
  console.log("Seeded", library.length, "library exercises (skipped if already present).");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
