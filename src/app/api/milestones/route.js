import { supabase } from "@/lib/supabase"

// Technology-specific milestone templates
var TECH_MILESTONES = {
  // Power Platform
  "Power Apps": [
    { name: "App Layout Designed", desc: "Canvas/Model-driven app layout finalized" },
    { name: "Power App Screens Built", desc: "All app screens and navigation created" },
    { name: "Data Connections Set", desc: "SharePoint/Dataverse connections configured" },
  ],
  "Power Automate": [
    { name: "Workflows Designed", desc: "Automation flows planned and documented" },
    { name: "Flows Built & Tested", desc: "All Power Automate flows working" },
  ],
  "Power BI": [
    { name: "Dashboard Designed", desc: "BI dashboard layout and KPIs planned" },
    { name: "Reports & Visuals Ready", desc: "Power BI dashboards with live data" },
  ],
  "SharePoint": [
    { name: "SharePoint Lists Created", desc: "All data lists and columns configured" },
  ],
  "Dataverse": [
    { name: "Dataverse Schema Set", desc: "Tables, columns, and relationships defined" },
  ],
  "Copilot Studio": [
    { name: "Chatbot Built", desc: "AI chatbot configured and tested" },
  ],
  "AI Builder": [
    { name: "AI Model Trained", desc: "AI Builder model configured and tested" },
  ],

  // Web Technologies
  "HTML": [
    { name: "UI Wireframes Done", desc: "Page layouts and wireframes finalized" },
    { name: "Frontend Pages Built", desc: "All HTML/CSS pages completed" },
  ],
  "CSS": [],
  "JavaScript": [
    { name: "Frontend Logic Done", desc: "Client-side interactivity implemented" },
  ],
  "React": [
    { name: "Component Architecture", desc: "React components planned and structured" },
    { name: "Frontend UI Built", desc: "All React components and pages created" },
  ],
  "Next.js": [
    { name: "App Structure Set", desc: "Next.js routes and layouts configured" },
    { name: "Frontend Pages Built", desc: "All pages and components completed" },
  ],
  "Node.js": [
    { name: "Backend APIs Built", desc: "All server endpoints created and tested" },
  ],

  // Python & ML
  "Python": [
    { name: "Backend Logic Done", desc: "Python scripts and processing ready" },
  ],
  "Flask": [
    { name: "API Server Built", desc: "Flask routes and endpoints created" },
  ],
  "FastAPI": [
    { name: "API Server Built", desc: "FastAPI endpoints created and tested" },
  ],
  "TensorFlow": [
    { name: "ML Model Trained", desc: "Model trained and accuracy validated" },
  ],
  "Scikit-learn": [
    { name: "ML Model Built", desc: "ML algorithms implemented and tested" },
  ],
  "OpenAI API": [
    { name: "AI Integration Done", desc: "OpenAI API connected and prompts tested" },
  ],
  "Gemini": [
    { name: "AI Integration Done", desc: "Gemini API connected and working" },
  ],

  // Data & Analytics
  "Snowflake": [
    { name: "Data Warehouse Set", desc: "Snowflake schema and pipelines configured" },
  ],
  "Apache Kafka": [
    { name: "Data Pipeline Built", desc: "Kafka streaming pipeline operational" },
  ],
  "Apache Airflow": [
    { name: "Workflow Orchestration Done", desc: "Airflow DAGs configured and running" },
  ],
  "Excel": [
    { name: "Data Storage Ready", desc: "Excel/data files structured and connected" },
  ],

  // Database
  "MySQL": [
    { name: "Database Schema Set", desc: "Tables and relationships created" },
  ],
  "MongoDB": [
    { name: "Database Schema Set", desc: "Collections and indexes configured" },
  ],
  "PostgreSQL": [
    { name: "Database Schema Set", desc: "Tables and relationships created" },
  ],
  "Firebase": [
    { name: "Backend Configured", desc: "Firebase services set up and connected" },
  ],
  "Supabase": [
    { name: "Database Schema Set", desc: "Supabase tables and RLS configured" },
  ],

  // Mobile
  "Flutter": [
    { name: "App UI Built", desc: "Flutter screens and navigation completed" },
  ],
  "React Native": [
    { name: "App UI Built", desc: "React Native screens completed" },
  ],

  // Cloud & DevOps
  "Azure": [
    { name: "Cloud Services Set", desc: "Azure services deployed and configured" },
  ],
  "AWS": [
    { name: "Cloud Services Set", desc: "AWS services deployed and configured" },
  ],
  "Docker": [
    { name: "Containers Ready", desc: "Docker containers built and tested" },
  ],

  // Communication
  "Outlook": [
    { name: "Email Notifications Set", desc: "Automated emails configured" },
  ],
  "Twilio": [
    { name: "SMS/Notifications Set", desc: "Twilio messaging integrated" },
  ],
  "Microsoft Teams": [
    { name: "Teams Integration Done", desc: "Teams notifications connected" },
  ],
}

