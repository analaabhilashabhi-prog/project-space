"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import toast, { Toaster } from "react-hot-toast"

export default function MentorLoginPage() {
  var router = useRouter()
  var [step, setStep] = useState("email") // email → otp → password → done
  var [email, setEmail] = useState("")
  var [otp, setOtp] = useState("")
  var [password, setPassword] = useState("")
  var [confirmPassword, setConfirmPassword] = useState("")
  var [loginPassword, setLoginPassword] = useState("")
  var [loading, setLoading] = useState(false)
  var [isFirstTime, setIsFirstTime] = useState(false)
  var [mentorName, setMentorName] = useState("")
  var [devOtp, setDevOtp] = useState("")
  var [resendTimer, setResendTimer] = useState(0)
  var [showPw, setShowPw] = useState(false)

  function startResendTimer() {
    setResendTimer(60)
    var t = setInterval(function () {
      setResendTimer(function (v) {
        if (v <= 1) { clearInterval(t); return 0 }
        return v - 1
      })
    }, 1000)
  }

  function handleSendOTP(e) {
    if (e) e.preventDefault()
    if (!email.trim()) { toast.error("Enter your email"); return }
    setLoading(true)
    fetch("/api/mentor-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send_otp", email: email.trim().toLowerCase() }),
    })
      .then(function (r) { return r.json() })
      .then(function (data) {
        if (data.success) {
          setIsFirstTime(data.isFirstTime)
          setMentorName(data.mentorName || "")
          if (data.devOtp) setDevOtp(data.devOtp)
          setStep("otp")
          startResendTimer()
          toast.success("OTP sent!")
        } else {
          toast.error(data.error || "Failed to send OTP")
        }
        setLoading(false)
      })
      .catch(function () { toast.error("Something went wrong"); setLoading(false) })
  }

  function handleVerifyOTP(e) {
    if (e) e.preventDefault()
    if (!otp.trim() || otp.length !== 6) { toast.error("Enter 6-digit OTP"); return }
    setLoading(true)
    fetch("/api/mentor-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify_otp", email: email.trim().toLowerCase(), otp: otp.trim() }),
    })
      .then(function (r) { return r.json() })
      .then(function (data) {
        if (data.success) {
          toast.success("OTP verified!")
          if (isFirstTime) { setStep("set_password") }
          else { setStep("login") }
        } else { toast.error(data.error || "Invalid OTP") }
        setLoading(false)
      })
      .catch(function () { toast.error("Something went wrong"); setLoading(false) })
  }

  function handleSetPassword(e) {
    if (e) e.preventDefault()
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return }
    if (password !== confirmPassword) { toast.error("Passwords do not match"); return }
    setLoading(true)
    fetch("/api/mentor-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_password", email: email.trim().toLowerCase(), password: password }),
    })
      .then(function (r) { return r.json() })
      .then(function (data) {
        if (data.success) { toast.success("Password set! Please login."); setStep("login") }
        else { toast.error(data.error || "Failed") }
        setLoading(false)
      })
      .catch(function () { toast.error("Something went wrong"); setLoading(false) })
  }

  function handleLogin(e) {
    if (e) e.preventDefault()
    if (!loginPassword) { toast.error("Enter your password"); return }
    setLoading(true)
    fetch("/api/mentor-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", email: email.trim().toLowerCase(), password: loginPassword }),
    })
      .then(function (r) { return r.json() })
      .then(function (data) {
        if (data.success) {
          sessionStorage.setItem("mentor_id", data.mentor.id)
          sessionStorage.setItem("mentor_name", data.mentor.name)
          sessionStorage.setItem("mentor_email", data.mentor.email)
          sessionStorage.setItem("mentor_technology", data.mentor.technology)
          toast.success("Welcome, " + data.mentor.name + "!")
          setTimeout(function () { router.push("/mentor-dashboard") }, 800)
        } else { toast.error(data.error || "Login failed") }
        setLoading(false)
      })
      .catch(function () { toast.error("Something went wrong"); setLoading(false) })
  }

  return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "var(--font-primary, 'Open Sans', sans-serif)" }}>
      <Toaster position="top-center" toastOptions={{ style: { background: "#1a1a1a", color: "#fff", border: "1px solid rgba(255,60,30,0.3)" } }} />

      <style jsx>{`
        .ml-bg { position:fixed; inset:0; background:url('/space-bg.png') center bottom/cover no-repeat; opacity:0.6; z-index:0; }
        .ml-card { position:relative; z-index:10; width:100%; max-width:420px; padding:52px 36px 40px; border-radius:20px; background:rgba(10,5,3,0.93); backdrop-filter:blur(40px); border:1px solid rgba(255,96,64,0.12); box-shadow:0 8px 60px rgba(0,0,0,0.8); }
        .ml-logo { position:absolute; top:-36px; left:50%; transform:translateX(-50%); width:72px; height:72px; border-radius:20px; background:linear-gradient(145deg,#ff4020,#ff6040); display:flex; align-items:center; justify-content:center; font-weight:900; font-size:22px; color:#fff; box-shadow:0 8px 30px rgba(255,50,30,0.4); }
        .ml-title { text-align:center; font-size:22px; font-weight:800; color:#fff; letter-spacing:2px; margin-bottom:4px; }
        .ml-sub { text-align:center; font-size:12px; color:rgba(255,255,255,0.35); margin-bottom:28px; }
        .ml-badge { text-align:center; font-size:13px; color:#ff6040; font-weight:600; margin-bottom:20px; padding:8px 16px; background:rgba(255,60,30,0.08); border:1px solid rgba(255,60,30,0.15); border-radius:10px; }
        .ml-form { display:flex; flex-direction:column; gap:14px; }
        .ml-input { width:100%; padding:14px 18px; border-radius:10px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.04); color:#fff; font-size:14px; outline:none; transition:all 0.3s; box-sizing:border-box; font-family:inherit; }
        .ml-input:focus { border-color:rgba(255,96,64,0.4); background:rgba(255,255,255,0.06); }
        .ml-input::placeholder { color:rgba(255,255,255,0.2); }
        .ml-btn { width:100%; padding:14px; border:none; border-radius:12px; background:linear-gradient(135deg,#ff3020,#ff6040); color:#fff; font-size:14px; font-weight:700; letter-spacing:2px; text-transform:uppercase; cursor:pointer; transition:all 0.3s; margin-top:4px; box-shadow:0 4px 20px rgba(255,50,30,0.3); font-family:inherit; }
        .ml-btn:hover:not(:disabled) { transform:translateY(-2px); }
        .ml-btn:disabled { opacity:0.4; cursor:not-allowed; }
        .ml-otp-input { width:100%; padding:14px 18px; text-align:center; font-size:28px; letter-spacing:12px; font-weight:700; border-radius:10px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.04); color:#fff; outline:none; transition:all 0.3s; font-family:monospace; }
        .ml-otp-input:focus { border-color:rgba(255,96,64,0.4); }
        .ml-steps { display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:24px; }
        .ml-step { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; transition:all 0.3s; }
        .ml-step.active { background:linear-gradient(135deg,#ff3020,#ff6040); color:#fff; }
        .ml-step.done { background:rgba(255,60,30,0.15); color:#ff6040; border:1px solid rgba(255,60,30,0.3); }
        .ml-step.pending { background:rgba(255,255,255,0.03); color:rgba(255,255,255,0.2); border:1px solid rgba(255,255,255,0.06); }
        .ml-step-line { width:24px; height:2px; background:rgba(255,255,255,0.06); }
        .ml-step-line.done { background:#ff6040; }
        .ml-resend { text-align:center; font-size:12px; }
        .ml-resend-btn { background:none; border:none; color:#ff6040; cursor:pointer; font-family:inherit; font-size:12px; }
        .ml-resend-btn:disabled { color:rgba(255,255,255,0.2); cursor:default; }
        .ml-dev { text-align:center; padding:8px; border-radius:8px; background:rgba(255,170,64,0.08); border:1px solid rgba(255,170,64,0.2); font-size:12px; color:#ffaa40; letter-spacing:2px; }
        .ml-pw-wrap { position:relative; }
        .ml-pw-wrap .ml-input { padding-right:50px; }
        .ml-pw-btn { position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; padding:4px; }
        .ml-hint { font-size:11px; color:rgba(255,255,255,0.2); text-align:center; }
        .ml-back-link { text-align:center; font-size:12px; color:rgba(255,255,255,0.3); margin-top:16px; }
        .ml-back-link a { color:#ff6040; text-decoration:none; }
      `}</style>

      <div className="ml-bg" />

      <div className="ml-card">
        <div className="ml-logo">M</div>
        <div className="ml-title">Mentor Portal</div>
        <div className="ml-sub">Project Space — Mentor Login</div>

        {/* Step indicators */}
        <div className="ml-steps">
          {["email","otp","set_password","login"].map(function (s, i) {
            var stepOrder = { email:0, otp:1, set_password:2, login:3 }
            var cur = stepOrder[step] || 0
            var idx = i
            var cls = cur > idx ? "done" : cur === idx ? "active" : "pending"
            return [
              <div key={s} className={"ml-step " + cls}>{idx + 1}</div>,
              i < 3 ? <div key={s+"l"} className={"ml-step-line " + (cur > idx ? "done" : "")} /> : null
            ]
          })}
        </div>

        {mentorName && step !== "email" && (
          <div className="ml-badge">👋 Welcome, {mentorName}</div>
        )}

        {/* STEP: Email */}
        {step === "email" && (
          <form className="ml-form" onSubmit={handleSendOTP}>
            <input type="email" className="ml-input" placeholder="mentor@adityauniversity.in" value={email} onChange={function (e) { setEmail(e.target.value) }} autoFocus />
            <div className="ml-hint">Enter your registered mentor email</div>
            <button type="submit" className="ml-btn" disabled={loading}>{loading ? "Sending..." : "Send OTP →"}</button>
          </form>
        )}

        {/* STEP: OTP */}
        {step === "otp" && (
          <form className="ml-form" onSubmit={handleVerifyOTP}>
            <input type="text" className="ml-otp-input" placeholder="000000" value={otp} onChange={function (e) { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)) }} maxLength={6} autoFocus />
            {devOtp && <div className="ml-dev">DEV OTP: {devOtp}</div>}
            <button type="submit" className="ml-btn" disabled={loading}>{loading ? "Verifying..." : "Verify OTP →"}</button>
            <div className="ml-resend">
              <button type="button" className="ml-resend-btn" disabled={resendTimer > 0} onClick={function () { handleSendOTP() }}>
                {resendTimer > 0 ? "Resend in " + resendTimer + "s" : "Resend OTP"}
              </button>
            </div>
          </form>
        )}

        {/* STEP: Set Password (first time) */}
        {step === "set_password" && (
          <form className="ml-form" onSubmit={handleSetPassword}>
            <div className="ml-hint" style={{ marginBottom: 4 }}>Create your mentor account password</div>
            <div className="ml-pw-wrap">
              <input type={showPw ? "text" : "password"} className="ml-input" placeholder="Create password (min 6 chars)" value={password} onChange={function (e) { setPassword(e.target.value) }} autoFocus />
              <button type="button" className="ml-pw-btn" onClick={function () { setShowPw(!showPw) }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={showPw ? "#ff6040" : "rgba(255,255,255,0.2)"} strokeWidth="1.5"><path d="M1 12S5 5 12 5s11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
            <input type={showPw ? "text" : "password"} className="ml-input" placeholder="Confirm password" value={confirmPassword} onChange={function (e) { setConfirmPassword(e.target.value) }} />
            <button type="submit" className="ml-btn" disabled={loading}>{loading ? "Setting..." : "Set Password →"}</button>
          </form>
        )}

        {/* STEP: Login with password */}
        {step === "login" && (
          <form className="ml-form" onSubmit={handleLogin}>
            <div className="ml-hint" style={{ marginBottom: 4 }}>Enter your password to login</div>
            <div className="ml-pw-wrap">
              <input type={showPw ? "text" : "password"} className="ml-input" placeholder="Password" value={loginPassword} onChange={function (e) { setLoginPassword(e.target.value) }} autoFocus />
              <button type="button" className="ml-pw-btn" onClick={function () { setShowPw(!showPw) }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={showPw ? "#ff6040" : "rgba(255,255,255,0.2)"} strokeWidth="1.5"><path d="M1 12S5 5 12 5s11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
            <button type="submit" className="ml-btn" disabled={loading}>{loading ? "Logging in..." : "Login →"}</button>
            <div className="ml-resend" style={{ marginTop: 4 }}>
              <button type="button" className="ml-resend-btn" onClick={function () { setStep("email"); setOtp(""); setLoginPassword("") }}>← Change email / Forgot password?</button>
            </div>
          </form>
        )}

        <div className="ml-back-link">
          <a href="/">← Back to home</a>
        </div>
      </div>
    </div>
  )
}