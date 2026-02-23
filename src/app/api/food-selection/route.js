import { supabase } from "@/lib/supabase"

export async function POST(request) {
  try {
    const { teamId, selections } = await request.json()
    // selections is an array of { member_roll_number, day_number, day_date, beverage_morning, beverage_afternoon, beverage_evening, beverage_night, snack_morning, snack_evening, snack_night }

    if (!teamId || !selections?.length) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Upsert food selections (insert or update if exists)
    const { error } = await supabase
      .from("food_selections")
      .upsert(
        selections.map((s) => ({
          team_id: teamId,
          member_roll_number: s.member_roll_number,
          day_number: s.day_number,
          day_date: s.day_date,
          beverage_morning: s.beverage_morning,
          beverage_afternoon: s.beverage_afternoon,
          beverage_evening: s.beverage_evening,
          beverage_night: s.beverage_night,
          snack_morning: s.snack_morning,
          snack_evening: s.snack_evening,
          snack_night: s.snack_night,
        })),
        { onConflict: "team_id,member_roll_number,day_number" }
      )

    if (error) throw error

    return Response.json({ success: true })
  } catch (error) {
    console.error("Food Selection Error:", error)
    return Response.json({ error: error.message || "Failed to save selections" }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get("teamId")
    const dayNumber = searchParams.get("dayNumber")

    if (!teamId) {
      return Response.json({ error: "Team ID required" }, { status: 400 })
    }

    let query = supabase
      .from("food_selections")
      .select("*")
      .eq("team_id", teamId)

    if (dayNumber) {
      query = query.eq("day_number", parseInt(dayNumber))
    }

    const { data, error } = await query

    if (error) throw error

    return Response.json({ success: true, selections: data || [] })
  } catch (error) {
    console.error("Food Fetch Error:", error)
    return Response.json({ error: "Failed to fetch selections" }, { status: 500 })
  }
}