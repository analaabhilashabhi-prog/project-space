import { supabase } from "@/lib/supabase"
import nodemailer from "nodemailer"
import crypto from "crypto"

var transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

function genToken() { return crypto.randomUUID() }

async function sendMail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: '"Project Space" <' + process.env.SMTP_USER + '>',
      to: to,
      subject: subject,
      html: html,
    })
    console.log("Email sent to:", to)
    return true
  } catch (err) {
    console.error("Email failed to " + to + ":", err.message)
    return false
  }
}

async function addLog(requestId, action, actorName, actorType, details) {
  await supabase.from("mentor_request_logs").insert({
    request_id: requestId, action: action, actor_name: actorName, actor_type: actorType, details: details || null
  })
}

// ======= GET =======
export async function GET(request) {
  try {
    var url = new URL(request.url)
    var teamNumber = url.searchParams.get("team_number")
    var requestId = url.searchParams.get("id")
    var token = url.searchParams.get("token")
    var comments = url.searchParams.get("comments")

    // Get single request by ID + token (for mentor panel)
    if (requestId && token) {
      var r = await supabase.from("mentor_requests").select("*").eq("id", requestId).eq("token", token).single()
      if (r.error || !r.data) return Response.json({ error: "Invalid or expired link" }, { status: 403 })
      if (new Date(r.data.token_expires_at) < new Date()) return Response.json({ error: "Link expired" }, { status: 403 })
      // Get comments
      var cmts = await supabase.from("mentor_comments").select("*").eq("request_id", requestId).order("created_at", { ascending: true })
      return Response.json({ success: true, request: r.data, comments: cmts.data || [] })
    }

    // Get comments for a request
    if (comments && requestId) {
      var cmts = await supabase.from("mentor_comments").select("*").eq("request_id", requestId).order("created_at", { ascending: true })
      return Response.json({ success: true, comments: cmts.data || [] })
    }

    // Get requests for a team
    var query = supabase.from("mentor_requests").select("*").order("created_at", { ascending: false })
    if (teamNumber) query = query.eq("team_number", teamNumber)
    var res = await query
    
    // Get comments for all requests
    var reqIds = (res.data || []).map(function(r) { return r.id })
    var allComments = {}
    if (reqIds.length > 0) {
      var cmtRes = await supabase.from("mentor_comments").select("*").in("request_id", reqIds).order("created_at", { ascending: true })
      if (cmtRes.data) {
        cmtRes.data.forEach(function(c) {
          if (!allComments[c.request_id]) allComments[c.request_id] = []
          allComments[c.request_id].push(c)
        })
      }
    }

    return Response.json({ success: true, requests: res.data || [], comments: allComments })
  } catch (error) {
    return Response.json({ error: "Failed to fetch: " + error.message }, { status: 500 })
  }
}

