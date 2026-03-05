"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import DashboardSidebar from "@/components/DashboardSidebar"

/* ===== ALL 26 TEAMS FROM EXCEL ===== */
var TEAMS = [
  { number:"PS-001", name:"Academic Architects", title:"EduConnect", tech:["Power Apps","Power Pages","SharePoint","Power Automate","Power BI"], tags:["EdTech","AI","Resource Sharing"], description:"An AI-powered academic resource sharing platform. Faculty upload study materials; students search, view, bookmark, and download resources. Students can also create and upload their own PPTs/PDFs, which are AI-scored and faculty-approved for rewards.", members:["23P31A4241","23P31A0575","23P31A0564","23P31A0509","23A91A1293","23P31A4224"], leader:"23P31A4241" },
  { number:"PS-002", name:"CoreSix Review Team", title:"Project Review Platform", tech:["Power Apps","Power Automate","Excel","SharePoint","Power BI"], tags:["Automation","Education","Management"], description:"A mobile/web app using Microsoft Power Apps to automate the project review process for B.Tech students. Proctors create teams, schedule reviews, and record evaluations digitally.", members:["23P31A4255","23MH1A42C9","23MH1A4434","23P31A4261","23P31A04F8","23P31A4213"], leader:"23P31A4255" },
  { number:"PS-003", name:"Data Forge", title:"Student 360\u00b0", tech:["Power Apps","Power BI","SharePoint","Power Automate","Flask","Gemini"], tags:["Analytics","AI","Assessment"], description:"An integrated analytics platform providing a 360-degree view of student performance. Students schedule exams, attend AI-based interviews, and attempt coding/MCQ assessments with automated scoring.", members:["23MH1A4224","23MH1A4229","23MH1A4271","23P31A4237","23P31A4248","23P31A4271"], leader:"23MH1A4224" },
  { number:"PS-004", name:"Data Pioneers", title:"Student 360\u00b0", tech:["Power Apps","Power BI","SharePoint","Power Automate","Flask","Gemini","GitHub Copilot"], tags:["Analytics","AI","Placement"], description:"An integrated analytics platform with automated Index Score and Placement Index Score. Integrates coding platform and Git repository data to evaluate real-world technical skills.", members:["23MH1A4224","23MH1A4229","23MH1A4271","23P31A4237","23P31A4248","23P31A4271"], leader:"23MH1A4224" },
  { number:"PS-005", name:"CampusID 360", title:"Smart ID Application & Tracking System", tech:["Power Apps","SharePoint","Power Automate","Copilot Studio","Power BI"], tags:["Automation","Identity","Tracking"], description:"Streamlines the entire ID issuance process. Students register, submit details online, complete secure payment. System validates data, checks for duplicates, and provides real-time status updates.", members:["23A91A6116","24A95A6109","23A91A61H5","23A91A61C7","24P35A4232","23MH1A05Q8"], leader:"23A91A61C7" },
  { number:"PS-006", name:"AllocX", title:"Intelligent Resource Allocation for Events", tech:["Power Apps","Power Pages","Power Automate","Snowflake","Power BI","Excel"], tags:["Event Management","Analytics","Automation"], description:"A college-wide event management and analytics system. Manages event creation, registrations, scheduling, attendance/performance tracking, and rule-based e-certificate generation.", members:["23P31A4482","23P31A4488","23P31A4490","23P31A4497","23P31A42C0","23P31A42G3"], leader:"23P31A4490" },
  { number:"PS-007", name:"Data-Dynamos", title:"Placement & Skill Gap Analytics", tech:["Excel","SharePoint","Power BI","Power Apps","Power Automate","Snowflake","OpenAI API"], tags:["Placement","AI","Resume Analysis"], description:"A data-driven system helping students track skills, analyze resumes, and measure placement readiness. LLM model analyzes resumes to extract skills and identify missing keywords.", members:["23MH1A4462","23MH1A4225","23MH1A4227","23MH1A4249","23A91A61J3","23A91A04N3"], leader:"23MH1A4227" },
  { number:"PS-008", name:"TimeTactix", title:"Faculty Scheduling System", tech:["SharePoint","Power Automate","Excel","Power BI","Power Apps","Python","Scikit-learn"], tags:["Scheduling","ML","Automation"], description:"Efficiently allocates substitute teachers during faculty absences by identifying available staff with free periods and balanced workload. ML predicts the most suitable substitute faculty.", members:["23P31A4416","23P31A4419","23P31A4426","23P31A4434","24P31A4213","23MH1A4260"], leader:"23P31A4416" },
  { number:"PS-009", name:"Infinity Crew", title:"TechStack Analysis", tech:["Power BI","Python","Excel","Power Automate","Pandas","NumPy","spaCy"], tags:["Data Science","NLP","Career Guidance"], description:"Analyzes the evolution of programming languages over 10-15 years. Identifies growth, decline, and popularity trends. Analyzes job market demand and provides career guidance.", members:["23MH1A4265","23MH1A4234","23MH1A4238","23MH1A4216","23MH1A4235","23MH1A4266"], leader:"23MH1A4235" },
  { number:"PS-010", name:"CareerConnect", title:"SkillBridge \u2013 AI Smart Placement Portal", tech:["Power Automate","Power Apps","SharePoint","Power BI","HTML","CSS","APIs","AI"], tags:["Placement","AI","Skill Matching"], description:"A smart placement portal connecting students with jobs based purely on skills, not CGPA. AI extracts skills from resumes, matches with company requirements, and sends job notifications.", members:["23MH1A4464","23MH1A4463","23P31A1279","23P31A4487","23MH1A4273","23MH1A42B1"], leader:"23MH1A4463" },
  { number:"PS-011", name:"PlaceMint", title:"Smart Drive", tech:["Power Apps","Power Automate","SharePoint","Outlook","Microsoft 365","Copilot"], tags:["Placement","Automation","Notifications"], description:"Brings all company drive information and registration links into one structured digital platform. Students view organized drive details and register directly through the system.", members:["23P31A4202","23P31A4217","23P31A4221","23P31A4231","23P31A4233","23P31A4265"], leader:"23P31A4265" },
  { number:"PS-012", name:"C-Squad", title:"Campus Connect", tech:["Power BI","Power Apps","Power Pages","Power Automate","Dataverse","SharePoint","React"], tags:["Communication","Automation","Real-time"], description:"Streamlines college communication by centralizing and automating notifications for placements, university announcements, and examination results across campus.", members:["23MH1A05H2","23A91A1205","23P31A4436","23P31A4442","23MH1A4217","23MH1A05I6"], leader:"23MH1A05H2" },
  { number:"PS-013", name:"Power Builders", title:"Project Space Planner", tech:["Excel","SharePoint","Power Automate","Power Apps","Power BI","Copilot Studio"], tags:["Project Management","Tracking","Analytics"], description:"A project tracking and management system to monitor team projects across multiple technologies. Tracks progress and completion percentage in real time with automated notifications.", members:["23A91A1228","23A91A1229","23A91A1226","23MH1A05P9","23P31A05I9","23MH1A4465"], leader:"23A91A1226" },
  { number:"PS-014", name:"KADS", title:"Smart Student 360 Analytics Platform", tech:["Apache Kafka","Snowflake","DBT","Apache Airflow","Copilot Studio"], tags:["Data Engineering","ML","Prediction"], description:"Integrates student data using Kafka, Snowflake, DBT, and Airflow for a scalable data pipeline. ML algorithms predict future student performance with AI-powered chatbot access.", members:["23A91A61E2","23A91A6153","23MH1A4268","23MH1A4206","24P35A4225"], leader:"23A91A6153" },
  { number:"PS-015", name:"core6", title:"Project Review Automator", tech:["Power Apps","Power Automate","Excel","SharePoint","Power BI","Outlook","Copilot"], tags:["Automation","Education","Review"], description:"A mobile and web-based application to automate the project review process. Proctors create teams, schedule reviews, and record evaluation details digitally with AI-assisted team division.", members:["23P31A4255","23P31A4261","23P31A04F8","23P31A4213","23MH1A4434","23MH1A42C9"], leader:"23P31A4255" },
  { number:"PS-016", name:"DataIntel", title:"Academic SmartHub", tech:["Power Apps","Power Automate","Power BI","Excel","SharePoint","OpenAI API"], tags:["EdTech","AI","Exam Prep"], description:"An AI-Powered Academic Assistant that processes faculty-uploaded materials to generate key questions. Features practice quizzes, voice-based answering, personalized study roadmaps, and analytics.", members:["23A91A4459","23A91A4465","23A91A4429"], leader:"23A91A4429" },
  { number:"PS-017", name:"SmartRegTeam", title:"EventSpace", tech:["HTML","CSS","Python","React","MySQL","Power BI","Power Apps","Power Automate"], tags:["Event Registration","Web App","Analytics"], description:"A smart web application for event registration. Students access the website anytime and complete registration conveniently, eliminating manual QR code sharing.", members:["23MH1A4244","23A91A6188","23A91A61A2","23P31A4210","23P31A4220","23P31A0505"], leader:"23P31A4210" },
  { number:"PS-018", name:"Team Elite", title:"UCOS (University Core Operation System)", tech:["Power Apps","SharePoint","Power Automate","Python","Power BI"], tags:["College Management","Automation","Analytics"], description:"A smart college management application providing a single digital platform for students, faculty, and administrators. Features online approvals, risk scoring, and real-time dashboards.", members:["23P31A4205","23P31A0567","23P31A0578","23P31A0568","23P31A4443"], leader:"23P31A4205" },
  { number:"PS-019", name:"404 Found", title:"ADITYA \u2013 Automated Digital Intelligence", tech:["Power Apps","Dataverse","Power Automate","Power BI","Copilot","AI Builder"], tags:["Grievance","AI","Smart City"], description:"An AI-powered grievance management system with smart complaint categorization, priority prediction, duplicate detection, sentiment analysis, and AI chatbot assistance.", members:["23P31A4402","23P31A4403","23P31A4404","23P31A4405","23P31A4421","23P31A4414"], leader:"23P31A4421" },
  { number:"PS-020", name:"UniHostel Hub", title:"Centralized Hostel Management System", tech:["Power Apps","SharePoint","Power Automate","Outlook","Power Pages","Power BI","Twilio"], tags:["Hostel","Automation","Safety"], description:"A digital platform automating hostel operations: leave approvals, attendance, student movement monitoring, mess notifications, room allocation, and complaint tracking.", members:["23A91A6127","23A91A61D8","23A91A6136","23A91A4402","23A91A6172","23MH1A4432"], leader:"23A91A6136" },
  { number:"PS-021", name:"DAM SIX", title:"Pranalasys \u2013 AI Attendance & Analytics", tech:["Azure AD","Power Automate","Dataverse","Power Apps","Power BI","Azure ML"], tags:["Attendance","AI","Smart Campus"], description:"An AI-integrated Smart Attendance and Mentor Analytics System with Face Recognition, automatic technology-wise segregation, and AI-based predictive analytics for irregular students.", members:["23P31A05G5","23P31A05H3","23A91A4409","23MH1A4409","23P31A4441","23P31A4465"], leader:"23P31A05G5" },
  { number:"PS-022", name:"Academic Architects", title:"EduConnect", tech:["Power Pages","Power Apps","SharePoint","Excel","Snowflake","Power Automate","Power BI","OpenAI"], tags:["EdTech","AI","Self-Learning"], description:"A centralized academic platform improving resource accessibility. Students explore topics, create PPTs/PDFs which are AI-scored. Approved resources get contributor credit and reward marks.", members:["23A91A1293","23P31A4224","23P31A0509","23P31A0564","23P31A0575","23P31A4241"], leader:"23A91A1293" },
  { number:"PS-023", name:"Delight", title:"Smart University Appointment System", tech:["HTML","CSS","JavaScript","Power Automate","SharePoint","AI Builder","Power BI"], tags:["Scheduling","AI","University"], description:"An AI-assisted platform for meeting and permission scheduling. Provides real-time faculty availability, request classification, priority analysis, and calendar coordination.", members:["24P35A4227","24P35A4230","24P35A4216","23A91A0546","23A91A0509","23A91A61A0"], leader:"23A91A0546" },
  { number:"PS-024", name:"Attendly Crew", title:"Leavie \u2013 Green Signal", tech:["SharePoint","Power Automate","Power BI","Power Apps","Copilot Studio"], tags:["Leave Management","AI Chatbot","Automation"], description:"A Smart Leave and Outpass Management System. Students apply online and track status. AI agent 'Leavie' interacts with students, collects details, and auto-fills request forms.", members:["23A91A61G9","23A91A6171","23P31A4430","23P31A4444","23A91A05B1","23MH1A4404"], leader:"23P31A4430" },
  { number:"PS-025", name:"Proctor Connect", title:"Proctor Buddy", tech:["Power Apps","Power Automate","SharePoint","AI Builder","Outlook","Power BI"], tags:["Monitoring","AI","Academic"], description:"A smart monitoring system for proctors and students. Tracks attendance and academic performance, auto-detects issues, sends alerts. Students can request data updates with proctor approval.", members:["23P31A0560","23P31A1223","23P31A1289","23P31A1226","24A95A6108","23A91A61C2"], leader:"23P31A0560" },
  { number:"PS-026", name:"SmartTalent Squad", title:"HRGenie A", tech:["Power Apps","SharePoint","Power Automate","Teams","Power BI","Copilot Studio","Azure OpenAI"], tags:["HR","AI","NLP","Automation"], description:"An AI-Powered HR Assistant automating leave requests, HR queries, payroll access, and employee support using natural language understanding and automated workflows.", members:["23P31A4254","23MH1A4250","23P31A4274","23MH1A05O5","23A91A6151","23P31A4216"], leader:"23P31A4216" },
]

