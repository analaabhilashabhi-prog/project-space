"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function NotificationBell() {
  var [unreadCount, setUnreadCount] = useState(0)
  var router = useRouter()

  useEffect(function () {
    function fetchCount() {
      var lastSeen = localStorage.getItem("ps_last_seen_announcement")
      var lastSeenTime = lastSeen || "2000-01-01T00:00:00"

      supabase
        .from("announcements")
        .select("id", { count: "exact", head: true })
        .gt("created_at", lastSeenTime)
        .then(function (res) {
          if (res.count !== null && res.count !== undefined) {
            setUnreadCount(res.count)
          }
        })
    }

    fetchCount()
    var interval = setInterval(fetchCount, 15000)
    return function () { clearInterval(interval) }
  }, [])

  function handleClick() {
    localStorage.setItem("ps_last_seen_announcement", new Date().toISOString())
    setUnreadCount(0)
    router.push("/announcements")
  }

  return (
    <button
      onClick={handleClick}
      className="relative p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-gray-300"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  )
}