import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    nitro({
      rollupConfig: { external: [/^@sentry\//] },
      baseURL: '/project2/',
      // Serve brotli/gzip versions of the built assets. Without this the
      // JavaScript, CSS and poster go over the wire at their full size.
      compressPublicAssets: { gzip: true, brotli: true },
      routeRules: {
        '/project2/assets/**': {
          headers: {
            'cache-control': 'public, max-age=31536000, immutable',
          },
        },
        // Public files are not content-hashed, but they rarely change and a
        // long cache lifetime avoids a round trip on repeat visits.
        '/project2/favicon.ico': {
          headers: {
            'cache-control': 'public, max-age=2592000',
          },
        },
        '/project2/*.svg': {
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
  base: '/project2',
})

export default config