export default function ExploreTeamsPage() {
  var router = useRouter()
  var [currentIndex, setCurrentIndex] = useState(0)
  var [isLiked, setIsLiked] = useState({})
  var [filter, setFilter] = useState("All Teams")
  var [searchOpen, setSearchOpen] = useState(false)
  var [searchQuery, setSearchQuery] = useState("")
  var [teamNumber, setTeamNumber] = useState("")
  var [currentMember, setCurrentMember] = useState(null)
  var [loggedInRoll, setLoggedInRoll] = useState("")
  var [isLeader, setIsLeader] = useState(false)
  var [detailAnim, setDetailAnim] = useState(true)
  var scrollRef = useRef(null)

  useEffect(function () {
    var roll = sessionStorage.getItem("ps_roll") || localStorage.getItem("ps_roll") || ""
    var storedTeam = sessionStorage.getItem("ps_team_number") || localStorage.getItem("ps_team_number") || ""
    setLoggedInRoll(roll)
    setTeamNumber(storedTeam)

    async function fetchMember() {
      if (!roll || !storedTeam) return
      try {
        var teamRes = await supabase.from("teams").select("id").eq("team_number", storedTeam).single()
        if (teamRes.data) {
          var memberRes = await supabase.from("team_members").select("*").eq("team_id", teamRes.data.id).eq("member_roll_number", roll).single()
          if (memberRes.data) { setCurrentMember(memberRes.data); setIsLeader(memberRes.data.is_leader || false) }
        }
      } catch (e) {}
    }
    fetchMember()
  }, [])

  var filters = ["All Teams", "EdTech", "AI", "Placement", "Automation", "IoT", "Analytics"]

  var filteredTeams = TEAMS.filter(function (t) {
    var matchesFilter = filter === "All Teams" || t.tags.some(function (tag) { return tag.toLowerCase().includes(filter.toLowerCase()) })
    var matchesSearch = !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.tech.some(function (te) { return te.toLowerCase().includes(searchQuery.toLowerCase()) })
    return matchesFilter && matchesSearch
  })

  var team = filteredTeams[currentIndex] || filteredTeams[0] || TEAMS[0]

  function goToTeam(idx) {
    setDetailAnim(false)
    setTimeout(function () {
      setCurrentIndex(idx)
      setDetailAnim(true)
      // Scroll card into view
      var card = document.getElementById("tc-" + idx)
      if (card) card.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 150)
  }

  function nextTeam() { goToTeam((currentIndex + 1) % filteredTeams.length) }
  function prevTeam() { goToTeam((currentIndex - 1 + filteredTeams.length) % filteredTeams.length) }

  function toggleLike(num) {
    setIsLiked(function (prev) { var n = {}; for (var k in prev) n[k] = prev[k]; n[num] = !prev[num]; return n })
  }

  // Keyboard navigation
  useEffect(function () {
    function handleKey(e) {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") nextTeam()
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") prevTeam()
    }
    window.addEventListener("keydown", handleKey)
    return function () { window.removeEventListener("keydown", handleKey) }
  })

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#000", color: "#fff", fontFamily: "'DM Sans', sans-serif", overflow: "hidden" }}>

      <style jsx>{`
        /* ===== BACKGROUND ===== */
        .ex-bg { position:fixed; inset:0; z-index:0; background:#000; }
        .ex-vignette { position:absolute; inset:0; background:radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,0.6) 100%); }
        .ex-glow { position:absolute; width:500px; height:500px; border-radius:50%; filter:blur(160px); opacity:0.25; pointer-events:none; animation:exDrift 12s ease-in-out infinite; }
        .ex-glow-1 { background:rgba(255,40,20,0.15); top:-150px; left:-100px; }
        .ex-glow-2 { background:rgba(255,80,40,0.1); bottom:-200px; right:-100px; animation-delay:-5s; }
        @keyframes exDrift { 0%,100%{transform:translate(0,0)} 50%{transform:translate(15px,-10px)} }

        /* ===== MAIN ===== */
        .ex-main { flex:1; display:flex; flex-direction:column; height:100vh; position:relative; z-index:1; overflow:hidden; }

        /* ===== TOP NAV ===== */
        .ex-nav { display:flex; align-items:center; justify-content:space-between; padding:14px 32px; border-bottom:1px solid rgba(255,255,255,0.04); background:rgba(0,0,0,0.5); backdrop-filter:blur(20px); z-index:100; }
        .ex-nav-tabs { display:flex; gap:6px; }
        .ex-tab { padding:7px 18px; border-radius:30px; font-size:12px; font-weight:500; color:#555; cursor:pointer; transition:all 0.3s; border:1px solid transparent; font-family:'DM Sans',sans-serif; background:none; }
        .ex-tab:hover { color:#fff; background:rgba(255,255,255,0.04); }
        .ex-tab.on { color:#fff; background:linear-gradient(135deg,rgba(255,50,30,0.2),rgba(255,80,40,0.1)); border-color:rgba(255,60,30,0.3); box-shadow:0 0 15px rgba(255,50,30,0.1); }
        .ex-search-input { padding:8px 16px; border-radius:30px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.03); color:#fff; font-size:13px; font-family:'DM Sans',sans-serif; outline:none; width:200px; transition:all 0.3s; }
        .ex-search-input:focus { border-color:rgba(255,60,30,0.4); width:260px; }
        .ex-search-input::placeholder { color:#444; }

        /* ===== CONTENT AREA ===== */
        .ex-content { display:flex; flex:1; padding:28px 32px; gap:28px; overflow:hidden; }

        /* ===== LEFT: DETAIL ===== */
        .ex-detail { flex:1; display:flex; flex-direction:column; justify-content:center; padding-right:20px; position:relative; transition:opacity 0.3s ease, transform 0.3s ease; }
        .ex-detail.hide { opacity:0; transform:translateX(-20px); }
        .ex-detail.show { opacity:1; transform:translateX(0); }

        .ex-d-num { font-family:'Genos',sans-serif; font-size:15px; font-weight:600; letter-spacing:3px; text-transform:uppercase; margin-bottom:4px; position:relative; z-index:2; }
        .ex-d-num span { background:linear-gradient(135deg,#ff3020,#ff8040); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }

        .ex-d-title { font-family:'Genos',sans-serif; font-weight:900; font-size:48px; line-height:1; color:#fff; margin-bottom:8px; text-transform:uppercase; letter-spacing:2px; position:relative; z-index:2; max-width:55%; word-wrap:break-word; background:linear-gradient(180deg,#fff 40%,rgba(255,255,255,0.5) 75%,rgba(255,255,255,0.15) 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }

        .ex-d-team { font-family:'Genos',sans-serif; font-size:13px; font-weight:600; letter-spacing:2px; color:#666; text-transform:uppercase; margin-bottom:12px; position:relative; z-index:2; }

        .ex-d-meta { display:flex; align-items:center; gap:12px; margin-bottom:12px; flex-wrap:wrap; position:relative; z-index:2; }
        .ex-d-members { display:flex; align-items:center; gap:6px; font-size:13px; color:#777; }
        .ex-d-members .ct { color:#ff8040; font-weight:700; }

        .ex-d-pills { display:flex; gap:7px; flex-wrap:wrap; margin-bottom:10px; position:relative; z-index:2; }
        .ex-pill { padding:4px 13px; border-radius:20px; font-size:11px; font-weight:500; color:#999; background:rgba(255,60,30,0.06); border:1px solid rgba(255,60,30,0.12); transition:all 0.3s; }
        .ex-pill:hover { background:rgba(255,60,30,0.15); border-color:rgba(255,60,30,0.35); color:#fff; }

        .ex-d-tags { display:flex; gap:12px; margin-bottom:14px; position:relative; z-index:2; }
        .ex-tag { font-size:12px; color:#444; font-style:italic; }

        .ex-d-desc { font-size:13px; line-height:1.7; color:rgba(255,255,255,0.55); max-width:480px; margin-bottom:22px; position:relative; z-index:2; display:-webkit-box; -webkit-line-clamp:4; -webkit-box-orient:vertical; overflow:hidden; }

        .ex-d-actions { display:flex; align-items:center; gap:16px; position:relative; z-index:2; }
        .ex-like-btn { display:flex; align-items:center; gap:8px; padding:9px 22px; border-radius:30px; border:1.5px solid rgba(255,60,30,0.3); background:rgba(255,60,30,0.06); color:#ff6040; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.4s cubic-bezier(0.4,0,0.2,1); font-family:'DM Sans',sans-serif; }
        .ex-like-btn:hover { background:rgba(255,60,30,0.15); border-color:rgba(255,60,30,0.5); box-shadow:0 0 25px rgba(255,50,30,0.2); transform:scale(1.05); }
        .ex-like-btn.liked { background:linear-gradient(135deg,#ff3020,#ff6040); color:#fff; border-color:transparent; box-shadow:0 0 30px rgba(255,50,30,0.3); }
        .ex-action-btn { width:40px; height:40px; border-radius:50%; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.02); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 0.3s; color:#666; font-size:16px; }
        .ex-action-btn:hover { border-color:rgba(255,60,30,0.3); background:rgba(255,60,30,0.08); color:#ff6040; }

        /* ===== BIG IMAGE ===== */
        .ex-img-wrap { position:absolute; left:68%; top:50%; transform:translate(-50%,-50%); width:800px; height:700px; pointer-events:none; z-index:0; opacity:0.12; }
        .ex-img-wrap img { width:100%; height:100%; object-fit:contain; filter:drop-shadow(0 0 80px rgba(255,40,20,0.12)); -webkit-mask-image:radial-gradient(ellipse 65% 60% at center,rgba(0,0,0,0.9) 20%,rgba(0,0,0,0.4) 55%,transparent 75%); mask-image:radial-gradient(ellipse 65% 60% at center,rgba(0,0,0,0.9) 20%,rgba(0,0,0,0.4) 55%,transparent 75%); }

        /* ===== RIGHT: TEAM LIST ===== */
        .ex-list { width:140px; display:flex; flex-direction:column; gap:8px; min-width:140px; }
        .ex-list-hd { display:none; }

        .ex-scroll { flex:1; overflow-y:auto; padding-right:6px; display:flex; flex-direction:column; gap:10px; scroll-behavior:smooth; }
        .ex-scroll::-webkit-scrollbar { width:3px; }
        .ex-scroll::-webkit-scrollbar-track { background:rgba(255,255,255,0.02); }
        .ex-scroll::-webkit-scrollbar-thumb { background:rgba(255,60,30,0.25); border-radius:2px; }
        .ex-scroll::-webkit-scrollbar-thumb:hover { background:rgba(255,60,30,0.5); }

        .ex-card { position:relative; padding:14px 12px; border-radius:10px; border:1px solid rgba(255,60,30,0.06); background:rgba(255,255,255,0.015); cursor:pointer; transition:all 0.35s cubic-bezier(0.4,0,0.2,1); overflow:hidden; display:flex; align-items:center; }
        .ex-card::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(255,50,30,0.03),transparent 60%); pointer-events:none; transition:all 0.4s ease; }
        .ex-card:hover { border-color:rgba(255,60,30,0.3); background:rgba(255,255,255,0.03); box-shadow:0 8px 30px rgba(255,40,20,0.1); transform:translateX(-4px); }
        .ex-card:hover::before { background:linear-gradient(135deg,rgba(255,50,30,0.08),transparent 60%); }
        .ex-card.on { border-color:rgba(255,60,30,0.4); background:rgba(255,50,30,0.04); box-shadow:0 8px 30px rgba(255,40,20,0.12); }
        .ex-card.on::after { content:''; position:absolute; top:0;left:0;bottom:0; width:3px; background:linear-gradient(180deg,#ff3020,#ff8040); }

        .ex-c-top { display:flex; align-items:center; justify-content:space-between; width:100%; }
        .ex-c-num { font-family:'Genos',sans-serif; font-size:12px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; background:linear-gradient(135deg,#ff3020,#ff8040); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; line-height:1; }
        .ex-c-members { display:flex; align-items:center; gap:3px; line-height:1; }

        /* ===== CAROUSEL NAV ===== */
        .ex-carousel { position:absolute; bottom:24px; left:50%; transform:translateX(-50%); z-index:100; display:flex; align-items:center; gap:16px; padding:10px 24px; border-radius:50px; background:rgba(5,5,5,0.85); border:1px solid rgba(255,255,255,0.04); backdrop-filter:blur(20px); }
        .ex-car-arrow { width:32px; height:32px; border-radius:50%; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.02); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 0.3s; color:#666; font-size:15px; font-family:'DM Sans',sans-serif; }
        .ex-car-arrow:hover { border-color:rgba(255,60,30,0.4); background:rgba(255,60,30,0.1); color:#ff6040; }
        .ex-car-dots { display:flex; gap:6px; max-width:300px; overflow:hidden; }
        .ex-car-dot { width:8px; height:8px; min-width:8px; border-radius:50%; background:rgba(255,255,255,0.1); cursor:pointer; transition:all 0.3s; }
        .ex-car-dot:hover { background:rgba(255,60,30,0.4); }
        .ex-car-dot.on { background:linear-gradient(135deg,#ff3020,#ff6040); box-shadow:0 0 10px rgba(255,50,30,0.4); width:22px; border-radius:5px; }

        /* ===== RESPONSIVE ===== */
        @media (max-width:900px) {
          .ex-content { flex-direction:column; padding:16px; gap:16px; }
          .ex-detail { padding-right:0; }
          .ex-d-title { font-size:32px; max-width:100%; }
          .ex-list { width:100%; min-width:100%; max-height:300px; }
          .ex-img-wrap { display:none; }
          .ex-nav { padding:12px 16px; padding-left:60px; flex-wrap:wrap; gap:8px; }
          .ex-nav-tabs { flex-wrap:wrap; }
          .ex-carousel { bottom:12px; padding:8px 16px; }
        }
      `}</style>

      {/* Background */}
      <div className="ex-bg">
        <div className="ex-vignette" />
        <div className="ex-glow ex-glow-1" />
        <div className="ex-glow ex-glow-2" />
      </div>

      <DashboardSidebar teamNumber={teamNumber} currentMember={currentMember} loggedInRoll={loggedInRoll} isLeader={isLeader} />

      <div className="ex-main">
        {/* Top Nav */}
        <div className="ex-nav">
          <div className="ex-nav-tabs">
            {filters.map(function (f) {
              return <button key={f} className={"ex-tab " + (filter === f ? "on" : "")} onClick={function () { setFilter(f); setCurrentIndex(0) }}>{f}</button>
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input className="ex-search-input" placeholder="Search teams..." value={searchQuery} onChange={function (e) { setSearchQuery(e.target.value); setCurrentIndex(0) }} />
          </div>
        </div>

        {/* Content */}
        <div className="ex-content">
          {/* LEFT: Detail */}
          <div className={"ex-detail " + (detailAnim ? "show" : "hide")}>
            <div className="ex-d-num"><span>{team.number}</span></div>
            <h1 className="ex-d-title">{team.title}</h1>
            <div className="ex-d-team">{team.name}</div>

            <div className="ex-d-meta">
              <div className="ex-d-members">{"\ud83d\udc65"} <span className="ct">{team.members.length}</span> Members</div>
              <span style={{ color: "#222" }}>|</span>
              <div style={{ fontSize: 12, color: "#555" }}>{"\ud83d\udc64"} Leader: {team.leader}</div>
            </div>

            <div className="ex-d-pills">
              {team.tech.slice(0, 5).map(function (t, i) {
                return <span key={i} className="ex-pill">{t}</span>
              })}
              {team.tech.length > 5 && <span className="ex-pill">+{team.tech.length - 5}</span>}
            </div>

            <div className="ex-d-tags">
              {team.tags.map(function (tag, i) {
                return (<span key={i}>{i > 0 && <span className="ex-tag" style={{ margin: "0 4px" }}>/</span>}<span className="ex-tag">{tag}</span></span>)
              })}
            </div>

            <p className="ex-d-desc">{team.description}</p>

            <div className="ex-d-actions">
              <button className={"ex-like-btn " + (isLiked[team.number] ? "liked" : "")} onClick={function () { toggleLike(team.number) }}>
                <span style={{ fontSize: 16 }}>{isLiked[team.number] ? "\u2665" : "\u2661"}</span>
                {isLiked[team.number] ? "Liked" : "Like"}
              </button>
              <div className="ex-action-btn" title="View Members">{"\ud83d\udc65"}</div>
              <div className="ex-action-btn" title="Share">{"\u2197"}</div>
            </div>

            {/* Background image */}
            <div className="ex-img-wrap">
              <img src="https://i.ibb.co/B2tzqNjg/confident-business-team-png-sticker-transparent-background-53876-1031215-removebg-preview.png" alt="" />
            </div>
          </div>

          {/* RIGHT: Team List */}
          <div className="ex-list">
            <div className="ex-scroll" ref={scrollRef}>
              {filteredTeams.map(function (t, idx) {
                return (
                  <div key={t.number + "-" + idx} id={"tc-" + idx} className={"ex-card " + (idx === currentIndex ? "on" : "")} onClick={function () { goToTeam(idx) }}>
                    <div className="ex-c-top">
                      <span className="ex-c-num">{t.number}</span>
                      <span className="ex-c-members">
                        <svg viewBox="0 0 24 24" style={{ width: 11, height: 11, fill: "none", stroke: "rgba(255,255,255,0.4)", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" }}><circle cx="12" cy="7.5" r="3"/><path d="M5.5 21a6.5 6.5 0 0 1 13 0"/></svg>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{t.members.length}</span>
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Carousel */}
        <div className="ex-carousel">
          <button className="ex-car-arrow" onClick={prevTeam}>{"\u2039"}</button>
          <div className="ex-car-dots">
            {filteredTeams.map(function (t, idx) {
              return <div key={idx} className={"ex-car-dot " + (idx === currentIndex ? "on" : "")} onClick={function () { goToTeam(idx) }} />
            })}
          </div>
          <button className="ex-car-arrow" onClick={nextTeam}>{"\u203a"}</button>
        </div>
      </div>
    </div>
  )
}