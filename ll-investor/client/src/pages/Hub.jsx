import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import useStore from "../lib/store";
import { api } from "../lib/api";
import { C, FH, FB, btn, btnO, card, GuidePanel, DownloadBtn, Spinner } from "../components";

const MODE_CYCLE = ["Manual","Approve & proceed","Full auto"];

function CSSBar({ data, valueKey, labelKey, color="#D4AF37", prefix="$" }) {
  const max = Math.max(...data.map(d=>d[valueKey]),1);
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:8,height:100,paddingTop:8}}>
      {data.map((d,i)=>(
        <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
          <div style={{fontSize:10,color:"#ffffff50",fontFamily:FB}}>{prefix}{Number(d[valueKey]).toLocaleString()}</div>
          <div style={{width:"100%",background:color,borderRadius:"3px 3px 0 0",height:`${(d[valueKey]/max)*100}%`,minHeight:4}}/>
          <div style={{fontSize:10,color:"#ffffff40",fontFamily:FB}}>{d[labelKey]}</div>
        </div>
      ))}
    </div>
  );
}

// ── PRIORITY BADGE ────────────────────────────────────────────────────────────
function PriorityBadge({ level }) {
  const colors = { high:["#EF4444","#FEF2F2"], medium:["#D97706","#FFFBEB"], low:["#6B7280","#F3F4F6"] };
  const [c,bg] = colors[level]||colors.low;
  return <span style={{background:bg,color:c,fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:20,textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:FB}}>{level} priority</span>;
}

// ── CHANNEL BADGE ─────────────────────────────────────────────────────────────
function ChannelBadge({ type }) {
  const map = {
    website:  ["#0369A1","#E0F2FE","Website"],
    social:   ["#7C3AED","#F5F3FF","Social Media"],
    pricing:  ["#059669","#ECFDF5","Pricing"],
    outreach: ["#D97706","#FFFBEB","Outreach"],
    booking:  ["#DB2777","#FDF2F8","Bookings"],
  };
  const [c,bg,label] = map[type]||["#6B7280","#F3F4F6",type];
  return <span style={{background:bg,color:c,fontSize:9,fontWeight:600,padding:"2px 8px",borderRadius:20,textTransform:"uppercase",letterSpacing:"0.04em",fontFamily:FB}}>{label}</span>;
}

