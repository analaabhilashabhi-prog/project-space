"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { EVENT_CONFIG } from "@/config/formFields"
import CountdownTimer from "@/components/CountdownTimer"

export default function Login() {
  var router = useRouter()
  var [rollNumber, setRollNumber] = useState("")
  var [password, setPassword] = useState("")
  var [showPassword, setShowPassword] = useState(false)
  var [loading, setLoading] = useState(false)
  var [blockedInfo, setBlockedInfo] = useState(null)

  function handleLogin(e) {
    e.preventDefault()
    if (!rollNumber.trim()) {
      toast.error("Please enter your roll number")
      return
    }
    if (!password) {
      toast.error("Please enter your password")
      return
    }
    setLoading(true)
    setBlockedInfo(null)

    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rollNumber: rollNumber.trim().toUpperCase(),
        password: password,
      }),
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
        } else if (data.success) {
          sessionStorage.setItem("ps_roll", rollNumber.trim().toUpperCase())
          sessionStorage.setItem("ps_logged_in", "true")

          if (data.status === "team_lead") {
            sessionStorage.setItem("ps_is_leader", "true")
            toast.success("Welcome back, Team Lead!")
            router.push("/team-info/" + data.teamNumber)
          } else {
            toast.success("Login successful!")
            router.push("/register")
          }
        } else {
          toast.error(data.error || "Login failed")
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
    setRollNumber("")
    setPassword("")
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
            <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="text-gray-400">Login with your roll number and password</p>
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

          {/* Login Card */}
          {!blockedInfo && (
            <div className="p-8 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm">
              <h2 className="text-xl font-semibold mb-2">Student Login</h2>
              <p className="text-sm text-gray-400 mb-6">Enter your credentials to continue.</p>

              <form onSubmit={handleLogin}>
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

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={function (e) { setPassword(e.target.value) }}
                      placeholder="Enter your password"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 pr-16"
                      required
                    />
                    <button
                      type="button"
                      onClick={function () { setShowPassword(!showPassword) }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-sm px-2 py-1 rounded-lg bg-white/5"
                    >
                      {showPassword ? "🙈 Hide" : "👁 Show"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold rounded-xl text-base hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] disabled:opacity-50 transition-all"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      Logging in...
                    </span>
                  ) : "Login →"}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-white/10"></div>
                <span className="text-xs text-gray-500">OR</span>
                <div className="flex-1 h-px bg-white/10"></div>
              </div>

              {/* Create Account Button */}
              <button
                onClick={function () { router.push("/register-account") }}
                className="w-full py-3 border border-white/10 bg-white/[0.03] text-white font-medium rounded-xl text-sm hover:bg-white/[0.08] hover:border-emerald-500/30 transition-all"
              >
                Don't have an account? Create one →
              </button>
            </div>
          )}

          {/* Back to home */}
          <div className="text-center mt-6">
            <button
              onClick={function () { router.push("/") }}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              ← Back to Home
            </button>
          </div>

          <p className="text-center text-xs text-gray-600 mt-8">© 2026 {EVENT_CONFIG.organizationName}</p>
        </div>
      </div>
    </div>
  )
}