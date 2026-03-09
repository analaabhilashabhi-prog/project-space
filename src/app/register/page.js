"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import toast, { Toaster } from "react-hot-toast"
import { BRANCHES, EVENT_CONFIG } from "@/config/formFields"
import AnimatedBackground from "@/components/AnimatedBackground"

/* ===== SCOPE → TECHNOLOGY MAPPING WITH LINE SVG ICONS ===== */

var SCOPES = [
  { id: "web", name: "Web Development", icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12h4m8 0h4M12 4v4m0 8v4M7.05 7.05l2.83 2.83m4.24 4.24l2.83 2.83M7.05 16.95l2.83-2.83m4.24-4.24l2.83-2.83" },
  { id: "app", name: "App Development", icon: "M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM12 18h.01" },
  { id: "data", name: "Data Analytics & Visualization", icon: "M18 20V10M12 20V4M6 20v-6" },
  { id: "cloud", name: "Cloud & DevOps", icon: "M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" },
  { id: "auto", name: "Automation & Workflows", icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z" },
  { id: "ai", name: "AI & Machine Learning", icon: "M12 2a4 4 0 0 0-4 4c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2 4 4 0 0 0-4-4zM8 8v2m8-2v2M6 14a6 6 0 0 0 12 0M9 18l-1 4m7-4l1 4" },
  { id: "iot", name: "IoT & Hardware", icon: "M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" },
  { id: "db", name: "Database & Backend", icon: "M4 7c0 1.66 3.58 3 8 3s8-1.34 8-3M4 7c0-1.66 3.58-3 8-3s8 1.34 8 3M4 7v10c0 1.66 3.58 3 8 3s8-1.34 8-3V7M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" },
  { id: "vlsi", name: "VLSI & Embedded", icon: "M9 3v2M15 3v2M9 19v2M15 19v2M3 9h2M3 15h2M19 9h2M19 15h2M7 7h10v10H7z" },
  { id: "snow", name: "ServiceNow", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" },
  { id: "mspp", name: "Microsoft Power Platform", icon: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" },
]

var SCOPE_TECHS = {
  web: [
    { name: "React", icon: "M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10" },
    { name: "Next.js", icon: "M9 15V9l7.745 10.65M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" },
    { name: "HTML", icon: "M4 2l1.5 18L12 22l6.5-2L20 2zM8 8h8M8.5 12h7M9 16h6" },
    { name: "CSS", icon: "M4 2l1.5 18L12 22l6.5-2L20 2zM7 8h10M7.5 12h9M8 16h8" },
    { name: "JavaScript", icon: "M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM12 15c0 1.1.9 2 2 2s2-.4 2-1.5M8 12v3c0 .6-.4 1-1 1" },
    { name: "Node.js", icon: "M12 2l8.5 5v10L12 22l-8.5-5V7z" },
    { name: "TypeScript", icon: "M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 12h3M12.5 12v6M16 12v2a2 2 0 0 0 4 0v-2" },
    { name: "Angular", icon: "M12 2L2 7l1.6 11.2L12 22l8.4-3.8L22 7zM12 2v20M7 8.5h10" },
    { name: "Vue.js", icon: "M2 3h4l6 10 6-10h4L12 21z" },
    { name: "Tailwind CSS", icon: "M12 6c-4 0-6 2-6 6 2-2 4-2 6 0s4 2 6 0c0-4-2-6-6-6z" },
    { name: "PHP", icon: "M12 12m-10 0a10 5 0 1 0 20 0a10 5 0 1 0-20 0M7 9v6M7 12h2.5a1.5 1.5 0 0 0 0-3H7" },
  ],
  app: [
    { name: "React Native", icon: "M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" },
    { name: "Flutter", icon: "M14 2l-10 10 4 4L22 2zM14 12l-4 4 4 4 8-8z" },
    { name: "Power Apps", icon: "M12 2l8 4.5v11L12 22l-8-4.5v-11zM12 12l8-4.5M12 12v10M12 12L4 7.5" },
    { name: "Swift", icon: "M20 4c-4 4-12 8-16 8 4-4 8-12 12-12 0 4-4 8-4 12 4 0 8-4 8-8z" },
    { name: "Kotlin", icon: "M4 4h16v16H4zM4 4l8 8M12 4l8 8v8" },
    { name: "Dart", icon: "M4 4l4.5 16L20 4zM4 4h16" },
  ],
  data: [
    { name: "Power BI", icon: "M6 20V14M10 20V10M14 20V6M18 20V4" },
    { name: "Excel", icon: "M4 4h16v16H4zM8 4v16M16 4v16M4 12h16M4 8h16M4 16h16" },
    { name: "Snowflake", icon: "M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" },
    { name: "Pandas", icon: "M8 4v16M16 4v16M8 8h8M8 16h8M5 12h14" },
    { name: "NumPy", icon: "M4 4l8 4 8-4M4 4v16l8 4V8zM20 4v16l-8 4" },
    { name: "Tableau", icon: "M12 2v4M12 18v4M4 12h4M16 12h4M6 6h4v4H6zM14 14h4v4h-4z" },
    { name: "Matplotlib", icon: "M3 20h18M5 20V8l4 6 3-10 3 8 4-4v12" },
  ],
  cloud: [
    { name: "AWS", icon: "M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10zM8 14l2 2 4-4" },
    { name: "Azure", icon: "M6 20L14 4h4l-4 8h6L8 20h10" },
    { name: "Docker", icon: "M4 12h3v-3h3V6h3v3h3v3h3v3H4zM1 12h2M21 12h-2" },
    { name: "GitHub", icon: "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" },
    { name: "GCP", icon: "M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10zM12 10v4M10 12h4" },
    { name: "Kubernetes", icon: "M12 2l8 4.5v11L12 22l-8-4.5v-11zM12 8v8M8 10l4 2 4-2M8 14l4 2 4-2" },
  ],
  auto: [
    { name: "Power Automate", icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z" },
    { name: "SharePoint", icon: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4z" },
    { name: "Outlook", icon: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6" },
    { name: "Microsoft 365", icon: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" },
    { name: "Zapier", icon: "M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" },
    { name: "Microsoft Teams", icon: "M12 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" },
  ],
  ai: [
    { name: "TensorFlow", icon: "M12 2v20M8 6l4-4 4 4M4 10h16M7 14l5 4 5-4" },
    { name: "Scikit-learn", icon: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 8v8M8 12h8" },
    { name: "OpenAI API", icon: "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zM8 12a4 4 0 0 1 8 0M10 16a6 6 0 0 0 4 0" },
    { name: "Azure ML", icon: "M12 2a4 4 0 0 0-4 4c0 2 2 3 2 5h4c0-2 2-3 2-5a4 4 0 0 0-4-4zM10 14h4v2h-4zM9 18h6" },
    { name: "PyTorch", icon: "M12 2v6M18 8a6 6 0 1 1-12 0M12 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" },
    { name: "Gemini", icon: "M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z" },
    { name: "spaCy", icon: "M4 6h16M4 12h10M4 18h14" },
    { name: "Hugging Face", icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" },
  ],
  iot: [
    { name: "Arduino", icon: "M12 12m-10 0a10 10 0 1 0 20 0 10 10 0 1 0-20 0M7 12h4M14 12h3M14 10v4" },
    { name: "Raspberry Pi", icon: "M4 4h16v12H4zM8 16v4M16 16v4M1 20h22" },
    { name: "MQTT", icon: "M4 12h4l3-8 4 16 3-8h4" },
    { name: "ESP32", icon: "M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM5 8h2M17 8h2M5 16h2M17 16h2M9 8v8M15 8v8" },
    { name: "Sensors", icon: "M12 12m-4 0a4 4 0 1 0 8 0 4 4 0 1 0-8 0M12 2v4M12 18v4M2 12h4M18 12h4" },
  ],
  db: [
    { name: "MySQL", icon: "M4 7c0 1.66 3.58 3 8 3s8-1.34 8-3-3.58-3-8-3-8 1.34-8 3zM4 7v10c0 1.66 3.58 3 8 3s8-1.34 8-3V7" },
    { name: "MongoDB", icon: "M12 2v20M12 2c-4 3-6 7-6 12 0 3 2 6 6 8M12 2c4 3 6 7 6 12 0 3-2 6-6 8" },
    { name: "PostgreSQL", icon: "M4 7c0 1.66 3.58 3 8 3s8-1.34 8-3-3.58-3-8-3-8 1.34-8 3zM4 7v5c0 1.66 3.58 3 8 3s8-1.34 8-3V7M4 12v5c0 1.66 3.58 3 8 3s8-1.34 8-3v-5" },
    { name: "Flask", icon: "M9 3h6M12 3v5M7 8h10l-2 13H9z" },
    { name: "FastAPI", icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z" },
    { name: "Express", icon: "M4 12h16M12 4v16M7 7l10 10M17 7L7 17" },
    { name: "Supabase", icon: "M12 2l8 4.5v11L12 22l-8-4.5v-11zM12 12l8-4.5M12 12v10M12 12L4 7.5" },
    { name: "Firebase", icon: "M6 20l3-16 3 8 2-4 4 12z" },
    { name: "Dataverse", icon: "M4 7c0 1.66 3.58 3 8 3s8-1.34 8-3M4 7c0-1.66 3.58-3 8-3s8 1.34 8 3M4 7v10c0 1.66 3.58 3 8 3s8-1.34 8-3V7M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" },
  ],
  vlsi: [
    { name: "Verilog", icon: "M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM9 8l6 8M9 16l6-8" },
    { name: "VHDL", icon: "M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM9 9h6M9 12h6M9 15h4" },
    { name: "FPGA", icon: "M9 3v2M15 3v2M9 19v2M15 19v2M3 9h2M3 15h2M19 9h2M19 15h2M7 7h10v10H7z" },
    { name: "Xilinx", icon: "M4 4l16 16M20 4L4 20M12 2v20M2 12h20" },
    { name: "Cadence", icon: "M4 12h4l3-8 4 16 3-8h4" },
    { name: "ModelSim", icon: "M3 3h18v18H3zM7 13l3-3 3 3 4-4" },
  ],
  snow: [
    { name: "ServiceNow Platform", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 2v4M12 18v4M4.93 4.93l2.83 2.83M14.24 14.24l2.83 2.83" },
    { name: "ITSM", icon: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" },
    { name: "ITOM", icon: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2" },
    { name: "Flow Designer", icon: "M5 3v18M5 12h14M19 8v8" },
    { name: "IntegrationHub", icon: "M8 12h8M12 8v8M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z" },
  ],
  mspp: [
    { name: "Power Apps", icon: "M12 2l8 4.5v11L12 22l-8-4.5v-11zM12 12l8-4.5M12 12v10M12 12L4 7.5" },
    { name: "Power Automate", icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z" },
    { name: "Power BI", icon: "M6 20V14M10 20V10M14 20V6M18 20V4" },
    { name: "Power Pages", icon: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM2 10h20" },
    { name: "Copilot Studio", icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" },
    { name: "Dataverse", icon: "M4 7c0 1.66 3.58 3 8 3s8-1.34 8-3M4 7c0-1.66 3.58-3 8-3s8 1.34 8 3M4 7v10c0 1.66 3.58 3 8 3s8-1.34 8-3V7" },
    { name: "AI Builder", icon: "M12 2a4 4 0 0 0-4 4c0 2 2 3 2 5h4c0-2 2-3 2-5a4 4 0 0 0-4-4zM10 14h4v2h-4z" },
  ],
}

var AI_TOOLS = [
  { name: "OpenAI API", icon: "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zM8 12a4 4 0 0 1 8 0" },
  { name: "Azure OpenAI", icon: "M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10zM12 10l2 4h-4z" },
  { name: "Gemini", icon: "M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z" },
  { name: "Copilot Studio", icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" },
  { name: "AI Builder", icon: "M12 2a4 4 0 0 0-4 4c0 2 2 3 2 5h4c0-2 2-3 2-5a4 4 0 0 0-4-4zM10 14h4v2h-4zM9 18h6" },
  { name: "GitHub Copilot", icon: "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" },
  { name: "ChatGPT", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2zM8 10h.01M12 10h.01M16 10h.01" },
  { name: "Claude", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2zM7 10h10" },
  { name: "Hugging Face", icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" },
  { name: "TensorFlow", icon: "M12 2v20M8 6l4-4 4 4M4 10h16M7 14l5 4 5-4" },
  { name: "Custom ML Model", icon: "M12 2a4 4 0 0 0-4 4c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2 4 4 0 0 0-4-4zM8 8v2m8-2v2M6 14a6 6 0 0 0 12 0M9 18l-1 4m7-4l1 4" },
]

// SVG icon component
function LineIcon(p) {
  return (
    <svg width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke={p.color || "currentColor"} strokeWidth={p.strokeWidth || 1.8} strokeLinecap="round" strokeLinejoin="round" style={p.style}>
      <path d={p.d} />
    </svg>
  )
}

export default function RegisterPage() {
  var router = useRouter()
  var [loading, setLoading] = useState(false)
  var [leaderRoll, setLeaderRoll] = useState("")
  var [currentStep, setCurrentStep] = useState(1)
  var [showConfirm, setShowConfirm] = useState(false)
  var [registered, setRegistered] = useState(false)
  var [teamNumber, setTeamNumber] = useState("")

  // Step 1 — Project details
  var [projectTitle, setProjectTitle] = useState("")
  var [projectDescription, setProjectDescription] = useState("")
  var [selectedScopes, setSelectedScopes] = useState([])
  var [otherScope, setOtherScope] = useState("")
  var [showOtherScope, setShowOtherScope] = useState(false)
  var [selectedTechs, setSelectedTechs] = useState([])
  var [otherTech, setOtherTech] = useState("")
  var [showOtherTech, setShowOtherTech] = useState(false)
  var [aiCapabilities, setAiCapabilities] = useState("")
  var [selectedAiTools, setSelectedAiTools] = useState([])
  var [otherAiTool, setOtherAiTool] = useState("")
  var [showOtherAiTool, setShowOtherAiTool] = useState(false)

  // Dynamic members array
  var [members, setMembers] = useState([
    { member_name: "", member_roll_number: "", member_email: "", member_phone: "", member_branch: "", member_year: "", member_college: "", is_leader: true, fromDB: false, lookupDone: false, lookupLoading: false, manualEntry: false },
  ])

  var MIN_MEMBERS = 3
  var MAX_MEMBERS = 6

  // Get available techs based on selected scopes
  var availableTechs = []
  var seenTechNames = {}
  selectedScopes.forEach(function (scopeId) {
    var techs = SCOPE_TECHS[scopeId] || []
    techs.forEach(function (t) {
      if (!seenTechNames[t.name]) {
        seenTechNames[t.name] = true
        availableTechs.push(t)
      }
    })
  })

  // Load leader roll from session/URL
  useEffect(function () {
    var params = new URLSearchParams(window.location.search)
    var rollFromUrl = params.get("roll")
    var roll = rollFromUrl || localStorage.getItem("ps_roll") || sessionStorage.getItem("ps_roll") || ""
    if (roll) {
      roll = roll.toUpperCase().trim()
      setLeaderRoll(roll)
      setMembers(function (prev) {
        var updated = [Object.assign({}, prev[0])]
        updated[0].member_roll_number = roll
        return updated
      })
      lookupStudent(roll, 0, true)
    }
  }, [])

  // Lookup student
  var lookupStudent = useCallback(function (rollNumber, index, isLeader) {
    if (!rollNumber || rollNumber.length < 5) return
    setMembers(function (prev) { return prev.map(function (m, i) { return i === index ? Object.assign({}, m, { lookupLoading: true }) : m }) })

    fetch("/api/lookup-student", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rollNumber: rollNumber.toUpperCase().trim() }) })
      .then(function (res) { return res.json() })
      .then(function (data) {
        setMembers(function (prev) {
          return prev.map(function (m, i) {
            if (i !== index) return m
            var copy = Object.assign({}, m, { lookupLoading: false, lookupDone: true })
            if (data.alreadyInTeam) {
              toast.error(data.message)
              copy.lookupDone = false
              if (!isLeader) { copy.member_roll_number = ""; copy.member_name = ""; copy.member_college = ""; copy.member_branch = ""; copy.member_phone = ""; copy.fromDB = false; copy.manualEntry = false }
              return copy
            }
            if (data.found && data.student) {
              copy.member_name = data.student.name; copy.member_college = data.student.college; copy.member_branch = data.student.branch; copy.member_phone = data.student.phone || ""
              copy.member_email = rollNumber.toLowerCase() + "@outlook.com"; copy.fromDB = true; copy.manualEntry = false
              if (!isLeader) toast.success("Found: " + data.student.name)
            } else { copy.fromDB = false; copy.manualEntry = true; if (!isLeader) toast("Not in database — enter details manually", { icon: "\ud83d\udcdd" }) }
            return copy
          })
        })
      })
      .catch(function () { setMembers(function (prev) { return prev.map(function (m, i) { return i === index ? Object.assign({}, m, { lookupLoading: false, manualEntry: true }) : m }) }) })
  }, [])

  function addMember() { if (members.length >= MAX_MEMBERS) return; setMembers(function (prev) { return prev.concat([{ member_name: "", member_roll_number: "", member_email: "", member_phone: "", member_branch: "", member_year: "", member_college: "", is_leader: false, fromDB: false, lookupDone: false, lookupLoading: false, manualEntry: false }]) }) }
  function deleteMember(index) { if (index === 0) return; setMembers(function (prev) { return prev.filter(function (_, i) { return i !== index }) }) }
  function handleMemberChange(index, field, value) { setMembers(function (prev) { return prev.map(function (m, i) { if (i !== index) return m; var copy = Object.assign({}, m); copy[field] = value; return copy }) }) }
  function handleRollBlur(index) {
    var member = members[index]
    if (!member.member_roll_number || member.member_roll_number.length < 5) return
    if (member.lookupDone && member.fromDB) return
    var roll = member.member_roll_number.toUpperCase().trim()
    var isDuplicate = members.some(function (m, i) { return i !== index && m.member_roll_number.toUpperCase().trim() === roll })
    if (isDuplicate) { toast.error("Duplicate! " + roll + " is already in your team."); return }
    lookupStudent(roll, index, false)
  }

  // Toggle functions
  function toggleScope(id) {
    setSelectedScopes(function (prev) {
      var newScopes = prev.includes(id) ? prev.filter(function (s) { return s !== id }) : prev.concat([id])
      // Remove techs that no longer belong to any selected scope
      var validTechNames = {}
      newScopes.forEach(function (sid) { (SCOPE_TECHS[sid] || []).forEach(function (t) { validTechNames[t.name] = true }) })
      setSelectedTechs(function (prevTechs) { return prevTechs.filter(function (t) { return validTechNames[t] || !Object.keys(SCOPE_TECHS).some(function (k) { return (SCOPE_TECHS[k] || []).some(function (tt) { return tt.name === t }) }) }) })
      return newScopes
    })
  }

  function toggleTech(name) { setSelectedTechs(function (prev) { return prev.includes(name) ? prev.filter(function (t) { return t !== name }) : prev.concat([name]) }) }
  function toggleAiTool(name) { setSelectedAiTools(function (prev) { return prev.includes(name) ? prev.filter(function (t) { return t !== name }) : prev.concat([name]) }) }

  function addOtherScope() { if (otherScope.trim()) { setSelectedScopes(function (p) { return p.concat(["other:" + otherScope.trim()]) }); setOtherScope(""); setShowOtherScope(false) } }
  function addOtherTech() { if (otherTech.trim() && !selectedTechs.includes(otherTech.trim())) { setSelectedTechs(function (p) { return p.concat([otherTech.trim()]) }); setOtherTech(""); setShowOtherTech(false) } }
  function addOtherAiTool() { if (otherAiTool.trim() && !selectedAiTools.includes(otherAiTool.trim())) { setSelectedAiTools(function (p) { return p.concat([otherAiTool.trim()]) }); setOtherAiTool(""); setShowOtherAiTool(false) } }

  // Validation
  function validateStep1() {
    if (!projectTitle.trim()) { toast.error("Enter project title"); return false }
    if (!projectDescription.trim()) { toast.error("Enter project description"); return false }
    if (selectedScopes.length === 0) { toast.error("Select at least one project scope"); return false }
    if (selectedTechs.length === 0) { toast.error("Select at least one technology"); return false }
    return true
  }

  function validateStep2() {
    if (members.length < MIN_MEMBERS) { toast.error("Minimum " + MIN_MEMBERS + " team members required"); return false }
    if (members.length > MAX_MEMBERS) { toast.error("Maximum " + MAX_MEMBERS + " team members allowed"); return false }
    for (var i = 0; i < members.length; i++) {
      var m = members[i]
      if (!m.member_name || !m.member_roll_number || !m.member_college || !m.member_branch) { toast.error("Fill all details for " + (i === 0 ? "Team Leader" : "Member " + (i + 1))); return false }
    }
    var rolls = members.map(function (m) { return m.member_roll_number.toUpperCase().trim() })
    if (new Set(rolls).size !== rolls.length) { toast.error("Duplicate roll numbers found"); return false }
    return true
  }

  function handleNext() { if (currentStep === 1 && validateStep1()) setCurrentStep(2); else if (currentStep === 2 && validateStep2()) setCurrentStep(3) }
  function handleBack() { if (currentStep > 1) setCurrentStep(currentStep - 1) }

  function handleSubmit() {
    setShowConfirm(false); setLoading(true)
    var cleanMembers = members.map(function (m) {
      return { member_name: m.member_name, member_roll_number: m.member_roll_number.toUpperCase().trim(), member_email: m.member_email || (m.member_roll_number.toLowerCase() + "@outlook.com"), member_phone: m.member_phone || "", member_branch: m.member_branch, member_year: m.member_year || "", member_college: m.member_college, is_leader: m.is_leader }
    })
    // Map scope IDs to names
    var scopeNames = selectedScopes.map(function (s) { if (s.startsWith("other:")) return s.replace("other:", ""); var found = SCOPES.find(function (sc) { return sc.id === s }); return found ? found.name : s })

    fetch("/api/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      projectTitle: projectTitle, projectDescription: projectDescription, technologies: selectedTechs, projectScope: scopeNames, aiCapabilities: aiCapabilities || null, aiTools: selectedAiTools.length > 0 ? selectedAiTools : null, members: cleanMembers,
    }) })
      .then(function (res) { return res.json() })
      .then(function (data) {
        if (data.success) { sessionStorage.setItem("ps_team_number", data.teamNumber); sessionStorage.setItem("ps_team_id", data.teamId); setTeamNumber(data.teamNumber); setRegistered(true); toast.success("Team Registered Successfully!") }
        else { toast.error(data.error || "Registration failed") }
        setLoading(false)
      })
      .catch(function () { toast.error("Something went wrong"); setLoading(false) })
  }

  var steps = [{ num: 1, label: "Project Details" }, { num: 2, label: "Team Members" }, { num: 3, label: "Review & Submit" }]
  var progressPercent = registered ? 100 : currentStep === 1 ? 33 : currentStep === 2 ? 66 : 100
  var canRegister = members.length >= MIN_MEMBERS && members.length <= MAX_MEMBERS

  return (
    <div className="ps-page">
      <AnimatedBackground />
      <Toaster position="top-center" toastOptions={{ style: { background: "#1a1a1a", color: "#fff", border: "1px solid rgba(255,60,30,0.2)", fontFamily: "var(--font-body)" } }} />

      <style jsx>{`
        .reg-wrapper{position:relative;z-index:10;min-height:100vh;padding:30px 20px 60px}
        .reg-container{max-width:800px;margin:0 auto}
        .reg-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:30px;opacity:0;animation:psFadeIn 0.6s ease forwards}
        .reg-logo{display:flex;align-items:center;gap:10px;cursor:pointer}
        .reg-logo-icon{width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#ff3020,#ff6040);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:900;font-size:16px;color:#fff;letter-spacing:1px}
        .reg-logo-text{font-family:var(--font-display);font-size:20px;font-weight:700;color:#fff;letter-spacing:2px;text-transform:uppercase}
        .reg-leader-badge{padding:6px 14px;border-radius:50px;background:rgba(255,60,30,0.08);border:1px solid rgba(255,60,30,0.15);font-family:var(--font-display);font-size:12px;font-weight:600;color:var(--accent-light);letter-spacing:1.5px;text-transform:uppercase;display:flex;align-items:center;gap:6px}
        .reg-progress{margin-bottom:35px;opacity:0;animation:psFadeIn 0.6s ease 0.15s forwards}
        .reg-steps{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
        .reg-step{display:flex;align-items:center;gap:8px}
        .reg-step-num{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:14px;font-weight:700;border:2px solid;transition:all 0.4s}
        .reg-step-num.done{background:var(--accent-orange);border-color:var(--accent-orange);color:#000}
        .reg-step-num.active{border-color:var(--accent-orange);color:var(--accent-orange)}
        .reg-step-num.pending{border-color:rgba(255,255,255,0.15);color:rgba(255,255,255,0.25)}
        .reg-step-label{font-family:var(--font-display);font-size:12px;font-weight:500;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,0.4)}
        .reg-step-label.active{color:var(--accent-light)}
        .reg-step-line{flex:1;height:2px;margin:0 12px;background:rgba(255,255,255,0.08)}
        .reg-step-line.done{background:var(--accent-orange)}
        .reg-section{padding:32px;border-radius:20px;border:1px solid rgba(255,60,30,0.12);background:linear-gradient(165deg,rgba(35,12,8,0.7),rgba(18,6,4,0.85));backdrop-filter:blur(15px);position:relative;overflow:hidden;opacity:0;animation:psFadeIn 0.7s ease 0.3s forwards}
        .reg-section::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#ff4020,#ff8040,#ffaa40)}
        .reg-section::after{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle at 50% 0%,rgba(255,60,30,0.06),transparent 50%);pointer-events:none}
        .reg-section-title{font-family:var(--font-display);font-size:22px;font-weight:800;color:#fff;text-transform:uppercase;letter-spacing:2px;margin-bottom:24px;position:relative;z-index:1;display:flex;align-items:center;gap:10px}
        .reg-field{position:relative;z-index:1;margin-bottom:20px}
        .reg-field-label{font-family:var(--font-display);font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-bottom:8px;display:flex;align-items:center;gap:6px}
        .reg-field-label svg{opacity:0.5}
        .reg-field-opt{color:rgba(255,255,255,0.15);font-weight:400;font-style:italic;text-transform:none;letter-spacing:0}

        /* Scope & Tech cards */
        .reg-scope-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;position:relative;z-index:1}
        .reg-scope-card{padding:12px 14px;border-radius:12px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.02);cursor:pointer;transition:all 0.3s;display:flex;align-items:center;gap:10px}
        .reg-scope-card:hover{border-color:rgba(255,60,30,0.2);background:rgba(255,60,30,0.03)}
        .reg-scope-card.on{border-color:rgba(255,60,30,0.35);background:rgba(255,60,30,0.08)}
        .reg-scope-card.on svg{stroke:#ff6040}
        .reg-scope-card-icon{width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 0.3s}
        .reg-scope-card.on .reg-scope-card-icon{background:rgba(255,60,30,0.1);border-color:rgba(255,60,30,0.2)}
        .reg-scope-card-name{font-size:12px;font-weight:500;color:rgba(255,255,255,0.5);transition:color 0.3s}
        .reg-scope-card.on .reg-scope-card-name{color:#fff}

        .reg-tech-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;max-height:280px;overflow-y:auto;padding-right:4px;position:relative;z-index:1}
        .reg-tech-grid::-webkit-scrollbar{width:4px}
        .reg-tech-grid::-webkit-scrollbar-thumb{background:rgba(255,96,64,0.15);border-radius:10px}
        .reg-tech-btn{padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.02);cursor:pointer;transition:all 0.3s;display:flex;align-items:center;gap:8px;font-family:var(--font-body);font-size:12px;color:rgba(255,255,255,0.5)}
        .reg-tech-btn:hover{border-color:rgba(255,60,30,0.2);color:rgba(255,255,255,0.7)}
        .reg-tech-btn.on{border-color:rgba(255,60,30,0.35);background:rgba(255,60,30,0.08);color:#fff}
        .reg-tech-btn.on svg{stroke:#ff6040}

        .reg-selected-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;position:relative;z-index:1}
        .reg-chip{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:50px;font-size:11px;font-weight:500;letter-spacing:0.5px;background:rgba(255,60,30,0.12);border:1px solid rgba(255,60,30,0.25);color:var(--accent-light)}
        .reg-chip button{background:none;border:none;color:var(--accent-light);cursor:pointer;font-size:12px;padding:0;margin-left:2px;transition:color 0.2s}
        .reg-chip button:hover{color:#fff}

        .reg-add-other{background:none;border:none;color:var(--accent-orange);font-family:var(--font-display);font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;padding:8px 0;position:relative;z-index:1;transition:opacity 0.3s;display:flex;align-items:center;gap:6px}
        .reg-add-other:hover{opacity:0.7}
        .reg-add-other-row{display:flex;gap:8px;position:relative;z-index:1;margin-top:8px}

        .reg-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;position:relative;z-index:1}
        .reg-member{padding:24px;border-radius:16px;border:1px solid rgba(255,60,30,0.08);background:rgba(255,255,255,0.015);margin-bottom:16px;position:relative;z-index:1;transition:all 0.3s}
        .reg-member:hover{border-color:rgba(255,60,30,0.2)}
        .reg-member.leader{border-color:rgba(255,60,30,0.2);background:rgba(255,60,30,0.03)}
        .reg-member-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
        .reg-member-left{display:flex;align-items:center;gap:8px}
        .reg-member-num{font-family:var(--font-display);font-size:13px;font-weight:600;color:rgba(255,255,255,0.5);letter-spacing:1.5px;text-transform:uppercase}
        .reg-member-tag{padding:3px 10px;border-radius:50px;font-family:var(--font-display);font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;background:linear-gradient(135deg,rgba(255,60,30,0.15),rgba(255,100,40,0.15));border:1px solid rgba(255,60,30,0.3);color:var(--accent-light)}
        .reg-delete-btn{width:32px;height:32px;border-radius:8px;border:1px solid rgba(255,60,60,0.15);background:rgba(255,60,60,0.06);color:#ff5555;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.3s}
        .reg-delete-btn:hover{background:rgba(255,60,60,0.15);border-color:rgba(255,60,60,0.3);transform:scale(1.05)}
        .reg-add-member{width:100%;padding:16px;border-radius:16px;border:2px dashed rgba(255,60,30,0.15);background:transparent;color:var(--accent-orange);font-family:var(--font-display);font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:all 0.3s;position:relative;z-index:1;display:flex;align-items:center;justify-content:center;gap:8px}
        .reg-add-member:hover{border-color:rgba(255,60,30,0.35);background:rgba(255,60,30,0.04)}
        .reg-add-member:disabled{opacity:0.3;cursor:not-allowed}
        .reg-member-count{display:flex;align-items:center;gap:8px;margin-bottom:20px;position:relative;z-index:1}
        .reg-count-pill{padding:4px 12px;border-radius:50px;font-family:var(--font-display);font-size:11px;font-weight:600;letter-spacing:1px}
        .reg-count-ok{background:rgba(68,255,102,0.08);border:1px solid rgba(68,255,102,0.2);color:#44ff66}
        .reg-count-warn{background:rgba(255,170,0,0.08);border:1px solid rgba(255,170,0,0.2);color:#ffaa00}
        .reg-count-text{font-size:12px;color:rgba(255,255,255,0.3);font-family:var(--font-display);letter-spacing:1px}
        .reg-lookup-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:6px;font-family:var(--font-display);font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-top:4px}
        .reg-lookup-found{background:rgba(68,255,102,0.08);border:1px solid rgba(68,255,102,0.15);color:#44ff66}
        .reg-lookup-manual{background:rgba(255,170,0,0.08);border:1px solid rgba(255,170,0,0.15);color:#ffaa00}
        .reg-lookup-loading{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.4)}
        .ps-input.readonly{opacity:0.6;cursor:not-allowed;border-color:rgba(255,255,255,0.04)}

        .reg-review-card{padding:24px;border-radius:16px;border:1px solid rgba(255,60,30,0.1);background:rgba(255,255,255,0.015);margin-bottom:16px;position:relative;z-index:1}
        .reg-review-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
        .reg-review-title{font-family:var(--font-display);font-size:14px;font-weight:700;color:var(--accent-light);letter-spacing:2px;text-transform:uppercase}
        .reg-review-edit{padding:4px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:none;color:rgba(255,255,255,0.4);font-family:var(--font-display);font-size:11px;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;transition:all 0.3s}
        .reg-review-edit:hover{border-color:var(--accent-orange);color:var(--accent-orange)}
        .reg-review-row{margin-bottom:12px}
        .reg-review-label{font-size:11px;color:rgba(255,255,255,0.3);font-family:var(--font-display);letter-spacing:1px;text-transform:uppercase;margin-bottom:2px}
        .reg-review-value{font-size:14px;color:rgba(255,255,255,0.8)}
        .reg-review-member{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-radius:12px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.04);margin-bottom:8px}
        .reg-review-member-left{display:flex;align-items:center;gap:10px}
        .reg-review-member-avatar{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;font-family:var(--font-display)}
        .reg-review-member-avatar.leader{background:rgba(255,60,30,0.15);color:var(--accent-orange)}
        .reg-review-member-avatar.normal{background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.4)}
        .reg-review-member-name{font-size:13px;font-weight:500;color:#fff}
        .reg-review-member-sub{font-size:11px;color:rgba(255,255,255,0.35)}
        .reg-review-member-right{text-align:right}
        .reg-nav{display:flex;gap:14px;margin-top:28px;opacity:0;animation:psFadeIn 0.6s ease 0.5s forwards}
        .reg-confirm-overlay{position:fixed;inset:0;z-index:500;background:rgba(0,0,0,0.7);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;animation:psModalIn 0.3s ease}
        .reg-confirm-card{max-width:440px;width:100%;padding:32px;border-radius:20px;border:1px solid rgba(255,60,30,0.15);background:linear-gradient(165deg,rgba(35,12,8,0.9),rgba(18,6,4,0.95));backdrop-filter:blur(20px);text-align:center}
        .reg-confirm-icon{width:56px;height:56px;border-radius:50%;background:rgba(255,170,0,0.12);border:1.5px solid rgba(255,170,0,0.25);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:24px}
        .reg-confirm-title{font-family:var(--font-display);font-size:22px;font-weight:800;color:#fff;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px}
        .reg-confirm-desc{font-size:13px;color:rgba(255,255,255,0.4);margin-bottom:24px;line-height:1.6}
        .reg-confirm-btns{display:flex;gap:12px}
        .reg-success{text-align:center;padding:50px 20px;position:relative;z-index:1}
        .reg-success-icon{width:80px;height:80px;border-radius:50%;background:rgba(68,255,102,0.1);border:2px solid rgba(68,255,102,0.3);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:36px;animation:psFadeIn 0.6s ease forwards}
        .reg-success-title{font-family:var(--font-display);font-size:28px;font-weight:900;color:#fff;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px}
        .reg-success-sub{font-size:14px;color:rgba(255,255,255,0.4);margin-bottom:6px}
        .reg-success-team{font-family:var(--font-display);font-size:20px;font-weight:700;color:var(--accent-orange);letter-spacing:3px;margin-bottom:30px}
        .reg-success-btn{margin-top:10px}
        @media(max-width:768px){.reg-grid{grid-template-columns:1fr}.reg-header{flex-direction:column;gap:12px;align-items:flex-start}.reg-steps{gap:4px}.reg-step-label{display:none}.reg-section{padding:22px 18px}.reg-member{padding:18px 14px}.reg-nav{flex-direction:column}.reg-confirm-btns{flex-direction:column}.reg-scope-grid{grid-template-columns:1fr 1fr}.reg-tech-grid{grid-template-columns:repeat(auto-fill,minmax(130px,1fr))}}
      `}</style>

      {showConfirm && (
        <div className="reg-confirm-overlay">
          <div className="reg-confirm-card">
            <div className="reg-confirm-icon">{"\u26a0\ufe0f"}</div>
            <div className="reg-confirm-title">Confirm Registration</div>
            <div className="reg-confirm-desc">Once registered, <strong style={{ color: "#fff" }}>team members cannot be changed</strong>. Please make sure all details are correct.</div>
            <div className="reg-confirm-btns">
              <button className="ps-btn ps-btn-secondary" style={{ flex: 1 }} onClick={function () { setShowConfirm(false) }}>Go Back</button>
              <button className="ps-btn ps-btn-primary" style={{ flex: 1 }} onClick={handleSubmit}>Confirm & Register</button>
            </div>
          </div>
        </div>
      )}

      <div className="reg-wrapper">
        <div className="reg-container">
          <div className="reg-header">
            <div className="reg-logo" onClick={function () { router.push("/") }}>
              <div className="reg-logo-icon">PS</div>
              <div className="reg-logo-text">{EVENT_CONFIG.eventName}</div>
            </div>
            {leaderRoll && <div className="reg-leader-badge">{"\ud83d\udc51"} {leaderRoll}</div>}
          </div>

          <div className="reg-progress">
            <div className="reg-steps">
              {steps.map(function (s, i) {
                return (
                  <div key={s.num} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "none" }}>
                    <div className="reg-step">
                      <div className={"reg-step-num " + (registered || currentStep > s.num ? "done" : currentStep === s.num ? "active" : "pending")}>{registered || currentStep > s.num ? "\u2713" : s.num}</div>
                      <span className={"reg-step-label " + (currentStep >= s.num ? "active" : "")}>{s.label}</span>
                    </div>
                    {i < steps.length - 1 && <div className={"reg-step-line " + (registered || currentStep > s.num ? "done" : "")} />}
                  </div>
                )
              })}
            </div>
            <div className="ps-progress-track"><div className="ps-progress-fill" style={{ width: progressPercent + "%" }} /></div>
          </div>

          {/* SUCCESS */}
          {registered && (
            <div className="reg-section">
              <div className="reg-success">
                <div className="reg-success-icon">{"\u2705"}</div>
                <div className="reg-success-title">Team Registered!</div>
                <div className="reg-success-sub">Your team has been registered.</div>
                <div className="reg-success-team">Team {teamNumber}</div>
                <button className="ps-btn ps-btn-primary reg-success-btn" style={{ padding: "14px 36px", fontSize: 15 }} onClick={function () { router.push("/food-selection/" + teamNumber) }}>Proceed to Food Selection {"\u2192"}</button>
              </div>
            </div>
          )}

          {/* STEP 1: PROJECT DETAILS */}
          {!registered && currentStep === 1 && (
            <div className="reg-section">
              <div className="reg-section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff6040" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4 4 0 0 0-4 4c0 2 2 3 2 5h4c0-2 2-3 2-5a4 4 0 0 0-4-4zM10 14h4v2h-4zM9 18h6"/></svg>
                Project Details
              </div>

              <div style={{ position: "relative", zIndex: 1 }}>
                {/* Title */}
                <div className="reg-field">
                  <div className="reg-field-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Project Title *
                  </div>
                  <input className="ps-input" type="text" value={projectTitle} onChange={function (e) { setProjectTitle(e.target.value) }} placeholder="e.g. AI-Powered Campus Navigation System" />
                </div>

                {/* Description */}
                <div className="reg-field">
                  <div className="reg-field-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    Project Description *
                  </div>
                  <textarea className="ps-textarea" value={projectDescription} onChange={function (e) { setProjectDescription(e.target.value) }} rows={3} placeholder="Describe what your project does..." />
                </div>

                {/* Scope */}
                <div className="reg-field">
                  <div className="reg-field-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                    Project Scope * <span className="reg-field-opt">(select one or more)</span>
                  </div>

                  {selectedScopes.length > 0 && (
                    <div className="reg-selected-chips">
                      {selectedScopes.map(function (s) {
                        var label = s.startsWith("other:") ? s.replace("other:", "") : (SCOPES.find(function (sc) { return sc.id === s }) || {}).name || s
                        return <div key={s} className="reg-chip">{label}<button onClick={function () { setSelectedScopes(function (p) { return p.filter(function (x) { return x !== s }) }) }}>{"\u2715"}</button></div>
                      })}
                    </div>
                  )}

                  <div className="reg-scope-grid">
                    {SCOPES.map(function (scope) {
                      var isOn = selectedScopes.includes(scope.id)
                      return (
                        <div key={scope.id} className={"reg-scope-card " + (isOn ? "on" : "")} onClick={function () { toggleScope(scope.id) }}>
                          <div className="reg-scope-card-icon"><LineIcon d={scope.icon} size={16} color={isOn ? "#ff6040" : "rgba(255,255,255,0.3)"} /></div>
                          <div className="reg-scope-card-name">{scope.name}</div>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    {!showOtherScope ? (
                      <button type="button" onClick={function () { setShowOtherScope(true) }} className="reg-add-other"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add other scope</button>
                    ) : (
                      <div className="reg-add-other-row">
                        <input type="text" className="ps-input" value={otherScope} onChange={function (e) { setOtherScope(e.target.value) }} placeholder="Scope name" style={{ flex: 1, fontSize: 13 }} onKeyDown={function (e) { if (e.key === "Enter") { e.preventDefault(); addOtherScope() } }} />
                        <button type="button" className="ps-btn ps-btn-primary ps-btn-sm" onClick={addOtherScope}>Add</button>
                        <button type="button" className="ps-btn ps-btn-secondary ps-btn-sm" onClick={function () { setShowOtherScope(false); setOtherScope("") }}>Cancel</button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Technology Stack — filtered by scope */}
                <div className="reg-field">
                  <div className="reg-field-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                    Technology Stack * <span className="reg-field-opt">(based on scope above)</span>
                  </div>

                  {selectedTechs.length > 0 && (
                    <div className="reg-selected-chips">
                      {selectedTechs.map(function (t) { return <div key={t} className="reg-chip">{t}<button onClick={function () { toggleTech(t) }}>{"\u2715"}</button></div> })}
                    </div>
                  )}

                  {selectedScopes.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 13, border: "1px dashed rgba(255,255,255,0.06)", borderRadius: 12 }}>Select a project scope first to see available technologies</div>
                  ) : (
                    <div className="reg-tech-grid">
                      {availableTechs.map(function (tech) {
                        var isOn = selectedTechs.includes(tech.name)
                        return (
                          <button key={tech.name} type="button" className={"reg-tech-btn " + (isOn ? "on" : "")} onClick={function () { toggleTech(tech.name) }}>
                            <LineIcon d={tech.icon} size={14} color={isOn ? "#ff6040" : "rgba(255,255,255,0.3)"} />
                            {tech.name}
                          </button>
                        )
                      })}
                    </div>
                  )}
                  <div style={{ marginTop: 8 }}>
                    {!showOtherTech ? (
                      <button type="button" onClick={function () { setShowOtherTech(true) }} className="reg-add-other"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add other technology</button>
                    ) : (
                      <div className="reg-add-other-row">
                        <input type="text" className="ps-input" value={otherTech} onChange={function (e) { setOtherTech(e.target.value) }} placeholder="Technology name" style={{ flex: 1, fontSize: 13 }} onKeyDown={function (e) { if (e.key === "Enter") { e.preventDefault(); addOtherTech() } }} />
                        <button type="button" className="ps-btn ps-btn-primary ps-btn-sm" onClick={addOtherTech}>Add</button>
                        <button type="button" className="ps-btn ps-btn-secondary ps-btn-sm" onClick={function () { setShowOtherTech(false); setOtherTech("") }}>Cancel</button>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Capabilities — optional */}
                <div className="reg-field">
                  <div className="reg-field-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4 4 0 0 0-4 4c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2 4 4 0 0 0-4-4zM8 8v2m8-2v2M6 14a6 6 0 0 0 12 0M9 18l-1 4m7-4l1 4"/></svg>
                    AI Capabilities <span className="reg-field-opt">(optional — describe AI features in your project)</span>
                  </div>
                  <textarea className="ps-textarea" value={aiCapabilities} onChange={function (e) { setAiCapabilities(e.target.value) }} rows={3} placeholder="e.g. AI-based resume analysis, chatbot for student queries, sentiment analysis..." />
                </div>

                {/* AI Tools — optional */}
                <div className="reg-field">
                  <div className="reg-field-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z"/></svg>
                    AI Tools <span className="reg-field-opt">(optional — select tools you are using)</span>
                  </div>

                  {selectedAiTools.length > 0 && (
                    <div className="reg-selected-chips">
                      {selectedAiTools.map(function (t) { return <div key={t} className="reg-chip">{t}<button onClick={function () { toggleAiTool(t) }}>{"\u2715"}</button></div> })}
                    </div>
                  )}

                  <div className="reg-tech-grid" style={{ maxHeight: 200 }}>
                    {AI_TOOLS.map(function (tool) {
                      var isOn = selectedAiTools.includes(tool.name)
                      return (
                        <button key={tool.name} type="button" className={"reg-tech-btn " + (isOn ? "on" : "")} onClick={function () { toggleAiTool(tool.name) }}>
                          <LineIcon d={tool.icon} size={14} color={isOn ? "#ff6040" : "rgba(255,255,255,0.3)"} />
                          {tool.name}
                        </button>
                      )
                    })}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    {!showOtherAiTool ? (
                      <button type="button" onClick={function () { setShowOtherAiTool(true) }} className="reg-add-other"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add other AI tool</button>
                    ) : (
                      <div className="reg-add-other-row">
                        <input type="text" className="ps-input" value={otherAiTool} onChange={function (e) { setOtherAiTool(e.target.value) }} placeholder="AI tool name" style={{ flex: 1, fontSize: 13 }} onKeyDown={function (e) { if (e.key === "Enter") { e.preventDefault(); addOtherAiTool() } }} />
                        <button type="button" className="ps-btn ps-btn-primary ps-btn-sm" onClick={addOtherAiTool}>Add</button>
                        <button type="button" className="ps-btn ps-btn-secondary ps-btn-sm" onClick={function () { setShowOtherAiTool(false); setOtherAiTool("") }}>Cancel</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: TEAM MEMBERS */}
          {!registered && currentStep === 2 && (
            <div className="reg-section">
              <div className="reg-section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff6040" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Team Members ({members.length})
              </div>

              <div className="reg-member-count">
                <span className={"reg-count-pill " + (members.length >= MIN_MEMBERS ? "reg-count-ok" : "reg-count-warn")}>{members.length} / {MAX_MEMBERS}</span>
                <span className="reg-count-text">{members.length < MIN_MEMBERS ? "Need " + (MIN_MEMBERS - members.length) + " more" : members.length < MAX_MEMBERS ? "Can add " + (MAX_MEMBERS - members.length) + " more" : "Maximum reached"}</span>
              </div>

              <div style={{ position: "relative", zIndex: 1 }}>
                {members.map(function (member, index) {
                  var isLeaderMem = index === 0
                  var isReadonly = member.fromDB
                  return (
                    <div key={index} className={"reg-member" + (isLeaderMem ? " leader" : "")}>
                      <div className="reg-member-header">
                        <div className="reg-member-left">
                          <span className="reg-member-num">{isLeaderMem ? "\ud83d\udc51 Team Leader" : "Member " + (index + 1)}</span>
                          {isLeaderMem && <span className="reg-member-tag">Leader</span>}
                        </div>
                        {!isLeaderMem && <button type="button" className="reg-delete-btn" onClick={function () { deleteMember(index) }} title="Remove">{"\ud83d\uddd1"}</button>}
                      </div>
                      <div className="reg-grid">
                        <div className="reg-field" style={{ marginBottom: 0 }}>
                          <label className="ps-label">Roll Number *</label>
                          <input className={"ps-input" + (isLeaderMem ? " readonly" : "")} type="text" value={member.member_roll_number} onChange={function (e) { if (isLeaderMem) return; handleMemberChange(index, "member_roll_number", e.target.value.toUpperCase()); handleMemberChange(index, "lookupDone", false); handleMemberChange(index, "fromDB", false); handleMemberChange(index, "manualEntry", false) }} onBlur={function () { if (!isLeaderMem) handleRollBlur(index) }} placeholder="e.g. 22A31A0501" readOnly={isLeaderMem} />
                          {member.lookupLoading && <span className="reg-lookup-badge reg-lookup-loading">{"\ud83d\udd0d"} Looking up...</span>}
                          {member.fromDB && <span className="reg-lookup-badge reg-lookup-found">{"\u2713"} Found</span>}
                          {member.manualEntry && !member.fromDB && <span className="reg-lookup-badge reg-lookup-manual">{"\ud83d\udcdd"} Manual</span>}
                        </div>
                        <div className="reg-field" style={{ marginBottom: 0 }}>
                          <label className="ps-label">Full Name *</label>
                          <input className={"ps-input" + (isReadonly ? " readonly" : "")} type="text" value={member.member_name} onChange={function (e) { if (!isReadonly) handleMemberChange(index, "member_name", e.target.value) }} placeholder="Full Name" readOnly={isReadonly} />
                        </div>
                        <div className="reg-field" style={{ marginBottom: 0 }}>
                          <label className="ps-label">College *</label>
                          <input className={"ps-input" + (isReadonly ? " readonly" : "")} type="text" value={member.member_college} onChange={function (e) { if (!isReadonly) handleMemberChange(index, "member_college", e.target.value) }} placeholder="College Name" readOnly={isReadonly} />
                        </div>
                        <div className="reg-field" style={{ marginBottom: 0 }}>
                          <label className="ps-label">Branch *</label>
                          {isReadonly ? <input className="ps-input readonly" type="text" value={member.member_branch} readOnly /> : (
                            <select className="ps-select" value={member.member_branch} onChange={function (e) { handleMemberChange(index, "member_branch", e.target.value) }}>
                              <option value="">Select Branch</option>
                              {BRANCHES.map(function (b) { return <option key={b} value={b}>{b}</option> })}
                            </select>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                {members.length < MAX_MEMBERS && <button type="button" className="reg-add-member" onClick={addMember}>{"\u2795"} Add Member {members.length + 1}</button>}
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW */}
          {!registered && currentStep === 3 && (
            <div className="reg-section">
              <div className="reg-section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff6040" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                Review & Submit
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 24, marginTop: -16, position: "relative", zIndex: 1 }}>Please review all details before submitting.</div>

              <div style={{ position: "relative", zIndex: 1 }}>
                {/* Project Review */}
                <div className="reg-review-card">
                  <div className="reg-review-header">
                    <div className="reg-review-title">Project Details</div>
                    <button className="reg-review-edit" onClick={function () { setCurrentStep(1) }}>Edit</button>
                  </div>
                  <div className="reg-review-row"><div className="reg-review-label">Title</div><div className="reg-review-value">{projectTitle}</div></div>
                  {projectDescription && <div className="reg-review-row"><div className="reg-review-label">Description</div><div className="reg-review-value" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{projectDescription}</div></div>}
                  <div className="reg-review-row">
                    <div className="reg-review-label">Scope</div>
                    <div className="reg-selected-chips" style={{ marginTop: 4, marginBottom: 0 }}>
                      {selectedScopes.map(function (s) {
                        var label = s.startsWith("other:") ? s.replace("other:", "") : (SCOPES.find(function (sc) { return sc.id === s }) || {}).name || s
                        return <div key={s} className="reg-chip" style={{ cursor: "default" }}>{label}</div>
                      })}
                    </div>
                  </div>
                  <div className="reg-review-row">
                    <div className="reg-review-label">Technologies</div>
                    <div className="reg-selected-chips" style={{ marginTop: 4, marginBottom: 0 }}>
                      {selectedTechs.map(function (t) { return <div key={t} className="reg-chip" style={{ cursor: "default" }}>{t}</div> })}
                    </div>
                  </div>
                  {aiCapabilities && <div className="reg-review-row"><div className="reg-review-label">AI Capabilities</div><div className="reg-review-value" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{aiCapabilities}</div></div>}
                  {selectedAiTools.length > 0 && (
                    <div className="reg-review-row">
                      <div className="reg-review-label">AI Tools</div>
                      <div className="reg-selected-chips" style={{ marginTop: 4, marginBottom: 0 }}>
                        {selectedAiTools.map(function (t) { return <div key={t} className="reg-chip" style={{ cursor: "default" }}>{t}</div> })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Members Review */}
                <div className="reg-review-card">
                  <div className="reg-review-header">
                    <div className="reg-review-title">Team Members ({members.length})</div>
                    <button className="reg-review-edit" onClick={function () { setCurrentStep(2) }}>Edit</button>
                  </div>
                  {members.map(function (m, i) {
                    return (
                      <div key={i} className="reg-review-member">
                        <div className="reg-review-member-left">
                          <div className={"reg-review-member-avatar " + (m.is_leader ? "leader" : "normal")}>{m.is_leader ? "\ud83d\udc51" : i + 1}</div>
                          <div>
                            <div className="reg-review-member-name">{m.member_name}</div>
                            <div className="reg-review-member-sub">{m.member_roll_number} {"\u2022"} {m.member_branch}</div>
                          </div>
                        </div>
                        <div className="reg-review-member-right">
                          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{m.member_college}</div>
                          {m.is_leader && <div style={{ fontSize: 11, color: "var(--accent-orange)" }}>Team Leader</div>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Nav */}
          {!registered && (
            <div className="reg-nav">
              {currentStep > 1 && <button className="ps-btn ps-btn-secondary" style={{ flex: 1 }} onClick={handleBack}>{"\u2190"} Back</button>}
              {currentStep < 3 ? (
                <button className="ps-btn ps-btn-primary" style={{ flex: 1 }} onClick={handleNext}>Next {"\u2192"}</button>
              ) : (
                <button className="ps-btn ps-btn-primary" style={{ flex: 1, opacity: canRegister ? 1 : 0.4 }} onClick={function () { if (canRegister) setShowConfirm(true) }} disabled={loading || !canRegister}>{loading ? "Registering..." : "Register Team \u2192"}</button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}