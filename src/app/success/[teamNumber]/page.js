"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import QRCode from "qrcode"
import confetti from "canvas-confetti"
import { supabase } from "@/lib/supabase"
import { EVENT_CONFIG, WHATSAPP_MESSAGE } from "@/config/formFields"
import CountdownTimer from "@/components/CountdownTimer"

export default function SuccessPage() {
  var params = useParams()
  var teamNumber = params.teamNumber
  var [team, setTeam] = useState(null)
  var [members, setMembers] = useState([])
  var [qrImage, setQrImage] = useState("")
  var [loading, setLoading] = useState(true)
  var [copied, setCopied] = useState(false)

  useEffect(function () {
    // Fire confetti
    setTimeout(function () {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#10b981", "#06b6d4", "#8b5cf6", "#f59e0b"],
      })
    }, 500)

    setTimeout(function () {
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { x: 0.2, y: 0.5 },
        colors: ["#10b981", "#06b6d4"],
      })
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { x: 0.8, y: 0.5 },
        colors: ["#8b5cf6", "#f59e0b"],
      })
    }, 1200)

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

        var qr = await QRCode.toDataURL(teamNumber, {
          width: 300,
          margin: 2,
          color: { dark: "#000000", light: "#ffffff" },
        })
        setQrImage(qr)
      }
      setLoading(false)
    }

    if (teamNumber) fetchTeam()
  }, [teamNumber])

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Team not found</h1>
        <Link href="/">Go back home</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <CountdownTimer />
      <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[120px]"></div>
      <div className="absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-[120px]"></div>

      <main className="relative z-10 max-w-2xl mx-auto px-8 py-16 text-center page-transition">
        {/* Success icon */}
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6 scale-in glow-pulse">
          <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
          </svg>
        </div>

        <h1 className="text-4xl font-bold mb-3 fade-in gradient-text-animate">Registration Successful!</h1>
        <p className="text-gray-400 mb-10 fade-in fade-in-delay-1">Your team has been registered for {EVENT_CONFIG.eventName}.</p>

        {/* Team Number Card */}
        <div className="p-8 rounded-2xl glass glow-pulse mb-6 fade-in fade-in-delay-2">
          <p className="text-sm text-gray-400 mb-2">Your Team Number</p>
          <p className="text-5xl font-bold gradient-text-animate mb-6">
            {team.team_number}
          </p>

          {qrImage !== "" && (
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white rounded-2xl card-hover">
                <img src={qrImage} alt="QR Code" width={192} height={192} />
              </div>
            </div>
          )}

          <p className="text-xs text-gray-500 mb-6">Scan this QR code at the venue entrance</p>

          {/* Team Details */}
          <div className="text-left space-y-3 border-t border-white/10 pt-6">
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Project</span>
              <span className="font-medium text-right max-w-[60%]">{team.project_title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Technologies</span>
              <span className="font-medium text-right max-w-[60%]">{(team.technologies || []).join(", ")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Team Size</span>
              <span className="font-medium">{members.length} members</span>
            </div>
          </div>

          {/* Members */}
          <div className="mt-6 border-t border-white/10 pt-6">
            <p className="text-sm text-gray-400 mb-3 text-left">Team Members</p>
            <div className="space-y-2">
              {members.map(function (m, i) {
                return (
                  <div key={i} className="flex justify-between items-center text-sm py-2 px-3 rounded-lg glass card-hover">
                    <span className="text-gray-300">{m.is_leader ? "👑 " : ""}{m.member_name}</span>
                    <span className="text-gray-500 text-xs">{m.member_roll_number}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 fade-in fade-in-delay-3">
          <div className="flex gap-3">
            <button
              onClick={copyTeamNumber}
              className={copied
                ? "flex-1 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 btn-press"
                : "flex-1 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 glass text-gray-300 hover:bg-white/10 btn-press"
              }
            >
              {copied ? "Copied!" : "Copy Number"}
            </button>
            <button
              onClick={shareWhatsApp}
              className="flex-1 py-3 bg-green-500/20 border border-green-500/30 rounded-xl text-sm font-medium text-green-400 hover:bg-green-500/30 flex items-center justify-center gap-2 btn-press"
            >
              Share WhatsApp
            </button>
          </div>

          {qrImage !== "" && (
            <div>
              <a href={qrImage} download="team-qr-code.png">
                <div className="w-full py-3 glass rounded-xl text-sm font-medium hover:bg-white/10 text-center btn-press">
                  Download QR Code
                </div>
              </a>
            </div>
          )}

          <Link href={"/food-selection/" + team.team_number}>
            <div className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold rounded-xl text-lg text-center mt-3 btn-press hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-all">
              Select Snacks and Beverages
            </div>
          </Link>

          <Link href={"/team-info/" + team.team_number}>
            <div className="w-full py-3 glass rounded-xl text-sm font-medium hover:bg-white/10 text-center mt-3 btn-press">
              View Team Dashboard
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}