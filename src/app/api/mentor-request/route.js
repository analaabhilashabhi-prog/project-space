import { supabase } from "@/lib/supabase"

export async function POST(request) {
  try {
    var body = await request.json()
    var action = body.action

    // ── SUBMIT REQUEST ──
    if (action === "submit") {
      var { teamNumber, teamId, technology, issueDescription, priority, requestedByRoll } = body
      if (!teamNumber || !technology || !issueDescription || !priority) {
        return Response.json({ error: "All fields required" }, { status: 400 })
      }
      var activeRes = await supabase
        .from("mentor_requests")
        .select("id, status")
        .eq("team_number", teamNumber)
        .in("status", ["Pending", "Accepted"])
        .maybeSingle()
      if (activeRes.data) {
        return Response.json({ error: "You already have an active request. Resolve it first." }, { status: 400 })
      }
      var insertRes = await supabase
        .from("mentor_requests")
        .insert({ team_number: teamNumber, team_id: teamId || null, technology, issue_description: issueDescription, priority, status: "Pending", requested_by_roll: requestedByRoll || null })
        .select("id").single()
      if (insertRes.error) return Response.json({ error: "Failed to submit" }, { status: 500 })
      return Response.json({ success: true, requestId: insertRes.data.id })
    }

    // ── ACCEPT REQUEST ──
    if (action === "accept") {
      var { requestId, mentorId, mentorName } = body
      if (!requestId || !mentorId || !mentorName) return Response.json({ error: "Missing fields" }, { status: 400 })
      var reqRes = await supabase.from("mentor_requests").select("id, status, team_number").eq("id", requestId).single()
      if (reqRes.error || !reqRes.data) return Response.json({ error: "Request not found" }, { status: 404 })
      if (reqRes.data.status !== "Pending") return Response.json({ error: "Already accepted.", alreadyAccepted: true }, { status: 409 })
      var updateRes = await supabase.from("mentor_requests").update({ status: "Accepted", assigned_mentor_id: mentorId, assigned_mentor_name: mentorName, accepted_at: new Date().toISOString() }).eq("id", requestId).eq("status", "Pending")
      if (updateRes.error) return Response.json({ error: "Failed to accept" }, { status: 500 })
      await supabase.from("mentors").update({ is_busy: true, current_team_number: reqRes.data.team_number }).eq("id", mentorId)
      return Response.json({ success: true })
    }

    // ── RESOLVE REQUEST ──
    if (action === "resolve") {
      var { requestId, resolveType } = body
      if (!requestId || !resolveType) return Response.json({ error: "Missing fields" }, { status: 400 })
      var reqRes = await supabase.from("mentor_requests").select("id, assigned_mentor_id, status").eq("id", requestId).single()
      if (reqRes.error || !reqRes.data) return Response.json({ error: "Request not found" }, { status: 404 })
      var newStatus = resolveType === "self" ? "Self Resolved" : "Mentor Resolved"
      await supabase.from("mentor_requests").update({ status: newStatus, resolved_at: new Date().toISOString() }).eq("id", requestId)
      if (reqRes.data.assigned_mentor_id) {
        await supabase.from("mentors").update({ is_busy: false, current_team_number: null }).eq("id", reqRes.data.assigned_mentor_id)
      }
      return Response.json({ success: true })
    }

    // ── RATE MENTOR (student rates, hidden from mentor) ──
    if (action === "rate") {
      var { requestId, rating } = body
      if (!requestId || !rating) return Response.json({ error: "Missing fields" }, { status: 400 })
      var updateRes = await supabase.from("mentor_requests").update({ rating: rating }).eq("id", requestId)
      if (updateRes.error) return Response.json({ error: "Failed to save rating" }, { status: 500 })
      return Response.json({ success: true })
    }

    // ── GET ACTIVE REQUEST for team ──
    if (action === "get_active") {
      var { teamNumber } = body
      if (!teamNumber) return Response.json({ error: "Team number required" }, { status: 400 })
      var res = await supabase.from("mentor_requests").select("*").eq("team_number", teamNumber).in("status", ["Pending", "Accepted"]).order("created_at", { ascending: false }).limit(1).maybeSingle()
      return Response.json({ request: res.data || null })
    }

    // ── GET ALL REQUESTS for team (including history) ──
    if (action === "get_all_for_team") {
      var { teamNumber } = body
      if (!teamNumber) return Response.json({ error: "Team number required" }, { status: 400 })
      var res = await supabase.from("mentor_requests").select("*").eq("team_number", teamNumber).order("created_at", { ascending: false })
      return Response.json({ requests: res.data || [] })
    }

    // ── GET ALL FOR MENTOR (by technology, rating hidden) ──
    if (action === "get_for_mentor") {
      var { technology } = body
      if (!technology) return Response.json({ error: "Technology required" }, { status: 400 })
      var res = await supabase.from("mentor_requests")
        .select("id, team_number, team_id, technology, issue_description, priority, status, assigned_mentor_id, assigned_mentor_name, requested_by_roll, requested_by_name, created_at, accepted_at, resolved_at")
        .eq("technology", technology)
        .order("created_at", { ascending: false })
      return Response.json({ requests: res.data || [] })
    }

    // ── GET ALL (Admin — includes rating) ──
    if (action === "get_all") {
      var reqRes = await supabase.from("mentor_requests").select("*").order("created_at", { ascending: false })
      var mentorsRes = await supabase.from("mentors").select("id, name, email, technology, is_busy, current_team_number").order("technology")
      return Response.json({ requests: reqRes.data || [], mentors: mentorsRes.data || [] })
    }

    return Response.json({ error: "Invalid action" }, { status: 400 })
  } catch (err) {
    console.error("mentor-request error:", err)
    return Response.json({ error: "Server error: " + err.message }, { status: 500 })
  }
}