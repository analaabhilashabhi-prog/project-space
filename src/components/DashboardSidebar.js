"use client"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function DashboardSidebar({ teamNumber: teamNumberProp, currentMember, loggedInRoll, isLeader }) {
  var router = useRouter()
  var pathname = usePathname()
  // Read expanded state immediately (not in useEffect) to prevent flash
  var initExpanded = false
  if (typeof window !== "undefined") {
    initExpanded = sessionStorage.getItem("ps_sidebar_expanded") === "true"
  }
  var [expanded, setExpanded] = useState(initExpanded)
  var [ready, setReady] = useState(false)

  // Enable transitions only after first paint (prevents animation on page load/nav)
  useEffect(function () {
    var t = setTimeout(function () { setReady(true) }, 50)
    return function () { clearTimeout(t) }
  }, [])

  function toggleExpanded() {
    var next = !expanded
    setExpanded(next)
    sessionStorage.setItem("ps_sidebar_expanded", next ? "true" : "false")
  }

  var [teamNumber, setTeamNumber] = useState(teamNumberProp || "")

  // Resolve teamNumber from: prop → URL → storage (client-side only to avoid hydration mismatch)
  useEffect(function () {
    var resolved = teamNumberProp
    if (!resolved) {
      var parts = pathname.split("/")
      for (var i = 0; i < parts.length; i++) {
        if (["team-info", "food-selection", "food-cards", "snack-cards", "my-cards", "mentor-request", "success"].indexOf(parts[i]) !== -1 && parts[i + 1]) {
          resolved = decodeURIComponent(parts[i + 1])
          break
        }
      }
    }
    if (!resolved) {
      resolved = sessionStorage.getItem("ps_team_number") || localStorage.getItem("ps_team_number") || ""
    }
    if (resolved) {
      setTeamNumber(resolved)
      sessionStorage.setItem("ps_team_number", resolved)
      localStorage.setItem("ps_team_number", resolved)
    }
  }, [teamNumberProp, pathname])

  var [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  var [unreadCount, setUnreadCount] = useState(0)
  var [hasCart, setHasCart] = useState(false)
  var [foodDone, setFoodDone] = useState(false)
  var [hoveredId, setHoveredId] = useState(null)

  useEffect(function () {
    async function checkStatus() {
      if (!teamNumber || !loggedInRoll) return
      try {
        var foodRes = await supabase
          .from("food_selections")
          .select("day_number")
          .eq("member_roll_number", loggedInRoll)
        if (foodRes.data) {
          var days = new Set(foodRes.data.map(function (f) { return f.day_number }))
          setFoodDone(days.size >= 7)
        }
        var cartRes = await supabase
          .from("food_codes")
          .select("id")
          .eq("roll_number", loggedInRoll)
          .limit(1)
        if (cartRes.data && cartRes.data.length > 0) {
          setHasCart(true)
        }
      } catch (e) {}
    }
    checkStatus()
  }, [teamNumber, loggedInRoll])

  useEffect(function () {
    async function checkUnread() {
      try {
        var lastSeen = localStorage.getItem("ps_last_seen_announcement") || "2000-01-01"
        var { data } = await supabase
          .from("announcements")
          .select("id")
          .gt("created_at", lastSeen)
        setUnreadCount(data ? data.length : 0)
      } catch (e) {}
    }
    checkUnread()
    var interval = setInterval(checkUnread, 15000)
    return function () { clearInterval(interval) }
  }, [])

  useEffect(function () {
    function handleResize() {
      if (window.innerWidth > 768) setMobileMenuOpen(false)
    }
    window.addEventListener("resize", handleResize)
    return function () { window.removeEventListener("resize", handleResize) }
  }, [])

  function handleLogout() {
    sessionStorage.clear()
    localStorage.removeItem("ps_roll")
    localStorage.removeItem("ps_member_roll")
    router.push("/login")
  }

  var navItems = [
    { id: "profile", label: "Profile", path: "/team-info/" + teamNumber, icon: "profile" },
    { id: "announcements", label: "Announcements", path: "/announcements", icon: "announcements", badge: unreadCount },
    { id: "food", label: "Food Selection", path: "/food-selection/" + teamNumber, icon: "food" },
    { id: "explore", label: "Explore Teams", path: "/explore", icon: "explore" },
    { id: "snacks", label: "Food Cards", path: hasCart ? "/food-cards/" + teamNumber : "/food-selection/" + teamNumber, icon: "cards" },
    { id: "mentor", label: "Request Mentor", path: "/mentor-request/" + teamNumber, icon: "mentor" },
  ]

  function isNavActive(item) {
    if (item.id === "profile") return pathname === "/team-info/" + teamNumber
    return pathname.startsWith(item.path)
  }

  function navigateTo(item) {
    if (item.path.endsWith("/") || !teamNumber) return
    // Don't navigate if already on this page (prevents sidebar state reset)
    if (pathname === item.path) return
    router.push(item.path)
    setMobileMenuOpen(false)
  }

  var userName = currentMember ? currentMember.member_name : "User"
  var userInitial = currentMember ? currentMember.member_name.charAt(0).toUpperCase() : "?"
  var userPhotoUrl = currentMember && currentMember.member_college && currentMember.member_roll_number
    ? "https://info.aec.edu.in/" + currentMember.member_college + "/StudentPhotos/" + currentMember.member_roll_number.replace(/\s/g, "") + ".jpg"
    : null

  function renderIcon(iconId, size) {
    var sz = size || 20
    var s = { width: sz, height: sz, strokeWidth: 1.6, fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" }
    switch (iconId) {
      case "profile":
        return (<svg viewBox="0 0 24 24" style={s}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>)
      case "announcements":
        return (<svg viewBox="0 0 24 24" style={s}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>)
      case "food":
        return (<svg viewBox="0 0 24 24" style={s}><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>)
      case "explore":
        return (<svg viewBox="0 0 24 24" style={s}><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>)
      case "cards":
        return (<svg viewBox="0 0 24 24" style={s}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>)
      case "mentor":
        return (<svg viewBox="0 0 24 24" style={s}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>)
      case "settings":
        return (<svg viewBox="0 0 24 24" style={s}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>)
      case "logout":
        return (<svg viewBox="0 0 24 24" style={s}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>)
      default:
        return (<svg viewBox="0 0 24 24" style={s}><circle cx="12" cy="12" r="10"/></svg>)
    }
  }

  return (
    <>
      <style jsx>{`
        /* ===== SIDEBAR SHELL ===== */
        .ns {
          width: 68px; min-width: 68px; height: 100vh;
          background: linear-gradient(180deg, #0c0c0c 0%, #080808 50%, #0c0c0c 100%);
          border-right: 1px solid rgba(255,255,255,0.04);
          display: flex; flex-direction: column;
          position: relative; z-index: 50;
          overflow-y: auto; overflow-x: hidden;
        }
        /* Only animate when user toggles, not on page load */
        .ns.ready {
          transition: width 0.32s cubic-bezier(0.4,0,0.2,1), min-width 0.32s cubic-bezier(0.4,0,0.2,1);
        }
        .ns::-webkit-scrollbar { width: 0; }
        .ns.open { width: 232px; min-width: 232px; }

        /* ===== PROFILE HEADER ===== */
        .ns-head {
          display: flex; align-items: center; gap: 10px;
          padding: 16px 15px 14px; position: relative;
          cursor: pointer; user-select: none;
        }
        .ns-avatar {
          width: 36px; height: 36px; min-width: 36px;
          border-radius: 50%;
          background: #0a0a0a;
          border: 2px solid rgba(255,96,64,0.25);
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
          transition: border-color 0.3s ease, transform 0.2s ease;
        }
        .ns-head:hover .ns-avatar { border-color: rgba(255,96,64,0.5); transform: scale(1.06); }
        .ns-avatar img {
          width: 100%; height: 100%; object-fit: cover; border-radius: 50%;
        }
        .ns-avatar-placeholder {
          font-weight: 700; font-size: 14px; color: rgba(255,255,255,0.5);
          font-family: 'DM Sans', sans-serif;
        }
        .ns-brand {
          font-family: 'DM Sans', sans-serif; font-weight: 700;
          font-size: 15px; color: #fff; letter-spacing: 1px;
          white-space: nowrap;
          opacity: 0; width: 0; overflow: hidden;
        }
        .ns.ready .ns-brand { transition: opacity 0.25s ease, width 0.32s ease; }
        .ns.open .ns-brand { opacity: 1; width: auto; }

        /* ===== DIVIDER ===== */
        .ns-div { height: 1px; margin: 0 14px 6px; background: rgba(255,255,255,0.04); }

        /* ===== NAV AREA ===== */
        .ns-nav { padding: 4px 8px 0; flex: 1; }

        /* ===== NAV ITEM — no background shape ===== */
        .ns-item {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 0; justify-content: center;
          cursor: pointer;
          position: relative; margin-bottom: 2px;
          color: rgba(255,255,255,0.7);
        }
        .ns.ready .ns-item { transition: all 0.2s ease; }
        .ns.open .ns-item { padding: 10px 14px; justify-content: flex-start; }
        .ns-item:hover { color: #fff; }

        /* ===== ACTIVE STATE — orange icon + accent bar ===== */
        .ns-item.on { color: #ff6040; }
        .ns-item.on::before {
          content: ''; position: absolute; left: 0; top: 50%;
          transform: translateY(-50%);
          width: 3px; height: 20px; border-radius: 0 3px 3px 0;
          background: linear-gradient(180deg, #ff3520, #ff7a40);
          box-shadow: 0 0 8px rgba(255,55,25,0.4);
        }

        /* ===== ICON — bare, no box ===== */
        .ns-ic {
          width: 20px; height: 20px; min-width: 20px;
          display: flex; align-items: center; justify-content: center;
          position: relative;
        }
        .ns.ready .ns-ic { transition: all 0.22s ease; }

        /* ===== NOTIFICATION DOT ===== */
        .ns-dot {
          position: absolute; top: -2px; right: -4px;
          width: 7px; height: 7px; border-radius: 50%;
          background: #ff3b2e; border: 1.5px solid #0c0c0c;
          box-shadow: 0 0 5px rgba(255,59,46,0.5);
          animation: nsPulse 2s ease-in-out infinite;
        }
        @keyframes nsPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

        /* ===== TEXT LABEL ===== */
        .ns-txt {
          font-size: 13px; font-weight: 500;
          white-space: nowrap;
          opacity: 0; width: 0; overflow: hidden;
        }
        .ns.ready .ns-txt { transition: opacity 0.2s ease; }
        .ns.open .ns-txt { opacity: 1; width: auto; }
        .ns-item.on .ns-txt { color: #ff6040; font-weight: 600; }

        /* ===== BADGE ===== */
        .ns-badge {
          margin-left: auto; padding: 1px 7px; border-radius: 10px;
          background: rgba(255,50,25,0.12); color: #ff6040;
          font-size: 10px; font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          opacity: 0; position: absolute; pointer-events: none;
        }
        .ns.ready .ns-badge { transition: opacity 0.2s ease; }
        .ns.open .ns-badge { opacity: 1; position: relative; pointer-events: auto; }

        /* ===== TOOLTIP — styled, appears on hover in collapsed mode ===== */
        .ns-tip {
          position: absolute; left: calc(100% + 14px); top: 50%;
          transform: translateY(-50%) translateX(-4px);
          background: rgba(20,20,20,0.95); color: #fff; 
          font-size: 12px; font-weight: 600;
          font-family: 'DM Sans', sans-serif; letter-spacing: 0.8px;
          padding: 6px 14px; border-radius: 8px; white-space: nowrap;
          pointer-events: none; opacity: 0;
          transition: opacity 0.18s ease, transform 0.18s ease;
          box-shadow: 0 4px 20px rgba(0,0,0,0.6);
          border: 1px solid rgba(255,96,64,0.12); z-index: 100;
        }
        .ns-tip::before {
          content: ''; position: absolute; left: -5px; top: 50%;
          transform: translateY(-50%) rotate(45deg);
          width: 10px; height: 10px; background: rgba(20,20,20,0.95);
          border-left: 1px solid rgba(255,96,64,0.12);
          border-bottom: 1px solid rgba(255,96,64,0.12);
        }
        .ns-item:hover .ns-tip { opacity: 1; transform: translateY(-50%) translateX(0); }
        .ns.open .ns-tip { display: none; }

        /* ===== PROMO CARD ===== */
        .ns-promo {
          margin: 6px 10px 8px; padding: 14px 12px;
          border-radius: 13px;
          background: linear-gradient(155deg, rgba(255,50,25,0.09), rgba(255,90,50,0.03));
          border: 1px solid rgba(255,60,30,0.1);
          position: relative; overflow: hidden;
          max-height: 200px;
        }
        .ns.ready .ns-promo { transition: all 0.32s ease; }
        .ns-promo::before {
          content: ''; position: absolute; top: -15px; right: -15px;
          width: 60px; height: 60px;
          background: radial-gradient(circle, rgba(255,55,25,0.1), transparent 70%);
          pointer-events: none;
        }
        .ns:not(.open) .ns-promo {
          opacity: 0; max-height: 0; margin: 0; padding: 0;
          border: none; pointer-events: none; overflow: hidden;
        }
        .ns-promo-em { font-size: 16px; margin-bottom: 6px; }
        .ns-promo-t { font-size: 12px; font-weight: 700; color: #fff; margin-bottom: 3px; }
        .ns-promo-t span {
          background: linear-gradient(135deg, #ff3520, #ff8040);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .ns-promo-s { font-size: 10px; color: rgba(255,255,255,0.28); line-height: 1.5; margin-bottom: 10px; }
        .ns-promo-b {
          width: 100%; padding: 7px; border-radius: 8px; border: none;
          background: linear-gradient(135deg, #ff3520, #ff6040);
          color: #fff; font-size: 11px; font-weight: 600;
          font-family: 'DM Sans', sans-serif; cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 2px 10px rgba(255,50,25,0.2);
        }
        .ns-promo-b:hover { box-shadow: 0 4px 20px rgba(255,50,25,0.35); transform: translateY(-1px); }

        /* ===== BOTTOM — logout only ===== */
        .ns-bottom {
          padding: 8px 8px 14px; border-top: 1px solid rgba(255,255,255,0.04); margin-top: auto;
        }
        .ns-logout {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 0; justify-content: center;
          cursor: pointer;
          position: relative;
          color: rgba(255,255,255,0.4);
        }
        .ns.ready .ns-logout { transition: all 0.2s ease; }
        .ns.open .ns-logout { padding: 10px 14px; justify-content: flex-start; }
        .ns-logout:hover { color: #ff6040; }
        .ns-logout-ic {
          width: 20px; height: 20px; min-width: 20px;
          display: flex; align-items: center; justify-content: center;
        }
        .ns-logout-txt {
          font-size: 13px; font-weight: 500;
          white-space: nowrap;
          opacity: 0; width: 0; overflow: hidden;
        }
        .ns.ready .ns-logout-txt { transition: opacity 0.2s ease; }
        .ns.open .ns-logout-txt { opacity: 1; width: auto; }

        /* Logout tooltip */
        .ns-logout-tip {
          position: absolute; left: calc(100% + 14px); top: 50%;
          transform: translateY(-50%) translateX(-4px);
          background: rgba(20,20,20,0.95); color: #fff;
          font-size: 12px; font-weight: 600;
          font-family: 'DM Sans', sans-serif; letter-spacing: 0.8px;
          padding: 6px 14px; border-radius: 8px; white-space: nowrap;
          pointer-events: none; opacity: 0;
          transition: opacity 0.18s ease, transform 0.18s ease;
          box-shadow: 0 4px 20px rgba(0,0,0,0.6);
          border: 1px solid rgba(255,96,64,0.12); z-index: 100;
        }
        .ns-logout-tip::before {
          content: ''; position: absolute; left: -5px; top: 50%;
          transform: translateY(-50%) rotate(45deg);
          width: 10px; height: 10px; background: rgba(20,20,20,0.95);
          border-left: 1px solid rgba(255,96,64,0.12);
          border-bottom: 1px solid rgba(255,96,64,0.12);
        }
        .ns-logout:hover .ns-logout-tip { opacity: 1; transform: translateY(-50%) translateX(0); }
        .ns.open .ns-logout-tip { display: none; }

        /* ===== MOBILE ===== */
        .ns-overlay {
          display: none; position: fixed; inset: 0;
          background: rgba(0,0,0,0.6); backdrop-filter: blur(3px); z-index: 45;
        }
        .ns-overlay.vis { display: block; }
        .ns-hamburger {
          display: none; width: 40px; height: 40px; border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          align-items: center; justify-content: center;
          cursor: pointer; color: #888; font-size: 20px;
          position: fixed; top: 14px; left: 14px; z-index: 44;
        }
        @media (max-width: 768px) {
          .ns {
            position: fixed; left: -240px; z-index: 50;
            width: 232px; min-width: 232px;
            transition: left 0.3s cubic-bezier(0.4,0,0.2,1);
          }
          .ns.mob { left: 0; box-shadow: 16px 0 48px rgba(0,0,0,0.5); }
          .ns .ns-brand { opacity: 1; width: auto; }
          .ns .ns-item { padding: 10px 14px; justify-content: flex-start; }
          .ns .ns-txt { opacity: 1; width: auto; }
          .ns .ns-badge { opacity: 1; position: relative; pointer-events: auto; }
          .ns .ns-tip { display: none; }
          .ns .ns-logout { padding: 10px 14px; justify-content: flex-start; }
          .ns .ns-logout-txt { opacity: 1; width: auto; }
          .ns .ns-logout-tip { display: none; }
          .ns .ns-promo { opacity: 1; max-height: 200px; margin: 6px 10px 8px; padding: 14px 12px; border: 1px solid rgba(255,60,30,0.1); pointer-events: auto; }
          .ns-hamburger { display: flex; }
        }
      `}</style>

      {/* Mobile hamburger */}
      <div className="ns-hamburger" onClick={function () { setMobileMenuOpen(!mobileMenuOpen) }}>
        {mobileMenuOpen ? "\u2715" : "\u2630"}
      </div>

      {/* Mobile overlay */}
      <div className={"ns-overlay " + (mobileMenuOpen ? "vis" : "")} onClick={function () { setMobileMenuOpen(false) }} />

      {/* ===== SIDEBAR ===== */}
      <aside className={"ns " + (ready ? "ready " : "") + (expanded ? "open " : "") + (mobileMenuOpen ? "mob" : "")}>

        {/* Profile avatar + user name on expand */}
        <div className="ns-head" onClick={function () { toggleExpanded() }}>
          <div className="ns-avatar">
            {userPhotoUrl
              ? <img src={userPhotoUrl} alt={userName} onError={function (e) { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex" }} />
              : null
            }
            <div className="ns-avatar-placeholder" style={{ display: userPhotoUrl ? "none" : "flex" }}>{userInitial}</div>
          </div>
          <span className="ns-brand">{teamNumber || "Team"}</span>
        </div>

        <div className="ns-div" />

        {/* Nav Items — no "Menu" label */}
        <div className="ns-nav">
          {navItems.map(function (item) {
            var active = isNavActive(item)
            return (
              <div
                key={item.id}
                className={"ns-item " + (active ? "on" : "")}
                onClick={function () { navigateTo(item) }}
                onMouseEnter={function () { setHoveredId(item.id) }}
                onMouseLeave={function () { setHoveredId(null) }}
              >
                <div className="ns-ic">
                  {renderIcon(item.icon)}
                  {item.badge > 0 && <span className="ns-dot" />}
                </div>
                <span className="ns-txt">{item.label}</span>
                {item.badge > 0 && <span className="ns-badge">{item.badge > 9 ? "9+" : item.badge}</span>}
                <div className="ns-tip">{item.label}</div>
              </div>
            )
          })}
        </div>

        {/* Promo Card */}
        <div className="ns-promo">
          <div className="ns-promo-em">{"\u2728"}</div>
          <div className="ns-promo-t">Event <span>Updates</span></div>
          <div className="ns-promo-s">Real-time announcements and schedule changes.</div>
          <button className="ns-promo-b" onClick={function () { router.push("/announcements") }}>View Updates</button>
        </div>

        {/* Bottom — logout only */}
        <div className="ns-bottom">
          <div className="ns-logout" onClick={handleLogout}>
            <div className="ns-logout-ic">{renderIcon("logout")}</div>
            <span className="ns-logout-txt">Logout</span>
            <div className="ns-logout-tip">Logout</div>
          </div>
        </div>
      </aside>
    </>
  )
}