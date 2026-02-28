import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

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

      // Find the meal code
      const { data: codeData, error: codeErr } = await supabase
        .from("food_codes")
        .select("*")
        .eq("meal_code", meal_code.trim())
        .single()

      if (codeErr || !codeData) {
        return Response.json({
          result: "invalid",
          message: "Code not found. Check and try again.",
        })
      }

      // Verify PIN
      const pinMatch = await bcrypt.compare(pin, codeData.secret_pin)
      if (!pinMatch) {
        return Response.json({
          result: "invalid",
          message: "Code + PIN combination doesn't match.",
        })
      }

      // Check if already consumed
      if (codeData.is_consumed) {
        return Response.json({
          result: "already_consumed",
          student_name: codeData.student_name,
          roll_number: codeData.roll_number,
          team_number: codeData.team_number,
          meal_slot: codeData.meal_slot,
          food_item: codeData.food_item,
          day_number: codeData.day_number,
          consumed_at: codeData.consumed_at,
        })
      }

      // Valid! Return student info for admin to confirm
      return Response.json({
        result: "valid",
        code_id: codeData.id,
        student_name: codeData.student_name,
        roll_number: codeData.roll_number,
        team_number: codeData.team_number,
        meal_slot: codeData.meal_slot,
        food_item: codeData.food_item,
        day_number: codeData.day_number,
      })
    }

    // ========== ACTION: CONSUME (mark as consumed) ==========
    if (action === "consume") {
      const { code_id } = body
      if (!code_id) {
        return Response.json({ error: "Code ID is required" }, { status: 400 })
      }

      // Get the code details
      const { data: codeData } = await supabase
        .from("food_codes")
        .select("*")
        .eq("id", code_id)
        .single()

      if (!codeData) {
        return Response.json({ error: "Code not found" }, { status: 400 })
      }

      if (codeData.is_consumed) {
        return Response.json({ error: "Already consumed" }, { status: 400 })
      }

      const now = new Date().toISOString()

      // Mark as consumed in food_codes
      const { error: updateErr } = await supabase
        .from("food_codes")
        .update({ is_consumed: true, consumed_at: now })
        .eq("id", code_id)

      if (updateErr) {
        return Response.json({ error: "Failed to update: " + updateErr.message }, { status: 500 })
      }

      // Insert into food_consumed log
      await supabase.from("food_consumed").insert({
        roll_number: codeData.roll_number,
        day_number: codeData.day_number,
        meal_slot: codeData.meal_slot,
        meal_code: codeData.meal_code,
        food_item: codeData.food_item,
        student_name: codeData.student_name,
        team_number: codeData.team_number,
        consumed_at: now,
      })

      return Response.json({
        success: true,
        message: "Marked as consumed",
        consumed_at: now,
      })
    }

    // ========== ACTION: STATS ==========
    if (action === "stats") {
      const { day_number } = body

      // Total codes for this day
      const { count: totalCodes } = await supabase
        .from("food_codes")
        .select("id", { count: "exact", head: true })
        .eq("day_number", day_number || 1)

      // Consumed codes for this day
      const { count: consumedCodes } = await supabase
        .from("food_codes")
        .select("id", { count: "exact", head: true })
        .eq("day_number", day_number || 1)
        .eq("is_consumed", true)

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