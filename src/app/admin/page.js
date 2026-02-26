"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { EVENT_CONFIG } from "@/config/formFields"
import AnimatedBackground from "@/components/AnimatedBackground"

export default function AdminPage() {
  var [teams, setTeams] = useState([])
  var [members, setMembers] = useState([])
  var [foodSelections, setFoodSelections] = useState([])
  var [announcements, setAnnouncements] = useState([])
  var [mentorRequests, setMentorRequests] = useState([])
  var [loading, setLoading] = useState(true)
  var [search, setSearch] = useState("")
  var [isAuthenticated, setIsAuthenticated] = useState(false)
  var [password, setPassword] = useState("")
  var [activeTab, setActiveTab] = useState("teams")
  var [registrationOpen, setRegistrationOpen] = useState(true)
  var [toggling, setToggling] = useState(false)

  var [annTitle, setAnnTitle] = useState("")
  var [annMessage, setAnnMessage] = useState("")
  var [annType, setAnnType] = useState("info")
  var [annImage, setAnnImage] = useState(null)
  var [annImagePreview, setAnnImagePreview] = useState("")
  var [annSending, setAnnSending] = useState(false)

  var ADMIN_PASSWORD = "projectspace2026"

  function handleLogin(e) {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) setIsAuthenticated(true)
    else alert("Wrong password!")
  }

  useEffect(function () {
    if (isAuthenticated) {
      fetchAll()
      var interval = setInterval(fetchAll, 10000)
      return function () { clearInterval(interval) }
    }
  }, [isAuthenticated])

  function fetchAll() {
    Promise.all([
      supabase.from("teams").select("*").order("registered_at", { ascending: false }),
      supabase.from("team_members").select("*"),
      supabase.from("food_selections").select("*"),
      supabase.from("settings").select("*").eq("id", "registration_open").single(),
      supabase.from("announcements").select("*").order("created_at", { ascending: false }),
      supabase.from("mentor_requests").select("*").order("requested_at", { ascending: false }),
    ]).then(function (results) {
      setTeams(results[0].data || [])
      setMembers(results[1].data || [])
      setFoodSelections(results[2].data || [])
      setRegistrationOpen(results[3].data ? results[3].data.value === "true" : true)
      setAnnouncements(results[4].data || [])
      setMentorRequests(results[5].data || [])
      setLoading(false)
    })
  }

  function toggleRegistration() {
    setToggling(true)
    var newValue = !registrationOpen
    supabase
      .from("settings")
      .update({ value: newValue ? "true" : "false" })
      .eq("id", "registration_open")
      .then(function () {
        setRegistrationOpen(newValue)
        setToggling(false)
      })
  }

  function handleImageSelect(e) {
    var file = e.target.files[0]
    if (file) {
      setAnnImage(file)
      var reader = new FileReader()
      reader.onload = function (ev) { setAnnImagePreview(ev.target.result) }
      reader.readAsDataURL(file)
    }
  }

  function removeImage() {
    setAnnImage(null)
    setAnnImagePreview("")
  }

  function sendAnnouncement() {
    if (!annTitle.trim() || !annMessage.trim()) { alert("Please enter title and message"); return }
    setAnnSending(true)
    var formData = new FormData()
    formData.append("title", annTitle)
    formData.append("message", annMessage)
    formData.append("type", annType)
    if (annImage) formData.append("image", annImage)

    fetch("/api/announcements", { method: "POST", body: formData })
      .then(function (res) { return res.json() })
      .then(function (data) {
        if (data.success) {
          setAnnTitle(""); setAnnMessage(""); setAnnType("info"); setAnnImage(null); setAnnImagePreview("")
          fetchAll(); alert("Announcement sent!")
        } else { alert(data.error || "Failed to send") }
        setAnnSending(false)
      })
      .catch(function () { alert("Something went wrong"); setAnnSending(false) })
  }

  function deleteAnnouncement(id) {
    if (!confirm("Delete this announcement?")) return
    fetch("/api/announcements?id=" + id, { method: "DELETE" }).then(function () { fetchAll() })
  }

  var filteredTeams = teams.filter(function (t) {
    return t.team_number.toLowerCase().includes(search.toLowerCase()) ||
      t.project_title.toLowerCase().includes(search.toLowerCase())
  })

  var totalTeams = teams.length
  var totalStudents = members.length

  var techStats = {}
  teams.forEach(function (t) { (t.technologies || []).forEach(function (tech) { techStats[tech] = (techStats[tech] || 0) + 1 }) })

  var beverageStats = {}
  var snackStats = {}
  foodSelections.forEach(function (f) {
    ["beverage_morning", "beverage_afternoon", "beverage_evening", "beverage_night"].forEach(function (key) {
      if (f[key]) beverageStats[f[key]] = (beverageStats[f[key]] || 0) + 1
    })
    ;["snack_morning", "snack_evening", "snack_night"].forEach(function (key) {
      if (f[key]) snackStats[f[key]] = (snackStats[f[key]] || 0) + 1
    })
  })

  var collegeStats = {}
  members.forEach(function (m) { if (m.member_college) collegeStats[m.member_college] = (collegeStats[m.member_college] || 0) + 1 })

  var branchStats = {}
  members.forEach(function (m) { if (m.member_branch) branchStats[m.member_branch] = (branchStats[m.member_branch] || 0) + 1 })

  function exportTeamsCSV() {
    var headers = ["Team Number", "Project Title", "Technologies", "Registered At"]
    var rows = teams.map(function (t) { return [t.team_number, t.project_title, (t.technologies || []).join("; "), new Date(t.registered_at).toLocaleString()] })
    downloadCSV(headers, rows, "teams")
  }

  function exportMembersCSV() {
    var headers = ["Team ID", "Name", "Roll Number", "Email", "Phone", "Branch", "Year", "College", "Is Leader"]
    var rows = members.map(function (m) { return [m.team_id, m.member_name, m.member_roll_number, m.member_email, m.member_phone, m.member_branch, m.member_year, m.member_college, m.is_leader ? "Yes" : "No"] })
    downloadCSV(headers, rows, "members")
  }

  function exportFoodCSV() {
    var headers = ["Team ID", "Roll Number", "Day", "Date", "Bev Morning", "Bev Afternoon", "Bev Evening", "Bev Night", "Snack Morning", "Snack Evening", "Snack Night"]
    var rows = foodSelections.map(function (f) { return [f.team_id, f.member_roll_number, f.day_number, f.day_date, f.beverage_morning, f.beverage_afternoon, f.beverage_evening, f.beverage_night, f.snack_morning, f.snack_evening, f.snack_night] })
    downloadCSV(headers, rows, "food-selections")
  }

  function downloadCSV(headers, rows, name) {
    var csv = [headers].concat(rows).map(function (r) { return r.map(function (c) { return '"' + (c || "") + '"' }).join(",") }).join("\n")
    var blob = new Blob([csv], { type: "text/csv" })
    var url = URL.createObjectURL(blob)
    var a = document.createElement("a")
    a.href = url
    a.download = "project-space-" + name + "-" + new Date().toISOString().split("T")[0] + ".csv"
    a.click()
  }

  // ---- LOGIN SCREEN ----
  if (!isAuthenticated) {
    return (
      <div className="ps-page">
        <AnimatedBackground />
        <style jsx>{`
          .adm-login { position:relative; z-index:10; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:20px; }
          .adm-login-card { width:100%; max-width:380px; padding:40px 32px; border-radius:22px; border:1px solid rgba(255,60,30,0.12); background:linear-gradient(165deg,rgba(35,12,8,0.7),rgba(18,6,4,0.85)); backdrop-filter:blur(15px); text-align:center; opacity:0; animation:psFadeIn 0.7s ease forwards; }
          .adm-login-logo { display:flex; align-items:center; gap:10px; justify-content:center; margin-bottom:28px; }
          .adm-login-icon { width:42px;height:42px; border-radius:12px; background:linear-gradient(135deg,#ff3020,#ff6040); display:flex; align-items:center; justify-content:center; font-family:var(--font-display); font-weight:900; font-size:16px; color:#fff; }
          .adm-login-title { font-family:var(--font-display); font-size:20px; font-weight:700; color:#fff; letter-spacing:2px; text-transform:uppercase; }
        `}</style>
        <div className="adm-login">
          <div className="adm-login-card">
            <div className="adm-login-logo">
              <div className="adm-login-icon">PS</div>
              <div className="adm-login-title">Admin Panel</div>
            </div>
            <form onSubmit={handleLogin}>
              <input type="password" value={password} onChange={function (e) { setPassword(e.target.value) }} placeholder="Enter admin password" className="ps-input" style={{ width: "100%", marginBottom: 16 }} />
              <button type="submit" className="ps-btn ps-btn-primary" style={{ width: "100%" }}>Login</button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // ---- ADMIN DASHBOARD ----
  return (
    <div className="ps-page">
      <AnimatedBackground />

      <style jsx>{`
        .adm-wrap { position:relative; z-index:10; min-height:100vh; }
        .adm-nav { display:flex; align-items:center; justify-content:space-between; padding:16px 24px; border-bottom:1px solid rgba(255,60,30,0.08); max-width:1600px; margin:0 auto; flex-wrap:wrap; gap:10px; background:rgba(10,10,10,0.5); backdrop-filter:blur(12px); position:sticky; top:0; z-index:40; }
        .adm-nav-left { display:flex; align-items:center; gap:10px; }
        .adm-nav-icon { width:36px;height:36px; border-radius:10px; background:linear-gradient(135deg,#ff3020,#ff6040); display:flex; align-items:center; justify-content:center; font-family:var(--font-display); font-weight:900; font-size:13px; color:#fff; }
        .adm-nav-title { font-family:var(--font-display); font-size:16px; font-weight:700; color:#fff; letter-spacing:1.5px; text-transform:uppercase; }
        .adm-live { font-family:var(--font-display); font-size:10px; color:var(--accent-light); letter-spacing:2px; text-transform:uppercase; display:flex; align-items:center; gap:5px; }
        .adm-live-dot { width:6px;height:6px; border-radius:50%; background:var(--accent-light); animation:pulse 1.5s infinite; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        .adm-nav-right { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
        .adm-reg-btn { padding:8px 16px; border-radius:10px; font-family:var(--font-display); font-size:11px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; display:flex; align-items:center; gap:6px; cursor:pointer; transition:all 0.3s ease; border:none; }
        .adm-reg-on { background:rgba(255,60,30,0.1); border:1px solid rgba(255,60,30,0.25); color:var(--accent-light); }
        .adm-reg-off { background:rgba(255,50,50,0.1); border:1px solid rgba(255,50,50,0.25); color:#ff5555; }
        .adm-reg-dot { width:7px;height:7px; border-radius:50%; }
        .adm-csv-btn { padding:7px 12px; border-radius:8px; font-family:var(--font-display); font-size:10px; font-weight:600; letter-spacing:1px; text-transform:uppercase; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); color:rgba(255,255,255,0.4); cursor:pointer; transition:all 0.3s ease; }
        .adm-csv-btn:hover { border-color:rgba(255,60,30,0.3); color:var(--accent-light); }
        .adm-logout { padding:7px 12px; border-radius:8px; font-family:var(--font-display); font-size:10px; letter-spacing:1px; text-transform:uppercase; background:transparent; border:none; color:rgba(255,255,255,0.3); cursor:pointer; transition:color 0.3s; }
        .adm-logout:hover { color:#ff5555; }

        .adm-main { max-width:1600px; margin:0 auto; padding:24px; }

        /* Stat Cards */
        .adm-stats { display:grid; grid-template-columns:repeat(6,1fr); gap:12px; margin-bottom:24px; }
        .adm-stat { padding:20px; border-radius:16px; border:1px solid rgba(255,60,30,0.1); background:linear-gradient(165deg,rgba(35,12,8,0.5),rgba(18,6,4,0.7)); }
        .adm-stat-label { font-family:var(--font-display); font-size:11px; color:rgba(255,255,255,0.3); letter-spacing:2px; text-transform:uppercase; }
        .adm-stat-value { font-family:var(--font-display); font-size:28px; font-weight:900; margin-top:4px; letter-spacing:1px; }

        /* Tabs */
        .adm-tabs { display:flex; gap:3px; margin-bottom:20px; background:rgba(255,255,255,0.02); border-radius:14px; padding:4px; width:fit-content; flex-wrap:wrap; border:1px solid rgba(255,60,30,0.06); }
        .adm-tab { padding:9px 18px; border-radius:10px; font-family:var(--font-display); font-size:11px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; cursor:pointer; transition:all 0.3s ease; background:transparent; border:none; color:rgba(255,255,255,0.35); }
        .adm-tab.active { background:linear-gradient(135deg,#ff3020,#ff6040); color:#fff; }
        .adm-tab:hover:not(.active) { color:rgba(255,255,255,0.6); }

        /* Table */
        .adm-table-wrap { overflow-x:auto; border-radius:14px; border:1px solid rgba(255,60,30,0.1); background:rgba(10,10,10,0.3); }
        .adm-table { width:100%; border-collapse:collapse; }
        .adm-table th { padding:12px 14px; text-align:left; font-family:var(--font-display); font-size:10px; font-weight:600; color:var(--accent-light); letter-spacing:2px; text-transform:uppercase; background:rgba(255,60,30,0.04); border-bottom:1px solid rgba(255,60,30,0.1); }
        .adm-table td { padding:10px 14px; border-bottom:1px solid rgba(255,255,255,0.03); font-size:13px; }
        .adm-table tr:hover td { background:rgba(255,60,30,0.02); }
        .adm-team-num { color:var(--accent-orange); font-family:var(--font-display); font-weight:700; font-size:13px; letter-spacing:1px; }
        .adm-tech-tag { padding:2px 8px; border-radius:6px; font-size:10px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.06); color:rgba(255,255,255,0.5); }

        /* Cards */
        .adm-card { padding:24px; border-radius:18px; border:1px solid rgba(255,60,30,0.1); background:linear-gradient(165deg,rgba(35,12,8,0.6),rgba(18,6,4,0.75)); backdrop-filter:blur(12px); }
        .adm-card-title { font-family:var(--font-display); font-size:16px; font-weight:700; color:#fff; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:16px; }

        /* Analytics bar */
        .adm-bar { margin-bottom:12px; }
        .adm-bar-top { display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px; }
        .adm-bar-name { color:rgba(255,255,255,0.6); }
        .adm-bar-val { font-family:var(--font-display); font-weight:700; letter-spacing:1px; }
        .adm-bar-track { width:100%; height:6px; background:rgba(255,255,255,0.04); border-radius:3px; overflow:hidden; }
        .adm-bar-fill { height:100%; border-radius:3px; transition:width 0.5s ease; }

        /* Announcement form */
        .adm-ann-types { display:flex; gap:6px; }
        .adm-ann-type { padding:5px 12px; border-radius:8px; font-family:var(--font-display); font-size:11px; font-weight:600; letter-spacing:1px; text-transform:uppercase; cursor:pointer; transition:all 0.3s; border:1px solid rgba(255,255,255,0.06); background:rgba(255,255,255,0.02); color:rgba(255,255,255,0.4); }
        .adm-ann-type.active { background:rgba(255,60,30,0.12); border-color:rgba(255,60,30,0.35); color:var(--accent-light); }
        .adm-ann-img-label { display:block; width:100%; padding:28px; border:2px dashed rgba(255,60,30,0.15); border-radius:14px; text-align:center; cursor:pointer; transition:border-color 0.3s; font-size:12px; color:rgba(255,255,255,0.3); }
        .adm-ann-img-label:hover { border-color:rgba(255,60,30,0.4); }
        .adm-ann-preview { position:relative; }
        .adm-ann-preview img { width:100%; height:140px; object-fit:cover; border-radius:12px; border:1px solid rgba(255,60,30,0.1); }
        .adm-ann-remove { position:absolute; top:8px; right:8px; width:28px; height:28px; border-radius:50%; background:#ff3030; color:#fff; border:none; cursor:pointer; font-size:12px; font-weight:bold; display:flex; align-items:center; justify-content:center; }
        .adm-ann-past { max-height:550px; overflow-y:auto; }
        .adm-ann-item { padding:14px; border-radius:12px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.04); margin-bottom:10px; }
        .adm-ann-item-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; }
        .adm-ann-badge { padding:2px 8px; border-radius:6px; font-size:10px; font-family:var(--font-display); letter-spacing:1px; text-transform:uppercase; }
        .adm-ann-del { font-size:11px; color:#ff5555; background:transparent; border:none; cursor:pointer; font-family:var(--font-display); letter-spacing:1px; }
        .adm-ann-del:hover { color:#ff3030; }

        /* Mentor stats */
        .adm-mentor-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:20px; }
        .adm-mentor-stat { padding:16px; border-radius:14px; border:1px solid rgba(255,60,30,0.08); background:rgba(255,255,255,0.015); }
        .adm-mentor-stat-label { font-family:var(--font-display); font-size:10px; color:rgba(255,255,255,0.3); letter-spacing:2px; text-transform:uppercase; }
        .adm-mentor-stat-val { font-family:var(--font-display); font-size:24px; font-weight:900; margin-top:2px; }

        .adm-status-badge { padding:3px 10px; border-radius:20px; font-size:10px; font-family:var(--font-display); letter-spacing:1px; }

        @media (max-width:1024px) { .adm-stats { grid-template-columns:repeat(3,1fr); } }
        @media (max-width:768px) {
          .adm-stats { grid-template-columns:repeat(2,1fr); }
          .adm-nav { padding:12px 16px; }
          .adm-main { padding:16px; }
          .adm-mentor-stats { grid-template-columns:1fr; }
        }
      `}</style>

      <div className="adm-wrap">
        {/* Nav */}
        <div className="adm-nav">
          <div className="adm-nav-left">
            <div className="adm-nav-icon">PS</div>
            <div className="adm-nav-title">{EVENT_CONFIG.eventName} Admin</div>
            <div className="adm-live"><span className="adm-live-dot"></span>Live</div>
          </div>
          <div className="adm-nav-right">
            <button onClick={toggleRegistration} disabled={toggling}
              className={`adm-reg-btn ${registrationOpen ? "adm-reg-on" : "adm-reg-off"}`}>
              <span className="adm-reg-dot" style={{ background: registrationOpen ? "var(--accent-light)" : "#ff5555" }}></span>
              {toggling ? "..." : registrationOpen ? "Registrations ON" : "Registrations OFF"}
            </button>
            <button onClick={exportTeamsCSV} className="adm-csv-btn">Teams CSV</button>
            <button onClick={exportMembersCSV} className="adm-csv-btn">Members CSV</button>
            <button onClick={exportFoodCSV} className="adm-csv-btn">Food CSV</button>
            <button onClick={function () { setIsAuthenticated(false) }} className="adm-logout">Logout</button>
          </div>
        </div>

        <div className="adm-main">
          {/* Stats */}
          <div className="adm-stats">
            {[
              { label: "Total Teams", value: totalTeams, color: "#ff3020" },
              { label: "Total Students", value: totalStudents, color: "#ff6040" },
              { label: "Food Selections", value: foodSelections.length, color: "#ff8040" },
              { label: "Colleges", value: Object.keys(collegeStats).length, color: "#ffaa40" },
              { label: "Announcements", value: announcements.length, color: "#ff6040" },
              { label: "Mentor Calls", value: mentorRequests.length, color: "#ff3020" },
            ].map(function (s, i) {
              return (
                <div key={i} className="adm-stat">
                  <div className="adm-stat-label">{s.label}</div>
                  <div className="adm-stat-value" style={{ color: s.color }}>{s.value}</div>
                </div>
              )
            })}
          </div>

          {/* Tabs */}
          <div className="adm-tabs">
            {["teams", "members", "announcements", "mentors", "food analytics", "tech analytics"].map(function (tab) {
              return (
                <button key={tab} onClick={function () { setActiveTab(tab) }}
                  className={"adm-tab" + (activeTab === tab ? " active" : "")}>
                  {tab}
                </button>
              )
            })}
          </div>

          {/* Content */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <span className="ps-spinner" style={{ width: 32, height: 32, margin: "0 auto" }} />
            </div>
          ) : activeTab === "teams" ? (
            <div>
              <input type="text" value={search} onChange={function (e) { setSearch(e.target.value) }} placeholder="Search teams..." className="ps-input" style={{ maxWidth: 400, marginBottom: 16 }} />
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 12, fontFamily: "var(--font-display)", letterSpacing: "1px" }}>Showing {filteredTeams.length} of {teams.length} teams</p>
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      {["Team #", "Project Title", "Technologies", "Members", "Registered"].map(function (h) {
                        return <th key={h}>{h}</th>
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeams.map(function (team) {
                      var teamMembers = members.filter(function (m) { return m.team_id === team.id })
                      return (
                        <tr key={team.id}>
                          <td><span className="adm-team-num">{team.team_number}</span></td>
                          <td style={{ fontWeight: 500, color: "#fff" }}>{team.project_title}</td>
                          <td>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                              {(team.technologies || []).slice(0, 3).map(function (t) {
                                return <span key={t} className="adm-tech-tag">{t}</span>
                              })}
                              {(team.technologies || []).length > 3 && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>+{team.technologies.length - 3}</span>}
                            </div>
                          </td>
                          <td style={{ color: "rgba(255,255,255,0.5)" }}>{teamMembers.length}</td>
                          <td style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{new Date(team.registered_at).toLocaleDateString()}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          ) : activeTab === "members" ? (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    {["Name", "Roll Number", "Email", "Phone", "Branch", "Year", "College", "Role"].map(function (h) {
                      return <th key={h}>{h}</th>
                    })}
                  </tr>
                </thead>
                <tbody>
                  {members.map(function (m) {
                    return (
                      <tr key={m.id}>
                        <td style={{ fontWeight: 500, color: "#fff" }}>{m.member_name}</td>
                        <td><span className="adm-team-num">{m.member_roll_number}</span></td>
                        <td style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{m.member_email}</td>
                        <td style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{m.member_phone}</td>
                        <td style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{m.member_branch}</td>
                        <td style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{m.member_year}</td>
                        <td style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{m.member_college}</td>
                        <td>{m.is_leader
                          ? <span style={{ color: "#ffaa40", fontSize: 11, fontFamily: "var(--font-display)", letterSpacing: "1px" }}>LEAD</span>
                          : <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>Member</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

          ) : activeTab === "announcements" ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div className="adm-card">
                <div className="adm-card-title">Create Announcement</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label className="ps-label">Title *</label>
                    <input type="text" value={annTitle} onChange={function (e) { setAnnTitle(e.target.value) }} placeholder="Announcement title" className="ps-input" style={{ width: "100%" }} />
                  </div>
                  <div>
                    <label className="ps-label">Message *</label>
                    <textarea value={annMessage} onChange={function (e) { setAnnMessage(e.target.value) }} rows={4} placeholder="Write your announcement..." className="ps-textarea" style={{ width: "100%" }}></textarea>
                  </div>
                  <div>
                    <label className="ps-label">Type</label>
                    <div className="adm-ann-types">
                      {["info", "alert", "timing", "update"].map(function (t) {
                        return (
                          <button key={t} onClick={function () { setAnnType(t) }}
                            className={"adm-ann-type" + (annType === t ? " active" : "")}>
                            {t}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="ps-label">Image (optional)</label>
                    {annImagePreview ? (
                      <div className="adm-ann-preview">
                        <img src={annImagePreview} alt="Preview" />
                        <button onClick={removeImage} className="adm-ann-remove">X</button>
                      </div>
                    ) : (
                      <label className="adm-ann-img-label">
                        Click to upload image
                        <input type="file" accept="image/*" onChange={handleImageSelect} style={{ display: "none" }} />
                      </label>
                    )}
                  </div>
                  <button onClick={sendAnnouncement} disabled={annSending} className="ps-btn ps-btn-primary" style={{ width: "100%" }}>
                    {annSending ? "Sending..." : "Send Announcement"}
                  </button>
                </div>
              </div>
              <div className="adm-card">
                <div className="adm-card-title">Past Announcements ({announcements.length})</div>
                <div className="adm-ann-past">
                  {announcements.length === 0 && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>No announcements yet</p>}
                  {announcements.map(function (a) {
                    var badgeColor = a.type === "alert" ? "rgba(255,50,30,0.15)" : a.type === "timing" ? "rgba(255,170,64,0.15)" : a.type === "update" ? "rgba(255,96,64,0.15)" : "rgba(255,128,64,0.1)"
                    var textColor = a.type === "alert" ? "#ff5040" : a.type === "timing" ? "#ffaa40" : a.type === "update" ? "#ff8040" : "#ff8040"
                    return (
                      <div key={a.id} className="adm-ann-item">
                        <div className="adm-ann-item-top">
                          <span className="adm-ann-badge" style={{ background: badgeColor, color: textColor }}>{a.type || "info"}</span>
                          <button onClick={function () { deleteAnnouncement(a.id) }} className="adm-ann-del">Delete</button>
                        </div>
                        <h4 style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 4 }}>{a.title}</h4>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>{a.message.length > 100 ? a.message.substring(0, 100) + "..." : a.message}</p>
                        {a.image_url && <img src={a.image_url} alt="" style={{ width: "100%", height: 70, objectFit: "cover", borderRadius: 8, marginTop: 8 }} />}
                        <p style={{ fontSize: 9, color: "rgba(255,255,255,0.15)", marginTop: 8 }}>{new Date(a.created_at).toLocaleString()}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

          ) : activeTab === "mentors" ? (
            <div>
              <div className="adm-mentor-stats">
                <div className="adm-mentor-stat">
                  <div className="adm-mentor-stat-label">Total Requests</div>
                  <div className="adm-mentor-stat-val" style={{ color: "#ff8040" }}>{mentorRequests.length}</div>
                </div>
                <div className="adm-mentor-stat">
                  <div className="adm-mentor-stat-label">Pending</div>
                  <div className="adm-mentor-stat-val" style={{ color: "#ffaa40" }}>{mentorRequests.filter(function (r) { return r.status === "pending" }).length}</div>
                </div>
                <div className="adm-mentor-stat">
                  <div className="adm-mentor-stat-label">Resolved</div>
                  <div className="adm-mentor-stat-val" style={{ color: "#ff3020" }}>{mentorRequests.filter(function (r) { return r.status === "resolved" }).length}</div>
                </div>
              </div>
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      {["Team", "Mentor", "Technology", "Status", "Requested", "Resolved"].map(function (h) {
                        return <th key={h}>{h}</th>
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {mentorRequests.map(function (req) {
                      return (
                        <tr key={req.id}>
                          <td><span className="adm-team-num">{req.team_number}</span></td>
                          <td style={{ fontWeight: 500, color: "#fff" }}>{req.mentor_name}</td>
                          <td style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{req.technology}</td>
                          <td>
                            {req.status === "pending"
                              ? <span className="adm-status-badge" style={{ background: "rgba(255,170,64,0.12)", color: "#ffaa40" }}>Pending</span>
                              : <span className="adm-status-badge" style={{ background: "rgba(255,60,30,0.12)", color: "#ff6040" }}>Resolved</span>
                            }
                          </td>
                          <td style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{new Date(req.requested_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td>
                          <td style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{req.resolved_at ? new Date(req.resolved_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "-"}</td>
                        </tr>
                      )
                    })}
                    {mentorRequests.length === 0 && (
                      <tr><td colSpan={6} style={{ padding: "40px 0", textAlign: "center", color: "rgba(255,255,255,0.2)" }}>No mentor requests yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          ) : activeTab === "food analytics" ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div className="adm-card">
                <div className="adm-card-title">Beverage Popularity</div>
                {Object.entries(beverageStats).sort(function (a, b) { return b[1] - a[1] }).map(function (entry) {
                  return (
                    <div key={entry[0]} className="adm-bar">
                      <div className="adm-bar-top">
                        <span className="adm-bar-name">{entry[0]}</span>
                        <span className="adm-bar-val" style={{ color: "#ff6040" }}>{entry[1]}</span>
                      </div>
                      <div className="adm-bar-track">
                        <div className="adm-bar-fill" style={{ width: (entry[1] / Math.max.apply(null, Object.values(beverageStats).concat([1]))) * 100 + "%", background: "linear-gradient(90deg,#ff3020,#ff6040)" }}></div>
                      </div>
                    </div>
                  )
                })}
                {Object.keys(beverageStats).length === 0 && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>No selections yet</p>}
              </div>
              <div className="adm-card">
                <div className="adm-card-title">Snack Popularity</div>
                {Object.entries(snackStats).sort(function (a, b) { return b[1] - a[1] }).map(function (entry) {
                  return (
                    <div key={entry[0]} className="adm-bar">
                      <div className="adm-bar-top">
                        <span className="adm-bar-name">{entry[0]}</span>
                        <span className="adm-bar-val" style={{ color: "#ff8040" }}>{entry[1]}</span>
                      </div>
                      <div className="adm-bar-track">
                        <div className="adm-bar-fill" style={{ width: (entry[1] / Math.max.apply(null, Object.values(snackStats).concat([1]))) * 100 + "%", background: "linear-gradient(90deg,#ff6040,#ffaa40)" }}></div>
                      </div>
                    </div>
                  )
                })}
                {Object.keys(snackStats).length === 0 && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>No selections yet</p>}
              </div>
            </div>

          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div className="adm-card">
                <div className="adm-card-title">Technologies Used</div>
                {Object.entries(techStats).sort(function (a, b) { return b[1] - a[1] }).map(function (entry) {
                  return (
                    <div key={entry[0]} className="adm-bar">
                      <div className="adm-bar-top">
                        <span className="adm-bar-name">{entry[0]}</span>
                        <span className="adm-bar-val" style={{ color: "#ff3020" }}>{entry[1]} teams</span>
                      </div>
                      <div className="adm-bar-track">
                        <div className="adm-bar-fill" style={{ width: (entry[1] / Math.max(totalTeams, 1)) * 100 + "%", background: "linear-gradient(90deg,#ff3020,#ff8040)" }}></div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="adm-card">
                <div className="adm-card-title">By College</div>
                {Object.entries(collegeStats).sort(function (a, b) { return b[1] - a[1] }).map(function (entry) {
                  return (
                    <div key={entry[0]} className="adm-bar">
                      <div className="adm-bar-top">
                        <span className="adm-bar-name">{entry[0]}</span>
                        <span className="adm-bar-val" style={{ color: "#ffaa40" }}>{entry[1]} students</span>
                      </div>
                      <div className="adm-bar-track">
                        <div className="adm-bar-fill" style={{ width: (entry[1] / Math.max(totalStudents, 1)) * 100 + "%", background: "linear-gradient(90deg,#ff8040,#ffaa40)" }}></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}