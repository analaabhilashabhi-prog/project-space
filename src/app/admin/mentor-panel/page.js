"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import toast, { Toaster } from "react-hot-toast"

var PRIORITY_COLOR = { Low: "#44cc88", Medium: "#ffaa00", High: "#ff6040", Critical: "#ff2020" }
var STATUS_CONFIG = {
  "Pending":        { color: "#ffaa00", bg: "rgba(255,170,0,0.08)",   border: "rgba(255,170,0,0.2)" },
  "Accepted":       { color: "#44ff66", bg: "rgba(68,255,102,0.06)",  border: "rgba(68,255,102,0.2)" },
  "Self Resolved":  { color: "#888",    bg: "rgba(136,136,136,0.06)", border: "rgba(136,136,136,0.12)" },
  "Mentor Resolved":{ color: "#4488ff", bg: "rgba(68,136,255,0.06)",  border: "rgba(68,136,255,0.15)" },
}

export default function AdminMentorPanelPage() {
  var router = useRouter()
  var [requests, setRequests] = useState([])
  var [mentors, setMentors] = useState([])
  var [loading, setLoading] = useState(true)
  var [tab, setTab] = useState("requests") // requests | mentors | stats
  var [filterTech, setFilterTech] = useState("all")
  var [filterStatus, setFilterStatus] = useState("all")

  useEffect(function () {
    fetchData()
    var poll = setInterval(fetchData, 15000)
    return function () { clearInterval(poll) }
  }, [])

  function fetchData() {
    fetch("/api/mentor-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get_all" }),
    })
      .then(function (r) { return r.json() })
      .then(function (data) {
        setRequests(data.requests || [])
        setMentors(data.mentors || [])
        setLoading(false)
      })
      .catch(function () { setLoading(false) })
  }

  var technologies = ["all"].concat(Array.from(new Set(mentors.map(function (m) { return m.technology }))).sort())
  var statuses = ["all", "Pending", "Accepted", "Self Resolved", "Mentor Resolved"]

  var filteredRequests = requests.filter(function (r) {
    var techOk = filterTech === "all" || r.technology === filterTech
    var statusOk = filterStatus === "all" || r.status === filterStatus
    return techOk && statusOk
  })

  // Stats
  var totalRequests = requests.length
  var pendingCount = requests.filter(function (r) { return r.status === "Pending" }).length
  var activeCount = requests.filter(function (r) { return r.status === "Accepted" }).length
  var resolvedCount = requests.filter(function (r) { return r.status === "Self Resolved" || r.status === "Mentor Resolved" }).length
  var busyMentors = mentors.filter(function (m) { return m.is_busy })

  // Group mentors by technology
  var mentorsByTech = {}
  mentors.forEach(function (m) {
    if (!mentorsByTech[m.technology]) mentorsByTech[m.technology] = []
    mentorsByTech[m.technology].push(m)
  })

  return (
    <div style={{ minHeight: "100vh", background: "#050202", fontFamily: "var(--font-primary, 'Open Sans', sans-serif)", color: "#fff" }}>
      <Toaster position="top-right" />

      <style jsx>{`
        .ap-header { background:rgba(10,4,2,0.95); border-bottom:1px solid rgba(255,60,30,0.1); padding:16px 24px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:100; backdrop-filter:blur(20px); }
        .ap-title { font-size:18px; font-weight:800; letter-spacing:2px; text-transform:uppercase; }
        .ap-back { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:8px 14px; color:rgba(255,255,255,0.4); font-size:12px; cursor:pointer; font-family:inherit; transition:all 0.3s; }
        .ap-back:hover { color:#ff6040; border-color:rgba(255,96,64,0.3); }
        .ap-body { max-width:1100px; margin:0 auto; padding:28px 20px; }
        .ap-stats { display:grid; grid-template-columns:repeat(5,1fr); gap:12px; margin-bottom:28px; }
        .ap-stat { padding:16px; border-radius:14px; border:1px solid rgba(255,255,255,0.05); background:rgba(255,255,255,0.02); text-align:center; }
        .ap-stat-num { font-size:28px; font-weight:800; }
        .ap-stat-label { font-size:11px; color:rgba(255,255,255,0.3); letter-spacing:1.5px; text-transform:uppercase; margin-top:4px; }
        .ap-tabs { display:flex; gap:4px; margin-bottom:24px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:12px; padding:4px; width:fit-content; }
        .ap-tab { padding:10px 20px; border-radius:8px; font-size:12px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; cursor:pointer; transition:all 0.3s; border:none; background:none; color:rgba(255,255,255,0.3); font-family:inherit; }
        .ap-tab.on { background:rgba(255,60,30,0.12); color:#ff6040; border:1px solid rgba(255,60,30,0.2); }
        .ap-filters { display:flex; gap:10px; margin-bottom:20px; flex-wrap:wrap; }
        .ap-filter-select { padding:8px 14px; border-radius:8px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.03); color:#fff; font-size:12px; font-family:inherit; outline:none; cursor:pointer; }
        .ap-filter-select option { background:#141414; }
        .ap-table { width:100%; border-collapse:collapse; }
        .ap-th { text-align:left; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:rgba(255,255,255,0.3); padding:10px 14px; border-bottom:1px solid rgba(255,255,255,0.05); white-space:nowrap; }
        .ap-td { padding:14px; border-bottom:1px solid rgba(255,255,255,0.03); font-size:13px; color:rgba(255,255,255,0.7); vertical-align:top; }
        .ap-tr:hover .ap-td { background:rgba(255,255,255,0.01); }
        .ap-badge { display:inline-block; padding:3px 10px; border-radius:6px; font-size:11px; font-weight:600; white-space:nowrap; }
        .ap-empty { text-align:center; padding:60px 20px; color:rgba(255,255,255,0.2); }
        .ap-mentor-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:16px; }
        .ap-mentor-tech { margin-bottom:28px; }
        .ap-mentor-tech-title { font-size:14px; font-weight:700; color:#ff6040; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:12px; display:flex; align-items:center; gap:8px; }
        .ap-mentor-card { padding:14px 16px; border-radius:12px; border:1px solid rgba(255,255,255,0.05); background:rgba(255,255,255,0.02); display:flex; align-items:center; justify-content:space-between; }
        .ap-mentor-card.busy { border-color:rgba(255,50,50,0.2); background:rgba(255,50,50,0.04); }
        .ap-mentor-name { font-size:13px; font-weight:600; color:#fff; }
        .ap-mentor-email { font-size:11px; color:rgba(255,255,255,0.3); margin-top:2px; }
        .ap-busy-badge { padding:3px 10px; border-radius:6px; background:rgba(255,50,50,0.1); border:1px solid rgba(255,50,50,0.25); color:#ff5555; font-size:11px; font-weight:600; }
        .ap-free-badge { padding:3px 10px; border-radius:6px; background:rgba(68,204,136,0.08); border:1px solid rgba(68,204,136,0.2); color:#44cc88; font-size:11px; font-weight:600; }
        .ap-refresh-btn { background:rgba(255,60,30,0.08); border:1px solid rgba(255,60,30,0.2); border-radius:8px; padding:8px 14px; color:#ff6040; font-size:12px; cursor:pointer; font-family:inherit; transition:all 0.3s; }
        .ap-refresh-btn:hover { background:rgba(255,60,30,0.15); }
        @media(max-width:768px) { .ap-stats { grid-template-columns:repeat(3,1fr) } }
      `}</style>

      <div className="ap-header">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#ff3020,#ff6040)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, color: "#fff" }}>PS</div>
          <div className="ap-title">Mentor Admin Panel</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="ap-refresh-btn" onClick={fetchData}>↻ Refresh</button>
          <button className="ap-back" onClick={function () { router.push("/admin") }}>← Admin</button>
        </div>
      </div>

      <div className="ap-body">
        {/* Stats */}
        <div className="ap-stats">
          <div className="ap-stat">
            <div className="ap-stat-num" style={{ color: "#ff6040" }}>{totalRequests}</div>
            <div className="ap-stat-label">Total</div>
          </div>
          <div className="ap-stat">
            <div className="ap-stat-num" style={{ color: "#ffaa00" }}>{pendingCount}</div>
            <div className="ap-stat-label">Pending</div>
          </div>
          <div className="ap-stat">
            <div className="ap-stat-num" style={{ color: "#44ff66" }}>{activeCount}</div>
            <div className="ap-stat-label">Active</div>
          </div>
          <div className="ap-stat">
            <div className="ap-stat-num" style={{ color: "#4488ff" }}>{resolvedCount}</div>
            <div className="ap-stat-label">Resolved</div>
          </div>
          <div className="ap-stat">
            <div className="ap-stat-num" style={{ color: "#ff5555" }}>{busyMentors.length}</div>
            <div className="ap-stat-label">Busy Mentors</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="ap-tabs">
          <button className={"ap-tab " + (tab === "requests" ? "on" : "")} onClick={function () { setTab("requests") }}>Requests</button>
          <button className={"ap-tab " + (tab === "mentors" ? "on" : "")} onClick={function () { setTab("mentors") }}>Mentors</button>
        </div>

        {/* REQUESTS TAB */}
        {tab === "requests" && (
          <>
            <div className="ap-filters">
              <select className="ap-filter-select" value={filterTech} onChange={function (e) { setFilterTech(e.target.value) }}>
                {technologies.map(function (t) { return <option key={t} value={t}>{t === "all" ? "All Technologies" : t}</option> })}
              </select>
              <select className="ap-filter-select" value={filterStatus} onChange={function (e) { setFilterStatus(e.target.value) }}>
                {statuses.map(function (s) { return <option key={s} value={s}>{s === "all" ? "All Statuses" : s}</option> })}
              </select>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", alignSelf: "center" }}>{filteredRequests.length} results</span>
            </div>

            {loading ? (
              <div className="ap-empty">Loading...</div>
            ) : filteredRequests.length === 0 ? (
              <div className="ap-empty">No requests found</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="ap-table">
                  <thead>
                    <tr>
                      <th className="ap-th">Team</th>
                      <th className="ap-th">Technology</th>
                      <th className="ap-th">Issue</th>
                      <th className="ap-th">Priority</th>
                      <th className="ap-th">Status</th>
                      <th className="ap-th">Mentor</th>
                      <th className="ap-th">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map(function (req) {
                      var sc = STATUS_CONFIG[req.status] || {}
                      var pc = PRIORITY_COLOR[req.priority] || "#fff"
                      return (
                        <tr key={req.id} className="ap-tr">
                          <td className="ap-td"><strong style={{ color: "#fff" }}>Team {req.team_number}</strong>{req.requested_by_roll && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>{req.requested_by_roll}</div>}</td>
                          <td className="ap-td">{req.technology}</td>
                          <td className="ap-td" style={{ maxWidth: 220 }}><div style={{ overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{req.issue_description}</div></td>
                          <td className="ap-td"><span className="ap-badge" style={{ color: pc, background: pc + "18", border: "1px solid " + pc + "33" }}>{req.priority}</span></td>
                          <td className="ap-td"><span className="ap-badge" style={{ color: sc.color, background: sc.bg, border: "1px solid " + sc.border }}>{req.status}</span></td>
                          <td className="ap-td">{req.assigned_mentor_name || <span style={{ color: "rgba(255,255,255,0.2)" }}>—</span>}</td>
                          <td className="ap-td" style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap" }}>{new Date(req.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* MENTORS TAB */}
        {tab === "mentors" && (
          loading ? <div className="ap-empty">Loading...</div> : (
            Object.keys(mentorsByTech).sort().map(function (tech) {
              var techMentors = mentorsByTech[tech]
              return (
                <div key={tech} className="ap-mentor-tech">
                  <div className="ap-mentor-tech-title">
                    {tech}
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontWeight: 400, letterSpacing: 0, textTransform: "none" }}>({techMentors.length} mentors)</span>
                  </div>
                  <div className="ap-mentor-grid">
                    {techMentors.map(function (m) {
                      return (
                        <div key={m.id} className={"ap-mentor-card " + (m.is_busy ? "busy" : "")}>
                          <div>
                            <div className="ap-mentor-name">{m.name}</div>
                            <div className="ap-mentor-email">{m.email}</div>
                            {m.is_busy && m.current_team_number && (
                              <div style={{ fontSize: 11, color: "#ff5555", marginTop: 4 }}>Helping Team {m.current_team_number}</div>
                            )}
                          </div>
                          {m.is_busy
                            ? <span className="ap-busy-badge">🔴 Busy</span>
                            : <span className="ap-free-badge">✅ Free</span>
                          }
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )
        )}
      </div>
    </div>
  )
}