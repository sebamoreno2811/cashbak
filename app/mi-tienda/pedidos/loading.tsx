export default function PedidosLoading() {
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
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
        </div>

        <div className="p-4 md:p-8 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-100 rounded w-40" />
                  <div className="h-3 bg-gray-100 rounded w-56" />
                  <div className="h-3 bg-gray-100 rounded w-32" />
                </div>
                <div className="h-6 w-20 bg-gray-100 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
