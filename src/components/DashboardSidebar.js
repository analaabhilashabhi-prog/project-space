"use client"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function DashboardSidebar({ teamNumber, currentMember, loggedInRoll, isLeader }) {
  var router = useRouter()
  var pathname = usePathname()
  var [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  var [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  var [dropdownOpen, setDropdownOpen] = useState(false)
  var [unreadCount, setUnreadCount] = useState(0)
  var [hasCart, setHasCart] = useState(false)
  var [foodDone, setFoodDone] = useState(false)

  // Check food & card status for this individual
  useEffect(function () {
    async function checkStatus() {
      if (!teamNumber || !loggedInRoll) return
      try {
        // Check individual food selections
        var foodRes = await supabase
          .from("food_selections")
          .select("day_number")
          .eq("member_roll_number", loggedInRoll)

        if (foodRes.data) {
          var days = new Set(foodRes.data.map(function (f) { return f.day_number }))
          setFoodDone(days.size >= 7)
        }

        // Check if food codes generated
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

  // Poll unread announcements
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

  // Close dropdown on outside click
  useEffect(function () {
    function handleClick(e) {
      if (!e.target.closest(".user-card")) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("click", handleClick)
    return function () { document.removeEventListener("click", handleClick) }
  }, [])

  function handleLogout() {
    sessionStorage.clear()
    localStorage.removeItem("ps_roll")
    localStorage.removeItem("ps_member_roll")
    router.push("/login")
  }

  // Build navigation items - conditionally include Mentor Request
  var navItems = [
    { id: "dashboard", label: "Team Profile", icon: "https://cdn-icons-png.flaticon.com/128/9338/9338878.png", path: "/team-info/" + teamNumber },
    { id: "announcements", label: "Announcements", icon: "https://cdn-icons-png.flaticon.com/128/7729/7729329.png", path: "/announcements", badge: unreadCount },
    { id: "food", label: "Food Selection", icon: "https://cdn-icons-png.flaticon.com/128/8633/8633559.png", path: "/food-selection/" + teamNumber },
    { id: "snacks", label: "Food Cards", icon: "https://cdn-icons-png.flaticon.com/128/10064/10064817.png", path: hasCart ? "/food-cards/" + teamNumber : "/food-selection/" + teamNumber },
  ]

  // Only leaders see Mentor Request
  if (isLeader) {
    navItems.push({ id: "mentor", label: "Request Mentor", icon: "https://cdn-icons-png.flaticon.com/128/14241/14241767.png", path: "/mentor-request/" + teamNumber })
  }

  function isNavActive(item) {
    if (item.id === "dashboard") return pathname === "/team-info/" + teamNumber
    return pathname.startsWith(item.path)
  }

  function navigateTo(item) {
    router.push(item.path)
    setMobileMenuOpen(false)
  }

  return (
    <>
      <style jsx>{`
        .sb { width:270px; min-width:270px; height:100vh; background:#0f0f0f; border-right:1px solid rgba(255,255,255,0.06); display:flex; flex-direction:column; transition:all 0.3s cubic-bezier(0.4,0,0.2,1); position:relative; z-index:50; overflow-y:auto; overflow-x:hidden; }
        .sb.collapsed { width:72px; min-width:72px; }
        .sb::-webkit-scrollbar { width:0; }
        .sb-logo { display:flex; align-items:center; justify-content:space-between; padding:20px 18px; border-bottom:1px solid rgba(255,255,255,0.05); }
        .sb-logo-left { display:flex; align-items:center; gap:12px; cursor:pointer; overflow:hidden; }
        .sb-logo-icon { width:38px; height:38px; min-width:38px; border-radius:11px; background:linear-gradient(135deg,#ff3020,#ff6040); display:flex; align-items:center; justify-content:center; font-family:'Genos',sans-serif; font-weight:900; font-size:17px; color:#fff; box-shadow:0 0 20px rgba(255,50,30,0.25); }
        .sb-logo-text { font-family:'Genos',sans-serif; font-weight:700; font-size:20px; color:#fff; letter-spacing:1.5px; text-transform:uppercase; white-space:nowrap; transition:opacity 0.2s ease; }
        .sb.collapsed .sb-logo-text { opacity:0; width:0; }
        .sb-collapse { width:30px; height:30px; min-width:30px; border-radius:8px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.03); color:#666; font-size:14px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.3s ease; }
        .sb-collapse:hover { border-color:rgba(255,60,30,0.3); color:#ff6040; background:rgba(255,60,30,0.06); }
        .sb.collapsed .sb-collapse { margin:0 auto; }
        .sb-section { padding:8px 12px; }
        .sb-section-label { font-size:10px; font-weight:700; color:#444; letter-spacing:2px; text-transform:uppercase; padding:10px 8px 8px; white-space:nowrap; overflow:hidden; transition:opacity 0.2s ease; }
        .sb.collapsed .sb-section-label { opacity:0; height:10px; padding:5px 0; }
        .sb-item { display:flex; align-items:center; gap:12px; padding:11px 14px; border-radius:10px; cursor:pointer; transition:all 0.25s ease; position:relative; margin-bottom:2px; overflow:hidden; color:#777; font-size:14px; font-weight:500; }
        .sb-item:hover { background:rgba(255,255,255,0.04); color:#ccc; }
        .sb-item.active { background:linear-gradient(135deg,rgba(255,50,30,0.12),rgba(255,80,40,0.06)); color:#fff; font-weight:600; }
        .sb-item.active::before { content:''; position:absolute; left:0; top:6px; bottom:6px; width:3px; border-radius:0 3px 3px 0; background:linear-gradient(180deg,#ff3020,#ff8040); }
        .sb-item-icon { width:22px; min-width:22px; height:22px; object-fit:contain; flex-shrink:0; filter:brightness(0) invert(0.5); transition:filter 0.2s ease; }
        .sb-item.active .sb-item-icon { filter:brightness(0) invert(1); }
        .sb-item:hover .sb-item-icon { filter:brightness(0) invert(0.8); }
        .sb-item-text { white-space:nowrap; transition:opacity 0.2s ease; }
        .sb.collapsed .sb-item-text { opacity:0; width:0; }
        .sb.collapsed .sb-item { justify-content:center; padding:11px; }
        .sb-badge { margin-left:auto; padding:2px 8px; border-radius:10px; background:rgba(255,50,30,0.15); color:#ff6040; font-size:11px; font-weight:700; transition:opacity 0.2s ease; }
        .sb.collapsed .sb-badge { opacity:0; position:absolute; }
        .sb-promo { margin:12px 14px; padding:18px 16px; border-radius:14px; background:linear-gradient(135deg,rgba(255,50,30,0.1),rgba(255,80,40,0.05)); border:1px solid rgba(255,60,30,0.15); position:relative; overflow:hidden; transition:opacity 0.2s ease,max-height 0.3s ease; }
        .sb.collapsed .sb-promo { opacity:0; max-height:0; margin:0; padding:0; border:none; overflow:hidden; }
        .sb-promo-title { font-size:14px; font-weight:700; color:#fff; margin-bottom:4px; }
        .sb-promo-title span { background:linear-gradient(135deg,#ff3020,#ff8040); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .sb-promo-sub { font-size:12px; color:#777; line-height:1.5; margin-bottom:14px; }
        .sb-promo-btn { width:100%; padding:10px; border-radius:10px; border:none; background:linear-gradient(135deg,#ff3020,#ff6040); color:#fff; font-size:13px; font-weight:600; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all 0.3s ease; }
        .sb-promo-btn:hover { box-shadow:0 0 25px rgba(255,50,30,0.3); transform:translateY(-1px); }
        .sb-user { padding:14px 14px 18px; border-top:1px solid rgba(255,255,255,0.05); margin-top:auto; }
        .user-card { display:flex; align-items:center; gap:12px; padding:10px 12px; border-radius:12px; cursor:pointer; transition:all 0.3s ease; position:relative; }
        .user-card:hover { background:rgba(255,255,255,0.04); }
        .user-avatar { width:38px; height:38px; min-width:38px; border-radius:50%; background:linear-gradient(135deg,#ff3020,#ff6040); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:14px; color:#fff; }
        .user-info { overflow:hidden; transition:opacity 0.2s ease; }
        .sb.collapsed .user-info { opacity:0; width:0; }
        .user-name { font-size:14px; font-weight:600; color:#fff; white-space:nowrap; }
        .user-roll { font-size:12px; color:#666; white-space:nowrap; }
        .user-dd-icon { margin-left:auto; color:#555; font-size:12px; transition:opacity 0.2s ease; }
        .sb.collapsed .user-dd-icon { opacity:0; }
        .user-dd { position:absolute; bottom:60px; left:0; right:0; background:#161616; border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:6px; display:none; box-shadow:0 10px 40px rgba(0,0,0,0.5); z-index:100; }
        .user-dd.show { display:block; }
        .dd-item { display:flex; align-items:center; gap:10px; padding:10px 14px; border-radius:8px; font-size:13px; color:#999; cursor:pointer; transition:all 0.2s ease; }
        .dd-item:hover { background:rgba(255,255,255,0.05); color:#fff; }
        .dd-item.danger:hover { background:rgba(255,50,30,0.1); color:#ff6040; }
        .mobile-hamburger { display:none; width:40px; height:40px; border-radius:10px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.03); align-items:center; justify-content:center; cursor:pointer; color:#888; font-size:20px; }
        .sb-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:45; }
        .sb-overlay.show { display:block; }
        @media (max-width:768px) {
          .sb { position:fixed; left:-280px; z-index:50; transition:left 0.3s ease; }
          .sb.mobile-open { left:0; }
          .mobile-hamburger { display:flex; }
        }
      `}</style>

      {/* Mobile overlay */}
      <div className={"sb-overlay " + (mobileMenuOpen ? "show" : "")} onClick={function () { setMobileMenuOpen(false) }} />

      {/* Sidebar */}
      <aside className={"sb " + (sidebarCollapsed ? "collapsed " : "") + (mobileMenuOpen ? "mobile-open" : "")}>
        {/* Logo */}
        <div className="sb-logo">
          <div className="sb-logo-left" onClick={function () { router.push("/") }}>
            <div className="sb-logo-icon">PS</div>
            <span className="sb-logo-text">Project Space</span>
          </div>
          <button className="sb-collapse" onClick={function () { setSidebarCollapsed(!sidebarCollapsed) }}>
            {sidebarCollapsed ? "\u25b6" : "\u25c0"}
          </button>
        </div>

        {/* Navigation */}
        <div className="sb-section">
          <div className="sb-section-label">Main</div>
          {navItems.map(function (item) {
            var active = isNavActive(item)
            return (
              <div
                key={item.id}
                className={"sb-item " + (active ? "active" : "")}
                onClick={function () { navigateTo(item) }}
              >
                <img src={item.icon} alt="" className="sb-item-icon" />
                <span className="sb-item-text">{item.label}</span>
                {item.badge > 0 && (
                  <span className="sb-badge">{item.badge > 9 ? "9+" : item.badge}</span>
                )}
              </div>
            )
          })}
        </div>

        {/* Promo Card */}
        <div className="sb-promo">
          <div style={{ fontSize: 20, marginBottom: 8 }}>{"\u2728"}</div>
          <div className="sb-promo-title">Event <span>Updates</span></div>
          <div className="sb-promo-sub">Get real-time updates, announcements, and schedule changes.</div>
          <button className="sb-promo-btn" onClick={function () { router.push("/announcements") }}>View Updates</button>
        </div>

        {/* User */}
        <div className="sb-user">
          <div className="user-card" onClick={function () { setDropdownOpen(!dropdownOpen) }}>
            <div className="user-avatar">
              {currentMember ? currentMember.member_name.charAt(0).toUpperCase() : "?"}
            </div>
            <div className="user-info">
              <div className="user-name">{currentMember ? currentMember.member_name : "User"}</div>
              <div className="user-roll">{loggedInRoll}</div>
            </div>
            <span className="user-dd-icon">{"\u25b2\u25bc"}</span>

            <div className={"user-dd " + (dropdownOpen ? "show" : "")}>
              <div className="dd-item" onClick={function () { router.push("/team-info/" + teamNumber) }}>{"\ud83d\udc64"} Profile</div>
              <div className="dd-item danger" onClick={handleLogout}>{"\ud83d\udeaa"} Logout</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}