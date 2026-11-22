import SchemaBuilder from '@pothos/core'
import PrismaPlugin from '@pothos/plugin-prisma'

import { getDatamodel, prisma } from '@t09-project-2/db'
import type { PrismaTypes } from '@t09-project-2/db'

import type { Context } from './context.js'
import WithInputPlugin from '@pothos/plugin-with-input'

export const builder = new SchemaBuilder<{
  Context: Context
  PrismaTypes: PrismaTypes
  Scalars: {
    DateTime: {
      Input: Date
      Output: Date
    }
  }
}>({
  plugins: [PrismaPlugin, WithInputPlugin],
  prisma: {
    client: prisma,
    dmmf: getDatamodel(),
    onUnusedQuery: process.env.NODE_ENV === 'production' ? null : 'warn',
  },
})

builder.scalarType('DateTime', {
  serialize: (date: Date) => date.toISOString(),
  parseValue: (value) => new Date(value as string | number | Date),
})
