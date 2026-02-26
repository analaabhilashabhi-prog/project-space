"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import toast, { Toaster } from "react-hot-toast"
import { EVENT_CONFIG } from "@/config/formFields"
import AnimatedBackground from "@/components/AnimatedBackground"

export default function MemberLoginPage() {
  var router = useRouter()
  var [rollNumber, setRollNumber] = useState("")
  var [loading, setLoading] = useState(false)
  var [result, setResult] = useState(null)

  function handleLogin(e) {
    e.preventDefault()
    if (!rollNumber.trim()) { toast.error("Please enter your roll number"); return }
    setLoading(true)
    setResult(null)

    fetch("/api/member-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rollNumber: rollNumber.trim().toUpperCase() }),
    })
      .then(function (res) { return res.json() })
      .then(function (data) {
        if (data.success) {
          // Store member info
          localStorage.setItem("ps_member_roll", data.member.rollNumber)
          localStorage.setItem("ps_member_name", data.member.name)
          localStorage.setItem("ps_member_team", data.team.teamNumber)
          localStorage.setItem("ps_member_team_id", String(data.team.id))

          setResult(data)
          toast.success(data.message)
        } else {
          setResult(data)
          if (data.status === "not_registered") {
            toast.error("Not registered in any team")
          }
        }
        setLoading(false)
      })
      .catch(function () { toast.error("Something went wrong"); setLoading(false) })
  }

  function goToCards() {
    if (result && result.team) {
      router.push("/my-cards/" + result.team.teamNumber)
    }
  }

  return (
    <div className="ps-page">
      <AnimatedBackground />
      <Toaster position="top-center" toastOptions={{ style: { background: "#1a1a1a", color: "#fff", border: "1px solid rgba(255,60,30,0.2)" } }} />

      <style jsx>{`
        .ml-wrapper { position:relative; z-index:10; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:20px; }
        .ml-card { width:100%; max-width:460px; padding:40px 32px; border-radius:22px; border:1px solid rgba(255,60,30,0.12); background:linear-gradient(165deg,rgba(35,12,8,0.7),rgba(18,6,4,0.85)); backdrop-filter:blur(15px); opacity:0; animation:psFadeIn 0.7s ease forwards; }

        .ml-logo { display:flex; align-items:center; gap:10px; justify-content:center; margin-bottom:6px; }
        .ml-logo-icon { width:42px;height:42px; border-radius:12px; background:linear-gradient(135deg,#ff3020,#ff6040); display:flex; align-items:center; justify-content:center; font-family:var(--font-display); font-weight:900; font-size:16px; color:#fff; }
        .ml-logo-text { font-family:var(--font-display); font-size:22px; font-weight:800; color:#fff; letter-spacing:2px; text-transform:uppercase; }
        .ml-subtitle { text-align:center; font-size:13px; color:rgba(255,255,255,0.3); margin-bottom:28px; }

        .ml-form { display:flex; flex-direction:column; gap:14px; }

        /* Result cards */
        .ml-result { margin-top:20px; padding:24px; border-radius:16px; border:1px solid; animation:psFadeIn 0.5s ease forwards; }
        .ml-result.success { border-color:rgba(68,255,102,0.2); background:rgba(68,255,102,0.04); }
        .ml-result.error { border-color:rgba(255,60,60,0.2); background:rgba(255,60,60,0.04); }
        .ml-result.waiting { border-color:rgba(255,170,0,0.2); background:rgba(255,170,0,0.04); }

        .ml-result-icon { font-size:36px; text-align:center; margin-bottom:10px; }
        .ml-result-title { font-family:var(--font-display); font-size:18px; font-weight:700; text-align:center; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:6px; }
        .ml-result-msg { font-size:13px; color:rgba(255,255,255,0.4); text-align:center; margin-bottom:16px; line-height:1.6; }

        .ml-info-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:16px; }
        .ml-info-item { padding:10px 12px; border-radius:10px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.04); }
        .ml-info-label { font-size:10px; color:rgba(255,255,255,0.25); font-family:var(--font-display); letter-spacing:1.5px; text-transform:uppercase; margin-bottom:2px; }
        .ml-info-value { font-size:13px; color:rgba(255,255,255,0.8); font-weight:500; }
        .ml-info-full { grid-column:1/-1; }

        .ml-cta { width:100%; padding:14px; border-radius:12px; font-family:var(--font-display); font-size:14px; font-weight:700; letter-spacing:2px; text-transform:uppercase; border:none; cursor:pointer; transition:all 0.3s ease; }
        .ml-cta-primary { background:linear-gradient(135deg,#ff3020,#ff6040); color:#fff; box-shadow:0 0 20px rgba(255,50,30,0.3); }
        .ml-cta-primary:hover { box-shadow:0 0 40px rgba(255,50,30,0.5); transform:translateY(-1px); }
        .ml-cta-orange { background:linear-gradient(135deg,#ff8020,#ffaa40); color:#fff; box-shadow:0 0 20px rgba(255,130,30,0.2); }
        .ml-cta-orange:hover { box-shadow:0 0 40px rgba(255,130,30,0.4); transform:translateY(-1px); }

        .ml-link { text-align:center; font-size:12px; color:rgba(255,255,255,0.3); margin-top:16px; }
        .ml-link a { color:var(--accent-orange); text-decoration:none; font-family:var(--font-display); letter-spacing:1px; }
        .ml-link a:hover { text-decoration:underline; }

        @media (max-width:500px) {
          .ml-card { padding:28px 20px; }
          .ml-logo-text { font-size:18px; }
          .ml-info-grid { grid-template-columns:1fr; }
        }
      `}</style>

      <div className="ml-wrapper">
        <div className="ml-card">
          <div className="ml-logo">
            <div className="ml-logo-icon">PS</div>
            <div className="ml-logo-text">{EVENT_CONFIG.eventName}</div>
          </div>
          <div className="ml-subtitle">Team Member Access</div>

          {/* Login Form */}
          {!result && (
            <form className="ml-form" onSubmit={handleLogin}>
              <input
                type="text"
                value={rollNumber}
                onChange={function (e) { setRollNumber(e.target.value.toUpperCase()) }}
                placeholder="Enter your Roll Number"
                className="ps-input"
                style={{ width: "100%", textAlign: "center", fontSize: 16, letterSpacing: 2, fontFamily: "var(--font-display)" }}
                autoFocus
              />
              <button type="submit" className="ps-btn ps-btn-primary" style={{ width: "100%" }} disabled={loading}>
                {loading ? "Checking..." : "View My Details →"}
              </button>
            </form>
          )}

          {/* NOT REGISTERED */}
          {result && result.status === "not_registered" && (
            <div className="ml-result error">
              <div className="ml-result-icon">🚫</div>
              <div className="ml-result-title" style={{ color: "#ff5555" }}>Not Registered</div>
              <div className="ml-result-msg">
                Your roll number <strong style={{ color: "#fff" }}>{rollNumber}</strong> is not registered in any team. Ask your team leader to register you first.
              </div>
              <button className="ml-cta ml-cta-primary" onClick={function () { setResult(null); setRollNumber("") }}>
                ← Try Again
              </button>
            </div>
          )}

          {/* REGISTERED - Team member with cards */}
          {result && result.success && result.hasSnackCards && (
            <div className="ml-result success">
              <div className="ml-result-icon">✅</div>
              <div className="ml-result-title" style={{ color: "#44ff66" }}>Welcome, {result.member.name}!</div>
              <div className="ml-result-msg">Your snack cards are ready. View them to collect your snacks at the counter.</div>

              <div className="ml-info-grid">
                <div className="ml-info-item">
                  <div className="ml-info-label">Team</div>
                  <div className="ml-info-value">{result.team.teamNumber}</div>
                </div>
                <div className="ml-info-item">
                  <div className="ml-info-label">Role</div>
                  <div className="ml-info-value">{result.member.isLeader ? "Team Leader" : "Member"}</div>
                </div>
                <div className="ml-info-item">
                  <div className="ml-info-label">Branch</div>
                  <div className="ml-info-value">{result.member.branch}</div>
                </div>
                <div className="ml-info-item">
                  <div className="ml-info-label">College</div>
                  <div className="ml-info-value">{result.member.college}</div>
                </div>
                <div className="ml-info-item ml-info-full">
                  <div className="ml-info-label">Project</div>
                  <div className="ml-info-value">{result.team.projectTitle}</div>
                </div>
              </div>

              <button className="ml-cta ml-cta-orange" onClick={goToCards}>
                🛒 View My Snack Cards →
              </button>
            </div>
          )}

          {/* REGISTERED - but snacks not selected yet */}
          {result && result.success && !result.hasSnackCards && (
            <div className="ml-result waiting">
              <div className="ml-result-icon">⏳</div>
              <div className="ml-result-title" style={{ color: "#ffaa00" }}>Registered — Snacks Pending</div>
              <div className="ml-result-msg">
                You are registered in <strong style={{ color: "#fff" }}>{result.team.teamNumber}</strong> but your team leader hasn&apos;t selected snacks yet
                {result.foodDaysCompleted > 0 ? " (" + result.foodDaysCompleted + "/7 days done)" : ""}. Ask your team leader to complete the snack selection.
              </div>

              <div className="ml-info-grid">
                <div className="ml-info-item">
                  <div className="ml-info-label">Your Name</div>
                  <div className="ml-info-value">{result.member.name}</div>
                </div>
                <div className="ml-info-item">
                  <div className="ml-info-label">Team</div>
                  <div className="ml-info-value">{result.team.teamNumber}</div>
                </div>
                <div className="ml-info-item">
                  <div className="ml-info-label">Branch</div>
                  <div className="ml-info-value">{result.member.branch}</div>
                </div>
                <div className="ml-info-item">
                  <div className="ml-info-label">College</div>
                  <div className="ml-info-value">{result.member.college}</div>
                </div>
                <div className="ml-info-item ml-info-full">
                  <div className="ml-info-label">Project</div>
                  <div className="ml-info-value">{result.team.projectTitle}</div>
                </div>
              </div>

              <button className="ml-cta ml-cta-primary" onClick={function () { setResult(null); setRollNumber("") }}>
                ← Back
              </button>
            </div>
          )}

          <div className="ml-link">
            Team Leader? <Link href="/login">Login here</Link>
          </div>
        </div>
      </div>
    </div>
  )
}