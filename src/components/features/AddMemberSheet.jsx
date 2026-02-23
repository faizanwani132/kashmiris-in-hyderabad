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
  const [step, setStep] = useState(1)
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
    setStep(1)
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

  const goToStepTwo = (event) => {
    event.preventDefault()

    if (!name.trim()) {
      setError('Name or nickname is required.')
      return
    }

    setError('')
    setStep(2)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

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
        isOpen={isOpen && !isPickerOpen}
        onClose={onClose}
        title="Add Me to the Map"
        subtitle="Approximate location only for safe community connection."
        className="h-[76svh] max-w-2xl sm:h-[640px]"
      >
        {hasSubmitted ? (
          <div className="flex h-full flex-col justify-between gap-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="inline-flex items-center gap-2 font-semibold text-emerald-800">
                <CheckCircle2 size={18} />
                This device already submitted once.
              </p>
              <p className="mt-2 text-sm text-emerald-700">
                {lastSubmittedAt
                  ? `Submitted on ${new Date(lastSubmittedAt).toLocaleDateString()}.`
                  : 'Updates are handled by admins from Supabase dashboard.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="flex h-full flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <span
                className={`rounded-full px-3 py-1.5 text-center text-xs font-semibold ${
                  step === 1 ? 'bg-saffron text-slate-900' : 'bg-slate-100 text-slate-600'
                }`}
              >
                1. Details
              </span>
              <span
                className={`rounded-full px-3 py-1.5 text-center text-xs font-semibold ${
                  step === 2 ? 'bg-pine text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                2. Location & Consent
              </span>
            </div>

            {step === 1 ? (
              <form onSubmit={goToStepTwo} className="flex h-full flex-col gap-3">
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-slate-800">
                    Name / Nickname *
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Enter your name"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base outline-none ring-saffron transition focus:border-saffron focus:ring-2 sm:text-sm"
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
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base outline-none ring-saffron transition focus:border-saffron focus:ring-2 sm:text-sm"
                    maxLength={80}
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-slate-800">Kashmiri Origin</span>
                  <input
                    type="text"
                    value={origin}
                    onChange={(event) => setOrigin(event.target.value)}
                    placeholder="e.g. Srinagar"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base outline-none ring-saffron transition focus:border-saffron focus:ring-2 sm:text-sm"
                    maxLength={80}
                  />
                </label>

                {error ? <p className="text-sm font-medium text-rose-700">{error}</p> : null}

                <div className="mt-auto grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-pine px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-pine/90"
                  >
                    Continue
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="flex h-full flex-col gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocating}
                    className="flex items-center justify-center gap-2 rounded-xl bg-pine px-3 py-3 text-sm font-semibold text-white transition hover:bg-pine/90 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isLocating ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <LocateFixed size={16} />
                    )}
                    My Location
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMethod('manual')
                      setIsPickerOpen(true)
                      setError('')
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl border border-pine px-3 py-3 text-sm font-semibold text-pine transition hover:bg-pine/10"
                  >
                    <Map size={16} />
                    Pick on Map
                  </button>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                  {hasValidLocation ? (
                    <p className="inline-flex items-center gap-1 font-semibold text-slate-900">
                      <MapPin size={13} className="text-pine" />
                      {method === 'manual' ? 'Map area' : 'Current area'}: {selectedLocation.lat},{' '}
                      {selectedLocation.lng}
                    </p>
                  ) : (
                    <p className="text-slate-600">Select location to continue.</p>
                  )}
                </div>

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

                <p className="inline-flex items-center gap-1 text-xs text-slate-600">
                  <ShieldCheck size={13} className="text-pine" />
                  Coordinates are rounded to 3 decimals automatically.
                </p>

                {error ? <p className="text-sm font-medium text-rose-700">{error}</p> : null}

                <div className="mt-auto grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setError('')
                      setStep(1)
                    }}
                    className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-xl bg-saffron px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-[#e89456] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSaving ? 'Saving...' : 'Add to Map'}
                  </button>
                </div>
              </form>
            )}
          </div>
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
