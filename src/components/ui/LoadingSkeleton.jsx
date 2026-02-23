const LoadingSkeleton = () => (
  <div className="pointer-events-none mt-3 space-y-2 rounded-2xl border border-white/60 bg-white/85 p-3 backdrop-blur">
    <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200" />
    <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
    <div className="h-10 animate-pulse rounded-xl bg-slate-200" />
  </div>
)

export default LoadingSkeleton
