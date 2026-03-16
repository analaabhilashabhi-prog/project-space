// ── ADD THIS SECTION TO mentor-dashboard-v3.js ──────────────────────────────
// This is the "Approvals" tab content to add to the existing mentor dashboard.
// Steps:
// 1. Add "approvals" to the tabs
// 2. Add pendingMilestones state
// 3. Fetch pending milestones alongside requests
// 4. Render the approvals tab

// ── New state to add ────────────────────────────────────────────────────────
// var [pendingMilestones, setPendingMilestones] = useState([])
// var [approvingMs, setApprovingMs] = useState(null)

// ── Add to fetchRequests (call fetchMilestones separately) ──────────────────
// function fetchMilestones(technology) {
//   fetch("/api/milestones", { method:"POST", headers:{"Content-Type":"application/json"},
//     body: JSON.stringify({ action:"get_pending_for_mentor", technology:technology }) })
//     .then(r => r.json())
//     .then(data => setPendingMilestones(data.milestones || []))
// }

// ── Add to useEffect after fetchRequests call ────────────────────────────────
// fetchMilestones(technology)
// (also call in the realtime channel handler)

// ── handleApprove function to add ───────────────────────────────────────────
// function handleApprove(milestoneId, teamNumber, phase) {
//   setApprovingMs(milestoneId)
//   fetch("/api/milestones", { method:"POST", headers:{"Content-Type":"application/json"},
//     body: JSON.stringify({ action:"approve_milestone", milestoneId, mentorName: mentor.name }) })
//     .then(r => r.json())
//     .then(data => {
//       if (data.success) {
//         toast.success("✅ Milestone approved! +3 credits added to Team " + teamNumber)
//         fetchMilestones(mentor.technology)
//       } else toast.error(data.error || "Failed")
//       setApprovingMs(null)
//     })
//     .catch(() => setApprovingMs(null))
// }

// ── FULL STANDALONE APPROVALS TAB JSX (render when tab === "approvals") ─────

"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import toast, { Toaster } from "react-hot-toast"
import { createClient } from "@supabase/supabase-js"

var supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

var PRIORITY_COLOR  = { Low:"#44cc88", Medium:"#ffaa00", High:"#ff6040", Critical:"#ff2020" }
var PRIORITY_BG     = { Low:"rgba(68,204,136,0.08)", Medium:"rgba(255,170,0,0.08)", High:"rgba(255,96,64,0.08)", Critical:"rgba(255,32,32,0.1)" }
var PRIORITY_BORDER = { Low:"rgba(68,204,136,0.25)", Medium:"rgba(255,170,0,0.25)", High:"rgba(255,96,64,0.25)", Critical:"rgba(255,32,32,0.3)" }

function playSound() {
  try {
    var ctx = new (window.AudioContext || window.webkitAudioContext)()
    ;[[880,0],[660,0.12],[880,0.24]].forEach(function(pair){
      var o=ctx.createOscillator();var g=ctx.createGain();o.connect(g);g.connect(ctx.destination)
      o.frequency.value=pair[0];g.gain.setValueAtTime(0.3,ctx.currentTime+pair[1]);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+pair[1]+0.15)
      o.start(ctx.currentTime+pair[1]);o.stop(ctx.currentTime+pair[1]+0.15)
    })
  } catch(e){}
}

async function requestAndNotify(title, body) {
  try {
    if(!("Notification" in window)) return
    if(Notification.permission==="default") await Notification.requestPermission()
    if(Notification.permission==="granted") {
      var n = new Notification(title,{body,icon:"/images/logo.png",requireInteraction:true})
      n.onclick=function(){window.focus();n.close()}
    }
  } catch(e){}
}

