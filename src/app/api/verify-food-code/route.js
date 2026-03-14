import { createClient } from "@supabase/supabase-js"

export async function POST(request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const body = await request.json()
    const { action, meal_code, pin } = body

    // ========== ACTION: VERIFY (check code + pin) ==========
    if (action === "verify") {
      if (!meal_code || !pin) {
        return Response.json({ error: "Meal code and PIN are required" }, { status: 400 })
      }

      // Find the meal code in food_selections table
      const { data: codeData, error: codeErr } = await supabase
        .from("food_selections")
        .select("*")
        .eq("coupon_code", meal_code.trim())
        .single()

      if (codeErr || !codeData) {
        return Response.json({
          result: "invalid",
          message: "Code not found. Check and try again.",
        })
      }

      // Verify PIN (plain text comparison)
      if (codeData.secret_pin !== pin) {
        return Response.json({
          result: "invalid",
          message: "Code + PIN combination doesn't match.",
        })
      }

      // Check if already delivered/consumed
      if (codeData.delivered) {
        return Response.json({
          result: "already_consumed",
          student_name: codeData.member_name,
          roll_number: codeData.member_roll_number,
          team_number: codeData.team_number,
          meal_slot: "snack", // We have both snack and beverage in one row
          food_item: codeData.snack + " + " + codeData.beverage,
          snack: codeData.snack,
          beverage: codeData.beverage,
          day_number: codeData.day_number,
          consumed_at: codeData.delivered_at,
        })
      }

      // Valid! Return student info for admin to confirm
      return Response.json({
        result: "valid",
        code_id: codeData.id,
        student_name: codeData.member_name,
        roll_number: codeData.member_roll_number,
        team_number: codeData.team_number,
        meal_slot: "combo",
        food_item: codeData.snack + " + " + codeData.beverage,
        snack: codeData.snack,
        beverage: codeData.beverage,
        day_number: codeData.day_number,
      })
    }

    // ========== ACTION: CONSUME (mark as delivered) ==========
    if (action === "consume") {
      const { code_id } = body
      if (!code_id) {
        return Response.json({ error: "Code ID is required" }, { status: 400 })
      }

      // Get the code details
      const { data: codeData } = await supabase
        .from("food_selections")
        .select("*")
        .eq("id", code_id)
        .single()

      if (!codeData) {
        return Response.json({ error: "Code not found" }, { status: 400 })
      }

      if (codeData.delivered) {
        return Response.json({ error: "Already delivered" }, { status: 400 })
      }

      const now = new Date().toISOString()

      // Mark as delivered in food_selections
      const { error: updateErr } = await supabase
        .from("food_selections")
        .update({ 
          delivered: true, 
          delivered_at: now,
          delivered_by: "admin"
        })
        .eq("id", code_id)

      if (updateErr) {
        return Response.json({ error: "Failed to update: " + updateErr.message }, { status: 500 })
      }

      return Response.json({
        success: true,
        message: "Marked as delivered",
        consumed_at: now,
      })
    }

    // ========== ACTION: STATS ==========
    if (action === "stats") {
      const { day_number } = body

      // Total confirmed codes for this day
      const { count: totalCodes } = await supabase
        .from("food_selections")
        .select("id", { count: "exact", head: true })
        .eq("day_number", day_number || 1)
        .eq("confirmed", true)

      // Delivered codes for this day
      const { count: consumedCodes } = await supabase
        .from("food_selections")
        .select("id", { count: "exact", head: true })
        .eq("day_number", day_number || 1)
        .eq("confirmed", true)
        .eq("delivered", true)

      return Response.json({
        total: totalCodes || 0,
        consumed: consumedCodes || 0,
        remaining: (totalCodes || 0) - (consumedCodes || 0),
      })
    }

    return Response.json({ error: "Invalid action" }, { status: 400 })

  } catch (error) {
    console.error("Verify food code error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}