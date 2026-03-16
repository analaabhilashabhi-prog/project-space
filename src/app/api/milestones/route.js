import { supabase } from "@/lib/supabase"

// Technology-specific milestone phases
var MILESTONES = {
  "Data Specialist": [
    { phase: 1, name: "Dataset & Problem", icon: "data1", desc: "Dataset identified + problem defined" },
    { phase: 2, name: "Data Cleaning & EDA", icon: "data2", desc: "Data cleaned & exploratory analysis done" },
    { phase: 3, name: "Model Design", icon: "data3", desc: "Model/dashboard architecture designed" },
    { phase: 4, name: "Core Analysis", icon: "data4", desc: "Core analysis/model working" },
    { phase: 5, name: "Visualization", icon: "data5", desc: "Visualization & insights complete" },
    { phase: 6, name: "Deployment", icon: "data6", desc: "Final insights + deployed" },
  ],
  "AWS Development": [
    { phase: 1, name: "Architecture Design", icon: "aws1", desc: "Architecture designed + services chosen" },
    { phase: 2, name: "IAM & Networking", icon: "aws2", desc: "IAM + networking setup done" },
    { phase: 3, name: "Core Service Deploy", icon: "aws3", desc: "Core service deployed (EC2/Lambda/S3)" },
    { phase: 4, name: "Integration", icon: "aws4", desc: "Services integrated + working" },
    { phase: 5, name: "Security & Monitoring", icon: "aws5", desc: "Security + monitoring configured" },
    { phase: 6, name: "Final Deployment", icon: "aws6", desc: "Final deployment + documentation" },
  ],
  "ServiceNow": [
    { phase: 1, name: "Scope & Requirements", icon: "snow1", desc: "Requirement + scope defined" },
    { phase: 2, name: "Tables & Forms", icon: "snow2", desc: "Tables + forms created" },
    { phase: 3, name: "Workflows Built", icon: "snow3", desc: "Workflows/Flow Designer built" },
    { phase: 4, name: "Business Rules", icon: "snow4", desc: "Business rules + integrations done" },
    { phase: 5, name: "Testing & UAT", icon: "snow5", desc: "Testing + UAT complete" },
    { phase: 6, name: "Production Ready", icon: "snow6", desc: "Production-ready + demo done" },
  ],
  "Google Flutter": [
    { phase: 1, name: "Wireframes & Plan", icon: "fl1", desc: "UI wireframes + app structure planned" },
    { phase: 2, name: "Screens Designed", icon: "fl2", desc: "Screens designed in Flutter" },
    { phase: 3, name: "Core Navigation", icon: "fl3", desc: "Core feature/navigation working" },
    { phase: 4, name: "API Integration", icon: "fl4", desc: "API/backend integration done" },
    { phase: 5, name: "Device Testing", icon: "fl5", desc: "Testing on device complete" },
    { phase: 6, name: "APK & Demo", icon: "fl6", desc: "APK built + demo ready" },
  ],
  "Full Stack": [
    { phase: 1, name: "Schema & Stack", icon: "fs1", desc: "Tech stack + DB schema finalized" },
    { phase: 2, name: "Backend APIs", icon: "fs2", desc: "Backend APIs built" },
    { phase: 3, name: "Frontend Connected", icon: "fs3", desc: "Frontend connected to APIs" },
    { phase: 4, name: "Auth & Features", icon: "fs4", desc: "Auth + core features working" },
    { phase: 5, name: "Testing & Fixes", icon: "fs5", desc: "Testing + bug fixes done" },
    { phase: 6, name: "Deployed Live", icon: "fs6", desc: "Deployed + live link ready" },
  ],
  "VLSI": [
    { phase: 1, name: "Design Spec", icon: "vlsi1", desc: "Design specification defined" },
    { phase: 2, name: "RTL Coding", icon: "vlsi2", desc: "RTL coding complete" },
    { phase: 3, name: "Simulation", icon: "vlsi3", desc: "Simulation results verified" },
    { phase: 4, name: "Synthesis", icon: "vlsi4", desc: "Synthesis done + timing met" },
    { phase: 5, name: "Physical Design", icon: "vlsi5", desc: "Layout/physical design complete" },
    { phase: 6, name: "Final Verification", icon: "vlsi6", desc: "Final verification + report done" },
  ],
}

var CREDITS_PER_MILESTONE = 3
var CREDITS_PER_REQUEST = 2
var STARTING_CREDITS = 20

