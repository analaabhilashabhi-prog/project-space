"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import QRCode from "qrcode"
import { supabase } from "@/lib/supabase"
import { EVENT_CONFIG, WHATSAPP_MESSAGE } from "@/config/formFields"
import AnimatedBackground from "@/components/AnimatedBackground"

export default function SuccessPage() {
  const params = useParams()
  const router = useRouter()
  const teamNumber = params.teamNumber
  const [team, setTeam] = useState(null)
  const [members, setMembers] = useState([])
  const [qrImage, setQrImage] = useState("")
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(function () {
    async function fetchTeam() {
      var teamRes = await supabase
        .from("teams")
        .select("*")
        .eq("team_number", teamNumber)
        .single()

      if (teamRes.data) {
        setTeam(teamRes.data)

        var memberRes = await supabase
          .from("team_members")
          .select("*")
          .eq("team_id", teamRes.data.id)
          .order("is_leader", { ascending: false })

        setMembers(memberRes.data || [])

        var qr = await QRCode.toDataURL(teamNumber, {
          width: 300,
          margin: 2,
          color: { dark: "#000000", light: "#ffffff" },
        })
        setQrImage(qr)
      }
      setLoading(false)
    }

    if (teamNumber) fetchTeam()
  }, [teamNumber])

  function copyTeamNumber() {
    navigator.clipboard.writeText(teamNumber)
    setCopied(true)
    setTimeout(function () { setCopied(false) }, 2000)
  }

  function shareWhatsApp() {
    if (!team) return
    var leader = members.find(function (m) { return m.is_leader })
    var msg = WHATSAPP_MESSAGE(teamNumber, team.project_title, leader ? leader.member_name : "")
    window.open("https://wa.me/?text=" + msg, "_blank")
  }

  if (loading) {
    return (
      <div className="ps-page">
        <AnimatedBackground />
        <div style={{ position: "relative", zIndex: 10, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="ps-spinner" style={{ width: 32, height: 32 }} />
        </div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="ps-page">
        <AnimatedBackground />
        <div style={{ position: "relative", zIndex: 10, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <div className="ps-page-title" style={{ fontSize: 28 }}>Team Not Found</div>
          <button className="ps-btn ps-btn-secondary" onClick={() => router.push("/")}>← Back to Home</button>
        </div>
      </div>
    )
  }

  return (
    <div className="ps-page">
      <AnimatedBackground />

      <style jsx>{`
        .success-wrapper { position:relative; z-index:10; min-height:100vh; display:flex; flex-direction:column; align-items:center; padding:50px 20px 60px; }
        .success-container { max-width:580px; width:100%; }

        /* Check icon */
        .success-check { width:72px;height:72px; border-radius:50%; background:rgba(255,60,30,0.12); border:2px solid rgba(255,60,30,0.25); display:flex; align-items:center; justify-content:center; margin:0 auto 24px; opacity:0; animation:psFadeIn 0.8s ease forwards; }
        .success-check svg { width:36px;height:36px; color:var(--accent-orange); }

        .success-title { font-family:var(--font-display); font-weight:900; font-size:36px; text-transform:uppercase; letter-spacing:3px; text-align:center; background:linear-gradient(180deg,#ffffff 0%,#ffd6bc 40%,#ff8850 70%,#ff3020 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; margin-bottom:8px; opacity:0; animation:psTitleIn 0.8s ease 0.2s forwards; }
        .success-subtitle { font-family:var(--font-display); font-size:14px; font-weight:500; letter-spacing:2px; text-transform:uppercase; color:rgba(255,255,255,0.35); text-align:center; margin-bottom:32px; opacity:0; animation:psSubIn 0.6s ease 0.4s forwards; }

        /* Main card */
        .success-card { padding:36px 32px; border-radius:20px; border:1px solid rgba(255,60,30,0.12); background:linear-gradient(165deg,rgba(35,12,8,0.75),rgba(18,6,4,0.9)); backdrop-filter:blur(20px); position:relative; overflow:hidden; margin-bottom:20px; opacity:0; animation:psFadeIn 0.8s ease 0.5s forwards; }
        .success-card::before { content:''; position:absolute; top:0;left:0;right:0; height:2px; background:linear-gradient(90deg,#ff4020,#ff8040,#ffaa40); }
        .success-card::after { content:''; position:absolute; top:-50%;left:-50%; width:200%;height:200%; background:radial-gradient(circle at 50% 0%,rgba(255,60,30,0.08),transparent 50%); pointer-events:none; }

        .success-card-inner { position:relative; z-index:1; }

        .success-team-label { font-family:var(--font-display); font-size:11px; font-weight:600; color:rgba(255,255,255,0.3); letter-spacing:3px; text-transform:uppercase; text-align:center; margin-bottom:6px; }
        .success-team-number { font-family:var(--font-display); font-size:52px; font-weight:900; text-align:center; letter-spacing:6px; background:linear-gradient(135deg,#ff6040,#ffaa40); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; margin-bottom:24px; }

        /* QR Code */
        .success-qr-wrap { display:flex; justify-content:center; margin-bottom:20px; }
        .success-qr { padding:14px; background:#fff; border-radius:16px; display:inline-block; }
        .success-qr img { display:block; width:180px; height:180px; }
        .success-qr-hint { font-family:var(--font-display); font-size:11px; color:rgba(255,255,255,0.25); letter-spacing:2px; text-transform:uppercase; text-align:center; margin-bottom:24px; }

        /* Details */
        .success-divider { width:100%; height:1px; background:linear-gradient(90deg,transparent,rgba(255,60,30,0.2),transparent); margin:20px 0; }
        .success-detail-row { display:flex; justify-content:space-between; align-items:flex-start; padding:8px 0; }
        .success-detail-label { font-size:13px; color:rgba(255,255,255,0.35); font-family:var(--font-display); letter-spacing:1px; text-transform:uppercase; }
        .success-detail-value { font-size:14px; color:rgba(255,255,255,0.8); font-weight:500; text-align:right; max-width:60%; }

        /* Members */
        .success-members-label { font-family:var(--font-display); font-size:12px; font-weight:600; color:rgba(255,255,255,0.3); letter-spacing:2px; text-transform:uppercase; margin-bottom:10px; }
        .success-member { display:flex; justify-content:space-between; align-items:center; padding:8px 12px; border-radius:10px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.04); margin-bottom:6px; }
        .success-member-name { font-size:13px; color:rgba(255,255,255,0.7); }
        .success-member-roll { font-family:var(--font-display); font-size:11px; color:rgba(255,255,255,0.3); letter-spacing:1px; }

        /* Action buttons */
        .success-actions { opacity:0; animation:psFadeIn 0.6s ease 0.7s forwards; }
        .success-btn-row { display:flex; gap:10px; margin-bottom:10px; }
        .success-copy-btn { flex:1; padding:12px; border-radius:14px; font-family:var(--font-display); font-size:13px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; cursor:pointer; transition:all 0.3s ease; display:flex; align-items:center; justify-content:center; gap:6px; border:1px solid rgba(255,60,30,0.2); background:rgba(255,60,30,0.06); color:var(--accent-light); }
        .success-copy-btn:hover { background:rgba(255,60,30,0.12); border-color:rgba(255,60,30,0.35); }
        .success-copy-btn.copied { background:rgba(255,60,30,0.15); border-color:var(--accent-orange); color:#fff; }

        .success-wa-btn { flex:1; padding:12px; border-radius:14px; font-family:var(--font-display); font-size:13px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; cursor:pointer; transition:all 0.3s ease; display:flex; align-items:center; justify-content:center; gap:6px; border:1px solid rgba(37,211,102,0.25); background:rgba(37,211,102,0.08); color:#25d366; }
        .success-wa-btn:hover { background:rgba(37,211,102,0.15); border-color:rgba(37,211,102,0.4); }

        .success-dl-btn { display:block; width:100%; padding:12px; border-radius:14px; font-family:var(--font-display); font-size:13px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; text-align:center; text-decoration:none; cursor:pointer; transition:all 0.3s ease; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.03); color:rgba(255,255,255,0.5); margin-bottom:10px; }
        .success-dl-btn:hover { border-color:rgba(255,60,30,0.3); color:rgba(255,255,255,0.8); }

        .success-food-btn { display:block; width:100%; padding:16px; border-radius:14px; font-family:var(--font-display); font-size:16px; font-weight:700; letter-spacing:2px; text-transform:uppercase; text-align:center; text-decoration:none; cursor:pointer; background:linear-gradient(135deg,#ff3020,#ff6040); color:#fff; box-shadow:0 0 30px rgba(255,50,30,0.3); transition:all 0.4s ease; border:none; margin-bottom:10px; }
        .success-food-btn:hover { box-shadow:0 0 50px rgba(255,50,30,0.5),0 8px 35px rgba(255,50,30,0.3); transform:translateY(-2px); }

        .success-dash-btn { display:block; width:100%; padding:12px; border-radius:14px; font-family:var(--font-display); font-size:13px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; text-align:center; text-decoration:none; cursor:pointer; transition:all 0.3s ease; border:1px solid rgba(255,255,255,0.1); background:transparent; color:rgba(255,255,255,0.4); }
        .success-dash-btn:hover { border-color:rgba(255,60,30,0.4); color:var(--accent-orange); }

        @media (max-width:600px) {
          .success-title { font-size:26px; letter-spacing:2px; }
          .success-team-number { font-size:38px; letter-spacing:4px; }
          .success-card { padding:24px 20px; }
          .success-qr img { width:150px; height:150px; }
          .success-btn-row { flex-direction:column; }
        }
      `}</style>

      <div className="success-wrapper">
        <div className="success-container">

          {/* Check Icon */}
          <div className="success-check">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className="success-title">Registration Successful!</div>
          <div className="success-subtitle">Your team has been registered for {EVENT_CONFIG.eventName}</div>

          {/* Main Card */}
          <div className="success-card">
            <div className="success-card-inner">
              <div className="success-team-label">Your Team Number</div>
              <div className="success-team-number">{team.team_number}</div>

              {/* QR Code */}
              {qrImage !== "" && (
                <>
                  <div className="success-qr-wrap">
                    <div className="success-qr">
                      <img src={qrImage} alt="QR Code" />
                    </div>
                  </div>
                  <div className="success-qr-hint">Scan this QR code at the venue entrance</div>
                </>
              )}

              <div className="success-divider" />

              {/* Details */}
              <div className="success-detail-row">
                <span className="success-detail-label">Project</span>
                <span className="success-detail-value">{team.project_title}</span>
              </div>
              <div className="success-detail-row">
                <span className="success-detail-label">Technologies</span>
                <span className="success-detail-value">{(team.technologies || []).join(", ")}</span>
              </div>
              <div className="success-detail-row">
                <span className="success-detail-label">Team Size</span>
                <span className="success-detail-value">{members.length} members</span>
              </div>

              <div className="success-divider" />

              {/* Members */}
              <div className="success-members-label">Team Members</div>
              {members.map(function (m, i) {
                return (
                  <div key={i} className="success-member">
                    <span className="success-member-name">{m.is_leader ? "👑 " : ""}{m.member_name}</span>
                    <span className="success-member-roll">{m.member_roll_number}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="success-actions">
            <div className="success-btn-row">
              <button onClick={copyTeamNumber} className={`success-copy-btn ${copied ? "copied" : ""}`}>
                {copied ? "✓ Copied!" : "📋 Copy Number"}
              </button>
              <button onClick={shareWhatsApp} className="success-wa-btn">
                💬 Share WhatsApp
              </button>
            </div>

            {qrImage !== "" && (
              <a href={qrImage} download="team-qr-code.png" className="success-dl-btn">
                ⬇ Download QR Code
              </a>
            )}

            <Link href={"/food-selection/" + team.team_number} className="success-food-btn">
              🍔 Select Snacks & Beverages
            </Link>

            <Link href={"/team-info/" + team.team_number} className="success-dash-btn">
              View Team Dashboard →
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}