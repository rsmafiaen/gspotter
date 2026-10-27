import type { venue } from '#/types/venue'
import { useQuery } from '@tanstack/react-query'
import { graphqlFetch } from '#/graphql/client'

const GET_VENUE = `
  query GetVenues {
    venue {
      id
      name
      address
      city {
        id
        name
      }
      openingHours {
        days
        opening
        closing
      }
    }
  }
`

export function ViewVenue(Current: venue) {
  const fmt = (iso: string) => iso.slice(11, 16)

  return (
    <article className="rounded-2xl border border-(--harp-gold) bg-(--cream) p-5 text-(--sea-ink)">
      <p className="text-xs font-bold tracking-widest uppercase text-(--)">
        {Current.city.name}
      </p>
      <h2 className="mt-1 text-xl font-extrabold">{Current.name}</h2>
      <p className="mt-1 text-sm text-(--sea-ink-soft)">{Current.address}</p>
      <h3 className="mt-4 text-sm font-bold">Opening hours</h3>
      <ul className="mt-1">
        {Current.openingHours.map((oh, i) => (
          <li
            key={i}
            className="flex items-baseline justify-between gap-4 border-t border-(--line) py-2 text-sm"
          >
            <span className="font-semibold">{oh.days.join(', ')}</span>
            <span className="text-(--sea-ink-soft)">
              {fmt(oh.opening)} - {fmt(oh.closing)}
            </span>
          </li>
        ))}
      </ul>
    </article>
  )
}

export default function VenueLoader() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['venues'],
    queryFn: () => graphqlFetch<{ venue: venue[] }>(GET_VENUE),
  })

  if (isPending) return <p>Loading venue…</p>
  if (isError) return <div>error</div>
  // Hardcoded: show first venue for now
  if (data.venue.length == 0) return <div>No venues found</div>
  const first = data.venue[0]
  return <ViewVenue {...first} />
}
