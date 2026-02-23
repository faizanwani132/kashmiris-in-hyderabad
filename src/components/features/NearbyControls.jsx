import { Loader2, LocateFixed, LocateOff, Navigation } from 'lucide-react'
import { RADIUS_OPTIONS } from '../../constants'

const NearbyControls = ({
  nearbyCenter,
  radiusKm,
  isFinding,
  autoCenter,
  onAutoCenterChange,
  onFindNearby,
  onRadiusChange,
  onClear,
}) => (
  <section className="pointer-events-auto mt-3 rounded-2xl border border-white/70 bg-white/90 p-3 shadow-soft backdrop-blur">
    <div className="flex items-center justify-between gap-2">
      <p className="font-semibold text-slate-800">
        <span className="mr-1">📍</span>
        Find People Near Me
      </p>
      {nearbyCenter ? (
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-semibold text-slate-600 underline-offset-2 hover:underline"
        >
          Clear
        </button>
      ) : null}
    </div>

    <div className="mt-2 flex gap-2">
      <button
        type="button"
        onClick={onFindNearby}
        disabled={isFinding}
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-pine px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-pine/90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isFinding ? <Loader2 size={15} className="animate-spin" /> : <Navigation size={15} />}
        {nearbyCenter ? 'Refresh My Location' : 'Use My Location'}
      </button>
    </div>

    <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
      <span className="text-xs font-medium text-slate-700">Auto-center map</span>
      <button
        type="button"
        onClick={() => onAutoCenterChange(!autoCenter)}
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
          autoCenter ? 'bg-pine/15 text-pine' : 'bg-slate-200 text-slate-700'
        }`}
      >
        {autoCenter ? <LocateFixed size={12} /> : <LocateOff size={12} />}
        {autoCenter ? 'On' : 'Off'}
      </button>
    </div>

    <div className="mt-3">
      <p className="mb-1 text-xs text-slate-600">Radius filter</p>
      <div className="grid grid-cols-4 gap-2">
        {RADIUS_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onRadiusChange(option)}
            className={`rounded-xl px-2 py-2 text-sm font-semibold transition ${
              option === radiusKm
                ? 'bg-saffron text-slate-900'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {option} km
          </button>
        ))}
      </div>
    </div>
  </section>
)

export default NearbyControls
