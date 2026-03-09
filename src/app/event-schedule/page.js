"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import DashboardSidebar from "@/components/DashboardSidebar"
import { supabase } from "@/lib/supabase"

var SCHEDULE = [
  {
    day: 1, date: "May 6 · Tuesday",
    title: "Inauguration & Kickoff",
    subtitle: "Opening ceremony, rules briefing, and team check-in",
    timeline: [
      { time: "09:00 AM", label: "Registration & Check-in" },
      { time: "10:00 AM", label: "Inauguration Ceremony" },
      { time: "11:30 AM", label: "Problem Statement Reveal" },
      { time: "12:30 PM", label: "Lunch Break" },
      { time: "02:00 PM", label: "Development Begins" },
      { time: "06:00 PM", label: "Day 1 Wrap-up" },
    ]
  },
  {
    day: 2, date: "May 7 · Wednesday",
    title: "Development Sprint 1",
    subtitle: "Core feature development and architecture setup",
    timeline: [
      { time: "09:00 AM", label: "Daily Standup" },
      { time: "10:00 AM", label: "Mentor Check-in (Round 1)" },
      { time: "01:00 PM", label: "Lunch Break" },
      { time: "02:00 PM", label: "Sprint Continues" },
      { time: "05:00 PM", label: "Progress Check" },
    ]
  },
  {
    day: 3, date: "May 8 · Thursday",
    title: "Development Sprint 2",
    subtitle: "Feature completion and initial testing",
    timeline: [
      { time: "09:00 AM", label: "Daily Standup" },
      { time: "10:30 AM", label: "Mentor Session (Round 2)" },
      { time: "01:00 PM", label: "Lunch Break" },
      { time: "02:00 PM", label: "Testing & Bug Fixes" },
      { time: "05:30 PM", label: "Day Review" },
    ]
  },
  {
    day: 4, date: "May 9 · Friday",
    title: "Mid-Event Review",
    subtitle: "Jury evaluation and feedback session",
    timeline: [
      { time: "09:30 AM", label: "Team Presentations (Round 1)" },
      { time: "12:00 PM", label: "Jury Feedback" },
      { time: "01:00 PM", label: "Lunch Break" },
      { time: "02:30 PM", label: "Iterative Improvements" },
      { time: "05:00 PM", label: "Evening Wrap-up" },
    ]
  },
  {
    day: 5, date: "May 10 · Saturday",
    title: "Development Sprint 3",
    subtitle: "Polish, UI refinement and feature freeze",
    timeline: [
      { time: "09:00 AM", label: "Daily Standup" },
      { time: "10:00 AM", label: "Final Feature Push" },
      { time: "01:00 PM", label: "Lunch Break" },
      { time: "02:00 PM", label: "UI/UX Polish" },
      { time: "05:00 PM", label: "Feature Freeze" },
    ]
  },
  {
    day: 6, date: "May 11 · Sunday",
    title: "Demo Prep & Dry Run",
    subtitle: "Presentation preparation and practice runs",
    timeline: [
      { time: "09:00 AM", label: "Deployment & Hosting" },
      { time: "11:00 AM", label: "Dry Run with Mentors" },
      { time: "01:00 PM", label: "Lunch Break" },
      { time: "02:00 PM", label: "Presentation Refinement" },
      { time: "04:30 PM", label: "Final Submission" },
    ]
  },
  {
    day: 7, date: "May 12 · Monday",
    title: "Final Demos & Awards",
    subtitle: "Project showcase, jury evaluation and prize ceremony",
    timeline: [
      { time: "09:00 AM", label: "Setup & Stall Decoration" },
      { time: "10:00 AM", label: "Project Demos Open" },
      { time: "12:30 PM", label: "Jury Final Evaluation" },
      { time: "01:30 PM", label: "Lunch Break" },
      { time: "03:00 PM", label: "Results Announcement" },
      { time: "04:00 PM", label: "Prize & Closing Ceremony" },
    ]
  },
]

var EVENT_START = new Date("2026-05-06T09:00:00+05:30")

