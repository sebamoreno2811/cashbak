export default function AplicarLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero skeleton */}
      <div className="bg-green-900 py-14 px-4 text-center space-y-3">
        <div className="h-9 w-64 bg-green-800 rounded-xl mx-auto animate-pulse" />
        <div className="h-4 w-80 bg-green-800 rounded-lg mx-auto animate-pulse" />
        <div className="h-10 w-44 bg-green-800 rounded-lg mx-auto animate-pulse mt-2" />
      </div>

      {/* Form skeleton */}
      <div className="container mx-auto px-4 py-12 max-w-lg space-y-6">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 animate-pulse">
          <div className="h-5 w-24 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-100 rounded-lg" />
          <div className="flex flex-wrap gap-2">
            {[70, 90, 80, 100, 75, 85].map((w, i) => (
              <div key={i} style={{ width: w }} className="h-8 bg-gray-100 rounded-full" />
            ))}
          </div>
          <div className="h-10 bg-gray-100 rounded-lg" />
          <div className="h-24 bg-gray-100 rounded-lg" />
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 animate-pulse">
          <div className="h-5 w-20 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-100 rounded-lg" />
          <div className="h-10 bg-gray-100 rounded-lg" />
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 animate-pulse">
          <div className="h-5 w-40 bg-gray-200 rounded" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-20 bg-gray-100 rounded-lg" />
            <div className="h-20 bg-gray-100 rounded-lg" />
          </div>
        </div>

        <div className="h-12 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    </div>
  )
}
