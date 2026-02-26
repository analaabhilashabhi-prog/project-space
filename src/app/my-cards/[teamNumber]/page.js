"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { EVENT_CONFIG } from "@/config/formFields"
import AnimatedBackground from "@/components/AnimatedBackground"

export default function MyCardsPage() {
  var params = useParams()
  var router = useRouter()
  var teamNumber = params.teamNumber
  var [team, setTeam] = useState(null)
  var [cards, setCards] = useState([])
  var [cartSummary, setCartSummary] = useState([])
  var [memberName, setMemberName] = useState("")
  var [loading, setLoading] = useState(true)
  var [selectedDay, setSelectedDay] = useState(1)
  var [viewMode, setViewMode] = useState("cards")

  useEffect(function () {
    var roll = localStorage.getItem("ps_member_roll")
    var name = localStorage.getItem("ps_member_name")
    if (!roll) { router.push("/member-login"); return }
    if (name) setMemberName(name)

    async function fetchData() {
      var teamRes = await supabase.from("teams").select("*").eq("team_number", teamNumber).single()
      if (!teamRes.data) { setLoading(false); return }
      setTeam(teamRes.data)

      var cardsRes = await supabase
        .from("snack_cards")
        .select("*")
        .eq("team_id", teamRes.data.id)
        .eq("member_roll_number", roll)
        .order("day_number")
        .order("session_type")

      setCards(cardsRes.data || [])

      var summRes = await supabase
        .from("cart_summary")
        .select("*")
        .eq("team_id", teamRes.data.id)
        .eq("member_roll_number", roll)

      setCartSummary(summRes.data || [])
      setLoading(false)
    }

    if (teamNumber) fetchData()
  }, [teamNumber, router])

  var sessionOrder = { morning: 1, afternoon: 2, evening: 3, night: 4 }
  var sessionLabels = { morning: "🌅 Morning", afternoon: "☀️ Afternoon", evening: "🌇 Evening", night: "🌙 Night" }
  var sessionTimes = { morning: "7–11 AM", afternoon: "11 AM–3 PM", evening: "3–7 PM", night: "7–10 PM" }

  var dayCards = cards.filter(function (c) { return c.day_number === selectedDay })
    .sort(function (a, b) { return (sessionOrder[a.session_type] || 0) - (sessionOrder[b.session_type] || 0) })

  function getQRUrl(token) {
    return "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + encodeURIComponent(token) + "&bgcolor=0a0a0a&color=ff6040"
  }

  function handleLogout() {
    localStorage.removeItem("ps_member_roll")
    localStorage.removeItem("ps_member_name")
    localStorage.removeItem("ps_member_team")
    localStorage.removeItem("ps_member_team_id")
    router.push("/member-login")
  }

  if (loading) {
    return (
      <div className="ps-page">
        <AnimatedBackground />
        <div style={{ position: "relative", zIndex: 10, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="ps-spinner" style={{ width: 32, height: 32 }} />
        </div>
      </div>
    )
  }

  if (!team || cards.length === 0) {
    return (
      <div className="ps-page">
        <AnimatedBackground />
        <div style={{ position: "relative", zIndex: 10, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 20, textAlign: "center" }}>
          <div style={{ fontSize: 40 }}>🛒</div>
          <div style={{ fontSize: 22, fontFamily: "var(--font-display)", color: "#fff", letterSpacing: 2 }}>No Snack Cards Yet</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", maxWidth: 350 }}>Your team leader hasn&apos;t generated snack cards yet. Check back later.</div>
          <button className="ps-btn ps-btn-secondary" onClick={function () { router.push("/member-login") }}>← Back</button>
        </div>
      </div>
    )
  }

  return (
    <div className="ps-page">
      <AnimatedBackground />

      <style jsx>{`
        .mc-wrapper { position:relative; z-index:10; min-height:100vh; padding:0 20px 60px; }
        .mc-container { max-width:500px; margin:0 auto; }

        .mc-header { display:flex; align-items:center; justify-content:space-between; padding:20px 0 12px; opacity:0; animation:psFadeIn 0.6s ease forwards; }
        .mc-logo { display:flex; align-items:center; gap:8px; }
        .mc-logo-icon { width:32px;height:32px; border-radius:8px; background:linear-gradient(135deg,#ff3020,#ff6040); display:flex; align-items:center; justify-content:center; font-family:var(--font-display); font-weight:900; font-size:12px; color:#fff; }
        .mc-logout { padding:5px 12px; border-radius:50px; border:1px solid rgba(255,255,255,0.1); background:none; color:rgba(255,255,255,0.35); font-family:var(--font-display); font-size:10px; letter-spacing:1.5px; text-transform:uppercase; cursor:pointer; transition:all 0.3s; }
        .mc-logout:hover { border-color:rgba(255,60,30,0.4); color:var(--accent-orange); }

        .mc-welcome { padding:16px 20px; border-radius:14px; border:1px solid rgba(255,60,30,0.12); background:rgba(255,60,30,0.03); margin-bottom:16px; opacity:0; animation:psFadeIn 0.6s ease 0.1s forwards; }
        .mc-welcome-name { font-family:var(--font-display); font-size:18px; font-weight:700; color:#fff; letter-spacing:1px; }
        .mc-welcome-sub { font-size:11px; color:rgba(255,255,255,0.3); font-family:var(--font-display); letter-spacing:1px; margin-top:2px; }

        .mc-title { font-family:var(--font-display); font-size:24px; font-weight:900; color:#fff; text-transform:uppercase; letter-spacing:2px; margin-bottom:4px; opacity:0; animation:psFadeIn 0.5s ease 0.15s forwards; }
        .mc-subtitle { font-size:12px; color:rgba(255,255,255,0.3); margin-bottom:16px; opacity:0; animation:psFadeIn 0.5s ease 0.2s forwards; }

        /* Toggle */
        .mc-toggle { display:flex; gap:3px; padding:3px; border-radius:10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); margin-bottom:14px; opacity:0; animation:psFadeIn 0.5s ease 0.25s forwards; }
        .mc-toggle-btn { flex:1; padding:8px; border-radius:8px; border:none; font-family:var(--font-display); font-size:11px; font-weight:600; letter-spacing:1px; text-transform:uppercase; cursor:pointer; transition:all 0.3s; background:transparent; color:rgba(255,255,255,0.3); }
        .mc-toggle-btn.active { background:linear-gradient(135deg,#ff3020,#ff6040); color:#fff; }

        /* Day pills */
        .mc-days { display:flex; gap:4px; margin-bottom:16px; overflow-x:auto; padding-bottom:4px; opacity:0; animation:psFadeIn 0.5s ease 0.3s forwards; }
        .mc-day { padding:7px 14px; border-radius:8px; border:none; font-family:var(--font-display); font-size:11px; font-weight:600; letter-spacing:1px; cursor:pointer; transition:all 0.3s; white-space:nowrap; }
        .mc-day.active { background:linear-gradient(135deg,#ff3020,#ff6040); color:#fff; }
        .mc-day.inactive { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); color:rgba(255,255,255,0.3); }

        /* Card grid */
        .mc-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }

        /* Card */
        .mc-card { padding:16px; border-radius:14px; border:1px solid rgba(255,60,30,0.1); background:linear-gradient(165deg,rgba(35,12,8,0.7),rgba(18,6,4,0.85)); position:relative; overflow:hidden; opacity:0; animation:psFadeIn 0.4s ease 0.35s forwards; }
        .mc-card::before { content:''; position:absolute; top:0;left:0;right:0; height:2px; }
        .mc-card.active::before { background:linear-gradient(90deg,#44ff66,#22cc44); }
        .mc-card.used::before { background:linear-gradient(90deg,#ff4444,#cc2222); }
        .mc-card.expired::before { background:#555; }

        .mc-card-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; }
        .mc-card-type { padding:2px 8px; border-radius:6px; font-family:var(--font-display); font-size:9px; font-weight:700; letter-spacing:1px; text-transform:uppercase; margin-bottom:4px; display:inline-block; }
        .mc-type-snack { background:rgba(255,60,30,0.1); border:1px solid rgba(255,60,30,0.2); color:var(--accent-light); }
        .mc-type-bev { background:rgba(60,130,255,0.1); border:1px solid rgba(60,130,255,0.2); color:#6bb3ff; }

        .mc-card-session { font-family:var(--font-display); font-size:12px; font-weight:700; color:#fff; letter-spacing:1px; text-transform:uppercase; }
        .mc-card-snack { font-size:18px; font-weight:800; color:var(--accent-orange); font-family:var(--font-display); letter-spacing:1px; margin-top:2px; }
        .mc-card-time { font-size:10px; color:rgba(255,255,255,0.25); font-family:var(--font-display); letter-spacing:1px; margin-top:2px; }

        .mc-status { padding:3px 10px; border-radius:50px; font-family:var(--font-display); font-size:9px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; }
        .mc-status.active { background:rgba(68,255,102,0.1); border:1px solid rgba(68,255,102,0.2); color:#44ff66; }
        .mc-status.used { background:rgba(255,85,85,0.1); border:1px solid rgba(255,85,85,0.2); color:#ff5555; }
        .mc-status.expired { background:rgba(136,136,136,0.1); border:1px solid rgba(136,136,136,0.2); color:#888; }

        .mc-qr { display:flex; justify-content:center; padding:12px; border-radius:10px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.04); }
        .mc-qr img { width:180px; height:180px; border-radius:6px; }
        .mc-qr.disabled { opacity:0.15; filter:grayscale(1); }

        .mc-token { text-align:center; font-family:monospace; font-size:8px; color:rgba(255,255,255,0.1); letter-spacing:1px; margin-top:4px; word-break:break-all; }

        /* Summary */
        .mc-summary { padding:18px; border-radius:14px; border:1px solid rgba(255,60,30,0.08); background:rgba(255,255,255,0.015); margin-bottom:8px; opacity:0; animation:psFadeIn 0.4s ease 0.35s forwards; }
        .mc-sum-row { display:flex; align-items:center; justify-content:space-between; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.03); }
        .mc-sum-row:last-child { border-bottom:none; }
        .mc-sum-name { font-family:var(--font-display); font-size:13px; font-weight:600; color:#fff; }
        .mc-sum-nums { display:flex; gap:10px; font-family:var(--font-display); font-size:11px; letter-spacing:0.5px; }

        .mc-empty { text-align:center; padding:30px; color:rgba(255,255,255,0.25); font-size:13px; }

        @media (max-width:400px) {
          .mc-qr img { width:150px; height:150px; }
          .mc-card-snack { font-size:15px; }
          .mc-grid { grid-template-columns:1fr; }
        }
      `}</style>

      <div className="mc-wrapper">
        <div className="mc-container">

          <div className="mc-header">
            <div className="mc-logo">
              <div className="mc-logo-icon">PS</div>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 600, color: "#fff", letterSpacing: 1 }}>{EVENT_CONFIG.eventName}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 1 }}>{team.team_number}</div>
              </div>
            </div>
            <button className="mc-logout" onClick={handleLogout}>Logout</button>
          </div>

          <div className="mc-welcome">
            <div className="mc-welcome-name">👋 {memberName}</div>
            <div className="mc-welcome-sub">{team.team_number} • {team.project_title}</div>
          </div>

          <div className="mc-title">🛒 My Snack Cards</div>
          <div className="mc-subtitle">{cards.length} cards • Show QR at snack counter</div>

          <div className="mc-toggle">
            <button className={"mc-toggle-btn " + (viewMode === "cards" ? "active" : "")} onClick={function () { setViewMode("cards") }}>📱 Cards</button>
            <button className={"mc-toggle-btn " + (viewMode === "summary" ? "active" : "")} onClick={function () { setViewMode("summary") }}>📊 Summary</button>
          </div>

          {viewMode === "cards" && (
            <>
              <div className="mc-days">
                {[1, 2, 3, 4, 5, 6, 7].map(function (d) {
                  var cnt = cards.filter(function (c) { return c.day_number === d }).length
                  return (
                    <button key={d} onClick={function () { setSelectedDay(d) }} className={"mc-day " + (selectedDay === d ? "active" : "inactive")}>
                      Day-{d}
                    </button>
                  )
                })}
              </div>

              {dayCards.length === 0 ? (
                <div className="mc-empty">No cards for Day-{selectedDay}</div>
              ) : (
                <div className="mc-grid">
                {dayCards.map(function (card) {
                  var isActive = card.status === "active"
                  var cardType = card.card_type || "snack"
                  return (
                    <div key={card.id} className={"mc-card " + card.status}>
                      <div className="mc-card-top">
                        <div>
                          <span className={"mc-card-type " + (cardType === "beverage" ? "mc-type-bev" : "mc-type-snack")}>
                            {cardType === "beverage" ? "🥤 Beverage" : "🍔 Snack"}
                          </span>
                          <div className="mc-card-session">{sessionLabels[card.session_type]}</div>
                          <div className="mc-card-snack">{card.snack_name}</div>
                          <div className="mc-card-time">Day-{card.day_number} • {sessionTimes[card.session_type]}</div>
                        </div>
                        <span className={"mc-status " + card.status}>
                          {card.status === "active" ? "✓" : card.status === "used" ? "✗" : "—"}
                        </span>
                      </div>
                      <div className={"mc-qr " + (!isActive ? "disabled" : "")}>
                        <img src={getQRUrl(card.qr_token)} alt="QR" loading="lazy" />
                      </div>
                      <div className="mc-token">{card.qr_token}</div>
                    </div>
                  )
                })}
                </div>
              )}
            </>
          )}

          {viewMode === "summary" && (
            <div className="mc-summary">
              {cartSummary.length === 0 ? (
                <div className="mc-empty">No summary</div>
              ) : (
                cartSummary.map(function (item) {
                  return (
                    <div key={item.id} className="mc-sum-row">
                      <div className="mc-sum-name">{item.snack_name}</div>
                      <div className="mc-sum-nums">
                        <span style={{ color: "var(--accent-orange)" }}>Total: {item.total_count}</span>
                        <span style={{ color: "#ff5555" }}>Used: {item.used_count}</span>
                        <span style={{ color: "#44ff66" }}>Left: {item.total_count - item.used_count}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}