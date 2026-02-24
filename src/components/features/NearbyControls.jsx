import {
  ChevronUp,
  Flame,
  Loader2,
  LocateFixed,
  LocateOff,
  MapPin,
  Navigation,
  SlidersHorizontal,
} from 'lucide-react'
import { MAX_RADIUS_KM, MIN_RADIUS_KM } from '../../constants'

const NearbyControls = ({
  nearbyCenter,
  radiusKm,
  isFinding,
  autoCenter,
  isHeatmapEnabled,
  isCollapsed,
  onToggleCollapsed,
  onAutoCenterChange,
  onHeatmapToggle,
  onFindNearby,
  onRadiusChange,
  onClear,
}) => {
  if (isCollapsed) {
    return (
      <section className="pointer-events-auto mt-3 flex justify-end">
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label="Expand nearby filters"
          className="relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-pine text-white shadow-soft transition hover:bg-pine/90"
        >
          <SlidersHorizontal size={18} />
          {nearbyCenter ? (
            <span className="absolute -right-1 -top-1 rounded-full bg-saffron px-1.5 py-0.5 text-[10px] font-bold text-slate-900">
              {radiusKm}
            </span>
          ) : null}
          {isHeatmapEnabled ? (
            <span className="absolute -bottom-1 -left-1 rounded-full bg-slate-900 px-1.5 py-0.5 text-[9px] font-semibold text-white">
              Heat
            </span>
          ) : null}
        </button>
      </section>
    )
  }

  return (
    <section className="pointer-events-auto mt-3 rounded-2xl border border-white/70 bg-white/90 p-3 shadow-soft backdrop-blur">
      <div className="flex items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1 font-semibold text-slate-800">
          <MapPin size={14} className="text-pine" />
          Find People Near Me
        </p>
        <div className="flex items-center gap-2">
          {nearbyCenter ? (
            <button
              type="button"
              onClick={onClear}
              className="text-xs font-semibold text-slate-600 underline-offset-2 hover:underline"
            >
              Clear
            </button>
          ) : null}
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
            aria-label="Collapse nearby filters"
          >
            <ChevronUp size={15} />
          </button>
        </div>
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

      <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
        <span className="text-xs font-medium text-slate-700">Heatmap</span>
        <button
          type="button"
          onClick={() => onHeatmapToggle(!isHeatmapEnabled)}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
            isHeatmapEnabled ? 'bg-saffron/30 text-slate-900' : 'bg-slate-200 text-slate-700'
          }`}
        >
          <Flame size={12} className={isHeatmapEnabled ? '' : 'opacity-45'} />
          {isHeatmapEnabled ? 'On' : 'Off'}
        </button>
      </div>

      <div className="mt-3">
        <div className="rounded-xl bg-slate-50 px-3 py-2.5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs text-slate-600">Radius filter</p>
            <p className="text-xs font-semibold text-slate-800">{radiusKm} km</p>
          </div>
          <input
            type="range"
            min={MIN_RADIUS_KM}
            max={MAX_RADIUS_KM}
            step={1}
            value={radiusKm}
            onChange={(event) => onRadiusChange(Number(event.target.value))}
            aria-label="Nearby radius in kilometers"
            className="h-2 w-full cursor-pointer accent-pine"
          />
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>{MIN_RADIUS_KM} km</span>
            <span>{MAX_RADIUS_KM} km</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default NearbyControls
