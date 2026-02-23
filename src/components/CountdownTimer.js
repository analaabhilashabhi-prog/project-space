"use client"

import { useState, useEffect } from "react"

export default function CountdownTimer() {
  var eventDate = new Date("2026-05-06T09:00:00").getTime()
  var eventEndDate = new Date("2026-05-12T23:59:59").getTime()
  var [timeLeft, setTimeLeft] = useState(null)
  var [status, setStatus] = useState("loading")

  useEffect(function () {
    function updateTimer() {
      var now = new Date().getTime()

      if (now >= eventDate && now <= eventEndDate) {
        setStatus("live")
        setTimeLeft(null)
      } else if (now > eventEndDate) {
        setStatus("ended")
        setTimeLeft(null)
      } else {
        setStatus("upcoming")
        var diff = eventDate - now
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        })
      }
    }

    updateTimer()
    var interval = setInterval(updateTimer, 1000)
    return function () { clearInterval(interval) }
  }, [])

  if (status === "loading") return null

  if (status === "live") {
    return (
      <div className="w-full py-2 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border-b border-emerald-500/20">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          <span className="text-sm font-bold text-emerald-400">EVENT IS LIVE!</span>
          <span className="text-xs text-gray-400">May 6-12, 2026</span>
        </div>
      </div>
    )
  }

  if (status === "ended") {
    return (
      <div className="w-full py-2 bg-white/5 border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-center">
          <span className="text-sm text-gray-400">Event has ended. Thank you for participating!</span>
        </div>
      </div>
    )
  }

  if (!timeLeft) return null

  return (
    <div className="w-full py-2.5 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-b border-white/5">
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-center gap-4">
        <span className="text-xs text-gray-400 hidden sm:inline">Event starts in</span>
        <div className="flex items-center gap-3">
          <div className="text-center">
            <span className="text-lg font-bold text-emerald-400">{timeLeft.days}</span>
            <span className="text-[10px] text-gray-500 block">DAYS</span>
          </div>
          <span className="text-emerald-500/50 font-bold">:</span>
          <div className="text-center">
            <span className="text-lg font-bold text-emerald-400">{String(timeLeft.hours).padStart(2, "0")}</span>
            <span className="text-[10px] text-gray-500 block">HRS</span>
          </div>
          <span className="text-emerald-500/50 font-bold">:</span>
          <div className="text-center">
            <span className="text-lg font-bold text-cyan-400">{String(timeLeft.minutes).padStart(2, "0")}</span>
            <span className="text-[10px] text-gray-500 block">MIN</span>
          </div>
          <span className="text-emerald-500/50 font-bold">:</span>
          <div className="text-center">
            <span className="text-lg font-bold text-cyan-400">{String(timeLeft.seconds).padStart(2, "0")}</span>
            <span className="text-[10px] text-gray-500 block">SEC</span>
          </div>
        </div>
      </div>
    </div>
  )
}