import { supabase } from "@/lib/supabase"
import { EVENT_CONFIG } from "@/config/formFields"
import bcrypt from "bcryptjs"
import nodemailer from "nodemailer"

var transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

function getStudentEmail(roll) {
  var r = roll.toUpperCase()
  if (r.indexOf("P3") !== -1) return r.toLowerCase() + "@acet.ac.in"
  if (r.indexOf("MH") !== -1) return r.toLowerCase() + "@acoe.edu.in"
  if (r.indexOf("A9") !== -1) return r.toLowerCase() + "@aec.edu.in"
  return r.toLowerCase() + "@aec.edu.in"
}

export async function POST(request) {
  try {
    var body = await request.json()
    var action = body.action

    // ========== ACTION 1: SEND OTP ==========
    if (action === "send_otp") {
      var rollNumber = body.rollNumber
      if (!rollNumber) return Response.json({ error: "Roll number is required" }, { status: 400 })

      var roll = rollNumber.toUpperCase()

      // Check if this roll is a team leader in registered_teams
      var leaderCheck = await supabase.from("registered_teams").select("id, project_title, technology").eq("leader_roll", roll).single()

      if (!leaderCheck.data) {
        return Response.json({
          success: false,
          status: "not_leader",
          error: "Only team leaders can create accounts. Contact your team leader to register."
        }, { status: 403 })
      }

      // Check if account already exists
      var existingUser = await supabase.from("user_passwords").select("roll_number").eq("roll_number", roll).single()

      if (existingUser.data) {
        var teamData = await supabase.from("team_members").select("is_leader, teams(team_number)").eq("member_roll_number", roll).single()

        if (teamData.data && teamData.data.teams) {
          return Response.json({
            success: false,
            status: "already_exists",
            hasTeam: true,
            teamNumber: teamData.data.teams.team_number,
            message: "Account already exists! Please login to access your team dashboard.",
          })
        } else {
          return Response.json({
            success: false,
            status: "already_exists",
            hasTeam: false,
            message: "Account already exists! Please login to register your team.",
          })
        }
      }

      // Get correct email from students table first, fallback to pattern
      var studentData = await supabase.from("students").select("email, name").eq("roll_number", roll).single()
      var email = (studentData.data && studentData.data.email) ? studentData.data.email : getStudentEmail(roll)

      // For testing: override to test email
      var sendToEmail = "harshavardhini@technicalhub.io"

      // Generate 6-digit OTP
      var otpCode = String(Math.floor(100000 + Math.random() * 900000))
      var expiresAt = new Date(Date.now() + 10 * 60 * 1000)

      // Store OTP
      var otpInsert = await supabase.from("otp_codes").insert({
        roll_number: roll,
        otp_code: otpCode,
        email: email,
        expires_at: expiresAt.toISOString(),
        used: false,
      })

      if (otpInsert.error) {
        console.error("OTP DB Error:", otpInsert.error)
        return Response.json({ error: "Failed to generate OTP: " + otpInsert.error.message }, { status: 500 })
      }

      // Send OTP via email (Nodemailer)
      try {
        await transporter.sendMail({
          from: '"Project Space" <' + process.env.SMTP_USER + '>',
          to: sendToEmail,
          subject: "Your OTP for " + EVENT_CONFIG.eventName + ": " + otpCode,
          html: buildOTPEmail(roll, otpCode, studentData.data ? studentData.data.name : null),
        })
        console.log("OTP sent to:", sendToEmail, "for roll:", roll)
      } catch (emailErr) {
        console.log("Email send failed:", emailErr.message)
        console.log("[TEST MODE] OTP for " + roll + ": " + otpCode)
      }

      var isDev = process.env.NODE_ENV === "development"
      var maskedEmail = email.replace(/(.{3}).*(@.*)/, "$1***$2")

      return Response.json({
        success: true,
        email: maskedEmail,
        devOtp: isDev ? otpCode : undefined,
        teamInfo: {
          projectTitle: leaderCheck.data.project_title,
          technology: leaderCheck.data.technology,
        }
      })
    }

    // ========== ACTION 2: VERIFY OTP ==========
    if (action === "verify_otp") {
      var rollNumber = body.rollNumber
      var otp = body.otp

      if (!rollNumber || !otp) return Response.json({ error: "Roll number and OTP are required" }, { status: 400 })

      var otpData = await supabase.from("otp_codes").select("*").eq("roll_number", rollNumber.toUpperCase()).eq("otp_code", otp).eq("used", false).order("created_at", { ascending: false }).limit(1).single()

      if (otpData.error || !otpData.data) {
        return Response.json({ error: "Invalid OTP. Please try again." }, { status: 400 })
      }

      var isDev = process.env.NODE_ENV === "development"
      if (!isDev) {
        if (new Date(otpData.data.expires_at).getTime() < Date.now()) {
          return Response.json({ error: "OTP has expired. Please request a new one." }, { status: 400 })
        }
      }

      await supabase.from("otp_codes").update({ used: true }).eq("id", otpData.data.id)
      return Response.json({ success: true, message: "OTP verified! Create your password." })
    }

    // ========== ACTION 3: CREATE PASSWORD ==========
    if (action === "create_password") {
      var rollNumber = body.rollNumber
      var password = body.password

      if (!rollNumber || !password) return Response.json({ error: "Roll number and password are required" }, { status: 400 })
      if (password.length < 8) return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 })

      var roll = rollNumber.toUpperCase()

      // Double check - must be a leader
      var leaderCheck = await supabase.from("registered_teams").select("id").eq("leader_roll", roll).single()
      if (!leaderCheck.data) {
        return Response.json({ error: "Only team leaders can create accounts." }, { status: 403 })
      }

      var existingUser = await supabase.from("user_passwords").select("roll_number").eq("roll_number", roll).single()
      if (existingUser.data) {
        return Response.json({ error: "Account already exists" }, { status: 400 })
      }

      var salt = await bcrypt.genSalt(10)
      var passwordHash = await bcrypt.hash(password, salt)

      var studentData = await supabase.from("students").select("email").eq("roll_number", roll).single()
      var email = (studentData.data && studentData.data.email) ? studentData.data.email : getStudentEmail(roll)

      var insertResult = await supabase.from("user_passwords").insert({
        roll_number: roll,
        email: email,
        password_hash: passwordHash,
      })

      if (insertResult.error) {
        console.error("Insert Error:", insertResult.error)
        return Response.json({ error: "Failed to create account" }, { status: 500 })
      }

      return Response.json({ success: true, message: "Account created! Please login to register your team." })
    }

    // ========== ACTION 4: GET TEAM DATA (for auto-fill) ==========
    if (action === "get_team_data") {
      var rollNumber = body.rollNumber
      if (!rollNumber) return Response.json({ error: "Roll number required" }, { status: 400 })

      var roll = rollNumber.toUpperCase()

      // Get team from registered_teams
      var teamRes = await supabase.from("registered_teams").select("*").eq("leader_roll", roll).single()
      if (!teamRes.data) return Response.json({ error: "No team found for this leader" }, { status: 404 })

      var team = teamRes.data

      // Get all member roll numbers
      var memberRolls = [team.leader_roll, team.member2_roll, team.member3_roll, team.member4_roll, team.member5_roll, team.member6_roll].filter(function (r) { return r && r !== "NULL" && r !== "NIL" && r.trim() !== "" })

      // Fetch student details for all members from students table
      var studentsRes = await supabase.from("students").select("roll_number, name, email, phone, gender, branch, college, technology").in("roll_number", memberRolls)
      var studentsMap = {}
      if (studentsRes.data) {
        studentsRes.data.forEach(function (s) { studentsMap[s.roll_number] = s })
      }

      // Build members array
      var members = memberRolls.map(function (r, i) {
        var s = studentsMap[r] || {}
        return {
          rollNumber: r,
          name: s.name || "",
          email: s.email || getStudentEmail(r),
          phone: s.phone || "",
          gender: s.gender || "",
          branch: s.branch || "",
          college: s.college || "",
          isLeader: i === 0,
          editable: true,
        }
      })

      return Response.json({
        success: true,
        teamData: {
          technology: team.technology || "",
          projectTitle: team.project_title || "",
          projectDescription: team.project_description || "",
          problemStatement: team.problem_statement || "",
          usesAI: team.uses_ai || false,
          members: members,
          totalMembers: memberRolls.length,
        }
      })
    }

    return Response.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Register Account Error:", error)
    return Response.json({ error: "Internal server error: " + error.message }, { status: 500 })
  }
}

