"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { EVENT_CONFIG } from "@/config/formFields"

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
      reader.onload = function (ev) {
        setAnnImagePreview(ev.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  function removeImage() {
    setAnnImage(null)
    setAnnImagePreview("")
  }

  function sendAnnouncement() {
    if (!annTitle.trim() || !annMessage.trim()) {
      alert("Please enter title and message")
      return
    }
    setAnnSending(true)

    var formData = new FormData()
    formData.append("title", annTitle)
    formData.append("message", annMessage)
    formData.append("type", annType)
    if (annImage) {
      formData.append("image", annImage)
    }

    fetch("/api/announcements", {
      method: "POST",
      body: formData,
    })
      .then(function (res) { return res.json() })
      .then(function (data) {
        if (data.success) {
          setAnnTitle("")
          setAnnMessage("")
          setAnnType("info")
          setAnnImage(null)
          setAnnImagePreview("")
          fetchAll()
          alert("Announcement sent!")
        } else {
          alert(data.error || "Failed to send")
        }
        setAnnSending(false)
      })
      .catch(function () {
        alert("Something went wrong")
        setAnnSending(false)
      })
  }

  function deleteAnnouncement(id) {
    if (!confirm("Delete this announcement?")) return
    fetch("/api/announcements?id=" + id, { method: "DELETE" })
      .then(function () { fetchAll() })
  }

  var filteredTeams = teams.filter(function (t) {
    return t.team_number.toLowerCase().includes(search.toLowerCase()) ||
      t.project_title.toLowerCase().includes(search.toLowerCase())
  })

  var totalTeams = teams.length
  var totalStudents = members.length

  var techStats = {}
  teams.forEach(function (t) {
    (t.technologies || []).forEach(function (tech) {
      techStats[tech] = (techStats[tech] || 0) + 1
    })
  })

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
  members.forEach(function (m) {
    if (m.member_college) collegeStats[m.member_college] = (collegeStats[m.member_college] || 0) + 1
  })

  var branchStats = {}
  members.forEach(function (m) {
    if (m.member_branch) branchStats[m.member_branch] = (branchStats[m.member_branch] || 0) + 1
  })

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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="w-full max-w-sm p-8">
          <div className="flex items-center gap-3 justify-center mb-8">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center font-bold text-black text-lg">PS</div>
            <span className="text-xl font-semibold">Admin Panel</span>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" value={password} onChange={function (e) { setPassword(e.target.value) }} placeholder="Enter admin password" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50" />
            <button type="submit" className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold rounded-xl">Login</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-white/5 max-w-[1600px] mx-auto flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center font-bold text-black text-lg">PS</div>
          <span className="text-xl font-semibold">{EVENT_CONFIG.eventName} Admin</span>
          <span className="text-xs text-gray-500 ml-2">Live</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={toggleRegistration} disabled={toggling}
            className={registrationOpen
              ? "px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
              : "px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 bg-red-500/20 border border-red-500/30 text-red-400"
            }>
            <span className={registrationOpen ? "w-2 h-2 rounded-full bg-emerald-400" : "w-2 h-2 rounded-full bg-red-400"}></span>
            {toggling ? "..." : registrationOpen ? "Registrations ON" : "Registrations OFF"}
          </button>
          <button onClick={exportTeamsCSV} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs hover:bg-white/10">Teams CSV</button>
          <button onClick={exportMembersCSV} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs hover:bg-white/10">Members CSV</button>
          <button onClick={exportFoodCSV} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs hover:bg-white/10">Food CSV</button>
          <button onClick={function () { setIsAuthenticated(false) }} className="px-3 py-2 text-xs text-gray-400 hover:text-white">Logout</button>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          {[
            { label: "Total Teams", value: totalTeams, color: "from-emerald-400 to-cyan-400" },
            { label: "Total Students", value: totalStudents, color: "from-cyan-400 to-blue-400" },
            { label: "Food Selections", value: foodSelections.length, color: "from-purple-400 to-pink-400" },
            { label: "Colleges", value: Object.keys(collegeStats).length, color: "from-yellow-400 to-orange-400" },
            { label: "Announcements", value: announcements.length, color: "from-pink-400 to-red-400" },
            { label: "Mentor Calls", value: mentorRequests.length, color: "from-violet-400 to-purple-400" },
          ].map(function (s, i) {
            return (
              <div key={i} className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                <p className="text-sm text-gray-400">{s.label}</p>
                <p className={"text-3xl font-bold mt-1 text-transparent bg-clip-text bg-gradient-to-r " + s.color}>{s.value}</p>
              </div>
            )
          })}
        </div>

        <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1 w-fit flex-wrap">
          {["teams", "members", "announcements", "mentors", "food analytics", "tech analytics"].map(function (tab) {
            return (
              <button key={tab} onClick={function () { setActiveTab(tab) }}
                className={activeTab === tab
                  ? "px-5 py-2 rounded-lg text-sm font-medium capitalize bg-white/10 text-white"
                  : "px-5 py-2 rounded-lg text-sm font-medium capitalize text-gray-400 hover:text-white"
                }>
                {tab}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading...</div>
        ) : activeTab === "teams" ? (
          <div>
            <input type="text" value={search} onChange={function (e) { setSearch(e.target.value) }} placeholder="Search teams..." className="w-full max-w-md px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 mb-6" />
            <p className="text-sm text-gray-400 mb-4">Showing {filteredTeams.length} of {teams.length} teams</p>
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/5">
                    {["Team #", "Project Title", "Technologies", "Members", "Registered"].map(function (h) {
                      return <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">{h}</th>
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredTeams.map(function (team) {
                    var teamMembers = members.filter(function (m) { return m.team_id === team.id })
                    return (
                      <tr key={team.id} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3"><span className="text-emerald-400 font-mono font-bold text-sm">{team.team_number}</span></td>
                        <td className="px-4 py-3 font-medium">{team.project_title}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(team.technologies || []).slice(0, 3).map(function (t) {
                              return <span key={t} className="px-2 py-0.5 bg-white/5 rounded text-xs">{t}</span>
                            })}
                            {(team.technologies || []).length > 3 && <span className="text-xs text-gray-500">+{team.technologies.length - 3}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{teamMembers.length}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{new Date(team.registered_at).toLocaleDateString()}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === "members" ? (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5">
                  {["Name", "Roll Number", "Email", "Phone", "Branch", "Year", "College", "Role"].map(function (h) {
                    return <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">{h}</th>
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {members.map(function (m) {
                  return (
                    <tr key={m.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-medium">{m.member_name}</td>
                      <td className="px-4 py-3 text-sm font-mono">{m.member_roll_number}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{m.member_email}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{m.member_phone}</td>
                      <td className="px-4 py-3 text-xs">{m.member_branch}</td>
                      <td className="px-4 py-3 text-xs">{m.member_year}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{m.member_college}</td>
                      <td className="px-4 py-3">{m.is_leader ? <span className="text-yellow-400 text-xs">Lead</span> : <span className="text-gray-500 text-xs">Member</span>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : activeTab === "announcements" ? (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
              <h3 className="text-lg font-semibold mb-4">Create Announcement</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Title *</label>
                  <input type="text" value={annTitle} onChange={function (e) { setAnnTitle(e.target.value) }} placeholder="Announcement title" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Message *</label>
                  <textarea value={annMessage} onChange={function (e) { setAnnMessage(e.target.value) }} rows={4} placeholder="Write your announcement..." className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 resize-none"></textarea>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Type</label>
                  <div className="flex gap-2">
                    {["info", "alert", "timing", "update"].map(function (t) {
                      return (
                        <button key={t} onClick={function () { setAnnType(t) }}
                          className={annType === t
                            ? "px-3 py-1.5 rounded-lg text-xs font-medium capitalize bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                            : "px-3 py-1.5 rounded-lg text-xs font-medium capitalize bg-white/5 border border-white/10 text-gray-400 hover:text-white"
                          }>
                          {t}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Image (optional)</label>
                  {annImagePreview ? (
                    <div className="relative">
                      <img src={annImagePreview} alt="Preview" className="w-full h-40 object-cover rounded-xl border border-white/10" />
                      <button onClick={removeImage} className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">X</button>
                    </div>
                  ) : (
                    <label className="block w-full py-8 border-2 border-dashed border-white/10 rounded-xl text-center cursor-pointer hover:border-emerald-500/30">
                      <span className="text-gray-400 text-sm">Click to upload image</span>
                      <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                    </label>
                  )}
                </div>
                <button onClick={sendAnnouncement} disabled={annSending}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold rounded-xl disabled:opacity-50">
                  {annSending ? "Sending..." : "Send Announcement"}
                </button>
              </div>
            </div>
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
              <h3 className="text-lg font-semibold mb-4">Past Announcements ({announcements.length})</h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {announcements.length === 0 && <p className="text-gray-500 text-sm">No announcements yet</p>}
                {announcements.map(function (a) {
                  return (
                    <div key={a.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className={
                          a.type === "alert" ? "px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400" :
                          a.type === "timing" ? "px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400" :
                          a.type === "update" ? "px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400" :
                          "px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-400"
                        }>{a.type || "info"}</span>
                        <button onClick={function () { deleteAnnouncement(a.id) }} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                      </div>
                      <h4 className="font-medium text-sm">{a.title}</h4>
                      <p className="text-xs text-gray-400 mt-1">{a.message.length > 100 ? a.message.substring(0, 100) + "..." : a.message}</p>
                      {a.image_url && <img src={a.image_url} alt="" className="w-full h-20 object-cover rounded mt-2" />}
                      <p className="text-[10px] text-gray-600 mt-2">{new Date(a.created_at).toLocaleString()}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : activeTab === "mentors" ? (
          <div>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
                <p className="text-sm text-gray-400">Total Requests</p>
                <p className="text-2xl font-bold text-purple-400">{mentorRequests.length}</p>
              </div>
              <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
                <p className="text-sm text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-400">{mentorRequests.filter(function (r) { return r.status === "pending" }).length}</p>
              </div>
              <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
                <p className="text-sm text-gray-400">Resolved</p>
                <p className="text-2xl font-bold text-emerald-400">{mentorRequests.filter(function (r) { return r.status === "resolved" }).length}</p>
              </div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/5">
                    {["Team", "Mentor", "Technology", "Status", "Requested", "Resolved"].map(function (h) {
                      return <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">{h}</th>
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {mentorRequests.map(function (req) {
                    return (
                      <tr key={req.id} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3"><span className="text-emerald-400 font-mono font-bold text-sm">{req.team_number}</span></td>
                        <td className="px-4 py-3 font-medium">{req.mentor_name}</td>
                        <td className="px-4 py-3 text-sm">{req.technology}</td>
                        <td className="px-4 py-3">
                          {req.status === "pending"
                            ? <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">Pending</span>
                            : <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs">Resolved</span>
                          }
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{new Date(req.requested_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{req.resolved_at ? new Date(req.resolved_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "-"}</td>
                      </tr>
                    )
                  })}
                  {mentorRequests.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No mentor requests yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === "food analytics" ? (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
              <h3 className="text-lg font-semibold mb-4">Beverage Popularity</h3>
              <div className="space-y-3">
                {Object.entries(beverageStats).sort(function (a, b) { return b[1] - a[1] }).map(function (entry) {
                  return (
                    <div key={entry[0]}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">{entry[0]}</span>
                        <span className="text-emerald-400 font-medium">{entry[1]}</span>
                      </div>
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full" style={{ width: (entry[1] / Math.max.apply(null, Object.values(beverageStats).concat([1]))) * 100 + "%" }}></div>
                      </div>
                    </div>
                  )
                })}
                {Object.keys(beverageStats).length === 0 && <p className="text-gray-500 text-sm">No selections yet</p>}
              </div>
            </div>
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
              <h3 className="text-lg font-semibold mb-4">Snack Popularity</h3>
              <div className="space-y-3">
                {Object.entries(snackStats).sort(function (a, b) { return b[1] - a[1] }).map(function (entry) {
                  return (
                    <div key={entry[0]}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">{entry[0]}</span>
                        <span className="text-cyan-400 font-medium">{entry[1]}</span>
                      </div>
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: (entry[1] / Math.max.apply(null, Object.values(snackStats).concat([1]))) * 100 + "%" }}></div>
                      </div>
                    </div>
                  )
                })}
                {Object.keys(snackStats).length === 0 && <p className="text-gray-500 text-sm">No selections yet</p>}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
              <h3 className="text-lg font-semibold mb-4">Technologies Used</h3>
              <div className="space-y-3">
                {Object.entries(techStats).sort(function (a, b) { return b[1] - a[1] }).map(function (entry) {
                  return (
                    <div key={entry[0]}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">{entry[0]}</span>
                        <span className="text-purple-400 font-medium">{entry[1]} teams</span>
                      </div>
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: (entry[1] / Math.max(totalTeams, 1)) * 100 + "%" }}></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
              <h3 className="text-lg font-semibold mb-4">By College</h3>
              <div className="space-y-3">
                {Object.entries(collegeStats).sort(function (a, b) { return b[1] - a[1] }).map(function (entry) {
                  return (
                    <div key={entry[0]}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">{entry[0]}</span>
                        <span className="text-yellow-400 font-medium">{entry[1]} students</span>
                      </div>
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full" style={{ width: (entry[1] / Math.max(totalStudents, 1)) * 100 + "%" }}></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}