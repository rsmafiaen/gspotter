import { formatPrice, formatPriceLimitation } from '#/lib/format-price'
import { useUserTimeZone } from '#/lib/use-user-time-zone'
import type { VenuePriceSighting } from '#/types/venue'

function isLimited(sighting: VenuePriceSighting) {
  return sighting.Limitations.length > 0
}

function sortPrices(prices: VenuePriceSighting[]) {
  return [...prices].sort((a, b) => {
    const aLimited = isLimited(a)
    const bLimited = isLimited(b)

    if (aLimited !== bLimited) return aLimited ? 1 : -1

    return b.timeSighted.localeCompare(a.timeSighted)
  })
}

export function VenuePrices({ prices }: { prices: VenuePriceSighting[] }) {
  const timeZone = useUserTimeZone()
  const sortedPrices = sortPrices(prices)

  return (
    <section
      aria-labelledby="venue-prices-heading"
      className="mt-6 rounded-2xl bg-(--surface-strong) p-5 text-(--sea-ink)"
    >
      <h2 id="venue-prices-heading" className="text-xl font-extrabold">
        Prices
      </h2>

      {sortedPrices.length === 0 ? (
        <p className="mt-3 text-sm text-(--sea-ink-soft)">
          No prices reported yet.
        </p>
      ) : (
        <ul className="mt-3 striped-list">
          {sortedPrices.map((sighting, index) => {
            const limitation = formatPriceLimitation(sighting, timeZone)

            return (
              <li
                key={`${sighting.size}-${sighting.sizeMl ?? ''}-${sighting.timeSighted}-${index}`}
                className="flex flex-wrap items-baseline gap-2 py-3 first:pt-0"
              >
                <span className="text-sm font-semibold">
                  {formatPrice(sighting)}
                </span>
                {limitation && (
                  <span className="rounded-full bg-(--chip-bg) px-2 py-0.5 text-xs font-bold text-(--sea-ink-soft)">
                    {limitation}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
