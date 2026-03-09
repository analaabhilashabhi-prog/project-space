import { supabase } from "@/lib/supabase"
import { redirect } from "next/navigation"

export async function GET(request) {
  var url = new URL(request.url)
  var id = url.searchParams.get("id")
  var token = url.searchParams.get("token")
  var action = url.searchParams.get("action")

  if (!id || !token) {
    return new Response('<html><body style="background:#000;color:#ff6040;display:flex;align-items:center;justify-content:center;height:100vh;font-family:Arial;font-size:18px;">Invalid link</body></html>', { headers: { "Content-Type": "text/html" } })
  }

  var r = await supabase.from("mentor_requests").select("*").eq("id", id).eq("token", token).single()
  if (r.error || !r.data) {
    return new Response('<html><body style="background:#000;color:#ff6040;display:flex;align-items:center;justify-content:center;height:100vh;font-family:Arial;font-size:18px;">Invalid or expired link</body></html>', { headers: { "Content-Type": "text/html" } })
  }
  if (new Date(r.data.token_expires_at) < new Date()) {
    return new Response('<html><body style="background:#000;color:#fbbf24;display:flex;align-items:center;justify-content:center;height:100vh;font-family:Arial;font-size:18px;">This link has expired (24hr limit)</body></html>', { headers: { "Content-Type": "text/html" } })
  }

  if (action === "coming" && r.data.status === "Pending") {
    await supabase.from("mentor_requests").update({ status: "In Progress" }).eq("id", id)
    await supabase.from("mentor_comments").insert({ request_id: id, author_type: "system", author_name: "System", comment: r.data.mentor_name + " is on the way!" })
    await supabase.from("mentor_request_logs").insert({ request_id: id, action: "Mentor Coming", actor_name: r.data.mentor_name, actor_type: "mentor" })

    var baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    var panelUrl = baseUrl + "/mentor-panel/" + id + "?token=" + token

    return new Response('<html><head><meta charset="utf-8"></head><body style="margin:0;background:#000;font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;">'
      + '<div style="text-align:center;padding:48px;background:#111;border-radius:20px;border:1px solid #222;max-width:420px;">'
      + '<div style="width:64px;height:64px;border-radius:16px;background:linear-gradient(135deg,rgba(52,211,153,0.15),rgba(52,211,153,0.05));border:1px solid rgba(52,211,153,0.2);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>'
      + '<div style="font-size:22px;font-weight:700;color:#34d399;margin-bottom:8px;">You\'re on the way!</div>'
      + '<div style="font-size:14px;color:#888;margin-bottom:6px;">Team ' + r.data.team_number + ' has been notified</div>'
      + '<div style="font-size:12px;color:#555;margin-bottom:24px;">' + r.data.issue_description + '</div>'
      + '<a href="' + panelUrl + '" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#ff3020,#ff6040);color:#fff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:700;">Open Mentor Panel</a>'
      + '</div></body></html>', { headers: { "Content-Type": "text/html" } })
  }

  // Already handled or wrong action — redirect to panel
  var baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  return Response.redirect(baseUrl + "/mentor-panel/" + id + "?token=" + token)
}