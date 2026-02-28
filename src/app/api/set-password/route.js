import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"
import { Resend } from "resend"

var resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request) {
  try {
    var supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    var body = await request.json()
    var { action, rollNumber, otp, password } = body

    if (!rollNumber) {
      return Response.json({ error: "Roll number is required" }, { status: 400 })
    }

    var roll = rollNumber.toUpperCase()

    // ========== ACTION: CHECK ROLL & SEND OTP ==========
    if (action === "check_roll") {

      var { data: memberData, error: memberError } = await supabase
        .from("team_members")
        .select("member_name, member_email, member_roll_number, team_id, teams(team_number)")
        .eq("member_roll_number", roll)
        .single()

      if (memberError || !memberData) {
        return Response.json({
          error: "You're not registered in any team yet. Please ask your team leader to register your team first.",
          status: "not_registered"
        }, { status: 400 })
      }

      var { data: existingUser } = await supabase
        .from("user_passwords")
        .select("id")
        .eq("roll_number", roll)
        .single()

      if (existingUser) {
        return Response.json({
          error: "You already have a password. Please login instead.",
          status: "already_exists"
        }, { status: 400 })
      }

      var otpCode = String(Math.floor(100000 + Math.random() * 900000))
      var email = memberData.member_email

      if (!email) {
        return Response.json({ error: "No email found for your account. Contact your team leader." }, { status: 400 })
      }

      var expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

      await supabase.from("otp_codes").delete().eq("roll_number", roll).eq("used", false)

      var { error: otpInsertError } = await supabase.from("otp_codes").insert({
        roll_number: roll,
        otp_code: otpCode,
        email: email,
        expires_at: expiresAt,
        used: false
      })

      if (otpInsertError) {
        console.error("OTP insert error:", otpInsertError)
        return Response.json({ error: "Failed to generate OTP. Try again." }, { status: 500 })
      }

      try {
        var maskedEmail = email.replace(/(.{2})(.*)(@.*)/, function (_, a, b, c) {
          return a + b.replace(/./g, "*") + c
        })

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "Project Space <noreply@resend.dev>",
          to: email,
          subject: "Project Space - Your OTP Code",
          html: '<div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:30px;background:#0a0a0a;border-radius:16px;border:1px solid rgba(255,96,64,0.2);">' +
            '<div style="text-align:center;margin-bottom:20px;">' +
            '<div style="display:inline-block;padding:8px 16px;border-radius:8px;background:linear-gradient(135deg,#ff3020,#ff6040);color:#fff;font-weight:900;font-size:18px;letter-spacing:2px;">PROJECT SPACE</div>' +
            '</div>' +
            '<p style="color:#aaa;text-align:center;font-size:14px;">Your verification code is:</p>' +
            '<div style="text-align:center;margin:20px 0;">' +
            '<div style="display:inline-block;padding:16px 32px;border-radius:12px;background:rgba(255,96,64,0.08);border:1px solid rgba(255,96,64,0.2);font-size:32px;font-weight:700;letter-spacing:8px;color:#fff;">' + otpCode + '</div>' +
            '</div>' +
            '<p style="color:#666;text-align:center;font-size:12px;">This code expires in 10 minutes. Do not share it with anyone.</p>' +
            '</div>'
        })
      } catch (emailErr) {
        console.error("Email send error:", emailErr)
        return Response.json({ error: "Failed to send OTP email. Try again." }, { status: 500 })
      }

      return Response.json({
        success: true,
        email: maskedEmail,
        message: "OTP sent to your email"
      })
    }

    // ========== ACTION: VERIFY OTP ==========
    if (action === "verify_otp") {
      if (!otp) {
        return Response.json({ error: "OTP is required" }, { status: 400 })
      }

      var { data: otpData, error: otpError } = await supabase
        .from("otp_codes")
        .select("*")
        .eq("roll_number", roll)
        .eq("otp_code", otp)
        .eq("used", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (otpError || !otpData) {
        return Response.json({ error: "Invalid OTP. Please try again." }, { status: 400 })
      }

      if (new Date(otpData.expires_at) < new Date()) {
        return Response.json({ error: "OTP has expired. Please request a new one." }, { status: 400 })
      }

      await supabase.from("otp_codes").update({ used: true }).eq("id", otpData.id)

      return Response.json({
        success: true,
        message: "OTP verified successfully"
      })
    }

    // ========== ACTION: CREATE PASSWORD ==========
    if (action === "create_password") {
      if (!password) {
        return Response.json({ error: "Password is required" }, { status: 400 })
      }

      if (password.length < 4) {
        return Response.json({ error: "Password must be at least 4 characters" }, { status: 400 })
      }

      var { data: memberCheck } = await supabase
        .from("team_members")
        .select("member_name, member_email, teams(team_number)")
        .eq("member_roll_number", roll)
        .single()

      if (!memberCheck) {
        return Response.json({ error: "Roll number not found" }, { status: 400 })
      }

      var { data: existingPw } = await supabase
        .from("user_passwords")
        .select("id")
        .eq("roll_number", roll)
        .single()

      if (existingPw) {
        return Response.json({
          error: "Password already exists. Please login.",
          status: "already_exists"
        }, { status: 400 })
      }

      var fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
      var { data: verifiedOtp } = await supabase
        .from("otp_codes")
        .select("id")
        .eq("roll_number", roll)
        .eq("used", true)
        .gte("created_at", fifteenMinAgo)
        .limit(1)
        .single()

      if (!verifiedOtp) {
        return Response.json({ error: "Please verify your OTP first." }, { status: 400 })
      }

      var passwordHash = await bcrypt.hash(password, 10)

      var { error: insertError } = await supabase
        .from("user_passwords")
        .insert({
          roll_number: roll,
          password_hash: passwordHash,
          email: memberCheck.member_email || ""
        })

      if (insertError) {
        console.error("Insert error:", insertError)
        return Response.json({ error: "Failed to create account. Please try again." }, { status: 500 })
      }

      return Response.json({
        success: true,
        message: "Password set successfully!",
        memberName: memberCheck.member_name,
        teamNumber: memberCheck.teams ? memberCheck.teams.team_number : null
      })
    }

    return Response.json({ error: "Invalid action" }, { status: 400 })

  } catch (error) {
    console.error("Set Password Error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}