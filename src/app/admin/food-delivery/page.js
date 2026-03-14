"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

var FD = {
  sandwich:{e:"\ud83e\udd6a",n:"Sandwich"},samosa:{e:"\ud83e\udd5f",n:"Samosa"},puff:{e:"\ud83e\udd50",n:"Puff"},cake:{e:"\ud83c\udf70",n:"Cake"},biscuits:{e:"\ud83c\udf6a",n:"Biscuits"},chips:{e:"\ud83c\udf5f",n:"Chips"},vadapav:{e:"\ud83c\udf54",n:"Vada Pav"},breadpakora:{e:"\ud83e\uded3",n:"Bread Pakora"},
  tea:{e:"\ud83c\udf75",n:"Tea"},coffee:{e:"\u2615",n:"Coffee"},juice:{e:"\ud83e\uddc3",n:"Juice"},milk:{e:"\ud83e\udd5b",n:"Milk"},buttermilk:{e:"\ud83e\udd64",n:"Buttermilk"},water:{e:"\ud83d\udca7",n:"Water"},lemonade:{e:"\ud83c\udf4b",n:"Lemonade"},coldcoffee:{e:"\ud83e\uddca",n:"Cold Coffee"}
}

var EVENT_DATES = ["May 6","May 7","May 8","May 9","May 10","May 11","May 12"]
var EVENT_DAYS = ["Wed","Thu","Fri","Sat","Sun","Mon","Tue"]

