import { Leaf, MapPinOff } from 'lucide-react'

const EmptyState = ({ nearbyActive }) => (
  <div className="pointer-events-none absolute inset-x-0 bottom-32 z-[550] flex justify-center px-4">
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/95 p-4 text-center shadow-soft backdrop-blur">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-saffron/20 text-pine">
        {nearbyActive ? <MapPinOff size={20} /> : <Leaf size={20} />}
      </div>
      <p className="font-heading text-xl font-semibold text-slate-900">
        {nearbyActive ? 'No one in this radius yet' : 'Community map starts with you'}
      </p>
      <p className="mt-1 text-sm text-slate-600">
        {nearbyActive
          ? 'Try a wider radius to discover more nearby Kashmiris.'
          : 'Tap "Add Me to the Map" and help others find the community safely.'}
      </p>
    </div>
  </div>
)

export default EmptyState
