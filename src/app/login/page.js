"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import toast, { Toaster } from "react-hot-toast"
import { EVENT_CONFIG } from "@/config/formFields"

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

  /* ===== ALL HANDLERS (unchanged) ===== */
  function handleLogin(e) {
    e.preventDefault()
    if (!rollNumber.trim()) { toast.error("Please enter your roll number"); return }
    if (!password) { toast.error("Please enter your password"); return }
    setLoading(true)
    fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rollNumber: rollNumber.trim().toUpperCase(), password: password }) })
      .then(function (res) { return res.json() })
      .then(function (data) {
        if (data.status === "no_account") { toast.error("No account found. Set your password first!"); setMode("set-password"); setSetupStep("roll"); setPassword(""); setLoading(false); return }
        if (data.success && data.status === "team_lead") { toast.success("Welcome back, Team Lead!"); localStorage.setItem("ps_roll", rollNumber.trim().toUpperCase()); sessionStorage.setItem("ps_roll", rollNumber.trim().toUpperCase()); setTimeout(function () { router.push("/team-info/" + data.teamNumber) }, 800); return }
        if (data.success && data.status === "team_member") { toast.success(data.message || "Welcome back!"); localStorage.setItem("ps_roll", rollNumber.trim().toUpperCase()); sessionStorage.setItem("ps_roll", rollNumber.trim().toUpperCase()); setTimeout(function () { router.push("/team-info/" + data.teamNumber) }, 800); return }
        if (data.success && data.status === "new_user") { if (data.registrationOpen) { toast.success("Login successful! Register your team."); localStorage.setItem("ps_roll", rollNumber.trim().toUpperCase()); sessionStorage.setItem("ps_roll", rollNumber.trim().toUpperCase()); setTimeout(function () { router.push("/register") }, 800) } else { toast.error("Registrations are currently closed."); setLoading(false) } return }
        toast.error(data.error || "Login failed"); setLoading(false)
      })
      .catch(function () { toast.error("Something went wrong"); setLoading(false) })
  }
  function handleCheckRoll(e) {
    e.preventDefault()
    if (!rollNumber.trim()) { toast.error("Please enter your roll number"); return }
    setLoading(true)
    fetch("/api/set-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "check_roll", rollNumber: rollNumber.trim().toUpperCase() }) })
      .then(function (res) { return res.json() })
      .then(function (data) {
        if (data.success) { setMemberEmail(data.email || ""); toast.success("OTP sent to " + (data.email || "your email")); setSetupStep("otp") }
        else { if (data.status === "not_registered") { toast.error("You're not registered in any team yet.") } else if (data.status === "already_exists") { toast.error("You already have a password. Please login."); setMode("login"); setPassword("") } else { toast.error(data.error || "Something went wrong") } }
        setLoading(false)
      })
      .catch(function () { toast.error("Something went wrong"); setLoading(false) })
  }
  function handleVerifyOtp(e) {
    e.preventDefault()
    if (!otp.trim()) { toast.error("Please enter the OTP"); return }
    setLoading(true)
    fetch("/api/set-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "verify_otp", rollNumber: rollNumber.trim().toUpperCase(), otp: otp.trim() }) })
      .then(function (res) { return res.json() })
      .then(function (data) { if (data.success) { toast.success("OTP verified!"); setSetupStep("password") } else { toast.error(data.error || "Invalid OTP") } setLoading(false) })
      .catch(function () { toast.error("Something went wrong"); setLoading(false) })
  }
  function handleCreatePassword(e) {
    e.preventDefault()
    if (!password) { toast.error("Please enter a password"); return }
    if (password.length < 4) { toast.error("Password must be at least 4 characters"); return }
    if (password !== confirmPassword) { toast.error("Passwords do not match"); return }
    setLoading(true)
    fetch("/api/set-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create_password", rollNumber: rollNumber.trim().toUpperCase(), password: password }) })
      .then(function (res) { return res.json() })
      .then(function (data) { if (data.success) { toast.success("Password set successfully!"); setSetupSuccess(data); setPassword(""); setConfirmPassword(""); setOtp("") } else { toast.error(data.error || "Failed to set password") } setLoading(false) })
      .catch(function () { toast.error("Something went wrong"); setLoading(false) })
  }
  function resetSetup() { setMode("login"); setSetupStep("roll"); setPassword(""); setConfirmPassword(""); setOtp(""); setMemberEmail(""); setSetupSuccess(null) }
  function getSubtitle() {
    if (!role) return "Select your role to continue"
    if (role === "leader") return "Team Leader Login"
    if (role === "member") return mode === "login" ? "Team Member Login" : setupStep === "roll" ? "Verify your identity" : setupStep === "otp" ? "Enter OTP sent to your email" : "Create your password"
    return ""
  }

  return (
    <div className="nx-page">
      <Toaster position="top-center" toastOptions={{ style: { background: "#1a1a1a", color: "#fff", border: "1px solid rgba(255,60,30,0.3)" } }} />

      <style jsx>{`
        /* ===== FULL SPACE BACKGROUND ===== */
        .nx-page { min-height:100vh; background:#000; position:relative; overflow:hidden; display:flex; align-items:center; justify-content:center; font-family:'DM Sans',sans-serif; }

        /* CSS stars layer - always visible, matches image stars */
        .nx-stars { position:absolute; inset:0; z-index:0; }
        .nx-s { position:absolute; border-radius:50%; background:rgba(255,200,180,0.6); }
        .nx-s::after { content:""; position:absolute; inset:-2px; border-radius:50%; background:rgba(255,140,100,0.15); filter:blur(2px); }
        .nx-s.dim { background:rgba(255,180,160,0.25); }
        .nx-s.dim::after { background:rgba(255,140,100,0.06); }
        .nx-s.twinkle { animation:nxTwinkle 3s ease-in-out infinite; }
        @keyframes nxTwinkle { 0%,100%{opacity:0.3} 50%{opacity:1} }

        /* Shooting stars */
        .nx-shoot { position:absolute; z-index:0; width:80px; height:1px; background:linear-gradient(90deg, rgba(255,160,120,0.7), transparent); border-radius:1px; opacity:0; transform:rotate(-35deg); }
        .nx-shoot::before { content:""; position:absolute; left:0; top:-1px; width:4px; height:3px; border-radius:50%; background:rgba(255,200,170,0.9); box-shadow:0 0 6px rgba(255,150,100,0.6); }
        .nx-shoot.s1 { animation:nxShoot1 8s linear 2s infinite; }
        .nx-shoot.s2 { animation:nxShoot2 11s linear 5s infinite; }
        .nx-shoot.s3 { animation:nxShoot3 14s linear 9s infinite; }

        @keyframes nxShoot1 {
          0% { top:8%; left:-5%; opacity:0; }
          2% { opacity:1; }
          8% { top:28%; left:35%; opacity:0; }
          100% { opacity:0; }
        }
        @keyframes nxShoot2 {
          0% { top:5%; left:40%; opacity:0; }
          1.5% { opacity:0.8; }
          6% { top:22%; left:72%; opacity:0; }
          100% { opacity:0; }
        }
        @keyframes nxShoot3 {
          0% { top:15%; left:60%; opacity:0; }
          1% { opacity:0.6; }
          5% { top:30%; left:88%; opacity:0; }
          100% { opacity:0; }
        }

        /* Background image - rises smoothly */
        .nx-bg { position:absolute; left:0; right:0; bottom:0; height:100%; background:url('/space-bg.png') center bottom/cover no-repeat; z-index:1; transform:translateY(40%); opacity:0; animation:nxArcRise 3.5s cubic-bezier(0.22,1,0.36,1) 0.5s forwards; }
        .nx-bg::after { content:""; position:absolute; inset:0; background:rgba(0,0,0,0.3); }
        /* Top fade so image blends into CSS star field */
        .nx-bg::before { content:""; position:absolute; top:0; left:0; right:0; height:40%; background:linear-gradient(to bottom, #000 0%, transparent 100%); z-index:1; }

        @keyframes nxArcRise { 
          0% { transform:translateY(40%); opacity:0; }
          15% { opacity:0.4; }
          40% { opacity:0.8; }
          100% { transform:translateY(0%); opacity:1; }
        }

        .nx-back { position:fixed; top:24px; left:24px; z-index:100; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:10px 16px; cursor:pointer; transition:all 0.3s; display:flex; align-items:center; gap:6px; text-decoration:none; color:rgba(255,255,255,0.35); font-family:'Genos',sans-serif; font-size:12px; font-weight:600; letter-spacing:1px; text-transform:uppercase; backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); }
        .nx-back:hover { border-color:rgba(255,96,64,0.3); color:#ff6040; background:rgba(255,96,64,0.06); }
        .nx-back svg { transition:transform 0.3s; }
        .nx-back:hover svg { transform:translateX(-3px); }

        /* ===== GLASS CARD ===== */
        .nx-wrap { position:relative; z-index:10; width:100%; max-width:480px; padding:0 20px; }
        .nx-card { position:relative; padding:56px 40px 44px; border-radius:20px; background:rgba(10,5,3,0.92); backdrop-filter:blur(40px); -webkit-backdrop-filter:blur(40px); border:1px solid rgba(255,96,64,0.1); box-shadow:0 8px 60px rgba(0,0,0,0.7),0 0 80px rgba(255,50,30,0.05),inset 0 1px 0 rgba(255,255,255,0.03); opacity:0; animation:nxIn 1.2s ease 0.5s forwards; }

        /* Floating logo above card */
        .nx-logo-float { position:absolute; top:-36px; left:50%; transform:translateX(-50%); z-index:11; }
        .nx-logo-icon { width:72px; height:72px; border-radius:20px; background:linear-gradient(145deg,#ff4020,#ff6040); display:flex; align-items:center; justify-content:center; font-family:'Genos',sans-serif; font-weight:900; font-size:26px; color:#fff; box-shadow:0 8px 30px rgba(255,50,30,0.4),0 0 60px rgba(255,50,30,0.15); border:2px solid rgba(255,255,255,0.1); }

        .nx-title { text-align:center; font-family:'Genos',sans-serif; font-size:24px; font-weight:800; color:#fff; letter-spacing:2px; margin-top:16px; }
        .nx-sub { text-align:center; font-size:12px; color:rgba(255,255,255,0.3); margin-top:4px; margin-bottom:28px; line-height:1.5; }

        /* Inputs */
        .nx-form { display:flex; flex-direction:column; gap:18px; }
        .nx-input { width:100%; padding:15px 18px; border-radius:10px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.04); color:#fff; font-size:14px; font-family:'DM Sans',sans-serif; outline:none; transition:all 0.3s; box-sizing:border-box; }
        .nx-input:focus { border-color:rgba(255,96,64,0.4); background:rgba(255,255,255,0.06); box-shadow:0 0 0 3px rgba(255,96,64,0.08); }
        .nx-input::placeholder { color:rgba(255,255,255,0.2); }
        .nx-pw-wrap { position:relative; }
        .nx-pw-wrap .nx-input { padding-right:56px; }
        .nx-pw-btn { position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; padding:4px; }
        .nx-pw-btn svg { transition:stroke 0.3s; }

        .nx-otp .nx-input { text-align:center; font-size:24px; letter-spacing:12px; font-family:'Genos',sans-serif; font-weight:700; }

        /* Button */
        .nx-btn { width:100%; padding:15px; border:none; border-radius:12px; background:linear-gradient(135deg,#ff3020 0%,#ff6040 50%,rgba(255,140,100,0.8) 100%); color:#fff; font-size:14px; font-weight:700; font-family:'Genos',sans-serif; letter-spacing:2px; text-transform:uppercase; cursor:pointer; transition:all 0.3s; margin-top:12px; box-shadow:0 4px 20px rgba(255,50,30,0.3),inset 0 1px 0 rgba(255,255,255,0.15); }
        .nx-btn:hover:not(:disabled) { box-shadow:0 6px 30px rgba(255,50,30,0.45),inset 0 1px 0 rgba(255,255,255,0.15); transform:translateY(-2px); }
        .nx-btn:disabled { opacity:0.4; cursor:not-allowed; }
        .nx-btn-ghost { width:100%; padding:10px; background:transparent; border:1px solid rgba(255,255,255,0.06); border-radius:10px; color:rgba(255,255,255,0.25); font-size:11px; font-family:'Genos',sans-serif; letter-spacing:2px; text-transform:uppercase; cursor:pointer; transition:all 0.3s; margin-top:4px; }
        .nx-btn-ghost:hover { border-color:rgba(255,96,64,0.3); color:#ff6040; }

        /* Roles */
        .nx-roles { display:flex; gap:12px; margin-bottom:28px; }
        .nx-role { flex:1; padding:16px 8px; text-align:center; border-radius:12px; font-family:'Genos',sans-serif; font-size:12px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; cursor:pointer; transition:all 0.5s cubic-bezier(0.22,1,0.36,1); border:1px solid rgba(255,255,255,0.06); background:rgba(255,255,255,0.02); color:rgba(255,255,255,0.25); }
        .nx-role:hover { border-color:rgba(255,96,64,0.2); color:rgba(255,255,255,0.5); }
        .nx-role:hover .nx-role-img { filter:brightness(1) invert(1); opacity:0.6; }
        .nx-role.on { border-color:rgba(255,96,64,0.25); background:rgba(255,96,64,0.04); color:rgba(255,96,64,0.8); box-shadow:0 0 25px rgba(255,50,30,0.06); }
        .nx-role.on .nx-role-img { filter:brightness(1) invert(1) sepia(1) saturate(5) hue-rotate(-15deg); opacity:0.65; }
        .nx-role-img { width:28px; height:28px; display:block; margin:0 auto 6px; filter:brightness(1) invert(1); opacity:0.3; transition:all 0.5s ease; }

        /* Premium card expand animation */
        .nx-form-area { animation:nxExpand 1s ease forwards; }
        @keyframes nxExpand {
          from { opacity:0; transform:translateY(12px); }
          to { opacity:1; transform:translateY(0); }
        }

        /* Tabs */
        .nx-tabs { display:flex; margin-bottom:20px; border-bottom:1px solid rgba(255,255,255,0.06); }
        .nx-tab { flex:1; padding:10px 0; text-align:center; font-family:'Genos',sans-serif; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; cursor:pointer; transition:all 0.3s; color:rgba(255,255,255,0.2); border:none; background:none; border-bottom:2px solid transparent; }
        .nx-tab.on { color:#ff6040; border-bottom-color:#ff6040; }

        /* Steps */
        .nx-steps { display:flex; align-items:center; justify-content:center; gap:6px; margin-bottom:18px; }
        .nx-dot { width:8px; height:8px; border-radius:50%; background:rgba(255,255,255,0.08); transition:0.3s; }
        .nx-dot.on { background:#ff6040; box-shadow:0 0 10px rgba(255,96,64,0.5); }
        .nx-dot.dn { background:#44ff66; }
        .nx-dline { width:24px; height:1px; background:rgba(255,255,255,0.06); }

        .nx-hint { font-size:11px; color:rgba(255,255,255,0.15); text-align:center; }
        .nx-email { text-align:center; font-size:12px; color:rgba(255,255,255,0.2); margin-bottom:6px; }
        .nx-link { text-align:center; font-size:12px; color:rgba(255,255,255,0.2); margin-top:20px; }
        .nx-link a { color:#ff6040; text-decoration:none; font-family:'Genos',sans-serif; letter-spacing:1px; }
        .nx-link a:hover { text-decoration:underline; }

        .nx-ok { padding:24px; border-radius:14px; border:1px solid rgba(68,255,102,0.15); background:rgba(68,255,102,0.03); text-align:center; }
        .nx-ok-i { font-size:40px; margin-bottom:10px; display:block; }
        .nx-ok-t { font-family:'Genos',sans-serif; font-size:18px; font-weight:700; color:#44ff66; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:6px; }
        .nx-ok-m { font-size:13px; color:rgba(255,255,255,0.3); margin-bottom:14px; line-height:1.6; }

        .nx-divider { display:flex; align-items:center; gap:12px; margin:22px 0 0; }
        .nx-divider span { flex:1; height:1px; background:rgba(255,255,255,0.06); }
        .nx-divider em { font-style:normal; font-size:10px; color:rgba(255,255,255,0.12); font-family:'Genos',sans-serif; letter-spacing:2px; text-transform:uppercase; }

        @keyframes nxIn { 
          from { opacity:0; transform:translateY(20px); } 
          to { opacity:1; transform:translateY(0); } 
        }

        @media (max-width:500px) { .nx-card { padding:48px 24px 32px; } .nx-title { font-size:20px; } .nx-role { font-size:10px; padding:12px 4px; } }
      `}</style>

      {/* Back button */}
      <a href="/" style={{ position:"fixed", top:24, left:24, zIndex:9999, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"10px 16px", display:"flex", alignItems:"center", gap:6, textDecoration:"none", color:"rgba(255,255,255,0.4)", fontFamily:"'Genos',sans-serif", fontSize:12, fontWeight:600, letterSpacing:1, textTransform:"uppercase", backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 12H5M5 12L11 6M5 12L11 18"/></svg>
        Back
      </a>

      {/* Star field - matches the image stars so arc rise is seamless */}
      <div className="nx-stars">
        {/* Bright stars */}
        <div className="nx-s twinkle" style={{ width:2,height:2,top:"8%",left:"6%" }} />
        <div className="nx-s" style={{ width:1.5,height:1.5,top:"5%",left:"22%" }} />
        <div className="nx-s twinkle" style={{ width:2.5,height:2.5,top:"12%",left:"42%",animationDelay:"1s" }} />
        <div className="nx-s" style={{ width:1,height:1,top:"3%",left:"58%" }} />
        <div className="nx-s twinkle" style={{ width:2,height:2,top:"15%",left:"75%",animationDelay:"2s" }} />
        <div className="nx-s" style={{ width:1.5,height:1.5,top:"7%",left:"88%" }} />
        <div className="nx-s twinkle" style={{ width:1.5,height:1.5,top:"22%",left:"12%",animationDelay:"0.5s" }} />
        <div className="nx-s" style={{ width:2,height:2,top:"25%",left:"35%" }} />
        <div className="nx-s twinkle" style={{ width:1,height:1,top:"18%",left:"62%",animationDelay:"1.5s" }} />
        <div className="nx-s" style={{ width:2,height:2,top:"28%",left:"82%" }} />
        <div className="nx-s twinkle" style={{ width:1.5,height:1.5,top:"35%",left:"5%",animationDelay:"2.5s" }} />
        <div className="nx-s" style={{ width:1,height:1,top:"32%",left:"28%" }} />
        <div className="nx-s twinkle" style={{ width:2,height:2,top:"40%",left:"52%",animationDelay:"0.8s" }} />
        <div className="nx-s" style={{ width:1.5,height:1.5,top:"38%",left:"70%" }} />
        <div className="nx-s" style={{ width:1,height:1,top:"42%",left:"92%" }} />
        <div className="nx-s twinkle" style={{ width:2,height:2,top:"48%",left:"18%",animationDelay:"1.8s" }} />
        <div className="nx-s" style={{ width:1.5,height:1.5,top:"55%",left:"45%" }} />
        <div className="nx-s twinkle" style={{ width:1,height:1,top:"52%",left:"78%",animationDelay:"3s" }} />
        {/* Dim stars */}
        <div className="nx-s dim" style={{ width:1,height:1,top:"10%",left:"15%" }} />
        <div className="nx-s dim" style={{ width:1,height:1,top:"6%",left:"48%" }} />
        <div className="nx-s dim" style={{ width:1,height:1,top:"20%",left:"68%" }} />
        <div className="nx-s dim" style={{ width:1,height:1,top:"14%",left:"32%" }} />
        <div className="nx-s dim" style={{ width:1,height:1,top:"30%",left:"55%" }} />
        <div className="nx-s dim" style={{ width:1,height:1,top:"36%",left:"85%" }} />
        <div className="nx-s dim" style={{ width:1,height:1,top:"45%",left:"8%" }} />
        <div className="nx-s dim" style={{ width:1,height:1,top:"50%",left:"38%" }} />
        <div className="nx-s dim" style={{ width:1,height:1,top:"44%",left:"65%" }} />
        <div className="nx-s dim" style={{ width:1,height:1,top:"58%",left:"25%" }} />
        <div className="nx-s dim" style={{ width:1,height:1,top:"62%",left:"72%" }} />
        <div className="nx-s dim" style={{ width:1,height:1,top:"16%",left:"95%" }} />
      </div>

      {/* Background image with smooth arc rise */}
      <div className="nx-bg" />

      {/* Shooting stars */}
      <div className="nx-shoot s1" />
      <div className="nx-shoot s2" />
      <div className="nx-shoot s3" />

      {/* CARD */}
      <div className="nx-wrap">
        <div className="nx-card">
          {/* Floating logo */}
          <div className="nx-logo-float">
            <div className="nx-logo-icon">PS</div>
          </div>

          <div className="nx-title">{EVENT_CONFIG ? EVENT_CONFIG.eventName : "Project Space"}</div>
          <div className="nx-sub">{getSubtitle()}</div>

          <div className="nx-roles">
            <button className={"nx-role" + (role === "leader" ? " on" : "")} onClick={function () { setRole("leader"); resetSetup(); setRole("leader") }}>
              <img src="https://cdn-icons-png.flaticon.com/128/115/115893.png" alt="" className="nx-role-img" />Team Leader
            </button>
            <button className={"nx-role" + (role === "member" ? " on" : "")} onClick={function () { setRole("member"); resetSetup(); setRole("member") }}>
              <img src="https://cdn-icons-png.flaticon.com/128/2914/2914275.png" alt="" className="nx-role-img" />Team Member
            </button>
          </div>

          {/* LEADER */}
          {role === "leader" && (
            <div className="nx-form-area" key="leader-form">
            <form className="nx-form" onSubmit={handleLogin}>
              <input type="text" className="nx-input" placeholder="Roll Number (e.g. 22A31A0501)" value={rollNumber} onChange={function (e) { setRollNumber(e.target.value.toUpperCase()) }} autoFocus />
              <div className="nx-pw-wrap"><input type={showPassword ? "text" : "password"} className="nx-input" placeholder="Password" value={password} onChange={function (e) { setPassword(e.target.value) }} /><button type="button" className="nx-pw-btn" onClick={function () { setShowPassword(!showPassword) }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={showPassword ? "#ff6040" : "rgba(255,255,255,0.2)"} strokeWidth="1.5"><path d="M1 12S5 5 12 5s11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg></button></div>
              <button type="submit" className="nx-btn" disabled={loading}>{loading ? "Logging in..." : "Log in"}</button>
            </form>
            </div>
          )}

          {/* MEMBER */}
          {role === "member" && (
            <div className="nx-form-area" key="member-form">
            <>
              <div className="nx-tabs">
                <button className={"nx-tab" + (mode === "login" ? " on" : "")} onClick={function () { setMode("login"); setPassword(""); setConfirmPassword(""); setSetupStep("roll"); setSetupSuccess(null) }}>Login</button>
                <button className={"nx-tab" + (mode === "set-password" ? " on" : "")} onClick={function () { setMode("set-password"); setSetupStep("roll"); setPassword(""); setConfirmPassword(""); setOtp(""); setSetupSuccess(null) }}>First Time?</button>
              </div>

              {setupSuccess ? (
                <div className="nx-ok">
                  <span className="nx-ok-i">{"\u2705"}</span>
                  <div className="nx-ok-t">Password Created!</div>
                  <div className="nx-ok-m">Welcome, <strong style={{ color: "#fff" }}>{setupSuccess.memberName}</strong>!{setupSuccess.teamNumber && <> Team <strong style={{ color: "#fff" }}>{setupSuccess.teamNumber}</strong>.</>} You can now login.</div>
                  <button className="nx-btn" onClick={function () { resetSetup(); setRole("member") }}>{"\u2192"} Go to Login</button>
                </div>
              ) : mode === "login" ? (
                <form className="nx-form" onSubmit={handleLogin}>
                  <input type="text" className="nx-input" placeholder="Roll Number (e.g. 22A31A0501)" value={rollNumber} onChange={function (e) { setRollNumber(e.target.value.toUpperCase()) }} autoFocus />
                  <div className="nx-pw-wrap"><input type={showPassword ? "text" : "password"} className="nx-input" placeholder="Password" value={password} onChange={function (e) { setPassword(e.target.value) }} /><button type="button" className="nx-pw-btn" onClick={function () { setShowPassword(!showPassword) }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={showPassword ? "#ff6040" : "rgba(255,255,255,0.2)"} strokeWidth="1.5"><path d="M1 12S5 5 12 5s11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg></button></div>
                  <button type="submit" className="nx-btn" disabled={loading}>{loading ? "Logging in..." : "Log in"}</button>
                </form>
              ) : (
                <>
                  <div className="nx-steps">
                    <div className={"nx-dot" + (setupStep === "roll" ? " on" : (setupStep === "otp" || setupStep === "password") ? " dn" : "")} />
                    <div className="nx-dline" /><div className={"nx-dot" + (setupStep === "otp" ? " on" : setupStep === "password" ? " dn" : "")} />
                    <div className="nx-dline" /><div className={"nx-dot" + (setupStep === "password" ? " on" : "")} />
                  </div>
                  {setupStep === "roll" && (
                    <form className="nx-form" onSubmit={handleCheckRoll}>
                      <input type="text" className="nx-input" placeholder="Roll Number (e.g. 22A31A0501)" value={rollNumber} onChange={function (e) { setRollNumber(e.target.value.toUpperCase()) }} autoFocus />
                      <div className="nx-hint">Enter your registered roll number</div>
                      <button type="submit" className="nx-btn" disabled={loading}>{loading ? "Checking..." : "Send OTP"}</button>
                    </form>
                  )}
                  {setupStep === "otp" && (
                    <form className="nx-form" onSubmit={handleVerifyOtp}>
                      <div className="nx-email">OTP sent to {memberEmail}</div>
                      <div className="nx-otp"><input type="text" className="nx-input" placeholder="000000" value={otp} onChange={function (e) { setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6)) }} autoFocus maxLength={6} /></div>
                      <div className="nx-hint">Check your email for the 6-digit code</div>
                      <button type="submit" className="nx-btn" disabled={loading}>{loading ? "Verifying..." : "Verify OTP"}</button>
                      <button type="button" className="nx-btn-ghost" onClick={function () { setSetupStep("roll"); setOtp("") }}>{"\u2190"} Change Roll Number</button>
                    </form>
                  )}
                  {setupStep === "password" && (
                    <form className="nx-form" onSubmit={handleCreatePassword}>
                      <div className="nx-email">Creating password for {rollNumber}</div>
                      <div className="nx-pw-wrap"><input type={showPassword ? "text" : "password"} className="nx-input" placeholder="Create Password" value={password} onChange={function (e) { setPassword(e.target.value) }} autoFocus /><button type="button" className="nx-pw-btn" onClick={function () { setShowPassword(!showPassword) }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={showPassword ? "#ff6040" : "rgba(255,255,255,0.2)"} strokeWidth="1.5"><path d="M1 12S5 5 12 5s11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg></button></div>
                      <input type={showPassword ? "text" : "password"} className="nx-input" placeholder="Confirm Password" value={confirmPassword} onChange={function (e) { setConfirmPassword(e.target.value) }} />
                      <button type="submit" className="nx-btn" disabled={loading}>{loading ? "Setting up..." : "Set Password"}</button>
                    </form>
                  )}
                </>
              )}
            </>
            </div>
          )}

          {!role && <div style={{ textAlign: "center", padding: "10px 0", color: "rgba(255,255,255,0.12)", fontSize: 13 }}>Select your role above to continue</div>}

          <div className="nx-divider"><span /><em>or</em><span /></div>
          <div className="nx-link">Don&apos;t have a team? <Link href="/register-account">Register Team</Link></div>
        </div>
      </div>
    </div>
  )
}