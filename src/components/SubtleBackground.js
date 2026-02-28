"use client"
import { useEffect, useRef } from "react"

export default function SubtleBackground() {
  var canvasRef = useRef(null)

  useEffect(function () {
    var canvas = canvasRef.current
    if (!canvas) return
    var ctx = canvas.getContext("2d")
    var animationId

    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    // Falling stars
    var stars = []
    var starCount = 80

    for (var i = 0; i < starCount; i++) {
      stars.push(createStar(true))
    }

    function createStar(initial) {
      var speed = 0.3 + Math.random() * 1.2
      return {
        x: Math.random() * canvas.width,
        y: initial ? Math.random() * canvas.height : -10 - Math.random() * 100,
        length: 8 + Math.random() * 25,
        speed: speed,
        opacity: 0.15 + Math.random() * 0.45,
        thickness: 0.5 + Math.random() * 1,
        angle: Math.PI / 6 + Math.random() * 0.15, // slight diagonal
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.01 + Math.random() * 0.025,
      }
    }

    // Soft ambient glows (very faint)
    var glows = [
      { x: 0.15, y: 0.2, radius: 350, opacity: 0.018 },
      { x: 0.8, y: 0.7, radius: 300, opacity: 0.015 },
      { x: 0.5, y: 0.9, radius: 280, opacity: 0.012 },
    ]

    function draw() {
      // Dark base
      ctx.fillStyle = "#070707"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Soft warm glows
      glows.forEach(function (g) {
        var gx = g.x * canvas.width
        var gy = g.y * canvas.height
        var grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, g.radius)
        grad.addColorStop(0, "rgba(255, 60, 30, " + g.opacity + ")")
        grad.addColorStop(0.5, "rgba(255, 40, 20, " + (g.opacity * 0.3) + ")")
        grad.addColorStop(1, "rgba(0, 0, 0, 0)")
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      })

      // Draw and update falling stars
      stars.forEach(function (s, idx) {
        s.twinkle += s.twinkleSpeed
        var twinkleOp = s.opacity * (0.5 + 0.5 * Math.sin(s.twinkle))

        // Movement - falling with slight diagonal drift
        s.y += s.speed
        s.x += Math.sin(s.angle) * s.speed * 0.3

        // Reset when off screen
        if (s.y > canvas.height + 30 || s.x > canvas.width + 30) {
          stars[idx] = createStar(false)
          stars[idx].x = Math.random() * (canvas.width + 100) - 50
          return
        }

        // Star trail
        var tailX = s.x - Math.sin(s.angle) * s.length
        var tailY = s.y - s.length

        var grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y)
        grad.addColorStop(0, "rgba(255, 255, 255, 0)")
        grad.addColorStop(0.6, "rgba(255, 200, 160, " + (twinkleOp * 0.3) + ")")
        grad.addColorStop(1, "rgba(255, 240, 230, " + twinkleOp + ")")

        ctx.beginPath()
        ctx.moveTo(tailX, tailY)
        ctx.lineTo(s.x, s.y)
        ctx.strokeStyle = grad
        ctx.lineWidth = s.thickness
        ctx.lineCap = "round"
        ctx.stroke()

        // Star head glow
        var headGlow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 3 + s.thickness)
        headGlow.addColorStop(0, "rgba(255, 240, 220, " + (twinkleOp * 0.8) + ")")
        headGlow.addColorStop(1, "rgba(255, 200, 160, 0)")
        ctx.fillStyle = headGlow
        ctx.beginPath()
        ctx.arc(s.x, s.y, 3 + s.thickness, 0, Math.PI * 2)
        ctx.fill()
      })

      // Very faint static sparkles
      ctx.fillStyle = "rgba(255, 255, 255, 0.03)"
      for (var k = 0; k < 3; k++) {
        var sx = (Math.sin(Date.now() * 0.0001 + k * 100) * 0.5 + 0.5) * canvas.width
        var sy = (Math.cos(Date.now() * 0.00008 + k * 77) * 0.5 + 0.5) * canvas.height
        ctx.beginPath()
        ctx.arc(sx, sy, 1, 0, Math.PI * 2)
        ctx.fill()
      }

      animationId = requestAnimationFrame(draw)
    }

    draw()

    return function () {
      window.removeEventListener("resize", resize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  )
}