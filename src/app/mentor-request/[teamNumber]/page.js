"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import toast, { Toaster } from "react-hot-toast"
import { createClient } from "@supabase/supabase-js"

var supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

var TECHNOLOGIES = ["Data Specialist","AWS Development","ServiceNow","Google Flutter","Full Stack","VLSI"]
var PRIORITIES = [
  { value:"Low",      color:"#44cc88", bg:"rgba(68,204,136,0.12)",  border:"rgba(68,204,136,0.35)" },
  { value:"Medium",   color:"#ffaa00", bg:"rgba(255,170,0,0.12)",   border:"rgba(255,170,0,0.35)"  },
  { value:"High",     color:"#ff6040", bg:"rgba(255,96,64,0.12)",   border:"rgba(255,96,64,0.35)"  },
  { value:"Critical", color:"#ff2020", bg:"rgba(255,32,32,0.14)",   border:"rgba(255,32,32,0.4)"   },
]

function launchConfetti() {
  var canvas = document.createElement("canvas")
  canvas.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999"
  document.body.appendChild(canvas)
  var ctx = canvas.getContext("2d")
  canvas.width = window.innerWidth; canvas.height = window.innerHeight
  var colors = ["#ff6040","#ffaa00","#44ff88","#4488ff","#ff44cc","#fff","#ffdd44"]
  var particles = Array.from({length:160},function(){
    return {x:canvas.width/2,y:canvas.height*0.4,vx:(Math.random()-0.5)*22,vy:(Math.random()-0.7)*20,size:Math.random()*9+3,color:colors[Math.floor(Math.random()*colors.length)],rot:Math.random()*360,rotV:(Math.random()-0.5)*16,life:1}
  })
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);var alive=false
    particles.forEach(function(p){p.x+=p.vx;p.y+=p.vy;p.vy+=0.5;p.rot+=p.rotV;p.life-=0.013;if(p.life<=0)return;alive=true;ctx.save();ctx.globalAlpha=p.life;ctx.translate(p.x,p.y);ctx.rotate(p.rot*Math.PI/180);ctx.fillStyle=p.color;ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size*0.5);ctx.restore()})
    if(alive)requestAnimationFrame(draw);else{try{document.body.removeChild(canvas)}catch(e){}}
  }
  draw()
}

function StarRating({value, onChange, readonly}) {
  var [hover, setHover] = useState(0)
  return (
    <div style={{display:"flex",gap:4}}>
      {[1,2,3,4,5].map(function(star){
        var filled = star <= (hover || value)
        return (
          <span key={star}
            onMouseEnter={function(){if(!readonly)setHover(star)}}
            onMouseLeave={function(){if(!readonly)setHover(0)}}
            onClick={function(){if(!readonly&&onChange)onChange(star)}}
            style={{fontSize:22,cursor:readonly?"default":"pointer",color:filled?"#ffcc00":"rgba(255,255,255,0.15)",transition:"all 0.15s",transform:filled?"scale(1.15)":"scale(1)",display:"inline-block"}}>★</span>
        )
      })}
    </div>
  )
}

