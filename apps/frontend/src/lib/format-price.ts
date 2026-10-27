import type { SearchPriceSighting } from '../types/search'

function formatSize(sighting: SearchPriceSighting) {
  if (sighting.sizeMl != null) return `${Math.round(sighting.sizeMl)} ml`

  return sighting.size.toLowerCase().replaceAll('_', ' ')
}

export function formatPrice(sighting: SearchPriceSighting) {
  return `NOK ${sighting.price} · ${formatSize(sighting)}`
}