export default function EventSchedulePage() {
  var router = useRouter()
  var [teamNumber, setTeamNumber] = useState("")
  var [currentMember, setCurrentMember] = useState(null)
  var [loggedInRoll, setLoggedInRoll] = useState("")
  var [isLeader, setIsLeader] = useState(false)
  var [selectedDay, setSelectedDay] = useState(1)

  function getCurrentDay() {
    var now = new Date()
    for (var i = 0; i < 7; i++) {
      var d = new Date(EVENT_START)
      d.setDate(d.getDate() + i)
      if (d.toDateString() === now.toDateString()) return i + 1
    }
    return null
  }

  function getDayStatus(dayNum) {
    var now = new Date()
    var d = new Date(EVENT_START)
    d.setDate(d.getDate() + dayNum - 1)
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    var dayDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    if (dayDate < today) return "past"
    if (dayDate.getTime() === today.getTime()) return "today"
    return "upcoming"
  }

  function getCountdown() {
    var now = new Date()
    var diff = EVENT_START - now
    if (diff <= 0) return null
    var days = Math.floor(diff / 86400000)
    var hrs = Math.floor((diff % 86400000) / 3600000)
    var mins = Math.floor((diff % 3600000) / 60000)
    return { days, hrs, mins }
  }

  useEffect(function () {
    var roll = sessionStorage.getItem("ps_roll") || localStorage.getItem("ps_roll")
    if (!roll) { router.push("/login"); return }
    setLoggedInRoll(roll)
    var tn = sessionStorage.getItem("ps_team_number") || localStorage.getItem("ps_team_number") || ""
    setTeamNumber(tn)

    async function load() {
      if (!tn || !roll) return
      var teamRes = await supabase.from("teams").select("id").eq("team_number", tn).single()
      if (!teamRes.data) return
      var memRes = await supabase.from("team_members").select("*").eq("team_id", teamRes.data.id)
      var me = (memRes.data || []).find(function (m) { return m.member_roll_number === roll })
      if (me) { setCurrentMember(me); setIsLeader(me.is_leader || false) }
    }
    load()

    var currentDayNum = getCurrentDay()
    setSelectedDay(currentDayNum || 1)
  }, [])

  var countdown = getCountdown()
  var currentDayNum = getCurrentDay()
  var selectedDayData = SCHEDULE.find(function (s) { return s.day === selectedDay })

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#000", color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>
      <style jsx>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes nsPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .anim { opacity:0; animation:fadeUp 0.5s cubic-bezier(0.23,1,0.32,1) forwards; }
        .d1{animation-delay:0.05s} .d2{animation-delay:0.12s} .d3{animation-delay:0.2s} .d4{animation-delay:0.28s}

        .scroll-area::-webkit-scrollbar { width:5px; }
        .scroll-area::-webkit-scrollbar-thumb { background:rgba(255,96,64,0.15); border-radius:10px; }

        .day-pill {
          padding:8px 16px; border-radius:50px;
          border:1px solid rgba(255,255,255,0.06);
          background:rgba(255,255,255,0.02);
          font-size:12px; font-weight:500; cursor:pointer;
          transition:all 0.25s; color:rgba(255,255,255,0.35);
          display:flex; flex-direction:column; align-items:center; gap:2px;
          min-width:72px; text-align:center;
        }
        .day-pill:hover { border-color:rgba(255,96,64,0.2); color:rgba(255,255,255,0.6); }
        .day-pill.active { background:linear-gradient(135deg,#ff3020,#ff6040); border-color:transparent; color:#fff; box-shadow:0 4px 16px rgba(255,48,32,0.25); }
        .day-pill.today-pill { border-color:rgba(255,96,64,0.3); color:#ff6040; }
        .day-pill.past-pill { opacity:0.45; }

        .timeline-item { display:flex; align-items:flex-start; gap:16px; padding:14px 0; border-bottom:1px solid rgba(255,255,255,0.03); transition:all 0.2s; }
        .timeline-item:hover { padding-left:4px; }
        .timeline-item:last-child { border-bottom:none; }

        .card { background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.07); border-radius:16px; transition:all 0.3s; }
        .card:hover { border-color:rgba(255,96,64,0.12); }

        .slbl { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:3px; color:rgba(255,255,255,0.2); margin-bottom:16px; display:flex; align-items:center; gap:8px; }
        .slbl::before { content:''; width:3px; height:12px; border-radius:2px; background:linear-gradient(180deg,#ff3020,#ff6040); display:inline-block; }

        @media(max-width:768px) {
          .main-grid { grid-template-columns:1fr !important; }
          .countdown-grid { grid-template-columns:repeat(3,1fr) !important; }
          .day-pills { flex-wrap:wrap; }
        }
      `}</style>

      <DashboardSidebar teamNumber={teamNumber} currentMember={currentMember} loggedInRoll={loggedInRoll} isLeader={isLeader} />

      <div className="scroll-area" style={{ flex: 1, padding: "36px 48px 80px", overflowY: "auto", maxHeight: "100vh" }}>

        <div className="anim d1" style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Genos', sans-serif", fontSize: 30, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>Event Schedule</h1>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>May 6 – 12, 2026 · 7 Days</div>
        </div>

        {/* COUNTDOWN or LIVE BANNER */}
        {countdown ? (
          <div className="card anim d2" style={{ padding: "28px 32px", marginBottom: 28, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#ff3020,#ff6040,transparent)" }} />
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 3, color: "rgba(255,255,255,0.2)", marginBottom: 16 }}>Event Starts In</div>
            <div className="countdown-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, maxWidth: 360 }}>
              {[
                { val: countdown.days, label: "Days" },
                { val: countdown.hrs, label: "Hours" },
                { val: countdown.mins, label: "Minutes" },
              ].map(function (c) {
                return (
                  <div key={c.label} style={{ textAlign: "center", padding: "16px 12px", borderRadius: 12, background: "rgba(255,48,32,0.04)", border: "1px solid rgba(255,48,32,0.1)" }}>
                    <div style={{ fontFamily: "'Genos', sans-serif", fontSize: 42, fontWeight: 700, color: "#ff6040", lineHeight: 1 }}>{String(c.val).padStart(2, "0")}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: 2, marginTop: 4 }}>{c.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : currentDayNum ? (
          <div className="anim d2" style={{ padding: "16px 24px", marginBottom: 28, borderRadius: 14, background: "rgba(255,48,32,0.06)", border: "1px solid rgba(255,48,32,0.15)", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff3020", boxShadow: "0 0 10px rgba(255,48,32,0.5)", animation: "nsPulse 2s ease-in-out infinite" }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Event is Live — Day {currentDayNum}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{SCHEDULE[currentDayNum - 1]?.title}</div>
            </div>
          </div>
        ) : null}

        {/* DAY SELECTOR */}
        <div className="anim d3" style={{ marginBottom: 28 }}>
          <div className="slbl">Select Day</div>
          <div className="day-pills" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {SCHEDULE.map(function (s) {
              var status = getDayStatus(s.day)
              var isActive = selectedDay === s.day
              return (
                <button
                  key={s.day}
                  className={"day-pill " + (isActive ? "active" : status === "today" && !isActive ? "today-pill" : status === "past" ? "past-pill" : "")}
                  onClick={function () { setSelectedDay(s.day) }}
                >
                  <span style={{ fontFamily: "'Genos', sans-serif", fontSize: 20, fontWeight: 700, lineHeight: 1 }}>D{s.day}</span>
                  <span style={{ fontSize: 10, opacity: 0.7 }}>{s.date.split("·")[0].trim()}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="main-grid anim d4" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>

          {/* LEFT: Selected day detail */}
          {selectedDayData && (
            <div>
              <div className="slbl">Day {selectedDayData.day} · {selectedDayData.date}</div>
              <div className="card" style={{ padding: "28px 28px 20px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#ff3020,#ff6040,transparent)" }} />

                {getDayStatus(selectedDayData.day) === "today" && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 20, background: "rgba(255,48,32,0.08)", border: "1px solid rgba(255,48,32,0.15)", fontSize: 10, color: "#ff6040", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff3020", display: "inline-block" }} />
                    Today
                  </div>
                )}
                {getDayStatus(selectedDayData.day) === "past" && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14 }}>
                    Completed
                  </div>
                )}

                <div style={{ fontFamily: "'Genos', sans-serif", fontSize: 26, fontWeight: 700, marginBottom: 6, color: getDayStatus(selectedDayData.day) === "past" ? "rgba(255,255,255,0.45)" : "#fff" }}>{selectedDayData.title}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginBottom: 28 }}>{selectedDayData.subtitle}</div>

                {selectedDayData.timeline.map(function (t, i) {
                  return (
                    <div key={i} className="timeline-item">
                      <div style={{ minWidth: 72, fontSize: 11, color: "rgba(255,96,64,0.6)", fontWeight: 600, paddingTop: 2, letterSpacing: 0.5 }}>{t.time}</div>
                      <div style={{ flex: 1, display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 6 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: getDayStatus(selectedDayData.day) === "today" ? "#ff6040" : "rgba(255,255,255,0.12)", flexShrink: 0 }} />
                          {i < selectedDayData.timeline.length - 1 && <div style={{ width: 1, flex: 1, background: "rgba(255,255,255,0.04)", marginTop: 4, minHeight: 20 }} />}
                        </div>
                        <div style={{ fontSize: 14, color: getDayStatus(selectedDayData.day) === "past" ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.75)", paddingBottom: 8 }}>{t.label}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* RIGHT: Week overview */}
          <div>
            <div className="slbl">Week Overview</div>
            <div className="card" style={{ padding: "20px 24px" }}>
              {SCHEDULE.map(function (s, i) {
                var status = getDayStatus(s.day)
                var isActive = selectedDay === s.day
                return (
                  <div
                    key={s.day}
                    onClick={function () { setSelectedDay(s.day) }}
                    style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: i < SCHEDULE.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none", cursor: "pointer", transition: "all 0.2s", opacity: status === "past" ? 0.5 : 1 }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Genos', sans-serif", fontSize: 18, fontWeight: 700, background: isActive ? "linear-gradient(135deg,#ff3020,#ff6040)" : status === "today" ? "rgba(255,48,32,0.1)" : "rgba(255,255,255,0.03)", color: isActive ? "#fff" : status === "today" ? "#ff6040" : "rgba(255,255,255,0.25)", border: status === "today" && !isActive ? "1px solid rgba(255,48,32,0.2)" : "1px solid rgba(255,255,255,0.04)", transition: "all 0.25s" }}>{s.day}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: isActive ? 600 : 500, color: isActive ? "#fff" : "rgba(255,255,255,0.55)", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.title}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>{s.date}</div>
                    </div>
                    {status === "past" && (
                      <div style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    )}
                    {status === "today" && (
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#ff3020", boxShadow: "0 0 8px rgba(255,48,32,0.5)", flexShrink: 0 }} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}