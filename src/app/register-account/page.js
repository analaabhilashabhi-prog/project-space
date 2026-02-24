"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { EVENT_CONFIG } from "@/config/formFields"
import { supabase } from "@/lib/supabase"
import CountdownTimer from "@/components/CountdownTimer"

export default function RegisterAccount() {
  var router = useRouter()
  var [step, setStep] = useState("details")
  var [rollNumber, setRollNumber] = useState("")
  var [otp, setOtp] = useState("")
  var [password, setPassword] = useState("")
  var [confirmPassword, setConfirmPassword] = useState("")
  var [showPassword, setShowPassword] = useState(false)
  var [showConfirmPassword, setShowConfirmPassword] = useState(false)
  var [loading, setLoading] = useState(false)
  var [resendTimer, setResendTimer] = useState(0)
  var [maskedEmail, setMaskedEmail] = useState("")
  var [registrationOpen, setRegistrationOpen] = useState(true)
  var [checkingStatus, setCheckingStatus] = useState(true)

  var passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`]/.test(password),
  }
  var allPasswordValid = Object.values(passwordChecks).every(Boolean)
  var passwordsMatch = password === confirmPassword && confirmPassword.length > 0

  useEffect(function () {
    async function checkStatus() {
      try {
        var res = await supabase
          .from("settings")
          .select("value")
          .eq("id", "registration_open")
          .single()
        if (res.data) {
          setRegistrationOpen(res.data.value === "true")
        }
      } catch (err) {}
      setCheckingStatus(false)
    }
    checkStatus()
  }, [])

  useEffect(function () {
    if (resendTimer > 0) {
      var interval = setInterval(function () {
        setResendTimer(function (t) { return t - 1 })
      }, 1000)
      return function () { clearInterval(interval) }
    }
  }, [resendTimer])

  function handleSendOTP(e) {
    if (e) e.preventDefault()
    if (!rollNumber.trim()) {
      toast.error("Please enter your roll number")
      return
    }
    setLoading(true)

    fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rollNumber: rollNumber.trim().toUpperCase() }),
    })
      .then(function (res) { return res.json() })
      .then(function (data) {
        if (data.success) {
          setMaskedEmail(data.email || "your email")
          setStep("otp")
          setResendTimer(60)
          toast.success("OTP sent to your email!")
        } else {
          toast.error(data.error || "Failed to send OTP")
        }
        setLoading(false)
      })
      .catch(function () {
        toast.error("Something went wrong")
        setLoading(false)
      })
  }

  function handleVerifyOTP(e) {
    e.preventDefault()
    if (!otp.trim()) {
      toast.error("Please enter the OTP")
      return
    }
    setLoading(true)

    fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rollNumber: rollNumber.trim().toUpperCase(), otp: otp.trim() }),
    })
      .then(function (res) { return res.json() })
      .then(function (data) {
        if (data.success) {
          setStep("password")
          toast.success("OTP verified! Now create your password.")
        } else {
          toast.error(data.error || "Invalid OTP")
        }
        setLoading(false)
      })
      .catch(function () {
        toast.error("Something went wrong")
        setLoading(false)
      })
  }

  function handleCreatePassword(e) {
    e.preventDefault()
    if (!allPasswordValid) {
      toast.error("Password doesn't meet all requirements")
      return
    }
    if (!passwordsMatch) {
      toast.error("Passwords do not match")
      return
    }
    setLoading(true)

    fetch("/api/auth/create-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rollNumber: rollNumber.trim().toUpperCase(), password: password }),
    })
      .then(function (res) { return res.json() })
      .then(function (data) {
        if (data.success) {
          toast.success("Account created! Redirecting to login...")
          setTimeout(function () { router.push("/login") }, 2000)
        } else {
          toast.error(data.error || "Failed to create account")
        }
        setLoading(false)
      })
      .catch(function () {
        toast.error("Something went wrong")
        setLoading(false)
      })
  }

  function handleResendOTP() {
    if (resendTimer > 0) return
    handleSendOTP()
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden relative flex flex-col">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      ></div>
      <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[120px]"></div>
      <div className="absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-[120px]"></div>

      <div className="relative z-50">
        <CountdownTimer />
      </div>

      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className="w-full max-w-md px-6">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center font-bold text-black text-2xl mx-auto mb-6">
              PS
            </div>
            <h1 className="text-3xl font-bold mb-2">Create Account</h1>
            <p className="text-gray-400">
              {step === "details" && "Enter your roll number to get started"}
              {step === "otp" && "Verify your email with OTP"}
              {step === "password" && "Create a strong password for your account"}
            </p>
          </div>

          {/* Registration Closed Warning */}
          {!checkingStatus && !registrationOpen && (
            <div className="p-6 rounded-2xl border border-red-500/30 bg-red-500/5 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🚫</span>
                <h3 className="font-semibold text-red-400">Registrations Closed</h3>
              </div>
              <p className="text-sm text-gray-300 mb-4">
                Registrations are currently closed. Please contact the organizers or try again later.
              </p>
              <button
                onClick={function () { router.push("/") }}
                className="mt-2 w-full py-2 text-sm text-gray-400 hover:text-white border border-white/10 rounded-xl"
              >
                ← Back to Home
              </button>
            </div>
          )}

          {/* Main Flow - Only show if registrations are open */}
          {(registrationOpen || checkingStatus) && (
            <>
              {/* Progress Steps */}
              <div className="flex items-center gap-1 mb-8 px-2">
                {[
                  { key: "details", label: "Details", num: "1" },
                  { key: "otp", label: "Verify", num: "2" },
                  { key: "password", label: "Password", num: "3" },
                ].map(function (s, i) {
                  var isActive = step === s.key
                  var isPast =
                    (s.key === "details" && (step === "otp" || step === "password")) ||
                    (s.key === "otp" && step === "password")
                  return (
                    <div key={s.key} className="flex-1">
                      <div className="flex items-center">
                        <div className={
                          "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all duration-300 " +
                          (isPast
                            ? "bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                            : isActive
                              ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                              : "bg-white/10 text-gray-500")
                        }>
                          {isPast ? "✓" : s.num}
                        </div>
                        {i < 2 && (
                          <div className={
                            "flex-1 h-[2px] mx-2 transition-all duration-500 " +
                            (isPast ? "bg-emerald-500" : "bg-white/10")
                          }></div>
                        )}
                      </div>
                      <p className={
                        "text-[11px] mt-2 ml-1 transition-all " +
                        (isActive || isPast ? "text-emerald-400 font-medium" : "text-gray-600")
                      }>{s.label}</p>
                    </div>
                  )
                })}
              </div>

              {/* Main Card */}
              <div className="p-8 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm">

                {/* Step 1: Roll Number */}
                {step === "details" && (
                  <div>
                    <h2 className="text-xl font-semibold mb-2">Enter Your Details</h2>
                    <p className="text-sm text-gray-400 mb-6">We'll send an OTP to your college email for verification.</p>
                    <form onSubmit={handleSendOTP}>
                      <div className="mb-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Roll Number</label>
                        <input
                          type="text"
                          value={rollNumber}
                          onChange={function (e) { setRollNumber(e.target.value.toUpperCase()) }}
                          placeholder="e.g. 22A31A0501"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 uppercase"
                          required
                        />
                      </div>

                      {/* Email Preview */}
                      <div className="mb-6 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 text-xs">📧 OTP will be sent to:</span>
                          <span className="text-emerald-400 text-xs font-medium">
                            {rollNumber ? rollNumber.toLowerCase() + "@outlook.com" : "your college email"}
                          </span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold rounded-xl text-base hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] disabled:opacity-50 transition-all"
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                            Sending OTP...
                          </span>
                        ) : "Send OTP →"}
                      </button>
                    </form>
                  </div>
                )}

                {/* Step 2: OTP Verification */}
                {step === "otp" && (
                  <div>
                    <h2 className="text-xl font-semibold mb-2">Verify OTP</h2>
                    <p className="text-sm text-gray-400 mb-6">
                      We sent a 6-digit OTP to <span className="text-emerald-400">{maskedEmail}</span>
                    </p>
                    <form onSubmit={handleVerifyOTP}>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">OTP Code</label>
                        <input
                          type="text"
                          value={otp}
                          onChange={function (e) { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)) }}
                          placeholder="Enter 6-digit OTP"
                          maxLength={6}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-center text-2xl tracking-[0.5em] placeholder-gray-500 placeholder:text-base placeholder:tracking-normal focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold rounded-xl text-base hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] disabled:opacity-50 transition-all"
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                            Verifying...
                          </span>
                        ) : "Verify OTP →"}
                      </button>

                      <div className="text-center mt-4">
                        {resendTimer > 0 ? (
                          <p className="text-sm text-gray-500">Resend OTP in <span className="text-emerald-400 font-medium">{resendTimer}s</span></p>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResendOTP}
                            className="text-sm text-emerald-400 hover:text-emerald-300"
                          >
                            Resend OTP
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={function () { setStep("details"); setOtp("") }}
                        className="w-full py-2 mt-3 text-sm text-gray-400 hover:text-white"
                      >
                        ← Back to Roll Number
                      </button>
                    </form>
                  </div>
                )}

                {/* Step 3: Create Password */}
                {step === "password" && (
                  <div>
                    <h2 className="text-xl font-semibold mb-2">Create Password</h2>
                    <p className="text-sm text-gray-400 mb-6">Set a strong password for your account.</p>
                    <form onSubmit={handleCreatePassword}>
                      {/* Password Field */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={function (e) { setPassword(e.target.value) }}
                            placeholder="Create a strong password"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 pr-16"
                            required
                          />
                          <button
                            type="button"
                            onClick={function () { setShowPassword(!showPassword) }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-sm px-2 py-1 rounded-lg bg-white/5"
                          >
                            {showPassword ? "🙈 Hide" : "👁 Show"}
                          </button>
                        </div>
                      </div>

                      {/* Confirm Password Field */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={function (e) { setConfirmPassword(e.target.value) }}
                            placeholder="Confirm your password"
                            className={
                              "w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 pr-16 transition-all " +
                              (confirmPassword.length > 0
                                ? passwordsMatch
                                  ? "border-emerald-500/50 focus:border-emerald-500/50 focus:ring-emerald-500/50"
                                  : "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50"
                                : "border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/50")
                            }
                            required
                          />
                          <button
                            type="button"
                            onClick={function () { setShowConfirmPassword(!showConfirmPassword) }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-sm px-2 py-1 rounded-lg bg-white/5"
                          >
                            {showConfirmPassword ? "🙈 Hide" : "👁 Show"}
                          </button>
                        </div>
                        {confirmPassword.length > 0 && !passwordsMatch && (
                          <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                            <span>✕</span> Passwords do not match
                          </p>
                        )}
                        {passwordsMatch && (
                          <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                            <span>✓</span> Passwords match
                          </p>
                        )}
                      </div>

                      {/* Password Strength Indicator */}
                      <div className="mb-4">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(function (i) {
                            var filled = Object.values(passwordChecks).filter(Boolean).length >= i
                            var color = "bg-white/10"
                            var count = Object.values(passwordChecks).filter(Boolean).length
                            if (filled) {
                              if (count <= 2) color = "bg-red-500"
                              else if (count <= 3) color = "bg-yellow-500"
                              else if (count <= 4) color = "bg-emerald-400"
                              else color = "bg-emerald-500"
                            }
                            return (
                              <div key={i} className={"flex-1 h-1.5 rounded-full transition-all duration-300 " + color}></div>
                            )
                          })}
                        </div>
                        <p className={
                          "text-xs mt-1 " +
                          (function () {
                            var count = Object.values(passwordChecks).filter(Boolean).length
                            if (count === 0) return "text-gray-600"
                            if (count <= 2) return "text-red-400"
                            if (count <= 3) return "text-yellow-400"
                            if (count <= 4) return "text-emerald-400"
                            return "text-emerald-500"
                          })()
                        }>
                          {(function () {
                            var count = Object.values(passwordChecks).filter(Boolean).length
                            if (count === 0) return ""
                            if (count <= 2) return "Weak password"
                            if (count <= 3) return "Fair password"
                            if (count <= 4) return "Good password"
                            return "Strong password ✓"
                          })()}
                        </p>
                      </div>

                      {/* Password Requirements */}
                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 mb-6">
                        <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Password Requirements</p>
                        <div className="space-y-2.5">
                          {[
                            { key: "length", label: "At least 8 characters" },
                            { key: "uppercase", label: "One uppercase letter (A-Z)" },
                            { key: "lowercase", label: "One lowercase letter (a-z)" },
                            { key: "number", label: "One number (0-9)" },
                            { key: "special", label: "One special character (!@#$%^&*)" },
                          ].map(function (req) {
                            var met = passwordChecks[req.key]
                            return (
                              <div key={req.key} className="flex items-center gap-2.5">
                                <div className={
                                  "w-5 h-5 rounded-full flex items-center justify-center text-[11px] transition-all duration-300 " +
                                  (met
                                    ? "bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                                    : "bg-white/5 text-gray-600")
                                }>
                                  {met ? "✓" : "○"}
                                </div>
                                <span className={
                                  "text-xs transition-all " + (met ? "text-emerald-400" : "text-gray-500")
                                }>{req.label}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading || !allPasswordValid || !passwordsMatch}
                        className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold rounded-xl text-base hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] disabled:opacity-50 transition-all"
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                            Creating Account...
                          </span>
                        ) : "Create Account →"}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Bottom links */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <button
                onClick={function () { router.push("/login") }}
                className="text-emerald-400 hover:text-emerald-300 font-medium"
              >
                Login here
              </button>
            </p>
            <button
              onClick={function () { router.push("/") }}
              className="text-xs text-gray-600 hover:text-gray-400 mt-3 block mx-auto"
            >
              ← Back to Home
            </button>
          </div>

          <p className="text-center text-xs text-gray-600 mt-8">© 2026 {EVENT_CONFIG.organizationName}</p>
        </div>
      </div>
    </div>
  )
}