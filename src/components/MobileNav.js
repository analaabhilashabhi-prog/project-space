"use client"

import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function MobileNav() {
  var pathname = usePathname()
  var router = useRouter()
  var [unreadCount, setUnreadCount] = useState(0)
  var [teamNumber, setTeamNumber] = useState("")

  useEffect(function () {
    var tn = sessionStorage.getItem("ps_team_number")
    if (!tn) {
      var roll = sessionStorage.getItem("ps_roll")
      if (roll) {
        supabase
          .from("team_members")
          .select("teams(team_number)")
          .eq("member_roll_number", roll)
          .single()
          .then(function (res) {
            if (res.data && res.data.teams) {
              setTeamNumber(res.data.teams.team_number)
              sessionStorage.setItem("ps_team_number", res.data.teams.team_number)
            }
          })
      }
    } else {
      setTeamNumber(tn)
    }

    function fetchUnread() {
      var lastSeen = localStorage.getItem("ps_last_seen_announcement")
      var lastSeenTime = lastSeen || "2000-01-01T00:00:00"
      supabase
        .from("announcements")
        .select("id", { count: "exact", head: true })
        .gt("created_at", lastSeenTime)
        .then(function (res) {
          if (res.count !== null) setUnreadCount(res.count)
        })
    }
    fetchUnread()
    var interval = setInterval(fetchUnread, 15000)
    return function () { clearInterval(interval) }
  }, [])

  // Don't show on login, register, admin, success pages
  if (pathname === "/" || pathname === "/register" || pathname.startsWith("/admin") || pathname.startsWith("/success")) {
    return null
  }

  var loggedIn = typeof window !== "undefined" && sessionStorage.getItem("ps_logged_in")
  if (!loggedIn) return null

  function isActive(path) {
    if (path === "/team-info" && pathname.startsWith("/team-info")) return true
    if (path === "/food-selection" && pathname.startsWith("/food-selection")) return true
    if (path === "/announcements" && pathname === "/announcements") return true
    return false
  }

  var navItems = [
    {
      label: "Team",
      path: "/team-info",
      icon: function (active) {
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#10b981" : "#6b7280"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        )
      },
    },
    {
      label: "Food",
      path: "/food-selection",
      icon: function (active) {
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#10b981" : "#6b7280"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
            <line x1="6" y1="1" x2="6" y2="4"></line>
            <line x1="10" y1="1" x2="10" y2="4"></line>
            <line x1="14" y1="1" x2="14" y2="4"></line>
          </svg>
        )
      },
    },
    {
      label: "Updates",
      path: "/announcements",
      badge: unreadCount,
      icon: function (active) {
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#10b981" : "#6b7280"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
        )
      },
    },
  ]

  function handleNav(path) {
    if (path === "/team-info" && teamNumber) {
      router.push("/team-info/" + teamNumber)
    } else if (path === "/food-selection" && teamNumber) {
      router.push("/food-selection/" + teamNumber)
    } else {
      router.push(path)
    }
  }

  return (
    <div className="mobile-nav md:hidden">
      <div className="glass-strong">
        <div className="flex items-center justify-around py-2 px-4">
          {navItems.map(function (item) {
            var active = isActive(item.path)
            return (
              <button
                key={item.label}
                onClick={function () { handleNav(item.path) }}
                className="flex flex-col items-center gap-1 py-1 px-4 relative btn-press"
              >
                <div className="relative">
                  {item.icon(active)}
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  )}
                </div>
                <span className={active ? "text-[10px] font-medium text-emerald-400" : "text-[10px] text-gray-500"}>
                  {item.label}
                </span>
                {active && (
                  <div className="absolute -bottom-1 w-6 h-0.5 bg-emerald-400 rounded-full"></div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}