// ── AGENT PIPELINE PANEL ──────────────────────────────────────────────────────
function AgentPipeline({ businessId }) {
  const [insights,      setInsights]      = useState([]);
  const [marketingRunning, setMktRunning] = useState(false);
  const [implementing,  setImplementing]  = useState(null); // insight id being implemented
  const [implementedId, setImplementedId] = useState(null); // last implemented
  const [liveUrl,       setLiveUrl]       = useState(null);
  const [activityLog,   setActivityLog]   = useState([]);
  const [agentStatus,   setAgentStatus]   = useState(null);
  const [error,         setError]         = useState("");
  const logRef = useRef(null);

  // Load activity log and deploy status on mount
  useEffect(()=>{
    api.agents.activity(businessId).then(d=>setActivityLog(d.activity||[])).catch(()=>{});
    api.agents.status(businessId).then(d=>setAgentStatus(d.status)).catch(()=>{});
    api.deploy.status(businessId).then(d=>{ if(d.liveUrl) setLiveUrl(d.liveUrl); }).catch(()=>{});
  },[businessId]);

  const runMarketing = async () => {
    setMktRunning(true); setInsights([]); setError("");
    try {
      const { insights: data } = await api.agents.runMarketing(businessId);
      setInsights(data);
      const {activity} = await api.agents.activity(businessId);
      setActivityLog(activity||[]);
    } catch(e) { setError(e.message); }
    setMktRunning(false);
  };

  const implement = async (insight) => {
    setImplementing(insight.id); setError("");
    try {
      const result = await api.agents.implement(businessId, insight);
      setLiveUrl(result.liveUrl);
      setImplementedId(insight.id);
      const {activity} = await api.agents.activity(businessId);
      setActivityLog(activity||[]);
      // Refresh agent status
      api.agents.status(businessId).then(d=>setAgentStatus(d.status)).catch(()=>{});
    } catch(e) { setError(e.message); }
    setImplementing(null);
  };

  const agentClr = { marketing:"#D4AF37", management:"#4ADE80" };

  return (
    <div>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28}}>
        <div>
          <div style={{fontFamily:"var(--font-head)",fontSize:26,letterSpacing:"-0.04em",marginBottom:4}}>Agent Pipeline</div>
          <div style={{fontSize:13,color:"var(--muted)"}}>Marketing Agent analyzes data → Management Agent implements changes → Live site updates</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:"#4ADE80",animation:"pulse 2s infinite"}}/>
          <span style={{fontSize:12,color:"var(--muted)",fontFamily:FB}}>Full auto mode</span>
        </div>
      </div>

      {/* Agent status bar */}
      {agentStatus && (
        <div style={{background:"#0A0F1E",borderRadius:12,padding:"16px 20px",marginBottom:20,border:"1px solid #D4AF3720"}}>
          <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:"#D4AF37",flexShrink:0,marginTop:5,animation:"pulse 2s infinite"}}/>
            <div>
              <div style={{fontSize:10,color:"#ffffff40",textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:FB,marginBottom:4}}>AI Orchestrator — current status</div>
              <div style={{fontSize:13,color:"#ffffffcc",fontFamily:FB,lineHeight:1.65}}>{agentStatus}</div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={{...card("12px 16px"),background:"#FEF2F2",border:"1px solid #DC262625",marginBottom:16,fontSize:13,color:"#DC2626"}}>
          {error}
          {error.includes("NETLIFY_TOKEN") && (
            <div style={{marginTop:10,lineHeight:1.7}}>
              <strong>To enable live deployment:</strong><br/>
              1. Go to <a href="https://app.netlify.com/user/applications" target="_blank" rel="noopener noreferrer" style={{color:"#DC2626"}}>app.netlify.com/user/applications</a> → Personal access tokens → New token<br/>
              2. Add <code style={{background:"#fee2e2",padding:"1px 5px",borderRadius:3}}>NETLIFY_TOKEN=your-token</code> to Railway environment variables
            </div>
          )}
          {error.includes("Generate the website") && (
            <div style={{marginTop:8}}>Go to the <strong>Content</strong> tab and click Generate next to Business Website first.</div>
          )}
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,alignItems:"start"}}>

        {/* ── LEFT: MARKETING AGENT ─────────────────────────────────────────── */}
        <div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:"#D4AF37"}}/>
            <span style={{fontFamily:"var(--font-head)",fontSize:16}}>Marketing Agent</span>
          </div>
          <p style={{fontSize:13,color:"var(--muted)",marginBottom:16,lineHeight:1.65}}>
            Continuously analyzes performance data — engagement rates, lead conversion, client metrics, content performance — and surfaces the highest-impact opportunities.
          </p>

          <button
            onClick={runMarketing}
            disabled={marketingRunning}
            style={{...btn(marketingRunning?"#6B7280":"#0A0F1E","#D4AF37",14),width:"100%",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}
          >
            {marketingRunning && <span style={{width:14,height:14,borderRadius:"50%",border:"2px solid #D4AF3760",borderTopColor:"#D4AF37",animation:"spin 0.7s linear infinite",flexShrink:0}}/>}
            {marketingRunning?"Analyzing performance data...":"Run marketing analysis"}
          </button>

          {marketingRunning && (
            <div style={{...card("14px 16px"),background:"#0A0F1E",border:"1px solid #D4AF3720",marginBottom:12}}>
              {["Scanning engagement metrics across all client campaigns","Comparing lead conversion rates against industry benchmarks","Identifying underperforming content and high-performing patterns","Generating prioritized recommendations"].map((step,i)=>(
                <div key={i} style={{display:"flex",gap:10,alignItems:"center",padding:"6px 0",opacity:0.7+i*0.075}}>
                  <div style={{width:4,height:4,borderRadius:"50%",background:"#D4AF37",flexShrink:0,animation:"pulse 1.5s infinite",animationDelay:`${i*0.3}s`}}/>
                  <span style={{fontSize:12,color:"#ffffffaa",fontFamily:FB}}>{step}</span>
                </div>
              ))}
            </div>
          )}

          {insights.length>0 && (
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {insights.map((insight,i)=>(
                <div key={i} style={{...card("16px"),border:`1px solid ${insight.priority==="high"?"#EF444430":C.border}`,background:implementedId===insight.id?"#F0FDF4":undefined}}>
                  <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
                    <PriorityBadge level={insight.priority}/>
                    <ChannelBadge type={insight.type}/>
                    {implementedId===insight.id && <span style={{background:"#ECFDF5",color:"#059669",fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:20,textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:FB}}>Implemented</span>}
                  </div>
                  <div style={{fontSize:12,fontWeight:600,color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4,fontFamily:FB}}>Observation</div>
                  <p style={{fontSize:13,color:"var(--text)",lineHeight:1.6,marginBottom:10,fontFamily:FB}}>{insight.agentObservation}</p>
                  <div style={{fontSize:12,fontWeight:600,color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4,fontFamily:FB}}>Recommendation</div>
                  <p style={{fontSize:13,color:"var(--text)",lineHeight:1.6,marginBottom:10,fontFamily:FB}}>{insight.recommendation}</p>
                  <div style={{background:"#F0FDF4",borderRadius:8,padding:"8px 12px",marginBottom:12,fontSize:12,color:"#166534",fontFamily:FB}}>
                    Expected: {insight.expectedImpact}
                  </div>
                  {implementedId!==insight.id && (
                    <button
                      onClick={()=>implement(insight)}
                      disabled={!!implementing}
                      style={{...btn(implementing===insight.id?"#6B7280":"#0A0F1E","#fff",12),width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8,opacity:implementing&&implementing!==insight.id?0.5:1}}
                    >
                      {implementing===insight.id && <span style={{width:12,height:12,borderRadius:"50%",border:"2px solid #ffffff50",borderTopColor:"#fff",animation:"spin 0.7s linear infinite",flexShrink:0}}/>}
                      {implementing===insight.id?"Management agent implementing...":"→ Hand off to management agent"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT: MANAGEMENT AGENT + LIVE SITE ──────────────────────────── */}
        <div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:"#4ADE80"}}/>
            <span style={{fontFamily:"var(--font-head)",fontSize:16}}>Management Agent</span>
          </div>
          <p style={{fontSize:13,color:"var(--muted)",marginBottom:16,lineHeight:1.65}}>
            Receives insights from the marketing agent and implements them across active channels. For this demo, changes are applied to the live website. In production the same pipeline covers social posting, booking availability, and email campaigns.
          </p>

          {/* Live site status */}
          <div style={{background:"#0A0F1E",borderRadius:12,padding:"18px 20px",marginBottom:14,border:`1px solid ${liveUrl?"#4ADE8030":"#ffffff08"}`}}>
            <div style={{fontSize:10,color:"#ffffff40",textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:FB,marginBottom:8}}>Live implementation channel</div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:liveUrl?12:0}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:liveUrl?"#4ADE80":"#ffffff25",flexShrink:0,boxShadow:liveUrl?"0 0 6px #4ADE8088":undefined}}/>
              <span style={{fontFamily:"var(--font-head)",fontSize:15,color:liveUrl?"#4ADE80":"#ffffff50"}}>
                {liveUrl?"Website — live":"Website — not deployed"}
              </span>
            </div>
            {liveUrl && (
              <a href={liveUrl} target="_blank" rel="noopener noreferrer"
                style={{display:"block",fontSize:13,color:"#D4AF37",fontFamily:FB,wordBreak:"break-all",textDecoration:"none"}}>
                {liveUrl} ↗
              </a>
            )}
            {!liveUrl && (
              <div style={{fontSize:12,color:"#ffffff30",marginTop:6,fontFamily:FB}}>
                Will be created automatically when the first insight is implemented
              </div>
            )}
          </div>

          {/* Other channels (illustrative) */}
          <div style={{...card("14px 16px"),marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:600,color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:12,fontFamily:FB}}>Other implementation channels</div>
            {[
              {name:"Instagram & Facebook",status:"Available",note:"Would post updated content and schedule campaign"},
              {name:"Email campaign",      status:"Available",note:"Would send targeted message to client list"},
              {name:"Calendly bookings",   status:"Available",note:"Would adjust availability and pricing"},
              {name:"Google Business",     status:"Available",note:"Would update listing and post announcement"},
            ].map((ch,i,arr)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"8px 0",borderBottom:i<arr.length-1?`1px solid var(--border)`:"none"}}>
                <div>
                  <div style={{fontSize:13,fontWeight:500,fontFamily:FB}}>{ch.name}</div>
                  <div style={{fontSize:11,color:"var(--muted)",fontFamily:FB,marginTop:1}}>{ch.note}</div>
                </div>
                <span style={{background:"#F0FDF4",color:"#059669",fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:20,textTransform:"uppercase",letterSpacing:"0.04em",flexShrink:0,fontFamily:FB}}>{ch.status}</span>
              </div>
            ))}
          </div>

          {/* Activity log */}
          <div style={{...card("16px"),background:"#0A0F1E",border:"1px solid #ffffff08"}}>
            <div style={{fontSize:11,fontWeight:600,color:"#ffffff40",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12,fontFamily:FB}}>Agent activity log</div>
            {activityLog.length===0 ? (
              <div style={{fontSize:12,color:"#ffffff30",fontFamily:FB}}>No activity yet — run the marketing agent to begin</div>
            ) : (
              activityLog.slice(0,8).map((entry,i)=>(
                <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"7px 0",borderBottom:i<Math.min(activityLog.length,8)-1?"1px solid #ffffff08":"none"}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:agentClr[entry.agent]||"#ffffff40",flexShrink:0,marginTop:4}}/>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",gap:8,alignItems:"baseline",marginBottom:2}}>
                      <span style={{fontSize:10,color:agentClr[entry.agent]||"#ffffff50",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em",fontFamily:FB}}>{entry.agent}</span>
                      <span style={{fontSize:12,color:"#ffffffcc",fontFamily:FB,fontWeight:500}}>{entry.action}</span>
                    </div>
                    <div style={{fontSize:11,color:"#ffffff40",fontFamily:FB,lineHeight:1.5}}>{entry.detail}</div>
                  </div>
                  <div style={{fontSize:10,color:"#ffffff25",fontFamily:FB,flexShrink:0}}>
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MAIN HUB ──────────────────────────────────────────────────────────────────
export default function Hub() {
  const { id: businessId } = useParams();
  const [searchParams] = useSearchParams();
  const { user, hubModes, setHubMode } = useStore();
  const [business,   setBusiness]   = useState(null);
  const [outputs,    setOutputs]    = useState([]);
  const [integs,     setIntegs]     = useState([]);
  const [metrics,    setMetrics]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [genLoading, setGenLoading] = useState({});
  const [genError,   setGenError]   = useState("");
  const [hubTab,     setHubTab]     = useState(searchParams.get("tab")||"agents");
  const [chatOpen,   setChatOpen]   = useState(false);
  const [chatMsgs,   setChatMsgs]   = useState([{role:"ai",text:"Welcome. I have full visibility into both agents. Ask me about current marketing insights, implementation status, or business performance."}]);
  const navigate = useNavigate();

  const modes = hubModes[businessId]||{discovery:"Manual",creation:"Approve & proceed",marketing:"Full auto",management:"Full auto"};

  useEffect(()=>{
    Promise.all([
      api.businesses.get(businessId),
      api.businesses.outputs(businessId),
      api.integrations.list(businessId),
    ]).then(([{business:b},{outputs:o},{integrations:ig}])=>{
      setBusiness(b); setOutputs(o); setIntegs(ig);
      const m=o.find(x=>x.type==="metrics");
      if(m) try{setMetrics(JSON.parse(m.content));}catch{}
    }).catch(console.error).finally(()=>setLoading(false));
  },[businessId]);

  const idea      = (()=>{try{return JSON.parse(business?.ideaData||"{}");}catch{return {};}})();
  const getOutput = type=>outputs.find(o=>o.type===type);
  const isConn    = p=>integs.find(i=>i.provider===p)?.status==="connected";

  const generate  = async (type,apiCall)=>{
    setGenLoading(p=>({...p,[type]:true})); setGenError("");
    try{
      const {output}=await apiCall(businessId);
      setOutputs(p=>{const ex=p.find(o=>o.type===type);return ex?p.map(o=>o.type===type?output:o):[...p,output];});
    }catch(e){setGenError(e.message);}
    finally{setGenLoading(p=>({...p,[type]:false}));}
  };

  const connectStripe=async()=>{try{const{url}=await api.integrations.stripe(businessId);window.open(url,"_blank");}catch(e){setGenError(e.message);}};
  const connectGoogle=async()=>{try{const{url}=await api.integrations.googleAuth(businessId);window.open(url,"_blank");}catch(e){setGenError(e.message);}};
  const disconnect  =async p=>{await api.integrations.disconnect(businessId,p).catch(()=>{});setIntegs(prev=>prev.map(i=>i.provider===p?{...i,status:"disconnected"}:i));};
  const cycleMode   =stage=>{const cur=modes[stage]||"Manual";setHubMode(businessId,stage,MODE_CYCLE[(MODE_CYCLE.indexOf(cur)+1)%MODE_CYCLE.length]);};
  const sendChat    =async msg=>{setChatMsgs(p=>[...p,{role:"user",text:msg}]);try{const{reply}=await api.generate.chat(msg,businessId);setChatMsgs(p=>[...p,{role:"ai",text:reply}]);}catch{setChatMsgs(p=>[...p,{role:"ai",text:"Sorry, couldn't process that."}]);}};

  if(loading) return <div style={{display:"flex",minHeight:"100vh",alignItems:"center",justifyContent:"center",background:"#0A0F1E"}}><Spinner color="#D4AF37"/></div>;

  const navItems=[
    {id:"agents",      label:"Agent Pipeline"},
    {id:"overview",    label:"Overview"},
    {id:"performance", label:"Performance"},
    {id:"clients",     label:"Clients"},
    {id:"content",     label:"Content"},
    {id:"integrations",label:"Integrations"},
    {id:"settings",    label:"Settings"},
  ];

  return (
    <div style={{display:"flex",minHeight:"100vh",fontFamily:FB}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>

      {/* Sidebar */}
      <div style={{width:220,background:"#0A0F1E",display:"flex",flexDirection:"column",flexShrink:0,borderRight:"1px solid #ffffff08"}}>
        <div style={{padding:"22px 20px 16px",borderBottom:"1px solid #ffffff08"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:"#D4AF37"}}/>
            <span style={{fontFamily:"var(--font-head)",fontSize:14,color:"#fff",letterSpacing:"0.02em"}}>LaunchLab Pro</span>
          </div>
          <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:15,color:"#fff",marginBottom:4,lineHeight:1.2}}>{business?.name}</div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:"#4ADE80",animation:"pulse 2s infinite"}}/>
            <span style={{fontSize:11,color:"#ffffff40"}}>{business?.location}</span>
          </div>
          {business?.name==="LocalPulse Media" && <div style={{marginTop:8,background:"#D4AF3720",border:"1px solid #D4AF3740",borderRadius:6,padding:"3px 8px",fontSize:10,color:"#D4AF37",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",display:"inline-block"}}>Live demo</div>}
        </div>
        <nav style={{padding:"12px 8px",flex:1}}>
          {navItems.map(({id,label})=>(
            <div key={id} onClick={()=>setHubTab(id)} style={{padding:"9px 12px",borderRadius:7,marginBottom:2,background:hubTab===id?"#ffffff12":"transparent",color:hubTab===id?"#fff":id==="agents"?"#D4AF37":"#ffffff45",cursor:"pointer",fontSize:13,fontWeight:hubTab===id?500:400,fontFamily:FB,transition:"all 0.12s",border:id==="agents"?"1px solid #D4AF3720":"1px solid transparent"}}>
              {label}
            </div>
          ))}
        </nav>
        <div style={{padding:"10px 8px",borderTop:"1px solid #ffffff08"}}>
          <div onClick={()=>navigate(`/creation/${businessId}`)} style={{padding:"8px 12px",borderRadius:7,color:"#ffffff30",cursor:"pointer",fontSize:12,fontFamily:FB}}>Setup tasks</div>
          <div onClick={()=>navigate("/dashboard")} style={{padding:"8px 12px",borderRadius:7,color:"#ffffff25",cursor:"pointer",fontSize:12,fontFamily:FB}}>All businesses</div>
        </div>
      </div>

      {/* Main */}
      <div style={{flex:1,background:"#F8F8F8",overflowY:"auto"}}>
        <div style={{padding:"32px 36px 80px"}}>

          {genError && <div style={{...card("12px 16px"),background:"#FEF2F2",border:"1px solid #DC262625",marginBottom:16,fontSize:13,color:"#DC2626"}}>{genError}<button onClick={()=>setGenError("")} style={{marginLeft:12,background:"none",border:"none",cursor:"pointer",color:"#DC2626",textDecoration:"underline",fontSize:13}}>Dismiss</button></div>}

          {/* AGENT PIPELINE — default tab */}
          {hubTab==="agents" && <AgentPipeline businessId={businessId}/>}

          {/* OVERVIEW */}
          {hubTab==="overview" && metrics && (
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28}}>
                <div>
                  <div style={{fontFamily:"var(--font-head)",fontSize:26,letterSpacing:"-0.04em",marginBottom:4}}>Business Overview</div>
                  <div style={{fontSize:13,color:"var(--muted)"}}>LocalPulse Media · December 2024 · Month 7</div>
                </div>
                <button onClick={()=>setHubTab("agents")} style={{...btn("#0A0F1E","#D4AF37",13)}}>Open agent pipeline</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
                {[
                  {label:"Monthly revenue",  value:`$${metrics.revenue.current_month.toLocaleString()}`,sub:`+${metrics.revenue.growth_pct}% vs last month`,accent:"#D4AF37"},
                  {label:"Active clients",   value:metrics.clients.active,              sub:`${metrics.clients.pipeline} in pipeline`,  accent:"#4ADE80"},
                  {label:"Retention rate",   value:`${metrics.clients.retention_rate}%`,sub:`${metrics.clients.total_served} total served`,accent:"#60A5FA"},
                  {label:"Gross margin",     value:"82%",                              sub:"$6,888 net this month",                    accent:"#F472B6"},
                ].map(({label,value,sub,accent})=>(
                  <div key={label} style={{background:"#0A0F1E",borderRadius:12,padding:"20px 22px",border:`1px solid ${accent}20`}}>
                    <div style={{fontSize:10,color:"#ffffff40",textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:FB,marginBottom:8}}>{label}</div>
                    <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:28,color:accent,letterSpacing:"-0.04em",lineHeight:1}}>{value}</div>
                    <div style={{fontSize:11,color:"#ffffff40",marginTop:6,fontFamily:FB}}>{sub}</div>
                  </div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
                <div style={{background:"#0A0F1E",borderRadius:12,padding:"22px 24px",border:"1px solid #ffffff08"}}>
                  <div style={{fontSize:13,fontWeight:500,color:"#fff",marginBottom:20,fontFamily:FB}}>MRR Growth — 7 months</div>
                  <CSSBar data={metrics.revenue.mrr_trend.map((v,i)=>({amount:v,month:metrics.revenue.mrr_labels[i]}))} valueKey="amount" labelKey="month" color="#D4AF37"/>
                </div>
                <div style={{background:"#0A0F1E",borderRadius:12,padding:"22px 24px",border:"1px solid #ffffff08"}}>
                  <div style={{fontSize:13,fontWeight:500,color:"#fff",marginBottom:20,fontFamily:FB}}>Weekly Revenue</div>
                  <CSSBar data={metrics.revenue.weekly} valueKey="amount" labelKey="week" color="#4ADE80"/>
                </div>
              </div>
              <div style={{background:"#0A0F1E",borderRadius:12,padding:"22px 24px",border:"1px solid #ffffff08"}}>
                <div style={{fontSize:13,fontWeight:500,color:"#fff",marginBottom:18,fontFamily:FB}}>Recent activity</div>
                {metrics.activity.map((a,i)=>{
                  const dotClr=a.type==="revenue"?"#D4AF37":a.type==="client"?"#4ADE80":a.type==="social"?"#60A5FA":"#F472B6";
                  return(
                    <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",padding:"10px 0",borderBottom:i<metrics.activity.length-1?"1px solid #ffffff08":"none"}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:dotClr,flexShrink:0,marginTop:5}}/>
                      <div>
                        <div style={{fontSize:13,color:"#ffffffcc",fontFamily:FB,lineHeight:1.5}}>{a.text}</div>
                        <div style={{fontSize:11,color:"#ffffff30",marginTop:2,fontFamily:FB}}>{a.time}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PERFORMANCE */}
          {hubTab==="performance" && metrics && (
            <div>
              <div style={{fontFamily:"var(--font-head)",fontSize:26,letterSpacing:"-0.04em",marginBottom:4}}>Performance Analytics</div>
              <div style={{fontSize:13,color:"var(--muted)",marginBottom:28}}>Data the marketing agent analyzes to generate insights</div>
              {[
                {title:"Social Media", items:[
                  {label:"Instagram followers",  value:metrics.social.instagram_followers.toLocaleString(),sub:`+${metrics.social.instagram_growth_30d}% this month`},
                  {label:"Avg engagement rate",  value:`${metrics.social.avg_engagement_rate}%`,sub:"Industry avg: 1.9%"},
                  {label:"Avg Reel views",        value:metrics.social.reels_avg_views.toLocaleString(),sub:"Per Reel"},
                  {label:"Posts this month",      value:metrics.social.posts_this_month,sub:"All clients"},
                  {label:"Top post reach",        value:metrics.social.top_post_reach.toLocaleString(),sub:"Single post"},
                  {label:"Stories completion",    value:`${metrics.social.stories_completion_rate}%`,sub:"Rate"},
                ]},
                {title:"Marketing & Leads", items:[
                  {label:"Total reach (30d)",    value:metrics.marketing.total_reach_30d.toLocaleString(),sub:"People reached"},
                  {label:"Leads generated",      value:metrics.marketing.leads_generated,sub:"Strategy calls"},
                  {label:"Calls booked",         value:metrics.marketing.strategy_calls_booked,sub:"Confirmed"},
                  {label:"Lead conversion",      value:`${metrics.marketing.conversion_rate_pct}%`,sub:"Close rate"},
                  {label:"Google profile views", value:metrics.marketing.google_profile_views.toLocaleString(),sub:"This month"},
                  {label:"Google calls",         value:metrics.marketing.google_calls,sub:"Generated"},
                ]},
              ].map(({title,items})=>(
                <div key={title} style={{marginBottom:28}}>
                  <div style={{fontFamily:"var(--font-head)",fontSize:16,marginBottom:14}}>{title}</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
                    {items.map(({label,value,sub})=>(
                      <div key={label} style={card()}>
                        <div style={{fontSize:10,color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6,fontFamily:FB}}>{label}</div>
                        <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:24,letterSpacing:"-0.04em",marginBottom:4}}>{value}</div>
                        <div style={{fontSize:12,color:"var(--muted)",fontFamily:FB}}>{sub}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CLIENTS */}
          {hubTab==="clients" && metrics && (
            <div>
              <div style={{fontFamily:"var(--font-head)",fontSize:26,letterSpacing:"-0.04em",marginBottom:4}}>Client Roster</div>
              <div style={{fontSize:13,color:"var(--muted)",marginBottom:28}}>{metrics.clients.active} active · {metrics.clients.pipeline} in pipeline · {metrics.clients.retention_rate}% retention</div>
              <div style={card()}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead>
                    <tr style={{borderBottom:`1px solid var(--border)`}}>
                      {["Client","Package","MRR","Since","Status"].map(h=>(
                        <th key={h} style={{textAlign:"left",padding:"10px 14px",fontSize:11,color:"var(--muted)",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:FB}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.clients.list.map((c,i)=>(
                      <tr key={i} style={{borderBottom:`1px solid var(--border)`}}>
                        <td style={{padding:"14px",fontSize:14,fontWeight:500,fontFamily:FB}}>{c.name}</td>
                        <td style={{padding:"14px",fontSize:13,color:"var(--muted)",fontFamily:FB}}>{c.package}</td>
                        <td style={{padding:"14px",fontFamily:"var(--font-head)",fontWeight:700,fontSize:16,letterSpacing:"-0.03em"}}>${c.mrr.toLocaleString()}</td>
                        <td style={{padding:"14px",fontSize:13,color:"var(--muted)",fontFamily:FB}}>{c.since}</td>
                        <td style={{padding:"14px"}}><span style={{background:"var(--ok-bg)",color:"var(--ok)",fontSize:10,fontWeight:600,padding:"3px 9px",borderRadius:20,textTransform:"uppercase",letterSpacing:"0.04em"}}>Active</span></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{borderTop:`2px solid var(--border)`}}>
                      <td colSpan={2} style={{padding:"14px",fontSize:13,fontWeight:600}}>Total MRR</td>
                      <td style={{padding:"14px",fontFamily:"var(--font-head)",fontWeight:700,fontSize:18,color:"var(--disc)",letterSpacing:"-0.03em"}}>${metrics.clients.list.reduce((s,c)=>s+c.mrr,0).toLocaleString()}</td>
                      <td colSpan={2}/>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* CONTENT */}
          {hubTab==="content" && (
            <div>
              <div style={{fontFamily:"var(--font-head)",fontSize:26,letterSpacing:"-0.04em",marginBottom:4}}>Generated Content</div>
              <p style={{color:"var(--muted)",fontSize:14,marginBottom:28}}>All content generated by the AI agents. The website is the live implementation channel for demo purposes.</p>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {[
                  {type:"website",       label:"Business Website",       desc:"The live implementation target — updated by the management agent via the Agent Pipeline.",  apiCall:api.generate.website,       ext:".html",mime:"text/html"},
                  {type:"business_plan", label:"Business Plan",          desc:"Full plan with P&L projections and 90-day action plan.",                                    apiCall:api.generate.businessPlan,  ext:".html",mime:"text/html"},
                  {type:"social_content",label:"30-Day Social Calendar", desc:"30 posts with captions and hashtags — would be the social media implementation channel.",  apiCall:api.generate.socialContent, ext:".json",mime:"application/json"},
                  {type:"email_templates",label:"Email Templates",       desc:"8 templates — would be the email implementation channel when insights call for outreach.", apiCall:api.generate.emailTemplates,ext:".json",mime:"application/json"},
                ].map(({type,label,desc,apiCall,ext,mime})=>{
                  const out=getOutput(type);
                  const isLoading=!!genLoading[type];
                  return(
                    <div key={type} style={card()}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                            <span style={{fontFamily:"var(--font-head)",fontSize:16}}>{label}</span>
                            {out&&<span style={{background:"var(--ok-bg)",color:"var(--ok)",fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:20,textTransform:"uppercase",letterSpacing:"0.04em"}}>Ready</span>}
                            {type==="website"&&<span style={{background:"#E0F2FE",color:"#0369A1",fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:20,textTransform:"uppercase",letterSpacing:"0.04em"}}>Live channel</span>}
                          </div>
                          <p style={{fontSize:13,color:"var(--muted)",lineHeight:1.6}}>{desc}</p>
                        </div>
                        <div style={{display:"flex",gap:8,flexShrink:0,marginLeft:16}}>
                          {out&&<DownloadBtn content={out.content} filename={`localpulse-${type}${ext}`} label="Download" mimeType={mime}/>}
                          <button onClick={()=>generate(type,apiCall)} disabled={isLoading} style={btn(out?"var(--disc)":"#0A0F1E","#fff",13)}>
                            {isLoading?"Generating...":(out?"Regenerate":"Generate")}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* INTEGRATIONS */}
          {hubTab==="integrations" && (
            <div style={{maxWidth:600}}>
              <div style={{fontFamily:"var(--font-head)",fontSize:26,letterSpacing:"-0.04em",marginBottom:4}}>Integrations</div>
              <p style={{color:"var(--muted)",fontSize:14,marginBottom:28}}>Connected platforms. The management agent implements changes across these channels.</p>
              <div style={card()}>
                {[
                  {provider:"stripe",   label:"Stripe",                  desc:"Processing $8,400/month",          action:connectStripe, setupLabel:"Connect Stripe"},
                  {provider:"google",   label:"Google Business Profile",  desc:"4.9 stars · 3,200 views/mo",       action:connectGoogle, setupLabel:"Connect Google"},
                  {provider:"netlify",  label:"Netlify — Live Website",   desc:"Management agent deploys here",    action:()=>setHubTab("agents"), setupLabel:"Set up via Agent Pipeline"},
                  {provider:"calendly", label:"Calendly",                 desc:"5 bookings this month",            action:()=>window.open("https://calendly.com","_blank"), setupLabel:"Set up Calendly"},
                ].map(({provider,label,desc,action,setupLabel},i,arr)=>{
                  const connected=isConn(provider);
                  return(
                    <div key={provider} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 0",borderBottom:i<arr.length-1?`1px solid var(--border)`:"none"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        {connected&&<div style={{width:8,height:8,borderRadius:"50%",background:"var(--ok)",flexShrink:0}}/>}
                        <div>
                          <div style={{fontSize:14,fontWeight:500,fontFamily:FB}}>{label}</div>
                          <div style={{fontSize:12,color:connected?"var(--ok)":"var(--muted)",fontFamily:FB}}>{connected?desc:`Not connected — ${desc}`}</div>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:8}}>
                        {connected&&provider!=="netlify"&&<button onClick={()=>disconnect(provider)} style={{...btnO("var(--muted)",12),padding:"6px 12px"}}>Disconnect</button>}
                        <button onClick={action} style={{...btn(connected?"#F3F4F6":"#0A0F1E",connected?"var(--text)":"#D4AF37",12),padding:"7px 14px"}}>
                          {connected?"Manage":setupLabel}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {hubTab==="settings" && (
            <div style={{maxWidth:560}}>
              <div style={{fontFamily:"var(--font-head)",fontSize:26,letterSpacing:"-0.04em",marginBottom:28}}>Settings</div>
              <div style={{...card(),marginBottom:14}}>
                <div style={{fontFamily:"var(--font-head)",fontSize:15,marginBottom:8}}>Automation modes</div>
                <p style={{fontSize:13,color:"var(--muted)",marginBottom:16,lineHeight:1.6}}>Both agents are currently in Full Auto — they analyze and implement without waiting for approval.</p>
                {[["discovery","Discovery"],["creation","Creation"],["marketing","Marketing"],["management","Management"]].map(([key,label],i,arr)=>(
                  <div key={key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:i<arr.length-1?`1px solid var(--border)`:"none"}}>
                    <span style={{fontSize:14,fontFamily:FB}}>{label} agent</span>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{background:modes[key]==="Full auto"?"var(--ok-bg)":modes[key]==="Approve & proceed"?"var(--disc-bg)":"var(--bg)",color:modes[key]==="Full auto"?"var(--ok)":modes[key]==="Approve & proceed"?"var(--disc)":"var(--muted)",fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:20,textTransform:"uppercase",letterSpacing:"0.04em",fontFamily:FB}}>
                        {modes[key]||"Manual"}
                      </span>
                      <button onClick={()=>cycleMode(key)} style={{...btnO("var(--disc)",12),padding:"5px 10px"}}>Change</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {chatOpen&&<GuidePanel messages={chatMsgs} onClose={()=>setChatOpen(false)} onSend={sendChat} businessId={businessId}/>}
      <button onClick={()=>setChatOpen(o=>!o)} style={{background:"#0A0F1E",color:"#D4AF37",border:"1px solid #D4AF3740",borderRadius:24,padding:"10px 20px",fontSize:13,fontWeight:500,cursor:"pointer",position:"fixed",bottom:24,right:chatOpen?336:24,boxShadow:"0 4px 20px #00000020",zIndex:100,transition:"right 0.25s",fontFamily:FB}}>
        Ask analyst
      </button>
    </div>
  );
}
