import { useEffect, useMemo, useState } from 'react'
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { ArrowLeft, Check, MapPin, Move, ShieldCheck } from 'lucide-react'
import BottomSheet from '../ui/BottomSheet'
import { approximateCoordinates } from '../../lib/geo'
import { pickerMarkerIcon } from '../../lib/mapIcons'
import { HYDERABAD_CENTER, PRIVACY_RADIUS_METERS } from '../../constants'

const MapInteractions = ({ onSelect }) => {
  const map = useMap()

  useMapEvents({
    click: (event) => {
      const point = {
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      }
      onSelect(point)
      map.flyTo([point.lat, point.lng], Math.max(map.getZoom(), 15), { duration: 0.45 })
    },
  })

  return null
}

const SyncCenter = ({ center }) => {
  const map = useMap()

  useEffect(() => {
    map.flyTo([center.lat, center.lng], Math.max(map.getZoom(), 13), { duration: 0.45 })
  }, [center, map])

  return null
}

const MapLocationPicker = ({ onClose, initialLocation, onConfirm }) => {
  const [selectedLocation, setSelectedLocation] = useState(initialLocation ?? HYDERABAD_CENTER)

  const approximatePoint = useMemo(
    () => approximateCoordinates(selectedLocation),
    [selectedLocation],
  )

  return (
    <BottomSheet
      isOpen
      onClose={onClose}
      title="Choose Location on Map"
      subtitle="Pick an approximate area, not exact home."
      className="h-[78svh] max-w-3xl sm:h-[680px]"
      zIndex={1300}
      closeOnBackdrop={false}
    >
      <div className="relative h-full min-h-0 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
        <MapContainer
          center={[selectedLocation.lat, selectedLocation.lng]}
          zoom={13}
          className="h-full w-full"
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapInteractions onSelect={setSelectedLocation} />
          <SyncCenter center={selectedLocation} />
          <Circle
            center={[selectedLocation.lat, selectedLocation.lng]}
            radius={PRIVACY_RADIUS_METERS}
            pathOptions={{
              color: '#2A6F6B',
              fillColor: '#2A6F6B',
              fillOpacity: 0.12,
              weight: 1.5,
            }}
          />
          <Marker
            position={[selectedLocation.lat, selectedLocation.lng]}
            icon={pickerMarkerIcon}
            draggable
            eventHandlers={{
              dragend: (event) => {
                const point = event.target.getLatLng()
                setSelectedLocation({ lat: point.lat, lng: point.lng })
              },
            }}
          />
        </MapContainer>

        <div className="pointer-events-none absolute inset-x-2 top-2 z-[900] grid gap-2">
          <div className="pointer-events-auto grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-300 bg-white/95 px-3 py-2.5 text-sm font-semibold text-slate-700 shadow transition hover:bg-slate-100"
            >
              <ArrowLeft size={14} />
              Back
            </button>
            <button
              type="button"
              onClick={() => onConfirm(approximatePoint)}
              className="inline-flex items-center justify-center gap-1 rounded-xl bg-pine px-3 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-pine/90"
            >
              <Check size={14} />
              Confirm Location
            </button>
          </div>
          <div className="pointer-events-auto inline-flex items-center gap-1 self-start rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow">
            <ShieldCheck size={12} className="text-pine" />
            Approximate only
          </div>
          <div className="pointer-events-auto inline-flex items-center gap-1 self-start rounded-full bg-white/95 px-2.5 py-1 text-[11px] text-slate-600 shadow">
            <Move size={12} className="text-pine" />
            Drag pin or tap map
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-2 bottom-2 z-[900] grid gap-2">
          <p className="pointer-events-auto inline-flex items-center gap-1 self-start rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow">
            <MapPin size={12} className="text-pine" />
            {approximatePoint.lat}, {approximatePoint.lng}
          </p>
        </div>
      </div>
    </BottomSheet>
  )
}

export default MapLocationPicker
