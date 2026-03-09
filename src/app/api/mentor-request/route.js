import { supabase } from "@/lib/supabase"
import { Resend } from "resend"

var resend = new Resend(process.env.RESEND_API_KEY)

async function sendEmail(to, subject, html) {
  try {
    var result = await resend.emails.send({
      from: "Project Space <onboarding@resend.dev>",
      to: [to],
      subject: subject,
      html: html,
    })
    console.log("Email sent to:", to, result)
    return true
  } catch (err) {
    console.error("Email failed to " + to + ":", err.message)
    return false
  }
}

// GET — fetch requests for a team or all
export async function GET(request) {
  try {
    var url = new URL(request.url)
    var teamNumber = url.searchParams.get("team_number")
    var mentorId = url.searchParams.get("mentor_id")

    var query = supabase.from("mentor_requests").select("*").order("created_at", { ascending: false })
    if (teamNumber) query = query.eq("team_number", teamNumber)
    if (mentorId) query = query.eq("mentor_id", parseInt(mentorId))

    var res = await query
    return Response.json({ success: true, requests: res.data || [] })
  } catch (error) {
    return Response.json({ error: "Failed to fetch" }, { status: 500 })
  }
}

// POST — create new request + send email
export async function POST(request) {
  try {
    var body = await request.json()
    var { teamNumber, teamId, mentorId, mentorName, mentorEmail, technology, issueDescription, priority, requestedByRoll, requestedByName } = body

    if (!teamNumber || !mentorName || !technology || !issueDescription || !priority) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check for active pending request
    var pendingRes = await supabase
      .from("mentor_requests")
      .select("id")
      .eq("team_number", teamNumber)
      .eq("status", "Pending")

    if (pendingRes.data && pendingRes.data.length > 0) {
      return Response.json({ error: "You already have a pending request. Resolve it first." }, { status: 400 })
    }

    // Insert request
    var insertRes = await supabase.from("mentor_requests").insert({
      team_number: teamNumber,
      team_id: teamId || null,
      mentor_id: mentorId || null,
      mentor_name: mentorName,
      mentor_email: mentorEmail || null,
      technology: technology,
      issue_description: issueDescription,
      priority: priority,
      status: "Pending",
      requested_by_roll: requestedByRoll || null,
      requested_by_name: requestedByName || null,
      created_at: new Date().toISOString(),
    }).select().single()

    if (insertRes.error) {
      console.error("Insert error:", insertRes.error)
      return Response.json({ error: "Failed to create request: " + insertRes.error.message }, { status: 500 })
    }

    var requestData = insertRes.data
    var resolveUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000") + "/mentor-resolve/" + requestData.id

    // Send email to mentor
    try {
      await sendEmail(
        mentorEmail || "harshavardhini@technicalhub.io",
        "[Project Space] Help Request from Team " + teamNumber + " - " + priority + " Priority",
        buildMentorEmail(teamNumber, requestedByName, technology, issueDescription, priority, resolveUrl)
      )
    } catch (emailErr) {
      console.error("Mentor email failed:", emailErr.message)
    }

    // Send confirmation email to student
    try {
      await sendEmail(
        "harshavardhini@technicalhub.io",
        "[Project Space] Mentor Request Submitted - " + mentorName,
        buildStudentEmail(teamNumber, mentorName, technology, issueDescription, priority)
      )
    } catch (emailErr) {
      console.error("Student email failed:", emailErr.message)
    }

    return Response.json({ success: true, request: requestData, mentorName: mentorName })
  } catch (error) {
    console.error("Mentor request error:", error)
    return Response.json({ error: "Internal server error: " + error.message }, { status: 500 })
  }
}

