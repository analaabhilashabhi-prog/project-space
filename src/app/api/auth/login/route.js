import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"

export async function POST(request) {
  try {
    const { rollNumber, password } = await request.json()

    if (!rollNumber || !password) {
      return Response.json({ error: "Roll number and password are required" }, { status: 400 })
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("roll_number", rollNumber)
      .single()

    if (userError || !user) {
      return Response.json({
        success: false,
        error: "Account not found. Please create an account first.",
      }, { status: 400 })
    }

    if (!user.is_verified) {
      return Response.json({
        success: false,
        error: "Account not verified. Please register again to verify your email.",
      }, { status: 400 })
    }

    if (!user.password_hash || user.password_hash === "") {
      return Response.json({
        success: false,
        error: "Account setup incomplete. Please register again to set your password.",
      }, { status: 400 })
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash)

    if (!isValidPassword) {
      return Response.json({
        success: false,
        error: "Incorrect password. Please try again.",
      }, { status: 400 })
    }

    const { data: memberData } = await supabase
      .from("team_members")
      .select("team_id, is_leader, member_name, teams(team_number, project_title)")
      .eq("member_roll_number", rollNumber)
      .single()

    if (memberData && memberData.teams) {
      if (memberData.is_leader) {
        console.log("✅ Team Lead login: " + rollNumber + " → Team " + memberData.teams.team_number)
        return Response.json({
          success: true,
          status: "team_lead",
          teamNumber: memberData.teams.team_number,
          message: "Welcome back, Team Lead!",
        })
      } else {
        const { data: leaderData } = await supabase
          .from("team_members")
          .select("member_name, member_roll_number")
          .eq("team_id", memberData.team_id)
          .eq("is_leader", true)
          .single()

        console.log("❌ Team Member blocked: " + rollNumber)
        return Response.json({
          success: false,
          status: "team_member",
          teamNumber: memberData.teams.team_number,
          projectTitle: memberData.teams.project_title,
          memberName: memberData.member_name,
          leaderName: leaderData ? leaderData.member_name : "Unknown",
          leaderRoll: leaderData ? leaderData.member_roll_number : "Unknown",
          message: "You are a team member. Only team leads can login.",
        })
      }
    }

    console.log("✅ New user login: " + rollNumber)
    return Response.json({
      success: true,
      status: "new_user",
      message: "Login successful!",
    })
  } catch (error) {
    console.error("Login Error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}