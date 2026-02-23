import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    var res = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false })

    return Response.json({ success: true, announcements: res.data || [] })
  } catch (error) {
    return Response.json({ error: "Failed to fetch" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    var formData = await request.formData()
    var title = formData.get("title")
    var message = formData.get("message")
    var type = formData.get("type") || "info"
    var image = formData.get("image")
    var imageUrl = null

    if (!title || !message) {
      return Response.json({ error: "Title and message are required" }, { status: 400 })
    }

    // Upload image if provided
    if (image && image.size > 0) {
      var fileName = Date.now() + "-" + image.name.replace(/[^a-zA-Z0-9.-]/g, "_")
      var buffer = Buffer.from(await image.arrayBuffer())

      var uploadRes = await supabase.storage
        .from("announcements")
        .upload(fileName, buffer, {
          contentType: image.type,
          upsert: false,
        })

      if (uploadRes.error) {
        console.error("Upload error:", uploadRes.error)
        return Response.json({ error: "Image upload failed" }, { status: 500 })
      }

      var urlRes = supabase.storage
        .from("announcements")
        .getPublicUrl(fileName)

      imageUrl = urlRes.data.publicUrl
    }

    var insertRes = await supabase.from("announcements").insert({
      title: title,
      message: message,
      type: type,
      image_url: imageUrl,
    })

    if (insertRes.error) {
      console.error("Insert error:", insertRes.error)
      return Response.json({ error: "Failed to create announcement" }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("Announcement error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    var url = new URL(request.url)
    var id = url.searchParams.get("id")

    if (!id) {
      return Response.json({ error: "ID required" }, { status: 400 })
    }

    var res = await supabase
      .from("announcements")
      .delete()
      .eq("id", parseInt(id))

    if (res.error) {
      return Response.json({ error: "Failed to delete" }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}