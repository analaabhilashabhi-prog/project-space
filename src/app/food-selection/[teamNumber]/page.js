"use client"
import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import DashboardSidebar from "@/components/DashboardSidebar"

var FD = {
  sandwich:{e:"\ud83e\udd6a",n:"Sandwich",c:"Snack"},samosa:{e:"\ud83e\udd5f",n:"Samosa",c:"Snack"},puff:{e:"\ud83e\udd50",n:"Puff",c:"Snack"},cake:{e:"\ud83c\udf70",n:"Cake",c:"Snack"},biscuits:{e:"\ud83c\udf6a",n:"Biscuits",c:"Snack"},chips:{e:"\ud83c\udf5f",n:"Chips",c:"Snack"},vadapav:{e:"\ud83c\udf54",n:"Vada Pav",c:"Snack"},breadpakora:{e:"\ud83e\uded3",n:"Bread Pakora",c:"Snack"},
  tea:{e:"\ud83c\udf75",n:"Tea",c:"Beverage"},coffee:{e:"\u2615",n:"Coffee",c:"Beverage"},juice:{e:"\ud83e\uddc3",n:"Juice",c:"Beverage"},milk:{e:"\ud83e\udd5b",n:"Milk",c:"Beverage"},buttermilk:{e:"\ud83e\udd64",n:"Buttermilk",c:"Beverage"},water:{e:"\ud83d\udca7",n:"Water",c:"Beverage"},lemonade:{e:"\ud83c\udf4b",n:"Lemonade",c:"Beverage"},coldcoffee:{e:"\ud83e\uddca",n:"Cold Coffee",c:"Beverage"}
}

var FALLBACK = {
  sandwich:{description:"A wholesome veggie sandwich made with fresh lettuce, sliced tomatoes, cucumber, cheese, and tangy mint chutney layered between lightly toasted whole wheat bread.",calories:245,protein:"8g",carbs:"32g",fat:"10g",ingredients:["Whole Wheat Bread","Lettuce","Tomato","Cucumber","Cheese","Mint Chutney","Butter"],allergens:["Gluten","Dairy"],funFact:"The sandwich was named after John Montagu, the 4th Earl of Sandwich, who wanted to eat without leaving his card table!"},
  samosa:{description:"A golden, crispy deep-fried pastry stuffed with a spiced filling of potatoes, green peas, cumin, and coriander. One of India's most beloved street foods.",calories:308,protein:"5g",carbs:"28g",fat:"18g",ingredients:["Refined Flour","Potato","Green Peas","Cumin Seeds","Coriander","Green Chili","Oil"],allergens:["Gluten"],funFact:"Samosas originated in the Middle East and were brought to India in the 13th century!"},
  puff:{description:"Flaky, buttery puff pastry layers encasing a savory filling of spiced mixed vegetables and paneer.",calories:220,protein:"4g",carbs:"24g",fat:"12g",ingredients:["Puff Pastry","Mixed Vegetables","Paneer","Pepper","Salt","Butter"],allergens:["Gluten","Dairy"],funFact:"Puff pastry requires over 700 layers of dough and butter to achieve its signature flaky texture!"},
  cake:{description:"A soft, moist vanilla sponge cake topped with silky whipped cream frosting and a generous drizzle of rich chocolate.",calories:320,protein:"4g",carbs:"45g",fat:"14g",ingredients:["Flour","Sugar","Eggs","Vanilla","Butter","Cream","Cocoa"],allergens:["Gluten","Dairy","Eggs"],funFact:"The word cake comes from the Old Norse word kaka and cakes have been baked since ancient Egypt!"},
  biscuits:{description:"An assorted pack of cream-filled biscuits with a satisfying crunch on the outside and a sweet, smooth cream center.",calories:180,protein:"3g",carbs:"26g",fat:"7g",ingredients:["Wheat Flour","Sugar","Oil","Cream","Salt","Soda"],allergens:["Gluten"],funFact:"India is the third largest biscuit manufacturer in the world, producing over 3 million tonnes annually!"},
  chips:{description:"Thinly sliced potato chips seasoned with a bold masala spice blend featuring turmeric, chili powder, and a tangy kick.",calories:160,protein:"2g",carbs:"15g",fat:"10g",ingredients:["Potato","Sunflower Oil","Masala Mix","Salt","Turmeric","Chili"],allergens:["None"],funFact:"Potato chips were invented by accident in 1853 when a chef sliced potatoes too thin!"},
  vadapav:{description:"Mumbai's iconic street food \u2014 a spiced potato fritter tucked inside a soft pav bun with fiery garlic chutney.",calories:290,protein:"6g",carbs:"35g",fat:"13g",ingredients:["Pav","Potato Vada","Garlic Chutney","Chili","Coconut Chutney"],allergens:["Gluten"],funFact:"Vada Pav was invented in 1966 outside Dadar station in Mumbai and is called the Indian burger!"},
  breadpakora:{description:"Soft bread slices stuffed with spiced potato, dipped in chickpea flour batter, and deep fried to golden perfection.",calories:275,protein:"6g",carbs:"30g",fat:"14g",ingredients:["Bread","Potato","Besan","Chili","Ginger","Coriander","Oil"],allergens:["Gluten"],funFact:"Bread Pakora becomes the most popular street food during the rainy season in North India!"},
  tea:{description:"Piping hot Indian masala chai brewed with fresh ginger, crushed cardamom, simmered with milk and sweetened to perfection.",calories:80,protein:"3g",carbs:"12g",fat:"2g",ingredients:["Tea Leaves","Milk","Sugar","Ginger","Cardamom"],allergens:["Dairy"],funFact:"India is the second largest tea producer in the world, and masala chai dates back over 5,000 years!"},
  coffee:{description:"Rich, aromatic South Indian filter coffee brewed from premium dark-roasted beans, blended with hot milk.",calories:95,protein:"3g",carbs:"10g",fat:"3g",ingredients:["Coffee Beans","Milk","Sugar","Water"],allergens:["Dairy"],funFact:"Legend says coffee was discovered by an Ethiopian goat herder who noticed his goats dancing after eating coffee berries!"},
  juice:{description:"Freshly squeezed mixed fruit juice blending seasonal oranges, apples, and pineapple with no added sugar.",calories:120,protein:"1g",carbs:"28g",fat:"0g",ingredients:["Orange","Apple","Pineapple","Seasonal Fruits","Ice"],allergens:["None"],funFact:"Drinking fresh fruit juice within 15 minutes of preparation retains up to 90% of its nutritional value!"},
  milk:{description:"Chilled flavored milk available in rich chocolate and sweet strawberry variants. Creamy and calcium-packed.",calories:150,protein:"8g",carbs:"18g",fat:"5g",ingredients:["Full Cream Milk","Cocoa/Strawberry","Sugar"],allergens:["Dairy"],funFact:"Humans are the only species that drink milk from another species \u2014 for over 10,000 years!"},
  buttermilk:{description:"Traditional Indian spiced chaas made from fresh churned curd, seasoned with roasted cumin and rock salt.",calories:45,protein:"2g",carbs:"5g",fat:"1g",ingredients:["Curd","Water","Cumin","Rock Salt","Coriander","Curry Leaves"],allergens:["Dairy"],funFact:"Buttermilk is a natural probiotic that aids digestion and was historically the liquid left after churning butter!"},
  water:{description:"Pure, triple-filtered packaged drinking water. The most essential beverage to stay hydrated.",calories:0,protein:"0g",carbs:"0g",fat:"0g",ingredients:["Purified Water"],allergens:["None"],funFact:"The human brain is 75% water, so staying hydrated literally helps you code better!"},
  lemonade:{description:"Freshly squeezed lime juice with mint leaves, a pinch of black salt, and just the right amount of sweetness.",calories:65,protein:"0g",carbs:"16g",fat:"0g",ingredients:["Lime","Mint","Sugar","Black Salt","Water","Ice"],allergens:["None"],funFact:"Lemonade has been around since ancient Egypt where they called it qatarmizat!"},
  coldcoffee:{description:"Iced blended coffee made with espresso, vanilla ice cream, cold milk, and topped with chocolate drizzle.",calories:210,protein:"5g",carbs:"28g",fat:"8g",ingredients:["Coffee","Ice Cream","Milk","Chocolate","Ice","Sugar"],allergens:["Dairy"],funFact:"Cold coffee became a global trend in the 1990s but has been enjoyed in India since the 1960s!"}
}

