"use client"
import { useState, useEffect, useRef } from "react"

export default function AdminVerifyPage() {
  var [mealCode, setMealCode] = useState("")
  var [pin, setPin] = useState("")
  var [loading, setLoading] = useState(false)
  var [result, setResult] = useState(null) // null | {result: "valid"|"invalid"|"already_consumed", ...}
  var [consuming, setConsuming] = useState(false)
  var [consumed, setConsumed] = useState(false)
  var [stats, setStats] = useState({ total: 0, consumed: 0, remaining: 0 })
  var [currentDay, setCurrentDay] = useState(1)
  var [authenticated, setAuthenticated] = useState(false)
  var [adminPass, setAdminPass] = useState("")
  var codeRef = useRef(null)
  var pinRef = useRef(null)

  var eventStart = new Date("2026-05-06T00:00:00")

  function getEventDay() {
    var now = new Date()
    var diff = Math.floor((now - eventStart) / (1000 * 60 * 60 * 24))
    if (diff < 0) return 1
    if (diff > 6) return 7
    return diff + 1
  }

  useEffect(function () {
    var saved = sessionStorage.getItem("ps_admin")
    if (saved === "true") setAuthenticated(true)
    setCurrentDay(getEventDay())
    // eslint-disable-next-line
  }, [])

  useEffect(function () {
    if (authenticated) fetchStats()
    // eslint-disable-next-line
  }, [authenticated, currentDay])

  function handleAdminLogin() {
    if (adminPass === "projectspace2026") {
      setAuthenticated(true)
      sessionStorage.setItem("ps_admin", "true")
    } else {
      alert("Wrong password!")
    }
  }

  async function fetchStats() {
    try {
      var res = await fetch("/api/verify-food-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stats", day_number: currentDay }),
      })
      var data = await res.json()
      setStats(data)
    } catch (e) { /* ignore */ }
  }

  async function handleVerify() {
    if (!mealCode.trim()) { codeRef.current && codeRef.current.focus(); return }
    if (!pin.trim()) { pinRef.current && pinRef.current.focus(); return }
    setLoading(true)
    setResult(null)
    setConsumed(false)

    try {
      var res = await fetch("/api/verify-food-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", meal_code: mealCode.trim(), pin: pin.trim() }),
      })
      var data = await res.json()
      setResult(data)
    } catch (e) {
      setResult({ result: "invalid", message: "Network error. Try again." })
    }
    setLoading(false)
  }

  async function handleConsume() {
    if (!result || !result.code_id) return
    setConsuming(true)

    try {
      var res = await fetch("/api/verify-food-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "consume", code_id: result.code_id }),
      })
      var data = await res.json()
      if (data.success) {
        setConsumed(true)
        fetchStats()
        // Auto clear after 3 seconds
        setTimeout(function () { clearForm() }, 3000)
      } else {
        alert("Failed: " + (data.error || "Unknown error"))
      }
    } catch (e) {
      alert("Network error")
    }
    setConsuming(false)
  }

  function clearForm() {
    setMealCode("")
    setPin("")
    setResult(null)
    setConsumed(false)
    codeRef.current && codeRef.current.focus()
  }

  function handleCodeKeyDown(e) {
    if (e.key === "Enter") { pinRef.current && pinRef.current.focus() }
  }

  function handlePinKeyDown(e) {
    if (e.key === "Enter") { handleVerify() }
  }

  function getMealIcon(slot) {
    if (slot === "snack") return "\uD83C\uDF6A"
    if (slot === "beverage") return "\u2615"
    return "\uD83C\uDF7D\uFE0F"
  }

  function getMealLabel(slot) {
    if (slot === "snack") return "Snack"
    if (slot === "beverage") return "Beverage"
    return slot
  }

  function formatTime(ts) {
    if (!ts) return ""
    return new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
  }

  // Admin login screen
  if (!authenticated) {
    return (
      <div style={{ minHeight:"100vh", background:"#000", position:"relative", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif" }}>
        <style jsx>{`
          .nx-stars { position:absolute; inset:0; z-index:0; }
          .nx-s { position:absolute; border-radius:50%; background:rgba(255,200,180,0.6); }
          .nx-s::after { content:""; position:absolute; inset:-2px; border-radius:50%; background:rgba(255,140,100,0.15); filter:blur(2px); }
          .nx-s.dim { background:rgba(255,180,160,0.25); }
          .nx-s.dim::after { background:rgba(255,140,100,0.06); }
          .nx-s.twinkle { animation:nxTw 3s ease-in-out infinite; }
          @keyframes nxTw { 0%,100%{opacity:0.3} 50%{opacity:1} }
          .nx-bg { position:absolute; left:0; right:0; bottom:0; height:100%; background:url('/space-bg.png') center bottom/cover no-repeat; z-index:1; transform:translateY(40%); opacity:0; animation:nxRise 3.5s cubic-bezier(0.22,1,0.36,1) 0.5s forwards; }
          .nx-bg::after { content:""; position:absolute; inset:0; background:rgba(0,0,0,0.3); }
          .nx-bg::before { content:""; position:absolute; top:0; left:0; right:0; height:40%; background:linear-gradient(to bottom, #000 0%, transparent 100%); z-index:1; }
          @keyframes nxRise { 0%{transform:translateY(40%);opacity:0} 15%{opacity:0.4} 40%{opacity:0.8} 100%{transform:translateY(0%);opacity:1} }
          .nx-shoot { position:absolute; z-index:0; width:80px; height:1px; background:linear-gradient(90deg, rgba(255,160,120,0.7), transparent); border-radius:1px; opacity:0; transform:rotate(-35deg); }
          .nx-shoot::before { content:""; position:absolute; left:0; top:-1px; width:4px; height:3px; border-radius:50%; background:rgba(255,200,170,0.9); box-shadow:0 0 6px rgba(255,150,100,0.6); }
          .nx-shoot.s1 { animation:nxSh1 8s linear 2s infinite; }
          .nx-shoot.s2 { animation:nxSh2 11s linear 5s infinite; }
          @keyframes nxSh1 { 0%{top:8%;left:-5%;opacity:0} 2%{opacity:1} 8%{top:28%;left:35%;opacity:0} 100%{opacity:0} }
          @keyframes nxSh2 { 0%{top:5%;left:40%;opacity:0} 1.5%{opacity:0.8} 6%{top:22%;left:72%;opacity:0} 100%{opacity:0} }
          .nx-card { position:relative; z-index:10; width:100%; max-width:440px; padding:56px 40px 44px; border-radius:20px; background:rgba(10,5,3,0.92); backdrop-filter:blur(40px); -webkit-backdrop-filter:blur(40px); border:1px solid rgba(255,96,64,0.1); box-shadow:0 8px 60px rgba(0,0,0,0.7),0 0 80px rgba(255,50,30,0.05),inset 0 1px 0 rgba(255,255,255,0.03); opacity:0; animation:nxIn 1.2s ease 0.5s forwards; }
          .nx-logo-float { position:absolute; top:-36px; left:50%; transform:translateX(-50%); z-index:11; }
          .nx-logo-icon { width:72px; height:72px; border-radius:20px; background:linear-gradient(145deg,#ff4020,#ff6040); display:flex; align-items:center; justify-content:center; font-family:'Genos',sans-serif; font-weight:900; font-size:26px; color:#fff; box-shadow:0 8px 30px rgba(255,50,30,0.4),0 0 60px rgba(255,50,30,0.15); border:2px solid rgba(255,255,255,0.1); }
          .nx-input { width:100%; padding:15px 18px; border-radius:10px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.04); color:#fff; font-size:14px; font-family:'DM Sans',sans-serif; outline:none; transition:all 0.3s; box-sizing:border-box; }
          .nx-input:focus { border-color:rgba(255,96,64,0.4); background:rgba(255,255,255,0.06); box-shadow:0 0 0 3px rgba(255,96,64,0.08); }
          .nx-input::placeholder { color:rgba(255,255,255,0.2); }
          .nx-btn { width:100%; padding:15px; border:none; border-radius:12px; background:linear-gradient(135deg,#ff3020 0%,#ff6040 50%,rgba(255,140,100,0.8) 100%); color:#fff; font-size:14px; font-weight:700; font-family:'Genos',sans-serif; letter-spacing:2px; text-transform:uppercase; cursor:pointer; transition:all 0.3s; margin-top:16px; box-shadow:0 4px 20px rgba(255,50,30,0.3),inset 0 1px 0 rgba(255,255,255,0.15); }
          .nx-btn:hover { box-shadow:0 6px 30px rgba(255,50,30,0.45); transform:translateY(-2px); }
          @keyframes nxIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        `}</style>

        <a href="/admin" style={{ position:"fixed", top:24, left:24, zIndex:9999, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"10px 16px", display:"flex", alignItems:"center", gap:6, textDecoration:"none", color:"rgba(255,255,255,0.4)", fontFamily:"'Genos',sans-serif", fontSize:12, fontWeight:600, letterSpacing:1, textTransform:"uppercase", backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 12H5M5 12L11 6M5 12L11 18"/></svg>Back
        </a>

        <div className="nx-stars">
          <div className="nx-s twinkle" style={{width:2,height:2,top:"8%",left:"6%"}} /><div className="nx-s" style={{width:1.5,height:1.5,top:"5%",left:"22%"}} />
          <div className="nx-s twinkle" style={{width:2.5,height:2.5,top:"12%",left:"42%",animationDelay:"1s"}} /><div className="nx-s" style={{width:1,height:1,top:"3%",left:"58%"}} />
          <div className="nx-s twinkle" style={{width:2,height:2,top:"15%",left:"75%",animationDelay:"2s"}} /><div className="nx-s" style={{width:1.5,height:1.5,top:"7%",left:"88%"}} />
          <div className="nx-s dim" style={{width:1,height:1,top:"20%",left:"32%"}} /><div className="nx-s dim" style={{width:1,height:1,top:"30%",left:"55%"}} />
          <div className="nx-s dim" style={{width:1,height:1,top:"45%",left:"15%"}} /><div className="nx-s dim" style={{width:1,height:1,top:"50%",left:"70%"}} />
        </div>
        <div className="nx-bg" />
        <div className="nx-shoot s1" /><div className="nx-shoot s2" />

        <div className="nx-card">
          <div className="nx-logo-float"><div className="nx-logo-icon">PS</div></div>
          <div style={{ textAlign:"center", fontFamily:"'Genos',sans-serif", fontSize:24, fontWeight:800, color:"#fff", letterSpacing:2, marginTop:16 }}>Food Verification</div>
          <div style={{ textAlign:"center", fontSize:12, color:"rgba(255,255,255,0.3)", marginTop:4, marginBottom:28 }}>Enter admin password to continue</div>
          <input type="password" className="nx-input" placeholder="Enter admin password" value={adminPass} onChange={function(e){setAdminPass(e.target.value)}} onKeyDown={function(e){if(e.key==="Enter")handleAdminLogin()}} autoFocus />
          <button className="nx-btn" onClick={handleAdminLogin}>Enter {"\u2192"}</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", fontFamily: "var(--font-primary)", color: "#fff" }}>
      <style jsx>{`
        .av-header { display:flex; align-items:center; justify-content:space-between; padding:20px 32px; border-bottom:1px solid rgba(255,255,255,0.05); }
        .av-logo { display:flex; align-items:center; gap:12px; }
        .av-logo-icon { width:40px; height:40px; border-radius:10px; background:linear-gradient(135deg,#ff3020,#ff6040); display:flex; align-items:center; justify-content:center; font-family:'Genos',sans-serif; font-weight:900; font-size:15px; color:#fff; }
        .av-logo-text { font-family:'Genos',sans-serif; font-size:20px; font-weight:800; color:#fff; letter-spacing:2px; text-transform:uppercase; }
        .av-status { display:flex; align-items:center; gap:8px; font-size:13px; color:#4ade80; }
        .av-status-dot { width:8px; height:8px; border-radius:50%; background:#4ade80; animation:avPulse 2s ease infinite; }

        .av-stats { display:flex; gap:16px; padding:16px 32px; border-bottom:1px solid rgba(255,255,255,0.03); }
        .av-stat { padding:12px 20px; border-radius:12px; border:1px solid rgba(255,255,255,0.06); background:rgba(255,255,255,0.02); flex:1; text-align:center; }
        .av-stat-num { font-family:'Genos',sans-serif; font-size:28px; font-weight:900; }
        .av-stat-label { font-size:11px; color:#666; font-family:'Genos',sans-serif; letter-spacing:1.5px; text-transform:uppercase; margin-top:4px; }

        .av-main { max-width:600px; margin:0 auto; padding:32px; }

        .av-input-row { display:flex; gap:12px; margin-bottom:20px; }
        .av-input { flex:1; padding:20px 14px; border-radius:0; border:none; border-left:2px solid rgba(255,96,64,0.5); border-bottom:2px solid rgba(255,96,64,0.5); background:transparent; color:#fff; font-size:28px; font-weight:700; text-align:center; letter-spacing:8px; font-family:'Genos',sans-serif; outline:none; transition:all 0.3s ease; border-bottom-left-radius:8px; }
        .av-input:focus { border:2px solid rgba(255,96,64,0.7); border-radius:8px; box-shadow:0 0 20px rgba(255,60,30,0.1); }
        .av-input::placeholder { color:rgba(255,255,255,0.15); letter-spacing:4px; font-size:20px; }
        .av-input-label { font-size:11px; color:#666; font-family:'Genos',sans-serif; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:8px; text-align:center; }

        .av-verify-btn { width:100%; padding:20px; border-radius:16px; border:none; background:linear-gradient(135deg,#ff3020,#ff6040); color:#fff; font-size:20px; font-weight:800; font-family:'Genos',sans-serif; letter-spacing:3px; text-transform:uppercase; cursor:pointer; transition:all 0.3s ease; box-shadow:0 0 30px rgba(255,50,30,0.2); }
        .av-verify-btn:hover { box-shadow:0 0 50px rgba(255,50,30,0.4); transform:translateY(-2px); }
        .av-verify-btn:disabled { opacity:0.5; cursor:not-allowed; transform:none; box-shadow:none; }

        /* Result Cards */
        .av-result { margin-top:24px; padding:28px; border-radius:18px; animation:avSlideUp 0.4s ease; }
        .av-result.valid { border:2px solid rgba(50,200,80,0.3); background:rgba(50,200,80,0.06); }
        .av-result.invalid { border:2px solid rgba(255,60,30,0.3); background:rgba(255,60,30,0.06); }
        .av-result.already { border:2px solid rgba(245,158,11,0.3); background:rgba(245,158,11,0.06); }
        .av-result.consumed-done { border:2px solid rgba(50,200,80,0.5); background:rgba(50,200,80,0.1); }

        .av-result-icon { font-size:48px; text-align:center; display:block; margin-bottom:12px; }
        .av-result-title { font-family:'Genos',sans-serif; font-size:24px; font-weight:800; text-align:center; letter-spacing:2px; text-transform:uppercase; margin-bottom:16px; }

        .av-student-info { display:flex; flex-direction:column; gap:8px; margin-bottom:20px; }
        .av-student-row { display:flex; align-items:center; gap:10px; font-size:14px; }
        .av-student-label { color:#888; width:80px; flex-shrink:0; }
        .av-student-value { color:#fff; font-weight:600; }

        .av-meal-badge { display:inline-flex; align-items:center; gap:8px; padding:12px 20px; border-radius:12px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); margin-bottom:16px; }
        .av-meal-icon { font-size:24px; }
        .av-meal-text { font-size:16px; font-weight:600; }
        .av-meal-day { font-size:12px; color:#888; margin-left:8px; }

        .av-consume-btn { width:100%; padding:18px; border-radius:14px; border:none; background:linear-gradient(135deg,#22c55e,#16a34a); color:#fff; font-size:18px; font-weight:800; font-family:'Genos',sans-serif; letter-spacing:3px; text-transform:uppercase; cursor:pointer; transition:all 0.3s ease; box-shadow:0 0 25px rgba(50,200,80,0.2); }
        .av-consume-btn:hover { box-shadow:0 0 40px rgba(50,200,80,0.4); transform:translateY(-2px); }
        .av-consume-btn:disabled { opacity:0.5; cursor:not-allowed; transform:none; }

        .av-warning { text-align:center; padding:16px; border-radius:12px; background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.2); color:#f59e0b; font-size:16px; font-weight:700; font-family:'Genos',sans-serif; letter-spacing:2px; text-transform:uppercase; }
        .av-clear-btn { width:100%; padding:14px; border-radius:12px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.03); color:#888; font-size:14px; cursor:pointer; margin-top:12px; font-family:'Genos',sans-serif; letter-spacing:1px; transition:all 0.2s ease; }
        .av-clear-btn:hover { border-color:rgba(255,60,30,0.3); color:#fff; }

        @keyframes avPulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes avSlideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }

        @media (max-width:640px) {
          .av-header { padding:16px; }
          .av-stats { padding:12px 16px; gap:8px; }
          .av-stat { padding:10px 12px; }
          .av-stat-num { font-size:22px; }
          .av-main { padding:20px 16px; }
          .av-input-row { flex-direction:column; }
          .av-input { font-size:24px; }
        }
      `}</style>

      {/* Header */}
      <div className="av-header">
        <div className="av-logo">
          <div className="av-logo-icon">PS</div>
          <div className="av-logo-text">Food Verification</div>
        </div>
        <div className="av-status">
          <div className="av-status-dot" />
          Online
        </div>
      </div>

      {/* Stats Bar */}
      <div className="av-stats">
        <div className="av-stat">
          <div className="av-stat-num" style={{ color: "#fff" }}>Day {currentDay}</div>
          <div className="av-stat-label">Current Day</div>
        </div>
        <div className="av-stat">
          <div className="av-stat-num" style={{ color: "#4ade80" }}>{stats.consumed}</div>
          <div className="av-stat-label">Scanned</div>
        </div>
        <div className="av-stat">
          <div className="av-stat-num" style={{ color: "#ff6040" }}>{stats.remaining}</div>
          <div className="av-stat-label">Remaining</div>
        </div>
        <div className="av-stat">
          <div className="av-stat-num" style={{ color: "#888" }}>{stats.total}</div>
          <div className="av-stat-label">Total</div>
        </div>
      </div>

      {/* Main Verification Area */}
      <div className="av-main">

        {/* Input Fields */}
        <div>
          <div className="av-input-label">Meal Code</div>
          <div className="av-input-row">
            <input
              ref={codeRef}
              type="text"
              inputMode="numeric"
              maxLength={5}
              value={mealCode}
              onChange={function (e) { setMealCode(e.target.value.replace(/[^0-9]/g, "")) }}
              onKeyDown={handleCodeKeyDown}
              placeholder="00000"
              className="av-input"
              autoFocus
            />
          </div>
        </div>

        <div>
          <div className="av-input-label">Student PIN</div>
          <div className="av-input-row">
            <input
              ref={pinRef}
              type="password"
              inputMode="numeric"
              maxLength={5}
              value={pin}
              onChange={function (e) { setPin(e.target.value.replace(/[^0-9]/g, "")) }}
              onKeyDown={handlePinKeyDown}
              placeholder="-----"
              className="av-input"
            />
          </div>
        </div>

        <button className="av-verify-btn" onClick={handleVerify} disabled={loading || !mealCode || !pin}>
          {loading ? "Verifying..." : "Verify \u2192"}
        </button>

        {/* ===== RESULT DISPLAY ===== */}

        {/* VALID - Not yet consumed */}
        {result && result.result === "valid" && !consumed && (
          <div className="av-result valid">
            <span className="av-result-icon">{"\u2705"}</span>
            <div className="av-result-title" style={{ color: "#4ade80" }}>Verified</div>

            <div className="av-student-info">
              <div className="av-student-row">
                <span className="av-student-label">{"\uD83D\uDC64"} Name</span>
                <span className="av-student-value">{result.student_name}</span>
              </div>
              <div className="av-student-row">
                <span className="av-student-label">{"\uD83D\uDCDD"} Roll</span>
                <span className="av-student-value">{result.roll_number} | Team: {result.team_number}</span>
              </div>
            </div>

            <div className="av-meal-badge">
              <span className="av-meal-icon">{getMealIcon(result.meal_slot)}</span>
              <span className="av-meal-text">{getMealLabel(result.meal_slot)} — {result.food_item}</span>
              <span className="av-meal-day">{"\uD83D\uDCC5"} Day {result.day_number}</span>
            </div>

            <button className="av-consume-btn" onClick={handleConsume} disabled={consuming}>
              {consuming ? "Marking..." : "\u2713 Mark as Consumed"}
            </button>
          </div>
        )}

        {/* CONSUMED SUCCESS */}
        {result && result.result === "valid" && consumed && (
          <div className="av-result consumed-done">
            <span className="av-result-icon">{"\uD83C\uDF89"}</span>
            <div className="av-result-title" style={{ color: "#4ade80" }}>Served!</div>
            <div style={{ textAlign: "center", fontSize: 14, color: "#888", marginBottom: 16 }}>
              {result.student_name} — {getMealLabel(result.meal_slot)} ({result.food_item})
            </div>
            <div style={{ textAlign: "center", fontSize: 12, color: "#4ade80" }}>Auto-clearing in 3 seconds...</div>
          </div>
        )}

        {/* ALREADY CONSUMED */}
        {result && result.result === "already_consumed" && (
          <div className="av-result already">
            <span className="av-result-icon">{"\u26A0\uFE0F"}</span>
            <div className="av-result-title" style={{ color: "#f59e0b" }}>Already Consumed</div>

            <div className="av-student-info">
              <div className="av-student-row">
                <span className="av-student-label">{"\uD83D\uDC64"} Name</span>
                <span className="av-student-value">{result.student_name}</span>
              </div>
              <div className="av-student-row">
                <span className="av-student-label">{"\uD83D\uDCDD"} Roll</span>
                <span className="av-student-value">{result.roll_number}</span>
              </div>
            </div>

            <div className="av-meal-badge">
              <span className="av-meal-icon">{getMealIcon(result.meal_slot)}</span>
              <span className="av-meal-text">{getMealLabel(result.meal_slot)} was already claimed</span>
            </div>

            <div style={{ textAlign: "center", fontSize: 13, color: "#888", marginBottom: 16 }}>
              {"\u23F0"} Consumed at {formatTime(result.consumed_at)}
            </div>

            <div className="av-warning">{"\u26D4"} Do Not Serve — Duplicate</div>
          </div>
        )}

        {/* INVALID */}
        {result && result.result === "invalid" && (
          <div className="av-result invalid">
            <span className="av-result-icon">{"\u274C"}</span>
            <div className="av-result-title" style={{ color: "#ff6040" }}>Invalid</div>
            <div style={{ textAlign: "center", fontSize: 14, color: "#888" }}>
              {result.message || "Code + PIN combination doesn't match. Please check and try again."}
            </div>
          </div>
        )}

        {/* Clear Button */}
        {result && (
          <button className="av-clear-btn" onClick={clearForm}>
            Clear & Scan Next
          </button>
        )}
      </div>
    </div>
  )
}