export default function AdminFoodDeliveryPage() {
  var router = useRouter()
  var [loading, setLoading] = useState(true)
  var [isAdmin, setIsAdmin] = useState(false)
  var [mealCode, setMealCode] = useState("")
  var [secretPin, setSecretPin] = useState("")
  var [verifying, setVerifying] = useState(false)
  var [error, setError] = useState("")
  var [verifiedOrder, setVerifiedOrder] = useState(null)
  var [delivering, setDelivering] = useState(false)
  var [deliverySuccess, setDeliverySuccess] = useState(false)
  var [recentDeliveries, setRecentDeliveries] = useState([])
  var [stats, setStats] = useState({ total: 0, delivered: 0, pending: 0 })

  useEffect(function() {
    // For now, allow access without login check (we'll add mentor auth later)
    setIsAdmin(true)
    loadStats()
    loadRecentDeliveries()
    setLoading(false)
  }, [router])

  async function loadStats() {
    var res = await supabase.from("food_selections").select("id, delivered, confirmed")
    if (res.data) {
      var confirmed = res.data.filter(function(r) { return r.confirmed })
      var delivered = confirmed.filter(function(r) { return r.delivered })
      setStats({
        total: confirmed.length,
        delivered: delivered.length,
        pending: confirmed.length - delivered.length
      })
    }
  }

  async function loadRecentDeliveries() {
    var res = await supabase
      .from("food_selections")
      .select("*")
      .eq("delivered", true)
      .order("delivered_at", { ascending: false })
      .limit(10)
    if (res.data) setRecentDeliveries(res.data)
  }

  async function verifyOrder() {
    setError("")
    setVerifiedOrder(null)
    
    if (!mealCode.trim()) {
      setError("Please enter the 5-digit meal code")
      return
    }
    if (mealCode.length !== 5 || !/^\d{5}$/.test(mealCode)) {
      setError("Meal code must be exactly 5 digits")
      return
    }
    if (!secretPin.trim()) {
      setError("Please enter the 5-digit secret PIN")
      return
    }
    if (secretPin.length !== 5 || !/^\d{5}$/.test(secretPin)) {
      setError("PIN must be exactly 5 digits")
      return
    }
    
    setVerifying(true)
    
    // Find the order by meal code
    var res = await supabase
      .from("food_selections")
      .select("*")
      .eq("coupon_code", mealCode.trim())
      .single()
    
    if (res.error || !res.data) {
      setError("Invalid meal code. No order found.")
      setVerifying(false)
      return
    }
    
    // Check if PIN matches
    if (res.data.secret_pin !== secretPin) {
      setError("Incorrect PIN. Please try again.")
      setVerifying(false)
      return
    }
    
    // Check if already delivered
    if (res.data.delivered) {
      setError("This meal has already been delivered on " + new Date(res.data.delivered_at).toLocaleString())
      setVerifying(false)
      return
    }
    
    setVerifiedOrder(res.data)
    setVerifying(false)
  }

  async function deliverOrder() {
    if (!verifiedOrder) return
    setDelivering(true)
    
    var res = await supabase
      .from("food_selections")
      .update({
        delivered: true,
        delivered_at: new Date().toISOString(),
        delivered_by: "admin"
      })
      .eq("id", verifiedOrder.id)
    
    if (res.error) {
      setError("Failed to mark as delivered. Please try again.")
      setDelivering(false)
      return
    }
    
    setDeliverySuccess(true)
    setDelivering(false)
    loadStats()
    loadRecentDeliveries()
    
    // Reset after 3 seconds
    setTimeout(function() {
      setVerifiedOrder(null)
      setDeliverySuccess(false)
      setMealCode("")
      setSecretPin("")
    }, 3000)
  }

  function resetForm() {
    setMealCode("")
    setSecretPin("")
    setError("")
    setVerifiedOrder(null)
    setDeliverySuccess(false)
  }

  function getEmoji(name) {
    if (!name) return "🍽️"
    var key = Object.keys(FD).find(function(k) { return FD[k].n.toLowerCase() === name.toLowerCase() })
    return key ? FD[key].e : "🍽️"
  }

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "#000", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,#ff3020,#ff6040)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif", fontWeight: 900, fontSize: 18, color: "#fff", margin: "0 auto 12px", animation: "pulse 1s ease-in-out infinite" }}>PS</div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, letterSpacing: 3, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>Loading</div>
        </div>
        <style>{`@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}`}</style>
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#000", color: "#fff", fontFamily: "'DM Sans',sans-serif" }}>
      <style jsx>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
        @keyframes checkmark{0%{transform:scale(0)}50%{transform:scale(1.2)}100%{transform:scale(1)}}
        .scroll-area::-webkit-scrollbar{width:5px}
        .scroll-area::-webkit-scrollbar-track{background:transparent}
        .scroll-area::-webkit-scrollbar-thumb{background:rgba(255,96,64,0.15);border-radius:10px}
        .stat-card{padding:24px;border-radius:14px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);text-align:center}
        .input-field{width:100%;padding:16px 16px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.02);color:#fff;font-family:'DM Sans',sans-serif;font-size:24px;outline:none;transition:border-color 0.3s;text-align:center;letter-spacing:8px}
        .input-field:focus{border-color:rgba(255,96,64,0.4)}
        .input-field::placeholder{color:rgba(255,255,255,0.2);letter-spacing:4px}
      `}</style>

      {/* Simple sidebar for admin */}
      <div style={{ width: 80, background: "rgba(255,255,255,0.02)", borderRight: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 0" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#ff3020,#ff6040)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16, marginBottom: 32 }}>PS</div>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(255,96,64,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff6040" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="scroll-area" style={{ flex: 1, padding: "32px 48px", overflowY: "auto", maxHeight: "100vh" }}>
        
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 2 }}>Admin Panel</div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 32, fontWeight: 700 }}>Food Delivery</div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
          <div className="stat-card">
            <div style={{ fontSize: 36, fontWeight: 700, color: "#60a5fa", marginBottom: 4 }}>{stats.total}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1 }}>Total Orders</div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: 36, fontWeight: 700, color: "#34d399", marginBottom: 4 }}>{stats.delivered}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1 }}>Delivered</div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: 36, fontWeight: 700, color: "#ff6040", marginBottom: 4 }}>{stats.pending}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1 }}>Pending</div>
          </div>
        </div>

        {/* Verify Section */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
          
          {/* Left - Verification Form */}
          <div style={{ padding: "32px", borderRadius: 20, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,96,64,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff6040" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 20, fontWeight: 700 }}>Verify &amp; Deliver</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Enter 5-digit meal code and PIN</div>
              </div>
            </div>

            {!verifiedOrder && !deliverySuccess && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Meal Code (5 digits)</label>
                  <input 
                    type="text" 
                    value={mealCode} 
                    onChange={function(e){ setMealCode(e.target.value.replace(/\D/g, "").slice(0,5)) }} 
                    placeholder="•••••" 
                    maxLength={5}
                    className="input-field" 
                  />
                </div>
                
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Secret PIN (5 digits)</label>
                  <input 
                    type="password" 
                    value={secretPin} 
                    onChange={function(e){ setSecretPin(e.target.value.replace(/\D/g, "").slice(0,5)) }} 
                    placeholder="•••••" 
                    maxLength={5}
                    className="input-field" 
                  />
                </div>

                {error && (
                  <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(255,48,48,0.1)", border: "1px solid rgba(255,48,48,0.2)", color: "#ff6060", fontSize: 13, marginBottom: 20 }}>{error}</div>
                )}

                <button onClick={verifyOrder} disabled={verifying} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#ff3020,#ff6040)", color: "#fff", fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 600, cursor: verifying ? "not-allowed" : "pointer", opacity: verifying ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {verifying ? "Verifying..." : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      Verify Order
                    </>
                  )}
                </button>
              </>
            )}

            {/* Verified Order Details */}
            {verifiedOrder && !deliverySuccess && (
              <div style={{ animation: "fadeUp 0.3s ease" }}>
                <div style={{ padding: "20px", borderRadius: 14, background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.15)", marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#34d399" }}>Order Verified!</span>
                  </div>
                  
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Student</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 12 }}>{verifiedOrder.member_name}</div>
                  
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Roll Number</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.7)", marginBottom: 12 }}>{verifiedOrder.member_roll_number}</div>
                  
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Day</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.7)", marginBottom: 16 }}>Day {verifiedOrder.day_number} • {EVENT_DAYS[verifiedOrder.day_number - 1]}, {EVENT_DATES[verifiedOrder.day_number - 1]}</div>
                  
                  <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ flex: 1, padding: "14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
                      <div style={{ fontSize: 28, marginBottom: 4 }}>{getEmoji(verifiedOrder.snack)}</div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 2 }}>Snack</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{verifiedOrder.snack}</div>
                    </div>
                    <div style={{ flex: 1, padding: "14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
                      <div style={{ fontSize: 28, marginBottom: 4 }}>{getEmoji(verifiedOrder.beverage)}</div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 2 }}>Beverage</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{verifiedOrder.beverage}</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={resetForm} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.5)", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Cancel</button>
                  <button onClick={deliverOrder} disabled={delivering} style={{ flex: 2, padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#22c55e,#34d399)", color: "#fff", fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 600, cursor: delivering ? "not-allowed" : "pointer", opacity: delivering ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    {delivering ? "Processing..." : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Deliver Order
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Delivery Success */}
            {deliverySuccess && (
              <div style={{ textAlign: "center", padding: "40px 20px", animation: "fadeUp 0.3s ease" }}>
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(52,211,153,0.1)", border: "2px solid rgba(52,211,153,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", animation: "checkmark 0.5s ease" }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 22, fontWeight: 700, color: "#34d399", marginBottom: 8 }}>Order Delivered!</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>The student has received their food.</div>
              </div>
            )}
          </div>

          {/* Right - Recent Deliveries */}
          <div style={{ padding: "32px", borderRadius: 20, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(96,165,250,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 20, fontWeight: 700 }}>Recent Deliveries</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Last 10 completed orders</div>
              </div>
            </div>

            {recentDeliveries.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.2 }}>📦</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.2)" }}>No deliveries yet</div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentDeliveries.map(function(d, i) {
                return (
                  <div key={i} style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <span style={{ fontSize: 18 }}>{getEmoji(d.snack)}</span>
                        <span style={{ fontSize: 18 }}>{getEmoji(d.beverage)}</span>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{d.member_name}</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Day {d.day_number} • Code: {d.coupon_code}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
                      {d.delivered_at ? new Date(d.delivered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}