"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { EVENT_CONFIG } from "@/config/formFields"
import { supabase } from "@/lib/supabase"

function RegBadge() {
  var [open, setOpen] = useState(null)

  useEffect(function () {
    function check() {
      supabase.from("settings").select("value").eq("id", "registration_open").single()
        .then(function (res) { setOpen(res.data ? res.data.value === "true" : true) })
        .catch(function () { setOpen(true) })
    }
    check()
    var interval = setInterval(check, 30000)
    return function () { clearInterval(interval) }
  }, [])

  if (open === null) return null

  return (
    <div className={"reg-badge" + (open ? "" : " closed")}>
      <div className="reg-dot" />
      <span>{open ? "Registrations Open" : "Registrations Closed"}</span>
    </div>
  )
}

function CountdownBar() {
  var [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 })

  useEffect(function () {
    var target = new Date(EVENT_CONFIG.eventStartDate + "T09:00:00").getTime()
    function tick() {
      var diff = target - Date.now()
      if (diff <= 0) return
      setT({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff / 3600000) % 24),
        m: Math.floor((diff / 60000) % 60),
        s: Math.floor((diff / 1000) % 60),
      })
    }
    tick()
    var i = setInterval(tick, 1000)
    return function () { clearInterval(i) }
  }, [])

  var units = [
    { v: t.d, u: "Days" },
    { v: t.h, u: "Hrs" },
    { v: t.m, u: "Min" },
    { v: t.s, u: "Sec" },
  ]

  return (
    <div className="countdown-bar">
      <div className="countdown-label">Event Starts In</div>
      <div className="countdown-boxes">
        {units.map(function (u, i) {
          return (
            <div key={i} className="countdown-item">
              <span className="countdown-num">{String(u.v).padStart(2, "0")}</span>
              <span className="countdown-unit">{u.u}</span>
              {i < 3 && <span className="countdown-sep">:</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AnimatedCanvas() {
  var canvasRef = useRef(null)
  var mouseRef = useRef({ x: -1000, y: -1000 })
  var prevMouseRef = useRef({ x: -1000, y: -1000 })
  var mouseSpeedRef = useRef(0)
  var runningRef = useRef(true)

  useEffect(function () {
    var canvas = canvasRef.current
    if (!canvas) return
    var ctx = canvas.getContext("2d")
    var TWO_PI = Math.PI * 2

    var W = window.innerWidth
    var H = window.innerHeight
    canvas.width = W
    canvas.height = H

    var repelRadius = 120
    var repelStrength = 6

    function resize() { W = window.innerWidth; H = window.innerHeight; canvas.width = W; canvas.height = H }
    window.addEventListener("resize", resize)

    function onMove(e) {
      prevMouseRef.current = { x: mouseRef.current.x, y: mouseRef.current.y }
      mouseRef.current = { x: e.clientX, y: e.clientY }
      var dx = mouseRef.current.x - prevMouseRef.current.x
      var dy = mouseRef.current.y - prevMouseRef.current.y
      mouseSpeedRef.current = Math.sqrt(dx * dx + dy * dy)
    }
    function onLeave() { mouseRef.current = { x: -1000, y: -1000 }; mouseSpeedRef.current = 0 }
    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseleave", onLeave)

    var orangeColors = [
      { inner: "#ff8040", outer: "#ff3020", glow: "rgba(255,70,30,0.4)" },
      { inner: "#ff9050", outer: "#ff5030", glow: "rgba(255,90,40,0.35)" },
      { inner: "#cc5020", outer: "#aa3010", glow: "rgba(255,60,30,0.25)" },
      { inner: "#ffaa50", outer: "#ff6030", glow: "rgba(255,100,40,0.4)" },
      { inner: "#ff7030", outer: "#dd2010", glow: "rgba(255,60,20,0.35)" },
    ]
    function randOrange() { return orangeColors[Math.floor(Math.random() * orangeColors.length)] }

    var spheres = []

    for (var i = 0; i < 100; i++) {
      var hx = Math.random() * W, hy = Math.random() * H
      spheres.push({ x: hx, y: hy, homeX: hx, homeY: hy, vx: 0, vy: 0, radius: Math.random() * 1.2 + 0.4,
        color: { inner: "#fff", outer: "#bbaaaa", glow: "rgba(255,255,255," + (0.06 + Math.random() * 0.1).toFixed(2) + ")" },
        pulse: Math.random() * TWO_PI, pulseSpeed: 0.008 + Math.random() * 0.015,
        orbitAngle: Math.random() * TWO_PI, orbitSpeed: 0.0008 + Math.random() * 0.0015,
        orbitRadius: 3 + Math.random() * 8, type: "star" })
    }

    var corners = [[.03, .03], [.97, .03], [.03, .97], [.97, .97], [.06, .08], [.94, .08], [.06, .92], [.94, .92], [.1, .04], [.9, .04], [.1, .96], [.9, .96]]
    for (var ci = 0; ci < corners.length; ci++) {
      var c = corners[ci]
      var cx = c[0] * W + (Math.random() - .5) * 40, cy = c[1] * H + (Math.random() - .5) * 40
      spheres.push({ x: cx, y: cy, homeX: cx, homeY: cy, vx: 0, vy: 0, radius: 1 + Math.random() * 2, color: randOrange(),
        pulse: Math.random() * TWO_PI, pulseSpeed: .006 + Math.random() * .008, orbitAngle: Math.random() * TWO_PI,
        orbitSpeed: .0008 + Math.random() * .0012, orbitRadius: 8 + Math.random() * 15, type: "corner" })
    }

    for (var ei = 0; ei < 20; ei++) {
      var edge = Math.floor(Math.random() * 4); var ex, ey
      if (edge === 0) { ex = Math.random() * W; ey = Math.random() * H * .08 }
      else if (edge === 1) { ex = Math.random() * W; ey = H * .92 + Math.random() * H * .08 }
      else if (edge === 2) { ex = Math.random() * W * .08; ey = Math.random() * H }
      else { ex = W * .92 + Math.random() * W * .08; ey = Math.random() * H }
      spheres.push({ x: ex, y: ey, homeX: ex, homeY: ey, vx: 0, vy: 0, radius: 1 + Math.random() * 2.5, color: randOrange(),
        pulse: Math.random() * TWO_PI, pulseSpeed: .006 + Math.random() * .008, orbitAngle: Math.random() * TWO_PI,
        orbitSpeed: .0008 + Math.random() * .0015, orbitRadius: 10 + Math.random() * 20, type: "edge" })
    }

    for (var ni = 0; ni < 30; ni++) {
      var sx = W * .08 + Math.random() * W * .84, sy = H * .08 + Math.random() * H * .84
      spheres.push({ x: sx, y: sy, homeX: sx, homeY: sy, vx: 0, vy: 0, radius: 1.5 + Math.random() * 3.5, color: randOrange(),
        pulse: Math.random() * TWO_PI, pulseSpeed: .008 + Math.random() * .01, orbitAngle: Math.random() * TWO_PI,
        orbitSpeed: .001 + Math.random() * .002, orbitRadius: 25 + Math.random() * 50, type: "normal" })
    }

    var MAX_SHOOTING = 5
    var shootingStars = new Array(MAX_SHOOTING).fill(null)

    function spawnShootingStar() {
      var slot = -1
      for (var si = 0; si < MAX_SHOOTING; si++) { if (!shootingStars[si]) { slot = si; break } }
      if (slot === -1) return
      var side = Math.random(); var ssx, ssy
      if (side < 0.6) { ssx = Math.random() * W; ssy = -10 }
      else if (side < 0.8) { ssx = W + 10; ssy = Math.random() * H * 0.4 }
      else { ssx = Math.random() * W * 0.3; ssy = -10 }
      var angle = Math.PI * 0.55 + Math.random() * 0.5, speed = 3 + Math.random() * 4
      shootingStars[slot] = { x: ssx, y: ssy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 1, decay: 0.003 + Math.random() * 0.003, length: 120 + Math.random() * 150, width: 1 + Math.random() * 1.5 }
    }

    var spawnTimer = null
    function spawnLoop() {
      var active = 0; for (var si = 0; si < MAX_SHOOTING; si++) if (shootingStars[si]) active++
      if (active < 2) spawnShootingStar()
      spawnTimer = setTimeout(spawnLoop, 4000 + Math.random() * 5000)
    }
    spawnTimer = setTimeout(spawnLoop, 2000)

    function drawShootingStar(star) {
      var mag = Math.sqrt(star.vx * star.vx + star.vy * star.vy)
      var nx = star.vx / mag, ny = star.vy / mag
      var tailX = star.x - nx * star.length * star.life, tailY = star.y - ny * star.length * star.life
      var grad = ctx.createLinearGradient(star.x, star.y, tailX, tailY)
      grad.addColorStop(0, "rgba(255,255,255," + star.life.toFixed(2) + ")")
      grad.addColorStop(0.3, "rgba(255,200,150," + (star.life * 0.6).toFixed(2) + ")")
      grad.addColorStop(1, "rgba(255,100,50,0)")
      ctx.beginPath(); ctx.moveTo(star.x, star.y); ctx.lineTo(tailX, tailY)
      ctx.strokeStyle = grad; ctx.lineWidth = star.width * star.life; ctx.lineCap = "round"; ctx.stroke()
      var hr = 4 * star.life
      var hg = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, hr)
      hg.addColorStop(0, "rgba(255,255,255," + star.life.toFixed(2) + ")")
      hg.addColorStop(0.5, "rgba(255,200,150," + (star.life * 0.5).toFixed(2) + ")")
      hg.addColorStop(1, "rgba(255,100,50,0)")
      ctx.beginPath(); ctx.arc(star.x, star.y, hr, 0, TWO_PI); ctx.fillStyle = hg; ctx.fill()
    }

    function drawSphere(s) {
      var p = 1 + Math.sin(s.pulse) * 0.2, r = s.radius * p
      if (r < 0.1) return
      if (r > 0.8) {
        var gs = s.type === "star" ? r * 3 : r * 4
        var g1 = ctx.createRadialGradient(s.x, s.y, r * 0.2, s.x, s.y, gs)
        g1.addColorStop(0, s.color.glow); g1.addColorStop(1, "rgba(0,0,0,0)")
        ctx.beginPath(); ctx.arc(s.x, s.y, gs, 0, TWO_PI); ctx.fillStyle = g1; ctx.fill()
      }
      var g2 = ctx.createRadialGradient(s.x - r * .25, s.y - r * .25, r * .05, s.x, s.y, r)
      g2.addColorStop(0, s.color.inner); g2.addColorStop(1, s.color.outer)
      ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, TWO_PI); ctx.fillStyle = g2; ctx.fill()
      if (r > 1.5) {
        var g3 = ctx.createRadialGradient(s.x - r * .2, s.y - r * .3, r * .02, s.x, s.y, r * .6)
        g3.addColorStop(0, "rgba(255,255,255,0.6)"); g3.addColorStop(1, "rgba(255,255,255,0)")
        ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, TWO_PI); ctx.fillStyle = g3; ctx.fill()
      }
    }

    var sparkleEls = document.querySelectorAll(".sparkle")
    var lastSparkle = 0

    function animate(timestamp) {
      if (!runningRef.current) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      var cw = canvas.width, ch = canvas.height
      var mx = mouseRef.current.x, my = mouseRef.current.y
      var mSpeed = mouseSpeedRef.current
      var speedBoost = 1 + Math.min(mSpeed / 15, 4)

      for (var i = 0, len = spheres.length; i < len; i++) {
        var s = spheres[i]
        s.pulse += s.pulseSpeed; if (s.pulse > TWO_PI) s.pulse -= TWO_PI
        s.orbitAngle += s.orbitSpeed; if (s.orbitAngle > TWO_PI) s.orbitAngle -= TWO_PI
        var tx = s.homeX + Math.cos(s.orbitAngle) * s.orbitRadius
        var ty = s.homeY + Math.sin(s.orbitAngle) * s.orbitRadius
        var dx = s.x - mx, dy = s.y - my, distSq = dx * dx + dy * dy
        if (distSq < repelRadius * repelRadius && distSq > 0) {
          var dist = Math.sqrt(distSq), force = (repelRadius - dist) / repelRadius * repelStrength * speedBoost
          s.vx += (dx / dist) * force; s.vy += (dy / dist) * force
        }
        s.vx += (tx - s.x) * .01; s.vy += (ty - s.y) * .01; s.vx *= .95; s.vy *= .95; s.x += s.vx; s.y += s.vy
        if (s.x < 2) { s.x = 2; s.vx = Math.abs(s.vx) } else if (s.x > cw - 2) { s.x = cw - 2; s.vx = -Math.abs(s.vx) }
        if (s.y < 2) { s.y = 2; s.vy = Math.abs(s.vy) } else if (s.y > ch - 2) { s.y = ch - 2; s.vy = -Math.abs(s.vy) }
        drawSphere(s)
      }

      for (var j = 0; j < MAX_SHOOTING; j++) {
        var star = shootingStars[j]; if (!star) continue
        star.x += star.vx; star.y += star.vy; star.life -= star.decay
        if (star.life <= 0 || star.x < -200 || star.x > cw + 200 || star.y > ch + 200) { shootingStars[j] = null; continue }
        drawShootingStar(star)
      }

      mouseSpeedRef.current *= 0.9

      if (timestamp - lastSparkle > 2500) {
        lastSparkle = timestamp
        sparkleEls.forEach(function (sp) { if (Math.random() > 0.5) { sp.style.left = (Math.random() * 75 + 12) + "%"; sp.style.top = (Math.random() * 55 + 8) + "%" } })
      }

      requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)

    function onVis() {
      if (document.hidden) { runningRef.current = false; if (spawnTimer) { clearTimeout(spawnTimer); spawnTimer = null } }
      else { runningRef.current = true; requestAnimationFrame(animate); spawnLoop() }
    }
    document.addEventListener("visibilitychange", onVis)

    return function () {
      runningRef.current = false
      window.removeEventListener("resize", resize)
      document.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseleave", onLeave)
      document.removeEventListener("visibilitychange", onVis)
      if (spawnTimer) clearTimeout(spawnTimer)
    }
  }, [])

  return <canvas ref={canvasRef} id="sphereCanvas" />
}

var CheckSVG = function () {
  return (
    <div className="mini-check">
      <svg fill="none" stroke="#ff6040" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
    </div>
  )
}

export default function Home() {
  var router = useRouter()

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: "\
        .landing-page { font-family:'DM Sans',sans-serif; background:#0a0a0a; color:#fff; overflow-x:hidden; overflow-y:auto; min-height:100vh; width:100vw; position:relative; }\
        .bg-wrapper { position:fixed; inset:0; z-index:0; overflow:hidden; }\
        .bg-grid { position:absolute; inset:0; background-image:linear-gradient(rgba(255,255,255,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.07) 1px,transparent 1px); background-size:70px 70px; }\
        .glow-orb { position:absolute; border-radius:50%; filter:blur(120px); animation:floatOrb 8s ease-in-out infinite; pointer-events:none; will-change:transform; }\
        .orb-1 { width:650px;height:650px;background:radial-gradient(circle,rgba(255,50,20,0.28),transparent 70%);top:-200px;left:-150px; }\
        .orb-2 { width:550px;height:550px;background:radial-gradient(circle,rgba(255,100,30,0.22),transparent 70%);bottom:-250px;right:-150px;animation-delay:-3s; }\
        .orb-3 { width:450px;height:450px;background:radial-gradient(circle,rgba(255,40,40,0.18),transparent 70%);top:35%;left:45%;animation-delay:-5s; }\
        .orb-4 { width:400px;height:400px;background:radial-gradient(circle,rgba(255,80,20,0.15),transparent 70%);top:10%;right:10%;animation-delay:-2s; }\
        .orb-5 { width:350px;height:350px;background:radial-gradient(circle,rgba(255,120,50,0.12),transparent 70%);bottom:20%;left:20%;animation-delay:-6s; }\
        .orb-6 { width:300px;height:300px;background:radial-gradient(circle,rgba(255,60,60,0.14),transparent 70%);top:60%;right:30%;animation-delay:-4s; }\
        @keyframes floatOrb { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(25px,-18px) scale(1.04)} 66%{transform:translate(-18px,15px) scale(0.96)} }\
        .sparkle { position:absolute; background:#fff; border-radius:50%; z-index:2; pointer-events:none; animation:sparkleAnim 3s ease-in-out infinite; will-change:opacity,transform; }\
        @keyframes sparkleAnim { 0%,100%{opacity:0;transform:scale(0)} 50%{opacity:1;transform:scale(1)} }\
        #sphereCanvas { position:fixed; inset:0; z-index:3; pointer-events:none; will-change:contents; }\
        .top-bar { position:fixed; top:0; left:0; right:0; z-index:200; display:flex; align-items:center; justify-content:space-between; padding:16px 24px; }\
        .reg-badge { display:flex; align-items:center; gap:8px; padding:8px 16px; border-radius:50px; font-family:'DM Sans',sans-serif; font-size:11px; font-weight:600; letter-spacing:2px; text-transform:uppercase; backdrop-filter:blur(15px); border:1px solid rgba(255,60,30,0.25); background:rgba(255,50,30,0.08); color:#ff8040; opacity:0; animation:badgeIn 0.8s ease 0.6s forwards; transition:all 0.4s ease; }\
        .reg-badge:hover { border-color:rgba(255,60,30,0.5); background:rgba(255,50,30,0.14); transform:translateY(-2px); box-shadow:0 8px 25px rgba(255,50,30,0.15); }\
        .reg-badge.closed { border-color:rgba(255,60,60,0.3); background:rgba(255,30,30,0.08); color:#ff4444; }\
        .reg-badge.closed .reg-dot { background:#ff4444; box-shadow:0 0 8px rgba(255,68,68,0.6); }\
        .reg-dot { width:8px;height:8px; border-radius:50%; background:#44ff66; box-shadow:0 0 8px rgba(68,255,102,0.6); animation:dotPulse 2s ease-in-out infinite; }\
        @keyframes dotPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.85)} }\
        @keyframes badgeIn { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }\
        .main-content { position:relative; z-index:10; min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:56px 20px 52px; box-sizing:border-box; }\
        .hero-center { text-align:center; flex-shrink:0; }\
        .hero-title { opacity:0; animation:titleIn 1.2s cubic-bezier(0.4,0,0.2,1) forwards; font-family:'Alexsa',sans-serif; font-weight:400; text-transform:uppercase; letter-spacing:12px; line-height:1.15; position:relative; }\
        .hero-title .line1 { display:block; font-size:90px; background:linear-gradient(90deg, transparent 0%, transparent 35%, rgba(255,255,255,0.5) 50%, transparent 65%, transparent 100%),linear-gradient(180deg, #ffffff 0%, #ffffff 45%, #ffe8d0 65%, #ffb070 80%, #FF6B00 100%); background-size: 250% 100%, 100% 100%; background-clip:text; -webkit-background-clip:text; -webkit-text-fill-color:transparent; animation: shinyText 4s ease-in-out infinite; }\
        .hero-title .line2 { display:block; font-size:90px; background:linear-gradient(90deg, transparent 0%, transparent 35%, rgba(255,255,255,0.45) 50%, transparent 65%, transparent 100%),linear-gradient(180deg, #ffffff 0%, #fff0e0 20%, #ffbb70 35%, #ff8030 55%, #FF6B00 75%, #e85500 100%); background-size: 250% 100%, 100% 100%; background-clip:text; -webkit-background-clip:text; -webkit-text-fill-color:transparent; animation: shinyText 4s ease-in-out 0.3s infinite; }\
        @keyframes shinyText { 0%{background-position:-100% 0, 0 0} 40%{background-position:250% 0, 0 0} 100%{background-position:250% 0, 0 0} }\
        @keyframes titleIn { from{opacity:0;transform:translateY(50px) scale(0.95)} to{opacity:1;transform:translateY(0) scale(1)} }\
        .hero-subtitle { font-family:'DM Sans',sans-serif; font-size:16px; font-weight:400; line-height:1.5; max-width:550px; margin:18px auto 0; opacity:0; animation:subIn 1s ease 0.5s forwards; letter-spacing:4px; text-transform:uppercase; color:rgba(255,255,255,0.5); }\
        .hero-subtitle .hashtag { color:#ff6040; font-weight:700; }\
        @keyframes subIn { from{opacity:0;transform:translateY(25px)} to{opacity:1;transform:translateY(0)} }\
        .action-buttons { display:flex; flex-direction:column; align-items:center; gap:12px; margin-top:22px; flex-shrink:0; opacity:0; animation:btnSlideIn 0.8s cubic-bezier(0.4,0,0.2,1) 0.7s forwards; }\
        .action-buttons-row { display:flex; gap:14px; justify-content:center; flex-wrap:wrap; }\
        @keyframes btnSlideIn { from{opacity:0;transform:translateY(14px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }\
        .btn { padding:12px 36px; border-radius:50px; font-size:13px; font-weight:700; font-family:'DM Sans',sans-serif; letter-spacing:3px; text-transform:uppercase; transition:all 0.4s cubic-bezier(0.4,0,0.2,1); display:inline-flex; align-items:center; gap:8px; position:relative; overflow:hidden; cursor:pointer; }\
        .btn::before { content:''; position:absolute; top:0;left:-100%; width:100%;height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent); transition:left 0.5s ease; }\
        .btn:hover::before { left:100%; }\
        .btn-primary { background:linear-gradient(135deg,#ff3020,#ff6040); color:#fff; border:none; box-shadow:0 0 30px rgba(255,50,30,0.3); }\
        .btn-primary:hover { box-shadow:0 0 50px rgba(255,50,30,0.5),0 8px 35px rgba(255,50,30,0.3); transform:translateY(-3px) scale(1.02); }\
        .footer-cards { display:flex; justify-content:center; align-items:stretch; gap:20px; max-width:920px; width:100%; opacity:0; animation:cardsIn 0.8s ease 1.1s forwards; padding:0 10px; margin-top:22px; flex-shrink:0; }\
        @keyframes cardsIn { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }\
        .mini-card { flex:1; height:320px; padding:26px 22px; border-radius:16px; border:1px solid rgba(255,60,30,0.12); background:linear-gradient(165deg,rgba(35,12,8,0.7),rgba(18,6,4,0.85)); backdrop-filter:blur(15px); position:relative; overflow:hidden; transition:all 0.4s cubic-bezier(0.4,0,0.2,1); display:flex; flex-direction:column; box-sizing:border-box; }\
        .mini-card::before { content:''; position:absolute; top:0;left:0;right:0; height:2px; background:linear-gradient(90deg,#ff4020,#ff8040,#ffaa40); opacity:0; transition:opacity 0.4s ease; }\
        .mini-card::after { content:''; position:absolute; top:-50%;left:-50%; width:200%;height:200%; background:radial-gradient(circle at 50% 0%,rgba(255,60,30,0.06),transparent 50%); pointer-events:none; }\
        .mini-card:hover { transform:translateY(-6px); border-color:rgba(255,60,30,0.35); box-shadow:0 15px 45px rgba(255,40,20,0.12),0 0 30px rgba(255,60,30,0.08); }\
        .mini-card:hover::before { opacity:1; }\
        .mini-card-label { font-family:'DM Sans',sans-serif; font-size:10px; font-weight:600; color:#ff8040; text-transform:uppercase; letter-spacing:3px; margin-bottom:19px; position:relative; z-index:1; }\
        .mini-card-top { display:flex; align-items:baseline; gap:8px; margin-bottom:18px; position:relative; z-index:1; }\
        .mini-card-value { font-family:'DM Sans',sans-serif; font-size:42px; font-weight:800; color:#fff; line-height:1; }\
        .mini-card-unit { font-family:'DM Sans',sans-serif; font-size:14px; color:#888; }\
        .mini-card-features { list-style:none; padding:0; margin:0; position:relative; z-index:1; flex:1; display:flex; flex-direction:column; justify-content:flex-start; gap:0; }\
        .mini-card-features li { display:flex; align-items:center; gap:10px; padding:9px 0; color:#aaa; font-family:'DM Sans',sans-serif; font-size:13px; line-height:1.4; border-bottom:1px solid rgba(255,255,255,0.025); }\
        .mini-card-features li:last-child { border-bottom:none; }\
        .mini-check { width:16px;height:16px; border-radius:50%; background:rgba(255,60,30,0.12); display:flex; align-items:center; justify-content:center; flex-shrink:0; }\
        .mini-check svg { width:10px; height:10px; }\
        .countdown-bar { position:fixed; bottom:0; left:0; right:0; z-index:100; background:linear-gradient(90deg,rgba(255,120,40,0.2) 0%,rgba(255,80,30,0.12) 25%,rgba(12,6,3,0.92) 65%,rgba(0,0,0,0.96) 100%); border-top:1px solid rgba(255,120,50,0.2); backdrop-filter:blur(20px); padding:10px 20px; display:flex; align-items:center; justify-content:center; gap:18px; }\
        .countdown-label { font-family:'DM Sans',sans-serif; font-size:11px; font-weight:600; color:#ffaa60; text-transform:uppercase; letter-spacing:3px; white-space:nowrap; }\
        .countdown-boxes { display:flex; align-items:baseline; gap:0; }\
        .countdown-item { display:flex; align-items:baseline; gap:0; }\
        .countdown-num { font-family:'DM Sans',sans-serif; font-size:22px; font-weight:700; color:#fff; line-height:1; padding:0 2px; }\
        .countdown-unit { font-family:'DM Sans',sans-serif; font-size:9px; font-weight:500; color:rgba(255,170,96,0.5); text-transform:uppercase; letter-spacing:1.5px; margin-right:8px; }\
        .countdown-sep { font-family:'DM Sans',sans-serif; font-size:18px; color:rgba(255,140,60,0.35); font-weight:300; padding:0 4px; animation:blink 1.2s ease-in-out infinite; }\
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.25} }\
        @media (max-width:900px) {\
          .hero-title .line1,.hero-title .line2 { font-size:55px; letter-spacing:4px; }\
          .hero-subtitle { font-size:13px; letter-spacing:2px; }\
          .action-buttons-row { flex-direction:column; align-items:center; gap:10px; }\
          .btn { width:220px; justify-content:center; }\
          .footer-cards { flex-direction:column; align-items:center; gap:14px; flex-wrap:wrap; }\
          .mini-card { max-width:340px; width:100%; height:auto; min-height:260px; }\
          .countdown-bar { padding:8px 16px; gap:12px; }\
          .countdown-label { font-size:10px; }\
          .top-bar { padding:12px 16px; }\
          .reg-badge { font-size:10px; padding:6px 12px; }\
        }\
        @media (max-width:500px) {\
          .hero-title .line1,.hero-title .line2 { font-size:38px; letter-spacing:2px; }\
          .hero-subtitle { font-size:11px; letter-spacing:1px; }\
          .countdown-num { font-size:18px; }\
          .mini-card { height:auto; min-height:220px; padding:20px 18px; }\
          .mini-card-value { font-size:34px; }\
          .mini-card-features li { font-size:12px; padding:7px 0; }\
        }\
      " }} />

      <div className="landing-page">
        <div className="bg-wrapper">
          <div className="bg-grid" />
          <div className="glow-orb orb-1" /><div className="glow-orb orb-2" /><div className="glow-orb orb-3" />
          <div className="glow-orb orb-4" /><div className="glow-orb orb-5" /><div className="glow-orb orb-6" />
          {Array.from({ length: 20 }, function (_, i) {
            var sizes = [4, 3, 5, 3, 4, 3, 4, 3, 5, 3, 4, 3, 4, 3, 5, 3, 4, 3, 4, 3]
            var tops = [5, 12, 8, 25, 18, 35, 45, 55, 65, 75, 3, 85, 50, 70, 90, 40, 15, 60, 80, 30]
            var lefts = [8, null, null, 3, 55, null, 7, null, 15, null, 30, 40, 92, null, 8, 48, null, 85, 65, 70]
            var rights = [null, 5, 42, null, null, 6, null, 45, null, 10, null, null, null, 3, null, null, 15, null, null, null]
            var delays = [0, -1, -2, -0.5, -1.5, -2.5, -0.8, -1.8, -2.2, -0.3, -1.2, -0.7, -1.9, -2.8, -0.4, -2.1, -1.3, -0.9, -2.4, -1.6]
            var style = { width: sizes[i] + "px", height: sizes[i] + "px", top: tops[i] + "%", animationDelay: delays[i] + "s" }
            if (lefts[i] !== null) style.left = lefts[i] + "%"
            if (rights[i] !== null) style.right = rights[i] + "%"
            return <div key={i} className="sparkle" style={style} />
          })}
        </div>

        <AnimatedCanvas />

        <div className="top-bar">
          <RegBadge />
        </div>

        <div className="main-content">
          <div className="hero-center">
            <div className="hero-title">
              <span className="line1">Project</span>
              <span className="line2">Space</span>
            </div>
            <p className="hero-subtitle">
              Don&apos;t Just Think <span className="hashtag">#Make it Happen</span>
            </p>
          </div>

          <div className="action-buttons">
            <div className="action-buttons-row">
              <button className="btn btn-primary" onClick={function () { router.push("/login") }}>Login {"\u2192"}</button>
              <button className="btn btn-primary" onClick={function () { router.push("/register-account") }}>Register Team {"\u2192"}</button>
            </div>
          </div>

          <section className="footer-cards">
            <div className="mini-card">
              <div className="mini-card-label">The Event</div>
              <div className="mini-card-top"><div className="mini-card-value">7</div><div className="mini-card-unit">Days</div></div>
              <ul className="mini-card-features">
                <li><CheckSVG />Real-time project building</li>
                <li><CheckSVG />Expert mentor guidance</li>
                <li><CheckSVG />9 AM to 12 AM daily</li>
              </ul>
            </div>
            <div className="mini-card">
              <div className="mini-card-label">Team Size</div>
              <div className="mini-card-top"><div className="mini-card-value">6</div><div className="mini-card-unit">Members</div></div>
              <ul className="mini-card-features">
                <li><CheckSVG />Choose your own technology</li>
                <li><CheckSVG />Cross-branch collaboration</li>
                <li><CheckSVG />Team lead dashboard</li>
              </ul>
            </div>
            <div className="mini-card">
              <div className="mini-card-label">Schedule</div>
              <div className="mini-card-top"><div className="mini-card-value">May</div><div className="mini-card-unit">6th - 12th</div></div>
              <ul className="mini-card-features">
                <li><CheckSVG />Food &amp; refreshments</li>
                <li><CheckSVG />Certificates for all</li>
                <li><CheckSVG />Project showcase</li>
              </ul>
            </div>
          </section>
        </div>

        <CountdownBar />
      </div>
    </>
  )
}