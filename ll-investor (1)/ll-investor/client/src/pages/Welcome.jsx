import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import useStore from "../lib/store";

const S = {
  btn:   (bg,fg="#fff",sz=14) => ({ background:bg,color:fg,border:"none",borderRadius:6,padding:"11px 22px",fontSize:sz,fontWeight:500,cursor:"pointer",fontFamily:"var(--font-body)",letterSpacing:"-0.01em" }),
  btnO:  (c,sz=13) => ({ background:"transparent",color:c,border:`1.5px solid ${c}30`,borderRadius:6,padding:"10px 18px",fontSize:sz,fontWeight:500,cursor:"pointer",fontFamily:"var(--font-body)" }),
  inp:   (e={}) => ({ width:"100%",padding:"10px 14px",borderRadius:6,border:"1.5px solid var(--border)",fontSize:14,fontFamily:"var(--font-body)",color:"var(--text)",background:"#fff",outline:"none",boxSizing:"border-box",...e }),
  card:  (p="20px 24px",e={}) => ({ background:"#fff",borderRadius:10,border:"1px solid var(--border)",padding:p,...e }),
};

export default function Welcome() {
  const [mode,    setMode]    = useState("login");
  const [form,    setForm]    = useState({ name:"",email:"",password:"",goal:"" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const { setAuth } = useStore();
  const navigate = useNavigate();
  const up = (k,v) => setForm(p=>({...p,[k]:v}));

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      const { token, user } = await (mode==="login" ? api.auth.login(form) : api.auth.register(form));
      setAuth(token, user);
      navigate("/dashboard");
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", fontFamily:"var(--font-body)", background:"var(--dark)" }}>
      <div style={{ width:"50%", display:"flex", flexDirection:"column", justifyContent:"center", padding:"72px 64px", position:"relative", flexShrink:0 }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 30% 60%, #1E3A8A22, transparent 60%)" }} />
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:64 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:"#D4AF37" }} />
            <span style={{ fontFamily:"var(--font-head)", fontSize:16, color:"#fff", letterSpacing:"0.02em" }}>LaunchLab Pro</span>
          </div>
          <div style={{ fontFamily:"var(--font-head)", fontSize:52, color:"#fff", lineHeight:1.0, letterSpacing:"-0.02em", marginBottom:24 }}>
            Build profitable<br />businesses, faster.
          </div>
          <p style={{ fontSize:16, color:"#ffffff60", lineHeight:1.8, marginBottom:52, maxWidth:360 }}>
            Investment-grade market intelligence, automated setup, and performance analytics — for operators who value their time.
          </p>
          <div style={{ display:"flex", flexDirection:"column", gap:28 }}>
            {[
              ["$15/mo — Starter","AI idea generation, market vetting, competitive analysis"],
              ["$25/mo — Growth","Multi-business management, operations & marketing reports"],
              ["$35/mo — Pro","Deep AI insights, revenue optimization, priority support"],
            ].map(([plan,desc]) => (
              <div key={plan} style={{ display:"flex", gap:16 }}>
                <div style={{ width:2, background:"#D4AF37", borderRadius:1, flexShrink:0, alignSelf:"stretch" }} />
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#D4AF37", marginBottom:2 }}>{plan}</div>
                  <div style={{ fontSize:12, color:"#ffffff50", lineHeight:1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={()=>navigate("/pricing")} style={{ ...S.btn("#D4AF37","#0A0F1E",13), marginTop:40, width:"fit-content", letterSpacing:"0.02em" }}>
            View all plans &rarr;
          </button>
        </div>
      </div>

      <div style={{ flex:1, background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center", padding:56 }}>
        <div style={{ width:"100%", maxWidth:380 }}>
          <div style={{ fontFamily:"var(--font-head)", fontSize:30, color:"var(--text)", marginBottom:6, letterSpacing:"-0.03em" }}>
            {mode==="login"?"Sign in":"Create account"}
          </div>
          <p style={{ fontSize:13, color:"var(--muted)", marginBottom:28 }}>
            {mode==="login"?"Welcome back to LaunchLab Pro.":"Start your 14-day free trial. No credit card required."}
          </p>
          {error && <div style={{ ...S.card("12px 16px",{background:"var(--err-bg)",border:"1px solid #DC262625",marginBottom:20}), fontSize:13, color:"var(--err)" }}>{error}</div>}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {mode==="register" && (
              <div>
                <label style={{ fontSize:12, fontWeight:500, display:"block", marginBottom:6, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.06em" }}>Full name</label>
                <input value={form.name} onChange={e=>up("name",e.target.value)} placeholder="Your name" style={S.inp()} />
              </div>
            )}
            <div>
              <label style={{ fontSize:12, fontWeight:500, display:"block", marginBottom:6, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.06em" }}>Email</label>
              <input type="email" value={form.email} onChange={e=>up("email",e.target.value)} placeholder="you@company.com" style={S.inp()} onKeyDown={e=>e.key==="Enter"&&submit()} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:500, display:"block", marginBottom:6, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.06em" }}>Password</label>
              <input type="password" value={form.password} onChange={e=>up("password",e.target.value)} placeholder={mode==="register"?"8+ characters":""} style={S.inp()} onKeyDown={e=>e.key==="Enter"&&submit()} />
            </div>
          </div>
          <button onClick={submit} disabled={loading} style={{ ...S.btn("var(--dark)","#fff",14), width:"100%", padding:"13px", borderRadius:8, marginTop:24, opacity:loading?0.7:1 }}>
            {loading?"Please wait...":(mode==="login"?"Sign in":"Start free trial")}
          </button>
          <p style={{ textAlign:"center", fontSize:13, color:"var(--muted)", marginTop:18 }}>
            {mode==="login"?"No account? ":"Have an account? "}
            <span onClick={()=>{setMode(m=>m==="login"?"register":"login");setError("");}} style={{ color:"var(--disc)", cursor:"pointer", fontWeight:500 }}>
              {mode==="login"?"Start free trial":"Sign in"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
