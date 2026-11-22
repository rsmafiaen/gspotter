import type { ReactNode } from 'react'

import { formatPrice, formatPriceLimitation } from '#/lib/format-price'
import { useUserTimeZone } from '#/lib/use-user-time-zone'
import type { VenuePriceSighting } from '#/types/venue'

const SIZE_VOLUME_ML: Partial<Record<string, number>> = {
  PINT: 568,
  HALF_LITER: 500,
  QUARTER_LITER: 250,
  CAN: 440,
  OTHER: 0,
}

function isLimited(sighting: VenuePriceSighting) {
  return sighting.Limitations.length > 0
}

function volumeMl(sighting: VenuePriceSighting) {
  return sighting.sizeMl ?? SIZE_VOLUME_ML[sighting.size] ?? 0
}

function sortPrices(prices: VenuePriceSighting[]) {
  return [...prices].sort((a, b) => {
    const volumeDiff = volumeMl(b) - volumeMl(a)
    if (volumeDiff !== 0) return volumeDiff

    const aLimited = isLimited(a)
    const bLimited = isLimited(b)

    if (aLimited !== bLimited) return aLimited ? 1 : -1

    const priceDiff = a.price - b.price
    if (priceDiff !== 0) return priceDiff

    return b.timeSighted.localeCompare(a.timeSighted)
  })
}

interface VenuePricesProps {
  prices: VenuePriceSighting[]
  action?: ReactNode
}

export function VenuePrices({ prices, action }: VenuePricesProps) {
  const timeZone = useUserTimeZone()
  const sortedPrices = sortPrices(prices)

  return (
    <section
      aria-labelledby="venue-prices-heading"
      className="mt-6 rounded-2xl bg-(--surface-strong) p-5 text-(--sea-ink)"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="venue-prices-heading" className="text-xl font-extrabold">
          Prices
        </h2>
        {action}
      </div>

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
