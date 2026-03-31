export default function Loading() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8 animate-pulse">
      <div className="h-8 w-48 bg-white/[0.06] rounded-lg mb-4" />
      <div className="h-4 w-72 bg-white/[0.04] rounded mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white/[0.03] rounded-2xl overflow-hidden">
            <div className="aspect-video bg-white/[0.06]" />
            <div className="p-4 space-y-2">
              <div className="h-4 w-3/4 bg-white/[0.06] rounded" />
              <div className="h-3 w-1/2 bg-white/[0.04] rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
