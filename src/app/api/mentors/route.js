import { supabase } from "@/lib/supabase"

export async function GET(request) {
  try {
    var url = new URL(request.url)
    var technology = url.searchParams.get("technology")

    var query = supabase.from("mentors").select("*").eq("available", true)

    if (technology) {
      query = query.eq("technology", technology)
    }

    var res = await query.order("name")

    return Response.json({ success: true, mentors: res.data || [] })
  } catch (error) {
    return Response.json({ error: "Failed to fetch" }, { status: 500 })
  }
}