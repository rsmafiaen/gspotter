# T-09 Project 2 (G-Spotter)

### Site deployed to [http://it2810-09.idi.ntnu.no/project2](http://it2810-09.idi.ntnu.no/project2), backend deployed to [http://it2810-09.idi.ntnu.no:3001](http://it2810-09.idi.ntnu.no:3001)

> #### !NB: We use location services in our app to use the users location to find nearby pubs. The JS geolocation API is blocked on most browsers if the site is not encrypted (https) or a loopback (localhost), so to see the full capabilities of our site, please clone the repo and check out the site on `localhost:3000/project2`

Our inital spec, written for the first deliverable, and what we are basing the development on, is outlined in [./docs/inital-plan.md](./docs/initial-plan.md)

Password for admin page access is "guinness"

## Index

- [Prerequisites](#prerequisites)
- [Monorepo structure](#monorepo-structure)
- [Getting started](#getting-started)
  - [Commands](#commands)
  - [Styling](#styling)
  - [Database interactions](#database-interactions)
  - [Linting & Formatting](#linting--formatting)
  - [Deployment](#deployment)
- [Timeline](#timeline)
  - [1st hand-in of project 2](#1st-hand-in-of-project-2)
  - [2nd hand-in of project 2](#2nd-hand-in-of-project-2)
  - [3rd hand-in of project 2](#3rd-hand-in-of-project-2)
  - [Final hand-in of project 2](#final-hand-in-of-project-2)
- [AI declaration](#ai-declaration)

## Prerequisites

**PNPM:** We use *p*npm as out package manager **NOT** the regular npm usually used. This is because pnpm is faster (the p is an acronym for "performant") and symlinks packages which were already installed in another project, saving disk space. If npm is already installed, pnpm can easily be installed by running `npx get-pnpm`

**Docker or postgres:** We use postgreSQL as our database solution. For development, we choose to use docker to containerize our database, but on the VM, postgres runs on bare-metal. To start a postgreSQL server, either run `docker compose up -d` to start a docker container in the background, running a postgres instance with the correct credentials. If you are using a debian-based distro, you could also run `pnpm db:setup` (this command jsut runs the script in `./scripts/setup-db.sh`, so you could run that manually as well), which installs and sets up a database using the postgres deamon.

## Monorepo structure

This project is a pnpm workspace monorepo:

```text
apps/
  frontend/   TanStack Start app (React + Vite, port 3000)
  backend/    Apollo Server + GraphQL API (Pothos + Prisma, port 3001)
packages/
  db/         Prisma schema, generated client, migrations and seed
```

The backend builds its GraphQL schema with [Pothos](https://pothos-graphql.dev) and the [Prisma plugin](https://pothos-graphql.dev/docs/plugins/prisma), which maps each GraphQL selection set to a matching Prisma `select`/`include`. Allowing queries to only touch the columns and relations the client actually asked for.

## Getting started

```bash
# Set up the database
# You can decide to run postgres as a service locally, or use the docker compose script provided to start a container
pnpm db:setup # Runs a script to set up a bare-metal postgres instance with the correct setup (ONLY WORKS ON DEBIAN DISTROS, we recommend using docker compose for other distros, windows or macos)
# OR
docker compose up -d

# install dependencies for all workspaces
pnpm install

# set up the database connection in each package
cp packages/db/.env.example packages/db/.env
cp apps/backend/.env.example apps/backend/.env

# create the database schema and optionally seed it
pnpm db:generate
pnpm db:deploy
pnpm db:seed

# run the frontend and backend together
pnpm dev

# Run all these commands from the root of the project
```

Frontend: http://localhost:3000 · GraphQL API: http://localhost:3001

### Commands

| Command                                        | What it does                                            |
| ---------------------------------------------- | ------------------------------------------------------- |
| `pnpm install` / `pnpm install:all` / `pnpm i` | Install dependencies in all workspaces                  |
| `pnpm dev`                                     | Run frontend and backend concurrently with live reload  |
| `pnpm build`                                   | Build all workspaces that define a build                |
| `pnpm typecheck`                               | Typecheck all workspaces                                |
| `pnpm lint` / `pnpm format` / `pnpm check`     | Lint, auto-fix format, and check formatting             |
| `pnpm test`                                    | Run frontend and backend tests                          |
| `pnpm test:frontend`                           | Run only the frontend component tests once              |
| `pnpm test:frontend:watch`                     | Re-run frontend tests while developing                  |
| `pnpm test:backend`                            | Run only the backend tests once                         |
| `pnpm db:setup`                                | Provision PostgreSQL natively on Ubuntu (see below)     |
| `pnpm db:generate`                             | Regenerate the Prisma client and Pothos types           |
| `pnpm db:push`                                 | Push the Prisma schema to the database (prototyping)    |
| `pnpm db:migrate`                              | Create/apply a development migration                    |
| `pnpm db:deploy`                               | Apply pending migrations (used by the deploy workflow)  |
| `pnpm db:baseline`                             | One-time bootstrap for databases created with `db push` |
| `pnpm db:seed`                                 | Seed the database                                       |
| `pnpm db:studio`                               | Open Prisma Studio                                      |
| `pnpm generate-routes`                         | Regenerate the TanStack Router route tree               |

### Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling.

### Database interactions

This project uses the Prisma ORM to define the datbase schema (found in `./packages/db/prisma/schema.prisma`) and to provide type safe database interactions from the backend.

### Linting & Formatting

This project uses [eslint](https://eslint.org/) and [prettier](https://prettier.io/) for linting and formatting. Eslint is configured using [tanstack/eslint-config](https://tanstack.com/config/latest/docs/eslint). The following scripts are available:

```bash
pnpm lint # Runs eslint, does not fix trivial issues automatically
pnpm format # Runs the prettier formatter
pnpm check # Runs the prettier formatter in check mode, so will not write to any files
```

### Testing

The frontend uses [Vitest](https://vitest.dev/) with [Testing Library](https://testing-library.com/docs/react-testing-library/intro/) and jsdom. Component tests live in `apps/frontend/src/components/__tests__`, and shared fixtures and providers are in `apps/frontend/src/test`. The tests cover rendering, user interaction, form validation, routing and the map wrappers without needing a running backend.

```bash
pnpm test:frontend # Run all component tests once
pnpm test:frontend:watch # Re-run tests while developing
```

The backend API has Playwright end-to-end tests that send requests to the running GraphQL API. They require PostgreSQL, the backend `.env`, and the sample data created by `pnpm db:seed` (which replaces existing database rows). The test command starts the backend automatically; set `API_BASE_URL` to use an already-running API instead.

```bash
pnpm test:backend
```

`pnpm test` runs the frontend component tests and the backend end-to-end tests together. CI applies the migrations and seeds the test database before running it.

### Deployment

The deployment of both the backend and frontend is automated using the github action found in `./.github/workflows/deploy-to-vm.yaml`

Both workflows run on the self-hosted runner on the VM. The Azure workflow builds the images with Docker/buildx on that runner (ACR Tasks are not available on the student subscription), so the runner user must be able to access the Docker socket. Docker 28.x is required because 29.x has a BuildKit session bug that can hang builds. The backend systemd unit loads `apps/backend/.env`, because the production `start` script does not read it.

Deploys apply the Prisma migrations in `./packages/db/prisma/migrations` with `prisma migrate deploy` (via `pnpm db:deploy`). Migrations are the single source of truth for the database, so never change the deployed schema with `pnpm db:push`: it does not run the migration SQL (functions, triggers, ...) and skips the migration history, which leaves the deploy unable to apply those migrations later.

A database that was created with `pnpm db:push` before migrations were adopted has no `_prisma_migrations` table. Run `pnpm db:baseline` once against it, then `pnpm db:deploy`; after that the deploy workflow keeps it up to date.

If a migration fails against an existing database, `prisma migrate deploy` refuses to continue until the failed migration is resolved (`prisma migrate resolve`). Inspect `_prisma_migrations` and fix the cause before re-running the deploy.

## Timeline

Below is the timeline for our hand-ins, with the date and commit hash of the most recent commit at the time of hand-in, in case we update the repository between the time of handing in and someone reviewing our code

### 1st hand-in of project 2

Handed in Oct 2nd

Most recent commit hash at time of hand-in: [`efdbfa5`](https://git.ntnu.no/IT2810-H26/T09-Project-2/tree/efdbfa5be991e0bcf45a62d202b1e764935a077b)

### 2nd hand-in of project 2

Handed in Oct 16th

Most recent commit hash at time of hand-in: [`054801b`](https://git.ntnu.no/IT2810-H26/T09-Project-2/tree/054801b7b8058fe35a5303cd54ff7815cbac0be8)

### 3rd hand-in of project 2

Handed in TDB

Most recent commit hash at time of hand-in: [`6ed8255`](https://git.ntnu.no/IT2810-H26/T09-Project-2/tree/6ed82554ed10bd7797feb405d391db1cc6071e92)

### Final hand-in of project 2

Handed in TDB

Most recent commit hash at time of hand-in: [`TDB`](<>) (Will update if there is a more recent version in the future)

## AI declaration

### 1st hand-in:

The first hand-in was only our initial plan and consited of setting up tanstack start with a command, and a markdown file, and thus no AI was needed or used

### 2nd hand-in:

We have mostly used AI as a sparring partner in the development of this project, mainly focused on deployment and debugging. For deployment to the VM, GLM 5.3 NVFP4 running on NTNU's LLM servers was used to help generate the script setting up the postgres instance, and to create the deploy pipeline. As can be seen in the `.agents` folder, AI was also used to create more descriptive PR descriptions, but this skill was used with heavy human supervision, and often updated manually afterwards. AI was not used for generating much code, but rather used to help debug issues we were running into, and as a supplement to documentation when it proved lacking/hard to navigate (e.g. when using Pothos to get a DateTime in the GraphQL schema, we could not find any mention of the "expose" function without the expose helper (such as "exposeString" or "exposeFloat"), and thus used AI to figure out how to expose a DateTime object in the schema).

### 3rd hand-in

Essentially the same as handin 2

### 4th hand-in

While outside the scope of the course, we did deploy to Azure. The IaC (terraform code) was initially developed without help from AI, but debugged and refined with AI. The dockerfiles are AI generated, though explicitly guided to use the human-written dockerfiles from monoweb (The student association Online's website [(github.com/dotkom/monoweb)](https://github.com/dotkom/monoweb)) as referance.

cont...
