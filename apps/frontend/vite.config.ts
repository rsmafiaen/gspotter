import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

import { fileURLToPath } from 'node:url'

// The base path the app is served from, normalized without a trailing slash:
// '' when served from the domain root (Azure), '/project2' on the group VM.
// Deriving every route-rule key from this form avoids '//graphql'-style keys
// when the base is '/'.
const basePath = (process.env.APP_BASE_PATH ?? '/project2').replace(/\/+$/, '')

// Vite's `base` option must start with a slash.
const base = basePath === '' ? '/' : basePath

// Apollo standalone serves GraphQL at the root path, so the proxy target is
// the bare backend URL without a /graphql suffix. On Azure this points at the
// backend container app's internal ingress (plain HTTP inside the environment).
const graphqlProxyTarget =
  process.env.GRAPHQL_PROXY_TARGET ?? 'http://localhost:3001/'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    nitro({
      rollupConfig: { external: [/^@sentry\//] },
      baseURL: `${basePath}/`,
      // Wakes/keeps-warm the backend container app (see the plugin file for
      // why). Nitro bundles the file into the server output.
      plugins: [
        fileURLToPath(
          new URL('./src/server/plugins/warm-backend.ts', import.meta.url),
        ),
      ],
      // Serve brotli/gzip versions of the built assets. Without this the
      // JavaScript, CSS and poster go over the wire at their full size.
      compressPublicAssets: { gzip: true, brotli: true },
      routeRules: {
        // Proxy same-origin browser requests to the GraphQL backend.
        [`${basePath}/graphql`]: { proxy: graphqlProxyTarget },
        [`${basePath}/assets/**`]: {
          headers: {
            'cache-control': 'public, max-age=31536000, immutable',
          },
        },
        // Public files are not content-hashed, but they rarely change and a
        // long cache lifetime avoids a round trip on repeat visits.
        [`${basePath}/favicon.ico`]: {
          headers: {
            'cache-control': 'public, max-age=2592000',
          },
        },
        [`${basePath}/*.svg`]: {
          headers: {
            'cache-control': 'public, max-age=2592000',
          },
        },
      },
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
  base,
})

export default config
