import { supabase } from "@/lib/supabase"

export async function POST(request) {
  try {
    const { rollNumber } = await request.json()

    if (!rollNumber) {
      return Response.json({ error: "Roll number is required" }, { status: 400 })
    }

    const roll = rollNumber.toUpperCase().trim()

    // 1. Check if already in a team
    const { data: existingMember } = await supabase
      .from("team_members")
      .select("team_id, teams(team_number)")
      .eq("member_roll_number", roll)
      .single()

    if (existingMember) {
      return Response.json({
        found: false,
        alreadyInTeam: true,
        teamNumber: existingMember.teams?.team_number || "Unknown",
        message: roll + " is already registered in Team " + (existingMember.teams?.team_number || "Unknown"),
      })
    }

    // 2. Lookup in students table
    const { data: student, error } = await supabase
      .from("students")
      .select("roll_number, name, college, branch, phone")
      .eq("roll_number", roll)
      .single()

    if (error || !student) {
      return Response.json({
        found: false,
        alreadyInTeam: false,
        message: "Not found in database. Enter details manually.",
      })
    }

    return Response.json({
      found: true,
      alreadyInTeam: false,
      student: {
        roll_number: student.roll_number,
        name: student.name,
        college: student.college,
        branch: student.branch,
        phone: student.phone || "",
      },
    })
  } catch (error) {
    console.error("Student lookup error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}