"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import SubtleBackground from "@/components/SubtleBackground"
import DashboardSidebar from "@/components/DashboardSidebar"

export default function FoodSelectionPage() {
  var params = useParams()
  var router = useRouter()
  var teamNumber = params.teamNumber

  var [team, setTeam] = useState(null)
  var [currentMember, setCurrentMember] = useState(null)
  var [isLeader, setIsLeader] = useState(false)
  var [loggedInRoll, setLoggedInRoll] = useState("")
  var [loading, setLoading] = useState(true)
  var [submitting, setSubmitting] = useState(false)
  var [isLocked, setIsLocked] = useState(false)
  var [selections, setSelections] = useState({})
  var [expandedDay, setExpandedDay] = useState(null)

  var snackOptions = ["Samosa", "Sandwich", "Puff", "Cake", "Biscuits", "Chips", "Vada Pav", "Bread Pakora"]
  var beverageOptions = ["Tea", "Coffee", "Juice", "Milk", "Buttermilk", "Water", "Lemonade", "Cold Coffee"]

  var snackIcons = {
    "Samosa": "\ud83e\udd5f",
    "Sandwich": "\ud83e\udd6a",
    "Puff": "\ud83e\udd50",
    "Cake": "\ud83c\udf70",
    "Biscuits": "\ud83c\udf6a",
    "Chips": "\ud83c\udf5f",
    "Vada Pav": "\ud83c\udf54",
    "Bread Pakora": "\ud83e\uddc7",
  }

  var beverageIcons = {
    "Tea": "\ud83c\udf75",
    "Coffee": "\u2615",
    "Juice": "\ud83e\uddc3",
    "Milk": "\ud83e\udd5b",
    "Buttermilk": "\ud83e\udd5b",
    "Water": "\ud83d\udca7",
    "Lemonade": "\ud83c\udf4b",
    "Cold Coffee": "\ud83e\uddca",
  }

  // Event dates: May 6-12, 2026
  var eventDates = [
    "2026-05-06", "2026-05-07", "2026-05-08", "2026-05-09",
    "2026-05-10", "2026-05-11", "2026-05-12"
  ]

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

      if (!teamRes.data) { setLoading(false); return }
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

      // Load saved food selections
      var foodRes = await supabase
        .from("food_selections")
        .select("*")
        .eq("member_roll_number", roll)
        .order("day_number", { ascending: true })

      if (foodRes.data && foodRes.data.length > 0) {
        var sels = {}
        foodRes.data.forEach(function (f) {
          // Read from new columns first, fallback to old morning columns
          var snackVal = f.snack || f.snack_morning || ""
          var bevVal = f.beverage || f.beverage_morning || ""
          if (snackVal || bevVal) {
            sels[f.day_number] = { snack: snackVal, beverage: bevVal }
          }
        })
        setSelections(sels)
      }

      // Check if cards already generated = locked
      var cardRes = await supabase
        .from("snack_cards")
        .select("id")
        .eq("member_roll_number", roll)
        .limit(1)

      if (cardRes.data && cardRes.data.length > 0) {
        setIsLocked(true)
        setExpandedDay(null)
      }

      setLoading(false)
    }

    if (teamNumber) fetchData()
  }, [teamNumber, router])

  function updateSelection(day, field, value) {
    if (isLocked) return
    var newSels = JSON.parse(JSON.stringify(selections))
    if (!newSels[day]) newSels[day] = {}
    newSels[day][field] = value
    setSelections(newSels)
  }

  function toggleDay(day) {
    setExpandedDay(expandedDay === day ? null : day)
  }

  function isAllComplete() {
    for (var d = 1; d <= 7; d++) {
      if (!selections[d] || !selections[d].snack || !selections[d].beverage) return false
    }
    return true
  }

  function getDayStatus(day) {
    var s = selections[day]
    if (!s) return "empty"
    if (s.snack && s.beverage) return "complete"
    return "partial"
  }

  async function handleFinalSubmit() {
    if (!isAllComplete() || isLocked) return
    setSubmitting(true)

    try {
      for (var d = 1; d <= 7; d++) {
        // Check if row exists for this member + day
        var { data: existing } = await supabase
          .from("food_selections")
          .select("id")
          .eq("member_roll_number", loggedInRoll)
          .eq("day_number", d)
          .maybeSingle()

        var rowData = {
          snack: selections[d].snack,
          beverage: selections[d].beverage,
          snack_morning: selections[d].snack,
          beverage_morning: selections[d].beverage,
          submitted_at: new Date().toISOString(),
        }

        if (existing) {
          // Update existing row
          var { error: updateErr } = await supabase
            .from("food_selections")
            .update(rowData)
            .eq("id", existing.id)

          if (updateErr) {
            console.error("Update failed day " + d + ":", updateErr)
            alert("Failed to update day " + d + ": " + updateErr.message)
            setSubmitting(false)
            return
          }
        } else {
          // Insert new row
          rowData.team_id = team.id
          rowData.team_number = teamNumber
          rowData.member_roll_number = loggedInRoll
          rowData.member_name = currentMember ? currentMember.member_name : ""
          rowData.day_number = d
          rowData.day_date = eventDates[d - 1]

          var { error: insertErr } = await supabase
            .from("food_selections")
            .insert(rowData)

          if (insertErr) {
            console.error("Insert failed day " + d + ":", insertErr)
            alert("Failed to save day " + d + ": " + insertErr.message)
            setSubmitting(false)
            return
          }
        }
      }

      // Generate snack cards
      var res = await fetch("/api/generate-snack-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_id: team.id,
          team_number: teamNumber,
          member_roll_number: loggedInRoll,
          member_name: currentMember ? currentMember.member_name : "",
        })
      })

      var resData = await res.json()
      if (res.ok) {
        setIsLocked(true)
        router.push("/snack-cards/" + teamNumber)
      } else {
        console.error("Card generation failed:", resData)
        alert("Card generation failed: " + (resData.error || "Unknown error"))
      }
    } catch (err) {
      console.error("Submit failed:", err)
      alert("Submit failed: " + err.message)
    }
    setSubmitting(false)
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

  var allComplete = isAllComplete()
  var completedCount = Object.keys(selections).filter(function (d) { return selections[d] && selections[d].snack && selections[d].beverage }).length

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: "'DM Sans', sans-serif", overflow: "hidden" }}>
      <SubtleBackground />

      <style jsx>{`
        .day-acc { border-radius:14px; overflow:hidden; margin-bottom:8px; transition:all 0.3s ease; display:inline-flex; flex-direction:column; border:1px solid rgba(255,255,255,0.06); }
        .day-acc.exp { display:flex; border-color:rgba(255,60,30,0.2); width:100%; }
        .day-acc.done:not(.exp) { border-color:rgba(50,200,80,0.15); }
        .day-acc.locked { opacity:0.85; }
        .day-hd { display:flex; align-items:center; gap:10px; padding:8px 16px; cursor:pointer; transition:all 0.25s ease; background:rgba(255,255,255,0.02); user-select:none; white-space:nowrap; }
        .day-hd:hover { background:rgba(255,255,255,0.04); }
        .day-acc.exp .day-hd { padding:10px 16px; background:rgba(255,60,30,0.04); border-bottom:1px solid rgba(255,255,255,0.04); justify-content:space-between; }
        .day-bd { max-height:0; overflow:hidden; transition:max-height 0.4s cubic-bezier(0.4,0,0.2,1); }
        .day-acc.exp .day-bd { max-height:250px; }
        .fg { padding:10px 16px; }
        .fo-section { margin-bottom:10px; }
        .fo-row { display:flex; gap:8px; overflow-x:auto; padding-bottom:4px; }
        .fo-row::-webkit-scrollbar { height:4px; }
        .fo-row::-webkit-scrollbar-track { background:rgba(255,255,255,0.02); border-radius:2px; }
        .fo-row::-webkit-scrollbar-thumb { background:rgba(255,60,30,0.2); border-radius:2px; }
        .fo { padding:8px 12px; border-radius:10px; cursor:pointer; border:1px solid rgba(255,255,255,0.06); background:rgba(255,255,255,0.02); transition:all 0.2s ease; font-size:13px; color:#888; white-space:nowrap; flex-shrink:0; display:flex; align-items:center; gap:6px; }
        .fo:hover { background:rgba(255,255,255,0.05); color:#ccc; border-color:rgba(255,255,255,0.1); }
        .fo.sel { border-color:rgba(255,60,30,0.5); background:rgba(255,60,30,0.18); color:#ffffff; font-weight:700; box-shadow:0 0 20px rgba(255,50,30,0.12); }
        .fo.lk { cursor:not-allowed; }
        .fo.lk.sel { background:rgba(255,60,30,0.14); color:#ffffff; border-color:rgba(255,60,30,0.35); opacity:0.9; }
        .sd { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
        .sd.empty { background:#333; }
        .sd.partial { background:#f59e0b; }
        .sd.complete { background:#4ade80; }
        .chev { font-size:18px; color:#555; transition:transform 0.3s ease; display:inline-block; }
        .day-acc.exp .chev { transform:rotate(180deg); }
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
            Food Selection
          </div>
          <div style={{ fontSize: 13, color: "#666" }}>
            Selecting for: <strong style={{ color: "#ff6040" }}>{currentMember ? currentMember.member_name : loggedInRoll}</strong>
          </div>
        </div>

        <div style={{ padding: "24px 32px", flex: 1 }}>

          {/* Locked banner */}
          {isLocked && (
            <div style={{
              padding: "14px 20px", borderRadius: 14, marginBottom: 20,
              background: "rgba(50,200,80,0.06)", border: "1px solid rgba(50,200,80,0.15)",
              display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>{"\u2705"}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#4ade80" }}>Selections submitted & cards generated!</div>
                  <div style={{ fontSize: 12, color: "#666" }}>Your selections are locked and cannot be changed.</div>
                </div>
              </div>
              <button onClick={function () { router.push("/snack-cards/" + teamNumber) }} style={{
                padding: "10px 20px", borderRadius: 10, border: "1px solid rgba(50,200,80,0.3)",
                background: "rgba(50,200,80,0.1)", color: "#4ade80", fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              }}>
                View My Cards {"\u2192"}
              </button>
            </div>
          )}

          {/* Progress bar */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: "#666" }}>Progress</span>
              <span style={{ fontSize: 13, color: "#888", fontWeight: 600 }}>{completedCount}/7 days</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 3, transition: "width 0.5s ease",
                background: allComplete ? "linear-gradient(90deg,#4ade80,#22c55e)" : "linear-gradient(90deg,#ff3020,#ff6040)",
                width: (completedCount / 7 * 100) + "%",
              }} />
            </div>
          </div>

          {/* Accordion Days */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-start" }}>
          {[1, 2, 3, 4, 5, 6, 7].map(function (day) {
            var status = getDayStatus(day)
            var isExp = expandedDay === day
            var daySel = selections[day] || {}

            return (
              <div key={day} className={"day-acc" + (isExp ? " exp" : "") + (status === "complete" ? " done" : "") + (isLocked ? " locked" : "")}>
                <div className="day-hd" onClick={function () { toggleDay(day) }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div className={"sd " + status} />
                    <div style={{ fontFamily: "'Genos', sans-serif", fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: 1 }}>
                      Day {day}
                    </div>
                    {status === "complete" && !isExp && (
                      <div style={{ fontSize: 11, color: "#666", marginLeft: 4 }}>
                        {daySel.snack} + {daySel.beverage}
                      </div>
                    )}
                  </div>
                  {isExp && (
                    <span className="chev">{"\u25b2"}</span>
                  )}
                  {!isExp && status === "complete" && (
                    <span style={{ fontSize: 12, color: "#4ade80", marginLeft: 6 }}>{"\u2713"}</span>
                  )}
                </div>

                <div className="day-bd">
                  <div className="fg">
                    {/* Snacks - title + items inline */}
                    <div className="fo-section">
                      <div className="fo-row">
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap", flexShrink: 0 }}>
                          {"\ud83c\udf54"} Snacks
                        </div>
                        {snackOptions.map(function (opt) {
                          var isSel = daySel.snack === opt
                          return (
                            <div
                              key={opt}
                              className={"fo" + (isSel ? " sel" : "") + (isLocked ? " lk" : "")}
                              onClick={function () { if (!isLocked) updateSelection(day, "snack", opt) }}
                            >
                              <span style={{ fontSize: 15, opacity: isSel ? 1 : 0.35 }}>{snackIcons[opt] || "\ud83c\udf7d\ufe0f"}</span>
                              {opt}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Beverages - title + items inline */}
                    <div className="fo-section">
                      <div className="fo-row">
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap", flexShrink: 0 }}>
                          {"\u2615"} Beverages
                        </div>
                        {beverageOptions.map(function (opt) {
                          var isSel = daySel.beverage === opt
                          return (
                            <div
                              key={opt}
                              className={"fo" + (isSel ? " sel" : "") + (isLocked ? " lk" : "")}
                              onClick={function () { if (!isLocked) updateSelection(day, "beverage", opt) }}
                            >
                              <span style={{ fontSize: 15, opacity: isSel ? 1 : 0.35 }}>{beverageIcons[opt] || "\ud83c\udf7d\ufe0f"}</span>
                              {opt}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          </div>

          {/* Final Submit */}
          {!isLocked && (
            <div style={{ marginTop: 28, textAlign: "center" }}>
              <button
                onClick={handleFinalSubmit}
                disabled={!allComplete || submitting}
                style={{
                  padding: "16px 48px", borderRadius: 16, border: "none",
                  background: !allComplete ? "#222" : submitting ? "#333" : "linear-gradient(135deg,#ff3020,#ff6040)",
                  color: !allComplete ? "#555" : "#fff",
                  fontSize: 18, fontWeight: 800, fontFamily: "'Genos', sans-serif",
                  cursor: !allComplete || submitting ? "not-allowed" : "pointer",
                  letterSpacing: 1, textTransform: "uppercase",
                  transition: "all 0.3s ease",
                  boxShadow: allComplete && !submitting ? "0 0 40px rgba(255,50,30,0.25)" : "none",
                }}
              >
                {submitting ? "Submitting & Generating..." : allComplete ? "\ud83c\udfab Submit & Generate Snack Cards" : "Complete all 7 days to submit"}
              </button>
              {!allComplete && (
                <div style={{ fontSize: 12, color: "#555", marginTop: 10 }}>
                  {7 - completedCount} day(s) remaining
                </div>
              )}
            </div>
          )}

          <div style={{ height: 40 }} />
        </div>
      </div>
    </div>
  )
}