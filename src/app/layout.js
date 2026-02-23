import { Toaster } from "react-hot-toast"
import "./globals.css"

export const metadata = {
  title: "Project Space | Technical Hub",
  description: "Register your team for Project Space - Build. Innovate. Ship.",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a1a1a',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
            },
          }}
        />
        {children}
      </body>
    </html>
  )
}