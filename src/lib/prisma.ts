import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

/** Reuse one client per Vercel serverless instance; avoids connection issues with Neon. */
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production" || process.env.VERCEL) {
  globalForPrisma.prisma = prisma;
}
