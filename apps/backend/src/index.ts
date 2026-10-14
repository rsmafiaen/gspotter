import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'

import { builder } from './builder.js'
import { createContext } from './context.js'
import './schema/todo.js'

const server = new ApolloServer({
  schema: builder.toSchema(),
})

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async () => createContext(),
})

console.log(`GraphQL server ready at ${url}`)
