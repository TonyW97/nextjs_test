import { PrismaClient } from '@prisma/client'

export const sharedPrisma = new PrismaClient();
