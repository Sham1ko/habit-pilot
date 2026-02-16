import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/prisma/client";

const globalForPrisma = globalThis as { prisma?: PrismaClient };

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL,
});

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
