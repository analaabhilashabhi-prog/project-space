"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { EVENT_CONFIG } from "@/config/formFields"
import SubtleBackground from "@/components/SubtleBackground"
import DashboardSidebar from "@/components/DashboardSidebar"

export default function TeamInfoPage() {
  var params = useParams()
  var router = useRouter()
  var teamNumber = params.teamNumber
  var [team, setTeam] = useState(null)
  var [members, setMembers] = useState([])
  var [loading, setLoading] = useState(true)
  var [loggedInRoll, setLoggedInRoll] = useState("")
  var [unreadCount, setUnreadCount] = useState(0)
  var [showWelcome, setShowWelcome] = useState(true)
  var [welcomeFading, setWelcomeFading] = useState(false)

  useEffect(function () {
    var roll = sessionStorage.getItem("ps_roll") || localStorage.getItem("ps_roll")
    if (!roll) {
      router.push("/login")
      return
    }
    setLoggedInRoll(roll)

    async function fetchTeam() {
      var teamRes = await supabase
        .from("teams")
        .select("*")
        .eq("team_number", teamNumber)
        .single()

      if (teamRes.data) {
        setTeam(teamRes.data)

        var memberRes = await supabase
          .from("team_members")
          .select("*")
          .eq("team_id", teamRes.data.id)
          .order("is_leader", { ascending: false })

        setMembers(memberRes.data || [])
      }
      setLoading(false)
    }

    if (teamNumber) fetchTeam()
  }, [teamNumber, router])

  // Welcome message auto-fade
  useEffect(function () {
    var fadeTimer = setTimeout(function () { setWelcomeFading(true) }, 30000)
    var hideTimer = setTimeout(function () { setShowWelcome(false) }, 35000)
    return function () { clearTimeout(fadeTimer); clearTimeout(hideTimer) }
  }, [])

  // Poll unread announcements
  useEffect(function () {
    async function checkUnread() {
      try {
        var lastSeen = localStorage.getItem("ps_last_seen_announcement") || "2000-01-01"
        var { data } = await supabase.from("announcements").select("id").gt("created_at", lastSeen)
        setUnreadCount(data ? data.length : 0)
      } catch (e) {}
    }
    checkUnread()
    var interval = setInterval(checkUnread, 15000)
    return function () { clearInterval(interval) }
  }, [])

  var currentMember = !loading && members.length > 0 ? members.find(function (m) { return m.member_roll_number === loggedInRoll }) : null
  var isLeader = currentMember ? currentMember.is_leader : false
  var leader = members.find(function (m) { return m.is_leader })

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <SubtleBackground />
        <div style={{ position: "relative", zIndex: 10 }}><div className="ps-spinner" style={{ width: 32, height: 32 }} /></div>
      </div>
    )
  }

  if (!team) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <SubtleBackground />
        <div style={{ position: "relative", zIndex: 10, textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Team Not Found</div>
          <button className="ps-btn ps-btn-secondary" onClick={function () { router.push("/") }}>{"\u2190"} Back to Home</button>
        </div>
      </div>
    )
  }

  var techList = team.technologies || []

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: "'DM Sans', sans-serif", overflow: "hidden" }}>
      <SubtleBackground />

      <style jsx>{`
        .main-area { flex:1; display:flex; flex-direction:column; height:100vh; overflow-y:auto; position:relative; z-index:1; }
        .top-bar { display:flex; align-items:center; justify-content:space-between; padding:18px 32px; border-bottom:1px solid rgba(255,255,255,0.05); background:rgba(10,10,10,0.8); backdrop-filter:blur(15px); position:sticky; top:0; z-index:40; }
        .top-bar-title { font-family:'Genos',sans-serif; font-size:28px; font-weight:800; color:#fff; letter-spacing:1px; text-transform:uppercase; }
        .top-bar-right { display:flex; align-items:center; gap:14px; }
        .top-bar-btn { width:40px; height:40px; border-radius:12px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.03); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 0.3s ease; color:#777; font-size:18px; position:relative; }
        .top-bar-btn:hover { border-color:rgba(255,60,30,0.3); background:rgba(255,60,30,0.06); color:#ff6040; }
        .notif-badge { position:absolute; top:-3px; right:-3px; width:18px; height:18px; border-radius:50%; background:linear-gradient(135deg,#ff3020,#ff6040); font-size:10px; font-weight:700; color:#fff; display:flex; align-items:center; justify-content:center; }
        .top-avatar { width:36px; height:36px; border-radius:10px; background:linear-gradient(135deg,#ff3020,#ff6040); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:13px; color:#fff; }
        .dash-content { padding:32px; flex:1; }
        .welcome-banner { padding:20px 24px; border-radius:16px; background:linear-gradient(135deg,rgba(255,50,30,0.08),rgba(255,80,40,0.04)); border:1px solid rgba(255,60,30,0.15); margin-bottom:28px; transition:opacity 5s ease, transform 5s ease, max-height 1s ease; overflow:hidden; }
        .welcome-banner.fading { opacity:0; transform:translateY(-10px); max-height:0; padding:0 24px; margin-bottom:0; border-color:transparent; }
        .welcome-text { font-family:'Genos',sans-serif; font-size:38px; font-weight:800; color:#fff; letter-spacing:1px; }
        .welcome-text span { background:linear-gradient(135deg,#ff3020,#ff6040,#ff8040); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .welcome-sub { font-size:15px; color:#666; margin-top:6px; }
        .section-title { font-family:'Genos',sans-serif; font-size:22px; font-weight:700; color:#888; letter-spacing:2px; text-transform:uppercase; margin-bottom:20px; margin-top:8px; }
        .detail-card { padding:32px 36px; border-radius:20px; border:1px solid rgba(255,60,30,0.1); background:rgba(255,255,255,0.02); backdrop-filter:blur(10px); margin-bottom:28px; position:relative; overflow:hidden; }
        .detail-card::before { content:''; position:absolute; top:0;left:0;right:0; height:2px; background:linear-gradient(90deg,#ff3020,#ff6040,#ff8040,transparent); }
        .detail-row { display:flex; justify-content:space-between; align-items:center; padding:16px 0; border-bottom:1px solid rgba(255,255,255,0.04); }
        .detail-row:last-child { border-bottom:none; }
        .detail-label { font-size:14px; color:#777; display:flex; align-items:center; gap:10px; }
        .detail-value { font-size:15px; font-weight:600; color:#fff; text-align:right; max-width:60%; }
        .tech-tag { display:inline-block; padding:6px 16px; border-radius:10px; font-size:13px; font-weight:600; background:rgba(255,60,30,0.08); border:1px solid rgba(255,60,30,0.15); color:#ff8040; margin:4px 6px 4px 0; }
        .member-card { padding:22px 24px; border-radius:16px; border:1px solid rgba(255,255,255,0.06); background:rgba(255,255,255,0.02); display:flex; align-items:center; gap:16px; transition:all 0.3s ease; }
        .member-card.you { border-color:rgba(255,60,30,0.25); background:rgba(255,60,30,0.04); }
        .member-card:hover { border-color:rgba(255,255,255,0.1); background:rgba(255,255,255,0.03); }
        .m-avatar { width:52px; height:52px; border-radius:14px; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:18px; flex-shrink:0; }
        .m-avatar.leader { background:linear-gradient(135deg,#ff3020,#ff6040); color:#fff; }
        .m-avatar.member { background:rgba(255,255,255,0.06); color:#666; }
        .m-name { font-size:16px; font-weight:600; color:#fff; }
        .m-role-tag { display:inline-block; padding:3px 12px; border-radius:50px; font-size:11px; font-weight:700; margin-left:8px; }
        .m-role-tag.leader { background:rgba(255,60,30,0.15); color:#ff6040; }
        .m-role-tag.you { background:rgba(100,180,255,0.12); color:#64b5f6; }
        .m-detail { font-size:13px; color:#555; margin-top:4px; }
        .qa-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:14px; }
        .qa-card { padding:20px 18px; border-radius:14px; border:1px solid rgba(255,60,30,0.1); background:linear-gradient(165deg,rgba(30,12,8,0.6),rgba(15,6,4,0.8)); cursor:pointer; transition:all 0.3s ease; text-decoration:none; display:block; color:inherit; position:relative; }
        .qa-card:hover { transform:translateY(-3px); border-color:rgba(255,60,30,0.3); box-shadow:0 12px 30px rgba(255,40,20,0.08); }
        .qa-card-icon { font-size:24px; margin-bottom:12px; }
        .qa-card-title { font-family:'Genos',sans-serif; font-size:18px; font-weight:700; color:#fff; letter-spacing:1px; }
        .qa-card-sub { font-size:11px; color:#666; margin-top:4px; }
        .qa-arrow { position:absolute; bottom:16px; right:16px; font-size:16px; color:#333; transition:all 0.3s ease; }
        .qa-card:hover .qa-arrow { color:#ff6040; right:12px; }
        @media (max-width:768px) {
          .dash-content { padding:20px; }
          .top-bar { padding:14px 16px; }
          .welcome-text { font-size:28px; }
          .detail-row { flex-direction:column; align-items:flex-start; gap:4px; }
          .detail-value { text-align:left; max-width:100%; }
        }
      `}</style>

      <DashboardSidebar
        teamNumber={teamNumber}
        currentMember={currentMember}
        loggedInRoll={loggedInRoll}
        isLeader={isLeader}
      />

      <div className="main-area">
        {/* Top Bar */}
        <div className="top-bar">
          <div className="top-bar-title">Team Profile</div>
          <div className="top-bar-right">
            <div className="top-bar-btn" onClick={function () { router.push("/announcements") }}>
              {"\ud83d\udd14"}
              {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
            </div>
            <div className="top-avatar">
              {currentMember ? currentMember.member_name.charAt(0).toUpperCase() : "?"}
            </div>
          </div>
        </div>

        <div className="dash-content">
          {/* Welcome Banner */}
          {showWelcome && (
            <div className={"welcome-banner" + (welcomeFading ? " fading" : "")}>
              <div className="welcome-text">Welcome back, <span>{currentMember ? currentMember.member_name.split(" ")[0] : ""}!</span></div>
              <div className="welcome-sub">
                {isLeader ? "Team Leader" : "Team Member"} {"\u2014"} Here's your team profile and details.
              </div>
            </div>
          )}

          {/* Team Details Card */}
          <div className="section-title">Team Details</div>
          <div className="detail-card">
            <div className="detail-row">
              <div className="detail-label">{"\ud83c\udff7\ufe0f"} Team Number</div>
              <div className="detail-value" style={{ fontFamily: "'Genos', sans-serif", fontSize: 20, fontWeight: 800, color: "#ff6040", letterSpacing: 1 }}>{team.team_number}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">{"\ud83d\udccc"} Project Title</div>
              <div className="detail-value">{team.project_title}</div>
            </div>
            {team.project_description && (
              <div className="detail-row">
                <div className="detail-label">{"\ud83d\udcdd"} Description</div>
                <div className="detail-value" style={{ fontSize: 13, color: "#aaa" }}>{team.project_description}</div>
              </div>
            )}
            {team.domain && (
              <div className="detail-row">
                <div className="detail-label">{"\ud83c\udf10"} Domain</div>
                <div className="detail-value">{team.domain}</div>
              </div>
            )}
            {(team.college_name || team.college) && (
              <div className="detail-row">
                <div className="detail-label">{"\ud83c\udfeb"} College</div>
                <div className="detail-value">{team.college_name || team.college}</div>
              </div>
            )}
            {leader && (
              <div className="detail-row">
                <div className="detail-label">{"\ud83d\udc51"} Team Leader</div>
                <div className="detail-value">{leader.member_name}</div>
              </div>
            )}
            <div className="detail-row">
              <div className="detail-label">{"\ud83d\udc65"} Team Size</div>
              <div className="detail-value">{members.length} member{members.length !== 1 ? "s" : ""}</div>
            </div>
            {techList.length > 0 && (
              <div style={{ paddingTop: 14 }}>
                <div className="detail-label" style={{ marginBottom: 10 }}>{"\ud83d\udee0\ufe0f"} Tech Stack</div>
                <div style={{ display: "flex", flexWrap: "wrap" }}>
                  {techList.map(function (t, i) {
                    return <span key={i} className="tech-tag">{t}</span>
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Your Profile (logged-in member) */}
          {currentMember && (
            <>
              <div className="section-title">Your Profile</div>
              <div className="detail-card">
                <div className="detail-row">
                  <div className="detail-label">{"\ud83d\udc64"} Name</div>
                  <div className="detail-value">{currentMember.member_name}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">{"\ud83c\udd94"} Roll Number</div>
                  <div className="detail-value" style={{ fontFamily: "'Genos', sans-serif", fontWeight: 700, letterSpacing: 1 }}>{currentMember.member_roll_number}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">{"\u2b50"} Role</div>
                  <div className="detail-value">
                    <span style={{ padding: "4px 14px", borderRadius: 50, fontSize: 12, fontWeight: 700, background: isLeader ? "rgba(255,60,30,0.15)" : "rgba(100,180,255,0.1)", color: isLeader ? "#ff6040" : "#64b5f6" }}>
                      {isLeader ? "Team Leader" : "Team Member"}
                    </span>
                  </div>
                </div>
                {currentMember.member_branch && (
                  <div className="detail-row">
                    <div className="detail-label">{"\ud83c\udf93"} Branch</div>
                    <div className="detail-value">{currentMember.member_branch}</div>
                  </div>
                )}
                {(currentMember.member_college || team.college_name) && (
                  <div className="detail-row">
                    <div className="detail-label">{"\ud83c\udfeb"} College</div>
                    <div className="detail-value">{currentMember.member_college || team.college_name}</div>
                  </div>
                )}
                {currentMember.member_phone && (
                  <div className="detail-row">
                    <div className="detail-label">{"\ud83d\udcf1"} Phone</div>
                    <div className="detail-value">{currentMember.member_phone}</div>
                  </div>
                )}
                {currentMember.member_email && (
                  <div className="detail-row">
                    <div className="detail-label">{"\ud83d\udce7"} Email</div>
                    <div className="detail-value">{currentMember.member_email}</div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* All Team Members */}
          <div className="section-title">Team Members</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14, marginBottom: 32 }}>
            {members.map(function (m, i) {
              var isYou = m.member_roll_number === loggedInRoll
              return (
                <div key={i} className={"member-card" + (isYou ? " you" : "")}>
                  <div className={"m-avatar" + (m.is_leader ? " leader" : " member")}>
                    {m.is_leader ? "\ud83d\udc51" : m.member_name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="m-name">
                      {m.member_name}
                      {m.is_leader && <span className="m-role-tag leader">Leader</span>}
                      {isYou && <span className="m-role-tag you">You</span>}
                    </div>
                    <div className="m-detail">
                      {m.member_roll_number}
                      {m.member_branch ? " \u2022 " + m.member_branch : ""}
                    </div>
                    {m.member_college && (
                      <div className="m-detail">{m.member_college}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div style={{ textAlign: "center", padding: "32px 0 16px", fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
            {EVENT_CONFIG.eventName} {"\u2022"} Show team number <strong style={{ color: "#ff6040" }}>{team.team_number}</strong> at the venue
          </div>
        </div>
      </div>
    </div>
  )
}