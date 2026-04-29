export default function TiendaLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Store header skeleton */}
      <div className="bg-green-900">
        <div className="container mx-auto max-w-5xl px-4 py-8 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-green-800 animate-pulse shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-6 w-48 bg-green-800 rounded-lg animate-pulse" />
            <div className="h-4 w-32 bg-green-800 rounded animate-pulse" />
            <div className="h-3 w-64 bg-green-800 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Search bar skeleton */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto max-w-5xl px-4 py-3">
          <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Product grid skeleton */}
      <div className="container mx-auto max-w-5xl px-4 py-6">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-5" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-100" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-4 bg-gray-100 rounded w-1/3 mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