// PUT — update status (self resolve) or add rating
export async function PUT(request) {
  try {
    var body = await request.json()
    var { requestId, action, rating } = body

    if (!requestId) {
      return Response.json({ error: "Request ID required" }, { status: 400 })
    }

    if (action === "self_resolve") {
      var res = await supabase.from("mentor_requests").update({
        status: "Self Resolved",
        resolved_at: new Date().toISOString(),
        resolved_by: "self",
      }).eq("id", requestId).select().single()

      if (res.error) return Response.json({ error: "Failed to update" }, { status: 500 })
      return Response.json({ success: true, request: res.data })
    }

    if (action === "rate") {
      if (!rating || rating < 1 || rating > 5) {
        return Response.json({ error: "Rating must be 1-5" }, { status: 400 })
      }
      var res = await supabase.from("mentor_requests").update({ rating: rating }).eq("id", requestId).select().single()
      if (res.error) return Response.json({ error: "Failed to rate" }, { status: 500 })
      return Response.json({ success: true, request: res.data })
    }

    return Response.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE — delete a request
export async function DELETE(request) {
  try {
    var url = new URL(request.url)
    var requestId = url.searchParams.get("id")

    if (!requestId) {
      return Response.json({ error: "Request ID required" }, { status: 400 })
    }

    var res = await supabase.from("mentor_requests").delete().eq("id", requestId)
    if (res.error) return Response.json({ error: "Failed to delete" }, { status: 500 })
    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ===== EMAIL TEMPLATES =====

function buildMentorEmail(teamNumber, studentName, technology, issue, priority, resolveUrl) {
  var priorityColors = { Low: "#34d399", Medium: "#fbbf24", High: "#f97316", Critical: "#ff3020" }
  var priColor = priorityColors[priority] || "#fbbf24"

  return '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;">'
    + '<div style="max-width:560px;margin:0 auto;padding:40px 20px;">'
    + '<div style="background:#111;border-radius:16px;border:1px solid #222;overflow:hidden;">'
    + '<div style="background:linear-gradient(135deg,#ff3020,#ff6040);padding:24px 28px;">'
    + '<div style="font-size:20px;font-weight:800;color:#fff;letter-spacing:2px;">PROJECT SPACE</div>'
    + '<div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:4px;">Mentor Help Request</div>'
    + '</div>'
    + '<div style="padding:28px;">'
    + '<div style="font-size:14px;color:#ccc;margin-bottom:20px;">Hello, a team needs your assistance:</div>'
    + '<div style="background:#1a1a1a;border-radius:12px;padding:18px;margin-bottom:16px;">'
    + '<table style="width:100%;border-collapse:collapse;">'
    + '<tr><td style="padding:6px 0;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;width:100px;">Team</td><td style="padding:6px 0;font-size:14px;color:#ff6040;font-weight:700;">' + teamNumber + '</td></tr>'
    + '<tr><td style="padding:6px 0;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Student</td><td style="padding:6px 0;font-size:14px;color:#fff;">' + (studentName || "Team Leader") + '</td></tr>'
    + '<tr><td style="padding:6px 0;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Technology</td><td style="padding:6px 0;font-size:14px;color:#fff;">' + technology + '</td></tr>'
    + '<tr><td style="padding:6px 0;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Priority</td><td style="padding:6px 0;"><span style="font-size:13px;font-weight:700;color:' + priColor + ';">' + priority + '</span></td></tr>'
    + '</table>'
    + '</div>'
    + '<div style="background:#1a1a1a;border-radius:12px;padding:18px;margin-bottom:24px;">'
    + '<div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Issue Description</div>'
    + '<div style="font-size:14px;color:#ddd;line-height:1.6;">' + issue + '</div>'
    + '</div>'
    + '<a href="' + resolveUrl + '" style="display:block;text-align:center;padding:14px;background:linear-gradient(135deg,#ff3020,#ff6040);color:#fff;text-decoration:none;border-radius:12px;font-size:14px;font-weight:700;letter-spacing:1px;">MARK AS RESOLVED</a>'
    + '<div style="text-align:center;font-size:11px;color:#555;margin-top:12px;">Click above after resolving the issue</div>'
    + '</div>'
    + '</div>'
    + '</div>'
    + '</body></html>'
}

function buildStudentEmail(teamNumber, mentorName, technology, issue, priority) {
  return '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;">'
    + '<div style="max-width:560px;margin:0 auto;padding:40px 20px;">'
    + '<div style="background:#111;border-radius:16px;border:1px solid #222;overflow:hidden;">'
    + '<div style="background:linear-gradient(135deg,#ff3020,#ff6040);padding:24px 28px;">'
    + '<div style="font-size:20px;font-weight:800;color:#fff;letter-spacing:2px;">PROJECT SPACE</div>'
    + '<div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:4px;">Request Confirmation</div>'
    + '</div>'
    + '<div style="padding:28px;">'
    + '<div style="font-size:14px;color:#ccc;margin-bottom:20px;">Your mentor request has been submitted successfully!</div>'
    + '<div style="background:#1a1a1a;border-radius:12px;padding:18px;margin-bottom:16px;">'
    + '<table style="width:100%;border-collapse:collapse;">'
    + '<tr><td style="padding:6px 0;font-size:11px;color:#888;text-transform:uppercase;">Mentor</td><td style="padding:6px 0;color:#ff6040;font-weight:600;">' + mentorName + '</td></tr>'
    + '<tr><td style="padding:6px 0;font-size:11px;color:#888;text-transform:uppercase;">Technology</td><td style="padding:6px 0;color:#fff;">' + technology + '</td></tr>'
    + '<tr><td style="padding:6px 0;font-size:11px;color:#888;text-transform:uppercase;">Priority</td><td style="padding:6px 0;color:#fff;">' + priority + '</td></tr>'
    + '<tr><td style="padding:6px 0;font-size:11px;color:#888;text-transform:uppercase;">Issue</td><td style="padding:6px 0;color:#aaa;">' + issue + '</td></tr>'
    + '</table>'
    + '</div>'
    + '<div style="text-align:center;font-size:12px;color:#555;padding:12px;">Your mentor will be notified and will assist you shortly.</div>'
    + '</div>'
    + '</div>'
    + '</div>'
    + '</body></html>'
}