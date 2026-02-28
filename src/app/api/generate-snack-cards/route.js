import { createClient } from "@supabase/supabase-js"
import { v4 as uuidv4 } from "uuid"
import crypto from "crypto"

var supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(request) {
  try {
    var body = await request.json()
    var { team_id, team_number, member_roll_number, member_name } = body

    if (!member_roll_number) {
      return Response.json({ error: "Member roll number is required" }, { status: 400 })
    }

    // If team_id not provided, look it up from team_number
    if (!team_id && team_number) {
      var teamLookup = await supabase
        .from("teams")
        .select("id")
        .eq("team_number", team_number)
        .single()
      if (teamLookup.data) {
        team_id = teamLookup.data.id
      }
    }

    if (!team_id) {
      return Response.json({ error: "Team ID is required" }, { status: 400 })
    }

    // Check if cards already exist for this member
    var existingRes = await supabase
      .from("snack_cards")
      .select("id")
      .eq("member_roll_number", member_roll_number)
      .limit(1)

    if (existingRes.data && existingRes.data.length > 0) {
      return Response.json({ message: "Cards already generated" }, { status: 200 })
    }

    // Get this member's food selections
    var foodRes = await supabase
      .from("food_selections")
      .select("*")
      .eq("member_roll_number", member_roll_number)
      .order("day_number", { ascending: true })

    if (!foodRes.data || foodRes.data.length < 7) {
      return Response.json({ error: "Must complete all 7 days first. Found: " + (foodRes.data ? foodRes.data.length : 0) }, { status: 400 })
    }

    // Generate 14 cards (7 snack + 7 beverage)
    var cards = []
    var slotCounter = 1

    foodRes.data.forEach(function (sel) {
      // Read snack from new or old columns
      var snackVal = sel.snack || sel.snack_morning || ""
      var bevVal = sel.beverage || sel.beverage_morning || ""

      // Snack card
      var snackUuid = uuidv4()
      var snackToken = crypto.createHash("sha256").update(snackUuid + "-snack-" + member_roll_number).digest("hex").substring(0, 32)
      var snackSig = crypto.createHash("sha256").update(snackToken + "-sig").digest("hex").substring(0, 16)

      cards.push({
        team_id: team_id,
        team_number: team_number || "",
        member_roll_number: member_roll_number,
        member_name: member_name || "",
        day_number: sel.day_number,
        card_type: "snack",
        session_type: "snack",
        item_name: snackVal,
        snack_name: snackVal,
        qr_token: snackToken,
        qr_signature: snackSig,
        is_used: false,
        status: "active",
        slot_number: slotCounter,
        slot_order: slotCounter,
        created_at: new Date().toISOString(),
      })
      slotCounter++

      // Beverage card
      var bevUuid = uuidv4()
      var bevToken = crypto.createHash("sha256").update(bevUuid + "-beverage-" + member_roll_number).digest("hex").substring(0, 32)
      var bevSig = crypto.createHash("sha256").update(bevToken + "-sig").digest("hex").substring(0, 16)

      cards.push({
        team_id: team_id,
        team_number: team_number || "",
        member_roll_number: member_roll_number,
        member_name: member_name || "",
        day_number: sel.day_number,
        card_type: "beverage",
        session_type: "beverage",
        item_name: bevVal,
        snack_name: bevVal,
        qr_token: bevToken,
        qr_signature: bevSig,
        is_used: false,
        status: "active",
        slot_number: slotCounter,
        slot_order: slotCounter,
        created_at: new Date().toISOString(),
      })
      slotCounter++
    })

    // Insert all cards
    var insertRes = await supabase
      .from("snack_cards")
      .insert(cards)

    if (insertRes.error) {
      return Response.json({ error: insertRes.error.message }, { status: 500 })
    }

    return Response.json({ message: "Cards generated successfully", count: cards.length }, { status: 200 })
  } catch (err) {
    return Response.json({ error: "Server error: " + err.message }, { status: 500 })
  }
}