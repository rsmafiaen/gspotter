# To bump Node: docker pull node:24-bookworm-slim && \
#   docker inspect --format '{{index .RepoDigests 0}}' node:24-bookworm-slim
FROM node:24-bookworm-slim@sha256:01d566e8d94d8c619591d78652babfccd3c6992a3dffa9ed5ab39e11cf6c70e9 AS base
FROM base AS builder

WORKDIR /app

RUN corepack enable

# Copy all workspace manifests first so the apps/* and packages/* globs in
# pnpm-workspace.yaml resolve during the (filtered) dependency install.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/db/package.json packages/db/
COPY apps/frontend/package.json apps/frontend/
COPY apps/backend/package.json apps/backend/
RUN pnpm install --frozen-lockfile --filter @t09-project-2/frontend...

# APP_BASE_PATH: base path the app is served from ('/' on Azure, '/project2'
# on the VM). VITE_GRAPHQL_URL is baked into the client bundle ('/graphql'
# on Azure = same origin, proxied to the backend by Nitro's route rules).
# GRAPHQL_PROXY_TARGET is where the Nitro server forwards /graphql requests.
ARG APP_BASE_PATH=/
ARG VITE_GRAPHQL_URL=/graphql
ARG GRAPHQL_PROXY_TARGET=http://localhost:3001/

ENV APP_BASE_PATH=$APP_BASE_PATH
ENV VITE_GRAPHQL_URL=$VITE_GRAPHQL_URL
ENV GRAPHQL_PROXY_TARGET=$GRAPHQL_PROXY_TARGET

COPY packages/db packages/db
COPY apps/frontend apps/frontend
RUN pnpm --filter @t09-project-2/frontend run build

FROM base AS runner

WORKDIR /app

COPY --from=builder /app/apps/frontend/.output apps/frontend/.output

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "apps/frontend/.output/server/index.mjs"]
