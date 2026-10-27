export type PriceSightingLike = {
  size: string
  sizeMl: number | null
  limitation: ('TIME' | 'MEMBERSHIP')[]
  timeStart: Date | null
  timeEnd: Date | null
  timeSighted: Date
}

export type VenueWithPriceSightings = {
  pricesSighted?: PriceSightingLike[]
}

export function latestPriceSightings<T extends PriceSightingLike>(
  sightings: T[],
): T[] {
  const groups = new Map<string, T[]>()

  for (const sighting of sightings) {
    const key = sightingKey(sighting)
    const group = groups.get(key)

    if (group) {
      group.push(sighting)
    } else {
      groups.set(key, [sighting])
    }
  }

  const latest = new Set<T>()

  for (const group of groups.values()) {
    const kept: T[] = []

    for (const sighting of [...group].sort(
      (a, b) => b.timeSighted.getTime() - a.timeSighted.getTime(),
    )) {
      if (!kept.some((winner) => supersedes(winner, sighting))) {
        kept.push(sighting)
      }
    }

    for (const sighting of kept) {
      latest.add(sighting)
    }
  }

  return sightings.filter((sighting) => latest.has(sighting))
}

export function latestUnlimitedSighting<T extends PriceSightingLike>(
  sightings: T[],
): T | null {
  return sightings.reduce<T | null>((latest, sighting) => {
    if (sighting.limitation.length > 0) {
      return latest
    }

    if (latest === null || sighting.timeSighted > latest.timeSighted) {
      return sighting
    }

    return latest
  }, null)
}

function sightingKey(sighting: PriceSightingLike): string {
  const category = [...sighting.limitation].sort().join('+')

  return `${category}:${sighting.size}:${sighting.sizeMl ?? ''}`
}

function supersedes(
  winner: PriceSightingLike,
  sighting: PriceSightingLike,
): boolean {
  if (!sighting.limitation.includes('TIME')) {
    return true
  }

  if (
    !winner.timeStart ||
    !winner.timeEnd ||
    !sighting.timeStart ||
    !sighting.timeEnd
  ) {
    return true
  }

  return (
    winner.timeStart < sighting.timeEnd && sighting.timeStart < winner.timeEnd
  )
}