export async function POST(request) {
  try {
    var body = await request.json()
    var action = body.action

    // ── GET MILESTONES FOR TEAM ──────────────────────────
    if (action === "get_team") {
      var { teamNumber, technology } = body
      if (!teamNumber) return Response.json({ error: "Team number required" }, { status: 400 })

      // Get or create credits
      var creditsRes = await supabase
        .from("team_credits")
        .select("*")
        .eq("team_number", teamNumber)
        .maybeSingle()

      if (!creditsRes.data) {
        await supabase.from("team_credits").insert({ team_number: teamNumber, credits: STARTING_CREDITS, total_earned: STARTING_CREDITS, total_spent: 0 })
        creditsRes = { data: { credits: STARTING_CREDITS, total_earned: STARTING_CREDITS, total_spent: 0 } }
      }

      // Get milestones
      var milestonesRes = await supabase
        .from("team_milestones")
        .select("*")
        .eq("team_number", teamNumber)
        .order("phase")

      // Get transactions
      var txRes = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("team_number", teamNumber)
        .order("created_at", { ascending: false })
        .limit(20)

      return Response.json({
        milestones: milestonesRes.data || [],
        credits: creditsRes.data,
        transactions: txRes.data || [],
        phaseDefinitions: technology ? (MILESTONES[technology] || []) : [],
      })
    }

    // ── SUBMIT MILESTONE (team leader) ──────────────────────
    if (action === "submit_milestone") {
      var { teamNumber, technology, phase, phaseName } = body
      if (!teamNumber || !technology || !phase || !phaseName) {
        return Response.json({ error: "Missing fields" }, { status: 400 })
      }

      // Check if already submitted or approved
      var existing = await supabase
        .from("team_milestones")
        .select("id, status")
        .eq("team_number", teamNumber)
        .eq("phase", phase)
        .maybeSingle()

      if (existing.data) {
        if (existing.data.status === "approved") {
          return Response.json({ error: "This milestone is already approved." }, { status: 400 })
        }
        // Update to re-submitted
        await supabase.from("team_milestones").update({ status: "submitted", submitted_at: new Date().toISOString() }).eq("id", existing.data.id)
      } else {
        await supabase.from("team_milestones").insert({
          team_number: teamNumber, technology: technology,
          phase: phase, phase_name: phaseName,
          status: "submitted", submitted_at: new Date().toISOString(),
        })
      }

      return Response.json({ success: true })
    }

    // ── APPROVE MILESTONE (mentor) ──────────────────────────
    if (action === "approve_milestone") {
      var { milestoneId, mentorName } = body
      if (!milestoneId || !mentorName) return Response.json({ error: "Missing fields" }, { status: 400 })

      var msRes = await supabase.from("team_milestones").select("*").eq("id", milestoneId).single()
      if (msRes.error || !msRes.data) return Response.json({ error: "Milestone not found" }, { status: 404 })
      if (msRes.data.status === "approved") return Response.json({ error: "Already approved" }, { status: 400 })

      var ms = msRes.data

      // Approve milestone
      await supabase.from("team_milestones").update({
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: mentorName,
        credits_awarded: CREDITS_PER_MILESTONE,
      }).eq("id", milestoneId)

      // Add credits
      var creditsRes = await supabase.from("team_credits").select("credits, total_earned").eq("team_number", ms.team_number).single()
      var currentCredits = creditsRes.data ? creditsRes.data.credits : STARTING_CREDITS
      var currentEarned = creditsRes.data ? creditsRes.data.total_earned : STARTING_CREDITS

      await supabase.from("team_credits").upsert({
        team_number: ms.team_number,
        credits: currentCredits + CREDITS_PER_MILESTONE,
        total_earned: currentEarned + CREDITS_PER_MILESTONE,
        updated_at: new Date().toISOString(),
      }, { onConflict: "team_number" })

      // Log transaction
      await supabase.from("credit_transactions").insert({
        team_number: ms.team_number,
        amount: CREDITS_PER_MILESTONE,
        reason: "Milestone " + ms.phase + " approved: " + ms.phase_name,
      })

      return Response.json({ success: true, creditsAwarded: CREDITS_PER_MILESTONE })
    }

    // ── GET PENDING MILESTONES FOR MENTOR (by technology) ──
    if (action === "get_pending_for_mentor") {
      var { technology } = body
      if (!technology) return Response.json({ error: "Technology required" }, { status: 400 })

      var res = await supabase
        .from("team_milestones")
        .select("*")
        .eq("technology", technology)
        .eq("status", "submitted")
        .order("submitted_at")

      return Response.json({ milestones: res.data || [] })
    }

    // ── DEDUCT CREDITS (when mentor request submitted) ──────
    if (action === "deduct_credits") {
      var { teamNumber, reason } = body
      if (!teamNumber) return Response.json({ error: "Team number required" }, { status: 400 })

      var creditsRes = await supabase.from("team_credits").select("credits, total_spent").eq("team_number", teamNumber).maybeSingle()

      if (!creditsRes.data) {
        // Init with starting credits
        await supabase.from("team_credits").insert({ team_number: teamNumber, credits: STARTING_CREDITS, total_earned: STARTING_CREDITS, total_spent: 0 })
        creditsRes = { data: { credits: STARTING_CREDITS, total_spent: 0 } }
      }

      var currentCredits = creditsRes.data.credits
      if (currentCredits < CREDITS_PER_REQUEST) {
        return Response.json({ error: "Not enough credits. Complete milestones to earn more.", insufficientCredits: true }, { status: 400 })
      }

      await supabase.from("team_credits").update({
        credits: currentCredits - CREDITS_PER_REQUEST,
        total_spent: (creditsRes.data.total_spent || 0) + CREDITS_PER_REQUEST,
        updated_at: new Date().toISOString(),
      }).eq("team_number", teamNumber)

      await supabase.from("credit_transactions").insert({
        team_number: teamNumber,
        amount: -CREDITS_PER_REQUEST,
        reason: reason || "Mentor request submitted",
      })

      return Response.json({ success: true, remaining: currentCredits - CREDITS_PER_REQUEST })
    }

    // ── GET CREDITS FOR TEAM ─────────────────────────────────
    if (action === "get_credits") {
      var { teamNumber } = body
      if (!teamNumber) return Response.json({ error: "Team number required" }, { status: 400 })

      var res = await supabase.from("team_credits").select("*").eq("team_number", teamNumber).maybeSingle()
      if (!res.data) {
        return Response.json({ credits: STARTING_CREDITS, total_earned: STARTING_CREDITS, total_spent: 0 })
      }
      return Response.json(res.data)
    }

    return Response.json({ error: "Invalid action" }, { status: 400 })
  } catch (err) {
    console.error("milestones error:", err)
    return Response.json({ error: "Server error: " + err.message }, { status: 500 })
  }
}

export { MILESTONES }