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

    if (password.length < 4) {
      return Response.json({ error: "Password must be at least 4 characters" }, { status: 400 })
    }

    var { data: memberData, error: memberError } = await supabase
      .from("team_members")
      .select("member_name, member_roll_number, is_leader, team_id, teams(team_number)")
      .eq("member_roll_number", roll)
      .single()

    if (memberError || !memberData) {
      return Response.json({
        error: "Roll number not found in any team. You must be registered as a team member first.",
        status: "not_registered"
      }, { status: 400 })
    }

    var { data: existingUser } = await supabase
      .from("user_passwords")
      .select("id")
      .eq("roll_number", roll)
      .single()

    if (existingUser) {
      return Response.json({
        error: "You already have a password. Please login instead.",
        status: "already_exists"
      }, { status: 400 })
    }

    var passwordHash = await bcrypt.hash(password, 10)

    var { error: insertError } = await supabase
      .from("user_passwords")
      .insert({
        roll_number: roll,
        password_hash: passwordHash,
        name: memberData.member_name
      })

    if (insertError) {
      console.error("Insert error:", insertError)
      return Response.json({ error: "Failed to create account. Please try again." }, { status: 500 })
    }

    return Response.json({
      success: true,
      message: "Password set successfully! You can now login.",
      memberName: memberData.member_name,
      teamNumber: memberData.teams ? memberData.teams.team_number : null
    })
  } catch (error) {
    console.error("Set Password Error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}