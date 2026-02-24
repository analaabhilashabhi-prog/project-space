import { Resend } from "resend"
import { supabase } from "@/lib/supabase"
import { EVENT_CONFIG } from "@/config/formFields"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request) {
  try {
    const { rollNumber } = await request.json()

    if (!rollNumber) {
      return Response.json({ error: "Roll number is required" }, { status: 400 })
    }

    // CHECK 1: Does account already exist with a password?
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("roll_number", rollNumber)
      .single()

    if (existingUser && existingUser.password_hash && existingUser.password_hash !== "" && existingUser.is_verified) {
      return Response.json({
        success: false,
        error: "Account already exists with this roll number! Please login instead.",
      })
    }

    // CHECK 2: Is this roll number already a team member (not leader)?
    const { data: memberData } = await supabase
      .from("team_members")
      .select("team_id, is_leader, member_name, teams(team_number, project_title)")
      .eq("member_roll_number", rollNumber)
      .single()

    if (memberData && memberData.teams && !memberData.is_leader) {
      // Get leader info
      var leaderRes = await supabase
        .from("team_members")
        .select("member_name, member_roll_number")
        .eq("team_id", memberData.team_id)
        .eq("is_leader", true)
        .single()

      return Response.json({
        success: false,
        error: "This roll number (" + rollNumber + ") is already registered as a team member in Team " + memberData.teams.team_number + ". Only team leads can create accounts. Contact your team lead: " + (leaderRes.data ? leaderRes.data.member_name : "Unknown"),
      })
    }

    // CHECK 3: Are registrations open?
    const { data: settings } = await supabase
      .from("settings")
      .select("value")
      .eq("id", "registration_open")
      .single()

    if (settings && settings.value !== "true") {
      return Response.json({
        success: false,
        error: "Registrations are currently closed. Please try again later.",
      })
    }

    // Generate 6-digit OTP
    const otpCode = String(Math.floor(100000 + Math.random() * 900000))
    const email = rollNumber.toLowerCase() + "@outlook.com"
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    // Upsert user record (update if exists, insert if new)
    if (existingUser) {
      const { error: updateError } = await supabase
        .from("users")
        .update({
          email: email,
          otp_code: otpCode,
          otp_expires_at: expiresAt.toISOString(),
          is_verified: false,
        })
        .eq("roll_number", rollNumber)

      if (updateError) {
        console.error("DB Update Error:", updateError)
        return Response.json({ error: "Failed to generate OTP" }, { status: 500 })
      }
    } else {
      const { error: insertError } = await supabase
        .from("users")
        .insert({
          roll_number: rollNumber,
          email: email,
          password_hash: "",
          otp_code: otpCode,
          otp_expires_at: expiresAt.toISOString(),
          is_verified: false,
        })

      if (insertError) {
        console.error("DB Insert Error:", insertError)
        return Response.json({ error: "Failed to create account" }, { status: 500 })
      }
    }

    // Send OTP via email using Resend
    try {
      await resend.emails.send({
        from: "Project Space <onboarding@resend.dev>",
        to: email,
        subject: "Your OTP for " + EVENT_CONFIG.eventName + ": " + otpCode,
        html: '<div style="font-family: Segoe UI, sans-serif; max-width: 500px; margin: 0 auto; background: #0a0a0a; color: #fff; border-radius: 16px; overflow: hidden;">'
          + '<div style="background: linear-gradient(135deg, #10b981, #06b6d4); padding: 30px; text-align: center;">'
          + '<h1 style="margin: 0; font-size: 24px; color: #000;">' + EVENT_CONFIG.eventName + '</h1>'
          + '<p style="margin: 5px 0 0; color: #000; opacity: 0.7;">Account Registration</p>'
          + '</div>'
          + '<div style="padding: 30px; text-align: center;">'
          + '<p style="color: #9ca3af; font-size: 14px;">Your One-Time Password</p>'
          + '<p style="font-size: 42px; font-weight: bold; color: #10b981; letter-spacing: 8px; margin: 20px 0;">' + otpCode + '</p>'
          + '<p style="color: #6b7280; font-size: 13px;">This OTP expires in 10 minutes</p>'
          + '<div style="margin-top: 20px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 12px;">'
          + '<p style="color: #6b7280; font-size: 12px; margin: 0;">Roll Number: <strong style="color: #10b981;">' + rollNumber + '</strong></p>'
          + '</div>'
          + '<p style="color: #4b5563; font-size: 11px; margin-top: 20px;">If you did not request this OTP, please ignore this email.</p>'
          + '</div>'
          + '</div>',
      })
      console.log("✅ OTP email sent to " + email)
    } catch (emailErr) {
      console.log("❌ Email send failed:", emailErr.message)
      console.log("[TEST MODE] OTP for " + rollNumber + ": " + otpCode)
    }

    // Always log OTP in terminal for dev testing
    var isDev = process.env.NODE_ENV === "development"
    if (isDev) {
      console.log("\n" + "=".repeat(40))
      console.log("📧 OTP for " + rollNumber + ": " + otpCode)
      console.log("=".repeat(40) + "\n")
    }

    var maskedEmail = email.replace(/(.{3}).*(@.*)/, "$1***$2")

    return Response.json({
      success: true,
      email: maskedEmail,
      devOtp: isDev ? otpCode : undefined,
    })
  } catch (error) {
    console.error("Register Error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}