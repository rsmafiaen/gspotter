// In the browser, requests go to the same origin (VITE_GRAPHQL_URL is baked as
// '/graphql' for the Azure deployment) and the frontend's Nitro server proxies
// them to the backend. During SSR, fetches go straight to the backend instead:
// BACKEND_URL is a runtime env var on the container app and falls back to the
// baked VITE_GRAPHQL_URL for local development and the VM deployment.
const GRAPHQL_URL = import.meta.env.SSR
  ? (process.env.BACKEND_URL ??
    import.meta.env.VITE_GRAPHQL_URL ??
    'http://localhost:3001/')
  : (import.meta.env.VITE_GRAPHQL_URL ?? 'http://localhost:3001/')

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
