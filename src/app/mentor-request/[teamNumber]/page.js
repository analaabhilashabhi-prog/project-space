"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import toast from "react-hot-toast"
import { supabase } from "@/lib/supabase"
import { EVENT_CONFIG } from "@/config/formFields"
import CountdownTimer from "@/components/CountdownTimer"
import NotificationBell from "@/components/NotificationBell"

var TECHNOLOGIES = ["AWS", "Data Specialist", "ServiceNow", "VLSI", "FSD", "Google Flutter"]

export default function MentorRequestPage() {
  var params = useParams()
  var router = useRouter()
  var teamNumber = params.teamNumber

  var [team, setTeam] = useState(null)
  var [loading, setLoading] = useState(true)
  var [step, setStep] = useState("select-tech")
  var [selectedTech, setSelectedTech] = useState("")
  var [mentors, setMentors] = useState([])
  var [loadingMentors, setLoadingMentors] = useState(false)
  var [sending, setSending] = useState(false)
  var [activeRequest, setActiveRequest] = useState(null)
  var [pastRequests, setPastRequests] = useState([])
  var [resolving, setResolving] = useState(false)
  var [showConfirm, setShowConfirm] = useState(null)

  useEffect(function () {
    var roll = sessionStorage.getItem("ps_roll")
    if (!roll) {
      router.push("/")
      return
    }

    async function fetchData() {
      var teamRes = await supabase
        .from("teams")
        .select("*")
        .eq("team_number", teamNumber)
        .single()

      if (teamRes.data) {
        setTeam(teamRes.data)
      }

      var reqRes = await fetch("/api/mentor-request?team_number=" + teamNumber)
      var reqData = await reqRes.json()

      if (reqData.requests) {
        var pending = reqData.requests.find(function (r) { return r.status === "pending" })
        if (pending) {
          setActiveRequest(pending)
          setStep("active")
        }
        setPastRequests(reqData.requests.filter(function (r) { return r.status === "resolved" }))
      }

      setLoading(false)
    }

    if (teamNumber) fetchData()
  }, [teamNumber, router])

  function selectTechnology(tech) {
    setSelectedTech(tech)
    setLoadingMentors(true)
    setStep("select-mentor")

    fetch("/api/mentors?technology=" + encodeURIComponent(tech))
      .then(function (res) { return res.json() })
      .then(function (data) {
        setMentors(data.mentors || [])
        setLoadingMentors(false)
      })
      .catch(function () {
        setLoadingMentors(false)
      })
  }

  function requestMentor(mentor) {
    setShowConfirm(mentor)
  }

  function confirmRequest() {
    if (!showConfirm || !team) return
    setSending(true)

    fetch("/api/mentor-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamNumber: teamNumber,
        teamId: team.id,
        mentorId: showConfirm.id,
        technology: selectedTech,
        projectTitle: team.project_title,
      }),
    })
      .then(function (res) { return res.json() })
      .then(function (data) {
        if (data.success) {
          toast.success("Mentor " + data.mentorName + " has been notified via SMS!")
          // Fetch the actual request from DB to get the ID
          fetch("/api/mentor-request?team_number=" + teamNumber)
            .then(function (r) { return r.json() })
            .then(function (d) {
              if (d.requests) {
                var pending = d.requests.find(function (r) { return r.status === "pending" })
                if (pending) setActiveRequest(pending)
              }
            })
          setStep("active")
          setShowConfirm(null)
        } else {
          toast.error(data.error || "Failed to request mentor")
        }
        setSending(false)
      })
      .catch(function () {
        toast.error("Something went wrong")
        setSending(false)
      })
  }

  function resolveRequest() {
    if (!activeRequest) return
    setResolving(true)

    fetch("/api/mentor-request", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: activeRequest.id }),
    })
      .then(function (res) { return res.json() })
      .then(function (data) {
        if (data.success) {
          toast.success("Marked as resolved! Thank you.")
          setPastRequests(function (prev) {
            return [Object.assign({}, activeRequest, { status: "resolved", resolved_at: new Date().toISOString() })].concat(prev)
          })
          setActiveRequest(null)
          setStep("select-tech")
        } else {
          toast.error("Failed to resolve")
        }
        setResolving(false)
      })
      .catch(function () {
        toast.error("Something went wrong")
        setResolving(false)
      })
  }

  function formatDate(dateStr) {
    var d = new Date(dateStr + "Z")
    return d.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <CountdownTimer />
      <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[120px]"></div>
      <div className="absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-[120px]"></div>

      {/* Header */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center font-bold text-black text-lg">PS</div>
          <span className="text-xl font-semibold">{EVENT_CONFIG.eventName}</span>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <Link href={"/team-info/" + teamNumber} className="text-sm text-gray-400 hover:text-white px-3 py-1 border border-white/10 rounded-lg">
            ← Back
          </Link>
        </div>
      </nav>

      <main className="relative z-10 max-w-3xl mx-auto px-8 py-4 pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">🧑‍🏫 Request a Mentor</h1>
          <p className="text-gray-400">Need help? Request a mentor and they'll be notified via SMS.</p>
        </div>

        {/* Active Request */}
        {step === "active" && activeRequest && (
          <div className="p-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/5 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
              <h3 className="font-semibold text-yellow-400">Active Request</h3>
            </div>
            <div className="space-y-3 p-4 rounded-xl bg-black/30">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Mentor</span>
                <span className="text-white font-medium">{activeRequest.mentor_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Technology</span>
                <span className="text-emerald-400">{activeRequest.technology}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Requested</span>
                <span className="text-white">{formatDate(activeRequest.requested_at)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Status</span>
                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">Waiting for help</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">SMS has been sent to the mentor. Once your issue is resolved, click below.</p>
            <button
              onClick={resolveRequest}
              disabled={resolving}
              className="mt-4 w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold rounded-xl disabled:opacity-50"
            >
              {resolving ? "Resolving..." : "✅ Issue Resolved"}
            </button>
          </div>
        )}

        {/* Step 1: Select Technology */}
        {step === "select-tech" && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Select Technology</h2>
            <div className="grid grid-cols-2 gap-3">
              {TECHNOLOGIES.map(function (tech) {
                return (
                  <button
                    key={tech}
                    onClick={function () { selectTechnology(tech) }}
                    className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-emerald-500/30 transition-all text-left"
                  >
                    <p className="font-medium">{tech}</p>
                    <p className="text-xs text-gray-500 mt-1">Get mentor help</p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 2: Select Mentor */}
        {step === "select-mentor" && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <button onClick={function () { setStep("select-tech") }} className="text-gray-400 hover:text-white text-sm">← Back</button>
              <h2 className="text-lg font-semibold">Mentors for {selectedTech}</h2>
            </div>

            {loadingMentors ? (
              <div className="text-center py-10">
                <div className="animate-spin h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
              </div>
            ) : mentors.length === 0 ? (
              <div className="text-center py-10">
                <span className="text-4xl mb-4 block">😕</span>
                <p className="text-gray-400">No mentors available for {selectedTech} right now.</p>
                <button onClick={function () { setStep("select-tech") }} className="mt-4 text-emerald-400 text-sm">Choose different technology</button>
              </div>
            ) : (
              <div className="space-y-3">
                {mentors.map(function (mentor) {
                  return (
                    <div key={mentor.id} className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-lg">
                          {mentor.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{mentor.name}</p>
                          <p className="text-xs text-gray-500">{mentor.technology}</p>
                        </div>
                      </div>
                      <button
                        onClick={function () { requestMentor(mentor) }}
                        className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-sm font-medium text-emerald-400 hover:bg-emerald-500/30"
                      >
                        Request
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Confirmation Popup */}
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-sm p-6 rounded-2xl border border-white/10 bg-[#1a1a1a]">
              <h3 className="text-lg font-semibold mb-2">Confirm Request</h3>
              <p className="text-sm text-gray-400 mb-4">
                An SMS will be sent to <strong className="text-white">{showConfirm.name}</strong> asking them to help your team with <strong className="text-emerald-400">{selectedTech}</strong>.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={function () { setShowConfirm(null) }}
                  className="flex-1 py-2.5 border border-white/10 rounded-xl text-sm text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRequest}
                  disabled={sending}
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold rounded-xl text-sm disabled:opacity-50"
                >
                  {sending ? "Sending SMS..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Past Requests */}
        {pastRequests.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Past Requests</h2>
            <div className="space-y-3">
              {pastRequests.map(function (req, i) {
                return (
                  <div key={i} className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{req.mentor_name}</span>
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px]">Resolved</span>
                      </div>
                      <span className="text-xs text-gray-500">{formatDate(req.requested_at)}</span>
                    </div>
                    <p className="text-xs text-gray-400">{req.technology}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}