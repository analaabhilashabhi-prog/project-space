"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { EVENT_CONFIG } from "@/config/formFields"
import { supabase } from "@/lib/supabase"
import CountdownTimer from "@/components/CountdownTimer"

export default function Home() {
  var router = useRouter()
  var [step, setStep] = useState("roll")
  var [rollNumber, setRollNumber] = useState("")
  var [otp, setOtp] = useState("")
  var [loading, setLoading] = useState(false)
  var [email, setEmail] = useState("")
  var [resendTimer, setResendTimer] = useState(0)
  var [blockedInfo, setBlockedInfo] = useState(null)
  var [registrationOpen, setRegistrationOpen] = useState(true)
  var [checkingStatus, setCheckingStatus] = useState(true)

  useEffect(function () {
    async function checkStatus() {
      try {
        var res = await supabase
          .from("settings")
          .select("value")
          .eq("id", "registration_open")
          .single()
        if (res.data) {
          setRegistrationOpen(res.data.value === "true")
        }
      } catch (err) {}
      setCheckingStatus(false)
    }
    checkStatus()
  }, [])

  useEffect(function () {
    if (resendTimer > 0) {
      var interval = setInterval(function () {
        setResendTimer(function (t) { return t - 1 })
      }, 1000)
      return function () { clearInterval(interval) }
    }
  }, [resendTimer])

  function handleSendOTP(e) {
    if (e) e.preventDefault()
    if (!rollNumber.trim()) {
      toast.error("Please enter your roll number")
      return
    }
    setLoading(true)
    setBlockedInfo(null)

    fetch("/api/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rollNumber: rollNumber.trim().toUpperCase() }),
    })
      .then(function (res) { return res.json() })
      .then(function (data) {
        if (data.status === "team_member") {
          setBlockedInfo({
            type: "member",
            teamNumber: data.teamNumber,
            projectTitle: data.projectTitle,
            memberName: data.memberName,
            leaderName: data.leaderName,
            leaderRoll: data.leaderRoll,
          })
        } else if (data.status === "closed") {
          setBlockedInfo({
            type: "closed",
            message: data.message,
          })
        } else if (data.success) {
          setEmail(data.email || "your email")
          setStep("otp")
          setResendTimer(60)
          toast.success("OTP sent to your email!")
        } else {
          toast.error(data.error || "Failed to send OTP")
        }
        setLoading(false)
      })
      .catch(function () {
        toast.error("Something went wrong")
        setLoading(false)
      })
  }

  function handleResendOTP() {
    if (resendTimer > 0) return
    handleSendOTP()
  }

  function handleVerifyOTP(e) {
    e.preventDefault()
    if (!otp.trim()) {
      toast.error("Please enter the OTP")
      return
    }
    setLoading(true)

    fetch("/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rollNumber: rollNumber.trim().toUpperCase(), otp: otp.trim() }),
    })
      .then(function (res) { return res.json() })
      .then(function (data) {
        if (data.status === "team_lead") {
          sessionStorage.setItem("ps_roll", rollNumber.trim().toUpperCase())
          sessionStorage.setItem("ps_logged_in", "true")
          sessionStorage.setItem("ps_is_leader", "true")
          toast.success("Welcome back, Team Lead!")
          router.push("/team-info/" + data.teamNumber)
        } else if (data.status === "new_user") {
          sessionStorage.setItem("ps_roll", rollNumber.trim().toUpperCase())
          sessionStorage.setItem("ps_logged_in", "true")
          toast.success("Login successful!")
          router.push("/register")
        } else if (!data.success) {
          toast.error(data.error || "Invalid OTP")
        }
        setLoading(false)
      })
      .catch(function () {
        toast.error("Something went wrong")
        setLoading(false)
      })
  }

  function resetLogin() {
    setBlockedInfo(null)
    setStep("roll")
    setOtp("")
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden relative flex flex-col">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      ></div>
      <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[120px]"></div>
      <div className="absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-[120px]"></div>

      <div className="relative z-50">
        <CountdownTimer />
      </div>

      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className="w-full max-w-md px-6">
          {/* Logo */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center font-bold text-black text-2xl mx-auto mb-6">
              PS
            </div>
            <h1 className="text-4xl font-bold mb-2">{EVENT_CONFIG.eventName}</h1>
            <p className="text-gray-400">{EVENT_CONFIG.organizationName}</p>

            {!checkingStatus && (
              <div className={
                registrationOpen
                  ? "inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/5 mt-4"
                  : "inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 bg-red-500/5 mt-4"
              }>
                <span className={
                  registrationOpen
                    ? "w-2 h-2 rounded-full bg-emerald-400 animate-pulse"
                    : "w-2 h-2 rounded-full bg-red-400"
                }></span>
                <span className={
                  registrationOpen
                    ? "text-sm text-emerald-400"
                    : "text-sm text-red-400"
                }>
                  {registrationOpen ? "Registrations Open" : "Registrations Closed"}
                </span>
              </div>
            )}
          </div>

          {/* Team Member Blocked */}
          {blockedInfo && blockedInfo.type === "member" && (
            <div className="p-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/5 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">⚠️</span>
                <h3 className="font-semibold text-yellow-400">Already a Team Member</h3>
              </div>
              <p className="text-sm text-gray-300 mb-4">
                Hi <strong>{blockedInfo.memberName}</strong>, you are already registered as a member. Only team leads can login.
              </p>
              <div className="space-y-2 p-4 rounded-xl bg-black/30">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Team Number</span>
                  <span className="text-emerald-400 font-bold">{blockedInfo.teamNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Project</span>
                  <span className="text-white">{blockedInfo.projectTitle}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Team Lead</span>
                  <span className="text-white">{blockedInfo.leaderName} ({blockedInfo.leaderRoll})</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">Please ask your team lead to login for any changes.</p>
              <button
                onClick={resetLogin}
                className="mt-4 w-full py-2 text-sm text-gray-400 hover:text-white border border-white/10 rounded-xl"
              >
                Try Different Roll Number
              </button>
            </div>
          )}

          {/* Registrations Closed */}
          {blockedInfo && blockedInfo.type === "closed" && (
            <div className="p-6 rounded-2xl border border-red-500/30 bg-red-500/5 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🚫</span>
                <h3 className="font-semibold text-red-400">Registrations Closed</h3>
              </div>
              <p className="text-sm text-gray-300 mb-4">
                Registrations are currently closed. Please contact the organizers or try again later.
              </p>
              <button
                onClick={resetLogin}
                className="mt-2 w-full py-2 text-sm text-gray-400 hover:text-white border border-white/10 rounded-xl"
              >
                Go Back
              </button>
            </div>
          )}

          {/* Login Card */}
          {!blockedInfo && (
            <div className="p-8 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm">
              {step === "roll" ? (
                <div>
                  <h2 className="text-xl font-semibold mb-2">Student Login</h2>
                  <p className="text-sm text-gray-400 mb-6">Enter your roll number to get started.</p>
                  <form onSubmit={handleSendOTP}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">Roll Number</label>
                      <input
                        type="text"
                        value={rollNumber}
                        onChange={function (e) { setRollNumber(e.target.value.toUpperCase()) }}
                        placeholder="e.g. 22A31A0501"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 uppercase"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold rounded-xl text-base hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] disabled:opacity-50 transition-all"
                    >
                      {loading ? "Checking..." : "Send OTP →"}
                    </button>
                  </form>
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-semibold mb-2">Enter OTP</h2>
                  <p className="text-sm text-gray-400 mb-6">
                    We sent a 6-digit OTP to <span className="text-emerald-400">{email}</span>
                  </p>
                  <form onSubmit={handleVerifyOTP}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">OTP Code</label>
                      <input
                        type="text"
                        value={otp}
                        onChange={function (e) { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)) }}
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-center text-2xl tracking-[0.5em] placeholder-gray-500 placeholder:text-base placeholder:tracking-normal focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold rounded-xl text-base hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] disabled:opacity-50 transition-all"
                    >
                      {loading ? "Verifying..." : "Verify & Login →"}
                    </button>

                    <div className="text-center mt-4">
                      {resendTimer > 0 ? (
                        <p className="text-sm text-gray-500">Resend OTP in <span className="text-emerald-400 font-medium">{resendTimer}s</span></p>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOTP}
                          className="text-sm text-emerald-400 hover:text-emerald-300"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={resetLogin}
                      className="w-full py-2 mt-3 text-sm text-gray-400 hover:text-white"
                    >
                      ← Back to Roll Number
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Event info */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
              <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">7 Days</p>
              <p className="text-xs text-gray-500 mt-1">Duration</p>
            </div>
            <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
              <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">6 Members</p>
              <p className="text-xs text-gray-500 mt-1">Team Size</p>
            </div>
            <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
              <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">May 6-12</p>
              <p className="text-xs text-gray-500 mt-1">Date</p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-600 mt-8">© 2026 {EVENT_CONFIG.organizationName}</p>
        </div>
      </div>
    </div>
  )
}