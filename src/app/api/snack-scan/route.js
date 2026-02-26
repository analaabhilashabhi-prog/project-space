import { supabase } from "@/lib/supabase"

// Session time windows (24hr format)
var SESSION_TIMES = {
  morning: { start: 7, end: 11 },    // 7 AM - 11 AM
  evening: { start: 15, end: 19 },    // 3 PM - 7 PM
  night: { start: 19, end: 22 },      // 7 PM - 10 PM
}

// Event dates: May 6-12, 2026 = days 1-7
var EVENT_START = new Date("2026-05-06T00:00:00+05:30")

function getCurrentDay() {
  var now = new Date()
  var diffMs = now - EVENT_START
  var diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return -1  // event hasn't started
  if (diffDays > 6) return -2  // event is over
  return diffDays + 1           // day 1-7
}

function getCurrentSession() {
  var hour = new Date().getHours()
  if (hour >= SESSION_TIMES.morning.start && hour < SESSION_TIMES.morning.end) return "morning"
  if (hour >= SESSION_TIMES.evening.start && hour < SESSION_TIMES.evening.end) return "evening"
  if (hour >= SESSION_TIMES.night.start && hour < SESSION_TIMES.night.end) return "night"
  return null
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { action } = body

    // ========== SCAN QR ==========
    if (action === "scan") {
      const { qrToken, adminId, skipTimeCheck } = body

      if (!qrToken) {
        return Response.json({ error: "QR token is required" }, { status: 400 })
      }

      // Fetch snack card
      const { data: card, error: cardError } = await supabase
        .from("snack_cards")
        .select("*")
        .eq("qr_token", qrToken)
        .single()

      if (cardError || !card) {
        return Response.json({
          valid: false,
          error: "Invalid QR code. Card not found.",
          errorType: "not_found",
        }, { status: 400 })
      }

      // Check status
      if (card.status === "used") {
        return Response.json({
          valid: false,
          error: "This card has already been used on " + new Date(card.used_at).toLocaleString("en-IN"),
          errorType: "already_used",
          card: card,
        }, { status: 400 })
      }

      if (card.status === "expired") {
        return Response.json({
          valid: false,
          error: "This card has expired.",
          errorType: "expired",
          card: card,
        }, { status: 400 })
      }

      // Time validation (can be skipped during testing)
      if (!skipTimeCheck) {
        var currentDay = getCurrentDay()
        var currentSession = getCurrentSession()

        if (currentDay === -1) {
          return Response.json({
            valid: false,
            error: "Event has not started yet.",
            errorType: "event_not_started",
            card: card,
          }, { status: 400 })
        }

        if (currentDay === -2) {
          return Response.json({
            valid: false,
            error: "Event is over.",
            errorType: "event_over",
            card: card,
          }, { status: 400 })
        }

        if (card.day_number !== currentDay) {
          return Response.json({
            valid: false,
            error: "This card is for Day " + card.day_number + " but today is Day " + currentDay + ".",
            errorType: "wrong_day",
            card: card,
          }, { status: 400 })
        }

        if (!currentSession) {
          return Response.json({
            valid: false,
            error: "No active snack session right now. Sessions: Morning (7-11 AM), Evening (3-7 PM), Night (7-10 PM).",
            errorType: "no_session",
            card: card,
          }, { status: 400 })
        }

        if (card.session_type !== currentSession) {
          return Response.json({
            valid: false,
            error: "This card is for " + card.session_type + " session but current session is " + currentSession + ".",
            errorType: "wrong_session",
            card: card,
          }, { status: 400 })
        }
      }

      // VALID! Mark as used
      const { error: updateError } = await supabase
        .from("snack_cards")
        .update({
          status: "used",
          used_at: new Date().toISOString(),
          used_by_admin: adminId || "admin",
        })
        .eq("id", card.id)

      if (updateError) {
        return Response.json({ valid: false, error: "Failed to update card status" }, { status: 500 })
      }

      // Update cart_summary used count
      await supabase.rpc("increment_used_count", {
        p_team_id: card.team_id,
        p_roll: card.member_roll_number,
        p_snack: card.snack_name,
      }).catch(function () {
        // Fallback manual update
        supabase
          .from("cart_summary")
          .select("id, used_count")
          .eq("team_id", card.team_id)
          .eq("member_roll_number", card.member_roll_number)
          .eq("snack_name", card.snack_name)
          .single()
          .then(function (res) {
            if (res.data) {
              supabase
                .from("cart_summary")
                .update({ used_count: (res.data.used_count || 0) + 1 })
                .eq("id", res.data.id)
            }
          })
      })

      // Update inventory
      const { data: inv } = await supabase
        .from("snack_inventory")
        .select("*")
        .eq("snack_name", card.snack_name)
        .single()

      if (inv) {
        await supabase
          .from("snack_inventory")
          .update({ used_today: (inv.used_today || 0) + 1 })
          .eq("id", inv.id)
      }

      return Response.json({
        valid: true,
        message: "✅ Snack distributed successfully!",
        card: {
          member_name: card.member_name,
          member_roll_number: card.member_roll_number,
          day_number: card.day_number,
          session_type: card.session_type,
          snack_name: card.snack_name,
        },
      })
    }

    // ========== GET DASHBOARD STATS ==========
    if (action === "dashboard") {
      const { data: inventory } = await supabase
        .from("snack_inventory")
        .select("*")
        .order("snack_name")

      const { data: todayUsed } = await supabase
        .from("snack_cards")
        .select("snack_name")
        .eq("status", "used")
        .gte("used_at", new Date().toISOString().split("T")[0] + "T00:00:00")

      var todayCounts = {}
      if (todayUsed) {
        todayUsed.forEach(function (c) {
          todayCounts[c.snack_name] = (todayCounts[c.snack_name] || 0) + 1
        })
      }

      const { count: totalActive } = await supabase
        .from("snack_cards")
        .select("*", { count: "exact", head: true })
        .eq("status", "active")

      const { count: totalUsed } = await supabase
        .from("snack_cards")
        .select("*", { count: "exact", head: true })
        .eq("status", "used")

      return Response.json({
        success: true,
        inventory: inventory || [],
        todayCounts: todayCounts,
        totalActive: totalActive || 0,
        totalUsed: totalUsed || 0,
      })
    }

    // ========== EXPIRE CARDS ==========
    if (action === "expire_session") {
      var currentDay = getCurrentDay()
      var currentSession = getCurrentSession()

      // Expire all active cards for past sessions/days
      if (currentDay > 0) {
        // Expire all cards from previous days
        const { data: expired } = await supabase
          .from("snack_cards")
          .update({ status: "expired" })
          .eq("status", "active")
          .lt("day_number", currentDay)
          .select("id")

        return Response.json({
          success: true,
          expiredCount: expired ? expired.length : 0,
        })
      }

      return Response.json({ success: true, expiredCount: 0 })
    }

    return Response.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Snack scan error:", error)
    return Response.json({ error: "Internal server error: " + error.message }, { status: 500 })
  }
}