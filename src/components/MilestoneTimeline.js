"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import toast from "react-hot-toast"

var supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

var PHASE_ICONS = {
  data1: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2",
  data2: "M3 3v18h18M9 9l3 3 3-3m-3 3v6",
  data3: "M12 2a4 4 0 0 0-4 4c0 2 2 3 2 5h4c0-2 2-3 2-5a4 4 0 0 0-4-4z",
  data4: "M18 20V10M12 20V4M6 20v-6",
  data5: "M11 3.055A9.001 9.001 0 1 0 20.945 13H11V3.055z",
  data6: "M5 12l5 5L20 7",
  aws1: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  aws2: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  aws3: "M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z",
  aws4: "M8 12h8M12 8v8M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z",
  aws5: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  aws6: "M9 12l2 2 4-4M7 2h10l3 4-8 14L2 6z",
  snow1: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2",
  snow2: "M4 6h16M4 10h16M4 14h8",
  snow3: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  snow4: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
  snow5: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
  snow6: "M5 3l14 9-14 9V3z",
  fl1: "M8 3h8l4 4-4 4H8L4 7l4-4zM8 13h8l4 4-4 4H8l-4-4 4-4z",
  fl2: "M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5z",
  fl3: "M3 12l9-9 9 9M5 10v9a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1v-9",
  fl4: "M8 12h8M12 8v8M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z",
  fl5: "M12 18h.01M8 21h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z",
  fl6: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  fs1: "M4 7c0 1.66 3.58 3 8 3s8-1.34 8-3M4 7c0-1.66 3.58-3 8-3s8 1.34 8 3M4 7v10c0 1.66 3.58 3 8 3s8-1.34 8-3V7",
  fs2: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  fs3: "M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18",
  fs4: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  fs5: "M9 11l3 3L22 4",
  fs6: "M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0 1 9-9",
  vlsi1: "M9 3v2M15 3v2M9 19v2M15 19v2M3 9h2M3 15h2M19 9h2M19 15h2M7 7h10v10H7z",
  vlsi2: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
  vlsi3: "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z",
  vlsi4: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  vlsi5: "M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5zm4 4h8m-8 4h4",
  vlsi6: "M9 12l2 2 4-4M7 2h10l3 4-8 14L2 6z",
  gen1: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2",
  gen2: "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z",
  gen3: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
  gen4: "M9 11l3 3L22 4",
  gen5: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  gen6: "M9 12l2 2 4-4M7 2h10l3 4-8 14L2 6z",
}

var MILESTONES_BY_TECH = {
  "Data Specialist":  ["Dataset & Problem", "Data Cleaning & EDA", "Model Design", "Core Analysis", "Visualization", "Deployment"],
  "AWS Development":  ["Architecture Design", "IAM & Networking", "Core Service Deploy", "Integration", "Security & Monitoring", "Final Deployment"],
  "ServiceNow":       ["Scope & Requirements", "Tables & Forms", "Workflows Built", "Business Rules", "Testing & UAT", "Production Ready"],
  "Google Flutter":   ["Wireframes & Plan", "Screens Designed", "Core Navigation", "API Integration", "Device Testing", "APK & Demo"],
  "Full Stack":       ["Schema & Stack", "Backend APIs", "Frontend Connected", "Auth & Features", "Testing & Fixes", "Deployed Live"],
  "VLSI":             ["Design Spec", "RTL Coding", "Simulation", "Synthesis", "Physical Design", "Final Verification"],
}

var ICON_KEYS_BY_TECH = {
  "Data Specialist":  ["data1", "data2", "data3", "data4", "data5", "data6"],
  "AWS Development":  ["aws1", "aws2", "aws3", "aws4", "aws5", "aws6"],
  "ServiceNow":       ["snow1", "snow2", "snow3", "snow4", "snow5", "snow6"],
  "Google Flutter":   ["fl1", "fl2", "fl3", "fl4", "fl5", "fl6"],
  "Full Stack":       ["fs1", "fs2", "fs3", "fs4", "fs5", "fs6"],
  "VLSI":             ["vlsi1", "vlsi2", "vlsi3", "vlsi4", "vlsi5", "vlsi6"],
}

