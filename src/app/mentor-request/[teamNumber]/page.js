"use client"
import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import DashboardSidebar from "@/components/DashboardSidebar"

var PRIORITIES = [
  { label: "Low", color: "#34d399", bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.25)", icon: "M12 8v4m0 4h.01" },
  { label: "Medium", color: "#fbbf24", bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.25)", icon: "M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" },
  { label: "High", color: "#f97316", bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.25)", icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z" },
  { label: "Critical", color: "#ff3020", bg: "rgba(255,48,32,0.1)", border: "rgba(255,48,32,0.25)", icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM12 8v4M12 16h.01" },
]

var STATUS_STYLES = {
  "Pending": { color: "#fbbf24", bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.2)", icon: "M12 2v4m0 12v4M4.93 4.93l2.83 2.83M14.24 14.24l2.83 2.83M2 12h4m12 0h4" },
  "Self Resolved": { color: "#34d399", bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.2)", icon: "M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" },
  "Mentor Resolved": { color: "#60a5fa", bg: "rgba(96,165,250,0.1)", border: "rgba(96,165,250,0.2)", icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 0 0-1.946-.806 3.42 3.42 0 0 0-4.438 3.42 3.42 3.42 0 0 0 .806 1.946" },
}

var TECH_COLORS = {
  "Data Specialist": "#60a5fa",
  "AWS Development with DevOps": "#f97316",
  "SERVICE NOW": "#a78bfa",
  "FSD With Flutter": "#34d399",
  "FSD With React Native": "#fb7185",
  "VLSI": "#fbbf24",
}

export default function MentorRequestPage() {
  var params = useParams()
  var router = useRouter()
  var teamNumber = params.teamNumber

  var [team, setTeam] = useState(null)
  var [currentMember, setCurrentMember] = useState(null)
  var [isLeader, setIsLeader] = useState(false)
  var [loggedInRoll, setLoggedInRoll] = useState("")
  var [loading, setLoading] = useState(true)

  // Mentors from Supabase
  var [allMentors, setAllMentors] = useState([])
  var [technologies, setTechnologies] = useState([])
  var [requests, setRequests] = useState([])
  var [hasActive, setHasActive] = useState(false)

  // Form
  var [technology, setTechnology] = useState("")
  var [filteredMentors, setFilteredMentors] = useState([])
  var [selectedMentor, setSelectedMentor] = useState(null)
  var [description, setDescription] = useState("")
  var [priority, setPriority] = useState("")
  var [submitting, setSubmitting] = useState(false)
  var [submitMsg, setSubmitMsg] = useState("")
  var [resolvingId, setResolvingId] = useState(null)
  var [deletingId, setDeletingId] = useState(null)
  var [ratingId, setRatingId] = useState(null)
  var [hoverStar, setHoverStar] = useState(0)

  // Mentor workload (count of active requests per mentor)
  var [mentorWorkload, setMentorWorkload] = useState({})

  useEffect(function () {
    var roll = sessionStorage.getItem("ps_roll") || localStorage.getItem("ps_roll")
    if (!roll) { router.push("/login"); return }
    setLoggedInRoll(roll)

    async function load() {
      // Team
      var teamRes = await supabase.from("teams").select("*").eq("team_number", teamNumber).single()
      if (!teamRes.data) { setLoading(false); return }
      setTeam(teamRes.data)

      // Current member
      var memRes = await supabase.from("team_members").select("*").eq("team_id", teamRes.data.id)
      var me = (memRes.data || []).find(function (m) { return m.member_roll_number === roll })
      if (me) { setCurrentMember(me); setIsLeader(me.is_leader || false) }

      // Mentors from Supabase
      var mentorRes = await supabase.from("mentors").select("*").eq("available", true).order("name")
      var mentors = mentorRes.data || []
      setAllMentors(mentors)

      // Extract unique technologies
      var techSet = {}
      mentors.forEach(function (m) { if (m.technology) techSet[m.technology] = true })
      setTechnologies(Object.keys(techSet).sort())

      // Requests for this team
      var reqRes = await supabase.from("mentor_requests").select("*").eq("team_number", teamNumber).order("created_at", { ascending: false })
      var reqs = reqRes.data || []
      setRequests(reqs)
      setHasActive(reqs.some(function (r) { return r.status === "Pending" }))

      // Mentor workload — count pending requests per mentor
      var workloadRes = await supabase.from("mentor_requests").select("mentor_name").eq("status", "Pending")
      var wl = {}
      if (workloadRes.data) {
        workloadRes.data.forEach(function (r) { wl[r.mentor_name] = (wl[r.mentor_name] || 0) + 1 })
      }
      setMentorWorkload(wl)

      setLoading(false)
    }
    load()

    // Real-time subscription
    var channel = supabase.channel("mentor-requests-" + teamNumber)
      .on("postgres_changes", { event: "*", schema: "public", table: "mentor_requests", filter: "team_number=eq." + teamNumber }, function (payload) {
        if (payload.eventType === "INSERT") {
          setRequests(function (prev) { return [payload.new].concat(prev) })
          setHasActive(true)
        } else if (payload.eventType === "UPDATE") {
          setRequests(function (prev) {
            return prev.map(function (r) { return r.id === payload.new.id ? payload.new : r })
          })
          if (payload.new.status !== "Pending") {
            setHasActive(false)
          }
        }
      })
      .subscribe()

    return function () { supabase.removeChannel(channel) }
  }, [teamNumber, router])

  function onTechChange(tech) {
    setTechnology(tech)
    setSelectedMentor(null)
    setFilteredMentors(allMentors.filter(function (m) { return m.technology === tech }))
  }

  async function handleSubmit() {
    if (!technology || !selectedMentor || !description.trim() || !priority) {
      setSubmitMsg("error:Please fill all fields."); return
    }
    if (hasActive) {
      setSubmitMsg("error:You have an active request. Resolve it first."); return
    }
    setSubmitting(true); setSubmitMsg("")

    try {
      var res = await fetch("/api/mentor-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamNumber: teamNumber,
          teamId: team ? team.id : null,
          mentorId: selectedMentor.id,
          mentorName: selectedMentor.name,
          mentorEmail: selectedMentor.email,
          technology: technology,
          issueDescription: description.trim(),
          priority: priority,
          requestedByRoll: loggedInRoll,
          requestedByName: currentMember ? currentMember.member_name : "",
        })
      })
      var data = await res.json()
      if (data.success) {
        if (data.request) setRequests(function (prev) { return [data.request].concat(prev) })
        setHasActive(true)
        setTechnology(""); setSelectedMentor(null); setFilteredMentors([]); setDescription(""); setPriority("")
        setSubmitMsg("success:Request sent! " + data.mentorName + " will be notified via email.")
        // Update workload
        setMentorWorkload(function (prev) { var n = Object.assign({}, prev); n[data.mentorName] = (n[data.mentorName] || 0) + 1; return n })
      } else {
        setSubmitMsg("error:" + (data.error || "Failed to submit."))
      }
    } catch (e) { setSubmitMsg("error:Something went wrong.") }
    setSubmitting(false)
  }

  async function markSelfResolved(id) {
    setResolvingId(id)
    try {
      var res = await fetch("/api/mentor-request", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: id, action: "self_resolve" })
      })
      var data = await res.json()
      if (data.success) {
        setRequests(function (prev) { return prev.map(function (r) { return r.id === id ? Object.assign({}, r, { status: "Self Resolved", resolved_at: new Date().toISOString() }) : r }) })
        setHasActive(false)
      }
    } catch (e) {}
    setResolvingId(null)
  }

  async function deleteRequest(id) {
    if (!confirm("Delete this request? This cannot be undone.")) return
    setDeletingId(id)
    try {
      var res = await fetch("/api/mentor-request?id=" + id, { method: "DELETE" })
      var data = await res.json()
      if (data.success) {
        var deleted = requests.find(function (r) { return r.id === id })
        setRequests(function (prev) { return prev.filter(function (r) { return r.id !== id }) })
        if (deleted && deleted.status === "Pending") setHasActive(false)
      }
    } catch (e) {}
    setDeletingId(null)
  }

  async function submitRating(id, stars) {
    try {
      await fetch("/api/mentor-request", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: id, action: "rate", rating: stars })
      })
      setRequests(function (prev) { return prev.map(function (r) { return r.id === id ? Object.assign({}, r, { rating: stars }) : r }) })
      setRatingId(null)
    } catch (e) {}
  }

  // Time ago helper
  function timeAgo(dateStr) {
    if (!dateStr) return ""
    var diff = Date.now() - new Date(dateStr).getTime()
    var mins = Math.floor(diff / 60000)
    if (mins < 1) return "Just now"
    if (mins < 60) return mins + "m ago"
    var hrs = Math.floor(mins / 60)
    if (hrs < 24) return hrs + "h ago"
    return Math.floor(hrs / 24) + "d ago"
  }

  // Estimated wait time based on avg resolution
  function getEstimatedWait(mentorName) {
    var resolved = requests.filter(function (r) { return r.mentor_name === mentorName && r.resolved_at && r.created_at })
    if (resolved.length === 0) return "~15 min"
    var totalMs = 0
    resolved.forEach(function (r) { totalMs += new Date(r.resolved_at).getTime() - new Date(r.created_at).getTime() })
    var avgMins = Math.round(totalMs / resolved.length / 60000)
    if (avgMins < 60) return "~" + avgMins + " min"
    return "~" + Math.round(avgMins / 60) + " hr"
  }

  var userName = currentMember ? currentMember.member_name : ""

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "#000" }}>
        <DashboardSidebar teamNumber={teamNumber} currentMember={currentMember} loggedInRoll={loggedInRoll} isLeader={isLeader} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,#ff3020,#ff6040)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif", fontWeight: 900, fontSize: 18, color: "#fff", margin: "0 auto 12px", animation: "pulse 1s ease-in-out infinite" }}>PS</div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, letterSpacing: 3, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>Loading</div>
          </div>
          <style>{`@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}`}</style>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#000", color: "#fff", fontFamily: "'DM Sans',sans-serif" }}>
      <style jsx>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
        @keyframes glow{0%,100%{box-shadow:0 0 8px rgba(255,48,32,0.2)}50%{box-shadow:0 0 20px rgba(255,48,32,0.4)}}
        .anim{opacity:0;animation:fadeUp 0.5s cubic-bezier(0.23,1,0.32,1) forwards}
        .d1{animation-delay:0.06s}.d2{animation-delay:0.12s}.d3{animation-delay:0.18s}.d4{animation-delay:0.24s}.d5{animation-delay:0.3s}
        .glass{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:16px;backdrop-filter:blur(8px);position:relative;overflow:hidden}
        .glass::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#ff3020,#ff6040,transparent)}
        .slbl{font-family:'DM Sans',sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:3px;color:rgba(255,255,255,0.25);margin-bottom:12px;padding-left:12px;position:relative}
        .slbl::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:12px;border-radius:2px;background:linear-gradient(180deg,#ff3020,#ff6040)}
        .tech-pill{padding:10px 18px;border-radius:50px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.02);font-size:12px;font-weight:500;color:rgba(255,255,255,0.4);cursor:pointer;transition:all 0.3s;white-space:nowrap;display:flex;align-items:center;gap:6px}
        .tech-pill:hover{border-color:rgba(255,96,64,0.3);color:#ff6040;background:rgba(255,96,64,0.04)}
        .tech-pill.on{border-color:#ff3020;background:linear-gradient(135deg,rgba(255,48,32,0.15),rgba(255,96,64,0.08));color:#ff6040;box-shadow:0 0 16px rgba(255,48,32,0.12)}
        .mentor-card{padding:16px 18px;border-radius:14px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.02);cursor:pointer;transition:all 0.3s;display:flex;align-items:center;gap:12px;position:relative}
        .mentor-card:hover{border-color:rgba(255,96,64,0.2);background:rgba(255,96,64,0.03);transform:translateY(-2px)}
        .mentor-card.on{border-color:rgba(255,96,64,0.4);background:rgba(255,96,64,0.06);box-shadow:0 4px 20px rgba(255,48,32,0.1)}
        .pri-btn{flex:1;padding:12px 8px;border-radius:12px;border:1px solid;cursor:pointer;transition:all 0.3s;text-align:center;font-size:12px;font-weight:600;letter-spacing:0.5px;display:flex;align-items:center;justify-content:center;gap:6px}
        .pri-btn:hover{transform:translateY(-2px)}
        .pri-btn.on{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,0.4)}
        .submit-btn{width:100%;padding:16px;border-radius:14px;border:none;background:linear-gradient(135deg,#ff3020,#ff6040);color:#fff;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:700;letter-spacing:1px;cursor:pointer;transition:all 0.3s}
        .submit-btn:hover{box-shadow:0 8px 32px rgba(255,48,32,0.35);transform:translateY(-2px)}
        .submit-btn:disabled{opacity:0.5;cursor:not-allowed;transform:none}
        .inp{width:100%;padding:14px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;color:#fff;font-family:'DM Sans',sans-serif;font-size:13px;resize:vertical;outline:none;transition:border 0.2s;box-sizing:border-box}
        .inp:focus{border-color:rgba(255,96,64,0.35);background:rgba(255,96,64,0.02)}
        .req-card{padding:20px;border-radius:14px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.015);margin-bottom:12px;transition:all 0.25s}
        .req-card:hover{border-color:rgba(255,255,255,0.1);background:rgba(255,255,255,0.025)}
        .badge{display:inline-flex;align-items:center;gap:4px;padding:4px 12px;border-radius:20px;font-size:10px;font-weight:600;letter-spacing:0.5px;white-space:nowrap}
        .resolve-btn{padding:6px 14px;border-radius:8px;border:1px solid rgba(52,211,153,0.3);background:rgba(52,211,153,0.06);color:#34d399;font-size:11px;font-weight:600;cursor:pointer;transition:all 0.2s;white-space:nowrap}
        .resolve-btn:hover{background:rgba(52,211,153,0.12);border-color:rgba(52,211,153,0.5)}
        .star{cursor:pointer;transition:all 0.15s;font-size:18px}
        .star:hover{transform:scale(1.2)}
        .workload-dot{width:6px;height:6px;border-radius:50%;display:inline-block}
        .scroll-area::-webkit-scrollbar{width:5px}.scroll-area::-webkit-scrollbar-thumb{background:rgba(255,96,64,0.15);border-radius:10px}
      `}</style>

      <DashboardSidebar teamNumber={teamNumber} currentMember={currentMember} loggedInRoll={loggedInRoll} isLeader={isLeader} />

      <div className="scroll-area" style={{ flex: 1, padding: "32px 44px 80px", overflowY: "auto", maxHeight: "100vh" }}>

        {/* HEADER */}
        <div className="anim d1" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Request Mentor</h1>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>Raise a help request — your mentor will be notified via email</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {hasActive && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fbbf24", animation: "pulse 1.5s infinite" }} />
                <span style={{ fontSize: 11, color: "#fbbf24", fontWeight: 600 }}>Active Request</span>
              </div>
            )}
            <div style={{ fontSize: 13, fontWeight: 700, color: "#ff6040", background: "rgba(255,96,64,0.07)", border: "1px solid rgba(255,96,64,0.12)", padding: "5px 14px", borderRadius: 20, letterSpacing: 1 }}>{teamNumber}</div>
          </div>
        </div>

        {/* STATS ROW */}
        <div className="anim d2" style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total Requests", value: requests.length, color: "#ff6040" },
            { label: "Pending", value: requests.filter(function (r) { return r.status === "Pending" }).length, color: "#fbbf24" },
            { label: "Resolved", value: requests.filter(function (r) { return r.status !== "Pending" }).length, color: "#34d399" },
            { label: "Avg Rating", value: (function () { var rated = requests.filter(function (r) { return r.rating }); if (rated.length === 0) return "—"; var avg = rated.reduce(function (s, r) { return s + r.rating }, 0) / rated.length; return avg.toFixed(1) + " ★" })(), color: "#fbbf24" },
          ].map(function (s) {
            return (
              <div key={s.label} style={{ flex: 1, padding: "16px 18px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", transition: "all 0.25s" }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            )
          })}
        </div>

        {/* FORM */}
        {!isLeader ? (
          <div className="glass anim d3" style={{ padding: 32, marginBottom: 32, textAlign: "center" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <div style={{ fontSize: 15, color: "rgba(255,255,255,0.4)" }}>Only the team leader can raise mentor requests.</div>
          </div>
        ) : (
          <div className="glass anim d3" style={{ padding: 32, marginBottom: 32 }}>

            {hasActive && (
              <div style={{ marginBottom: 24, padding: "12px 18px", borderRadius: 12, background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)", fontSize: 12, color: "#fbbf24", display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                You have an active pending request. Resolve it before raising a new one.
              </div>
            )}

            {/* Team autofill */}
            <div style={{ marginBottom: 24 }}>
              <div className="slbl">Team</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#ff3020,#ff6040)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>{teamNumber && teamNumber.replace("PS-", "")}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{team && team.project_title ? team.project_title : teamNumber}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{userName} · Leader</div>
                </div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.15)", letterSpacing: 2, textTransform: "uppercase" }}>Auto-filled</div>
              </div>
            </div>

            {/* Technology */}
            <div style={{ marginBottom: 24 }}>
              <div className="slbl">Select Technology</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {technologies.map(function (t) {
                  var tc = TECH_COLORS[t] || "#ff6040"
                  return (
                    <div key={t} className={"tech-pill " + (technology === t ? "on" : "")} onClick={function () { onTechChange(t) }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: tc }} />
                      {t}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Mentors */}
            {filteredMentors.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div className="slbl">Select Mentor</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 10 }}>
                  {filteredMentors.map(function (m) {
                    var on = selectedMentor && selectedMentor.id === m.id
                    var wl = mentorWorkload[m.name] || 0
                    var waitTime = getEstimatedWait(m.name)
                    return (
                      <div key={m.id} className={"mentor-card " + (on ? "on" : "")} onClick={function () { setSelectedMentor(m) }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: on ? "linear-gradient(135deg,#ff3020,#ff6040)" : "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: on ? "#fff" : "rgba(255,255,255,0.3)", flexShrink: 0, transition: "all 0.25s" }}>{m.name.charAt(0)}</div>
                        <div style={{ flex: 1, overflow: "hidden" }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: on ? "#fff" : "rgba(255,255,255,0.6)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                            <span style={{ fontSize: 10, color: wl === 0 ? "#34d399" : wl < 3 ? "#fbbf24" : "#ff3020" }}>
                              <span className="workload-dot" style={{ background: wl === 0 ? "#34d399" : wl < 3 ? "#fbbf24" : "#ff3020", marginRight: 4 }} />
                              {wl === 0 ? "Available" : wl + " active"}
                            </span>
                            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>·</span>
                            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>{waitTime}</span>
                          </div>
                        </div>
                        {on && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff6040" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Description */}
            <div style={{ marginBottom: 24 }}>
              <div className="slbl">Describe Your Issue</div>
              <textarea className="inp" rows={4} placeholder="Briefly describe your problem or what you need help with..." value={description} onChange={function (e) { setDescription(e.target.value) }} maxLength={500} />
              <div style={{ textAlign: "right", fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 6 }}>{description.length}/500</div>
            </div>

            {/* Priority */}
            <div style={{ marginBottom: 28 }}>
              <div className="slbl">Issue Priority</div>
              <div style={{ display: "flex", gap: 10 }}>
                {PRIORITIES.map(function (p) {
                  var on = priority === p.label
                  return (
                    <div key={p.label} className={"pri-btn " + (on ? "on" : "")} onClick={function () { setPriority(p.label) }} style={{ color: on ? p.color : "rgba(255,255,255,0.3)", background: on ? p.bg : "rgba(255,255,255,0.02)", borderColor: on ? p.border : "rgba(255,255,255,0.06)" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={p.icon} /></svg>
                      {p.label}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Submit message */}
            {submitMsg && (
              <div style={{ marginBottom: 16, padding: "12px 18px", borderRadius: 12, background: submitMsg.startsWith("success") ? "rgba(52,211,153,0.07)" : "rgba(255,48,32,0.07)", border: "1px solid " + (submitMsg.startsWith("success") ? "rgba(52,211,153,0.2)" : "rgba(255,48,32,0.2)"), fontSize: 12, color: submitMsg.startsWith("success") ? "#34d399" : "#ff6040", display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={submitMsg.startsWith("success") ? "M20 6L9 17l-5-5" : "M18 6L6 18M6 6l12 12"} /></svg>
                {submitMsg.split(":")[1]}
              </div>
            )}

            <button className="submit-btn" onClick={handleSubmit} disabled={submitting || hasActive}>
              {submitting ? "Sending..." : "Send Request to Mentor"}
            </button>
          </div>
        )}

        {/* REQUEST HISTORY */}
        <div className="anim d4" style={{ marginBottom: 16, marginTop: 8 }}>
          <div className="slbl">Request History ({requests.length})</div>
        </div>

        {requests.length === 0 ? (
          <div className="glass anim d5" style={{ padding: "48px 20px", textAlign: "center" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 13 }}>No requests yet</div>
          </div>
        ) : (
          <div className="anim d5">
            {requests.map(function (r) {
              var pri = PRIORITIES.find(function (p) { return p.label === r.priority }) || PRIORITIES[0]
              var st = STATUS_STYLES[r.status] || STATUS_STYLES["Pending"]
              var isPending = r.status === "Pending"
              var isResolved = r.status === "Self Resolved" || r.status === "Mentor Resolved"
              var needsRating = isResolved && !r.rating
              var tc = TECH_COLORS[r.technology] || "#ff6040"

              return (
                <div key={r.id} className="req-card">
                  {/* Top row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#ff6040" }}>{r.team_number}</span>
                      <span className="badge" style={{ color: st.color, background: st.bg, border: "1px solid " + st.border }}>{r.status}</span>
                      <span className="badge" style={{ color: pri.color, background: pri.bg, border: "1px solid " + pri.border }}>{r.priority}</span>
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>{timeAgo(r.created_at)}</div>
                  </div>

                  {/* Issue */}
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, marginBottom: 12 }}>{r.issue_description}</div>

                  {/* Info row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{r.mentor_name}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: tc }} />
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{r.technology}</span>
                    </div>
                    {r.resolved_at && (
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>Resolved {timeAgo(r.resolved_at)}</div>
                    )}

                    {/* Rating display */}
                    {r.rating && (
                      <div style={{ display: "flex", alignItems: "center", gap: 2, marginLeft: "auto" }}>
                        {[1, 2, 3, 4, 5].map(function (s) { return <span key={s} style={{ color: s <= r.rating ? "#fbbf24" : "rgba(255,255,255,0.1)", fontSize: 14 }}>{"\u2605"}</span> })}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
                    {isPending && isLeader && (
                      <button className="resolve-btn" onClick={function () { markSelfResolved(r.id) }} disabled={resolvingId === r.id}>
                        {resolvingId === r.id ? "Resolving..." : "Mark Self Resolved"}
                      </button>
                    )}

                    {isLeader && (
                      <button onClick={function () { deleteRequest(r.id) }} disabled={deletingId === r.id} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(255,48,32,0.2)", background: "rgba(255,48,32,0.06)", color: "#ff6040", fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap" }}>
                        {deletingId === r.id ? "Deleting..." : "\u2715 Delete"}
                      </button>
                    )}

                    {/* Star rating */}
                    {needsRating && isLeader && (
                      ratingId === r.id ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 2, marginLeft: isPending ? 0 : 0 }}>
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginRight: 6 }}>Rate:</span>
                          {[1, 2, 3, 4, 5].map(function (s) {
                            return (
                              <span key={s} className="star" style={{ color: s <= hoverStar ? "#fbbf24" : "rgba(255,255,255,0.15)" }}
                                onMouseEnter={function () { setHoverStar(s) }}
                                onMouseLeave={function () { setHoverStar(0) }}
                                onClick={function () { submitRating(r.id, s) }}>
                                {"\u2605"}
                              </span>
                            )
                          })}
                          <button onClick={function () { setRatingId(null); setHoverStar(0) }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: 10, cursor: "pointer", marginLeft: 6 }}>{"\u2715"}</button>
                        </div>
                      ) : (
                        <button onClick={function () { setRatingId(r.id); setHoverStar(0) }} style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(251,191,36,0.2)", background: "rgba(251,191,36,0.06)", color: "#fbbf24", fontSize: 10, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>
                          {"\u2605"} Rate Mentor
                        </button>
                      )
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}