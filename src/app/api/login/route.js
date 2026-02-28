import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

export async function POST(request) {
  try {
    var supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    var { rollNumber, password } = await request.json()
    if (!rollNumber || !password) {
      return Response.json({ error: "Roll number and password are required" }, { status: 400 })
    }
    var roll = rollNumber.toUpperCase()

    var { data: userData, error: userError } = await supabase
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

    var isMatch = await bcrypt.compare(password, userData.password_hash)
    if (!isMatch) {
      return Response.json({ error: "Incorrect password. Please try again." }, { status: 400 })
    }

    var { data: memberData } = await supabase
      .from("team_members")
      .select("team_id, is_leader, member_name, teams(team_number, project_title)")
      .eq("member_roll_number", roll)
      .single()

    if (memberData && memberData.teams) {
      if (memberData.is_leader) {
        return Response.json({
          success: true,
          status: "team_lead",
          teamNumber: memberData.teams.team_number,
          message: "Welcome back, Team Lead!",
        })
      } else {
        return Response.json({
          success: true,
          status: "team_member",
          teamNumber: memberData.teams.team_number,
          memberName: memberData.member_name,
          projectTitle: memberData.teams.project_title,
          message: "Welcome back, " + memberData.member_name + "!",
        })
      }
    }

    var { data: settings } = await supabase
      .from("settings")
      .select("value")
      .eq("id", "registration_open")
      .single()

    var registrationOpen = settings ? settings.value === "true" : false

    return Response.json({
      success: true,
      status: "new_user",
      registrationOpen: registrationOpen,
      message: "Login successful!",
    })
  } catch (error) {
    console.error("Login Error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}