export default function MiTiendaLoading() {
  return (
    <div className="flex bg-gray-50 min-h-[calc(100vh-64px)]">
      {/* Sidebar skeleton */}
      <aside className="hidden md:flex flex-col w-56 bg-green-900 shrink-0 border-r border-green-800">
        <div className="px-4 py-5 border-b border-green-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-800 animate-pulse shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 bg-green-800 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-green-800 rounded animate-pulse w-1/2" />
            </div>
          </div>
        </div>
        <div className="p-3 space-y-1.5 pt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-green-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </aside>

      {/* Content skeleton */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar skeleton */}
        <div className="md:hidden bg-green-900 px-4 pt-4 pb-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-green-800 animate-pulse" />
            <div className="h-4 w-32 bg-green-800 rounded animate-pulse" />
          </div>
          <div className="flex gap-1.5">
            {[80, 70, 80, 110].map((w, i) => (
              <div key={i} style={{ width: w }} className="h-8 bg-green-800 rounded-full animate-pulse flex-shrink-0" />
            ))}
          </div>
        </div>

        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-5 w-36 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-48 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="h-9 w-36 bg-gray-200 rounded-lg animate-pulse" />
        </div>

        {/* Product cards */}
        <div className="p-4 md:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3 animate-pulse">
                <div className="w-16 h-16 rounded-lg bg-gray-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
