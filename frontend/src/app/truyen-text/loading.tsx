export default function Loading() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8 animate-pulse">
      <div className="h-8 w-48 bg-white/[0.06] rounded-lg mb-4" />
      <div className="h-4 w-72 bg-white/[0.04] rounded mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 bg-white/[0.03] rounded-xl p-4">
              <div className="w-20 h-20 bg-white/[0.06] rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-white/[0.06] rounded" />
                <div className="h-3 w-1/2 bg-white/[0.04] rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-1 space-y-4">
          <div className="h-6 w-32 bg-white/[0.06] rounded" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-white/[0.04] rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
