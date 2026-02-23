"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import toast from "react-hot-toast"
import { supabase } from "@/lib/supabase"
import { EVENT_DAYS, BEVERAGES, SNACKS, EVENT_CONFIG } from "@/config/formFields"

export default function FoodSelectionPage() {
  const params = useParams()
  const teamNumber = params.teamNumber
  const [team, setTeam] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentDay, setCurrentDay] = useState(1)
  const [selections, setSelections] = useState({})
  const [submittedDays, setSubmittedDays] = useState(new Set())
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const { data: teamData } = await supabase
        .from("teams")
        .select("*")
        .eq("team_number", teamNumber)
        .single()

      if (!teamData) {
        setLoading(false)
        return
      }
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
      [key]: {
        ...(prev[key] || {}),
        [field]: value,
      },
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
        return {
          member_roll_number: member.member_roll_number,
          day_number: currentDay,
          day_date: dayData.date,
          ...sel,
        }
      })

      const res = await fetch("/api/food-selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: team.id,
          selections: submitSelections,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setSubmittedDays((prev) => new Set([...prev, currentDay]))
        toast.success(`Day ${currentDay} selections saved!`)
        if (currentDay < 7) {
          setCurrentDay(currentDay + 1)
        }
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
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Team not found</h1>
        <Link href="/" className="text-emerald-400 hover:underline">Go back home</Link>
      </div>
    )
  }

  const dayLocked = isDaySubmitted(currentDay)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Confirm Popup */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
            <div className="w-14 h-14 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Confirm Submission</h3>
            <p className="text-gray-400 text-sm mb-6">
              Selections <strong className="text-white">cannot be edited</strong> once submitted. Are you sure you want to submit Day {currentDay} selections?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl font-medium hover:bg-white/10 transition-all">
                Cancel
              </button>
              <button onClick={confirmSubmit} className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold rounded-xl hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <nav className="sticky top-0 z-40 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center justify-between px-6 py-4 max-w-[1400px] mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center font-bold text-black text-sm">PS</div>
            <div>
              <span className="text-base font-semibold">{EVENT_CONFIG.eventName}</span>
              <span className="text-xs text-gray-500 ml-2">{team.team_number} • {team.project_title}</span>
            </div>
          </div>
          <Link href={`/team-info/${team.team_number}`} className="text-sm text-gray-400 hover:text-white transition-colors">
            ← Back to Team
          </Link>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">🍔 Snacks & Beverages Selection</h1>
          <p className="text-gray-400">Select food preferences for all team members for each day.</p>
        </div>

        {/* Day Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {EVENT_DAYS.map((day) => (
            <button
              key={day.dayNumber}
              onClick={() => setCurrentDay(day.dayNumber)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                currentDay === day.dayNumber
                  ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-black"
                  : isDaySubmitted(day.dayNumber)
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                  : "bg-white/5 border border-white/10 text-gray-400 hover:text-white"
              }`}
            >
              {isDaySubmitted(day.dayNumber) && "✓ "}
              {day.label}
            </button>
          ))}
        </div>

        {/* Status */}
        {dayLocked && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
            <span className="text-emerald-400">✓</span>
            <p className="text-sm text-emerald-400">Day {currentDay} selections have been submitted. These cannot be changed.</p>
          </div>
        )}

        {/* Beverages Section */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">🥤 Beverages</h2>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase min-w-[150px]">Member</th>
                  {Object.entries(BEVERAGES).map(([key, val]) => (
                    <th key={key} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase min-w-[180px]">
                      {val.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-sm">{member.member_roll_number}</p>
                        <p className="text-xs text-gray-500">{member.member_name}</p>
                      </div>
                    </td>
                    {Object.entries(BEVERAGES).map(([key, val]) => (
                      <td key={key} className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {val.options.map((option) => {
                            const field = `beverage_${key}`
                            const isSelected = getSelection(member.member_roll_number, currentDay, field) === option
                            return (
                              <button
                                key={option}
                                type="button"
                                disabled={dayLocked}
                                onClick={() => setSelection(member.member_roll_number, currentDay, field, option)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                                  dayLocked
                                    ? isSelected
                                      ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                                      : "bg-white/[0.02] border border-white/5 text-gray-600 opacity-40"
                                    : isSelected
                                    ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                                    : "bg-white/5 border border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
                                }`}
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
        </section>

        {/* Snacks Section */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">🍔 Snacks</h2>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase min-w-[150px]">Member</th>
                  {Object.entries(SNACKS).map(([key, val]) => (
                    <th key={key} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase min-w-[180px]">
                      {val.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-sm">{member.member_roll_number}</p>
                        <p className="text-xs text-gray-500">{member.member_name}</p>
                      </div>
                    </td>
                    {Object.entries(SNACKS).map(([key, val]) => (
                      <td key={key} className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {val.options.map((option) => {
                            const field = `snack_${key}`
                            const isSelected = getSelection(member.member_roll_number, currentDay, field) === option
                            return (
                              <button
                                key={option}
                                type="button"
                                disabled={dayLocked}
                                onClick={() => setSelection(member.member_roll_number, currentDay, field, option)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                                  dayLocked
                                    ? isSelected
                                      ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-400"
                                      : "bg-white/[0.02] border border-white/5 text-gray-600 opacity-40"
                                    : isSelected
                                    ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-400"
                                    : "bg-white/5 border border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
                                }`}
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
        </section>

        {/* Submit Button */}
        {!dayLocked && (
          <button
            onClick={handleSubmitDay}
            disabled={saving}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold rounded-xl text-lg hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-all duration-300 disabled:opacity-50"
          >
            {saving ? "Saving..." : `Submit Day ${currentDay} Selections →`}
          </button>
        )}

        {/* Progress */}
        <div className="mt-8 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
          <p className="text-sm text-gray-400 mb-3">Completion Progress</p>
          <div className="flex gap-2">
            {EVENT_DAYS.map((day) => (
              <div
                key={day.dayNumber}
                className={`flex-1 h-2 rounded-full ${
                  isDaySubmitted(day.dayNumber) ? "bg-gradient-to-r from-emerald-500 to-cyan-500" : "bg-white/10"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">{submittedDays.size} of 7 days completed</p>
        </div>
      </main>
    </div>
  )
}