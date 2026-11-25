import type { ReactNode } from 'react'

import MapSidebar from './MapSidebar'
import { NearbyVenuesContent, nearbyVenuesTitle } from './NearbyVenues'
import type { NearbyVenuesContentProps } from './NearbyVenues'

interface NearbyVenuesSidebarProps extends NearbyVenuesContentProps {
  onRefresh: () => void
  pagination?: ReactNode
}

export default function NearbyVenuesSidebar({
  onRefresh,
  pagination,
  ...contentProps
}: NearbyVenuesSidebarProps) {
  return (
    <MapSidebar
      title={nearbyVenuesTitle(contentProps.maxDistanceKm)}
      label="nearby pubs"
      onRefresh={onRefresh}
      refreshing={contentProps.locating}
    >
      <NearbyVenuesContent {...contentProps} />
      {pagination}
    </MapSidebar>
  )
}
