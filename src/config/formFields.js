// ============================================
// CONFIGURATION - Edit this file to update your event
// ============================================

export const EVENT_CONFIG = {
  eventName: "Project Space",
  organizationName: "Technical Hub",
  eventStartDate: "2026-05-06",
  eventEndDate: "2026-05-12",
  eventTime: "9:00 AM - 12:00 AM",
  eventVenue: "Technical Hub Campus",
  minTeamSize: 3,
  maxTeamSize: 6,
  teamNumberPrefix: "PS",
  adminPassword: "projectspace2026",
}

export const BRAND = {
  primary: "#f34900",
  secondary: "#5f6163",
  tertiary: "#303030",
  primaryLight: "#ff6b2b",
  primaryDark: "#d13e00",
  bg: "#0a0a0a",
  surface: "#141414",
  surfaceLight: "#1a1a1a",
  border: "#2a2a2a",
  text: "#ffffff",
  textMuted: "#9ca3af",
}

export const EVENT_DAYS = [
  { dayNumber: 1, date: "2026-05-06", label: "Day 1 - May 6 (Wed)" },
  { dayNumber: 2, date: "2026-05-07", label: "Day 2 - May 7 (Thu)" },
  { dayNumber: 3, date: "2026-05-08", label: "Day 3 - May 8 (Fri)" },
  { dayNumber: 4, date: "2026-05-09", label: "Day 4 - May 9 (Sat)" },
  { dayNumber: 5, date: "2026-05-10", label: "Day 5 - May 10 (Sun)" },
  { dayNumber: 6, date: "2026-05-11", label: "Day 6 - May 11 (Mon)" },
  { dayNumber: 7, date: "2026-05-12", label: "Day 7 - May 12 (Tue)" },
]

export const TECHNOLOGIES = [
  "AWS Development with DevOps",
  "Data Specialist",
  "FSD With Flutter",
  "FSD With React Native",
  "SERVICE NOW",
  "VLSI",
  "React.js", "Next.js", "Angular", "Vue.js", "Node.js", "Express.js",
  "Python", "Django", "Flask", "FastAPI", "Java", "Spring Boot",
  "C#", ".NET", "PHP", "Laravel", "Ruby on Rails", "Go", "Rust",
  "Flutter", "React Native", "Swift", "Kotlin",
  "MongoDB", "PostgreSQL", "MySQL", "Firebase", "Supabase",
  "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes",
  "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch",
  "OpenCV", "NLP", "Computer Vision", "Data Science",
  "Blockchain", "Solidity", "Web3", "IoT", "Arduino", "Raspberry Pi",
  "Cybersecurity", "AR / VR", "Unity", "Unreal Engine",
  "Figma", "Tailwind CSS", "Bootstrap",
]

export const COLLEGES = ["ACET", "ACOE", "AEC"]

export const BRANCHES = [
  "CSE",
  "IT",
  "AIML",
  "DS",
  "ECE",
  "IoT",
  "EEE",
  "Mechanical Engineering",
  "Civil Engineering",
  "Cyber Security",
  "Other",
]

export const BEVERAGES = {
  morning: {
    label: "Morning",
    options: ["Coconut Juice", "Watermelon Juice", "Coconut Water", "Mojito"],
  },
  afternoon: {
    label: "Afternoon",
    options: ["Thumsup", "Sprite", "Cocola", "Lassi", "Buttermilk", "Maza"],
  },
  evening: {
    label: "Evening",
    options: ["Badam Milk", "Badam Fruit Mix", "Rose Milk", "Lime Juice"],
  },
  night: {
    label: "Night",
    options: ["Thumsup", "Sprite", "Cocola", "Lassi", "Buttermilk", "Maza"],
  },
}

export const SNACKS = {
  morning: {
    label: "Morning",
    options: ["Fruit Salad", "Protein Bar", "Roasted Peanuts", "Dryfruit Laddu"],
  },
  evening: {
    label: "Evening",
    options: ["Momos", "Samosa", "Sweetcorn", "Maggie", "Gobi"],
  },
  night: {
    label: "Night",
    options: ["Gobi", "Sweet Corn", "Samosa", "Chips", "Ice Cream", "Ice Cream with Fruits"],
  },
}

export const GALLERY_IMAGES = [
  { src: "/images/gallery1.jpg", alt: "Project Space Aerial View" },
  { src: "/images/gallery2.jpg", alt: "Students at Project Space" },
  { src: "/images/gallery3.jpg", alt: "Project Space Event" },
  { src: "/images/gallery4.jpg", alt: "Team Activities" },
  { src: "/images/gallery5.jpg", alt: "Project Presentations" },
  { src: "/images/gallery6.jpg", alt: "Hackathon Session" },
  { src: "/images/gallery7.jpg", alt: "Collaboration Time" },
  { src: "/images/gallery8.jpg", alt: "Campus Life" },
]

export const PASSWORD_RULES = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
  validate: (password) => {
    const errors = []
    if (password.length < 8) errors.push("At least 8 characters")
    if (!/[A-Z]/.test(password)) errors.push("One uppercase letter")
    if (!/[a-z]/.test(password)) errors.push("One lowercase letter")
    if (!/[0-9]/.test(password)) errors.push("One number")
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) errors.push("One special character")
    return { valid: errors.length === 0, errors }
  },
}

export const WHATSAPP_MESSAGE = (teamNumber, projectTitle, leaderName) => {
  return encodeURIComponent(
    `🚀 *Project Space - Team Registered!*\n\n` +
    `📋 Team Number: *${teamNumber}*\n` +
    `💡 Project: ${projectTitle}\n` +
    `👑 Team Lead: ${leaderName}\n\n` +
    `Show this team number at the venue entrance.\n` +
    `🗓 May 6-12, 2026 | Technical Hub Campus`
  )
}