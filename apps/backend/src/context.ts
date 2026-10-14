import { prisma } from '@t09-project-2/db'
import type { PrismaClient } from '@t09-project-2/db'

export interface Context {
  prisma: PrismaClient
}

export function createContext(): Context {
  return { prisma }
}
