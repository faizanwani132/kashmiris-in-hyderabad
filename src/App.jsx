import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, MapPinPlus, Users } from 'lucide-react'
import AddMemberSheet from './components/features/AddMemberSheet'
import MemberDetailsSheet from './components/features/MemberDetailsSheet'
import NearbyControls from './components/features/NearbyControls'
import CommunityMap from './components/map/CommunityMap'
import EmptyState from './components/ui/EmptyState'
import LoadingSkeleton from './components/ui/LoadingSkeleton'
import {
  DEFAULT_CITY,
  DEFAULT_RADIUS_KM,
  HYDERABAD_CENTER,
  SUBMISSION_STORAGE_KEY,
} from './constants'
import {
  fetchCommunityMembers,
  hasSupabaseConfig,
  insertCommunityMember,
} from './lib/supabase'
import {
  approximateCoordinates,
  getCurrentLocation,
  haversineDistanceKm,
} from './lib/geo'

const MOBILE_BREAKPOINT = 768

const readSubmissionTimestamp = () => {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(SUBMISSION_STORAGE_KEY) ?? ''
}

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.innerWidth < MOBILE_BREAKPOINT
  })

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const update = (event) => setIsMobile(event.matches)

    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return isMobile
}

const parseMember = (member) => ({
  ...member,
  lat: Number(member.lat),
  lng: Number(member.lng),
  origin: member.origin ?? '',
})