// Universal milestones that every team gets
var UNIVERSAL_START = [
  { name: "Idea Finalized", desc: "Project concept locked and approved" },
  { name: "Project Plan Ready", desc: "Architecture and timeline documented" },
]

var UNIVERSAL_END = [
  { name: "Integration Complete", desc: "All modules connected end-to-end" },
  { name: "Testing & QA Done", desc: "Bugs fixed, edge cases handled" },
  { name: "Deployed & Live", desc: "Project deployed and accessible" },
  { name: "Demo Presentation Ready", desc: "Final demo prepared and rehearsed" },
]

function generateMilestones(technologies) {
  var techMilestones = []
  var seenNames = {}

  // Add tech-specific milestones (deduplicate by name)
  for (var i = 0; i < technologies.length; i++) {
    var tech = technologies[i]
    // Try exact match first, then partial match
    var templates = TECH_MILESTONES[tech]
    if (!templates) {
      // Try partial matching
      var keys = Object.keys(TECH_MILESTONES)
      for (var k = 0; k < keys.length; k++) {
        if (tech.toLowerCase().includes(keys[k].toLowerCase()) || keys[k].toLowerCase().includes(tech.toLowerCase())) {
          templates = TECH_MILESTONES[keys[k]]
          break
        }
      }
    }
    if (templates) {
      for (var j = 0; j < templates.length; j++) {
        if (!seenNames[templates[j].name]) {
          seenNames[templates[j].name] = true
          techMilestones.push(templates[j])
        }
      }
    }
  }

  // If we got too few tech milestones, add a generic one
  if (techMilestones.length < 2) {
    if (!seenNames["Core Features Built"]) {
      techMilestones.push({ name: "Core Features Built", desc: "Main functionality implemented" })
    }
    if (!seenNames["UI/UX Completed"]) {
      techMilestones.push({ name: "UI/UX Completed", desc: "User interface designed and built" })
    }
  }

  // Cap tech milestones at 4 to keep total around 8-10
  if (techMilestones.length > 4) {
    techMilestones = techMilestones.slice(0, 4)
  }

  // Combine: universal start + tech-specific + universal end
  var all = []
  var finalSeen = {}
  
  function addIfNew(name, desc, order) {
    if (finalSeen[name]) return false
    finalSeen[name] = true
    all.push({ name: name, desc: desc, order: order })
    return true
  }
  
  var orderNum = 1
  for (var s = 0; s < UNIVERSAL_START.length; s++) {
    if (addIfNew(UNIVERSAL_START[s].name, UNIVERSAL_START[s].desc, orderNum)) orderNum++
  }
  for (var t = 0; t < techMilestones.length; t++) {
    if (addIfNew(techMilestones[t].name, techMilestones[t].desc, orderNum)) orderNum++
  }
  for (var e = 0; e < UNIVERSAL_END.length; e++) {
    if (addIfNew(UNIVERSAL_END[e].name, UNIVERSAL_END[e].desc, orderNum)) orderNum++
  }

  return all
}

