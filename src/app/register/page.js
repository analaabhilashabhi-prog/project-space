"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import toast, { Toaster } from "react-hot-toast"
import { TECHNOLOGIES, BRANCHES, EVENT_CONFIG } from "@/config/formFields"
import AnimatedBackground from "@/components/AnimatedBackground"

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [leaderRoll, setLeaderRoll] = useState("")
  const [currentStep, setCurrentStep] = useState(1)
  const [showConfirm, setShowConfirm] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [teamNumber, setTeamNumber] = useState("")

  // Project details
  const [projectTitle, setProjectTitle] = useState("")
  const [projectDescription, setProjectDescription] = useState("")
  const [selectedTechs, setSelectedTechs] = useState([])
  const [otherTech, setOtherTech] = useState("")
  const [showOtherTech, setShowOtherTech] = useState(false)
  const [techSearch, setTechSearch] = useState("")

  // Dynamic members array — starts with leader only
  const [members, setMembers] = useState([
    {
      member_name: "",
      member_roll_number: "",
      member_email: "",
      member_phone: "",
      member_branch: "",
      member_year: "",
      member_college: "",
      is_leader: true,
      fromDB: false,
      lookupDone: false,
      lookupLoading: false,
      manualEntry: false,
    },
  ])

  const MIN_MEMBERS = 3
  const MAX_MEMBERS = 6

  // Load leader roll from session/URL and auto-lookup
  useEffect(function () {
    var params = new URLSearchParams(window.location.search)
    var rollFromUrl = params.get("roll")
    var roll = rollFromUrl || localStorage.getItem("ps_roll") || sessionStorage.getItem("ps_roll") || ""
    if (roll) {
      roll = roll.toUpperCase().trim()
      setLeaderRoll(roll)
      setMembers(function (prev) {
        var updated = [Object.assign({}, prev[0])]
        updated[0].member_roll_number = roll
        return updated
      })
      // Auto-lookup leader from students table
      lookupStudent(roll, 0, true)
    }
  }, [])

  // Lookup student by roll number
  var lookupStudent = useCallback(function (rollNumber, index, isLeader) {
    if (!rollNumber || rollNumber.length < 5) return

    setMembers(function (prev) {
      var updated = prev.map(function (m, i) {
        if (i === index) return Object.assign({}, m, { lookupLoading: true })
        return m
      })
      return updated
    })

    fetch("/api/lookup-student", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rollNumber: rollNumber.toUpperCase().trim() }),
    })
      .then(function (res) { return res.json() })
      .then(function (data) {
        setMembers(function (prev) {
          var updated = prev.map(function (m, i) {
            if (i !== index) return m
            var copy = Object.assign({}, m, { lookupLoading: false, lookupDone: true })

            if (data.alreadyInTeam) {
              toast.error(data.message)
              copy.lookupDone = false
              // Clear if not leader
              if (!isLeader) {
                copy.member_roll_number = ""
                copy.member_name = ""
                copy.member_college = ""
                copy.member_branch = ""
                copy.member_phone = ""
                copy.fromDB = false
                copy.manualEntry = false
              }
              return copy
            }

            if (data.found && data.student) {
              copy.member_name = data.student.name
              copy.member_college = data.student.college
              copy.member_branch = data.student.branch
              copy.member_phone = data.student.phone || ""
              copy.member_email = rollNumber.toLowerCase() + "@outlook.com"
              copy.fromDB = true
              copy.manualEntry = false
              if (!isLeader) toast.success("Found: " + data.student.name)
            } else {
              copy.fromDB = false
              copy.manualEntry = true
              if (!isLeader) toast("Not in database — enter details manually", { icon: "📝" })
            }
            return copy
          })
          return updated
        })
      })
      .catch(function () {
        setMembers(function (prev) {
          return prev.map(function (m, i) {
            if (i === index) return Object.assign({}, m, { lookupLoading: false, manualEntry: true })
            return m
          })
        })
      })
  }, [])

  // Add a new member slot
  function addMember() {
    if (members.length >= MAX_MEMBERS) return
    setMembers(function (prev) {
      return prev.concat([{
        member_name: "",
        member_roll_number: "",
        member_email: "",
        member_phone: "",
        member_branch: "",
        member_year: "",
        member_college: "",
        is_leader: false,
        fromDB: false,
        lookupDone: false,
        lookupLoading: false,
        manualEntry: false,
      }])
    })
  }

  // Delete a member (cannot delete leader at index 0)
  function deleteMember(index) {
    if (index === 0) return
    setMembers(function (prev) {
      return prev.filter(function (_, i) { return i !== index })
    })
  }

  // Handle member field change
  function handleMemberChange(index, field, value) {
    setMembers(function (prev) {
      return prev.map(function (m, i) {
        if (i !== index) return m
        var copy = Object.assign({}, m)
        copy[field] = value
        return copy
      })
    })
  }

  // Handle roll number entry for non-leader members
  function handleRollBlur(index) {
    var member = members[index]
    if (!member.member_roll_number || member.member_roll_number.length < 5) return
    if (member.lookupDone && member.fromDB) return // already looked up

    // Check for duplicates
    var roll = member.member_roll_number.toUpperCase().trim()
    var isDuplicate = members.some(function (m, i) {
      return i !== index && m.member_roll_number.toUpperCase().trim() === roll
    })
    if (isDuplicate) {
      toast.error("Duplicate! " + roll + " is already in your team.")
      return
    }

    lookupStudent(roll, index, false)
  }

  // Technologies
  function toggleTech(tech) {
    setSelectedTechs(function (prev) {
      return prev.includes(tech) ? prev.filter(function (t) { return t !== tech }) : prev.concat([tech])
    })
  }

  function addOtherTech() {
    if (otherTech.trim() && !selectedTechs.includes(otherTech.trim())) {
      setSelectedTechs(function (prev) { return prev.concat([otherTech.trim()]) })
      setOtherTech("")
      setShowOtherTech(false)
    }
  }

  var filteredTechs = TECHNOLOGIES.filter(function (t) {
    return t.toLowerCase().includes(techSearch.toLowerCase())
  })

  // Validation
  function validateStep1() {
    if (!projectTitle.trim()) { toast.error("Enter project title"); return false }
    if (selectedTechs.length === 0) { toast.error("Select at least one technology"); return false }
    return true
  }

  function validateStep2() {
    if (members.length < MIN_MEMBERS) {
      toast.error("Minimum " + MIN_MEMBERS + " team members required (including you)")
      return false
    }
    if (members.length > MAX_MEMBERS) {
      toast.error("Maximum " + MAX_MEMBERS + " team members allowed")
      return false
    }

    for (var i = 0; i < members.length; i++) {
      var m = members[i]
      if (!m.member_name || !m.member_roll_number || !m.member_college || !m.member_branch) {
        toast.error("Fill all required details for " + (i === 0 ? "Team Leader" : "Member " + (i + 1)))
        return false
      }
    }

    // Check for duplicate roll numbers within team
    var rolls = members.map(function (m) { return m.member_roll_number.toUpperCase().trim() })
    if (new Set(rolls).size !== rolls.length) {
      toast.error("Duplicate roll numbers found in your team")
      return false
    }
    return true
  }

  function handleNext() {
    if (currentStep === 1 && validateStep1()) setCurrentStep(2)
    else if (currentStep === 2 && validateStep2()) setCurrentStep(3)
  }

  function handleBack() {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  function handleSubmit() {
    setShowConfirm(false)
    setLoading(true)

    // Prepare members for API (clean up extra fields)
    var cleanMembers = members.map(function (m) {
      return {
        member_name: m.member_name,
        member_roll_number: m.member_roll_number.toUpperCase().trim(),
        member_email: m.member_email || (m.member_roll_number.toLowerCase() + "@outlook.com"),
        member_phone: m.member_phone || "",
        member_branch: m.member_branch,
        member_year: m.member_year || "",
        member_college: m.member_college,
        is_leader: m.is_leader,
      }
    })

    fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectTitle: projectTitle,
        projectDescription: projectDescription,
        technologies: selectedTechs,
        members: cleanMembers,
      }),
    })
      .then(function (res) { return res.json() })
      .then(function (data) {
        if (data.success) {
          sessionStorage.setItem("ps_team_number", data.teamNumber)
          sessionStorage.setItem("ps_team_id", data.teamId)
          setTeamNumber(data.teamNumber)
          setRegistered(true)
          toast.success("Team Registered Successfully!")
        } else {
          toast.error(data.error || "Registration failed")
        }
        setLoading(false)
      })
      .catch(function () {
        toast.error("Something went wrong")
        setLoading(false)
      })
  }

  var steps = [
    { num: 1, label: "Project Details" },
    { num: 2, label: "Team Members" },
    { num: 3, label: "Review & Submit" },
  ]

  var progressPercent = registered ? 100 : currentStep === 1 ? 33 : currentStep === 2 ? 66 : 100
  var canRegister = members.length >= MIN_MEMBERS && members.length <= MAX_MEMBERS

  return (
    <div className="ps-page">
      <AnimatedBackground />
      <Toaster position="top-center" toastOptions={{ style: { background: "#1a1a1a", color: "#fff", border: "1px solid rgba(255,60,30,0.2)", fontFamily: "var(--font-body)" } }} />

      <style jsx>{`
        .reg-wrapper { position:relative; z-index:10; min-height:100vh; padding:30px 20px 60px; }
        .reg-container { max-width:800px; margin:0 auto; }

        .reg-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:30px; opacity:0; animation:psFadeIn 0.6s ease forwards; }
        .reg-logo { display:flex; align-items:center; gap:10px; cursor:pointer; }
        .reg-logo-icon { width:40px;height:40px; border-radius:10px; background:linear-gradient(135deg,#ff3020,#ff6040); display:flex; align-items:center; justify-content:center; font-family:var(--font-display); font-weight:900; font-size:16px; color:#fff; letter-spacing:1px; }
        .reg-logo-text { font-family:var(--font-display); font-size:20px; font-weight:700; color:#fff; letter-spacing:2px; text-transform:uppercase; }
        .reg-leader-badge { padding:6px 14px; border-radius:50px; background:rgba(255,60,30,0.08); border:1px solid rgba(255,60,30,0.15); font-family:var(--font-display); font-size:12px; font-weight:600; color:var(--accent-light); letter-spacing:1.5px; text-transform:uppercase; display:flex; align-items:center; gap:6px; }

        .reg-progress { margin-bottom:35px; opacity:0; animation:psFadeIn 0.6s ease 0.15s forwards; }
        .reg-steps { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
        .reg-step { display:flex; align-items:center; gap:8px; }
        .reg-step-num { width:32px;height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-family:var(--font-display); font-size:14px; font-weight:700; border:2px solid; transition:all 0.4s ease; }
        .reg-step-num.done { background:var(--accent-orange); border-color:var(--accent-orange); color:#000; }
        .reg-step-num.active { border-color:var(--accent-orange); color:var(--accent-orange); }
        .reg-step-num.pending { border-color:rgba(255,255,255,0.15); color:rgba(255,255,255,0.25); }
        .reg-step-label { font-family:var(--font-display); font-size:12px; font-weight:500; letter-spacing:1.5px; text-transform:uppercase; color:rgba(255,255,255,0.4); }
        .reg-step-label.active { color:var(--accent-light); }
        .reg-step-line { flex:1; height:2px; margin:0 12px; background:rgba(255,255,255,0.08); }
        .reg-step-line.done { background:var(--accent-orange); }

        .reg-section { padding:32px; border-radius:20px; border:1px solid rgba(255,60,30,0.12); background:linear-gradient(165deg,rgba(35,12,8,0.7),rgba(18,6,4,0.85)); backdrop-filter:blur(15px); position:relative; overflow:hidden; opacity:0; animation:psFadeIn 0.7s ease 0.3s forwards; }
        .reg-section::before { content:''; position:absolute; top:0;left:0;right:0; height:2px; background:linear-gradient(90deg,#ff4020,#ff8040,#ffaa40); }
        .reg-section::after { content:''; position:absolute; top:-50%;left:-50%; width:200%;height:200%; background:radial-gradient(circle at 50% 0%,rgba(255,60,30,0.06),transparent 50%); pointer-events:none; }
        .reg-section-title { font-family:var(--font-display); font-size:24px; font-weight:800; color:#fff; text-transform:uppercase; letter-spacing:2px; margin-bottom:24px; position:relative; z-index:1; }

        .reg-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; position:relative; z-index:1; }
        .reg-field { position:relative; z-index:1; }

        .reg-tech-selected { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:14px; position:relative; z-index:1; }
        .reg-tech-chip { display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:50px; font-family:var(--font-display); font-size:12px; font-weight:500; letter-spacing:1px; text-transform:uppercase; background:rgba(255,60,30,0.15); border:1px solid rgba(255,60,30,0.3); color:var(--accent-light); }
        .reg-tech-chip button { background:none; border:none; color:var(--accent-light); cursor:pointer; font-size:13px; padding:0; transition:color 0.2s; }
        .reg-tech-chip button:hover { color:#fff; }

        .reg-tech-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(130px, 1fr)); gap:8px; max-height:200px; overflow-y:auto; padding-right:4px; position:relative; z-index:1; }
        .reg-tech-btn { padding:8px 12px; border-radius:10px; font-family:var(--font-body); font-size:13px; text-align:left; cursor:pointer; transition:all 0.3s ease; border:1px solid rgba(255,255,255,0.06); background:rgba(255,255,255,0.03); color:rgba(255,255,255,0.5); }
        .reg-tech-btn:hover { border-color:rgba(255,60,30,0.3); color:rgba(255,255,255,0.8); }
        .reg-tech-btn.selected { background:rgba(255,60,30,0.12); border-color:rgba(255,60,30,0.35); color:var(--accent-light); }

        .reg-add-tech { background:none; border:none; color:var(--accent-orange); font-family:var(--font-display); font-size:12px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; cursor:pointer; padding:8px 0; position:relative; z-index:1; transition:opacity 0.3s; }
        .reg-add-tech:hover { opacity:0.7; }
        .reg-add-tech-row { display:flex; gap:8px; position:relative; z-index:1; }

        /* Member card */
        .reg-member { padding:24px; border-radius:16px; border:1px solid rgba(255,60,30,0.08); background:rgba(255,255,255,0.015); margin-bottom:16px; position:relative; z-index:1; transition:all 0.3s ease; }
        .reg-member:hover { border-color:rgba(255,60,30,0.2); }
        .reg-member.leader { border-color:rgba(255,60,30,0.2); background:rgba(255,60,30,0.03); }
        .reg-member-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
        .reg-member-left { display:flex; align-items:center; gap:8px; }
        .reg-member-num { font-family:var(--font-display); font-size:13px; font-weight:600; color:rgba(255,255,255,0.5); letter-spacing:1.5px; text-transform:uppercase; }
        .reg-member-tag { padding:3px 10px; border-radius:50px; font-family:var(--font-display); font-size:10px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; background:rgba(255,60,30,0.12); color:var(--accent-light); border:1px solid rgba(255,60,30,0.2); }
        .reg-member-tag.leader-tag { background:linear-gradient(135deg,rgba(255,60,30,0.15),rgba(255,100,40,0.15)); border-color:rgba(255,60,30,0.3); }

        /* Delete button */
        .reg-delete-btn { width:32px; height:32px; border-radius:8px; border:1px solid rgba(255,60,60,0.15); background:rgba(255,60,60,0.06); color:#ff5555; font-size:16px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.3s ease; }
        .reg-delete-btn:hover { background:rgba(255,60,60,0.15); border-color:rgba(255,60,60,0.3); transform:scale(1.05); }

        /* Add member button */
        .reg-add-member { width:100%; padding:16px; border-radius:16px; border:2px dashed rgba(255,60,30,0.15); background:transparent; color:var(--accent-orange); font-family:var(--font-display); font-size:13px; font-weight:600; letter-spacing:2px; text-transform:uppercase; cursor:pointer; transition:all 0.3s ease; position:relative; z-index:1; display:flex; align-items:center; justify-content:center; gap:8px; }
        .reg-add-member:hover { border-color:rgba(255,60,30,0.35); background:rgba(255,60,30,0.04); }
        .reg-add-member:disabled { opacity:0.3; cursor:not-allowed; }

        /* Member count badge */
        .reg-member-count { display:flex; align-items:center; gap:8px; margin-bottom:20px; position:relative; z-index:1; }
        .reg-count-pill { padding:4px 12px; border-radius:50px; font-family:var(--font-display); font-size:11px; font-weight:600; letter-spacing:1px; }
        .reg-count-ok { background:rgba(68,255,102,0.08); border:1px solid rgba(68,255,102,0.2); color:#44ff66; }
        .reg-count-warn { background:rgba(255,170,0,0.08); border:1px solid rgba(255,170,0,0.2); color:#ffaa00; }
        .reg-count-text { font-size:12px; color:rgba(255,255,255,0.3); font-family:var(--font-display); letter-spacing:1px; }

        /* Lookup status */
        .reg-lookup-badge { display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:6px; font-family:var(--font-display); font-size:10px; font-weight:600; letter-spacing:1px; text-transform:uppercase; margin-top:4px; }
        .reg-lookup-found { background:rgba(68,255,102,0.08); border:1px solid rgba(68,255,102,0.15); color:#44ff66; }
        .reg-lookup-manual { background:rgba(255,170,0,0.08); border:1px solid rgba(255,170,0,0.15); color:#ffaa00; }
        .reg-lookup-loading { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:rgba(255,255,255,0.4); }

        /* Readonly field style */
        .ps-input.readonly { opacity:0.6; cursor:not-allowed; border-color:rgba(255,255,255,0.04); }

        /* Review card */
        .reg-review-card { padding:24px; border-radius:16px; border:1px solid rgba(255,60,30,0.1); background:rgba(255,255,255,0.015); margin-bottom:16px; position:relative; z-index:1; }
        .reg-review-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
        .reg-review-title { font-family:var(--font-display); font-size:14px; font-weight:700; color:var(--accent-light); letter-spacing:2px; text-transform:uppercase; }
        .reg-review-edit { padding:4px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.1); background:none; color:rgba(255,255,255,0.4); font-family:var(--font-display); font-size:11px; letter-spacing:1.5px; text-transform:uppercase; cursor:pointer; transition:all 0.3s ease; }
        .reg-review-edit:hover { border-color:var(--accent-orange); color:var(--accent-orange); }
        .reg-review-row { margin-bottom:12px; }
        .reg-review-label { font-size:11px; color:rgba(255,255,255,0.3); font-family:var(--font-display); letter-spacing:1px; text-transform:uppercase; margin-bottom:2px; }
        .reg-review-value { font-size:14px; color:rgba(255,255,255,0.8); }

        .reg-review-member { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border-radius:12px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.04); margin-bottom:8px; }
        .reg-review-member-left { display:flex; align-items:center; gap:10px; }
        .reg-review-member-avatar { width:32px;height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; font-family:var(--font-display); }
        .reg-review-member-avatar.leader { background:rgba(255,60,30,0.15); color:var(--accent-orange); }
        .reg-review-member-avatar.normal { background:rgba(255,255,255,0.06); color:rgba(255,255,255,0.4); }
        .reg-review-member-name { font-size:13px; font-weight:500; color:#fff; }
        .reg-review-member-sub { font-size:11px; color:rgba(255,255,255,0.35); }
        .reg-review-member-right { text-align:right; }

        .reg-nav { display:flex; gap:14px; margin-top:28px; opacity:0; animation:psFadeIn 0.6s ease 0.5s forwards; }

        /* Confirm modal */
        .reg-confirm-overlay { position:fixed; inset:0; z-index:500; background:rgba(0,0,0,0.7); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; padding:20px; animation:psModalIn 0.3s ease; }
        .reg-confirm-card { max-width:440px; width:100%; padding:32px; border-radius:20px; border:1px solid rgba(255,60,30,0.15); background:linear-gradient(165deg,rgba(35,12,8,0.9),rgba(18,6,4,0.95)); backdrop-filter:blur(20px); text-align:center; }
        .reg-confirm-icon { width:56px;height:56px; border-radius:50%; background:rgba(255,170,0,0.12); border:1.5px solid rgba(255,170,0,0.25); display:flex; align-items:center; justify-content:center; margin:0 auto 16px; font-size:24px; }
        .reg-confirm-title { font-family:var(--font-display); font-size:22px; font-weight:800; color:#fff; letter-spacing:2px; text-transform:uppercase; margin-bottom:8px; }
        .reg-confirm-desc { font-size:13px; color:rgba(255,255,255,0.4); margin-bottom:24px; line-height:1.6; }
        .reg-confirm-btns { display:flex; gap:12px; }

        /* Success screen */
        .reg-success { text-align:center; padding:50px 20px; position:relative; z-index:1; }
        .reg-success-icon { width:80px; height:80px; border-radius:50%; background:rgba(68,255,102,0.1); border:2px solid rgba(68,255,102,0.3); display:flex; align-items:center; justify-content:center; margin:0 auto 20px; font-size:36px; animation:psFadeIn 0.6s ease forwards; }
        .reg-success-title { font-family:var(--font-display); font-size:28px; font-weight:900; color:#fff; letter-spacing:3px; text-transform:uppercase; margin-bottom:8px; }
        .reg-success-sub { font-size:14px; color:rgba(255,255,255,0.4); margin-bottom:6px; }
        .reg-success-team { font-family:var(--font-display); font-size:20px; font-weight:700; color:var(--accent-orange); letter-spacing:3px; margin-bottom:30px; }
        .reg-success-btn { margin-top:10px; }

        @media (max-width:768px) {
          .reg-grid { grid-template-columns:1fr; }
          .reg-header { flex-direction:column; gap:12px; align-items:flex-start; }
          .reg-steps { gap:4px; }
          .reg-step-label { display:none; }
          .reg-section { padding:22px 18px; }
          .reg-member { padding:18px 14px; }
          .reg-nav { flex-direction:column; }
          .reg-confirm-btns { flex-direction:column; }
          .reg-review-member { flex-direction:column; align-items:flex-start; gap:6px; }
          .reg-review-member-right { text-align:left; }
        }
      `}</style>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="reg-confirm-overlay">
          <div className="reg-confirm-card">
            <div className="reg-confirm-icon">⚠️</div>
            <div className="reg-confirm-title">Confirm Registration</div>
            <div className="reg-confirm-desc">
              Once registered, <strong style={{ color: "#fff" }}>team members cannot be changed</strong>. Please make sure all details are correct.
            </div>
            <div className="reg-confirm-btns">
              <button className="ps-btn ps-btn-secondary" style={{ flex: 1 }} onClick={function () { setShowConfirm(false) }}>Go Back</button>
              <button className="ps-btn ps-btn-primary" style={{ flex: 1 }} onClick={handleSubmit}>Confirm & Register</button>
            </div>
          </div>
        </div>
      )}

      <div className="reg-wrapper">
        <div className="reg-container">
          {/* Header */}
          <div className="reg-header">
            <div className="reg-logo" onClick={function () { router.push("/") }}>
              <div className="reg-logo-icon">PS</div>
              <div className="reg-logo-text">{EVENT_CONFIG.eventName}</div>
            </div>
            {leaderRoll && (
              <div className="reg-leader-badge">👑 {leaderRoll}</div>
            )}
          </div>

          {/* Progress Steps */}
          <div className="reg-progress">
            <div className="reg-steps">
              {steps.map(function (s, i) {
                return (
                  <div key={s.num} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "none" }}>
                    <div className="reg-step">
                      <div className={"reg-step-num " + (registered || currentStep > s.num ? "done" : currentStep === s.num ? "active" : "pending")}>
                        {registered || currentStep > s.num ? "✓" : s.num}
                      </div>
                      <span className={"reg-step-label " + (currentStep >= s.num ? "active" : "")}>{s.label}</span>
                    </div>
                    {i < steps.length - 1 && (
                      <div className={"reg-step-line " + (registered || currentStep > s.num ? "done" : "")} />
                    )}
                  </div>
                )
              })}
            </div>
            <div className="ps-progress-track">
              <div className="ps-progress-fill" style={{ width: progressPercent + "%" }} />
            </div>
          </div>

          {/* ===== SUCCESS SCREEN ===== */}
          {registered && (
            <div className="reg-section">
              <div className="reg-success">
                <div className="reg-success-icon">✅</div>
                <div className="reg-success-title">Team Registered Successfully!</div>
                <div className="reg-success-sub">Your team has been registered.</div>
                <div className="reg-success-team">Team {teamNumber}</div>
                <button
                  className="ps-btn ps-btn-primary reg-success-btn"
                  style={{ padding: "14px 36px", fontSize: 15 }}
                  onClick={function () { router.push("/food-selection/" + teamNumber) }}
                >
                  Proceed to Snack & Beverages Selection →
                </button>
              </div>
            </div>
          )}

          {/* ===== STEP 1: PROJECT DETAILS ===== */}
          {!registered && currentStep === 1 && (
            <div className="reg-section">
              <div className="reg-section-title">💡 Project Details</div>

              <div style={{ position: "relative", zIndex: 1 }}>
                <div className="reg-field" style={{ marginBottom: 16 }}>
                  <label className="ps-label">Project Title *</label>
                  <input className="ps-input" type="text" value={projectTitle} onChange={function (e) { setProjectTitle(e.target.value) }} placeholder="e.g. AI-Powered Campus Navigation System" />
                </div>

                <div className="reg-field" style={{ marginBottom: 16 }}>
                  <label className="ps-label">Project Description</label>
                  <textarea className="ps-textarea" value={projectDescription} onChange={function (e) { setProjectDescription(e.target.value) }} rows={3} placeholder="Describe what your project does..." />
                </div>

                <div className="reg-field">
                  <label className="ps-label">Technologies Used * <span style={{ color: "rgba(255,255,255,0.25)" }}>(select multiple)</span></label>

                  {selectedTechs.length > 0 && (
                    <div className="reg-tech-selected">
                      {selectedTechs.map(function (tech) {
                        return (
                          <div key={tech} className="reg-tech-chip">
                            {tech}
                            <button type="button" onClick={function () { toggleTech(tech) }}>✕</button>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <input className="ps-input" type="text" value={techSearch} onChange={function (e) { setTechSearch(e.target.value) }} placeholder="Search technologies..." style={{ marginBottom: 12, fontSize: 13 }} />

                  <div className="reg-tech-grid">
                    {filteredTechs.map(function (tech) {
                      return (
                        <button key={tech} type="button" onClick={function () { toggleTech(tech) }} className={"reg-tech-btn " + (selectedTechs.includes(tech) ? "selected" : "")}>
                          {selectedTechs.includes(tech) ? "✓ " : ""}{tech}
                        </button>
                      )
                    })}
                  </div>

                  <div style={{ marginTop: 12 }}>
                    {!showOtherTech ? (
                      <button type="button" onClick={function () { setShowOtherTech(true) }} className="reg-add-tech">+ Add other technology</button>
                    ) : (
                      <div className="reg-add-tech-row">
                        <input type="text" className="ps-input" value={otherTech} onChange={function (e) { setOtherTech(e.target.value) }} placeholder="Technology name" style={{ flex: 1, fontSize: 13 }} onKeyDown={function (e) { if (e.key === "Enter") { e.preventDefault(); addOtherTech() } }} />
                        <button type="button" className="ps-btn ps-btn-primary ps-btn-sm" onClick={addOtherTech}>Add</button>
                        <button type="button" className="ps-btn ps-btn-secondary ps-btn-sm" onClick={function () { setShowOtherTech(false); setOtherTech("") }}>Cancel</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== STEP 2: TEAM MEMBERS ===== */}
          {!registered && currentStep === 2 && (
            <div className="reg-section">
              <div className="reg-section-title">👥 Team Members ({members.length})</div>

              {/* Member count indicator */}
              <div className="reg-member-count">
                <span className={"reg-count-pill " + (members.length >= MIN_MEMBERS ? "reg-count-ok" : "reg-count-warn")}>
                  {members.length} / {MAX_MEMBERS}
                </span>
                <span className="reg-count-text">
                  {members.length < MIN_MEMBERS
                    ? "Need " + (MIN_MEMBERS - members.length) + " more member" + (MIN_MEMBERS - members.length > 1 ? "s" : "") + " (min " + MIN_MEMBERS + ")"
                    : members.length < MAX_MEMBERS
                    ? "Can add " + (MAX_MEMBERS - members.length) + " more"
                    : "Maximum reached"}
                </span>
              </div>

              <div style={{ position: "relative", zIndex: 1 }}>
                {members.map(function (member, index) {
                  var isLeader = index === 0
                  var isReadonly = member.fromDB
                  return (
                    <div key={index} className={"reg-member" + (isLeader ? " leader" : "")}>
                      <div className="reg-member-header">
                        <div className="reg-member-left">
                          <span className="reg-member-num">
                            {isLeader ? "👑 Team Leader" : "Member " + (index + 1)}
                          </span>
                          {isLeader && <span className="reg-member-tag leader-tag">Leader</span>}
                        </div>
                        {!isLeader && (
                          <button type="button" className="reg-delete-btn" onClick={function () { deleteMember(index) }} title="Remove member">
                            🗑
                          </button>
                        )}
                      </div>

                      <div className="reg-grid">
                        {/* Roll Number — always editable for non-leader if not looked up */}
                        <div className="reg-field">
                          <label className="ps-label">Roll Number *</label>
                          <input
                            className={"ps-input" + (isLeader ? " readonly" : "")}
                            type="text"
                            value={member.member_roll_number}
                            onChange={function (e) {
                              if (isLeader) return
                              handleMemberChange(index, "member_roll_number", e.target.value.toUpperCase())
                              // Reset lookup state on edit
                              handleMemberChange(index, "lookupDone", false)
                              handleMemberChange(index, "fromDB", false)
                              handleMemberChange(index, "manualEntry", false)
                            }}
                            onBlur={function () { if (!isLeader) handleRollBlur(index) }}
                            placeholder="e.g. 22A31A0501"
                            readOnly={isLeader}
                          />
                          {member.lookupLoading && <span className="reg-lookup-badge reg-lookup-loading">🔍 Looking up...</span>}
                          {member.fromDB && <span className="reg-lookup-badge reg-lookup-found">✓ Found in database</span>}
                          {member.manualEntry && !member.fromDB && <span className="reg-lookup-badge reg-lookup-manual">📝 Manual entry</span>}
                        </div>

                        {/* Name */}
                        <div className="reg-field">
                          <label className="ps-label">Full Name *</label>
                          <input
                            className={"ps-input" + (isReadonly ? " readonly" : "")}
                            type="text"
                            value={member.member_name}
                            onChange={function (e) { if (!isReadonly) handleMemberChange(index, "member_name", e.target.value) }}
                            placeholder="Full Name"
                            readOnly={isReadonly}
                          />
                        </div>

                        {/* College */}
                        <div className="reg-field">
                          <label className="ps-label">College *</label>
                          <input
                            className={"ps-input" + (isReadonly ? " readonly" : "")}
                            type="text"
                            value={member.member_college}
                            onChange={function (e) { if (!isReadonly) handleMemberChange(index, "member_college", e.target.value) }}
                            placeholder="College Name"
                            readOnly={isReadonly}
                          />
                        </div>

                        {/* Branch */}
                        <div className="reg-field">
                          <label className="ps-label">Branch *</label>
                          {isReadonly ? (
                            <input className="ps-input readonly" type="text" value={member.member_branch} readOnly />
                          ) : (
                            <select className="ps-select" value={member.member_branch} onChange={function (e) { handleMemberChange(index, "member_branch", e.target.value) }}>
                              <option value="">Select Branch</option>
                              {BRANCHES.map(function (b) { return <option key={b} value={b}>{b}</option> })}
                            </select>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Add Member Button */}
                {members.length < MAX_MEMBERS && (
                  <button type="button" className="reg-add-member" onClick={addMember}>
                    ➕ Add Member {members.length + 1}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ===== STEP 3: REVIEW ===== */}
          {!registered && currentStep === 3 && (
            <div className="reg-section">
              <div className="reg-section-title">📋 Review & Submit</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 24, marginTop: -16, position: "relative", zIndex: 1 }}>
                Please review all details before submitting.
              </div>

              <div style={{ position: "relative", zIndex: 1 }}>
                {/* Project Review */}
                <div className="reg-review-card">
                  <div className="reg-review-header">
                    <div className="reg-review-title">💡 Project Details</div>
                    <button className="reg-review-edit" onClick={function () { setCurrentStep(1) }}>Edit</button>
                  </div>
                  <div className="reg-review-row">
                    <div className="reg-review-label">Project Title</div>
                    <div className="reg-review-value">{projectTitle}</div>
                  </div>
                  {projectDescription && (
                    <div className="reg-review-row">
                      <div className="reg-review-label">Description</div>
                      <div className="reg-review-value" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{projectDescription}</div>
                    </div>
                  )}
                  <div className="reg-review-row">
                    <div className="reg-review-label">Technologies</div>
                    <div className="reg-tech-selected" style={{ marginTop: 4, marginBottom: 0 }}>
                      {selectedTechs.map(function (t) {
                        return <div key={t} className="reg-tech-chip" style={{ cursor: "default" }}>{t}</div>
                      })}
                    </div>
                  </div>
                </div>

                {/* Members Review */}
                <div className="reg-review-card">
                  <div className="reg-review-header">
                    <div className="reg-review-title">👥 Team Members ({members.length})</div>
                    <button className="reg-review-edit" onClick={function () { setCurrentStep(2) }}>Edit</button>
                  </div>
                  {members.map(function (m, i) {
                    return (
                      <div key={i} className="reg-review-member">
                        <div className="reg-review-member-left">
                          <div className={"reg-review-member-avatar " + (m.is_leader ? "leader" : "normal")}>
                            {m.is_leader ? "👑" : i + 1}
                          </div>
                          <div>
                            <div className="reg-review-member-name">{m.member_name}</div>
                            <div className="reg-review-member-sub">{m.member_roll_number} • {m.member_branch}</div>
                          </div>
                        </div>
                        <div className="reg-review-member-right">
                          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{m.member_college}</div>
                          {m.is_leader && <div style={{ fontSize: 11, color: "var(--accent-orange)" }}>Team Leader</div>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          {!registered && (
            <div className="reg-nav">
              {currentStep > 1 && (
                <button className="ps-btn ps-btn-secondary" style={{ flex: 1 }} onClick={handleBack}>← Back</button>
              )}
              {currentStep < 3 ? (
                <button className="ps-btn ps-btn-primary" style={{ flex: 1 }} onClick={handleNext}>Next →</button>
              ) : (
                <button
                  className="ps-btn ps-btn-primary"
                  style={{ flex: 1, opacity: canRegister ? 1 : 0.4 }}
                  onClick={function () { if (canRegister) setShowConfirm(true) }}
                  disabled={loading || !canRegister}
                >
                  {loading ? "Registering..." : "Register Team →"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}