export default function MentorDashboardPage() {
  var router = useRouter()
  var [mentor, setMentor] = useState(null)
  var [requests, setRequests] = useState([])
  var [pendingMilestones, setPendingMilestones] = useState([])
  var [loading, setLoading] = useState(true)
  var [accepting, setAccepting] = useState(null)
  var [approvingMs, setApprovingMs] = useState(null)
  var [tab, setTab] = useState("active")
  var [notifPerm, setNotifPerm] = useState("default")
  var [newFlash, setNewFlash] = useState(false)
  var prevPendingRef = useRef(0)
  var initialLoadRef = useRef(true)

  useEffect(function(){
    var id=sessionStorage.getItem("mentor_id"); var name=sessionStorage.getItem("mentor_name")
    var email=sessionStorage.getItem("mentor_email"); var technology=sessionStorage.getItem("mentor_technology")
    if(!id){router.push("/mentor-login");return}
    var m={id,name,email,technology}; setMentor(m)
    if("Notification" in window) setNotifPerm(Notification.permission)
    fetchRequests(technology,false)
    fetchMilestones(technology)
    var channel = supabaseClient.channel("mentor-dash-"+id)
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"mentor_requests",filter:"technology=eq."+technology},function(){fetchRequests(technology,true)})
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"mentor_requests",filter:"technology=eq."+technology},function(){fetchRequests(technology,false)})
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"team_milestones",filter:"technology=eq."+technology},function(){
        fetchMilestones(technology)
        playSound()
        requestAndNotify("📋 Milestone Submitted!","A team submitted a milestone for review. Check Approvals tab.")
        toast("📋 New milestone to review!",{duration:6000,style:{background:"#ff8800",color:"#fff",fontWeight:700}})
      })
      .subscribe()
    var poll=setInterval(function(){fetchRequests(technology,false);fetchMilestones(technology)},10000)
    return function(){supabaseClient.removeChannel(channel);clearInterval(poll)}
  },[])

  function fetchRequests(technology,withAlert){
    fetch("/api/mentor-request",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"get_for_mentor",technology})})
      .then(function(r){return r.json()})
      .then(function(data){
        var reqs=data.requests||[]
        var pendingNow=reqs.filter(function(r){return r.status==="Pending"}).length
        if(!initialLoadRef.current&&withAlert&&pendingNow>prevPendingRef.current){
          playSound()
          requestAndNotify("🔔 New Mentor Request!","A team needs help with "+technology+". Open dashboard to accept.")
          toast("🚨 New request incoming!",{duration:8000,style:{background:"#ff3020",color:"#fff",fontWeight:700}})
          setNewFlash(true); setTimeout(function(){setNewFlash(false)},4000)
        }
        initialLoadRef.current=false; prevPendingRef.current=pendingNow
        setRequests(reqs); setLoading(false)
      }).catch(function(){setLoading(false)})
  }

  function fetchMilestones(technology){
    fetch("/api/milestones",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"get_pending_for_mentor",technology})})
      .then(function(r){return r.json()})
      .then(function(data){setPendingMilestones(data.milestones||[])})
  }

  async function enableNotifications(){
    var result=await Notification.requestPermission(); setNotifPerm(result)
    if(result==="granted"){toast.success("Push notifications enabled!");playSound()}
    else toast.error("Blocked. Allow notifications in browser settings.")
  }

  function handleAccept(req){
    if(!mentor) return
    setAccepting(req.id)
    fetch("/api/mentor-request",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"accept",requestId:req.id,mentorId:mentor.id,mentorName:mentor.name})})
      .then(function(r){return r.json()})
      .then(function(data){
        if(data.success){toast.success("✅ Accepted! Head to Team "+req.team_number);fetchRequests(mentor.technology,false)}
        else if(data.alreadyAccepted){toast.error("Another mentor was faster!");fetchRequests(mentor.technology,false)}
        else toast.error(data.error||"Failed")
        setAccepting(null)
      }).catch(function(){setAccepting(null)})
  }

  function handleApproveMilestone(ms){
    if(!mentor) return
    setApprovingMs(ms.id)
    fetch("/api/milestones",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"approve_milestone",milestoneId:ms.id,mentorName:mentor.name})})
      .then(function(r){return r.json()})
      .then(function(data){
        if(data.success){
          toast.success("✅ Phase "+ms.phase+" approved! +3 credits added to Team "+ms.team_number)
          fetchMilestones(mentor.technology)
        } else toast.error(data.error||"Failed to approve")
        setApprovingMs(null)
      }).catch(function(){setApprovingMs(null)})
  }

  function handleLogout(){sessionStorage.clear();router.push("/mentor-login")}

  var activeReqs=requests.filter(function(r){return r.status==="Pending"||r.status==="Accepted"})
  var historyReqs=requests.filter(function(r){return r.status==="Self Resolved"||r.status==="Mentor Resolved"})
  var myActive=requests.find(function(r){return r.assigned_mentor_id===(mentor&&mentor.id)&&r.status==="Accepted"})
  var pendingCount=activeReqs.filter(function(r){return r.status==="Pending"}).length
  var isBusy=!!myActive

  if(!mentor) return null

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#060101,#0a0202)",fontFamily:"var(--font-primary,'Open Sans',sans-serif)",color:"#fff"}}>
      <Toaster position="top-right" toastOptions={{style:{background:"#1a1a1a",color:"#fff",border:"1px solid rgba(255,60,30,0.3)"}}}/>

      <style jsx>{`
        .md-hdr{position:sticky;top:0;z-index:100;background:rgba(6,1,1,0.95);border-bottom:1px solid rgba(255,60,30,0.1);backdrop-filter:blur(24px);padding:14px 28px;display:flex;align-items:center;justify-content:space-between;gap:16px;}
        .md-hdr-icon{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#ff3020,#ff6040);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px;color:#fff;}
        .md-hdr-title{font-size:16px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;}
        .md-hdr-right{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
        .md-chip-free{background:rgba(68,204,136,0.08);border:1px solid rgba(68,204,136,0.2);color:#44cc88;}
        .md-chip-busy{background:rgba(255,50,50,0.1);border:1px solid rgba(255,50,50,0.25);color:#ff5555;}
        .md-mentor-chip{padding:6px 14px;border-radius:50px;font-size:12px;font-weight:600;}
        .md-logout{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:8px 14px;color:rgba(255,255,255,0.4);font-size:12px;cursor:pointer;font-family:inherit;transition:all 0.3s;}
        .md-logout:hover{color:#ff6040;border-color:rgba(255,96,64,0.3);}
        .md-notif-btn{padding:6px 14px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.3s;border:none;}
        .md-notif-off{background:rgba(255,170,0,0.1);border:1px solid rgba(255,170,0,0.25);color:#ffaa00;}
        .md-notif-on{background:rgba(68,204,136,0.08);border:1px solid rgba(68,204,136,0.2);color:#44cc88;cursor:default;}
        .md-body{max-width:1000px;margin:0 auto;padding:28px 24px 80px;}
        .md-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:24px;}
        .md-stat{padding:16px;border-radius:14px;border:1px solid rgba(255,255,255,0.05);background:rgba(255,255,255,0.02);text-align:center;}
        .md-stat-num{font-size:28px;font-weight:800;line-height:1;}
        .md-stat-label{font-size:10px;color:rgba(255,255,255,0.3);letter-spacing:1.5px;text-transform:uppercase;margin-top:5px;}
        .md-my-banner{padding:14px 18px;border-radius:12px;border:1px solid rgba(255,96,64,0.2);background:rgba(255,60,30,0.05);margin-bottom:20px;display:flex;align-items:center;gap:12px;}
        .md-pulse{width:9px;height:9px;border-radius:50%;background:#ff6040;animation:mdPulse 1.2s ease infinite;flex-shrink:0;}
        @keyframes mdPulse{0%,100%{box-shadow:0 0 0 0 rgba(255,96,64,0.5)}50%{box-shadow:0 0 0 8px rgba(255,96,64,0)}}
        .md-new-flash{padding:12px 18px;border-radius:12px;background:rgba(255,48,32,0.1);border:1px solid rgba(255,60,30,0.3);margin-bottom:16px;font-size:13px;font-weight:700;color:#ff6040;display:flex;align-items:center;gap:10px;animation:mdFlash 0.5s ease;}
        @keyframes mdFlash{0%,100%{opacity:1}50%{opacity:0.5}}
        .md-tabs{display:flex;gap:4px;margin-bottom:18px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:12px;padding:4px;width:fit-content;}
        .md-tab{padding:9px 20px;border-radius:8px;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;transition:all 0.3s;border:none;background:none;color:rgba(255,255,255,0.3);font-family:inherit;position:relative;}
        .md-tab.on{background:rgba(255,60,30,0.12);color:#ff6040;border:1px solid rgba(255,60,30,0.2);}
        .md-tab-badge{position:absolute;top:-6px;right:-6px;background:#ff3020;color:#fff;font-size:10px;font-weight:800;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;}
        .md-tab-badge-amber{background:#ff8800;}
        .md-table-wrap{border-radius:16px;border:1px solid rgba(255,255,255,0.05);overflow:hidden;}
        .md-table{width:100%;border-collapse:collapse;}
        .md-th{padding:11px 16px;text-align:left;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.25);background:rgba(255,255,255,0.02);border-bottom:1px solid rgba(255,255,255,0.04);white-space:nowrap;}
        .md-td{padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.03);font-size:13px;color:rgba(255,255,255,0.7);vertical-align:middle;}
        .md-tr:hover .md-td{background:rgba(255,255,255,0.012);}
        .md-tr:last-child .md-td{border-bottom:none;}
        .md-badge{display:inline-block;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:700;white-space:nowrap;}
        .md-badge-pending{background:rgba(255,170,0,0.1);border:1px solid rgba(255,170,0,0.25);color:#ffaa00;}
        .md-badge-accepted{background:rgba(68,255,102,0.07);border:1px solid rgba(68,255,102,0.2);color:#44ff66;}
        .md-badge-resolved{background:rgba(136,136,136,0.07);border:1px solid rgba(136,136,136,0.12);color:#888;}
        .md-badge-submitted{background:rgba(255,136,0,0.1);border:1px solid rgba(255,136,0,0.25);color:#ff8800;}
        .md-accept-btn{padding:8px 16px;border-radius:8px;border:none;background:linear-gradient(135deg,#ff3020,#ff6040);color:#fff;font-size:12px;font-weight:700;letter-spacing:1px;cursor:pointer;transition:all 0.3s;font-family:inherit;white-space:nowrap;}
        .md-accept-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 4px 14px rgba(255,50,30,0.35);}
        .md-accept-btn:disabled{opacity:0.35;cursor:not-allowed;}
        .md-approve-btn{padding:8px 16px;border-radius:8px;border:none;background:linear-gradient(135deg,#44cc88,#22aa66);color:#fff;font-size:12px;font-weight:700;cursor:pointer;transition:all 0.3s;font-family:inherit;white-space:nowrap;}
        .md-approve-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 4px 14px rgba(68,204,136,0.3);}
        .md-approve-btn:disabled{opacity:0.35;cursor:not-allowed;}
        .md-empty{text-align:center;padding:60px 20px;color:rgba(255,255,255,0.2);font-size:13px;}
        .md-empty-icon{font-size:38px;margin-bottom:12px;display:block;}
        .md-phase-badge{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:rgba(255,136,0,0.12);border:1px solid rgba(255,136,0,0.3);color:#ff8800;font-size:12px;font-weight:800;}
        @media(max-width:768px){.md-stats{grid-template-columns:repeat(3,1fr)}.md-body{padding:18px 12px 60px}.md-hdr{padding:12px 14px}}
      `}</style>

      {/* Header */}
      <div className="md-hdr">
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div className="md-hdr-icon">PS</div>
          <div>
            <div className="md-hdr-title">Mentor Portal</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:1}}>{mentor.technology}</div>
          </div>
        </div>
        <div className="md-hdr-right">
          {notifPerm==="granted"
            ? <span className="md-notif-btn md-notif-on">🔔 Notifications On</span>
            : <button className="md-notif-btn md-notif-off" onClick={enableNotifications}>🔕 Enable Notifications</button>}
          <div className={"md-mentor-chip "+(isBusy?"md-chip-busy":"md-chip-free")}>
            {isBusy?"🔴 Busy — Team "+myActive.team_number:"✅ "+mentor.name}
          </div>
          <button className="md-logout" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="md-body">
        {/* Stats */}
        <div className="md-stats">
          <div className="md-stat"><div className="md-stat-num" style={{color:"#ffaa00"}}>{pendingCount}</div><div className="md-stat-label">Pending</div></div>
          <div className="md-stat"><div className="md-stat-num" style={{color:"#44ff66"}}>{activeReqs.filter(function(r){return r.status==="Accepted"}).length}</div><div className="md-stat-label">Active</div></div>
          <div className="md-stat"><div className="md-stat-num" style={{color:"#4488ff"}}>{historyReqs.length}</div><div className="md-stat-label">Resolved</div></div>
          <div className="md-stat"><div className="md-stat-num" style={{color:"#ff8800"}}>{pendingMilestones.length}</div><div className="md-stat-label">To Review</div></div>
          <div className="md-stat"><div className="md-stat-num" style={{color:"#ff6040"}}>{requests.length}</div><div className="md-stat-label">Total</div></div>
        </div>

        {myActive&&(
          <div className="md-my-banner">
            <div className="md-pulse"/>
            <div>
              <div style={{fontWeight:800,color:"#fff",fontSize:15}}>Currently with Team {myActive.team_number}</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.35)",marginTop:2}}>{myActive.issue_description}</div>
            </div>
          </div>
        )}

        {newFlash&&<div className="md-new-flash"><span style={{fontSize:20}}>🚨</span>New request incoming!</div>}

        {/* Tabs */}
        <div className="md-tabs">
          <button className={"md-tab "+(tab==="active"?"on":"")} onClick={function(){setTab("active")}}>
            Requests {pendingCount>0&&<span className="md-tab-badge">{pendingCount}</span>}
          </button>
          <button className={"md-tab "+(tab==="approvals"?"on":"")} onClick={function(){setTab("approvals")}}>
            Approvals {pendingMilestones.length>0&&<span className="md-tab-badge md-tab-badge-amber">{pendingMilestones.length}</span>}
          </button>
          <button className={"md-tab "+(tab==="history"?"on":"")} onClick={function(){setTab("history")}}>
            History ({historyReqs.length})
          </button>
        </div>

        {loading&&<div className="md-empty"><span className="md-empty-icon">⏳</span>Loading...</div>}

        {/* REQUESTS TAB */}
        {!loading&&tab==="active"&&(
          activeReqs.length===0
            ? <div className="md-empty"><span className="md-empty-icon">✅</span>No active requests.<br/><span style={{fontSize:12,color:"rgba(255,255,255,0.15)"}}>Sound + notification fires when a new one arrives.</span></div>
            : <div className="md-table-wrap">
                <table className="md-table">
                  <thead><tr>
                    <th className="md-th">Team</th><th className="md-th">Issue</th><th className="md-th">Priority</th>
                    <th className="md-th">Status</th><th className="md-th">Time</th><th className="md-th">Action</th>
                  </tr></thead>
                  <tbody>
                    {activeReqs.map(function(req){
                      var isAcceptedByMe=req.assigned_mentor_id===mentor.id&&req.status==="Accepted"
                      var isAcceptedOther=req.status==="Accepted"&&req.assigned_mentor_id!==mentor.id
                      var isPending=req.status==="Pending"
                      var pc=PRIORITY_COLOR[req.priority]||"#fff"; var pb=PRIORITY_BG[req.priority]; var pbd=PRIORITY_BORDER[req.priority]
                      return (
                        <tr key={req.id} className="md-tr">
                          <td className="md-td"><div style={{fontWeight:800,color:"#fff",fontSize:15}}>Team {req.team_number}</div>{req.requested_by_roll&&<div style={{fontSize:11,color:"rgba(255,255,255,0.25)",marginTop:2}}>{req.requested_by_roll}</div>}</td>
                          <td className="md-td" style={{maxWidth:240}}><div style={{overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",lineHeight:1.5}}>{req.issue_description}</div></td>
                          <td className="md-td"><span className="md-badge" style={{color:pc,background:pb,border:"1px solid "+pbd}}>{req.priority}</span></td>
                          <td className="md-td">{isPending&&<span className="md-badge md-badge-pending">Pending</span>}{req.status==="Accepted"&&<span className="md-badge md-badge-accepted">Accepted</span>}</td>
                          <td className="md-td" style={{fontSize:12,color:"rgba(255,255,255,0.3)",whiteSpace:"nowrap"}}>{new Date(req.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</td>
                          <td className="md-td">
                            {isPending&&!isBusy&&<button className="md-accept-btn" disabled={accepting===req.id} onClick={function(){handleAccept(req)}}>{accepting===req.id?"...":"Accept"}</button>}
                            {isPending&&isBusy&&<span style={{fontSize:11,color:"rgba(255,255,255,0.2)"}}>You're busy</span>}
                            {isAcceptedByMe&&<span style={{fontSize:12,color:"#44ff66",fontWeight:700}}>✅ You</span>}
                            {isAcceptedOther&&<span style={{fontSize:12,color:"#ffaa00",fontWeight:600}}>👤 {req.assigned_mentor_name}</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
        )}

        {/* APPROVALS TAB */}
        {!loading&&tab==="approvals"&&(
          pendingMilestones.length===0
            ? <div className="md-empty"><span className="md-empty-icon">📋</span>No pending milestone approvals.<br/><span style={{fontSize:12,color:"rgba(255,255,255,0.15)"}}>You'll be notified when a team submits a milestone.</span></div>
            : <div className="md-table-wrap">
                <table className="md-table">
                  <thead><tr>
                    <th className="md-th">Team</th><th className="md-th">Phase</th><th className="md-th">Milestone</th>
                    <th className="md-th">Submitted</th><th className="md-th">Action</th>
                  </tr></thead>
                  <tbody>
                    {pendingMilestones.map(function(ms){
                      return (
                        <tr key={ms.id} className="md-tr">
                          <td className="md-td"><div style={{fontWeight:800,color:"#fff",fontSize:15}}>Team {ms.team_number}</div></td>
                          <td className="md-td"><div className="md-phase-badge">{ms.phase}</div></td>
                          <td className="md-td"><div style={{fontWeight:600,color:"#fff"}}>{ms.phase_name}</div><div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:3}}>{ms.technology}</div></td>
                          <td className="md-td" style={{fontSize:12,color:"rgba(255,255,255,0.3)",whiteSpace:"nowrap"}}>{ms.submitted_at?new Date(ms.submitted_at).toLocaleString([],{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}):"—"}</td>
                          <td className="md-td">
                            <button className="md-approve-btn" disabled={approvingMs===ms.id} onClick={function(){handleApproveMilestone(ms)}}>
                              {approvingMs===ms.id?"Approving...":"✅ Approve +3 Credits"}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
        )}

        {/* HISTORY TAB */}
        {!loading&&tab==="history"&&(
          historyReqs.length===0
            ? <div className="md-empty"><span className="md-empty-icon">📋</span>No resolved requests yet</div>
            : <div className="md-table-wrap">
                <table className="md-table">
                  <thead><tr>
                    <th className="md-th">Team</th><th className="md-th">Issue</th><th className="md-th">Priority</th>
                    <th className="md-th">Resolution</th><th className="md-th">Handled By</th><th className="md-th">Resolved At</th>
                  </tr></thead>
                  <tbody>
                    {historyReqs.map(function(req){
                      var pc=PRIORITY_COLOR[req.priority]||"#fff"; var pb=PRIORITY_BG[req.priority]; var pbd=PRIORITY_BORDER[req.priority]
                      return (
                        <tr key={req.id} className="md-tr">
                          <td className="md-td"><div style={{fontWeight:700,color:"#fff"}}>Team {req.team_number}</div></td>
                          <td className="md-td" style={{maxWidth:220}}><div style={{overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{req.issue_description}</div></td>
                          <td className="md-td"><span className="md-badge" style={{color:pc,background:pb,border:"1px solid "+pbd}}>{req.priority}</span></td>
                          <td className="md-td"><span className="md-badge md-badge-resolved">{req.status}</span></td>
                          <td className="md-td" style={{fontSize:12}}>{req.assigned_mentor_name||"—"}</td>
                          <td className="md-td" style={{fontSize:12,color:"rgba(255,255,255,0.3)",whiteSpace:"nowrap"}}>{req.resolved_at?new Date(req.resolved_at).toLocaleString([],{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}):"—"}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
        )}
      </div>
    </div>
  )
}