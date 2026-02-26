import { supabase } from "@/lib/supabase"

export async function POST(request) {
  try {
    const { rollNumber } = await request.json()

    if (!rollNumber) {
      return Response.json({ error: "Roll number is required" }, { status: 400 })
    }

    const roll = rollNumber.toUpperCase().trim()

    // Check if this roll is in any team
    const { data: memberData, error: memberError } = await supabase
      .from("team_members")
      .select("id, team_id, member_name, member_roll_number, member_branch, member_college, is_leader, teams(id, team_number, project_title)")
      .eq("member_roll_number", roll)
      .single()

    if (memberError || !memberData) {
      return Response.json({
        success: false,
        status: "not_registered",
        message: "You are not registered in any team. Ask your team leader to register you first.",
      })
    }

    // Member found — check if snack cards exist
    const { data: snackCards } = await supabase
      .from("snack_cards")
      .select("id")
      .eq("team_id", memberData.team_id)
      .eq("member_roll_number", roll)
      .limit(1)

    var hasSnackCards = snackCards && snackCards.length > 0

    // Check if food selections exist for this team
    const { data: foodSel } = await supabase
      .from("food_selections")
      .select("day_number")
      .eq("team_id", memberData.team_id)

    var foodDays = foodSel ? new Set(foodSel.map(function (f) { return f.day_number })).size : 0

    return Response.json({
      success: true,
      status: memberData.is_leader ? "team_lead" : "team_member",
      member: {
        name: memberData.member_name,
        rollNumber: memberData.member_roll_number,
        branch: memberData.member_branch,
        college: memberData.member_college,
        isLeader: memberData.is_leader,
      },
      team: {
        id: memberData.teams.id,
        teamNumber: memberData.teams.team_number,
        projectTitle: memberData.teams.project_title,
      },
      hasSnackCards: hasSnackCards,
      foodDaysCompleted: foodDays,
      message: "Welcome, " + memberData.member_name + "!",
    })
  } catch (error) {
    console.error("Member login error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}