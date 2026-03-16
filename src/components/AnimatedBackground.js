"use client"

import { useEffect, useRef } from "react"

// ============================================
// ANIMATED BACKGROUND — shared across all pages
// Canvas spheres + shooting stars + glow orbs + sparkles + grid
// ============================================
export default function AnimatedBackground() {
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: -1000, y: -1000 })
  const runningRef = useRef(true)

  useEffect(() => {
    // CRITICAL: Reset running state on each mount (fixes Next.js navigation)
    runningRef.current = true

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    const TWO_PI = Math.PI * 2

    let W = window.innerWidth
    let H = window.innerHeight
    canvas.width = W
    canvas.height = H

    // Force canvas resize after a tick (fixes 0x0 on client-side nav)
    requestAnimationFrame(() => {
      const newW = window.innerWidth
      const newH = window.innerHeight
      if (canvas.width !== newW || canvas.height !== newH) {
        canvas.width = newW
        canvas.height = newH
        W = newW
        H = newH
      }
    })

    const repelRadius = 120
    const repelStrength = 6

    const resize = () => { W = window.innerWidth; H = window.innerHeight; canvas.width = W; canvas.height = H }
    window.addEventListener("resize", resize)

    const onMove = (e) => { mouseRef.current = { x: e.clientX, y: e.clientY } }
    const onLeave = () => { mouseRef.current = { x: -1000, y: -1000 } }
    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseleave", onLeave)

    const orangeColors = [
      { inner: "#ff8040", outer: "#ff3020", glow: "rgba(255,70,30,0.4)" },
      { inner: "#ff9050", outer: "#ff5030", glow: "rgba(255,90,40,0.35)" },
      { inner: "#cc5020", outer: "#aa3010", glow: "rgba(255,60,30,0.25)" },
      { inner: "#ffaa50", outer: "#ff6030", glow: "rgba(255,100,40,0.4)" },
      { inner: "#ff7030", outer: "#dd2010", glow: "rgba(255,60,20,0.35)" },
    ]
    const randOrange = () => orangeColors[Math.floor(Math.random() * orangeColors.length)]

    const spheres = []

    // White star dots
    for (let i = 0; i < 100; i++) {
      const hx = Math.random() * W, hy = Math.random() * H
      spheres.push({
        x: hx, y: hy, homeX: hx, homeY: hy, vx: 0, vy: 0, radius: Math.random() * 1.2 + 0.4,
        color: { inner: "#fff", outer: "#bbaaaa", glow: `rgba(255,255,255,${(0.06 + Math.random() * 0.1).toFixed(2)})` },
        pulse: Math.random() * TWO_PI, pulseSpeed: 0.008 + Math.random() * 0.02,
        orbitAngle: Math.random() * TWO_PI, orbitSpeed: 0.001 + Math.random() * 0.002,
        orbitRadius: 3 + Math.random() * 8, type: "star"
      })
    }

    // Corner balls
    const corners = [[.03, .03], [.97, .03], [.03, .97], [.97, .97], [.06, .08], [.94, .08], [.06, .92], [.94, .92], [.1, .04], [.9, .04], [.1, .96], [.9, .96]]
    for (const c of corners) {
      const cx = c[0] * W + (Math.random() - .5) * 40, cy = c[1] * H + (Math.random() - .5) * 40
      spheres.push({
        x: cx, y: cy, homeX: cx, homeY: cy, vx: 0, vy: 0, radius: 1 + Math.random() * 2, color: randOrange(),
        pulse: Math.random() * TWO_PI, pulseSpeed: .015 + Math.random() * .02, orbitAngle: Math.random() * TWO_PI,
        orbitSpeed: .002 + Math.random() * .003, orbitRadius: 8 + Math.random() * 15, type: "corner"
      })
    }

    // Edge balls
    for (let i = 0; i < 20; i++) {
      const edge = Math.floor(Math.random() * 4); let ex, ey
      if (edge === 0) { ex = Math.random() * W; ey = Math.random() * H * .08 }
      else if (edge === 1) { ex = Math.random() * W; ey = H * .92 + Math.random() * H * .08 }
      else if (edge === 2) { ex = Math.random() * W * .08; ey = Math.random() * H }
      else { ex = W * .92 + Math.random() * W * .08; ey = Math.random() * H }
      spheres.push({
        x: ex, y: ey, homeX: ex, homeY: ey, vx: 0, vy: 0, radius: 1 + Math.random() * 2.5, color: randOrange(),
        pulse: Math.random() * TWO_PI, pulseSpeed: .015 + Math.random() * .02, orbitAngle: Math.random() * TWO_PI,
        orbitSpeed: .002 + Math.random() * .004, orbitRadius: 10 + Math.random() * 20, type: "edge"
      })
    }

    // Medium balls
    for (let i = 0; i < 30; i++) {
      const sx = W * .08 + Math.random() * W * .84, sy = H * .08 + Math.random() * H * .84
      spheres.push({
        x: sx, y: sy, homeX: sx, homeY: sy, vx: 0, vy: 0, radius: 1.5 + Math.random() * 3.5, color: randOrange(),
        pulse: Math.random() * TWO_PI, pulseSpeed: .02 + Math.random() * .02, orbitAngle: Math.random() * TWO_PI,
        orbitSpeed: .003 + Math.random() * .005, orbitRadius: 25 + Math.random() * 50, type: "normal"
      })
    }

    // Shooting stars pool
    const MAX_SHOOTING = 5
    const shootingStars = new Array(MAX_SHOOTING).fill(null)

    function spawnShootingStar() {
      let slot = -1
      for (let i = 0; i < MAX_SHOOTING; i++) { if (!shootingStars[i]) { slot = i; break } }
      if (slot === -1) return
      const side = Math.random(); let sx, sy
      if (side < 0.6) { sx = Math.random() * W; sy = -10 }
      else if (side < 0.8) { sx = W + 10; sy = Math.random() * H * 0.4 }
      else { sx = Math.random() * W * 0.3; sy = -10 }
      const angle = Math.PI * 0.55 + Math.random() * 0.5, speed = 10 + Math.random() * 12
      shootingStars[slot] = {
        x: sx, y: sy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 1, decay: 0.008 + Math.random() * 0.008, length: 80 + Math.random() * 100, width: 1 + Math.random() * 1.5
      }
    }

    let spawnTimer = null
    function spawnLoop() {
      let active = 0; for (let i = 0; i < MAX_SHOOTING; i++) if (shootingStars[i]) active++
      if (active < 2) spawnShootingStar()
      spawnTimer = setTimeout(spawnLoop, 3000 + Math.random() * 4000)
    }
    spawnTimer = setTimeout(spawnLoop, 1500)

    function drawShootingStar(star) {
      const mag = Math.sqrt(star.vx * star.vx + star.vy * star.vy)
      const nx = star.vx / mag, ny = star.vy / mag
      const tailX = star.x - nx * star.length * star.life, tailY = star.y - ny * star.length * star.life
      const grad = ctx.createLinearGradient(star.x, star.y, tailX, tailY)
      grad.addColorStop(0, `rgba(255,255,255,${star.life.toFixed(2)})`)
      grad.addColorStop(0.3, `rgba(255,200,150,${(star.life * 0.6).toFixed(2)})`)
      grad.addColorStop(1, "rgba(255,100,50,0)")
      ctx.beginPath(); ctx.moveTo(star.x, star.y); ctx.lineTo(tailX, tailY)
      ctx.strokeStyle = grad; ctx.lineWidth = star.width * star.life; ctx.lineCap = "round"; ctx.stroke()
      const hr = 4 * star.life
      const hg = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, hr)
      hg.addColorStop(0, `rgba(255,255,255,${star.life.toFixed(2)})`)
      hg.addColorStop(0.5, `rgba(255,200,150,${(star.life * 0.5).toFixed(2)})`)
      hg.addColorStop(1, "rgba(255,100,50,0)")
      ctx.beginPath(); ctx.arc(star.x, star.y, hr, 0, TWO_PI); ctx.fillStyle = hg; ctx.fill()
    }

    function drawSphere(s) {
      const p = 1 + Math.sin(s.pulse) * 0.2, r = s.radius * p
      if (r < 0.1) return
      if (r > 0.8) {
        const gs = s.type === "star" ? r * 3 : r * 4
        const g1 = ctx.createRadialGradient(s.x, s.y, r * 0.2, s.x, s.y, gs)
        g1.addColorStop(0, s.color.glow); g1.addColorStop(1, "rgba(0,0,0,0)")
        ctx.beginPath(); ctx.arc(s.x, s.y, gs, 0, TWO_PI); ctx.fillStyle = g1; ctx.fill()
      }
      const g2 = ctx.createRadialGradient(s.x - r * .25, s.y - r * .25, r * .05, s.x, s.y, r)
      g2.addColorStop(0, s.color.inner); g2.addColorStop(1, s.color.outer)
      ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, TWO_PI); ctx.fillStyle = g2; ctx.fill()
      if (r > 1.5) {
        const g3 = ctx.createRadialGradient(s.x - r * .2, s.y - r * .3, r * .02, s.x, s.y, r * .6)
        g3.addColorStop(0, "rgba(255,255,255,0.6)"); g3.addColorStop(1, "rgba(255,255,255,0)")
        ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, TWO_PI); ctx.fillStyle = g3; ctx.fill()
      }
    }

    const sparkleEls = document.querySelectorAll(".sparkle")
    let lastSparkle = 0

    function animate(timestamp) {
      if (!runningRef.current) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const cw = canvas.width, ch = canvas.height
      const mx = mouseRef.current.x, my = mouseRef.current.y

      for (let i = 0, len = spheres.length; i < len; i++) {
        const s = spheres[i]
        s.pulse += s.pulseSpeed; if (s.pulse > TWO_PI) s.pulse -= TWO_PI
        s.orbitAngle += s.orbitSpeed; if (s.orbitAngle > TWO_PI) s.orbitAngle -= TWO_PI
        const tx = s.homeX + Math.cos(s.orbitAngle) * s.orbitRadius
        const ty = s.homeY + Math.sin(s.orbitAngle) * s.orbitRadius
        const dx = s.x - mx, dy = s.y - my, distSq = dx * dx + dy * dy
        if (distSq < repelRadius * repelRadius && distSq > 0) {
          const dist = Math.sqrt(distSq), force = (repelRadius - dist) / repelRadius * repelStrength
          s.vx += (dx / dist) * force; s.vy += (dy / dist) * force
        }
        s.vx += (tx - s.x) * .01; s.vy += (ty - s.y) * .01; s.vx *= .95; s.vy *= .95; s.x += s.vx; s.y += s.vy
        if (s.x < 2) { s.x = 2; s.vx = Math.abs(s.vx) } else if (s.x > cw - 2) { s.x = cw - 2; s.vx = -Math.abs(s.vx) }
        if (s.y < 2) { s.y = 2; s.vy = Math.abs(s.vy) } else if (s.y > ch - 2) { s.y = ch - 2; s.vy = -Math.abs(s.vy) }
        drawSphere(s)
      }

      for (let j = 0; j < MAX_SHOOTING; j++) {
        const star = shootingStars[j]; if (!star) continue
        star.x += star.vx; star.y += star.vy; star.life -= star.decay
        if (star.life <= 0 || star.x < -200 || star.x > cw + 200 || star.y > ch + 200) { shootingStars[j] = null; continue }
        drawShootingStar(star)
      }

      if (timestamp - lastSparkle > 2500) {
        lastSparkle = timestamp
        sparkleEls.forEach(sp => { if (Math.random() > 0.5) { sp.style.left = (Math.random() * 75 + 12) + "%"; sp.style.top = (Math.random() * 55 + 8) + "%" } })
      }

      requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)

    const onVis = () => {
      if (document.hidden) { runningRef.current = false; if (spawnTimer) { clearTimeout(spawnTimer); spawnTimer = null } }
      else { runningRef.current = true; requestAnimationFrame(animate); spawnLoop() }
    }
    document.addEventListener("visibilitychange", onVis)

    return () => {
      runningRef.current = false
      window.removeEventListener("resize", resize)
      document.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseleave", onLeave)
      document.removeEventListener("visibilitychange", onVis)
      if (spawnTimer) clearTimeout(spawnTimer)
    }
  }, [])

  // Sparkle data
  const sparkles = Array.from({ length: 20 }, (_, i) => {
    const sizes = [4, 3, 5, 3, 4, 3, 4, 3, 5, 3, 4, 3, 4, 3, 5, 3, 4, 3, 4, 3]
    const tops = [5, 12, 8, 25, 18, 35, 45, 55, 65, 75, 3, 85, 50, 70, 90, 40, 15, 60, 80, 30]
    const lefts = [8, null, null, 3, 55, null, 7, null, 15, null, 30, 40, 92, null, 8, 48, null, 85, 65, 70]
    const rights = [null, 5, 42, null, null, 6, null, 45, null, 10, null, null, null, 3, null, null, 15, null, null, null]
    const delays = [0, -1, -2, -0.5, -1.5, -2.5, -0.8, -1.8, -2.2, -0.3, -1.2, -0.7, -1.9, -2.8, -0.4, -2.1, -1.3, -0.9, -2.4, -1.6]
    const style = { width: sizes[i] + "px", height: sizes[i] + "px", top: tops[i] + "%", animationDelay: delays[i] + "s" }
    if (lefts[i] !== null) style.left = lefts[i] + "%"
    if (rights[i] !== null) style.right = rights[i] + "%"
    return style
  })

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Genos:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=DM+Sans:wght@400;500;600;700&display=swap');

        /* ===== SHARED DESIGN TOKENS ===== */
        :root {
          --bg-dark: #0a0a0a;
          --accent-red: #ff3020;
          --accent-orange: #ff6040;
          --accent-light: #ff8040;
          --accent-gold: #ffaa40;
          --glass-bg: linear-gradient(165deg, rgba(35,12,8,0.7), rgba(18,6,4,0.85));
          --glass-border: rgba(255,60,30,0.12);
          --glass-border-hover: rgba(255,60,30,0.35);
          --glass-blur: blur(15px);
          --font-display: 'Genos', sans-serif;
          --font-body: var(--font-primary);
          --glow-sm: 0 0 30px rgba(255,50,30,0.2);
          --glow-md: 0 0 50px rgba(255,50,30,0.3);
          --glow-lg: 0 0 50px rgba(255,50,30,0.5), 0 8px 35px rgba(255,50,30,0.3);
        }

        /* ===== BACKGROUND LAYERS ===== */
        .ps-bg-wrapper { position:fixed; inset:0; z-index:0; overflow:hidden; pointer-events:none; }
        .ps-bg-grid { position:absolute; inset:0; background-image:linear-gradient(rgba(255,255,255,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.07) 1px,transparent 1px); background-size:70px 70px; }
        .ps-glow-orb { position:absolute; border-radius:50%; filter:blur(120px); animation:psFloatOrb 8s ease-in-out infinite; pointer-events:none; will-change:transform; }
        .ps-orb-1 { width:650px;height:650px;background:radial-gradient(circle,rgba(255,50,20,0.28),transparent 70%);top:-200px;left:-150px; }
        .ps-orb-2 { width:550px;height:550px;background:radial-gradient(circle,rgba(255,100,30,0.22),transparent 70%);bottom:-250px;right:-150px;animation-delay:-3s; }
        .ps-orb-3 { width:450px;height:450px;background:radial-gradient(circle,rgba(255,40,40,0.18),transparent 70%);top:35%;left:45%;animation-delay:-5s; }
        .ps-orb-4 { width:400px;height:400px;background:radial-gradient(circle,rgba(255,80,20,0.15),transparent 70%);top:10%;right:10%;animation-delay:-2s; }
        .ps-orb-5 { width:350px;height:350px;background:radial-gradient(circle,rgba(255,120,50,0.12),transparent 70%);bottom:20%;left:20%;animation-delay:-6s; }
        .ps-orb-6 { width:300px;height:300px;background:radial-gradient(circle,rgba(255,60,60,0.14),transparent 70%);top:60%;right:30%;animation-delay:-4s; }
        @keyframes psFloatOrb { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(25px,-18px) scale(1.04)} 66%{transform:translate(-18px,15px) scale(0.96)} }

        .sparkle { position:absolute; background:#fff; border-radius:50%; z-index:2; pointer-events:none; animation:psSparkleAnim 3s ease-in-out infinite; will-change:opacity,transform; }
        @keyframes psSparkleAnim { 0%,100%{opacity:0;transform:scale(0)} 50%{opacity:1;transform:scale(1)} }

        #sphereCanvas { position:fixed; inset:0; z-index:3; pointer-events:none; will-change:contents; }

        /* ===== SHARED COMPONENT STYLES ===== */

        /* Glass Card */
        .ps-card { padding:28px; border-radius:18px; border:1px solid var(--glass-border); background:var(--glass-bg); backdrop-filter:var(--glass-blur); position:relative; overflow:hidden; transition:all 0.4s cubic-bezier(0.4,0,0.2,1); }
        .ps-card::before { content:''; position:absolute; top:0;left:0;right:0; height:2px; background:linear-gradient(90deg,#ff4020,#ff8040,#ffaa40); opacity:0; transition:opacity 0.4s ease; }
        .ps-card::after { content:''; position:absolute; top:-50%;left:-50%; width:200%;height:200%; background:radial-gradient(circle at 50% 0%,rgba(255,60,30,0.06),transparent 50%); pointer-events:none; }
        .ps-card:hover { transform:translateY(-4px); border-color:var(--glass-border-hover); box-shadow:0 15px 45px rgba(255,40,20,0.12),0 0 30px rgba(255,60,30,0.08); }
        .ps-card:hover::before { opacity:1; }

        /* Buttons */
        .ps-btn { padding:14px 40px; border-radius:50px; font-size:16px; font-weight:600; font-family:var(--font-display); letter-spacing:2px; text-transform:uppercase; cursor:pointer; transition:all 0.4s cubic-bezier(0.4,0,0.2,1); display:inline-flex; align-items:center; justify-content:center; gap:8px; position:relative; overflow:hidden; border:none; }
        .ps-btn::before { content:''; position:absolute; top:0;left:-100%; width:100%;height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent); transition:left 0.5s ease; }
        .ps-btn:hover::before { left:100%; }
        .ps-btn-primary { background:linear-gradient(135deg,#ff3020,#ff6040); color:#fff; box-shadow:0 0 30px rgba(255,50,30,0.3); }
        .ps-btn-primary:hover { box-shadow:var(--glow-lg); transform:translateY(-3px) scale(1.02); }
        .ps-btn-primary:disabled { opacity:0.5; cursor:not-allowed; transform:none; box-shadow:none; }
        .ps-btn-secondary { background:transparent; color:#fff; border:1.5px solid rgba(255,255,255,0.2); }
        .ps-btn-secondary:hover { border-color:rgba(255,60,30,0.6); background:rgba(255,60,30,0.1); box-shadow:var(--glow-sm); transform:translateY(-3px); }
        .ps-btn-sm { padding:10px 24px; font-size:13px; letter-spacing:1.5px; }
        .ps-btn-danger { background:linear-gradient(135deg,#ff2020,#cc1010); color:#fff; box-shadow:0 0 20px rgba(255,30,30,0.2); }
        .ps-btn-danger:hover { box-shadow:0 0 40px rgba(255,30,30,0.4); transform:translateY(-3px); }

        /* Inputs */
        .ps-input { width:100%; padding:14px 18px; border-radius:12px; border:1.5px solid rgba(255,60,30,0.15); background:rgba(255,255,255,0.04); color:#fff; font-family:var(--font-body); font-size:15px; transition:all 0.3s ease; outline:none; }
        .ps-input::placeholder { color:rgba(255,255,255,0.25); }
        .ps-input:focus { border-color:var(--accent-orange); box-shadow:0 0 20px rgba(255,96,64,0.15); background:rgba(255,255,255,0.06); }
        .ps-input:disabled { opacity:0.4; cursor:not-allowed; }

        .ps-select { width:100%; padding:14px 18px; border-radius:12px; border:1.5px solid rgba(255,60,30,0.15); background:rgba(255,255,255,0.04); color:#fff; font-family:var(--font-body); font-size:15px; transition:all 0.3s ease; outline:none; appearance:none; cursor:pointer; }
        .ps-select:focus { border-color:var(--accent-orange); box-shadow:0 0 20px rgba(255,96,64,0.15); }
        .ps-select option { background:#1a1a1a; color:#fff; }

        .ps-textarea { width:100%; padding:14px 18px; border-radius:12px; border:1.5px solid rgba(255,60,30,0.15); background:rgba(255,255,255,0.04); color:#fff; font-family:var(--font-body); font-size:15px; transition:all 0.3s ease; outline:none; resize:vertical; min-height:80px; }
        .ps-textarea:focus { border-color:var(--accent-orange); box-shadow:0 0 20px rgba(255,96,64,0.15); }

        /* Labels */
        .ps-label { display:block; font-family:var(--font-display); font-size:13px; font-weight:600; color:var(--accent-light); text-transform:uppercase; letter-spacing:2px; margin-bottom:8px; }

        /* Page wrapper */
        .ps-page { font-family:var(--font-body); background:var(--bg-dark); color:#fff; min-height:100vh; position:relative; }
        .ps-content { position:relative; z-index:10; min-height:100vh; display:flex; flex-direction:column; align-items:center; padding:40px 20px; }

        /* Page title */
        .ps-page-title { font-family:var(--font-display); font-weight:900; text-transform:uppercase; letter-spacing:4px; line-height:1; background:linear-gradient(180deg,#ffffff 0%,#fff0e8 15%,#ffd6bc 30%,#ffb088 45%,#ff8850 58%,#ff6535 72%,#ff4520 85%,#ff3020 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; font-size:48px; text-align:center; margin-bottom:8px; opacity:0; animation:psTitleIn 1s cubic-bezier(0.4,0,0.2,1) forwards; }
        .ps-page-subtitle { font-family:var(--font-display); font-size:16px; font-weight:500; letter-spacing:3px; text-transform:uppercase; color:rgba(255,255,255,0.4); text-align:center; margin-bottom:35px; opacity:0; animation:psSubIn 0.8s ease 0.3s forwards; }
        @keyframes psTitleIn { from{opacity:0;transform:translateY(30px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes psSubIn { from{opacity:0;transform:translateY(15px)} to{opacity:1;transform:translateY(0)} }

        /* Fade in animation */
        .ps-fade-in { opacity:0; animation:psFadeIn 0.8s ease forwards; }
        .ps-fade-in-1 { animation-delay:0.2s; }
        .ps-fade-in-2 { animation-delay:0.4s; }
        .ps-fade-in-3 { animation-delay:0.6s; }
        .ps-fade-in-4 { animation-delay:0.8s; }
        @keyframes psFadeIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

        /* Section label (used as tag/badge inside cards) */
        .ps-tag { display:inline-block; padding:4px 14px; border-radius:50px; font-family:var(--font-display); font-size:11px; font-weight:600; letter-spacing:2px; text-transform:uppercase; background:rgba(255,60,30,0.12); color:var(--accent-light); border:1px solid rgba(255,60,30,0.2); }

        /* Divider */
        .ps-divider { width:100%; height:1px; background:linear-gradient(90deg,transparent,rgba(255,60,30,0.3),transparent); margin:20px 0; }

        /* Status dot */
        .ps-dot { width:8px;height:8px; border-radius:50%; display:inline-block; }
        .ps-dot-green { background:#44ff66; box-shadow:0 0 8px rgba(68,255,102,0.6); }
        .ps-dot-red { background:#ff4444; box-shadow:0 0 8px rgba(255,68,68,0.6); }
        .ps-dot-yellow { background:#ffaa00; box-shadow:0 0 8px rgba(255,170,0,0.6); }

        /* Toast override for dark theme */
        .ps-page [data-sonner-toaster] { font-family:var(--font-body) !important; }

        /* Scrollbar */
        .ps-page ::-webkit-scrollbar { width:6px; }
        .ps-page ::-webkit-scrollbar-track { background:rgba(255,255,255,0.02); }
        .ps-page ::-webkit-scrollbar-thumb { background:rgba(255,60,30,0.3); border-radius:3px; }
        .ps-page ::-webkit-scrollbar-thumb:hover { background:rgba(255,60,30,0.5); }

        /* Back button */
        .ps-back { display:inline-flex; align-items:center; gap:6px; font-family:var(--font-display); font-size:14px; font-weight:500; color:rgba(255,255,255,0.4); letter-spacing:2px; text-transform:uppercase; text-decoration:none; cursor:pointer; background:none; border:none; padding:8px 0; transition:all 0.3s ease; margin-bottom:20px; }
        .ps-back:hover { color:var(--accent-orange); }

        /* Chip / Multi-select tag */
        .ps-chip { display:inline-flex; align-items:center; gap:6px; padding:6px 14px; border-radius:50px; font-family:var(--font-display); font-size:12px; font-weight:500; letter-spacing:1px; text-transform:uppercase; cursor:pointer; transition:all 0.3s ease; border:1px solid rgba(255,60,30,0.15); background:rgba(255,255,255,0.03); color:rgba(255,255,255,0.5); }
        .ps-chip:hover { border-color:rgba(255,60,30,0.4); color:rgba(255,255,255,0.8); }
        .ps-chip.active { border-color:var(--accent-orange); background:rgba(255,60,30,0.15); color:#fff; }

        /* Progress bar */
        .ps-progress-track { width:100%; height:4px; background:rgba(255,255,255,0.06); border-radius:2px; overflow:hidden; }
        .ps-progress-fill { height:100%; background:linear-gradient(90deg,var(--accent-red),var(--accent-orange)); border-radius:2px; transition:width 0.5s cubic-bezier(0.4,0,0.2,1); }

        /* Table */
        .ps-table { width:100%; border-collapse:separate; border-spacing:0; }
        .ps-table th { padding:12px 16px; font-family:var(--font-display); font-size:12px; font-weight:600; color:var(--accent-light); text-transform:uppercase; letter-spacing:2px; text-align:left; border-bottom:1px solid rgba(255,60,30,0.15); }
        .ps-table td { padding:12px 16px; font-size:14px; color:rgba(255,255,255,0.7); border-bottom:1px solid rgba(255,255,255,0.04); transition:background 0.2s ease; }
        .ps-table tr:hover td { background:rgba(255,60,30,0.04); }

        /* Modal overlay */
        .ps-modal-overlay { position:fixed; inset:0; z-index:500; background:rgba(0,0,0,0.7); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; padding:20px; animation:psModalIn 0.3s ease; }
        .ps-modal { max-width:500px; width:100%; }
        @keyframes psModalIn { from{opacity:0} to{opacity:1} }

        /* Loading spinner */
        .ps-spinner { width:20px; height:20px; border:2px solid rgba(255,255,255,0.2); border-top-color:var(--accent-orange); border-radius:50%; animation:psSpin 0.6s linear infinite; display:inline-block; }
        @keyframes psSpin { to{transform:rotate(360deg)} }

        /* Responsive */
        @media (max-width:768px) {
          .ps-page-title { font-size:36px; letter-spacing:2px; }
          .ps-page-subtitle { font-size:13px; letter-spacing:1.5px; }
          .ps-card { padding:20px; }
          .ps-content { padding:25px 15px; }
          .ps-btn { padding:12px 28px; font-size:14px; }
        }

        @media (max-width:500px) {
          .ps-page-title { font-size:28px; }
          .ps-btn { padding:12px 22px; font-size:13px; width:100%; }
        }
      `}</style>

      <div className="ps-bg-wrapper">
        <div className="ps-bg-grid" />
        <div className="ps-glow-orb ps-orb-1" />
        <div className="ps-glow-orb ps-orb-2" />
        <div className="ps-glow-orb ps-orb-3" />
        <div className="ps-glow-orb ps-orb-4" />
        <div className="ps-glow-orb ps-orb-5" />
        <div className="ps-glow-orb ps-orb-6" />
        {sparkles.map((style, i) => (
          <div key={i} className="sparkle" style={style} />
        ))}
      </div>

      <canvas ref={canvasRef} id="sphereCanvas" />
    </>
  )
}