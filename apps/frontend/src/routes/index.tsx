import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import Map from '../components/Map'
import VenueLoader from '#/components/ViewVenue'
import type { SearchResult } from '#/types/search'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const [selected, setSelected] = useState<SearchResult | null>(null)

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rise-in relative overflow-hidden rounded-4xl px-6 py-10 sm:px-10 sm:py-14 mb-10">
        <Map onSelect={setSelected} />
      </section>
      <VenueLoader venue={selected} />
    </main>
  )
}
