"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function MentorResolvePage() {
  var params = useParams()
  var requestId = params.requestId

  var [status, setStatus] = useState("loading")
  var [request, setRequest] = useState(null)

  useEffect(function () {
    async function resolve() {
      var res = await supabase.from("mentor_requests").select("*").eq("id", requestId).single()
      if (res.error || !res.data) { setStatus("error"); return }
      setRequest(res.data)

      if (res.data.status === "Mentor Resolved" || res.data.status === "Self Resolved") {
        setStatus("already"); return
      }

      var upd = await supabase.from("mentor_requests").update({
        status: "Mentor Resolved",
        resolved_at: new Date().toISOString(),
        resolved_by: "mentor",
      }).eq("id", requestId)

      setStatus(upd.error ? "error" : "success")
    }
    if (requestId) resolve()
  }, [requestId])

  return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
        .box{animation:fadeUp 0.5s cubic-bezier(0.23,1,0.32,1) forwards}
      `}</style>

      <div className="box" style={{ width: 420, padding: 48, borderRadius: 24, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#ff3020,#ff6040,transparent)" }} />
        <div style={{ fontWeight: 900, fontSize: 13, letterSpacing: 3, color: "rgba(255,255,255,0.15)", marginBottom: 32, textTransform: "uppercase" }}>Project Space</div>

        {status === "loading" && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", animation: "pulse 1s ease-in-out infinite" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>Processing...</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>Updating request status</div>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg,rgba(52,211,153,0.15),rgba(52,211,153,0.05))", border: "1px solid rgba(52,211,153,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#34d399", marginBottom: 10 }}>Issue Marked Resolved</div>
            {request && (
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", lineHeight: 1.8 }}>
                <div>Team <strong style={{ color: "rgba(255,255,255,0.5)" }}>{request.team_number}</strong></div>
                <div style={{ marginTop: 4, color: "rgba(255,255,255,0.2)" }}>{request.issue_description}</div>
              </div>
            )}
            <div style={{ marginTop: 20, fontSize: 11, color: "rgba(255,255,255,0.15)" }}>Status → <strong style={{ color: "#34d399" }}>Mentor Resolved</strong> · Thank you!</div>
          </>
        )}

        {status === "already" && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#fbbf24", marginBottom: 10 }}>Already Resolved</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>This request is already marked as <strong style={{ color: "#fbbf24" }}>{request && request.status}</strong></div>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(255,48,32,0.08)", border: "1px solid rgba(255,48,32,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff6040" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#ff6040", marginBottom: 10 }}>Invalid Link</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Could not find this request. The link may be expired or incorrect.</div>
          </>
        )}
      </div>
    </div>
  )
}