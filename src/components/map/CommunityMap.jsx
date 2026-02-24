import { useEffect, useMemo } from 'react'
import L from 'leaflet'
import 'leaflet.heat'
import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import {
  communityMarkerIcon,
  createClusterIcon,
  newCommunityMarkerIcon,
} from '../../lib/mapIcons'

const buildHeatmapData = (members) => {
  const groupedByCoordinate = new Map()

  members.forEach((member) => {
    const key = `${member.lat},${member.lng}`
    groupedByCoordinate.set(key, (groupedByCoordinate.get(key) ?? 0) + 1)
  })

  return Array.from(groupedByCoordinate.entries()).map(([coordinateKey, count]) => {
    const [lat, lng] = coordinateKey.split(',').map(Number)
    const intensity = Math.min(1, 0.35 + count * 0.15)
    return [lat, lng, intensity]
  })
}

const HeatmapLayer = ({ members, isEnabled }) => {
  const map = useMap()

  const heatPoints = useMemo(() => buildHeatmapData(members), [members])

  useEffect(() => {
    if (!isEnabled || heatPoints.length === 0) return undefined

    const heatLayer = L.heatLayer(heatPoints, {
      radius: 34,
      blur: 28,
      maxZoom: 15,
      minOpacity: 0.22,
      gradient: {
        0.2: '#2A6F6B',
        0.45: '#F4A261',
        0.7: '#E76F51',
        1: '#B23A48',
      },
    })

    heatLayer.addTo(map)
    return () => {
      map.removeLayer(heatLayer)
    }
  }, [heatPoints, isEnabled, map])

  return null
}

const MapStability = () => {
  const map = useMap()

  useEffect(() => {
    let rafId = 0

    const refreshMap = () => {
      if (rafId) {
        cancelAnimationFrame(rafId)
      }

      rafId = requestAnimationFrame(() => {
        map.invalidateSize({ pan: false, debounceMoveend: true })
        map.eachLayer((layer) => {
          if (typeof layer.redraw === 'function') {
            layer.redraw()
          }
        })
      })
    }

    const initialTimer = window.setTimeout(refreshMap, 90)

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshMap()
      }
    }

    window.addEventListener('resize', refreshMap)
    window.addEventListener('orientationchange', refreshMap)
    window.addEventListener('pageshow', refreshMap)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.clearTimeout(initialTimer)
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
      window.removeEventListener('resize', refreshMap)
      window.removeEventListener('orientationchange', refreshMap)
      window.removeEventListener('pageshow', refreshMap)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [map])

  return null
}

const MapAutoCenter = ({ center }) => {
  const map = useMap()

  useEffect(() => {
    if (!center) return
    map.flyTo([center.lat, center.lng], Math.max(map.getZoom(), 12), {
      duration: 0.65,
    })
  }, [center, map])

  return null
}

const MemberPopupContent = ({ member, isNew }) => (
  <div className="min-w-[180px] text-sm">
    <div className="flex items-start justify-between gap-2">
      <p className="font-heading text-lg font-semibold text-slate-900">{member.name}</p>
      {isNew ? (
        <span className="rounded-full bg-saffron/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-900">
          New
        </span>
      ) : null}
    </div>
    <p className="text-slate-700">{member.area || 'Area not shared'}</p>
    <p className="mt-1 text-xs text-pine">Kashmiri living nearby</p>
  </div>
)

const CommunityMap = ({
  members,
  center,
  nearbyCenter,
  nearbyRadiusKm,
  isHeatmapEnabled,
  isMobile,
  highlightedMemberIds,
  onMemberClick,
}) => (
  <MapContainer
    center={[center.lat, center.lng]}
    zoom={11}
    scrollWheelZoom
    className="h-full w-full"
    zoomControl={false}
  >
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      keepBuffer={4}
      updateWhenIdle
    />

    <MapStability />
    <MapAutoCenter center={center} />
    <HeatmapLayer members={members} isEnabled={isHeatmapEnabled} />

    {nearbyCenter && nearbyRadiusKm ? (
      <>
        <Circle
          center={[nearbyCenter.lat, nearbyCenter.lng]}
          radius={nearbyRadiusKm * 1000}
          pathOptions={{
            color: '#2A6F6B',
            weight: 2,
            dashArray: '6 6',
            fillColor: '#2A6F6B',
            fillOpacity: 0.08,
          }}
        />
        <CircleMarker
          center={[nearbyCenter.lat, nearbyCenter.lng]}
          radius={7}
          pathOptions={{ color: '#2A6F6B', fillColor: '#F4A261', fillOpacity: 1, weight: 2 }}
        />
      </>
    ) : null}

    <MarkerClusterGroup
      chunkedLoading
      iconCreateFunction={createClusterIcon}
      maxClusterRadius={45}
    >
      {members.map((member) => {
        const isNew = highlightedMemberIds?.has(member.id)
        return (
          <Marker
            key={member.id}
            position={[member.lat, member.lng]}
            icon={isNew ? newCommunityMarkerIcon : communityMarkerIcon}
            eventHandlers={{
              click: () => {
                if (isMobile) onMemberClick({ ...member, isNew })
              },
            }}
          >
            {!isMobile ? (
              <Popup>
                <MemberPopupContent member={member} isNew={isNew} />
              </Popup>
            ) : null}
          </Marker>
        )
      })}
    </MarkerClusterGroup>
  </MapContainer>
)

export default CommunityMap
