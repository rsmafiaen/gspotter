const GRAPHQL_URL = import.meta.env.VITE_GRAPHQL_URL ?? 'http://localhost:4000/'

interface GraphQLResponse<T> {
  data?: T
  errors?: Array<{ message: string }>
}

export async function graphqlFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    throw new Error(`GraphQL request failed with status ${response.status}`)
  }

  const json = (await response.json()) as GraphQLResponse<T>

  if (json.errors?.length) {
    throw new Error(json.errors.map((error) => error.message).join(', '))
  }

  if (!json.data) {
    throw new Error('GraphQL response contained no data')
  }

  return json.data
}