// ======= POST =======
export async function POST(request) {
  try {
    var body = await request.json()
    var { action } = body

    // --- MENTOR ACTIONS (from mentor panel) ---
    if (action === "coming") {
      return handleMentorComing(body)
    }
    if (action === "comment") {
      return handleAddComment(body)
    }
    if (action === "mentor_resolve") {
      return handleMentorResolve(body)
    }

    // --- STUDENT SUBMIT NEW REQUEST ---
    var { teamNumber, teamId, mentorId, mentorName, mentorEmail, technology, issueDescription, priority, requestedByRoll, requestedByName } = body

    if (!teamNumber || !mentorName || !technology || !issueDescription || !priority) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }
    if (issueDescription.trim().length < 10) {
      return Response.json({ error: "Issue description must be at least 10 characters" }, { status: 400 })
    }

    // Check for active ticket
    var pendingRes = await supabase.from("mentor_requests").select("id").eq("team_number", teamNumber).in("status", ["Pending", "In Progress"])
    if (pendingRes.data && pendingRes.data.length > 0) {
      return Response.json({ error: "You have an active request. Resolve or cancel it first." }, { status: 400 })
    }

    // Cooldown check (5 min)
    var lastReq = await supabase.from("mentor_requests").select("created_at").eq("team_number", teamNumber).order("created_at", { ascending: false }).limit(1)
    if (lastReq.data && lastReq.data.length > 0) {
      var diff = Date.now() - new Date(lastReq.data[0].created_at).getTime()
      if (diff < 300000) {
        var wait = Math.ceil((300000 - diff) / 60000)
        return Response.json({ error: "Please wait " + wait + " minute(s) before submitting again." }, { status: 400 })
      }
    }

    var token = genToken()
    var tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    var insertRes = await supabase.from("mentor_requests").insert({
      team_number: teamNumber,
      team_id: teamId || null,
      mentor_id: mentorId || null,
      mentor_name: mentorName,
      mentor_email: mentorEmail || null,
      technology: technology,
      issue_description: issueDescription.trim(),
      priority: priority,
      status: "Pending",
      requested_by_roll: requestedByRoll || null,
      requested_by_name: requestedByName || null,
      student_email: "harshavardhini@technicalhub.io",
      token: token,
      token_expires_at: tokenExpires,
      created_at: new Date().toISOString(),
    }).select().single()

    if (insertRes.error) {
      console.error("Insert error:", insertRes.error)
      return Response.json({ error: "Failed to create request" }, { status: 500 })
    }

    var req = insertRes.data
    var baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    var panelUrl = baseUrl + "/mentor-panel/" + req.id + "?token=" + token
    var comingUrl = baseUrl + "/api/mentor-action?id=" + req.id + "&token=" + token + "&action=coming"

    // Log
    await addLog(req.id, "Ticket Created", requestedByName || requestedByRoll, "student", "Priority: " + priority + ", Mentor: " + mentorName)

    // Email to mentor (sent to actual mentor email)
    await sendMail(
      mentorEmail,
      "[Project Space] Help Request from Team " + teamNumber + " — " + priority,
      buildMentorEmail(teamNumber, requestedByName, technology, issueDescription, priority, comingUrl, panelUrl)
    )

    // Email to student (test: harshavardhini@technicalhub.io)
    await sendMail(
      "harshavardhini@technicalhub.io",
      "[Project Space] Request Submitted — " + mentorName + " notified",
      buildStudentEmail(teamNumber, mentorName, technology, issueDescription, priority)
    )

    return Response.json({ success: true, request: req })
  } catch (error) {
    console.error("POST error:", error)
    return Response.json({ error: "Server error: " + error.message }, { status: 500 })
  }
}

// ======= PUT — student actions =======
export async function PUT(request) {
  try {
    var body = await request.json()
    var { requestId, action, rating, cancelReason } = body

    if (!requestId) return Response.json({ error: "Request ID required" }, { status: 400 })

    if (action === "self_resolve") {
      var res = await supabase.from("mentor_requests").update({
        status: "Self Resolved", resolved_at: new Date().toISOString(), resolved_by: "self"
      }).eq("id", requestId).select().single()
      if (res.error) return Response.json({ error: "Failed" }, { status: 500 })
      await addLog(requestId, "Self Resolved", res.data.requested_by_name, "student", null)
      // System comment
      await supabase.from("mentor_comments").insert({ request_id: requestId, author_type: "system", author_name: "System", comment: "Student marked this as self-resolved." })
      return Response.json({ success: true, request: res.data })
    }

    if (action === "cancel") {
      var res = await supabase.from("mentor_requests").update({
        status: "Cancelled", cancel_reason: cancelReason || null, resolved_at: new Date().toISOString()
      }).eq("id", requestId).select().single()
      if (res.error) return Response.json({ error: "Failed" }, { status: 500 })
      await addLog(requestId, "Cancelled", res.data.requested_by_name, "student", cancelReason)
      await supabase.from("mentor_comments").insert({ request_id: requestId, author_type: "system", author_name: "System", comment: "Student cancelled this request." + (cancelReason ? " Reason: " + cancelReason : "") })
      return Response.json({ success: true, request: res.data })
    }

    if (action === "rate") {
      if (!rating || rating < 1 || rating > 5) return Response.json({ error: "Rating must be 1-5" }, { status: 400 })
      var res = await supabase.from("mentor_requests").update({ rating: rating }).eq("id", requestId).select().single()
      if (res.error) return Response.json({ error: "Failed" }, { status: 500 })
      await addLog(requestId, "Rated " + rating + " stars", res.data.requested_by_name, "student", null)
      return Response.json({ success: true, request: res.data })
    }

    return Response.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    return Response.json({ error: "Server error" }, { status: 500 })
  }
}

