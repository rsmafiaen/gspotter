import { prisma } from '@t09-project-2/db'
import jwt from 'jsonwebtoken'
import type { PrismaClient } from '@t09-project-2/db'
import type { IncomingMessage } from 'node:http'

// In a real application, this would be a type an auth provider like Auth0
export interface User {
  sub: string
  iat: number
  exp: number
  role: 'admin' | 'user'
}

export interface Context {
  prisma: PrismaClient
  user: User | null
}

export function createContext({ req }: { req: IncomingMessage }): Context {
  const authHeader = req.headers.authorization
  let user: User | null = null

  if (authHeader === undefined || !authHeader.startsWith('Bearer ')) {
    return {
      prisma,
      user,
    }
  }

  try {
    const token = authHeader.split(' ')[1]
    // Would not have the secret in plain text in a real prod application obviously
    user = jwt.verify(token, 'secret-string', { algorithms: ['HS256'] }) as User
  } catch {} // Empty catch to keep user null if the token in invalid or header is malformed

  return {
    prisma,
    user,
  }
}
