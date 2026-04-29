export default function TiendasLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero skeleton */}
      <div className="bg-green-900 px-4 py-12">
        <div className="container mx-auto max-w-5xl text-center space-y-3">
          <div className="h-8 w-32 bg-green-800 rounded-xl mx-auto animate-pulse" />
          <div className="h-4 w-72 bg-green-800 rounded-lg mx-auto animate-pulse" />
        </div>
      </div>

      {/* Search bar skeleton */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto max-w-5xl px-4 py-3">
          <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
        </div>
        <div className="container mx-auto max-w-5xl px-4 pb-3 flex gap-2">
          {[60, 80, 70, 90, 65].map((w, i) => (
            <div key={i} style={{ width: w }} className="h-8 bg-gray-100 rounded-full animate-pulse flex-shrink-0" />
          ))}
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-100" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