export default function MentorRequestPage() {
  var router = useRouter()
  var params = useParams()
  var teamNumber = params.teamNumber

  var [activeRequest, setActiveRequest] = useState(null)
  var [allRequests, setAllRequests] = useState([])
  var [loading, setLoading] = useState(true)
  var [submitting, setSubmitting] = useState(false)
  var [resolving, setResolving] = useState(null)
  var [technology, setTechnology] = useState("")
  var [issueDescription, setIssueDescription] = useState("")
  var [priority, setPriority] = useState("Medium")
  var [ratings, setRatings] = useState({})
  var [submittingRating, setSubmittingRating] = useState(null)
  var [isLeader, setIsLeader] = useState(false)
  var prevStatusRef = useRef(null)

  var roll = typeof window !== "undefined" ? (sessionStorage.getItem("ps_roll") || localStorage.getItem("ps_roll") || "") : ""
  var teamNumberStored = typeof window !== "undefined" ? (sessionStorage.getItem("ps_team_number") || localStorage.getItem("ps_team_number") || "") : ""

  useEffect(function(){
    if(!teamNumber) return
    // Check if current user is the team leader
    checkLeaderStatus()
    fetchAll()
    var channel = supabaseClient.channel("student-req-"+teamNumber)
      .on("postgres_changes",{event:"*",schema:"public",table:"mentor_requests",filter:"team_number=eq."+teamNumber},function(payload){
        if(payload.new&&payload.new.status==="Accepted"&&prevStatusRef.current==="Pending"){
          launchConfetti()
          toast("🚀 Mentor "+payload.new.assigned_mentor_name+" is on the way!",{duration:6000,style:{background:"linear-gradient(135deg,#ff3020,#ff6040)",color:"#fff",fontWeight:700,fontSize:15}})
        }
        fetchAll()
      })
      .subscribe()
    var poll = setInterval(fetchAll,8000)
    return function(){supabaseClient.removeChannel(channel);clearInterval(poll)}
  },[teamNumber])

  function checkLeaderStatus(){
    // Check if logged-in roll is the leader of this team
    fetch("/api/lookup-student",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({rollNumber:roll})})
      .then(function(r){return r.json()})
      .then(function(data){
        // Also check via team_members table
        fetch("/api/get-team-data",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({rollNumber:roll})})
          .then(function(r){return r.json()})
          .then(function(td){
            if(td.found&&td.members){
              var leader = td.members.find(function(m){return m.is_leader&&m.member_roll_number===roll.toUpperCase()})
              setIsLeader(!!leader)
            }
          }).catch(function(){setIsLeader(false)})
      }).catch(function(){})
  }

  function fetchAll(){
    fetch("/api/mentor-request",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"get_all_for_team",teamNumber:teamNumber})})
      .then(function(r){return r.json()})
      .then(function(data){
        var reqs = data.requests||[]
        var active = reqs.find(function(r){return r.status==="Pending"||r.status==="Accepted"})
        if(active)prevStatusRef.current=active.status
        setActiveRequest(active||null)
        setAllRequests(reqs)
        setLoading(false)
      })
      .catch(function(){setLoading(false)})
  }

  function handleSubmit(){
    if(!isLeader){toast.error("Only team leaders can submit requests");return}
    if(!technology){toast.error("Select a technology");return}
    if(!issueDescription.trim()){toast.error("Describe your issue");return}
    setSubmitting(true)
    fetch("/api/mentor-request",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"submit",teamNumber:teamNumber,technology:technology,issueDescription:issueDescription.trim(),priority:priority,requestedByRoll:roll})})
      .then(function(r){return r.json()})
      .then(function(data){
        if(data.success){toast.success("Request submitted! Mentors notified.");fetchAll();setTechnology("");setIssueDescription("");setPriority("Medium")}
        else toast.error(data.error||"Failed")
        setSubmitting(false)
      })
      .catch(function(){setSubmitting(false)})
  }

  function handleResolve(type){
    if(!activeRequest) return
    setResolving(type)
    fetch("/api/mentor-request",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"resolve",requestId:activeRequest.id,resolveType:type})})
      .then(function(r){return r.json()})
      .then(function(data){
        if(data.success){
          toast.success(type==="self"?"Marked as self-solved! ✋":"Marked as mentor-solved! ✅")
          fetchAll()
        }else toast.error(data.error||"Failed")
        setResolving(null)
      })
      .catch(function(){setResolving(null)})
  }

  function handleRating(requestId, stars){
    setRatings(function(prev){var n=Object.assign({},prev);n[requestId]=stars;return n})
    setSubmittingRating(requestId)
    fetch("/api/mentor-request",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"rate",requestId:requestId,rating:stars})})
      .then(function(r){return r.json()})
      .then(function(data){
        if(data.success)toast.success("Rating submitted!")
        else toast.error("Failed to submit rating")
        setSubmittingRating(null)
        fetchAll()
      })
      .catch(function(){setSubmittingRating(null)})
  }

  var activePri = PRIORITIES.find(function(p){return p.value===(activeRequest&&activeRequest.priority)})||PRIORITIES[1]
  var resolvedReqs = allRequests.filter(function(r){return r.status==="Self Resolved"||r.status==="Mentor Resolved"})

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0a0101 0%,#120202 40%,#0a0202 100%)",fontFamily:"var(--font-primary,'Open Sans',sans-serif)",color:"#fff"}}>
      <Toaster position="top-center" toastOptions={{style:{background:"#1a1a1a",color:"#fff",border:"1px solid rgba(255,60,30,0.3)"}}}/>

      <style jsx>{`
        /* ── header ── */
        .mr-hdr{position:sticky;top:0;z-index:100;background:rgba(8,1,1,0.96);border-bottom:1px solid rgba(255,60,30,0.12);backdrop-filter:blur(24px);padding:14px 40px;display:flex;align-items:center;justify-content:space-between;}
        .mr-back{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:8px 14px;color:rgba(255,255,255,0.45);font-size:12px;cursor:pointer;font-family:inherit;transition:all 0.3s;display:flex;align-items:center;gap:6px;}
        .mr-back:hover{color:#ff6040;border-color:rgba(255,96,64,0.4);}
        .mr-hdr-title{font-size:17px;font-weight:800;letter-spacing:1.5px;color:#fff;}
        .mr-team-chip{padding:6px 16px;border-radius:50px;background:rgba(255,60,30,0.1);border:1px solid rgba(255,60,30,0.25);font-size:13px;font-weight:700;color:#ff8060;letter-spacing:1px;}

        /* ── layout ── */
        .mr-body{padding:32px 40px 80px;}

        /* ── section label ── */
        .mr-sec-label{font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:12px;display:flex;align-items:center;gap:8px;}
        .mr-sec-dot{width:6px;height:6px;border-radius:50%;background:#ff6040;}

        /* ── cards ── */
        .mr-card{border-radius:16px;border:1px solid rgba(255,60,30,0.12);background:rgba(18,4,3,0.8);backdrop-filter:blur(20px);overflow:hidden;position:relative;margin-bottom:28px;}
        .mr-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#ff4020,#ff8040,#ffcc40);}

        /* ── form table ── */
        .mr-ftable{width:100%;border-collapse:collapse;}
        .mr-fth{padding:12px 24px;text-align:left;font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:rgba(255,255,255,0.2);background:rgba(255,255,255,0.02);border-bottom:1px solid rgba(255,255,255,0.05);}
        .mr-ftd-label{padding:18px 24px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.35);border-bottom:1px solid rgba(255,255,255,0.04);vertical-align:top;padding-top:22px;width:180px;white-space:nowrap;}
        .mr-ftd-input{padding:16px 24px;border-bottom:1px solid rgba(255,255,255,0.04);vertical-align:middle;}
        .mr-ftable tr:last-child .mr-ftd-label,.mr-ftable tr:last-child .mr-ftd-input{border-bottom:none;}

        /* ── tech buttons ── */
        .mr-tech-wrap{display:flex;flex-wrap:wrap;gap:8px;}
        .mr-tech-btn{padding:8px 16px;border-radius:8px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.5);font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s;font-family:inherit;}
        .mr-tech-btn:hover{border-color:rgba(255,60,30,0.3);background:rgba(255,60,30,0.06);color:rgba(255,255,255,0.85);transform:translateY(-1px);}
        .mr-tech-btn.on{border-color:rgba(255,60,30,0.5);background:rgba(255,60,30,0.12);color:#fff;box-shadow:0 0 16px rgba(255,50,30,0.2);}

        /* ── textarea ── */
        .mr-textarea{width:100%;padding:12px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);color:#fff;font-size:13px;font-family:inherit;outline:none;resize:vertical;transition:all 0.3s;line-height:1.7;}
        .mr-textarea:focus{border-color:rgba(255,96,64,0.45);background:rgba(255,255,255,0.05);box-shadow:0 0 0 3px rgba(255,96,64,0.08);}
        .mr-textarea::placeholder{color:rgba(255,255,255,0.18);}

        /* ── priority ── */
        .mr-pri-wrap{display:flex;gap:8px;flex-wrap:wrap;}
        .mr-pri-btn{padding:9px 18px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;transition:all 0.2s;font-family:inherit;border:1px solid rgba(255,255,255,0.08);}
        .mr-pri-btn:hover{transform:translateY(-2px);}

        /* ── submit ── */
        .mr-submit-btn{padding:13px 32px;border-radius:11px;border:none;background:linear-gradient(135deg,#ff3020,#ff6040);color:#fff;font-size:13px;font-weight:800;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:all 0.3s;font-family:inherit;box-shadow:0 4px 20px rgba(255,50,30,0.3);}
        .mr-submit-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 30px rgba(255,50,30,0.4);}
        .mr-submit-btn:disabled{opacity:0.4;cursor:not-allowed;transform:none;}

        /* ── member notice ── */
        .mr-member-notice{padding:16px 24px;border-radius:12px;background:rgba(255,170,0,0.06);border:1px solid rgba(255,170,0,0.2);font-size:13px;color:#ffaa00;display:flex;align-items:center;gap:10px;margin-bottom:20px;}

        /* ── active request card ── */
        .mr-active-card{border-radius:16px;border:1px solid rgba(255,60,30,0.15);background:rgba(18,4,3,0.85);overflow:hidden;position:relative;margin-bottom:28px;animation:mrSlideIn 0.4s ease;}
        .mr-active-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#ff4020,#ff8040,#ffcc40);}
        @keyframes mrSlideIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}

        /* ── history table ── */
        .mr-htable{width:100%;border-collapse:collapse;}
        .mr-hth{padding:12px 20px;text-align:left;font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:rgba(255,255,255,0.2);background:rgba(255,255,255,0.02);border-bottom:1px solid rgba(255,255,255,0.05);white-space:nowrap;}
        .mr-htd{padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.03);font-size:13px;color:rgba(255,255,255,0.7);vertical-align:middle;}
        .mr-htr:hover .mr-htd{background:rgba(255,255,255,0.015);}
        .mr-htr:last-child .mr-htd{border-bottom:none;}

        /* ── badges ── */
        .mr-badge{display:inline-block;padding:4px 12px;border-radius:6px;font-size:11px;font-weight:700;white-space:nowrap;}
        .mr-pending{background:rgba(255,170,0,0.12);border:1px solid rgba(255,170,0,0.3);color:#ffaa00;}
        .mr-accepted{background:rgba(68,255,102,0.08);border:1px solid rgba(68,255,102,0.25);color:#44ff66;}
        .mr-resolved{background:rgba(68,136,255,0.08);border:1px solid rgba(68,136,255,0.2);color:#6699ff;}
        .mr-self-res{background:rgba(136,136,136,0.08);border:1px solid rgba(136,136,136,0.15);color:#999;}

        /* ── mentor on way ── */
        .mr-pulse{width:9px;height:9px;border-radius:50%;background:#44ff66;animation:mrPulse 1.2s ease infinite;flex-shrink:0;display:inline-block;}
        @keyframes mrPulse{0%,100%{box-shadow:0 0 0 0 rgba(68,255,136,0.6)}50%{box-shadow:0 0 0 8px rgba(68,255,136,0)}}
        .mr-spinner{width:14px;height:14px;border:2px solid rgba(255,170,0,0.2);border-top-color:#ffaa00;border-radius:50%;animation:mrSpin 0.8s linear infinite;display:inline-block;}
        @keyframes mrSpin{to{transform:rotate(360deg)}}

        /* ── resolve buttons ── */
        .mr-self-btn{padding:10px 20px;border-radius:10px;background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.6);border:1px solid rgba(255,255,255,0.1);font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.3s;}
        .mr-self-btn:hover:not(:disabled){background:rgba(255,255,255,0.1);color:#fff;}
        .mr-msolved-btn{padding:10px 20px;border-radius:10px;background:linear-gradient(135deg,#44cc88,#22aa66);color:#fff;border:none;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.3s;box-shadow:0 3px 14px rgba(68,204,136,0.2);}
        .mr-msolved-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 5px 20px rgba(68,204,136,0.3);}
        .mr-self-btn:disabled,.mr-msolved-btn:disabled{opacity:0.35;cursor:not-allowed;transform:none;}

        @media(max-width:768px){.mr-body{padding:20px 16px 60px}.mr-hdr{padding:12px 16px}.mr-ftd-label{width:120px;padding:14px 16px}.mr-ftd-input{padding:14px 16px}.mr-fth{padding:10px 16px}.mr-hth{padding:10px 14px}.mr-htd{padding:12px 14px}}
      `}</style>

      {/* Header */}
      <div className="mr-hdr">
        <button className="mr-back" onClick={function(){router.back()}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M5 12L11 6M5 12L11 18"/></svg>
          Back
        </button>
        <div className="mr-hdr-title">Mentor Request</div>
        <div className="mr-team-chip">Team {teamNumber}</div>
      </div>

      <div className="mr-body">

        {loading && <div style={{textAlign:"center",padding:"80px 0",color:"rgba(255,255,255,0.25)"}}>Loading...</div>}

        {!loading && (
          <>
            {/* ── MEMBER VIEW NOTICE ── */}
            {!isLeader && (
              <div className="mr-member-notice">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffaa00" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                You are viewing as a team member. Only the team leader can submit mentor requests.
              </div>
            )}

            {/* ── ACTIVE REQUEST ── */}
            {activeRequest && (
              <>
                <div className="mr-sec-label"><div className="mr-sec-dot"/>{activeRequest.status==="Pending"?"Waiting for Mentor":"Mentor Assigned"}</div>
                <div className="mr-active-card">
                  <table className="mr-ftable">
                    <thead>
                      <tr>
                        <th className="mr-fth" style={{width:180}}>Field</th>
                        <th className="mr-fth">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="mr-ftd-label">Technology</td>
                        <td className="mr-ftd-input" style={{fontWeight:700,color:"#fff",fontSize:14}}>{activeRequest.technology}</td>
                      </tr>
                      <tr>
                        <td className="mr-ftd-label">Description</td>
                        <td className="mr-ftd-input" style={{lineHeight:1.6}}>{activeRequest.issue_description}</td>
                      </tr>
                      <tr>
                        <td className="mr-ftd-label">Priority</td>
                        <td className="mr-ftd-input">
                          {(function(){var p=PRIORITIES.find(function(p){return p.value===activeRequest.priority})||PRIORITIES[1];return <span className="mr-badge" style={{color:p.color,background:p.bg,border:"1px solid "+p.border}}>{activeRequest.priority}</span>})()}
                        </td>
                      </tr>
                      <tr>
                        <td className="mr-ftd-label">Status</td>
                        <td className="mr-ftd-input">
                          {activeRequest.status==="Pending"
                            ? <span className="mr-badge mr-pending">⏳ Pending</span>
                            : <span className="mr-badge mr-accepted">✅ Accepted</span>}
                        </td>
                      </tr>
                      <tr>
                        <td className="mr-ftd-label">Mentor</td>
                        <td className="mr-ftd-input">
                          {activeRequest.status==="Pending"
                            ? <span style={{display:"flex",alignItems:"center",gap:10,color:"#ffaa00",fontSize:13}}><div className="mr-spinner"/>Waiting for a mentor to accept...</span>
                            : <span style={{display:"flex",alignItems:"center",gap:10}}><div className="mr-pulse"/><span style={{fontWeight:800,color:"#44ff88",fontSize:15}}>{activeRequest.assigned_mentor_name}</span><span style={{fontSize:12,color:"rgba(255,255,255,0.3)"}}>is on the way 🚀</span></span>}
                        </td>
                      </tr>
                      {isLeader && (
                        <tr>
                          <td className="mr-ftd-label">Close Ticket</td>
                          <td className="mr-ftd-input">
                            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                              <button className="mr-self-btn" disabled={!!resolving} onClick={function(){handleResolve("self")}}>
                                {resolving==="self"?"...":"✋ Self Solved"}
                              </button>
                              <button className="mr-msolved-btn" disabled={!!resolving||activeRequest.status!=="Accepted"} onClick={function(){handleResolve("mentor")}}>
                                {resolving==="mentor"?"...":"✅ Mentor Solved"}
                              </button>
                            </div>
                            {activeRequest.status==="Pending"&&<div style={{fontSize:11,color:"rgba(255,255,255,0.2)",marginTop:8}}>"Mentor Solved" available after mentor accepts</div>}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── NEW REQUEST FORM (leader only, no active request) ── */}
            {!activeRequest && isLeader && (
              <>
                <div className="mr-sec-label"><div className="mr-sec-dot"/>New Mentor Request</div>
                <div className="mr-card">
                  <table className="mr-ftable">
                    <thead>
                      <tr>
                        <th className="mr-fth" style={{width:180}}>Field</th>
                        <th className="mr-fth">Input</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="mr-ftd-label">Technology *</td>
                        <td className="mr-ftd-input">
                          <div className="mr-tech-wrap">
                            {TECHNOLOGIES.map(function(tech){
                              return <button key={tech} type="button" className={"mr-tech-btn "+(technology===tech?"on":"")} onClick={function(){setTechnology(tech)}}>{tech}</button>
                            })}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="mr-ftd-label" style={{paddingTop:22}}>Issue *</td>
                        <td className="mr-ftd-input">
                          <textarea className="mr-textarea" rows={4} placeholder="Describe your issue clearly..." value={issueDescription} onChange={function(e){setIssueDescription(e.target.value)}}/>
                        </td>
                      </tr>
                      <tr>
                        <td className="mr-ftd-label" style={{paddingTop:22}}>Priority *</td>
                        <td className="mr-ftd-input">
                          <div className="mr-pri-wrap">
                            {PRIORITIES.map(function(p){
                              var isOn=priority===p.value
                              return <button key={p.value} type="button" className="mr-pri-btn" onClick={function(){setPriority(p.value)}} style={{color:isOn?p.color:"rgba(255,255,255,0.45)",background:isOn?p.bg:"rgba(255,255,255,0.02)",borderColor:isOn?p.border:"rgba(255,255,255,0.08)",transform:isOn?"translateY(-2px)":"none",boxShadow:isOn?"0 3px 12px "+p.color+"22":"none"}}>{p.value}</button>
                            })}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="mr-ftd-label">Submit</td>
                        <td className="mr-ftd-input">
                          <button className="mr-submit-btn" disabled={submitting||!technology||!issueDescription.trim()} onClick={handleSubmit}>
                            {submitting?"Submitting...":"🚀 Submit Mentor Request"}
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── HISTORY TABLE ── */}
            {resolvedReqs.length > 0 && (
              <>
                <div className="mr-sec-label" style={{marginTop:8}}><div className="mr-sec-dot"/>Ticket History</div>
                <div className="mr-card">
                  <table className="mr-htable">
                    <thead>
                      <tr>
                        <th className="mr-hth">Team</th>
                        <th className="mr-hth">Description</th>
                        <th className="mr-hth">Priority</th>
                        <th className="mr-hth">Status</th>
                        <th className="mr-hth">Mentor</th>
                        <th className="mr-hth">Rating</th>
                        <th className="mr-hth">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resolvedReqs.map(function(req){
                        var p = PRIORITIES.find(function(p){return p.value===req.priority})||PRIORITIES[1]
                        var existingRating = ratings[req.id] || req.rating || 0
                        var canRate = isLeader && req.status==="Mentor Resolved" && !req.rating
                        return (
                          <tr key={req.id} className="mr-htr">
                            <td className="mr-htd"><span style={{fontWeight:700,color:"#fff"}}>Team {req.team_number}</span></td>
                            <td className="mr-htd" style={{maxWidth:200}}>
                              <div style={{overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",lineHeight:1.5}}>{req.issue_description}</div>
                            </td>
                            <td className="mr-htd">
                              <span className="mr-badge" style={{color:p.color,background:p.bg,border:"1px solid "+p.border}}>{req.priority}</span>
                            </td>
                            <td className="mr-htd">
                              {req.status==="Mentor Resolved"
                                ? <span className="mr-badge mr-resolved">Mentor Solved</span>
                                : <span className="mr-badge mr-self-res">Self Solved</span>}
                            </td>
                            <td className="mr-htd" style={{fontSize:12}}>{req.assigned_mentor_name||"—"}</td>
                            <td className="mr-htd">
                              {req.status==="Mentor Resolved"
                                ? canRate
                                  ? <StarRating value={existingRating} onChange={function(stars){handleRating(req.id,stars)}} readonly={submittingRating===req.id}/>
                                  : existingRating>0
                                    ? <StarRating value={existingRating} readonly={true}/>
                                    : <span style={{fontSize:11,color:"rgba(255,255,255,0.25)"}}>—</span>
                                : <span style={{fontSize:11,color:"rgba(255,255,255,0.2)"}}>N/A</span>}
                            </td>
                            <td className="mr-htd" style={{fontSize:11,color:"rgba(255,255,255,0.3)",whiteSpace:"nowrap"}}>
                              {req.resolved_at?new Date(req.resolved_at).toLocaleString([],{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}):"—"}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Empty state for members with no history */}
            {!activeRequest && !isLeader && resolvedReqs.length===0 && (
              <div style={{textAlign:"center",padding:"60px 0",color:"rgba(255,255,255,0.2)"}}>
                <div style={{fontSize:40,marginBottom:12}}>📋</div>
                No mentor requests yet for this team.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}