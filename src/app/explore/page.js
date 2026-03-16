"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import DashboardSidebar from "@/components/DashboardSidebar"

// Generate tags from technologies
function generateTags(techs) {
  var tagMap = {
    "Power Apps": "Automation", "Power Automate": "Automation", "Power BI": "Analytics",
    "SharePoint": "Data", "Dataverse": "Data", "Excel": "Data",
    "AI Builder": "AI", "OpenAI API": "AI", "OpenAI": "AI", "Copilot Studio": "AI",
    "Azure OpenAI": "AI", "Gemini": "AI", "Copilot": "AI", "AI": "AI",
    "Python": "Development", "Flask": "Development", "FastAPI": "Development",
    "HTML": "Web Dev", "CSS": "Web Dev", "JavaScript": "Web Dev", "React": "Web Dev", "Next.js": "Web Dev",
    "Node.js": "Development", "MySQL": "Database", "MongoDB": "Database",
    "TensorFlow": "ML", "Scikit-learn": "ML", "Pandas": "ML", "NumPy": "ML", "spaCy": "NLP",
    "Snowflake": "Data Engineering", "Apache Kafka": "Data Engineering", "Apache Airflow": "Data Engineering", "DBT": "Data Engineering",
    "Azure AD": "Cloud", "Azure ML": "Cloud", "Azure": "Cloud", "AWS": "Cloud",
    "Flutter": "Mobile", "React Native": "Mobile",
    "Arduino": "IoT", "Raspberry Pi": "IoT", "MQTT": "IoT",
    "Twilio": "Communication", "Outlook": "Communication", "Teams": "Communication",
  }
  var tags = {}
  ;(techs || []).forEach(function (t) {
    var tag = tagMap[t]
    if (tag) tags[tag] = true
  })
  var result = Object.keys(tags).slice(0, 3)
  if (result.length === 0) result = ["Project"]
  return result
}