export async function POST(request) {
  try {
    var body = await request.json()
    var { teamNumber } = body

    if (!teamNumber) {
      return Response.json({ error: "teamNumber is required" }, { status: 400 })
    }

    // Get team data
    var { data: team, error: teamError } = await supabase
      .from("teams")
      .select("id, team_number, technologies")
      .eq("team_number", teamNumber)
      .single()

    if (teamError || !team) {
      return Response.json({ error: "Team not found" }, { status: 404 })
    }

    // Check if milestones already exist
    var { data: existing } = await supabase
      .from("team_milestones")
      .select("id")
      .eq("team_id", team.id)
      .limit(1)

    if (existing && existing.length > 0) {
      // Already generated — return existing milestones
      var { data: milestones } = await supabase
        .from("team_milestones")
        .select("*")
        .eq("team_id", team.id)
        .order("milestone_order", { ascending: true })

      return Response.json({ success: true, milestones: milestones, message: "Milestones already exist" })
    }

    // Generate milestones based on technologies
    var technologies = team.technologies || []
    var generated = generateMilestones(technologies)

    // Insert into Supabase
    var rows = generated.map(function (m) {
      return {
        team_id: team.id,
        team_number: team.team_number,
        milestone_name: m.name,
        milestone_description: m.desc,
        milestone_order: m.order,
        is_done: false,
      }
    })

    var { data: inserted, error: insertError } = await supabase
      .from("team_milestones")
      .insert(rows)
      .select()

    if (insertError) {
      return Response.json({ error: "Failed to create milestones: " + insertError.message }, { status: 500 })
    }

    return Response.json({ success: true, milestones: inserted, message: "Milestones generated" })
  } catch (err) {
    return Response.json({ error: "Server error: " + err.message }, { status: 500 })
  }
}

// GET — fetch milestones for a team
export async function GET(request) {
  try {
    var url = new URL(request.url)
    var teamNumber = url.searchParams.get("teamNumber")

    if (!teamNumber) {
      return Response.json({ error: "teamNumber is required" }, { status: 400 })
    }

    var { data: milestones, error } = await supabase
      .from("team_milestones")
      .select("*")
      .eq("team_number", teamNumber)
      .order("milestone_order", { ascending: true })

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true, milestones: milestones || [] })
  } catch (err) {
    return Response.json({ error: "Server error: " + err.message }, { status: 500 })
  }
}

// PATCH — toggle milestone done/not-done (leader only)
export async function PATCH(request) {
  try {
    var body = await request.json()
    var { milestoneId, isDone, doneBy } = body

    if (!milestoneId) {
      return Response.json({ error: "milestoneId is required" }, { status: 400 })
    }

    var updateData = {
      is_done: isDone,
      done_at: isDone ? new Date().toISOString() : null,
      done_by: isDone ? doneBy : null,
    }

    var { data, error } = await supabase
      .from("team_milestones")
      .update(updateData)
      .eq("id", milestoneId)
      .select()
      .single()

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true, milestone: data })
  } catch (err) {
    return Response.json({ error: "Server error: " + err.message }, { status: 500 })
  }
}

// DELETE — clear milestones for a team (so they regenerate fresh)
export async function DELETE(request) {
  try {
    var url = new URL(request.url)
    var teamNumber = url.searchParams.get("teamNumber")

    if (!teamNumber) {
      return Response.json({ error: "teamNumber is required" }, { status: 400 })
    }

    var { error } = await supabase
      .from("team_milestones")
      .delete()
      .eq("team_number", teamNumber)

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true, message: "Milestones cleared for " + teamNumber })
  } catch (err) {
    return Response.json({ error: "Server error: " + err.message }, { status: 500 })
  }
}