"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import CountdownTimer from "@/components/CountdownTimer"
import { EVENT_CONFIG } from "@/config/formFields"

export default function AnnouncementsPage() {
  var [announcements, setAnnouncements] = useState([])
  var [loading, setLoading] = useState(true)
  var router = useRouter()

  useEffect(function () {
    // Mark all as seen
    localStorage.setItem("ps_last_seen_announcement", new Date().toISOString())

    fetch("/api/announcements")
      .then(function (res) { return res.json() })
      .then(function (data) {
        if (data.announcements) {
          setAnnouncements(data.announcements)
        }
        setLoading(false)
      })
      .catch(function () {
        setLoading(false)
      })
  }, [])

  function getTypeStyle(type) {
    if (type === "alert") return "bg-red-500/20 text-red-400 border-red-500/30"
    if (type === "timing") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    if (type === "update") return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
  }

  function getTypeIcon(type) {
    if (type === "alert") return "🚨"
    if (type === "timing") return "⏰"
    if (type === "update") return "📢"
    return "ℹ️"
  }

  function formatDate(dateStr) {
    var d = new Date(dateStr + "Z")
    return d.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    })
  }
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <CountdownTimer />

      <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[120px]"></div>

      {/* Header */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center font-bold text-black text-lg">PS</div>
          <span className="text-xl font-semibold">{EVENT_CONFIG.eventName}</span>
        </div>
        <button
          onClick={function () { router.back() }}
          className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1 border border-white/10 rounded-lg"
        >
          ← Back
        </button>
      </nav>

      <main className="relative z-10 max-w-3xl mx-auto px-8 py-4 pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">📢 Announcements</h1>
          <p className="text-gray-400">Stay updated with the latest news and updates from the organizers.</p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-4xl mb-4 block">📭</span>
            <h2 className="text-xl font-semibold mb-2">No Announcements Yet</h2>
            <p className="text-gray-500">Check back later for updates from the organizers.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map(function (a) {
              return (
                <div key={a.id} className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                  {/* Type badge and date */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={"px-3 py-1 rounded-full text-xs font-medium border " + getTypeStyle(a.type)}>
                      {getTypeIcon(a.type)} {a.type ? a.type.charAt(0).toUpperCase() + a.type.slice(1) : "Info"}
                    </span>
                    <span className="text-xs text-gray-500">{formatDate(a.created_at)}</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold mb-2">{a.title}</h3>

                  {/* Message */}
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{a.message}</p>

                  {/* Image */}
                  {a.image_url && (
                    <div className="mt-4 rounded-xl overflow-hidden border border-white/10">
                      <img
                        src={a.image_url}
                        alt={a.title}
                        className="w-full object-contain"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}