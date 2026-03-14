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
  sandwich:{description:"A wholesome veggie sandwich made with fresh lettuce, sliced tomatoes, cucumber, cheese, and tangy mint chutney layered between lightly toasted whole wheat bread.",calories:245,protein:"8g",carbs:"32g",fat:"10g",ingredients:["Whole Wheat Bread","Lettuce","Tomato","Cucumber","Cheese","Mint Chutney","Butter"],allergens:["Gluten","Dairy"],funFact:"The sandwich was named after John Montagu, the 4th Earl of Sandwich!"},
  samosa:{description:"A golden, crispy deep-fried pastry stuffed with a spiced filling of potatoes, green peas, cumin, and coriander. One of India's most beloved street foods.",calories:308,protein:"5g",carbs:"28g",fat:"18g",ingredients:["Refined Flour","Potato","Green Peas","Cumin Seeds","Coriander","Green Chili","Oil"],allergens:["Gluten"],funFact:"Samosas originated in the Middle East and were brought to India in the 13th century!"},
  puff:{description:"Flaky, buttery puff pastry layers encasing a savory filling of spiced mixed vegetables and paneer.",calories:220,protein:"4g",carbs:"24g",fat:"12g",ingredients:["Puff Pastry","Mixed Vegetables","Paneer","Pepper","Salt","Butter"],allergens:["Gluten","Dairy"],funFact:"Puff pastry requires over 700 layers of dough and butter!"},
  cake:{description:"A soft, moist vanilla sponge cake topped with silky whipped cream frosting and a generous drizzle of rich chocolate.",calories:320,protein:"4g",carbs:"45g",fat:"14g",ingredients:["Flour","Sugar","Eggs","Vanilla","Butter","Cream","Cocoa"],allergens:["Gluten","Dairy","Eggs"],funFact:"The word cake comes from the Old Norse word kaka!"},
  biscuits:{description:"An assorted pack of cream-filled biscuits with a satisfying crunch on the outside and a sweet, smooth cream center.",calories:180,protein:"3g",carbs:"26g",fat:"7g",ingredients:["Wheat Flour","Sugar","Oil","Cream","Salt","Soda"],allergens:["Gluten"],funFact:"India is the third largest biscuit manufacturer in the world!"},
  chips:{description:"Thinly sliced potato chips seasoned with a bold masala spice blend featuring turmeric, chili powder, and a tangy kick.",calories:160,protein:"2g",carbs:"15g",fat:"10g",ingredients:["Potato","Sunflower Oil","Masala Mix","Salt","Turmeric","Chili"],allergens:["None"],funFact:"Potato chips were invented by accident in 1853!"},
  vadapav:{description:"Mumbai's iconic street food — a spiced potato fritter tucked inside a soft pav bun with fiery garlic chutney.",calories:290,protein:"6g",carbs:"35g",fat:"13g",ingredients:["Pav","Potato Vada","Garlic Chutney","Chili","Coconut Chutney"],allergens:["Gluten"],funFact:"Vada Pav was invented in 1966 outside Dadar station in Mumbai!"},
  breadpakora:{description:"Soft bread slices stuffed with spiced potato, dipped in chickpea flour batter, and deep fried to golden perfection.",calories:275,protein:"6g",carbs:"30g",fat:"14g",ingredients:["Bread","Potato","Besan","Chili","Ginger","Coriander","Oil"],allergens:["Gluten"],funFact:"Bread Pakora is most popular during the rainy season in North India!"},
  tea:{description:"Piping hot Indian masala chai brewed with fresh ginger, crushed cardamom, simmered with milk and sweetened to perfection.",calories:80,protein:"3g",carbs:"12g",fat:"2g",ingredients:["Tea Leaves","Milk","Sugar","Ginger","Cardamom"],allergens:["Dairy"],funFact:"Masala chai dates back over 5,000 years!"},
  coffee:{description:"Rich, aromatic South Indian filter coffee brewed from premium dark-roasted beans, blended with hot milk.",calories:95,protein:"3g",carbs:"10g",fat:"3g",ingredients:["Coffee Beans","Milk","Sugar","Water"],allergens:["Dairy"],funFact:"Coffee was discovered by an Ethiopian goat herder!"},
  juice:{description:"Freshly squeezed mixed fruit juice blending seasonal oranges, apples, and pineapple with no added sugar.",calories:120,protein:"1g",carbs:"28g",fat:"0g",ingredients:["Orange","Apple","Pineapple","Seasonal Fruits","Ice"],allergens:["None"],funFact:"Fresh juice retains 90% nutrition if consumed within 15 minutes!"},
  milk:{description:"Chilled flavored milk available in rich chocolate and sweet strawberry variants. Creamy and calcium-packed.",calories:150,protein:"8g",carbs:"18g",fat:"5g",ingredients:["Full Cream Milk","Cocoa/Strawberry","Sugar"],allergens:["Dairy"],funFact:"Humans have been drinking milk for over 10,000 years!"},
  buttermilk:{description:"Traditional Indian spiced chaas made from fresh churned curd, seasoned with roasted cumin and rock salt.",calories:45,protein:"2g",carbs:"5g",fat:"1g",ingredients:["Curd","Water","Cumin","Rock Salt","Coriander","Curry Leaves"],allergens:["Dairy"],funFact:"Buttermilk is a natural probiotic that aids digestion!"},
  water:{description:"Pure, triple-filtered packaged drinking water. The most essential beverage to stay hydrated.",calories:0,protein:"0g",carbs:"0g",fat:"0g",ingredients:["Purified Water"],allergens:["None"],funFact:"The human brain is 75% water!"},
  lemonade:{description:"Freshly squeezed lime juice with mint leaves, a pinch of black salt, and just the right amount of sweetness.",calories:65,protein:"0g",carbs:"16g",fat:"0g",ingredients:["Lime","Mint","Sugar","Black Salt","Water","Ice"],allergens:["None"],funFact:"Lemonade has been around since ancient Egypt!"},
  coldcoffee:{description:"Iced blended coffee made with espresso, vanilla ice cream, cold milk, and topped with chocolate drizzle.",calories:210,protein:"5g",carbs:"28g",fat:"8g",ingredients:["Coffee","Ice Cream","Milk","Chocolate","Ice","Sugar"],allergens:["Dairy"],funFact:"Cold coffee has been enjoyed in India since the 1960s!"}
}

