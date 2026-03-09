"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

var PRIORITY_CONFIG = {
  Low:      { color:"#34d399", bg:"rgba(52,211,153,0.08)",  border:"rgba(52,211,153,0.2)"  },
  Medium:   { color:"#fbbf24", bg:"rgba(251,191,36,0.08)",  border:"rgba(251,191,36,0.2)"  },
  High:     { color:"#ff6040", bg:"rgba(255,96,64,0.08)",   border:"rgba(255,96,64,0.2)"   },
  Critical: { color:"#ff3020", bg:"rgba(255,48,32,0.12)",   border:"rgba(255,48,32,0.3)"   },
}
var STATUS_CONFIG = {
  "Pending":         { color:"#fbbf24", bg:"rgba(251,191,36,0.08)",  border:"rgba(251,191,36,0.2)"  },
  "Self Resolved":   { color:"#34d399", bg:"rgba(52,211,153,0.08)",  border:"rgba(52,211,153,0.2)"  },
  "Mentor Resolved": { color:"#60a5fa", bg:"rgba(96,165,250,0.08)",  border:"rgba(96,165,250,0.2)"  },
}
var TECH_COLORS = {
  "Data Specialist":            { color:"#a78bfa", border:"rgba(167,139,250,0.25)", bg:"rgba(167,139,250,0.06)" },
  "AWS Development with DevOps":{ color:"#fb923c", border:"rgba(251,146,60,0.25)",  bg:"rgba(251,146,60,0.06)"  },
  "SERVICE NOW":                { color:"#38bdf8", border:"rgba(56,189,248,0.25)",  bg:"rgba(56,189,248,0.06)"  },
  "FSD With Flutter":           { color:"#34d399", border:"rgba(52,211,153,0.25)",  bg:"rgba(52,211,153,0.06)"  },
  "FSD With React Native":      { color:"#f472b6", border:"rgba(244,114,182,0.25)", bg:"rgba(244,114,182,0.06)" },
  "VLSI":                       { color:"#fbbf24", border:"rgba(251,191,36,0.25)",  bg:"rgba(251,191,36,0.06)"  },
}

