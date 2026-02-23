import { supabase } from "@/lib/supabase"
import twilio from "twilio"

var client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function GET(request) {
  try {
    var url = new URL(request.url)
    var teamNumber = url.searchParams.get("team_number")

    if (teamNumber) {
      var res = await supabase
        .from("mentor_requests")
        .select("*")
        .eq("team_number", teamNumber)
        .order("requested_at", { ascending: false })

      return Response.json({ success: true, requests: res.data || [] })
    }

    var res = await supabase
      .from("mentor_requests")
      .select("*")
      .order("requested_at", { ascending: false })

    return Response.json({ success: true, requests: res.data || [] })
  } catch (error) {
    return Response.json({ error: "Failed to fetch" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    var body = await request.json()
    var { teamNumber, teamId, mentorId, technology, projectTitle } = body

    if (!teamNumber || !mentorId || !technology) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if team already has a pending request
    var pendingRes = await supabase
      .from("mentor_requests")
      .select("id")
      .eq("team_number", teamNumber)
      .eq("status", "pending")
      .single()

    if (pendingRes.data) {
      return Response.json({
        error: "You already have a pending mentor request. Please resolve it first.",
      }, { status: 400 })
    }

    // Get mentor details
    var mentorRes = await supabase
      .from("mentors")
      .select("*")
      .eq("id", mentorId)
      .single()

    if (!mentorRes.data) {
      return Response.json({ error: "Mentor not found" }, { status: 404 })
    }

    var mentor = mentorRes.data

    // Create request
    var insertRes = await supabase.from("mentor_requests").insert({
      team_id: teamId,
      team_number: teamNumber,
      mentor_id: mentorId,
      mentor_name: mentor.name,
      technology: technology,
      status: "pending",
    })

    if (insertRes.error) {
      console.error("Insert error:", insertRes.error)
      return Response.json({ error: "Failed to create request" }, { status: 500 })
    }

    // Send SMS to mentor
    try {
      await client.messages.create({
        body: "Project Space: Team " + teamNumber + " needs help with " + technology + ". Project: " + (projectTitle || "N/A") + ". Please assist them.",
        from: process.env.TWILIO_PHONE_NUMBER,
        to: mentor.phone,
      })
    } catch (smsErr) {
      console.error("SMS failed:", smsErr.message)
    }

    return Response.json({ success: true, mentorName: mentor.name })
  } catch (error) {
    console.error("Mentor request error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    var body = await request.json()
    var { requestId } = body

    if (!requestId) {
      return Response.json({ error: "Request ID required" }, { status: 400 })
    }

    var res = await supabase
      .from("mentor_requests")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
      })
      .eq("id", requestId)

    if (res.error) {
      return Response.json({ error: "Failed to update" }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}