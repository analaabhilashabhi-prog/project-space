import { supabase } from "@/lib/supabase"

function generateQRToken() {
  var chars = "abcdef0123456789"
  var token = ""
  for (var i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export async function POST(request) {
  try {
    const { teamId, teamNumber } = await request.json()

    if (!teamId) {
      return Response.json({ error: "Team ID is required" }, { status: 400 })
    }

    // Check if cards already generated
    const { data: existingCards } = await supabase
      .from("snack_cards")
      .select("id")
      .eq("team_id", teamId)
      .limit(1)

    if (existingCards && existingCards.length > 0) {
      return Response.json({ error: "Cards already generated for this team. Redirecting..." }, { status: 400 })
    }

    // Get all food selections
    const { data: selections, error: selError } = await supabase
      .from("food_selections")
      .select("*")
      .eq("team_id", teamId)

    if (selError || !selections || selections.length === 0) {
      return Response.json({ error: "No food selections found. Complete all 7 days first." }, { status: 400 })
    }

    // Get team members
    const { data: members } = await supabase
      .from("team_members")
      .select("member_roll_number, member_name")
      .eq("team_id", teamId)

    var memberMap = {}
    if (members) {
      members.forEach(function (m) {
        memberMap[m.member_roll_number] = m.member_name
      })
    }

    var allCards = []
    var cartSummaryMap = {}

    // SNACK session fields
    var snackFields = [
      { field: "snack_morning", session: "morning", type: "snack" },
      { field: "snack_evening", session: "evening", type: "snack" },
      { field: "snack_night", session: "night", type: "snack" },
    ]

    // BEVERAGE session fields
    var beverageFields = [
      { field: "beverage_morning", session: "morning", type: "beverage" },
      { field: "beverage_afternoon", session: "afternoon", type: "beverage" },
      { field: "beverage_evening", session: "evening", type: "beverage" },
      { field: "beverage_night", session: "night", type: "beverage" },
    ]

    var allFields = snackFields.concat(beverageFields)

    selections.forEach(function (sel) {
      var memberName = memberMap[sel.member_roll_number] || sel.member_roll_number

      allFields.forEach(function (sf) {
        var itemName = sel[sf.field]
        if (!itemName) return

        allCards.push({
          team_id: teamId,
          member_roll_number: sel.member_roll_number,
          member_name: memberName,
          day_number: sel.day_number,
          session_type: sf.session,
          snack_name: itemName,
          card_type: sf.type,
          qr_token: generateQRToken(),
          status: "active",
        })

        var key = sel.member_roll_number + "___" + itemName + "___" + sf.type
        if (!cartSummaryMap[key]) {
          cartSummaryMap[key] = {
            team_id: teamId,
            member_roll_number: sel.member_roll_number,
            member_name: memberName,
            snack_name: itemName,
            item_type: sf.type,
            total_count: 0,
            used_count: 0,
          }
        }
        cartSummaryMap[key].total_count += 1
      })
    })

    if (allCards.length === 0) {
      return Response.json({ error: "No selections found." }, { status: 400 })
    }

    // Insert cards in batches
    var batchSize = 50
    for (var i = 0; i < allCards.length; i += batchSize) {
      var batch = allCards.slice(i, i + batchSize)
      var { error: cardError } = await supabase.from("snack_cards").insert(batch)
      if (cardError) {
        console.error("Card insert error:", JSON.stringify(cardError))
        return Response.json({ error: "Failed to generate cards: " + cardError.message }, { status: 500 })
      }
    }

    // Insert cart summary
    var summaryRows = Object.values(cartSummaryMap)
    if (summaryRows.length > 0) {
      var { error: summaryError } = await supabase.from("cart_summary").insert(summaryRows)
      if (summaryError) {
        console.error("Cart summary error:", JSON.stringify(summaryError))
      }
    }

    // Update inventory
    var inventoryMap = {}
    allCards.forEach(function (card) {
      var key = card.snack_name
      if (!inventoryMap[key]) inventoryMap[key] = 0
      inventoryMap[key] += 1
    })

    for (var itemName in inventoryMap) {
      var { data: inv } = await supabase
        .from("snack_inventory")
        .select("*")
        .eq("snack_name", itemName)
        .single()

      if (inv) {
        await supabase
          .from("snack_inventory")
          .update({ total_stock: inv.total_stock + inventoryMap[itemName] })
          .eq("id", inv.id)
      } else {
        await supabase
          .from("snack_inventory")
          .insert({ snack_name: itemName, total_stock: inventoryMap[itemName], used_today: 0 })
      }
    }

    return Response.json({
      success: true,
      cardsGenerated: allCards.length,
      message: "Cards generated successfully!",
    })
  } catch (error) {
    console.error("Generate cards error:", error)
    return Response.json({ error: "Internal server error: " + error.message }, { status: 500 })
  }
}