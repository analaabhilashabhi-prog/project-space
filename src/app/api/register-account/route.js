import { Resend } from "resend"
import { supabase } from "@/lib/supabase"
import { EVENT_CONFIG } from "@/config/formFields"
import bcrypt from "bcryptjs"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request) {
  try {
    const body = await request.json()
    const { action } = body

    // ========== ACTION 1: SEND OTP ==========
    if (action === "send_otp") {
      const { rollNumber } = body

      if (!rollNumber) {
        return Response.json({ error: "Roll number is required" }, { status: 400 })
      }

      // Check if account already exists
      const { data: existingUser } = await supabase
        .from("user_passwords")
        .select("roll_number")
        .eq("roll_number", rollNumber.toUpperCase())
        .single()

      if (existingUser) {
        return Response.json({
          success: false,
          status: "already_exists",
          message: "Account already exists for this roll number. Please login instead.",
        })
      }

      // Generate 6-digit OTP
      const otpCode = String(Math.floor(100000 + Math.random() * 900000))
      const email = rollNumber.toLowerCase() + "@outlook.com"
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

      // Store OTP
      const { error: dbError } = await supabase.from("otp_codes").insert({
        roll_number: rollNumber.toUpperCase(),
        otp_code: otpCode,
        email: email,
        expires_at: expiresAt.toISOString(),
        used: false,
      })

      if (dbError) {
        console.error("OTP DB Error:", JSON.stringify(dbError))
        return Response.json({ 
          error: "Failed to generate OTP. DB error: " + dbError.message + " (code: " + dbError.code + "). Make sure the otp_codes table exists in Supabase." 
        }, { status: 500 })
      }

      // Send OTP via email
      try {
        await resend.emails.send({
          from: "Project Space <onboarding@resend.dev>",
          to: email,
          subject: "Your OTP for " + EVENT_CONFIG.eventName + ": " + otpCode,
          html: '<div style="font-family: Segoe UI, sans-serif; max-width: 500px; margin: 0 auto; background: #0a0a0a; color: #fff; border-radius: 16px; overflow: hidden;"><div style="background: linear-gradient(135deg, #ff3020, #ff6040); padding: 30px; text-align: center;"><h1 style="margin: 0; font-size: 24px; color: #fff;">' + EVENT_CONFIG.eventName + '</h1></div><div style="padding: 30px; text-align: center;"><p style="color: #9ca3af; font-size: 14px;">Your One-Time Password</p><p style="font-size: 42px; font-weight: bold; color: #ff6040; letter-spacing: 8px; margin: 20px 0;">' + otpCode + '</p><p style="color: #6b7280; font-size: 13px;">This OTP expires in 10 minutes</p><p style="color: #6b7280; font-size: 12px; margin-top: 20px;">Roll Number: ' + rollNumber + '</p></div></div>',
        })
      } catch (emailErr) {
        console.log("Email send failed:", emailErr.message)
        console.log("[TEST MODE] OTP for " + rollNumber + ": " + otpCode)
      }

      var isDev = process.env.NODE_ENV === "development"
      var maskedEmail = email.replace(/(.{3}).*(@.*)/, "$1***$2")

      return Response.json({
        success: true,
        email: maskedEmail,
        devOtp: isDev ? otpCode : undefined,
      })
    }

    // ========== ACTION 2: VERIFY OTP ==========
    if (action === "verify_otp") {
      const { rollNumber, otp } = body

      if (!rollNumber || !otp) {
        return Response.json({ error: "Roll number and OTP are required" }, { status: 400 })
      }

      const { data: otpData, error: otpError } = await supabase
        .from("otp_codes")
        .select("*")
        .eq("roll_number", rollNumber.toUpperCase())
        .eq("otp_code", otp)
        .eq("used", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (otpError || !otpData) {
        return Response.json({ error: "Invalid OTP. Please try again." }, { status: 400 })
      }

      // Check expiry
      const isDev = process.env.NODE_ENV === "development"
      if (!isDev) {
        if (new Date(otpData.expires_at).getTime() < Date.now()) {
          return Response.json({ error: "OTP has expired. Please request a new one." }, { status: 400 })
        }
      }

      // Mark OTP as used
      await supabase.from("otp_codes").update({ used: true }).eq("id", otpData.id)

      return Response.json({ success: true, message: "OTP verified! Create your password." })
    }

    // ========== ACTION 3: CREATE PASSWORD ==========
    if (action === "create_password") {
      const { rollNumber, password } = body

      if (!rollNumber || !password) {
        return Response.json({ error: "Roll number and password are required" }, { status: 400 })
      }

      // Validate password
      if (password.length < 8) {
        return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 })
      }

      // Check if account already exists
      const { data: existingUser } = await supabase
        .from("user_passwords")
        .select("roll_number")
        .eq("roll_number", rollNumber.toUpperCase())
        .single()

      if (existingUser) {
        return Response.json({ error: "Account already exists" }, { status: 400 })
      }

      // Hash password
      const salt = await bcrypt.genSalt(10)
      const passwordHash = await bcrypt.hash(password, salt)

      const email = rollNumber.toLowerCase() + "@outlook.com"

      // Save to database
      const { error: insertError } = await supabase.from("user_passwords").insert({
        roll_number: rollNumber.toUpperCase(),
        email: email,
        password_hash: passwordHash,
      })

      if (insertError) {
        console.error("Insert Error:", insertError)
        return Response.json({ error: "Failed to create account" }, { status: 500 })
      }

      return Response.json({ success: true, message: "Account created! Please login." })
    }

    return Response.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Register Account Error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}