var COMBOS = {"Sandwich+Coffee":"The Classic","Samosa+Tea":"The OG Desi","Puff+Coffee":"The Cozy","Biscuits+Tea":"The Desi","Chips+Lemonade":"The Chill","Vada Pav+Buttermilk":"The Mumbai","Cake+Cold Coffee":"The Treat","Samosa+Juice":"The Street","Bread Pakora+Tea":"The Rainy Day","Sandwich+Juice":"The Healthy","Chips+Cold Coffee":"The Binge","Cake+Milk":"The Sweet Tooth","Samosa+Coffee":"The Hustler"}
var SNACK_IDS = ["sandwich","samosa","puff","cake","biscuits","chips","vadapav","breadpakora"]
var BEV_IDS = ["tea","coffee","juice","milk","buttermilk","water","lemonade","coldcoffee"]
var EVENT_DATES = ["May 6","May 7","May 8","May 9","May 10","May 11","May 12"]
var EVENT_DAYS = ["Wed","Thu","Fri","Sat","Sun","Mon","Tue"]

// Generate 5-digit numeric meal code
function generateMealCode() {
  var code = ""
  for (var i = 0; i < 5; i++) {
    code += Math.floor(Math.random() * 10).toString()
  }
  return code
}

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
  var [saving, setSaving] = useState(false)
  var [saved, setSaved] = useState(false)
  var [locked, setLocked] = useState(false)
  var [showCart, setShowCart] = useState(false)
  var [showOtpModal, setShowOtpModal] = useState(false)
  var [secretPin, setSecretPin] = useState("")
  var [confirmPin, setConfirmPin] = useState("")
  var [pinError, setPinError] = useState("")
  var [coupons, setCoupons] = useState([])
  var [showCoupons, setShowCoupons] = useState(false)
  var [deliveredDays, setDeliveredDays] = useState([])

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

      if (me) {
        var foodRes = await supabase.from("food_selections").select("*").eq("member_roll_number", me.member_roll_number)
        if (foodRes.data && foodRes.data.length > 0) {
          var loaded = [{},{},{},{},{},{},{}]
          var nameToKey = {}
          Object.keys(FD).forEach(function (k) { nameToKey[FD[k].n.toLowerCase()] = k; nameToKey[k] = k })
          var loadedCoupons = []
          var delivered = []
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
              if (f.coupon_code) {
                loadedCoupons.push({ day: idx + 1, code: f.coupon_code, snack: f.snack, beverage: f.beverage })
              }
              if (f.delivered) {
                delivered.push(idx + 1)
              }
            }
          })
          setDayData(loaded)
          if (loadedCoupons.length > 0) setCoupons(loadedCoupons)
          if (delivered.length > 0) setDeliveredDays(delivered)

          var lockKey = "ps_food_locked_" + me.member_roll_number
          var isLocked = localStorage.getItem(lockKey) === "true"
          if (!isLocked && foodRes.data) {
            var anyConfirmed = foodRes.data.some(function (f) { return f.confirmed === true })
            if (anyConfirmed) { isLocked = true; localStorage.setItem(lockKey, "true") }
          }
          if (isLocked) { setLocked(true); setShowCoupons(true) }
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
      await supabase.from("food_selections").delete().eq("member_roll_number", selectedMember.member_roll_number).eq("day_number", dayIdx + 1)
      if (data.snack || data.bev) {
        await supabase.from("food_selections").insert({
          team_id: team.id,
          team_number: teamNumber,
          member_roll_number: selectedMember.member_roll_number,
          member_name: selectedMember.member_name,
          day_number: dayIdx + 1,
          day_date: "Day " + (dayIdx + 1),
          snack: data.snack ? FD[data.snack].n : null,
          beverage: data.bev ? FD[data.bev].n : null,
          confirmed: false
        })
      }
      setSaved(true)
      setTimeout(function () { setSaved(false) }, 2000)
    } catch (e) { console.error("Save error:", e) }
    setSaving(false)
  }

  function addToDay(id) {
    if (locked) return
    var type = FD[id].c === "Snack" ? "snack" : "bev"
    var newData = dayData.map(function (d, i) {
      if (i !== curDay) return d
      var nd = Object.assign({}, d)
      if (type === "snack") nd.snack = id; else nd.bev = id
      return nd
    })
    setDayData(newData)
    saveDay(curDay, newData[curDay])
  }

  function removeFromDay(dayIdx, type) {
    if (locked) return
    var newData = dayData.map(function (d, i) {
      if (i !== dayIdx) return d
      var nd = Object.assign({}, d)
      delete nd[type]
      return nd
    })
    setDayData(newData)
    saveDay(dayIdx, newData[dayIdx])
  }

  function viewFood(id) {
    setCurView(id)
  }

  // Cart calculations
  var totalItems = 0
  var daysComplete = 0
  dayData.forEach(function (d) {
    if (d.snack) totalItems++
    if (d.bev) totalItems++
    if (d.snack && d.bev) daysComplete++
  })
  var cartReady = daysComplete === 7

  // Handle OTP creation - must be exactly 5 digits
  function handleCreateOtp() {
    setPinError("")
    if (secretPin.length !== 5) {
      setPinError("PIN must be exactly 5 digits")
      return
    }
    if (!/^\d{5}$/.test(secretPin)) {
      setPinError("PIN must contain only numbers")
      return
    }
    if (secretPin !== confirmPin) {
      setPinError("PINs do not match")
      return
    }
    generateCoupons()
  }

  async function generateCoupons() {
    if (!selectedMember || !team) return
    var newCoupons = []
    var updates = []
    
    for (var i = 0; i < 7; i++) {
      var code = generateMealCode() // 5-digit numeric code
      newCoupons.push({
        day: i + 1,
        code: code,
        snack: dayData[i].snack ? FD[dayData[i].snack].n : null,
        beverage: dayData[i].bev ? FD[dayData[i].bev].n : null
      })
      updates.push(
        supabase.from("food_selections")
          .update({ 
            confirmed: true, 
            coupon_code: code,
            secret_pin: secretPin 
          })
          .eq("member_roll_number", selectedMember.member_roll_number)
          .eq("day_number", i + 1)
      )
    }
    
    await Promise.all(updates)
    
    var lockKey = "ps_food_locked_" + selectedMember.member_roll_number
    localStorage.setItem(lockKey, "true")
    
    setCoupons(newCoupons)
    setLocked(true)
    setShowOtpModal(false)
    setShowCart(false)
    setShowCoupons(true)
  }

  var detail = curView ? FALLBACK[curView] : null
  var memberName = selectedMember ? selectedMember.member_name : "User"
  var memberRoll = selectedMember ? selectedMember.member_roll_number : ""
  var curDayData = dayData[curDay] || {}
  var isCurrentlyAdded = curView && (curDayData.snack === curView || curDayData.bev === curView)

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "#000" }}>
        <DashboardSidebar teamNumber={teamNumber} currentMember={currentMember} loggedInRoll={loggedInRoll} isLeader={isLeader} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,#ff3020,#ff6040)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif", fontWeight: 900, fontSize: 18, color: "#fff", margin: "0 auto 12px", animation: "pulse 1s ease-in-out infinite" }}>PS</div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, letterSpacing: 3, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>Loading</div>
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
        @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        @keyframes modalIn{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}
        .scroll-area::-webkit-scrollbar{width:5px}
        .scroll-area::-webkit-scrollbar-track{background:transparent}
        .scroll-area::-webkit-scrollbar-thumb{background:rgba(255,96,64,0.15);border-radius:10px}

        .day-chip{padding:12px 20px;border-radius:10px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);cursor:pointer;transition:all 0.3s;text-align:center;min-width:70px;position:relative}
        .day-chip:hover{border-color:rgba(255,255,255,0.12);transform:translateY(-2px)}
        .day-chip.on{background:linear-gradient(135deg,rgba(255,48,32,0.1),rgba(255,96,64,0.05));border-color:rgba(255,96,64,0.3)}
        .day-chip.complete::after{content:'✓';position:absolute;top:4px;right:4px;font-size:10px;color:#34d399}

        .cat-tab{font-family:'DM Sans',sans-serif;font-size:11px;font-weight:500;padding:8px 24px;border:none;border-radius:8px;cursor:pointer;transition:all 0.3s;color:rgba(255,255,255,0.4);background:transparent}
        .cat-tab.on{background:linear-gradient(135deg,#ff3020,#ff6040);color:#fff}
        .cat-tab:not(.on):hover{color:rgba(255,255,255,0.6)}

        .food-card{border-radius:12px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);padding:16px 12px;text-align:center;cursor:pointer;transition:all 0.3s;position:relative;display:flex;flex-direction:column;align-items:center;gap:6px}
        .food-card:hover{border-color:rgba(255,255,255,0.12);transform:translateY(-2px);background:rgba(255,255,255,0.03)}
        .food-card.selected{border-color:rgba(255,96,64,0.3);background:rgba(255,96,64,0.05)}
        .food-card.viewing{border-color:rgba(255,96,64,0.4);box-shadow:0 0 0 1px rgba(255,96,64,0.2)}

        .cart-btn{position:relative;padding:10px 20px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.02);cursor:pointer;transition:all 0.3s;display:flex;align-items:center;gap:10px}
        .cart-btn.ready{border-color:rgba(255,96,64,0.3);background:rgba(255,96,64,0.05)}
        .cart-btn.ready:hover{background:rgba(255,96,64,0.1);transform:scale(1.02)}
        .cart-btn:not(.ready){opacity:0.5;cursor:not-allowed}
        .cart-badge{position:absolute;top:-6px;right:-6px;background:linear-gradient(135deg,#ff3020,#ff6040);color:#fff;font-size:10px;font-weight:700;padding:2px 6px;border-radius:10px;min-width:20px;text-align:center}

        .detail-panel{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:24px;animation:slideIn 0.3s ease}
        .nut-box{padding:12px;border-radius:10px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);text-align:center}
        .ing-chip{font-size:10px;padding:5px 12px;border-radius:6px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);color:rgba(255,255,255,0.5)}
        .allergy-chip{font-size:10px;padding:5px 12px;border-radius:6px;display:flex;align-items:center;gap:4px}
        .allergy-chip.warn{background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.15);color:rgba(251,191,36,0.8)}
        .allergy-chip.safe{background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.15);color:rgba(52,211,153,0.8)}

        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(12px);z-index:1000;display:flex;align-items:center;justify-content:center}
        .modal-box{background:#0a0a0a;border:1px solid rgba(255,255,255,0.1);border-radius:20px;max-width:500px;width:90%;max-height:90vh;overflow-y:auto;animation:modalIn 0.3s ease}

        .coupon-card{background:#0a0a0a;border:1px solid rgba(255,96,64,0.15);border-radius:14px;overflow:hidden;position:relative}
        .coupon-card.delivered{opacity:0.5;pointer-events:none}
        .coupon-card.delivered::after{content:'DELIVERED';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-15deg);font-size:24px;font-weight:900;color:rgba(52,211,153,0.3);letter-spacing:4px}
      `}</style>

      <DashboardSidebar teamNumber={teamNumber} currentMember={currentMember} loggedInRoll={loggedInRoll} isLeader={isLeader} />

      {/* Save Indicator */}
      {(saving || saved) && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 200, padding: "8px 16px", borderRadius: 10, background: saved ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.05)", border: "1px solid " + (saved ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.1)"), fontSize: 12, fontWeight: 600, color: saved ? "#34d399" : "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 6 }}>
          {saved ? "✓ Saved" : "Saving..."}
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div className="modal-overlay" onClick={function(){ setShowCart(false) }}>
          <div className="modal-box" onClick={function(e){ e.stopPropagation() }} style={{ padding: 0 }}>
            <div style={{ padding: "24px 28px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 22, fontWeight: 700 }}>Your Cart</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{daysComplete}/7 days complete</div>
                </div>
                <button onClick={function(){ setShowCart(false) }} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
              </div>
            </div>
            <div style={{ padding: "20px 28px", maxHeight: "50vh", overflowY: "auto" }}>
              {dayData.map(function(d, i) {
                var snackItem = d.snack && FD[d.snack] ? FD[d.snack] : null
                var bevItem = d.bev && FD[d.bev] ? FD[d.bev] : null
                return (
                  <div key={i} style={{ padding: "16px 0", borderBottom: i < 6 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: snackItem && bevItem ? "#34d399" : "#ff6040" }}>{snackItem && bevItem ? "✓" : "○"}</span>
                      Day {i + 1} • {EVENT_DAYS[i]}, {EVENT_DATES[i]}
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <div style={{ flex: 1, padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 20 }}>{snackItem ? snackItem.e : "—"}</span>
                        <span style={{ fontSize: 13, color: snackItem ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.2)" }}>{snackItem ? snackItem.n : "No snack"}</span>
                      </div>
                      <div style={{ flex: 1, padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 20 }}>{bevItem ? bevItem.e : "—"}</span>
                        <span style={{ fontSize: 13, color: bevItem ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.2)" }}>{bevItem ? bevItem.n : "No beverage"}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ padding: "20px 28px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)" }}>
              <button onClick={function(){ setShowCart(false); setShowOtpModal(true) }} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#ff3020,#ff6040)", color: "#fff", fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Create Secret PIN &amp; Confirm
              </button>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: 10 }}>This action cannot be undone</div>
            </div>
          </div>
        </div>
      )}

      {/* OTP Creation Modal */}
      {showOtpModal && (
        <div className="modal-overlay" onClick={function(){ setShowOtpModal(false) }}>
          <div className="modal-box" onClick={function(e){ e.stopPropagation() }} style={{ padding: "32px" }}>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: "rgba(255,96,64,0.1)", border: "1px solid rgba(255,96,64,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff6040" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Create Your Secret PIN</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>Enter a 5-digit PIN to secure your food coupons. Keep it safe!</div>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Enter 5-Digit PIN</label>
              <input type="password" value={secretPin} onChange={function(e){ setSecretPin(e.target.value.replace(/\D/g, "").slice(0,5)) }} placeholder="•••••" maxLength={5} style={{ width: "100%", padding: "14px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)", color: "#fff", fontFamily: "'DM Sans',sans-serif", fontSize: 24, letterSpacing: 12, textAlign: "center", outline: "none" }} />
            </div>
            
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Confirm PIN</label>
              <input type="password" value={confirmPin} onChange={function(e){ setConfirmPin(e.target.value.replace(/\D/g, "").slice(0,5)) }} placeholder="•••••" maxLength={5} style={{ width: "100%", padding: "14px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)", color: "#fff", fontFamily: "'DM Sans',sans-serif", fontSize: 24, letterSpacing: 12, textAlign: "center", outline: "none" }} />
            </div>
            
            {pinError && (
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(255,48,48,0.1)", border: "1px solid rgba(255,48,48,0.2)", color: "#ff6060", fontSize: 12, marginBottom: 16, textAlign: "center" }}>{pinError}</div>
            )}
            
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={function(){ setShowOtpModal(false); setSecretPin(""); setConfirmPin(""); setPinError("") }} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.5)", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleCreateOtp} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#ff3020,#ff6040)", color: "#fff", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Generate Coupons</button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="scroll-area" style={{ flex: 1, padding: "24px 40px 80px", overflowY: "auto", maxHeight: "100vh" }}>

        {/* === COUPONS VIEW (After confirmation) === */}
        {showCoupons && locked && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(52,211,153,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 24, fontWeight: 700 }}>Your Food Coupons</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Show these at the food counter with your 5-digit PIN</div>
                </div>
              </div>
            </div>

            {/* Coupons Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {coupons.map(function(coupon, i) {
                var isDelivered = deliveredDays.indexOf(coupon.day) >= 0
                var snackKey = Object.keys(FD).find(function(k){ return FD[k].n === coupon.snack })
                var bevKey = Object.keys(FD).find(function(k){ return FD[k].n === coupon.beverage })
                return (
                  <div key={i} className={"coupon-card " + (isDelivered ? "delivered" : "")}>
                    <div style={{ height: 3, background: isDelivered ? "rgba(255,255,255,0.1)" : "linear-gradient(90deg,#ff3020,#ff6040)" }} />
                    <div style={{ padding: "20px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1 }}>{EVENT_DAYS[coupon.day - 1]} • {EVENT_DATES[coupon.day - 1]}, 2026</div>
                          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 20, fontWeight: 700, marginTop: 4 }}>Day {coupon.day}</div>
                        </div>
                        <div style={{ padding: "10px 16px", borderRadius: 10, background: "rgba(255,96,64,0.08)", border: "1px solid rgba(255,96,64,0.15)" }}>
                          <div style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>MEAL CODE</div>
                          <div style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 700, color: "#ff6040", letterSpacing: 3 }}>{coupon.code}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 12 }}>
                        <div style={{ flex: 1, padding: "12px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 24 }}>{snackKey ? FD[snackKey].e : "🍽️"}</span>
                          <div>
                            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>Snack</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>{coupon.snack}</div>
                          </div>
                        </div>
                        <div style={{ flex: 1, padding: "12px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 24 }}>{bevKey ? FD[bevKey].e : "🥤"}</span>
                          <div>
                            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>Beverage</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>{coupon.beverage}</div>
                          </div>
                        </div>
                      </div>
                      {isDelivered && (
                        <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "#34d399", fontSize: 12, fontWeight: 600 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          Delivered
                        </div>
                      )}
                    </div>
                    <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.01)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{memberName} • {memberRoll}</div>
                      <div style={{ fontSize: 9, color: "rgba(255,96,64,0.5)" }}>Team {teamNumber}</div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Info Box */}
            <div style={{ marginTop: 24, padding: "20px 24px", borderRadius: 14, background: "rgba(96,165,250,0.05)", border: "1px solid rgba(96,165,250,0.1)", display: "flex", alignItems: "flex-start", gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(96,165,250,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              </div>
              <div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.8)", marginBottom: 4 }}>How to redeem</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}>
                  1. Go to the food counter on the respective day<br/>
                  2. Show your 5-digit meal code to the admin<br/>
                  3. Enter your 5-digit secret PIN when asked<br/>
                  4. Collect your snack and beverage!
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === SELECTION VIEW === */}
        {!showCoupons && (
          <>
            {/* Header with Cart */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
              <div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>
                  Selecting for: <span style={{ color: "#ff6040", fontWeight: 600 }}>{memberName}</span>
                </div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 28, fontWeight: 700 }}>Food Selection</div>
              </div>
              <button className={"cart-btn " + (cartReady ? "ready" : "")} onClick={function(){ if (cartReady) setShowCart(true) }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={cartReady ? "#ff6040" : "rgba(255,255,255,0.4)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                <span style={{ fontSize: 13, fontWeight: 600, color: cartReady ? "#ff6040" : "rgba(255,255,255,0.4)" }}>{totalItems}/14</span>
                {cartReady && <div className="cart-badge">✓</div>}
              </button>
            </div>

            {/* Two Column Layout */}
            <div style={{ display: "flex", gap: 24 }}>
              
              {/* LEFT COLUMN */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Day Chips */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>Select Day</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {[1,2,3,4,5,6,7].map(function(d, i) {
                      var done = dayData[i] && dayData[i].snack && dayData[i].bev
                      return (
                        <div key={i} className={"day-chip " + (curDay === i ? "on " : "") + (done ? "complete" : "")} onClick={function(){ setCurDay(i) }}>
                          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 18, fontWeight: 700, color: curDay === i ? "#ff6040" : "#fff" }}>{d}</div>
                          <div style={{ fontSize: 8, color: curDay === i ? "rgba(255,96,64,0.6)" : "rgba(255,255,255,0.3)", marginTop: 2 }}>{EVENT_DAYS[i]}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Category Tabs */}
                <div style={{ display: "flex", marginBottom: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: 3, width: "fit-content" }}>
                  <button className={"cat-tab " + (cat === "snacks" ? "on" : "")} onClick={function(){ setCat("snacks") }}>Snacks</button>
                  <button className={"cat-tab " + (cat === "beverages" ? "on" : "")} onClick={function(){ setCat("beverages") }}>Beverages</button>
                </div>

                {/* Food Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                  {(cat === "snacks" ? SNACK_IDS : BEV_IDS).map(function(id) {
                    var d = FD[id]
                    var type = cat === "snacks" ? "snack" : "bev"
                    var isSelected = curDayData[type] === id
                    var isViewing = curView === id
                    return (
                      <div key={id} className={"food-card " + (isSelected ? "selected " : "") + (isViewing ? "viewing" : "")} onClick={function(){ viewFood(id) }}>
                        {isSelected && <div style={{ position: "absolute", top: 6, right: 6, width: 16, height: 16, borderRadius: "50%", background: "linear-gradient(135deg,#ff3020,#ff6040)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff" }}>✓</div>}
                        <div style={{ fontSize: 32 }}>{d.e}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: isSelected ? "#fff" : "rgba(255,255,255,0.6)" }}>{d.n}</div>
                      </div>
                    )
                  })}
                </div>

                {/* Current Day Summary */}
                <div style={{ marginTop: 20, padding: "16px 20px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Day {curDay + 1} Selection</div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ flex: 1, padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{curDayData.snack && FD[curDayData.snack] ? FD[curDayData.snack].e : "—"}</span>
                        <span style={{ fontSize: 12, color: curDayData.snack ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)" }}>{curDayData.snack && FD[curDayData.snack] ? FD[curDayData.snack].n : "No snack"}</span>
                      </div>
                      {curDayData.snack && <button onClick={function(){ removeFromDay(curDay, "snack") }} style={{ width: 20, height: 20, borderRadius: 5, border: "none", background: "rgba(255,48,48,0.1)", color: "#ff6060", fontSize: 10, cursor: "pointer" }}>✕</button>}
                    </div>
                    <div style={{ flex: 1, padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{curDayData.bev && FD[curDayData.bev] ? FD[curDayData.bev].e : "—"}</span>
                        <span style={{ fontSize: 12, color: curDayData.bev ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)" }}>{curDayData.bev && FD[curDayData.bev] ? FD[curDayData.bev].n : "No beverage"}</span>
                      </div>
                      {curDayData.bev && <button onClick={function(){ removeFromDay(curDay, "bev") }} style={{ width: 20, height: 20, borderRadius: 5, border: "none", background: "rgba(255,48,48,0.1)", color: "#ff6060", fontSize: 10, cursor: "pointer" }}>✕</button>}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN - Detail Panel */}
              <div style={{ width: 340, flexShrink: 0 }}>
                {!curView && (
                  <div style={{ padding: "60px 24px", textAlign: "center", borderRadius: 16, background: "rgba(255,255,255,0.01)", border: "1px dashed rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.2 }}>🍽️</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>Click any item to see details</div>
                  </div>
                )}
                {curView && detail && (
                  <div className="detail-panel">
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                      <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(255,96,64,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>{FD[curView].e}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 20, fontWeight: 700 }}>{FD[curView].n}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,96,64,0.6)", textTransform: "uppercase", letterSpacing: 1 }}>{FD[curView].c}</div>
                      </div>
                    </div>

                    {/* Description */}
                    <div style={{ fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.5)", marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{detail.description}</div>

                    {/* Nutrition */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Nutrition</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <div className="nut-box">
                          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 22, fontWeight: 700, color: "#ff6040" }}>{detail.calories}</div>
                          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Calories</div>
                        </div>
                        <div className="nut-box">
                          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 22, fontWeight: 700, color: "#34d399" }}>{detail.protein}</div>
                          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Protein</div>
                        </div>
                        <div className="nut-box">
                          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 22, fontWeight: 700, color: "#60a5fa" }}>{detail.carbs}</div>
                          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Carbs</div>
                        </div>
                        <div className="nut-box">
                          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 22, fontWeight: 700, color: "#fbbf24" }}>{detail.fat}</div>
                          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Fat</div>
                        </div>
                      </div>
                    </div>

                    {/* Ingredients */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Ingredients</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {detail.ingredients.map(function(ing, i) { return <span key={i} className="ing-chip">{ing}</span> })}
                      </div>
                    </div>

                    {/* Allergens */}
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Allergens</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {detail.allergens.map(function(a, i) {
                          return <span key={i} className={"allergy-chip " + (a.toLowerCase() === "none" ? "safe" : "warn")}>{a.toLowerCase() === "none" ? "✓ None" : "⚠ " + a}</span>
                        })}
                      </div>
                    </div>

                    {/* Add Button */}
                    <button onClick={function(){ addToDay(curView) }} disabled={isCurrentlyAdded} style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: 12,
                      border: isCurrentlyAdded ? "1px solid rgba(52,211,153,0.2)" : "none",
                      background: isCurrentlyAdded ? "rgba(52,211,153,0.1)" : "linear-gradient(135deg,#ff3020,#ff6040)",
                      color: isCurrentlyAdded ? "#34d399" : "#fff",
                      fontFamily: "'DM Sans',sans-serif",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: isCurrentlyAdded ? "default" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8
                    }}>
                      {isCurrentlyAdded ? (
                        <>✓ Added to Day {curDay + 1}</>
                      ) : (
                        <>Add to Day {curDay + 1}</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}