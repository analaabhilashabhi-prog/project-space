import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"

export async function POST(request) {
  try {
    const { rollNumber, password } = await request.json()

    if (!rollNumber || !password) {
      return Response.json({ error: "Roll number and password are required" }, { status: 400 })
    }

    // Server-side password validation (never trust frontend alone!)
    if (password.length < 8) {
      return Response.json({
        success: false,
        error: "Password must be at least 8 characters long",
      }, { status: 400 })
    }
    if (!/[A-Z]/.test(password)) {
      return Response.json({
        success: false,
        error: "Password must contain at least one uppercase letter (A-Z)",
      }, { status: 400 })
    }
    if (!/[a-z]/.test(password)) {
      return Response.json({
        success: false,
        error: "Password must contain at least one lowercase letter (a-z)",
      }, { status: 400 })
    }
    if (!/[0-9]/.test(password)) {
      return Response.json({
        success: false,
        error: "Password must contain at least one number (0-9)",
      }, { status: 400 })
    }
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`]/.test(password)) {
      return Response.json({
        success: false,
        error: "Password must contain at least one special character (!@#$%^&*)",
      }, { status: 400 })
    }

    // Find the user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("roll_number", rollNumber)
      .single()

    if (userError || !user) {
      console.error("User not found:", rollNumber, userError)
      return Response.json({
        success: false,
        error: "Account not found. Please register first.",
      }, { status: 400 })
    }

    // Make sure they verified OTP first
    if (!user.is_verified) {
      return Response.json({
        success: false,
        error: "Please verify your OTP first before creating a password.",
      }, { status: 400 })
    }

    // Check if they already have a password set
    if (user.password_hash && user.password_hash !== "") {
      return Response.json({
        success: false,
        error: "Account already has a password. Please login instead.",
      }, { status: 400 })
    }

    // Hash the password with bcrypt (12 rounds = very secure)
    const salt = await bcrypt.genSalt(12)
    const passwordHash = await bcrypt.hash(password, salt)

    // Save the hashed password to database
    const { error: updateError } = await supabase
      .from("users")
      .update({ password_hash: passwordHash })
      .eq("roll_number", rollNumber)

    if (updateError) {
      console.error("Password save error:", updateError)
      return Response.json({
        success: false,
        error: "Failed to save password. Please try again.",
      }, { status: 500 })
    }

    console.log("✅ Account created successfully for " + rollNumber)

    return Response.json({
      success: true,
      message: "Account created successfully! You can now login.",
    })
  } catch (error) {
    console.error("Create Password Error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}