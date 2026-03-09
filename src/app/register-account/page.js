"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import toast, { Toaster } from "react-hot-toast"
import { EVENT_CONFIG } from "@/config/formFields"
import AnimatedBackground from "@/components/AnimatedBackground"

export default function RegisterAccountPage() {
  const router = useRouter()
  const [step, setStep] = useState("roll")
  const [rollNumber, setRollNumber] = useState("")
  const [otp, setOtp] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [resendTimer, setResendTimer] = useState(0)
  const [devOtp, setDevOtp] = useState("")

  useEffect(function () {
    if (resendTimer > 0) {
      var interval = setInterval(function () {
        setResendTimer(function (t) { return t - 1 })
      }, 1000)
      return function () { clearInterval(interval) }
    }
  }, [resendTimer])

  // Password requirements
  var hasLength = password.length >= 8
  var hasUpper = /[A-Z]/.test(password)
  var hasLower = /[a-z]/.test(password)
  var hasNumber = /[0-9]/.test(password)
  var hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  var passwordsMatch = password === confirmPassword && password.length > 0
  var allValid = hasLength && hasUpper && hasLower && hasNumber && hasSpecial && passwordsMatch

  function handleSendOTP(e) {
    if (e) e.preventDefault()
    if (!rollNumber.trim()) { toast.error("Please enter your roll number"); return }
    setLoading(true)

    fetch("/api/register-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send_otp", rollNumber: rollNumber.trim().toUpperCase() }),
    })
      .then(function (res) { return res.json() })
      .then(function (data) {
        if (data.success) {
          setEmail(data.email)
          if (data.devOtp) setDevOtp(data.devOtp)
          setStep("otp")
          setResendTimer(60)
          toast.success("OTP sent to " + data.email)
        } else if (data.status === "already_exists") {
          toast.error("Account already exists! Please login instead.")
        } else {
          toast.error(data.error || "Failed to send OTP")
        }
        setLoading(false)
      })
      .catch(function () { toast.error("Something went wrong"); setLoading(false) })
  }

  function handleVerifyOTP(e) {
    if (e) e.preventDefault()
    if (!otp.trim() || otp.length !== 6) { toast.error("Please enter 6-digit OTP"); return }
    setLoading(true)

    fetch("/api/register-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify_otp", rollNumber: rollNumber.trim().toUpperCase(), otp: otp.trim() }),
    })
      .then(function (res) { return res.json() })
      .then(function (data) {
        if (data.success) {
          setStep("password")
          toast.success("OTP verified! Create your password.")
        } else {
          toast.error(data.error || "Invalid OTP")
        }
        setLoading(false)
      })
      .catch(function () { toast.error("Something went wrong"); setLoading(false) })
  }

  function handleCreatePassword(e) {
    if (e) e.preventDefault()
    if (!allValid) { toast.error("Please meet all password requirements"); return }
    setLoading(true)

    fetch("/api/register-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_password", rollNumber: rollNumber.trim().toUpperCase(), password: password }),
    })
      .then(function (res) { return res.json() })
      .then(function (data) {
        if (data.success) {
          toast.success("Account created! Redirecting to login...")
          setTimeout(function () { router.push("/login") }, 1500)
        } else {
          toast.error(data.error || "Failed to create account")
        }
        setLoading(false)
      })
      .catch(function () { toast.error("Something went wrong"); setLoading(false) })
  }

  return (
    <div className="ps-page">
      <AnimatedBackground />
      <Toaster position="top-center" toastOptions={{ style: { background: "#1a1a1a", color: "#fff", border: "1px solid rgba(255,60,30,0.2)" } }} />

      <style jsx>{`
        .ra-wrapper { position:relative; z-index:10; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:20px; }
        .ra-card { width:100%; max-width:440px; padding:40px 32px; border-radius:22px; border:1px solid rgba(255,60,30,0.12); background:linear-gradient(165deg,rgba(35,12,8,0.7),rgba(18,6,4,0.85)); backdrop-filter:blur(15px); opacity:0; animation:psFadeIn 0.7s ease forwards; position:relative; }

        .ra-back { position:absolute; top:16px; left:16px; width:36px; height:36px; border-radius:10px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.03); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 0.3s; color:rgba(255,255,255,0.4); z-index:10; }
        .ra-back:hover { border-color:rgba(255,96,64,0.3); color:#ff6040; background:rgba(255,96,64,0.06); }

        .ra-logo { display:flex; align-items:center; gap:10px; justify-content:center; margin-bottom:6px; }
        .ra-logo-icon { width:42px;height:42px; border-radius:12px; background:linear-gradient(135deg,#ff3020,#ff6040); display:flex; align-items:center; justify-content:center; font-family:'DM Sans',sans-serif; font-weight:900; font-size:16px; color:#fff; }
        .ra-logo-text { font-family:'DM Sans',sans-serif; font-size:22px; font-weight:800; color:#fff; letter-spacing:2px; text-transform:uppercase; }
        .ra-subtitle { text-align:center; font-family:'DM Sans',sans-serif; font-size:13px; color:#BEBEBE; margin-bottom:28px; }

        /* Steps indicator */
        .ra-steps { display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:28px; }
        .ra-step { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:700; transition:all 0.3s ease; }
        .ra-step.active { background:linear-gradient(135deg,#ff3020,#ff6040); color:#fff; box-shadow:0 0 20px rgba(255,50,30,0.3); }
        .ra-step.done { background:rgba(255,60,30,0.15); color:#ff6040; border:1px solid rgba(255,60,30,0.3); }
        .ra-step.pending { background:rgba(255,255,255,0.03); color:rgba(255,255,255,0.2); border:1px solid rgba(255,255,255,0.06); }
        .ra-step-line { width:30px; height:2px; border-radius:1px; }
        .ra-step-line.done { background:#ff6040; }
        .ra-step-line.pending { background:rgba(255,255,255,0.06); }

        .ra-step-label { text-align:center; font-family:'DM Sans',sans-serif; font-size:12px; color:#ff6040; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:20px; }

        .ra-form { display:flex; flex-direction:column; gap:14px; }
        .ra-email-hint { text-align:center; font-family:'DM Sans',sans-serif; font-size:12px; color:#BEBEBE; margin-top:-6px; }
        .ra-email-badge { display:inline-block; padding:2px 10px; border-radius:8px; background:rgba(255,60,30,0.08); border:1px solid rgba(255,60,30,0.15); color:#ff6040; font-size:11px; font-family:'DM Sans',sans-serif; letter-spacing:1px; }

        .ra-resend { text-align:center; margin-top:4px; }
        .ra-resend-btn { background:transparent; border:none; font-size:12px; color:#ff6040; cursor:pointer; font-family:'DM Sans',sans-serif; letter-spacing:1px; }
        .ra-resend-btn:disabled { color:rgba(255,255,255,0.2); cursor:default; }

        .ra-dev-otp { text-align:center; padding:8px; border-radius:10px; background:rgba(255,170,64,0.08); border:1px solid rgba(255,170,64,0.2); font-family:'DM Sans',sans-serif; font-size:12px; color:#ffaa40; letter-spacing:2px; margin-top:4px; }

        /* Password requirements */
        .ra-pw-reqs { display:flex; flex-direction:column; gap:6px; padding:14px; border-radius:12px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); }
        .ra-pw-req { display:flex; align-items:center; gap:8px; font-family:'DM Sans',sans-serif; font-size:12px; transition:color 0.3s; }
        .ra-pw-req.met { color:#ff6040; }
        .ra-pw-req.unmet { color:#BEBEBE; }
        .ra-pw-dot { width:6px; height:6px; border-radius:50%; transition:background 0.3s; }
        .ra-pw-dot.met { background:#ff6040; box-shadow:0 0 6px rgba(255,60,30,0.4); }
        .ra-pw-dot.unmet { background:rgba(255,255,255,0.1); }

        .ra-link { text-align:center; font-family:'DM Sans',sans-serif; font-size:12px; color:#BEBEBE; margin-top:16px; }
        .ra-link a { color:#ff6040; text-decoration:none; font-family:'DM Sans',sans-serif; letter-spacing:1px; }
        .ra-link a:hover { text-decoration:underline; }

        @media (max-width:500px) {
          .ra-card { padding:28px 20px; }
          .ra-logo-text { font-size:18px; }
        }
      `}</style>

      <div className="ra-wrapper">
        <div className="ra-card">
          {/* Back Button */}
          <button className="ra-back" onClick={function () { router.push("/") }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>

          <div className="ra-logo">
            <div className="ra-logo-icon">PS</div>
            <div className="ra-logo-text">{EVENT_CONFIG.eventName}</div>
          </div>
          <div className="ra-subtitle">Create your account</div>

          {/* Step Indicators */}
          <div className="ra-steps">
            <div className={"ra-step " + (step === "roll" ? "active" : "done")}>1</div>
            <div className={"ra-step-line " + (step === "roll" ? "pending" : "done")}></div>
            <div className={"ra-step " + (step === "otp" ? "active" : step === "password" ? "done" : "pending")}>2</div>
            <div className={"ra-step-line " + (step === "password" ? "done" : "pending")}></div>
            <div className={"ra-step " + (step === "password" ? "active" : "pending")}>3</div>
          </div>

          {/* STEP 1: Roll Number */}
          {step === "roll" && (
            <div>
              <div className="ra-step-label">Enter Roll Number</div>
              <form className="ra-form" onSubmit={handleSendOTP}>
                <input
                  type="text"
                  value={rollNumber}
                  onChange={function (e) { setRollNumber(e.target.value.toUpperCase()) }}
                  placeholder="e.g. 22A31A0501"
                  className="ps-input"
                  style={{ width: "100%", textAlign: "center", fontSize: 16, letterSpacing: 2, fontFamily: "'DM Sans',sans-serif" }}
                  autoFocus
                />
                <div className="ra-email-hint">
                  OTP will be sent to <span className="ra-email-badge">{rollNumber ? rollNumber.toLowerCase() + "@outlook.com" : "rollnumber@outlook.com"}</span>
                </div>
                <button type="submit" className="ps-btn ps-btn-primary" style={{ width: "100%" }} disabled={loading}>
                  {loading ? "Sending OTP..." : "Send OTP \u2192"}
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: OTP */}
          {step === "otp" && (
            <div>
              <div className="ra-step-label">Verify OTP</div>
              <div className="ra-email-hint" style={{ marginBottom: 14 }}>
                OTP sent to <span className="ra-email-badge">{email}</span>
              </div>
              <form className="ra-form" onSubmit={handleVerifyOTP}>
                <input
                  type="text"
                  value={otp}
                  onChange={function (e) { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)) }}
                  placeholder="Enter 6-digit OTP"
                  className="ps-input"
                  style={{ width: "100%", textAlign: "center", fontSize: 22, letterSpacing: 8, fontFamily: "'DM Sans',sans-serif" }}
                  maxLength={6}
                  autoFocus
                />
                {devOtp && <div className="ra-dev-otp">DEV OTP: {devOtp}</div>}
                <button type="submit" className="ps-btn ps-btn-primary" style={{ width: "100%" }} disabled={loading}>
                  {loading ? "Verifying..." : "Verify OTP \u2192"}
                </button>
                <div className="ra-resend">
                  <button
                    type="button"
                    className="ra-resend-btn"
                    disabled={resendTimer > 0}
                    onClick={function () { handleSendOTP() }}
                  >
                    {resendTimer > 0 ? "Resend in " + resendTimer + "s" : "Resend OTP"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: Create Password */}
          {step === "password" && (
            <div>
              <div className="ra-step-label">Create Password</div>
              <form className="ra-form" onSubmit={handleCreatePassword}>
                <input
                  type="password"
                  value={password}
                  onChange={function (e) { setPassword(e.target.value) }}
                  placeholder="Create password"
                  className="ps-input"
                  style={{ width: "100%" }}
                  autoFocus
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={function (e) { setConfirmPassword(e.target.value) }}
                  placeholder="Confirm password"
                  className="ps-input"
                  style={{ width: "100%" }}
                />

                {/* Live requirements */}
                <div className="ra-pw-reqs">
                  {[
                    { met: hasLength, label: "At least 8 characters" },
                    { met: hasUpper, label: "One uppercase letter (A-Z)" },
                    { met: hasLower, label: "One lowercase letter (a-z)" },
                    { met: hasNumber, label: "One number (0-9)" },
                    { met: hasSpecial, label: "One special character (!@#$...)" },
                    { met: passwordsMatch, label: "Passwords match" },
                  ].map(function (req, i) {
                    return (
                      <div key={i} className={"ra-pw-req " + (req.met ? "met" : "unmet")}>
                        <div className={"ra-pw-dot " + (req.met ? "met" : "unmet")}></div>
                        {req.met ? "\u2713" : "\u25cb"} {req.label}
                      </div>
                    )
                  })}
                </div>

                <button type="submit" className="ps-btn ps-btn-primary" style={{ width: "100%", opacity: allValid ? 1 : 0.4 }} disabled={loading || !allValid}>
                  {loading ? "Creating Account..." : "Create Account \u2192"}
                </button>
              </form>
            </div>
          )}

          <div className="ra-link">
            Already have an account? <Link href="/login">Login here</Link>
          </div>
        </div>
      </div>
    </div>
  )
}