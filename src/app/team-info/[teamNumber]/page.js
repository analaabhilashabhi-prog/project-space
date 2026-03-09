"use client"
import { useEffect, useState } from "react"
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
  var [fullPhoto, setFullPhoto] = useState(null)
  var [confirmMs, setConfirmMs] = useState(null)

  function getPhotoUrl(roll, college) {
    if (!roll || !college) return null
    return "https://info.aec.edu.in/" + college + "/StudentPhotos/" + roll.replace(/\s/g, "") + ".jpg"
  }

  useEffect(function () {
    var roll = sessionStorage.getItem("ps_roll") || localStorage.getItem("ps_roll")
    if (!roll) { router.push("/login"); return }
    setLoggedInRoll(roll)
    sessionStorage.setItem("ps_team_number", teamNumber)
    localStorage.setItem("ps_team_number", teamNumber)

    async function load() {
      var teamRes = await supabase.from("teams").select("*").eq("team_number", teamNumber).single()
      if (!teamRes.data) { setLoading(false); return }
      setTeam(teamRes.data)

      var memRes = await supabase.from("team_members").select("*").eq("team_id", teamRes.data.id).order("is_leader", { ascending: false })
      setMembers(memRes.data || [])

      var me = (memRes.data || []).find(function (m) { return m.member_roll_number === roll })
      if (me) { setCurrentMember(me); setIsLeader(me.is_leader || false) }

      var foodRes = await supabase.from("food_selections").select("day_number").eq("member_roll_number", roll)
      if (foodRes.data) {
        var days = new Set(foodRes.data.map(function (f) { return f.day_number }))
        setFoodStats({ done: days.size, total: 7 })
      }

      var snackRes = await supabase.from("snack_cards").select("id").eq("team_id", teamRes.data.id)
      setSnackCount(snackRes.data ? snackRes.data.length : 0)

      var mentorRes = await supabase.from("mentor_requests").select("id").eq("team_id", teamRes.data.id)
      setMentorCount(mentorRes.data ? mentorRes.data.length : 0)

      try {
        var msRes = await fetch("/api/milestones", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ teamNumber: teamNumber }) })
        var msData = await msRes.json()
        if (msData.milestones) setMilestones(msData.milestones)
      } catch (e) {}

      setLoading(false)
    }
    load()
  }, [teamNumber, router])

  async function toggleMilestone(ms) {
    if (!isLeader || ms.is_done) return
    setConfirmMs(ms)
  }

  async function confirmMilestone() {
    if (!confirmMs) return
    try {
      await fetch("/api/milestones", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ milestoneId: confirmMs.id, isDone: true, doneBy: loggedInRoll }) })
      setMilestones(function (prev) { return prev.map(function (m) { if (m.id === confirmMs.id) return Object.assign({}, m, { is_done: true, done_at: new Date().toISOString() }); return m }) })
    } catch (e) {}
    setConfirmMs(null)
  }

  var milestoneDone = milestones.filter(function (m) { return m.is_done }).length
  var milestoneTotal = milestones.length
  var milestonePct = milestoneTotal > 0 ? Math.round((milestoneDone / milestoneTotal) * 100) : 0
  var userName = currentMember ? currentMember.member_name : "User"
  var userInitial = currentMember ? currentMember.member_name.charAt(0).toUpperCase() : "?"



  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "#000" }}>
        <DashboardSidebar teamNumber={teamNumber} currentMember={currentMember} loggedInRoll={loggedInRoll} isLeader={isLeader} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,#ff3020,#ff6040)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Aboro',sans-serif", fontWeight: 900, fontSize: 18, color: "#fff", margin: "0 auto 12px", animation: "pulse 1s ease-in-out infinite" }}>PS</div>
            <div style={{ fontFamily: "'Aboro',sans-serif", fontSize: 13, letterSpacing: 3, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>Loading Dashboard</div>
          </div>
        </div>
        <style>{`@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}`}</style>
      </div>
    )
  }

  if (!team) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "#000" }}>
        <DashboardSidebar teamNumber={teamNumber} currentMember={currentMember} loggedInRoll={loggedInRoll} isLeader={isLeader} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Aboro',sans-serif", fontSize: 20, color: "rgba(255,255,255,0.3)" }}>Team Not Found</div>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#000", color: "#fff", fontFamily: "'Neon',sans-serif" }}>
      <style jsx>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
        @keyframes glowPulse{0%,100%{box-shadow:0 0 15px rgba(255,48,32,0.08)}50%{box-shadow:0 0 30px rgba(255,48,32,0.18)}}
        @keyframes borderGlow{0%,100%{border-color:rgba(255,96,64,0.08)}50%{border-color:rgba(255,96,64,0.2)}}
        @keyframes countUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes photoZoom{from{transform:scale(0.7);opacity:0}to{transform:scale(1);opacity:1}}
        @keyframes tabIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .anim{opacity:0;animation:fadeUp 0.6s cubic-bezier(0.23,1,0.32,1) forwards}
        .d1{animation-delay:0.08s}.d2{animation-delay:0.16s}.d3{animation-delay:0.24s}.d4{animation-delay:0.32s}.d5{animation-delay:0.4s}.d6{animation-delay:0.48s}
        .glass{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:16px;backdrop-filter:blur(8px);transition:all 0.4s cubic-bezier(0.23,1,0.32,1);position:relative}
        .glass:hover{border-color:rgba(255,96,64,0.15);background:rgba(255,255,255,0.035);box-shadow:0 8px 32px rgba(0,0,0,0.3);transform:translateY(-2px)}
        .tabcontent{display:none}.tabcontent.on{display:block;animation:tabIn 0.45s cubic-bezier(0.23,1,0.32,1)}
        .scroll-area::-webkit-scrollbar{width:5px}.scroll-area::-webkit-scrollbar-thumb{background:rgba(255,96,64,0.15);border-radius:10px}
        .toggle-btn{font-family:'Neon',sans-serif;font-size:13px;font-weight:500;padding:10px 34px;border:none;border-radius:10px;cursor:pointer;transition:all 0.35s cubic-bezier(0.23,1,0.32,1);color:rgba(255,255,255,0.3);background:transparent;position:relative;overflow:hidden}
        .toggle-btn:hover{color:rgba(255,255,255,0.6);background:rgba(255,255,255,0.02)}
        .toggle-btn.on{background:linear-gradient(135deg,#ff3020,#ff6040);color:#fff;box-shadow:0 4px 20px rgba(255,48,32,0.25);transform:scale(1.02)}
        .pill{font-size:11px;font-weight:500;padding:6px 15px;border-radius:20px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);color:rgba(255,255,255,0.45);transition:all 0.3s;display:inline-block;cursor:default}
        .pill:hover{border-color:rgba(255,96,64,0.25);color:#ff6040;background:rgba(255,96,64,0.04);transform:translateY(-1px)}
        .slbl{font-family:'Aboro',sans-serif;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:3.5px;color:rgba(255,255,255,0.15);margin-bottom:16px;position:relative;padding-left:12px}
        .slbl::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:12px;border-radius:2px;background:linear-gradient(180deg,#ff3020,#ff6040);box-shadow:0 0 8px rgba(255,48,32,0.3)}
        .stat-card{padding:22px 18px;text-align:center;position:relative;overflow:hidden}
        .stat-val{font-family:'Aboro',sans-serif;font-size:30px;font-weight:700;transition:all 0.3s;margin-bottom:4px;animation:countUp 0.5s ease forwards}
        .stat-lbl{font-size:10px;color:rgba(255,255,255,0.2);text-transform:uppercase;letter-spacing:2px;font-weight:500}
        .stat-card:hover .stat-val{color:#ff6040}
        .ms-card{padding:20px 14px;text-align:center;border-radius:14px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);cursor:pointer;transition:all 0.35s cubic-bezier(0.23,1,0.32,1);position:relative;overflow:hidden}
        .ms-card:hover{border-color:rgba(255,255,255,0.08);transform:translateY(-4px)}
        .ms-card.done{border-color:rgba(255,96,64,0.15);background:rgba(255,96,64,0.02);animation:borderGlow 3s ease-in-out infinite}
        .ms-card.done:hover{border-color:rgba(255,96,64,0.3);box-shadow:0 8px 32px rgba(255,48,32,0.1);transform:translateY(-6px)}
        .ms-icon{width:48px;height:48px;margin:0 auto 12px;border-radius:14px;display:flex;align-items:center;justify-content:center;transition:all 0.35s}
        .ms-card:not(.done) .ms-icon{background:rgba(255,255,255,0.025)}
        .ms-card.done .ms-icon{background:linear-gradient(135deg,#ff3020,#ff6040);box-shadow:0 4px 16px rgba(255,48,32,0.25)}
        .mem-card{padding:22px;position:relative;overflow:hidden;transition:all 0.35s cubic-bezier(0.23,1,0.32,1)}
        .mem-card:hover{transform:translateY(-3px);box-shadow:0 12px 40px rgba(0,0,0,0.3)}
        .mem-av{width:42px;height:42px;border-radius:12px;background:#0a0a0a;border:2px solid rgba(255,96,64,0.25);display:flex;align-items:center;justify-content:center;font-family:'Aboro',sans-serif;font-size:16px;font-weight:700;color:#ff6040;transition:all 0.35s;overflow:hidden;flex-shrink:0;cursor:pointer}
        .mem-av img{width:100%;height:100%;object-fit:cover;border-radius:10px}

        .profile-av{width:84px;height:84px;border-radius:22px;background:#0a0a0a;border:2.5px solid rgba(255,96,64,0.35);display:flex;align-items:center;justify-content:center;font-family:'Aboro',sans-serif;font-size:34px;font-weight:700;color:#ff6040;flex-shrink:0;box-shadow:0 8px 32px rgba(255,48,32,0.15);transition:all 0.35s;animation:glowPulse 3s ease-in-out infinite;overflow:hidden;cursor:pointer}
        .profile-av img{width:100%;height:100%;object-fit:cover;border-radius:19px}
        .profile-av:hover{transform:scale(1.06);box-shadow:0 12px 40px rgba(255,48,32,0.3);border-color:rgba(255,96,64,0.5)}
        .photo-overlay{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.96);backdrop-filter:blur(30px);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;opacity:0;animation:fadeUp 0.3s ease forwards;cursor:pointer}
        .photo-overlay img{width:280px;height:340px;border-radius:16px;border:2px solid rgba(255,96,64,0.3);object-fit:cover;animation:photoZoom 0.4s cubic-bezier(0.23,1,0.32,1) forwards;background:#000}
        .photo-overlay-close{position:absolute;top:24px;right:28px;width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.25s;color:rgba(255,255,255,0.4);font-size:20px}
        .photo-overlay-close:hover{border-color:rgba(255,96,64,0.3);color:#ff6040;transform:rotate(90deg)}
        .confirm-overlay{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.85);backdrop-filter:blur(16px);display:flex;align-items:center;justify-content:center;opacity:0;animation:fadeUp 0.25s ease forwards}
        .confirm-box{width:380px;max-width:90vw;background:#111;border:1px solid rgba(255,96,64,0.15);border-radius:20px;padding:32px;box-shadow:0 24px 80px rgba(0,0,0,0.6);animation:photoZoom 0.3s cubic-bezier(0.23,1,0.32,1) forwards;position:relative;overflow:hidden}
        .confirm-box::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#ff3020,#ff6040,transparent)}
        @media(max-width:900px){.ms-grid{grid-template-columns:repeat(3,1fr)!important}.mem-grid{grid-template-columns:repeat(2,1fr)!important}}
        @media(max-width:768px){.ms-grid{grid-template-columns:repeat(2,1fr)!important}.mem-grid{grid-template-columns:1fr!important}.stats-grid{grid-template-columns:repeat(2,1fr)!important}.info-grid{grid-template-columns:1fr!important}}
      `}</style>

      <DashboardSidebar teamNumber={teamNumber} currentMember={currentMember} loggedInRoll={loggedInRoll} isLeader={isLeader} />

      {fullPhoto && (
        <div className="photo-overlay" onClick={function(){setFullPhoto(null)}}>
          <div className="photo-overlay-close" onClick={function(){setFullPhoto(null)}}>✕</div>
          <img src={fullPhoto.url} alt={fullPhoto.name} onClick={function(e){e.stopPropagation()}} />
          <div style={{fontFamily:"'Aboro',sans-serif",fontSize:24,fontWeight:700,color:"#fff",letterSpacing:1.5}}>{fullPhoto.name}</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.3)"}}>{fullPhoto.roll}{fullPhoto.college?" · "+fullPhoto.college:""}</div>
        </div>
      )}

      {confirmMs && (
        <div className="confirm-overlay" onClick={function(){setConfirmMs(null)}}>
          <div className="confirm-box" onClick={function(e){e.stopPropagation()}}>
            <div style={{width:52,height:52,borderRadius:14,background:"rgba(255,96,64,0.08)",border:"1px solid rgba(255,96,64,0.12)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff6040" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div style={{fontFamily:"'Aboro',sans-serif",fontSize:20,fontWeight:700,color:"#fff",textAlign:"center",marginBottom:8}}>Complete Milestone?</div>
            <div style={{fontFamily:"'Aboro',sans-serif",fontSize:16,fontWeight:600,color:"#ff6040",textAlign:"center",marginBottom:14}}>"{confirmMs.milestone_name}"</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.3)",textAlign:"center",marginBottom:24,lineHeight:1.7,padding:"12px 16px",borderRadius:10,background:"rgba(255,96,64,0.04)",border:"1px solid rgba(255,96,64,0.08)"}}>
              This action cannot be undone. Once marked as completed, this milestone will be permanently locked.
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={function(){setConfirmMs(null)}} style={{flex:1,padding:12,borderRadius:12,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.03)",color:"rgba(255,255,255,0.5)",fontFamily:"'Neon',sans-serif",fontSize:13,cursor:"pointer"}}>Cancel</button>
              <button onClick={confirmMilestone} style={{flex:1,padding:12,borderRadius:12,border:"none",background:"linear-gradient(135deg,#ff3020,#ff6040)",color:"#fff",fontFamily:"'Neon',sans-serif",fontSize:13,fontWeight:600,cursor:"pointer"}}>Yes, Complete</button>
            </div>
          </div>
        </div>
      )}

      <div className="scroll-area" style={{flex:1,padding:"36px 48px 80px",overflowY:"auto",maxHeight:"100vh"}}>

        <div className="anim d1" style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:32}}>
          <h1 style={{fontFamily:"'Aboro',sans-serif",fontSize:28,fontWeight:600,letterSpacing:0.5}}>Dashboard</h1>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{fontFamily:"'Aboro',sans-serif",fontSize:13,fontWeight:600,color:"#ff6040",background:"rgba(255,96,64,0.07)",border:"1px solid rgba(255,96,64,0.12)",padding:"5px 14px",borderRadius:20,letterSpacing:2}}>{teamNumber}</div>
          </div>
        </div>

        <div className="anim d2" style={{display:"flex",marginBottom:28,background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.04)",borderRadius:12,padding:3,width:"fit-content"}}>
          <button className={"toggle-btn "+(tab==="team"?"on":"")} onClick={function(){setTab("team")}}>Team</button>
          <button className={"toggle-btn "+(tab==="you"?"on":"")} onClick={function(){setTab("you")}}>You</button>
        </div>

        {/* TEAM TAB */}
        <div className={"tabcontent "+(tab==="team"?"on":"")}>

          <div className="glass anim d3" style={{padding:"40px 36px",marginBottom:20,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,#ff3020,#ff6040,transparent)"}}/>
            <div style={{fontFamily:"'Aboro',sans-serif",fontSize:11,textTransform:"uppercase",letterSpacing:3,color:"rgba(255,255,255,0.2)",marginBottom:10}}>Project</div>
            <h2 style={{fontFamily:"'Aboro',sans-serif",fontSize:34,fontWeight:700,lineHeight:1.2,marginBottom:14}}>{team.project_title}</h2>
            <p style={{fontSize:14,lineHeight:1.7,color:"rgba(255,255,255,0.45)",maxWidth:760,marginBottom:18}}>{team.project_description}</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
              {(team.technologies||[]).map(function(t,i){return <span key={i} className="pill">{t}</span>})}
            </div>
          </div>

          <div className="stats-grid anim d4" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
            {[{val:members.length,label:"Members"},{val:foodStats.done+"/"+foodStats.total,label:"Food Days"},{val:snackCount,label:"Snack Cards"},{val:mentorCount,label:"Mentor Req"}].map(function(s,i){
              return <div key={i} className="glass stat-card"><div className="stat-val">{s.val}</div><div className="stat-lbl">{s.label}</div></div>
            })}
          </div>

          <div className="anim d5" style={{marginBottom:24}}>
            <div className="slbl">Project Progress</div>
            <div className="glass" style={{padding:32}}>
              <div style={{display:"flex",alignItems:"center",gap:18,marginBottom:24}}>
                <div style={{fontFamily:"'Aboro',sans-serif",fontSize:38,fontWeight:700,color:"#ff6040",lineHeight:1,minWidth:70}}>{milestonePct}<span style={{fontSize:18,color:"rgba(255,96,64,0.4)"}}>%</span></div>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginBottom:6,display:"flex",justifyContent:"space-between"}}><span>Completion</span><strong style={{color:"rgba(255,255,255,0.5)",fontWeight:500}}>{milestoneDone} of {milestoneTotal}</strong></div>
                  <div style={{width:"100%",height:8,background:"rgba(255,255,255,0.035)",borderRadius:8,overflow:"hidden"}}>
                    <div style={{height:"100%",borderRadius:8,background:"linear-gradient(90deg,#ff3020,#ff6040)",width:milestonePct+"%",transition:"width 0.6s ease"}}/>
                  </div>
                </div>
              </div>
              <div className="ms-grid" style={{display:"grid",gridTemplateColumns:"repeat("+Math.min(milestones.length,5)+",1fr)",gap:10}}>
                {milestones.map(function(ms,i){
                  return (
                    <div key={ms.id} className={"ms-card "+(ms.is_done?"done":"")} onClick={function(){toggleMilestone(ms)}} style={{opacity:0,animation:"fadeUp 0.4s ease forwards",animationDelay:(i*0.08)+"s"}}>
                      {!ms.is_done&&!isLeader&&<div style={{position:"absolute",top:6,right:6}}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>}
                      <div className="ms-icon">
                        {ms.is_done
                          ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/></svg>
                        }
                      </div>
                      <div style={{fontFamily:"'Aboro',sans-serif",fontSize:13,fontWeight:600,color:ms.is_done?"rgba(255,255,255,0.8)":"rgba(255,255,255,0.18)",marginBottom:3}}>{ms.milestone_name}</div>
                      <div style={{fontSize:9,color:ms.is_done?"rgba(255,255,255,0.3)":"rgba(255,255,255,0.08)"}}>{ms.milestone_description}</div>
                      {ms.is_done&&<div style={{position:"absolute",bottom:6,right:6,width:16,height:16,borderRadius:"50%",background:"linear-gradient(135deg,#ff3020,#ff6040)",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>}
                      {!isLeader&&<div style={{position:"absolute",inset:0,cursor:"default"}}/>}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="anim d6" style={{marginBottom:24}}>
            <div className="slbl">Team Members</div>
            <div className="mem-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
              {members.map(function(m){
                return (
                  <div key={m.id} className="glass mem-card">
                    {m.is_leader&&<div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,#ff3020,#ff6040,transparent)",borderRadius:"16px 16px 0 0"}}/>}
                    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                      <div className="mem-av" onClick={function(e){e.stopPropagation();var url=getPhotoUrl(m.member_roll_number,m.member_college);if(url)setFullPhoto({url,name:m.member_name,roll:m.member_roll_number,college:m.member_college})}}>
                        {getPhotoUrl(m.member_roll_number,m.member_college)?<img src={getPhotoUrl(m.member_roll_number,m.member_college)} alt={m.member_name} onError={function(e){e.target.style.display="none";e.target.nextSibling.style.display="flex"}}/>:null}
                        <span style={{display:getPhotoUrl(m.member_roll_number,m.member_college)?"none":"flex"}}>{m.member_name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <div style={{fontFamily:"'Aboro',sans-serif",fontSize:16,fontWeight:600,color:"#fff"}}>{m.member_name}</div>
                        {m.is_leader&&<div style={{fontSize:9,fontWeight:600,textTransform:"uppercase",letterSpacing:1.5,color:"#ff6040"}}>Leader</div>}
                      </div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      <div style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>{m.member_roll_number}</div>
                      <div style={{fontSize:11,color:"rgba(255,255,255,0.25)"}}>{m.member_branch}{m.member_year?" · "+m.member_year:""}</div>
                      <div style={{fontSize:11,color:"rgba(255,255,255,0.2)"}}>{m.member_college}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>

        {/* YOU TAB */}
        <div className={"tabcontent "+(tab==="you"?"on":"")}>
          <div className="glass anim d3" style={{padding:36,marginBottom:20,display:"flex",gap:24,alignItems:"center",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,#ff3020,#ff6040,transparent)"}}/>
            <div className="profile-av" onClick={function(){if(currentMember){var url=getPhotoUrl(currentMember.member_roll_number,currentMember.member_college);if(url)setFullPhoto({url,name:userName,roll:loggedInRoll,college:currentMember.member_college})}}}>
              {currentMember&&getPhotoUrl(currentMember.member_roll_number,currentMember.member_college)?<img src={getPhotoUrl(currentMember.member_roll_number,currentMember.member_college)} alt={userName} onError={function(e){e.target.style.display="none";e.target.nextSibling.style.display="flex"}}/>:null}
              <span style={{display:currentMember&&getPhotoUrl(currentMember.member_roll_number,currentMember.member_college)?"none":"flex"}}>{userInitial}</span>
            </div>
            <div>
              <h2 style={{fontFamily:"'Aboro',sans-serif",fontSize:30,fontWeight:700,marginBottom:4}}>{userName}</h2>
              {isLeader&&<div style={{display:"inline-block",fontSize:9,fontWeight:600,textTransform:"uppercase",letterSpacing:2,padding:"3px 10px",borderRadius:5,background:"rgba(255,96,64,0.08)",border:"1px solid rgba(255,96,64,0.15)",color:"#ff6040",marginBottom:8}}>Team Leader</div>}
              <div style={{fontSize:12,color:"rgba(255,255,255,0.3)",display:"flex",gap:16}}><span>{loggedInRoll}</span><span>{teamNumber} · {team.project_title}</span></div>
            </div>
          </div>

          <div className="info-grid anim d4" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:28}}>
            {[
              {label:"Email",value:currentMember?currentMember.member_email||(currentMember.member_roll_number+"@outlook.com"):""},
              {label:"Phone",value:currentMember?currentMember.member_phone||"—":""},
              {label:"Branch",value:currentMember?currentMember.member_branch||"—":""},
              {label:"College",value:currentMember?currentMember.member_college||"—":""},
              {label:"Year",value:currentMember?currentMember.member_year||"—":""},
              {label:"Team",value:teamNumber+" · "+(team.project_title||"")},
            ].map(function(info,i){
              return (
                <div key={i} className="glass" style={{padding:18}}>
                  <div style={{fontSize:9,fontWeight:500,textTransform:"uppercase",letterSpacing:2,color:"rgba(255,255,255,0.15)",marginBottom:6}}>{info.label}</div>
                  <div style={{fontFamily:"'Aboro',sans-serif",fontSize:16,fontWeight:600,color:"rgba(255,255,255,0.75)"}}>{info.value}</div>
                </div>
              )
            })}
          </div>

          <div className="anim d5" style={{marginBottom:28}}>
            <div className="slbl">Tech Stack</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
              {(team.technologies||[]).map(function(tech,i){
                var sizes=["xl","lg","md","sm"]; var sz=sizes[Math.min(i,3)]
                var colors={xl:"#ff6040",lg:"#60a5fa",md:"#34d399",sm:"rgba(255,255,255,0.3)"}
                var bgs={xl:"rgba(255,96,64,0.07)",lg:"rgba(96,165,250,0.07)",md:"rgba(52,211,153,0.06)",sm:"rgba(255,255,255,0.03)"}
                var paddings={xl:"12px 18px",lg:"10px 15px",md:"8px 12px",sm:"6px 10px"}
                var fontSizes={xl:16,lg:13,md:11.5,sm:10.5}
                return (
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,borderRadius:12,background:"rgba(255,255,255,0.015)",border:"1px solid rgba(255,255,255,0.04)",padding:paddings[sz]}}>
                    <div style={{width:sz==="xl"?30:sz==="lg"?26:sz==="md"?22:18,height:sz==="xl"?30:sz==="lg"?26:sz==="md"?22:18,borderRadius:6,background:bgs[sz],display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <svg width={sz==="xl"?15:sz==="lg"?13:11} height={sz==="xl"?15:sz==="lg"?13:11} viewBox="0 0 24 24" fill="none" stroke={colors[sz]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                    </div>
                    <span style={{fontWeight:sz==="xl"?600:500,fontSize:fontSizes[sz],color:sz==="xl"?"rgba(255,255,255,0.8)":sz==="lg"?"rgba(255,255,255,0.65)":sz==="md"?"rgba(255,255,255,0.45)":"rgba(255,255,255,0.3)",fontFamily:sz==="xl"?"'Aboro',sans-serif":"'Neon',sans-serif"}}>{tech}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="anim d6" style={{marginBottom:28}}>
            <div className="slbl">About</div>
            <div className="glass" style={{padding:24}}>
              <p style={{fontSize:13.5,lineHeight:1.8,color:"rgba(255,255,255,0.45)",maxWidth:700}}>
                {team.project_description?"Working on "+team.project_title+" — "+team.project_description.substring(0,200)+(team.project_description.length>200?"...":""):"Team member at Project Space."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}