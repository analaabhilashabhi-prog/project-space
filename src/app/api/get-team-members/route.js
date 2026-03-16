import { supabase } from "@/lib/supabase"

export async function POST(request) {
  try {
    var body = await request.json()
    var { rollNumber } = body

    if (!rollNumber) {
      return Response.json({ error: "Roll number required" }, { status: 400 })
    }

    var roll = rollNumber.toUpperCase().trim()

    // Find team in registered_teams
    var regRes = await supabase
      .from("registered_teams")
      .select("*")
      .eq("leader_roll", roll)
      .maybeSingle()

    if (regRes.error || !regRes.data) {
      return Response.json({ found: false, error: "No pre-registered team found for this roll number." })
    }

    var rt = regRes.data

    // Build member roll list — filter out nulls, NIL, -
    var rawRolls = [
      { roll: rt.leader_roll,  isLeader: true  },
      { roll: rt.member2_roll, isLeader: false },
      { roll: rt.member3_roll, isLeader: false },
      { roll: rt.member4_roll, isLeader: false },
      { roll: rt.member5_roll, isLeader: false },
      { roll: rt.member6_roll, isLeader: false },
    ].filter(function (r) {
      if (!r.roll) return false
      var v = r.roll.toString().trim().toUpperCase()
      return v !== "" && v !== "NULL" && v !== "NIL" && v !== "-"
    })

    // Fetch all student details in one query
    var allRolls = rawRolls.map(function (r) { return r.roll.toString().toUpperCase().trim() })

    var studentsRes = await supabase
      .from("students")
      .select("roll_number, name, email, phone, branch, college, technology")
      .in("roll_number", allRolls)

    var studentsMap = {}
    if (studentsRes.data) {
      studentsRes.data.forEach(function (s) {
        studentsMap[s.roll_number.toUpperCase().trim()] = s
      })
    }

    var members = rawRolls.map(function (r) {
      var rollUp = r.roll.toString().toUpperCase().trim()
      var s = studentsMap[rollUp] || {}
      return {
        member_name: s.name || "",
        member_roll_number: rollUp,
        member_email: s.email || "",
        member_phone: s.phone || "",
        member_branch: s.branch || "",
        member_year: "",
        member_college: s.college || "",
        is_leader: r.isLeader,
        fromDB: false,   // all editable
      }
    })

    return Response.json({
      found: true,
      technology: rt.technology || "",
      members: members,
    })

  } catch (err) {
    console.error("get-team-members error:", err)
    return Response.json({ error: "Server error: " + err.message }, { status: 500 })
  }
}