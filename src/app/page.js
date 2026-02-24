"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { EVENT_CONFIG } from "@/config/formFields"
import { supabase } from "@/lib/supabase"
import CountdownTimer from "@/components/CountdownTimer"

export default function Home() {
  var router = useRouter()
  var [registrationOpen, setRegistrationOpen] = useState(true)
  var [checkingStatus, setCheckingStatus] = useState(true)

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
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center font-bold text-black text-2xl mx-auto mb-6">
              PS
            </div>
            <h1 className="text-4xl font-bold mb-2">{EVENT_CONFIG.eventName}</h1>
            <p className="text-gray-400">{EVENT_CONFIG.organizationName}</p>

            {!checkingStatus && (
              <div className={
                registrationOpen
                  ? "inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/5 mt-4"
                  : "inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 bg-red-500/5 mt-4"
              }>
                <span className={
                  registrationOpen
                    ? "w-2 h-2 rounded-full bg-emerald-400 animate-pulse"
                    : "w-2 h-2 rounded-full bg-red-400"
                }></span>
                <span className={
                  registrationOpen
                    ? "text-sm text-emerald-400"
                    : "text-sm text-red-400"
                }>
                  {registrationOpen ? "Registrations Open" : "Registrations Closed"}
                </span>
              </div>
            )}
          </div>

          {/* Login & Register Card */}
          <div className="p-8 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm">
            <h2 className="text-xl font-semibold mb-2 text-center">Welcome</h2>
            <p className="text-sm text-gray-400 mb-8 text-center">Login to your account or create a new one to get started.</p>

            <div className="space-y-4">
              <button
                onClick={function () { router.push("/login") }}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold rounded-xl text-base hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-all"
              >
                Login →
              </button>

              <button
                onClick={function () { router.push("/register-account") }}
                className="w-full py-3.5 border border-white/10 bg-white/[0.03] text-white font-semibold rounded-xl text-base hover:bg-white/[0.08] hover:border-emerald-500/30 transition-all"
              >
                Create Account
              </button>
            </div>

            <p className="text-center text-xs text-gray-500 mt-6">
              New here? Click "Create Account" to register first.
            </p>
          </div>

          {/* Event info */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
              <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">7 Days</p>
              <p className="text-xs text-gray-500 mt-1">Duration</p>
            </div>
            <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
              <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">6 Members</p>
              <p className="text-xs text-gray-500 mt-1">Team Size</p>
            </div>
            <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
              <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">May 6-12</p>
              <p className="text-xs text-gray-500 mt-1">Date</p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-600 mt-8">© 2026 {EVENT_CONFIG.organizationName}</p>
        </div>
      </div>
    </div>
  )
}