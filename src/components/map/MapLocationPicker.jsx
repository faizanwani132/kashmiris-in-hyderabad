import { useEffect, useState } from 'react'
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { MapPin, Move, Navigation, ShieldCheck } from 'lucide-react'
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
  const [selectedLocation, setSelectedLocation] = useState(
    initialLocation ?? HYDERABAD_CENTER,
  )

  return (
    <BottomSheet
      isOpen
      onClose={onClose}
      title="Choose Location on Map"
      subtitle="Select an approximate area, not your exact home."
      className="h-[84dvh] max-w-3xl"
    >
      <div className="grid h-full grid-rows-[auto_1fr_auto] gap-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <p className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-pine" />
            Location is intentionally approximate for privacy.
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1">
              <Move size={12} className="text-pine" />
              Drag the pin
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1">
              <MapPin size={12} className="text-pine" />
              Or tap anywhere
            </span>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
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
        </div>

        <div className="grid gap-2">
          <p className="text-xs text-slate-600">
            Approximate point: {approximateCoordinates(selectedLocation).lat},{' '}
            {approximateCoordinates(selectedLocation).lng}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => onConfirm(approximateCoordinates(selectedLocation))}
              className="rounded-xl bg-pine px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-pine/90"
            >
              <span className="inline-flex items-center gap-1">
                <Navigation size={14} />
                Confirm Location
              </span>
            </button>
          </div>
        </div>
      </div>
    </BottomSheet>
  )
}

export default MapLocationPicker
