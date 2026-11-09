import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import { maplibreGL } from '@maplibre/maplibre-gl-leaflet'
import 'maplibre-gl/dist/maplibre-gl.css'

import { MAP_ATTRIBUTION } from '#/lib/map-styles'

export function VectorTileLayer({ styleUrl }: { styleUrl: string }) {
  const map = useMap()

  useEffect(() => {
    const layer = maplibreGL({
      style: styleUrl,
      attributionControl: false,
    })
    layer.addTo(map)
    map.attributionControl.addAttribution(MAP_ATTRIBUTION)

    // The upstream dark style references a `wood-pattern` sprite that is not
    // included in its sprite sheet. Add a transparent placeholder so MapLibre
    // does not log a warning for every redraw.
    const glMap = layer.getMaplibreMap()
    glMap.on('styleimagemissing', (event) => {
      if (!glMap.hasImage(event.id)) {
        glMap.addImage(event.id, {
          width: 1,
          height: 1,
          data: new Uint8Array(4),
        })
      }
    })

    return () => {
      map.attributionControl.removeAttribution(MAP_ATTRIBUTION)
      layer.remove()
    }
  }, [map, styleUrl])

  return null
}
