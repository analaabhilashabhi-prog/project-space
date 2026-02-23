import { supabase } from "@/lib/supabase"

export async function POST(request) {
  try {
    const { rollNumber } = await request.json()

    if (!rollNumber) {
      return Response.json({ error: "Roll number is required" }, { status: 400 })
    }

    // Check if this roll number exists in any team
    const { data: memberData } = await supabase
      .from("team_members")
      .select("team_id, member_name, is_leader, teams(team_number, project_title)")
      .eq("member_roll_number", rollNumber.toUpperCase())
      .single()

    if (memberData && memberData.teams) {
      return Response.json({
        exists: true,
        teamNumber: memberData.teams.team_number,
        projectTitle: memberData.teams.project_title,
        memberName: memberData.member_name,
        message: `This roll number (${rollNumber}) is already in Team ${memberData.teams.team_number}`,
      })
    }

    return Response.json({ exists: false })
  } catch (error) {
    return Response.json({ exists: false })
  }
}