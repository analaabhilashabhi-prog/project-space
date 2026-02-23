"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { TECHNOLOGIES, BRANCHES, EVENT_CONFIG } from "@/config/formFields"

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [leaderRoll, setLeaderRoll] = useState("")
  const [currentStep, setCurrentStep] = useState(1) // 1: Project, 2: Members, 3: Review
  const [showConfirm, setShowConfirm] = useState(false)

  // Project details
  const [projectTitle, setProjectTitle] = useState("")
  const [projectDescription, setProjectDescription] = useState("")
  const [selectedTechs, setSelectedTechs] = useState([])
  const [otherTech, setOtherTech] = useState("")
  const [showOtherTech, setShowOtherTech] = useState(false)
  const [techSearch, setTechSearch] = useState("")

  // Members
  const [members, setMembers] = useState(
    Array.from({ length: EVENT_CONFIG.teamSize }, (_, i) => ({
      member_name: "",
      member_roll_number: "",
      member_email: "",
      member_phone: "",
      member_branch: "",
      member_year: "",
      member_college: "",
      is_leader: i === 0,
    }))
  )

  // Roll number check status: { "ROLL123": { checking: false, exists: false, message: "" } }
  const [rollChecks, setRollChecks] = useState({})

  useEffect(() => {
    const roll = sessionStorage.getItem("ps_roll")
    const loggedIn = sessionStorage.getItem("ps_logged_in")
    if (!loggedIn) {
      router.push("/")
      return
    }
    setLeaderRoll(roll || "")
    setMembers((prev) => {
      const updated = [...prev]
      updated[0].member_roll_number = roll || ""
      return updated
    })

    // Check if registrations are open
    async function checkRegistration() {
      try {
        const { data } = await (await import("@/lib/supabase")).supabase
          .from("settings")
          .select("value")
          .eq("id", "registration_open")
          .single()
        if (data?.value !== "true") {
          toast.error("Registrations are currently closed.")
          router.push("/")
        }
      } catch (err) {}
    }
    checkRegistration()
  }, [router])

  // Check roll number in real-time
 const checkRollNumber = async (rollNumber, index) => {
    if (!rollNumber || rollNumber.length < 3) return
    if (index === 0) return

    // Check duplicate within team
    const duplicate = members.find(
      (m, i) => i !== index && m.member_roll_number === rollNumber
    )
    if (duplicate) {
      setRollChecks((prev) => ({
        ...prev,
        [rollNumber]: { checking: false, exists: true, message: "Duplicate! This roll number is already in your team." },
      }))
      return
    }

    setRollChecks((prev) => ({ ...prev, [rollNumber]: { checking: true, exists: false, message: "" } }))

    try {
      const res = await fetch("/api/check-roll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollNumber }),
      })
      const data = await res.json()

      if (data.exists) {
        setRollChecks((prev) => ({
          ...prev,
          [rollNumber]: { checking: false, exists: true, message: data.message },
        }))
        toast.error(`${rollNumber} is already in Team ${data.teamNumber}`)
      } else {
        setRollChecks((prev) => ({
          ...prev,
          [rollNumber]: { checking: false, exists: false, message: "Available ✓" },
        }))
      }
    } catch {
      setRollChecks((prev) => ({ ...prev, [rollNumber]: { checking: false, exists: false, message: "" } }))
    }
  }

  const toggleTech = (tech) => {
    setSelectedTechs((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]
    )
  }

  const addOtherTech = () => {
    if (otherTech.trim() && !selectedTechs.includes(otherTech.trim())) {
      setSelectedTechs((prev) => [...prev, otherTech.trim()])
      setOtherTech("")
      setShowOtherTech(false)
    }
  }

  const handleMemberChange = (index, field, value) => {
    const updated = [...members]
    updated[index][field] = value
    setMembers(updated)

    // Check roll number when user finishes typing
    if (field === "member_roll_number" && value.length >= 5) {
      clearTimeout(window._rollCheckTimeout)
      window._rollCheckTimeout = setTimeout(() => checkRollNumber(value.toUpperCase(), index), 500)
    }
  }

  const filteredTechs = TECHNOLOGIES.filter((t) =>
    t.toLowerCase().includes(techSearch.toLowerCase())
  )

  // Validation
  const validateStep1 = () => {
    if (!projectTitle.trim()) { toast.error("Enter project title"); return false }
    if (selectedTechs.length === 0) { toast.error("Select at least one technology"); return false }
    return true
  }

  const validateStep2 = () => {
    for (let i = 0; i < members.length; i++) {
      const m = members[i]
      if (!m.member_name || !m.member_roll_number || !m.member_email || !m.member_phone || !m.member_branch || !m.member_year || !m.member_college) {
        toast.error(`Fill all details for Member ${i + 1}`)
        return false
      }
      // Check if any roll has conflict
      const check = rollChecks[m.member_roll_number]
      if (check?.exists) {
        toast.error(`${m.member_roll_number} is already in another team`)
        return false
      }
    }
    // Check duplicates
    const rolls = members.map((m) => m.member_roll_number)
    if (new Set(rolls).size !== rolls.length) {
      toast.error("Duplicate roll numbers found in your team")
      return false
    }
    return true
  }

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) setCurrentStep(2)
    else if (currentStep === 2 && validateStep2()) setCurrentStep(3)
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    setShowConfirm(false)
    setLoading(true)
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectTitle,
          projectDescription,
          technologies: selectedTechs,
          members,
        }),
      })
      const data = await res.json()

      if (data.success) {
        sessionStorage.setItem("ps_team_number", data.teamNumber)
        sessionStorage.setItem("ps_team_id", data.teamId)
        toast.success("Registration successful!")
        router.push(`/success/${data.teamNumber}`)
      } else {
        toast.error(data.error || "Registration failed")
      }
    } catch (err) {
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { num: 1, label: "Project Details" },
    { num: 2, label: "Team Members" },
    { num: 3, label: "Review & Submit" },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="absolute top-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-[120px]" />

      {/* Confirmation Popup */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
            <div className="w-14 h-14 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Confirm Registration</h3>
            <p className="text-gray-400 text-sm mb-6">
              Once registered, <strong className="text-white">team members cannot be changed</strong>. Please make sure all details are correct.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl font-medium hover:bg-white/10 transition-all">
                Go Back
              </button>
              <button onClick={handleSubmit} className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold rounded-xl hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all">
                Confirm & Register
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center font-bold text-black text-lg">PS</div>
          <span className="text-xl font-semibold">{EVENT_CONFIG.eventName}</span>
        </div>
        <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-400">
          👑 {leaderRoll}
        </div>
      </nav>

      <main className="relative z-10 max-w-4xl mx-auto px-8 py-4 pb-20">
        {/* Progress Bar */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div className={`flex items-center gap-2 ${currentStep >= s.num ? "text-emerald-400" : "text-gray-500"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                    currentStep > s.num ? "bg-emerald-500 border-emerald-500 text-black" :
                    currentStep === s.num ? "border-emerald-500 text-emerald-400" :
                    "border-gray-600 text-gray-500"
                  }`}>
                    {currentStep > s.num ? "✓" : s.num}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-12 sm:w-24 h-0.5 mx-2 ${currentStep > s.num ? "bg-emerald-500" : "bg-gray-700"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Project Details */}
        {currentStep === 1 && (
          <section className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
            <h2 className="text-2xl font-bold mb-6">Project Details</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Project Title *</label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="e.g. AI-Powered Campus Navigation System"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Project Description</label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe what your project does..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
                />
              </div>

              {/* Technology Multi-Select */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Technologies Used * <span className="text-gray-500">(select multiple)</span></label>
                {selectedTechs.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedTechs.map((tech) => (
                      <span key={tech} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-sm text-emerald-400">
                        {tech}
                        <button type="button" onClick={() => toggleTech(tech)} className="hover:text-white">✕</button>
                      </span>
                    ))}
                  </div>
                )}
                <input
                  type="text"
                  value={techSearch}
                  onChange={(e) => setTechSearch(e.target.value)}
                  placeholder="Search technologies..."
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all text-sm mb-3"
                />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-2">
                  {filteredTechs.map((tech) => (
                    <button
                      key={tech}
                      type="button"
                      onClick={() => toggleTech(tech)}
                      className={`px-3 py-2 rounded-lg text-sm text-left transition-all ${
                        selectedTechs.includes(tech)
                          ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                          : "bg-white/5 border border-white/10 text-gray-300 hover:border-white/20"
                      }`}
                    >
                      {selectedTechs.includes(tech) ? "✓ " : ""}{tech}
                    </button>
                  ))}
                </div>
                <div className="mt-3">
                  {!showOtherTech ? (
                    <button type="button" onClick={() => setShowOtherTech(true)} className="text-sm text-emerald-400 hover:text-emerald-300">+ Add other technology</button>
                  ) : (
                    <div className="flex gap-2">
                      <input type="text" value={otherTech} onChange={(e) => setOtherTech(e.target.value)} placeholder="Enter technology name" className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-emerald-500/50" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOtherTech())} />
                      <button type="button" onClick={addOtherTech} className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm">Add</button>
                      <button type="button" onClick={() => { setShowOtherTech(false); setOtherTech("") }} className="px-3 py-2 text-gray-400 text-sm">Cancel</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Step 2: Team Members */}
        {currentStep === 2 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Team Members ({EVENT_CONFIG.teamSize} members)</h2>
            <div className="space-y-6">
              {members.map((member, index) => {
                const rollCheck = rollChecks[member.member_roll_number]
                return (
                  <div key={index} className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-sm font-semibold text-gray-300">
                        {index === 0 ? "👑 Team Leader (Member 1)" : `Member ${index + 1}`}
                      </h3>
                      {index === 0 && <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">Leader</span>}
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <input type="text" value={member.member_name} onChange={(e) => handleMemberChange(index, "member_name", e.target.value)} placeholder="Full Name *" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all" />
                      <div>
                        <input
                          type="text"
                          value={member.member_roll_number}
                          onChange={(e) => handleMemberChange(index, "member_roll_number", e.target.value.toUpperCase())}
                          placeholder="Roll Number *"
                          disabled={index === 0}
                          className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all uppercase ${
                            index === 0 ? "opacity-60 border-white/10" :
                            rollCheck?.exists ? "border-red-500/50" :
                            rollCheck?.message === "Available ✓" ? "border-emerald-500/50" :
                            "border-white/10 focus:border-emerald-500/50"
                          }`}
                        />
                        {index !== 0 && rollCheck && (
                          <p className={`text-xs mt-1 ${rollCheck.exists ? "text-red-400" : rollCheck.checking ? "text-gray-400" : "text-emerald-400"}`}>
                            {rollCheck.checking ? "Checking..." : rollCheck.message}
                          </p>
                        )}
                      </div>
                      <input type="email" value={member.member_email} onChange={(e) => handleMemberChange(index, "member_email", e.target.value)} placeholder="Email *" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all" />
                      <input type="tel" value={member.member_phone} onChange={(e) => handleMemberChange(index, "member_phone", e.target.value)} placeholder="Phone Number *" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all" />
                      <input type="text" value={member.member_college} onChange={(e) => handleMemberChange(index, "member_college", e.target.value)} placeholder="College Name *" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all" />
                      <select value={member.member_branch} onChange={(e) => handleMemberChange(index, "member_branch", e.target.value)} className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 transition-all">
                        <option value="" className="bg-[#1a1a1a]">Select Branch *</option>
                        {BRANCHES.map((b) => (<option key={b} value={b} className="bg-[#1a1a1a]">{b}</option>))}
                      </select>
                      <select value={member.member_year} onChange={(e) => handleMemberChange(index, "member_year", e.target.value)} className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 transition-all">
                        <option value="" className="bg-[#1a1a1a]">Select Year *</option>
                        <option value="1st Year" className="bg-[#1a1a1a]">1st Year</option>
                        <option value="2nd Year" className="bg-[#1a1a1a]">2nd Year</option>
                        <option value="3rd Year" className="bg-[#1a1a1a]">3rd Year</option>
                        <option value="4th Year" className="bg-[#1a1a1a]">4th Year</option>
                      </select>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Step 3: Review */}
        {currentStep === 3 && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold mb-2">Review & Submit</h2>
            <p className="text-gray-400 mb-6">Please review all details before submitting.</p>

            {/* Project Review */}
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-emerald-400 flex items-center gap-2">💡 Project Details</h3>
                <button onClick={() => setCurrentStep(1)} className="text-xs text-gray-400 hover:text-white border border-white/10 px-3 py-1 rounded-lg">Edit</button>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Project Title</p>
                  <p className="font-medium">{projectTitle}</p>
                </div>
                {projectDescription && (
                  <div>
                    <p className="text-xs text-gray-500">Description</p>
                    <p className="text-gray-300 text-sm">{projectDescription}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Technologies</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selectedTechs.map((t) => (
                      <span key={t} className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs text-emerald-400">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Members Review */}
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-emerald-400 flex items-center gap-2">👥 Team Members ({members.length})</h3>
                <button onClick={() => setCurrentStep(2)} className="text-xs text-gray-400 hover:text-white border border-white/10 px-3 py-1 rounded-lg">Edit</button>
              </div>
              <div className="space-y-3">
                {members.map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${m.is_leader ? "bg-yellow-500/20 text-yellow-400" : "bg-white/10 text-gray-400"}`}>
                        {m.is_leader ? "👑" : i + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{m.member_name}</p>
                        <p className="text-xs text-gray-500">{m.member_roll_number} • {m.member_branch} • {m.member_year}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">{m.member_college}</p>
                      <p className="text-xs text-gray-500">{m.member_email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-4 mt-8">
          {currentStep > 1 && (
            <button onClick={handleBack} className="flex-1 py-4 bg-white/5 border border-white/10 rounded-xl font-semibold hover:bg-white/10 transition-all">
              ← Back
            </button>
          )}
          {currentStep < 3 ? (
            <button onClick={handleNext} className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold rounded-xl text-lg hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-all">
              Next →
            </button>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={loading}
              className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold rounded-xl text-lg hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-all disabled:opacity-50"
            >
              {loading ? "Registering..." : "Register Team →"}
            </button>
          )}
        </div>
      </main>
    </div>
  )
}