function buildOTPEmail(roll, otp, name) {
  return '<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>'
    + '<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;">'
    + '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0a0a0a;"><tr><td align="center" style="padding:24px 16px;">'
    + '<table width="500" cellpadding="0" cellspacing="0" border="0" style="max-width:500px;width:100%;">'
    + '<tr><td style="background:#ff3020;padding:24px;border-radius:12px 12px 0 0;text-align:center;">'
    + '<p style="margin:0;font-size:18px;font-weight:800;color:#ffffff;letter-spacing:2px;">PROJECT SPACE</p>'
    + '<p style="margin:4px 0 0;font-size:12px;color:#ffcccc;">Account Verification</p>'
    + '</td></tr>'
    + '<tr><td style="background:#111111;padding:32px 24px;border-radius:0 0 12px 12px;text-align:center;">'
    + (name ? '<p style="color:#888;font-size:13px;margin:0 0 8px;">Hello, ' + name + '</p>' : '')
    + '<p style="color:#cccccc;font-size:14px;margin:0 0 24px;">Your One-Time Password</p>'
    + '<p style="font-size:42px;font-weight:800;color:#ff6040;letter-spacing:10px;margin:0 0 24px;font-family:monospace;">' + otp + '</p>'
    + '<p style="color:#666;font-size:12px;margin:0 0 8px;">This OTP expires in 10 minutes</p>'
    + '<p style="color:#444;font-size:11px;margin:0;">Roll: ' + roll + '</p>'
    + '</td></tr>'
    + '</table></td></tr></table></body></html>'
}