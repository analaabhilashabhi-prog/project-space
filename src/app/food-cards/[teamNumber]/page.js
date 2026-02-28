"use client"
import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import SubtleBackground from "@/components/SubtleBackground"
import DashboardSidebar from "@/components/DashboardSidebar"

export default function FoodCardsPage() {
  var params = useParams()
  var router = useRouter()
  var teamNumber = params.teamNumber

  var [team, setTeam] = useState(null)
  var [currentMember, setCurrentMember] = useState(null)
  var [isLeader, setIsLeader] = useState(false)
  var [loggedInRoll, setLoggedInRoll] = useState("")
  var [loading, setLoading] = useState(true)
  var [todayCodes, setTodayCodes] = useState([])
  var [allCodes, setAllCodes] = useState([])
  var [currentDay, setCurrentDay] = useState(1)
  var [viewDay, setViewDay] = useState(null) // null = today, or 1-7
  var [showPin, setShowPin] = useState(false)
  var [studentPin, setStudentPin] = useState("") // actual pin not stored, just display state
  var [consumedMap, setConsumedMap] = useState({})

  // Event dates
  var eventStart = new Date("2026-05-06T00:00:00")

  function getEventDay() {
    var now = new Date()
    var diff = Math.floor((now - eventStart) / (1000 * 60 * 60 * 24))
    if (diff < 0) return 1
    if (diff > 6) return 7
    return diff + 1
  }

  var fetchCodes = useCallback(async function (roll) {
    var { data: codes } = await supabase
      .from("food_codes")
      .select("*")
      .eq("roll_number", roll)
      .order("day_number", { ascending: true })
      .order("meal_slot", { ascending: true })

    if (codes && codes.length > 0) {
      setAllCodes(codes)
      var day = getEventDay()
      setCurrentDay(day)
      setViewDay(day)
      filterCodesForDay(codes, day)
    }
    // eslint-disable-next-line
  }, [])

  function filterCodesForDay(codes, day) {
    var filtered = codes.filter(function (c) { return c.day_number === day })
    setTodayCodes(filtered)

    // Build consumed map
    var cMap = {}
    filtered.forEach(function (c) {
      if (c.is_consumed) {
        cMap[c.meal_code] = c.consumed_at
      }
    })
    setConsumedMap(cMap)
  }

  function switchDay(day) {
    setViewDay(day)
    filterCodesForDay(allCodes, day)
  }

  useEffect(function () {
    var roll = sessionStorage.getItem("ps_roll") || localStorage.getItem("ps_roll")
    if (!roll) { router.push("/login"); return }
    setLoggedInRoll(roll)

    async function fetchData() {
      var teamRes = await supabase.from("teams").select("*").eq("team_number", teamNumber).single()
      if (teamRes.data) {
        setTeam(teamRes.data)
        var memberRes = await supabase.from("team_members").select("*").eq("team_id", teamRes.data.id).eq("member_roll_number", roll).single()
        if (memberRes.data) {
          setCurrentMember(memberRes.data)
          setIsLeader(memberRes.data.is_leader || false)
        }
      }

      await fetchCodes(roll)
      setLoading(false)
    }

    if (teamNumber) fetchData()

    // Real-time subscription for consumed updates
    var channel = supabase
      .channel("food-codes-changes")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "food_codes" }, function (payload) {
        if (payload.new && payload.new.roll_number === roll) {
          fetchCodes(roll)
        }
      })
      .subscribe()

    return function () { supabase.removeChannel(channel) }
  }, [teamNumber, router, fetchCodes])

  function getMealIcon(slot) {
    if (slot === "snack") return "\uD83C\uDF6A"
    if (slot === "beverage") return "\u2615"
    return "\uD83C\uDF7D\uFE0F"
  }

  function getMealLabel(slot) {
    if (slot === "snack") return "Snack"
    if (slot === "beverage") return "Beverage"
    return slot
  }

  function formatTime(ts) {
    if (!ts) return ""
    var d = new Date(ts)
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
  }

  var consumedCount = todayCodes.filter(function (c) { return c.is_consumed }).length
  var totalCount = todayCodes.length
  var dayLabels = ["Day 1 - Wed", "Day 2 - Thu", "Day 3 - Fri", "Day 4 - Sat", "Day 5 - Sun", "Day 6 - Mon", "Day 7 - Tue"]

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <SubtleBackground />
        <div style={{ position: "relative", zIndex: 10 }}><div className="ps-spinner" style={{ width: 32, height: 32 }} /></div>
      </div>
    )
  }

  if (allCodes.length === 0) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>
        <SubtleBackground />
        <DashboardSidebar teamNumber={teamNumber} currentMember={currentMember} loggedInRoll={loggedInRoll} isLeader={isLeader} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1, gap: 16 }}>
          <span style={{ fontSize: 48 }}>{"\uD83C\uDF7D\uFE0F"}</span>
          <div style={{ fontFamily: "'Genos', sans-serif", fontSize: 24, fontWeight: 700, color: "#fff" }}>No Food Codes Yet</div>
          <div style={{ fontSize: 14, color: "#666" }}>Complete your food selection first to get your meal codes.</div>
          <button onClick={function () { router.push("/food-selection/" + teamNumber) }} style={{
            padding: "12px 28px", borderRadius: 12, border: "none",
            background: "linear-gradient(135deg,#ff3020,#ff6040)", color: "#fff",
            fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 8,
          }}>Go to Food Selection {"\u2192"}</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: "'DM Sans', sans-serif", overflow: "hidden" }}>
      <SubtleBackground />

      <style jsx>{`
        .fc-top { display:flex; align-items:center; justify-content:space-between; padding:18px 32px; border-bottom:1px solid rgba(255,255,255,0.05); background:rgba(10,10,10,0.8); backdrop-filter:blur(15px); position:sticky; top:0; z-index:40; }
        .fc-title { font-family:'Genos',sans-serif; font-size:28px; font-weight:800; color:#fff; letter-spacing:1px; text-transform:uppercase; }
        .fc-user { font-size:13px; color:#666; }
        .fc-user strong { color:#ff6040; }

        .fc-day-bar { display:flex; gap:4px; padding:16px 32px; overflow-x:auto; border-bottom:1px solid rgba(255,255,255,0.03); }
        .fc-day-btn { padding:8px 16px; border-radius:10px; border:1px solid rgba(255,255,255,0.06); background:rgba(255,255,255,0.02); color:#666; font-family:'Genos',sans-serif; font-size:13px; font-weight:700; letter-spacing:1px; cursor:pointer; transition:all 0.2s ease; white-space:nowrap; flex-shrink:0; }
        .fc-day-btn:hover { border-color:rgba(255,60,30,0.3); color:#aaa; }
        .fc-day-btn.active { border-color:rgba(255,60,30,0.5); background:rgba(255,60,30,0.12); color:#ff6040; }
        .fc-day-btn.today { position:relative; }
        .fc-day-btn.today::after { content:'TODAY'; position:absolute; top:-8px; right:-4px; font-size:8px; padding:2px 5px; border-radius:4px; background:#ff6040; color:#fff; letter-spacing:0.5px; }

        .fc-content { padding:24px 32px; flex:1; }

        .fc-pin-bar { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-radius:14px; border:1px solid rgba(255,60,30,0.12); background:rgba(255,60,30,0.04); margin-bottom:20px; }
        .fc-pin-left { display:flex; align-items:center; gap:12px; }
        .fc-pin-icon { font-size:24px; }
        .fc-pin-label { font-size:13px; color:rgba(255,255,255,0.4); }
        .fc-pin-value { font-family:'Genos',sans-serif; font-size:28px; font-weight:900; letter-spacing:8px; color:#fff; }
        .fc-pin-hidden { font-size:28px; letter-spacing:6px; color:#555; }
        .fc-pin-toggle { padding:8px 16px; border-radius:8px; border:1px solid rgba(255,60,30,0.2); background:rgba(255,60,30,0.06); color:#ff6040; font-size:12px; font-family:'Genos',sans-serif; font-weight:700; letter-spacing:1.5px; cursor:pointer; transition:all 0.2s ease; }
        .fc-pin-toggle:hover { background:rgba(255,60,30,0.12); }

        .fc-progress { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
        .fc-progress-text { font-size:13px; color:#666; }
        .fc-progress-bar { flex:1; margin:0 16px; height:6px; border-radius:3px; background:rgba(255,255,255,0.06); overflow:hidden; }
        .fc-progress-fill { height:100%; border-radius:3px; transition:width 0.5s ease; }

        .fc-card { padding:20px; border-radius:16px; border:1px solid rgba(255,255,255,0.06); background:rgba(255,255,255,0.02); margin-bottom:12px; display:flex; align-items:center; justify-content:space-between; transition:all 0.3s ease; }
        .fc-card:hover { border-color:rgba(255,255,255,0.1); }
        .fc-card.consumed { border-color:rgba(50,200,80,0.15); background:rgba(50,200,80,0.03); }
        .fc-card-left { display:flex; align-items:center; gap:16px; }
        .fc-card-icon { font-size:32px; width:48px; height:48px; display:flex; align-items:center; justify-content:center; border-radius:12px; background:rgba(255,255,255,0.03); }
        .fc-card-info {}
        .fc-card-slot { font-family:'Genos',sans-serif; font-size:12px; font-weight:700; color:#888; letter-spacing:1.5px; text-transform:uppercase; }
        .fc-card-item { font-size:16px; font-weight:600; color:#fff; margin-top:2px; }
        .fc-card-right { text-align:right; }
        .fc-card-code { font-family:'Genos',sans-serif; font-size:36px; font-weight:900; letter-spacing:6px; }
        .fc-card-code.active { color:#ff6040; }
        .fc-card-code.used { color:#4ade80; text-decoration:line-through; opacity:0.6; }
        .fc-card-status { font-size:11px; margin-top:4px; font-family:'Genos',sans-serif; letter-spacing:1px; }
        .fc-card-status.active { color:#ff6040; }
        .fc-card-status.used { color:#4ade80; }

        .fc-badge { display:inline-block; padding:3px 10px; border-radius:50px; font-family:'Genos',sans-serif; font-size:11px; font-weight:700; letter-spacing:1px; }
        .fc-badge.active { background:rgba(255,60,30,0.1); border:1px solid rgba(255,60,30,0.2); color:#ff6040; }
        .fc-badge.consumed { background:rgba(50,200,80,0.1); border:1px solid rgba(50,200,80,0.2); color:#4ade80; }

        .fc-hint { text-align:center; padding:20px; font-size:13px; color:#444; border-radius:14px; border:1px dashed rgba(255,255,255,0.06); margin-top:16px; }

        @media (max-width:640px) {
          .fc-top { padding:14px 16px; }
          .fc-title { font-size:22px; }
          .fc-day-bar { padding:12px 16px; }
          .fc-content { padding:16px; }
          .fc-card { flex-direction:column; align-items:flex-start; gap:12px; }
          .fc-card-right { text-align:left; }
          .fc-card-code { font-size:28px; }
          .fc-pin-bar { flex-direction:column; gap:12px; align-items:flex-start; }
        }
      `}</style>

      <DashboardSidebar teamNumber={teamNumber} currentMember={currentMember} loggedInRoll={loggedInRoll} isLeader={isLeader} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflowY: "auto", position: "relative", zIndex: 1 }}>

        {/* Top Bar */}
        <div className="fc-top">
          <div className="fc-title">{"\uD83C\uDFAB"} Your Food Card</div>
          <div className="fc-user">
            <strong>{currentMember ? currentMember.member_name : loggedInRoll}</strong>
          </div>
        </div>

        {/* Day Selector */}
        <div className="fc-day-bar">
          {[1, 2, 3, 4, 5, 6, 7].map(function (d) {
            var isToday = d === currentDay
            var isActive = d === viewDay
            return (
              <button key={d} className={"fc-day-btn" + (isActive ? " active" : "") + (isToday ? " today" : "")} onClick={function () { switchDay(d) }}>
                Day {d}
              </button>
            )
          })}
        </div>

        <div className="fc-content">

          {/* Day Header */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: "'Genos', sans-serif", fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: 1 }}>
              {"\uD83C\uDFAB"} {dayLabels[viewDay - 1] || "Day " + viewDay}
              {viewDay === currentDay && <span style={{ fontSize: 12, color: "#ff6040", marginLeft: 10, fontWeight: 400 }}>{"(Today)"}</span>}
            </div>
          </div>

          {/* PIN Bar */}
          <div className="fc-pin-bar">
            <div className="fc-pin-left">
              <span className="fc-pin-icon">{"\uD83D\uDD10"}</span>
              <div>
                <div className="fc-pin-label">Your Secret PIN</div>
                <div className={showPin ? "fc-pin-value" : "fc-pin-hidden"}>
                  {showPin ? "\u2022\u2022\u2022\u2022" : "\u25CF\u25CF\u25CF\u25CF"}
                </div>
              </div>
            </div>
            <button className="fc-pin-toggle" onClick={function () { setShowPin(!showPin) }}>
              {showPin ? "\uD83D\uDE48 HIDE" : "\uD83D\uDC41 SHOW"}
            </button>
          </div>

          {/* Progress */}
          <div className="fc-progress">
            <span className="fc-progress-text">{consumedCount}/{totalCount} consumed</span>
            <div className="fc-progress-bar">
              <div className="fc-progress-fill" style={{
                width: totalCount > 0 ? (consumedCount / totalCount * 100) + "%" : "0%",
                background: consumedCount === totalCount ? "linear-gradient(90deg,#4ade80,#22c55e)" : "linear-gradient(90deg,#ff3020,#ff6040)",
              }} />
            </div>
            <span className="fc-progress-text" style={{ color: consumedCount === totalCount ? "#4ade80" : "#888" }}>
              {consumedCount === totalCount && totalCount > 0 ? "\u2705 All done!" : (totalCount - consumedCount) + " remaining"}
            </span>
          </div>

          {/* Meal Cards */}
          {todayCodes.length > 0 ? todayCodes.map(function (code) {
            var isConsumed = code.is_consumed
            return (
              <div key={code.id} className={"fc-card" + (isConsumed ? " consumed" : "")}>
                <div className="fc-card-left">
                  <div className="fc-card-icon">{getMealIcon(code.meal_slot)}</div>
                  <div className="fc-card-info">
                    <div className="fc-card-slot">{getMealLabel(code.meal_slot)}</div>
                    <div className="fc-card-item">{code.food_item || "—"}</div>
                  </div>
                </div>
                <div className="fc-card-right">
                  <div className={"fc-card-code " + (isConsumed ? "used" : "active")}>{code.meal_code}</div>
                  {isConsumed ? (
                    <div className="fc-card-status used">{"\u2705"} Consumed {formatTime(code.consumed_at)}</div>
                  ) : (
                    <span className="fc-badge active">{"\uD83D\uDFE2"} Active</span>
                  )}
                </div>
              </div>
            )
          }) : (
            <div className="fc-hint">
              No meal codes for this day. Select a different day above.
            </div>
          )}

          {/* Hint */}
          <div className="fc-hint" style={{ marginTop: 24, borderStyle: "solid", borderColor: "rgba(255,60,30,0.1)" }}>
            {"\uD83D\uDCA1"} At the food counter: Tell admin your <strong style={{ color: "#ff6040" }}>meal code</strong> + <strong style={{ color: "#ff6040" }}>secret PIN</strong>
          </div>

          <div style={{ height: 40 }} />
        </div>
      </div>
    </div>
  )
}