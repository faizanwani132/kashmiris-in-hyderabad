import { useEffect } from 'react'
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
import { createClusterIcon, communityMarkerIcon } from '../../lib/mapIcons'

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

const MemberPopupContent = ({ member }) => (
  <div className="min-w-[180px] text-sm">
    <p className="font-heading text-lg font-semibold text-slate-900">{member.name}</p>
    <p className="text-slate-700">{member.area || 'Area not shared'}</p>
    <p className="mt-1 text-xs text-pine">Kashmiri living nearby</p>
  </div>
)

const CommunityMap = ({
  members,
  center,
  nearbyCenter,
  nearbyRadiusKm,
  isMobile,
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
      {members.map((member) => (
        <Marker
          key={member.id}
          position={[member.lat, member.lng]}
          icon={communityMarkerIcon}
          eventHandlers={{
            click: () => {
              if (isMobile) onMemberClick(member)
            },
          }}
        >
          {!isMobile ? (
            <Popup>
              <MemberPopupContent member={member} />
            </Popup>
          ) : null}
        </Marker>
      ))}
    </MarkerClusterGroup>
  </MapContainer>
)

export default CommunityMap
