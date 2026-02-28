import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

export async function POST(request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const body = await request.json()
    const { roll_number, student_name, team_number, secret_pin, food_items } = body

    if (!roll_number || !secret_pin || !food_items) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (secret_pin.length !== 4 || !/^\d{4}$/.test(secret_pin)) {
      return Response.json({ error: "PIN must be exactly 4 digits" }, { status: 400 })
    }

    if (!food_items || food_items.length !== 7) {
      return Response.json({ error: "Must have food selections for all 7 days" }, { status: 400 })
    }

    // Check if codes already exist for this student
    const { data: existing } = await supabase
      .from("food_codes")
      .select("id")
      .eq("roll_number", roll_number.toUpperCase())
      .limit(1)

    if (existing && existing.length > 0) {
      return Response.json({ error: "Food codes already generated for this student" }, { status: 400 })
    }

    // Hash the PIN
    const pinHash = await bcrypt.hash(secret_pin, 10)

    // Generate 14 unique 4-digit codes
    const usedCodes = new Set()

    // Also check existing codes in DB to ensure global uniqueness
    const { data: allExistingCodes } = await supabase
      .from("food_codes")
      .select("meal_code")

    if (allExistingCodes) {
      allExistingCodes.forEach(function (row) {
        usedCodes.add(row.meal_code)
      })
    }

    function generateUniqueCode() {
      let attempts = 0
      while (attempts < 1000) {
        const code = String(Math.floor(1000 + Math.random() * 9000))
        if (!usedCodes.has(code)) {
          usedCodes.add(code)
          return code
        }
        attempts++
      }
      // Fallback: use 5-digit code if 4-digit space is exhausted
      return String(Math.floor(10000 + Math.random() * 90000))
    }

    // Build the 14 rows
    const rows = []

    for (let i = 0; i < food_items.length; i++) {
      const item = food_items[i]
      const dayNum = item.day_number

      // Snack code
      rows.push({
        roll_number: roll_number.toUpperCase(),
        student_name: student_name || "",
        team_number: team_number || "",
        secret_pin: pinHash,
        day_number: dayNum,
        meal_slot: "snack",
        meal_code: generateUniqueCode(),
        food_item: item.snack_item || "",
      })

      // Beverage code
      rows.push({
        roll_number: roll_number.toUpperCase(),
        student_name: student_name || "",
        team_number: team_number || "",
        secret_pin: pinHash,
        day_number: dayNum,
        meal_slot: "beverage",
        meal_code: generateUniqueCode(),
        food_item: item.beverage_item || "",
      })
    }

    // Insert all 14 codes
    const { error: insertError } = await supabase
      .from("food_codes")
      .insert(rows)

    if (insertError) {
      console.error("Food codes insert error:", insertError)
      return Response.json({ error: "Failed to generate codes: " + insertError.message }, { status: 500 })
    }

    return Response.json({
      success: true,
      message: "14 food codes generated successfully",
      count: rows.length,
    })

  } catch (error) {
    console.error("Generate food codes error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}