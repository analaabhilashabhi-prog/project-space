"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { EVENT_CONFIG } from "@/config/formFields"
import AnimatedBackground from "@/components/AnimatedBackground"

export default function AnnouncementsPage() {
  var [announcements, setAnnouncements] = useState([])
  var [loading, setLoading] = useState(true)
  var router = useRouter()

  useEffect(function () {
    localStorage.setItem("ps_last_seen_announcement", new Date().toISOString())

    fetch("/api/announcements")
      .then(function (res) { return res.json() })
      .then(function (data) {
        if (data.announcements) {
          setAnnouncements(data.announcements)
        }
        setLoading(false)
      })
      .catch(function () {
        setLoading(false)
      })
  }, [])

  function getTypeColor(type) {
    if (type === "alert") return { bg: "rgba(255,50,30,0.1)", border: "rgba(255,50,30,0.3)", text: "#ff6040" }
    if (type === "timing") return { bg: "rgba(255,170,64,0.1)", border: "rgba(255,170,64,0.3)", text: "#ffaa40" }
    if (type === "update") return { bg: "rgba(255,96,64,0.1)", border: "rgba(255,96,64,0.3)", text: "#ff8040" }
    return { bg: "rgba(255,128,64,0.08)", border: "rgba(255,128,64,0.2)", text: "#ff8040" }
  }

  function getTypeIcon(type) {
    if (type === "alert") return "🚨"
    if (type === "timing") return "⏰"
    if (type === "update") return "📢"
    return "ℹ️"
  }

  function formatDate(dateStr) {
    var d = new Date(dateStr + "Z")
    return d.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    })
  }

  return (
    <div className="ps-page">
      <AnimatedBackground />

      <style jsx>{`
        .ann-wrapper { position:relative; z-index:10; min-height:100vh; padding:0 20px 60px; }
        .ann-container { max-width:780px; margin:0 auto; }

        .ann-header { display:flex; align-items:center; justify-content:space-between; padding:20px 0; margin-bottom:8px; opacity:0; animation:psFadeIn 0.6s ease forwards; }
        .ann-logo { display:flex; align-items:center; gap:10px; }
        .ann-logo-icon { width:36px;height:36px; border-radius:10px; background:linear-gradient(135deg,#ff3020,#ff6040); display:flex; align-items:center; justify-content:center; font-family:var(--font-display); font-weight:900; font-size:14px; color:#fff; }
        .ann-logo-text { font-family:var(--font-display); font-size:16px; font-weight:600; color:#fff; letter-spacing:1px; }
        .ann-back { font-family:var(--font-display); font-size:11px; color:rgba(255,255,255,0.35); letter-spacing:1.5px; text-transform:uppercase; padding:6px 14px; border:1px solid rgba(255,60,30,0.15); border-radius:10px; background:transparent; cursor:pointer; transition:all 0.3s ease; }
        .ann-back:hover { border-color:rgba(255,60,30,0.4); color:var(--accent-orange); }

        .ann-title { font-family:var(--font-display); font-size:32px; font-weight:900; color:#fff; text-transform:uppercase; letter-spacing:2px; margin-bottom:6px; opacity:0; animation:psFadeIn 0.6s ease 0.15s forwards; }
        .ann-subtitle { font-size:13px; color:rgba(255,255,255,0.3); margin-bottom:28px; opacity:0; animation:psFadeIn 0.5s ease 0.25s forwards; }

        .ann-list { display:flex; flex-direction:column; gap:16px; }

        .ann-card { padding:24px; border-radius:18px; border:1px solid rgba(255,60,30,0.1); background:linear-gradient(165deg,rgba(35,12,8,0.6),rgba(18,6,4,0.75)); backdrop-filter:blur(12px); opacity:0; animation:psFadeIn 0.6s ease forwards; transition:border-color 0.3s ease; }
        .ann-card:hover { border-color:rgba(255,60,30,0.25); }

        .ann-card-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
        .ann-badge { padding:4px 12px; border-radius:20px; font-family:var(--font-display); font-size:11px; font-weight:600; letter-spacing:1px; text-transform:uppercase; display:inline-flex; align-items:center; gap:5px; }
        .ann-date { font-size:11px; color:rgba(255,255,255,0.25); font-family:var(--font-display); letter-spacing:1px; }

        .ann-card-title { font-family:var(--font-display); font-size:20px; font-weight:700; color:#fff; letter-spacing:1px; margin-bottom:8px; }
        .ann-card-msg { font-size:13px; color:rgba(255,255,255,0.45); line-height:1.7; white-space:pre-wrap; }

        .ann-card-img { margin-top:16px; border-radius:14px; overflow:hidden; border:1px solid rgba(255,60,30,0.1); }
        .ann-card-img img { width:100%; object-fit:contain; display:block; }

        .ann-empty { text-align:center; padding:80px 20px; opacity:0; animation:psFadeIn 0.6s ease 0.3s forwards; }
        .ann-empty-icon { font-size:48px; margin-bottom:16px; display:block; }
        .ann-empty-title { font-family:var(--font-display); font-size:22px; font-weight:700; color:#fff; letter-spacing:1px; margin-bottom:8px; }
        .ann-empty-desc { font-size:13px; color:rgba(255,255,255,0.3); }

        @media (max-width:768px) {
          .ann-title { font-size:24px; }
          .ann-card { padding:18px; }
          .ann-card-title { font-size:17px; }
        }
      `}</style>

      <div className="ann-wrapper">
        <div className="ann-container">

          {/* Header */}
          <div className="ann-header">
            <div className="ann-logo">
              <div className="ann-logo-icon">PS</div>
              <div className="ann-logo-text">{EVENT_CONFIG.eventName}</div>
            </div>
            <button className="ann-back" onClick={function () { router.back() }}>← Back</button>
          </div>

          {/* Title */}
          <div className="ann-title">📢 Announcements</div>
          <div className="ann-subtitle">Stay updated with the latest news and updates from the organizers.</div>

          {/* Content */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <span className="ps-spinner" style={{ width: 32, height: 32, margin: "0 auto" }} />
            </div>
          ) : announcements.length === 0 ? (
            <div className="ann-empty">
              <span className="ann-empty-icon">📭</span>
              <div className="ann-empty-title">No Announcements Yet</div>
              <div className="ann-empty-desc">Check back later for updates from the organizers.</div>
            </div>
          ) : (
            <div className="ann-list">
              {announcements.map(function (a, idx) {
                var tc = getTypeColor(a.type)
                return (
                  <div key={a.id} className="ann-card" style={{ animationDelay: (0.3 + idx * 0.08) + "s" }}>
                    <div className="ann-card-top">
                      <span className="ann-badge" style={{ background: tc.bg, border: "1px solid " + tc.border, color: tc.text }}>
                        {getTypeIcon(a.type)} {a.type ? a.type.charAt(0).toUpperCase() + a.type.slice(1) : "Info"}
                      </span>
                      <span className="ann-date">{formatDate(a.created_at)}</span>
                    </div>
                    <div className="ann-card-title">{a.title}</div>
                    <div className="ann-card-msg">{a.message}</div>
                    {a.image_url && (
                      <div className="ann-card-img">
                        <img src={a.image_url} alt={a.title} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}