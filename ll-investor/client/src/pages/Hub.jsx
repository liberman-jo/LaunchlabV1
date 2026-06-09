import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import useStore from "../lib/store";
import { api } from "../lib/api";
import { C, FH, FB, btn, btnO, card, badge, GuidePanel, DownloadBtn, Spinner, ErrorBox } from "../components";

const MODE_CYCLE = ["Manual","Approve & proceed","Full auto"];

function CSSBar({ data, valueKey, labelKey, color="#D4AF37", prefix="$" }) {
  const max = Math.max(...data.map(d=>d[valueKey]),1);
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:8,height:120,paddingTop:8}}>
      {data.map((d,i)=>{
        const pct=(d[valueKey]/max)*100;
        return (
          <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <div style={{fontSize:10,color:"#ffffff50",fontFamily:FB}}>{prefix}{Number(d[valueKey]).toLocaleString()}</div>
            <div style={{width:"100%",background:color,borderRadius:"3px 3px 0 0",height:`${pct}%`,minHeight:4}}/>
            <div style={{fontSize:10,color:"#ffffff40",fontFamily:FB,textAlign:"center"}}>{d[labelKey]}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── LIVE SITE PANEL ───────────────────────────────────────────────────────────
function LiveSitePanel({ businessId }) {
  const [status,       setStatus]       = useState(null);   // null=loading, {deployed,liveUrl,...}
  const [deploying,    setDeploying]    = useState(false);
  const [updating,     setUpdating]     = useState(false);
  const [updateLog,    setUpdateLog]    = useState([]);
  const [instructions, setInstructions] = useState("");
  const [error,        setError]        = useState("");
  const pollRef = useRef(null);

  useEffect(() => {
    api.deploy.status(businessId).then(setStatus).catch(()=>setStatus({deployed:false}));
    return () => clearInterval(pollRef.current);
  }, [businessId]);

  const log = msg => setUpdateLog(p=>[{time:new Date().toLocaleTimeString(),msg},...p].slice(0,8));

  const handleDeploy = async () => {
    setDeploying(true); setError(""); log("Pushing website to Netlify...");
    try {
      const result = await api.deploy.deploy(businessId);
      setStatus(result);
      log(`Live at ${result.liveUrl}`);
    } catch(e) {
      setError(e.message);
      log("Deploy failed: "+e.message);
    }
    setDeploying(false);
  };

  const handleUpdate = async () => {
    setUpdating(true); setError("");
    log("Marketing agent regenerating website content...");
    try {
      const result = await api.deploy.update(businessId, instructions||undefined);
      setStatus(result);
      log(`Updated and live at ${result.liveUrl}`);
      setInstructions("");
    } catch(e) {
      setError(e.message);
      log("Update failed: "+e.message);
    }
    setUpdating(false);
  };

  if (!status) return <div style={{display:"flex",justifyContent:"center",padding:32}}><Spinner color="#D4AF37"/></div>;

  return (
    <div>
      <div style={{fontFamily:"var(--font-head)",fontSize:26,letterSpacing:"-0.04em",marginBottom:4}}>Live Website</div>
      <p style={{color:"var(--muted)",fontSize:14,marginBottom:28}}>
        The marketing agent generates updated content and pushes it to a live Netlify URL — changes are visible within 30 seconds.
      </p>

      {error && <div style={{...card("12px 16px"),background:"var(--err-bg)",border:"1px solid var(--err)25",marginBottom:16,fontSize:13,color:"var(--err)"}}>{error}</div>}

      {/* Setup instructions if NETLIFY_TOKEN not configured */}
      {error?.includes("NETLIFY_TOKEN") && (
        <div style={{...card("16px 20px"),background:"#FEF3C7",border:"1px solid #D9770620",marginBottom:16}}>
          <div style={{fontFamily:"var(--font-head)",fontSize:14,marginBottom:8}}>Add your Netlify token</div>
          <ol style={{fontSize:13,color:"var(--muted)",lineHeight:2,paddingLeft:20}}>
            <li>Go to <a href="https://app.netlify.com/user/applications" target="_blank" rel="noopener noreferrer" style={{color:"var(--disc)"}}>app.netlify.com/user/applications</a></li>
            <li>Personal access tokens → New access token</li>
            <li>Add <code style={{background:"#F3F4F6",padding:"1px 6px",borderRadius:4}}>NETLIFY_TOKEN=your-token</code> to Railway environment variables</li>
            <li>Redeploy the Railway service</li>
          </ol>
        </div>
      )}

      {/* Current deployment status */}
      <div style={{...card("22px 24px"),background:"#0A0F1E",border:"1px solid #D4AF3720",marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:status.deployed?16:0}}>
          <div>
            <div style={{fontSize:10,color:"#ffffff40",textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:FB,marginBottom:8}}>Deployment status</div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:status.deployed?"#4ADE80":"#ffffff30",flexShrink:0,boxShadow:status.deployed?"0 0 8px #4ADE8099":undefined}}/>
              <span style={{fontFamily:"var(--font-head)",fontSize:18,color:status.deployed?"#4ADE80":"#ffffff60"}}>
                {status.deployed?"Live":"Not deployed yet"}
              </span>
            </div>
          </div>
          {!status.deployed && (
            <button onClick={handleDeploy} disabled={deploying} style={{...btn("#D4AF37","#0A0F1E",13),opacity:deploying?0.7:1}}>
              {deploying?"Deploying...":"Deploy to Netlify"}
            </button>
          )}
        </div>

        {status.deployed && status.liveUrl && (
          <>
            <div style={{borderTop:"1px solid #ffffff10",paddingTop:16,marginBottom:16}}>
              <div style={{fontSize:10,color:"#ffffff40",textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:FB,marginBottom:6}}>Live URL</div>
              <a href={status.liveUrl} target="_blank" rel="noopener noreferrer"
                style={{fontFamily:"var(--font-head)",fontSize:20,color:"#D4AF37",letterSpacing:"-0.02em",textDecoration:"none",wordBreak:"break-all"}}>
                {status.liveUrl} ↗
              </a>
              {status.lastDeployed && (
                <div style={{fontSize:11,color:"#ffffff30",marginTop:6,fontFamily:FB}}>
                  Last updated: {new Date(status.lastDeployed).toLocaleString()}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Marketing agent update panel */}
      {status.deployed && (
        <div style={card()}>
          <div style={{fontFamily:"var(--font-head)",fontSize:16,marginBottom:6}}>Update website with marketing agent</div>
          <p style={{fontSize:13,color:"var(--muted)",lineHeight:1.65,marginBottom:20}}>
            The AI regenerates the website content and pushes it live automatically. Give it direction or leave blank for a general refresh. Changes are visible at the live URL within 30 seconds.
          </p>

          <div style={{marginBottom:14}}>
            <label style={{fontSize:12,fontWeight:600,color:"var(--muted)",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>
              Update instructions (optional)
            </label>
            <textarea
              value={instructions}
              onChange={e=>setInstructions(e.target.value)}
              placeholder="e.g. Add a holiday promotion — 20% off in January. Emphasize the Growth package. Add a new testimonial from a coffee shop client."
              rows={3}
              style={{width:"100%",padding:"12px 14px",borderRadius:8,border:"1.5px solid var(--border)",fontSize:14,fontFamily:FB,color:"var(--text)",background:"var(--surface)",outline:"none",boxSizing:"border-box",resize:"vertical",lineHeight:1.6}}
            />
          </div>

          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            <button onClick={handleUpdate} disabled={updating} style={{...btn(updating?"#6B7280":"#0A0F1E","#D4AF37",14),opacity:updating?0.8:1,display:"flex",alignItems:"center",gap:10}}>
              {updating && <span style={{width:14,height:14,borderRadius:"50%",border:"2px solid #D4AF3750",borderTopColor:"#D4AF37",animation:"spin 0.7s linear infinite",flexShrink:0}}/>}
              {updating?"Regenerating and deploying...":"Update live website"}
            </button>
            <button onClick={handleDeploy} disabled={deploying} style={{...btnO("var(--muted)",13),opacity:deploying?0.7:1}}>
              {deploying?"Redeploying...":"Redeploy current version"}
            </button>
          </div>

          {/* Activity log */}
          {updateLog.length>0 && (
            <div style={{marginTop:20,padding:"14px 16px",background:"#F8F8F8",borderRadius:8,border:"1px solid var(--border)"}}>
              <div style={{fontSize:11,fontWeight:600,color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>Deploy log</div>
              {updateLog.map((entry,i)=>(
                <div key={i} style={{display:"flex",gap:10,fontSize:12,fontFamily:"monospace",color:i===0?"var(--text)":"var(--muted)",marginBottom:4}}>
                  <span style={{color:"var(--subtle)",flexShrink:0}}>{entry.time}</span>
                  <span>{entry.msg}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── MAIN HUB ──────────────────────────────────────────────────────────────────
export default function Hub() {
  const { id: businessId } = useParams();
  const [searchParams]  = useSearchParams();
  const { user, hubModes, setHubMode } = useStore();
  const [business,   setBusiness]   = useState(null);
  const [outputs,    setOutputs]    = useState([]);
  const [integs,     setIntegs]     = useState([]);
  const [metrics,    setMetrics]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [genLoading, setGenLoading] = useState({});
  const [genError,   setGenError]   = useState("");
  const [hubTab,     setHubTab]     = useState(searchParams.get("tab")||"overview");
  const [chatOpen,   setChatOpen]   = useState(false);
  const [chatMsgs,   setChatMsgs]   = useState([{role:"ai",text:"Welcome to the LocalPulse Media dashboard. This is a live demo — all data reflects a real operating business. Ask me anything."}]);
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

  const idea   = (()=>{try{return JSON.parse(business?.ideaData||"{}");}catch{return {};}})();
  const getOutput = type => outputs.find(o=>o.type===type);
  const isConn = p => integs.find(i=>i.provider===p)?.status==="connected";

  const generate = async (type, apiCall) => {
    setGenLoading(p=>({...p,[type]:true})); setGenError("");
    try {
      const result = await apiCall(businessId);
      const {output} = result;
      setOutputs(p=>{const ex=p.find(o=>o.type===type);return ex?p.map(o=>o.type===type?output:o):[...p,output];});
    } catch(e){setGenError(e.message);}
    finally{setGenLoading(p=>({...p,[type]:false}));}
  };

  const connectStripe = async()=>{try{const{url}=await api.integrations.stripe(businessId);window.open(url,"_blank");}catch(e){setGenError(e.message);}};
  const connectGoogle = async()=>{try{const{url}=await api.integrations.googleAuth(businessId);window.open(url,"_blank");}catch(e){setGenError(e.message);}};
  const disconnect    = async p=>{await api.integrations.disconnect(businessId,p).catch(()=>{});setIntegs(prev=>prev.map(i=>i.provider===p?{...i,status:"disconnected"}:i));};
  const cycleMode     = stage=>{const cur=modes[stage]||"Manual";setHubMode(businessId,stage,MODE_CYCLE[(MODE_CYCLE.indexOf(cur)+1)%MODE_CYCLE.length]);};
  const sendChat      = async msg=>{setChatMsgs(p=>[...p,{role:"user",text:msg}]);try{const{reply}=await api.generate.chat(msg,businessId);setChatMsgs(p=>[...p,{role:"ai",text:reply}]);}catch{setChatMsgs(p=>[...p,{role:"ai",text:"Sorry, couldn't process that."}]);}};

  if(loading) return <div style={{display:"flex",minHeight:"100vh",alignItems:"center",justifyContent:"center",background:"#0A0F1E"}}><Spinner color="#D4AF37"/></div>;

  const navItems=[
    {id:"overview",    label:"Overview"},
    {id:"performance", label:"Performance"},
    {id:"clients",     label:"Clients"},
    {id:"live-site",   label:"Live Site ↗"},
    {id:"content",     label:"Content"},
    {id:"integrations",label:"Integrations"},
    {id:"settings",    label:"Settings"},
  ];

  return (
    <div style={{display:"flex",minHeight:"100vh",fontFamily:FB}}>
      {/* Dark sidebar */}
      <div style={{width:220,background:"#0A0F1E",display:"flex",flexDirection:"column",flexShrink:0,borderRight:"1px solid #ffffff08"}}>
        <div style={{padding:"22px 20px 16px",borderBottom:"1px solid #ffffff08"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:"#D4AF37"}}/>
            <span style={{fontFamily:"var(--font-head)",fontSize:14,color:"#fff",letterSpacing:"0.02em"}}>LaunchLab Pro</span>
          </div>
          <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:15,color:"#fff",marginBottom:4,lineHeight:1.2}}>{business?.name}</div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:"#4ADE80"}}/>
            <span style={{fontSize:11,color:"#ffffff40"}}>{business?.location}</span>
          </div>
          {business?.name==="LocalPulse Media"&&<div style={{marginTop:8,background:"#D4AF3720",border:"1px solid #D4AF3740",borderRadius:6,padding:"3px 8px",fontSize:10,color:"#D4AF37",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",display:"inline-block"}}>Live demo</div>}
        </div>
        <nav style={{padding:"12px 8px",flex:1}}>
          {navItems.map(({id,label})=>(
            <div key={id} onClick={()=>setHubTab(id)} style={{padding:"9px 12px",borderRadius:7,marginBottom:2,background:hubTab===id?"#ffffff12":"transparent",color:hubTab===id?"#fff":id==="live-site"?"#D4AF37":"#ffffff45",cursor:"pointer",fontSize:13,fontWeight:hubTab===id?500:400,fontFamily:FB,transition:"all 0.12s",border:id==="live-site"?"1px solid #D4AF3730":"1px solid transparent"}}>
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
          <ErrorBox msg={genError} onRetry={()=>setGenError("")}/>

          {/* LIVE SITE */}
          {hubTab==="live-site" && <LiveSitePanel businessId={businessId}/>}

          {/* OVERVIEW */}
          {hubTab==="overview" && metrics && (
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28}}>
                <div>
                  <div style={{fontFamily:"var(--font-head)",fontSize:26,letterSpacing:"-0.04em",marginBottom:4}}>Business Overview</div>
                  <div style={{fontSize:13,color:"var(--muted)"}}>LocalPulse Media &middot; December 2024 &middot; Month 7</div>
                </div>
                <button onClick={()=>setHubTab("live-site")} style={{...btn("#0A0F1E","#D4AF37",13)}}>View live site ↗</button>
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
                  <div style={{fontSize:13,fontWeight:500,color:"#fff",marginBottom:4,fontFamily:FB}}>MRR Growth</div>
                  <div style={{fontSize:11,color:"#ffffff40",marginBottom:20,fontFamily:FB}}>7-month trend</div>
                  <CSSBar data={metrics.revenue.mrr_trend.map((v,i)=>({amount:v,month:metrics.revenue.mrr_labels[i]}))} valueKey="amount" labelKey="month" color="#D4AF37"/>
                </div>
                <div style={{background:"#0A0F1E",borderRadius:12,padding:"22px 24px",border:"1px solid #ffffff08"}}>
                  <div style={{fontSize:13,fontWeight:500,color:"#fff",marginBottom:4,fontFamily:FB}}>This week</div>
                  <div style={{fontSize:11,color:"#ffffff40",marginBottom:20,fontFamily:FB}}>Weekly revenue</div>
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
                      <div style={{flex:1}}>
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
              <div style={{fontSize:13,color:"var(--muted)",marginBottom:28}}>Social media, marketing, and operations</div>
              {[
                {title:"Social Media", items:[
                  {label:"Instagram followers",  value:metrics.social.instagram_followers.toLocaleString(),sub:`+${metrics.social.instagram_growth_30d}% this month`},
                  {label:"Avg engagement rate",  value:`${metrics.social.avg_engagement_rate}%`,          sub:"Industry avg: 1.9%"},
                  {label:"Avg Reel views",        value:metrics.social.reels_avg_views.toLocaleString(), sub:"Per Reel"},
                  {label:"Posts this month",      value:metrics.social.posts_this_month,                 sub:"Across all clients"},
                  {label:"Top post reach",        value:metrics.social.top_post_reach.toLocaleString(),  sub:"Single post"},
                  {label:"Stories completion",    value:`${metrics.social.stories_completion_rate}%`,    sub:"Completion rate"},
                ]},
                {title:"Marketing & Leads", items:[
                  {label:"Total reach (30d)",    value:metrics.marketing.total_reach_30d.toLocaleString(),    sub:"People reached"},
                  {label:"Leads generated",      value:metrics.marketing.leads_generated,                     sub:"Strategy calls requested"},
                  {label:"Calls booked",         value:metrics.marketing.strategy_calls_booked,               sub:"From marketing"},
                  {label:"Lead conversion",      value:`${metrics.marketing.conversion_rate_pct}%`,           sub:"Lead to paying client"},
                  {label:"Google views",         value:metrics.marketing.google_profile_views.toLocaleString(),sub:"Profile views"},
                  {label:"Google calls",         value:metrics.marketing.google_calls,                        sub:"Calls generated"},
                ]},
              ].map(({title,items})=>(
                <div key={title} style={{marginBottom:28}}>
                  <div style={{fontFamily:"var(--font-head)",fontSize:16,marginBottom:14}}>{title}</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
                    {items.map(({label,value,sub})=>(
                      <div key={label} style={card()}>
                        <div style={{fontSize:10,color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6,fontFamily:FB}}>{label}</div>
                        <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:26,letterSpacing:"-0.04em",marginBottom:4}}>{value}</div>
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
              <div style={{fontSize:13,color:"var(--muted)",marginBottom:28}}>{metrics.clients.active} active &middot; {metrics.clients.pipeline} in pipeline &middot; {metrics.clients.retention_rate}% retention</div>
              <div style={card()}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead>
                    <tr style={{borderBottom:`1px solid var(--border)`}}>
                      {["Client","Package","MRR","Client since","Status"].map(h=>(
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
              <p style={{color:"var(--muted)",fontSize:14,marginBottom:28}}>AI-generated assets — download, deploy, or regenerate.</p>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {[
                  {type:"website",       label:"Business Website",       desc:"Deploy to Netlify in one click from the Live Site tab.",           apiCall:api.generate.website,       ext:".html",mime:"text/html"},
                  {type:"business_plan", label:"Business Plan",          desc:"Full business plan with P&L projections and 90-day action plan.",  apiCall:api.generate.businessPlan,  ext:".html",mime:"text/html"},
                  {type:"social_content",label:"30-Day Social Calendar", desc:"30 posts with captions and hashtags for LinkedIn and Instagram.", apiCall:api.generate.socialContent, ext:".json",mime:"application/json"},
                  {type:"email_templates",label:"Email Templates",       desc:"8 professional templates — welcome, reminders, follow-ups.",       apiCall:api.generate.emailTemplates,ext:".json",mime:"application/json"},
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
              <p style={{color:"var(--muted)",fontSize:14,marginBottom:28}}>Connected platforms powering the business.</p>
              <div style={card()}>
                {[
                  {provider:"stripe",   label:"Stripe",                  desc:"Processing $8,400/month in recurring revenue",     action:connectStripe, setupLabel:"Connect Stripe"},
                  {provider:"google",   label:"Google Business Profile",  desc:"4.9 stars · 3,200 profile views this month",       action:connectGoogle, setupLabel:"Connect Google"},
                  {provider:"netlify",  label:"Netlify",                  desc:"Live website deployment and updates",               action:()=>setHubTab("live-site"), setupLabel:"Set up live site"},
                  {provider:"calendly", label:"Calendly",                 desc:"5 strategy calls booked this month",               action:()=>window.open("https://calendly.com","_blank"), setupLabel:"Set up Calendly"},
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
                <div style={{fontFamily:"var(--font-head)",fontSize:15,marginBottom:18}}>Automation modes</div>
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
