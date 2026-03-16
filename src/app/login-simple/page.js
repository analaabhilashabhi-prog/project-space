"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import toast, { Toaster } from "react-hot-toast"
import { EVENT_CONFIG } from "@/config/formFields"

export default function LoginSimplePage() {
  var router = useRouter()
  var [rollNumber, setRollNumber] = useState("")
  var [password, setPassword] = useState("")
  var [loading, setLoading] = useState(false)
  var [showPassword, setShowPassword] = useState(false)

  useEffect(function () {
    var params = new URLSearchParams(window.location.search)
    var roll = params.get("roll")
    if (roll) setRollNumber(roll.toUpperCase().trim())
  }, [])

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
        if (data.success && (data.status === "team_lead" || data.status === "team_member")) {
          toast.success("Welcome back!")
          localStorage.setItem("ps_roll", rollNumber.trim().toUpperCase())
          sessionStorage.setItem("ps_roll", rollNumber.trim().toUpperCase())
          sessionStorage.setItem("ps_team_number", data.teamNumber)
          localStorage.setItem("ps_team_number", data.teamNumber)
          setTimeout(function () { router.push("/team-info/" + data.teamNumber) }, 800)
          return
        }
        if (data.success && data.status === "new_user") {
          toast.success("Login successful! Register your team.")
          localStorage.setItem("ps_roll", rollNumber.trim().toUpperCase())
          sessionStorage.setItem("ps_roll", rollNumber.trim().toUpperCase())
          setTimeout(function () { router.push("/register") }, 800)
          return
        }
        toast.error(data.error || "Login failed")
        setLoading(false)
      })
      .catch(function () { toast.error("Something went wrong"); setLoading(false) })
  }

  return (
    <div className="sl-page">
      <Toaster position="top-center" toastOptions={{ style: { background: "#1a1a1a", color: "#fff", border: "1px solid rgba(255,60,30,0.3)" } }} />

      <style jsx>{`
        .sl-page { min-height:100vh; background:#000; display:flex; align-items:center; justify-content:center; padding:20px; font-family:'DM Sans',sans-serif; position:relative; }
        .sl-bg { position:fixed; inset:0; background:url('/space-bg.png') center bottom/cover no-repeat; opacity:0.7; z-index:0; }
        .sl-wrap { position:relative; z-index:10; width:100%; max-width:420px; }
        .sl-card { padding:52px 36px 40px; border-radius:20px; background:rgba(10,5,3,0.92); backdrop-filter:blur(40px); border:1px solid rgba(255,96,64,0.1); box-shadow:0 8px 60px rgba(0,0,0,0.7); position:relative; }
        .sl-logo { position:absolute; top:-36px; left:50%; transform:translateX(-50%); width:72px; height:72px; border-radius:20px; background:linear-gradient(145deg,#ff4020,#ff6040); display:flex; align-items:center; justify-content:center; font-family:'DM Sans',sans-serif; font-weight:900; font-size:26px; color:#fff; box-shadow:0 8px 30px rgba(255,50,30,0.4); }
        .sl-title { text-align:center; font-family:'DM Sans',sans-serif; font-size:22px; font-weight:800; color:#fff; letter-spacing:2px; margin-bottom:4px; }
        .sl-sub { text-align:center; font-size:12px; color:rgba(255,255,255,0.3); margin-bottom:28px; }
        .sl-form { display:flex; flex-direction:column; gap:16px; }
        .sl-input { width:100%; padding:14px 18px; border-radius:10px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.04); color:#fff; font-size:14px; font-family:'DM Sans',sans-serif; outline:none; transition:all 0.3s; box-sizing:border-box; }
        .sl-input:focus { border-color:rgba(255,96,64,0.4); background:rgba(255,255,255,0.06); }
        .sl-input::placeholder { color:rgba(255,255,255,0.2); }
        .sl-pw { position:relative; }
        .sl-pw .sl-input { padding-right:50px; }
        .sl-pw-btn { position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; padding:4px; }
        .sl-btn { width:100%; padding:14px; border:none; border-radius:12px; background:linear-gradient(135deg,#ff3020,#ff6040); color:#fff; font-size:14px; font-weight:700; font-family:'DM Sans',sans-serif; letter-spacing:2px; text-transform:uppercase; cursor:pointer; transition:all 0.3s; margin-top:8px; box-shadow:0 4px 20px rgba(255,50,30,0.3); }
        .sl-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 6px 30px rgba(255,50,30,0.45); }
        .sl-btn:disabled { opacity:0.4; cursor:not-allowed; }
        .sl-back { position:fixed; top:24px; left:24px; z-index:99; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:10px 16px; display:flex; align-items:center; gap:6px; text-decoration:none; color:rgba(255,255,255,0.4); font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600; letter-spacing:1px; text-transform:uppercase; backdrop-filter:blur(10px); cursor:pointer; transition:all 0.3s; }
        .sl-back:hover { color:#ff6040; border-color:rgba(255,96,64,0.3); }
        .sl-link { text-align:center; font-size:12px; color:rgba(255,255,255,0.2); margin-top:18px; }
        .sl-link a { color:#ff6040; text-decoration:none; }
      `}</style>

      <div className="sl-bg" />

      <button className="sl-back" onClick={function () { router.push("/") }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 12H5M5 12L11 6M5 12L11 18"/></svg>
        Back
      </button>

      <div className="sl-wrap" style={{ position:"relative", zIndex:10, width:"100%", maxWidth:420, padding:"0 20px" }}>
        <div className="sl-card">
          <div className="sl-logo">PS</div>
          <div className="sl-title">{EVENT_CONFIG ? EVENT_CONFIG.eventName : "Project Space"}</div>
          <div className="sl-sub">Account created — log in to continue</div>
          <form className="sl-form" onSubmit={handleLogin}>
            <input
              type="text"
              className="sl-input"
              placeholder="Roll Number (e.g. 22A31A0501)"
              value={rollNumber}
              onChange={function (e) { setRollNumber(e.target.value.toUpperCase()) }}
              autoFocus
            />
            <div className="sl-pw">
              <input
                type={showPassword ? "text" : "password"}
                className="sl-input"
                placeholder="Password"
                value={password}
                onChange={function (e) { setPassword(e.target.value) }}
              />
              <button type="button" className="sl-pw-btn" onClick={function () { setShowPassword(!showPassword) }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={showPassword ? "#ff6040" : "rgba(255,255,255,0.2)"} strokeWidth="1.5">
                  <path d="M1 12S5 5 12 5s11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
            <button type="submit" className="sl-btn" disabled={loading}>
              {loading ? "Logging in..." : "Log In →"}
            </button>
          </form>
          <div className="sl-link">
            <a href="/login">← Back to full login page</a>
          </div>
        </div>
      </div>
    </div>
  )
}