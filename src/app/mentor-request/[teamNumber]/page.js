"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import DashboardSidebar from "@/components/DashboardSidebar"

var PRIORITIES = [
  { label: "Low", color: "#34d399", bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.25)" },
  { label: "Medium", color: "#fbbf24", bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.25)" },
  { label: "High", color: "#f97316", bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.25)" },
  { label: "Critical", color: "#ff3020", bg: "rgba(255,48,32,0.1)", border: "rgba(255,48,32,0.25)" },
]

var STATUS_STYLES = {
  "Pending": { color: "#fbbf24", bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.2)" },
  "In Progress": { color: "#60a5fa", bg: "rgba(96,165,250,0.1)", border: "rgba(96,165,250,0.2)" },
  "Self Resolved": { color: "#34d399", bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.2)" },
  "Mentor Resolved": { color: "#34d399", bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.2)" },
  "Cancelled": { color: "#888", bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.08)" },
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

  var [allMentors, setAllMentors] = useState([])
  var [technologies, setTechnologies] = useState([])
  var [requests, setRequests] = useState([])
  var [allComments, setAllComments] = useState({})
  var [hasActive, setHasActive] = useState(false)

  var [technology, setTechnology] = useState("")
  var [filteredMentors, setFilteredMentors] = useState([])
  var [selectedMentor, setSelectedMentor] = useState(null)
  var [description, setDescription] = useState("")
  var [priority, setPriority] = useState("")
  var [submitting, setSubmitting] = useState(false)
  var [submitMsg, setSubmitMsg] = useState("")
  var [resolvingId, setResolvingId] = useState(null)
  var [deletingId, setDeletingId] = useState(null)
  var [cancelId, setCancelId] = useState(null)
  var [cancelReason, setCancelReason] = useState("")
  var [ratingId, setRatingId] = useState(null)
  var [hoverStar, setHoverStar] = useState(0)

  var [mentorWorkload, setMentorWorkload] = useState({})
  var [mentorRatings, setMentorRatings] = useState({})

  useEffect(function () {
    var roll = sessionStorage.getItem("ps_roll") || localStorage.getItem("ps_roll")
    if (!roll) { router.push("/login"); return }
    setLoggedInRoll(roll)

    async function load() {
      var teamRes = await supabase.from("teams").select("*").eq("team_number", teamNumber).single()
      if (!teamRes.data) { setLoading(false); return }
      setTeam(teamRes.data)

      var memRes = await supabase.from("team_members").select("*").eq("team_id", teamRes.data.id)
      var me = (memRes.data || []).find(function (m) { return m.member_roll_number === roll })
      if (me) { setCurrentMember(me); setIsLeader(me.is_leader || false) }

      var mentorRes = await supabase.from("mentors").select("*").eq("available", true).order("name")
      var mentors = mentorRes.data || []
      setAllMentors(mentors)
      var techSet = {}
      mentors.forEach(function (m) { if (m.technology) techSet[m.technology] = true })
      setTechnologies(Object.keys(techSet).sort())

      // Fetch requests + comments
      await fetchRequests()

      // Workload
      var wlRes = await supabase.from("mentor_requests").select("mentor_name").in("status", ["Pending", "In Progress"])
      var wl = {}
      if (wlRes.data) wlRes.data.forEach(function (r) { wl[r.mentor_name] = (wl[r.mentor_name] || 0) + 1 })
      setMentorWorkload(wl)

      // Avg ratings per mentor
      var ratRes = await supabase.from("mentor_requests").select("mentor_name, rating").not("rating", "is", null)
      var rats = {}
      if (ratRes.data) {
        var sums = {}, counts = {}
        ratRes.data.forEach(function (r) {
          sums[r.mentor_name] = (sums[r.mentor_name] || 0) + r.rating
          counts[r.mentor_name] = (counts[r.mentor_name] || 0) + 1
        })
        Object.keys(sums).forEach(function (n) { rats[n] = (sums[n] / counts[n]).toFixed(1) })
      }
      setMentorRatings(rats)

      setLoading(false)
    }
    load()

    // Real-time
    var ch1 = supabase.channel("mr-" + teamNumber)
      .on("postgres_changes", { event: "*", schema: "public", table: "mentor_requests", filter: "team_number=eq." + teamNumber }, function () { fetchRequests() })
      .subscribe()
    var ch2 = supabase.channel("mc-" + teamNumber)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mentor_comments" }, function () { fetchRequests() })
      .subscribe()

    // Polling fallback - refresh every 15 seconds for reliable updates
    var pollInterval = setInterval(fetchRequests, 15000)

    return function () { supabase.removeChannel(ch1); supabase.removeChannel(ch2); clearInterval(pollInterval) }
  }, [teamNumber, router])

  async function fetchRequests() {
    var res = await fetch("/api/mentor-request?team_number=" + teamNumber)
    var data = await res.json()
    if (data.success) {
      setRequests(data.requests || [])
      setAllComments(data.comments || {})
      var active = (data.requests || []).some(function (r) { return r.status === "Pending" || r.status === "In Progress" })
      setHasActive(active)
    }
  }

  function onTechChange(tech) {
    setTechnology(tech)
    setSelectedMentor(null)
    setFilteredMentors(allMentors.filter(function (m) { return m.technology === tech }))
  }

  function getBestMentor(mentors) {
    if (mentors.length === 0) return null
    var best = null, bestScore = -999
    mentors.forEach(function (m) {
      var wl = mentorWorkload[m.name] || 0
      var rat = parseFloat(mentorRatings[m.name] || "3")
      var score = rat * 10 - wl * 20
      if (wl >= 3) score -= 1000
      if (score > bestScore) { bestScore = score; best = m }
    })
    return best
  }

  async function handleSubmit() {
    if (!technology || !selectedMentor || !description.trim() || !priority) {
      setSubmitMsg("error:Please fill all fields."); return
    }
    if (description.trim().length < 10) {
      setSubmitMsg("error:Description must be at least 10 characters."); return
    }
    setSubmitting(true); setSubmitMsg("")

    try {
      var res = await fetch("/api/mentor-request", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamNumber: teamNumber, teamId: team ? team.id : null,
          mentorId: selectedMentor.id, mentorName: selectedMentor.name, mentorEmail: selectedMentor.email,
          technology: technology, issueDescription: description.trim(), priority: priority,
          requestedByRoll: loggedInRoll, requestedByName: currentMember ? currentMember.member_name : "",
        })
      })
      var data = await res.json()
      if (data.success) {
        setTechnology(""); setSelectedMentor(null); setFilteredMentors([]); setDescription(""); setPriority("")
        setSubmitMsg("success:Request sent! " + (data.request ? data.request.mentor_name : "Mentor") + " will be notified via email.")
        await fetchRequests()
        setMentorWorkload(function (prev) { var n = Object.assign({}, prev); n[selectedMentor.name] = (n[selectedMentor.name] || 0) + 1; return n })
      } else {
        setSubmitMsg("error:" + (data.error || "Failed to submit."))
      }
    } catch (e) { setSubmitMsg("error:Something went wrong.") }
    setSubmitting(false)
  }

  async function markSelfResolved(id) {
    setResolvingId(id)
    await fetch("/api/mentor-request", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId: id, action: "self_resolve" }) })
    await fetchRequests()
    setResolvingId(null)
  }

  async function cancelRequest(id) {
    await fetch("/api/mentor-request", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId: id, action: "cancel", cancelReason: "" }) })
    await fetchRequests()
  }

  async function deleteRequest(id) {
    setDeletingId(id)
    try {
      console.log("Deleting:", id)
      var res = await fetch("/api/mentor-request?id=" + id, { method: "DELETE" })
      var data = await res.json()
      console.log("Delete response:", data)
      if (data.success) {
        // Update local state immediately
        var deleted = requests.find(function (r) { return r.id === id })
        setRequests(function (prev) { return prev.filter(function (r) { return r.id !== id }) })
        if (deleted && (deleted.status === "Pending" || deleted.status === "In Progress")) {
          setHasActive(false)
        }
      } else {
        // Try direct Supabase delete as fallback
        console.log("API delete failed, trying direct Supabase delete")
        await supabase.from("mentor_comments").delete().eq("request_id", id)
        await supabase.from("mentor_request_logs").delete().eq("request_id", id)
        var directDel = await supabase.from("mentor_requests").delete().eq("id", id)
        console.log("Direct delete result:", directDel)
        var deleted2 = requests.find(function (r) { return r.id === id })
        setRequests(function (prev) { return prev.filter(function (r) { return r.id !== id }) })
        if (deleted2 && (deleted2.status === "Pending" || deleted2.status === "In Progress")) {
          setHasActive(false)
        }
      }
    } catch (e) {
      console.error("Delete error:", e)
      // Last resort: direct delete
      await supabase.from("mentor_comments").delete().eq("request_id", id)
      await supabase.from("mentor_request_logs").delete().eq("request_id", id)
      await supabase.from("mentor_requests").delete().eq("id", id)
      setRequests(function (prev) { return prev.filter(function (r) { return r.id !== id }) })
      setHasActive(false)
    }
    setDeletingId(null)
  }

  async function submitRating(id, stars) {
    await fetch("/api/mentor-request", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId: id, action: "rate", rating: stars }) })
    setRatingId(null); setHoverStar(0)
    await fetchRequests()
  }

  function timeAgo(d) {
    if (!d) return ""
    var diff = Date.now() - new Date(d).getTime()
    var m = Math.floor(diff / 60000)
    if (m < 1) return "Just now"
    if (m < 60) return m + "m ago"
    var h = Math.floor(m / 60)
    if (h < 24) return h + "h ago"
    return Math.floor(h / 24) + "d ago"
  }

  var userName = currentMember ? currentMember.member_name : ""

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "#000" }}>
        <DashboardSidebar teamNumber={teamNumber} currentMember={currentMember} loggedInRoll={loggedInRoll} isLeader={isLeader} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,#ff3020,#ff6040)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 18, color: "#fff", margin: "0 auto 12px", animation: "pulse 1s ease-in-out infinite" }}>PS</div>
            <div style={{ fontSize: 13, letterSpacing: 3, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>Loading</div>
          </div>
          <style>{`@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}`}</style>
        </div>
      </div>
    )
  }

  var recommended = filteredMentors.length > 0 ? getBestMentor(filteredMentors) : null

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#000", color: "#fff", fontFamily: "'DM Sans',sans-serif" }}>
      <style jsx>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
        .anim{opacity:0;animation:fadeUp 0.5s cubic-bezier(0.23,1,0.32,1) forwards}
        .d1{animation-delay:0.05s}.d2{animation-delay:0.1s}.d3{animation-delay:0.15s}.d4{animation-delay:0.2s}.d5{animation-delay:0.25s}
        .glass{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:16px;position:relative;overflow:hidden}
        .glass::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#ff3020,#ff6040,transparent)}
        .slbl{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:3px;color:rgba(255,255,255,0.25);margin-bottom:12px;padding-left:12px;position:relative}
        .slbl::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:12px;border-radius:2px;background:linear-gradient(180deg,#ff3020,#ff6040)}
        .tech-pill{padding:10px 18px;border-radius:50px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.02);font-size:12px;font-weight:500;color:rgba(255,255,255,0.4);cursor:pointer;transition:all 0.3s;white-space:nowrap;display:flex;align-items:center;gap:6px}
        .tech-pill:hover{border-color:rgba(255,96,64,0.3);color:#ff6040;background:rgba(255,96,64,0.04)}
        .tech-pill.on{border-color:#ff3020;background:linear-gradient(135deg,rgba(255,48,32,0.15),rgba(255,96,64,0.08));color:#ff6040;box-shadow:0 0 16px rgba(255,48,32,0.12)}
        .mentor-card{padding:16px;border-radius:14px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.02);cursor:pointer;transition:all 0.3s;display:flex;align-items:center;gap:12px;position:relative}
        .mentor-card:hover{border-color:rgba(255,96,64,0.2);background:rgba(255,96,64,0.03);transform:translateY(-2px)}
        .mentor-card.on{border-color:rgba(255,96,64,0.4);background:rgba(255,96,64,0.06);box-shadow:0 4px 20px rgba(255,48,32,0.1)}
        .mentor-card.busy{opacity:0.4;cursor:not-allowed;pointer-events:none}
        .pri-btn{flex:1;padding:12px 8px;border-radius:12px;border:1px solid;cursor:pointer;transition:all 0.3s;text-align:center;font-size:12px;font-weight:600}
        .pri-btn:hover{transform:translateY(-2px)}
        .pri-btn.on{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,0.4)}
        .submit-btn{width:100%;padding:16px;border-radius:14px;border:none;background:linear-gradient(135deg,#ff3020,#ff6040);color:#fff;font-size:15px;font-weight:700;letter-spacing:1px;cursor:pointer;transition:all 0.3s}
        .submit-btn:hover{box-shadow:0 8px 32px rgba(255,48,32,0.35);transform:translateY(-2px)}
        .submit-btn:disabled{opacity:0.5;cursor:not-allowed;transform:none}
        .inp{width:100%;padding:14px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;color:#fff;font-size:13px;resize:vertical;outline:none;transition:border 0.2s;box-sizing:border-box;font-family:'DM Sans',sans-serif}
        .inp:focus{border-color:rgba(255,96,64,0.35);background:rgba(255,96,64,0.02)}
        .req-card{padding:20px;border-radius:14px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.015);margin-bottom:12px;transition:all 0.25s}
        .req-card:hover{border-color:rgba(255,255,255,0.1)}
        .badge{display:inline-flex;align-items:center;gap:4px;padding:4px 12px;border-radius:20px;font-size:10px;font-weight:600;letter-spacing:0.5px;white-space:nowrap}
        .act-btn{padding:6px 14px;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;transition:all 0.2s;white-space:nowrap;border:1px solid}
        .star{cursor:pointer;transition:all 0.15s;font-size:18px}
        .star:hover{transform:scale(1.2)}
        .cmt{padding:10px 14px;margin-bottom:6px;border-radius:8px;border:1px solid}
        .scroll-area::-webkit-scrollbar{width:5px}.scroll-area::-webkit-scrollbar-thumb{background:rgba(255,96,64,0.15);border-radius:10px}
      `}</style>

      <DashboardSidebar teamNumber={teamNumber} currentMember={currentMember} loggedInRoll={loggedInRoll} isLeader={isLeader} />

      <div className="scroll-area" style={{ flex: 1, padding: "32px 44px 80px", overflowY: "auto", maxHeight: "100vh" }}>

        {/* HEADER */}
        <div className="anim d1" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Request Mentor</h1>
            <div style={{ fontSize: 13, color: "#BEBEBE" }}>Raise a help request — your mentor will be notified via email</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {hasActive && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fbbf24", animation: "pulse 1.5s infinite" }} />
                <span style={{ fontSize: 11, color: "#fbbf24", fontWeight: 600 }}>Active Request</span>
              </div>
            )}
            <div style={{ fontSize: 13, fontWeight: 700, color: "#ff6040", background: "rgba(255,96,64,0.07)", border: "1px solid rgba(255,96,64,0.12)", padding: "5px 14px", borderRadius: 20 }}>{teamNumber}</div>
          </div>
        </div>

        {/* STATS */}
        <div className="anim d2" style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total", value: requests.length, color: "#ff6040" },
            { label: "Pending", value: requests.filter(function (r) { return r.status === "Pending" }).length, color: "#fbbf24" },
            { label: "In Progress", value: requests.filter(function (r) { return r.status === "In Progress" }).length, color: "#60a5fa" },
            { label: "Resolved", value: requests.filter(function (r) { return r.status === "Self Resolved" || r.status === "Mentor Resolved" }).length, color: "#34d399" },
          ].map(function (s) {
            return (
              <div key={s.label} style={{ flex: 1, padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            )
          })}
        </div>

        {/* FORM */}
        {!isLeader ? (
          <div className="glass anim d3" style={{ padding: "16px 24px", marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <div style={{ fontSize: 13, color: "#BEBEBE" }}>Only the team leader can raise requests. You can view the request history below.</div>
          </div>
        ) : (
          <div className="glass anim d3" style={{ padding: 32, marginBottom: 32 }}>

            {hasActive && (
              <div style={{ marginBottom: 24, padding: "12px 18px", borderRadius: 12, background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)", fontSize: 12, color: "#fbbf24", display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                You have an active request. Resolve or cancel it first.
              </div>
            )}

            {/* Team */}
            <div style={{ marginBottom: 24 }}>
              <div className="slbl">Team</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#ff3020,#ff6040)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>{teamNumber && teamNumber.replace("PS-", "")}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{team && team.project_title ? team.project_title : teamNumber}</div>
                  <div style={{ fontSize: 11, color: "#BEBEBE", marginTop: 2 }}>{userName} · Leader</div>
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
                  return <div key={t} className={"tech-pill " + (technology === t ? "on" : "")} onClick={function () { if (!hasActive) onTechChange(t) }} style={{ opacity: hasActive ? 0.4 : 1 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: tc }} />{t}</div>
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
                    var isBusy = wl >= 3
                    var isRec = recommended && recommended.id === m.id
                    var avgRat = mentorRatings[m.name]
                    return (
                      <div key={m.id} className={"mentor-card " + (on ? "on" : "") + (isBusy ? " busy" : "")} onClick={function () { if (!isBusy && !hasActive) setSelectedMentor(m) }} style={{ opacity: hasActive ? 0.4 : 1 }}>
                        {isRec && <div style={{ position: "absolute", top: -1, right: 12, padding: "2px 8px", borderRadius: "0 0 6px 6px", background: "linear-gradient(135deg,#ff3020,#ff6040)", fontSize: 8, fontWeight: 700, color: "#fff", letterSpacing: 1, textTransform: "uppercase" }}>Recommended</div>}
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: on ? "linear-gradient(135deg,#ff3020,#ff6040)" : "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: on ? "#fff" : "rgba(255,255,255,0.3)", flexShrink: 0, transition: "all 0.25s" }}>{m.name.charAt(0)}</div>
                        <div style={{ flex: 1, overflow: "hidden" }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: on ? "#fff" : "rgba(255,255,255,0.6)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                            <span style={{ fontSize: 10, color: isBusy ? "#ff3020" : wl === 0 ? "#34d399" : "#fbbf24" }}>
                              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: isBusy ? "#ff3020" : wl === 0 ? "#34d399" : "#fbbf24", marginRight: 4, verticalAlign: "middle" }} />
                              {isBusy ? "Busy" : wl === 0 ? "Available" : wl + " active"}
                            </span>
                            {avgRat && <span style={{ fontSize: 10, color: "#fbbf24" }}>{"\u2605"} {avgRat}</span>}
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
              <textarea className="inp" rows={4} placeholder="Describe your problem in detail (min 10 characters)..." value={description} onChange={function (e) { setDescription(e.target.value) }} maxLength={500} disabled={hasActive} style={{ opacity: hasActive ? 0.4 : 1 }} />
              <div style={{ textAlign: "right", fontSize: 10, color: description.length < 10 ? "#ff6040" : "rgba(255,255,255,0.2)", marginTop: 6 }}>{description.length}/500</div>
            </div>

            {/* Priority */}
            <div style={{ marginBottom: 28 }}>
              <div className="slbl">Issue Priority</div>
              <div style={{ display: "flex", gap: 10 }}>
                {PRIORITIES.map(function (p) {
                  var on = priority === p.label
                  return <div key={p.label} className={"pri-btn " + (on ? "on" : "")} onClick={function () { if (!hasActive) setPriority(p.label) }} style={{ color: on ? p.color : "rgba(255,255,255,0.3)", background: on ? p.bg : "rgba(255,255,255,0.02)", borderColor: on ? p.border : "rgba(255,255,255,0.06)", opacity: hasActive ? 0.4 : 1 }}>{p.label}</div>
                })}
              </div>
            </div>

            {/* Message */}
            {submitMsg && (
              <div style={{ marginBottom: 16, padding: "12px 18px", borderRadius: 12, background: submitMsg.startsWith("success") ? "rgba(52,211,153,0.07)" : "rgba(255,48,32,0.07)", border: "1px solid " + (submitMsg.startsWith("success") ? "rgba(52,211,153,0.2)" : "rgba(255,48,32,0.2)"), fontSize: 12, color: submitMsg.startsWith("success") ? "#34d399" : "#ff6040", display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={submitMsg.startsWith("success") ? "M20 6L9 17l-5-5" : "M18 6L6 18M6 6l12 12"} /></svg>
                {submitMsg.split(":").slice(1).join(":")}
              </div>
            )}

            <button className="submit-btn" onClick={handleSubmit} disabled={submitting || hasActive}>
              {submitting ? "Sending..." : "Send Request to Mentor"}
            </button>
          </div>
        )}

        {/* REQUEST HISTORY TABLE */}
        <div className="anim d4" style={{ marginBottom: 16, marginTop: 8 }}>
          <div className="slbl">Request History ({requests.length})</div>
        </div>

        {requests.length === 0 ? (
          <div className="glass anim d5" style={{ padding: "48px 20px", textAlign: "center" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" style={{ marginBottom: 12 }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <div style={{ color: "#BEBEBE", fontSize: 13 }}>No requests yet</div>
          </div>
        ) : (
          <div className="glass anim d5" style={{ overflow: "hidden" }}>
            {/* Table Header */}
            <div style={{ display: "grid", gridTemplateColumns: "75px 1fr 120px 85px 115px 140px 100px 60px", gap: 0, padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
              {["Team ID", "Description", "Mentor", "Priority", "Status", "Resolved", "Rating", "Action"].map(function (h) {
                return <div key={h} style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, color: "rgba(255,255,255,0.25)" }}>{h}</div>
              })}
            </div>

            {/* Table Rows */}
            {requests.map(function (r) {
              var pri = PRIORITIES.find(function (p) { return p.label === r.priority }) || PRIORITIES[0]
              var st = STATUS_STYLES[r.status] || STATUS_STYLES["Pending"]
              var isPending = r.status === "Pending"
              var isInProgress = r.status === "In Progress"
              var isActive = isPending || isInProgress
              var isResolved = r.status === "Self Resolved" || r.status === "Mentor Resolved"
              var cmts = allComments[r.id] || []
              var mentorCmts = cmts.filter(function (c) { return c.author_type === "mentor" || c.author_type === "system" })

              return (
                <div key={r.id}>
                  <div style={{ display: "grid", gridTemplateColumns: "75px 1fr 120px 85px 115px 140px 100px 60px", gap: 0, alignItems: "center", padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.2s" }} onMouseEnter={function (e) { e.currentTarget.style.background = "rgba(255,255,255,0.015)" }} onMouseLeave={function (e) { e.currentTarget.style.background = "transparent" }}>

                    {/* Team ID */}
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#ff6040" }}>{r.team_number}</div>

                    {/* Description */}
                    <div style={{ paddingRight: 12 }}>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: 1.5 }}>{r.issue_description}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 3 }}>{timeAgo(r.created_at)}</div>
                    </div>

                    {/* Mentor */}
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>{r.mentor_name}</div>

                    {/* Priority */}
                    <div><span className="badge" style={{ color: pri.color, background: pri.bg, border: "1px solid " + pri.border }}>{r.priority}</span></div>

                    {/* Status */}
                    <div><span className="badge" style={{ color: st.color, background: st.bg, border: "1px solid " + st.border }}>{r.status}</span></div>

                    {/* Resolved — Self / Mentor buttons */}
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      {isActive && isLeader ? (
                        <>
                          <button className="act-btn" onClick={function () { markSelfResolved(r.id) }} disabled={resolvingId === r.id} style={{ borderColor: "rgba(52,211,153,0.3)", background: "rgba(52,211,153,0.06)", color: "#34d399", padding: "4px 8px", fontSize: 9 }}>
                            {resolvingId === r.id ? "..." : "Self"}
                          </button>
                          <button className="act-btn" disabled style={{ borderColor: "rgba(96,165,250,0.2)", background: "rgba(96,165,250,0.04)", color: "rgba(96,165,250,0.4)", padding: "4px 8px", fontSize: 9, cursor: "default" }}>
                            Mentor
                          </button>
                        </>
                      ) : isResolved ? (
                        <span style={{ fontSize: 10, fontWeight: 600, color: r.status === "Self Resolved" ? "#34d399" : "#60a5fa" }}>
                          {r.status === "Self Resolved" ? "Self" : "Mentor"}
                        </span>
                      ) : (
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.15)" }}>—</span>
                      )}
                    </div>

                    {/* Rating */}
                    <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {r.rating ? (
                        [1, 2, 3, 4, 5].map(function (s) { return <span key={s} style={{ color: s <= r.rating ? "#fbbf24" : "rgba(255,255,255,0.08)", fontSize: 14, cursor: "default" }}>{"\u2605"}</span> })
                      ) : isResolved && isLeader ? (
                        [1, 2, 3, 4, 5].map(function (s) {
                          return <span key={s} className="star" style={{ color: (ratingId === r.id && s <= hoverStar) ? "#fbbf24" : "rgba(255,255,255,0.1)", fontSize: 14 }}
                            onMouseEnter={function () { setRatingId(r.id); setHoverStar(s) }}
                            onMouseLeave={function () { if (ratingId === r.id) setHoverStar(0) }}
                            onClick={function () { submitRating(r.id, s) }}>{"\u2605"}</span>
                        })
                      ) : (
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.1)" }}>—</span>
                      )}
                    </div>

                    {/* Action — Delete */}
                    <div style={{ textAlign: "center" }}>
                      {isLeader && (
                        <button onClick={function () { deleteRequest(r.id) }} disabled={deletingId === r.id} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, transition: "all 0.2s", color: "rgba(255,255,255,0.15)" }} onMouseEnter={function (e) { e.currentTarget.style.color = "#ff6040" }} onMouseLeave={function (e) { e.currentTarget.style.color = "rgba(255,255,255,0.15)" }}>
                          {deletingId === r.id ? <span style={{ fontSize: 10 }}>...</span> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Comments row */}
                  {mentorCmts.length > 0 && (
                    <div style={{ padding: "8px 20px 12px 95px", borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.01)" }}>
                      {mentorCmts.map(function (c) {
                        var isSystem = c.author_type === "system"
                        return (
                          <div key={c.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 4, padding: "4px 0" }}>
                            <div style={{ width: 4, height: 4, borderRadius: "50%", background: isSystem ? "#666" : "#ff6040", marginTop: 6, flexShrink: 0 }} />
                            <div>
                              <span style={{ fontSize: 10, color: isSystem ? "#666" : "#ff6040", fontWeight: 600 }}>{c.author_name}: </span>
                              <span style={{ fontSize: 11, color: isSystem ? "rgba(255,255,255,0.3)" : "#BEBEBE", fontStyle: isSystem ? "italic" : "normal" }}>{c.comment}</span>
                              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.12)", marginLeft: 8 }}>{timeAgo(c.created_at)}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}