export default function ExploreTeamsPage() {
  var router = useRouter()
  var [allTeams, setAllTeams] = useState([])
  var [teamsLoading, setTeamsLoading] = useState(true)
  var [currentIndex, setCurrentIndex] = useState(0)
  var [isLiked, setIsLiked] = useState({})
  var [filter, setFilter] = useState("All Teams")
  var [searchOpen, setSearchOpen] = useState(false)
  var [searchQuery, setSearchQuery] = useState("")
  var [teamNumber, setTeamNumber] = useState("")
  var [currentMember, setCurrentMember] = useState(null)
  var [loggedInRoll, setLoggedInRoll] = useState("")
  var [isLeader, setIsLeader] = useState(false)
  var [detailAnim, setDetailAnim] = useState(true)
  var scrollRef = useRef(null)

  useEffect(function () {
    var roll = sessionStorage.getItem("ps_roll") || localStorage.getItem("ps_roll") || ""
    var storedTeam = sessionStorage.getItem("ps_team_number") || localStorage.getItem("ps_team_number") || ""
    setLoggedInRoll(roll)
    setTeamNumber(storedTeam)

    async function loadData() {
      // Fetch current member for sidebar
      if (roll && storedTeam) {
        try {
          var teamRes = await supabase.from("teams").select("id").eq("team_number", storedTeam).single()
          if (teamRes.data) {
            var memberRes = await supabase.from("team_members").select("*").eq("team_id", teamRes.data.id).eq("member_roll_number", roll).single()
            if (memberRes.data) { setCurrentMember(memberRes.data); setIsLeader(memberRes.data.is_leader || false) }
          }
        } catch (e) {}
      }

      // Fetch ALL teams with their members
      try {
        var teamsRes = await supabase.from("teams").select("*").order("team_number", { ascending: true })
        if (teamsRes.data) {
          // Fetch all members to get counts and rolls
          var membersRes = await supabase.from("team_members").select("team_id, member_roll_number, is_leader")

          var membersByTeam = {}
          var leaderByTeam = {}
          if (membersRes.data) {
            membersRes.data.forEach(function (m) {
              if (!membersByTeam[m.team_id]) membersByTeam[m.team_id] = []
              membersByTeam[m.team_id].push(m.member_roll_number)
              if (m.is_leader) leaderByTeam[m.team_id] = m.member_roll_number
            })
          }

          var mapped = teamsRes.data.map(function (t) {
            return {
              number: t.team_number,
              title: t.project_title || "Untitled Project",
              description: t.project_description || "",
              tech: t.technologies || [],
              tags: generateTags(t.technologies),
              members: membersByTeam[t.id] || [],
              leader: leaderByTeam[t.id] || t.leader_roll_number || "",
              memberCount: t.member_count || (membersByTeam[t.id] ? membersByTeam[t.id].length : 0),
            }
          })
          setAllTeams(mapped)
        }
      } catch (e) { console.error("Failed to load teams:", e) }
      setTeamsLoading(false)
    }

    loadData()
  }, [])

  var filters = ["All Teams", "AI", "Automation", "Analytics", "Development", "Web Dev", "Data Engineering", "ML", "Cloud", "Communication"]

  var filteredTeams = allTeams.filter(function (t) {
    var matchesFilter = filter === "All Teams" || t.tags.some(function (tag) { return tag.toLowerCase().includes(filter.toLowerCase()) }) || t.tech.some(function (te) { return te.toLowerCase().includes(filter.toLowerCase()) })
    var matchesSearch = !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.number.toLowerCase().includes(searchQuery.toLowerCase()) || t.tech.some(function (te) { return te.toLowerCase().includes(searchQuery.toLowerCase()) })
    return matchesFilter && matchesSearch
  })

  var team = filteredTeams[currentIndex] || filteredTeams[0] || allTeams[0]

  function goToTeam(idx) {
    setDetailAnim(false)
    setTimeout(function () {
      setCurrentIndex(idx)
      setDetailAnim(true)
      // Scroll card into view
      var card = document.getElementById("tc-" + idx)
      if (card) card.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 150)
  }

  function nextTeam() { goToTeam((currentIndex + 1) % filteredTeams.length) }
  function prevTeam() { goToTeam((currentIndex - 1 + filteredTeams.length) % filteredTeams.length) }

  function toggleLike(num) {
    setIsLiked(function (prev) { var n = {}; for (var k in prev) n[k] = prev[k]; n[num] = !prev[num]; return n })
  }

  // Keyboard navigation
  useEffect(function () {
    function handleKey(e) {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") nextTeam()
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") prevTeam()
    }
    window.addEventListener("keydown", handleKey)
    return function () { window.removeEventListener("keydown", handleKey) }
  })

  if (teamsLoading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "#000" }}>
        <DashboardSidebar teamNumber={teamNumber} currentMember={currentMember} loggedInRoll={loggedInRoll} isLeader={isLeader} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,#ff3020,#ff6040)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif", fontWeight: 900, fontSize: 18, color: "#fff", margin: "0 auto 12px", animation: "pulse 1s ease-in-out infinite" }}>PS</div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, letterSpacing: 3, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>Loading Teams</div>
          </div>
        </div>
        <style>{`@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}`}</style>
      </div>
    )
  }

  if (!team) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "#000" }}>
        <DashboardSidebar teamNumber={teamNumber} currentMember={currentMember} loggedInRoll={loggedInRoll} isLeader={isLeader} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif", fontSize: 20, color: "rgba(255,255,255,0.3)" }}>No teams found</div>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#000", color: "#fff", fontFamily: "var(--font-primary)", overflow: "hidden" }}>

      <style jsx>{`
        /* ===== BACKGROUND ===== */
        .ex-bg { position:fixed; inset:0; z-index:0; background:#000; }
        .ex-vignette { position:absolute; inset:0; background:radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,0.6) 100%); }
        .ex-glow { position:absolute; width:500px; height:500px; border-radius:50%; filter:blur(160px); opacity:0.25; pointer-events:none; animation:exDrift 12s ease-in-out infinite; }
        .ex-glow-1 { background:rgba(255,40,20,0.15); top:-150px; left:-100px; }
        .ex-glow-2 { background:rgba(255,80,40,0.1); bottom:-200px; right:-100px; animation-delay:-5s; }
        @keyframes exDrift { 0%,100%{transform:translate(0,0)} 50%{transform:translate(15px,-10px)} }

        /* ===== MAIN ===== */
        .ex-main { flex:1; display:flex; flex-direction:column; height:100vh; position:relative; z-index:1; overflow:hidden; }

        /* ===== TOP NAV ===== */
        .ex-nav { display:flex; align-items:center; justify-content:space-between; padding:14px 32px; border-bottom:1px solid rgba(255,255,255,0.04); background:rgba(0,0,0,0.5); backdrop-filter:blur(20px); z-index:100; }
        .ex-nav-tabs { display:flex; gap:6px; }
        .ex-tab { padding:7px 18px; border-radius:30px; font-size:12px; font-weight:500; color:#555; cursor:pointer; transition:all 0.3s; border:1px solid transparent; font-family:'DM Sans',sans-serif; background:none; }
        .ex-tab:hover { color:#fff; background:rgba(255,255,255,0.04); }
        .ex-tab.on { color:#fff; background:linear-gradient(135deg,rgba(255,50,30,0.2),rgba(255,80,40,0.1)); border-color:rgba(255,60,30,0.3); box-shadow:0 0 15px rgba(255,50,30,0.1); }
        .ex-search-input { padding:8px 16px; border-radius:30px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.03); color:#fff; font-size:13px; font-family:'DM Sans',sans-serif; outline:none; width:200px; transition:all 0.3s; }
        .ex-search-input:focus { border-color:rgba(255,60,30,0.4); width:260px; }
        .ex-search-input::placeholder { color:#444; }

        /* ===== CONTENT AREA ===== */
        .ex-content { display:flex; flex:1; padding:28px 32px; gap:28px; overflow:hidden; }

        /* ===== LEFT: DETAIL ===== */
        .ex-detail { flex:1; display:flex; flex-direction:column; justify-content:center; padding-right:20px; position:relative; transition:opacity 0.3s ease, transform 0.3s ease; }
        .ex-detail.hide { opacity:0; transform:translateX(-20px); }
        .ex-detail.show { opacity:1; transform:translateX(0); }

        .ex-d-num { font-family:'DM Sans',sans-serif; font-size:15px; font-weight:600; letter-spacing:3px; text-transform:uppercase; margin-bottom:4px; position:relative; z-index:2; }
        .ex-d-num span { background:linear-gradient(135deg,#ff3020,#ff8040); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }

        .ex-d-title { font-family:'DM Sans',sans-serif; font-weight:900; font-size:48px; line-height:1; color:#fff; margin-bottom:8px; text-transform:uppercase; letter-spacing:2px; position:relative; z-index:2; max-width:55%; word-wrap:break-word; background:linear-gradient(180deg,#fff 40%,rgba(255,255,255,0.5) 75%,rgba(255,255,255,0.15) 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }

        .ex-d-team { font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; letter-spacing:2px; color:#666; text-transform:uppercase; margin-bottom:12px; position:relative; z-index:2; }

        .ex-d-meta { display:flex; align-items:center; gap:12px; margin-bottom:12px; flex-wrap:wrap; position:relative; z-index:2; }
        .ex-d-members { display:flex; align-items:center; gap:6px; font-size:13px; color:#777; }
        .ex-d-members .ct { color:#ff8040; font-weight:700; }

        .ex-d-pills { display:flex; gap:7px; flex-wrap:wrap; margin-bottom:10px; position:relative; z-index:2; }
        .ex-pill { padding:4px 13px; border-radius:20px; font-size:11px; font-weight:500; color:#999; background:rgba(255,60,30,0.06); border:1px solid rgba(255,60,30,0.12); transition:all 0.3s; }
        .ex-pill:hover { background:rgba(255,60,30,0.15); border-color:rgba(255,60,30,0.35); color:#fff; }

        .ex-d-tags { display:flex; gap:12px; margin-bottom:14px; position:relative; z-index:2; }
        .ex-tag { font-size:12px; color:#444; font-style:italic; }

        .ex-d-desc { font-size:13px; line-height:1.7; color:rgba(255,255,255,0.55); max-width:480px; margin-bottom:22px; position:relative; z-index:2; display:-webkit-box; -webkit-line-clamp:4; -webkit-box-orient:vertical; overflow:hidden; }

        .ex-d-actions { display:flex; align-items:center; gap:16px; position:relative; z-index:2; }
        .ex-like-btn { display:flex; align-items:center; gap:8px; padding:9px 22px; border-radius:30px; border:1.5px solid rgba(255,60,30,0.3); background:rgba(255,60,30,0.06); color:#ff6040; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.4s cubic-bezier(0.4,0,0.2,1); font-family:'DM Sans',sans-serif; }
        .ex-like-btn:hover { background:rgba(255,60,30,0.15); border-color:rgba(255,60,30,0.5); box-shadow:0 0 25px rgba(255,50,30,0.2); transform:scale(1.05); }
        .ex-like-btn.liked { background:linear-gradient(135deg,#ff3020,#ff6040); color:#fff; border-color:transparent; box-shadow:0 0 30px rgba(255,50,30,0.3); }
        .ex-action-btn { width:40px; height:40px; border-radius:50%; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.02); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 0.3s; color:#666; font-size:16px; }
        .ex-action-btn:hover { border-color:rgba(255,60,30,0.3); background:rgba(255,60,30,0.08); color:#ff6040; }

        /* ===== BIG IMAGE ===== */
        .ex-img-wrap { position:absolute; left:68%; top:50%; transform:translate(-50%,-50%); width:800px; height:700px; pointer-events:none; z-index:0; opacity:0.12; }
        .ex-img-wrap img { width:100%; height:100%; object-fit:contain; filter:drop-shadow(0 0 80px rgba(255,40,20,0.12)); -webkit-mask-image:radial-gradient(ellipse 65% 60% at center,rgba(0,0,0,0.9) 20%,rgba(0,0,0,0.4) 55%,transparent 75%); mask-image:radial-gradient(ellipse 65% 60% at center,rgba(0,0,0,0.9) 20%,rgba(0,0,0,0.4) 55%,transparent 75%); }

        /* ===== RIGHT: TEAM LIST ===== */
        .ex-list { width:140px; display:flex; flex-direction:column; gap:8px; min-width:140px; }
        .ex-list-hd { display:none; }

        .ex-scroll { flex:1; overflow-y:auto; padding-right:6px; display:flex; flex-direction:column; gap:10px; scroll-behavior:smooth; }
        .ex-scroll::-webkit-scrollbar { width:3px; }
        .ex-scroll::-webkit-scrollbar-track { background:rgba(255,255,255,0.02); }
        .ex-scroll::-webkit-scrollbar-thumb { background:rgba(255,60,30,0.25); border-radius:2px; }
        .ex-scroll::-webkit-scrollbar-thumb:hover { background:rgba(255,60,30,0.5); }

        .ex-card { position:relative; padding:14px 12px; border-radius:10px; border:1px solid rgba(255,60,30,0.06); background:rgba(255,255,255,0.015); cursor:pointer; transition:all 0.35s cubic-bezier(0.4,0,0.2,1); overflow:hidden; display:flex; align-items:center; }
        .ex-card::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(255,50,30,0.03),transparent 60%); pointer-events:none; transition:all 0.4s ease; }
        .ex-card:hover { border-color:rgba(255,60,30,0.3); background:rgba(255,255,255,0.03); box-shadow:0 8px 30px rgba(255,40,20,0.1); transform:translateX(-4px); }
        .ex-card:hover::before { background:linear-gradient(135deg,rgba(255,50,30,0.08),transparent 60%); }
        .ex-card.on { border-color:rgba(255,60,30,0.4); background:rgba(255,50,30,0.04); box-shadow:0 8px 30px rgba(255,40,20,0.12); }
        .ex-card.on::after { content:''; position:absolute; top:0;left:0;bottom:0; width:3px; background:linear-gradient(180deg,#ff3020,#ff8040); }

        .ex-c-top { display:flex; align-items:center; justify-content:space-between; width:100%; }
        .ex-c-num { font-family:'DM Sans',sans-serif; font-size:12px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; background:linear-gradient(135deg,#ff3020,#ff8040); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; line-height:1; }
        .ex-c-members { display:flex; align-items:center; gap:3px; line-height:1; }

        /* ===== CAROUSEL NAV ===== */
        .ex-carousel { position:absolute; bottom:24px; left:50%; transform:translateX(-50%); z-index:100; display:flex; align-items:center; gap:16px; padding:10px 24px; border-radius:50px; background:rgba(5,5,5,0.85); border:1px solid rgba(255,255,255,0.04); backdrop-filter:blur(20px); }
        .ex-car-arrow { width:32px; height:32px; border-radius:50%; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.02); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 0.3s; color:#666; font-size:15px; font-family:'DM Sans',sans-serif; }
        .ex-car-arrow:hover { border-color:rgba(255,60,30,0.4); background:rgba(255,60,30,0.1); color:#ff6040; }
        .ex-car-dots { display:flex; gap:6px; max-width:300px; overflow:hidden; }
        .ex-car-dot { width:8px; height:8px; min-width:8px; border-radius:50%; background:rgba(255,255,255,0.1); cursor:pointer; transition:all 0.3s; }
        .ex-car-dot:hover { background:rgba(255,60,30,0.4); }
        .ex-car-dot.on { background:linear-gradient(135deg,#ff3020,#ff6040); box-shadow:0 0 10px rgba(255,50,30,0.4); width:22px; border-radius:5px; }

        /* ===== RESPONSIVE ===== */
        @media (max-width:900px) {
          .ex-content { flex-direction:column; padding:16px; gap:16px; }
          .ex-detail { padding-right:0; }
          .ex-d-title { font-size:32px; max-width:100%; }
          .ex-list { width:100%; min-width:100%; max-height:300px; }
          .ex-img-wrap { display:none; }
          .ex-nav { padding:12px 16px; padding-left:60px; flex-wrap:wrap; gap:8px; }
          .ex-nav-tabs { flex-wrap:wrap; }
          .ex-carousel { bottom:12px; padding:8px 16px; }
        }
      `}</style>

      {/* Background */}
      <div className="ex-bg">
        <div className="ex-vignette" />
        <div className="ex-glow ex-glow-1" />
        <div className="ex-glow ex-glow-2" />
      </div>

      <DashboardSidebar teamNumber={teamNumber} currentMember={currentMember} loggedInRoll={loggedInRoll} isLeader={isLeader} />

      <div className="ex-main">
        {/* Top Nav */}
        <div className="ex-nav">
          <div className="ex-nav-tabs">
            {filters.map(function (f) {
              return <button key={f} className={"ex-tab " + (filter === f ? "on" : "")} onClick={function () { setFilter(f); setCurrentIndex(0) }}>{f}</button>
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input className="ex-search-input" placeholder="Search teams..." value={searchQuery} onChange={function (e) { setSearchQuery(e.target.value); setCurrentIndex(0) }} />
          </div>
        </div>

        {/* Content */}
        <div className="ex-content">
          {/* LEFT: Detail */}
          <div className={"ex-detail " + (detailAnim ? "show" : "hide")}>
            <div className="ex-d-num"><span>{team.number}</span></div>
            <h1 className="ex-d-title">{team.title}</h1>
            <div className="ex-d-team">{team.number}</div>

            <div className="ex-d-meta">
              <div className="ex-d-members">{"\ud83d\udc65"} <span className="ct">{team.members.length}</span> Members</div>
              <span style={{ color: "#222" }}>|</span>
              <div style={{ fontSize: 12, color: "#555" }}>{"\ud83d\udc64"} Leader: {team.leader}</div>
            </div>

            <div className="ex-d-pills">
              {team.tech.slice(0, 5).map(function (t, i) {
                return <span key={i} className="ex-pill">{t}</span>
              })}
              {team.tech.length > 5 && <span className="ex-pill">+{team.tech.length - 5}</span>}
            </div>

            <div className="ex-d-tags">
              {team.tags.map(function (tag, i) {
                return (<span key={i}>{i > 0 && <span className="ex-tag" style={{ margin: "0 4px" }}>/</span>}<span className="ex-tag">{tag}</span></span>)
              })}
            </div>

            <p className="ex-d-desc">{team.description}</p>

            <div className="ex-d-actions">
              <button className={"ex-like-btn " + (isLiked[team.number] ? "liked" : "")} onClick={function () { toggleLike(team.number) }}>
                <span style={{ fontSize: 16 }}>{isLiked[team.number] ? "\u2665" : "\u2661"}</span>
                {isLiked[team.number] ? "Liked" : "Like"}
              </button>
              <div className="ex-action-btn" title="View Members">{"\ud83d\udc65"}</div>
              <div className="ex-action-btn" title="Share">{"\u2197"}</div>
            </div>

            {/* Background image */}
            <div className="ex-img-wrap">
              <img src="https://i.ibb.co/B2tzqNjg/confident-business-team-png-sticker-transparent-background-53876-1031215-removebg-preview.png" alt="" />
            </div>
          </div>

          {/* RIGHT: Team List */}
          <div className="ex-list">
            <div className="ex-scroll" ref={scrollRef}>
              {filteredTeams.map(function (t, idx) {
                return (
                  <div key={t.number + "-" + idx} id={"tc-" + idx} className={"ex-card " + (idx === currentIndex ? "on" : "")} onClick={function () { goToTeam(idx) }}>
                    <div className="ex-c-top">
                      <span className="ex-c-num">{t.number}</span>
                      <span className="ex-c-members">
                        <svg viewBox="0 0 24 24" style={{ width: 11, height: 11, fill: "none", stroke: "rgba(255,255,255,0.4)", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" }}><circle cx="12" cy="7.5" r="3"/><path d="M5.5 21a6.5 6.5 0 0 1 13 0"/></svg>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{t.members.length}</span>
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Carousel */}
        <div className="ex-carousel">
          <button className="ex-car-arrow" onClick={prevTeam}>{"\u2039"}</button>
          <div className="ex-car-dots">
            {filteredTeams.map(function (t, idx) {
              return <div key={idx} className={"ex-car-dot " + (idx === currentIndex ? "on" : "")} onClick={function () { goToTeam(idx) }} />
            })}
          </div>
          <button className="ex-car-arrow" onClick={nextTeam}>{"\u203a"}</button>
        </div>
      </div>
    </div>
  )
}