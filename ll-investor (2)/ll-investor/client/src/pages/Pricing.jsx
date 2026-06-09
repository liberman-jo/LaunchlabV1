import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import useStore from "../lib/store";

export default function Pricing() {
  const [plans, setPlans] = useState({});
  const [addons, setAddons] = useState({});
  const [selected, setSelected] = useState("growth");
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [loading, setLoading] = useState(false);
  const { token } = useStore();
  const navigate = useNavigate();

  useEffect(() => { api.subscriptions.plans().then(d => { setPlans(d.plans); setAddons(d.addons); }).catch(()=>{}); }, []);

  const totalPrice = (plans[selected]?.price||0) + selectedAddons.reduce((sum,a) => sum+(addons[a]?.price||0), 0);
  const toggleAddon = a => setSelectedAddons(p => p.includes(a)?p.filter(x=>x!==a):[...p,a]);

  const checkout = async () => {
    if (!token) return navigate("/?checkout=true");
    setLoading(true);
    try {
      const { url } = await api.subscriptions.checkout({ plan:selected, addons:selectedAddons });
      window.location.href = url;
    } catch(e) {
      alert(e.message);
    } finally { setLoading(false); }
  };

  const planList = Object.entries(plans);

  return (
    <div style={{ minHeight:"100vh", background:"var(--dark)", fontFamily:"var(--font-body)" }}>
      <div style={{ background:"var(--dark)", borderBottom:"1px solid #ffffff10", height:56, display:"flex", alignItems:"center", padding:"0 48px", justifyContent:"space-between" }}>
        <span style={{ fontFamily:"var(--font-head)", fontSize:15, color:"#fff", letterSpacing:"0.02em" }}>LaunchLab Pro</span>
        <button onClick={()=>navigate("/")} style={{ background:"none", border:"1px solid #ffffff20", borderRadius:6, color:"#ffffff80", cursor:"pointer", padding:"6px 14px", fontSize:12 }}>Sign in</button>
      </div>

      <div style={{ maxWidth:960, margin:"0 auto", padding:"72px 24px" }}>
        <div style={{ textAlign:"center", marginBottom:56 }}>
          <div style={{ fontFamily:"var(--font-head)", fontSize:48, color:"#fff", letterSpacing:"-0.03em", marginBottom:12 }}>Simple, transparent pricing</div>
          <p style={{ fontSize:16, color:"#ffffff60" }}>Start free for 14 days. No credit card required.</p>
        </div>

        {/* Plan cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:40 }}>
          {planList.map(([key, plan]) => (
            <div key={key} onClick={()=>setSelected(key)} style={{ background:selected===key?"#fff":"#ffffff08", borderRadius:12, border:`1.5px solid ${selected===key?"#fff":"#ffffff15"}`, padding:"28px 24px", cursor:"pointer", transition:"all 0.15s", position:"relative" }}>
              {key==="growth" && <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", background:"#D4AF37", color:"#0A0F1E", fontSize:10, fontWeight:700, padding:"3px 12px", borderRadius:20, letterSpacing:"0.08em", textTransform:"uppercase" }}>Most popular</div>}
              <div style={{ fontSize:14, fontWeight:600, color:selected===key?"var(--dark)":"#ffffffcc", marginBottom:8 }}>{plan.name}</div>
              <div style={{ display:"flex", alignItems:"baseline", gap:4, marginBottom:16 }}>
                <span style={{ fontFamily:"var(--font-head)", fontSize:40, color:selected===key?"var(--dark)":"#fff", letterSpacing:"-0.04em" }}>${plan.price}</span>
                <span style={{ fontSize:13, color:selected===key?"var(--muted)":"#ffffff60" }}>/month</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {(plan.features||[]).map(f => (
                  <div key={f} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                    <span style={{ color:selected===key?"var(--disc)":"#D4AF37", fontSize:12, marginTop:2 }}>+</span>
                    <span style={{ fontSize:12, color:selected===key?"var(--text)":"#ffffffaa", lineHeight:1.5 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Add-ons */}
        <div style={{ background:"#ffffff08", borderRadius:12, border:"1px solid #ffffff15", padding:"24px 28px", marginBottom:32 }}>
          <div style={{ fontSize:13, fontWeight:600, color:"#ffffff80", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:16 }}>Add-ons</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {Object.entries(addons).map(([key, addon]) => (
              <div key={key} onClick={()=>toggleAddon(key)} style={{ background:selectedAddons.includes(key)?"#ffffff15":"transparent", border:`1px solid ${selectedAddons.includes(key)?"#ffffff40":"#ffffff15"}`, borderRadius:8, padding:"14px 16px", cursor:"pointer", transition:"all 0.15s" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
                  <span style={{ fontSize:13, fontWeight:500, color:"#ffffffcc" }}>{addon.name}</span>
                  <span style={{ fontSize:13, color:"#D4AF37", fontWeight:600 }}>+${addon.price}/mo</span>
                </div>
                <div style={{ fontSize:11, color:"#ffffff50", lineHeight:1.5 }}>{addon.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
          <div style={{ fontSize:22, color:"#fff", fontFamily:"var(--font-head)" }}>
            Total: <span style={{ color:"#D4AF37" }}>${totalPrice}/month</span>
          </div>
          <button onClick={checkout} disabled={loading} style={{ background:"#D4AF37", color:"#0A0F1E", border:"none", borderRadius:8, padding:"14px 40px", fontSize:15, fontWeight:600, cursor:"pointer", opacity:loading?0.7:1 }}>
            {loading?"Redirecting...":"Start 14-day free trial"}
          </button>
          <p style={{ fontSize:12, color:"#ffffff40" }}>Cancel anytime. Billed monthly.</p>
        </div>
      </div>
    </div>
  );
}
