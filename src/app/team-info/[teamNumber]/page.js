"use client"
import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { EVENT_CONFIG } from "@/config/formFields"
import DashboardSidebar from "@/components/DashboardSidebar"

export default function TeamInfoPage() {
  var params = useParams()
  var router = useRouter()
  var teamNumber = params.teamNumber

  var [team, setTeam] = useState(null)
  var [members, setMembers] = useState([])
  var [loading, setLoading] = useState(true)
  var [loggedInRoll, setLoggedInRoll] = useState("")
  var [currentMember, setCurrentMember] = useState(null)
  var [isLeader, setIsLeader] = useState(false)
  var [tab, setTab] = useState("team")
  var [milestones, setMilestones] = useState([])
  var [foodStats, setFoodStats] = useState({ done: 0, total: 7 })
  var [snackCount, setSnackCount] = useState(0)
  var [mentorCount, setMentorCount] = useState(0)
  var [notes, setNotes] = useState([])
  var [newNote, setNewNote] = useState("")
  var [docs, setDocs] = useState([])
  var [docTitle, setDocTitle] = useState("")
  var [docUrl, setDocUrl] = useState("")
  var [docType, setDocType] = useState("other")
  var [contributions, setContributions] = useState([])
  var [activity, setActivity] = useState([])
  var [showWelcome, setShowWelcome] = useState(true)
  var [welcomeFading, setWelcomeFading] = useState(false)
  var [mounted, setMounted] = useState(false)
  var [fullPhoto, setFullPhoto] = useState(null)
  var [confirmMs, setConfirmMs] = useState(null)

  // ===== PHOTO URL HELPER =====
  function getPhotoUrl(roll, college) {
    if (!roll || !college) return null
    return "https://info.aec.edu.in/" + college + "/StudentPhotos/" + roll.replace(/\s/g, "") + ".jpg"
  }

  // ===== LOAD DATA =====
  useEffect(function () {
    var roll = sessionStorage.getItem("ps_roll") || localStorage.getItem("ps_roll")
    if (!roll) { router.push("/login"); return }
    setLoggedInRoll(roll)
    sessionStorage.setItem("ps_team_number", teamNumber)
    localStorage.setItem("ps_team_number", teamNumber)

    async function load() {
      // Team
      var teamRes = await supabase.from("teams").select("*").eq("team_number", teamNumber).single()
      if (!teamRes.data) { setLoading(false); return }
      setTeam(teamRes.data)

      // Members
      var memRes = await supabase.from("team_members").select("*").eq("team_id", teamRes.data.id).order("is_leader", { ascending: false })
      setMembers(memRes.data || [])

      var me = (memRes.data || []).find(function (m) { return m.member_roll_number === roll })
      if (me) { setCurrentMember(me); setIsLeader(me.is_leader || false) }

      // Food stats
      var foodRes = await supabase.from("food_selections").select("day_number").eq("member_roll_number", roll)
      if (foodRes.data) {
        var days = new Set(foodRes.data.map(function (f) { return f.day_number }))
        setFoodStats({ done: days.size, total: 7 })
      }

      // Snack cards
      var snackRes = await supabase.from("snack_cards").select("id").eq("team_id", teamRes.data.id)
      setSnackCount(snackRes.data ? snackRes.data.length : 0)

      // Mentor requests
      var mentorRes = await supabase.from("mentor_requests").select("id").eq("team_id", teamRes.data.id)
      setMentorCount(mentorRes.data ? mentorRes.data.length : 0)

      // Milestones — generate if first visit
      try {
        var msRes = await fetch("/api/milestones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamNumber: teamNumber })
        })
        var msData = await msRes.json()
        if (msData.milestones) setMilestones(msData.milestones)
      } catch (e) {}

      // Notes
      var notesRes = await supabase.from("team_notes").select("*").eq("team_number", teamNumber).order("pinned", { ascending: false }).order("created_at", { ascending: false })
      setNotes(notesRes.data || [])

      // Documents
      var docsRes = await supabase.from("team_documents").select("*").eq("team_number", teamNumber).order("created_at", { ascending: false })
      setDocs(docsRes.data || [])

      // Contributions — build from existing data
      var contribs = []
      for (var mi = 0; mi < (memRes.data || []).length; mi++) {
        var m = memRes.data[mi]
        var mFood = await supabase.from("food_selections").select("day_number").eq("member_roll_number", m.member_roll_number)
        var mSnack = await supabase.from("snack_cards").select("id").eq("member_roll_number", m.member_roll_number)
        contribs.push({
          name: m.member_name,
          roll: m.member_roll_number,
          college: m.member_college,
          isLeader: m.is_leader,
          foodDays: mFood.data ? new Set(mFood.data.map(function (f) { return f.day_number })).size : 0,
          snackCards: mSnack.data ? mSnack.data.length : 0,
        })
      }
      setContributions(contribs)

      setLoading(false)
      setTimeout(function () { setMounted(true) }, 50)
    }

    load()
  }, [teamNumber, router])

  // Welcome auto-fade
  useEffect(function () {
    var t1 = setTimeout(function () { setWelcomeFading(true) }, 8000)
    var t2 = setTimeout(function () { setShowWelcome(false) }, 9000)
    return function () { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  // ===== MILESTONE TOGGLE (leader only) =====
  async function toggleMilestone(ms) {
    if (!isLeader) return
    if (ms.is_done) return
    // Show custom confirmation modal
    setConfirmMs(ms)
  }

  async function confirmMilestone() {
    if (!confirmMs) return
    try {
      await fetch("/api/milestones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestoneId: confirmMs.id, isDone: true, doneBy: loggedInRoll })
      })
      setMilestones(function (prev) {
        return prev.map(function (m) {
          if (m.id === confirmMs.id) return Object.assign({}, m, { is_done: true, done_at: new Date().toISOString() })
          return m
        })
      })
    } catch (e) {}
    setConfirmMs(null)
  }

  // ===== ADD NOTE =====
  async function addNote() {
    if (!newNote.trim() || !currentMember) return
    var { data } = await supabase.from("team_notes").insert({
      team_id: team.id,
      team_number: teamNumber,
      author_roll: loggedInRoll,
      author_name: currentMember.member_name,
      content: newNote.trim(),
      pinned: false
    }).select().single()
    if (data) { setNotes(function (p) { return [data].concat(p) }); setNewNote("") }
  }

  // ===== TOGGLE PIN =====
  async function togglePin(note) {
    if (!isLeader) return
    await supabase.from("team_notes").update({ pinned: !note.pinned }).eq("id", note.id)
    setNotes(function (p) {
      return p.map(function (n) { return n.id === note.id ? Object.assign({}, n, { pinned: !n.pinned }) : n })
        .sort(function (a, b) { return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.created_at) - new Date(a.created_at) })
    })
  }

  // ===== DELETE NOTE =====
  async function deleteNote(note) {
    if (note.author_roll !== loggedInRoll && !isLeader) return
    await supabase.from("team_notes").delete().eq("id", note.id)
    setNotes(function (p) { return p.filter(function (n) { return n.id !== note.id }) })
  }

  // ===== ADD DOCUMENT =====
  async function addDocument() {
    if (!docTitle.trim() || !docUrl.trim() || !currentMember) return
    var { data } = await supabase.from("team_documents").insert({
      team_id: team.id,
      team_number: teamNumber,
      title: docTitle.trim(),
      doc_type: docType,
      url: docUrl.trim(),
      uploaded_by_roll: loggedInRoll,
      uploaded_by_name: currentMember.member_name
    }).select().single()
    if (data) { setDocs(function (p) { return [data].concat(p) }); setDocTitle(""); setDocUrl(""); setDocType("other") }
  }

  // ===== DELETE DOCUMENT =====
  async function deleteDoc(doc) {
    if (doc.uploaded_by_roll !== loggedInRoll && !isLeader) return
    await supabase.from("team_documents").delete().eq("id", doc.id)
    setDocs(function (p) { return p.filter(function (d) { return d.id !== doc.id }) })
  }

  // ===== COMPUTED =====
  var milestoneDone = milestones.filter(function (m) { return m.is_done }).length
  var milestoneTotal = milestones.length
  var milestonePct = milestoneTotal > 0 ? Math.round((milestoneDone / milestoneTotal) * 100) : 0

  var userName = currentMember ? currentMember.member_name : "User"
  var userInitial = currentMember ? currentMember.member_name.charAt(0).toUpperCase() : "?"

  // Next deadline
  var EVENT_START = new Date("2026-05-06T09:00:00+05:30")
  var SCHEDULE = [
    { day: 1, title: "Inauguration & Kickoff", date: "May 6 · Tuesday" },
    { day: 2, title: "Development Sprint 1", date: "May 7 · Wednesday" },
    { day: 3, title: "Development Sprint 2", date: "May 8 · Thursday" },
    { day: 4, title: "Mid-Event Review", date: "May 9 · Friday" },
    { day: 5, title: "Development Sprint 3", date: "May 10 · Saturday" },
    { day: 6, title: "Demo Prep & Dry Run", date: "May 11 · Sunday" },
    { day: 7, title: "Final Demos & Awards", date: "May 12 · Monday" },
  ]

  function getNextDeadline() {
    var now = new Date()
    for (var i = 0; i < SCHEDULE.length; i++) {
      var d = new Date(EVENT_START)
      d.setDate(d.getDate() + i)
      if (d > now) return { day: SCHEDULE[i], date: d }
    }
    return null
  }

  var nextDeadline = getNextDeadline()

  function formatTimeLeft(target) {
    var now = new Date()
    var diff = target - now
    if (diff <= 0) return "Now!"
    var days = Math.floor(diff / 86400000)
    var hrs = Math.floor((diff % 86400000) / 3600000)
    var mins = Math.floor((diff % 3600000) / 60000)
    if (days > 0) return days + "d " + hrs + "h"
    return hrs + "h " + mins + "m"
  }

  function formatDate(d) {
    if (!d) return ""
    var dt = new Date(d)
    var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    return months[dt.getMonth()] + " " + dt.getDate() + ", " + dt.getFullYear()
  }

  function formatTime(d) {
    if (!d) return ""
    var dt = new Date(d)
    var h = dt.getHours()
    var m = dt.getMinutes()
    var ampm = h >= 12 ? "PM" : "AM"
    h = h % 12 || 12
    return h + ":" + (m < 10 ? "0" : "") + m + " " + ampm
  }

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "#000" }}>
        <DashboardSidebar teamNumber={teamNumber} currentMember={currentMember} loggedInRoll={loggedInRoll} isLeader={isLeader} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,#ff3020,#ff6040)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Genos',sans-serif", fontWeight: 900, fontSize: 18, color: "#fff", margin: "0 auto 12px", animation: "pulse 1s ease-in-out infinite" }}>PS</div>
            <div style={{ fontFamily: "'Genos',sans-serif", fontSize: 13, letterSpacing: 3, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>Loading Dashboard</div>
          </div>
        </div>
        <style>{`@keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }`}</style>
      </div>
    )
  }

  if (!team) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "#000" }}>
        <DashboardSidebar teamNumber={teamNumber} currentMember={currentMember} loggedInRoll={loggedInRoll} isLeader={isLeader} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Genos',sans-serif", fontSize: 20, color: "rgba(255,255,255,0.3)" }}>Team Not Found</div>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#000", color: "#fff", fontFamily: "'DM Sans',sans-serif" }}>
      <style jsx>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideR { from{opacity:0;transform:translateX(-24px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideL { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes glowPulse { 0%,100%{box-shadow:0 0 15px rgba(255,48,32,0.08)} 50%{box-shadow:0 0 30px rgba(255,48,32,0.18)} }
        @keyframes borderGlow { 0%,100%{border-color:rgba(255,96,64,0.08)} 50%{border-color:rgba(255,96,64,0.2)} }
        @keyframes countUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

        .anim { opacity:0; animation:fadeUp 0.6s cubic-bezier(0.23,1,0.32,1) forwards; }
        .d1 { animation-delay:0.08s } .d2 { animation-delay:0.16s } .d3 { animation-delay:0.24s }
        .d4 { animation-delay:0.32s } .d5 { animation-delay:0.4s } .d6 { animation-delay:0.48s }
        .d7 { animation-delay:0.56s } .d8 { animation-delay:0.64s }

        /* === GLASS CARDS — premium glassmorphism === */
        .glass {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          backdrop-filter: blur(8px);
          transition: all 0.4s cubic-bezier(0.23,1,0.32,1);
          position: relative;
        }
        .glass::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(255,50,30,0.015) 0%, transparent 50%);
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.4s ease;
        }
        .glass:hover {
          border-color: rgba(255,96,64,0.15);
          background: rgba(255,255,255,0.035);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,96,64,0.05);
          transform: translateY(-2px);
        }
        .glass:hover::after { opacity: 1; }

        .tabcontent { display:none; }
        .tabcontent.on { display:block; animation:tabIn 0.45s cubic-bezier(0.23,1,0.32,1); }
        @keyframes tabIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

        /* === SMOOTH SCROLLBAR === */
        .scroll-area { scroll-behavior:smooth; -webkit-overflow-scrolling:touch; }
        .scroll-area::-webkit-scrollbar { width:5px; }
        .scroll-area::-webkit-scrollbar-track { background:transparent; }
        .scroll-area::-webkit-scrollbar-thumb { background:rgba(255,96,64,0.15); border-radius:10px; }
        .scroll-area::-webkit-scrollbar-thumb:hover { background:rgba(255,96,64,0.3); }

        /* === TOGGLE BUTTONS === */
        .toggle-btn {
          font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500;
          padding:10px 34px; border:none; border-radius:10px; cursor:pointer;
          transition:all 0.35s cubic-bezier(0.23,1,0.32,1);
          color:rgba(255,255,255,0.3); background:transparent;
          position:relative; overflow:hidden;
        }
        .toggle-btn:hover { color:rgba(255,255,255,0.6); background:rgba(255,255,255,0.02); }
        .toggle-btn.on {
          background:linear-gradient(135deg,#ff3020,#ff6040);
          color:#fff;
          box-shadow:0 4px 20px rgba(255,48,32,0.25), 0 0 40px rgba(255,48,32,0.08);
          transform:scale(1.02);
        }

        /* === TECH PILLS === */
        .pill {
          font-size:11px; font-weight:500; padding:6px 15px; border-radius:20px;
          background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05);
          color:rgba(255,255,255,0.45); transition:all 0.3s cubic-bezier(0.23,1,0.32,1);
          display:inline-block; cursor:default;
        }
        .pill:hover {
          border-color:rgba(255,96,64,0.25); color:#ff6040;
          background:rgba(255,96,64,0.04);
          box-shadow:0 0 12px rgba(255,96,64,0.06);
          transform:translateY(-1px);
        }

        /* === SECTION LABEL === */
        .slbl {
          font-family:'Genos',sans-serif; font-size:12px; font-weight:600;
          text-transform:uppercase; letter-spacing:3.5px;
          color:rgba(255,255,255,0.15); margin-bottom:16px;
          position:relative; padding-left:12px;
        }
        .slbl::before {
          content:''; position:absolute; left:0; top:50%; transform:translateY(-50%);
          width:3px; height:12px; border-radius:2px;
          background:linear-gradient(180deg,#ff3020,#ff6040);
          box-shadow:0 0 8px rgba(255,48,32,0.3);
        }

        /* === STAT CARDS === */
        .stat-card {
          padding:22px 18px; text-align:center;
          position:relative; overflow:hidden;
        }
        .stat-card::before {
          content:''; position:absolute; top:0; left:50%; transform:translateX(-50%);
          width:40px; height:2px; border-radius:0 0 2px 2px;
          background:linear-gradient(90deg,transparent,rgba(255,96,64,0.15),transparent);
          opacity:0; transition:all 0.4s;
        }
        .stat-card:hover::before { opacity:1; width:70%; }
        .stat-card:hover .stat-val { color:#ff6040; text-shadow:0 0 20px rgba(255,96,64,0.2); }
        .stat-val {
          font-family:'Genos',sans-serif; font-size:30px; font-weight:700;
          transition:all 0.3s; margin-bottom:4px;
          animation:countUp 0.5s ease forwards;
        }
        .stat-lbl {
          font-size:10px; color:rgba(255,255,255,0.2);
          text-transform:uppercase; letter-spacing:2px; font-weight:500;
        }

        /* === MILESTONE CARDS === */
        .ms-card {
          padding:20px 14px; text-align:center; border-radius:14px;
          background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.07);
          cursor:pointer; transition:all 0.35s cubic-bezier(0.23,1,0.32,1);
          position:relative; overflow:hidden;
        }
        .ms-card::before {
          content:''; position:absolute; inset:0; border-radius:14px;
          background:radial-gradient(circle at 50% 0%, rgba(255,96,64,0.04), transparent 60%);
          opacity:0; transition:opacity 0.4s;
        }
        .ms-card:hover { border-color:rgba(255,255,255,0.08); transform:translateY(-4px); }
        .ms-card:hover::before { opacity:1; }
        .ms-card.done {
          border-color:rgba(255,96,64,0.15);
          background:rgba(255,96,64,0.02);
          animation:borderGlow 3s ease-in-out infinite;
        }
        .ms-card.done:hover {
          border-color:rgba(255,96,64,0.3);
          box-shadow:0 8px 32px rgba(255,48,32,0.1), 0 0 20px rgba(255,48,32,0.05);
          transform:translateY(-6px);
        }
        .ms-icon {
          width:48px; height:48px; margin:0 auto 12px; border-radius:14px;
          display:flex; align-items:center; justify-content:center;
          transition:all 0.35s;
        }
        .ms-card:not(.done) .ms-icon { background:rgba(255,255,255,0.025); }
        .ms-card.done .ms-icon {
          background:linear-gradient(135deg,#ff3020,#ff6040);
          box-shadow:0 4px 16px rgba(255,48,32,0.25);
        }
        .ms-card.done:hover .ms-icon {
          box-shadow:0 6px 24px rgba(255,48,32,0.35);
          transform:scale(1.08);
        }

        /* === MEMBER CARDS === */
        .mem-card {
          padding:22px; position:relative; overflow:hidden;
          transition:all 0.35s cubic-bezier(0.23,1,0.32,1);
        }
        .mem-card:hover {
          transform:translateY(-3px);
          box-shadow:0 12px 40px rgba(0,0,0,0.3);
        }
        .mem-card:hover .mem-av {
          box-shadow:0 4px 16px rgba(255,48,32,0.25);
          transform:scale(1.08);
          border-color:rgba(255,96,64,0.4);
        }
        .mem-av {
          width:42px; height:42px; border-radius:12px;
          background:#0a0a0a;
          border:2px solid rgba(255,96,64,0.25);
          display:flex; align-items:center; justify-content:center;
          font-family:'Genos',sans-serif; font-size:16px; font-weight:700; color:#ff6040;
          transition:all 0.35s; overflow:hidden; flex-shrink:0;
          cursor:pointer;
        }
        .mem-av img {
          width:100%; height:100%; object-fit:cover; border-radius:10px;
        }

        /* === CONTRIBUTION ROW === */
        .contrib-row {
          display:flex; align-items:center; gap:14px; padding:12px 0;
          border-bottom:1px solid rgba(255,255,255,0.02);
          transition:all 0.25s;
        }
        .contrib-row:hover { background:rgba(255,255,255,0.01); padding-left:6px; padding-right:6px; border-radius:8px; }
        .contrib-row:last-child { border-bottom:none; }

        /* === NOTE CARDS === */
        .note-card {
          padding:16px 18px; border-radius:12px;
          background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.07);
          margin-bottom:10px; transition:all 0.3s cubic-bezier(0.23,1,0.32,1);
        }
        .note-card:hover {
          border-color:rgba(255,255,255,0.08);
          background:rgba(255,255,255,0.025);
          transform:translateX(3px);
        }
        .note-card.pinned {
          border-color:rgba(255,96,64,0.18);
          background:rgba(255,96,64,0.02);
          box-shadow:0 0 20px rgba(255,48,32,0.03);
        }
        .note-card.pinned:hover { border-color:rgba(255,96,64,0.3); }

        /* === DOCUMENT CARDS === */
        .doc-card {
          display:flex; align-items:center; gap:16px;
          padding:16px 18px; border-radius:12px;
          background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.07);
          margin-bottom:10px; transition:all 0.3s cubic-bezier(0.23,1,0.32,1);
          cursor:pointer; position:relative; overflow:hidden;
        }
        .doc-card::before {
          content:''; position:absolute; left:0; top:0; bottom:0; width:0;
          background:linear-gradient(180deg,#ff3020,#ff6040);
          transition:width 0.3s; border-radius:12px 0 0 12px;
        }
        .doc-card:hover {
          border-color:rgba(255,96,64,0.18);
          background:rgba(255,255,255,0.03);
          transform:translateX(4px);
          box-shadow:0 4px 20px rgba(0,0,0,0.2);
        }
        .doc-card:hover::before { width:3px; }
        .doc-card:hover .doc-icon { transform:scale(1.1); }
        .doc-icon {
          width:40px; height:40px; border-radius:12px;
          display:flex; align-items:center; justify-content:center;
          transition:all 0.3s; flex-shrink:0;
        }

        /* === INPUTS === */
        .inp {
          width:100%; padding:11px 16px; border-radius:12px;
          border:1px solid rgba(255,255,255,0.05);
          background:rgba(255,255,255,0.025); color:#fff;
          font-family:'DM Sans',sans-serif; font-size:13px;
          outline:none; transition:all 0.3s cubic-bezier(0.23,1,0.32,1);
        }
        .inp:focus {
          border-color:rgba(255,96,64,0.35);
          background:rgba(255,255,255,0.035);
          box-shadow:0 0 20px rgba(255,96,64,0.06);
        }
        .inp::placeholder { color:rgba(255,255,255,0.12); }

        /* === BUTTONS === */
        .btn-primary {
          padding:10px 22px; border-radius:12px; border:none;
          background:linear-gradient(135deg,#ff3020,#ff6040); color:#fff;
          font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600;
          cursor:pointer; transition:all 0.3s cubic-bezier(0.23,1,0.32,1);
          position:relative; overflow:hidden;
        }
        .btn-primary::before {
          content:''; position:absolute; inset:0;
          background:linear-gradient(135deg,rgba(255,255,255,0.15),transparent);
          opacity:0; transition:opacity 0.3s;
        }
        .btn-primary:hover {
          box-shadow:0 6px 24px rgba(255,48,32,0.3), 0 0 40px rgba(255,48,32,0.08);
          transform:translateY(-2px) scale(1.02);
        }
        .btn-primary:hover::before { opacity:1; }
        .btn-primary:active { transform:translateY(0) scale(0.98); }

        .btn-sm {
          padding:6px 14px; border-radius:8px;
          border:1px solid rgba(255,255,255,0.05);
          background:rgba(255,255,255,0.02); color:rgba(255,255,255,0.35);
          font-size:11px; font-family:'DM Sans',sans-serif; font-weight:500;
          cursor:pointer; transition:all 0.25s;
        }
        .btn-sm:hover {
          border-color:rgba(255,96,64,0.2); color:#ff6040;
          background:rgba(255,96,64,0.03);
        }
        .btn-sm.danger:hover {
          border-color:rgba(255,50,50,0.25); color:#ff4040;
          background:rgba(255,50,50,0.03);
        }

        .sel {
          padding:10px 14px; border-radius:12px;
          border:1px solid rgba(255,255,255,0.05);
          background:rgba(255,255,255,0.025); color:#fff;
          font-family:'DM Sans',sans-serif; font-size:12px;
          outline:none; transition:all 0.3s;
        }
        .sel:focus { border-color:rgba(255,96,64,0.3); }

        /* === SCHEDULE === */
        .sched-day {
          display:flex; align-items:flex-start; padding:18px 0;
          border-bottom:1px solid rgba(255,255,255,0.02);
          transition:all 0.25s; position:relative;
        }
        .sched-day:hover { background:rgba(255,255,255,0.008); padding-left:4px; }
        .sched-day:last-child { border-bottom:none; }
        .sched-day.now::before {
          content:''; position:absolute; left:-28px; top:10px; bottom:10px;
          width:3px; border-radius:2px;
          background:linear-gradient(180deg,#ff3020,#ff6040);
          box-shadow:0 0 10px rgba(255,48,32,0.3);
        }

        /* === PROFILE AVATAR === */
        .profile-av {
          width:84px; height:84px; border-radius:22px;
          background:#0a0a0a;
          border:2.5px solid rgba(255,96,64,0.35);
          display:flex; align-items:center; justify-content:center;
          font-family:'Genos',sans-serif; font-size:34px; font-weight:700; color:#ff6040;
          flex-shrink:0; box-shadow:0 8px 32px rgba(255,48,32,0.15);
          transition:all 0.35s;
          animation:glowPulse 3s ease-in-out infinite;
          overflow:hidden; cursor:pointer;
        }
        .profile-av img {
          width:100%; height:100%; object-fit:cover; border-radius:19px;
        }
        .profile-av:hover { transform:scale(1.06); box-shadow:0 12px 40px rgba(255,48,32,0.3); border-color:rgba(255,96,64,0.5); }

        /* === FULLSCREEN PHOTO VIEWER === */
        .photo-overlay {
          position:fixed; inset:0; z-index:9999;
          background:rgba(0,0,0,0.96); backdrop-filter:blur(30px);
          display:flex; align-items:center; justify-content:center;
          flex-direction:column; gap:16px;
          opacity:0; animation:fadeUp 0.3s ease forwards;
          cursor:pointer;
        }
        .photo-overlay img {
          width:280px; height:340px;
          border-radius:16px; border:2px solid rgba(255,96,64,0.3);
          box-shadow:0 20px 80px rgba(255,48,32,0.12), 0 0 100px rgba(0,0,0,0.8);
          object-fit:cover;
          animation:photoZoom 0.4s cubic-bezier(0.23,1,0.32,1) forwards;
          background:#000;
        }
        @keyframes photoZoom { from{transform:scale(0.7);opacity:0} to{transform:scale(1);opacity:1} }
        .photo-overlay-name {
          font-family:'Genos',sans-serif; font-size:24px; font-weight:700;
          color:#fff; letter-spacing:1.5px;
          animation:fadeUp 0.4s ease 0.15s forwards; opacity:0;
        }
        .photo-overlay-roll {
          font-size:13px; color:rgba(255,255,255,0.3); letter-spacing:1px;
          animation:fadeUp 0.4s ease 0.25s forwards; opacity:0;
        }
        .photo-overlay-close {
          position:absolute; top:24px; right:28px;
          width:44px; height:44px; border-radius:50%;
          border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.03);
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; transition:all 0.25s; color:rgba(255,255,255,0.4);
          font-size:20px; font-weight:300;
        }
        .photo-overlay-close:hover { border-color:rgba(255,96,64,0.3); color:#ff6040; background:rgba(255,96,64,0.06); transform:rotate(90deg); }

        /* === CONFIRM MODAL === */
        .confirm-overlay {
          position:fixed; inset:0; z-index:9999;
          background:rgba(0,0,0,0.85); backdrop-filter:blur(16px);
          display:flex; align-items:center; justify-content:center;
          opacity:0; animation:fadeUp 0.25s ease forwards;
        }
        .confirm-box {
          width:380px; max-width:90vw;
          background:#111; border:1px solid rgba(255,96,64,0.15);
          border-radius:20px; padding:32px;
          box-shadow:0 24px 80px rgba(0,0,0,0.6), 0 0 40px rgba(255,48,32,0.05);
          animation:photoZoom 0.3s cubic-bezier(0.23,1,0.32,1) forwards;
          position:relative; overflow:hidden;
        }
        .confirm-box::before {
          content:''; position:absolute; top:0; left:0; right:0; height:2px;
          background:linear-gradient(90deg,#ff3020,#ff6040,transparent);
        }
        .confirm-icon {
          width:52px; height:52px; border-radius:14px;
          background:rgba(255,96,64,0.08); border:1px solid rgba(255,96,64,0.12);
          display:flex; align-items:center; justify-content:center;
          margin:0 auto 20px;
        }
        .confirm-icon svg { display:block; }
        .confirm-title {
          font-family:'Genos',sans-serif; font-size:20px; font-weight:700;
          color:#fff; text-align:center; margin-bottom:8px;
        }
        .confirm-ms-name {
          font-family:'Genos',sans-serif; font-size:16px; font-weight:600;
          color:#ff6040; text-align:center; margin-bottom:14px;
        }
        .confirm-warn {
          font-size:12px; color:rgba(255,255,255,0.3); text-align:center;
          margin-bottom:24px; line-height:1.7;
          padding:12px 16px; border-radius:10px;
          background:rgba(255,96,64,0.04); border:1px solid rgba(255,96,64,0.08);
          display:flex; flex-direction:column; align-items:center; gap:8px;
        }
        .confirm-btns {
          display:flex; gap:10px;
        }
        .confirm-cancel {
          flex:1; padding:12px; border-radius:12px;
          border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.03);
          color:rgba(255,255,255,0.5); font-family:'DM Sans',sans-serif;
          font-size:13px; font-weight:500; cursor:pointer;
          transition:all 0.25s;
        }
        .confirm-cancel:hover { border-color:rgba(255,255,255,0.15); color:#fff; background:rgba(255,255,255,0.05); }
        .confirm-yes {
          flex:1; padding:12px; border-radius:12px; border:none;
          background:linear-gradient(135deg,#ff3020,#ff6040); color:#fff;
          font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600;
          cursor:pointer; transition:all 0.25s;
          box-shadow:0 4px 16px rgba(255,48,32,0.2);
        }
        .confirm-yes:hover { box-shadow:0 6px 24px rgba(255,48,32,0.35); transform:translateY(-1px); }
        .confirm-yes:active { transform:translateY(0); }

        /* === RESPONSIVE === */
        @media(max-width:900px) {
          .ms-grid { grid-template-columns:repeat(3,1fr) !important; }
          .mem-grid { grid-template-columns:repeat(2,1fr) !important; }
        }
        @media(max-width:768px) {
          .ms-grid { grid-template-columns:repeat(2,1fr) !important; }
          .mem-grid { grid-template-columns:1fr !important; }
          .stats-grid { grid-template-columns:repeat(2,1fr) !important; }
          .info-grid { grid-template-columns:1fr !important; }
        }
      `}</style>

      <DashboardSidebar teamNumber={teamNumber} currentMember={currentMember} loggedInRoll={loggedInRoll} isLeader={isLeader} />

      {/* FULLSCREEN PHOTO VIEWER */}
      {fullPhoto && (
        <div className="photo-overlay" onClick={function () { setFullPhoto(null) }}>
          <div className="photo-overlay-close" onClick={function () { setFullPhoto(null) }}>{"\u2715"}</div>
          <img src={fullPhoto.url} alt={fullPhoto.name} onClick={function (e) { e.stopPropagation() }} />
          <div className="photo-overlay-name">{fullPhoto.name}</div>
          <div className="photo-overlay-roll">{fullPhoto.roll}{fullPhoto.college ? " \u00b7 " + fullPhoto.college : ""}</div>
        </div>
      )}

      {/* MILESTONE CONFIRM MODAL */}
      {confirmMs && (
        <div className="confirm-overlay" onClick={function () { setConfirmMs(null) }}>
          <div className="confirm-box" onClick={function (e) { e.stopPropagation() }}>
            <div className="confirm-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff6040" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div className="confirm-title">Complete Milestone?</div>
            <div className="confirm-ms-name">{"\u201c"}{confirmMs.milestone_name}{"\u201d"}</div>
            <div className="confirm-warn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff6040" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span>This action cannot be undone. Once marked as completed, this milestone will be permanently locked.</span>
            </div>
            <div className="confirm-btns">
              <button className="confirm-cancel" onClick={function () { setConfirmMs(null) }}>Cancel</button>
              <button className="confirm-yes" onClick={function () { confirmMilestone() }}>Yes, Complete</button>
            </div>
          </div>
        </div>
      )}

      <div className="scroll-area" style={{ flex: 1, padding: "36px 48px 80px", position: "relative", zIndex: 1, overflowY: "auto", maxHeight: "100vh", scrollBehavior: "smooth", WebkitOverflowScrolling: "touch" }}>

        {/* HEADER */}
        <div className="anim d1" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Genos',sans-serif", fontSize: 28, fontWeight: 600, letterSpacing: 0.5 }}>Dashboard</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {nextDeadline && (
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "#ff6040", fontWeight: 600 }}>{formatTimeLeft(nextDeadline.date)}</span>
                <span>to {nextDeadline.day.title}</span>
              </div>
            )}
            <div style={{ fontFamily: "'Genos',sans-serif", fontSize: 13, fontWeight: 600, color: "#ff6040", background: "rgba(255,96,64,0.07)", border: "1px solid rgba(255,96,64,0.12)", padding: "5px 14px", borderRadius: 20, letterSpacing: 2 }}>{teamNumber}</div>
          </div>
        </div>

        {/* TOGGLE */}
        <div className="anim d2" style={{ display: "flex", marginBottom: 28, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 12, padding: 3, width: "fit-content" }}>
          <button className={"toggle-btn " + (tab === "team" ? "on" : "")} onClick={function () { setTab("team") }}>Team</button>
          <button className={"toggle-btn " + (tab === "you" ? "on" : "")} onClick={function () { setTab("you") }}>You</button>
        </div>

        {/* ============ TEAM TAB ============ */}
        <div className={"tabcontent " + (tab === "team" ? "on" : "")}>

          {/* HERO */}
          <div className="glass anim d3" style={{ padding: "40px 36px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#ff3020,#ff6040,transparent)" }} />
            <div style={{ position: "absolute", top: -100, right: -100, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,48,32,0.03),transparent 70%)", pointerEvents: "none" }} />
            <div style={{ fontFamily: "'Genos',sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: 3, color: "rgba(255,255,255,0.2)", marginBottom: 10 }}>Project</div>
            <h2 style={{ fontFamily: "'Genos',sans-serif", fontSize: 34, fontWeight: 700, lineHeight: 1.2, marginBottom: 14 }}>{team.project_title}</h2>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.45)", maxWidth: 760, marginBottom: 18 }}>{team.project_description}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {(team.technologies || []).map(function (t, i) { return <span key={i} className="pill">{t}</span> })}
            </div>
          </div>

          {/* STATS */}
          <div className="stats-grid anim d4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { val: members.length, label: "Members" },
              { val: foodStats.done + "/" + foodStats.total, label: "Food Days" },
              { val: snackCount, label: "Snack Cards" },
              { val: mentorCount, label: "Mentor Req" },
            ].map(function (s, i) {
              return (
                <div key={i} className="glass stat-card">
                  <div className="stat-val">{s.val}</div>
                  <div className="stat-lbl">{s.label}</div>
                </div>
              )
            })}
          </div>

          {/* PROJECT PROGRESS + MILESTONES */}
          <div className="anim d5" style={{ marginBottom: 24 }}>
            <div className="slbl">Project Progress</div>
            <div className="glass" style={{ padding: 32 }}>
              {/* Progress bar */}
              <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 24 }}>
                <div style={{ fontFamily: "'Genos',sans-serif", fontSize: 38, fontWeight: 700, color: "#ff6040", lineHeight: 1, minWidth: 70 }}>{milestonePct}<span style={{ fontSize: 18, color: "rgba(255,96,64,0.4)" }}>%</span></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                    <span>Completion</span>
                    <strong style={{ color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>{milestoneDone} of {milestoneTotal}</strong>
                  </div>
                  <div style={{ width: "100%", height: 8, background: "rgba(255,255,255,0.035)", borderRadius: 8, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 8, background: "linear-gradient(90deg,#ff3020,#ff6040)", boxShadow: "0 0 10px rgba(255,48,32,0.15)", width: milestonePct + "%", transition: "width 0.6s ease" }} />
                  </div>
                </div>
              </div>

              {/* Milestones grid */}
              <div className="ms-grid" style={{ display: "grid", gridTemplateColumns: "repeat(" + Math.min(milestones.length, 5) + ",1fr)", gap: 10 }}>
                {milestones.map(function (ms, i) {
                  return (
                    <div key={ms.id} className={"ms-card " + (ms.is_done ? "done" : "")} onClick={function () { toggleMilestone(ms) }} style={{ opacity: 0, animation: "fadeUp 0.4s ease forwards", animationDelay: (i * 0.08) + "s" }}>
                      {!ms.is_done && !isLeader && (
                        <div style={{ position: "absolute", top: 6, right: 6 }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        </div>
                      )}
                      <div className="ms-icon">
                        {ms.is_done
                          ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/></svg>
                        }
                      </div>
                      <div style={{ fontFamily: "'Genos',sans-serif", fontSize: 13, fontWeight: 600, color: ms.is_done ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.18)", marginBottom: 3 }}>{ms.milestone_name}</div>
                      <div style={{ fontSize: 9, color: ms.is_done ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.08)" }}>{ms.milestone_description}</div>
                      {ms.is_done && (
                        <div style={{ position: "absolute", bottom: 6, right: 6, width: 16, height: 16, borderRadius: "50%", background: "linear-gradient(135deg,#ff3020,#ff6040)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                      )}
                      {!isLeader && <div style={{ position: "absolute", inset: 0, cursor: "default" }} />}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* TEAM MEMBERS */}
          <div className="anim d6" style={{ marginBottom: 24 }}>
            <div className="slbl">Team Members</div>
            <div className="mem-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
              {members.map(function (m) {
                return (
                  <div key={m.id} className="glass mem-card">
                    {m.is_leader && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#ff3020,#ff6040,transparent)", borderRadius: "16px 16px 0 0" }} />}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                      <div className="mem-av" onClick={function (e) { e.stopPropagation(); var url = getPhotoUrl(m.member_roll_number, m.member_college); if (url) setFullPhoto({ url: url, name: m.member_name, roll: m.member_roll_number, college: m.member_college }) }}>
                        {getPhotoUrl(m.member_roll_number, m.member_college)
                          ? <img src={getPhotoUrl(m.member_roll_number, m.member_college)} alt={m.member_name} onError={function (e) { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex" }} />
                          : null
                        }
                        <span style={{ display: getPhotoUrl(m.member_roll_number, m.member_college) ? "none" : "flex" }}>{m.member_name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <div style={{ fontFamily: "'Genos',sans-serif", fontSize: 16, fontWeight: 600, color: "#fff" }}>{m.member_name}</div>
                        {m.is_leader && <div style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5, color: "#ff6040" }}>Leader</div>}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", gap: 6 }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                        {m.member_roll_number}
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{m.member_branch} {m.member_year ? "· " + m.member_year : ""}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>{m.member_college}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* CONTRIBUTION TRACKER */}
          <div className="anim d7" style={{ marginBottom: 24 }}>
            <div className="slbl">Member Contributions</div>
            <div className="glass" style={{ padding: 24 }}>
              {contributions.map(function (c) {
                var total = c.foodDays + c.snackCards
                return (
                  <div key={c.roll} className="contrib-row">
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: "#0a0a0a", border: "2px solid rgba(255,96,64,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Genos',sans-serif", fontSize: 13, fontWeight: 700, color: "#ff6040", transition: "all 0.3s", flexShrink: 0, overflow: "hidden", cursor: "pointer" }} onClick={function () { var url = getPhotoUrl(c.roll, c.college); if (url) setFullPhoto({ url: url, name: c.name, roll: c.roll, college: c.college }) }}>
                      {getPhotoUrl(c.roll, c.college)
                        ? <img src={getPhotoUrl(c.roll, c.college)} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} onError={function (e) { e.target.style.display = "none" }} />
                        : c.name.charAt(0)
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.7)" }}>{c.name}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.18)" }}>{c.roll}</div>
                    </div>
                    <div style={{ display: "flex", gap: 16, fontSize: 10 }}>
                      <span style={{ color: c.foodDays >= 7 ? "#34d399" : "rgba(255,255,255,0.3)" }}>{c.foodDays}/7 food</span>
                      <span style={{ color: c.snackCards > 0 ? "#60a5fa" : "rgba(255,255,255,0.3)" }}>{c.snackCards} cards</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* TEAM NOTES / CHAT BOARD */}
          <div className="anim d8" style={{ marginBottom: 24 }}>
            <div className="slbl">Team Notes</div>
            <div className="glass" style={{ padding: 24 }}>
              {/* Add note */}
              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                <input className="inp" placeholder="Post a note or link..." value={newNote} onChange={function (e) { setNewNote(e.target.value) }} onKeyDown={function (e) { if (e.key === "Enter") addNote() }} />
                <button className="btn-primary" onClick={addNote}>Post</button>
              </div>
              {/* Notes list */}
              {notes.length === 0 && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.15)", textAlign: "center", padding: 20 }}>No notes yet. Be the first to post!</div>}
              {notes.map(function (n) {
                return (
                  <div key={n.id} className={"note-card " + (n.pinned ? "pinned" : "")}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>{n.author_name}</span>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.15)", marginLeft: 8 }}>{formatDate(n.created_at)} · {formatTime(n.created_at)}</span>
                        {n.pinned && <span style={{ fontSize: 9, color: "#ff6040", marginLeft: 8, fontWeight: 600 }}>PINNED</span>}
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {isLeader && <button className="btn-sm" onClick={function () { togglePin(n) }}>{n.pinned ? "Unpin" : "Pin"}</button>}
                        {(n.author_roll === loggedInRoll || isLeader) && <button className="btn-sm danger" onClick={function () { deleteNote(n) }}>Delete</button>}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>{n.content}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* DOCUMENT VAULT */}
          <div style={{ marginBottom: 24 }}>
            <div className="slbl">Document Vault</div>
            <div className="glass" style={{ padding: 24 }}>
              {/* Add doc */}
              <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                <input className="inp" style={{ flex: 2, minWidth: 140 }} placeholder="Document title" value={docTitle} onChange={function (e) { setDocTitle(e.target.value) }} />
                <input className="inp" style={{ flex: 3, minWidth: 180 }} placeholder="URL (Google Drive, YouTube, etc.)" value={docUrl} onChange={function (e) { setDocUrl(e.target.value) }} />
                <select className="sel" value={docType} onChange={function (e) { setDocType(e.target.value) }}>
                  <option value="ppt">PPT</option>
                  <option value="report">Report</option>
                  <option value="video">Video</option>
                  <option value="demo">Demo</option>
                  <option value="other">Other</option>
                </select>
                <button className="btn-primary" onClick={addDocument}>Add</button>
              </div>
              {docs.length === 0 && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.15)", textAlign: "center", padding: 20 }}>No documents yet. Add your project files!</div>}
              {docs.map(function (d) {
                var typeColors = { ppt: "#ff6040", report: "#60a5fa", video: "#c084fc", demo: "#34d399", other: "rgba(255,255,255,0.3)" }
                return (
                  <div key={d.id} className="doc-card" onClick={function () { window.open(d.url, "_blank") }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(" + (d.doc_type === "ppt" ? "255,96,64" : d.doc_type === "report" ? "96,165,250" : d.doc_type === "video" ? "192,132,252" : d.doc_type === "demo" ? "52,211,153" : "255,255,255") + ",0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: typeColors[d.doc_type] || "#fff" }}>{d.doc_type}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.75)", marginBottom: 2 }}>{d.title}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>by {d.uploaded_by_name} · {formatDate(d.created_at)}</div>
                    </div>
                    {(d.uploaded_by_roll === loggedInRoll || isLeader) && (
                      <button className="btn-sm danger" onClick={function (e) { e.stopPropagation(); deleteDoc(d) }}>Remove</button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* EVENT SCHEDULE */}
          <div style={{ marginBottom: 20 }}>
            <div className="slbl">Event Schedule</div>
            <div className="glass" style={{ padding: 28 }}>
              {SCHEDULE.map(function (s) {
                var eventDate = new Date(EVENT_START)
                eventDate.setDate(eventDate.getDate() + s.day - 1)
                var now = new Date()
                var isPast = eventDate < new Date(now.getFullYear(), now.getMonth(), now.getDate())
                var isToday = eventDate.toDateString() === now.toDateString()
                return (
                  <div key={s.day} className={"sched-day " + (isToday ? "now" : "")}>
                    {isToday && <div style={{ position: "absolute", left: -28, top: 10, bottom: 10, width: 3, borderRadius: 2, background: "linear-gradient(180deg,#ff3020,#ff6040)", boxShadow: "0 0 10px rgba(255,48,32,0.3)" }} />}
                    <div style={{ width: 56, flexShrink: 0, paddingTop: 2 }}>
                      <div style={{ fontFamily: "'Genos',sans-serif", fontSize: 26, fontWeight: 700, color: isToday ? "#ff6040" : isPast ? "rgba(255,96,64,0.3)" : "rgba(255,255,255,0.08)", lineHeight: 1, transition: "all 0.3s" }}>{s.day}</div>
                      <div style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: 1.5, color: isToday ? "rgba(255,96,64,0.4)" : "rgba(255,255,255,0.06)" }}>Day</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: isToday ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.12)", marginBottom: 4 }}>{s.date}</div>
                      <div style={{ fontFamily: "'Genos',sans-serif", fontSize: 16, fontWeight: 600, color: isToday ? "#fff" : isPast ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.25)", transition: "all 0.3s" }}>{s.title}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ============ YOU TAB ============ */}
        <div className={"tabcontent " + (tab === "you" ? "on" : "")}>

          {/* PROFILE HEADER */}
          <div className="glass anim d3" style={{ padding: 36, marginBottom: 20, display: "flex", gap: 24, alignItems: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#ff3020,#ff6040,transparent)" }} />
            <div className="profile-av" onClick={function () { if (currentMember) { var url = getPhotoUrl(currentMember.member_roll_number, currentMember.member_college); if (url) setFullPhoto({ url: url, name: userName, roll: loggedInRoll, college: currentMember.member_college }) } }}>
              {currentMember && getPhotoUrl(currentMember.member_roll_number, currentMember.member_college)
                ? <img src={getPhotoUrl(currentMember.member_roll_number, currentMember.member_college)} alt={userName} onError={function (e) { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex" }} />
                : null
              }
              <span style={{ display: currentMember && getPhotoUrl(currentMember.member_roll_number, currentMember.member_college) ? "none" : "flex" }}>{userInitial}</span>
            </div>
            <div>
              <h2 style={{ fontFamily: "'Genos',sans-serif", fontSize: 30, fontWeight: 700, marginBottom: 4 }}>{userName}</h2>
              {isLeader && <div style={{ display: "inline-block", fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, padding: "3px 10px", borderRadius: 5, background: "rgba(255,96,64,0.08)", border: "1px solid rgba(255,96,64,0.15)", color: "#ff6040", marginBottom: 8 }}>Team Leader</div>}
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", display: "flex", gap: 16 }}>
                <span>{loggedInRoll}</span>
                <span>{teamNumber} · {team.project_title}</span>
              </div>
            </div>
          </div>

          {/* INFO GRID */}
          <div className="info-grid anim d4" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 28 }}>
            {[
              { label: "Email", value: currentMember ? currentMember.member_email || (currentMember.member_roll_number + "@outlook.com") : "" },
              { label: "Phone", value: currentMember ? currentMember.member_phone || "—" : "" },
              { label: "Branch", value: currentMember ? currentMember.member_branch || "—" : "" },
              { label: "College", value: currentMember ? currentMember.member_college || "—" : "" },
              { label: "Year", value: currentMember ? currentMember.member_year || "—" : "" },
              { label: "Team", value: teamNumber + " · " + (team.project_title || "") },
            ].map(function (info, i) {
              return (
                <div key={i} className="glass" style={{ padding: 18 }}>
                  <div style={{ fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: 2, color: "rgba(255,255,255,0.15)", marginBottom: 6 }}>{info.label}</div>
                  <div style={{ fontFamily: "'Genos',sans-serif", fontSize: 16, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>{info.value}</div>
                </div>
              )
            })}
          </div>

          {/* SKILLS (from team technologies) */}
          <div className="anim d5" style={{ marginBottom: 28 }}>
            <div className="slbl">Tech Stack</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {(team.technologies || []).map(function (tech, i) {
                var sizes = ["xl", "lg", "md", "sm"]
                var sz = sizes[Math.min(i, 3)]
                var colors = { xl: "#ff6040", lg: "#60a5fa", md: "#34d399", sm: "rgba(255,255,255,0.3)" }
                var bgs = { xl: "rgba(255,96,64,0.07)", lg: "rgba(96,165,250,0.07)", md: "rgba(52,211,153,0.06)", sm: "rgba(255,255,255,0.03)" }
                var paddings = { xl: "12px 18px", lg: "10px 15px", md: "8px 12px", sm: "6px 10px" }
                var fontSizes = { xl: 16, lg: 13, md: 11.5, sm: 10.5 }
                var textColors = { xl: "rgba(255,255,255,0.8)", lg: "rgba(255,255,255,0.65)", md: "rgba(255,255,255,0.45)", sm: "rgba(255,255,255,0.3)" }
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 12, background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)", padding: paddings[sz], transition: "all 0.25s", cursor: "default" }}>
                    <div style={{ width: sz === "xl" ? 30 : sz === "lg" ? 26 : sz === "md" ? 22 : 18, height: sz === "xl" ? 30 : sz === "lg" ? 26 : sz === "md" ? 22 : 18, borderRadius: 6, background: bgs[sz], display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width={sz === "xl" ? 15 : sz === "lg" ? 13 : 11} height={sz === "xl" ? 15 : sz === "lg" ? 13 : 11} viewBox="0 0 24 24" fill="none" stroke={colors[sz]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                    </div>
                    <span style={{ fontWeight: sz === "xl" ? 600 : 500, fontSize: fontSizes[sz], color: textColors[sz], fontFamily: sz === "xl" ? "'Genos',sans-serif" : "'DM Sans',sans-serif" }}>{tech}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* BIO / ABOUT */}
          <div className="anim d6" style={{ marginBottom: 28 }}>
            <div className="slbl">About</div>
            <div className="glass" style={{ padding: 24 }}>
              <p style={{ fontSize: 13.5, lineHeight: 1.8, color: "rgba(255,255,255,0.45)", maxWidth: 700 }}>
                {team.project_description ? "Working on " + team.project_title + " — " + team.project_description.substring(0, 200) + (team.project_description.length > 200 ? "..." : "") : "Team member at Project Space."}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}