// ======= DELETE =======
export async function DELETE(request) {
  try {
    var url = new URL(request.url)
    var id = url.searchParams.get("id")
    if (!id) return Response.json({ error: "ID required" }, { status: 400 })
    
    console.log("Deleting request:", id)
    
    // Delete comments first (even though CASCADE should handle it)
    var c1 = await supabase.from("mentor_comments").delete().eq("request_id", id)
    if (c1.error) console.error("Comments delete error:", c1.error)
    
    var c2 = await supabase.from("mentor_request_logs").delete().eq("request_id", id)
    if (c2.error) console.error("Logs delete error:", c2.error)
    
    var c3 = await supabase.from("mentor_requests").delete().eq("id", id)
    if (c3.error) {
      console.error("Request delete error:", c3.error)
      return Response.json({ error: "Failed to delete: " + c3.error.message }, { status: 500 })
    }
    
    console.log("Deleted successfully:", id)
    return Response.json({ success: true })
  } catch (error) {
    console.error("Delete error:", error)
    return Response.json({ error: "Failed: " + error.message }, { status: 500 })
  }
}

// ======= MENTOR ACTIONS =======
async function handleMentorComing(body) {
  var { requestId, token } = body
  var r = await supabase.from("mentor_requests").select("*").eq("id", requestId).eq("token", token).single()
  if (r.error || !r.data) return Response.json({ error: "Invalid link" }, { status: 403 })
  if (new Date(r.data.token_expires_at) < new Date()) return Response.json({ error: "Link expired" }, { status: 403 })
  if (r.data.status !== "Pending") return Response.json({ error: "Request is no longer pending" }, { status: 400 })

  await supabase.from("mentor_requests").update({ status: "In Progress" }).eq("id", requestId)
  await supabase.from("mentor_comments").insert({ request_id: requestId, author_type: "system", author_name: "System", comment: r.data.mentor_name + " is on the way!" })
  await addLog(requestId, "Mentor Coming", r.data.mentor_name, "mentor", null)

  // Notify student
  await sendMail(
    "harshavardhini@technicalhub.io",
    "[Project Space] " + r.data.mentor_name + " is coming to help!",
    buildStatusEmail(r.data.team_number, r.data.mentor_name, "is on the way to help you!", "#34d399")
  )

  return Response.json({ success: true })
}

async function handleAddComment(body) {
  var { requestId, token, comment, authorName } = body
  if (!comment || !comment.trim()) return Response.json({ error: "Comment cannot be empty" }, { status: 400 })
  var r = await supabase.from("mentor_requests").select("*").eq("id", requestId).eq("token", token).single()
  if (r.error || !r.data) return Response.json({ error: "Invalid link" }, { status: 403 })
  if (new Date(r.data.token_expires_at) < new Date()) return Response.json({ error: "Link expired" }, { status: 403 })

  await supabase.from("mentor_comments").insert({ request_id: requestId, author_type: "mentor", author_name: authorName || r.data.mentor_name, comment: comment.trim() })
  await addLog(requestId, "Comment Added", r.data.mentor_name, "mentor", comment.trim())

  return Response.json({ success: true })
}

