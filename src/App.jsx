import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, MapPinPlus, Users } from 'lucide-react'
import AddMemberSheet from './components/features/AddMemberSheet'
import MemberDetailsSheet from './components/features/MemberDetailsSheet'
import NearbyControls from './components/features/NearbyControls'
import CommunityMap from './components/map/CommunityMap'
import EmptyState from './components/ui/EmptyState'
import {
  DEFAULT_CITY,
  DEFAULT_RADIUS_KM,
  HYDERABAD_CENTER,
  MAX_RADIUS_KM,
  MIN_RADIUS_KM,
  NEW_MEMBER_HIGHLIGHT_MINUTES,
  OWNERSHIP_STORAGE_KEY,
  SUBMISSION_STORAGE_KEY,
} from './constants'
import {
  createOwnerToken,
  deleteCommunityMember,
  fetchCommunityMembers,
  hasSupabaseConfig,
  insertCommunityMember,
  isMissingManagementFunction,
  updateCommunityMember,
} from './lib/supabase'
import {
  approximateCoordinates,
  getCurrentLocation,
  haversineDistanceKm,
} from './lib/geo'

const MOBILE_BREAKPOINT = 768
const MEMBERS_CACHE_KEY = 'koh_members_cache_v1'
const MEMBERS_REFRESH_INTERVAL_MS = 60 * 1000
const NEW_MARKER_REFRESH_INTERVAL_MS = 30 * 1000
const NEW_MEMBER_WINDOW_MS = NEW_MEMBER_HIGHLIGHT_MINUTES * 60 * 1000

const readSubmissionTimestamp = () => {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(SUBMISSION_STORAGE_KEY) ?? ''
}

const writeSubmissionTimestamp = (timestamp) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(SUBMISSION_STORAGE_KEY, timestamp)
}

const clearSubmissionTimestamp = () => {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(SUBMISSION_STORAGE_KEY)
}

const readOwnershipRecord = () => {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(OWNERSHIP_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null

    if (!parsed || typeof parsed !== 'object') return null
    if (typeof parsed.memberId !== 'string') return null
    if (typeof parsed.ownerToken !== 'string') return null

    return {
      memberId: parsed.memberId,
      ownerToken: parsed.ownerToken,
    }
  } catch {
    return null
  }
}

const writeOwnershipRecord = (record) => {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(OWNERSHIP_STORAGE_KEY, JSON.stringify(record))
  } catch {
    // Ignore write failures in private mode/quota constraints.
  }
}

const clearOwnershipRecord = () => {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(OWNERSHIP_STORAGE_KEY)
}

const readCachedMembers = () => {
  if (typeof window === 'undefined') return []
  try {
    const cached = window.localStorage.getItem(MEMBERS_CACHE_KEY)
    const parsed = cached ? JSON.parse(cached) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const writeCachedMembers = (members) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(MEMBERS_CACHE_KEY, JSON.stringify(members))
  } catch {
    // Ignore write failures in private mode/quota constraints.
  }
}

const clampRadius = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return DEFAULT_RADIUS_KM
  return Math.min(MAX_RADIUS_KM, Math.max(MIN_RADIUS_KM, Math.round(numeric)))
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

const sanitizeMembers = (members) =>
  (members ?? [])
    .map(parseMember)
    .filter((member) => Number.isFinite(member.lat) && Number.isFinite(member.lng))

const isNewMember = (member, nowMs) => {
  const createdAtMs = Date.parse(member.created_at ?? '')
  if (!Number.isFinite(createdAtMs)) return false
  return nowMs - createdAtMs <= NEW_MEMBER_WINDOW_MS
}

const buildMemberPayload = (formPayload) => {
  const roundedCoordinates = approximateCoordinates({
    lat: formPayload.lat,
    lng: formPayload.lng,
  })

  return {
    name: formPayload.name,
    area: formPayload.area,
    origin: formPayload.origin,
    lat: roundedCoordinates.lat,
    lng: roundedCoordinates.lng,
    city: DEFAULT_CITY,
    visible: true,
  }
}

const MANAGEMENT_SCHEMA_MESSAGE =
  'Pin management is not ready in Supabase yet. Run the updated supabase/schema.sql and try again.'

