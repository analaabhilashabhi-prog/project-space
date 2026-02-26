"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { EVENT_CONFIG } from "@/config/formFields"
import AnimatedBackground from "@/components/AnimatedBackground"

export default function SnackCardsPage() {
  var params = useParams()
  var router = useRouter()
  var teamNumber = params.teamNumber
  var [team, setTeam] = useState(null)
  var [cards, setCards] = useState([])
  var [cartSummary, setCartSummary] = useState([])
  var [loading, setLoading] = useState(true)
  var [selectedDay, setSelectedDay] = useState(1)
  var [viewMode, setViewMode] = useState("cards")
  var [filterType, setFilterType] = useState("all")
  var [loggedInRoll, setLoggedInRoll] = useState("")

  useEffect(function () {
    var roll = sessionStorage.getItem("ps_roll") || localStorage.getItem("ps_roll")
    if (!roll) { router.push("/login"); return }
    setLoggedInRoll(roll)

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

  var dayCards = cards
    .filter(function (c) { return c.day_number === selectedDay })
    .filter(function (c) {
      if (filterType === "all") return true
      return (c.card_type || "snack") === filterType
    })
    .sort(function (a, b) { return (sessionOrder[a.session_type] || 0) - (sessionOrder[b.session_type] || 0) })

  function getQRUrl(token) {
    return "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + encodeURIComponent(token) + "&bgcolor=0a0a0a&color=ff6040"
  }

  if (loading) {
    return (
      <div className="ps-page"><AnimatedBackground />
        <div style={{ position: "relative", zIndex: 10, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="ps-spinner" style={{ width: 32, height: 32 }} />
        </div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="ps-page"><AnimatedBackground />
        <div style={{ position: "relative", zIndex: 10, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <div style={{ fontSize: 28, fontFamily: "var(--font-display)", color: "#fff" }}>Team Not Found</div>
          <button className="ps-btn ps-btn-secondary" onClick={function () { router.push("/") }}>← Home</button>
        </div>
      </div>
    )
  }

  var snackCount = cards.filter(function (c) { return (c.card_type || "snack") === "snack" }).length
  var bevCount = cards.filter(function (c) { return c.card_type === "beverage" }).length

  return (
    <div className="ps-page">
      <AnimatedBackground />

      <style jsx>{`
        .sc-wrap { position:relative; z-index:10; min-height:100vh; padding:0 16px 60px; }
        .sc-cont { max-width:1100px; margin:0 auto; }

        .sc-head { display:flex; align-items:center; justify-content:space-between; padding:18px 0; margin-bottom:6px; opacity:0; animation:psFadeIn 0.6s ease forwards; }
        .sc-logo { display:flex; align-items:center; gap:8px; }
        .sc-logo-box { width:34px;height:34px; border-radius:9px; background:linear-gradient(135deg,#ff3020,#ff6040); display:flex; align-items:center; justify-content:center; font-family:var(--font-display); font-weight:900; font-size:13px; color:#fff; }
        .sc-back { font-family:var(--font-display); font-size:11px; color:rgba(255,255,255,0.3); letter-spacing:1.5px; text-transform:uppercase; text-decoration:none; }
        .sc-back:hover { color:var(--accent-orange); }

        .sc-title { font-family:var(--font-display); font-size:26px; font-weight:900; color:#fff; text-transform:uppercase; letter-spacing:2px; margin-bottom:3px; opacity:0; animation:psFadeIn 0.5s ease 0.1s forwards; }
        .sc-sub { font-size:12px; color:rgba(255,255,255,0.25); margin-bottom:14px; opacity:0; animation:psFadeIn 0.5s ease 0.15s forwards; }

        .sc-stats { display:flex; gap:8px; margin-bottom:14px; opacity:0; animation:psFadeIn 0.5s ease 0.2s forwards; }
        .sc-pill { padding:5px 12px; border-radius:50px; font-family:var(--font-display); font-size:10px; font-weight:600; letter-spacing:1px; }
        .sc-pill-s { background:rgba(255,60,30,0.08); border:1px solid rgba(255,60,30,0.18); color:var(--accent-light); }
        .sc-pill-b { background:rgba(60,130,255,0.08); border:1px solid rgba(60,130,255,0.18); color:#6bb3ff; }

        .sc-toggle { display:flex; gap:3px; padding:3px; border-radius:10px; background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.05); margin-bottom:12px; opacity:0; animation:psFadeIn 0.5s ease 0.25s forwards; }
        .sc-tog { flex:1; padding:9px; border-radius:8px; border:none; font-family:var(--font-display); font-size:11px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; cursor:pointer; transition:all 0.3s; background:transparent; color:rgba(255,255,255,0.3); }
        .sc-tog.on { background:linear-gradient(135deg,#ff3020,#ff6040); color:#fff; }

        .sc-days { display:flex; gap:5px; margin-bottom:10px; overflow-x:auto; padding-bottom:3px; opacity:0; animation:psFadeIn 0.5s ease 0.3s forwards; }
        .sc-day { padding:8px 16px; border-radius:9px; border:none; font-family:var(--font-display); font-size:11px; font-weight:600; letter-spacing:1px; cursor:pointer; transition:all 0.3s; white-space:nowrap; }
        .sc-day.on { background:linear-gradient(135deg,#ff3020,#ff6040); color:#fff; }
        .sc-day.off { background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.06); color:rgba(255,255,255,0.3); }
        .sc-day.off:hover { border-color:rgba(255,60,30,0.25); color:rgba(255,255,255,0.5); }

        .sc-filter { display:flex; gap:4px; margin-bottom:16px; opacity:0; animation:psFadeIn 0.5s ease 0.35s forwards; }
        .sc-fbtn { padding:5px 12px; border-radius:7px; border:none; font-family:var(--font-display); font-size:10px; font-weight:600; letter-spacing:1px; cursor:pointer; transition:all 0.3s; }
        .sc-fbtn.on { background:rgba(255,60,30,0.12); border:1px solid rgba(255,60,30,0.28); color:var(--accent-light); }
        .sc-fbtn.off { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); color:rgba(255,255,255,0.25); }

        /* ===== 4-COLUMN GRID ===== */
        .sc-grid { display:grid; grid-template-columns:repeat(4, 1fr); gap:12px; opacity:0; animation:psFadeIn 0.5s ease 0.4s forwards; }

        .sc-card { padding:14px; border-radius:13px; border:1px solid rgba(255,60,30,0.08); background:linear-gradient(165deg,rgba(30,10,6,0.8),rgba(14,5,3,0.9)); position:relative; overflow:hidden; transition:all 0.3s; }
        .sc-card:hover { border-color:rgba(255,60,30,0.22); transform:translateY(-2px); }
        .sc-card::before { content:''; position:absolute; top:0;left:0;right:0; height:2px; }
        .sc-card.active::before { background:linear-gradient(90deg,#44ff66,#22cc44); }
        .sc-card.used::before { background:linear-gradient(90deg,#ff4444,#cc2222); }
        .sc-card.expired::before { background:#555; }

        .sc-card-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px; }
        .sc-badge { padding:2px 7px; border-radius:5px; font-family:var(--font-display); font-size:8px; font-weight:700; letter-spacing:1px; text-transform:uppercase; }
        .sc-b-snack { background:rgba(255,60,30,0.1); border:1px solid rgba(255,60,30,0.18); color:var(--accent-light); }
        .sc-b-bev { background:rgba(60,130,255,0.1); border:1px solid rgba(60,130,255,0.18); color:#6bb3ff; }
        .sc-sts { padding:2px 7px; border-radius:5px; font-family:var(--font-display); font-size:8px; font-weight:700; letter-spacing:1px; text-transform:uppercase; }
        .sc-sts-active { background:rgba(68,255,102,0.06); border:1px solid rgba(68,255,102,0.18); color:#44ff66; }
        .sc-sts-used { background:rgba(255,85,85,0.06); border:1px solid rgba(255,85,85,0.18); color:#ff5555; }
        .sc-sts-expired { background:rgba(136,136,136,0.06); border:1px solid rgba(136,136,136,0.18); color:#888; }

        .sc-sess { font-family:var(--font-display); font-size:10px; font-weight:600; color:rgba(255,255,255,0.4); letter-spacing:1px; text-transform:uppercase; margin-bottom:1px; }
        .sc-name { font-family:var(--font-display); font-size:14px; font-weight:800; color:#fff; letter-spacing:0.5px; margin-bottom:1px; line-height:1.2; }
        .sc-time { font-size:9px; color:rgba(255,255,255,0.18); font-family:var(--font-display); letter-spacing:1px; margin-bottom:8px; }

        .sc-qr { display:flex; justify-content:center; padding:8px; border-radius:8px; background:rgba(255,255,255,0.012); border:1px solid rgba(255,255,255,0.025); }
        .sc-qr img { width:100%; max-width:130px; height:auto; aspect-ratio:1; border-radius:4px; }
        .sc-qr.off { opacity:0.1; filter:grayscale(1); }

        .sc-tok { text-align:center; font-family:monospace; font-size:6px; color:rgba(255,255,255,0.06); letter-spacing:0.5px; margin-top:3px; word-break:break-all; }

        /* Summary */
        .sc-summ { opacity:0; animation:psFadeIn 0.5s ease 0.4s forwards; }
        .sc-sum-sec { margin-bottom:14px; }
        .sc-sum-h { font-family:var(--font-display); font-size:12px; font-weight:700; letter-spacing:2px; text-transform:uppercase; margin-bottom:8px; padding:7px 12px; border-radius:9px; }
        .sc-sum-hs { color:var(--accent-light); background:rgba(255,60,30,0.05); border:1px solid rgba(255,60,30,0.1); }
        .sc-sum-hb { color:#6bb3ff; background:rgba(60,130,255,0.05); border:1px solid rgba(60,130,255,0.1); }
        .sc-sum-box { padding:14px; border-radius:12px; border:1px solid rgba(255,60,30,0.06); background:rgba(255,255,255,0.012); }
        .sc-sum-r { display:flex; align-items:center; justify-content:space-between; padding:7px 0; border-bottom:1px solid rgba(255,255,255,0.025); }
        .sc-sum-r:last-child { border-bottom:none; }
        .sc-sum-n { font-family:var(--font-display); font-size:12px; font-weight:600; color:#fff; }
        .sc-sum-c { display:flex; gap:10px; font-family:var(--font-display); font-size:10px; letter-spacing:0.5px; }

        .sc-empty { text-align:center; padding:35px; color:rgba(255,255,255,0.2); font-size:12px; grid-column:1/-1; }

        @media (max-width:900px) { .sc-grid { grid-template-columns:repeat(3, 1fr); } }
        @media (max-width:650px) { .sc-grid { grid-template-columns:repeat(2, 1fr); } .sc-head { flex-direction:column; gap:8px; align-items:flex-start; } }
        @media (max-width:400px) { .sc-grid { grid-template-columns:1fr; } .sc-title { font-size:20px; } }
      `}</style>

      <div className="sc-wrap">
        <div className="sc-cont">

          <div className="sc-head">
            <div className="sc-logo">
              <div className="sc-logo-box">PS</div>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600, color: "#fff", letterSpacing: 1 }}>{EVENT_CONFIG.eventName}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: 1 }}>{team.team_number}</div>
              </div>
            </div>
            <Link href={"/team-info/" + team.team_number} className="sc-back">← Back to Team</Link>
          </div>

          <div className="sc-title">🛒 My Cards</div>
          <div className="sc-sub">Show QR at counter to collect your snack or beverage</div>

          <div className="sc-stats">
            <span className="sc-pill sc-pill-s">🍔 Snacks: {snackCount}</span>
            <span className="sc-pill sc-pill-b">🥤 Beverages: {bevCount}</span>
            <span className="sc-pill" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" }}>Total: {cards.length}</span>
          </div>

          <div className="sc-toggle">
            <button className={"sc-tog " + (viewMode === "cards" ? "on" : "")} onClick={function () { setViewMode("cards") }}>📱 QR Cards</button>
            <button className={"sc-tog " + (viewMode === "summary" ? "on" : "")} onClick={function () { setViewMode("summary") }}>📊 Cart Summary</button>
          </div>

          {viewMode === "cards" && (
            <>
              <div className="sc-days">
                {[1, 2, 3, 4, 5, 6, 7].map(function (d) {
                  return (
                    <button key={d} onClick={function () { setSelectedDay(d) }} className={"sc-day " + (selectedDay === d ? "on" : "off")}>
                      Day-{d}
                    </button>
                  )
                })}
              </div>

              <div className="sc-filter">
                {[
                  { key: "all", label: "All" },
                  { key: "snack", label: "🍔 Snacks" },
                  { key: "beverage", label: "🥤 Beverages" },
                ].map(function (f) {
                  return (
                    <button key={f.key} onClick={function () { setFilterType(f.key) }} className={"sc-fbtn " + (filterType === f.key ? "on" : "off")}>
                      {f.label}
                    </button>
                  )
                })}
              </div>

              <div className="sc-grid">
                {dayCards.length === 0 ? (
                  <div className="sc-empty">No cards for Day-{selectedDay}{filterType !== "all" ? " (" + filterType + "s)" : ""}</div>
                ) : (
                  dayCards.map(function (card) {
                    var isActive = card.status === "active"
                    var ct = card.card_type || "snack"
                    return (
                      <div key={card.id} className={"sc-card " + card.status}>
                        <div className="sc-card-top">
                          <span className={"sc-badge " + (ct === "beverage" ? "sc-b-bev" : "sc-b-snack")}>
                            {ct === "beverage" ? "🥤 Bev" : "🍔 Snack"}
                          </span>
                          <span className={"sc-sts sc-sts-" + card.status}>
                            {card.status === "active" ? "✓ Active" : card.status === "used" ? "✗ Used" : "Expired"}
                          </span>
                        </div>
                        <div className="sc-sess">{sessionLabels[card.session_type] || card.session_type}</div>
                        <div className="sc-name">{card.snack_name}</div>
                        <div className="sc-time">Day-{card.day_number} • {sessionTimes[card.session_type] || ""}</div>
                        <div className={"sc-qr " + (!isActive ? "off" : "")}>
                          <img src={getQRUrl(card.qr_token)} alt="QR" loading="lazy" />
                        </div>
                        <div className="sc-tok">{card.qr_token}</div>
                      </div>
                    )
                  })
                )}
              </div>
            </>
          )}

          {viewMode === "summary" && (
            <div className="sc-summ">
              {cartSummary.length === 0 ? (
                <div className="sc-empty">No cart summary available</div>
              ) : (
                <>
                  {cartSummary.filter(function (s) { return (s.item_type || "snack") === "snack" }).length > 0 && (
                    <div className="sc-sum-sec">
                      <div className="sc-sum-h sc-sum-hs">🍔 Snacks</div>
                      <div className="sc-sum-box">
                        {cartSummary.filter(function (s) { return (s.item_type || "snack") === "snack" }).map(function (item) {
                          return (
                            <div key={item.id} className="sc-sum-r">
                              <div className="sc-sum-n">{item.snack_name}</div>
                              <div className="sc-sum-c">
                                <span style={{ color: "var(--accent-orange)" }}>Total: {item.total_count}</span>
                                <span style={{ color: "#ff5555" }}>Used: {item.used_count}</span>
                                <span style={{ color: "#44ff66" }}>Left: {item.total_count - item.used_count}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {cartSummary.filter(function (s) { return s.item_type === "beverage" }).length > 0 && (
                    <div className="sc-sum-sec">
                      <div className="sc-sum-h sc-sum-hb">🥤 Beverages</div>
                      <div className="sc-sum-box">
                        {cartSummary.filter(function (s) { return s.item_type === "beverage" }).map(function (item) {
                          return (
                            <div key={item.id} className="sc-sum-r">
                              <div className="sc-sum-n">{item.snack_name}</div>
                              <div className="sc-sum-c">
                                <span style={{ color: "#6bb3ff" }}>Total: {item.total_count}</span>
                                <span style={{ color: "#ff5555" }}>Used: {item.used_count}</span>
                                <span style={{ color: "#44ff66" }}>Left: {item.total_count - item.used_count}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}