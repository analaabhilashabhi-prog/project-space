import { supabase } from "@/lib/supabase"

export async function POST(request) {
  try {
    const { rollNumber, otp } = await request.json()

    if (!rollNumber || !otp) {
      return Response.json({ error: "Roll number and OTP are required" }, { status: 400 })
    }

    // Find the most recent unused OTP for this roll number
    const { data: otpData, error: otpError } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("roll_number", rollNumber)
      .eq("otp_code", otp)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (otpError || !otpData) {
      return Response.json({ error: "Invalid OTP. Please try again." }, { status: 400 })
    }

    // Check if OTP is expired (skip in development for testing)
    const isDev = process.env.NODE_ENV === "development"
    if (!isDev) {
      const expiresAt = new Date(otpData.expires_at).getTime()
      const now = Date.now()
      if (expiresAt < now) {
        return Response.json({ error: "OTP has expired. Please request a new one." }, { status: 400 })
      }
    }

    // Mark OTP as used
    await supabase
      .from("otp_codes")
      .update({ used: true })
      .eq("id", otpData.id)

    // Check if this roll number exists in ANY team
    const { data: memberData } = await supabase
      .from("team_members")
      .select("team_id, is_leader, member_name, teams(team_number, project_title)")
      .eq("member_roll_number", rollNumber)
      .single()

    if (memberData && memberData.teams) {
      if (memberData.is_leader) {
        // Team Lead - allow full access
        return Response.json({
          success: true,
          status: "team_lead",
          teamNumber: memberData.teams.team_number,
          message: "Welcome back, Team Lead!",
        })
      } else {
        // Team Member - block login, show team info
        // Get leader name
        const { data: leaderData } = await supabase
          .from("team_members")
          .select("member_name, member_roll_number")
          .eq("team_id", memberData.team_id)
          .eq("is_leader", true)
          .single()

        return Response.json({
          success: false,
          status: "team_member",
          teamNumber: memberData.teams.team_number,
          projectTitle: memberData.teams.project_title,
          memberName: memberData.member_name,
          leaderName: leaderData?.member_name || "Unknown",
          leaderRoll: leaderData?.member_roll_number || "Unknown",
          message: "You are a team member. Only team leads can login.",
        })
      }
    }

    // Check if registrations are open
    const { data: settings } = await supabase
      .from("settings")
      .select("value")
      .eq("id", "registration_open")
      .single()

    const registrationOpen = settings?.value === "true"

    // Not in any team
    return Response.json({
      success: true,
      status: "new_user",
      registrationOpen,
    })
  } catch (error) {
    console.error("Verify OTP Error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}