function App() {
  const isMobile = useIsMobile()
  const [members, setMembers] = useState(() => sanitizeMembers(readCachedMembers()))
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFindingNearby, setIsFindingNearby] = useState(false)
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false)
  const [isNearbyCollapsed, setIsNearbyCollapsed] = useState(true)
  const [isHeatmapEnabled, setIsHeatmapEnabled] = useState(true)
  const [selectedMember, setSelectedMember] = useState(null)
  const [appMessage, setAppMessage] = useState('')
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM)
  const [nearbyCenter, setNearbyCenter] = useState(null)
  const [autoCenterMap, setAutoCenterMap] = useState(true)
  const [mapCenter, setMapCenter] = useState(HYDERABAD_CENTER)
  const [submittedAt, setSubmittedAt] = useState(readSubmissionTimestamp)
  const [ownershipRecord, setOwnershipRecord] = useState(readOwnershipRecord)
  const [nowMs, setNowMs] = useState(Date.now)

  const hasOwnership = Boolean(ownershipRecord?.memberId && ownershipRecord?.ownerToken)
  const hasSubmitted = Boolean(submittedAt || hasOwnership)
  const canOnlyViewSubmission = hasSubmitted && !hasOwnership

  const ownedMember = useMemo(() => {
    if (!ownershipRecord?.memberId) return null
    return members.find((member) => member.id === ownershipRecord.memberId) ?? null
  }, [members, ownershipRecord?.memberId])

  const highlightedMemberIds = useMemo(() => {
    const ids = members
      .filter((member) => isNewMember(member, nowMs))
      .map((member) => member.id)

    return new Set(ids)
  }, [members, nowMs])

  const loadMembers = async ({ showLoader = false } = {}) => {
    if (!hasSupabaseConfig) {
      setAppMessage(
        'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env before loading members.',
      )
      setIsLoading(false)
      return
    }

    if (showLoader) {
      setIsLoading(true)
    }

    setAppMessage('')

    const { data, error } = await fetchCommunityMembers()
    if (error) {
      const cachedMembers = sanitizeMembers(readCachedMembers())
      if (cachedMembers.length > 0) {
        setMembers(cachedMembers)
        setAppMessage('Live update failed. Showing last loaded community map.')
      } else {
        setAppMessage('Could not load community members right now.')
      }
      setIsLoading(false)
      return
    }

    const normalizedMembers = sanitizeMembers(data)
    setMembers(normalizedMembers)
    writeCachedMembers(normalizedMembers)
    setIsLoading(false)
  }

  useEffect(() => {
    loadMembers({ showLoader: true })

    const refreshInterval = window.setInterval(() => {
      loadMembers()
    }, MEMBERS_REFRESH_INTERVAL_MS)

    return () => window.clearInterval(refreshInterval)
  }, [])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowMs(Date.now())
    }, NEW_MARKER_REFRESH_INTERVAL_MS)

    return () => window.clearInterval(intervalId)
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

  const handleCreateMember = async (formPayload) => {
    if (!hasSupabaseConfig) {
      return { ok: false, error: 'Supabase keys are missing in .env.' }
    }

    setIsSubmitting(true)
    setAppMessage('')

    const payload = buildMemberPayload(formPayload)
    const ownerToken = createOwnerToken()

    const { data, error } = await insertCommunityMember({
      ...payload,
      ownerToken,
    })

    if (error) {
      setIsSubmitting(false)
      if (isMissingManagementFunction(error)) {
        return { ok: false, error: MANAGEMENT_SCHEMA_MESSAGE }
      }

      return { ok: false, error: 'Could not add your location right now. Please try again.' }
    }

    if (!data?.id) {
      setIsSubmitting(false)
      return { ok: false, error: 'Member was created but no id was returned.' }
    }

    const timestamp = new Date().toISOString()
    const nextOwnership = {
      memberId: data.id,
      ownerToken,
    }

    writeSubmissionTimestamp(timestamp)
    writeOwnershipRecord(nextOwnership)
    setSubmittedAt(timestamp)
    setOwnershipRecord(nextOwnership)
    setMapCenter({ lat: payload.lat, lng: payload.lng })
    setNearbyCenter(null)
    setRadiusKm(DEFAULT_RADIUS_KM)
    setIsAddSheetOpen(false)
    setNowMs(Date.now())

    await loadMembers()
    setIsSubmitting(false)
    return { ok: true }
  }

  const handleUpdateMember = async (formPayload) => {
    if (!ownershipRecord?.memberId || !ownershipRecord.ownerToken) {
      return { ok: false, error: 'No ownership token found on this device.' }
    }

    setIsSubmitting(true)
    setAppMessage('')

    const payload = buildMemberPayload(formPayload)

    const { error } = await updateCommunityMember({
      memberId: ownershipRecord.memberId,
      ownerToken: ownershipRecord.ownerToken,
      payload,
    })

    if (error) {
      setIsSubmitting(false)
      if (isMissingManagementFunction(error)) {
        return { ok: false, error: MANAGEMENT_SCHEMA_MESSAGE }
      }

      return { ok: false, error: 'Could not update your pin right now. Please try again.' }
    }

    setMapCenter({ lat: payload.lat, lng: payload.lng })
    setNearbyCenter(null)
    setRadiusKm(DEFAULT_RADIUS_KM)
    setIsAddSheetOpen(false)

    await loadMembers()
    setIsSubmitting(false)
    return { ok: true }
  }

  const handleDeleteMember = async () => {
    if (!ownershipRecord?.memberId || !ownershipRecord.ownerToken) {
      return { ok: false, error: 'No ownership token found on this device.' }
    }

    setIsSubmitting(true)
    setAppMessage('')

    const { data, error } = await deleteCommunityMember({
      memberId: ownershipRecord.memberId,
      ownerToken: ownershipRecord.ownerToken,
    })

    if (error) {
      setIsSubmitting(false)
      if (isMissingManagementFunction(error)) {
        return { ok: false, error: MANAGEMENT_SCHEMA_MESSAGE }
      }

      return { ok: false, error: 'Could not remove your pin right now. Please try again.' }
    }

    clearOwnershipRecord()
    clearSubmissionTimestamp()
    setOwnershipRecord(null)
    setSubmittedAt('')
    setSelectedMember(null)
    setIsAddSheetOpen(false)
    setRadiusKm(DEFAULT_RADIUS_KM)
    setNearbyCenter(null)
    const nextMessage = data?.deleted ? 'Your pin was removed from the map.' : 'Pin no longer exists.'

    await loadMembers()
    setAppMessage(nextMessage)
    setIsSubmitting(false)
    return { ok: true }
  }

  const handleRadiusChange = (nextRadius) => {
    setRadiusKm(clampRadius(nextRadius))
  }

  return (
    <div className="app-shell relative w-full overflow-hidden bg-snow font-body">
      <CommunityMap
        members={filteredMembers}
        center={mapCenter}
        nearbyCenter={nearbyCenter}
        nearbyRadiusKm={nearbyCenter ? radiusKm : 0}
        isHeatmapEnabled={isHeatmapEnabled}
        isMobile={isMobile}
        highlightedMemberIds={highlightedMemberIds}
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
          isHeatmapEnabled={isHeatmapEnabled}
          isCollapsed={isNearbyCollapsed}
          onToggleCollapsed={() => setIsNearbyCollapsed((previous) => !previous)}
          onAutoCenterChange={setAutoCenterMap}
          onHeatmapToggle={setIsHeatmapEnabled}
          onFindNearby={handleFindNearby}
          onRadiusChange={handleRadiusChange}
          onClear={() => setNearbyCenter(null)}
        />

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
        disabled={canOnlyViewSubmission}
        className={`fixed bottom-20 right-4 z-[700] inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold shadow-soft transition ${
          canOnlyViewSubmission
            ? 'cursor-not-allowed bg-slate-300 text-slate-700'
            : 'bg-saffron text-slate-900 hover:bg-[#e8924f]'
        }`}
      >
        <MapPinPlus size={16} />
        {hasOwnership ? 'Manage My Pin' : hasSubmitted ? 'Already Added' : 'Add Me to the Map'}
      </button>

      <AddMemberSheet
        isOpen={isAddSheetOpen}
        isSaving={isSubmitting}
        hasSubmitted={hasSubmitted}
        lastSubmittedAt={submittedAt}
        canManagePin={hasOwnership}
        ownedMember={ownedMember}
        onClose={() => setIsAddSheetOpen(false)}
        onCreate={handleCreateMember}
        onUpdate={handleUpdateMember}
        onDelete={handleDeleteMember}
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
