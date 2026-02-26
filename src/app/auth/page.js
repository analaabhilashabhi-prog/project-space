"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import toast, { Toaster } from "react-hot-toast"
import AnimatedBackground from "@/components/AnimatedBackground"
import { EVENT_CONFIG } from "@/config/formFields"

export default function AuthPage() {
  const router = useRouter()
  const [step, setStep] = useState("roll")
  const [rollNumber, setRollNumber] = useState("")
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [resendTimer, setResendTimer] = useState(0)
  const [blockedInfo, setBlockedInfo] = useState(null)

  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => setResendTimer((t) => t - 1), 1000)
      return () => clearInterval(interval)
    }
  }, [resendTimer])

  const handleSendOTP = async (e) => {
    if (e) e.preventDefault()
    if (!rollNumber.trim()) {
      toast.error("Please enter your roll number")
      return
    }
    setLoading(true)
    setBlockedInfo(null)

    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollNumber: rollNumber.trim().toUpperCase() }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Failed to send OTP")
        return
      }

      setEmail(data.email || "")
      setStep("otp")
      setResendTimer(60)
      toast.success("OTP sent successfully!")

      if (data.devOtp) {
        toast(`Dev OTP: ${data.devOtp}`, { icon: "🔑", duration: 10000 })
      }
    } catch (err) {
      toast.error("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e) => {
    if (e) e.preventDefault()
    if (!otp.trim()) {
      toast.error("Please enter the OTP")
      return
    }
    setLoading(true)

    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollNumber: rollNumber.trim().toUpperCase(), otp: otp.trim() }),
      })
      const data = await res.json()

      if (data.status === "team_lead") {
        toast.success("Welcome back, Team Lead!")
        router.push(`/team-info/${data.teamNumber}`)
      } else if (data.status === "team_member") {
        setBlockedInfo(data)
        setStep("blocked")
      } else if (data.status === "new_user") {
        if (data.registrationOpen) {
          toast.success("OTP verified! Redirecting to registration...")
          router.push(`/register?roll=${rollNumber.trim().toUpperCase()}`)
        } else {
          toast.error("Registrations are currently closed.")
        }
      } else if (!res.ok) {
        toast.error(data.error || "Invalid OTP")
      }
    } catch (err) {
      toast.error("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ps-page">
      <AnimatedBackground />
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: "#1a1a1a", color: "#fff", border: "1px solid rgba(255,60,30,0.2)", fontFamily: "var(--font-body)" },
        }}
      />

      <style jsx>{`
        .auth-wrapper { position:relative; z-index:10; min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px 20px; }

        .auth-logo { font-family:var(--font-display); font-weight:900; font-size:42px; text-transform:uppercase; letter-spacing:4px; line-height:1; background:linear-gradient(180deg,#ffffff 0%,#fff0e8 15%,#ffd6bc 30%,#ffb088 45%,#ff8850 58%,#ff6535 72%,#ff4520 85%,#ff3020 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; text-align:center; margin-bottom:6px; opacity:0; animation:psTitleIn 1s cubic-bezier(0.4,0,0.2,1) forwards; }
        .auth-logo .italic { font-style:italic; }
        .auth-tagline { font-family:var(--font-display); font-size:14px; font-weight:500; letter-spacing:3px; text-transform:uppercase; color:rgba(255,255,255,0.35); text-align:center; margin-bottom:40px; opacity:0; animation:psSubIn 0.8s ease 0.3s forwards; }

        .auth-card { width:100%; max-width:420px; padding:36px 32px; border-radius:20px; border:1px solid rgba(255,60,30,0.12); background:linear-gradient(165deg,rgba(35,12,8,0.75),rgba(18,6,4,0.9)); backdrop-filter:blur(20px); position:relative; overflow:hidden; opacity:0; animation:psFadeIn 0.8s ease 0.5s forwards; }
        .auth-card::before { content:''; position:absolute; top:0;left:0;right:0; height:2px; background:linear-gradient(90deg,#ff4020,#ff8040,#ffaa40); }
        .auth-card::after { content:''; position:absolute; top:-50%;left:-50%; width:200%;height:200%; background:radial-gradient(circle at 50% 0%,rgba(255,60,30,0.08),transparent 50%); pointer-events:none; }

        .auth-step-label { font-family:var(--font-display); font-size:11px; font-weight:600; color:var(--accent-light); text-transform:uppercase; letter-spacing:3px; margin-bottom:6px; position:relative; z-index:1; }
        .auth-title { font-family:var(--font-display); font-size:28px; font-weight:800; color:#fff; text-transform:uppercase; letter-spacing:2px; margin-bottom:6px; position:relative; z-index:1; }
        .auth-desc { font-size:13px; color:rgba(255,255,255,0.4); margin-bottom:28px; line-height:1.6; position:relative; z-index:1; }

        .auth-form { position:relative; z-index:1; }
        .auth-field { margin-bottom:20px; }
        .auth-input-wrap { position:relative; }
        .auth-input-wrap .ps-input { padding-right:50px; }
        .auth-input-icon { position:absolute; right:16px; top:50%; transform:translateY(-50%); color:rgba(255,255,255,0.2); font-size:18px; }

        .auth-email-hint { display:flex; align-items:center; gap:6px; font-size:11px; color:rgba(255,255,255,0.3); margin-top:8px; font-family:var(--font-display); letter-spacing:1px; text-transform:uppercase; }
        .auth-email-hint .dot { width:5px;height:5px;border-radius:50%;background:var(--accent-orange);opacity:0.5; }

        .auth-resend { display:flex; align-items:center; justify-content:space-between; margin-top:10px; }
        .auth-resend-btn { background:none; border:none; color:var(--accent-orange); font-family:var(--font-display); font-size:12px; font-weight:600; letter-spacing:2px; text-transform:uppercase; cursor:pointer; padding:4px 0; transition:opacity 0.3s ease; }
        .auth-resend-btn:disabled { color:rgba(255,255,255,0.2); cursor:not-allowed; }
        .auth-timer { font-family:var(--font-display); font-size:12px; color:rgba(255,255,255,0.3); letter-spacing:1px; }

        .auth-submit { width:100%; margin-top:8px; }

        .auth-back { display:flex; align-items:center; gap:6px; background:none; border:none; color:rgba(255,255,255,0.3); font-family:var(--font-display); font-size:12px; letter-spacing:2px; text-transform:uppercase; cursor:pointer; padding:0; margin-bottom:20px; transition:color 0.3s ease; position:relative; z-index:1; }
        .auth-back:hover { color:var(--accent-orange); }

        .auth-footer { text-align:center; margin-top:24px; position:relative; z-index:1; }
        .auth-footer-text { font-size:12px; color:rgba(255,255,255,0.25); }
        .auth-footer-link { color:var(--accent-orange); cursor:pointer; font-weight:600; background:none; border:none; font-size:12px; font-family:var(--font-body); transition:opacity 0.3s; }
        .auth-footer-link:hover { opacity:0.7; }

        .blocked-icon { width:64px;height:64px; border-radius:50%; background:rgba(255,60,30,0.1); border:1.5px solid rgba(255,60,30,0.2); display:flex; align-items:center; justify-content:center; margin:0 auto 20px; font-size:28px; }
        .blocked-team { display:flex; align-items:center; gap:8px; padding:10px 16px; border-radius:10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); margin:12px 0; }
        .blocked-team-num { font-family:var(--font-display); font-size:18px; font-weight:700; color:var(--accent-orange); letter-spacing:2px; }
        .blocked-team-name { font-size:13px; color:rgba(255,255,255,0.5); }
        .blocked-info-row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.04); }
        .blocked-info-label { font-size:12px; color:rgba(255,255,255,0.3); font-family:var(--font-display); letter-spacing:1px; text-transform:uppercase; }
        .blocked-info-value { font-size:13px; color:rgba(255,255,255,0.7); }

        .auth-home-link { display:inline-flex; align-items:center; gap:6px; color:rgba(255,255,255,0.3); font-family:var(--font-display); font-size:12px; letter-spacing:2px; text-transform:uppercase; text-decoration:none; margin-top:24px; transition:color 0.3s ease; position:relative; z-index:1; }
        .auth-home-link:hover { color:var(--accent-orange); }
      `}</style>

      <div className="auth-wrapper">
        <div className="auth-logo">
          <span className="italic">Project</span> Space
        </div>
        <div className="auth-tagline">Team Lead Portal</div>

        <div className="auth-card">
          {/* ===== STEP 1: ROLL NUMBER ===== */}
          {step === "roll" && (
            <form className="auth-form" onSubmit={handleSendOTP}>
              <div className="auth-step-label">Step 1 of 2</div>
              <div className="auth-title">Login</div>
              <div className="auth-desc">
                Enter your roll number to receive a one-time password on your registered email.
              </div>

              <div className="auth-field">
                <label className="ps-label">Roll Number</label>
                <div className="auth-input-wrap">
                  <input
                    className="ps-input"
                    type="text"
                    placeholder="e.g. 22A31A0501"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                    autoFocus
                    disabled={loading}
                  />
                  <span className="auth-input-icon">🎓</span>
                </div>
              </div>

              <button className="ps-btn ps-btn-primary auth-submit" type="submit" disabled={loading}>
                {loading ? <><span className="ps-spinner" /> Sending...</> : "Send OTP →"}
              </button>

              <div className="auth-footer">
                <div className="auth-footer-text">
                  Don&apos;t have a team?{" "}
                  <button className="auth-footer-link" onClick={() => router.push("/register")} type="button">
                    Register Now
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ===== STEP 2: OTP VERIFICATION ===== */}
          {step === "otp" && (
            <form className="auth-form" onSubmit={handleVerifyOTP}>
              <button className="auth-back" onClick={() => { setStep("roll"); setOtp("") }} type="button">
                ← Back
              </button>

              <div className="auth-step-label">Step 2 of 2</div>
              <div className="auth-title">Verify OTP</div>
              <div className="auth-desc">
                Enter the 6-digit code sent to your email.
              </div>

              {email && (
                <div className="auth-email-hint">
                  <span className="dot" />
                  <span>Sent to {email}</span>
                </div>
              )}

              <div className="auth-field" style={{ marginTop: "16px" }}>
                <label className="ps-label">OTP Code</label>
                <div className="auth-input-wrap">
                  <input
                    className="ps-input"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    autoFocus
                    maxLength={6}
                    disabled={loading}
                    style={{ letterSpacing: "8px", fontSize: "20px", textAlign: "center", fontFamily: "var(--font-display)", fontWeight: 700 }}
                  />
                  <span className="auth-input-icon">🔐</span>
                </div>
              </div>

              <div className="auth-resend">
                <button
                  className="auth-resend-btn"
                  type="button"
                  disabled={resendTimer > 0 || loading}
                  onClick={handleSendOTP}
                >
                  Resend OTP
                </button>
                {resendTimer > 0 && (
                  <span className="auth-timer">{resendTimer}s</span>
                )}
              </div>

              <button className="ps-btn ps-btn-primary auth-submit" type="submit" disabled={loading} style={{ marginTop: "16px" }}>
                {loading ? <><span className="ps-spinner" /> Verifying...</> : "Verify & Login →"}
              </button>
            </form>
          )}

          {/* ===== BLOCKED: TEAM MEMBER ===== */}
          {step === "blocked" && blockedInfo && (
            <div style={{ position: "relative", zIndex: 1 }}>
              <button className="auth-back" onClick={() => { setStep("roll"); setOtp(""); setBlockedInfo(null) }}>
                ← Back
              </button>

              <div className="blocked-icon">🔒</div>

              <div className="auth-title" style={{ textAlign: "center", fontSize: "22px", marginBottom: "8px" }}>
                Already Registered
              </div>
              <div className="auth-desc" style={{ textAlign: "center", marginBottom: "20px" }}>
                You are a team member. Only team leads can login to the portal.
              </div>

              <div className="blocked-team">
                <div className="blocked-team-num">{blockedInfo.teamNumber}</div>
                <div className="blocked-team-name">{blockedInfo.projectTitle}</div>
              </div>

              <div style={{ marginTop: "16px" }}>
                <div className="blocked-info-row">
                  <span className="blocked-info-label">Your Name</span>
                  <span className="blocked-info-value">{blockedInfo.memberName}</span>
                </div>
                <div className="blocked-info-row">
                  <span className="blocked-info-label">Team Lead</span>
                  <span className="blocked-info-value">{blockedInfo.leaderName}</span>
                </div>
                <div className="blocked-info-row">
                  <span className="blocked-info-label">Lead Roll No</span>
                  <span className="blocked-info-value">{blockedInfo.leaderRoll}</span>
                </div>
              </div>

              <div className="auth-desc" style={{ textAlign: "center", marginTop: "20px", marginBottom: "0" }}>
                Please ask <strong style={{ color: "var(--accent-orange)" }}>{blockedInfo.leaderName}</strong> to login for any changes.
              </div>
            </div>
          )}
        </div>

        <a className="auth-home-link" href="/">
          ← Back to Home
        </a>
      </div>
    </div>
  )
}