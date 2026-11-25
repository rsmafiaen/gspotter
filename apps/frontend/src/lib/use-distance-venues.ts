import { useInfiniteQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'

import {
  INITIAL_DISTANCE_KM,
  MAX_DISTANCE_KM,
  distanceVenuesQueryOptions,
} from '#/graphql/venues'
import type { VenuePageParams } from '#/graphql/venues'
import type { Coordinates } from './location'
import type { SearchFilters } from '#/types/search'

interface UseDistanceVenuesOptions {
  cityId: string | null
  filters: SearchFilters
  coordinates: Coordinates | null
  enabled?: boolean
}

function lastVenuePageParam(
  data: { pageParams: unknown[] } | undefined,
): VenuePageParams | undefined {
  return data?.pageParams.at(-1) as VenuePageParams | undefined
}

/**
 * Infinite venue pages ordered by distance. The map viewport drives the target
 * radius, pages are fetched in small batches until everything inside that radius
 * is loaded, and scrolling can extend the list beyond the viewport.
 */
export function useDistanceVenues({
  cityId,
  filters,
  coordinates,
  enabled = coordinates != null,
}: UseDistanceVenuesOptions) {
  const [viewportRadiusKm, setViewportRadiusKm] = useState(INITIAL_DISTANCE_KM)
  const [listRadiusKm, setListRadiusKm] = useState(0)
  const maxDistanceLimit = filters.maxDistanceKm ?? MAX_DISTANCE_KM
  const targetRadiusKm = Math.min(
    Math.max(viewportRadiusKm, listRadiusKm),
    maxDistanceLimit,
  )
  const targetRadiusRef = useRef(targetRadiusKm)

  targetRadiusRef.current = targetRadiusKm

  const query = useInfiniteQuery(
    distanceVenuesQueryOptions(
      cityId,
      filters,
      coordinates,
      enabled,
      () => targetRadiusRef.current,
    ),
  )
  const loadedRadiusKm =
    lastVenuePageParam(query.data)?.maxDistanceKm ?? INITIAL_DISTANCE_KM

  const setRadiusFromMap = useCallback((radiusKm: number) => {
    setViewportRadiusKm((current) => Math.max(current, radiusKm))
  }, [])

  const loadMore = useCallback(() => {
    if (query.hasNextPage) {
      if (!query.isFetchingNextPage) {
        void query.fetchNextPage()
      }
      return
    }

    setListRadiusKm((current) => {
      const base = Math.max(current, targetRadiusKm, INITIAL_DISTANCE_KM)

      return Math.min(maxDistanceLimit, base * 2)
    })
  }, [
    maxDistanceLimit,
    query.fetchNextPage,
    query.hasNextPage,
    query.isFetchingNextPage,
    targetRadiusKm,
  ])

  useEffect(() => {
    if (query.isFetchingNextPage) return
    if (!query.hasNextPage && loadedRadiusKm >= targetRadiusKm) return

    void query.fetchNextPage()
  }, [
    loadedRadiusKm,
    query.fetchNextPage,
    query.hasNextPage,
    query.isFetchingNextPage,
    targetRadiusKm,
  ])

  return {
    ...query,
    hasMorePages: query.hasNextPage || targetRadiusKm < maxDistanceLimit,
    loadMore,
    loadedRadiusKm,
    targetRadiusKm,
    setRadiusFromMap,
  }
}
