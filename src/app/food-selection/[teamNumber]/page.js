"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import toast, { Toaster } from "react-hot-toast"
import { supabase } from "@/lib/supabase"
import { EVENT_DAYS, BEVERAGES, SNACKS, EVENT_CONFIG } from "@/config/formFields"
import AnimatedBackground from "@/components/AnimatedBackground"

export default function FoodSelectionPage() {
  const params = useParams()
  const router = useRouter()
  const teamNumber = params.teamNumber
  const [team, setTeam] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentDay, setCurrentDay] = useState(1)
  const [selections, setSelections] = useState({})
  const [submittedDays, setSubmittedDays] = useState(new Set())
  const [showConfirm, setShowConfirm] = useState(false)
  const [generatingCards, setGeneratingCards] = useState(false)
  const [allDaysDone, setAllDaysDone] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const { data: teamData } = await supabase
        .from("teams")
        .select("*")
        .eq("team_number", teamNumber)
        .single()

      if (!teamData) { setLoading(false); return }
      setTeam(teamData)

      const { data: memberData } = await supabase
        .from("team_members")
        .select("*")
        .eq("team_id", teamData.id)
        .order("is_leader", { ascending: false })

      setMembers(memberData || [])

      const { data: foodData } = await supabase
        .from("food_selections")
        .select("*")
        .eq("team_id", teamData.id)

      if (foodData && foodData.length > 0) {
        const sel = {}
        foodData.forEach((f) => {
          const key = `${f.member_roll_number}-${f.day_number}`
          sel[key] = {
            beverage_morning: f.beverage_morning || "",
            beverage_afternoon: f.beverage_afternoon || "",
            beverage_evening: f.beverage_evening || "",
            beverage_night: f.beverage_night || "",
            snack_morning: f.snack_morning || "",
            snack_evening: f.snack_evening || "",
            snack_night: f.snack_night || "",
          }
        })
        setSelections(sel)

        const daySubmitted = new Set()
        EVENT_DAYS.forEach((day) => {
          const allMembersSelected = memberData?.every((m) => {
            const k = `${m.member_roll_number}-${day.dayNumber}`
            return sel[k] && sel[k].beverage_morning && sel[k].snack_morning
          })
          if (allMembersSelected) daySubmitted.add(day.dayNumber)
        })
        setSubmittedDays(daySubmitted)
      }

      // Check if all 7 days done
      if (foodData) {
        var allDays = new Set(foodData.map((f) => f.day_number))
        if (allDays.size >= 7) setAllDaysDone(true)
      }

      setLoading(false)
    }

    if (teamNumber) fetchData()
  }, [teamNumber])

  const getSelection = (rollNumber, dayNumber, field) => {
    const key = `${rollNumber}-${dayNumber}`
    return selections[key]?.[field] || ""
  }

  const setSelection = (rollNumber, dayNumber, field, value) => {
    const key = `${rollNumber}-${dayNumber}`
    setSelections((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), [field]: value },
    }))
  }

  const isDaySubmitted = (dayNumber) => submittedDays.has(dayNumber)

  const handleSubmitDay = () => {
    for (const member of members) {
      const key = `${member.member_roll_number}-${currentDay}`
      const sel = selections[key]
      if (!sel || !sel.beverage_morning || !sel.beverage_afternoon || !sel.beverage_evening || !sel.beverage_night || !sel.snack_morning || !sel.snack_evening || !sel.snack_night) {
        toast.error(`Please complete all selections for ${member.member_name}`)
        return
      }
    }
    setShowConfirm(true)
  }

  const confirmSubmit = async () => {
    setShowConfirm(false)
    setSaving(true)

    try {
      const dayData = EVENT_DAYS.find((d) => d.dayNumber === currentDay)
      const submitSelections = members.map((member) => {
        const key = `${member.member_roll_number}-${currentDay}`
        const sel = selections[key] || {}
        return { member_roll_number: member.member_roll_number, day_number: currentDay, day_date: dayData.date, ...sel }
      })

      const res = await fetch("/api/food-selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: team.id, selections: submitSelections }),
      })

      const data = await res.json()
      if (data.success) {
        var newSubmitted = new Set([...submittedDays, currentDay])
        setSubmittedDays(newSubmitted)
        if (newSubmitted.size >= 7) setAllDaysDone(true)
        toast.success(`Day ${currentDay} selections saved!`)
        if (currentDay < 7) setCurrentDay(currentDay + 1)
      } else {
        toast.error(data.error || "Failed to save")
      }
    } catch (err) {
      toast.error("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="ps-page">
        <AnimatedBackground />
        <div style={{ position: "relative", zIndex: 10, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="ps-spinner" style={{ width: 32, height: 32 }} />
        </div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="ps-page">
        <AnimatedBackground />
        <div style={{ position: "relative", zIndex: 10, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <div className="ps-page-title" style={{ fontSize: 28 }}>Team Not Found</div>
          <button className="ps-btn ps-btn-secondary" onClick={() => router.push("/")}>← Back to Home</button>
        </div>
      </div>
    )
  }

  const dayLocked = isDaySubmitted(currentDay)

  return (
    <div className="ps-page">
      <AnimatedBackground />
      <Toaster position="top-center" toastOptions={{ style: { background: "#1a1a1a", color: "#fff", border: "1px solid rgba(255,60,30,0.2)", fontFamily: "var(--font-body)" } }} />

      <style jsx>{`
        .food-wrapper { position:relative; z-index:10; min-height:100vh; padding:0 20px 60px; }
        .food-container { max-width:1300px; margin:0 auto; }

        /* Header */
        .food-header { display:flex; align-items:center; justify-content:space-between; padding:20px 0; margin-bottom:8px; opacity:0; animation:psFadeIn 0.6s ease forwards; position:sticky; top:0; z-index:40; background:rgba(10,10,10,0.7); backdrop-filter:blur(15px); border-bottom:1px solid rgba(255,60,30,0.06); margin-left:-20px; margin-right:-20px; padding-left:20px; padding-right:20px; }
        .food-logo { display:flex; align-items:center; gap:10px; }
        .food-logo-icon { width:36px;height:36px; border-radius:10px; background:linear-gradient(135deg,#ff3020,#ff6040); display:flex; align-items:center; justify-content:center; font-family:var(--font-display); font-weight:900; font-size:14px; color:#fff; }
        .food-logo-info { font-family:var(--font-display); font-size:15px; font-weight:600; color:#fff; letter-spacing:1px; }
        .food-logo-sub { font-family:var(--font-display); font-size:11px; color:rgba(255,255,255,0.3); letter-spacing:1px; }
        .food-back { font-family:var(--font-display); font-size:12px; color:rgba(255,255,255,0.35); letter-spacing:1.5px; text-transform:uppercase; text-decoration:none; transition:color 0.3s ease; }
        .food-back:hover { color:var(--accent-orange); }

        /* Title */
        .food-title { font-family:var(--font-display); font-size:30px; font-weight:900; color:#fff; text-transform:uppercase; letter-spacing:2px; margin-bottom:6px; opacity:0; animation:psFadeIn 0.6s ease 0.15s forwards; }
        .food-subtitle { font-size:13px; color:rgba(255,255,255,0.3); margin-bottom:24px; opacity:0; animation:psFadeIn 0.5s ease 0.25s forwards; }

        /* Day tabs */
        .food-days { display:flex; gap:8px; margin-bottom:24px; overflow-x:auto; padding-bottom:6px; opacity:0; animation:psFadeIn 0.6s ease 0.3s forwards; }
        .food-day-btn { padding:10px 18px; border-radius:12px; font-family:var(--font-display); font-size:12px; font-weight:600; letter-spacing:1px; text-transform:uppercase; white-space:nowrap; cursor:pointer; transition:all 0.3s ease; display:flex; align-items:center; gap:5px; border:none; }
        .food-day-btn.active { background:linear-gradient(135deg,#ff3020,#ff6040); color:#fff; box-shadow:0 0 20px rgba(255,50,30,0.3); }
        .food-day-btn.submitted { background:rgba(255,60,30,0.08); border:1px solid rgba(255,60,30,0.25); color:var(--accent-light); }
        .food-day-btn.pending { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); color:rgba(255,255,255,0.35); }
        .food-day-btn.pending:hover { border-color:rgba(255,60,30,0.3); color:rgba(255,255,255,0.6); }

        /* Locked banner */
        .food-locked { padding:14px 20px; border-radius:14px; background:rgba(255,60,30,0.06); border:1px solid rgba(255,60,30,0.15); display:flex; align-items:center; gap:10px; margin-bottom:20px; font-size:13px; color:var(--accent-light); font-family:var(--font-display); letter-spacing:1px; }

        /* Section card */
        .food-section { padding:24px; border-radius:18px; border:1px solid rgba(255,60,30,0.1); background:linear-gradient(165deg,rgba(35,12,8,0.6),rgba(18,6,4,0.75)); backdrop-filter:blur(12px); margin-bottom:20px; overflow:hidden; opacity:0; animation:psFadeIn 0.7s ease 0.4s forwards; }
        .food-section-title { font-family:var(--font-display); font-size:18px; font-weight:700; color:#fff; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:16px; }

        /* Table */
        .food-table-wrap { overflow-x:auto; border-radius:12px; border:1px solid rgba(255,60,30,0.08); }
        .food-table { width:100%; border-collapse:collapse; }
        .food-table th { padding:12px 14px; text-align:left; font-family:var(--font-display); font-size:11px; font-weight:600; color:var(--accent-light); letter-spacing:2px; text-transform:uppercase; background:rgba(255,60,30,0.04); border-bottom:1px solid rgba(255,60,30,0.1); min-width:160px; }
        .food-table th:first-child { min-width:140px; }
        .food-table td { padding:12px 14px; border-bottom:1px solid rgba(255,255,255,0.03); vertical-align:top; }
        .food-table tr:hover td { background:rgba(255,60,30,0.02); }

        .food-member-cell { }
        .food-member-roll { font-family:var(--font-display); font-size:13px; font-weight:600; color:rgba(255,255,255,0.7); letter-spacing:1px; }
        .food-member-name { font-size:11px; color:rgba(255,255,255,0.3); }

        /* Food option buttons */
        .food-options { display:flex; flex-wrap:wrap; gap:5px; }
        .food-opt { padding:5px 10px; border-radius:8px; font-size:11px; font-family:var(--font-body); cursor:pointer; transition:all 0.25s ease; border:1px solid rgba(255,255,255,0.06); background:rgba(255,255,255,0.02); color:rgba(255,255,255,0.4); }
        .food-opt:hover:not(:disabled) { border-color:rgba(255,60,30,0.3); color:rgba(255,255,255,0.7); }
        .food-opt.selected { background:rgba(255,60,30,0.12); border-color:rgba(255,60,30,0.35); color:var(--accent-light); }
        .food-opt.locked { cursor:default; }
        .food-opt.locked.selected { background:rgba(255,60,30,0.1); border-color:rgba(255,60,30,0.2); color:var(--accent-light); opacity:0.8; }
        .food-opt.locked:not(.selected) { opacity:0.2; }

        /* Submit */
        .food-submit { width:100%; padding:16px; border-radius:14px; font-family:var(--font-display); font-size:16px; font-weight:700; letter-spacing:2px; text-transform:uppercase; background:linear-gradient(135deg,#ff3020,#ff6040); color:#fff; box-shadow:0 0 30px rgba(255,50,30,0.3); transition:all 0.4s ease; border:none; cursor:pointer; opacity:0; animation:psFadeIn 0.5s ease 0.6s forwards; }
        .food-submit:hover:not(:disabled) { box-shadow:0 0 50px rgba(255,50,30,0.5),0 8px 35px rgba(255,50,30,0.3); transform:translateY(-2px); }
        .food-submit:disabled { opacity:0.5; cursor:not-allowed; transform:none; }

        /* Progress */
        .food-progress { padding:20px 24px; border-radius:16px; border:1px solid rgba(255,60,30,0.1); background:rgba(255,255,255,0.015); margin-top:20px; opacity:0; animation:psFadeIn 0.5s ease 0.7s forwards; }
        .food-progress-label { font-family:var(--font-display); font-size:12px; color:rgba(255,255,255,0.3); letter-spacing:2px; text-transform:uppercase; margin-bottom:10px; }
        .food-progress-bars { display:flex; gap:6px; }
        .food-progress-bar { flex:1; height:6px; border-radius:3px; transition:background 0.3s ease; }
        .food-progress-bar.done { background:linear-gradient(90deg,#ff3020,#ff6040); }
        .food-progress-bar.pending { background:rgba(255,255,255,0.06); }
        .food-progress-count { font-size:12px; color:rgba(255,255,255,0.25); margin-top:8px; }

        /* Confirm modal */
        .food-confirm-overlay { position:fixed; inset:0; z-index:500; background:rgba(0,0,0,0.7); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; padding:20px; animation:psModalIn 0.3s ease; }
        .food-confirm-card { max-width:440px; width:100%; padding:32px; border-radius:20px; border:1px solid rgba(255,60,30,0.15); background:linear-gradient(165deg,rgba(35,12,8,0.9),rgba(18,6,4,0.95)); text-align:center; }
        .food-confirm-icon { width:56px;height:56px; border-radius:50%; background:rgba(255,170,0,0.12); border:1.5px solid rgba(255,170,0,0.25); display:flex; align-items:center; justify-content:center; margin:0 auto 16px; font-size:24px; }
        .food-confirm-title { font-family:var(--font-display); font-size:22px; font-weight:800; color:#fff; letter-spacing:2px; text-transform:uppercase; margin-bottom:8px; }
        .food-confirm-desc { font-size:13px; color:rgba(255,255,255,0.4); margin-bottom:24px; line-height:1.6; }
        .food-confirm-btns { display:flex; gap:12px; }

        @media (max-width:768px) {
          .food-header { flex-direction:column; gap:10px; align-items:flex-start; position:relative; }
          .food-title { font-size:22px; }
          .food-section { padding:16px; }
          .food-confirm-btns { flex-direction:column; }
        }
      `}</style>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="food-confirm-overlay">
          <div className="food-confirm-card">
            <div className="food-confirm-icon">⚠️</div>
            <div className="food-confirm-title">Confirm Submission</div>
            <div className="food-confirm-desc">
              Selections <strong style={{ color: "#fff" }}>cannot be edited</strong> once submitted. Are you sure you want to submit Day {currentDay} selections?
            </div>
            <div className="food-confirm-btns">
              <button className="ps-btn ps-btn-secondary" style={{ flex: 1 }} onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="ps-btn ps-btn-primary" style={{ flex: 1 }} onClick={confirmSubmit}>Submit</button>
            </div>
          </div>
        </div>
      )}

      <div className="food-wrapper">
        <div className="food-container">

          {/* Header */}
          <div className="food-header">
            <div className="food-logo">
              <div className="food-logo-icon">PS</div>
              <div>
                <div className="food-logo-info">{EVENT_CONFIG.eventName}</div>
                <div className="food-logo-sub">{team.team_number} • {team.project_title}</div>
              </div>
            </div>
            <Link href={"/team-info/" + team.team_number} className="food-back">← Back to Team</Link>
          </div>

          {/* Title */}
          <div className="food-title">🍔 Snacks & Beverages</div>
          <div className="food-subtitle">Select food preferences for all team members for each day.</div>

          {/* Day Tabs */}
          <div className="food-days">
            {EVENT_DAYS.map((day) => (
              <button
                key={day.dayNumber}
                onClick={() => setCurrentDay(day.dayNumber)}
                className={`food-day-btn ${currentDay === day.dayNumber ? "active" : isDaySubmitted(day.dayNumber) ? "submitted" : "pending"}`}
              >
                {isDaySubmitted(day.dayNumber) && "✓ "}{day.label}
              </button>
            ))}
          </div>

          {/* Locked Banner */}
          {dayLocked && (
            <div className="food-locked">
              ✓ Day {currentDay} selections have been submitted. These cannot be changed.
            </div>
          )}

          {/* Beverages */}
          <div className="food-section">
            <div className="food-section-title">🥤 Beverages</div>
            <div className="food-table-wrap">
              <table className="food-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    {Object.entries(BEVERAGES).map(([key, val]) => (
                      <th key={key}>{val.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <div className="food-member-cell">
                          <div className="food-member-roll">{member.member_roll_number}</div>
                          <div className="food-member-name">{member.member_name}</div>
                        </div>
                      </td>
                      {Object.entries(BEVERAGES).map(([key, val]) => (
                        <td key={key}>
                          <div className="food-options">
                            {val.options.map((option) => {
                              const field = `beverage_${key}`
                              const isSelected = getSelection(member.member_roll_number, currentDay, field) === option
                              return (
                                <button
                                  key={option}
                                  type="button"
                                  disabled={dayLocked}
                                  onClick={() => setSelection(member.member_roll_number, currentDay, field, option)}
                                  className={`food-opt ${isSelected ? "selected" : ""} ${dayLocked ? "locked" : ""}`}
                                >
                                  {option}
                                </button>
                              )
                            })}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Snacks */}
          <div className="food-section" style={{ animationDelay: "0.5s" }}>
            <div className="food-section-title">🍔 Snacks</div>
            <div className="food-table-wrap">
              <table className="food-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    {Object.entries(SNACKS).map(([key, val]) => (
                      <th key={key}>{val.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <div className="food-member-cell">
                          <div className="food-member-roll">{member.member_roll_number}</div>
                          <div className="food-member-name">{member.member_name}</div>
                        </div>
                      </td>
                      {Object.entries(SNACKS).map(([key, val]) => (
                        <td key={key}>
                          <div className="food-options">
                            {val.options.map((option) => {
                              const field = `snack_${key}`
                              const isSelected = getSelection(member.member_roll_number, currentDay, field) === option
                              return (
                                <button
                                  key={option}
                                  type="button"
                                  disabled={dayLocked}
                                  onClick={() => setSelection(member.member_roll_number, currentDay, field, option)}
                                  className={`food-opt ${isSelected ? "selected" : ""} ${dayLocked ? "locked" : ""}`}
                                >
                                  {option}
                                </button>
                              )
                            })}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Submit Button */}
          {!dayLocked && (
            <button className="food-submit" onClick={handleSubmitDay} disabled={saving}>
              {saving ? "Saving..." : `Submit Day ${currentDay} Selections →`}
            </button>
          )}

          {/* Progress */}
          <div className="food-progress">
            <div className="food-progress-label">Completion Progress</div>
            <div className="food-progress-bars">
              {EVENT_DAYS.map((day) => (
                <div key={day.dayNumber} className={`food-progress-bar ${isDaySubmitted(day.dayNumber) ? "done" : "pending"}`} />
              ))}
            </div>
            <div className="food-progress-count">{submittedDays.size} of 7 days completed</div>
          </div>

          {/* Final Submit - Generate Snack Cards */}
          {(allDaysDone || submittedDays.size >= 7) && (
            <button
              className="food-submit"
              style={{ marginTop: 16, background: "linear-gradient(135deg,#ff8020,#ffaa40)" }}
              onClick={function () {
                if (generatingCards) return
                setGeneratingCards(true)
                fetch("/api/generate-snack-cards", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ teamId: team.id, teamNumber: team.team_number }),
                })
                  .then(function (res) { return res.json() })
                  .then(function (data) {
                    if (data.success) {
                      toast.success(data.cardsGenerated + " snack cards generated!")
                      setTimeout(function () { router.push("/snack-cards/" + team.team_number) }, 1000)
                    } else {
                      toast.error(data.error || "Failed to generate cards")
                      if (data.error && data.error.includes("already generated")) {
                        setTimeout(function () { router.push("/snack-cards/" + team.team_number) }, 1000)
                      }
                    }
                    setGeneratingCards(false)
                  })
                  .catch(function () { toast.error("Something went wrong"); setGeneratingCards(false) })
              }}
              disabled={generatingCards}
            >
              {generatingCards ? "Generating Cards..." : "🛒 Generate Snack Cards & View Cart →"}
            </button>
          )}

        </div>
      </div>
    </div>
  )
}