"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { EVENT_CONFIG, WHATSAPP_MESSAGE } from "@/config/formFields"
import AnimatedBackground from "@/components/AnimatedBackground"

export default function TeamInfoPage() {
  var params = useParams()
  var router = useRouter()
  var teamNumber = params.teamNumber
  var [team, setTeam] = useState(null)
  var [members, setMembers] = useState([])
  var [loading, setLoading] = useState(true)
  var [loggedInRoll, setLoggedInRoll] = useState("")
  var [copied, setCopied] = useState(false)
  var [foodDone, setFoodDone] = useState(false)
  var [hasCart, setHasCart] = useState(false)

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

        // Check if food selections are done (all 7 days)
        var foodRes = await supabase
          .from("food_selections")
          .select("day_number")
          .eq("team_id", teamRes.data.id)

        if (foodRes.data) {
          var days = new Set(foodRes.data.map(function (f) { return f.day_number }))
          setFoodDone(days.size >= 7)
        }

        // Check if cart already exists
        var cartRes = await supabase
          .from("snack_cards")
          .select("id")
          .eq("team_id", teamRes.data.id)
          .limit(1)

        if (cartRes.data && cartRes.data.length > 0) {
          setHasCart(true)
        }
      }
      setLoading(false)
    }

    if (teamNumber) fetchTeam()
  }, [teamNumber, router])

  function handleLogout() {
    sessionStorage.clear()
    localStorage.removeItem("ps_roll")
    router.push("/login")
  }

  function copyTeamNumber() {
    navigator.clipboard.writeText(teamNumber)
    setCopied(true)
    setTimeout(function () { setCopied(false) }, 2000)
  }

  function shareWhatsApp() {
    if (!team) return
    var leader = members.find(function (m) { return m.is_leader })
    var msg = WHATSAPP_MESSAGE(teamNumber, team.project_title, leader ? leader.member_name : "")
    window.open("https://wa.me/?text=" + msg, "_blank")
  }

  function downloadTeamCard() {
    try {
      var canvas = document.createElement("canvas")
      var ctx = canvas.getContext("2d")
      canvas.width = 800
      canvas.height = 600

      var gradient = ctx.createLinearGradient(0, 0, 800, 600)
      gradient.addColorStop(0, "#0a0a0a")
      gradient.addColorStop(1, "#1a0a05")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 800, 600)

      ctx.strokeStyle = "rgba(255, 96, 64, 0.3)"
      ctx.lineWidth = 2
      ctx.roundRect(20, 20, 760, 560, 20)
      ctx.stroke()

      var headerGrad = ctx.createLinearGradient(0, 0, 800, 0)
      headerGrad.addColorStop(0, "#ff3020")
      headerGrad.addColorStop(1, "#ff6040")
      ctx.fillStyle = headerGrad
      ctx.roundRect(20, 20, 760, 80, [20, 20, 0, 0])
      ctx.fill()

      ctx.fillStyle = "#ffffff"
      ctx.font = "bold 28px Arial"
      ctx.fillText(EVENT_CONFIG.eventName, 40, 70)

      ctx.fillStyle = "#ff6040"
      ctx.font = "bold 48px Arial"
      ctx.textAlign = "center"
      ctx.fillText(teamNumber, 400, 160)

      ctx.fillStyle = "#ffffff"
      ctx.font = "bold 22px Arial"
      ctx.fillText(team.project_title, 400, 200)

      ctx.fillStyle = "#9ca3af"
      ctx.font = "14px Arial"
      ctx.fillText((team.technologies || []).join(" | "), 400, 230)

      ctx.textAlign = "left"
      ctx.fillStyle = "#ff8040"
      ctx.font = "bold 14px Arial"
      ctx.fillText("TEAM MEMBERS", 40, 280)

      members.forEach(function (m, i) {
        var y = 310 + i * 40
        ctx.fillStyle = m.is_leader ? "#ff8040" : "#ffffff"
        ctx.font = "bold 16px Arial"
        ctx.fillText(m.member_name, 40, y)
        ctx.fillStyle = "#6b7280"
        ctx.font = "14px Arial"
        ctx.fillText(m.member_roll_number + " | " + m.member_branch, 400, y)
      })

      ctx.fillStyle = "#4b5563"
      ctx.font = "12px Arial"
      ctx.textAlign = "center"
      ctx.fillText("May 6-12, 2026 | " + EVENT_CONFIG.eventVenue, 400, 570)

      var link = document.createElement("a")
      link.download = teamNumber + "-team-card.png"
      link.href = canvas.toDataURL("image/png")
      link.click()
    } catch (err) {
      console.error("Download failed:", err)
    }
  }

  var currentMember = !loading && members.length > 0 ? members.find(function (m) { return m.member_roll_number === loggedInRoll }) : null
  var isLeader = currentMember ? currentMember.is_leader : false

  if (loading) {
    return (
      <div className="ps-page">
        <AnimatedBackground />
        <div style={{ position: "relative", zIndex: 10, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="ps-spinner" style={{ width: 32, height: 32 }} />
        </div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="ps-page">
        <AnimatedBackground />
        <div style={{ position: "relative", zIndex: 10, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <div className="ps-page-title" style={{ fontSize: 28 }}>Team Not Found</div>
          <button className="ps-btn ps-btn-secondary" onClick={function () { router.push("/") }}>← Back to Home</button>
        </div>
      </div>
    )
  }

  return (
    <div className="ps-page">
      <AnimatedBackground />

      <style jsx>{`
        .ti-wrapper { position:relative; z-index:10; min-height:100vh; padding:0 20px 60px; }
        .ti-container { max-width:720px; margin:0 auto; }

        .ti-header { display:flex; align-items:center; justify-content:space-between; padding:20px 0; margin-bottom:8px; opacity:0; animation:psFadeIn 0.6s ease forwards; }
        .ti-logo { display:flex; align-items:center; gap:10px; cursor:pointer; }
        .ti-logo-icon { width:38px;height:38px; border-radius:10px; background:linear-gradient(135deg,#ff3020,#ff6040); display:flex; align-items:center; justify-content:center; font-family:var(--font-display); font-weight:900; font-size:15px; color:#fff; }
        .ti-logo-text { font-family:var(--font-display); font-size:18px; font-weight:700; color:#fff; letter-spacing:2px; text-transform:uppercase; }
        .ti-header-right { display:flex; align-items:center; gap:10px; }
        .ti-roll-badge { font-family:var(--font-display); font-size:11px; color:rgba(255,255,255,0.35); letter-spacing:1.5px; text-transform:uppercase; }
        .ti-icon-btn { width:36px; height:36px; border-radius:50%; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.03); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 0.3s ease; text-decoration:none; position:relative; }
        .ti-icon-btn:hover { border-color:rgba(255,60,30,0.4); background:rgba(255,60,30,0.06); }
        .ti-icon-btn svg { width:18px; height:18px; stroke:rgba(255,255,255,0.4); fill:none; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
        .ti-icon-btn:hover svg { stroke:var(--accent-orange); }
        .ti-logout { padding:6px 14px; border-radius:50px; border:1px solid rgba(255,255,255,0.1); background:none; color:rgba(255,255,255,0.4); font-family:var(--font-display); font-size:11px; letter-spacing:1.5px; text-transform:uppercase; cursor:pointer; transition:all 0.3s ease; }
        .ti-logout:hover { border-color:rgba(255,60,30,0.4); color:var(--accent-orange); }

        .ti-welcome { padding:24px 28px; border-radius:18px; border:1px solid rgba(255,60,30,0.15); background:linear-gradient(165deg,rgba(35,12,8,0.7),rgba(18,6,4,0.85)); backdrop-filter:blur(15px); margin-bottom:20px; opacity:0; animation:psFadeIn 0.7s ease 0.15s forwards; position:relative; overflow:hidden; }
        .ti-welcome::before { content:''; position:absolute; top:0;left:0;right:0; height:2px; background:linear-gradient(90deg,#ff4020,#ff8040,#ffaa40); }
        .ti-welcome-row { display:flex; align-items:center; gap:12px; }
        .ti-welcome-name { font-family:var(--font-display); font-size:24px; font-weight:800; color:#fff; letter-spacing:1px; text-transform:uppercase; }
        .ti-welcome-role { font-size:13px; color:rgba(255,255,255,0.35); margin-top:4px; }

        .ti-card { padding:28px; border-radius:18px; border:1px solid rgba(255,60,30,0.1); background:linear-gradient(165deg,rgba(35,12,8,0.65),rgba(18,6,4,0.8)); backdrop-filter:blur(15px); margin-bottom:16px; position:relative; overflow:hidden; opacity:0; animation:psFadeIn 0.7s ease forwards; transition:all 0.3s ease; }
        .ti-card:hover { border-color:rgba(255,60,30,0.25); }
        .ti-card::after { content:''; position:absolute; top:-50%;left:-50%; width:200%;height:200%; background:radial-gradient(circle at 50% 0%,rgba(255,60,30,0.04),transparent 50%); pointer-events:none; }
        .ti-card-d1 { animation-delay:0.3s; }
        .ti-card-d2 { animation-delay:0.45s; }
        .ti-card-d3 { animation-delay:0.6s; }
        .ti-card-d4 { animation-delay:0.75s; }

        .ti-card-title { font-family:var(--font-display); font-size:14px; font-weight:700; color:var(--accent-light); letter-spacing:2px; text-transform:uppercase; margin-bottom:18px; position:relative; z-index:1; }

        .ti-team-num { font-family:var(--font-display); font-size:48px; font-weight:900; letter-spacing:5px; text-align:center; background:linear-gradient(135deg,#ff6040,#ffaa40); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; margin:8px 0 16px; }
        .ti-team-label { font-family:var(--font-display); font-size:11px; color:rgba(255,255,255,0.3); letter-spacing:3px; text-transform:uppercase; text-align:center; }
        .ti-registered { font-size:11px; color:rgba(255,255,255,0.2); text-align:center; margin-top:12px; font-family:var(--font-display); letter-spacing:1px; }

        .ti-actions { display:flex; flex-wrap:wrap; justify-content:center; gap:8px; margin-top:16px; position:relative; z-index:1; }
        .ti-action-btn { padding:8px 16px; border-radius:50px; font-family:var(--font-display); font-size:11px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; cursor:pointer; transition:all 0.3s ease; display:flex; align-items:center; gap:5px; }
        .ti-action-copy { border:1px solid rgba(255,60,30,0.2); background:rgba(255,60,30,0.06); color:var(--accent-light); }
        .ti-action-copy:hover { background:rgba(255,60,30,0.12); }
        .ti-action-copy.copied { background:rgba(255,60,30,0.15); border-color:var(--accent-orange); color:#fff; }
        .ti-action-wa { border:1px solid rgba(37,211,102,0.25); background:rgba(37,211,102,0.06); color:#25d366; }
        .ti-action-wa:hover { background:rgba(37,211,102,0.12); }
        .ti-action-dl { border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.03); color:rgba(255,255,255,0.4); }
        .ti-action-dl:hover { border-color:rgba(255,60,30,0.3); color:rgba(255,255,255,0.7); }

        .ti-detail { position:relative; z-index:1; }
        .ti-detail-row { margin-bottom:14px; }
        .ti-detail-label { font-size:11px; color:rgba(255,255,255,0.3); font-family:var(--font-display); letter-spacing:1.5px; text-transform:uppercase; margin-bottom:3px; }
        .ti-detail-value { font-size:15px; color:rgba(255,255,255,0.8); font-weight:500; }
        .ti-tech-chips { display:flex; flex-wrap:wrap; gap:6px; margin-top:4px; }
        .ti-tech-chip { padding:4px 12px; border-radius:50px; font-family:var(--font-display); font-size:11px; letter-spacing:1px; text-transform:uppercase; background:rgba(255,60,30,0.1); border:1px solid rgba(255,60,30,0.2); color:var(--accent-light); }

        .ti-member { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-radius:12px; background:rgba(255,255,255,0.015); border:1px solid rgba(255,255,255,0.04); margin-bottom:8px; transition:all 0.3s ease; position:relative; z-index:1; }
        .ti-member:hover { border-color:rgba(255,60,30,0.15); background:rgba(255,60,30,0.02); }
        .ti-member.you { border-color:rgba(255,60,30,0.25); background:rgba(255,60,30,0.04); }
        .ti-member-left { display:flex; align-items:center; gap:10px; }
        .ti-member-avatar { width:36px;height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; font-family:var(--font-display); }
        .ti-member-avatar.leader { background:rgba(255,60,30,0.15); color:var(--accent-orange); }
        .ti-member-avatar.normal { background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.35); }
        .ti-member-name { font-size:14px; font-weight:500; color:#fff; }
        .ti-member-you-tag { display:inline-block; padding:2px 8px; border-radius:50px; font-family:var(--font-display); font-size:10px; letter-spacing:1px; text-transform:uppercase; background:rgba(255,60,30,0.15); color:var(--accent-orange); margin-left:6px; }
        .ti-member-sub { font-size:11px; color:rgba(255,255,255,0.3); }
        .ti-member-right { text-align:right; }

        .ti-event-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; position:relative; z-index:1; }
        .ti-event-item { padding:14px 16px; border-radius:12px; border:1px solid rgba(255,60,30,0.08); background:rgba(255,255,255,0.015); }
        .ti-event-label { font-size:10px; color:rgba(255,255,255,0.25); font-family:var(--font-display); letter-spacing:1.5px; text-transform:uppercase; margin-bottom:4px; }
        .ti-event-value { font-size:14px; color:rgba(255,255,255,0.7); font-weight:500; }

        /* CTA Buttons */
        .ti-cta { opacity:0; animation:psFadeIn 0.6s ease 0.9s forwards; display:flex; flex-direction:column; gap:12px; }
        .ti-cta-btn { display:flex; align-items:center; justify-content:center; gap:10px; width:100%; padding:16px 24px; border-radius:14px; font-family:var(--font-display); font-size:15px; font-weight:700; letter-spacing:2px; text-transform:uppercase; text-align:center; text-decoration:none; transition:all 0.4s ease; border:none; cursor:pointer; }
        .ti-cta-primary { background:linear-gradient(135deg,#ff3020,#ff6040); color:#fff; box-shadow:0 0 30px rgba(255,50,30,0.3); }
        .ti-cta-primary:hover { box-shadow:0 0 50px rgba(255,50,30,0.5),0 8px 35px rgba(255,50,30,0.3); transform:translateY(-2px); }
        .ti-cta-cart { background:linear-gradient(135deg,#ff8020,#ffaa40); color:#fff; box-shadow:0 0 25px rgba(255,130,30,0.2); }
        .ti-cta-cart:hover { box-shadow:0 0 40px rgba(255,130,30,0.4); transform:translateY(-2px); }

        .ti-footer { text-align:center; padding:20px 0; font-size:12px; color:rgba(255,255,255,0.2); font-family:var(--font-display); letter-spacing:1px; }
        .ti-footer strong { color:var(--accent-orange); }

        @media (max-width:640px) {
          .ti-team-num { font-size:36px; }
          .ti-welcome-name { font-size:20px; }
          .ti-card { padding:20px 18px; }
          .ti-member { flex-direction:column; align-items:flex-start; gap:6px; }
          .ti-member-right { text-align:left; }
          .ti-event-grid { grid-template-columns:1fr; }
          .ti-header { flex-direction:column; gap:10px; align-items:flex-start; }
          .ti-cta-btn { font-size:13px; padding:14px 20px; }
        }
      `}</style>

      <div className="ti-wrapper">
        <div className="ti-container">

          {/* Header with bell icon + logout */}
          <div className="ti-header">
            <div className="ti-logo" onClick={function () { router.push("/") }}>
              <div className="ti-logo-icon">PS</div>
              <div className="ti-logo-text">{EVENT_CONFIG.eventName}</div>
            </div>
            <div className="ti-header-right">
              <span className="ti-roll-badge">{loggedInRoll}</span>
              <Link href="/announcements" className="ti-icon-btn" title="Announcements">
                <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
              </Link>
              <button className="ti-logout" onClick={handleLogout}>Logout</button>
            </div>
          </div>

          {/* Welcome */}
          <div className="ti-welcome">
            <div className="ti-welcome-row">
              <span style={{ fontSize: 28 }}>👋</span>
              <div>
                <div className="ti-welcome-name">
                  Welcome{currentMember ? ", " + currentMember.member_name : ""}!
                </div>
                <div className="ti-welcome-role">
                  {isLeader ? "You are the Team Leader of this team." : "You are a member of this team."}
                </div>
              </div>
            </div>
          </div>

          {/* Team Number Card */}
          <div className="ti-card ti-card-d1" style={{ textAlign: "center" }}>
            <div className="ti-team-label">Your Team Number</div>
            <div className="ti-team-num">{team.team_number}</div>

            <div className="ti-actions">
              <button onClick={copyTeamNumber} className={"ti-action-btn ti-action-copy " + (copied ? "copied" : "")}>
                {copied ? "✓ Copied" : "📋 Copy"}
              </button>
              <button onClick={shareWhatsApp} className="ti-action-btn ti-action-wa">
                💬 WhatsApp
              </button>
              <button onClick={downloadTeamCard} className="ti-action-btn ti-action-dl">
                ⬇ Card
              </button>
            </div>

            <div className="ti-registered">
              Registered {team.registered_at ? new Date(team.registered_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : ""}
            </div>
          </div>

          {/* Project Details */}
          <div className="ti-card ti-card-d2">
            <div className="ti-card-title">💡 Project Details</div>
            <div className="ti-detail">
              <div className="ti-detail-row">
                <div className="ti-detail-label">Project Title</div>
                <div className="ti-detail-value">{team.project_title}</div>
              </div>
              {team.project_description && (
                <div className="ti-detail-row">
                  <div className="ti-detail-label">Description</div>
                  <div className="ti-detail-value" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{team.project_description}</div>
                </div>
              )}
              <div className="ti-detail-row">
                <div className="ti-detail-label">Technologies</div>
                <div className="ti-tech-chips">
                  {(team.technologies || []).map(function (tech) {
                    return <span key={tech} className="ti-tech-chip">{tech}</span>
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div className="ti-card ti-card-d3">
            <div className="ti-card-title">👥 Team Members ({members.length})</div>
            <div style={{ position: "relative", zIndex: 1 }}>
              {members.map(function (m, i) {
                return (
                  <div key={i} className={"ti-member " + (m.member_roll_number === loggedInRoll ? "you" : "")}>
                    <div className="ti-member-left">
                      <div className={"ti-member-avatar " + (m.is_leader ? "leader" : "normal")}>
                        {m.is_leader ? "👑" : i + 1}
                      </div>
                      <div>
                        <div className="ti-member-name">
                          {m.member_name}
                          {m.member_roll_number === loggedInRoll && (
                            <span className="ti-member-you-tag">You</span>
                          )}
                        </div>
                        <div className="ti-member-sub">{m.member_roll_number} | {m.member_branch}</div>
                      </div>
                    </div>
                    <div className="ti-member-right">
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{m.member_college}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Event Details */}
          <div className="ti-card ti-card-d4">
            <div className="ti-card-title">📅 Event Details</div>
            <div className="ti-event-grid">
              <div className="ti-event-item">
                <div className="ti-event-label">Date</div>
                <div className="ti-event-value">May 6 - 12, 2026</div>
              </div>
              <div className="ti-event-item">
                <div className="ti-event-label">Time</div>
                <div className="ti-event-value">{EVENT_CONFIG.eventTime}</div>
              </div>
              <div className="ti-event-item">
                <div className="ti-event-label">Venue</div>
                <div className="ti-event-value">{EVENT_CONFIG.eventVenue}</div>
              </div>
              <div className="ti-event-item">
                <div className="ti-event-label">Your Role</div>
                <div className="ti-event-value">{isLeader ? "Team Leader" : "Team Member"}</div>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="ti-cta">
            {hasCart ? (
              <Link href={"/snack-cards/" + team.team_number} className="ti-cta-btn ti-cta-cart">
                🛒 View My Snack Cards
              </Link>
            ) : (
              <Link href={"/food-selection/" + team.team_number} className="ti-cta-btn ti-cta-primary">
                🍔 Select Snacks & Beverages
              </Link>
            )}
          </div>

          <div className="ti-footer">
            Show team number <strong>{team.team_number}</strong> at the venue
          </div>

        </div>
      </div>
    </div>
  )
}