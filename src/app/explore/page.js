"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import DashboardSidebar from "@/components/DashboardSidebar"

var MAIN_TECHS = [
  { label: "All", value: "All" },
  { label: "AWS & DevOps", value: "AWS Development with DevOps" },
  { label: "Data", value: "Data Specialist" },
  { label: "Flutter", value: "FSD With Flutter" },
  { label: "React Native", value: "FSD With React Native" },
  { label: "ServiceNow", value: "SERVICE NOW" },
  { label: "VLSI", value: "VLSI" },
]

export default function ExploreTeamsPage() {
  var router = useRouter()
  var [teams, setTeams] = useState([])
  var [members, setMembers] = useState([])
  var [loading, setLoading] = useState(true)
  var [selectedTeam, setSelectedTeam] = useState(null)
  var [selectedIndex, setSelectedIndex] = useState(0)
  var [filterTech, setFilterTech] = useState("All")
  var [filterBranch, setFilterBranch] = useState("All")
  var [searchQuery, setSearchQuery] = useState("")
  var [detailKey, setDetailKey] = useState(0)
  var [teamNumber, setTeamNumber] = useState("")
  var [loggedInRoll, setLoggedInRoll] = useState("")
  var [currentMember, setCurrentMember] = useState(null)
  var [isLeader, setIsLeader] = useState(false)

  useEffect(function () {
    var roll = sessionStorage.getItem("ps_roll") || localStorage.getItem("ps_roll")
    if (!roll) { router.push("/login"); return }
    setLoggedInRoll(roll)
    async function load() {
      var [teamsRes, membersRes] = await Promise.all([
        supabase.from("teams").select("*").order("team_number", { ascending: true }),
        supabase.from("team_members").select("*"),
      ])
      var t = teamsRes.data || []
      var m = membersRes.data || []
      setTeams(t); setMembers(m)
      if (t.length > 0) { setSelectedTeam(t[0]); setSelectedIndex(0) }
      var me = m.find(function (x) { return x.member_roll_number === roll })
      if (me) {
        setCurrentMember(me); setIsLeader(!!me.is_leader)
        var myTeam = t.find(function (tm) { return tm.id === me.team_id })
        if (myTeam) setTeamNumber(myTeam.team_number)
      }
      setLoading(false)
    }
    load()
  }, [])

  var filtered = teams.filter(function (t) {
    if (filterTech !== "All") {
      var techs = t.technologies || []
      if (!techs.some(function (tc) { return tc.toLowerCase().includes(filterTech.toLowerCase()) })) return false
    }
    if (filterBranch !== "All") {
      var tm = members.filter(function (m) { return m.team_id === t.id })
      if (!tm.some(function (m) { return m.member_branch === filterBranch })) return false
    }
    if (searchQuery.trim()) {
      var q = searchQuery.toLowerCase()
      if (!(t.project_title || "").toLowerCase().includes(q) && !(t.team_number || "").toLowerCase().includes(q) && !(t.technologies || []).some(function (tc) { return tc.toLowerCase().includes(q) })) return false
    }
    return true
  })

  function getTeamMembers(team) { return members.filter(function (m) { return m.team_id === team.id }) }

  var allBranches = ["All"]
  members.forEach(function (m) { if (m.member_branch && allBranches.indexOf(m.member_branch) === -1) allBranches.push(m.member_branch) })

  function selectTeam(team, index) {
    if (selectedTeam && selectedTeam.id === team.id) return
    setSelectedTeam(team); setSelectedIndex(index); setDetailKey(function (k) { return k + 1 })
  }

  useEffect(function () {
    function handleKey(e) {
      if (e.key === "ArrowDown" && selectedIndex < filtered.length - 1) { e.preventDefault(); selectTeam(filtered[selectedIndex + 1], selectedIndex + 1) }
      if (e.key === "ArrowUp" && selectedIndex > 0) { e.preventDefault(); selectTeam(filtered[selectedIndex - 1], selectedIndex - 1) }
    }
    window.addEventListener("keydown", handleKey)
    return function () { window.removeEventListener("keydown", handleKey) }
  }, [selectedIndex, filtered])

  if (loading) {
    return <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: "'Genos',sans-serif", fontSize: 24, color: "#ff6040", letterSpacing: 4 }}>Loading...</div>
    </div>
  }

  var teamMembers = selectedTeam ? getTeamMembers(selectedTeam) : []

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#000", fontFamily: "'DM Sans',sans-serif" }}>
      <style jsx>{`
        /* ===== SPACE BACKGROUND ===== */
        .ex-bg { position:fixed; inset:0; z-index:0; overflow:hidden; background:#000; }
        .ex-stars { position:absolute; inset:0; z-index:0; }
        .ex-s { position:absolute; border-radius:50%; background:rgba(255,200,180,0.5); }
        .ex-s.dim { background:rgba(255,180,160,0.2); }
        .ex-s.twinkle { animation:exTw 3s ease-in-out infinite; }
        @keyframes exTw { 0%,100%{opacity:0.3} 50%{opacity:1} }

        .ex-bg-img { position:absolute; left:0; right:0; bottom:0; height:100%; background:url('/space-bg.png') center bottom/cover no-repeat; z-index:1; clip-path:inset(0 100% 0 0); animation:exReveal 5s cubic-bezier(0.22,0.61,0.36,1) 0.2s forwards; }
        .ex-bg-img::after { content:""; position:absolute; inset:0; background:rgba(0,0,0,0.8); }
        .ex-bg-img::before { content:""; position:absolute; top:0; left:0; right:0; height:50%; background:linear-gradient(to bottom, #000 0%, transparent 100%); z-index:1; }
        @keyframes exReveal { 0%{clip-path:inset(0 100% 0 0)} 100%{clip-path:inset(0 0% 0 0)} }

        .ex-shoot { position:absolute; z-index:2; width:80px; height:1px; background:linear-gradient(90deg, rgba(255,160,120,0.7), transparent); border-radius:1px; opacity:0; transform:rotate(-35deg); }
        .ex-shoot::before { content:""; position:absolute; left:0; top:-1px; width:4px; height:3px; border-radius:50%; background:rgba(255,200,170,0.9); box-shadow:0 0 6px rgba(255,150,100,0.6); }
        .ex-shoot.s1 { animation:exSh1 8s linear 2s infinite; }
        .ex-shoot.s2 { animation:exSh2 11s linear 5s infinite; }
        @keyframes exSh1 { 0%{top:8%;left:-5%;opacity:0} 2%{opacity:1} 8%{top:28%;left:35%;opacity:0} 100%{opacity:0} }
        @keyframes exSh2 { 0%{top:5%;left:40%;opacity:0} 1.5%{opacity:0.8} 6%{top:22%;left:72%;opacity:0} 100%{opacity:0} }

        /* ===== MAIN LAYOUT ===== */
        .ex-main { flex:1; position:relative; z-index:10; display:flex; flex-direction:column; height:100vh; overflow:hidden; }

        /* ===== TOP BAR ===== */
        .ex-top { display:flex; align-items:center; gap:14px; padding:14px 24px; border-bottom:1px solid rgba(255,255,255,0.05); backdrop-filter:blur(20px); background:rgba(0,0,0,0.4); flex-wrap:wrap; }
        .ex-search { position:relative; flex:0 0 240px; }
        .ex-search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); width:16px; height:16px; filter:brightness(0) invert(0.35); pointer-events:none; }
        .ex-search input { width:100%; padding:9px 14px 9px 38px; border-radius:10px; border:1px solid rgba(255,255,255,0.06); background:rgba(255,255,255,0.03); color:#fff; font-size:12px; font-family:'DM Sans',sans-serif; outline:none; transition:all 0.3s; }
        .ex-search input:focus { border-color:rgba(255,96,64,0.3); background:rgba(255,255,255,0.05); }
        .ex-search input::placeholder { color:rgba(255,255,255,0.18); }
        .ex-filters { display:flex; gap:5px; flex:1; flex-wrap:wrap; }
        .ex-pill { padding:6px 14px; border-radius:20px; font-size:11px; font-weight:600; color:rgba(255,255,255,0.3); cursor:pointer; transition:all 0.3s; border:1px solid rgba(255,255,255,0.04); background:transparent; font-family:'Genos',sans-serif; letter-spacing:1px; text-transform:uppercase; white-space:nowrap; }
        .ex-pill:hover { color:rgba(255,255,255,0.5); border-color:rgba(255,96,64,0.12); }
        .ex-pill.on { color:#ff6040; border-color:rgba(255,96,64,0.3); background:rgba(255,96,64,0.06); }
        .ex-branch { padding:7px 12px; border-radius:10px; border:1px solid rgba(255,255,255,0.06); background:rgba(255,255,255,0.03); color:rgba(255,255,255,0.4); font-size:11px; font-family:'DM Sans',sans-serif; outline:none; cursor:pointer; }
        .ex-branch option { background:#111; color:#fff; }

        /* ===== CONTENT AREA ===== */
        .ex-content { flex:1; display:flex; gap:0; overflow:hidden; }

        /* ===== LEFT: DETAIL ===== */
        .ex-detail { flex:1; padding:32px 36px; overflow-y:auto; display:flex; flex-direction:column; justify-content:center; }
        .ex-detail::-webkit-scrollbar { width:0; }
        .ex-detail-inner { animation:exFadeIn 0.6s ease forwards; }
        @keyframes exFadeIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }

        .ex-d-num { font-family:'Genos',sans-serif; font-size:13px; font-weight:600; letter-spacing:3px; text-transform:uppercase; background:linear-gradient(135deg,#ff3020,#ff8040); -webkit-background-clip:text; -webkit-text-fill-color:transparent; margin-bottom:8px; opacity:0; animation:exSlide 0.5s ease 0.05s forwards; }
        .ex-d-title { font-family:'Genos',sans-serif; font-weight:900; font-size:48px; line-height:1.05; color:#fff; text-transform:uppercase; letter-spacing:2px; margin-bottom:14px; opacity:0; animation:exSlide 0.5s ease 0.1s forwards; }
        .ex-d-meta { display:flex; align-items:center; gap:14px; margin-bottom:14px; flex-wrap:wrap; opacity:0; animation:exSlide 0.5s ease 0.15s forwards; }
        .ex-d-meta-item { font-size:12px; color:rgba(255,255,255,0.35); display:flex; align-items:center; gap:5px; }
        .ex-d-meta-item strong { color:#ff8040; font-weight:700; }
        .ex-d-techs { display:flex; gap:7px; flex-wrap:wrap; margin-bottom:16px; opacity:0; animation:exSlide 0.5s ease 0.2s forwards; }
        .ex-d-tech { padding:4px 12px; border-radius:20px; font-size:11px; font-weight:500; color:rgba(255,255,255,0.5); background:rgba(255,96,64,0.05); border:1px solid rgba(255,96,64,0.1); transition:all 0.3s; }
        .ex-d-tech:hover { background:rgba(255,96,64,0.1); border-color:rgba(255,96,64,0.25); color:#fff; }
        .ex-d-desc { font-size:13px; line-height:1.8; color:rgba(255,255,255,0.3); max-width:500px; margin-bottom:28px; opacity:0; animation:exSlide 0.5s ease 0.25s forwards; }

        .ex-d-members { opacity:0; animation:exSlide 0.5s ease 0.3s forwards; }
        .ex-d-members-title { font-family:'Genos',sans-serif; font-size:13px; font-weight:700; color:rgba(255,255,255,0.2); letter-spacing:2px; text-transform:uppercase; margin-bottom:12px; }
        .ex-d-member { display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.03); }
        .ex-d-member:last-child { border-bottom:none; }
        .ex-d-m-avatar { width:32px; height:32px; border-radius:50%; background:linear-gradient(135deg,rgba(255,50,30,0.25),rgba(255,80,40,0.12)); display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; color:#ff8040; flex-shrink:0; }
        .ex-d-m-info { flex:1; }
        .ex-d-m-name { font-size:13px; font-weight:600; color:rgba(255,255,255,0.65); }
        .ex-d-m-roll { font-size:11px; color:rgba(255,255,255,0.18); }
        .ex-d-m-branch { font-size:11px; color:rgba(255,96,64,0.35); }
        .ex-d-m-leader { font-size:9px; padding:2px 7px; border-radius:10px; background:rgba(255,96,64,0.1); color:#ff6040; font-weight:700; letter-spacing:1px; text-transform:uppercase; margin-left:6px; }

        @keyframes exSlide { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

        /* ===== RIGHT: TEAM LIST ===== */
        .ex-list { width:360px; min-width:360px; border-left:1px solid rgba(255,255,255,0.04); overflow-y:auto; padding:18px 16px; }
        .ex-list::-webkit-scrollbar { width:3px; }
        .ex-list::-webkit-scrollbar-thumb { background:rgba(255,96,64,0.12); border-radius:4px; }
        .ex-list-title { font-family:'Genos',sans-serif; font-size:15px; font-weight:700; color:rgba(255,255,255,0.15); letter-spacing:2px; text-transform:uppercase; margin-bottom:12px; padding:0 4px; }
        .ex-list-count { color:rgba(255,96,64,0.4); }

        .ex-card { position:relative; padding:16px 18px; border-radius:12px; cursor:pointer; border:1px solid rgba(255,255,255,0.03); background:rgba(255,255,255,0.01); transition:all 0.35s cubic-bezier(0.4,0,0.2,1); margin-bottom:8px; overflow:hidden; }
        .ex-card::before { content:''; position:absolute; left:0; top:0; bottom:0; width:0; background:linear-gradient(180deg,#ff3020,#ff8040); transition:width 0.3s ease; border-radius:12px 0 0 12px; }
        .ex-card:hover { border-color:rgba(255,96,64,0.12); background:rgba(255,96,64,0.015); transform:translateX(-2px); }
        .ex-card.on { border-color:rgba(255,96,64,0.2); background:rgba(255,96,64,0.03); }
        .ex-card.on::before { width:3px; }
        .ex-c-num { font-family:'Genos',sans-serif; font-size:10px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:rgba(255,96,64,0.4); margin-bottom:3px; }
        .ex-c-title { font-family:'Genos',sans-serif; font-size:18px; font-weight:800; color:rgba(255,255,255,0.85); text-transform:uppercase; letter-spacing:1px; line-height:1.15; margin-bottom:6px; }
        .ex-c-bottom { display:flex; align-items:center; justify-content:space-between; }
        .ex-c-techs { font-size:10px; color:rgba(255,255,255,0.15); }
        .ex-c-members { font-size:10px; color:rgba(255,255,255,0.12); }

        .ex-empty { text-align:center; padding:60px 20px; color:rgba(255,255,255,0.15); font-size:13px; }

        @media (max-width:900px) {
          .ex-content { flex-direction:column-reverse; }
          .ex-list { width:100%; min-width:auto; max-height:35vh; border-left:none; border-bottom:1px solid rgba(255,255,255,0.04); }
          .ex-detail { padding:20px 16px; }
          .ex-d-title { font-size:32px; }
          .ex-top { padding:10px 14px; }
          .ex-search { flex:1 1 100%; }
        }
      `}</style>

      {/* Space background */}
      <div className="ex-bg">
        <div className="ex-stars">
          <div className="ex-s twinkle" style={{width:2,height:2,top:"8%",left:"6%"}} />
          <div className="ex-s" style={{width:1.5,height:1.5,top:"5%",left:"22%"}} />
          <div className="ex-s twinkle" style={{width:2.5,height:2.5,top:"12%",left:"42%",animationDelay:"1s"}} />
          <div className="ex-s dim" style={{width:1,height:1,top:"3%",left:"58%"}} />
          <div className="ex-s twinkle" style={{width:2,height:2,top:"15%",left:"75%",animationDelay:"2s"}} />
          <div className="ex-s" style={{width:1.5,height:1.5,top:"7%",left:"88%"}} />
          <div className="ex-s dim" style={{width:1,height:1,top:"22%",left:"32%"}} />
          <div className="ex-s dim" style={{width:1,height:1,top:"30%",left:"55%"}} />
        </div>
        <div className="ex-bg-img" />
        <div className="ex-shoot s1" />
        <div className="ex-shoot s2" />
      </div>

      {/* Sidebar */}
      <DashboardSidebar teamNumber={teamNumber} currentMember={currentMember} loggedInRoll={loggedInRoll} isLeader={isLeader} />

      {/* Main content */}
      <div className="ex-main">
        {/* Top filter bar */}
        <div className="ex-top">
          <div className="ex-search">
            <img src="https://cdn-icons-png.flaticon.com/128/6933/6933200.png" alt="" className="ex-search-icon" />
            <input type="text" placeholder="Search teams, projects, tech..." value={searchQuery} onChange={function (e) { setSearchQuery(e.target.value) }} />
          </div>
          <div className="ex-filters">
            {MAIN_TECHS.map(function (tech) {
              return <button key={tech.value} className={"ex-pill" + (filterTech === tech.value ? " on" : "")} onClick={function () { setFilterTech(tech.value); setSelectedTeam(null) }}>{tech.label}</button>
            })}
          </div>
          <select className="ex-branch" value={filterBranch} onChange={function (e) { setFilterBranch(e.target.value); setSelectedTeam(null) }}>
            {allBranches.map(function (b) { return <option key={b} value={b}>{b === "All" ? "All Branches" : b}</option> })}
          </select>
        </div>

        {/* Content */}
        <div className="ex-content">
          {/* Left: Detail */}
          <div className="ex-detail">
            {selectedTeam ? (
              <div className="ex-detail-inner" key={detailKey}>
                <div className="ex-d-num">{selectedTeam.team_number}</div>
                <div className="ex-d-title">{selectedTeam.project_title || "Untitled Project"}</div>
                <div className="ex-d-meta">
                  <div className="ex-d-meta-item">{"\uD83D\uDC65"} <strong>{teamMembers.length}</strong> Members</div>
                  {selectedTeam.college_name && <div className="ex-d-meta-item">{"\uD83C\uDFEB"} {selectedTeam.college_name}</div>}
                </div>
                <div className="ex-d-techs">
                  {(selectedTeam.technologies || []).map(function (tech, i) { return <span key={i} className="ex-d-tech">{tech}</span> })}
                </div>
                {selectedTeam.project_description && <p className="ex-d-desc">{selectedTeam.project_description}</p>}
                <div className="ex-d-members">
                  <div className="ex-d-members-title">Team Members</div>
                  {teamMembers.map(function (m, i) {
                    return (
                      <div key={i} className="ex-d-member">
                        <div className="ex-d-m-avatar">{m.member_name ? m.member_name.charAt(0).toUpperCase() : "?"}</div>
                        <div className="ex-d-m-info">
                          <div className="ex-d-m-name">{m.member_name}{m.is_leader && <span className="ex-d-m-leader">Leader</span>}</div>
                          <div className="ex-d-m-roll">{m.member_roll_number}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="ex-empty">
                <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>{"\uD83D\uDD0D"}</div>
                <div>Select a team to view details</div>
              </div>
            )}
          </div>

          {/* Right: Team list */}
          <div className="ex-list">
            <div className="ex-list-title">Teams <span className="ex-list-count">({filtered.length})</span></div>
            {filtered.length === 0 ? (
              <div className="ex-empty">No teams match your filters</div>
            ) : filtered.map(function (team, i) {
              var tm = getTeamMembers(team)
              var isActive = selectedTeam && selectedTeam.id === team.id
              return (
                <div key={team.id} className={"ex-card" + (isActive ? " on" : "")} onClick={function () { selectTeam(team, i) }}>
                  <div className="ex-c-num">{team.team_number}</div>
                  <div className="ex-c-title">{team.project_title || "Untitled"}</div>
                  <div className="ex-c-bottom">
                    <span className="ex-c-techs">{(team.technologies || []).slice(0, 2).join(" • ")}</span>
                    <span className="ex-c-members">{"\uD83D\uDC65"} {tm.length}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}