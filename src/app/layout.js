import { Geist, Geist_Mono } from "next/font/google"
import { Toaster } from "react-hot-toast"
import "./globals.css"

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata = {
  title: "Project Space | Technical Hub",
  description: "Project Space — Build Real-World Projects. May 6-12, 2026. Register your team now!",
  keywords: ["Project Space", "Technical Hub", "Hackathon", "Student Projects", "Registration"],
  openGraph: {
    title: "Project Space | Technical Hub",
    description: "Build Real-World Projects. May 6-12, 2026.",
    type: "website",
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <head>
        <link rel="icon" href="/images/logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#141414",
              color: "#fff",
              border: "1px solid #2a2a2a",
              borderRadius: "12px",
              fontSize: "14px",
              padding: "12px 16px",
              fontFamily: "'Open Sans', sans-serif",
            },
            success: {
              iconTheme: {
                primary: "#f34900",
                secondary: "#fff",
              },
              style: {
                border: "1px solid rgba(243, 73, 0, 0.3)",
              },
            },
            error: {
              style: {
                border: "1px solid rgba(239, 68, 68, 0.3)",
              },
            },
          }}
        />
        <div className="page-wrapper">
          {children}
        </div>
      </body>
    </html>
  )
}