var COMBOS = {"Sandwich+Coffee":"The Classic","Samosa+Tea":"The OG Desi","Puff+Coffee":"The Cozy","Biscuits+Tea":"The Desi","Chips+Lemonade":"The Chill","Vada Pav+Buttermilk":"The Mumbai","Cake+Cold Coffee":"The Treat","Samosa+Juice":"The Street","Bread Pakora+Tea":"The Rainy Day","Sandwich+Juice":"The Healthy","Chips+Cold Coffee":"The Binge","Cake+Milk":"The Sweet Tooth","Samosa+Coffee":"The Hustler"}
var POPULAR = ["sandwich","samosa","chips","coffee","juice"]
var SNACK_IDS = ["sandwich","samosa","puff","cake","biscuits","chips","vadapav","breadpakora"]
var BEV_IDS = ["tea","coffee","juice","milk","buttermilk","water","lemonade","coldcoffee"]

export default function FoodSelectionPage() {
  var params = useParams()
  var router = useRouter()
  var teamNumber = params.teamNumber

  var [team, setTeam] = useState(null)
  var [members, setMembers] = useState([])
  var [loading, setLoading] = useState(true)
  var [loggedInRoll, setLoggedInRoll] = useState("")
  var [currentMember, setCurrentMember] = useState(null)
  var [isLeader, setIsLeader] = useState(false)
  var [selectedMember, setSelectedMember] = useState(null)
  var [curDay, setCurDay] = useState(0)
  var [cat, setCat] = useState("snacks")
  var [dayData, setDayData] = useState([{},{},{},{},{},{},{}])
  var [curView, setCurView] = useState(null)
  var [aiData, setAiData] = useState({})
  var [aiLoading, setAiLoading] = useState(false)
  var [saving, setSaving] = useState(false)
  var [saved, setSaved] = useState(false)
  var [warning, setWarning] = useState(null)
  var [confetti, setConfetti] = useState(false)
  var [focusIdx, setFocusIdx] = useState(-1)
  var [locked, setLocked] = useState(false)
  var [showConfirmOrder, setShowConfirmOrder] = useState(false)
  var gridRef = useRef(null)

  // Load data
  useEffect(function () {
    var roll = sessionStorage.getItem("ps_roll") || localStorage.getItem("ps_roll")
    if (!roll) { router.push("/login"); return }
    setLoggedInRoll(roll)
    sessionStorage.setItem("ps_team_number", teamNumber)
    localStorage.setItem("ps_team_number", teamNumber)

    async function load() {
      var teamRes = await supabase.from("teams").select("*").eq("team_number", teamNumber).single()
      if (!teamRes.data) { setLoading(false); return }
      setTeam(teamRes.data)

      var memRes = await supabase.from("team_members").select("*").eq("team_id", teamRes.data.id).order("is_leader", { ascending: false })
      setMembers(memRes.data || [])

      var me = (memRes.data || []).find(function (m) { return m.member_roll_number === roll })
      if (me) { setCurrentMember(me); setIsLeader(me.is_leader || false); setSelectedMember(me) }

      // Load existing food selections for this member
      if (me) {
        var foodRes = await supabase.from("food_selections").select("*").eq("member_roll_number", me.member_roll_number)
        if (foodRes.data && foodRes.data.length > 0) {
          var loaded = [{},{},{},{},{},{},{}]
          // Build a reverse lookup: name → key (e.g. "Sandwich" → "sandwich")
          var nameToKey = {}
          Object.keys(FD).forEach(function (k) { nameToKey[FD[k].n.toLowerCase()] = k; nameToKey[k] = k })
          foodRes.data.forEach(function (f) {
            var idx = f.day_number - 1
            if (idx >= 0 && idx < 7) {
              if (f.beverage) {
                var bevKey = nameToKey[f.beverage.toLowerCase()] || nameToKey[f.beverage] || f.beverage
                loaded[idx].bev = bevKey
              }
              if (f.snack) {
                var snackKey = nameToKey[f.snack.toLowerCase()] || nameToKey[f.snack] || f.snack
                loaded[idx].snack = snackKey
              }
            }
          })
          setDayData(loaded)

          // Check if already locked
          var lockKey = "ps_food_locked_" + me.member_roll_number
          var isLocked = localStorage.getItem(lockKey) === "true"
          // Also check if any row has confirmed=true
          if (!isLocked && foodRes.data) {
            var anyConfirmed = foodRes.data.some(function (f) { return f.confirmed === true })
            if (anyConfirmed) { isLocked = true; localStorage.setItem(lockKey, "true") }
          }
          if (isLocked) setLocked(true)
        }
      }
      setLoading(false)
    }
    load()
  }, [teamNumber, router])

  // Save to Supabase
  async function saveDay(dayIdx, data) {
    if (!selectedMember || !team) return
    setSaving(true)
    setSaved(false)
    try {
      // Delete existing for this day
      var delRes = await supabase.from("food_selections").delete().eq("member_roll_number", selectedMember.member_roll_number).eq("day_number", dayIdx + 1)
      if (delRes.error) console.error("Delete error:", delRes.error)
      // Insert new if we have selections
      if (data.snack || data.bev) {
        var insRes = await supabase.from("food_selections").insert({
          team_id: team.id,
          team_number: teamNumber,
          member_roll_number: selectedMember.member_roll_number,
          member_name: selectedMember.member_name,
          day_number: dayIdx + 1,
          day_date: "Day " + (dayIdx + 1),
          snack: data.snack || null,
          beverage: data.bev || null,
          confirmed: false
        })
        if (insRes.error) console.error("Insert error:", insRes.error)
      }
      setSaved(true)
      setTimeout(function () { setSaved(false) }, 2000)
    } catch (e) { console.error("Save error:", e) }
    setSaving(false)
  }

  // Select food
  function selectFood(id, type) {
    if (locked) return
    var newData = dayData.map(function (d, i) {
      if (i !== curDay) return d
      var nd = Object.assign({}, d)
      if (type === "snack") nd.snack = id; else nd.bev = id
      return nd
    })
    setDayData(newData)
    saveDay(curDay, newData[curDay])
  }

  // Deselect
  function deselectFood(id, type) {
    if (locked) return
    var newData = dayData.map(function (d, i) {
      if (i !== curDay) return d
      var nd = Object.assign({}, d)
      if (type === "snack") delete nd.snack; else delete nd.bev
      return nd
    })
    setDayData(newData)
    saveDay(curDay, newData[curDay])
  }

  // Clear ALL 7 days
  function clearAll() {
    if (locked) return
    var newData = [{},{},{},{},{},{},{}]
    setDayData(newData)
    if (selectedMember) {
      setSaving(true)
      supabase.from("food_selections").delete().eq("member_roll_number", selectedMember.member_roll_number).then(function () {
        setSaving(false)
        setSaved(true)
        setTimeout(function () { setSaved(false) }, 2000)
      })
    }
    setCurView(null)
  }

  // Random all
  async function randomAll() {
    if (locked) return
    var newData = []
    for (var i = 0; i < 7; i++) {
      newData.push({ snack: SNACK_IDS[Math.floor(Math.random() * SNACK_IDS.length)], bev: BEV_IDS[Math.floor(Math.random() * BEV_IDS.length)] })
    }
    setDayData(newData)

    // Save all 7 days
    if (selectedMember && team) {
      setSaving(true)
      try {
        // Delete all existing for this member
        await supabase.from("food_selections").delete().eq("member_roll_number", selectedMember.member_roll_number)
        // Insert all 7 days
        var rows = []
        for (var j = 0; j < 7; j++) {
          rows.push({ team_id: team.id, team_number: teamNumber, member_roll_number: selectedMember.member_roll_number, member_name: selectedMember.member_name, day_number: j + 1, day_date: "Day " + (j + 1), snack: newData[j].snack, beverage: newData[j].bev, confirmed: false })
        }
        await supabase.from("food_selections").insert(rows)
        setSaved(true)
        setTimeout(function () { setSaved(false) }, 2000)
      } catch (e) {}
      setSaving(false)
    }
    setConfetti(true)
    setTimeout(function () { setConfetti(false) }, 4000)
  }

  // Copy day 1 to all
  async function copyToAll() {
    if (locked) return
    var d = dayData[0]
    if (!d.snack && !d.bev) return

    var newData = []
    for (var i = 0; i < 7; i++) { newData.push({ snack: d.snack, bev: d.bev }) }
    setDayData(newData)

    // Save all 7 days
    if (selectedMember && team) {
      setSaving(true)
      try {
        await supabase.from("food_selections").delete().eq("member_roll_number", selectedMember.member_roll_number)
        var rows = []
        for (var j = 0; j < 7; j++) {
          rows.push({ team_id: team.id, team_number: teamNumber, member_roll_number: selectedMember.member_roll_number, member_name: selectedMember.member_name, day_number: j + 1, day_date: "Day " + (j + 1), snack: d.snack || null, beverage: d.bev || null, confirmed: false })
        }
        await supabase.from("food_selections").insert(rows)
        setSaved(true)
        setTimeout(function () { setSaved(false) }, 2000)
      } catch (e) {}
      setSaving(false)
    }
  }

  // Confirm order — step 1: validate, show modal
  function confirmOrder() {
    if (locked) return
    var missing = []
    dayData.forEach(function (d, i) { if (!d.snack || !d.bev) missing.push("Day " + (i + 1)) })
    if (missing.length > 0) {
      setWarning("You haven't selected food for: " + missing.join(", "))
      setTimeout(function () { setWarning(null) }, 4000)
      return
    }
    setShowConfirmOrder(true)
  }

  // Confirm order — step 2: actually lock
  async function finalConfirm() {
    setShowConfirmOrder(false)
    if (selectedMember) {
      var lockKey = "ps_food_locked_" + selectedMember.member_roll_number
      localStorage.setItem(lockKey, "true")
      // Mark all rows as confirmed in Supabase
      await supabase.from("food_selections").update({ confirmed: true }).eq("member_roll_number", selectedMember.member_roll_number)
    }
    setLocked(true)
    setConfetti(true)
    setTimeout(function () { setConfetti(false) }, 4000)
  }

  // AI fetch
  async function fetchAI(id) {
    if (aiData[id]) return
    setAiLoading(true)
    try {
      var d = FD[id]
      var resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: "You are a food nutrition expert. Give accurate info about this Indian snack/beverage: \"" + d.n + "\". Respond ONLY with JSON (no markdown, no backticks): {description, calories (number), protein, carbs, fat, ingredients (array), allergens (array from: Gluten, Dairy, Nuts, Soy, Eggs, None), funFact}" }] })
      })
      if (!resp.ok) throw new Error("API " + resp.status)
      var data = await resp.json()
      var text = data.content[0].text.replace(/```json|```/g, "").trim()
      var parsed = JSON.parse(text)
      setAiData(function (p) { var n = Object.assign({}, p); n[id] = parsed; return n })
    } catch (e) {
      setAiData(function (p) { var n = Object.assign({}, p); n[id] = FALLBACK[id]; return n })
    }
    setAiLoading(false)
  }

  // View food detail
  function viewFood(id) {
    setCurView(id)
    // Set fallback immediately so detail shows instantly
    if (!aiData[id] && FALLBACK[id]) {
      setAiData(function (p) { var n = Object.assign({}, p); n[id] = FALLBACK[id]; return n })
    }
    // Then fetch AI in background to upgrade the data
    fetchAI(id)
  }

  // Keyboard nav
  useEffect(function () {
    function handleKey(e) {
      // Number keys 1-7 for day selection
      if (e.key >= "1" && e.key <= "7") { setCurDay(parseInt(e.key) - 1); return }
      var items = cat === "snacks" ? SNACK_IDS : BEV_IDS
      var cols = 4
      if (e.key === "ArrowRight") { setFocusIdx(function (p) { return Math.min(p + 1, items.length - 1) }); e.preventDefault() }
      if (e.key === "ArrowLeft") { setFocusIdx(function (p) { return Math.max(p - 1, 0) }); e.preventDefault() }
      if (e.key === "ArrowDown") { setFocusIdx(function (p) { return Math.min(p + cols, items.length - 1) }); e.preventDefault() }
      if (e.key === "ArrowUp") { setFocusIdx(function (p) { return Math.max(p - cols, 0) }); e.preventDefault() }
      if (e.key === "Enter" && focusIdx >= 0 && focusIdx < items.length) {
        var id = items[focusIdx]
        var type = cat === "snacks" ? "snack" : "bev"
        if (dayData[curDay][type] === id) deselectFood(id, type)
        else selectFood(id, type)
        viewFood(id)
      }
    }
    window.addEventListener("keydown", handleKey)
    return function () { window.removeEventListener("keydown", handleKey) }
  })

  // Computed
  var daysComplete = dayData.filter(function (d) { return d.snack && d.bev }).length
  var progressPct = Math.round((daysComplete / 7) * 100)
  var curDayData = dayData[curDay] || {}
  var comboName = null
  if (curDayData.snack && curDayData.bev && FD[curDayData.snack] && FD[curDayData.bev]) {
    comboName = COMBOS[FD[curDayData.snack].n + "+" + FD[curDayData.bev].n] || "The Wildcard"
  }
  var detail = curView ? (aiData[curView] || FALLBACK[curView]) : null
  var memberName = selectedMember ? selectedMember.member_name : "User"

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "#000" }}>
        <DashboardSidebar teamNumber={teamNumber} currentMember={currentMember} loggedInRoll={loggedInRoll} isLeader={isLeader} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,#ff3020,#ff6040)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Genos',sans-serif", fontWeight: 900, fontSize: 18, color: "#fff", margin: "0 auto 12px", animation: "pulse 1s ease-in-out infinite" }}>PS</div>
            <div style={{ fontFamily: "'Genos',sans-serif", fontSize: 13, letterSpacing: 3, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>Loading</div>
          </div>
        </div>
        <style>{`@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}`}</style>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#000", color: "#fff", fontFamily: "'DM Sans',sans-serif" }}>
      <style jsx>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
        @keyframes cardPop{0%{transform:scale(1)}30%{transform:scale(1.06)}100%{transform:scale(1)}}
        @keyframes shimmerAnim{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
        @keyframes cfall{0%{opacity:1;transform:translateY(0) rotate(0) scale(1)}50%{opacity:1}100%{opacity:0;transform:translateY(100vh) rotate(720deg) scale(0.3)}}
        @keyframes toastIn{from{transform:translateX(-50%) translateY(-80px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}
        @keyframes saveFlash{0%{opacity:0;transform:scale(0.9)}50%{opacity:1;transform:scale(1.05)}100%{opacity:1;transform:scale(1)}}

        .scroll-area::-webkit-scrollbar{width:5px}
        .scroll-area::-webkit-scrollbar-track{background:transparent}
        .scroll-area::-webkit-scrollbar-thumb{background:rgba(255,96,64,0.15);border-radius:10px}

        .day-chip{flex-shrink:0;padding:10px 22px;border-radius:10px;background:rgba(255,255,255,0.015);border:1px solid rgba(255,255,255,0.04);cursor:pointer;transition:all 0.3s;text-align:center;min-width:85px;position:relative}
        .day-chip:hover{border-color:rgba(255,255,255,0.08);transform:translateY(-1px)}
        .day-chip.on{background:linear-gradient(135deg,rgba(255,48,32,0.06),rgba(255,96,64,0.025));border-color:rgba(255,96,64,0.2)}

        .food-card{border-radius:12px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);padding:14px 10px;text-align:center;cursor:pointer;transition:all 0.3s cubic-bezier(0.23,1,0.32,1);position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;min-height:100px}
        .food-card::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 50% 40%,rgba(255,96,64,0.06),transparent 70%);opacity:0;transition:opacity 0.3s}
        .food-card:hover{border-color:rgba(255,255,255,0.1);transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,0.2)}
        .food-card:hover::before{opacity:0.4}
        .food-card.selected{border-color:rgba(255,96,64,0.3);background:rgba(255,96,64,0.03)}
        .food-card.selected::before{opacity:1}
        .food-card.focused{box-shadow:0 0 0 2px rgba(255,96,64,0.4);border-color:rgba(255,96,64,0.3)}
        .food-card.viewing{border-color:rgba(255,96,64,0.2);box-shadow:0 0 0 1px rgba(255,96,64,0.08)}
        .food-card.pop{animation:cardPop 0.3s ease}

        .food-empty{border-radius:12px;background:rgba(255,255,255,0.006);border:1px dashed rgba(255,255,255,0.03);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:14px;min-height:100px}

        .cat-tab{font-family:'DM Sans',sans-serif;font-size:11px;font-weight:500;padding:7px 24px;border:none;border-radius:8px;cursor:pointer;transition:all 0.3s;color:rgba(255,255,255,0.25);background:transparent}
        .cat-tab.on{background:linear-gradient(135deg,#ff3020,#ff6040);color:#fff;box-shadow:0 3px 12px rgba(255,48,32,0.15)}
        .cat-tab:not(.on):hover{color:rgba(255,255,255,0.45)}

        .detail-panel{border-radius:16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);overflow:hidden;flex:1;display:flex;flex-direction:column}

        .shimmer{background:rgba(255,255,255,0.03);border-radius:6px;position:relative;overflow:hidden}
        .shimmer::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.02),transparent);animation:shimmerAnim 1.5s infinite}

        .nut-card{padding:10px 8px;border-radius:8px;background:rgba(255,255,255,0.015);border:1px solid rgba(255,255,255,0.03);text-align:center;transition:all 0.25s}
        .nut-card:hover{border-color:rgba(255,255,255,0.08);transform:translateY(-1px)}

        .ing-chip{font-size:9px;font-weight:500;padding:4px 10px;border-radius:5px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.04);color:rgba(255,255,255,0.35);transition:all 0.2s}
        .ing-chip:hover{border-color:rgba(255,96,64,0.15);color:rgba(255,255,255,0.5)}

        .allergy-chip{font-size:9px;font-weight:600;padding:4px 10px;border-radius:5px;display:flex;align-items:center;gap:4px}
        .allergy-chip.warn{background:rgba(251,191,36,0.06);border:1px solid rgba(251,191,36,0.12);color:rgba(251,191,36,0.6)}
        .allergy-chip.safe{background:rgba(52,211,153,0.05);border:1px solid rgba(52,211,153,0.1);color:rgba(52,211,153,0.5)}

        .ck-bar{border-radius:14px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);padding:16px 24px;display:flex;align-items:center;justify-content:space-between;transition:all 0.3s}
        .ck-bar:hover{border-color:rgba(255,255,255,0.08)}

        /* === LOCKED STATE === */
        .locked-overlay{position:relative}
        .locked-overlay::after{content:'';position:absolute;inset:0;background:rgba(0,0,0,0.5);border-radius:12px;pointer-events:all;z-index:10}
        .locked-banner{padding:16px 24px;border-radius:12px;background:rgba(52,211,153,0.06);border:1px solid rgba(52,211,153,0.15);display:flex;align-items:center;gap:12px;margin-bottom:16px;animation:fadeUp 0.4s ease}
        .locked-banner-icon{width:36px;height:36px;border-radius:10px;background:rgba(52,211,153,0.1);display:flex;align-items:center;justify-content:center;flex-shrink:0}

        /* === CONFIRM ORDER MODAL === */
        .confirm-overlay{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.85);backdrop-filter:blur(16px);display:flex;align-items:center;justify-content:center;opacity:0;animation:fadeUp 0.25s ease forwards}
        .confirm-box{width:400px;max-width:90vw;background:#111;border:1px solid rgba(255,96,64,0.15);border-radius:20px;padding:32px;box-shadow:0 24px 80px rgba(0,0,0,0.6);animation:photoZoom 0.3s cubic-bezier(0.23,1,0.32,1) forwards;position:relative;overflow:hidden}
        .confirm-box::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#ff3020,#ff6040,transparent)}
        @keyframes photoZoom{from{transform:scale(0.85);opacity:0}to{transform:scale(1);opacity:1}}

        .confetti-p{position:absolute;top:-20px;opacity:0;animation:cfall 3s ease-out forwards}
      `}</style>

      <DashboardSidebar teamNumber={teamNumber} currentMember={currentMember} loggedInRoll={loggedInRoll} isLeader={isLeader} />

      {/* Warning Toast */}
      {warning && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 200, padding: "14px 28px", borderRadius: 12, background: "rgba(255,48,32,0.12)", border: "1px solid rgba(255,48,32,0.25)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", gap: 12, maxWidth: 500, animation: "toastIn 0.4s ease" }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(255,48,32,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff6040" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div>
            <div style={{ fontFamily: "'Genos',sans-serif", fontSize: 14, fontWeight: 600, color: "#ff6040", marginBottom: 2 }}>Missing Days!</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{warning}</div>
          </div>
        </div>
      )}

      {/* Save Indicator */}
      {(saving || saved) && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 200, padding: "8px 16px", borderRadius: 10, background: saved ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.05)", border: "1px solid " + (saved ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.08)"), fontSize: 12, fontWeight: 600, color: saved ? "#34d399" : "rgba(255,255,255,0.4)", animation: "saveFlash 0.3s ease", display: "flex", alignItems: "center", gap: 6 }}>
          {saved ? "\u2713 Saved" : "Saving..."}
        </div>
      )}

      {/* Confirm Order Modal */}
      {showConfirmOrder && (
        <div className="confirm-overlay" onClick={function () { setShowConfirmOrder(false) }}>
          <div className="confirm-box" onClick={function (e) { e.stopPropagation() }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(255,96,64,0.08)", border: "1px solid rgba(255,96,64,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff6040" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div style={{ fontFamily: "'Genos',sans-serif", fontSize: 20, fontWeight: 700, color: "#fff", textAlign: "center", marginBottom: 8 }}>Confirm Food Selection?</div>
            <div style={{ fontFamily: "'Genos',sans-serif", fontSize: 14, fontWeight: 600, color: "#ff6040", textAlign: "center", marginBottom: 14 }}>All 7 days selected</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center", marginBottom: 20, lineHeight: 1.7, padding: "12px 16px", borderRadius: 10, background: "rgba(255,96,64,0.04)", border: "1px solid rgba(255,96,64,0.08)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff6040" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span>This action cannot be undone. Once confirmed, your food selections will be permanently locked and cannot be changed.</span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={function () { setShowConfirmOrder(false) }} style={{ flex: 1, padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.5)", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.25s" }}>Cancel</button>
              <button onClick={finalConfirm} style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", background: "linear-gradient(135deg,#ff3020,#ff6040)", color: "#fff", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.25s", boxShadow: "0 4px 16px rgba(255,48,32,0.2)" }}>Yes, Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Confetti */}
      {confetti && (
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 100, overflow: "hidden" }}>
          {Array.from({ length: 70 }).map(function (_, i) {
            var cols = ["#ff3020","#ff6040","#ff8040","#34d399","#60a5fa","#c084fc","#fbbf24","#fff"]
            return <div key={i} className="confetti-p" style={{ left: Math.random()*100+"%", backgroundColor: cols[Math.floor(Math.random()*cols.length)], width: Math.random()*7+3, height: Math.random()*7+3, borderRadius: Math.random()>0.5?"50%":"2px", animationDelay: Math.random()*0.5+"s", animationDuration: Math.random()*2+2+"s" }} />
          })}
        </div>
      )}

      {/* MAIN */}
      <div className="scroll-area" style={{ flex: 1, padding: "32px 44px 80px", overflowY: "auto", maxHeight: "100vh" }}>

        {/* Progress Bar */}
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.03)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: progressPct + "%", background: daysComplete === 7 ? "linear-gradient(90deg,#34d399,#22c55e)" : "linear-gradient(90deg,#ff3020,#ff6040)", borderRadius: 4, transition: "width 0.5s ease", boxShadow: daysComplete === 7 ? "0 0 10px rgba(52,211,153,0.2)" : "0 0 10px rgba(255,48,32,0.15)" }} />
          </div>
          <span style={{ fontFamily: "'Genos',sans-serif", fontSize: 13, fontWeight: 600, color: daysComplete === 7 ? "#34d399" : "#ff6040", minWidth: 50 }}>{daysComplete}/7</span>
        </div>

        {/* Locked Banner */}
        {locked && (
          <div className="locked-banner" style={{ justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="locked-banner-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div>
                <div style={{ fontFamily: "'Genos',sans-serif", fontSize: 15, fontWeight: 600, color: "#34d399", marginBottom: 2 }}>Food Selection Confirmed</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Your selections are locked and cannot be changed.</div>
              </div>
            </div>
            <button onClick={function () { router.push("/food-cards/" + teamNumber) }} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, padding: "10px 22px", border: "none", borderRadius: 10, background: "linear-gradient(135deg,#ff3020,#ff6040)", color: "#fff", cursor: "pointer", transition: "all 0.3s", boxShadow: "0 4px 16px rgba(255,48,32,0.2)", display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
              View Food Cards
            </button>
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 3, display: "flex", alignItems: "center", gap: 8 }}>
            Selecting for: <span style={{ color: "#ff6040", fontWeight: 600 }}>{memberName}</span>
          </div>
          <div style={{ fontFamily: "'Genos',sans-serif", fontSize: 28, fontWeight: 700, marginBottom: 3 }}>Food Selection</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>Pick your snack and beverage for each day</div>
        </div>

        {/* Quick Actions — hidden when locked */}
        {!locked && (
        <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
          <button onClick={randomAll} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 600, padding: "7px 14px", borderRadius: 8, cursor: "pointer", transition: "all 0.25s", display: "flex", alignItems: "center", gap: 6, border: "1px solid rgba(255,96,64,0.1)", background: "rgba(255,96,64,0.03)", color: "rgba(255,96,64,0.5)" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6"/><path d="M21.34 15.57a10 10 0 1 1-.57-8.38"/></svg>
            Random All 7 Days
          </button>
          <button onClick={copyToAll} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 600, padding: "7px 14px", borderRadius: 8, cursor: "pointer", transition: "all 0.25s", display: "flex", alignItems: "center", gap: 6, border: "1px solid rgba(192,132,252,0.1)", background: "rgba(192,132,252,0.03)", color: "rgba(192,132,252,0.5)" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy Day 1 to All
          </button>
          <button onClick={clearAll} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 600, padding: "7px 14px", borderRadius: 8, cursor: "pointer", transition: "all 0.25s", display: "flex", alignItems: "center", gap: 6, border: "1px solid rgba(255,48,48,0.1)", background: "rgba(255,48,48,0.03)", color: "rgba(255,48,48,0.4)" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            Clear All Selections
          </button>
        </div>
        )}

        {/* Day Chips */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "'Genos',sans-serif", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, color: "rgba(255,255,255,0.15)", marginBottom: 10 }}>Select Day</div>
          <div style={{ display: "flex", gap: 7, overflowX: "auto", scrollBehavior: "smooth", scrollbarWidth: "none" }}>
            {[1,2,3,4,5,6,7].map(function (d, i) {
              var done = dayData[i] && dayData[i].snack && dayData[i].bev
              return (
                <div key={i} className={"day-chip " + (curDay === i ? "on" : "")} onClick={function () { if (!locked) setCurDay(i) }} style={{ cursor: locked ? "default" : "pointer", opacity: locked && curDay !== i ? 0.4 : 1 }}>
                  <div style={{ fontFamily: "'Genos',sans-serif", fontSize: 18, fontWeight: 700, color: curDay === i ? "#ff6040" : "rgba(255,255,255,0.15)" }}>{d}</div>
                  <div style={{ fontSize: 7, textTransform: "uppercase", letterSpacing: 1.5, color: curDay === i ? "rgba(255,96,64,0.35)" : "rgba(255,255,255,0.08)" }}>Day</div>
                  <div style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: "50%", background: done ? "#34d399" : "#ff3020", boxShadow: "0 0 6px " + (done ? "rgba(52,211,153,0.3)" : "rgba(255,48,32,0.3)") }} />
                </div>
              )
            })}
          </div>
        </div>

        {/* Category Tabs */}
        <div style={{ display: "flex", marginBottom: 18, background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 10, padding: 3, width: "fit-content" }}>
          <button className={"cat-tab " + (cat === "snacks" ? "on" : "")} onClick={function () { setCat("snacks"); setFocusIdx(-1) }}>Snacks</button>
          <button className={"cat-tab " + (cat === "beverages" ? "on" : "")} onClick={function () { setCat("beverages"); setFocusIdx(-1) }}>Beverages</button>
        </div>

        {/* Content Split */}
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>

          {/* Food Grid */}
          <div style={{ flex: 7, minWidth: 0 }}>
            <div ref={gridRef} style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gridAutoRows: "1fr", gap: 8 }}>
              {(cat === "snacks" ? SNACK_IDS : BEV_IDS).map(function (id, i) {
                var d = FD[id]
                var type = cat === "snacks" ? "snack" : "bev"
                var isSelected = curDayData[type] === id
                var isViewing = curView === id
                var isFocused = focusIdx === i
                var isPop = POPULAR.indexOf(id) >= 0
                return (
                  <div key={id}
                    className={"food-card " + (isSelected ? "selected " : "") + (isViewing && !locked ? "viewing " : "") + (isFocused && !locked ? "focused " : "")}
                    style={{ opacity: locked && !isSelected ? 0.15 : 1, pointerEvents: locked ? "none" : "auto", cursor: locked ? "default" : "pointer" }}
                    onClick={function () {
                      if (locked) return
                      viewFood(id)
                      if (!isSelected) selectFood(id, type)
                    }}
                  >
                    {isPop && !locked && <div style={{ position: "absolute", top: 6, left: 6, fontSize: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7, padding: "2px 5px", background: "linear-gradient(135deg,#ff3020,#ff6040)", color: "#fff", borderRadius: 4, zIndex: 2 }}>Popular</div>}
                    {isSelected && !locked && (
                      <button onClick={function (e) { e.stopPropagation(); deselectFood(id, type) }} style={{ position: "absolute", top: 4, right: 4, width: 18, height: 18, borderRadius: "50%", background: "rgba(255,48,32,0.15)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 5, transition: "all 0.2s" }}>
                        <svg width="8" height="8" viewBox="0 0 18 18" fill="none" stroke="#ff6040" strokeWidth="2.5" strokeLinecap="round"><line x1="4" y1="4" x2="14" y2="14"/><line x1="14" y1="4" x2="4" y2="14"/></svg>
                      </button>
                    )}
                    {isSelected && (
                      <div style={{ position: "absolute", bottom: 4, right: 4, width: 14, height: 14, borderRadius: "50%", background: "linear-gradient(135deg,#ff3020,#ff6040)", color: "#fff", fontSize: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{"\u2713"}</div>
                    )}
                    <div style={{ fontSize: 28, lineHeight: 1.2, transition: "transform 0.25s" }}>{d.e}</div>
                    <div style={{ fontFamily: "'Genos',sans-serif", fontSize: 12, fontWeight: 600, color: isSelected ? "#fff" : "rgba(255,255,255,0.5)" }}>{d.n}</div>
                  </div>
                )
              })}
              {/* Empty slots — hidden when locked */}
              {!locked && Array.from({ length: 8 }).map(function (_, i) {
                return (
                  <div key={"empty-" + i} className="food-empty">
                    <div style={{ fontSize: 16, opacity: 0.1 }}>{cat === "snacks" ? "\ud83c\udf7d\ufe0f" : "\ud83e\udd64"}</div>
                    <div style={{ fontSize: 7, color: "rgba(255,255,255,0.06)" }}>Coming Soon</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Detail Panel — hidden when locked */}
          {!locked && (
          <div style={{ flex: 3, minWidth: 260 }}>
            <div className="detail-panel">
              {!curView && !aiLoading && (
                <div style={{ padding: "32px 20px", textAlign: "center", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontSize: 36, marginBottom: 10, opacity: 0.2 }}>{"\ud83c\udf7d\ufe0f"}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.1)", lineHeight: 1.5 }}>Click any item to see details</div>
                </div>
              )}
              {curView && aiLoading && !detail && (
                <div style={{ padding: "28px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, flex: 1 }}>
                  <div className="shimmer" style={{ width: 56, height: 56, borderRadius: "50%" }} />
                  <div className="shimmer" style={{ width: 120, height: 18, borderRadius: 6 }} />
                  <div className="shimmer" style={{ width: 60, height: 10, borderRadius: 6 }} />
                  <div className="shimmer" style={{ width: "100%", height: 50, borderRadius: 6 }} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, width: "100%" }}>
                    <div className="shimmer" style={{ height: 48, borderRadius: 7 }} />
                    <div className="shimmer" style={{ height: 48, borderRadius: 7 }} />
                    <div className="shimmer" style={{ height: 48, borderRadius: 7 }} />
                    <div className="shimmer" style={{ height: 48, borderRadius: 7 }} />
                  </div>
                </div>
              )}
              {curView && detail && (
                <div style={{ display: "flex", flexDirection: "column", flex: 1, animation: "fadeUp 0.25s ease" }}>
                  {/* Hero */}
                  <div style={{ padding: "28px 24px 18px", textAlign: "center", position: "relative" }}>
                    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 40%,rgba(255,96,64,0.04),transparent 70%)" }} />
                    <div style={{ fontSize: 56, display: "block", marginBottom: 12, position: "relative", zIndex: 1 }}>{FD[curView].e}</div>
                    <div style={{ fontFamily: "'Genos',sans-serif", fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 3, position: "relative", zIndex: 1 }}>{FD[curView].n}</div>
                    <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 2, color: "rgba(255,96,64,0.5)", position: "relative", zIndex: 1 }}>{FD[curView].c}</div>
                  </div>
                  {/* Body */}
                  <div style={{ padding: "0 24px 24px", flex: 1, display: "flex", flexDirection: "column" }}>
                    <div style={{ fontSize: 11.5, lineHeight: 1.7, color: "rgba(255,255,255,0.38)", marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.025)" }}>{detail.description}</div>
                    {detail.funFact && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", padding: "10px 14px", borderRadius: 8, background: "rgba(192,132,252,0.03)", border: "1px solid rgba(192,132,252,0.06)", marginBottom: 16, lineHeight: 1.5, fontStyle: "italic" }}>{"\ud83d\udca1 " + detail.funFact}</div>}
                    <div style={{ fontFamily: "'Genos',sans-serif", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, color: "rgba(255,255,255,0.12)", marginBottom: 7 }}>Nutrition Info</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, marginBottom: 16 }}>
                      {[{ v: detail.calories, l: "Calories", c: "#ff6040" }, { v: detail.protein, l: "Protein", c: "#34d399" }, { v: detail.carbs, l: "Carbs", c: "#60a5fa" }, { v: detail.fat, l: "Fat", c: "#fbbf24" }].map(function (n) {
                        return <div key={n.l} className="nut-card"><div style={{ fontFamily: "'Genos',sans-serif", fontSize: 20, fontWeight: 700, color: n.c, marginBottom: 1 }}>{n.v}</div><div style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: 1.5, color: "rgba(255,255,255,0.15)" }}>{n.l}</div></div>
                      })}
                    </div>
                    <div style={{ fontFamily: "'Genos',sans-serif", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, color: "rgba(255,255,255,0.12)", marginBottom: 7 }}>Ingredients</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 16 }}>
                      {(detail.ingredients || []).map(function (ing, i) { return <span key={i} className="ing-chip">{ing}</span> })}
                    </div>
                    <div style={{ fontFamily: "'Genos',sans-serif", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, color: "rgba(255,255,255,0.12)", marginBottom: 7 }}>Allergy Info</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 18 }}>
                      {(detail.allergens || []).map(function (a, i) {
                        return <span key={i} className={"allergy-chip " + (a.toLowerCase() === "none" ? "safe" : "warn")}>{a.toLowerCase() === "none" ? "\u2713 No Allergens" : "\u26a0\ufe0f " + a}</span>
                      })}
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                      {curView && FD[curView] && (function () {
                        var type = FD[curView].c === "Snack" ? "snack" : "bev"
                        var isAdded = dayData[curDay] && dayData[curDay][type] === curView
                        return (
                          <button onClick={function () {
                            var t = FD[curView].c === "Snack" ? "snack" : "bev"
                            var added = dayData[curDay] && dayData[curDay][t] === curView
                            if (added) deselectFood(curView, t)
                            else selectFood(curView, t)
                          }} style={{
                            flex: 1, fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, padding: 12,
                            border: isAdded ? "1px solid rgba(52,211,153,0.18)" : "none",
                            borderRadius: 10,
                            background: isAdded ? "rgba(52,211,153,0.1)" : "linear-gradient(135deg,#ff3020,#ff6040)",
                            color: isAdded ? "#34d399" : "#fff",
                            cursor: "pointer", transition: "all 0.3s",
                            boxShadow: isAdded ? "none" : "0 4px 14px rgba(255,48,32,0.18)",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                          }}>
                            {isAdded ? "\u2713 Added" : "Add to Cart"}
                          </button>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          )}
        </div>

        {/* Checkout Bar — always shows current day selection */}
        <div className="ck-bar" style={{ marginTop: 24 }}>
          <div>
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: "rgba(255,255,255,0.12)", marginBottom: 3 }}>Day {curDay + 1} — {locked ? "Your Selection" : "Your Order"}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {curDayData.snack && FD[curDayData.snack] ? (
                <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 7, background: "rgba(255,96,64,0.03)", border: "1px solid rgba(255,96,64,0.08)" }}>
                  <span style={{ fontSize: 16 }}>{FD[curDayData.snack].e}</span>
                  <span style={{ fontFamily: "'Genos',sans-serif", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>{FD[curDayData.snack].n}</span>
                </div>
              ) : <div style={{ padding: "5px 12px", borderRadius: 7, border: "1px dashed rgba(255,255,255,0.04)", fontSize: 9, color: "rgba(255,255,255,0.08)" }}>No snack</div>}
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.07)" }}>+</span>
              {curDayData.bev && FD[curDayData.bev] ? (
                <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 7, background: "rgba(255,96,64,0.03)", border: "1px solid rgba(255,96,64,0.08)" }}>
                  <span style={{ fontSize: 16 }}>{FD[curDayData.bev].e}</span>
                  <span style={{ fontFamily: "'Genos',sans-serif", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>{FD[curDayData.bev].n}</span>
                </div>
              ) : <div style={{ padding: "5px 12px", borderRadius: 7, border: "1px dashed rgba(255,255,255,0.04)", fontSize: 9, color: "rgba(255,255,255,0.08)" }}>No beverage</div>}
              {comboName && <span style={{ fontSize: 9, fontWeight: 600, padding: "3px 10px", borderRadius: 5, background: "rgba(192,132,252,0.05)", border: "1px solid rgba(192,132,252,0.1)", color: "rgba(192,132,252,0.5)", marginLeft: 8 }}>{"\u2728 " + comboName}</span>}
            </div>
          </div>
          {locked ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 24px", borderRadius: 10, background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.15)", color: "#34d399", fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Confirmed
            </div>
          ) : (
            <button onClick={confirmOrder} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, padding: "10px 24px", border: "none", borderRadius: 10, background: "linear-gradient(135deg,#ff3020,#ff6040)", color: "#fff", cursor: "pointer", transition: "all 0.3s", boxShadow: "0 3px 14px rgba(255,48,32,0.18)", display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Confirm
            </button>
          )}
        </div>

        {/* 7-Day Summary — shown after confirmation */}
        {locked && (
          <div style={{ marginTop: 20, borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", padding: 24, animation: "fadeUp 0.4s ease" }}>
            <div style={{ fontFamily: "'Genos',sans-serif", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 3, color: "rgba(255,255,255,0.15)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Your Complete Selection
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8 }}>
              {dayData.map(function (d, i) {
                var snackItem = d.snack && FD[d.snack] ? FD[d.snack] : null
                var bevItem = d.bev && FD[d.bev] ? FD[d.bev] : null
                return (
                  <div key={i} onClick={function () { setCurDay(i) }} style={{ padding: "14px 8px", borderRadius: 12, background: curDay === i ? "rgba(255,96,64,0.04)" : "rgba(255,255,255,0.01)", border: "1px solid " + (curDay === i ? "rgba(255,96,64,0.15)" : "rgba(255,255,255,0.03)"), textAlign: "center", cursor: "pointer", transition: "all 0.25s" }}>
                    <div style={{ fontFamily: "'Genos',sans-serif", fontSize: 11, fontWeight: 600, color: curDay === i ? "#ff6040" : "rgba(255,255,255,0.2)", letterSpacing: 1, marginBottom: 10 }}>DAY {i + 1}</div>
                    {snackItem ? (
                      <div style={{ marginBottom: 6 }}>
                        <div style={{ fontSize: 22, marginBottom: 2 }}>{snackItem.e}</div>
                        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>{snackItem.n}</div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.1)", marginBottom: 6, padding: "10px 0" }}>—</div>
                    )}
                    <div style={{ width: "60%", height: 1, background: "rgba(255,255,255,0.04)", margin: "0 auto 6px" }} />
                    {bevItem ? (
                      <div>
                        <div style={{ fontSize: 22, marginBottom: 2 }}>{bevItem.e}</div>
                        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>{bevItem.n}</div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.1)", padding: "10px 0" }}>—</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}