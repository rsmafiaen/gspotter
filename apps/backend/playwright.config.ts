import { defineConfig } from '@playwright/test'
import { fileURLToPath } from 'node:url'

// Use a dedicated port for the test server. The self-hosted CI runner also
// hosts the deployed backend on 3001, and reusing it makes the tests run
// against stale code.
const testServerPort = Number(process.env.TEST_SERVER_PORT ?? 3002)
const apiBaseURL = (
  process.env.API_BASE_URL ?? `http://127.0.0.1:${testServerPort}`
).replace(/\/+$/, '')
const managesLocalServer = process.env.API_BASE_URL === undefined

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: apiBaseURL,
  },
  ...(managesLocalServer
    ? {
        webServer: {
          command: 'pnpm run start',
          cwd: fileURLToPath(new URL('.', import.meta.url)),
          env: { PORT: String(testServerPort) },
          url: `${apiBaseURL}/?query=%7B__typename%7D`,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      }
    : {}),
})
