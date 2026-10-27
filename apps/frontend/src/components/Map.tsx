import { useEffect, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'

import { formatPrice } from '../lib/format-price'
import type { SearchResult } from '../types/search'
import { SearchBox } from './SearchBox'

const DEFAULT_CENTER: [number, number] = [63.4305, 10.3951]
const DEFAULT_ZOOM = 15

function FlyToResult({ result }: { result: SearchResult | null }) {
  const map = useMap()

  useEffect(() => {
    if (result) {
      map.flyTo([result.lat, result.lon], result.type === 'city' ? 12 : 16)
    }
  }, [result, map])

  return null
}

export default function Map({
  onSelect,
}: {
  onSelect?: (result: SearchResult) => void
}) {
  const [selected, setSelected] = useState<SearchResult | null>(null)

  function handleSelect(result: SearchResult) {
    setSelected(result)
    onSelect?.(result)
  }

  return (
    <section id="map" className="relative">
      <SearchBox onSelect={handleSelect} />
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={false}
        className="h-100 w-full rounded-2xl"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FlyToResult result={selected} />
        {selected && (
          <Marker position={[selected.lat, selected.lon]}>
            <Popup>
              <strong>{selected.name}</strong>
              {selected.address && (
                <span className="block">{selected.address}</span>
              )}
              {selected.latestPriceSighting && (
                <span className="block">
                  {formatPrice(selected.latestPriceSighting)}
                </span>
              )}
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </section>
  )
}
