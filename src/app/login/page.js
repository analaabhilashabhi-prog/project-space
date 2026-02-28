"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import toast, { Toaster } from "react-hot-toast"
import { EVENT_CONFIG } from "@/config/formFields"
import AnimatedBackground from "@/components/AnimatedBackground"

export default function LoginPage() {
  var router = useRouter()
  var [role, setRole] = useState("")
  var [rollNumber, setRollNumber] = useState("")
  var [password, setPassword] = useState("")
  var [confirmPassword, setConfirmPassword] = useState("")
  var [otp, setOtp] = useState("")
  var [loading, setLoading] = useState(false)
  var [showPassword, setShowPassword] = useState(false)
  var [mode, setMode] = useState("login")
  var [setupStep, setSetupStep] = useState("roll")
  var [memberEmail, setMemberEmail] = useState("")
  var [setupSuccess, setSetupSuccess] = useState(null)

  function handleLogin(e) {
    e.preventDefault()
    if (!rollNumber.trim()) { toast.error("Please enter your roll number"); return }
    if (!password) { toast.error("Please enter your password"); return }
    setLoading(true)

    fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rollNumber: rollNumber.trim().toUpperCase(), password: password }),
    })
      .then(function (res) { return res.json() })
      .then(function (data) {
        if (data.status === "no_account") {
          toast.error("No account found. Set your password first!")
          setMode("set-password")
          setSetupStep("roll")
          setPassword("")
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

        if (data.success && data.status === "team_member") {
          toast.success(data.message || "Welcome back!")
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

  function handleCheckRoll(e) {
    e.preventDefault()
    if (!rollNumber.trim()) { toast.error("Please enter your roll number"); return }
    setLoading(true)

    fetch("/api/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "check_roll", rollNumber: rollNumber.trim().toUpperCase() }),
    })
      .then(function (res) { return res.json() })
      .then(function (data) {
        if (data.success) {
          setMemberEmail(data.email || "")
          toast.success("OTP sent to " + (data.email || "your email"))
          setSetupStep("otp")
        } else {
          if (data.status === "not_registered") {
            toast.error("You're not registered in any team yet.")
          } else if (data.status === "already_exists") {
            toast.error("You already have a password. Please login.")
            setMode("login")
            setPassword("")
          } else {
            toast.error(data.error || "Something went wrong")
          }
        }
        setLoading(false)
      })
      .catch(function () { toast.error("Something went wrong"); setLoading(false) })
  }

  function handleVerifyOtp(e) {
    e.preventDefault()
    if (!otp.trim()) { toast.error("Please enter the OTP"); return }
    setLoading(true)

    fetch("/api/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify_otp", rollNumber: rollNumber.trim().toUpperCase(), otp: otp.trim() }),
    })
      .then(function (res) { return res.json() })
      .then(function (data) {
        if (data.success) {
          toast.success("OTP verified!")
          setSetupStep("password")
        } else {
          toast.error(data.error || "Invalid OTP")
        }
        setLoading(false)
      })
      .catch(function () { toast.error("Something went wrong"); setLoading(false) })
  }

  function handleCreatePassword(e) {
    e.preventDefault()
    if (!password) { toast.error("Please enter a password"); return }
    if (password.length < 4) { toast.error("Password must be at least 4 characters"); return }
    if (password !== confirmPassword) { toast.error("Passwords do not match"); return }
    setLoading(true)

    fetch("/api/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_password", rollNumber: rollNumber.trim().toUpperCase(), password: password }),
    })
      .then(function (res) { return res.json() })
      .then(function (data) {
        if (data.success) {
          toast.success("Password set successfully!")
          setSetupSuccess(data)
          setPassword("")
          setConfirmPassword("")
          setOtp("")
        } else {
          toast.error(data.error || "Failed to set password")
        }
        setLoading(false)
      })
      .catch(function () { toast.error("Something went wrong"); setLoading(false) })
  }

  function resetSetup() {
    setMode("login")
    setSetupStep("roll")
    setPassword("")
    setConfirmPassword("")
    setOtp("")
    setMemberEmail("")
    setSetupSuccess(null)
  }

  function getSubtitle() {
    if (!role) return "Select your role to continue"
    if (role === "leader") return mode === "login" ? "Team Leader Login" : "Set up your password"
    if (role === "member") return mode === "login" ? "Team Member Login" : setupStep === "roll" ? "Verify your identity" : setupStep === "otp" ? "Enter OTP sent to your email" : "Create your password"
    return ""
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
        .lg-link a, .lg-link span.lg-link-btn { color:var(--accent-orange); text-decoration:none; font-family:var(--font-display); letter-spacing:1px; cursor:pointer; }
        .lg-link a:hover, .lg-link span.lg-link-btn:hover { text-decoration:underline; }

        .lg-success { padding:24px; border-radius:16px; border:1px solid rgba(68,255,102,0.2); background:rgba(68,255,102,0.04); text-align:center; animation:psFadeIn 0.5s ease forwards; }
        .lg-success-icon { font-size:40px; margin-bottom:12px; display:block; }
        .lg-success-title { font-family:var(--font-display); font-size:18px; font-weight:700; color:#44ff66; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:8px; }
        .lg-success-msg { font-size:13px; color:rgba(255,255,255,0.4); margin-bottom:16px; line-height:1.6; }

        .lg-tab-row { display:flex; gap:4px; margin-bottom:20px; padding:4px; border-radius:12px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); }
        .lg-tab { flex:1; padding:10px 0; text-align:center; border-radius:9px; font-family:var(--font-display); font-size:12px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; cursor:pointer; transition:all 0.3s ease; color:rgba(255,255,255,0.3); border:none; background:transparent; }
        .lg-tab.active { background:linear-gradient(135deg,rgba(255,50,30,0.15),rgba(255,80,40,0.1)); color:#ff6040; border:1px solid rgba(255,60,30,0.2); }
        .lg-tab:hover:not(.active) { color:rgba(255,255,255,0.5); }

        .lg-hint { font-size:11px; color:rgba(255,255,255,0.2); text-align:center; margin-top:4px; }

        .lg-role-row { display:flex; gap:8px; margin-bottom:20px; }
        .lg-role-btn { flex:1; padding:14px 0; text-align:center; border-radius:12px; font-family:var(--font-display); font-size:13px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; cursor:pointer; transition:all 0.3s ease; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.02); color:rgba(255,255,255,0.35); }
        .lg-role-btn:hover { border-color:rgba(255,60,30,0.3); color:rgba(255,255,255,0.6); }
        .lg-role-btn.active { border-color:rgba(255,60,30,0.4); background:linear-gradient(135deg,rgba(255,50,30,0.12),rgba(255,80,40,0.06)); color:#ff6040; box-shadow:0 0 20px rgba(255,50,30,0.1); }
        .lg-role-icon { font-size:22px; display:block; margin-bottom:6px; }

        .lg-not-registered { padding:24px; border-radius:16px; border:1px solid rgba(255,170,0,0.2); background:rgba(255,170,0,0.04); text-align:center; animation:psFadeIn 0.5s ease forwards; }
        .lg-not-registered-icon { font-size:40px; margin-bottom:12px; display:block; }
        .lg-not-registered-title { font-family:var(--font-display); font-size:16px; font-weight:700; color:#ffaa00; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:8px; }
        .lg-not-registered-msg { font-size:13px; color:rgba(255,255,255,0.4); margin-bottom:16px; line-height:1.6; }

        .lg-otp-input { text-align:center; font-size:24px; letter-spacing:12px; font-family:var(--font-display); font-weight:700; }

        .lg-email-hint { text-align:center; font-size:12px; color:rgba(255,255,255,0.25); margin-top:-6px; margin-bottom:4px; }

        .lg-steps { display:flex; align-items:center; justify-content:center; gap:6px; margin-bottom:18px; }
        .lg-step-dot { width:8px; height:8px; border-radius:50%; background:rgba(255,255,255,0.1); transition:all 0.3s ease; }
        .lg-step-dot.active { background:#ff6040; box-shadow:0 0 8px rgba(255,96,64,0.4); }
        .lg-step-dot.done { background:#44ff66; }
        .lg-step-line { width:24px; height:2px; background:rgba(255,255,255,0.06); }

        @media (max-width:500px) {
          .lg-card { padding:28px 20px; }
          .lg-logo-text { font-size:18px; }
          .lg-role-btn { font-size:11px; padding:12px 0; }
        }
      `}</style>

      <div className="lg-wrapper">
        <div className="lg-card">
          <div className="lg-logo">
            <div className="lg-logo-icon">PS</div>
            <div className="lg-logo-text">{EVENT_CONFIG.eventName}</div>
          </div>
          <div className="lg-subtitle">{getSubtitle()}</div>

          {/* Role Selection */}
          <div className="lg-role-row">
            <button className={"lg-role-btn" + (role === "leader" ? " active" : "")} onClick={function () { setRole("leader"); resetSetup(); setRole("leader") }}>
              <span className="lg-role-icon">{"\uD83D\uDC51"}</span>
              Team Leader
            </button>
            <button className={"lg-role-btn" + (role === "member" ? " active" : "")} onClick={function () { setRole("member"); resetSetup(); setRole("member") }}>
              <span className="lg-role-icon">{"\uD83D\uDC65"}</span>
              Team Member
            </button>
          </div>

          {/* ===== TEAM LEADER FLOW ===== */}
          {role === "leader" && (
            <>
              <div className="lg-tab-row">
                <button className={"lg-tab" + (mode === "login" ? " active" : "")} onClick={function () { setMode("login"); setPassword(""); setConfirmPassword("") }}>
                  Login
                </button>
                <button className={"lg-tab" + (mode === "set-password" ? " active" : "")} onClick={function () { setMode("set-password"); setSetupStep("roll"); setPassword(""); setConfirmPassword(""); setOtp(""); setSetupSuccess(null) }}>
                  First Time?
                </button>
              </div>

              {setupSuccess ? (
                <div className="lg-success">
                  <span className="lg-success-icon">{"\u2705"}</span>
                  <div className="lg-success-title">Password Created!</div>
                  <div className="lg-success-msg">
                    You can now login with your roll number and password.
                  </div>
                  <button className="ps-btn ps-btn-primary" style={{ width: "100%" }} onClick={function () { resetSetup(); setRole("leader") }}>
                    {"\u2192"} Go to Login
                  </button>
                </div>
              ) : mode === "login" ? (
                <form className="lg-form" onSubmit={handleLogin}>
                  <input type="text" value={rollNumber} onChange={function (e) { setRollNumber(e.target.value.toUpperCase()) }} placeholder="Roll Number (e.g. 22A31A0501)" className="ps-input" style={{ width: "100%", textAlign: "center", fontSize: 15, letterSpacing: 2, fontFamily: "var(--font-display)" }} autoFocus />
                  <div className="lg-pw-wrap">
                    <input type={showPassword ? "text" : "password"} value={password} onChange={function (e) { setPassword(e.target.value) }} placeholder="Password" className="ps-input" style={{ width: "100%", paddingRight: 60 }} />
                    <button type="button" className="lg-pw-toggle" onClick={function () { setShowPassword(!showPassword) }}>{showPassword ? "HIDE" : "SHOW"}</button>
                  </div>
                  <button type="submit" className="ps-btn ps-btn-primary" style={{ width: "100%" }} disabled={loading}>{loading ? "Logging in..." : "Login \u2192"}</button>
                </form>
              ) : (
                <div className="lg-hint" style={{ marginBottom: 12, marginTop: -8 }}>Create your account via the Register Team page</div>
              )}
            </>
          )}

          {/* ===== TEAM MEMBER FLOW ===== */}
          {role === "member" && (
            <>
              <div className="lg-tab-row">
                <button className={"lg-tab" + (mode === "login" ? " active" : "")} onClick={function () { setMode("login"); setPassword(""); setConfirmPassword(""); setSetupStep("roll"); setSetupSuccess(null) }}>
                  Login
                </button>
                <button className={"lg-tab" + (mode === "set-password" ? " active" : "")} onClick={function () { setMode("set-password"); setSetupStep("roll"); setPassword(""); setConfirmPassword(""); setOtp(""); setSetupSuccess(null) }}>
                  First Time? Set Password
                </button>
              </div>

              {/* PASSWORD SET SUCCESS */}
              {setupSuccess ? (
                <div className="lg-success">
                  <span className="lg-success-icon">{"\u2705"}</span>
                  <div className="lg-success-title">Password Created!</div>
                  <div className="lg-success-msg">
                    Welcome, <strong style={{ color: "#fff" }}>{setupSuccess.memberName}</strong>!
                    {setupSuccess.teamNumber && <> Your team is <strong style={{ color: "#fff" }}>{setupSuccess.teamNumber}</strong>.</>}
                    {" "}You can now login with your roll number and password.
                  </div>
                  <button className="ps-btn ps-btn-primary" style={{ width: "100%" }} onClick={function () { resetSetup(); setRole("member") }}>
                    {"\u2192"} Go to Login
                  </button>
                </div>
              ) : mode === "login" ? (
                /* MEMBER LOGIN FORM */
                <form className="lg-form" onSubmit={handleLogin}>
                  <input type="text" value={rollNumber} onChange={function (e) { setRollNumber(e.target.value.toUpperCase()) }} placeholder="Roll Number (e.g. 22A31A0501)" className="ps-input" style={{ width: "100%", textAlign: "center", fontSize: 15, letterSpacing: 2, fontFamily: "var(--font-display)" }} autoFocus />
                  <div className="lg-pw-wrap">
                    <input type={showPassword ? "text" : "password"} value={password} onChange={function (e) { setPassword(e.target.value) }} placeholder="Password" className="ps-input" style={{ width: "100%", paddingRight: 60 }} />
                    <button type="button" className="lg-pw-toggle" onClick={function () { setShowPassword(!showPassword) }}>{showPassword ? "HIDE" : "SHOW"}</button>
                  </div>
                  <button type="submit" className="ps-btn ps-btn-primary" style={{ width: "100%" }} disabled={loading}>{loading ? "Logging in..." : "Login \u2192"}</button>
                </form>
              ) : (
                /* SET PASSWORD FLOW WITH OTP */
                <>
                  {/* Progress Steps */}
                  <div className="lg-steps">
                    <div className={"lg-step-dot" + (setupStep === "roll" ? " active" : (setupStep === "otp" || setupStep === "password") ? " done" : "")} />
                    <div className="lg-step-line" />
                    <div className={"lg-step-dot" + (setupStep === "otp" ? " active" : setupStep === "password" ? " done" : "")} />
                    <div className="lg-step-line" />
                    <div className={"lg-step-dot" + (setupStep === "password" ? " active" : "")} />
                  </div>

                  {/* Step 1: Enter Roll Number */}
                  {setupStep === "roll" && (
                    <form className="lg-form" onSubmit={handleCheckRoll}>
                      <input type="text" value={rollNumber} onChange={function (e) { setRollNumber(e.target.value.toUpperCase()) }} placeholder="Roll Number (e.g. 22A31A0501)" className="ps-input" style={{ width: "100%", textAlign: "center", fontSize: 15, letterSpacing: 2, fontFamily: "var(--font-display)" }} autoFocus />
                      <div className="lg-hint">Enter your registered roll number</div>
                      <button type="submit" className="ps-btn ps-btn-primary" style={{ width: "100%" }} disabled={loading}>{loading ? "Checking..." : "Send OTP \u2192"}</button>
                    </form>
                  )}

                  {/* Step 2: Enter OTP */}
                  {setupStep === "otp" && (
                    <form className="lg-form" onSubmit={handleVerifyOtp}>
                      <div className="lg-email-hint">OTP sent to {memberEmail}</div>
                      <input type="text" value={otp} onChange={function (e) { setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6)) }} placeholder="000000" className="ps-input lg-otp-input" style={{ width: "100%" }} autoFocus maxLength={6} />
                      <div className="lg-hint">Check your email for the 6-digit code</div>
                      <button type="submit" className="ps-btn ps-btn-primary" style={{ width: "100%" }} disabled={loading}>{loading ? "Verifying..." : "Verify OTP \u2192"}</button>
                      <button type="button" className="ps-btn ps-btn-secondary" style={{ width: "100%", fontSize: 12 }} onClick={function () { setSetupStep("roll"); setOtp("") }}>
                        {"\u2190"} Change Roll Number
                      </button>
                    </form>
                  )}

                  {/* Step 3: Create Password */}
                  {setupStep === "password" && (
                    <form className="lg-form" onSubmit={handleCreatePassword}>
                      <div className="lg-email-hint">Creating password for {rollNumber}</div>
                      <div className="lg-pw-wrap">
                        <input type={showPassword ? "text" : "password"} value={password} onChange={function (e) { setPassword(e.target.value) }} placeholder="Create Password" className="ps-input" style={{ width: "100%", paddingRight: 60 }} autoFocus />
                        <button type="button" className="lg-pw-toggle" onClick={function () { setShowPassword(!showPassword) }}>{showPassword ? "HIDE" : "SHOW"}</button>
                      </div>
                      <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={function (e) { setConfirmPassword(e.target.value) }} placeholder="Confirm Password" className="ps-input" style={{ width: "100%" }} />
                      <button type="submit" className="ps-btn ps-btn-primary" style={{ width: "100%" }} disabled={loading}>{loading ? "Setting up..." : "Set Password \u2192"}</button>
                    </form>
                  )}
                </>
              )}
            </>
          )}

          {/* No role selected message */}
          {!role && (
            <div style={{ textAlign: "center", padding: "20px 0", color: "rgba(255,255,255,0.2)", fontSize: 13 }}>
              Select Team Leader or Team Member above to continue
            </div>
          )}

          <div className="lg-link">
            Don&apos;t have a team? <Link href="/register-account">Register Team</Link>
          </div>
        </div>
      </div>
    </div>
  )
}