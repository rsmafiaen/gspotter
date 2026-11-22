import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'

import { builder } from './builder.js'
import { createContext } from './context.js'
import './schema/schema.js'

const server = new ApolloServer({
  schema: builder.toSchema(),
})

const port = Number(process.env.PORT ?? 3001)

const { url } = await startStandaloneServer(server, {
  listen: { port },
  context: async ({ req }) => createContext({ req }),
})

console.log(`GraphQL server ready at ${url}`)
