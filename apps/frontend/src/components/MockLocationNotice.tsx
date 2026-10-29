import { MOCK_LOCATION_NAME } from '#/lib/location'

const REPOSITORY_URL = 'https://git.ntnu.no/IT2810-H26/T09-Project-2'

/**
 * Shown when the app fell back to MOCK_LOCATION because the browser refused to
 * share a real position over a non-secure origin.
 */
export default function MockLocationNotice() {
  return (
    <aside className="demo-alert rise-in mb-6">
      <p className="island-kicker">Mock position</p>
      <h2 className="mt-1 text-base font-extrabold">
        We are showing a mock position instead of your real one
      </h2>
      <p className="mt-1 text-sm text-(--sea-ink-soft)">
        Browsers only share your location over HTTPS or on localhost, and this
        site is served over plain HTTP. Pubs are therefore sorted by distance
        from {MOCK_LOCATION_NAME} rather than from where you actually are.
      </p>
      <p className="mt-2 text-sm text-(--sea-ink-soft)">
        For the full experience, check out{' '}
        <a href={REPOSITORY_URL} target="_blank" rel="noreferrer">
          the repository
        </a>{' '}
        and run the website on localhost.
      </p>
    </aside>
  )
}
