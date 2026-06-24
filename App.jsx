import React, { useState, useEffect, useCallback, useRef } from "react";
import { Flower } from "./src/components/Decorations";
import { auth, db, groqFetch, fsGet, fsSet, fsDelete, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "./src/config/firebase.js";
import { T } from "./src/config/theme.js";
import { APPT_TYPES, LEVELS, TECHNIQUES, KNOWLEDGE, DE_DAYS, DE_DAYS_F, DE_MONTHS, HOURS } from "./src/config/constants.js";
import { uid } from "./src/config/helpers.js";

import { NAV, BottomNav, Card, Btn, TI, Select, LBar, Pill, SL } from "./src/components/UI.jsx";
import { BodygraphSVG, HDTab } from "./src/components/HumanDesign.jsx";
import { LoginScreen } from "./src/screens/Login.jsx";
import Dashboard from "./src/screens/Dashboard.jsx";
import { Clients, ClientDetailModal, SynergyEngine } from "./src/screens/Clients.jsx";
import { Session } from "./src/screens/Session.jsx";
import { CalendarScreen } from "./src/screens/Calendar.jsx";
import { History } from "./src/screens/History.jsx";
import { Knowledge } from "./src/screens/Knowledge.jsx";
import { Analytics } from "./src/screens/Analytics.jsx";
import { ClientAnalysis } from "./src/screens/ClientAnalysis.jsx";
import { Billing } from "./src/screens/Billing.jsx";
import { TemplatesScreen } from "./src/screens/Templates.jsx";
import { OnboardingScreen } from "./src/screens/Onboarding.jsx";
import { PinLock, SettingsScreen } from "./src/screens/Settings.jsx";
import { GenTree } from "./src/screens/GenTree.jsx";
import { PDFModal } from "./src/screens/PDFModal.jsx";
import OracleAgent from "./src/oracle/OracleAgent.jsx";

const SIDEBAR_SECTIONS = [
  { label: "Praxis", items: [
    { id: "dashboard", label: "Dashboard", icon: "◉" },
    { id: "clients", label: "Klienten", icon: "◈" },
    { id: "calendar", label: "Kalender", icon: "◷" },
    { id: "session", label: "Sitzungen", icon: "✦", isSession: true },
    { id: "billing", label: "Abrechnung", icon: "◈" },
  ]},
  { label: "Resonanz", items: [
    { id: "humandesign", label: "Human Design", icon: "⬡" },
    { id: "synergy", label: "Numerologie", icon: "✧" },
    { id: "oracle", label: "Resonanz-Analyse", icon: "✦" },
    { id: "gentree", label: "Resonanzkarte", icon: "⊛" },
  ]},
  { label: "Analyse", items: [
    { id: "analytics", label: "Analytics", icon: "⊕" },
    { id: "history", label: "Verlauf", icon: "◎" },
  ]},
];

function Root() {
  const [user, setUser] = useState(undefined); // undefined = loading, null = logged out
  const [showOracle, setShowOracle] = useState(false);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u || null));
    return unsub;
  }, []);

  if (user === undefined) return (
    <div style={{background:T.bg,height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"16px"}}>
      <div style={{width:"70px",height:"70px",borderRadius:"50%",background:`linear-gradient(135deg,${T.gold},${T.goldD})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"30px",boxShadow:`0 6px 28px ${T.shadowDeep}`,border:`1.5px solid ${T.border}`}}>✦</div>
      <div style={{fontFamily:"Raleway",fontSize:"12px",color:T.textMid,letterSpacing:"3px",fontWeight:700}}>LICHTKERN</div>
    </div>
  );
  if (!user) return <LoginScreen onLogin={setUser} />;
  return <App user={user} onLogout={async()=>{ await signOut(auth); setUser(null); }} />;
}



// ─── MAIN APP ─────────────────────────────────
function App({ user, onLogout }){
  const [showOracle, setShowOracle] = useState(false);
  const [screen,setScreen]           = useState("dashboard");
  const [clients,setClients]         = useState([]);
  const [sessions,setSessions]       = useState([]);
  const [appointments,setAppts]      = useState([]);
  const [wizard,setWizard]           = useState(null);
  const [genTrees,setGenTrees]       = useState({});
  const [templates,setTemplates]     = useState([]);
  const [reminders,setReminders]     = useState([]);
  const [analyticsClient,setAnalyticsClient] = useState(null);
  const [settings,setSettings]       = useState({theme:'kristallwasser',currency:'CHF',defaultDuration:'60',autoLock:'5',pinEnabled:false,praxisname:'',subtitle:'',therapistName:'',defaultFee:'',disclaimer:'',});
  const [showSettings,setShowSettings] = useState(false);
  const [locked,setLocked]           = useState(false);
  const [ready,setReady]             = useState(false);
  const [isDesktop, setIsDesktop]    = useState(window.innerWidth >= 900);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(()=>{
    const handler = ()=>setIsDesktop(window.innerWidth>=900);
    window.addEventListener("resize",handler);
    return ()=>window.removeEventListener("resize",handler);
  },[]);

  useEffect(()=>{
    if(!document.querySelector("#lk-fonts")){const l=document.createElement("link");l.id="lk-fonts";l.rel="stylesheet";l.href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Raleway:wght@400;500;600;700;800&display=swap";document.head.appendChild(l);}
  },[]);

  useEffect(()=>{(async()=>{
    const uid = user.uid;
    try{const d=await fsGet(uid,"lk_clients"); if(d)setClients(JSON.parse(d.value));}catch{}
    try{const d=await fsGet(uid,"lk_sessions");if(d)setSessions(JSON.parse(d.value));}catch{}
    try{const d=await fsGet(uid,"lk_appts");   if(d)setAppts(JSON.parse(d.value));}catch{}
    try{const d=await fsGet(uid,"lk_gentrees"); if(d)setGenTrees(JSON.parse(d.value));}catch{}
    try{const d=await fsGet(uid,"lk_templates");if(d)setTemplates(JSON.parse(d.value));}catch{}
    try{const d=await fsGet(uid,"lk_reminders");if(d)setReminders(JSON.parse(d.value));}catch{}
  try{const d=await fsGet(uid,"lk_settings"); if(d){const s=JSON.parse(d.value);setSettings(s);if(s.pinEnabled)setLocked(true);}}catch{}
    setReady(true);
  })();},[user.uid]);

  const saveClients = async c=>{setClients(c);  try{await fsSet(user.uid,"lk_clients", JSON.stringify(c));}catch{}};
  const saveSessions= async s=>{setSessions(s); try{await fsSet(user.uid,"lk_sessions",JSON.stringify(s));}catch{}};
  const saveAppt    = async a=>{const next=appointments.find(x=>x.id===a.id)?appointments.map(x=>x.id===a.id?a:x):[...appointments,a];setAppts(next);try{await fsSet(user.uid,"lk_appts",JSON.stringify(next));}catch{}};
  const saveSettings = async s=>{setSettings(s);try{await fsSet(user.uid,"lk_settings",JSON.stringify(s));}catch{}};
  const saveTemplates= async t=>{setTemplates(t);try{await fsSet(user.uid,"lk_templates",JSON.stringify(t));}catch{}};
  const saveReminders= async r=>{setReminders(r);try{await fsSet(user.uid,"lk_reminders",JSON.stringify(r));}catch{}};
  const addReminder  = async r=>{const next=[...reminders,{...r,id:uid(),createdAt:new Date().toISOString()}];await saveReminders(next);};
  const dismissReminder=async id=>{const next=reminders.map(r=>r.id===id?{...r,dismissed:true}:r);await saveReminders(next);};
  const saveGenTree  = async(clientId,tree)=>{const next={...genTrees,[clientId]:tree};setGenTrees(next);try{await fsSet(user.uid,"lk_gentrees",JSON.stringify(next));}catch{}};
  const deleteAppt  = async id=>{const next=appointments.filter(a=>a.id!==id);setAppts(next);try{await fsSet(user.uid,"lk_appts",JSON.stringify(next));}catch{}};

  const startSession=(client=null,template=null)=>{
    const tpl=template||{};
    setWizard({step:0,type:tpl.type||client?.type||"first",levels:tpl.levels||{},techniques:tpl.techniques||[],goal:tpl.goal||client?.goal||"",outcome:"",homework:tpl.homework||"",notes:tpl.notes||"",resonanceSource:tpl.resonanceSource||"Intuition",clientName:client?.name||"",clientId:client?.clientId||null,category:tpl.category||"",templateName:tpl.name||""});
    setScreen("session");
  };
  const completeSession=async data=>{
    await saveSessions([{id:uid(),createdAt:new Date().toISOString(),...data},...sessions]);
    setWizard(null);setScreen("history");
  };
  const nav=id=>{if(id==="session"){startSession();return;}setScreen(id);};

 if(locked)return<PinLock mode="enter" onSuccess={()=>setLocked(false)} onSetup={()=>{}} onLogout={async()=>{await saveSettings({...settings,pinEnabled:false});onLogout();}} userId={user.uid}/>;
  if(!ready)return(<div style={{background:T.bg,height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"16px"}}>
    <div style={{width:"70px",height:"70px",borderRadius:"50%",background:`linear-gradient(135deg,${T.gold},${T.goldD})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"30px",boxShadow:`0 6px 28px ${T.shadowDeep}`,border:`1.5px solid ${T.border}`}}>✦</div>
    <div style={{fontFamily:"Raleway",fontSize:"12px",color:T.textMid,letterSpacing:"3px",fontWeight:700}}>LICHTKERN</div>
  </div>);

 
  return(<div style={{background:"#111111",minHeight:"100vh",display:"flex",flexDirection:"row"}}>
    {/* Desktop sidebar */}
    {isDesktop && (
  <div style={{width:sidebarCollapsed?68:200,flexShrink:0,background:"#0F0F0F",borderRight:"0.5px solid rgba(201,168,76,0.15)",display:"flex",flexDirection:"column",position:"fixed",top:0,left:0,bottom:0,zIndex:100,transition:"width 0.25s ease",overflow:"hidden"}}>
    <div style={{display:"flex",alignItems:"center",gap:10,padding:sidebarCollapsed?"20px 16px":"20px 18px"}}>
      <div style={{width:36,height:36,borderRadius:"50%",flexShrink:0,background:"radial-gradient(circle,rgba(201,168,76,0.35) 0%,transparent 70%)",border:"1px solid rgba(201,168,76,0.35)",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
        <img src="/logo-siegel.png" alt="Human Resonanz" style={{width:"100%",height:"100%",objectFit:"contain"}} />
      </div>
      <div style={{fontFamily:"Raleway",fontSize:14,fontWeight:700,color:"rgba(245,240,232,0.85)",letterSpacing:1,whiteSpace:"nowrap",opacity:sidebarCollapsed?0:1,transition:"opacity 0.2s",overflow:"hidden",width:sidebarCollapsed?0:"auto"}}>Lichtkern</div>
    </div>
    <div style={{flex:1,padding:"4px 0",overflowY:"auto"}}>
      {SIDEBAR_SECTIONS.map((sec,si)=>(
        <div key={si} style={{marginBottom:4,marginTop:si>0?18:0}}>
          <div style={{fontFamily:"Raleway",fontSize:9,fontWeight:700,letterSpacing:2,color:"rgba(201,168,76,0.6)",textTransform:"uppercase",padding:sidebarCollapsed?"0":"0 18px 6px",opacity:sidebarCollapsed?0:1,height:sidebarCollapsed?0:"auto",overflow:"hidden",transition:"opacity 0.2s"}}>{sec.label}</div>
          {sec.items.map(item=>{
            const isA=screen===item.id;
            return <button key={item.id} onClick={()=>item.isSession?startSession():nav(item.id)} style={{display:"flex",alignItems:"center",gap:12,padding:sidebarCollapsed?"10px 0":"9px 18px",justifyContent:sidebarCollapsed?"center":"flex-start",width:"100%",border:"none",background:isA?"rgba(201,168,76,0.08)":"transparent",color:isA?"#C9A84C":"rgba(245,240,232,0.75)",cursor:"pointer",fontFamily:"Raleway",fontWeight:700,fontSize:13,textAlign:"left",transition:"all 0.15s",borderRadius:sidebarCollapsed?0:"0 12px 12px 0",marginRight:sidebarCollapsed?0:8,marginBottom:1}}>
              <span style={{fontSize:17,width:22,textAlign:"center",flexShrink:0,filter:isA?"none":"grayscale(1) brightness(1.5)"}}>{item.icon}</span>
              <span style={{whiteSpace:"nowrap",overflow:"hidden",opacity:sidebarCollapsed?0:1,width:sidebarCollapsed?0:"auto",transition:"opacity 0.2s"}}>{item.label}</span>
              {isA&&!sidebarCollapsed&&<div style={{marginLeft:"auto",width:6,height:6,borderRadius:"50%",background:"#C9A84C",flexShrink:0}}/>}
            </button>;
          })}
        </div>
      ))}
    </div>
    <div style={{borderTop:"1px solid rgba(201,168,76,0.1)",padding:"8px 0 12px"}}>
      <button onClick={()=>setShowSettings(true)} style={{display:"flex",alignItems:"center",gap:12,padding:sidebarCollapsed?"10px 0":"10px 18px",justifyContent:sidebarCollapsed?"center":"flex-start",width:"100%",border:"none",background:"transparent",color:"rgba(245,240,232,0.5)",cursor:"pointer",fontFamily:"Raleway",fontWeight:700,fontSize:13,transition:"all 0.15s"}}>
        <span style={{fontSize:17,width:22,textAlign:"center",opacity:0.65}}>⚙</span>
        <span style={{opacity:sidebarCollapsed?0:1,width:sidebarCollapsed?0:"auto",overflow:"hidden",whiteSpace:"nowrap",transition:"opacity 0.2s"}}>Einstellungen</span>
      </button>
      <button onClick={()=>setSidebarCollapsed(!sidebarCollapsed)} style={{display:"flex",alignItems:"center",justifyContent:"center",width:"100%",padding:"8px 0",border:"none",background:"transparent",color:"rgba(245,240,232,0.2)",cursor:"pointer",fontSize:16,transition:"all 0.15s"}}>
        {sidebarCollapsed?"»":"«"}
      </button>
    </div>
  </div>
    )}

    {/* Main content */}
    <div style={{flex:1,marginLeft:isDesktop?(sidebarCollapsed?68:200)+"px":"0",minWidth:0}}>
      <div style={{position:"fixed",top:"-60px",right:"-60px",width:"280px",height:"280px",borderRadius:"50%",background:`radial-gradient(circle,${T.goldL} 0%,transparent 70%)`,pointerEvents:"none",zIndex:0,opacity:0.35}}/>
      <div style={{position:"fixed",bottom:"12%",left:isDesktop?"200px":"-50px",width:"220px",height:"220px",borderRadius:"50%",background:`radial-gradient(circle,${T.goldL} 0%,transparent 70%)`,pointerEvents:"none",zIndex:0,opacity:0.25}}/>
      <div style={{position:"relative",zIndex:1,paddingTop:"12px",maxWidth:isDesktop?"none":"480px",margin:"0 auto"}}>
        {/* Mobile header */}
        
        {/* Brand hero banner - left: greeting+praxis, center: LICHTKERN+flower */}
       
      
        <div style={{padding:isDesktop?"0 32px":"0"}}>
      {screen==="dashboard"&&<Dashboard clients={clients} sessions={sessions} appointments={appointments} onNav={nav} reminders={reminders} onDismissReminder={dismissReminder} onAddReminder={addReminder} settings={settings}/>}
      {screen==="clients"  &&<Clients settings={settings} clients={clients} sessions={sessions} onSave={saveClients} onStart={startSession} onDelete={async(id)=>{await saveClients(clients.filter(c=>c.id!==id));await saveSessions(sessions.filter(s=>s.clientId!==id));const nextAppts=appointments.filter(a=>a.clientId!==id);setAppts(nextAppts);try{await fsSet(user.uid,"lk_appts",JSON.stringify(nextAppts));}catch{};const nt={...genTrees};delete nt[id];setGenTrees(nt);try{await fsSet(user.uid,"lk_gentrees",JSON.stringify(nt));}catch{};}} onOnboarding={()=>nav("onboarding")} reminders={reminders} onAddReminder={addReminder} onDismissReminder={dismissReminder} onAnalyse={(id)=>{setAnalyticsClient(id);nav("clientanalysis");}}/>}
      {screen==="session"  &&<Session wizard={wizard} setWizard={setWizard} clients={clients} onComplete={completeSession} onCancel={()=>{setWizard(null);setScreen("dashboard");}} templates={templates} onStartWithTemplate={(tpl)=>startSession(null,tpl)}/>}
      {screen==="calendar" &&<CalendarScreen appointments={appointments} clients={clients} onSaveAppt={saveAppt} onDeleteAppt={deleteAppt} onStartSession={startSession}/>}
      {screen==="gentree"   &&<GenTree clients={clients} genTrees={genTrees} onSaveTree={saveGenTree}/>}
      {screen==="synergy"    &&<SynergyEngine clients={clients} onBack={()=>setScreen("clients")}/>}
      {screen==="history"   &&<History sessions={sessions} onDelete={id=>{saveSessions(sessions.filter(s=>s.id!==id));}}/>}
      {screen==="analytics" &&<Analytics sessions={sessions} clients={clients} onSelectClient={(id)=>{setAnalyticsClient(id);setScreen("clientanalysis");}}/>}
      {screen==="clientanalysis"&&<ClientAnalysis clientId={analyticsClient} clients={clients} sessions={sessions} onBack={()=>setScreen("analytics")}/>}
      {screen==="knowledge"&&<Knowledge/>}
     {screen==="oracle"&&<OracleAgent onClose={()=>setScreen("dashboard")}/>}
      {screen==="humandesign"&&<div style={{padding:"40px 20px",textAlign:"center"}}><div style={{fontFamily:"Cinzel",fontSize:"20px",color:"#C9A84C",marginBottom:"12px"}}>Human Design</div><div style={{fontFamily:"Raleway",fontSize:"13px",color:"rgba(245,240,232,0.5)"}}>Wähle einen Klienten um dessen Bodygraph zu sehen</div><button onClick={()=>nav("clients")} style={{marginTop:"20px",fontFamily:"Raleway",fontSize:"13px",fontWeight:700,padding:"10px 24px",borderRadius:"12px",border:"1px solid rgba(201,168,76,0.3)",background:"rgba(201,168,76,0.1)",color:"#C9A84C",cursor:"pointer"}}>Zu den Klienten</button></div>}
      {screen==="billing"   &&<Billing sessions={sessions} clients={clients} settings={settings} onUpdateSession={async(updated)=>{const next=sessions.map(s=>s.id===updated.id?updated:s);await saveSessions(next);}}/>}
      {screen==="templates" &&<TemplatesScreen templates={templates} onSave={saveTemplates} onStartSession={(tpl)=>startSession(null,tpl)}/>}
      {screen==="onboarding" &&<OnboardingScreen onSave={async(client)=>{await saveClients([...clients,client]);nav("clients");}} onCancel={()=>nav("clients")}/>}
      {showSettings&&<SettingsScreen settings={settings} onSave={saveSettings} onClose={()=>setShowSettings(false)} clients={clients} sessions={sessions} appointments={appointments} genTrees={genTrees} reminders={reminders} templates={templates} onImport={async(data)=>{if(data.clients)await saveClients(data.clients);if(data.sessions)await saveSessions(data.sessions);if(data.appointments){setAppts(data.appointments);try{await fsSet(user.uid,"lk_appts",JSON.stringify(data.appointments));}catch{}}if(data.genTrees){setGenTrees(data.genTrees);try{await fsSet(user.uid,"lk_gentrees",JSON.stringify(data.genTrees));}catch{}}if(data.reminders){setReminders(data.reminders);try{await fsSet(user.uid,"lk_reminders",JSON.stringify(data.reminders));}catch{}}if(data.templates){setTemplates(data.templates);try{await fsSet(user.uid,"lk_templates",JSON.stringify(data.templates));}catch{}}if(data.settings)await saveSettings(data.settings);}} onLogout={onLogout}/>}
        </div>
      </div>
    </div>
  
    {!isDesktop&&<BottomNav active={screen} onChange={nav}/>}
    
  </div>);
}

export default Root;
