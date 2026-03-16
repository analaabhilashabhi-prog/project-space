"use client"

import { useRouter, usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"

var supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

var NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: function (tn) { return "/team-info/" + tn },
    icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  },
  {
    id: "project-status",
    label: "Project Status",
    href: function (tn) { return "/project-status/" + tn },
    icon: "M18 20V10M12 20V4M6 20v-6",
  },
  {
    id: "notifications",
    label: "Notifications",
    href: function (tn) { return "/notifications/" + tn },
    icon: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  },
  {
    id: "food",
    label: "Food Selection",
    href: function (tn) { return "/food-selection/" + tn },
    icon: "M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3",
  },
  {
    id: "mentor",
    label: "Mentor Request",
    href: function (tn) { return "/mentor-request/" + tn },
    icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  },
  {
    id: "snack",
    label: "Snack & Beverage",
    href: function (tn) { return "/food-selection/" + tn },
    icon: "M8 3h8l1 9H7L8 3zM6 12h12l-1.5 6a2 2 0 0 1-2 1.5H9.5a2 2 0 0 1-2-1.5L6 12z",
  },
  {
    id: "event-schedule",
    label: "Event Schedule",
    href: function (tn) { return "/event-schedule" },
    icon: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  },
  {
    id: "explore",
    label: "Explore Teams",
    href: function (tn) { return "/explore-teams" },
    icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  },
]

export default function DashboardSidebar({ teamNumber, currentMember, loggedInRoll, isLeader }) {
  var router = useRouter()
  var pathname = usePathname()
  var [credits, setCredits] = useState(null)

  // Load credits for this team
  useEffect(function () {
    if (!teamNumber) return
    supabaseClient
      .from("team_credits")
      .select("credits")
      .eq("team_number", teamNumber)
      .single()
      .then(function (res) {
        if (res.data) setCredits(res.data.credits)
      })

    // Realtime update
    var channel = supabaseClient
      .channel("sidebar-credits-" + teamNumber)
      .on("postgres_changes", { event: "*", schema: "public", table: "team_credits", filter: "team_number=eq." + teamNumber }, function (payload) {
        if (payload.new && payload.new.credits !== undefined) setCredits(payload.new.credits)
      })
      .subscribe()
    return function () { supabaseClient.removeChannel(channel) }
  }, [teamNumber])

  function handleNav(href) {
    router.push(href)
  }

  function isActive(item) {
    var href = typeof item.href === "function" ? item.href(teamNumber) : item.href
    if (pathname === href) return true
    if (item.id === "dashboard" && pathname && pathname.startsWith("/team-info/")) return true
    if (item.id === "project-status" && pathname && pathname.startsWith("/project-status/")) return true
    if (item.id === "food" && pathname && pathname.startsWith("/food-selection/")) return true
    if (item.id === "mentor" && pathname && pathname.startsWith("/mentor-request/")) return true
    if (item.id === "snack" && pathname && pathname.startsWith("/food-selection/")) return true
    if (item.id === "explore" && pathname && pathname.startsWith("/explore-teams")) return true
    if (item.id === "event-schedule" && pathname && pathname.startsWith("/event-schedule")) return true
    if (item.id === "notifications" && pathname && pathname.startsWith("/notifications/")) return true
    return false
  }

  var userInitial = currentMember ? currentMember.member_name.charAt(0).toUpperCase() : (loggedInRoll ? loggedInRoll.charAt(0) : "?")

  return (
    <div style={{
      width: 64, minHeight: "100vh",
      background: "rgba(5,2,1,0.97)",
      borderRight: "1px solid rgba(255,255,255,0.05)",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "16px 0 20px", gap: 3, flexShrink: 0,
      position: "sticky", top: 0, zIndex: 50,
      backdropFilter: "blur(20px)",
    }}>
      <style>{`
        .sb-btn{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.22s cubic-bezier(0.23,1,0.32,1);border:none;background:transparent;position:relative;outline:none;}
        .sb-btn:hover{background:rgba(255,255,255,0.06);}
        .sb-btn.on{background:rgba(255,60,30,0.12);border:1px solid rgba(255,60,30,0.22);}
        .sb-btn.on svg{stroke:#ff6040;}
        .sb-btn:hover:not(.on) svg{stroke:rgba(255,255,255,0.65);}
        .sb-btn svg{stroke:rgba(255,255,255,0.28);transition:stroke 0.22s;}
        .sb-tip{position:absolute;left:calc(100% + 10px);top:50%;transform:translateY(-50%);background:rgba(10,5,3,0.96);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:5px 10px;white-space:nowrap;font-size:11px;font-weight:600;color:rgba(255,255,255,0.7);pointer-events:none;opacity:0;transition:opacity 0.18s;z-index:999;font-family:var(--font-primary,'Open Sans',sans-serif);letter-spacing:0.4px;}
        .sb-btn:hover .sb-tip{opacity:1;}
        .sb-dot{position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:20px;border-radius:0 3px 3px 0;background:linear-gradient(180deg,#ff3020,#ff6040);}
      `}</style>

      {/* PS Logo */}
      <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#ff3020,#ff6040)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-primary,'Open Sans',sans-serif)", fontWeight: 900, fontSize: 13, color: "#fff", marginBottom: 6, cursor: "pointer", flexShrink: 0 }}
        onClick={function () { router.push("/") }}>
        PS
      </div>

      {/* Credits chip — always visible */}
      <div style={{ width: 44, background: "rgba(255,96,64,0.07)", border: "1px solid rgba(255,96,64,0.18)", borderRadius: 20, padding: "4px 0", display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 4, cursor: "pointer", transition: "all 0.2s" }}
        onClick={function () { router.push("/project-status/" + teamNumber) }}
        title="View Project Status & Credits">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ff6040" strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        <span style={{ fontSize: 11, fontWeight: 800, color: "#ff6040", lineHeight: 1.2 }}>
          {credits !== null ? credits : "—"}
        </span>
      </div>

      <div style={{ width: 28, height: 1, background: "rgba(255,255,255,0.05)", marginBottom: 3 }} />

      {/* Nav buttons */}
      {NAV_ITEMS.map(function (item) {
        var href = typeof item.href === "function" ? item.href(teamNumber) : item.href
        var active = isActive(item)
        // Parse multi-path SVG icons
        var iconPaths = item.icon.split("M").filter(Boolean).map(function (d) { return "M" + d })
        return (
          <button key={item.id} className={"sb-btn" + (active ? " on" : "")} onClick={function () { handleNav(href) }}>
            {active && <div className="sb-dot" />}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              {iconPaths.map(function (d, j) { return <path key={j} d={d} /> })}
            </svg>
            <div className="sb-tip">{item.label}</div>
          </button>
        )
      })}

      <div style={{ flex: 1 }} />
      <div style={{ width: 28, height: 1, background: "rgba(255,255,255,0.05)", marginBottom: 4 }} />

      {/* User avatar */}
      <div
        style={{ width: 36, height: 36, borderRadius: 10, background: "#0a0a0a", border: "1.5px solid rgba(255,96,64,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-primary,'Open Sans',sans-serif)", fontWeight: 700, fontSize: 14, color: "#ff6040", cursor: "pointer", transition: "all 0.22s", flexShrink: 0 }}
        onClick={function () { router.push("/team-info/" + teamNumber) }}
        title={loggedInRoll || "Profile"}
      >
        {userInitial}
      </div>
    </div>
  )
}