// Wakes (and keeps warm) the backend container app.
//
// Both container apps scale to zero after a few minutes without traffic. When
// a cold visitor arrives, the frontend wakes first; only once its page loads
// does the browser fire the first /graphql request, so the backend would pay
// its own cold start *after* the frontend's - cold starts in series instead
// of in parallel.
//
// This plugin fires a GraphQL request at the backend as soon as the frontend
// server boots, so the backend wakes up alongside (not after) the frontend.
// While the frontend replica stays alive, a ping every four minutes keeps the
// backend from scaling back down (its idle scale-down window is ~5 minutes).
// The pings stop automatically when the frontend itself is deactivated.
//
// Only active in production where BACKEND_URL is set (the Azure deployment);
// in local development the backend is started by hand and never cold.

const KEEP_ALIVE_INTERVAL_MS = 4 * 60 * 1000

const backendUrl = process.env.BACKEND_URL

export default function warmBackendPlugin() {
  if (!backendUrl || process.env.NODE_ENV !== 'production') return

  const ping = () =>
    fetch(backendUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ __typename }' }),
    }).catch(() => {
      // A failed ping (e.g. backend still activating) is harmless: the next
      // one retries, and any real proxied request wakes the backend anyway.
    })

  ping()
  setInterval(ping, KEEP_ALIVE_INTERVAL_MS)
}
