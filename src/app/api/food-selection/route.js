import { supabase } from "@/lib/supabase"

export async function POST(request) {
  try {
    const { teamId, selections } = await request.json()

    if (!teamId || !selections || selections.length === 0) {
      return Response.json({ error: "Team ID and selections are required" }, { status: 400 })
    }

    // Upsert each member's food selection for the day
    for (var i = 0; i < selections.length; i++) {
      var sel = selections[i]

      // Check if a record already exists
      const { data: existing } = await supabase
        .from("food_selections")
        .select("id")
        .eq("team_id", teamId)
        .eq("member_roll_number", sel.member_roll_number)
        .eq("day_number", sel.day_number)
        .single()

      if (existing) {
        // Update existing
        const { error: updateError } = await supabase
          .from("food_selections")
          .update({
            day_date: sel.day_date || "",
            beverage_morning: sel.beverage_morning || "",
            beverage_afternoon: sel.beverage_afternoon || "",
            beverage_evening: sel.beverage_evening || "",
            beverage_night: sel.beverage_night || "",
            snack_morning: sel.snack_morning || "",
            snack_evening: sel.snack_evening || "",
            snack_night: sel.snack_night || "",
          })
          .eq("id", existing.id)

        if (updateError) {
          console.error("Food update error:", JSON.stringify(updateError))
          return Response.json({ error: "Failed to update selections: " + updateError.message }, { status: 500 })
        }
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from("food_selections")
          .insert({
            team_id: teamId,
            member_roll_number: sel.member_roll_number,
            day_number: sel.day_number,
            day_date: sel.day_date || "",
            beverage_morning: sel.beverage_morning || "",
            beverage_afternoon: sel.beverage_afternoon || "",
            beverage_evening: sel.beverage_evening || "",
            beverage_night: sel.beverage_night || "",
            snack_morning: sel.snack_morning || "",
            snack_evening: sel.snack_evening || "",
            snack_night: sel.snack_night || "",
          })

        if (insertError) {
          console.error("Food insert error:", JSON.stringify(insertError))
          return Response.json({ error: "Failed to save selections: " + insertError.message }, { status: 500 })
        }
      }
    }

    return Response.json({ success: true, message: "Selections saved!" })
  } catch (error) {
    console.error("Food selection error:", error)
    return Response.json({ error: "Internal server error: " + error.message }, { status: 500 })
  }
}