export default function AdminMentorPage() {
  var [requests,   setRequests]   = useState([])
  var [loading,    setLoading]    = useState(true)
  var [filter,     setFilter]     = useState("All")
  var [techFilter, setTechFilter] = useState("All")
  var [search,     setSearch]     = useState("")
  var TECH_TRACKS    = ["All","Data Specialist","AWS Development with DevOps","SERVICE NOW","FSD With Flutter","FSD With React Native","VLSI"]
  var STATUS_FILTERS = ["All","Pending","Self Resolved","Mentor Resolved"]

  useEffect(function(){
    async function load() {
      var { data } = await supabase.from("mentor_requests").select("*").order("created_at", { ascending: false })
      setRequests(data || [])
      setLoading(false)
    }
    load()
  }, [])

  var filtered = requests.filter(function(r){
    if (filter !== "All" && r.status !== filter) return false
    if (techFilter !== "All" && r.technology !== techFilter) return false
    if (search) { var q = search.toLowerCase(); if (!r.team_number.toLowerCase().includes(q) && !r.mentor_name.toLowerCase().includes(q)) return false }
    return true
  })

  var stats = {
    total:     requests.length,
    pending:   requests.filter(function(r){ return r.status==="Pending" }).length,
    selfRes:   requests.filter(function(r){ return r.status==="Self Resolved" }).length,
    mentorRes: requests.filter(function(r){ return r.status==="Mentor Resolved" }).length,
  }

  function formatDate(d) {
    if (!d) return "—"
    return new Date(d).toLocaleDateString("en-IN", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })
  }

  if (loading) {
    return (
      <div style={{ minHeight:"100vh", background:"#000", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ width:48, height:48, borderRadius:12, background:"linear-gradient(135deg,#ff3020,#ff6040)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Aboro',sans-serif", fontWeight:900, fontSize:18, color:"#fff", margin:"0 auto 12px", animation:"pulse 1s ease-in-out infinite" }}>PS</div>
          <div style={{ fontFamily:"'Aboro',sans-serif", fontSize:13, letterSpacing:3, color:"rgba(255,255,255,0.3)", textTransform:"uppercase" }}>Loading</div>
        </div>
        <style>{`@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight:"100vh", background:"#000", color:"#fff", fontFamily:"'Neon',sans-serif" }}>
      <style jsx>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .anim{opacity:0;animation:fadeUp 0.5s cubic-bezier(0.23,1,0.32,1) forwards}
        .d1{animation-delay:0.05s}.d2{animation-delay:0.12s}.d3{animation-delay:0.2s}.d4{animation-delay:0.28s}
        .glass{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:16px;backdrop-filter:blur(8px)}
        .slbl{font-family:'Aboro',sans-serif;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:3.5px;color:rgba(255,255,255,0.15);margin-bottom:14px;position:relative;padding-left:12px}
        .slbl::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:12px;border-radius:2px;background:linear-gradient(180deg,#ff3020,#ff6040)}
        .stat-card{padding:24px 20px;text-align:center;position:relative;overflow:hidden;transition:all 0.3s;border-radius:16px}
        .stat-card:hover{transform:translateY(-3px)}
        .stat-val{font-family:'Aboro',sans-serif;font-size:38px;font-weight:700;margin-bottom:6px;line-height:1}
        .stat-lbl{font-size:10px;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,0.2)}
        .filter-pill{padding:8px 16px;border-radius:20px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.02);font-size:12px;color:rgba(255,255,255,0.35);cursor:pointer;transition:all 0.25s;font-family:'Neon',sans-serif}
        .filter-pill:hover{color:rgba(255,255,255,0.6);border-color:rgba(255,255,255,0.12)}
        .filter-pill.on{border-color:rgba(255,96,64,0.4);background:rgba(255,96,64,0.07);color:#ff6040;font-weight:600}
        .badge{display:inline-flex;align-items:center;padding:4px 12px;border-radius:20px;font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;border:1px solid;white-space:nowrap}
        .tech-badge{display:inline-flex;align-items:center;padding:4px 10px;border-radius:8px;font-size:10px;font-weight:500;border:1px solid;white-space:nowrap}
        table{width:100%;border-collapse:collapse;min-width:860px}
        th{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:2.5px;color:rgba(255,255,255,0.15);padding:16px;text-align:left;white-space:nowrap;border-bottom:1px solid rgba(255,255,255,0.04)}
        td{padding:14px 16px;font-size:13px;color:rgba(255,255,255,0.55);border-top:1px solid rgba(255,255,255,0.04)}
        tr:hover td{background:rgba(255,255,255,0.012)}
        input{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;color:#fff;font-family:'Neon',sans-serif;font-size:13px;outline:none;padding:10px 14px;width:220px;box-sizing:border-box;transition:border 0.25s}
        input:focus{border-color:rgba(255,96,64,0.35)}
        input::placeholder{color:rgba(255,255,255,0.15)}
        .tbl-wrap{overflow-x:auto}
        .scroll-area::-webkit-scrollbar{width:5px}.scroll-area::-webkit-scrollbar-thumb{background:rgba(255,96,64,0.15);border-radius:10px}
        .dot-pulse{width:7px;height:7px;border-radius:50%;background:#fbbf24;display:inline-block;margin-right:7px;animation:pulse 1.5s ease-in-out infinite}
      `}</style>

      <div className="scroll-area" style={{ padding:"40px 52px 80px", overflowY:"auto", maxHeight:"100vh" }}>
        <div className="anim d1" style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:36 }}>
          <div>
            <div style={{ fontFamily:"'Aboro',sans-serif", fontSize:11, textTransform:"uppercase", letterSpacing:3, color:"rgba(255,255,255,0.2)", marginBottom:8 }}>Admin Panel</div>
            <h1 style={{ fontFamily:"'Aboro',sans-serif", fontSize:32, fontWeight:700, marginBottom:4 }}>Mentor Requests</h1>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.25)" }}>All team mentor requests across the event</div>
          </div>
          <div style={{ fontFamily:"'Aboro',sans-serif", fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.3)", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", padding:"6px 16px", borderRadius:20, letterSpacing:2 }}>PROJECT SPACE</div>
        </div>

        <div className="anim d2" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:32 }}>
          {[
            { val:stats.total,     label:"Total",           color:"rgba(255,255,255,0.7)",  bg:"rgba(255,255,255,0.03)", border:"rgba(255,255,255,0.07)" },
            { val:stats.pending,   label:"Pending",         color:"#fbbf24",                bg:"rgba(251,191,36,0.05)",  border:"rgba(251,191,36,0.15)"  },
            { val:stats.selfRes,   label:"Self Resolved",   color:"#34d399",                bg:"rgba(52,211,153,0.05)", border:"rgba(52,211,153,0.15)"  },
            { val:stats.mentorRes, label:"Mentor Resolved", color:"#60a5fa",                bg:"rgba(96,165,250,0.05)", border:"rgba(96,165,250,0.15)"  },
          ].map(function(s,i){
            return (
              <div key={i} className="stat-card" style={{ background:s.bg, border:"1px solid "+s.border }}>
                {i>0&&<div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg,"+s.color+",transparent)", opacity:0.6 }}/>}
                <div className="stat-val" style={{ color:s.color }}>{s.val}</div>
                <div className="stat-lbl">{s.label}</div>
              </div>
            )
          })}
        </div>

        <div className="glass anim d3" style={{ padding:"16px 22px", marginBottom:16, display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
          <span style={{ fontSize:10, textTransform:"uppercase", letterSpacing:2, color:"rgba(255,255,255,0.2)" }}>Status</span>
          {STATUS_FILTERS.map(function(f){ return <button key={f} className={"filter-pill "+(filter===f?"on":"")} onClick={function(){ setFilter(f) }}>{f}</button> })}
          <div style={{ flex:1 }}/>
          <input placeholder="Search team or mentor..." value={search} onChange={function(e){ setSearch(e.target.value) }}/>
        </div>

        <div className="anim d3" style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:28 }}>
          {TECH_TRACKS.map(function(t){
            var tc = TECH_COLORS[t]; var isOn = techFilter===t
            return (
              <button key={t} className={"filter-pill "+(isOn?"on":"")} onClick={function(){ setTechFilter(t) }}
                style={isOn&&tc?{borderColor:tc.border,background:tc.bg,color:tc.color}:{}}>
                {t}
              </button>
            )
          })}
        </div>

        <div className="anim d4">
          <div className="slbl" style={{ marginBottom:16 }}>
            {filtered.length} {filtered.length===1?"Request":"Requests"}
            {(filter!=="All"||techFilter!=="All"||search)&&<span style={{ color:"rgba(255,255,255,0.1)", fontWeight:400 }}> · filtered</span>}
          </div>
          {filtered.length===0 ? (
            <div className="glass" style={{ padding:52, textAlign:"center" }}>
              <div style={{ fontFamily:"'Aboro',sans-serif", fontSize:14, color:"rgba(255,255,255,0.15)", marginBottom:6 }}>No requests found</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.08)" }}>Try adjusting your filters</div>
            </div>
          ) : (
            <div className="glass" style={{ overflow:"hidden" }}>
              <div className="tbl-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th><th>Team ID</th><th>Issue</th><th>Assigned Mentor</th><th>Technology</th><th>Priority</th><th>Status</th><th>Raised</th><th>Resolved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(function(r,i){
                      var pc=PRIORITY_CONFIG[r.priority]||PRIORITY_CONFIG.Medium
                      var sc=STATUS_CONFIG[r.status]||STATUS_CONFIG["Pending"]
                      var tc=TECH_COLORS[r.technology]||{color:"rgba(255,255,255,0.3)",bg:"rgba(255,255,255,0.03)",border:"rgba(255,255,255,0.08)"}
                      return (
                        <tr key={r.id}>
                          <td style={{ color:"rgba(255,255,255,0.18)", fontSize:11 }}>{i+1}</td>
                          <td><span style={{ fontFamily:"'Aboro',sans-serif", fontSize:12, fontWeight:700, color:"#ff6040", background:"rgba(255,96,64,0.07)", border:"1px solid rgba(255,96,64,0.12)", padding:"3px 10px", borderRadius:12 }}>{r.team_number}</span></td>
                          <td style={{ maxWidth:180 }}><div style={{ whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }} title={r.issue_description}>{r.issue_description}</div></td>
                          <td>
                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <div style={{ width:28, height:28, borderRadius:8, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Aboro',sans-serif", fontWeight:700, fontSize:11, color:"rgba(255,255,255,0.35)", flexShrink:0 }}>{r.mentor_name.charAt(0).toUpperCase()}</div>
                              <span style={{ color:"rgba(255,255,255,0.7)", fontWeight:500 }}>{r.mentor_name}</span>
                            </div>
                          </td>
                          <td><span className="tech-badge" style={{ color:tc.color, background:tc.bg, borderColor:tc.border }}>{r.technology}</span></td>
                          <td><span className="badge" style={{ color:pc.color, background:pc.bg, borderColor:pc.border }}>{r.priority}</span></td>
                          <td>
                            <span className="badge" style={{ color:sc.color, background:sc.bg, borderColor:sc.border }}>
                              {r.status==="Pending"&&<span className="dot-pulse"/>}
                              {r.status}
                            </span>
                          </td>
                          <td style={{ color:"rgba(255,255,255,0.2)", fontSize:11, whiteSpace:"nowrap" }}>{formatDate(r.created_at)}</td>
                          <td style={{ color:"rgba(255,255,255,0.2)", fontSize:11, whiteSpace:"nowrap" }}>
                            {r.resolved_at?(<div><div>{formatDate(r.resolved_at)}</div>{r.resolved_by&&<div style={{ fontSize:9, color:"rgba(255,255,255,0.1)", marginTop:2 }}>{r.resolved_by}</div>}</div>):"—"}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}