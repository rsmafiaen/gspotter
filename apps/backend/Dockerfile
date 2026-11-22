# To bump Node: docker pull node:24-bookworm-slim && \
#   docker inspect --format '{{index .RepoDigests 0}}' node:24-bookworm-slim
FROM node:24-bookworm-slim@sha256:01d566e8d94d8c619591d78652babfccd3c6992a3dffa9ed5ab39e11cf6c70e9 AS base

# --- builder: full install (devDeps included) + prisma generate --------------
FROM base AS builder

WORKDIR /app

RUN corepack enable

# Copy all workspace manifests first so the apps/* and packages/* globs in
# pnpm-workspace.yaml resolve during the (filtered) dependency install.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/db/package.json packages/db/
COPY apps/frontend/package.json apps/frontend/
COPY apps/backend/package.json apps/backend/
RUN pnpm install --frozen-lockfile --filter @t09-project-2/backend...

# prisma.config.ts calls env('DATABASE_URL') even during `prisma generate`,
# so a placeholder value is required for the client generation step.
# .dockerignore excludes **/src/generated, so the generated client only
# exists inside this stage.
COPY packages/db packages/db
COPY apps/backend apps/backend
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" \
    pnpm --filter @t09-project-2/db exec prisma generate

# --- runner: production deps only --------------------------------------------
# Ships only what the runtime needs: production dependencies, tsx (the start
# script), and the prisma CLI (the gspotter-migrate job runs
# `prisma migrate deploy` from this image). Typescript, @types/*, playwright
# and friends stay behind in the builder, roughly halving the image the
# container hosts must pull on every cold start.
FROM base AS runner

WORKDIR /app

RUN corepack enable

# Same manifests; the --prod install resolves the same lockfile but skips
# devDependencies. tsx and prisma are dependencies (not devDependencies) for
# the reasons above, so they survive the prune.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/db/package.json packages/db/
COPY apps/frontend/package.json apps/frontend/
COPY apps/backend/package.json apps/backend/
RUN pnpm install --frozen-lockfile --prod --filter @t09-project-2/backend...

# Source including the prisma-generated client (packages/db/src/generated).
COPY --from=builder /app/packages/db packages/db
COPY --from=builder /app/apps/backend apps/backend

ENV NODE_ENV=production

EXPOSE 3001

CMD ["pnpm", "--filter", "@t09-project-2/backend", "start"]
