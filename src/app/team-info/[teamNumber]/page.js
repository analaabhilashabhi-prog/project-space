"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { EVENT_CONFIG, WHATSAPP_MESSAGE } from "@/config/formFields"
import CountdownTimer from "@/components/CountdownTimer"
import NotificationBell from "@/components/NotificationBell"
import ScrollAnimate from "@/components/ScrollAnimate"
import { SkeletonTeamInfo } from "@/components/Skeleton"

export default function TeamInfoPage() {
  var params = useParams()
  var router = useRouter()
  var teamNumber = params.teamNumber
  var [team, setTeam] = useState(null)
  var [members, setMembers] = useState([])
  var [loading, setLoading] = useState(true)
  var [loggedInRoll, setLoggedInRoll] = useState("")
  var [copied, setCopied] = useState(false)

  useEffect(function () {
    var roll = sessionStorage.getItem("ps_roll")
    if (!roll) {
      router.push("/")
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

  function handleLogout() {
    sessionStorage.clear()
    router.push("/")
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
      gradient.addColorStop(1, "#0f1f1a")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 800, 600)

      ctx.strokeStyle = "rgba(16, 185, 129, 0.3)"
      ctx.lineWidth = 2
      ctx.roundRect(20, 20, 760, 560, 20)
      ctx.stroke()

      var headerGrad = ctx.createLinearGradient(0, 0, 800, 0)
      headerGrad.addColorStop(0, "#10b981")
      headerGrad.addColorStop(1, "#06b6d4")
      ctx.fillStyle = headerGrad
      ctx.roundRect(20, 20, 760, 80, [20, 20, 0, 0])
      ctx.fill()

      ctx.fillStyle = "#000000"
      ctx.font = "bold 28px Arial"
      ctx.fillText(EVENT_CONFIG.eventName, 40, 70)

      ctx.fillStyle = "#10b981"
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
      ctx.fillStyle = "#6b7280"
      ctx.font = "bold 14px Arial"
      ctx.fillText("TEAM MEMBERS", 40, 280)

      members.forEach(function (m, i) {
        var y = 310 + i * 40
        ctx.fillStyle = m.is_leader ? "#eab308" : "#ffffff"
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <CountdownTimer />
      <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[120px]"></div>
      <div className="absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-[120px]"></div>

      {/* Header */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-3xl mx-auto fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center font-bold text-black text-lg">PS</div>
          <span className="text-xl font-semibold hidden sm:inline">{EVENT_CONFIG.eventName}</span>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <span className="text-sm text-gray-400 hidden sm:inline">{loggedInRoll}</span>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white px-3 py-1 glass rounded-lg btn-press">Logout</button>
        </div>
      </nav>

      {loading ? (
        <SkeletonTeamInfo />
      ) : !team ? (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-bold">Team not found</h1>
          <Link href="/" className="text-emerald-400">Go back home</Link>
        </div>
      ) : (
        <main className="relative z-10 max-w-3xl mx-auto px-8 py-8 page-transition">
          {/* Welcome */}
          <div className="p-6 rounded-2xl glass glow-pulse mb-8 fade-in">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">👋</span>
              <h1 className="text-2xl font-bold">
                Welcome{currentMember ? ", " + currentMember.member_name : ""}!
              </h1>
            </div>
            <p className="text-gray-400 text-sm">
              {isLeader ? "You are the Team Leader of this team." : "You are a member of this team."}
            </p>
          </div>

          {/* Team Number */}
          <ScrollAnimate>
            <div className="p-8 rounded-2xl glass mb-6 text-center card-hover">
              <p className="text-sm text-gray-400 mb-2">Your Team Number</p>
              <p className="text-5xl font-bold gradient-text-animate mb-4">
                {team.team_number}
              </p>

              <div className="flex flex-wrap justify-center gap-3">
                <button onClick={copyTeamNumber}
                  className={copied
                    ? "px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 btn-press"
                    : "px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 glass text-gray-300 hover:bg-white/10 btn-press"
                  }>
                  {copied ? "Copied!" : "Copy Number"}
                </button>
                <button onClick={shareWhatsApp}
                  className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-xl text-sm font-medium text-green-400 hover:bg-green-500/30 flex items-center gap-2 btn-press">
                  Share WhatsApp
                </button>
                <button onClick={downloadTeamCard}
                  className="px-4 py-2 glass rounded-xl text-sm font-medium text-gray-300 hover:bg-white/10 flex items-center gap-2 btn-press">
                  Download Card
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                Registered on {new Date(team.registered_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </ScrollAnimate>

          {/* Project Details */}
          <ScrollAnimate>
            <div className="p-6 rounded-2xl glass mb-6 card-hover">
              <h2 className="text-lg font-semibold mb-4">Project Details</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400">Project Title</p>
                  <p className="font-semibold text-lg">{team.project_title}</p>
                </div>
                {team.project_description && (
                  <div>
                    <p className="text-sm text-gray-400">Description</p>
                    <p className="text-gray-300">{team.project_description}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-400 mb-2">Technologies</p>
                  <div className="flex flex-wrap gap-2">
                    {(team.technologies || []).map(function (tech) {
                      return <span key={tech} className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-sm text-emerald-400">{tech}</span>
                    })}
                  </div>
                </div>
              </div>
            </div>
          </ScrollAnimate>

          {/* Team Members */}
          <ScrollAnimate>
            <div className="p-6 rounded-2xl glass mb-6 card-hover">
              <h2 className="text-lg font-semibold mb-4">Team Members ({members.length})</h2>
              <div className="space-y-3">
                {members.map(function (m, i) {
                  return (
                    <div key={i}
                      className={m.member_roll_number === loggedInRoll
                        ? "flex items-center justify-between p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 card-hover"
                        : "flex items-center justify-between p-4 rounded-xl glass card-hover"
                      }>
                      <div className="flex items-center gap-3">
                        <div className={m.is_leader
                          ? "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-yellow-500/20 text-yellow-400"
                          : "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-white/10 text-gray-300"
                        }>
                          {m.is_leader ? "👑" : i + 1}
                        </div>
                        <div>
                          <p className="font-medium">
                            {m.member_name}
                            {m.member_roll_number === loggedInRoll && (
                              <span className="ml-2 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs">You</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">{m.member_roll_number} | {m.member_branch}</p>
                        </div>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-gray-400">{m.member_college}</p>
                        <p className="text-xs text-gray-500">{m.member_year}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </ScrollAnimate>

          {/* Event Details */}
          <ScrollAnimate>
            <div className="p-6 rounded-2xl glass mb-6 card-hover">
              <h2 className="text-lg font-semibold mb-4">Event Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl glass">
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="font-medium">May 6 - 12, 2026</p>
                </div>
                <div className="p-4 rounded-xl glass">
                  <p className="text-xs text-gray-500">Time</p>
                  <p className="font-medium">{EVENT_CONFIG.eventTime}</p>
                </div>
                <div className="p-4 rounded-xl glass">
                  <p className="text-xs text-gray-500">Venue</p>
                  <p className="font-medium">{EVENT_CONFIG.eventVenue}</p>
                </div>
                <div className="p-4 rounded-xl glass">
                  <p className="text-xs text-gray-500">Your Role</p>
                  <p className="font-medium">{isLeader ? "Team Leader" : "Team Member"}</p>
                </div>
              </div>
            </div>
          </ScrollAnimate>

          {/* Action Buttons */}
          <ScrollAnimate>
            <div className="space-y-3">
              <Link href={"/food-selection/" + team.team_number}>
                <div className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold rounded-xl text-lg text-center btn-press hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-all">
                  Select Snacks and Beverages
                </div>
              </Link>
              <Link href={"/mentor-request/" + team.team_number}>
                <div className="w-full py-3 bg-purple-500/20 border border-purple-500/30 rounded-xl text-sm font-medium text-purple-400 hover:bg-purple-500/30 text-center mt-3 btn-press">
                  🧑‍🏫 Request a Mentor
                </div>
              </Link>
              <Link href="/announcements">
                <div className="w-full py-3 glass rounded-xl text-sm font-medium hover:bg-white/10 text-center mt-3 btn-press">
                  View Announcements
                </div>
              </Link>
            </div>
          </ScrollAnimate>

          <div className="text-center py-6">
            <p className="text-sm text-gray-500">Show team number <span className="text-emerald-400 font-bold">{team.team_number}</span> at the venue</p>
          </div>
        </main>
      )}
    </div>
  )
}