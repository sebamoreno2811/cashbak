export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-5xl px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image skeleton */}
          <div className="space-y-3">
            <div className="aspect-square rounded-2xl bg-gray-200 animate-pulse" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-16 h-16 rounded-xl bg-gray-200 animate-pulse" />
              ))}
            </div>
          </div>

          {/* Info skeleton */}
          <div className="space-y-4">
            <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-7 w-3/4 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-28 bg-gray-200 rounded-lg animate-pulse" />

            <div className="space-y-2 pt-2">
              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="flex gap-2">
                {["S","M","L","XL"].map(s => (
                  <div key={s} className="w-14 h-11 bg-gray-200 rounded-xl animate-pulse" />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-11 w-32 bg-gray-200 rounded-xl animate-pulse" />
            </div>

            <div className="h-12 w-full bg-gray-200 rounded-xl animate-pulse mt-4" />
            <div className="h-12 w-full bg-gray-200 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Description skeleton */}
        <div className="mt-10 space-y-2">
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-4/6 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}
