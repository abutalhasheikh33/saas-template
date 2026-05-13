import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const pool = new PrismaPg({ connectionString: process.env.DATABASE_URL! });

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter: pool,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
