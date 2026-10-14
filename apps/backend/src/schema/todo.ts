import { prisma } from '@t09-project-2/db'

import { builder } from '../builder.js'

builder.prismaObject('Todo', {
  fields: (t) => ({
    id: t.exposeInt('id'),
    title: t.exposeString('title'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
})

builder.queryType({
  fields: (t) => ({
    todos: t.prismaField({
      type: ['Todo'],
      resolve: (query) =>
        prisma.todo.findMany({ ...query, orderBy: { createdAt: 'desc' } }),
    }),
  }),
})

builder.mutationType({
  fields: (t) => ({
    createTodo: t.prismaField({
      type: 'Todo',
      args: {
        title: t.arg.string({ required: true }),
      },
      resolve: (query, _root, { title }) =>
        prisma.todo.create({ ...query, data: { title } }),
    }),
    deleteTodo: t.prismaField({
      type: 'Todo',
      args: {
        id: t.arg.int({ required: true }),
      },
      resolve: (query, _root, { id }) =>
        prisma.todo.delete({ ...query, where: { id } }),
    }),
  }),
})
