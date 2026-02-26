"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import toast, { Toaster } from "react-hot-toast"
import { EVENT_CONFIG } from "@/config/formFields"
import AnimatedBackground from "@/components/AnimatedBackground"

export default function LoginPage() {
  const router = useRouter()
  const [rollNumber, setRollNumber] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [blockedInfo, setBlockedInfo] = useState(null)

  function handleLogin(e) {
    e.preventDefault()
    if (!rollNumber.trim()) { toast.error("Please enter your roll number"); return }
    if (!password) { toast.error("Please enter your password"); return }
    setLoading(true)
    setBlockedInfo(null)

    fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rollNumber: rollNumber.trim().toUpperCase(), password: password }),
    })
      .then(function (res) { return res.json() })
      .then(function (data) {
        if (data.status === "no_account") {
          toast.error("No account found. Please create one first.")
          setLoading(false)
          return
        }

        if (data.status === "team_member") {
          setBlockedInfo(data)
          setLoading(false)
          return
        }

        if (data.success && data.status === "team_lead") {
          toast.success("Welcome back, Team Lead!")
          localStorage.setItem("ps_roll", rollNumber.trim().toUpperCase())
          sessionStorage.setItem("ps_roll", rollNumber.trim().toUpperCase())
          setTimeout(function () { router.push("/team-info/" + data.teamNumber) }, 800)
          return
        }

        if (data.success && data.status === "new_user") {
          if (data.registrationOpen) {
            toast.success("Login successful! Register your team.")
            localStorage.setItem("ps_roll", rollNumber.trim().toUpperCase())
            sessionStorage.setItem("ps_roll", rollNumber.trim().toUpperCase())
            setTimeout(function () { router.push("/register") }, 800)
          } else {
            toast.error("Registrations are currently closed.")
            setLoading(false)
          }
          return
        }

        toast.error(data.error || "Login failed")
        setLoading(false)
      })
      .catch(function () { toast.error("Something went wrong"); setLoading(false) })
  }

  return (
    <div className="ps-page">
      <AnimatedBackground />
      <Toaster position="top-center" toastOptions={{ style: { background: "#1a1a1a", color: "#fff", border: "1px solid rgba(255,60,30,0.2)" } }} />

      <style jsx>{`
        .lg-wrapper { position:relative; z-index:10; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:20px; }
        .lg-card { width:100%; max-width:420px; padding:40px 32px; border-radius:22px; border:1px solid rgba(255,60,30,0.12); background:linear-gradient(165deg,rgba(35,12,8,0.7),rgba(18,6,4,0.85)); backdrop-filter:blur(15px); opacity:0; animation:psFadeIn 0.7s ease forwards; }

        .lg-logo { display:flex; align-items:center; gap:10px; justify-content:center; margin-bottom:6px; }
        .lg-logo-icon { width:42px;height:42px; border-radius:12px; background:linear-gradient(135deg,#ff3020,#ff6040); display:flex; align-items:center; justify-content:center; font-family:var(--font-display); font-weight:900; font-size:16px; color:#fff; }
        .lg-logo-text { font-family:var(--font-display); font-size:22px; font-weight:800; color:#fff; letter-spacing:2px; text-transform:uppercase; }
        .lg-subtitle { text-align:center; font-size:13px; color:rgba(255,255,255,0.3); margin-bottom:28px; }

        .lg-form { display:flex; flex-direction:column; gap:14px; }
        .lg-pw-wrap { position:relative; }
        .lg-pw-toggle { position:absolute; right:14px; top:50%; transform:translateY(-50%); background:transparent; border:none; color:rgba(255,255,255,0.3); font-size:12px; cursor:pointer; font-family:var(--font-display); letter-spacing:1px; }
        .lg-pw-toggle:hover { color:var(--accent-orange); }

        .lg-link { text-align:center; font-size:12px; color:rgba(255,255,255,0.3); margin-top:16px; }
        .lg-link a { color:var(--accent-orange); text-decoration:none; font-family:var(--font-display); letter-spacing:1px; }
        .lg-link a:hover { text-decoration:underline; }

        /* Blocked card */
        .lg-blocked { padding:24px; border-radius:16px; border:1px solid rgba(255,50,50,0.2); background:rgba(255,50,50,0.04); text-align:center; }
        .lg-blocked-icon { font-size:40px; margin-bottom:12px; display:block; }
        .lg-blocked-title { font-family:var(--font-display); font-size:18px; font-weight:700; color:#ff5555; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:8px; }
        .lg-blocked-msg { font-size:13px; color:rgba(255,255,255,0.4); margin-bottom:16px; line-height:1.6; }
        .lg-blocked-info { padding:12px; border-radius:10px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); text-align:left; }
        .lg-blocked-row { display:flex; justify-content:space-between; padding:4px 0; font-size:12px; }
        .lg-blocked-label { color:rgba(255,255,255,0.3); }
        .lg-blocked-value { color:#fff; font-family:var(--font-display); letter-spacing:1px; }

        @media (max-width:500px) {
          .lg-card { padding:28px 20px; }
          .lg-logo-text { font-size:18px; }
        }
      `}</style>

      <div className="lg-wrapper">
        <div className="lg-card">
          <div className="lg-logo">
            <div className="lg-logo-icon">PS</div>
            <div className="lg-logo-text">{EVENT_CONFIG.eventName}</div>
          </div>
          <div className="lg-subtitle">Login to your account</div>

          {/* Blocked Screen */}
          {blockedInfo ? (
            <div className="lg-blocked">
              <span className="lg-blocked-icon">🚫</span>
              <div className="lg-blocked-title">Access Restricted</div>
              <div className="lg-blocked-msg">
                You&apos;re registered as a team member in <strong style={{ color: "#fff" }}>{blockedInfo.teamNumber}</strong>. Only team leads can access the dashboard.
              </div>
              <div className="lg-blocked-info">
                <div className="lg-blocked-row">
                  <span className="lg-blocked-label">Your Name</span>
                  <span className="lg-blocked-value">{blockedInfo.memberName}</span>
                </div>
                <div className="lg-blocked-row">
                  <span className="lg-blocked-label">Team</span>
                  <span className="lg-blocked-value">{blockedInfo.teamNumber}</span>
                </div>
                <div className="lg-blocked-row">
                  <span className="lg-blocked-label">Project</span>
                  <span className="lg-blocked-value">{blockedInfo.projectTitle}</span>
                </div>
                <div className="lg-blocked-row">
                  <span className="lg-blocked-label">Team Lead</span>
                  <span className="lg-blocked-value">{blockedInfo.leaderName}</span>
                </div>
                <div className="lg-blocked-row">
                  <span className="lg-blocked-label">Lead Roll</span>
                  <span className="lg-blocked-value">{blockedInfo.leaderRoll}</span>
                </div>
              </div>
              <button className="ps-btn ps-btn-secondary" style={{ width: "100%", marginTop: 16 }} onClick={function () { setBlockedInfo(null) }}>
                ← Try Different Account
              </button>
            </div>
          ) : (
            <form className="lg-form" onSubmit={handleLogin}>
              <input
                type="text"
                value={rollNumber}
                onChange={function (e) { setRollNumber(e.target.value.toUpperCase()) }}
                placeholder="Roll Number (e.g. 22A31A0501)"
                className="ps-input"
                style={{ width: "100%", textAlign: "center", fontSize: 15, letterSpacing: 2, fontFamily: "var(--font-display)" }}
                autoFocus
              />
              <div className="lg-pw-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={function (e) { setPassword(e.target.value) }}
                  placeholder="Password"
                  className="ps-input"
                  style={{ width: "100%", paddingRight: 60 }}
                />
                <button type="button" className="lg-pw-toggle" onClick={function () { setShowPassword(!showPassword) }}>
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
              <button type="submit" className="ps-btn ps-btn-primary" style={{ width: "100%" }} disabled={loading}>
                {loading ? "Logging in..." : "Login →"}
              </button>
            </form>
          )}

          <div className="lg-link">
            Don&apos;t have an account? <Link href="/register-account">Create Account</Link>
          </div>
        </div>
      </div>
    </div>
  )
}