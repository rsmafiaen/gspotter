# T-09 Project 2 (G-Spotter)

Our plan/spec as it is now, is outlined in [./docs/inital-plan.md](./docs/initial-plan.md)

## Monorepo structure

This project is a pnpm workspace monorepo:

```text
apps/
  frontend/   TanStack Start app (React + Vite, port 3000)
  backend/    Apollo Server + GraphQL API (Pothos + Prisma, port 3001)
packages/
  db/         Prisma schema, generated client, migrations and seed
```

The backend builds its GraphQL schema with [Pothos](https://pothos-graphql.dev) and
the [Prisma plugin](https://pothos-graphql.dev/docs/plugins/prisma), which maps each
GraphQL selection set to a matching Prisma `select`/`include`. Queries only touch the
columns and relations the client actually asked for.

## Getting started

```bash
# Set up the database
# You can decide to run postgres as a service locally, or use the docker compose script provided to start a container
pnpm db:setup # Runs a script to set up a bare-metal postgres instance with the correct setup
# OR
docker compose up -d

# install dependencies for all workspaces
pnpm install

# set up the database connection in each package
cp packages/db/.env.example packages/db/.env
cp apps/backend/.env.example apps/backend/.env

# create the database schema and optionally seed it
pnpm db:generate
pnpm db:push
pnpm db:seed

# run the frontend and backend together with live reload
pnpm dev
```

Frontend: http://localhost:3000 · GraphQL API: http://localhost:3001

### Commands

| Command                                    | What it does                                           |
| ------------------------------------------ | ------------------------------------------------------ |
| `pnpm install` / `pnpm install:all`        | Install dependencies in all workspaces                 |
| `pnpm dev`                                 | Run frontend and backend concurrently with live reload |
| `pnpm build`                               | Build all workspaces that define a build               |
| `pnpm typecheck`                           | Typecheck all workspaces                               |
| `pnpm lint` / `pnpm format` / `pnpm check` | Lint, auto-fix format, and check formatting            |
| `pnpm db:setup`                            | Provision PostgreSQL natively on Ubuntu (see below)    |
| `pnpm db:generate`                         | Regenerate the Prisma client and Pothos types          |
| `pnpm db:push`                             | Push the Prisma schema to the database                 |
| `pnpm db:migrate`                          | Create/apply a development migration                   |
| `pnpm db:seed`                             | Seed the database                                      |
| `pnpm db:studio`                           | Open Prisma Studio                                     |
| `pnpm generate-routes`                     | Regenerate the TanStack Router route tree              |

### Provisioning the database on the Ubuntu VM

`pnpm db:setup` runs [scripts/setup-db.sh](./scripts/setup-db.sh), which installs
PostgreSQL natively on Ubuntu (apt-based systems only), enables the service, and
creates the same user, password, and database as `docker-compose.yml`
(`gspot`/`gspotter`/`gspot` on port 5432). It is idempotent and safe to re-run.
On Ubuntu 24.04 it installs Postgres 16, matching the pinned compose image; on
22.04 it falls back to the distro default. Afterwards, set the `DATABASE_URL` it
prints in `packages/db/.env` and `apps/backend/.env`, then run `pnpm db:push`.

## Below is the default TanStack Start readme, it will be replaced

Welcome to your new TanStack Start app!

# Getting Started

To run this application:

```bash
pnpm install
pnpm dev
```

# Building For Production

To build this application for production:

```bash
pnpm build
```

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling.

### Removing Tailwind CSS

If you prefer not to use Tailwind CSS:

1. Remove the demo pages in `src/routes/demo/`
2. Replace the Tailwind import in `src/styles.css` with your own styles
3. Remove `tailwindcss()` from the plugins array in `vite.config.ts`
4. Remove `@tailwindcss/vite` and `tailwindcss` from `package.json`

## Linting & Formatting

This project uses [eslint](https://eslint.org/) and [prettier](https://prettier.io/) for linting and formatting. Eslint is configured using [tanstack/eslint-config](https://tanstack.com/config/latest/docs/eslint). The following scripts are available:

```bash
pnpm lint
pnpm format
pnpm check
```

## Deploy with Nitro

This project uses Nitro as a generic server adapter, so it can run on any Node-compatible host.

```bash
npm run build
node dist/server/index.mjs
```

The build output is a self-contained Node server. To deploy, push the `dist/` directory to your host (Render, Fly.io, your own VPS, etc.) and run the server command above.

For host-specific presets (Vercel, Netlify, Cloudflare, AWS Lambda, etc.) and tuning, see https://v3.nitro.build/deploy.

## Routing

This project uses [TanStack Router](https://tanstack.com/router) with file-based routing. Routes are managed as files in `src/routes`.

### Adding A Route

To add a new route to your application just add a new file in the `./src/routes` directory.

TanStack will automatically generate the content of the route file for you.

Now that you have two routes you can use a `Link` component to navigate between them.

### Adding Links

To use SPA (Single Page Application) navigation you will need to import the `Link` component from `@tanstack/react-router`.

```tsx
import { Link } from '@tanstack/react-router'
```

Then anywhere in your JSX you can use it like so:

```tsx
<Link to="/about">About</Link>
```

This will create a link that will navigate to the `/about` route.

More information on the `Link` component can be found in the [Link documentation](https://tanstack.com/router/v1/docs/framework/react/api/router/linkComponent).

### Using A Layout

In the File Based Routing setup the layout is located in `src/routes/__root.tsx`. Anything you add to the root route will appear in all the routes. The route content will appear in the JSX where you render `{children}` in the `shellComponent`.

Here is an example layout that includes a header:

```tsx
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'My App' },
    ],
  }),
  shellComponent: ({ children }) => (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <header>
          <nav>
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
          </nav>
        </header>
        {children}
        <Scripts />
      </body>
    </html>
  ),
})
```

More information on layouts can be found in the [Layouts documentation](https://tanstack.com/router/latest/docs/framework/react/guide/routing-concepts#layouts).

## Server Functions

TanStack Start provides server functions that allow you to write server-side code that seamlessly integrates with your client components.

```tsx
import { createServerFn } from '@tanstack/react-start'

const getServerTime = createServerFn({
  method: 'GET',
}).handler(async () => {
  return new Date().toISOString()
})

// Use in a component
function MyComponent() {
  const [time, setTime] = useState('')

  useEffect(() => {
    getServerTime().then(setTime)
  }, [])

  return <div>Server time: {time}</div>
}
```

## API Routes

You can create API routes by using the `server` property in your route definitions:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'

export const Route = createFileRoute('/api/hello')({
  server: {
    handlers: {
      GET: () => json({ message: 'Hello, World!' }),
    },
  },
})
```

## Data Fetching

There are multiple ways to fetch data in your application. You can use TanStack Query to fetch data from a server. But you can also use the `loader` functionality built into TanStack Router to load the data for a route before it's rendered.

For example:

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/people')({
  loader: async () => {
    const response = await fetch('https://swapi.dev/api/people')
    return response.json()
  },
  component: PeopleComponent,
})

function PeopleComponent() {
  const data = Route.useLoaderData()
  return (
    <ul>
      {data.results.map((person) => (
        <li key={person.name}>{person.name}</li>
      ))}
    </ul>
  )
}
```

Loaders simplify your data fetching logic dramatically. Check out more information in the [Loader documentation](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#loader-parameters).

# Demo files

Files prefixed with `demo` can be safely deleted. They are there to provide a starting point for you to play around with the features you've installed.

# Learn More

You can learn more about all of the offerings from TanStack in the [TanStack documentation](https://tanstack.com).

For TanStack Start specific documentation, visit [TanStack Start](https://tanstack.com/start).
