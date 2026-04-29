export default function PerfilLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-xl px-4 py-8 space-y-4">
        <div className="h-7 w-28 bg-gray-200 rounded-lg animate-pulse" />
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-24 bg-gray-100 rounded" />
              <div className="h-10 bg-gray-100 rounded-lg" />
            </div>
          ))}
          <div className="h-11 bg-gray-200 rounded-xl mt-2" />
        </div>
      </div>
    </div>
  )
}