var TECH_ALIASES = {
  "data specialist": "Data Specialist", "data analytics": "Data Specialist", "data science": "Data Specialist",
  "analytics": "Data Specialist", "machine learning": "Data Specialist", "ml": "Data Specialist",
  "aws development": "AWS Development", "aws": "AWS Development", "amazon web services": "AWS Development",
  "cloud": "AWS Development", "devops": "AWS Development", "azure": "AWS Development", "gcp": "AWS Development",
  "servicenow": "ServiceNow", "service now": "ServiceNow", "itsm": "ServiceNow",
  "google flutter": "Google Flutter", "flutter": "Google Flutter", "dart": "Google Flutter",
  "full stack": "Full Stack", "fullstack": "Full Stack", "full-stack": "Full Stack",
  "react": "Full Stack", "next.js": "Full Stack", "web": "Full Stack",
  "sharepoint": "Full Stack", "copilot studio": "Full Stack",
  "power apps": "Full Stack", "power automate": "Full Stack",
  "microsoft power platform": "Full Stack", "power platform": "Full Stack",
  "automation": "Full Stack", "node": "Full Stack", "nodejs": "Full Stack",
  "vlsi": "VLSI", "embedded": "VLSI", "verilog": "VLSI", "fpga": "VLSI",
}

function normalizeTech(technology) {
  if (!technology) return null
  if (MILESTONES_BY_TECH[technology]) return technology
  var key = technology.toLowerCase().trim()
  if (TECH_ALIASES[key]) return TECH_ALIASES[key]
  for (var alias in TECH_ALIASES) {
    if (key.includes(alias) || alias.includes(key)) return TECH_ALIASES[alias]
  }
  return "generic"
}

function getPhaseNames(technology) {
  var resolved = normalizeTech(technology)
  if (resolved && MILESTONES_BY_TECH[resolved]) return MILESTONES_BY_TECH[resolved]
  return ["Planning & Scope", "Design & Architecture", "Core Development", "Integration & Testing", "Review & Feedback", "Final Delivery"]
}

function getIconKeys(technology) {
  var resolved = normalizeTech(technology)
  if (resolved && ICON_KEYS_BY_TECH[resolved]) return ICON_KEYS_BY_TECH[resolved]
  return ["gen1", "gen2", "gen3", "gen4", "gen5", "gen6"]
}

function playNotifySound() {
  try {
    var ctx = new (window.AudioContext || window.webkitAudioContext)()
    var o = ctx.createOscillator(); var g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.frequency.setValueAtTime(660, ctx.currentTime)
    o.frequency.setValueAtTime(880, ctx.currentTime + 0.1)
    g.gain.setValueAtTime(0.2, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.3)
  } catch (e) {}
}

