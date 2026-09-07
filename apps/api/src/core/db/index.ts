/**
 * Database client access layer (Prisma ORM & Redis)
 */
export { prisma, type ExtendedPrismaClient } from "../../lib/prisma";
export * from "../../lib/redis";
export * from "../../lib/sql";
