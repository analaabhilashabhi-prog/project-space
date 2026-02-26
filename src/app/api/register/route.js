import { supabase } from "@/lib/supabase"

export async function POST(request) {
  try {
    const body = await request.json()
    const { projectTitle, projectDescription, technologies, members } = body

    // Validate
    if (!projectTitle || !members || members.length < 3) {
      return Response.json({ error: "Project title and at least 3 team members are required" }, { status: 400 })
    }

    if (members.length > 6) {
      return Response.json({ error: "Maximum 6 team members allowed" }, { status: 400 })
    }

    const leader = members.find(function (m) { return m.is_leader })
    if (!leader) {
      return Response.json({ error: "Team must have a leader" }, { status: 400 })
    }

    // Check for duplicates within submission
    const rollNumbers = members.map(function (m) { return m.member_roll_number.toUpperCase().trim() })
    if (new Set(rollNumbers).size !== rollNumbers.length) {
      return Response.json({ error: "Duplicate roll numbers found in your team" }, { status: 400 })
    }

    // Check each roll number against existing teams
    for (var i = 0; i < rollNumbers.length; i++) {
      const { data: existingMember } = await supabase
        .from("team_members")
        .select("team_id, teams(team_number)")
        .eq("member_roll_number", rollNumbers[i])
        .single()

      if (existingMember) {
        return Response.json({
          error: rollNumbers[i] + " is already registered in Team " + (existingMember.teams?.team_number || "Unknown"),
        }, { status: 400 })
      }
    }

    // Get next team number from counters (current_value is integer)
    var nextTeamNum = "PS-001"

    const { data: counterData, error: counterError } = await supabase
      .from("counters")
      .select("current_value")
      .eq("id", "team_number")
      .single()

    if (counterError || !counterData) {
      // Fallback: count existing teams
      const { count } = await supabase
        .from("teams")
        .select("*", { count: "exact", head: true })

      var nextNum = (count || 0) + 1
      nextTeamNum = "PS-" + String(nextNum).padStart(3, "0")

      // Try to create the counter row
      await supabase.from("counters").upsert({ id: "team_number", current_value: nextNum })
    } else {
      var nextNum = (counterData.current_value || 0) + 1
      nextTeamNum = "PS-" + String(nextNum).padStart(3, "0")

      // Update counter
      await supabase
        .from("counters")
        .update({ current_value: nextNum })
        .eq("id", "team_number")
    }

    // Create team
    const { data: teamData, error: teamError } = await supabase
      .from("teams")
      .insert({
        team_number: nextTeamNum,
        project_title: projectTitle,
        project_description: projectDescription || "",
        technologies: technologies || [],
        leader_roll_number: leader.member_roll_number.toUpperCase().trim(),
        member_count: members.length,
      })
      .select("id, team_number")
      .single()

    if (teamError) {
      console.error("Team insert error:", JSON.stringify(teamError))
      return Response.json({ error: "Failed to create team: " + teamError.message }, { status: 500 })
    }

    // Insert all team members
    const memberInserts = members.map(function (m) {
      return {
        team_id: teamData.id,
        member_name: m.member_name,
        member_roll_number: m.member_roll_number.toUpperCase().trim(),
        member_email: m.member_email || (m.member_roll_number.toLowerCase().trim() + "@outlook.com"),
        member_phone: m.member_phone || "",
        member_branch: m.member_branch || "",
        member_year: m.member_year || "",
        member_college: m.member_college || "",
        is_leader: m.is_leader || false,
      }
    })

    const { error: membersError } = await supabase
      .from("team_members")
      .insert(memberInserts)

    if (membersError) {
      console.error("Members insert error:", JSON.stringify(membersError))
      // Rollback team
      await supabase.from("teams").delete().eq("id", teamData.id)
      return Response.json({ error: "Failed to add team members: " + membersError.message }, { status: 500 })
    }

    return Response.json({
      success: true,
      teamNumber: teamData.team_number,
      teamId: teamData.id,
      message: "Team registered successfully!",
    })
  } catch (error) {
    console.error("Register Error:", error)
    return Response.json({ error: "Internal server error: " + error.message }, { status: 500 })
  }
}