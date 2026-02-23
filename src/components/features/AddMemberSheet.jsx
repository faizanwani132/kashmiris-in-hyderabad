import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  Loader2,
  LocateFixed,
  Map,
  MapPin,
  ShieldCheck,
} from 'lucide-react'
import BottomSheet from '../ui/BottomSheet'
import MapLocationPicker from '../map/MapLocationPicker'
import { approximateCoordinates, getCurrentLocation } from '../../lib/geo'
import { HYDERABAD_CENTER } from '../../constants'

const AddMemberSheet = ({
  isOpen,
  isSaving,
  hasSubmitted,
  lastSubmittedAt,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('')
  const [area, setArea] = useState('')
  const [origin, setOrigin] = useState('')
  const [consent, setConsent] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [method, setMethod] = useState('')
  const [isLocating, setIsLocating] = useState(false)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setName('')
    setArea('')
    setOrigin('')
    setConsent(false)
    setSelectedLocation(null)
    setMethod('')
    setIsLocating(false)
    setIsPickerOpen(false)
    setError('')
  }, [isOpen])

  const hasValidLocation = useMemo(
    () => selectedLocation && Number.isFinite(selectedLocation.lat) && Number.isFinite(selectedLocation.lng),
    [selectedLocation],
  )

  const handleUseCurrentLocation = async () => {
    setMethod('gps')
    setError('')
    setIsLocating(true)

    try {
      const coords = await getCurrentLocation()
      setSelectedLocation(approximateCoordinates(coords))
    } catch (locationError) {
      setError(locationError.message)
    } finally {
      setIsLocating(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!name.trim()) {
      setError('Name or nickname is required.')
      return
    }

    if (!consent) {
      setError('Please check the consent box to continue.')
      return
    }

    if (!hasValidLocation) {
      setError('Please add your approximate location first.')
      return
    }

    setError('')

    const result = await onSubmit({
      name: name.trim(),
      area: area.trim() || null,
      origin: origin.trim() || null,
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
    })

    if (!result.ok) {
      setError(result.error ?? 'Could not submit right now.')
    }
  }

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title="Add Me to the Map"
        subtitle="Share only approximate location for safe community connection."
        className="max-w-2xl"
      >
        {hasSubmitted ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="inline-flex items-center gap-2 font-semibold text-emerald-800">
              <CheckCircle2 size={18} />
              This device has already submitted once.
            </p>
            <p className="mt-2 text-sm text-emerald-700">
              {lastSubmittedAt
                ? `Submitted on ${new Date(lastSubmittedAt).toLocaleDateString()}.`
                : 'You can request updates from admins via Supabase dashboard.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-800">Name / Nickname *</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter your name"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-saffron transition focus:border-saffron focus:ring-2"
                maxLength={60}
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-800">Area / Locality</span>
              <input
                type="text"
                value={area}
                onChange={(event) => setArea(event.target.value)}
                placeholder="e.g. Banjara Hills"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-saffron transition focus:border-saffron focus:ring-2"
                maxLength={80}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-800">Kashmiri Origin</span>
              <input
                type="text"
                value={origin}
                onChange={(event) => setOrigin(event.target.value)}
                placeholder="e.g. Srinagar, Anantnag"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-saffron transition focus:border-saffron focus:ring-2"
                maxLength={80}
              />
            </label>

            <fieldset className="space-y-2 rounded-2xl border border-slate-200 p-3">
              <legend className="px-1 text-sm font-semibold text-slate-800">Location *</legend>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-pine px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-pine/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLocating ? <Loader2 size={16} className="animate-spin" /> : <LocateFixed size={16} />}
                Use My Current Location
              </button>
              <button
                type="button"
                onClick={() => {
                  setMethod('manual')
                  setIsPickerOpen(true)
                  setError('')
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-pine px-3 py-2.5 text-sm font-semibold text-pine transition hover:bg-pine/10"
              >
                <Map size={16} />
                Choose Location on Map
              </button>

              {hasValidLocation ? (
                <p className="inline-flex items-center gap-1 rounded-full bg-saffron/20 px-2.5 py-1 text-xs font-semibold text-slate-800">
                  <MapPin size={13} className="text-pine" />
                  {method === 'manual' ? 'Map-selected area' : 'Current area'}: {selectedLocation.lat},{' '}
                  {selectedLocation.lng}
                </p>
              ) : null}

              <p className="text-xs text-slate-600">
                Location is intentionally approximate for privacy.
              </p>
            </fieldset>

            <label className="flex items-start gap-2 rounded-xl bg-slate-50 p-3">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-pine focus:ring-pine"
                required
              />
              <span className="text-sm text-slate-700">
                I agree to share my approximate location for community connection.
              </span>
            </label>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
              <p className="inline-flex items-center gap-1 font-semibold text-pine">
                <ShieldCheck size={14} />
                Privacy rule
              </p>
              <p className="mt-1">
                Coordinates are automatically rounded to 3 decimal places before storage.
              </p>
            </div>

            {error ? <p className="text-sm font-medium text-rose-700">{error}</p> : null}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full rounded-xl bg-saffron px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-[#e89456] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? 'Saving...' : 'Add Me to the Map'}
            </button>
          </form>
        )}
      </BottomSheet>

      {isPickerOpen ? (
        <MapLocationPicker
          onClose={() => setIsPickerOpen(false)}
          initialLocation={selectedLocation ?? HYDERABAD_CENTER}
          onConfirm={(coords) => {
            setSelectedLocation(coords)
            setMethod('manual')
            setIsPickerOpen(false)
          }}
        />
      ) : null}
    </>
  )
}

export default AddMemberSheet