export default function MilestoneTimeline({ teamNumber, technology, isLeader }) {
  var [milestones, setMilestones] = useState([])
  var [credits, setCredits] = useState(null)
  var [submitting, setSubmitting] = useState(null)
  var [loading, setLoading] = useState(true)

  var resolvedTech = normalizeTech(technology) || "generic"
  var phaseNames = getPhaseNames(technology)
  var iconKeys = getIconKeys(technology)

  useEffect(function () {
    if (!teamNumber || !technology) return
    fetchData()
    var channel = supabaseClient
      .channel("milestones-" + teamNumber)
      .on("postgres_changes", { event: "*", schema: "public", table: "team_milestones", filter: "team_number=eq." + teamNumber }, function () { fetchData() })
      .on("postgres_changes", { event: "*", schema: "public", table: "team_credits", filter: "team_number=eq." + teamNumber }, function () { fetchData() })
      .subscribe()
    return function () { supabaseClient.removeChannel(channel) }
  }, [teamNumber, technology])

  function fetchData() {
    fetch("/api/milestones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get_team", teamNumber: teamNumber, technology: resolvedTech }),
    })
      .then(function (r) { return r.json() })
      .then(function (data) { setMilestones(data.milestones || []); setCredits(data.credits); setLoading(false) })
      .catch(function () { setLoading(false) })
  }

  function getMilestoneStatus(phase) {
    var found = milestones.find(function (m) { return m.phase === phase })
    return found ? found.status : "pending"
  }

  function handleSubmit(phase) {
    if (!isLeader) return
    if (getMilestoneStatus(phase) !== "pending") { toast.error("Already submitted"); return }
    setSubmitting(phase)
    fetch("/api/milestones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "submit_milestone", teamNumber: teamNumber, technology: resolvedTech, phase: phase, phaseName: phaseNames[phase - 1] }),
    })
      .then(function (r) { return r.json() })
      .then(function (data) {
        if (data.success) { toast.success("Phase submitted for review!"); playNotifySound(); fetchData() }
        else toast.error(data.error || "Failed to submit")
        setSubmitting(null)
      })
      .catch(function () { toast.error("Something went wrong"); setSubmitting(null) })
  }

  var approvedCount = phaseNames.filter(function (_, i) { return getMilestoneStatus(i + 1) === "approved" }).length
  var progressPercent = Math.round((approvedCount / phaseNames.length) * 100)

  return (
    <div style={{ fontFamily: "var(--font-primary,'Open Sans',sans-serif)", padding: "16px 0 8px" }}>
      <style>{`
        @keyframes mtPulseAmber{0%,100%{box-shadow:0 0 0 0 rgba(255,170,0,0)}60%{box-shadow:0 0 0 7px rgba(255,170,0,0.12)}}
        @keyframes mtGlowGreen{0%,100%{box-shadow:0 0 8px rgba(68,255,102,0.25)}50%{box-shadow:0 0 22px rgba(68,255,102,0.55)}}
        @keyframes mtSpin{to{transform:rotate(360deg)}}
        @keyframes mtShimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        .mt-circle{transition:transform 0.2s ease,box-shadow 0.2s ease}
        .mt-submittable:hover{transform:scale(1.1)!important;cursor:pointer}
      `}</style>

      {/* Progress bar row */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: 2, textTransform: "uppercase" }}>Progress</span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {credits !== null && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,96,64,0.07)", border: "1px solid rgba(255,96,64,0.18)", borderRadius: 20, padding: "3px 10px" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ff6040" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#ff6040" }}>{credits.credits} Credits</span>
              </div>
            )}
            <span style={{ fontSize: 14, fontWeight: 700, color: progressPercent === 100 ? "#44ff66" : "rgba(255,255,255,0.65)" }}>{progressPercent}%</span>
          </div>
        </div>
        <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 10, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: progressPercent + "%", borderRadius: 10,
            background: progressPercent === 100 ? "linear-gradient(90deg,#44ff66,#22cc44)" : "linear-gradient(90deg,#ff3020,#ff6040)",
            transition: "width 0.7s cubic-bezier(0.23,1,0.32,1)",
            backgroundSize: "200% 100%", animation: "mtShimmer 2s linear infinite",
          }} />
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 5 }}>
          {approvedCount} of {phaseNames.length} phases completed
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "28px 0" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,96,64,0.4)" strokeWidth="2" style={{ animation: "mtSpin 0.8s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        </div>
      ) : (
        <div style={{ overflowX: "auto", paddingBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "flex-start", minWidth: phaseNames.length * 116 }}>
            {phaseNames.map(function (name, i) {
              var phase = i + 1
              var status = getMilestoneStatus(phase)
              var isApproved = status === "approved"
              var isSubmitted = status === "submitted"
              var isPending = status === "pending"
              var isLast = i === phaseNames.length - 1
              var canSubmit = isPending && isLeader
              var iconKey = iconKeys[i]
              var iconPath = PHASE_ICONS[iconKey] || PHASE_ICONS["gen" + ((i % 6) + 1)]

              // clear distinct states:
              // approved   → vivid green bg + border + glow
              // submitted  → amber border + pulse (awaiting mentor click = approved)
              // pending    → near-invisible; dashed orange border if leader can submit
              var circleBg = isApproved
                ? "rgba(68,255,102,0.15)"
                : isSubmitted
                  ? "rgba(255,170,0,0.1)"
                  : "rgba(255,255,255,0.03)"

              var circleBorderStyle = isApproved
                ? "2px solid rgba(68,255,102,0.65)"
                : isSubmitted
                  ? "2px solid rgba(255,170,0,0.65)"
                  : canSubmit
                    ? "2px dashed rgba(255,96,64,0.4)"
                    : "2px solid rgba(255,255,255,0.08)"

              var iconStroke = isApproved
                ? "#44ff66"
                : isSubmitted
                  ? "#ffaa00"
                  : canSubmit
                    ? "rgba(255,96,64,0.55)"
                    : "rgba(255,255,255,0.18)"

              var circleAnim = isApproved
                ? "mtGlowGreen 2.5s ease-in-out infinite"
                : isSubmitted
                  ? "mtPulseAmber 1.8s ease-in-out infinite"
                  : "none"

              var labelColor = isApproved
                ? "rgba(255,255,255,0.9)"
                : isSubmitted
                  ? "#ffaa00"
                  : canSubmit
                    ? "rgba(255,255,255,0.5)"
                    : "rgba(255,255,255,0.28)"

              var statusText = isApproved
                ? "✓ Approved"
                : isSubmitted
                  ? "In Review"
                  : canSubmit
                    ? "Click to Submit"
                    : ""

              var statusColor = isApproved
                ? "#44ff66"
                : isSubmitted
                  ? "#ffaa00"
                  : canSubmit
                    ? "rgba(255,96,64,0.6)"
                    : "transparent"

              return (
                <div key={phase} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                  {/* Connector */}
                  {!isLast && (
                    <div style={{
                      position: "absolute", top: 25, left: "50%", width: "100%", height: 2, zIndex: 0,
                      background: isApproved ? "rgba(68,255,102,0.3)" : "rgba(255,255,255,0.05)",
                      transition: "background 0.4s",
                    }} />
                  )}

                  {/* Circle */}
                  <div
                    className={"mt-circle" + (canSubmit ? " mt-submittable" : "")}
                    onClick={function () { if (canSubmit) handleSubmit(phase) }}
                    title={canSubmit ? "Submit phase " + phase + ": " + name : name}
                    style={{
                      width: 50, height: 50, borderRadius: "50%",
                      background: circleBg,
                      border: circleBorderStyle,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      position: "relative", zIndex: 1,
                      animation: circleAnim,
                    }}
                  >
                    {submitting === phase ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff6040" strokeWidth="2" style={{ animation: "mtSpin 0.8s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    ) : isApproved ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#44ff66" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={iconStroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={iconPath} /></svg>
                    )}

                    {/* Phase number */}
                    <div style={{
                      position: "absolute", top: -5, right: -5,
                      width: 17, height: 17, borderRadius: "50%",
                      background: isApproved ? "#44ff66" : isSubmitted ? "#ffaa00" : "rgba(0,0,0,0.7)",
                      border: isApproved ? "1.5px solid rgba(68,255,102,0.5)" : isSubmitted ? "1.5px solid rgba(255,170,0,0.5)" : "1.5px solid rgba(255,255,255,0.1)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 8, fontWeight: 900,
                      color: isApproved || isSubmitted ? "#000" : "rgba(255,255,255,0.45)",
                    }}>
                      {phase}
                    </div>
                  </div>

                  {/* Phase name */}
                  <div style={{
                    marginTop: 10, fontSize: 11, textAlign: "center", lineHeight: 1.35,
                    maxWidth: 88, letterSpacing: 0.2, fontWeight: isApproved || isSubmitted ? 600 : 500,
                    color: labelColor,
                  }}>
                    {name}
                  </div>

                  {/* Status */}
                  <div style={{
                    marginTop: 5, fontSize: 9, fontWeight: 700,
                    color: statusColor, textTransform: "uppercase", letterSpacing: 1,
                    minHeight: 12,
                  }}>
                    {statusText}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: "flex", gap: 20, marginTop: 18, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(68,255,102,0.15)", border: "1.5px solid rgba(68,255,102,0.65)" }} />
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Approved by mentor</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255,170,0,0.1)", border: "1.5px solid rgba(255,170,0,0.65)" }} />
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Awaiting mentor approval</span>
        </div>
        {isLeader && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.03)", border: "1.5px dashed rgba(255,96,64,0.4)" }} />
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Pending — click to submit</span>
          </div>
        )}
      </div>
    </div>
  )
}