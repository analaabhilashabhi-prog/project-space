import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"

export async function POST(request) {
  try {
    const { rollNumber, password } = await request.json()

    if (!rollNumber || !password) {
      return Response.json({ error: "Roll number and password are required" }, { status: 400 })
    }

    const roll = rollNumber.toUpperCase()

    // Check if account exists
    const { data: userData, error: userError } = await supabase
      .from("user_passwords")
      .select("*")
      .eq("roll_number", roll)
      .single()

    if (userError || !userData) {
      return Response.json({
        error: "No account found. Please create an account first.",
        status: "no_account",
      }, { status: 400 })
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, userData.password_hash)
    if (!isMatch) {
      return Response.json({ error: "Incorrect password. Please try again." }, { status: 400 })
    }

    // Password correct! Now check team status
    const { data: memberData } = await supabase
      .from("team_members")
      .select("team_id, is_leader, member_name, teams(team_number, project_title)")
      .eq("member_roll_number", roll)
      .single()

    if (memberData && memberData.teams) {
      if (memberData.is_leader) {
        // Team Lead
        return Response.json({
          success: true,
          status: "team_lead",
          teamNumber: memberData.teams.team_number,
          message: "Welcome back, Team Lead!",
        })
      } else {
        // Team Member - BLOCKED
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

    // No team yet - check if registrations are open
    const { data: settings } = await supabase
      .from("settings")
      .select("value")
      .eq("id", "registration_open")
      .single()

    const registrationOpen = settings?.value === "true"

    return Response.json({
      success: true,
      status: "new_user",
      registrationOpen,
      message: "Login successful!",
    })
  } catch (error) {
    console.error("Login Error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}