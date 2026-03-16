import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"
import nodemailer from "nodemailer"
import { EVENT_CONFIG } from "@/config/formFields"

var transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
})

export async function POST(request) {
  try {
    var body = await request.json()
    var action = body.action

    // ── SEND OTP ──
    if (action === "send_otp") {
      var email = body.email ? body.email.trim().toLowerCase() : ""
      if (!email) return Response.json({ error: "Email required" }, { status: 400 })

      var mentorRes = await supabase
        .from("mentors")
        .select("id, name, email, technology, password_hash")
        .eq("email", email)
        .single()

      if (mentorRes.error || !mentorRes.data) {
        return Response.json({ error: "Email not found. Contact admin." }, { status: 404 })
      }

      var mentor = mentorRes.data
      var otpCode = String(Math.floor(100000 + Math.random() * 900000))
      var expiresAt = new Date(Date.now() + 10 * 60 * 1000)

      await supabase.from("mentor_otp_codes").insert({
        email: email,
        otp_code: otpCode,
        expires_at: expiresAt.toISOString(),
        used: false,
      })

      // Send OTP email
      try {
        await transporter.sendMail({
          from: '"Project Space" <' + process.env.SMTP_USER + '>',
          to: email,
          subject: "Mentor Login OTP — " + EVENT_CONFIG.eventName,
          html: buildOTPEmail(mentor.name, otpCode),
        })
      } catch (err) {
        console.error("Email failed:", err.message)
        console.log("[DEV] OTP for " + email + ": " + otpCode)
      }

      var isDev = process.env.NODE_ENV === "development"
      var maskedEmail = email.replace(/(.{3}).*(@.*)/, "$1***$2")

      return Response.json({
        success: true,
        email: maskedEmail,
        isFirstTime: !mentor.password_hash,
        mentorName: mentor.name,
        technology: mentor.technology,
        devOtp: isDev ? otpCode : undefined,
      })
    }

    // ── VERIFY OTP ──
    if (action === "verify_otp") {
      var email = body.email ? body.email.trim().toLowerCase() : ""
      var otp = body.otp ? body.otp.trim() : ""

      if (!email || !otp) return Response.json({ error: "Email and OTP required" }, { status: 400 })

      var otpRes = await supabase
        .from("mentor_otp_codes")
        .select("*")
        .eq("email", email)
        .eq("otp_code", otp)
        .eq("used", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (otpRes.error || !otpRes.data) {
        return Response.json({ error: "Invalid OTP. Try again." }, { status: 400 })
      }

      var isDev = process.env.NODE_ENV === "development"
      if (!isDev && new Date(otpRes.data.expires_at).getTime() < Date.now()) {
        return Response.json({ error: "OTP expired. Request a new one." }, { status: 400 })
      }

      await supabase.from("mentor_otp_codes").update({ used: true }).eq("id", otpRes.data.id)
      return Response.json({ success: true })
    }

    // ── CREATE / SET PASSWORD ──
    if (action === "set_password") {
      var email = body.email ? body.email.trim().toLowerCase() : ""
      var password = body.password || ""

      if (!email || !password) return Response.json({ error: "Email and password required" }, { status: 400 })
      if (password.length < 6) return Response.json({ error: "Password must be at least 6 characters" }, { status: 400 })

      var salt = await bcrypt.genSalt(10)
      var hash = await bcrypt.hash(password, salt)

      var updateRes = await supabase
        .from("mentors")
        .update({ password_hash: hash })
        .eq("email", email)

      if (updateRes.error) return Response.json({ error: "Failed to set password" }, { status: 500 })
      return Response.json({ success: true })
    }

    // ── LOGIN ──
    if (action === "login") {
      var email = body.email ? body.email.trim().toLowerCase() : ""
      var password = body.password || ""

      if (!email || !password) return Response.json({ error: "Email and password required" }, { status: 400 })

      var mentorRes = await supabase
        .from("mentors")
        .select("id, name, email, technology, password_hash, is_busy, current_team_number")
        .eq("email", email)
        .single()

      if (mentorRes.error || !mentorRes.data) {
        return Response.json({ error: "Email not found." }, { status: 404 })
      }

      var mentor = mentorRes.data
      if (!mentor.password_hash) {
        return Response.json({ error: "Password not set. Please verify OTP first." }, { status: 400 })
      }

      var match = await bcrypt.compare(password, mentor.password_hash)
      if (!match) return Response.json({ error: "Incorrect password." }, { status: 401 })

      return Response.json({
        success: true,
        mentor: {
          id: mentor.id,
          name: mentor.name,
          email: mentor.email,
          technology: mentor.technology,
          isBusy: mentor.is_busy,
          currentTeam: mentor.current_team_number,
        },
      })
    }

    return Response.json({ error: "Invalid action" }, { status: 400 })
  } catch (err) {
    console.error("mentor-auth error:", err)
    return Response.json({ error: "Server error: " + err.message }, { status: 500 })
  }
}

function buildOTPEmail(name, otp) {
  return '<html><body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;">'
    + '<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 16px;">'
    + '<table width="500" cellpadding="0" cellspacing="0" style="max-width:500px;width:100%;">'
    + '<tr><td style="background:#ff3020;padding:24px;border-radius:12px 12px 0 0;text-align:center;">'
    + '<p style="margin:0;font-size:18px;font-weight:800;color:#fff;letter-spacing:2px;">PROJECT SPACE</p>'
    + '<p style="margin:4px 0 0;font-size:12px;color:#ffcccc;">Mentor Portal</p>'
    + '</td></tr>'
    + '<tr><td style="background:#111;padding:32px 24px;border-radius:0 0 12px 12px;text-align:center;">'
    + '<p style="color:#888;font-size:13px;margin:0 0 8px;">Hello, ' + name + '</p>'
    + '<p style="color:#ccc;font-size:14px;margin:0 0 24px;">Your One-Time Password</p>'
    + '<p style="font-size:42px;font-weight:800;color:#ff6040;letter-spacing:10px;margin:0 0 24px;font-family:monospace;">' + otp + '</p>'
    + '<p style="color:#666;font-size:12px;margin:0;">Expires in 10 minutes</p>'
    + '</td></tr></table></td></tr></table></body></html>'
}