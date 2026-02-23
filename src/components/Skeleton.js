"use client"

export function SkeletonCard() {
  return (
    <div className="p-6 rounded-2xl glass">
      <div className="skeleton h-4 w-1/3 mb-4"></div>
      <div className="skeleton h-8 w-2/3 mb-3"></div>
      <div className="skeleton h-4 w-full mb-2"></div>
      <div className="skeleton h-4 w-4/5"></div>
    </div>
  )
}

export function SkeletonTeamInfo() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-8 page-transition">
      {/* Welcome banner skeleton */}
      <div className="p-6 rounded-2xl glass mb-8">
        <div className="skeleton h-8 w-1/2 mb-3"></div>
        <div className="skeleton h-4 w-1/3"></div>
      </div>

      {/* Team number skeleton */}
      <div className="p-8 rounded-2xl glass mb-6 text-center">
        <div className="skeleton h-4 w-1/4 mx-auto mb-4"></div>
        <div className="skeleton h-14 w-1/3 mx-auto mb-4"></div>
        <div className="flex justify-center gap-3">
          <div className="skeleton h-10 w-28"></div>
          <div className="skeleton h-10 w-28"></div>
          <div className="skeleton h-10 w-28"></div>
        </div>
      </div>

      {/* Project skeleton */}
      <div className="p-6 rounded-2xl glass mb-6">
        <div className="skeleton h-6 w-1/3 mb-4"></div>
        <div className="skeleton h-4 w-1/4 mb-2"></div>
        <div className="skeleton h-6 w-2/3 mb-4"></div>
        <div className="flex gap-2">
          <div className="skeleton h-8 w-20 rounded-full"></div>
          <div className="skeleton h-8 w-24 rounded-full"></div>
          <div className="skeleton h-8 w-20 rounded-full"></div>
        </div>
      </div>

      {/* Members skeleton */}
      <div className="p-6 rounded-2xl glass mb-6">
        <div className="skeleton h-6 w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map(function (i) {
            return (
              <div key={i} className="flex items-center gap-3 p-4 rounded-xl glass">
                <div className="skeleton h-10 w-10 rounded-full"></div>
                <div className="flex-1">
                  <div className="skeleton h-4 w-1/3 mb-2"></div>
                  <div className="skeleton h-3 w-1/2"></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function SkeletonAnnouncements() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(function (i) {
        return (
          <div key={i} className="p-6 rounded-2xl glass">
            <div className="flex items-center justify-between mb-3">
              <div className="skeleton h-6 w-16 rounded-full"></div>
              <div className="skeleton h-4 w-24"></div>
            </div>
            <div className="skeleton h-6 w-1/2 mb-2"></div>
            <div className="skeleton h-4 w-full mb-1"></div>
            <div className="skeleton h-4 w-3/4"></div>
            <div className="skeleton h-48 w-full mt-4 rounded-xl"></div>
          </div>
        )
      })}
    </div>
  )
}

export function SkeletonLogin() {
  return (
    <div className="w-full max-w-md px-6">
      <div className="text-center mb-10">
        <div className="skeleton h-16 w-16 rounded-2xl mx-auto mb-6"></div>
        <div className="skeleton h-10 w-2/3 mx-auto mb-3"></div>
        <div className="skeleton h-4 w-1/3 mx-auto"></div>
      </div>
      <div className="p-8 rounded-2xl glass">
        <div className="skeleton h-6 w-1/3 mb-2"></div>
        <div className="skeleton h-4 w-2/3 mb-6"></div>
        <div className="skeleton h-12 w-full mb-4 rounded-xl"></div>
        <div className="skeleton h-12 w-full rounded-xl"></div>
      </div>
    </div>
  )
}

export function SkeletonFoodSelection() {
  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <div className="skeleton h-8 w-1/3 mb-2"></div>
      <div className="skeleton h-4 w-1/2 mb-8"></div>
      <div className="flex gap-2 mb-8">
        {[1, 2, 3, 4, 5, 6, 7].map(function (i) {
          return <div key={i} className="skeleton h-10 w-28 rounded-xl"></div>
        })}
      </div>
      <div className="skeleton h-6 w-1/4 mb-4"></div>
      <div className="rounded-xl glass p-4">
        {[1, 2, 3, 4, 5, 6].map(function (i) {
          return (
            <div key={i} className="flex items-center gap-4 py-4 border-b border-white/5">
              <div className="skeleton h-10 w-28"></div>
              <div className="flex gap-2 flex-1">
                <div className="skeleton h-8 w-20 rounded-lg"></div>
                <div className="skeleton h-8 w-24 rounded-lg"></div>
                <div className="skeleton h-8 w-20 rounded-lg"></div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}