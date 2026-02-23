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

    // CHECK 1: Is this roll number already in a team?
    const { data: memberData } = await supabase
      .from("team_members")
      .select("team_id, is_leader, member_name, teams(team_number, project_title)")
      .eq("member_roll_number", rollNumber)
      .single()

    if (memberData && memberData.teams) {
      if (!memberData.is_leader) {
        // Team MEMBER - block immediately, no OTP
        var leaderRes = await supabase
          .from("team_members")
          .select("member_name, member_roll_number")
          .eq("team_id", memberData.team_id)
          .eq("is_leader", true)
          .single()

        return Response.json({
          success: false,
          status: "team_member",
          teamNumber: memberData.teams.team_number,
          projectTitle: memberData.teams.project_title,
          memberName: memberData.member_name,
          leaderName: leaderRes.data ? leaderRes.data.member_name : "Unknown",
          leaderRoll: leaderRes.data ? leaderRes.data.member_roll_number : "Unknown",
          message: "You are a team member. Only team leads can login.",
        })
      }
      // Team LEAD - allow OTP
    } else {
      // CHECK 2: New user - are registrations open?
      const { data: settings } = await supabase
        .from("settings")
        .select("value")
        .eq("id", "registration_open")
        .single()

      if (settings && settings.value !== "true") {
        return Response.json({
          success: false,
          status: "closed",
          message: "Registrations are currently closed. Please try again later.",
        })
      }
    }

    // Generate 6-digit OTP
    const otpCode = String(Math.floor(100000 + Math.random() * 900000))

    // Generate email from roll number
    const email = rollNumber.toLowerCase() + "@outlook.com"

    // Store OTP in database
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    const { error: dbError } = await supabase.from("otp_codes").insert({
      roll_number: rollNumber,
      otp_code: otpCode,
      email: email,
      expires_at: expiresAt.toISOString(),
      used: false,
    })

    if (dbError) {
      console.error("DB Error:", dbError)
      return Response.json({ error: "Failed to generate OTP" }, { status: 500 })
    }

    // Send OTP via email
    try {
      await resend.emails.send({
        from: "Project Space <onboarding@resend.dev>",
        to: email,
        subject: "Your OTP for " + EVENT_CONFIG.eventName + ": " + otpCode,
        html: '<div style="font-family: Segoe UI, sans-serif; max-width: 500px; margin: 0 auto; background: #0a0a0a; color: #fff; border-radius: 16px; overflow: hidden;"><div style="background: linear-gradient(135deg, #10b981, #06b6d4); padding: 30px; text-align: center;"><h1 style="margin: 0; font-size: 24px; color: #000;">' + EVENT_CONFIG.eventName + '</h1></div><div style="padding: 30px; text-align: center;"><p style="color: #9ca3af; font-size: 14px;">Your One-Time Password</p><p style="font-size: 42px; font-weight: bold; color: #10b981; letter-spacing: 8px; margin: 20px 0;">' + otpCode + '</p><p style="color: #6b7280; font-size: 13px;">This OTP expires in 10 minutes</p><p style="color: #6b7280; font-size: 12px; margin-top: 20px;">Roll Number: ' + rollNumber + '</p></div></div>',
      })
    } catch (emailErr) {
      console.log("Email send failed:", emailErr.message)
      console.log("[TEST MODE] OTP for " + rollNumber + ": " + otpCode)
    }

    var isDev = process.env.NODE_ENV === "development"
    var maskedEmail = email.replace(/(.{3}).*(@.*)/, "$1***$2")

    return Response.json({
      success: true,
      status: memberData ? "team_lead" : "new_user",
      email: maskedEmail,
      devOtp: isDev ? otpCode : undefined,
    })
  } catch (error) {
    console.error("OTP Error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}