import type { SearchPriceSighting } from '../types/search'
import { formatOpeningTime } from './format-opening-hours'
import { DEFAULT_TIME_ZONE } from './time-zone'

function formatSize(sighting: SearchPriceSighting) {
  if (sighting.sizeMl != null) return `${Math.round(sighting.sizeMl)} ml`

  return sighting.size.toLowerCase().replaceAll('_', ' ')
}

export function formatPrice(sighting: SearchPriceSighting) {
  return `NOK ${sighting.price} · ${formatSize(sighting)}`
}

export function formatPriceLimitation(
  sighting: SearchPriceSighting,
  timeZone = DEFAULT_TIME_ZONE,
): string | null {
  const labels: string[] = []

  if (sighting.Limitations.includes('MEMBERSHIP')) {
    labels.push('Member price')
  }

  if (sighting.Limitations.includes('TIME')) {
    const start = sighting.timeStart
      ? formatOpeningTime(sighting.timeStart, timeZone)
      : null
    const end = sighting.timeEnd
      ? formatOpeningTime(sighting.timeEnd, timeZone)
      : null

    labels.push(
      start && end ? `Happy hour ${start}–${end}` : 'Time-limited price',
    )
  }

  return labels.length > 0 ? labels.join(' · ') : null
}
