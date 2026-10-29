import { defineConfig } from '@playwright/test'
import { fileURLToPath } from 'node:url'

const apiBaseURL = (
  process.env.API_BASE_URL ?? 'http://127.0.0.1:3001'
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
          url: `${apiBaseURL}/?query=%7B__typename%7D`,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      }
    : {}),
})
