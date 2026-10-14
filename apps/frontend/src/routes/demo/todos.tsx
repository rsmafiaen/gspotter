import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { graphqlFetch } from '#/graphql/client'

interface Todo {
  id: number
  title: string
  createdAt: string
}

const GET_TODOS_QUERY = `
  query GetTodos {
    todos {
      id
      title
      createdAt
    }
  }
`

const CREATE_TODO_MUTATION = `
  mutation CreateTodo($title: String!) {
    createTodo(title: $title) {
      id
      title
    }
  }
`

export const Route = createFileRoute('/demo/todos')({
  component: DemoTodos,
})

function DemoTodos() {
  const queryClient = useQueryClient()

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['todos'],
    queryFn: () => graphqlFetch<{ todos: Todo[] }>(GET_TODOS_QUERY),
  })

  const createTodo = useMutation({
    mutationFn: (title: string) =>
      graphqlFetch<{ createTodo: Todo }>(CREATE_TODO_MUTATION, { title }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const title = new FormData(form).get('title')

    if (typeof title !== 'string' || !title) return

    try {
      await createTodo.mutateAsync(title)
      form.reset()
    } catch (mutationError) {
      console.error('Failed to create todo:', mutationError)
    }
  }

  const todos = data?.todos ?? []

  return (
    <main className="demo-page demo-center">
      <section className="demo-panel w-full max-w-2xl">
        <header className="mb-8 flex items-center gap-4">
          <span className="demo-card flex h-14 w-14 items-center justify-center p-3">
            <img src="/prisma.svg" alt="Prisma Logo" className="h-8 w-8" />
          </span>
          <div>
            <p className="island-kicker mb-2">Database</p>
            <h1 className="demo-title">Todos Demo</h1>
          </div>
        </header>

        <h2 className="demo-section-title mb-4">Todos</h2>

        {isPending && (
          <p className="demo-muted mb-6 text-sm">Loading todos...</p>
        )}

        {isError && (
          <p className="demo-muted mb-6 text-sm">
            Failed to load todos: {error.message}. Is the GraphQL backend
            running on http://localhost:4000?
          </p>
        )}

        {!isPending && !isError && (
          <ul className="mb-6 space-y-3">
            {todos.map((todo) => (
              <li key={todo.id} className="demo-list-item">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{todo.title}</span>
                  <span className="demo-muted text-xs">#{todo.id}</span>
                </div>
              </li>
            ))}
            {todos.length === 0 && (
              <li className="demo-list-item demo-muted text-center">
                No todos yet. Create one below!
              </li>
            )}
          </ul>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <input
            type="text"
            name="title"
            placeholder="Add a new todo..."
            className="demo-input min-w-0 flex-1"
          />
          <button type="submit" className="demo-button whitespace-nowrap">
            Add Todo
          </button>
        </form>

        <div className="demo-card mt-8">
          <h3 className="demo-section-title mb-2">
            Powered by GraphQL + Apollo Server
          </h3>
          <p className="demo-muted mb-4 text-sm">
            The frontend queries the GraphQL backend on port 4000, which uses
            Prisma to talk to PostgreSQL
          </p>
          <div className="space-y-2 text-sm">
            <p className="font-medium">Setup Instructions:</p>
            <ol className="demo-muted list-inside list-decimal space-y-2">
              <li>
                Configure <code>DATABASE_URL</code> in{' '}
                <code>packages/db/.env</code> and <code>apps/backend/.env</code>
              </li>
              <li>
                Run: <code>pnpm install</code>
              </li>
              <li>
                Run: <code>pnpm db:generate &amp;&amp; pnpm db:push</code>
              </li>
              <li>
                Optional: <code>pnpm db:seed</code>
              </li>
              <li>
                Run: <code>pnpm dev</code> (starts frontend and backend
                together)
              </li>
            </ol>
          </div>
        </div>
      </section>
    </main>
  )
}
