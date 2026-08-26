export function SkeletonCard() {
  return (
    <div className="glass-card p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-white/5" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3 bg-white/5 rounded w-20" />
          <div className="h-5 bg-white/5 rounded w-12" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="glass-card p-4 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-white/5" />
            <div className="flex-1 grid grid-cols-12 gap-4">
              <div className="col-span-2"><div className="h-3 bg-white/5 rounded w-16" /></div>
              <div className="col-span-4"><div className="h-3 bg-white/5 rounded w-40" /></div>
              <div className="col-span-2"><div className="h-5 bg-white/5 rounded-full w-12" /></div>
              <div className="col-span-2"><div className="h-5 bg-white/5 rounded-full w-16" /></div>
              <div className="col-span-2"><div className="h-3 bg-white/5 rounded w-12" /></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonChart() {
  return (
    <div className="glass-card p-6 animate-pulse">
      <div className="h-4 bg-white/5 rounded w-32 mb-4" />
      <div className="h-48 flex items-end gap-3 px-4">
        {[60, 40, 80, 30, 70, 50, 90].map((h, i) => (
          <div key={i} className="flex-1 bg-white/5 rounded-t" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  )
}
