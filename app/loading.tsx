export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Logo header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-8 pb-6">
        <div className="container mx-auto max-w-4xl flex justify-center">
          <div className="h-16 w-72 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      </div>

      {/* HowItWorks placeholder */}
      <div className="bg-white border-b border-gray-100 px-4 py-8">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 animate-pulse" />
                <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bet selector placeholder */}
      <div className="bg-green-900 px-4 py-8">
        <div className="container mx-auto max-w-2xl">
          <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
            <div className="bg-emerald-600 px-5 py-4">
              <div className="h-6 w-48 bg-emerald-500 rounded animate-pulse" />
              <div className="h-3 w-64 bg-emerald-500 rounded animate-pulse mt-2" />
            </div>
            <div className="px-5 py-5 space-y-3">
              <div className="h-5 w-40 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-56 bg-gray-100 rounded animate-pulse" />
              <div className="h-12 bg-gray-100 rounded-xl animate-pulse mt-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Carousel placeholder */}
      <div className="pt-10 pb-4">
        <div className="container mx-auto max-w-5xl px-8 mb-4 flex items-center gap-3">
          <div className="h-7 w-28 bg-gray-200 rounded-full animate-pulse" />
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <div className="flex gap-4 px-8 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-48 shrink-0 bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-100" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category pills */}
      <div className="bg-white border-y border-gray-100 px-4 py-3 mt-6">
        <div className="container mx-auto max-w-5xl flex gap-2">
          {[60, 80, 70, 90, 65, 75].map((w, i) => (
            <div key={i} style={{ width: w }} className="h-9 bg-gray-100 rounded-full animate-pulse flex-shrink-0" />
          ))}
        </div>
      </div>

      {/* Product grid */}
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-100" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
                <div className="h-4 bg-gray-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