async function handleMentorResolve(body) {
  var { requestId, token } = body
  var r = await supabase.from("mentor_requests").select("*").eq("id", requestId).eq("token", token).single()
  if (r.error || !r.data) return Response.json({ error: "Invalid link" }, { status: 403 })
  if (new Date(r.data.token_expires_at) < new Date()) return Response.json({ error: "Link expired" }, { status: 403 })
  if (r.data.status !== "In Progress") return Response.json({ error: "Can only resolve tickets that are In Progress" }, { status: 400 })

  await supabase.from("mentor_requests").update({ status: "Mentor Resolved", resolved_at: new Date().toISOString(), resolved_by: "mentor" }).eq("id", requestId)
  await supabase.from("mentor_comments").insert({ request_id: requestId, author_type: "system", author_name: "System", comment: "Issue resolved by " + r.data.mentor_name + "." })
  await addLog(requestId, "Mentor Resolved", r.data.mentor_name, "mentor", null)

  // Notify student
  await sendMail(
    "harshavardhini@technicalhub.io",
    "[Project Space] Issue Resolved by " + r.data.mentor_name,
    buildStatusEmail(r.data.team_number, r.data.mentor_name, "has resolved your issue. Please rate your experience!", "#34d399")
  )

  return Response.json({ success: true })
}

// ======= EMAIL TEMPLATES =======
function buildMentorEmail(teamNumber, studentName, technology, issue, priority, comingUrl, panelUrl) {
  var priColors = { Low: "#34d399", Medium: "#fbbf24", High: "#f97316", Critical: "#ff3020" }
  var pc = priColors[priority] || "#fbbf24"
  return '<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>'
    + '<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;">'
    + '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0a0a0a;"><tr><td align="center" style="padding:24px 16px;">'
    + '<table width="500" cellpadding="0" cellspacing="0" border="0" style="max-width:500px;width:100%;">'
    // Header
    + '<tr><td style="background:#ff3020;padding:24px;border-radius:12px 12px 0 0;">'
    + '<p style="margin:0;font-size:18px;font-weight:800;color:#ffffff;letter-spacing:2px;">PROJECT SPACE</p>'
    + '<p style="margin:4px 0 0;font-size:12px;color:#ffcccc;">Mentor Help Request</p>'
    + '</td></tr>'
    // Body
    + '<tr><td style="background:#111111;padding:24px;border-radius:0 0 12px 12px;">'
    + '<p style="color:#cccccc;font-size:14px;margin:0 0 20px;">Hello! A student team needs your help:</p>'
    // Info box
    + '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#1a1a1a;border-radius:8px;margin-bottom:16px;"><tr><td style="padding:16px;">'
    + '<p style="margin:0 0 6px;font-size:11px;color:#666;">TEAM</p><p style="margin:0 0 12px;font-size:16px;color:#ff6040;font-weight:700;">' + teamNumber + '</p>'
    + '<p style="margin:0 0 6px;font-size:11px;color:#666;">STUDENT</p><p style="margin:0 0 12px;font-size:14px;color:#eeeeee;">' + (studentName || "Team Leader") + '</p>'
    + '<p style="margin:0 0 6px;font-size:11px;color:#666;">TECHNOLOGY</p><p style="margin:0 0 12px;font-size:14px;color:#eeeeee;">' + technology + '</p>'
    + '<p style="margin:0 0 6px;font-size:11px;color:#666;">PRIORITY</p><p style="margin:0;font-size:14px;color:' + pc + ';font-weight:700;">' + priority + '</p>'
    + '</td></tr></table>'
    // Issue box
    + '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#1a1a1a;border-radius:8px;margin-bottom:24px;"><tr><td style="padding:16px;">'
    + '<p style="margin:0 0 8px;font-size:11px;color:#666;">ISSUE DESCRIPTION</p>'
    + '<p style="margin:0;font-size:14px;color:#dddddd;line-height:1.6;">' + issue + '</p>'
    + '</td></tr></table>'
    // Button 1 - I AM COMING
    + '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;"><tr>'
    + '<td align="center" style="background:#22c55e;border-radius:10px;padding:0;">'
    + '<a href="' + comingUrl + '" target="_blank" style="color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:15px 20px;display:block;font-family:Arial,sans-serif;letter-spacing:1px;">I AM COMING</a>'
    + '</td></tr></table>'
    // Button 2 - ADD COMMENT
    + '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;"><tr>'
    + '<td align="center" style="background:#222222;border-radius:10px;border:1px solid #444444;padding:0;">'
    + '<a href="' + panelUrl + '" target="_blank" style="color:#ff6040;font-size:15px;font-weight:700;text-decoration:none;padding:15px 20px;display:block;font-family:Arial,sans-serif;letter-spacing:1px;">ADD COMMENT</a>'
    + '</td></tr></table>'
    // Footer
    + '<p style="margin:0;font-size:10px;color:#444444;text-align:center;">This link expires in 24 hours</p>'
    + '</td></tr>'
    + '</table></td></tr></table></body></html>'
}

