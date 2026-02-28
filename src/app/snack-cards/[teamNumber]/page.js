"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import SubtleBackground from "@/components/SubtleBackground"
import DashboardSidebar from "@/components/DashboardSidebar"

export default function SnackCardsPage() {
  var params = useParams()
  var router = useRouter()
  var teamNumber = params.teamNumber

  var [team, setTeam] = useState(null)
  var [currentMember, setCurrentMember] = useState(null)
  var [isLeader, setIsLeader] = useState(false)
  var [loggedInRoll, setLoggedInRoll] = useState("")
  var [loading, setLoading] = useState(true)
  var [allCards, setAllCards] = useState([])

  // Filters
  var [typeFilter, setTypeFilter] = useState("all") // "all" | "snack" | "beverage"
  var [selectedDay, setSelectedDay] = useState(null) // null = all days, or 1-7

  useEffect(function () {
    var roll = sessionStorage.getItem("ps_roll") || localStorage.getItem("ps_roll")
    if (!roll) {
      router.push("/login")
      return
    }
    setLoggedInRoll(roll)

    async function fetchData() {
      var teamRes = await supabase
        .from("teams")
        .select("*")
        .eq("team_number", teamNumber)
        .single()

      if (teamRes.data) {
        setTeam(teamRes.data)

        var memberRes = await supabase
          .from("team_members")
          .select("*")
          .eq("team_id", teamRes.data.id)
          .eq("member_roll_number", roll)
          .single()

        if (memberRes.data) {
          setCurrentMember(memberRes.data)
          setIsLeader(memberRes.data.is_leader || false)
        }
      }

      // Get THIS person's snack cards
      var cardsRes = await supabase
        .from("snack_cards")
        .select("*")
        .eq("member_roll_number", roll)
        .order("day_number", { ascending: true })

      if (cardsRes.data) {
        setAllCards(cardsRes.data)
      }

      setLoading(false)
    }

    if (teamNumber) fetchData()
  }, [teamNumber, router])

  function getQrUrl(token) {
    return "https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=" + encodeURIComponent(token) + "&color=ffffff&bgcolor=0a0a0a"
  }

  // Get filtered cards based on current view mode
  function getFilteredCards() {
    var cards = allCards

    // If day is selected, filter by day (day filter view)
    if (selectedDay !== null) {
      return cards.filter(function (c) { return c.day_number === selectedDay })
    }

    // If type filter active (type filter view)
    if (typeFilter === "snack") {
      return cards.filter(function (c) { return c.card_type === "snack" || c.session_type === "snack" })
    }
    if (typeFilter === "beverage") {
      return cards.filter(function (c) { return c.card_type === "beverage" || c.session_type === "beverage" })
    }

    return cards
  }

  // When selecting a day, reset type filter; when selecting type, reset day
  function selectType(type) {
    setTypeFilter(type)
    setSelectedDay(null)
  }

  function selectDay(day) {
    if (selectedDay === day) {
      setSelectedDay(null) // deselect
    } else {
      setSelectedDay(day)
      setTypeFilter("all") // reset type filter when day is selected
    }
  }

  function renderCard(card) {
    var isUsed = card.is_used || card.status === "used" || false
    var isSnack = card.card_type === "snack" || card.session_type === "snack"
    var itemName = card.item_name || card.snack_name || "Item"
    return (
      <div key={card.id} style={{
        padding: "24px 22px", borderRadius: 18,
        border: isUsed ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(255,60,30,0.15)",
        background: isUsed ? "rgba(255,255,255,0.01)" : "linear-gradient(165deg,rgba(30,12,8,0.6),rgba(15,6,4,0.8))",
        opacity: isUsed ? 0.5 : 1,
        position: "relative", overflow: "hidden",
        transition: "all 0.3s ease",
      }}>
        {isUsed && (
          <div style={{
            position: "absolute", top: 12, right: 12,
            padding: "4px 10px", borderRadius: 8,
            background: "rgba(255,50,30,0.15)", color: "#ff6040",
            fontSize: 11, fontWeight: 700,
          }}>USED</div>
        )}

        {/* Type badge */}
        <div style={{
          position: "absolute", top: 12, left: 12,
          padding: "3px 10px", borderRadius: 8,
          background: isSnack ? "rgba(255,150,50,0.12)" : "rgba(100,180,255,0.12)",
          color: isSnack ? "#ffaa40" : "#64b5f6",
          fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1,
        }}>
          {card.card_type}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14, marginTop: 20 }}>
          <div style={{ fontSize: 28 }}>{isSnack ? "\ud83c\udf54" : "\u2615"}</div>
          <div>
            <div style={{ fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: 1 }}>
              Day {card.day_number}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>
              {itemName}
            </div>
          </div>
        </div>

        {/* QR Code - WHITE */}
        <div style={{
          display: "flex", justifyContent: "center", padding: 12,
          background: "rgba(0,0,0,0.3)", borderRadius: 12, marginBottom: 10,
        }}>
          <img
            src={getQrUrl(card.qr_token || card.id)}
            alt="QR Code"
            style={{ width: 120, height: 120, borderRadius: 8 }}
          />
        </div>

        <div style={{ textAlign: "center", fontSize: 11, color: "#555" }}>
          {card.member_name || loggedInRoll}
        </div>

        {card.slot_number && (
          <div style={{ textAlign: "center", marginTop: 6, fontSize: 10, color: "#444", fontWeight: 600 }}>
            Slot #{card.slot_number}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <SubtleBackground />
        <div style={{ position: "relative", zIndex: 10 }}>
          <div className="ps-spinner" style={{ width: 32, height: 32 }} />
        </div>
      </div>
    )
  }

  var filteredCards = getFilteredCards()
  var noCards = allCards.length === 0
  var availableDays = []
  var daySet = {}
  allCards.forEach(function (c) { daySet[c.day_number] = true })
  for (var d = 1; d <= 7; d++) { if (daySet[d]) availableDays.push(d) }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: "'DM Sans', sans-serif", overflow: "hidden" }}>
      <SubtleBackground />

      <style jsx>{`
        .filter-btn { padding:12px 24px; border-radius:14px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.03); color:#888; font-size:15px; font-weight:500; cursor:pointer; transition:all 0.25s ease; font-family:'DM Sans',sans-serif; }
        .filter-btn:hover { background:rgba(255,255,255,0.06); color:#ccc; border-color:rgba(255,255,255,0.12); }
        .filter-btn.active { background:linear-gradient(135deg,rgba(255,50,30,0.15),rgba(255,80,40,0.08)); border-color:rgba(255,60,30,0.35); color:#ff6040; font-weight:700; }
        .day-btn { width:50px; height:50px; border-radius:14px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.03); color:#888; font-size:16px; font-weight:600; cursor:pointer; transition:all 0.25s ease; display:flex; align-items:center; justify-content:center; font-family:'Genos',sans-serif; }
        .day-btn:hover { background:rgba(255,255,255,0.06); color:#ccc; }
        .day-btn.active { background:linear-gradient(135deg,#ff3020,#ff6040); border-color:transparent; color:#fff; font-weight:800; box-shadow:0 0 20px rgba(255,50,30,0.2); }
      `}</style>

      <DashboardSidebar
        teamNumber={teamNumber}
        currentMember={currentMember}
        loggedInRoll={loggedInRoll}
        isLeader={isLeader}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflowY: "auto", position: "relative", zIndex: 1 }}>
        {/* Top Bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 32px", borderBottom: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(10,10,10,0.8)", backdropFilter: "blur(15px)", position: "sticky", top: 0, zIndex: 40,
        }}>
          <div style={{ fontFamily: "'Genos', sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: 1, textTransform: "uppercase" }}>
            My Snack Cards
          </div>
          <div style={{ fontSize: 13, color: "#666" }}>
            {allCards.length} card{allCards.length !== 1 ? "s" : ""} total
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "24px 32px", flex: 1 }}>
          {noCards ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>{"\ud83c\udf7d\ufe0f"}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 8 }}>No Cards Yet</div>
              <div style={{ fontSize: 14, color: "#666", marginBottom: 24 }}>
                Complete food selection for all 7 days and submit to generate your cards.
              </div>
              <button onClick={function () { router.push("/food-selection/" + teamNumber) }} style={{
                padding: "12px 28px", borderRadius: 12, border: "none",
                background: "linear-gradient(135deg,#ff3020,#ff6040)", color: "#fff",
                fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              }}>
                Go to Food Selection
              </button>
            </div>
          ) : (
            <>
              {/* Type Filter Buttons */}
              <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                {[
                  { id: "all", label: "\ud83c\udfb4 All Cards" },
                  { id: "snack", label: "\ud83c\udf54 Snacks" },
                  { id: "beverage", label: "\u2615 Beverages" },
                ].map(function (f) {
                  return (
                    <button
                      key={f.id}
                      className={"filter-btn" + (typeFilter === f.id && selectedDay === null ? " active" : "")}
                      onClick={function () { selectType(f.id) }}
                    >
                      {f.label}
                    </button>
                  )
                })}
              </div>

              {/* Day Selector */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, color: "#555", marginBottom: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
                  Filter by Day
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {availableDays.map(function (day) {
                    return (
                      <button
                        key={day}
                        className={"day-btn" + (selectedDay === day ? " active" : "")}
                        onClick={function () { selectDay(day) }}
                      >
                        {day}
                      </button>
                    )
                  })}
                  {selectedDay !== null && (
                    <button
                      className="filter-btn"
                      onClick={function () { setSelectedDay(null) }}
                      style={{ fontSize: 12, padding: "8px 14px" }}
                    >
                      {"\u2715"} Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Active filter info */}
              {(selectedDay !== null || typeFilter !== "all") && (
                <div style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
                  Showing: {selectedDay !== null ? "Day " + selectedDay + " cards" : typeFilter === "snack" ? "Snack cards only" : typeFilter === "beverage" ? "Beverage cards only" : "All cards"}
                  {" "}({filteredCards.length} card{filteredCards.length !== 1 ? "s" : ""})
                </div>
              )}

              {/* Cards Grid */}
              {filteredCards.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#555" }}>
                  No cards match this filter.
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 }}>
                  {filteredCards.map(function (card) { return renderCard(card) })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}