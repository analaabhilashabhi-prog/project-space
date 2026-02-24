import { supabase } from "@/lib/supabase"

export async function POST(request) {
  try {
    const { rollNumber, otp } = await request.json()

    if (!rollNumber || !otp) {
      return Response.json({ error: "Roll number and OTP are required" }, { status: 400 })
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
        error: "Account not found. Please go back and register first.",
      }, { status: 400 })
    }

    // Check if OTP matches
    if (!user.otp_code) {
      return Response.json({
        success: false,
        error: "No OTP found. Please request a new one.",
      }, { status: 400 })
    }

    if (user.otp_code !== otp) {
      console.log("OTP mismatch - Expected:", user.otp_code, "Got:", otp)
      return Response.json({
        success: false,
        error: "Invalid OTP. Please check and try again.",
      }, { status: 400 })
    }

    // Check if OTP is expired (skip in dev mode for easy testing)
    const isDev = process.env.NODE_ENV === "development"
    if (!isDev && user.otp_expires_at) {
      const expiresAt = new Date(user.otp_expires_at).getTime()
      const now = Date.now()
      if (now > expiresAt) {
        return Response.json({
          success: false,
          error: "OTP has expired. Please request a new one.",
        }, { status: 400 })
      }
    }

    // OTP is correct — mark user as verified and clear OTP
    const { error: updateError } = await supabase
      .from("users")
      .update({
        is_verified: true,
        otp_code: null,
        otp_expires_at: null,
      })
      .eq("roll_number", rollNumber)

    if (updateError) {
      console.error("Failed to verify user:", updateError)
      return Response.json({
        success: false,
        error: "Failed to verify. Please try again.",
      }, { status: 500 })
    }

    console.log("✅ OTP verified for " + rollNumber)

    return Response.json({
      success: true,
      message: "OTP verified successfully! You can now create your password.",
    })
  } catch (error) {
    console.error("Verify OTP Error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}