"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import DashboardSidebar from "@/components/DashboardSidebar"
import MilestoneTimeline from "@/components/MilestoneTimeline"

export default function ProjectStatusPage() {
  var params = useParams()
  var router = useRouter()
  var teamNumber = params.teamNumber

  var [team, setTeam] = useState(null)
  var [members, setMembers] = useState([])
  var [loading, setLoading] = useState(true)
  var [loggedInRoll, setLoggedInRoll] = useState("")
  var [currentMember, setCurrentMember] = useState(null)
  var [isLeader, setIsLeader] = useState(false)
  var [credits, setCredits] = useState(null)
  var [milestones, setMilestones] = useState([])

  useEffect(function () {
    var roll = sessionStorage.getItem("ps_roll") || localStorage.getItem("ps_roll")
    if (!roll) { router.push("/login"); return }
    setLoggedInRoll(roll)

    async function load() {
      var teamRes = await supabase.from("teams").select("*").eq("team_number", teamNumber).single()
      if (!teamRes.data) { setLoading(false); return }
      setTeam(teamRes.data)

      var memRes = await supabase.from("team_members").select("*").eq("team_id", teamRes.data.id)
      setMembers(memRes.data || [])
      var me = (memRes.data || []).find(function (m) { return m.member_roll_number === roll })
      if (me) { setCurrentMember(me); setIsLeader(me.is_leader || false) }

      var tech = Array.isArray(teamRes.data.technologies) ? teamRes.data.technologies[0] : teamRes.data.technology
      if (tech) {
        var msRes = await supabase.from("team_milestones").select("*").eq("team_number", teamNumber)
        setMilestones(msRes.data || [])

        var credRes = await supabase.from("team_credits").select("*").eq("team_number", teamNumber).single()
        setCredits(credRes.data || null)
      }

      setLoading(false)
    }
    load()
  }, [teamNumber, router])

  var teamTechnology = team ? (Array.isArray(team.technologies) ? team.technologies[0] : team.technology) || "" : ""
  var approvedCount = milestones.filter(function (m) { return m.status === "approved" }).length
  var submittedCount = milestones.filter(function (m) { return m.status === "submitted" }).length
  var totalPhases = 6
  var progressPercent = Math.round((approvedCount / totalPhases) * 100)

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "#000" }}>
        <DashboardSidebar teamNumber={teamNumber} currentMember={currentMember} loggedInRoll={loggedInRoll} isLeader={isLeader} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,#ff3020,#ff6040)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-primary,'Open Sans',sans-serif)", fontWeight: 900, fontSize: 18, color: "#fff", margin: "0 auto 12px", animation: "pulse 1s ease-in-out infinite" }}>PS</div>
            <div style={{ fontFamily: "var(--font-primary,'Open Sans',sans-serif)", fontSize: 13, letterSpacing: 3, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>Loading</div>
          </div>
        </div>
        <style>{`@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}`}</style>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#000", color: "#fff", fontFamily: "var(--font-primary,'Open Sans',sans-serif)" }}>
      <style jsx>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes glowPulse{0%,100%{box-shadow:0 0 15px rgba(255,48,32,0.06)}50%{box-shadow:0 0 30px rgba(255,48,32,0.15)}}
        @keyframes countIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .ps-anim{opacity:0;animation:fadeUp 0.6s cubic-bezier(0.23,1,0.32,1) forwards}
        .ps-d1{animation-delay:0.05s}.ps-d2{animation-delay:0.12s}.ps-d3{animation-delay:0.2s}.ps-d4{animation-delay:0.28s}.ps-d5{animation-delay:0.36s}
        .ps-glass{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:16px;backdrop-filter:blur(8px);transition:all 0.35s cubic-bezier(0.23,1,0.32,1)}
        .ps-glass:hover{border-color:rgba(255,96,64,0.12);box-shadow:0 8px 32px rgba(0,0,0,0.25)}
        .ps-stat:hover .ps-stat-val{color:#ff6040}
        .scroll-area::-webkit-scrollbar{width:5px}.scroll-area::-webkit-scrollbar-thumb{background:rgba(255,96,64,0.15);border-radius:10px}
        .phase-row:hover{background:rgba(255,255,255,0.02);border-radius:10px}
      `}</style>

      <DashboardSidebar teamNumber={teamNumber} currentMember={currentMember} loggedInRoll={loggedInRoll} isLeader={isLeader} />

      <div className="scroll-area" style={{ flex: 1, padding: "36px 48px 80px", overflowY: "auto", maxHeight: "100vh" }}>

        {/* Header */}
        <div className="ps-anim ps-d1" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-primary,'Open Sans',sans-serif)", fontSize: 28, fontWeight: 800, letterSpacing: 0.5, marginBottom: 4 }}>
              Project Status
            </h1>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
              {team ? team.project_title : teamNumber} · {teamNumber}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {credits && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,96,64,0.07)", border: "1px solid rgba(255,96,64,0.15)", borderRadius: 20, padding: "6px 14px" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff6040" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#ff6040" }}>{credits.credits}</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>credits</span>
              </div>
            )}
            <div style={{ fontFamily: "var(--font-primary,'Open Sans',sans-serif)", fontSize: 13, fontWeight: 700, color: "#ff6040", background: "rgba(255,96,64,0.07)", border: "1px solid rgba(255,96,64,0.12)", padding: "5px 14px", borderRadius: 20, letterSpacing: 2 }}>{teamNumber}</div>
          </div>
        </div>

        {/* Big progress visual */}
        <div className="ps-anim ps-d2 ps-glass" style={{ padding: "32px 36px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: progressPercent === 100 ? "linear-gradient(90deg,#44ff66,#22cc44)" : "linear-gradient(90deg,#ff3020,#ff6040,transparent)" }} />

          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 3, color: "rgba(255,255,255,0.2)", marginBottom: 6 }}>Overall Progress</div>
              <div style={{ fontSize: 56, fontWeight: 900, lineHeight: 1, color: progressPercent === 100 ? "#44ff66" : "#fff" }}>
                {progressPercent}<span style={{ fontSize: 24, color: "rgba(255,255,255,0.3)" }}>%</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>
                {approvedCount} approved · {submittedCount} in review
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.2)" }}>
                {totalPhases - approvedCount - submittedCount} remaining phases
              </div>
            </div>
          </div>

          {/* Big progress bar */}
          <div style={{ height: 10, background: "rgba(255,255,255,0.06)", borderRadius: 10, overflow: "hidden", marginBottom: 8 }}>
            <div style={{
              height: "100%",
              width: progressPercent + "%",
              borderRadius: 10,
              background: progressPercent === 100 ? "linear-gradient(90deg,#44ff66,#22cc44)" : "linear-gradient(90deg,#ff3020,#ff6040)",
              transition: "width 0.8s cubic-bezier(0.23,1,0.32,1)",
              backgroundSize: "200% 100%",
              animation: "shimmer 2.5s linear infinite",
            }} />
          </div>

          {/* Phase dots bar */}
          <div style={{ display: "flex", gap: 4 }}>
            {Array.from({ length: totalPhases }, function (_, i) {
              var phase = i + 1
              var ms = milestones.find(function (m) { return m.phase === phase })
              var status = ms ? ms.status : "pending"
              return (
                <div key={phase} style={{ flex: 1, height: 4, borderRadius: 4, background: status === "approved" ? "#44ff66" : status === "submitted" ? "#ffaa00" : "rgba(255,255,255,0.06)", transition: "background 0.4s" }} />
              )
            })}
          </div>
        </div>

        {/* Stats row */}
        <div className="ps-anim ps-d3" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { val: totalPhases, label: "Total Phases", color: "rgba(255,255,255,0.6)" },
            { val: approvedCount, label: "Completed", color: "#44ff66" },
            { val: submittedCount, label: "Under Review", color: "#ffaa00" },
            { val: credits ? credits.credits : "—", label: "Credits", color: "#ff6040" },
          ].map(function (s, i) {
            return (
              <div key={i} className="ps-glass ps-stat" style={{ padding: "20px 16px", textAlign: "center" }}>
                <div className="ps-stat-val" style={{ fontFamily: "var(--font-primary,'Open Sans',sans-serif)", fontSize: 28, fontWeight: 800, color: s.color, marginBottom: 4, animation: "countIn 0.5s ease " + (i * 0.08) + "s both" }}>{s.val}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: 2 }}>{s.label}</div>
              </div>
            )
          })}
        </div>

        {/* Timeline section */}
        <div className="ps-anim ps-d4">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 3, height: 14, borderRadius: 2, background: "linear-gradient(180deg,#ff3020,#ff6040)" }} />
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 3.5, color: "rgba(255,255,255,0.2)" }}>Milestone Timeline</div>
          </div>
          <div className="ps-glass" style={{ padding: "24px 28px 32px", overflow: "hidden" }}>
            {teamTechnology ? (
              <MilestoneTimeline teamNumber={teamNumber} technology={teamTechnology} isLeader={isLeader} />
            ) : (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "rgba(255,255,255,0.2)", fontSize: 14 }}>
                No technology set for this team yet.
              </div>
            )}
          </div>
        </div>

        {/* Phase details table */}
        <div className="ps-anim ps-d5" style={{ marginTop: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 3, height: 14, borderRadius: 2, background: "linear-gradient(180deg,#ff3020,#ff6040)" }} />
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 3.5, color: "rgba(255,255,255,0.2)" }}>Phase Details</div>
          </div>
          <div className="ps-glass" style={{ overflow: "hidden" }}>
            {milestones.length === 0 ? (
              <div style={{ padding: "32px 24px", textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 13 }}>
                No phases submitted yet.{isLeader ? " Click on the timeline circles above to submit phases." : ""}
              </div>
            ) : (
              <div>
                {milestones.sort(function (a, b) { return a.phase - b.phase }).map(function (ms, i) {
                  var isApproved = ms.status === "approved"
                  var isSubmitted = ms.status === "submitted"
                  return (
                    <div key={ms.id} className="phase-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderBottom: i < milestones.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: isApproved ? "rgba(68,255,102,0.1)" : isSubmitted ? "rgba(255,170,0,0.1)" : "rgba(255,255,255,0.05)", border: "1px solid " + (isApproved ? "rgba(68,255,102,0.25)" : isSubmitted ? "rgba(255,170,0,0.25)" : "rgba(255,255,255,0.08)"), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: isApproved ? "#44ff66" : isSubmitted ? "#ffaa00" : "rgba(255,255,255,0.3)" }}>
                          {ms.phase}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: isApproved ? "#fff" : "rgba(255,255,255,0.7)" }}>{ms.phase_name}</div>
                          {ms.submitted_at && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>Submitted {new Date(ms.submitted_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {ms.approved_by && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>by {ms.approved_by}</div>}
                        {ms.credits_awarded > 0 && (
                          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#44ff66", background: "rgba(68,255,102,0.06)", border: "1px solid rgba(68,255,102,0.15)", borderRadius: 20, padding: "2px 8px" }}>
                            +{ms.credits_awarded} cr
                          </div>
                        )}
                        <div style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, background: isApproved ? "rgba(68,255,102,0.08)" : isSubmitted ? "rgba(255,170,0,0.08)" : "rgba(255,255,255,0.04)", border: "1px solid " + (isApproved ? "rgba(68,255,102,0.2)" : isSubmitted ? "rgba(255,170,0,0.2)" : "rgba(255,255,255,0.06)"), color: isApproved ? "#44ff66" : isSubmitted ? "#ffaa00" : "rgba(255,255,255,0.3)" }}>
                          {isApproved ? "✓ Approved" : isSubmitted ? "⏳ Review" : "Pending"}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Leader hint */}
        {isLeader && milestones.length < totalPhases && (
          <div style={{ marginTop: 16, padding: "12px 18px", borderRadius: 12, background: "rgba(255,96,64,0.04)", border: "1px solid rgba(255,96,64,0.1)", fontSize: 12, color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,96,64,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Tap pending phase circles in the timeline to submit them for mentor review. Approved phases earn +3 credits.
          </div>
        )}

      </div>
    </div>
  )
}