function App() {
  const isMobile = useIsMobile()
  const [members, setMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFindingNearby, setIsFindingNearby] = useState(false)
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false)
  const [isNearbyCollapsed, setIsNearbyCollapsed] = useState(true)
  const [selectedMember, setSelectedMember] = useState(null)
  const [appMessage, setAppMessage] = useState('')
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM)
  const [nearbyCenter, setNearbyCenter] = useState(null)
  const [autoCenterMap, setAutoCenterMap] = useState(true)
  const [mapCenter, setMapCenter] = useState(HYDERABAD_CENTER)
  const [submittedAt, setSubmittedAt] = useState(readSubmissionTimestamp)

  const hasSubmitted = Boolean(submittedAt)

  const loadMembers = async () => {
    if (!hasSupabaseConfig) {
      setAppMessage(
        'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env before loading members.',
      )
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setAppMessage('')

    const { data, error } = await fetchCommunityMembers()
    if (error) {
      setAppMessage('Could not load community members right now.')
      setIsLoading(false)
      return
    }

    setMembers(
      (data ?? [])
        .map(parseMember)
        .filter((member) => Number.isFinite(member.lat) && Number.isFinite(member.lng)),
    )
    setIsLoading(false)
  }

  useEffect(() => {
    loadMembers()
  }, [])

  useEffect(() => {
    if (!isMobile) {
      setSelectedMember(null)
    }
  }, [isMobile])

  const filteredMembers = useMemo(() => {
    if (!nearbyCenter) return members

    return members.filter((member) => {
      const distance = haversineDistanceKm(nearbyCenter, { lat: member.lat, lng: member.lng })
      return distance <= radiusKm
    })
  }, [members, nearbyCenter, radiusKm])

  const handleFindNearby = async () => {
    setIsFindingNearby(true)
    setAppMessage('')
    try {
      const location = await getCurrentLocation()
      const approximateLocation = approximateCoordinates(location)
      setNearbyCenter(approximateLocation)
      if (autoCenterMap) {
        setMapCenter(approximateLocation)
      }
    } catch (error) {
      setAppMessage(error.message)
    } finally {
      setIsFindingNearby(false)
    }
  }

  const handleAddMember = async (formPayload) => {
    if (!hasSupabaseConfig) {
      return { ok: false, error: 'Supabase keys are missing in .env.' }
    }

    setIsSubmitting(true)
    setAppMessage('')

    const roundedCoordinates = approximateCoordinates({
      lat: formPayload.lat,
      lng: formPayload.lng,
    })

    const payload = {
      name: formPayload.name,
      area: formPayload.area,
      origin: formPayload.origin,
      lat: roundedCoordinates.lat,
      lng: roundedCoordinates.lng,
      city: DEFAULT_CITY,
      visible: true,
    }

    const { error } = await insertCommunityMember(payload)
    if (error) {
      setIsSubmitting(false)
      return { ok: false, error: 'Could not add your location right now. Please try again.' }
    }

    const timestamp = new Date().toISOString()
    window.localStorage.setItem(SUBMISSION_STORAGE_KEY, timestamp)
    setSubmittedAt(timestamp)
    setMapCenter({ lat: payload.lat, lng: payload.lng })
    setNearbyCenter(null)
    setRadiusKm(DEFAULT_RADIUS_KM)
    setIsAddSheetOpen(false)

    await loadMembers()
    setIsSubmitting(false)
    return { ok: true }
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-snow font-body">
      <CommunityMap
        members={filteredMembers}
        center={mapCenter}
        nearbyCenter={nearbyCenter}
        nearbyRadiusKm={nearbyCenter ? radiusKm : 0}
        isMobile={isMobile}
        onMemberClick={setSelectedMember}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[550] px-3 pt-3">
        <header className="heritage-panel pointer-events-auto rounded-3xl p-4 text-white shadow-soft">
          <div className="relative z-10">
            <h1 className="font-heading text-3xl font-semibold leading-none md:text-4xl">
              Kashmiris of Hyderabad
            </h1>
            <p className="mt-1 text-sm text-white/95">
              Connecting the Kashmiri community across the city
            </p>
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
              <Users size={14} />
              {filteredMembers.length}{' '}
              {nearbyCenter ? 'community members in your selected radius' : 'community members'}
            </p>
          </div>
        </header>

        <NearbyControls
          nearbyCenter={nearbyCenter}
          radiusKm={radiusKm}
          isFinding={isFindingNearby}
          autoCenter={autoCenterMap}
          isCollapsed={isNearbyCollapsed}
          onToggleCollapsed={() => setIsNearbyCollapsed((previous) => !previous)}
          onAutoCenterChange={setAutoCenterMap}
          onFindNearby={handleFindNearby}
          onRadiusChange={setRadiusKm}
          onClear={() => setNearbyCenter(null)}
        />

        {isLoading ? <LoadingSkeleton /> : null}

        {appMessage ? (
          <div className="pointer-events-auto mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <p className="inline-flex items-center gap-2">
              <AlertTriangle size={15} />
              {appMessage}
            </p>
          </div>
        ) : null}
      </div>

      {!isLoading && filteredMembers.length === 0 ? (
        <EmptyState nearbyActive={Boolean(nearbyCenter)} />
      ) : null}

      <button
        type="button"
        onClick={() => setIsAddSheetOpen(true)}
        disabled={hasSubmitted}
        className={`fixed bottom-20 right-4 z-[700] inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold shadow-soft transition ${
          hasSubmitted
            ? 'cursor-not-allowed bg-slate-300 text-slate-700'
            : 'bg-saffron text-slate-900 hover:bg-[#e8924f]'
        }`}
      >
        <MapPinPlus size={16} />
        {hasSubmitted ? 'Already Added' : 'Add Me to the Map'}
      </button>

      <AddMemberSheet
        isOpen={isAddSheetOpen}
        isSaving={isSubmitting}
        hasSubmitted={hasSubmitted}
        lastSubmittedAt={submittedAt}
        onClose={() => setIsAddSheetOpen(false)}
        onSubmit={handleAddMember}
      />

      <MemberDetailsSheet
        member={selectedMember}
        isOpen={Boolean(selectedMember) && isMobile}
        onClose={() => setSelectedMember(null)}
      />

      <footer className="fixed inset-x-0 bottom-0 z-[750] border-t border-slate-200 bg-white/95 px-3 py-2 text-center text-[11px] text-slate-700 backdrop-blur">
        This app shows approximate locations only. All locations are shared voluntarily for
        community connection.
      </footer>
    </div>
  )
}

export default App
