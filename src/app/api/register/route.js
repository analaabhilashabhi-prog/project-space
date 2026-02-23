import { supabase } from "@/lib/supabase"
import { EVENT_CONFIG } from "@/config/formFields"

export async function POST(request) {
  try {
    const { projectTitle, projectDescription, technologies, members } = await request.json()

    // Check if registrations are open
    const { data: settings } = await supabase
      .from("settings")
      .select("value")
      .eq("id", "registration_open")
      .single()

    if (settings?.value !== "true") {
      return Response.json({ error: "Registrations are currently closed." }, { status: 400 })
    }

    // Validate
    if (!projectTitle || !technologies?.length || !members?.length) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (members.length !== EVENT_CONFIG.teamSize) {
      return Response.json({ error: `Team must have exactly ${EVENT_CONFIG.teamSize} members` }, { status: 400 })
    }

    // Get all roll numbers
    const rollNumbers = members.map((m) => m.member_roll_number)

    // Check for duplicate roll numbers within the team
    const uniqueRolls = new Set(rollNumbers)
    if (uniqueRolls.size !== rollNumbers.length) {
      return Response.json({ error: "Duplicate roll numbers found in your team. Each member must have a unique roll number." }, { status: 400 })
    }

    // Only check NON-LEADER members against existing teams
    // The leader is registering for the first time, so skip them
    const nonLeaderRolls = members.filter((m) => !m.is_leader).map((m) => m.member_roll_number)

    if (nonLeaderRolls.length > 0) {
      const { data: existingMembers } = await supabase
        .from("team_members")
        .select("member_roll_number, teams(team_number)")
        .in("member_roll_number", nonLeaderRolls)

      if (existingMembers && existingMembers.length > 0) {
        const details = existingMembers.map((m) => `${m.member_roll_number} (Team ${m.teams?.team_number || "Unknown"})`).join(", ")
        return Response.json({ error: `These roll numbers are already registered: ${details}` }, { status: 400 })
      }
    }

    // Get next team number
    const { data: counterData, error: counterError } = await supabase
      .from("counters")
      .select("current_value")
      .eq("id", "team_number")
      .single()

    if (counterError) throw counterError

    const nextNumber = counterData.current_value + 1
    const teamNumber = `${EVENT_CONFIG.teamNumberPrefix}-${String(nextNumber).padStart(3, "0")}`

    // Update counter
    await supabase
      .from("counters")
      .update({ current_value: nextNumber })
      .eq("id", "team_number")

    // Insert team
    const { data: teamData, error: teamError } = await supabase
      .from("teams")
      .insert({
        team_number: teamNumber,
        project_title: projectTitle,
        project_description: projectDescription || "",
        technologies: technologies,
      })
      .select()
      .single()

    if (teamError) throw teamError

    // Insert members
    const memberInserts = members.map((m) => ({
      team_id: teamData.id,
      member_name: m.member_name,
      member_roll_number: m.member_roll_number,
      member_email: m.member_email,
      member_phone: m.member_phone,
      member_branch: m.member_branch,
      member_year: m.member_year,
      member_college: m.member_college,
      is_leader: m.is_leader || false,
    }))

    const { error: membersError } = await supabase.from("team_members").insert(memberInserts)

    if (membersError) throw membersError

    return Response.json({
      success: true,
      teamNumber,
      teamId: teamData.id,
    })
  } catch (error) {
    console.error("Register Error:", error)
    return Response.json({ error: error.message || "Registration failed" }, { status: 500 })
  }
}