function buildStudentEmail(teamNumber, mentorName, technology, issue, priority) {
  return '<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>'
    + '<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;">'
    + '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0a0a0a;"><tr><td align="center" style="padding:24px 16px;">'
    + '<table width="500" cellpadding="0" cellspacing="0" border="0" style="max-width:500px;width:100%;">'
    + '<tr><td style="background:#ff3020;padding:24px;border-radius:12px 12px 0 0;">'
    + '<p style="margin:0;font-size:18px;font-weight:800;color:#ffffff;letter-spacing:2px;">PROJECT SPACE</p>'
    + '<p style="margin:4px 0 0;font-size:12px;color:#ffcccc;">Request Confirmation</p>'
    + '</td></tr>'
    + '<tr><td style="background:#111111;padding:24px;border-radius:0 0 12px 12px;">'
    + '<p style="color:#cccccc;font-size:14px;margin:0 0 20px;">Your mentor request has been submitted!</p>'
    + '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#1a1a1a;border-radius:8px;margin-bottom:16px;"><tr><td style="padding:16px;">'
    + '<p style="margin:0 0 6px;font-size:11px;color:#666;">MENTOR</p><p style="margin:0 0 12px;font-size:14px;color:#ff6040;font-weight:600;">' + mentorName + '</p>'
    + '<p style="margin:0 0 6px;font-size:11px;color:#666;">TECHNOLOGY</p><p style="margin:0 0 12px;font-size:14px;color:#eeeeee;">' + technology + '</p>'
    + '<p style="margin:0 0 6px;font-size:11px;color:#666;">PRIORITY</p><p style="margin:0 0 12px;font-size:14px;color:#eeeeee;">' + priority + '</p>'
    + '<p style="margin:0 0 6px;font-size:11px;color:#666;">ISSUE</p><p style="margin:0;font-size:13px;color:#aaaaaa;">' + issue + '</p>'
    + '</td></tr></table>'
    + '<p style="margin:0;font-size:12px;color:#555555;text-align:center;">Your mentor has been notified via email.</p>'
    + '</td></tr>'
    + '</table></td></tr></table></body></html>'
}

function buildStatusEmail(teamNumber, mentorName, message, color) {
  return '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,Helvetica,sans-serif;">'
    + '<div style="max-width:540px;margin:0 auto;padding:32px 16px;">'
    + '<div style="background:#111111;border-radius:16px;overflow:hidden;border:1px solid #222;">'
    + '<div style="background:linear-gradient(135deg,#ff3020,#ff6040);padding:28px 24px;">'
    + '<div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:3px;">PROJECT SPACE</div>'
    + '</div>'
    + '<div style="padding:28px 24px;text-align:center;">'
    + '<div style="font-size:18px;font-weight:700;color:' + color + ';margin-bottom:12px;">' + mentorName + ' ' + message + '</div>'
    + '<div style="font-size:13px;color:#888;">Team ' + teamNumber + '</div>'
    + '</div></div></div></body></html>'
}