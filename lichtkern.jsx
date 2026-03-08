import { useState, useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";

// ─── FIREBASE CONFIG ──────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDPxV2D36zoCawfSM4C-x3jlcW-Pu5L1n4",
  authDomain: "lichtkern-43757.firebaseapp.com",
  projectId: "lichtkern-43757",
  storageBucket: "lichtkern-43757.firebasestorage.app",
  messagingSenderId: "72774063015",
  appId: "1:72774063015:web:4e9457a91d6ad49f1f5c82",
  measurementId: "G-8PLHVC81YQ"
};
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db   = getFirestore(firebaseApp);

// ─── FIRESTORE STORAGE (ersetzt window.storage) ──
const fsGet = async (userId, key) => {
  try {
    const snap = await getDoc(doc(db, "users", userId, "data", key));
    if (snap.exists()) return { value: snap.data().value };
    return null;
  } catch { return null; }
};
const fsSet = async (userId, key, value) => {
  try { await setDoc(doc(db, "users", userId, "data", key), { value }); } catch {}
};
const fsDelete = async (userId, key) => {
  try { await deleteDoc(doc(db, "users", userId, "data", key)); } catch {}
};

// ─── KRISTALLWASSER TOKENS ───────────────────
const T = {
  bg:"#F0FAFA", bgCard:"#FFFFFF", bgSoft:"#E6F7F7", bgSofter:"#F5FDFD",
  border:"#B2E0DC", borderMid:"#7EC8C2",
  text:"#0F3030", textMid:"#2D6B68", textSoft:"#6AABA7",
  teal:"#0D9488", tealL:"#CCFBF1", tealD:"#0F6B63",
  violet:"#6D3FCC", violetL:"#EDE9FE", violetD:"#4C1D95",
  gold:"#D97706", goldL:"#FEF3C7",
  shadow:"rgba(13,148,136,0.12)", shadowDeep:"rgba(13,148,136,0.22)",
};

// ─── APPOINTMENT TYPES ───────────────────────
const APPT_TYPES = {
  session:  { label:"Klienten-Sitzung", color:"#0D9488", bg:"#CCFBF1", border:"#7EC8C2", dot:"#0D9488" },
  first:    { label:"Erstgespräch",     color:"#6D3FCC", bg:"#EDE9FE", border:"#A78BFA", dot:"#6D3FCC" },
  followup: { label:"Folgetermin",      color:"#0A3B20", bg:"#DCFCE7", border:"#4ADE80", dot:"#16A34A" },
  pause:    { label:"Pause / Blocker",  color:"#4A3B2A", bg:"#FEF3C7", border:"#F59E0B", dot:"#D97706" },
  training: { label:"Training",         color:"#0A2A50", bg:"#DBEAFE", border:"#60A5FA", dot:"#2563EB" },
  other:    { label:"Sonstiges",        color:"#3D2B6B", bg:"#F3E8FF", border:"#C084FC", dot:"#9333EA" },
};

const LEVELS = [
  {key:"struktur",name:"Struktur",icon:"🌍",bg:"#FEF9EC",border:"#D9A84E",bar:"#B07D2A",text:"#4A2E00"},
  {key:"stoffwechsel",name:"Stoffwechsel",icon:"🔥",bg:"#FFF1EE",border:"#E8836A",bar:"#C05A3E",text:"#4A1500"},
  {key:"energetisch",name:"Energetisch",icon:"⚡",bg:"#E6FAF7",border:"#2CB8AA",bar:"#0D9488",text:"#0A3B37"},
  {key:"emotional",name:"Emotional",icon:"💚",bg:"#EDFAF2",border:"#4DC98A",bar:"#17956A",text:"#0A3B20"},
  {key:"mental",name:"Mental",icon:"🌟",bg:"#FDFBE8",border:"#C8B040",bar:"#9A820A",text:"#3A2E00"},
  {key:"spirituell",name:"Spirituell",icon:"🔮",bg:"#F0EDFC",border:"#9B7EE0",bar:"#6D3FCC",text:"#2A1660"},
  {key:"universell",name:"Universell",icon:"🌌",bg:"#F5EFFE",border:"#B890EC",bar:"#8B4ED4",text:"#3A1260"},
  {key:"dna",name:"DNA / Ahnen",icon:"🧬",bg:"#EAF4FE",border:"#6BAEE8",bar:"#2C7FD4",text:"#0A2A50"},
];

const TECHNIQUES = {
  "Analyse & Anamnese":["Energetische Anamnese","Belastungstest","Muster-Check","Resonanz-Check"],
  "Meridian & Chakren":["Chakren-Balance","Meridian-Ausgleich","Reinigung Energiekörper","Schutz & Stärkung"],
  "Emotionale Transformation":["EFT (Klopftechnik)","Atemtechnik 5-5-5-5","Emotions-Entkopplung"],
  "Mentale Muster":["Glaubenssatz-Shift","Anker setzen","Macht-/Schaltwort-Arbeit"],
  "Zeitlinie & Karma":["Zeitlinienarbeit","Inkarnations-Thema","Karma/Verstrickung lösen"],
  "DNA & Ahnen":["Ahnenlinie Mutter","Ahnenlinie Vater","DNS-Programm","Loyalitäten & Schwüre"],
  "Geometrie & Radionik":["Blume des Lebens","Heilige Geometrie","Radionik"],
  "Schamanismus":["Heiliger Raum öffnen","Krafttier / Archetyp","Ritual & Abschluss"],
  "Fernheilung":["Fernanwendung","Räume energetisieren","Licht-Sprache"],
};

const KNOWLEDGE = [
  {id:"schamanismus",title:"Schamanismus",icon:"🪶",soft:"Schamanismus ist eine der ältesten spirituellen Praktiken der Menschheit. Er arbeitet mit der nicht-sichtbaren Welt durch Kraftreisen, Krafttiere und Rituale. In der energetischen Arbeit unterstützt er beim Lösen tiefer Blockaden und beim Rückruf verlorener Seelenteile.",tags:["Spirituell","Ritual"]},
  {id:"chakra",title:"Chakralehre",icon:"🌈",soft:"Chakren sind Energiezentren im Körper, die verschiedene Lebensbereiche repräsentieren. Von der Wurzel (Sicherheit) bis zum Kronenchakra (Bewusstsein) bilden sie eine lebendige Brücke zwischen Körper und Geist.",tags:["Energetisch","Körper"]},
  {id:"organsprache",title:"Organsprache",icon:"🫀",soft:"Jedes Organ trägt emotionale und thematische Informationen. Körpersymptome sprechen eine symbolische Sprache – sie zeigen, was die Seele noch nicht in Worte fassen konnte.",tags:["Körper","Emotional"]},
  {id:"ahnen",title:"Ahnen & DNA",icon:"🧬",soft:"Ahnenthemen und DNS-Programme sind generationenübergreifende Muster, die unbewusst das Leben beeinflussen. Durch gezielte Arbeit können Verstrickungen gelöst und alte Prägungen transformiert werden.",tags:["Ahnen","Karma"]},
  {id:"humandesign",title:"Human Design",icon:"⚙️",soft:"Human Design verbindet Astrologie, I-Ging, Kabbalah und Quantenphysik. Es zeigt den individuellen Bauplan eines Menschen – wie er am authentischsten lebt, entscheidet und in der Welt wirkt.",tags:["Bewusstsein"]},
  {id:"numerologie",title:"Numerologie",icon:"🔢",soft:"Zahlen tragen Schwingungen und Informationen. Durch Lebenszahlen und Namensanalyse werden tiefe Lebensthemen sichtbar, die das Schicksal mitgestalten.",tags:["Bewusstsein"]},
  {id:"kinesiologie",title:"Kinesiologie",icon:"💪",soft:"Kinesiologie nutzt Muskelresonanz als Kommunikation mit dem Unterbewusstsein. Sie hilft, körperliche, emotionale und energetische Blockaden präzise zu identifizieren.",tags:["Körper","Diagnose"]},
  {id:"lichtsprache",title:"Licht-Sprache",icon:"✨",soft:"Licht-Sprache ist eine multidimensionale Ausdrucksform jenseits des Verstandes. Sie arbeitet direkt mit dem Energiefeld und ermöglicht tiefe Transformationsprozesse.",tags:["Energie","Spirituell"]},
  {id:"kristalle",title:"Kristalle",icon:"💎",soft:"Kristalle sind natürliche Energieträger mit spezifischen Schwingungsfeldern. In der Heilarbeit unterstützen sie als Verstärker, Reiniger und Harmonisierer der feinstofflichen Ebenen.",tags:["Energie"]},
  {id:"atem",title:"Atemtechniken",icon:"🌬️",soft:"Der Atem ist die direkteste Brücke zwischen Körper, Geist und Seele. Bewusste Atemtechniken regulieren das Nervensystem, lösen Blockaden und öffnen tiefe Transformationsräume.",tags:["Körper","Geist"]},
];

// ─── HELPERS ──────────────────────────────────
const uid  = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const lvl  = k  => LEVELS.find(l => l.key === k);
const top2 = (lv={}) => Object.entries(lv).filter(([,v])=>v>0).sort(([,a],[,b])=>b-a).slice(0,2);
const dynGrad = (lv={}) => {
  const t=top2(lv);
  if(!t.length)return`linear-gradient(140deg,${T.tealL} 0%,#FFFFFF 45%,${T.violetL} 100%)`;
  const c1=lvl(t[0][0])?.bg||T.tealL, c2=t[1]?(lvl(t[1][0])?.bg||"#FFF"):"#FFF";
  return`linear-gradient(140deg,${c1} 0%,#FFFFFF 45%,${c2} 100%)`;
};

// Date helpers
const toDateStr = d => d.toISOString().slice(0,10);
const todayStr  = () => toDateStr(new Date());
const parseDate = s => { const [y,m,d]=s.split("-"); return new Date(+y,+m-1,+d); };
const addDays   = (s,n) => { const d=parseDate(s); d.setDate(d.getDate()+n); return toDateStr(d); };
const DE_DAYS   = ["Mo","Di","Mi","Do","Fr","Sa","So"];
const DE_DAYS_F = ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];
const DE_MONTHS = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];

const getMondayOf = (dateStr) => {
  const d = parseDate(dateStr);
  const day = d.getDay(); // 0=Sun
  const diff = day===0 ? -6 : 1-day;
  d.setDate(d.getDate()+diff);
  return toDateStr(d);
};

const getWeekDays = (mondayStr) => Array.from({length:7},(_,i)=>addDays(mondayStr,i));

const getMonthDays = (dateStr) => {
  const d = parseDate(dateStr);
  const year=d.getFullYear(), month=d.getMonth();
  const first = new Date(year,month,1);
  const last  = new Date(year,month+1,0);
  // pad to Monday
  let start = new Date(first);
  const dow = first.getDay()===0?6:first.getDay()-1;
  start.setDate(start.getDate()-dow);
  const days=[];
  while(start<=last || days.length%7!==0){
    days.push(toDateStr(new Date(start)));
    start.setDate(start.getDate()+1);
    if(days.length>42)break;
  }
  return days;
};

const HOURS = Array.from({length:13},(_,i)=>i+8); // 8–20

// ─── FLOWER ───────────────────────────────────
function Flower({size=280,opacity=0.09,color}){
  const c=color||T.teal,r=44,cx=size/2,cy=size/2;
  const pts=[[0,0],[r,0],[-r,0],[r/2,r*0.866],[-r/2,r*0.866],[r/2,-r*0.866],[-r/2,-r*0.866]];
  return(<svg width={size} height={size} style={{position:"absolute",top:0,left:0,opacity,pointerEvents:"none"}} viewBox={`0 0 ${size} ${size}`}>
    {pts.map(([dx,dy],i)=><circle key={i} cx={cx+dx} cy={cy+dy} r={r} fill="none" stroke={c} strokeWidth="1.1"/>)}
    <circle cx={cx} cy={cy} r={r*2} fill="none" stroke={c} strokeWidth="0.5"/>
  </svg>);
}

// ─── ATOMS ────────────────────────────────────
function Card({children,style={},onClick}){
  return(<div onClick={onClick} style={{background:T.bgCard,borderRadius:"18px",border:`1.5px solid ${T.border}`,padding:"16px",boxShadow:`0 3px 18px ${T.shadow}`,cursor:onClick?"pointer":"default",...style}}>{children}</div>);
}
function SL({children,color}){
  return <div style={{fontSize:"10px",letterSpacing:"2.5px",color:color||T.textMid,fontFamily:"Raleway",fontWeight:800,textTransform:"uppercase",marginBottom:"9px"}}>{children}</div>;
}
function Btn({children,variant="primary",onClick,disabled,style={}}){
  const base={fontFamily:"Raleway",fontWeight:700,fontSize:"13px",border:"none",borderRadius:"12px",padding:"12px 22px",cursor:disabled?"not-allowed":"pointer",transition:"all 0.2s",opacity:disabled?0.45:1,...style};
  const v={
    primary:{background:`linear-gradient(135deg,${T.teal},${T.tealD})`,color:"#FFF",boxShadow:`0 4px 16px ${T.shadowDeep}`},
    ghost:{background:T.tealL,color:T.tealD,border:`1.5px solid ${T.borderMid}`},
    soft:{background:T.bgSoft,color:T.textMid,border:`1.5px solid ${T.border}`},
    success:{background:`linear-gradient(135deg,${T.teal},${T.tealD})`,color:"#FFF",boxShadow:`0 4px 14px ${T.shadowDeep}`},
    violet:{background:`linear-gradient(135deg,${T.violet},${T.violetD})`,color:"#FFF"},
    danger:{background:"#FEE2E2",color:"#9B1C1C",border:"1.5px solid #FCA5A5"},
  };
  return <button onClick={disabled?undefined:onClick} style={{...base,...v[variant]}}>{children}</button>;
}
function TI({value,onChange,placeholder,multiline=false,rows=3,type="text"}){
  const s={width:"100%",background:"#FFF",border:`1.5px solid ${T.border}`,borderRadius:"12px",padding:"11px 14px",color:T.text,fontFamily:"Raleway",fontSize:"13px",fontWeight:500,outline:"none",boxSizing:"border-box",resize:"none"};
  return multiline?<textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={s}/>:<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={s}/>;
}
function LBar({levelKey,value=0,onChange,compact=false}){
  const info=lvl(levelKey);if(!info)return null;
  return(<div style={{display:"flex",alignItems:"center",gap:"10px",padding:compact?"4px 0":"8px 0"}}>
    <span style={{fontSize:compact?"14px":"18px",width:"22px",textAlign:"center"}}>{info.icon}</span>
    <div style={{flex:1}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"5px"}}>
        <span style={{fontSize:"12px",color:info.text,fontFamily:"Raleway",fontWeight:700}}>{info.name}</span>
        <span style={{fontSize:"11px",color:info.text,fontFamily:"Raleway",fontWeight:800,background:info.bg,padding:"1px 8px",borderRadius:"8px",border:`1px solid ${info.border}`}}>{value}%</span>
      </div>
      {onChange?(
        <div style={{position:"relative",height:"9px"}}>
          <div style={{position:"absolute",inset:0,borderRadius:"5px",background:info.bg,border:`1px solid ${info.border}`}}/>
          <div style={{position:"absolute",top:0,left:0,height:"100%",width:`${value}%`,borderRadius:"5px",background:info.bar,transition:"width 0.1s"}}/>
          <input type="range" min="0" max="100" value={value} onChange={e=>onChange(levelKey,+e.target.value)} style={{position:"absolute",inset:0,width:"100%",opacity:0,cursor:"pointer",height:"9px"}}/>
        </div>
      ):(
        <div style={{height:"6px",borderRadius:"3px",background:info.bg,border:`1px solid ${info.border}`}}>
          <div style={{height:"100%",width:`${value}%`,borderRadius:"3px",background:info.bar}}/>
        </div>
      )}
    </div>
  </div>);
}
function Pill({label,active,onClick}){
  return <button onClick={onClick} style={{fontFamily:"Raleway",fontSize:"12px",fontWeight:600,padding:"7px 16px",borderRadius:"20px",border:`1.5px solid ${active?T.teal:T.border}`,background:active?T.teal:"#FFF",color:active?"#FFF":T.textMid,cursor:"pointer",transition:"all 0.15s"}}>{label}</button>;
}
function Select({value,onChange,options}){
  return(<select value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",background:"#FFF",border:`1.5px solid ${T.border}`,borderRadius:"12px",padding:"11px 14px",color:T.text,fontFamily:"Raleway",fontSize:"13px",fontWeight:500,outline:"none",appearance:"none"}}>
    {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
  </select>);
}

// ─── NAV ──────────────────────────────────────
const NAV=[
  {id:"dashboard",label:"Übersicht",icon:"◉"},
  {id:"clients",  label:"Klienten", icon:"◈"},
  {id:"session",  label:"Sitzung",  icon:"✦"},
  {id:"calendar", label:"Kalender", icon:"⊡"},
  {id:"analytics",label:"Analyse",  icon:"◇"},
];

function BottomNav({active,onChange}){
  return(<nav style={{position:"fixed",bottom:0,left:0,right:0,maxWidth:"480px",margin:"0 auto",height:"68px",background:"rgba(240,250,250,0.97)",backdropFilter:"blur(20px)",borderTop:`1.5px solid ${T.border}`,display:"flex",zIndex:100,boxShadow:"0 -4px 20px rgba(13,148,136,0.1)"}}>
    {NAV.map(item=>{
      const isA=active===item.id,isC=item.id==="session";
      return(<button key={item.id} onClick={()=>onChange(item.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"3px",border:"none",background:"transparent",cursor:"pointer",position:"relative"}}>
        {isC&&<div style={{position:"absolute",top:"-24px",width:"52px",height:"52px",borderRadius:"50%",background:`linear-gradient(135deg,${T.teal},${T.tealD})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 4px 20px ${T.shadowDeep}`,border:`3px solid ${T.bg}`}}><span style={{fontSize:"22px",color:"white"}}>{item.icon}</span></div>}
        {!isC&&<span style={{fontSize:"17px",color:isA?T.teal:T.textSoft,transition:"color 0.2s"}}>{item.icon}</span>}
        <span style={{fontSize:"9px",fontFamily:"Raleway",fontWeight:800,letterSpacing:"0.5px",color:isA?T.teal:T.textSoft,marginTop:isC?"26px":"0",transition:"color 0.2s"}}>{item.label}</span>
      </button>);
    })}
  </nav>);
}

// ─── APPOINTMENT MODAL ────────────────────────
function ApptModal({appt, clients, onSave, onDelete, onClose}){
  const isNew = !appt.id;
  const [form,setForm] = useState({
    type: appt.type||"session",
    title: appt.title||"",
    clientId: appt.clientId||"",
    clientName: appt.clientName||"",
    date: appt.date||todayStr(),
    startTime: appt.startTime||"09:00",
    endTime: appt.endTime||"10:00",
    notes: appt.notes||"",
    status: appt.status||"planned",
  });
  const up = u => setForm({...form,...u});
  const at = APPT_TYPES[form.type]||APPT_TYPES.session;

  const handleClientChange = (id) => {
    const c = clients.find(c=>c.id===id);
    up({clientId:id, clientName:c?.name||""});
  };

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(15,48,48,0.45)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:T.bgCard,borderRadius:"24px 24px 0 0",width:"100%",maxWidth:"480px",maxHeight:"88vh",overflowY:"auto",padding:"20px 20px 100px"}}>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"18px"}}>
          <div style={{fontFamily:"Cinzel",fontSize:"17px",color:T.text,fontWeight:700}}>
            {isNew?"Neuer Termin":"Termin bearbeiten"}
          </div>
          <button onClick={onClose} style={{fontFamily:"Raleway",fontSize:"20px",color:T.textSoft,background:"none",border:"none",cursor:"pointer",lineHeight:1}}>✕</button>
        </div>

        {/* Type selector */}
        <SL>Terminart</SL>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"7px",marginBottom:"16px"}}>
          {Object.entries(APPT_TYPES).map(([key,t])=>(
            <button key={key} onClick={()=>up({type:key})} style={{padding:"9px 10px",borderRadius:"12px",border:`1.5px solid ${form.type===key?t.color:T.border}`,background:form.type===key?t.bg:"white",cursor:"pointer",fontFamily:"Raleway",fontSize:"11px",fontWeight:700,color:form.type===key?t.color:T.textMid,textAlign:"left",transition:"all 0.15s"}}>
              <span style={{display:"block",fontSize:"7px",letterSpacing:"1px",textTransform:"uppercase",marginBottom:"2px",opacity:0.7}}>{key==="session"?"●":"○"}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Client (for session types) */}
        {["session","first","followup"].includes(form.type)&&(<>
          <SL>Klient</SL>
          <div style={{marginBottom:"14px"}}>
            <Select value={form.clientId} onChange={handleClientChange} options={[{value:"",label:"— Klient wählen —"},...clients.map(c=>({value:c.id,label:c.name}))]}/>
            {!form.clientId&&<div style={{marginTop:"6px"}}><TI value={form.clientName} onChange={v=>up({clientName:v,clientId:""})} placeholder="Oder freier Name…"/></div>}
          </div>
        </>)}

        {/* Title */}
        <SL>Titel / Thema</SL>
        <div style={{marginBottom:"14px"}}>
          <TI value={form.title} onChange={v=>up({title:v})} placeholder={at.label+"…"}/>
        </div>

        {/* Date & Time */}
        <SL>Datum & Zeit</SL>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"14px"}}>
          <div style={{gridColumn:"1/-1"}}><TI type="date" value={form.date} onChange={v=>up({date:v})}/></div>
          <div><TI type="time" value={form.startTime} onChange={v=>up({startTime:v})} placeholder="Von"/></div>
          <div><TI type="time" value={form.endTime} onChange={v=>up({endTime:v})} placeholder="Bis"/></div>
          <div>
            <Select value={form.status} onChange={v=>up({status:v})} options={[
              {value:"planned",label:"📅 Geplant"},
              {value:"done",label:"✅ Abgeschlossen"},
              {value:"cancelled",label:"❌ Abgesagt"},
            ]}/>
          </div>
        </div>

        {/* Notes */}
        <SL>Notizen</SL>
        <div style={{marginBottom:"18px"}}>
          <TI value={form.notes} onChange={v=>up({notes:v})} placeholder="Vorbereitungsnotizen…" multiline rows={2}/>
        </div>

        {/* Actions */}
        <div style={{display:"flex",gap:"8px",flexDirection:"column"}}>
          <Btn onClick={()=>onSave({...appt,...form,id:appt.id||uid()})} style={{width:"100%"}}>
            {isNew?"Termin speichern":"Änderungen speichern"}
          </Btn>
          {!isNew&&(<div style={{display:"flex",gap:"8px"}}>
            <Btn variant="danger" onClick={()=>onDelete(appt.id)} style={{flex:1,fontSize:"12px",padding:"10px"}}>🗑 Löschen</Btn>
          </div>)}
          <Btn variant="soft" onClick={onClose} style={{width:"100%"}}>Abbrechen</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── CALENDAR SCREEN ──────────────────────────
function CalendarScreen({appointments,clients,onSaveAppt,onDeleteAppt,onStartSession}){
  const [view,setView]         = useState("week");   // day | week | month
  const [currentDate,setCurrent] = useState(todayStr());
  const [modal,setModal]       = useState(null);     // null | appt-object (new or existing)

  const today = todayStr();

  // Navigation
  const navigate = (dir) => {
    if(view==="day")   setCurrent(addDays(currentDate, dir));
    if(view==="week")  setCurrent(addDays(currentDate, dir*7));
    if(view==="month"){
      const d=parseDate(currentDate);
      d.setMonth(d.getMonth()+dir);
      setCurrent(toDateStr(d));
    }
  };

  const apptsByDate = {};
  appointments.forEach(a=>{ if(!apptsByDate[a.date])apptsByDate[a.date]=[]; apptsByDate[a.date].push(a); });

  const openNew = (date,startTime="09:00") => setModal({date,startTime,endTime:"10:00",type:"session",title:"",clientId:"",clientName:"",notes:"",status:"planned"});
  const openEdit = (a) => setModal(a);

  const headerLabel = () => {
    if(view==="day"){
      const d=parseDate(currentDate);
      return `${DE_DAYS_F[d.getDay()===0?6:d.getDay()-1]}, ${d.getDate()}. ${DE_MONTHS[d.getMonth()]}`;
    }
    if(view==="week"){
      const mon=getMondayOf(currentDate);
      const sun=addDays(mon,6);
      const dm=parseDate(mon),ds=parseDate(sun);
      return `${dm.getDate()}. – ${ds.getDate()}. ${DE_MONTHS[ds.getMonth()]} ${ds.getFullYear()}`;
    }
    const d=parseDate(currentDate);
    return `${DE_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  };

  // Appointment card compact
  const ApptChip = ({a,onClick}) => {
    const at=APPT_TYPES[a.type]||APPT_TYPES.other;
    return(
      <div onClick={e=>{e.stopPropagation();onClick(a);}} style={{background:at.bg,border:`1px solid ${at.border}`,borderRadius:"7px",padding:"3px 7px",marginBottom:"2px",cursor:"pointer",overflow:"hidden"}}>
        <div style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:700,color:at.color,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
          {a.startTime} {a.title||at.label}
        </div>
      </div>
    );
  };

  // ── DAY VIEW ──
  const DayView = () => {
    const dayAppts = (apptsByDate[currentDate]||[]).sort((a,b)=>a.startTime.localeCompare(b.startTime));
    return(
      <div style={{padding:"0 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
          <button onClick={()=>setCurrent(today)} style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:700,color:T.teal,background:"none",border:`1.5px solid ${T.tealL}`,borderRadius:"10px",padding:"5px 12px",cursor:"pointer"}}>Heute</button>
          <button onClick={()=>openNew(currentDate)} style={{fontFamily:"Raleway",fontSize:"12px",fontWeight:700,color:"white",background:`linear-gradient(135deg,${T.teal},${T.tealD})`,border:"none",borderRadius:"10px",padding:"7px 16px",cursor:"pointer"}}>+ Termin</button>
        </div>
        {dayAppts.length===0?(
          <div style={{textAlign:"center",padding:"48px 0",color:T.textSoft}}>
            <div style={{fontSize:"32px",marginBottom:"8px",opacity:0.4}}>⊡</div>
            <div style={{fontFamily:"Raleway",fontSize:"13px",fontWeight:500}}>Keine Termine</div>
            <button onClick={()=>openNew(currentDate)} style={{marginTop:"12px",fontFamily:"Raleway",fontSize:"12px",fontWeight:700,color:T.teal,background:"none",border:`1.5px solid ${T.tealL}`,borderRadius:"10px",padding:"7px 16px",cursor:"pointer"}}>+ Termin hinzufügen</button>
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
            {dayAppts.map(a=>{
              const at=APPT_TYPES[a.type]||APPT_TYPES.other;
              return(
                <div key={a.id} onClick={()=>openEdit(a)} style={{background:at.bg,border:`1.5px solid ${at.border}`,borderRadius:"16px",padding:"14px 16px",cursor:"pointer",position:"relative",overflow:"hidden"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:700,color:at.color,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"4px"}}>{at.label}</div>
                      <div style={{fontFamily:"Raleway",fontSize:"14px",fontWeight:700,color:T.text,marginBottom:"4px"}}>{a.title||a.clientName||at.label}</div>
                      {a.clientName&&a.title&&<div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textMid,fontWeight:500}}>{a.clientName}</div>}
                    </div>
                    <div style={{textAlign:"right",flexShrink:0,marginLeft:"12px"}}>
                      <div style={{fontFamily:"Raleway",fontSize:"12px",fontWeight:700,color:at.color}}>{a.startTime}</div>
                      <div style={{fontFamily:"Raleway",fontSize:"10px",color:T.textSoft,fontWeight:500}}>{a.endTime}</div>
                      <div style={{marginTop:"4px",fontSize:"9px",padding:"2px 7px",borderRadius:"8px",background:"rgba(255,255,255,0.6)",fontFamily:"Raleway",fontWeight:700,color:at.color}}>
                        {a.status==="done"?"✅":a.status==="cancelled"?"❌":"📅"}
                      </div>
                    </div>
                  </div>
                  {a.notes&&<div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textMid,marginTop:"8px",fontWeight:500,fontStyle:"italic"}}>{a.notes}</div>}
                  {["session","first","followup"].includes(a.type)&&a.status!=="done"&&(
                    <button onClick={e=>{e.stopPropagation();onStartSession({clientId:a.clientId,name:a.clientName||a.title,apptId:a.id,goal:a.title,type:a.type==="first"?"first":"followup"});}}
                      style={{marginTop:"10px",width:"100%",fontFamily:"Raleway",fontSize:"12px",fontWeight:700,padding:"9px",borderRadius:"10px",border:"none",cursor:"pointer",background:`linear-gradient(135deg,${T.teal},${T.tealD})`,color:"white",boxShadow:`0 3px 10px ${T.shadowDeep}`}}>
                      ✦ Sitzung starten
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ── WEEK VIEW ──
  const WeekView = () => {
    const monday = getMondayOf(currentDate);
    const days   = getWeekDays(monday);
    return(
      <div style={{padding:"0 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
          <button onClick={()=>setCurrent(today)} style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:700,color:T.teal,background:"none",border:`1.5px solid ${T.tealL}`,borderRadius:"10px",padding:"5px 12px",cursor:"pointer"}}>Heute</button>
          <button onClick={()=>openNew(currentDate)} style={{fontFamily:"Raleway",fontSize:"12px",fontWeight:700,color:"white",background:`linear-gradient(135deg,${T.teal},${T.tealD})`,border:"none",borderRadius:"10px",padding:"7px 16px",cursor:"pointer"}}>+ Termin</button>
        </div>
        {/* Day columns */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"4px"}}>
          {days.map((d,i)=>{
            const pd=parseDate(d);
            const isToday=d===today;
            const isSelected=d===currentDate;
            const dayAppts=(apptsByDate[d]||[]).sort((a,b)=>a.startTime.localeCompare(b.startTime));
            return(
              <div key={d} onClick={()=>{setCurrent(d);setView("day");}} style={{cursor:"pointer"}}>
                <div style={{textAlign:"center",marginBottom:"5px"}}>
                  <div style={{fontFamily:"Raleway",fontSize:"9px",fontWeight:700,color:T.textSoft,letterSpacing:"0.5px"}}>{DE_DAYS[i]}</div>
                  <div style={{width:"28px",height:"28px",borderRadius:"50%",margin:"3px auto",display:"flex",alignItems:"center",justifyContent:"center",background:isToday?T.teal:isSelected?T.tealL:"transparent",border:isToday?"none":isSelected?`1.5px solid ${T.tealD}`:"none"}}>
                    <span style={{fontFamily:"Raleway",fontSize:"13px",fontWeight:700,color:isToday?"white":isSelected?T.tealD:T.text}}>{pd.getDate()}</span>
                  </div>
                </div>
                <div style={{minHeight:"80px",background:isSelected?"rgba(204,251,241,0.3)":"transparent",borderRadius:"10px",padding:"2px"}}>
                  {dayAppts.map(a=><ApptChip key={a.id} a={a} onClick={openEdit}/>)}
                  {dayAppts.length===0&&<div style={{height:"4px",borderRadius:"2px",background:"transparent"}}/>}
                </div>
              </div>
            );
          })}
        </div>
        {/* Today's details below */}
        {(apptsByDate[currentDate]||[]).length>0&&(
          <div style={{marginTop:"16px"}}>
            <SL>{currentDate===today?"Heutige Termine":"Termine am "+parseDate(currentDate).getDate()+". "+DE_MONTHS[parseDate(currentDate).getMonth()]}</SL>
            <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
              {(apptsByDate[currentDate]||[]).sort((a,b)=>a.startTime.localeCompare(b.startTime)).map(a=>{
                const at=APPT_TYPES[a.type]||APPT_TYPES.other;
                return(
                  <div key={a.id} onClick={()=>openEdit(a)} style={{background:at.bg,border:`1.5px solid ${at.border}`,borderRadius:"14px",padding:"12px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:"12px"}}>
                    <div style={{width:"36px",height:"36px",borderRadius:"50%",background:"rgba(255,255,255,0.7)",border:`1.5px solid ${at.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <div style={{width:"10px",height:"10px",borderRadius:"50%",background:at.dot}}/>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:"Raleway",fontSize:"13px",fontWeight:700,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.title||a.clientName||at.label}</div>
                      <div style={{fontFamily:"Raleway",fontSize:"11px",color:at.color,fontWeight:600,marginTop:"2px"}}>{a.startTime} – {a.endTime} · {at.label}</div>
                    </div>
                    {["session","first","followup"].includes(a.type)&&a.status!=="done"&&(
                      <button onClick={e=>{e.stopPropagation();onStartSession({clientId:a.clientId,name:a.clientName||a.title,apptId:a.id,goal:a.title,type:a.type==="first"?"first":"followup"});}}
                        style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:700,padding:"6px 10px",borderRadius:"9px",border:"none",cursor:"pointer",background:`linear-gradient(135deg,${T.teal},${T.tealD})`,color:"white",flexShrink:0}}>
                        ✦ Start
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── MONTH VIEW ──
  const MonthView = () => {
    const days = getMonthDays(currentDate);
    const curMonth = parseDate(currentDate).getMonth();
    return(
      <div style={{padding:"0 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
          <button onClick={()=>setCurrent(today)} style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:700,color:T.teal,background:"none",border:`1.5px solid ${T.tealL}`,borderRadius:"10px",padding:"5px 12px",cursor:"pointer"}}>Heute</button>
          <button onClick={()=>openNew(currentDate)} style={{fontFamily:"Raleway",fontSize:"12px",fontWeight:700,color:"white",background:`linear-gradient(135deg,${T.teal},${T.tealD})`,border:"none",borderRadius:"10px",padding:"7px 16px",cursor:"pointer"}}>+ Termin</button>
        </div>
        {/* Weekday header */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"2px",marginBottom:"4px"}}>
          {DE_DAYS.map(d=><div key={d} style={{textAlign:"center",fontFamily:"Raleway",fontSize:"9px",fontWeight:800,color:T.textSoft,letterSpacing:"0.5px",padding:"4px 0"}}>{d}</div>)}
        </div>
        {/* Day grid */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"2px"}}>
          {days.map(d=>{
            const pd=parseDate(d);
            const isThisMonth=pd.getMonth()===curMonth;
            const isToday=d===today;
            const isSelected=d===currentDate;
            const dayAppts=apptsByDate[d]||[];
            return(
              <div key={d} onClick={()=>{setCurrent(d);}} style={{minHeight:"52px",borderRadius:"10px",padding:"3px",cursor:"pointer",background:isSelected?"rgba(204,251,241,0.4)":isToday?"rgba(204,251,241,0.2)":"transparent",border:isSelected?`1.5px solid ${T.borderMid}`:"1.5px solid transparent",opacity:isThisMonth?1:0.35}}>
                <div style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:isToday?800:600,color:isToday?T.teal:T.text,marginBottom:"3px",textAlign:"center",width:"22px",height:"22px",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 3px",background:isToday?T.tealL:"transparent"}}>{pd.getDate()}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:"2px",justifyContent:"center"}}>
                  {dayAppts.slice(0,3).map(a=>{
                    const at=APPT_TYPES[a.type]||APPT_TYPES.other;
                    return <div key={a.id} style={{width:"7px",height:"7px",borderRadius:"50%",background:at.dot}}/>;
                  })}
                  {dayAppts.length>3&&<div style={{fontSize:"8px",color:T.textSoft,fontFamily:"Raleway",fontWeight:700}}>+{dayAppts.length-3}</div>}
                </div>
              </div>
            );
          })}
        </div>
        {/* Selected day detail */}
        {(apptsByDate[currentDate]||[]).length>0&&(
          <div style={{marginTop:"14px"}}>
            <SL>{parseDate(currentDate).getDate()}. {DE_MONTHS[parseDate(currentDate).getMonth()]}</SL>
            <div style={{display:"flex",flexDirection:"column",gap:"7px"}}>
              {(apptsByDate[currentDate]||[]).sort((a,b)=>a.startTime.localeCompare(b.startTime)).map(a=>{
                const at=APPT_TYPES[a.type]||APPT_TYPES.other;
                return(
                  <div key={a.id} onClick={()=>openEdit(a)} style={{background:at.bg,border:`1.5px solid ${at.border}`,borderRadius:"13px",padding:"10px 13px",cursor:"pointer",display:"flex",alignItems:"center",gap:"10px"}}>
                    <div style={{width:"8px",height:"8px",borderRadius:"50%",background:at.dot,flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:"Raleway",fontSize:"12px",fontWeight:700,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.title||a.clientName||at.label}</div>
                      <div style={{fontFamily:"Raleway",fontSize:"10px",color:at.color,fontWeight:600}}>{a.startTime} – {a.endTime}</div>
                    </div>
                    {["session","first","followup"].includes(a.type)&&a.status!=="done"&&(
                      <button onClick={e=>{e.stopPropagation();onStartSession({clientId:a.clientId,name:a.clientName||a.title,apptId:a.id,goal:a.title,type:a.type==="first"?"first":"followup"});}}
                        style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:700,padding:"5px 9px",borderRadius:"8px",border:"none",cursor:"pointer",background:T.teal,color:"white",flexShrink:0}}>
                        ✦
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return(
    <div style={{paddingBottom:"96px"}}>
      {/* View toggle + navigation */}
      <div style={{padding:"8px 16px 12px"}}>
        {/* View switcher */}
        <div style={{display:"flex",background:T.bgSoft,borderRadius:"14px",padding:"3px",marginBottom:"12px",border:`1.5px solid ${T.border}`}}>
          {[["day","Tag"],["week","Woche"],["month","Monat"]].map(([v,l])=>(
            <button key={v} onClick={()=>setView(v)} style={{flex:1,padding:"7px",borderRadius:"11px",border:"none",cursor:"pointer",fontFamily:"Raleway",fontSize:"11px",fontWeight:700,transition:"all 0.2s",background:view===v?"white":"transparent",color:view===v?T.tealD:T.textSoft,boxShadow:view===v?`0 2px 8px ${T.shadow}`:"none"}}>{l}</button>
          ))}
        </div>
        {/* Month/week navigator */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={()=>navigate(-1)} style={{width:"36px",height:"36px",borderRadius:"50%",border:`1.5px solid ${T.border}`,background:"white",cursor:"pointer",fontSize:"16px",color:T.textMid,display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
          <div style={{fontFamily:"Cinzel",fontSize:"14px",color:T.text,fontWeight:700,textAlign:"center"}}>{headerLabel()}</div>
          <button onClick={()=>navigate(1)} style={{width:"36px",height:"36px",borderRadius:"50%",border:`1.5px solid ${T.border}`,background:"white",cursor:"pointer",fontSize:"16px",color:T.textMid,display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
        </div>
      </div>

      {view==="day"   && <DayView/>}
      {view==="week"  && <WeekView/>}
      {view==="month" && <MonthView/>}

      {modal&&(
        <ApptModal
          appt={modal}
          clients={clients}
          onSave={a=>{onSaveAppt(a);setModal(null);}}
          onDelete={id=>{onDeleteAppt(id);setModal(null);}}
          onClose={()=>setModal(null)}
        />
      )}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────
function Dashboard({clients,sessions,appointments,onNav,reminders,onDismissReminder,onAddReminder}){
  const lC={};sessions.forEach(s=>Object.entries(s.levels||{}).forEach(([k,v])=>{if(v>50)lC[k]=(lC[k]||0)+1;}));
  const tL=Object.entries(lC).sort(([,a],[,b])=>b-a)[0];
  const tI=tL?lvl(tL[0]):null;
  const today=todayStr();
  const todayAppts=(appointments||[]).filter(a=>a.date===today).sort((a,b)=>a.startTime.localeCompare(b.startTime));

  return(
    <div style={{padding:"0 16px 96px"}}>
      {/* Hero */}
      <div style={{position:"relative",borderRadius:"24px",overflow:"hidden",padding:"30px 26px",marginBottom:"18px",background:`linear-gradient(140deg,${T.tealL} 0%,#FFFFFF 50%,${T.violetL} 100%)`,boxShadow:`0 6px 30px ${T.shadowDeep}`,border:`1.5px solid ${T.border}`}}>
        <Flower size={280} opacity={0.1}/>
        <div style={{position:"relative",zIndex:1}}>
          <p style={{fontFamily:"Raleway",fontSize:"10px",color:T.textSoft,letterSpacing:"3px",textTransform:"uppercase",margin:"0 0 6px",fontWeight:700}}>Willkommen zurück</p>
          <h1 style={{fontFamily:"Cinzel",fontSize:"30px",color:T.text,margin:"0 0 4px",fontWeight:700}}>Lichtkern</h1>
          <p style={{fontFamily:"Raleway",fontSize:"11px",color:T.textMid,letterSpacing:"1.5px",margin:"0 0 22px",fontWeight:500}}>Struktur trifft Resonanz</p>
          <Btn onClick={()=>onNav("session")} style={{fontSize:"13px",padding:"11px 26px"}}>✦ Neue Sitzung</Btn>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px",marginBottom:"18px"}}>
        {[
          {label:"Klienten",value:clients.length,bg:T.tealL,border:T.borderMid,color:T.tealD},
          {label:"Sitzungen",value:sessions.length,bg:T.violetL,border:"#A78BFA",color:T.violetD},
          {label:"Top-Ebene",value:tI?.icon||"—",bg:tI?.bg||T.bgSoft,border:tI?.border||T.border,color:tI?.text||T.tealD},
        ].map((s,i)=>(
          <div key={i} style={{background:s.bg,borderRadius:"16px",border:`1.5px solid ${s.border}`,padding:"14px 8px",textAlign:"center",boxShadow:`0 2px 10px ${T.shadow}`}}>
            <div style={{fontFamily:"Cinzel",fontSize:"24px",color:s.color,fontWeight:700}}>{s.value}</div>
            <div style={{fontFamily:"Raleway",fontSize:"9px",color:s.color,marginTop:"5px",fontWeight:700,opacity:0.85}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Today's appointments */}
      {todayAppts.length>0&&(<>
        <SL>Heute</SL>
        <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"18px"}}>
          {todayAppts.map(a=>{
            const at=APPT_TYPES[a.type]||APPT_TYPES.other;
            return(
              <div key={a.id} onClick={()=>onNav("calendar")} style={{background:at.bg,border:`1.5px solid ${at.border}`,borderRadius:"14px",padding:"12px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:"12px"}}>
                <div style={{width:"8px",height:"8px",borderRadius:"50%",background:at.dot,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:"Raleway",fontSize:"13px",fontWeight:700,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.title||a.clientName||at.label}</div>
                  <div style={{fontFamily:"Raleway",fontSize:"11px",color:at.color,fontWeight:600}}>{a.startTime} – {a.endTime}</div>
                </div>
              </div>
            );
          })}
        </div>
      </>)}

      {/* Quick actions */}
      <SL>Schnellzugriff</SL>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"18px"}}>
        {[
          {label:"Klient anlegen",icon:"◈",s:"clients",bg:T.tealL,border:T.borderMid,c:T.tealD},
          {label:"Kalender",icon:"⊡",s:"calendar",bg:T.violetL,border:"#A78BFA",c:T.violetD},
          {label:"Wissensbasis",icon:"◆",s:"knowledge",bg:"#EAF4FE",border:"#6BAEE8",c:"#0A2A50"},
          {label:"Ahnen",icon:"🧬",s:"gentree",bg:"#F0EDFC",border:"#9B7EE0",c:"#2A1660"},
          {label:"Abrechnung",icon:"💰",s:"billing",bg:"#DCFCE7",border:"#4ADE80",c:"#0A3B20"},
          {label:"Verlauf",icon:"◎",s:"history",bg:T.goldL,border:"#F59E0B",c:"#7C4A00"},
          {label:"Analyse",icon:"◇",s:"analytics",bg:"#EDFAF2",border:"#4DC98A",c:"#0A3B20"},
        ].map((a,i)=>(
          <div key={i} onClick={()=>onNav(a.s)} style={{background:a.bg,borderRadius:"16px",padding:"18px",cursor:"pointer",border:`1.5px solid ${a.border}`,boxShadow:`0 2px 10px ${T.shadow}`}}>
            <span style={{fontSize:"26px",display:"block",marginBottom:"9px"}}>{a.icon}</span>
            <span style={{fontFamily:"Raleway",fontSize:"13px",color:a.c,fontWeight:700}}>{a.label}</span>
          </div>
        ))}
      </div>

      {/* Reminders / Hinweise */}
      {(()=>{
        const now=new Date();
        const today=now.toISOString().slice(0,10);
        const hints=[];

        // Auto: days without session per client
        clients.forEach(c=>{
          const cs=sessions.filter(s=>s.clientId===c.id).sort((a,b)=>b.createdAt?.localeCompare(a.createdAt));
          if(cs.length>0){
            const last=new Date(cs[0].createdAt);
            const days=Math.floor((now-last)/(1000*60*60*24));
            if(days>=30) hints.push({id:`nosession_${c.id}`,type:"nosession",icon:"⏰",color:"#C0392B",bg:"#FEE2E2",border:"#FCA5A5",title:`${c.name}`,sub:`Letzte Sitzung vor ${days} Tagen`,email:c.contact,clientName:c.name});
          }
        });

        // Auto: birthdays this week
        clients.forEach(c=>{
          if(!c.birthDate) return;
          const bd=new Date(c.birthDate);
          const thisYear=new Date(now.getFullYear(),bd.getMonth(),bd.getDate());
          const diff=Math.floor((thisYear-now)/(1000*60*60*24));
          if(diff>=0&&diff<=7) hints.push({id:`bday_${c.id}`,type:"bday",icon:"🎂",color:"#7C4A00",bg:"#FEF3C7",border:"#F59E0B",title:`${c.name}`,sub:diff===0?"Geburtstag heute! 🎉":`Geburtstag in ${diff} Tag${diff!==1?"en":""}`,email:c.contact,clientName:c.name});
        });

        // Auto: follow-up (7 days after session, if no follow-up booked)
        sessions.slice(0,20).forEach(s=>{
          if(!s.createdAt) return;
          const sd=new Date(s.createdAt);
          const days=Math.floor((now-sd)/(1000*60*60*24));
          if(days>=7&&days<=14){
            const hasFollowup=sessions.some(x=>x.clientId===s.clientId&&x.createdAt>s.createdAt);
            if(!hasFollowup){
              const cl=clients.find(x=>x.id===s.clientId);
              hints.push({id:`followup_${s.id}`,type:"followup",icon:"🔄",color:T.tealD,bg:T.tealL,border:T.borderMid,title:`Follow-up: ${s.clientName||"—"}`,sub:`Sitzung vor ${days} Tagen — noch keine Folgesitzung`,email:cl?.contact,clientName:s.clientName});
            }
          }
        });

        // Auto: open invoices older than 14 days
        sessions.forEach(s=>{
          if((s.payStatus==="open"||s.payStatus==="partial")&&s.fee&&s.createdAt){
            const days=Math.floor((now-new Date(s.createdAt))/(1000*60*60*24));
            if(days>=14){
              const cl=clients.find(x=>x.id===s.clientId);
              hints.push({id:`invoice_${s.id}`,type:"invoice",icon:"💰",color:"#7C4A00",bg:"#FEF3C7",border:"#F59E0B",title:`Offene Rechnung: ${s.clientName||"—"}`,sub:`${s.fee} CHF · vor ${days} Tagen`,email:cl?.contact,clientName:s.clientName});
            }
          }
        });

        // Manual reminders
        (reminders||[]).forEach(r=>{
          if(!r.done) hints.push({...r,isManual:true});
        });

        // Filter dismissed
        const active=hints.filter(h=>!(reminders||[]).find(r=>r.id===h.id&&r.dismissed));

        if(active.length===0) return null;
        return(<>
          <SL>🔔 Hinweise ({active.length})</SL>
          <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"18px"}}>
            {active.map(h=>(
              <div key={h.id} style={{background:h.bg,borderRadius:"14px",padding:"12px 14px",border:`1.5px solid ${h.border}`,display:"flex",gap:"10px",alignItems:"flex-start"}}>
                <span style={{fontSize:"20px",flexShrink:0,marginTop:"1px"}}>{h.icon}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:"Raleway",fontSize:"13px",fontWeight:700,color:"#0F3030"}}>{h.title}</div>
                  <div style={{fontFamily:"Raleway",fontSize:"11px",color:h.color,fontWeight:600,marginTop:"2px"}}>{h.sub}</div>
                  <div style={{display:"flex",gap:"6px",marginTop:"8px",flexWrap:"wrap"}}>
                    {h.email&&h.type==="bday"&&<button onClick={()=>{const s=encodeURIComponent(`Herzlichen Glückwunsch zum Geburtstag! 🎂`);const b=encodeURIComponent(`Liebe/r ${h.clientName},

herzlichen Glückwunsch zu deinem Geburtstag!

Ich wünsche dir einen wundervollen Tag voller Licht und Freude. 🌿

✦ Lichtkern · powered by Resonanz Akademie`);window.location.href=`mailto:${h.email}?subject=${s}&body=${b}`;}} style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:700,padding:"4px 10px",borderRadius:"8px",border:`1px solid ${h.border}`,background:"rgba(255,255,255,0.7)",color:h.color,cursor:"pointer"}}>✉️ Glückwunsch senden</button>}
                    {h.email&&h.type==="nosession"&&<button onClick={()=>{const s=encodeURIComponent(`Wie geht es dir? · Lichtkern`);const b=encodeURIComponent(`Liebe/r ${h.clientName},

ich denke an dich und frage mich, wie es dir geht. Magst du eine neue Sitzung vereinbaren?

Ich freue mich von dir zu hören. 🌿

✦ Lichtkern · powered by Resonanz Akademie`);window.location.href=`mailto:${h.email}?subject=${s}&body=${b}`;}} style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:700,padding:"4px 10px",borderRadius:"8px",border:`1px solid ${h.border}`,background:"rgba(255,255,255,0.7)",color:h.color,cursor:"pointer"}}>✉️ Kontakt aufnehmen</button>}
                    {h.email&&h.type==="followup"&&<button onClick={()=>{const s=encodeURIComponent(`Follow-up · Lichtkern`);const b=encodeURIComponent(`Liebe/r ${h.clientName},

wie integrierst du die Impulse aus unserer letzten Sitzung? Ich würde mich freuen, von dir zu hören und eventuell einen Folgetermin zu vereinbaren.

✦ Lichtkern · powered by Resonanz Akademie`);window.location.href=`mailto:${h.email}?subject=${s}&body=${b}`;}} style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:700,padding:"4px 10px",borderRadius:"8px",border:`1px solid ${h.border}`,background:"rgba(255,255,255,0.7)",color:h.color,cursor:"pointer"}}>✉️ Follow-up Mail</button>}
                    {h.email&&h.type==="invoice"&&<button onClick={()=>{const s=encodeURIComponent(`Zahlungserinnerung · Lichtkern`);const b=encodeURIComponent(`Liebe/r ${h.clientName},

dies ist eine freundliche Erinnerung bezüglich der ausstehenden Rechnung von ${h.sub}.

Vielen Dank für deine baldige Begleichung.

✦ Lichtkern · powered by Resonanz Akademie`);window.location.href=`mailto:${h.email}?subject=${s}&body=${b}`;}} style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:700,padding:"4px 10px",borderRadius:"8px",border:`1px solid ${h.border}`,background:"rgba(255,255,255,0.7)",color:h.color,cursor:"pointer"}}>✉️ Rechnung erinnern</button>}
                    {h.isManual&&<button onClick={()=>onDismissReminder(h.id)} style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:700,padding:"4px 10px",borderRadius:"8px",border:`1px solid ${h.border}`,background:"rgba(255,255,255,0.7)",color:h.color,cursor:"pointer"}}>✅ Erledigt</button>}
                    {!h.isManual&&<button onClick={()=>onDismissReminder(h.id)} style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:600,padding:"4px 10px",borderRadius:"8px",border:"1px solid #CBD5E1",background:"rgba(255,255,255,0.5)",color:"#6AABA7",cursor:"pointer"}}>Ausblenden</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>);
      })()}

      {/* Recent sessions */}
      {sessions.slice(0,3).length>0&&(<>
        <SL>Letzte Sitzungen</SL>
        <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
          {sessions.slice(0,3).map(s=>{
            const t=top2(s.levels||{});const li=t[0]?lvl(t[0][0]):null;
            return(
              <Card key={s.id} style={{display:"flex",gap:"12px",alignItems:"center",padding:"13px 14px"}}>
                <div style={{width:"44px",height:"44px",borderRadius:"50%",background:li?.bg||T.bgSoft,border:`1.5px solid ${li?.border||T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",flexShrink:0}}>{li?.icon||"✦"}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:"Raleway",fontSize:"13px",fontWeight:700,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.clientName||"—"}</div>
                  <div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textSoft,fontWeight:500,marginTop:"2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.goal||"Kein Thema"}</div>
                </div>
                <div style={{fontFamily:"Raleway",fontSize:"10px",color:T.textSoft,fontWeight:600,flexShrink:0}}>{new Date(s.createdAt).toLocaleDateString("de-DE")}</div>
              </Card>
            );
          })}
        </div>
      </>)}
    </div>
  );
}

// ─── CLIENTS ──────────────────────────────────
function Clients({clients,sessions,onSave,onStart,onDelete,onOnboarding,reminders,onAddReminder,onDismissReminder,onAnalyse}){
  const [showAdd,setShowAdd]=useState(false);
  const [search,setSearch]=useState("");
  const [form,setForm]=useState({name:"",contact:"",notes:"",tags:""});
  const filtered=clients.filter(c=>c.name.toLowerCase().includes(search.toLowerCase()));
  const add=()=>{if(!form.name.trim())return;onSave([...clients,{id:uid(),createdAt:new Date().toISOString(),...form,tags:form.tags.split(",").map(t=>t.trim()).filter(Boolean)}]);setForm({name:"",contact:"",notes:"",tags:""});setShowAdd(false);};
  return(
    <div style={{padding:"0 16px 96px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:"8px",marginBottom:"16px"}}>
        <h2 style={{fontFamily:"Cinzel",fontSize:"22px",color:T.text,margin:0,fontWeight:700}}>Klienten</h2>
        <div style={{display:"flex",gap:"8px"}}>
          <button onClick={onOnboarding} style={{fontFamily:"Raleway",fontWeight:700,fontSize:"11px",padding:"9px 14px",borderRadius:"12px",border:`1.5px solid ${T.border}`,background:T.bgSoft,color:T.textMid,cursor:"pointer"}}>📋 Anamnese</button>
          <Btn onClick={()=>setShowAdd(!showAdd)} style={{padding:"9px 18px",fontSize:"12px"}}>+ Neu</Btn>
        </div>
      </div>
      {showAdd&&(
        <Card style={{marginBottom:"16px",background:T.bgSoft,border:`1.5px solid ${T.borderMid}`}}>
          <SL color={T.tealD}>Neuer Klient</SL>
          {[{k:"name",p:"Name *"},{k:"contact",p:"Email / Telefon"},{k:"notes",p:"Notizen"},{k:"tags",p:"Tags: Angst, Rücken, Ahnen…"}].map(f=>(
            <div key={f.k} style={{marginBottom:"8px"}}><TI value={form[f.k]} onChange={v=>setForm({...form,[f.k]:v})} placeholder={f.p}/></div>
          ))}
          <div style={{display:"flex",gap:"8px"}}><Btn onClick={add} style={{flex:1}}>Speichern</Btn><Btn variant="soft" onClick={()=>setShowAdd(false)} style={{flex:1}}>Abbrechen</Btn></div>
        </Card>
      )}
      <div style={{marginBottom:"14px"}}><TI value={search} onChange={setSearch} placeholder="Klient suchen…"/></div>
      {filtered.length===0&&<div style={{textAlign:"center",padding:"52px 0"}}><div style={{fontSize:"40px",marginBottom:"10px",opacity:0.4}}>◈</div><div style={{fontFamily:"Raleway",fontSize:"14px",color:T.textMid,fontWeight:600}}>Noch keine Klienten</div></div>}
      <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
        {filtered.map(c=>{
          const sc=sessions.filter(s=>s.clientId===c.id).length;
          return(
            <Card key={c.id}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:"Raleway",fontWeight:800,fontSize:"15px",color:T.text}}>{c.name}</div>
                  {c.contact&&<div style={{fontFamily:"Raleway",fontSize:"12px",color:T.textMid,marginTop:"3px",fontWeight:500}}>{c.contact}</div>}
                  {c.tags?.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:"5px",marginTop:"8px"}}>{c.tags.map(t=><span key={t} style={{fontSize:"10px",padding:"3px 11px",borderRadius:"12px",background:T.tealL,color:T.tealD,fontFamily:"Raleway",fontWeight:700,border:`1px solid ${T.borderMid}`}}>{t}</span>)}</div>}
                </div>
                <div style={{textAlign:"right",flexShrink:0,marginLeft:"12px"}}>
                  <div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textSoft,fontWeight:600}}>{sc} Sitzung{sc!==1?"en":""}</div>
                  <button onClick={()=>onStart(c)} style={{fontFamily:"Raleway",fontSize:"12px",color:T.teal,fontWeight:700,background:"none",border:"none",cursor:"pointer",marginTop:"6px",display:"block"}}>Sitzung →</button>
                  <button onClick={()=>onAnalyse&&onAnalyse(c.id)} style={{fontFamily:"Raleway",fontSize:"11px",color:T.violetD,background:"none",border:"none",cursor:"pointer",marginTop:"3px",display:"block",fontWeight:700}}>📊 Analyse →</button>
                  <button onClick={()=>{const txt=window.prompt(`Erinnerung für ${c.name}:`);if(txt)onAddReminder({type:"manual",icon:"📌",color:T.tealD,bg:T.tealL,border:T.borderMid,title:`${c.name}`,sub:txt,email:c.contact,clientName:c.name,done:false});}} style={{fontFamily:"Raleway",fontSize:"11px",color:T.tealD,background:T.tealL,border:`1px solid ${T.borderMid}`,borderRadius:"8px",padding:"4px 10px",cursor:"pointer",marginTop:"6px",display:"block",fontWeight:700}}>
                    📌 Erinnerung
                  </button>
                  <button onClick={()=>{if(window.confirm(`Klient "${c.name}" und alle zugehörigen Daten (Sitzungen, Termine, Baum) wirklich löschen?`)){onDelete(c.id);}}} style={{fontFamily:"Raleway",fontSize:"11px",color:"#C0392B",background:"#FEE2E2",border:"1px solid #FCA5A5",borderRadius:"8px",padding:"4px 10px",cursor:"pointer",marginTop:"6px",display:"block",fontWeight:700}}>
                    🗑 Löschen
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── SESSION WIZARD ───────────────────────────
const STEPS=["Klient","Ziel","Ebenen","Techniken","Abschluss"];
function Session({wizard,setWizard,clients,onComplete,onCancel}){
  const [aiLoading,setAiLoading]=useState(false);
  const [aiText,setAiText]=useState("");
  if(!wizard)return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"65vh",gap:"20px",padding:"0 32px",textAlign:"center"}}>
      <div style={{width:"88px",height:"88px",borderRadius:"50%",background:`linear-gradient(135deg,${T.tealL},${T.violetL})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"36px",boxShadow:`0 6px 28px ${T.shadowDeep}`,border:`1.5px solid ${T.border}`}}>✦</div>
      <div style={{fontFamily:"Cinzel",fontSize:"20px",color:T.text,fontWeight:700}}>Neue Sitzung</div>
      <div style={{fontFamily:"Raleway",fontSize:"13px",color:T.textMid,lineHeight:"1.7",fontWeight:500}}>Begleite deine Klienten strukturiert<br/>und mit voller Präsenz</div>
      <Btn onClick={()=>setWizard({step:0,type:"first",levels:{},techniques:[],goal:"",outcome:"",homework:"",notes:"",resonanceSource:"Intuition",clientName:"",clientId:null,category:""})}>✦ Sitzung starten</Btn>
    </div>
  );
  const t2=top2(wizard.levels||{});
  const upd=u=>setWizard({...wizard,...u});
  const genAI=async()=>{
    setAiLoading(true);
    try{const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:`Du bist ein einfühlsamer Begleiter im Lichtkern-System. Schreibe eine warmherzige Sitzungsdokumentation (kein KI-Ton):\nKlient: ${wizard.clientName||"Anonym"} | Typ: ${wizard.type==="first"?"Erstsitzung":wizard.type==="followup"?"Folgesitzung":"Abschluss"}\nThema: ${wizard.goal||"—"} | Ebenen: ${t2.map(([k,v])=>`${lvl(k)?.name} (${v}%)`).join(", ")||"—"}\nTechniken: ${wizard.techniques?.join(", ")||"—"} | Ergebnis: ${wizard.outcome||"—"} | Integration: ${wizard.homework||"—"}\n1. Warmherzige Zusammenfassung (3-4 Sätze) 2. 2-3 Integrationsimpulse mit Reflexionsfragen. Keine Heilversprechen.`}]})});
      const d=await r.json();setAiText(d.content?.[0]?.text||"Fehler.");}catch{setAiText("Netzwerkfehler.");}
    setAiLoading(false);
  };
  return(
    <div style={{display:"flex",flexDirection:"column",minHeight:"100%"}}>
      <div style={{padding:"12px 16px 0"}}>
        <div style={{display:"flex",gap:"5px",marginBottom:"10px"}}>{STEPS.map((s,i)=><div key={s} style={{flex:1,height:"5px",borderRadius:"3px",transition:"all 0.3s",background:i<wizard.step?T.teal:i===wizard.step?`linear-gradient(to right,${T.teal},${T.violet})`:T.border}}/>)}</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontFamily:"Raleway",fontSize:"10px",color:T.textMid,fontWeight:700,letterSpacing:"1px"}}>{STEPS[wizard.step].toUpperCase()} · {wizard.step+1}/{STEPS.length}</span>
          {wizard.clientName&&<span style={{fontFamily:"Raleway",fontSize:"11px",color:T.teal,fontWeight:700}}>{wizard.clientName}</span>}
        </div>
      </div>
      <div style={{position:"relative",margin:"12px 16px",borderRadius:"18px",overflow:"hidden",padding:"20px 22px",background:dynGrad(wizard.levels||{}),boxShadow:`0 3px 18px ${T.shadow}`,border:`1.5px solid ${T.border}`}}>
        <Flower size={180} opacity={0.1}/>
        <div style={{position:"relative",zIndex:1}}>
          <h2 style={{fontFamily:"Cinzel",fontSize:"20px",color:T.text,margin:"0 0 10px",fontWeight:700}}>{STEPS[wizard.step]}</h2>
          {t2.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>{t2.map(([k,v])=>{const i=lvl(k);return<span key={k} style={{fontSize:"11px",padding:"5px 13px",borderRadius:"20px",background:"rgba(255,255,255,0.85)",color:i?.text,fontFamily:"Raleway",fontWeight:700,border:`1.5px solid ${i?.border}`}}>{i?.icon} {i?.name} {v}%</span>;})}</div>}
        </div>
      </div>
      <div style={{flex:1,padding:"0 16px",overflowY:"auto"}}>
        {wizard.step===0&&<SC wizard={wizard} clients={clients} upd={upd}/>}
        {wizard.step===1&&<SG wizard={wizard} upd={upd}/>}
        {wizard.step===2&&<SLvl wizard={wizard} upd={upd}/>}
        {wizard.step===3&&<ST wizard={wizard} upd={upd} t2={t2}/>}
        {wizard.step===4&&<SA wizard={wizard} upd={upd} aiText={aiText} aiLoading={aiLoading} onGen={genAI}/>}
      </div>
      <div style={{padding:"12px 16px 88px",display:"flex",gap:"10px"}}>
        <Btn variant="soft" onClick={wizard.step===0?onCancel:()=>upd({step:wizard.step-1})} style={{flex:1}}>{wizard.step===0?"✕":"← Zurück"}</Btn>
        {wizard.step<4?<Btn onClick={()=>upd({step:wizard.step+1})} style={{flex:2}}>Weiter →</Btn>:<Btn variant="success" onClick={()=>onComplete({...wizard,aiSummary:aiText})} style={{flex:2}}>✦ Abschließen</Btn>}
      </div>
    </div>
  );
}
function SC({wizard,clients,upd}){return(<div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
  <div><SL>Klient</SL><div style={{display:"flex",flexDirection:"column",gap:"6px",maxHeight:"200px",overflowY:"auto"}}>{clients.length===0&&<div style={{fontFamily:"Raleway",fontSize:"13px",color:T.textMid,fontWeight:500}}>Noch keine Klienten angelegt</div>}{clients.map(c=><button key={c.id} onClick={()=>upd({clientId:c.id,clientName:c.name})} style={{textAlign:"left",padding:"12px 14px",borderRadius:"12px",border:`1.5px solid ${wizard.clientId===c.id?T.teal:T.border}`,background:wizard.clientId===c.id?T.tealL:"white",cursor:"pointer"}}><div style={{fontFamily:"Raleway",fontWeight:700,fontSize:"13px",color:T.text}}>{c.name}</div></button>)}</div></div>
  <div><SL>Oder freier Name</SL><TI value={wizard.clientName||""} onChange={v=>upd({clientName:v,clientId:null})} placeholder="Name oder Kürzel…"/></div>
  <div><SL>Sitzungstyp</SL><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"}}>{[["first","🌱 Erst"],["followup","🔄 Folge"],["closing","✨ Abschluss"]].map(([v,l])=><button key={v} onClick={()=>upd({type:v})} style={{padding:"11px 6px",borderRadius:"12px",border:`1.5px solid ${wizard.type===v?T.teal:T.border}`,background:wizard.type===v?T.tealL:"white",cursor:"pointer",fontFamily:"Raleway",fontSize:"11px",fontWeight:700,color:wizard.type===v?T.tealD:T.textMid}}>{l}</button>)}</div></div>
</div>);}
function SG({wizard,upd}){return(<div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
  <div><SL>Thema / Anliegen</SL><TI value={wizard.goal||""} onChange={v=>upd({goal:v})} placeholder="Was ist heute das zentrale Anliegen?" multiline rows={4}/></div>
  <div><SL>Kategorie</SL><div style={{display:"flex",flexWrap:"wrap",gap:"7px"}}>{["Körper","Emotion","Beziehung","Beruf","Ahnen","Bewusstsein","Trauma","Sonstiges"].map(o=><Pill key={o} label={o} active={wizard.category===o} onClick={()=>upd({category:wizard.category===o?"":o})}/>)}</div></div>
  <div><SL>Resonanz-Quelle</SL><div style={{display:"flex",flexWrap:"wrap",gap:"7px"}}>{["Intuition","Muskeltest","Pendel","Kinesiologie","Sonstiges"].map(o=><Pill key={o} label={o} active={wizard.resonanceSource===o} onClick={()=>upd({resonanceSource:o})}/>)}</div></div>
</div>);}
function SLvl({wizard,upd}){
  const ls=wizard.levels||{},set=(k,v)=>upd({levels:{...ls,[k]:v}}),t2=top2(ls);
  return(<div><SL>Ebenen-Scan</SL><Card style={{padding:"14px"}}>{LEVELS.map(l=><LBar key={l.key} levelKey={l.key} value={ls[l.key]||0} onChange={set}/>)}</Card>
    {t2.length>=2&&<div style={{marginTop:"10px",background:T.bgSoft,borderRadius:"14px",padding:"14px",border:`1.5px solid ${T.borderMid}`}}><SL color={T.tealD}>✦ System-Analyse</SL>{t2.map(([k,v])=>{const i=lvl(k);return<div key={k} style={{fontFamily:"Raleway",fontSize:"13px",color:T.text,marginBottom:"6px",fontWeight:600}}><span style={{fontWeight:800}}>{i?.icon} {i?.name}</span><span style={{color:T.textMid,fontWeight:500}}> · {v}% aktiv</span></div>;})}</div>}
  </div>);
}
function ST({wizard,upd,t2}){
  const sel=wizard.techniques||[];
  const tog=t=>upd({techniques:sel.includes(t)?sel.filter(x=>x!==t):[...sel,t]});
  const keys=t2.map(([k])=>k);
  const sugg=[...new Set([...(keys.some(k=>["emotional","mental"].includes(k))?["Emotionale Transformation","Mentale Muster"]:[]),...(keys.includes("dna")?["DNA & Ahnen","Zeitlinie & Karma"]:[]),...(keys.includes("energetisch")?["Meridian & Chakren"]:[]),...(keys.includes("spirituell")?["Schamanismus","Fernheilung"]:[]),...(keys.some(k=>["struktur","stoffwechsel"].includes(k))?["Analyse & Anamnese"]:[])])];
  return(<div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
    {sugg.length>0&&<div style={{background:T.bgSoft,borderRadius:"14px",padding:"14px",border:`1.5px solid ${T.borderMid}`}}><SL color={T.tealD}>✦ Empfehlungen</SL><div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>{sugg.map(s=><span key={s} style={{fontSize:"11px",padding:"5px 13px",borderRadius:"20px",background:T.teal,color:"white",fontFamily:"Raleway",fontWeight:700}}>{s}</span>)}</div></div>}
    {Object.entries(TECHNIQUES).map(([cat,items])=><div key={cat}><div style={{fontFamily:"Raleway",fontSize:"10px",letterSpacing:"2px",fontWeight:800,color:sugg.includes(cat)?T.tealD:T.textSoft,textTransform:"uppercase",marginBottom:"8px"}}>{sugg.includes(cat)?"✦ ":""}{cat}</div><div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>{items.map(item=><button key={item} onClick={()=>tog(item)} style={{fontFamily:"Raleway",fontSize:"12px",fontWeight:600,padding:"7px 15px",borderRadius:"20px",border:`1.5px solid ${sel.includes(item)?T.teal:T.border}`,background:sel.includes(item)?T.teal:"white",color:sel.includes(item)?"white":T.textMid,cursor:"pointer",transition:"all 0.15s"}}>{item}</button>)}</div></div>)}
    {sel.length>0&&<div style={{background:T.tealL,borderRadius:"14px",padding:"14px",border:`1.5px solid ${T.borderMid}`}}><SL color={T.tealD}>Ausgewählt ({sel.length})</SL><div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>{sel.map(t=><span key={t} style={{fontSize:"11px",padding:"5px 13px",borderRadius:"20px",background:T.teal,color:"white",fontFamily:"Raleway",fontWeight:700}}>{t}</span>)}</div></div>}
  </div>);
}
function SA({wizard,upd,aiText,aiLoading,onGen}){
  const [pdfModal,setPdfModal]=useState(false);
  const previewSession={...wizard,aiSummary:aiText,createdAt:new Date().toISOString()};
  return(<div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
  <div><SL>Ergebnis</SL><TI value={wizard.outcome||""} onChange={v=>upd({outcome:v})} placeholder="Was hat sich gezeigt?" multiline rows={3}/></div>
  <div><SL>Integrationsauftrag</SL><TI value={wizard.homework||""} onChange={v=>upd({homework:v})} placeholder="Was soll der Klient beobachten?" multiline rows={2}/></div>
  <div><SL>Private Notizen</SL><TI value={wizard.notes||""} onChange={v=>upd({notes:v})} placeholder="Nur für dich…" multiline rows={2}/></div>
  <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
      <SL>✦ KI-Zusammenfassung</SL>
      <button onClick={onGen} disabled={aiLoading} style={{fontFamily:"Raleway",fontSize:"12px",fontWeight:700,padding:"8px 16px",borderRadius:"10px",border:"none",cursor:aiLoading?"wait":"pointer",background:`linear-gradient(135deg,${T.teal},${T.tealD})`,color:"white",opacity:aiLoading?0.6:1}}>{aiLoading?"⏳ Generiert…":"✦ Generieren"}</button>
    </div>
    {aiText?<Card style={{background:T.bgSoft,border:`1.5px solid ${T.borderMid}`}}><div style={{fontFamily:"Raleway",fontSize:"13px",color:T.text,lineHeight:"1.85",whiteSpace:"pre-wrap",fontWeight:500}}>{aiText}</div></Card>
    :<div style={{background:T.bgSofter,borderRadius:"14px",padding:"22px",textAlign:"center",border:`1.5px solid ${T.border}`}}><div style={{fontFamily:"Raleway",fontSize:"13px",color:T.textSoft,fontWeight:500}}>Einfühlsame Zusammenfassung generieren</div></div>}
  </div>
  {/* Honorar */}
  <div style={{background:"#EDFAF2",borderRadius:"16px",padding:"14px",border:"1.5px solid #4DC98A"}}>
    <SL color="#0A3B20">💰 Honorar</SL>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"10px"}}>
      <div><TI value={wizard.fee||""} onChange={v=>upd({fee:v})} placeholder="Betrag (z.B. 120)"/></div>
      <div>
        <select value={wizard.payStatus||"open"} onChange={e=>upd({payStatus:e.target.value})} style={{width:"100%",background:"#FFF",border:`1.5px solid ${T.border}`,borderRadius:"12px",padding:"11px 14px",color:T.text,fontFamily:"Raleway",fontSize:"13px",fontWeight:500,outline:"none",appearance:"none"}}>
          <option value="open">📋 Offen</option>
          <option value="partial">⚠️ Teilbezahlt</option>
          <option value="paid">✅ Bezahlt</option>
        </select>
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
      <div><TI value={wizard.invoiceNr||""} onChange={v=>upd({invoiceNr:v})} placeholder="Rechnungs-Nr."/></div>
      <div><TI type="date" value={wizard.invoiceDate||""} onChange={v=>upd({invoiceDate:v})}/></div>
    </div>
  </div>
  <button onClick={()=>setPdfModal(true)} style={{width:"100%",fontFamily:"Raleway",fontWeight:700,fontSize:"13px",padding:"12px",borderRadius:"12px",border:`1.5px solid ${T.border}`,background:T.bgSoft,color:T.textMid,cursor:"pointer"}}>
    📄 PDF für Klienten erstellen
  </button>
  {pdfModal&&<PDFModal session={previewSession} onClose={()=>setPdfModal(false)}/>}
</div>);}

// ─── HISTORY ──────────────────────────────────
function History({sessions, onDelete}){
  const [detail,setDetail]=useState(null);
  const [pdfSession,setPdfSession]=useState(null);
  if(detail)return(<div style={{padding:"0 16px 96px"}}>
    <button onClick={()=>setDetail(null)} style={{fontFamily:"Raleway",fontSize:"13px",color:T.teal,fontWeight:700,background:"none",border:"none",cursor:"pointer",paddingTop:"8px",display:"block",marginBottom:"14px"}}>← Zurück</button>
    <div style={{position:"relative",borderRadius:"20px",overflow:"hidden",padding:"24px",marginBottom:"14px",background:dynGrad(detail.levels||{}),boxShadow:`0 4px 22px ${T.shadowDeep}`,border:`1.5px solid ${T.border}`}}>
      <Flower size={200} opacity={0.1}/>
      <div style={{position:"relative",zIndex:1}}>
        <div style={{fontFamily:"Cinzel",fontSize:"22px",color:T.text,fontWeight:700}}>{detail.clientName||"—"}</div>
        <div style={{fontFamily:"Raleway",fontSize:"12px",color:T.textMid,marginTop:"3px",fontWeight:500}}>{new Date(detail.createdAt).toLocaleDateString("de-DE",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginTop:"10px"}}>{top2(detail.levels||{}).map(([k,v])=>{const i=lvl(k);return<span key={k} style={{fontSize:"11px",padding:"5px 13px",borderRadius:"20px",background:"rgba(255,255,255,0.85)",color:i?.text,fontFamily:"Raleway",fontWeight:700,border:`1.5px solid ${i?.border}`}}>{i?.icon} {i?.name} {v}%</span>;})}</div>
      </div>
    </div>
    {detail.goal&&<Card style={{marginBottom:"10px"}}><SL>Thema</SL><div style={{fontFamily:"Raleway",fontSize:"14px",color:T.text,lineHeight:"1.75",fontWeight:500}}>{detail.goal}</div></Card>}
    {Object.values(detail.levels||{}).some(v=>v>0)&&<Card style={{marginBottom:"10px"}}><SL>Ebenen</SL>{LEVELS.map(l=><LBar key={l.key} levelKey={l.key} value={detail.levels?.[l.key]||0} compact/>)}</Card>}
    {detail.techniques?.length>0&&<Card style={{marginBottom:"10px"}}><SL>Techniken</SL><div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>{detail.techniques.map(t=><span key={t} style={{fontSize:"11px",padding:"5px 13px",borderRadius:"20px",background:T.tealL,color:T.tealD,fontFamily:"Raleway",fontWeight:700,border:`1px solid ${T.borderMid}`}}>{t}</span>)}</div></Card>}
    {detail.outcome&&<Card style={{marginBottom:"10px"}}><SL>Ergebnis</SL><div style={{fontFamily:"Raleway",fontSize:"14px",color:T.text,lineHeight:"1.75",fontWeight:500}}>{detail.outcome}</div></Card>}
    {detail.homework&&<div style={{marginBottom:"10px",background:"#EDFAF2",borderRadius:"16px",padding:"16px",border:"1.5px solid #4DC98A"}}><SL color="#0A3B20">🌱 Integrationsauftrag</SL><div style={{fontFamily:"Raleway",fontSize:"14px",color:"#0A3B20",lineHeight:"1.75",fontWeight:500}}>{detail.homework}</div></div>}
    {detail.aiSummary&&<div style={{marginBottom:"10px",background:T.bgSoft,borderRadius:"16px",padding:"16px",border:`1.5px solid ${T.borderMid}`}}><SL color={T.tealD}>✦ Zusammenfassung</SL><div style={{fontFamily:"Raleway",fontSize:"13px",color:T.text,lineHeight:"1.85",whiteSpace:"pre-wrap",fontWeight:500}}>{detail.aiSummary}</div></div>}
    <div style={{display:"flex",gap:"8px",marginTop:"16px"}}>
      <button onClick={()=>setPdfSession(detail)} style={{flex:2,fontFamily:"Raleway",fontWeight:700,fontSize:"13px",padding:"12px",borderRadius:"12px",border:`1.5px solid ${T.border}`,background:T.bgSoft,color:T.textMid,cursor:"pointer"}}>
        📄 PDF erstellen
      </button>
      <button onClick={()=>{if(window.confirm("Sitzung wirklich löschen?")){{onDelete(detail.id);setDetail(null);}}}} style={{flex:1,fontFamily:"Raleway",fontWeight:700,fontSize:"13px",padding:"12px",borderRadius:"12px",border:"1.5px solid #FCA5A5",background:"#FEE2E2",color:"#9B1C1C",cursor:"pointer"}}>
        🗑 Löschen
      </button>
    </div>
    <div style={{textAlign:"center",marginTop:"16px",fontFamily:"Raleway",fontSize:"9px",letterSpacing:"2px",color:T.textSoft,lineHeight:"2",fontWeight:700}}>LICHTKERN · powered by Resonanz Akademie<br/>Kein Ersatz für medizinische Behandlung</div>
    {pdfSession&&<PDFModal session={pdfSession} onClose={()=>setPdfSession(null)}/>}
  </div>);
  return(<div style={{padding:"0 16px 96px"}}>
    <h2 style={{fontFamily:"Cinzel",fontSize:"22px",color:T.text,paddingTop:"8px",marginBottom:"16px",fontWeight:700}}>Sitzungsverlauf</h2>
    {sessions.length===0&&<div style={{textAlign:"center",padding:"60px 0"}}><div style={{fontSize:"40px",marginBottom:"10px",opacity:0.3}}>◎</div><div style={{fontFamily:"Raleway",fontSize:"14px",color:T.textMid,fontWeight:600}}>Noch keine Sitzungen</div></div>}
    <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
      {sessions.map(s=>{const t=top2(s.levels||{});const li=t[0]?lvl(t[0][0]):null;return(
        <Card key={s.id} onClick={()=>setDetail(s)} style={{cursor:"pointer"}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            <div style={{width:"46px",height:"46px",borderRadius:"50%",background:li?.bg||T.bgSoft,border:`1.5px solid ${li?.border||T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",flexShrink:0}}>{li?.icon||"✦"}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontFamily:"Raleway",fontWeight:700,fontSize:"14px",color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.clientName||"—"}</span><span style={{fontFamily:"Raleway",fontSize:"10px",color:T.textSoft,fontWeight:600,flexShrink:0,marginLeft:"8px"}}>{new Date(s.createdAt).toLocaleDateString("de-DE")}</span></div>
              <div style={{fontFamily:"Raleway",fontSize:"12px",color:T.textMid,fontWeight:500,marginTop:"3px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.goal||"Kein Thema"}</div>
              <div style={{display:"flex",gap:"5px",marginTop:"7px",flexWrap:"wrap"}}>{t.map(([k,v])=>{const i=lvl(k);return<span key={k} style={{fontSize:"10px",padding:"3px 10px",borderRadius:"10px",background:i?.bg,color:i?.text,fontFamily:"Raleway",fontWeight:700,border:`1px solid ${i?.border}`}}>{i?.name}</span>;})}</div>
            </div>
            <span style={{color:T.textSoft,fontSize:"20px"}}>›</span>
          </div>
        </Card>
      );})}
    </div>
  </div>);
}

// ─── KNOWLEDGE ────────────────────────────────
function Knowledge(){
  const [sel,setSel]=useState(null);const [tab,setTab]=useState("soft");
  if(sel)return(<div style={{padding:"0 16px 96px"}}>
    <button onClick={()=>setSel(null)} style={{fontFamily:"Raleway",fontSize:"13px",color:T.teal,fontWeight:700,background:"none",border:"none",cursor:"pointer",paddingTop:"8px",display:"block",marginBottom:"14px"}}>← Zurück</button>
    <div style={{position:"relative",borderRadius:"22px",overflow:"hidden",padding:"28px 24px",marginBottom:"16px",background:`linear-gradient(140deg,${T.tealL} 0%,#FFFFFF 50%,${T.violetL} 100%)`,boxShadow:`0 6px 28px ${T.shadowDeep}`,border:`1.5px solid ${T.border}`}}>
      <Flower size={200} opacity={0.11}/>
      <div style={{position:"relative",zIndex:1}}><div style={{fontSize:"50px",marginBottom:"12px"}}>{sel.icon}</div><h2 style={{fontFamily:"Cinzel",fontSize:"24px",color:T.text,margin:0,fontWeight:700}}>{sel.title}</h2></div>
    </div>
    <div style={{display:"flex",gap:"8px",marginBottom:"14px"}}>{[["soft","🌱 Erklärung"],["deep","🎓 Schulung"]].map(([v,l])=><button key={v} onClick={()=>setTab(v)} style={{flex:1,padding:"12px",borderRadius:"12px",border:`1.5px solid ${tab===v?T.teal:T.border}`,background:tab===v?T.teal:"white",cursor:"pointer",fontFamily:"Raleway",fontSize:"12px",fontWeight:700,color:tab===v?"white":T.textMid,transition:"all 0.15s"}}>{l}</button>)}</div>
    <Card>{tab==="soft"?<div style={{fontFamily:"Raleway",fontSize:"14px",color:T.text,lineHeight:"1.9",fontWeight:500}}>{sel.soft}</div>:<div style={{textAlign:"center",padding:"38px 0"}}><div style={{fontSize:"44px",marginBottom:"14px"}}>🎓</div><div style={{fontFamily:"Cinzel",fontSize:"15px",color:T.text,fontWeight:700}}>Schulung folgt</div><div style={{fontFamily:"Raleway",fontSize:"12px",color:T.textMid,marginTop:"6px",fontWeight:500}}>Resonanz Akademie · In Vorbereitung</div></div>}</Card>
    {sel.tags?.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginTop:"12px"}}>{sel.tags.map(t=><span key={t} style={{fontSize:"10px",padding:"4px 13px",borderRadius:"12px",background:T.tealL,color:T.tealD,fontFamily:"Raleway",fontWeight:700,border:`1px solid ${T.borderMid}`}}>{t}</span>)}</div>}
  </div>);
  return(<div style={{padding:"0 16px 96px"}}>
    <div style={{position:"relative",borderRadius:"22px",overflow:"hidden",padding:"26px 24px",marginBottom:"20px",background:`linear-gradient(140deg,${T.tealL} 0%,#FFFFFF 50%,${T.violetL} 100%)`,boxShadow:`0 6px 28px ${T.shadowDeep}`,border:`1.5px solid ${T.border}`}}>
      <Flower size={220} opacity={0.1}/>
      <div style={{position:"relative",zIndex:1}}><h2 style={{fontFamily:"Cinzel",fontSize:"22px",color:T.text,margin:"0 0 4px",fontWeight:700}}>Wissensbasis</h2><p style={{fontFamily:"Raleway",fontSize:"11px",color:T.textMid,margin:0,fontWeight:600}}>10 Kernthemen · Soft & Deep</p></div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
      {KNOWLEDGE.map(item=><div key={item.id} onClick={()=>{setSel(item);setTab("soft");}} style={{background:"#FFFFFF",borderRadius:"18px",padding:"18px",cursor:"pointer",border:`1.5px solid ${T.border}`,boxShadow:`0 3px 14px ${T.shadow}`}}>
        <span style={{fontSize:"32px",display:"block",marginBottom:"10px"}}>{item.icon}</span>
        <div style={{fontFamily:"Raleway",fontWeight:800,fontSize:"13px",color:T.text,marginBottom:"7px"}}>{item.title}</div>
        <div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textMid,lineHeight:"1.65",fontWeight:500,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{item.soft}</div>
        {item.tags?.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:"4px",marginTop:"10px"}}>{item.tags.map(t=><span key={t} style={{fontSize:"9px",padding:"2px 9px",borderRadius:"10px",background:T.tealL,color:T.tealD,fontFamily:"Raleway",fontWeight:700}}>{t}</span>)}</div>}
      </div>)}
    </div>
  </div>);
}

// ─── PDF GENERATOR ────────────────────────────
const LEVEL_COLORS = {
  struktur:"#B07D2A",stoffwechsel:"#C05A3E",energetisch:"#0D9488",
  emotional:"#17956A",mental:"#9A820A",spirituell:"#6D3FCC",
  universell:"#8B4ED4",dna:"#2C7FD4",
};

function flowerSVG(size=500,color="#0D9488",opacity=0.07){
  const r=55,cx=size/2,cy=size/2;
  const pts=[[0,0],[r,0],[-r,0],[r/2,r*0.866],[-r/2,r*0.866],[r/2,-r*0.866],[-r/2,-r*0.866]];
  const circles=pts.map(([dx,dy])=>`<circle cx="${cx+dx}" cy="${cy+dy}" r="${r}" fill="none" stroke="${color}" stroke-width="1.2"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="position:absolute;top:0;left:50%;transform:translateX(-50%);opacity:${opacity};pointer-events:none;">${circles}<circle cx="${cx}" cy="${cy}" r="${r*2}" fill="none" stroke="${color}" stroke-width="0.6"/></svg>`;
}

function buildPDF(session, opts){
  const {version,praxisname,showGoal,showLevels,showTechniques,showOutcome,showHomework,showAI,showReflection} = opts;
  const t2 = top2(session.levels||{});
  const c1 = t2[0] ? (LEVEL_COLORS[t2[0][0]]||"#0D9488") : "#0D9488";
  const c2 = t2[1] ? (LEVEL_COLORS[t2[1][0]]||"#6D3FCC") : "#6D3FCC";
  const gradBg = `linear-gradient(140deg,${c1}18 0%,#FFFFFF 45%,${c2}18 100%)`;
  const dateStr = new Date(session.createdAt).toLocaleDateString("de-DE",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
  const typeLabel = session.type==="first"?"Erstsitzung":session.type==="followup"?"Folgesitzung":"Abschlusssitzung";

  const levelRows = LEVELS.filter(l=>(session.levels?.[l.key]||0)>0).map(l=>{
    const val=session.levels[l.key]||0;
    const bar=`<div style="height:8px;border-radius:4px;background:#E5E0F5;margin-top:4px;"><div style="height:100%;width:${val}%;border-radius:4px;background:${l.bar};"></div></div>`;
    return `<div style="margin-bottom:10px;"><div style="display:flex;justify-content:space-between;"><span style="font-family:Raleway,sans-serif;font-size:13px;font-weight:700;color:${l.text};">${l.icon} ${l.name}</span><span style="font-family:Raleway,sans-serif;font-size:12px;font-weight:800;color:${l.text};background:${l.bg};padding:2px 10px;border-radius:8px;">${val}%</span></div>${bar}</div>`;
  }).join("");

  const techPills = (session.techniques||[]).map(t=>`<span style="display:inline-block;background:#CCFBF1;color:#0F6B63;font-family:Raleway,sans-serif;font-size:11px;font-weight:700;padding:4px 12px;border-radius:14px;margin:3px 3px 3px 0;border:1px solid #7EC8C2;">${t}</span>`).join("");

  const reflectionQuestions = version==="detail" && showReflection ? `
    <div style="page-break-before:auto;background:#F5FDFD;border-radius:16px;padding:20px 24px;margin-bottom:24px;border:1.5px solid #B2E0DC;">
      <h3 style="font-family:Cinzel,serif;font-size:14px;color:#0F3030;margin:0 0 14px;font-weight:700;">🌿 Reflexionsraum</h3>
      ${["Was hat mich in dieser Sitzung am meisten berührt?","Welche Veränderung spüre ich bereits jetzt in mir?","Was möchte ich in den nächsten Tagen besonders beobachten?","Welcher Moment der Sitzung bleibt mir im Herzen?"].map(q=>`<div style="margin-bottom:16px;"><p style="font-family:Raleway,sans-serif;font-size:12px;color:#2D6B68;font-weight:700;margin:0 0 6px;">${q}</p><div style="border-bottom:1.5px solid #B2E0DC;height:28px;margin-bottom:4px;"></div><div style="border-bottom:1.5px solid #B2E0DC;height:28px;margin-bottom:4px;"></div></div>`).join("")}
    </div>` : "";

  const html = `<!DOCTYPE html><html lang="de"><head>
<meta charset="UTF-8"/>
<title>Lichtkern · ${session.clientName||"Sitzung"}</title>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Raleway:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#F0FAFA;font-family:Raleway,sans-serif;color:#0F3030;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  @page{margin:0;size:A4;}
  @media print{body{background:white;}.no-print{display:none!important;}}
  .page{max-width:720px;margin:0 auto;padding:40px 40px 60px;}
</style>
</head><body>
<div class="page">

  <!-- Print button -->
  <div class="no-print" style="text-align:right;margin-bottom:20px;">
    <button onclick="window.print()" style="font-family:Raleway,sans-serif;font-weight:700;font-size:13px;padding:10px 24px;background:linear-gradient(135deg,#0D9488,#0F6B63);color:white;border:none;border-radius:12px;cursor:pointer;box-shadow:0 4px 14px rgba(13,148,136,0.3);">🖨 PDF speichern / Drucken</button>
  </div>

  <!-- Header -->
  <div style="position:relative;overflow:hidden;border-radius:20px;padding:36px 36px 28px;background:${gradBg};margin-bottom:28px;border:1.5px solid #B2E0DC;">
    ${flowerSVG(420,c1,0.09)}
    <div style="position:relative;z-index:1;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
        <div>
          <p style="font-family:Raleway,sans-serif;font-size:9px;letter-spacing:3px;color:#6AABA7;text-transform:uppercase;margin-bottom:6px;font-weight:700;">SITZUNGSDOKUMENTATION</p>
          <h1 style="font-family:Cinzel,serif;font-size:28px;color:#0F3030;font-weight:700;margin-bottom:4px;">${session.clientName||"Klient"}</h1>
          <p style="font-family:Raleway,sans-serif;font-size:12px;color:#2D6B68;font-weight:500;">${dateStr}</p>
          <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
            <span style="font-size:10px;padding:4px 13px;border-radius:14px;background:rgba(255,255,255,0.8);color:#0F6B63;font-family:Raleway,sans-serif;font-weight:700;border:1px solid #7EC8C2;">${typeLabel}</span>
            ${t2.map(([k,v])=>{const i=lvl(k);return`<span style="font-size:10px;padding:4px 13px;border-radius:14px;background:rgba(255,255,255,0.8);color:${i?.text};font-family:Raleway,sans-serif;font-weight:700;border:1px solid ${i?.border};">${i?.icon} ${i?.name} ${v}%</span>`;}).join("")}
          </div>
        </div>
        <div style="text-align:right;">
          ${praxisname?`<p style="font-family:Cinzel,serif;font-size:14px;color:#0F3030;font-weight:700;">${praxisname}</p>`:""}
          <p style="font-family:Raleway,sans-serif;font-size:10px;color:#6AABA7;font-weight:700;margin-top:4px;">✦ Lichtkern</p>
        </div>
      </div>
    </div>
  </div>

  ${showGoal && session.goal ? `
  <div style="background:white;border-radius:16px;padding:20px 24px;margin-bottom:20px;border:1.5px solid #B2E0DC;box-shadow:0 3px 14px rgba(13,148,136,0.08);">
    <h3 style="font-family:Cinzel,serif;font-size:13px;color:#0F3030;margin:0 0 10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Thema & Anliegen</h3>
    <p style="font-family:Raleway,sans-serif;font-size:14px;color:#0F3030;line-height:1.8;font-weight:500;">${session.goal}</p>
  </div>` : ""}

  ${showLevels && Object.values(session.levels||{}).some(v=>v>0) ? `
  <div style="background:white;border-radius:16px;padding:20px 24px;margin-bottom:20px;border:1.5px solid #B2E0DC;box-shadow:0 3px 14px rgba(13,148,136,0.08);">
    <h3 style="font-family:Cinzel,serif;font-size:13px;color:#0F3030;margin:0 0 16px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Ebenen-Analyse</h3>
    ${levelRows}
  </div>` : ""}

  ${showTechniques && (session.techniques||[]).length>0 ? `
  <div style="background:white;border-radius:16px;padding:20px 24px;margin-bottom:20px;border:1.5px solid #B2E0DC;box-shadow:0 3px 14px rgba(13,148,136,0.08);">
    <h3 style="font-family:Cinzel,serif;font-size:13px;color:#0F3030;margin:0 0 12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Angewandte Methoden</h3>
    <div>${techPills}</div>
  </div>` : ""}

  ${showOutcome && session.outcome ? `
  <div style="background:white;border-radius:16px;padding:20px 24px;margin-bottom:20px;border:1.5px solid #B2E0DC;box-shadow:0 3px 14px rgba(13,148,136,0.08);">
    <h3 style="font-family:Cinzel,serif;font-size:13px;color:#0F3030;margin:0 0 10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Ergebnis & Beobachtungen</h3>
    <p style="font-family:Raleway,sans-serif;font-size:14px;color:#0F3030;line-height:1.8;font-weight:500;">${session.outcome}</p>
  </div>` : ""}

  ${showHomework && session.homework ? `
  <div style="background:#EDFAF2;border-radius:16px;padding:20px 24px;margin-bottom:20px;border:1.5px solid #4DC98A;">
    <h3 style="font-family:Cinzel,serif;font-size:13px;color:#0A3B20;margin:0 0 10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">🌱 Integrationsauftrag</h3>
    <p style="font-family:Raleway,sans-serif;font-size:14px;color:#0A3B20;line-height:1.8;font-weight:500;">${session.homework}</p>
  </div>` : ""}

  ${showAI && session.aiSummary ? `
  <div style="background:${gradBg};border-radius:16px;padding:20px 24px;margin-bottom:20px;border:1.5px solid #B2E0DC;position:relative;overflow:hidden;">
    ${flowerSVG(300,c1,0.07)}
    <div style="position:relative;z-index:1;">
      <h3 style="font-family:Cinzel,serif;font-size:13px;color:#0F3030;margin:0 0 12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">✦ Sitzungsresonanz</h3>
      <p style="font-family:Raleway,sans-serif;font-size:13px;color:#0F3030;line-height:1.9;font-weight:500;white-space:pre-wrap;">${session.aiSummary}</p>
    </div>
  </div>` : ""}

  ${reflectionQuestions}

  <!-- Footer -->
  <div style="border-top:1.5px solid #B2E0DC;margin-top:32px;padding-top:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
    <div>
      <p style="font-family:Cinzel,serif;font-size:11px;color:#0D9488;font-weight:700;">✦ Lichtkern · powered by Resonanz Akademie</p>
      ${praxisname?`<p style="font-family:Raleway,sans-serif;font-size:10px;color:#6AABA7;margin-top:2px;">${praxisname}</p>`:""}
    </div>
    <p style="font-family:Raleway,sans-serif;font-size:9px;color:#6AABA7;text-align:right;line-height:1.6;">Keine medizinische Diagnose.<br/>Kein Ersatz für ärztliche oder therapeutische Behandlung.</p>
  </div>

</div>
</body></html>`;
  return html;
}

// ─── PDF MODAL ────────────────────────────────
function PDFModal({ session, onClose }) {
  const [version,setVersion]         = useState("kurz");
  const [praxisname,setPraxisname]   = useState("");
  const [email,setEmail]             = useState("");
  const [showGoal,setShowGoal]       = useState(true);
  const [showLevels,setShowLevels]   = useState(true);
  const [showTechniques,setShowTech] = useState(true);
  const [showOutcome,setShowOutcome] = useState(true);
  const [showHomework,setShowHW]     = useState(true);
  const [showAI,setShowAI]           = useState(!!session.aiSummary);
  const [showReflection,setShowRef]  = useState(false);

  const Toggle = ({label,val,set})=>(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${T.border}`}}>
      <span style={{fontFamily:"Raleway",fontSize:"13px",color:T.text,fontWeight:500}}>{label}</span>
      <button onClick={()=>set(!val)} style={{width:"44px",height:"24px",borderRadius:"12px",border:"none",cursor:"pointer",background:val?T.teal:"#CBD5E1",position:"relative",transition:"background 0.2s"}}>
        <div style={{position:"absolute",top:"3px",left:val?"23px":"3px",width:"18px",height:"18px",borderRadius:"50%",background:"white",transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}}/>
      </button>
    </div>
  );

  const openPDF = () => {
    const html = buildPDF(session, {version,praxisname,showGoal,showLevels,showTechniques,showOutcome,showHomework,showAI,showReflection});
    const w = window.open("","_blank");
    if(w){ w.document.write(html); w.document.close(); }
    onClose();
  };

  const sendEmail = () => {
    if(!email.trim()) return;
    const typeLabel = session.type==="first"?"Erstsitzung":session.type==="followup"?"Folgesitzung":"Abschlusssitzung";
    const dateStr = new Date(session.createdAt||Date.now()).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"});
    const t2 = top2(session.levels||{});
    const ebenen = t2.map(([k,v])=>`${lvl(k)?.name} (${v}%)`).join(", ")||"—";
    const techniken = (session.techniques||[]).join(", ")||"—";

    const subject = encodeURIComponent(`Lichtkern · ${typeLabel} · ${dateStr}`);
    const body = encodeURIComponent(
`Liebe/r ${session.clientName||"Klient/in"},

vielen Dank für unsere gemeinsame Sitzung am ${dateStr}.
Anbei findest du deine Sitzungsdokumentation als PDF.

─── ZUSAMMENFASSUNG ───────────────────
${session.goal ? `Thema: ${session.goal}\n` : ""}Ebenen: ${ebenen}
Methoden: ${techniken}
${session.homework ? `\nDein Integrationsauftrag:\n${session.homework}` : ""}
${session.aiSummary && showAI ? `\nSitzungsresonanz:\n${session.aiSummary}` : ""}
───────────────────────────────────────

Ich wünsche dir eine integrative und lichtvolle Zeit. 🌿

${praxisname ? praxisname + "\n" : ""}✦ Lichtkern · powered by Resonanz Akademie

Hinweis: Diese Dokumentation ersetzt keine medizinische oder therapeutische Behandlung.`
    );

    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(15,48,48,0.5)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:T.bgCard,borderRadius:"24px 24px 0 0",width:"100%",maxWidth:"480px",maxHeight:"90vh",overflowY:"auto",padding:"22px 20px 40px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"18px"}}>
          <div style={{fontFamily:"Cinzel",fontSize:"17px",color:T.text,fontWeight:700}}>📄 PDF erstellen</div>
          <button onClick={onClose} style={{fontSize:"20px",color:T.textSoft,background:"none",border:"none",cursor:"pointer"}}>✕</button>
        </div>

        {/* Version */}
        <SL>Version</SL>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"18px"}}>
          {[["kurz","📋 Kurzversion","Ziel, Ebenen, Methoden, Auftrag"],["detail","📖 Detailversion","+ KI-Resonanz, Reflexionsraum"]].map(([v,l,sub])=>(
            <button key={v} onClick={()=>setVersion(v)} style={{padding:"12px",borderRadius:"14px",border:`1.5px solid ${version===v?T.teal:T.border}`,background:version===v?T.tealL:"white",cursor:"pointer",textAlign:"left"}}>
              <div style={{fontFamily:"Raleway",fontSize:"12px",fontWeight:700,color:version===v?T.tealD:T.text}}>{l}</div>
              <div style={{fontFamily:"Raleway",fontSize:"10px",color:T.textSoft,marginTop:"3px",fontWeight:500}}>{sub}</div>
            </button>
          ))}
        </div>

        {/* Praxisname */}
        <SL>Praxisname (optional)</SL>
        <div style={{marginBottom:"14px"}}>
          <TI value={praxisname} onChange={setPraxisname} placeholder="z.B. Praxis Sonnenlicht"/>
        </div>

        {/* Email */}
        <SL>E-Mail Adresse Klient (optional)</SL>
        <div style={{marginBottom:"18px"}}>
          <TI type="email" value={email} onChange={setEmail} placeholder="klient@beispiel.de"/>
        </div>

        {/* Content toggles */}
        <SL>Inhalte</SL>
        <Card style={{padding:"0 14px",marginBottom:"18px"}}>
          <Toggle label="Thema & Anliegen"     val={showGoal}       set={setShowGoal}/>
          <Toggle label="Ebenen-Analyse"        val={showLevels}     set={setShowLevels}/>
          <Toggle label="Angewandte Methoden"   val={showTechniques} set={setShowTech}/>
          <Toggle label="Ergebnis"              val={showOutcome}    set={setShowOutcome}/>
          <Toggle label="Integrationsauftrag"   val={showHomework}   set={setShowHW}/>
          <Toggle label="KI-Zusammenfassung"    val={showAI}         set={setShowAI}/>
          {version==="detail"&&<Toggle label="Reflexionsraum (leer)" val={showReflection} set={setShowRef}/>}
        </Card>

        {/* Actions */}
        <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
          <Btn onClick={openPDF} style={{width:"100%",fontSize:"14px",padding:"13px"}}>
            📄 PDF öffnen & speichern
          </Btn>
          {email.trim() && (
            <button onClick={sendEmail} style={{width:"100%",fontFamily:"Raleway",fontWeight:700,fontSize:"13px",padding:"13px",borderRadius:"12px",border:`1.5px solid ${T.teal}`,background:T.tealL,color:T.tealD,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"}}>
              ✉️ E-Mail öffnen · {email}
            </button>
          )}
        </div>
        <div style={{fontFamily:"Raleway",fontSize:"10px",color:T.textSoft,textAlign:"center",marginTop:"10px",fontWeight:500,lineHeight:"1.6"}}>
          PDF: Neuer Tab → Drucken → "Als PDF speichern"
          {email.trim() && <><br/>Mail: Öffnet dein Mailprogramm mit vorausgefüllter Nachricht</>}
        </div>
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────
// ─── LOGIN SCREEN ─────────────────────────────
function LoginScreen({ onLogin }) {
  const [mode, setMode]         = useState("login"); // "login" | "register"
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]         = useState("");
  const [praxis, setPraxis]     = useState("");
  const [dsgvo, setDsgvo]       = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [pwVisible, setPwVisible] = useState(false);

  const errMap = {
    "auth/email-already-in-use": "Diese E-Mail ist bereits registriert.",
    "auth/invalid-email": "Ungültige E-Mail-Adresse.",
    "auth/weak-password": "Passwort muss mindestens 6 Zeichen haben.",
    "auth/user-not-found": "Kein Konto mit dieser E-Mail gefunden.",
    "auth/wrong-password": "Falsches Passwort.",
    "auth/invalid-credential": "E-Mail oder Passwort falsch.",
    "auth/too-many-requests": "Zu viele Versuche. Bitte später nochmal versuchen.",
  };

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      if (mode === "register") {
        if (!dsgvo) { setError("Bitte Datenschutzerklärung akzeptieren."); setLoading(false); return; }
        if (!name.trim()) { setError("Bitte deinen Namen eingeben."); setLoading(false); return; }
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", cred.user.uid, "data", "lk_settings"), {
          value: JSON.stringify({ theme:"kristallwasser", currency:"CHF", defaultDuration:"60", autoLock:"5", pinEnabled:false, praxisname:praxis, subtitle:"", therapistName:name, defaultFee:"", disclaimer:"" })
        });
        await setDoc(doc(db, "users", cred.user.uid, "profile"), { name, praxis, email, createdAt: new Date().toISOString() });
        onLogin(cred.user);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        onLogin(cred.user);
      }
    } catch (e) {
      setError(errMap[e.code] || "Ein Fehler ist aufgetreten. Bitte versuche es nochmal.");
    }
    setLoading(false);
  };

  const inp = { width:"100%", padding:"13px 16px", borderRadius:"12px", border:`1.5px solid ${T.border}`, fontFamily:"Raleway", fontSize:"15px", color:T.text, background:T.bgSofter, outline:"none", boxSizing:"border-box" };
  const btn = { width:"100%", padding:"15px", borderRadius:"14px", background:`linear-gradient(135deg,${T.teal},${T.tealD})`, color:"white", border:"none", fontFamily:"Raleway", fontWeight:700, fontSize:"16px", cursor:"pointer", boxShadow:`0 4px 18px ${T.shadowDeep}`, marginTop:"8px" };

  return (
    <div style={{background:T.bg, minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px", position:"relative", overflow:"hidden"}}>
      <div style={{position:"fixed",top:"-80px",right:"-80px",width:"300px",height:"300px",borderRadius:"50%",background:`radial-gradient(circle,${T.tealL} 0%,transparent 70%)`,opacity:0.7,pointerEvents:"none"}}/>
      <div style={{position:"fixed",bottom:"10%",left:"-60px",width:"240px",height:"240px",borderRadius:"50%",background:`radial-gradient(circle,${T.violetL} 0%,transparent 70%)`,opacity:0.5,pointerEvents:"none"}}/>
      <div style={{width:"100%", maxWidth:"400px", position:"relative", zIndex:1}}>
        {/* Logo */}
        <div style={{textAlign:"center", marginBottom:"32px"}}>
          <div style={{width:"72px",height:"72px",borderRadius:"50%",background:`linear-gradient(135deg,${T.tealL},${T.violetL})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"28px",margin:"0 auto 12px",boxShadow:`0 6px 28px ${T.shadowDeep}`,border:`1.5px solid ${T.border}`}}>✦</div>
          <div style={{fontFamily:"Cinzel", fontSize:"26px", color:T.text, fontWeight:700, letterSpacing:"2px"}}>LICHTKERN</div>
          <div style={{fontFamily:"Raleway", fontSize:"11px", color:T.textSoft, letterSpacing:"3px", marginTop:"4px"}}>POWERED BY RESONANZ AKADEMIE</div>
        </div>

        {/* Card */}
        <div style={{background:"white", borderRadius:"20px", padding:"28px", boxShadow:`0 8px 40px ${T.shadow}`, border:`1px solid ${T.border}`}}>
          {/* Tabs */}
          <div style={{display:"flex", background:T.bgSoft, borderRadius:"10px", padding:"4px", marginBottom:"24px"}}>
            {["login","register"].map(m => (
              <button key={m} onClick={()=>{setMode(m);setError("");}} style={{flex:1,padding:"9px",borderRadius:"8px",border:"none",fontFamily:"Raleway",fontWeight:700,fontSize:"13px",cursor:"pointer",background:mode===m?"white":"transparent",color:mode===m?T.teal:T.textMid,boxShadow:mode===m?`0 2px 8px ${T.shadow}`:"none",transition:"all 0.2s"}}>
                {m === "login" ? "Anmelden" : "Registrieren"}
              </button>
            ))}
          </div>

          <div style={{display:"flex", flexDirection:"column", gap:"12px"}}>
            {mode === "register" && <>
              <input style={inp} placeholder="Dein Name" value={name} onChange={e=>setName(e.target.value)} />
              <input style={inp} placeholder="Praxisname (optional)" value={praxis} onChange={e=>setPraxis(e.target.value)} />
            </>}
            <input style={inp} type="email" placeholder="E-Mail" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} />
            <div style={{position:"relative"}}>
              <input style={{...inp, paddingRight:"48px"}} type={pwVisible?"text":"password"} placeholder="Passwort" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} />
              <button onClick={()=>setPwVisible(!pwVisible)} style={{position:"absolute",right:"12px",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:"16px",opacity:0.5}}>{pwVisible?"🙈":"👁️"}</button>
            </div>

            {mode === "register" && (
              <label style={{display:"flex", gap:"10px", alignItems:"flex-start", cursor:"pointer", marginTop:"4px"}}>
                <input type="checkbox" checked={dsgvo} onChange={e=>setDsgvo(e.target.checked)} style={{marginTop:"3px", accentColor:T.teal}} />
                <span style={{fontFamily:"Raleway", fontSize:"12px", color:T.textMid, lineHeight:"1.5"}}>
                  Ich akzeptiere die <span style={{color:T.teal, fontWeight:700}}>Datenschutzerklärung</span> und willige in die Verarbeitung meiner Daten gemäß DSGVO ein.
                </span>
              </label>
            )}

            {error && <div style={{background:"#FFF0F0", border:"1px solid #FFCCCC", borderRadius:"10px", padding:"10px 14px", fontFamily:"Raleway", fontSize:"13px", color:"#CC0000"}}>{error}</div>}

            <button style={{...btn, opacity:loading?0.7:1}} onClick={submit} disabled={loading}>
              {loading ? "⏳ Bitte warten..." : mode === "login" ? "Anmelden" : "Konto erstellen"}
            </button>
          </div>
        </div>

        <div style={{textAlign:"center", marginTop:"20px", fontFamily:"Raleway", fontSize:"11px", color:T.textSoft}}>
          ✦ Deine Daten sind sicher in Europa gespeichert
        </div>
      </div>
    </div>
  );
}

// ─── ROOT WRAPPER ─────────────────────────────
export default function Root() {
  const [user, setUser] = useState(undefined); // undefined = loading, null = logged out
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u || null));
    return unsub;
  }, []);

  if (user === undefined) return (
    <div style={{background:T.bg,height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"16px"}}>
      <div style={{width:"70px",height:"70px",borderRadius:"50%",background:`linear-gradient(135deg,${T.tealL},${T.violetL})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"30px",boxShadow:`0 6px 28px rgba(13,148,136,0.22)`,border:`1.5px solid ${T.border}`}}>✦</div>
      <div style={{fontFamily:"Raleway",fontSize:"12px",color:T.textMid,letterSpacing:"3px",fontWeight:700}}>LICHTKERN</div>
    </div>
  );
  if (!user) return <LoginScreen onLogin={setUser} />;
  return <App user={user} onLogout={async()=>{ await signOut(auth); setUser(null); }} />;
}

// ─── MAIN APP ─────────────────────────────────
function App({ user, onLogout }){
  const [screen,setScreen]           = useState("dashboard");
  const [clients,setClients]         = useState([]);
  const [sessions,setSessions]       = useState([]);
  const [appointments,setAppts]      = useState([]);
  const [wizard,setWizard]           = useState(null);
  const [genTrees,setGenTrees]       = useState({});
  const [templates,setTemplates]     = useState([]);
  const [reminders,setReminders]     = useState([]);
  const [analyticsClient,setAnalyticsClient] = useState(null);
  const [settings,setSettings]       = useState({theme:'kristallwasser',currency:'CHF',defaultDuration:'60',autoLock:'5',pinEnabled:false,praxisname:'',subtitle:'',therapistName:'',defaultFee:'',disclaimer:''});
  const [showSettings,setShowSettings] = useState(false);
  const [locked,setLocked]           = useState(false);
  const [ready,setReady]             = useState(false);

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

  if(locked)return<PinLock mode="enter" onSuccess={()=>setLocked(false)} onSetup={()=>{}}/>;
  if(!ready)return(<div style={{background:T.bg,height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"16px"}}>
    <div style={{width:"70px",height:"70px",borderRadius:"50%",background:`linear-gradient(135deg,${T.tealL},${T.violetL})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"30px",boxShadow:`0 6px 28px ${T.shadowDeep}`,border:`1.5px solid ${T.border}`}}>✦</div>
    <div style={{fontFamily:"Raleway",fontSize:"12px",color:T.textMid,letterSpacing:"3px",fontWeight:700}}>LICHTKERN</div>
  </div>);

  return(<div style={{background:T.bg,minHeight:"100vh",maxWidth:"480px",margin:"0 auto",position:"relative"}}>
    <div style={{position:"fixed",top:"-60px",right:"-60px",width:"280px",height:"280px",borderRadius:"50%",background:`radial-gradient(circle,${T.tealL} 0%,transparent 70%)`,pointerEvents:"none",zIndex:0,opacity:0.6}}/>
    <div style={{position:"fixed",bottom:"12%",left:"-50px",width:"220px",height:"220px",borderRadius:"50%",background:`radial-gradient(circle,${T.violetL} 0%,transparent 70%)`,pointerEvents:"none",zIndex:0,opacity:0.5}}/>
    <div style={{position:"relative",zIndex:1,paddingTop:"12px"}}>
      <header style={{padding:"0 16px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1.5px solid ${T.border}`,marginBottom:"4px"}}>
        <div>
          <div style={{fontFamily:"Cinzel",fontSize:"18px",color:T.text,fontWeight:700}}>✦ Lichtkern</div>
          <div style={{fontFamily:"Raleway",fontSize:"8px",color:T.textSoft,letterSpacing:"2px",textTransform:"uppercase",fontWeight:700}}>powered by Resonanz Akademie{settings.praxisname?` · ${settings.praxisname}`:""}</div>
        </div>
        <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
          <button onClick={()=>nav("billing")} style={{width:"36px",height:"36px",borderRadius:"50%",background:T.bgSoft,border:`1.5px solid ${T.border}`,fontSize:"16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>💰</button>
          <button onClick={()=>nav("templates")} style={{width:"36px",height:"36px",borderRadius:"50%",background:T.bgSoft,border:`1.5px solid ${T.border}`,fontSize:"16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>📋</button>
          <button onClick={()=>setShowSettings(true)} style={{width:"36px",height:"36px",borderRadius:"50%",background:T.bgSoft,border:`1.5px solid ${T.border}`,fontSize:"16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>⚙️</button>
          <button onClick={()=>startSession()} style={{fontFamily:"Raleway",fontWeight:700,fontSize:"12px",padding:"9px 18px",borderRadius:"20px",background:`linear-gradient(135deg,${T.teal},${T.tealD})`,color:"white",border:"none",cursor:"pointer",boxShadow:`0 3px 14px ${T.shadowDeep}`}}>+ Sitzung</button>
        </div>
      </header>
      {screen==="dashboard"&&<Dashboard clients={clients} sessions={sessions} appointments={appointments} onNav={nav} reminders={reminders} onDismissReminder={dismissReminder} onAddReminder={addReminder}/>}
      {screen==="clients"  &&<Clients clients={clients} sessions={sessions} onSave={saveClients} onStart={startSession} onDelete={async(id)=>{await saveClients(clients.filter(c=>c.id!==id));await saveSessions(sessions.filter(s=>s.clientId!==id));const nextAppts=appointments.filter(a=>a.clientId!==id);setAppts(nextAppts);try{await fsSet(user.uid,"lk_appts",JSON.stringify(nextAppts));}catch{};const nt={...genTrees};delete nt[id];setGenTrees(nt);try{await fsSet(user.uid,"lk_gentrees",JSON.stringify(nt));}catch{};}} onOnboarding={()=>nav("onboarding")} reminders={reminders} onAddReminder={addReminder} onDismissReminder={dismissReminder} onAnalyse={(id)=>{setAnalyticsClient(id);nav("clientanalysis");}}/>}
      {screen==="session"  &&<Session wizard={wizard} setWizard={setWizard} clients={clients} onComplete={completeSession} onCancel={()=>{setWizard(null);setScreen("dashboard");}} templates={templates} onStartWithTemplate={(tpl)=>startSession(null,tpl)}/>}
      {screen==="calendar" &&<CalendarScreen appointments={appointments} clients={clients} onSaveAppt={saveAppt} onDeleteAppt={deleteAppt} onStartSession={startSession}/>}
      {screen==="gentree"   &&<GenTree clients={clients} genTrees={genTrees} onSaveTree={saveGenTree}/>}
      {screen==="history"   &&<History sessions={sessions} onDelete={id=>{saveSessions(sessions.filter(s=>s.id!==id));}}/>}
      {screen==="analytics" &&<Analytics sessions={sessions} clients={clients} onSelectClient={(id)=>{setAnalyticsClient(id);setScreen("clientanalysis");}}/>}
      {screen==="clientanalysis"&&<ClientAnalysis clientId={analyticsClient} clients={clients} sessions={sessions} onBack={()=>setScreen("analytics")}/>}
      {screen==="knowledge"&&<Knowledge/>}
      {screen==="billing"   &&<Billing sessions={sessions} clients={clients} settings={settings} onUpdateSession={async(updated)=>{const next=sessions.map(s=>s.id===updated.id?updated:s);await saveSessions(next);}}/>}
      {screen==="templates" &&<TemplatesScreen templates={templates} onSave={saveTemplates} onStartSession={(tpl)=>startSession(null,tpl)}/>}
      {screen==="onboarding" &&<OnboardingScreen onSave={async(client)=>{await saveClients([...clients,client]);nav("clients");}} onCancel={()=>nav("clients")}/>}
      {showSettings&&<SettingsScreen settings={settings} onSave={saveSettings} onClose={()=>setShowSettings(false)} clients={clients} sessions={sessions} appointments={appointments} genTrees={genTrees} reminders={reminders} templates={templates} onImport={async(data)=>{if(data.clients)await saveClients(data.clients);if(data.sessions)await saveSessions(data.sessions);if(data.appointments){setAppts(data.appointments);try{await fsSet(user.uid,"lk_appts",JSON.stringify(data.appointments));}catch{}}if(data.genTrees){setGenTrees(data.genTrees);try{await fsSet(user.uid,"lk_gentrees",JSON.stringify(data.genTrees));}catch{}}if(data.reminders){setReminders(data.reminders);try{await fsSet(user.uid,"lk_reminders",JSON.stringify(data.reminders));}catch{}}if(data.templates){setTemplates(data.templates);try{await fsSet(user.uid,"lk_templates",JSON.stringify(data.templates));}catch{}}if(data.settings)await saveSettings(data.settings);}} onLogout={onLogout}/>}
    </div>
    <BottomNav active={screen} onChange={nav}/>
  </div>);
}

// ─── ANALYTICS ────────────────────────────────
function Analytics({ sessions, clients, onSelectClient }) {

  // ── compute all stats ──
  const total = sessions.length;

  // Ebenen frequency
  const ebenenCount = {};
  const ebenenSum   = {};
  LEVELS.forEach(l => { ebenenCount[l.key]=0; ebenenSum[l.key]=0; });
  sessions.forEach(s => Object.entries(s.levels||{}).forEach(([k,v]) => {
    if(v>0){ ebenenCount[k]=(ebenenCount[k]||0)+1; ebenenSum[k]=(ebenenSum[k]||0)+v; }
  }));
  const ebenenSorted = LEVELS.map(l=>({...l, count:ebenenCount[l.key]||0, avg:ebenenCount[l.key]?(ebenenSum[l.key]/ebenenCount[l.key]).toFixed(0):0})).sort((a,b)=>b.count-a.count);
  const maxEbene = Math.max(...ebenenSorted.map(e=>e.count),1);

  // Technik ranking
  const techCount = {};
  sessions.forEach(s => (s.techniques||[]).forEach(t => { techCount[t]=(techCount[t]||0)+1; }));
  const techSorted = Object.entries(techCount).sort(([,a],[,b])=>b-a).slice(0,10);
  const maxTech = Math.max(...techSorted.map(([,c])=>c),1);

  // Sessions per month (last 6 months)
  const monthMap = {};
  const now = new Date();
  for(let i=5;i>=0;i--){
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    monthMap[key] = { label: DE_MONTHS[d.getMonth()].slice(0,3), count:0 };
  }
  sessions.forEach(s => {
    const key = s.createdAt?.slice(0,7);
    if(monthMap[key]) monthMap[key].count++;
  });
  const monthData = Object.values(monthMap);
  const maxMonth = Math.max(...monthData.map(m=>m.count),1);

  // Session types
  const typeCount = { first:0, followup:0, closing:0 };
  sessions.forEach(s => { if(typeCount[s.type]!==undefined) typeCount[s.type]++; });
  const typeTotal = Math.max(total,1);

  // Categories
  const catCount = {};
  sessions.forEach(s => { if(s.category){ catCount[s.category]=(catCount[s.category]||0)+1; } });
  const catSorted = Object.entries(catCount).sort(([,a],[,b])=>b-a);
  const maxCat = Math.max(...catSorted.map(([,c])=>c),1);

  // Resonanz sources
  const resCount = {};
  sessions.forEach(s => { if(s.resonanceSource){ resCount[s.resonanceSource]=(resCount[s.resonanceSource]||0)+1; } });
  const resSorted = Object.entries(resCount).sort(([,a],[,b])=>b-a);

  // Klienten activity
  const clientActivity = clients.map(c => ({
    ...c,
    sessionCount: sessions.filter(s=>s.clientId===c.id).length,
    lastSession: sessions.filter(s=>s.clientId===c.id).sort((a,b)=>b.createdAt?.localeCompare(a.createdAt))[0]
  })).sort((a,b)=>b.sessionCount-a.sessionCount).slice(0,8);
  const maxClientSessions = Math.max(...clientActivity.map(c=>c.sessionCount),1);

  // Tags / Krankheitsbilder
  const tagCount = {};
  clients.forEach(c => (c.tags||[]).forEach(t => { tagCount[t]=(tagCount[t]||0)+1; }));
  const tagSorted = Object.entries(tagCount).sort(([,a],[,b])=>b-a).slice(0,12);

  // Goal keywords (simple word frequency)
  const stopwords = new Set(["und","die","der","das","ich","ist","von","mit","für","ein","eine","bei","sich","im","in","an","auf","zu","nicht","es","hat","wie","was","dem","den","aus","als"]);
  const wordCount = {};
  sessions.forEach(s => {
    (s.goal||"").toLowerCase().replace(/[^\wäöüß\s]/g,"").split(/\s+/).forEach(w => {
      if(w.length>3 && !stopwords.has(w)){ wordCount[w]=(wordCount[w]||0)+1; }
    });
  });
  const topWords = Object.entries(wordCount).sort(([,a],[,b])=>b-a).slice(0,10);

  // ── sub-components ──
  const SectionCard = ({title,icon,children,style={}}) => (
    <Card style={{marginBottom:"16px",...style}}>
      <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"14px"}}>
        <span style={{fontSize:"18px"}}>{icon}</span>
        <span style={{fontFamily:"Cinzel",fontSize:"13px",color:T.text,fontWeight:700}}>{title}</span>
      </div>
      {children}
    </Card>
  );

  const HBar = ({label,value,max,color,bg,suffix="",sublabel=""}) => (
    <div style={{marginBottom:"10px"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
        <span style={{fontFamily:"Raleway",fontSize:"12px",color:T.text,fontWeight:600}}>{label}</span>
        <span style={{fontFamily:"Raleway",fontSize:"11px",color:color,fontWeight:800}}>{value}{suffix}</span>
      </div>
      {sublabel && <div style={{fontFamily:"Raleway",fontSize:"10px",color:T.textSoft,fontWeight:500,marginBottom:"3px"}}>{sublabel}</div>}
      <div style={{height:"8px",borderRadius:"4px",background:bg||T.bgSoft,border:`1px solid ${T.border}`}}>
        <div style={{height:"100%",width:`${Math.round((value/max)*100)}%`,borderRadius:"4px",background:color,transition:"width 0.4s"}}/>
      </div>
    </div>
  );

  const DonutSlice = ({percent,color,offset}) => {
    const r=38, c=50, circ=2*Math.PI*r;
    const dash = (percent/100)*circ;
    return <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth="14"
      strokeDasharray={`${dash} ${circ-dash}`}
      strokeDashoffset={-offset*(circ/100)}
      style={{transform:"rotate(-90deg)",transformOrigin:"50% 50%"}}/>;
  };

  if(total===0) return (
    <div style={{padding:"0 16px 96px"}}>
      <div style={{position:"relative",borderRadius:"22px",overflow:"hidden",padding:"26px 24px",marginBottom:"20px",background:`linear-gradient(140deg,${T.tealL} 0%,#FFFFFF 50%,${T.violetL} 100%)`,boxShadow:`0 6px 28px ${T.shadowDeep}`,border:`1.5px solid ${T.border}`}}>
        <Flower size={220} opacity={0.1}/>
        <div style={{position:"relative",zIndex:1}}>
          <h2 style={{fontFamily:"Cinzel",fontSize:"22px",color:T.text,margin:"0 0 4px",fontWeight:700}}>Analyse</h2>
          <p style={{fontFamily:"Raleway",fontSize:"11px",color:T.textMid,margin:0,fontWeight:600}}>Noch keine Daten vorhanden</p>
        </div>
      </div>
      <div style={{textAlign:"center",padding:"48px 0"}}>
        <div style={{fontSize:"40px",marginBottom:"12px",opacity:0.3}}>📊</div>
        <div style={{fontFamily:"Raleway",fontSize:"14px",color:T.textMid,fontWeight:600}}>Starte deine erste Sitzung</div>
        <div style={{fontFamily:"Raleway",fontSize:"12px",color:T.textSoft,fontWeight:500,marginTop:"6px"}}>Daten erscheinen nach der ersten Sitzung</div>
      </div>
    </div>
  );

  // Donut data for session types
  let offset=0;
  const donutData=[
    {label:"Erstsitzung",  value:typeCount.first,   color:T.teal,   pct:Math.round(typeCount.first/typeTotal*100)},
    {label:"Folgesitzung", value:typeCount.followup, color:T.violet, pct:Math.round(typeCount.followup/typeTotal*100)},
    {label:"Abschluss",    value:typeCount.closing,  color:T.gold,   pct:Math.round(typeCount.closing/typeTotal*100)},
  ].filter(d=>d.value>0);

  return (
    <div style={{padding:"0 16px 96px"}}>
      {/* Hero */}
      <div style={{position:"relative",borderRadius:"22px",overflow:"hidden",padding:"24px",marginBottom:"20px",background:`linear-gradient(140deg,${T.tealL} 0%,#FFFFFF 50%,${T.violetL} 100%)`,boxShadow:`0 6px 28px ${T.shadowDeep}`,border:`1.5px solid ${T.border}`}}>
        <Flower size={220} opacity={0.1}/>
        <div style={{position:"relative",zIndex:1}}>
          <h2 style={{fontFamily:"Cinzel",fontSize:"22px",color:T.text,margin:"0 0 4px",fontWeight:700}}>Analyse</h2>
          <p style={{fontFamily:"Raleway",fontSize:"11px",color:T.textMid,margin:0,fontWeight:600}}>{total} Sitzungen · {clients.length} Klienten</p>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px",marginBottom:"16px"}}>
        {[
          {label:"Sitzungen",  value:total,                        bg:T.tealL,   border:T.borderMid, color:T.tealD},
          {label:"Klienten",   value:clients.length,               bg:T.violetL, border:"#A78BFA",   color:T.violetD},
          {label:"Ø pro Klient",value:clients.length?(total/clients.length).toFixed(1):"—", bg:T.goldL, border:"#F59E0B", color:"#7C4A00"},
        ].map((s,i)=>(
          <div key={i} style={{background:s.bg,borderRadius:"16px",border:`1.5px solid ${s.border}`,padding:"14px 8px",textAlign:"center",boxShadow:`0 2px 10px ${T.shadow}`}}>
            <div style={{fontFamily:"Cinzel",fontSize:"22px",color:s.color,fontWeight:700}}>{s.value}</div>
            <div style={{fontFamily:"Raleway",fontSize:"9px",color:s.color,marginTop:"4px",fontWeight:700,opacity:0.85}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Ebenen Häufigkeit */}
      <SectionCard title="Ebenen-Häufigkeit" icon="⚡">
        {ebenenSorted.map(e=>(
          <HBar key={e.key} label={`${e.icon} ${e.name}`} value={e.count} max={maxEbene} color={e.bar} bg={e.bg}
            sublabel={e.count>0?`Ø ${e.avg}% Aktivierung · ${e.count} Sitzung${e.count!==1?"en":""}`:""}/>
        ))}
      </SectionCard>

      {/* Zeitverlauf */}
      <SectionCard title="Sitzungen pro Monat" icon="📅">
        <div style={{display:"flex",alignItems:"flex-end",gap:"8px",height:"80px",marginBottom:"8px"}}>
          {monthData.map((m,i)=>(
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"4px",height:"100%",justifyContent:"flex-end"}}>
              <div style={{fontFamily:"Raleway",fontSize:"10px",color:T.teal,fontWeight:800}}>{m.count||""}</div>
              <div style={{width:"100%",borderRadius:"6px 6px 0 0",background:m.count>0?T.teal:T.bgSoft,height:`${Math.max((m.count/maxMonth)*100,4)}%`,border:`1px solid ${m.count>0?T.borderMid:T.border}`,transition:"height 0.4s"}}/>
              <div style={{fontFamily:"Raleway",fontSize:"9px",color:T.textSoft,fontWeight:700}}>{m.label}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Session types donut */}
      <SectionCard title="Sitzungstypen" icon="🔄">
        <div style={{display:"flex",alignItems:"center",gap:"20px"}}>
          <svg width="100" height="100" viewBox="0 0 100 100" style={{flexShrink:0}}>
            {donutData.map((d,i)=>{
              const el = <DonutSlice key={i} percent={d.pct} color={d.color} offset={offset}/>;
              offset+=d.pct; return el;
            })}
            <text x="50" y="54" textAnchor="middle" style={{fontFamily:"Cinzel,serif",fontSize:"16px",fontWeight:"700",fill:T.text}}>{total}</text>
          </svg>
          <div style={{flex:1}}>
            {donutData.map((d,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
                <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                  <div style={{width:"10px",height:"10px",borderRadius:"50%",background:d.color,flexShrink:0}}/>
                  <span style={{fontFamily:"Raleway",fontSize:"12px",color:T.text,fontWeight:600}}>{d.label}</span>
                </div>
                <span style={{fontFamily:"Raleway",fontSize:"12px",color:d.color,fontWeight:800}}>{d.value} <span style={{color:T.textSoft,fontWeight:500}}>({d.pct}%)</span></span>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Technik Ranking */}
      {techSorted.length>0 && (
        <SectionCard title="Top Techniken" icon="🏆">
          {techSorted.map(([name,count])=>(
            <HBar key={name} label={name} value={count} max={maxTech} color={T.teal} bg={T.tealL} suffix={` ×`}/>
          ))}
        </SectionCard>
      )}

      {/* Kategorien */}
      {catSorted.length>0 && (
        <SectionCard title="Themengebiete" icon="🎯">
          {catSorted.map(([cat,count])=>(
            <HBar key={cat} label={cat} value={count} max={maxCat} color={T.violet} bg={T.violetL} suffix=" Sitzungen"/>
          ))}
        </SectionCard>
      )}

      {/* Resonanz-Quellen */}
      {resSorted.length>0 && (
        <SectionCard title="Resonanz-Quellen" icon="🔮">
          <div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
            {resSorted.map(([src,count])=>(
              <div key={src} style={{background:T.bgSoft,borderRadius:"12px",padding:"8px 14px",border:`1.5px solid ${T.border}`}}>
                <div style={{fontFamily:"Raleway",fontSize:"13px",color:T.text,fontWeight:700}}>{src}</div>
                <div style={{fontFamily:"Raleway",fontSize:"10px",color:T.textSoft,fontWeight:600,marginTop:"2px"}}>{count}× verwendet</div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Klienten Aktivität */}
      {clientActivity.length>0 && (
        <SectionCard title="Klienten-Aktivität" icon="👥">
          {clientActivity.map(c=>(
            <div key={c.id} style={{marginBottom:"12px"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
                <span style={{fontFamily:"Raleway",fontSize:"12px",color:T.text,fontWeight:700}}>{c.name}</span>
                <span style={{fontFamily:"Raleway",fontSize:"11px",color:T.teal,fontWeight:800}}>{c.sessionCount} Sitzung{c.sessionCount!==1?"en":""}</span>
              </div>
              {c.lastSession && <div style={{fontFamily:"Raleway",fontSize:"10px",color:T.textSoft,fontWeight:500,marginBottom:"4px"}}>Letzte: {new Date(c.lastSession.createdAt).toLocaleDateString("de-DE")}</div>}
              <div style={{height:"6px",borderRadius:"3px",background:T.tealL,border:`1px solid ${T.border}`}}>
                <div style={{height:"100%",width:`${Math.round((c.sessionCount/maxClientSessions)*100)}%`,borderRadius:"3px",background:T.teal}}/>
              </div>
              <button onClick={()=>onSelectClient&&onSelectClient(c.id)} style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:700,marginTop:"5px",color:T.teal,background:"none",border:"none",cursor:"pointer",padding:0}}>📊 Detail-Analyse →</button>
            </div>
          ))}
        </SectionCard>
      )}

      {/* Tags / Krankheitsbilder */}
      {tagSorted.length>0 && (
        <SectionCard title="Themen & Krankheitsbilder" icon="🏷">
          <div style={{display:"flex",flexWrap:"wrap",gap:"7px"}}>
            {tagSorted.map(([tag,count])=>(
              <div key={tag} style={{background:T.bgSoft,borderRadius:"20px",padding:"6px 14px",border:`1.5px solid ${T.border}`,display:"flex",alignItems:"center",gap:"6px"}}>
                <span style={{fontFamily:"Raleway",fontSize:"12px",color:T.text,fontWeight:700}}>{tag}</span>
                <span style={{fontFamily:"Raleway",fontSize:"10px",color:T.teal,fontWeight:800,background:T.tealL,padding:"1px 7px",borderRadius:"10px"}}>{count}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Häufige Themen-Keywords */}
      {topWords.length>0 && (
        <SectionCard title="Häufige Themen-Begriffe" icon="💬">
          <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
            {topWords.map(([word,count],i)=>{
              const size = 11 + Math.round((count / (topWords[0][1]||1)) * 6);
              return(
                <span key={word} style={{fontFamily:"Raleway",fontSize:`${size}px`,fontWeight:700,color:i<3?T.tealD:T.textMid,background:i<3?T.tealL:T.bgSoft,padding:"5px 12px",borderRadius:"16px",border:`1px solid ${i<3?T.borderMid:T.border}`}}>
                  {word} <span style={{fontSize:"10px",opacity:0.7}}>×{count}</span>
                </span>
              );
            })}
          </div>
        </SectionCard>
      )}

    </div>
  );
}

// ─── GENERATIONSBAUM ──────────────────────────
const GEN_ROLES = ["Ich","Mutter","Vater","Mutter-Mutter","Mutter-Vater","Vater-Mutter","Vater-Vater"];
const GEN_THEMES = ["Trauma","Verlust","Sucht","Krankheit","Armut","Gewalt","Trennung","Einsamkeit","Schuld","Scham","Loyalität","Opferrolle","Kontrolle","Angst","Depression","Perfektionismus"];
const RELATION_TYPES = ["Mutter","Vater","Kind","Geschwister","Partner/in","Großelternteil","Sonstiges"];

const TREE_LAYOUT = [
  // [role, col, row, genLabel]
  ["Mutter-Mutter",0,0,"3. Generation"],
  ["Mutter-Vater", 1,0,"3. Generation"],
  ["Vater-Mutter", 2,0,"3. Generation"],
  ["Vater-Vater",  3,0,"3. Generation"],
  ["Mutter",       0.5,1,"2. Generation"],
  ["Vater",        2.5,1,"2. Generation"],
  ["Ich",          1.5,2,"Klient"],
];

const emptyPerson = (role) => ({role,name:"",birthYear:"",deathYear:"",alive:true,themes:[],loyalties:"",notes:""});

const REL_COLORS = {
  "Mutter":     "#C2185B", "Vater":       "#1565C0",
  "Kind":       "#2E7D32", "Geschwister": "#6A1B9A",
  "Partner/in": "#E65100", "Großelternteil":"#4E342E",
  "Sonstiges":  "#546E7A",
};

// ─── GENTREE MODALS ─────────────────────────
function PersonEditModal_v2({ person, onSave, onClose }) {
  const [form,setForm]=useState({...person});
  const up=u=>setForm({...form,...u});
  const toggleTheme=t=>up({themes:form.themes?.includes(t)?form.themes.filter(x=>x!==t):[...(form.themes||[]),t]});
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(15,48,48,0.5)",zIndex:400,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:T.bgCard,borderRadius:"24px 24px 0 0",width:"100%",maxWidth:"480px",maxHeight:"88vh",overflowY:"auto",padding:"22px 20px 48px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
          <div style={{fontFamily:"Cinzel",fontSize:"16px",color:T.text,fontWeight:700}}>{person.role==="Ich"?"Klient":person.role}</div>
          <button onClick={onClose} style={{fontSize:"20px",color:T.textSoft,background:"none",border:"none",cursor:"pointer"}}>✕</button>
        </div>
        <SL>Name</SL><div style={{marginBottom:"12px"}}><TI value={form.name||""} onChange={v=>up({name:v})} placeholder="Vorname…"/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"12px"}}>
          <div><SL>Geburtsjahr</SL><TI value={form.birthYear||""} onChange={v=>up({birthYear:v})} placeholder="1945"/></div>
          <div><SL>Todesjahr</SL><TI value={form.deathYear||""} onChange={v=>up({deathYear:v})} placeholder="—"/></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"14px"}}>
          <button onClick={()=>up({alive:!form.alive})} style={{width:"44px",height:"24px",borderRadius:"12px",border:"none",cursor:"pointer",background:form.alive?T.teal:"#CBD5E1",position:"relative",transition:"background 0.2s"}}>
            <div style={{position:"absolute",top:"3px",left:form.alive?"23px":"3px",width:"18px",height:"18px",borderRadius:"50%",background:"white",transition:"left 0.2s"}}/>
          </button>
          <span style={{fontFamily:"Raleway",fontSize:"13px",color:T.text,fontWeight:500}}>{form.alive?"Lebend":"Verstorben"}</span>
        </div>
        <SL>Themen & Muster</SL>
        <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:"14px"}}>
          {GEN_THEMES.map(t=>(
            <button key={t} onClick={()=>toggleTheme(t)} style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:600,padding:"5px 11px",borderRadius:"16px",border:`1.5px solid ${form.themes?.includes(t)?T.violet:T.border}`,background:form.themes?.includes(t)?T.violetL:"white",color:form.themes?.includes(t)?T.violetD:T.textMid,cursor:"pointer"}}>{t}</button>
          ))}
        </div>
        <SL>Verstrickungen</SL><div style={{marginBottom:"12px"}}><TI value={form.loyalties||""} onChange={v=>up({loyalties:v})} placeholder="z.B. Loyalität zur Mutter…" multiline rows={2}/></div>
        <SL>Notizen</SL><div style={{marginBottom:"18px"}}><TI value={form.notes||""} onChange={v=>up({notes:v})} placeholder="Weitere Beobachtungen…" multiline rows={2}/></div>
        <div style={{display:"flex",gap:"8px"}}>
          <Btn onClick={()=>onSave(form)} style={{flex:2}}>Speichern</Btn>
          <Btn variant="soft" onClick={onClose} style={{flex:1}}>Abbrechen</Btn>
        </div>
      </div>
    </div>
  );
};

function LinkModal_v2({onSave,onClose,clients,selectedClientId}){
  const [relType,setRelType]=useState("Mutter");
  const [targetId,setTargetId]=useState("");
  const [consent,setConsent]=useState(false);
  const others=(clients||[]).filter(c=>c.id!==selectedClientId);
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(15,48,48,0.5)",zIndex:400,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:T.bgCard,borderRadius:"24px 24px 0 0",width:"100%",maxWidth:"480px",maxHeight:"88vh",overflowY:"auto",padding:"22px 20px 48px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}>
          <div style={{fontFamily:"Cinzel",fontSize:"16px",color:T.text,fontWeight:700}}>Verbindung hinzufügen</div>
          <button onClick={onClose} style={{fontSize:"20px",color:T.textSoft,background:"none",border:"none",cursor:"pointer"}}>✕</button>
        </div>
        <div style={{background:"#FEF9EC",borderRadius:"14px",padding:"13px",marginBottom:"14px",border:"1.5px solid #D9A84E"}}>
          <div style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:800,color:"#4A2E00",marginBottom:"5px",letterSpacing:"1px",textTransform:"uppercase"}}>🔒 Datenschutz</div>
          <div style={{fontFamily:"Raleway",fontSize:"11px",color:"#4A2E00",lineHeight:"1.7",fontWeight:500}}>Nur mit ausdrücklicher Einwilligung beider Klienten. Nur der Name wird referenziert — keine Sitzungsdaten.</div>
        </div>
        <SL>Beziehungstyp</SL>
        <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:"14px"}}>
          {RELATION_TYPES.map(r=>{
            const col=REL_COLORS[r]||T.textSoft;
            return<button key={r} onClick={()=>setRelType(r)} style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:700,padding:"6px 13px",borderRadius:"16px",border:`1.5px solid ${relType===r?col:T.border}`,background:relType===r?`${col}22`:"white",color:relType===r?col:T.textMid,cursor:"pointer"}}>{r}</button>;
          })}
        </div>
        <SL>Klient auswählen</SL>
        <div style={{marginBottom:"14px"}}>
          {others.length===0?<div style={{fontFamily:"Raleway",fontSize:"13px",color:T.textSoft}}>Keine weiteren Klienten</div>
          :<Select value={targetId} onChange={setTargetId} options={[{value:"",label:"— Klient wählen —"},...others.map(c=>({value:c.id,label:c.name}))]}/>}
        </div>
        <div style={{background:"#EDFAF2",borderRadius:"14px",padding:"13px",marginBottom:"16px",border:"1.5px solid #4DC98A",display:"flex",gap:"12px",alignItems:"flex-start"}}>
          <button onClick={()=>setConsent(!consent)} style={{width:"44px",height:"24px",borderRadius:"12px",border:"none",cursor:"pointer",flexShrink:0,marginTop:"2px",background:consent?T.teal:"#CBD5E1",position:"relative",transition:"background 0.2s"}}>
            <div style={{position:"absolute",top:"3px",left:consent?"23px":"3px",width:"18px",height:"18px",borderRadius:"50%",background:"white",transition:"left 0.2s"}}/>
          </button>
          <span style={{fontFamily:"Raleway",fontSize:"11px",color:"#0A3B20",fontWeight:600,lineHeight:"1.6"}}>Einwilligung beider Klienten liegt vor.</span>
        </div>
        <Btn onClick={()=>onSave({relType,targetId,targetName:(clients||[]).find(c=>c.id===targetId)?.name||""})} disabled={!consent||!targetId} style={{width:"100%"}}>Verbindung speichern</Btn>
      </div>
    </div>
  );
}

function GenTree({ clients, genTrees, onSaveTree }) {
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [editPerson, setEditPerson]   = useState(null);
  const [linkModal, setLinkModal]     = useState(false);
  const [activeRelation, setActiveRelation] = useState(null); // clicked relation detail
  const [treeView, setTreeView]       = useState("compact"); // compact | large

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const tree = selectedClientId ? (genTrees[selectedClientId] || {}) : null;
  const getPerson = (role) => tree?.[role] || emptyPerson(role);

  const savePerson = (data) => { onSaveTree(selectedClientId, {...tree,[data.role]:data}); setEditPerson(null); };
  const saveRelation = (rel) => { const rs=[...(tree?.relations||[]),{...rel,id:uid(),consentGiven:true,date:new Date().toISOString()}]; onSaveTree(selectedClientId,{...tree,relations:rs}); setLinkModal(false); };
  const deleteRelation = (id) => { onSaveTree(selectedClientId,{...tree,relations:(tree?.relations||[]).filter(r=>r.id!==id)}); };

  // Relation type colors
  // Relation type colors (defined at module scope above)

  // Compute inherited themes (themes appearing in 2+ family members)
  const themeCount = {};
  GEN_ROLES.forEach(r=>{ (tree?.[r]?.themes||[]).forEach(t=>{ themeCount[t]=(themeCount[t]||0)+1; }); });
  const inheritedThemes = Object.entries(themeCount).filter(([,c])=>c>=2).sort(([,a],[,b])=>b-a);

  // Export PDF
  const exportPDF = () => {
    const cl = selectedClient;
    const html = `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"/>
<title>Generationsbaum · ${cl?.name}</title>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Raleway:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Raleway,sans-serif;color:#0F3030;background:#F0FAFA;-webkit-print-color-adjust:exact;}.page{max-width:700px;margin:0 auto;padding:36px;}.no-print{text-align:right;margin-bottom:16px;}.card{background:white;border-radius:14px;padding:16px 18px;margin-bottom:12px;border:1.5px solid #B2E0DC;page-break-inside:avoid;}h3{font-family:Cinzel,serif;font-size:12px;color:#0F3030;margin:0 0 10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;}p{font-size:12px;color:#2D6B68;font-weight:500;line-height:1.8;}.pill{display:inline-block;padding:2px 10px;border-radius:10px;font-size:11px;font-weight:700;background:#EDE9FE;color:#4C1D95;margin:2px;}@media print{.no-print{display:none;}}</style>
</head><body><div class="page">
<div class="no-print"><button onclick="window.print()" style="font-family:Raleway;font-weight:700;font-size:13px;padding:10px 24px;background:linear-gradient(135deg,#0D9488,#0F6B63);color:white;border:none;border-radius:12px;cursor:pointer;">🖨 PDF drucken</button></div>
<div style="background:linear-gradient(140deg,#CCFBF1,#FFF,#EDE9FE);border-radius:20px;padding:26px;margin-bottom:18px;border:1.5px solid #B2E0DC;">
  <p style="font-size:9px;letter-spacing:3px;color:#6AABA7;text-transform:uppercase;margin-bottom:6px;font-weight:700;">GENERATIONSBAUM</p>
  <h1 style="font-family:Cinzel,serif;font-size:24px;color:#0F3030;font-weight:700;margin-bottom:4px;">${cl?.name}</h1>
  <p style="font-size:11px;color:#2D6B68;">Exportiert: ${new Date().toLocaleDateString("de-DE")}</p>
</div>
${GEN_ROLES.filter(r=>tree?.[r]?.name).map(r=>{const p=tree[r];return`<div class="card"><h3>${r}</h3>
<p><strong>${p.name}</strong>${p.birthYear?" · *"+p.birthYear:""}${!p.alive&&p.deathYear?" – †"+p.deathYear:""}</p>
${p.themes?.length?"<p>Themen: "+p.themes.map(t=>"<span class=\"pill\">"+t+"</span>").join(" ")+"</p>":""}
${p.loyalties?"<p>Verstrickungen: "+p.loyalties+"</p>":""}
${p.notes?"<p>Notizen: "+p.notes+"</p>":""}
</div>`;}).join("")}
${inheritedThemes.length?"<div class=\"card\"><h3>Vererbte Muster (2+ Generationen)</h3>"+inheritedThemes.map(([t,c])=>"<span class=\"pill\">"+t+" ("+c+"×)</span>").join(" ")+"</div>":""}
${(tree?.relations||[]).length?"<div class=\"card\"><h3>Verknüpfte Klienten</h3>"+(tree.relations||[]).map(r=>"<p>"+r.relType+": "+r.targetName+" · Einwilligung: "+new Date(r.date).toLocaleDateString("de-DE")+"</p>").join("")+"</div>":""}
<div style="border-top:1.5px solid #B2E0DC;margin-top:18px;padding-top:12px;text-align:center;">
  <p style="font-family:Cinzel,serif;font-size:11px;color:#0D9488;font-weight:700;">✦ Lichtkern · powered by Resonanz Akademie</p>
  <p style="font-size:9px;color:#6AABA7;margin-top:4px;">Vertraulich · Generationsarbeit</p>
</div></div></body></html>`;
    const w=window.open("","_blank");if(w){w.document.write(html);w.document.close();}
  };

  // ── PersonNode for compact tree ──
  const PersonNode = ({ role, x, y }) => {
    const p = getPerson(role);
    const isMe = role==="Ich";
    const hasData = p.name||p.themes?.length>0;
    const isDead = !p.alive&&p.name;
    const hasInherited = inheritedThemes.some(([t])=>(p.themes||[]).includes(t));
    return (
      <g onClick={()=>setEditPerson({...p,role})} style={{cursor:"pointer"}}>
        {role==="Mutter"&&<line x1={x} y1={y+28} x2={190} y2={192} stroke={T.border} strokeWidth="1.5" strokeDasharray={hasData?"none":"4,4"}/>}
        {role==="Vater" &&<line x1={x} y1={y+28} x2={190} y2={192} stroke={T.border} strokeWidth="1.5" strokeDasharray={hasData?"none":"4,4"}/>}
        {role==="Mutter-Mutter"&&<line x1={x} y1={y+26} x2={60}  y2={108} stroke={T.border} strokeWidth="1.2" strokeDasharray="4,4"/>}
        {role==="Mutter-Vater" &&<line x1={x} y1={y+26} x2={60}  y2={108} stroke={T.border} strokeWidth="1.2" strokeDasharray="4,4"/>}
        {role==="Vater-Mutter" &&<line x1={x} y1={y+26} x2={320} y2={108} stroke={T.border} strokeWidth="1.2" strokeDasharray="4,4"/>}
        {role==="Vater-Vater"  &&<line x1={x} y1={y+26} x2={320} y2={108} stroke={T.border} strokeWidth="1.2" strokeDasharray="4,4"/>}
        {/* Inherited pattern glow */}
        {hasInherited&&<circle cx={x} cy={y} r={isMe?32:26} fill="none" stroke={T.violet} strokeWidth="2" strokeDasharray="4,3" opacity={0.5}/>}
        <circle cx={x} cy={y} r={isMe?26:20}
          fill={hasData?(isDead?"#F0EDFC":isMe?T.tealL:"#FFFFFF"):"#F8FFFE"}
          stroke={hasData?(isDead?T.violet:isMe?T.teal:T.borderMid):T.border}
          strokeWidth={isMe?2:1.5}
          strokeDasharray={isDead?"4,3":"none"}/>
        <text x={x} y={y-(hasData&&p.name?5:2)} textAnchor="middle" style={{fontSize:isMe?"13px":"11px",fill:hasData?T.text:T.textSoft}}>
          {isDead?"✝":isMe?"✦":"○"}
        </text>
        {p.name&&<text x={x} y={y+8} textAnchor="middle" style={{fontSize:"8px",fontFamily:"Raleway",fontWeight:"700",fill:T.text}}>
          {p.name.length>7?p.name.slice(0,7)+"…":p.name}
        </text>}
        {p.themes?.slice(0,3).map((t,i)=>(
          <circle key={i} cx={x-8+(i*8)} cy={y+(isMe?22:17)} r={3} fill={T.violet} opacity={0.5}/>
        ))}
        <text x={x} y={y+(isMe?36:30)} textAnchor="middle" style={{fontSize:"7px",fontFamily:"Raleway",fill:T.textSoft,fontWeight:"600"}}>
          {role==="Ich"?"Klient":role.replace("-"," ")}
        </text>
      </g>
    );
  };

  // ── Large node for expanded view ──
  const LargePersonNode = ({ role, x, y, w=120, h=80 }) => {
    const p = getPerson(role);
    const isMe = role==="Ich";
    const isDead = !p.alive&&p.name;
    const hasInherited = inheritedThemes.some(([t])=>(p.themes||[]).includes(t));
    const brd = isDead?T.violet:isMe?T.teal:T.borderMid;
    return (
      <g onClick={()=>setEditPerson({...p,role})} style={{cursor:"pointer"}}>
        {hasInherited&&<rect x={x-2} y={y-2} width={w+4} height={h+4} rx="14" fill="none" stroke={T.violet} strokeWidth="2" strokeDasharray="5,3" opacity={0.5}/>}
        <rect x={x} y={y} width={w} height={h} rx="12"
          fill={p.name?(isDead?"#F0EDFC":isMe?T.tealL:"white"):"#F8FFFE"}
          stroke={brd} strokeWidth={isMe?2:1.5} strokeDasharray={isDead?"5,3":"none"}/>
        <text x={x+w/2} y={y+18} textAnchor="middle" style={{fontSize:"11px",fill:p.name?T.text:T.textSoft,fontWeight:"700",fontFamily:"Raleway"}}>
          {p.name||(role==="Ich"?"Klient":role.replace("-"," "))}
        </text>
        {p.birthYear&&<text x={x+w/2} y={y+31} textAnchor="middle" style={{fontSize:"9px",fill:T.textSoft,fontFamily:"Raleway"}}>*{p.birthYear}{p.deathYear?" †"+p.deathYear:""}</text>}
        {p.themes?.slice(0,2).map((t,i)=>(
          <text key={i} x={x+8+(i*(w/2-8))} y={y+h-10} style={{fontSize:"8px",fill:T.violetD,fontWeight:"700",fontFamily:"Raleway"}}>{t.slice(0,8)}</text>
        ))}
        {!p.name&&<text x={x+w/2} y={y+h/2+4} textAnchor="middle" style={{fontSize:"18px"}}>+</text>}
      </g>
    );
  };

  // ── Relation lines between clients ──
  const RelationLines = () => {
    const rels = tree?.relations||[];
    if(!rels.length) return null;
    // Simplified: draw a colored badge for each relation
    return (<g>
      {rels.map((r,i)=>{
        const col = REL_COLORS[r.relType]||T.textSoft;
        return(
          <g key={r.id} onClick={()=>setActiveRelation(r)} style={{cursor:"pointer"}}>
            <rect x={8} y={220+(i*28)} width={160} height={22} rx="11" fill={col} opacity={0.15} stroke={col} strokeWidth="1"/>
            <text x={88} y={235+(i*28)} textAnchor="middle" style={{fontSize:"10px",fill:col,fontWeight:"700",fontFamily:"Raleway"}}>
              🔗 {r.relType}: {r.targetName}
            </text>
          </g>
        );
      })}
    </g>);
  };

  // ── Client selector screen ──
  if(!selectedClientId) return (
    <div style={{padding:"0 16px 96px"}}>
      <div style={{position:"relative",borderRadius:"22px",overflow:"hidden",padding:"24px",marginBottom:"20px",background:`linear-gradient(140deg,${T.tealL} 0%,#FFFFFF 50%,${T.violetL} 100%)`,boxShadow:`0 6px 28px ${T.shadowDeep}`,border:`1.5px solid ${T.border}`}}>
        <Flower size={220} opacity={0.1}/>
        <div style={{position:"relative",zIndex:1}}>
          <h2 style={{fontFamily:"Cinzel",fontSize:"22px",color:T.text,margin:"0 0 4px",fontWeight:700}}>Generationsbaum</h2>
          <p style={{fontFamily:"Raleway",fontSize:"11px",color:T.textMid,margin:0,fontWeight:600}}>Ahnen-Linien & Familienmuster</p>
        </div>
      </div>
      {clients.length===0
        ? <div style={{textAlign:"center",padding:"48px 0"}}><div style={{fontSize:"40px",marginBottom:"12px",opacity:0.3}}>🧬</div><div style={{fontFamily:"Raleway",fontSize:"14px",color:T.textMid,fontWeight:600}}>Noch keine Klienten</div></div>
        : <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
            {clients.map(c=>{
              const hasTree=genTrees[c.id]&&Object.values(genTrees[c.id]).some(v=>typeof v==="object"&&v.name);
              const rels=(genTrees[c.id]?.relations||[]).length;
              return(
                <Card key={c.id} onClick={()=>setSelectedClientId(c.id)} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:"12px"}}>
                  <div style={{width:"44px",height:"44px",borderRadius:"50%",background:hasTree?T.tealL:T.bgSoft,border:`1.5px solid ${hasTree?T.teal:T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",flexShrink:0}}>🧬</div>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"Raleway",fontWeight:700,fontSize:"14px",color:T.text}}>{c.name}</div>
                    <div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textSoft,fontWeight:500,marginTop:"2px"}}>
                      {hasTree?"Baum vorhanden":"Noch kein Baum"}{rels>0?` · ${rels} Verbindung${rels!==1?"en":""}`:""}
                    </div>
                  </div>
                  <span style={{color:T.textSoft,fontSize:"18px"}}>›</span>
                </Card>
              );
            })}
          </div>
      }
    </div>
  );

  const relations = tree?.relations||[];
  const filledCount = GEN_ROLES.filter(r=>tree?.[r]?.name).length;

  return(
    <div style={{padding:"0 16px 96px"}}>
      <button onClick={()=>setSelectedClientId(null)} style={{fontFamily:"Raleway",fontSize:"13px",color:T.teal,fontWeight:700,background:"none",border:"none",cursor:"pointer",paddingTop:"8px",display:"block",marginBottom:"10px"}}>← Klienten</button>

      {/* Header */}
      <div style={{position:"relative",borderRadius:"18px",overflow:"hidden",padding:"16px 18px",marginBottom:"12px",background:`linear-gradient(140deg,${T.tealL} 0%,#FFFFFF 50%,${T.violetL} 100%)`,boxShadow:`0 3px 18px ${T.shadow}`,border:`1.5px solid ${T.border}`}}>
        <Flower size={160} opacity={0.08}/>
        <div style={{position:"relative",zIndex:1,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"8px"}}>
          <div>
            <div style={{fontFamily:"Cinzel",fontSize:"17px",color:T.text,fontWeight:700}}>{selectedClient?.name}</div>
            <div style={{fontFamily:"Raleway",fontSize:"10px",color:T.textMid,marginTop:"2px",fontWeight:500}}>{filledCount}/7 Personen · {relations.length} Verbindungen</div>
          </div>
          <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
            {/* View toggle */}
            <div style={{display:"flex",borderRadius:"10px",overflow:"hidden",border:`1.5px solid ${T.border}`}}>
              {[["compact","⊞"],["large","⊟"]].map(([v,icon])=>(
                <button key={v} onClick={()=>setTreeView(v)} style={{fontFamily:"Raleway",fontWeight:700,fontSize:"12px",padding:"6px 12px",border:"none",cursor:"pointer",background:treeView===v?T.teal:"white",color:treeView===v?"white":T.textMid}}>{icon}</button>
              ))}
            </div>
            <button onClick={()=>setLinkModal(true)} style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:700,padding:"7px 12px",borderRadius:"10px",border:`1.5px solid ${T.border}`,background:"white",color:T.textMid,cursor:"pointer"}}>🔗</button>
            <button onClick={exportPDF} style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:700,padding:"7px 12px",borderRadius:"10px",border:`1.5px solid ${T.border}`,background:"white",color:T.textMid,cursor:"pointer"}}>📄</button>
          </div>
        </div>
      </div>

      {/* Compact SVG Tree */}
      {treeView==="compact"&&(
        <Card style={{padding:"10px",marginBottom:"12px",overflow:"hidden"}}>
          <svg width="100%" viewBox="0 0 380 300" style={{overflow:"visible"}}>
            <text x="4" y="22" style={{fontSize:"7px",fontFamily:"Raleway",fill:T.textSoft,fontWeight:"700"}}>GROßELTERN</text>
            <text x="4" y="110" style={{fontSize:"7px",fontFamily:"Raleway",fill:T.textSoft,fontWeight:"700"}}>ELTERN</text>
            <text x="4" y="200" style={{fontSize:"7px",fontFamily:"Raleway",fill:T.textSoft,fontWeight:"700"}}>KLIENT</text>
            <line x1="55" y1="30" x2="118" y2="30" stroke={T.border} strokeWidth="1"/>
            <line x1="60" y1="30" x2={60} y2={108} stroke={T.border} strokeWidth="1" strokeDasharray="3,3"/>
            <line x1="255" y1="30" x2="318" y2="30" stroke={T.border} strokeWidth="1"/>
            <line x1="320" y1="30" x2={320} y2={108} stroke={T.border} strokeWidth="1" strokeDasharray="3,3"/>
            <PersonNode role="Mutter-Mutter" x={48}  y={30}/>
            <PersonNode role="Mutter-Vater"  x={112} y={30}/>
            <PersonNode role="Vater-Mutter"  x={248} y={30}/>
            <PersonNode role="Vater-Vater"   x={312} y={30}/>
            <PersonNode role="Mutter"        x={80}  y={108}/>
            <PersonNode role="Vater"         x={300} y={108}/>
            <PersonNode role="Ich"           x={190} y={192}/>
            <RelationLines/>
          </svg>
          <div style={{fontFamily:"Raleway",fontSize:"9px",color:T.textSoft,textAlign:"center",marginTop:"2px",fontWeight:500}}>Person antippen zum Bearbeiten · Lila Ring = Vererbtes Muster</div>
        </Card>
      )}

      {/* Large SVG Tree */}
      {treeView==="large"&&(
        <Card style={{padding:"10px",marginBottom:"12px",overflow:"auto"}}>
          <svg width="540" height="380" style={{display:"block",minWidth:"540px"}}>
            <text x="4" y="18" style={{fontSize:"8px",fontFamily:"Raleway",fill:T.textSoft,fontWeight:"700"}}>GROßELTERN</text>
            <text x="4" y="130" style={{fontSize:"8px",fontFamily:"Raleway",fill:T.textSoft,fontWeight:"700"}}>ELTERN</text>
            <text x="4" y="255" style={{fontSize:"8px",fontFamily:"Raleway",fill:T.textSoft,fontWeight:"700"}}>KLIENT</text>
            {/* Connection lines */}
            <line x1="80" y1="100" x2="150" y2="160" stroke={T.border} strokeWidth="1.5"/>
            <line x1="210" y1="100" x2="150" y2="160" stroke={T.border} strokeWidth="1.5"/>
            <line x1="330" y1="100" x2="390" y2="160" stroke={T.border} strokeWidth="1.5"/>
            <line x1="460" y1="100" x2="390" y2="160" stroke={T.border} strokeWidth="1.5"/>
            <line x1="150" y1="230" x2="270" y2="290" stroke={T.border} strokeWidth="1.5"/>
            <line x1="390" y1="230" x2="270" y2="290" stroke={T.border} strokeWidth="1.5"/>
            <LargePersonNode role="Mutter-Mutter" x={20}  y={22}/>
            <LargePersonNode role="Mutter-Vater"  x={155} y={22}/>
            <LargePersonNode role="Vater-Mutter"  x={290} y={22}/>
            <LargePersonNode role="Vater-Vater"   x={415} y={22}/>
            <LargePersonNode role="Mutter"        x={90}  y={145} w={130} h={75}/>
            <LargePersonNode role="Vater"         x={330} y={145} w={130} h={75}/>
            <LargePersonNode role="Ich"           x={210} y={270} w={140} h={85}/>
          </svg>
          <div style={{fontFamily:"Raleway",fontSize:"9px",color:T.textSoft,textAlign:"center",marginTop:"4px",fontWeight:500}}>Person antippen zum Bearbeiten</div>
        </Card>
      )}

      {/* Inherited themes */}
      {inheritedThemes.length>0&&(
        <Card style={{marginBottom:"12px",background:`${T.violetL}88`,border:`1.5px solid ${T.violet}44`}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"10px"}}>
            <span style={{fontSize:"16px"}}>🔮</span>
            <span style={{fontFamily:"Cinzel",fontSize:"12px",color:T.violetD,fontWeight:700}}>Vererbte Muster</span>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
            {inheritedThemes.map(([theme,count])=>(
              <div key={theme} style={{background:"white",borderRadius:"20px",padding:"5px 12px",border:`1.5px solid ${T.violet}66`,display:"flex",alignItems:"center",gap:"6px"}}>
                <span style={{fontFamily:"Raleway",fontSize:"12px",color:T.violetD,fontWeight:700}}>{theme}</span>
                <span style={{fontFamily:"Raleway",fontSize:"10px",color:T.violet,fontWeight:800,background:T.violetL,padding:"1px 7px",borderRadius:"10px"}}>{count}×</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Relations with color coding */}
      {relations.length>0&&(
        <Card style={{marginBottom:"12px"}}>
          <SL>Verknüpfte Klienten</SL>
          {relations.map(r=>{
            const col=REL_COLORS[r.relType]||T.textSoft;
            return(
              <div key={r.id} onClick={()=>setActiveRelation(activeRelation?.id===r.id?null:r)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${T.border}`,cursor:"pointer"}}>
                <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                  <div style={{width:"10px",height:"10px",borderRadius:"50%",background:col,flexShrink:0}}/>
                  <div>
                    <div style={{fontFamily:"Raleway",fontSize:"13px",color:T.text,fontWeight:700}}>{r.relType}: {r.targetName}</div>
                    {activeRelation?.id===r.id&&<div style={{fontFamily:"Raleway",fontSize:"10px",color:T.textSoft,fontWeight:500,marginTop:"3px"}}>🔒 Einwilligung: {new Date(r.date).toLocaleDateString("de-DE")}</div>}
                  </div>
                </div>
                <button onClick={e=>{e.stopPropagation();deleteRelation(r.id);}} style={{fontFamily:"Raleway",fontSize:"11px",color:"#C0392B",background:"#FEE2E2",border:"none",borderRadius:"8px",padding:"4px 9px",cursor:"pointer",fontWeight:700}}>🗑</button>
              </div>
            );
          })}
        </Card>
      )}

      {/* Person cards */}
      <SL>Personen</SL>
      <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
        {GEN_ROLES.filter(r=>tree?.[r]?.name).map(r=>{
          const p=tree[r];
          const hasI=inheritedThemes.some(([t])=>(p.themes||[]).includes(t));
          return(
            <Card key={r} onClick={()=>setEditPerson({...p,role:r})} style={{cursor:"pointer",padding:"12px 14px",border:hasI?`1.5px solid ${T.violet}66`:undefined}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"2px"}}>
                    <span style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:700,color:T.textSoft,letterSpacing:"1px",textTransform:"uppercase"}}>{r}</span>
                    {!p.alive&&<span style={{fontSize:"9px",background:"#F0EDFC",color:T.violetD,padding:"1px 7px",borderRadius:"8px",fontFamily:"Raleway",fontWeight:700}}>✝</span>}
                    {hasI&&<span style={{fontSize:"9px",background:T.violetL,color:T.violetD,padding:"1px 7px",borderRadius:"8px",fontFamily:"Raleway",fontWeight:700}}>🔮 Vererbt</span>}
                  </div>
                  <div style={{fontFamily:"Raleway",fontSize:"14px",fontWeight:700,color:T.text}}>{p.name}</div>
                  {p.birthYear&&<div style={{fontFamily:"Raleway",fontSize:"10px",color:T.textSoft}}>*{p.birthYear}{p.deathYear?" – †"+p.deathYear:""}</div>}
                  {p.themes?.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:"4px",marginTop:"5px"}}>{p.themes.map(t=><span key={t} style={{fontSize:"10px",padding:"2px 9px",borderRadius:"10px",background:T.violetL,color:T.violetD,fontFamily:"Raleway",fontWeight:700}}>{t}</span>)}</div>}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {editPerson&&<PersonEditModal_v2 person={editPerson} onSave={savePerson} onClose={()=>setEditPerson(null)}/>}
      {linkModal  &&<LinkModal_v2 onSave={saveRelation} onClose={()=>setLinkModal(false)} clients={clients} selectedClientId={selectedClientId}/>}
    </div>
  );
}

// ─── COLOR THEMES ─────────────────────────────
const THEMES = {
  kristallwasser: {
    name:"Kristallwasser", emoji:"🌊",
    teal:"#0D9488", tealL:"#CCFBF1", tealD:"#0F6B63",
    violet:"#6D3FCC", violetL:"#EDE9FE", violetD:"#4C1D95",
    bg:"#F0FAFA", border:"#B2E0DC", borderMid:"#7EC8C2",
    text:"#0F3030", textMid:"#2D6B68", textSoft:"#6AABA7",
    shadow:"rgba(13,148,136,0.12)", shadowDeep:"rgba(13,148,136,0.22)",
  },
  morgenrote: {
    name:"Morgenröte", emoji:"🌸",
    teal:"#C2185B", tealL:"#FCE4EC", tealD:"#880E4F",
    violet:"#F06292", violetL:"#FFF0F3", violetD:"#AD1457",
    bg:"#FFF5F7", border:"#F8BBD0", borderMid:"#F48FB1",
    text:"#3E0020", textMid:"#880E4F", textSoft:"#C2185B",
    shadow:"rgba(194,24,91,0.10)", shadowDeep:"rgba(194,24,91,0.20)",
  },
  amethyst: {
    name:"Amethyst", emoji:"🔮",
    teal:"#7B1FA2", tealL:"#F3E5F5", tealD:"#4A148C",
    violet:"#AB47BC", violetL:"#EDE7F6", violetD:"#6A1B9A",
    bg:"#FAF5FF", border:"#E1BEE7", borderMid:"#CE93D8",
    text:"#2D0045", textMid:"#6A1B9A", textSoft:"#9C27B0",
    shadow:"rgba(123,31,162,0.10)", shadowDeep:"rgba(123,31,162,0.20)",
  },
  sonnengold: {
    name:"Sonnengold", emoji:"☀️",
    teal:"#F57F17", tealL:"#FFF8E1", tealD:"#E65100",
    violet:"#FFB300", violetL:"#FFFDE7", violetD:"#F57F17",
    bg:"#FFFDF0", border:"#FFE082", borderMid:"#FFD54F",
    text:"#2E1A00", textMid:"#BF360C", textSoft:"#E65100",
    shadow:"rgba(245,127,23,0.10)", shadowDeep:"rgba(245,127,23,0.20)",
  },
};

// ─── PIN LOCK SCREEN ──────────────────────────
function PinLock({ mode, onSuccess, onSetup }) {
  const [pin,setPin]       = useState("");
  const [confirm,setConfirm] = useState("");
  const [step,setStep]     = useState("enter"); // enter | confirm
  const [error,setError]   = useState("");
  const isSetup = mode === "setup";

  const handleDigit = async (d) => {
    if(isSetup) {
      if(step==="enter") {
        const next = pin+d;
        setPin(next);
        if(next.length===4){ setStep("confirm"); }
      } else {
        const next = confirm+d;
        setConfirm(next);
        if(next.length===4){
          if(next===pin){ onSetup(pin); }
          else { setError("PINs stimmen nicht überein"); setConfirm(""); setTimeout(()=>setError(""),1500); }
        }
      }
    } else {
      const next = pin+d;
      setPin(next);
      if(next.length===4){
        try {
          const stored = await fsGet("pin_user", "lk_pin");
          if(stored && stored.value === next){ onSuccess(); }
          else { setError("Falsche PIN"); setPin(""); setTimeout(()=>setError(""),1500); }
        } catch { setError("Fehler"); setPin(""); }
      }
    }
  };

  const handleDel = () => {
    if(isSetup && step==="confirm") setConfirm(c=>c.slice(0,-1));
    else setPin(p=>p.slice(0,-1));
  };

  const current = isSetup && step==="confirm" ? confirm : pin;
  const label = isSetup
    ? (step==="enter" ? "PIN festlegen (4 Stellen)" : "PIN wiederholen")
    : "PIN eingeben";

  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px"}}>
      <div style={{width:"72px",height:"72px",borderRadius:"50%",background:`linear-gradient(135deg,${T.tealL},${T.violetL})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"30px",boxShadow:`0 6px 28px ${T.shadowDeep}`,border:`1.5px solid ${T.border}`,marginBottom:"20px"}}>
        🔒
      </div>
      <div style={{fontFamily:"Cinzel",fontSize:"20px",color:T.text,fontWeight:700,marginBottom:"6px"}}>Lichtkern</div>
      <div style={{fontFamily:"Raleway",fontSize:"13px",color:T.textMid,fontWeight:600,marginBottom:"32px"}}>{label}</div>

      {/* PIN dots */}
      <div style={{display:"flex",gap:"16px",marginBottom:"12px"}}>
        {[0,1,2,3].map(i=>(
          <div key={i} style={{width:"18px",height:"18px",borderRadius:"50%",
            background:current.length>i?T.teal:T.bgSoft,
            border:`2px solid ${current.length>i?T.teal:T.border}`,
            transition:"all 0.15s"}}/>
        ))}
      </div>

      {error && <div style={{fontFamily:"Raleway",fontSize:"12px",color:"#C0392B",fontWeight:700,marginBottom:"12px"}}>{error}</div>}
      {!error && <div style={{height:"20px",marginBottom:"12px"}}/>}

      {/* Numpad */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"12px",width:"220px"}}>
        {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d,i)=>(
          <button key={i} onClick={()=>d===""?null:d==="⌫"?handleDel():handleDigit(String(d))}
            style={{height:"60px",borderRadius:"50%",border:`1.5px solid ${d===""?"transparent":T.border}`,
              background:d===""?"transparent":T.bgCard,
              fontFamily:"Raleway",fontSize:d==="⌫"?"20px":"22px",fontWeight:700,
              color:T.text,cursor:d===""?"default":"pointer",
              boxShadow:d===""?"none":`0 2px 8px ${T.shadow}`,
              transition:"all 0.1s"}}>
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── SETTINGS SCREEN ──────────────────────────
function SettingsScreen({ settings, onSave, onClose, clients, sessions, appointments, genTrees, reminders, templates, onImport, onLogout }) {
  const [form,setForm] = useState({...settings});
  const [pinMode,setPinMode] = useState(null); // null | "setup" | "change"
  const [pinEnabled,setPinEnabled] = useState(!!settings.pinEnabled);
  const [saved,setSaved]   = useState(false);
  const [importMsg,setImportMsg] = useState("");
  const up = u => setForm(f=>({...f,...u}));

  const save = async () => {
    await onSave({...form, pinEnabled});
    setSaved(true);
    setTimeout(()=>setSaved(false),1800);
  };

  const handlePinSetup = async (pin) => {
    try{ await fsSet("pin_user","lk_pin", pin); }catch{}
    setPinEnabled(true);
    await onSave({...form, pinEnabled:true});
    setPinMode(null);
  };

  const disablePin = async () => {
    if(!window.confirm("PIN-Schutz wirklich deaktivieren?")) return;
    try{ await fsDelete("pin_user","lk_pin"); }catch{}
    setPinEnabled(false);
    await onSave({...form, pinEnabled:false});
  };

  if(pinMode) return <PinLock mode="setup" onSuccess={()=>setPinMode(null)} onSetup={handlePinSetup}/>;

  const Row = ({label,children}) => (
    <div style={{marginBottom:"16px"}}>
      <SL>{label}</SL>
      {children}
    </div>
  );

  return (
    <div style={{position:"fixed",inset:0,background:T.bg,zIndex:200,overflowY:"auto",paddingBottom:"40px"}}>
      {/* Header */}
      <div style={{padding:"16px 16px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1.5px solid ${T.border}`,background:T.bg,position:"sticky",top:0,zIndex:10}}>
        <div style={{fontFamily:"Cinzel",fontSize:"18px",color:T.text,fontWeight:700}}>⚙️ Einstellungen</div>
        <button onClick={onClose} style={{fontFamily:"Raleway",fontSize:"20px",color:T.textSoft,background:"none",border:"none",cursor:"pointer"}}>✕</button>
      </div>

      <div style={{padding:"20px 16px"}}>

        {/* Branding lock notice */}
        <div style={{background:`linear-gradient(135deg,${T.tealL},${T.violetL})`,borderRadius:"16px",padding:"14px 16px",marginBottom:"16px",border:`1.5px solid ${T.borderMid}`,display:"flex",gap:"12px",alignItems:"center"}}>
          <div style={{fontSize:"24px",flexShrink:0}}>✦</div>
          <div>
            <div style={{fontFamily:"Cinzel",fontSize:"13px",color:T.text,fontWeight:700}}>Lichtkern · Resonanz Akademie</div>
            <div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textMid,fontWeight:500,marginTop:"3px"}}>Markenname & Branding sind fest verankert und können nicht geändert werden.</div>
          </div>
        </div>

        {/* Praxis */}
        <div style={{background:`linear-gradient(140deg,${T.tealL},#FFFFFF)`,borderRadius:"18px",padding:"16px",marginBottom:"20px",border:`1.5px solid ${T.border}`}}>
          <SL color={T.tealD}>Praxis & Person</SL>
          <Row label="Praxisname">
            <TI value={form.praxisname||""} onChange={v=>up({praxisname:v})} placeholder="z.B. Praxis Sonnenlicht"/>
          </Row>
          <Row label="Untertitel">
            <TI value={form.subtitle||""} onChange={v=>up({subtitle:v})} placeholder="z.B. Energetische Heilarbeit"/>
          </Row>
          <Row label="Therapeuten-Name">
            <TI value={form.therapistName||""} onChange={v=>up({therapistName:v})} placeholder="Dein vollständiger Name"/>
          </Row>
        </div>

        {/* Session defaults */}
        <div style={{background:"#FFFFFF",borderRadius:"18px",padding:"16px",marginBottom:"20px",border:`1.5px solid ${T.border}`}}>
          <SL color={T.tealD}>Sitzungs-Standards</SL>
          <Row label="Standard-Sitzungsdauer">
            <div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
              {["30","45","60","75","90","120"].map(d=>(
                <button key={d} onClick={()=>up({defaultDuration:d})}
                  style={{padding:"8px 16px",borderRadius:"20px",border:`1.5px solid ${form.defaultDuration===d?T.teal:T.border}`,
                    background:form.defaultDuration===d?T.tealL:"white",
                    fontFamily:"Raleway",fontSize:"12px",fontWeight:700,
                    color:form.defaultDuration===d?T.tealD:T.textMid,cursor:"pointer"}}>
                  {d} Min
                </button>
              ))}
            </div>
          </Row>
        </div>

        {/* Farb-Akzent */}
        <div style={{background:"#FFFFFF",borderRadius:"18px",padding:"16px",marginBottom:"20px",border:`1.5px solid ${T.border}`}}>
          <SL color={T.tealD}>Farb-Thema</SL>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
            {Object.entries(THEMES).map(([key,th])=>(
              <button key={key} onClick={()=>up({theme:key})}
                style={{padding:"14px",borderRadius:"14px",
                  border:`2px solid ${form.theme===key?th.teal:T.border}`,
                  background:form.theme===key?th.tealL:"white",
                  cursor:"pointer",textAlign:"left",transition:"all 0.15s"}}>
                <div style={{fontSize:"22px",marginBottom:"6px"}}>{th.emoji}</div>
                <div style={{fontFamily:"Raleway",fontSize:"12px",fontWeight:700,
                  color:form.theme===key?th.tealD:T.text}}>{th.name}</div>
                <div style={{display:"flex",gap:"4px",marginTop:"6px"}}>
                  {[th.teal,th.violet,th.tealL].map((c,i)=>(
                    <div key={i} style={{width:"14px",height:"14px",borderRadius:"50%",background:c}}/>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Honorar */}
        <div style={{background:"#FFFFFF",borderRadius:"18px",padding:"16px",marginBottom:"20px",border:`1.5px solid ${T.border}`}}>
          <SL color={T.tealD}>Honorar & Währung</SL>
          <Row label="Währung">
            <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
              {["CHF","EUR","USD","GBP"].map(c=>(
                <button key={c} onClick={()=>up({currency:c})}
                  style={{padding:"8px 18px",borderRadius:"20px",border:`1.5px solid ${form.currency===c?T.teal:T.border}`,
                    background:form.currency===c?T.tealL:"white",
                    fontFamily:"Raleway",fontSize:"12px",fontWeight:700,
                    color:form.currency===c?T.tealD:T.textMid,cursor:"pointer"}}>
                  {c}
                </button>
              ))}
            </div>
          </Row>
          <Row label="Standard-Honorar pro Sitzung">
            <TI value={form.defaultFee||""} onChange={v=>up({defaultFee:v})} placeholder={`z.B. 120 ${form.currency||"CHF"}`}/>
          </Row>
        </div>

        {/* Disclaimer */}
        <div style={{background:"#FFFFFF",borderRadius:"18px",padding:"16px",marginBottom:"20px",border:`1.5px solid ${T.border}`}}>
          <SL color={T.tealD}>Disclaimer (PDF-Footer)</SL>
          <TI value={form.disclaimer||""} onChange={v=>up({disclaimer:v})}
            placeholder="Keine medizinische Diagnose. Kein Ersatz für ärztliche Behandlung."
            multiline rows={3}/>
        </div>

        {/* Sicherheit */}
        <div style={{background:"#FFFFFF",borderRadius:"18px",padding:"16px",marginBottom:"24px",border:`1.5px solid ${T.border}`}}>
          <SL color={T.tealD}>🔒 Sicherheit</SL>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${T.border}`}}>
            <div>
              <div style={{fontFamily:"Raleway",fontSize:"13px",color:T.text,fontWeight:700}}>PIN-Schutz</div>
              <div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textSoft,fontWeight:500,marginTop:"2px"}}>App beim Öffnen sperren</div>
            </div>
            <button onClick={pinEnabled?disablePin:()=>setPinMode("setup")}
              style={{width:"44px",height:"24px",borderRadius:"12px",border:"none",cursor:"pointer",
                background:pinEnabled?T.teal:"#CBD5E1",position:"relative",transition:"background 0.2s"}}>
              <div style={{position:"absolute",top:"3px",left:pinEnabled?"23px":"3px",width:"18px",height:"18px",
                borderRadius:"50%",background:"white",transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}}/>
            </button>
          </div>

          {pinEnabled && (
            <div style={{paddingTop:"12px"}}>
              <button onClick={()=>setPinMode("change")}
                style={{fontFamily:"Raleway",fontSize:"12px",fontWeight:700,color:T.teal,
                  background:T.tealL,border:`1.5px solid ${T.borderMid}`,
                  borderRadius:"10px",padding:"8px 18px",cursor:"pointer"}}>
                🔑 PIN ändern
              </button>
            </div>
          )}

          <div style={{marginTop:"14px"}}>
            <SL>Auto-Lock nach</SL>
            <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
              {[["1","1 Min"],["5","5 Min"],["15","15 Min"],["30","30 Min"],["0","Nie"]].map(([v,l])=>(
                <button key={v} onClick={()=>up({autoLock:v})}
                  style={{padding:"7px 14px",borderRadius:"20px",border:`1.5px solid ${form.autoLock===v?T.teal:T.border}`,
                    background:form.autoLock===v?T.tealL:"white",
                    fontFamily:"Raleway",fontSize:"11px",fontWeight:700,
                    color:form.autoLock===v?T.tealD:T.textMid,cursor:"pointer"}}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Btn onClick={save} style={{width:"100%",fontSize:"14px",padding:"14px",marginBottom:"12px"}}>
          {saved ? "✅ Gespeichert!" : "Einstellungen speichern"}
        </Btn>

        {onLogout && (
          <button onClick={()=>{if(window.confirm("Wirklich abmelden?"))onLogout();}} style={{width:"100%",fontFamily:"Raleway",fontWeight:700,fontSize:"14px",padding:"14px",borderRadius:"14px",border:`1.5px solid #FFCCCC`,background:"#FFF5F5",color:"#CC0000",cursor:"pointer",marginBottom:"20px"}}>
            🚪 Abmelden
          </button>
        )}

        {/* Export & Backup */}
        <div style={{background:"#FFFFFF",borderRadius:"18px",padding:"16px",marginBottom:"20px",border:`1.5px solid ${T.border}`}}>
          <SL color={T.tealD}>🗄 Export & Backup</SL>

          {/* JSON Full Backup */}
          <div style={{marginBottom:"14px"}}>
            <div style={{fontFamily:"Raleway",fontSize:"12px",fontWeight:700,color:T.text,marginBottom:"4px"}}>Vollständiges Backup (JSON)</div>
            <div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textSoft,fontWeight:500,marginBottom:"8px"}}>Alle Daten — Klienten, Sitzungen, Abrechnung, Bäume, Einstellungen</div>
            <button onClick={()=>{
              const data={version:"1.0",exportedAt:new Date().toISOString(),clients,sessions,appointments,genTrees,reminders,templates,settings};
              const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
              const url=URL.createObjectURL(blob);
              const a=document.createElement("a");a.href=url;a.download=`lichtkern_backup_${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);
            }} style={{width:"100%",fontFamily:"Raleway",fontWeight:700,fontSize:"12px",padding:"10px",borderRadius:"10px",border:`1.5px solid ${T.border}`,background:T.bgSoft,color:T.textMid,cursor:"pointer"}}>
              💾 JSON Backup herunterladen
            </button>
          </div>

          {/* CSV Exports */}
          <div style={{fontFamily:"Raleway",fontSize:"12px",fontWeight:700,color:T.text,marginBottom:"8px"}}>CSV-Exporte</div>
          <div style={{display:"flex",flexDirection:"column",gap:"7px",marginBottom:"14px"}}>
            {/* CSV Clients */}
            <button onClick={()=>{
              const rows=[["ID","Name","Geburtsdatum","Kontakt","Adresse","Tags","Erstellt"],
                ...(clients||[]).map(c=>[c.id,c.name||"",c.birthDate||"",c.contact||"",c.address||"",(c.tags||[]).join("; "),c.createdAt?.slice(0,10)||""])];
              const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
              const blob=new Blob(["﻿"+csv],{type:"text/csv;charset=utf-8"});
              const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`lichtkern_klienten_${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(url);
            }} style={{width:"100%",fontFamily:"Raleway",fontWeight:700,fontSize:"11px",padding:"9px",borderRadius:"10px",border:`1.5px solid ${T.border}`,background:"white",color:T.textMid,cursor:"pointer",textAlign:"left"}}>
              📋 Klienten exportieren
            </button>
            {/* CSV Sessions */}
            <button onClick={()=>{
              const rows=[["Datum","Klient","Typ","Thema","Ebenen","Techniken","Ergebnis","Integrationsauftrag"],
                ...(sessions||[]).map(s=>[s.createdAt?.slice(0,10)||"",s.clientName||"",s.type||"",s.goal||"",Object.entries(s.levels||{}).filter(([,v])=>v>0).map(([k,v])=>`${k}:${v}%`).join("; "),(s.techniques||[]).join("; "),s.outcome||"",s.homework||""])];
              const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
              const blob=new Blob(["﻿"+csv],{type:"text/csv;charset=utf-8"});
              const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`lichtkern_sitzungen_${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(url);
            }} style={{width:"100%",fontFamily:"Raleway",fontWeight:700,fontSize:"11px",padding:"9px",borderRadius:"10px",border:`1.5px solid ${T.border}`,background:"white",color:T.textMid,cursor:"pointer",textAlign:"left"}}>
              ✦ Sitzungen exportieren
            </button>
            {/* CSV Billing */}
            <button onClick={()=>{
              const cur=settings?.currency||"CHF";
              const rows=[["Datum","Klient","Rechnungs-Nr.","Betrag",`Währung`,`Status`,"Thema"],
                ...(sessions||[]).filter(s=>s.fee).map(s=>[s.createdAt?.slice(0,10)||"",s.clientName||"",s.invoiceNr||"",s.fee||"",cur,s.payStatus==="paid"?"Bezahlt":s.payStatus==="partial"?"Teilbezahlt":"Offen",s.goal||""])];
              const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
              const blob=new Blob(["﻿"+csv],{type:"text/csv;charset=utf-8"});
              const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`lichtkern_abrechnung_${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(url);
            }} style={{width:"100%",fontFamily:"Raleway",fontWeight:700,fontSize:"11px",padding:"9px",borderRadius:"10px",border:`1.5px solid ${T.border}`,background:"white",color:T.textMid,cursor:"pointer",textAlign:"left"}}>
              💰 Abrechnung exportieren
            </button>
          </div>

          {/* PDF Report per client */}
          <div style={{fontFamily:"Raleway",fontSize:"12px",fontWeight:700,color:T.text,marginBottom:"6px"}}>PDF-Gesamtbericht pro Klient</div>
          <select id="pdfClientSelect" style={{width:"100%",background:"white",border:`1.5px solid ${T.border}`,borderRadius:"10px",padding:"10px 12px",color:T.text,fontFamily:"Raleway",fontSize:"12px",fontWeight:500,outline:"none",appearance:"none",marginBottom:"8px"}}>
            <option value="">— Klient wählen —</option>
            {(clients||[]).map(cl=><option key={cl.id} value={cl.id}>{cl.name}</option>)}
          </select>
          <button onClick={()=>{
            const sel=document.getElementById("pdfClientSelect")?.value;
            if(!sel)return;
            const cl=(clients||[]).find(c=>c.id===sel);
            if(!cl)return;
            const cs=(sessions||[]).filter(s=>s.clientId===sel).sort((a,b)=>a.createdAt?.localeCompare(b.createdAt));
            const html=`<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"/>
<title>Gesamtbericht · ${cl.name}</title>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Raleway:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Raleway,sans-serif;color:#0F3030;background:#F0FAFA;-webkit-print-color-adjust:exact;}.page{max-width:700px;margin:0 auto;padding:40px;}.no-print{text-align:right;margin-bottom:20px;}.card{background:white;border-radius:14px;padding:18px 20px;margin-bottom:16px;border:1.5px solid #B2E0DC;page-break-inside:avoid;}h3{font-family:Cinzel,serif;font-size:13px;color:#0F3030;margin:0 0 10px;font-weight:700;}p{font-size:12px;color:#2D6B68;font-weight:500;line-height:1.8;}@media print{.no-print{display:none;}}</style>
</head><body><div class="page">
<div class="no-print"><button onclick="window.print()" style="font-family:Raleway;font-weight:700;font-size:13px;padding:10px 24px;background:linear-gradient(135deg,#0D9488,#0F6B63);color:white;border:none;border-radius:12px;cursor:pointer;">🖨 PDF drucken</button></div>
<div style="background:linear-gradient(140deg,#CCFBF1,#FFFFFF,#EDE9FE);border-radius:20px;padding:28px;margin-bottom:20px;border:1.5px solid #B2E0DC;">
  <p style="font-size:9px;letter-spacing:3px;color:#6AABA7;text-transform:uppercase;margin-bottom:6px;font-weight:700;">GESAMTBERICHT</p>
  <h1 style="font-family:Cinzel,serif;font-size:26px;color:#0F3030;font-weight:700;margin-bottom:4px;">${cl.name}</h1>
  <p style="font-size:12px;color:#2D6B68;font-weight:500;">${cs.length} Sitzung${cs.length!==1?"en":""} · Exportiert: ${new Date().toLocaleDateString("de-DE")}</p>
</div>
${cs.map((s,i)=>{
  const lvlStr=Object.entries(s.levels||{}).filter(([,v])=>v>0).map(([k,v])=>k+" "+v+"%").join(", ");
  const techStr=(s.techniques||[]).join(", ");
  const feeStr=s.fee?(s.fee+" "+(settings?.currency||"CHF")+" · "+(s.payStatus==="paid"?"Bezahlt":s.payStatus==="partial"?"Teilbezahlt":"Offen")):"";
  return "<div class=\"card\">"
  +"<h3>"+(i+1)+". "+(s.type==="first"?"Erstsitzung":s.type==="followup"?"Folgesitzung":"Abschluss")+" · "+new Date(s.createdAt).toLocaleDateString("de-DE")+"</h3>"
  +(s.goal?"<p><strong>Thema:</strong> "+s.goal+"</p>":"")
  +(lvlStr?"<p><strong>Ebenen:</strong> "+lvlStr+"</p>":"")
  +(techStr?"<p><strong>Techniken:</strong> "+techStr+"</p>":"")
  +(s.outcome?"<p><strong>Ergebnis:</strong> "+s.outcome+"</p>":"")
  +(s.homework?"<p><strong>Integrationsauftrag:</strong> "+s.homework+"</p>":"")
  +(feeStr?"<p><strong>Honorar:</strong> "+feeStr+"</p>":"")
  +"</div>";
}).join("")}
<div style="border-top:1.5px solid #B2E0DC;margin-top:20px;padding-top:14px;text-align:center;">
  <p style="font-family:Cinzel,serif;font-size:11px;color:#0D9488;font-weight:700;">✦ Lichtkern · powered by Resonanz Akademie</p>
</div></div></body></html>`;
            const w=window.open("","_blank");if(w){w.document.write(html);w.document.close();}
          }} style={{width:"100%",fontFamily:"Raleway",fontWeight:700,fontSize:"11px",padding:"9px",borderRadius:"10px",border:`1.5px solid ${T.border}`,background:"white",color:T.textMid,cursor:"pointer"}}>
            📄 Gesamtbericht erstellen
          </button>

          {/* Import */}
          <div style={{marginTop:"16px",paddingTop:"14px",borderTop:`1px solid ${T.border}`}}>
            <div style={{fontFamily:"Raleway",fontSize:"12px",fontWeight:700,color:T.text,marginBottom:"4px"}}>🔁 Backup wiederherstellen</div>
            <div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textSoft,fontWeight:500,marginBottom:"8px"}}>JSON-Backup importieren — überschreibt alle aktuellen Daten</div>
            <label style={{display:"block",width:"100%",fontFamily:"Raleway",fontWeight:700,fontSize:"11px",padding:"9px",borderRadius:"10px",border:"1.5px dashed #FCA5A5",background:"#FEE2E2",color:"#9B1C1C",cursor:"pointer",textAlign:"center"}}>
              📂 JSON-Datei auswählen
              <input type="file" accept=".json" style={{display:"none"}} onChange={async e=>{
                const file=e.target.files?.[0];if(!file)return;
                try{
                  const txt=await file.text();
                  const data=JSON.parse(txt);
                  if(!data.version)throw new Error("Ungültiges Format");
                  if(!window.confirm("Alle aktuellen Daten werden überschrieben. Fortfahren?"))return;
                  await onImport(data);
                  setImportMsg("✅ Import erfolgreich!");
                  setTimeout(()=>setImportMsg(""),3000);
                }catch(err){setImportMsg("❌ Fehler: "+err.message);setTimeout(()=>setImportMsg(""),4000);}
                e.target.value="";
              }}/>
            </label>
            {importMsg&&<div style={{fontFamily:"Raleway",fontSize:"12px",fontWeight:700,color:importMsg.startsWith("✅")?T.tealD:"#9B1C1C",marginTop:"8px",textAlign:"center"}}>{importMsg}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── BILLING ──────────────────────────────────
const PAY_STATUS = {
  open:    { label:"Offen",       color:"#C0392B", bg:"#FEE2E2", border:"#FCA5A5", icon:"📋" },
  partial: { label:"Teilbezahlt", color:"#7C4A00", bg:"#FEF3C7", border:"#F59E0B", icon:"⚠️" },
  paid:    { label:"Bezahlt",     color:"#0A3B20", bg:"#DCFCE7", border:"#4ADE80", icon:"✅" },
};

function Billing({ sessions, clients, settings, onUpdateSession }) {
  const [view,setView]     = useState("overview"); // overview | list | detail
  const [detail,setDetail] = useState(null);
  const [filterMonth,setFilterMonth] = useState("all");
  const [filterStatus,setFilterStatus] = useState("all");
  const currency = settings?.currency || "CHF";

  // Enrich sessions with client info
  const enriched = sessions.map(s => ({
    ...s,
    clientObj: clients.find(c=>c.id===s.clientId),
    feeNum: parseFloat(s.fee||0)||0,
    ps: PAY_STATUS[s.payStatus||"open"],
  }));

  // Month options
  const months = [...new Set(sessions.map(s=>s.createdAt?.slice(0,7)).filter(Boolean))].sort().reverse();

  // Filtered
  const filtered = enriched.filter(s => {
    if(filterMonth!=="all" && !s.createdAt?.startsWith(filterMonth)) return false;
    if(filterStatus!=="all" && (s.payStatus||"open")!==filterStatus) return false;
    return true;
  });

  // Stats
  const totalRevenue   = enriched.filter(s=>s.payStatus==="paid").reduce((a,s)=>a+s.feeNum,0);
  const totalOpen      = enriched.filter(s=>s.payStatus==="open"||s.payStatus==="partial").reduce((a,s)=>a+s.feeNum,0);
  const totalSessions  = enriched.filter(s=>s.feeNum>0).length;

  // Monthly chart data (last 6 months)
  const monthlyData = {};
  const now = new Date();
  for(let i=5;i>=0;i--){
    const d=new Date(now.getFullYear(),now.getMonth()-i,1);
    const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    monthlyData[key]={label:DE_MONTHS[d.getMonth()].slice(0,3),paid:0,open:0};
  }
  enriched.forEach(s=>{
    const key=s.createdAt?.slice(0,7);
    if(monthlyData[key]){
      if(s.payStatus==="paid") monthlyData[key].paid+=s.feeNum;
      else if(s.feeNum>0) monthlyData[key].open+=s.feeNum;
    }
  });
  const chartData=Object.values(monthlyData);
  const maxBar=Math.max(...chartData.map(m=>m.paid+m.open),1);

  // CSV export
  const exportCSV = () => {
    const rows = [
      ["Datum","Klient","Rechnungs-Nr.","Betrag",`Währung (${currency})`,"Status","Thema"],
      ...filtered.map(s=>[
        s.createdAt?.slice(0,10)||"",
        s.clientName||"",
        s.invoiceNr||"",
        s.feeNum||"",
        currency,
        s.ps?.label||"Offen",
        (s.goal||"").replace(/,/g," "),
      ])
    ];
    const csv = rows.map(r=>r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href=url; a.download=`lichtkern_abrechnung_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  // Update pay status inline
  const updateStatus = async (session, status) => {
    await onUpdateSession({...session, payStatus:status});
  };

  // ── Detail view ──
  if(detail) {
    const s = enriched.find(x=>x.id===detail);
    if(!s) { setDetail(null); return null; }
    const [editFee,setEditFee]       = useState(s.fee||"");
    const [editStatus,setEditStatus] = useState(s.payStatus||"open");
    const [editInvNr,setEditInvNr]   = useState(s.invoiceNr||"");
    const [editInvDate,setEditInvDate] = useState(s.invoiceDate||"");
    const [saving,setSaving]         = useState(false);
    const save = async () => { setSaving(true); await onUpdateSession({...s,fee:editFee,payStatus:editStatus,invoiceNr:editInvNr,invoiceDate:editInvDate}); setSaving(false); setDetail(null); };
    const ps = PAY_STATUS[editStatus]||PAY_STATUS.open;

    return (
      <div style={{padding:"0 16px 96px"}}>
        <button onClick={()=>setDetail(null)} style={{fontFamily:"Raleway",fontSize:"13px",color:T.teal,fontWeight:700,background:"none",border:"none",cursor:"pointer",paddingTop:"8px",display:"block",marginBottom:"12px"}}>← Zurück</button>

        <div style={{background:ps.bg,borderRadius:"20px",padding:"20px",marginBottom:"14px",border:`1.5px solid ${ps.border}`}}>
          <div style={{fontFamily:"Cinzel",fontSize:"18px",color:T.text,fontWeight:700}}>{s.clientName||"—"}</div>
          <div style={{fontFamily:"Raleway",fontSize:"12px",color:T.textMid,marginTop:"3px",fontWeight:500}}>{s.createdAt?.slice(0,10)} · {s.goal||"Kein Thema"}</div>
          <div style={{marginTop:"12px",display:"flex",alignItems:"center",gap:"8px"}}>
            <span style={{fontSize:"20px"}}>{ps.icon}</span>
            <span style={{fontFamily:"Raleway",fontSize:"14px",fontWeight:700,color:ps.color}}>{ps.label}</span>
          </div>
        </div>

        <Card style={{marginBottom:"12px"}}>
          <SL>Honorar</SL>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"12px"}}>
            <div>
              <div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textSoft,fontWeight:600,marginBottom:"4px"}}>Betrag ({currency})</div>
              <TI value={editFee} onChange={setEditFee} placeholder="120"/>
            </div>
            <div>
              <div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textSoft,fontWeight:600,marginBottom:"4px"}}>Status</div>
              <select value={editStatus} onChange={e=>setEditStatus(e.target.value)} style={{width:"100%",background:"#FFF",border:`1.5px solid ${T.border}`,borderRadius:"12px",padding:"11px 14px",color:T.text,fontFamily:"Raleway",fontSize:"13px",fontWeight:500,outline:"none",appearance:"none"}}>
                {Object.entries(PAY_STATUS).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
            </div>
          </div>
          <SL>Rechnung</SL>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
            <TI value={editInvNr} onChange={setEditInvNr} placeholder="RG-2024-001"/>
            <TI type="date" value={editInvDate} onChange={setEditInvDate}/>
          </div>
        </Card>

        <Btn onClick={save} disabled={saving} style={{width:"100%",marginBottom:"8px"}}>
          {saving?"Speichert…":"💾 Speichern"}
        </Btn>
      </div>
    );
  }

  return (
    <div style={{padding:"0 16px 96px"}}>
      {/* Hero */}
      <div style={{position:"relative",borderRadius:"22px",overflow:"hidden",padding:"22px 24px",marginBottom:"16px",background:`linear-gradient(140deg,${T.tealL} 0%,#FFFFFF 50%,${T.violetL} 100%)`,boxShadow:`0 6px 28px ${T.shadowDeep}`,border:`1.5px solid ${T.border}`}}>
        <Flower size={200} opacity={0.09}/>
        <div style={{position:"relative",zIndex:1}}>
          <h2 style={{fontFamily:"Cinzel",fontSize:"20px",color:T.text,margin:"0 0 12px",fontWeight:700}}>Abrechnung</h2>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"}}>
            {[
              {label:"Einnahmen",  value:`${totalRevenue.toFixed(0)} ${currency}`, bg:"#DCFCE7", border:"#4ADE80", color:"#0A3B20"},
              {label:"Offen",      value:`${totalOpen.toFixed(0)} ${currency}`,    bg:"#FEE2E2", border:"#FCA5A5", color:"#9B1C1C"},
              {label:"Sitzungen",  value:totalSessions,                             bg:T.tealL,   border:T.borderMid, color:T.tealD},
            ].map((s,i)=>(
              <div key={i} style={{background:s.bg,borderRadius:"14px",border:`1.5px solid ${s.border}`,padding:"10px 8px",textAlign:"center"}}>
                <div style={{fontFamily:"Cinzel",fontSize:"16px",color:s.color,fontWeight:700}}>{s.value}</div>
                <div style={{fontFamily:"Raleway",fontSize:"9px",color:s.color,marginTop:"3px",fontWeight:700,opacity:0.85}}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly bar chart */}
      <Card style={{marginBottom:"14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
          <SL>Einnahmen pro Monat</SL>
          <button onClick={exportCSV} style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:700,padding:"6px 12px",borderRadius:"10px",border:`1.5px solid ${T.border}`,background:T.bgSoft,color:T.textMid,cursor:"pointer"}}>
            📥 CSV
          </button>
        </div>
        <div style={{display:"flex",alignItems:"flex-end",gap:"6px",height:"80px",marginBottom:"6px"}}>
          {chartData.map((m,i)=>(
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"2px",height:"100%",justifyContent:"flex-end"}}>
              <div style={{fontFamily:"Raleway",fontSize:"9px",color:T.teal,fontWeight:700}}>{m.paid>0?m.paid.toFixed(0):""}</div>
              <div style={{width:"100%",display:"flex",flexDirection:"column",justifyContent:"flex-end",height:`${Math.max(((m.paid+m.open)/maxBar)*100,4)}%`}}>
                {m.open>0&&<div style={{width:"100%",background:"#FEE2E2",flex:m.open/(m.paid+m.open||1)}}/>}
                {m.paid>0&&<div style={{width:"100%",background:T.teal,borderRadius:"4px 4px 0 0",flex:m.paid/(m.paid+m.open||1)}}/>}
              </div>
              <div style={{fontFamily:"Raleway",fontSize:"8px",color:T.textSoft,fontWeight:700}}>{m.label}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:"12px",justifyContent:"center"}}>
          {[{c:T.teal,l:"Bezahlt"},{c:"#FCA5A5",l:"Offen"}].map((x,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:"5px"}}>
              <div style={{width:"10px",height:"10px",borderRadius:"2px",background:x.c}}/>
              <span style={{fontFamily:"Raleway",fontSize:"10px",color:T.textSoft,fontWeight:600}}>{x.l}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Filters */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"14px"}}>
        <select value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} style={{background:"#FFF",border:`1.5px solid ${T.border}`,borderRadius:"12px",padding:"10px 12px",color:T.text,fontFamily:"Raleway",fontSize:"12px",fontWeight:600,outline:"none",appearance:"none"}}>
          <option value="all">Alle Monate</option>
          {months.map(m=><option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{background:"#FFF",border:`1.5px solid ${T.border}`,borderRadius:"12px",padding:"10px 12px",color:T.text,fontFamily:"Raleway",fontSize:"12px",fontWeight:600,outline:"none",appearance:"none"}}>
          <option value="all">Alle Status</option>
          {Object.entries(PAY_STATUS).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
        </select>
      </div>

      {/* Session list */}
      {filtered.length===0
        ? <div style={{textAlign:"center",padding:"48px 0"}}>
            <div style={{fontSize:"36px",opacity:0.3,marginBottom:"10px"}}>💰</div>
            <div style={{fontFamily:"Raleway",fontSize:"13px",color:T.textMid,fontWeight:600}}>Keine Einträge</div>
          </div>
        : <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
            {filtered.map(s=>{
              const ps=s.ps||PAY_STATUS.open;
              return (
                <div key={s.id} style={{background:ps.bg,borderRadius:"16px",padding:"13px 14px",border:`1.5px solid ${ps.border}`,display:"flex",alignItems:"center",gap:"12px",cursor:"pointer"}} onClick={()=>setDetail(s.id)}>
                  <div style={{fontSize:"20px",flexShrink:0}}>{ps.icon}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:"Raleway",fontSize:"13px",fontWeight:700,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.clientName||"—"}</div>
                    <div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textMid,fontWeight:500,marginTop:"2px"}}>{s.createdAt?.slice(0,10)} {s.invoiceNr?`· ${s.invoiceNr}`:""}</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontFamily:"Cinzel",fontSize:"15px",color:ps.color,fontWeight:700}}>{s.feeNum>0?`${s.feeNum} ${currency}`:"—"}</div>
                    <div style={{fontFamily:"Raleway",fontSize:"9px",color:ps.color,fontWeight:700,marginTop:"2px"}}>{ps.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
      }

      {/* Year total */}
      {(() => {
        const year = new Date().getFullYear();
        const yearTotal = enriched.filter(s=>s.createdAt?.startsWith(year+"")&&s.payStatus==="paid").reduce((a,s)=>a+s.feeNum,0);
        return yearTotal>0 ? (
          <div style={{marginTop:"16px",background:T.bgSoft,borderRadius:"16px",padding:"14px 16px",border:`1.5px solid ${T.border}`,textAlign:"center"}}>
            <div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textSoft,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"4px"}}>Jahreseinnahmen {year}</div>
            <div style={{fontFamily:"Cinzel",fontSize:"26px",color:T.tealD,fontWeight:700}}>{yearTotal.toFixed(2)} {currency}</div>
          </div>
        ) : null;
      })()}
    </div>
  );
}

// ─── DEFAULT TEMPLATES ────────────────────────
const DEFAULT_TEMPLATES = [
  {
    id:"tpl_first", name:"Erstsitzung Standard", emoji:"🌱", builtin:true,
    type:"first", category:"Körper", resonanceSource:"Intuition",
    levels:{struktur:40,stoffwechsel:30,energetisch:50,emotional:40},
    techniques:["Energetische Anamnese","Belastungstest","Muster-Check","Chakren-Balance"],
    goal:"Erstanamnese & Kennenlernen des Energiesystems",
    homework:"Beobachte in den nächsten Tagen, welche Themen besonders präsent sind.",
    notes:"",
  },
  {
    id:"tpl_followup", name:"Folgesitzung", emoji:"🔄", builtin:true,
    type:"followup", category:"Emotion", resonanceSource:"Intuition",
    levels:{emotional:60,mental:50,energetisch:40},
    techniques:["Resonanz-Check","Emotions-Entkopplung","Meridian-Ausgleich"],
    goal:"Fortsetzung & Vertiefung der letzten Sitzung",
    homework:"Führe das tägliche Atemübung fort und notiere aufkommende Träume.",
    notes:"",
  },
  {
    id:"tpl_energy", name:"Energetische Tiefenarbeit", emoji:"⚡", builtin:true,
    type:"followup", category:"Bewusstsein", resonanceSource:"Pendel",
    levels:{energetisch:80,spirituell:70,universell:60},
    techniques:["Chakren-Balance","Meridian-Ausgleich","Reinigung Energiekörper","Schutz & Stärkung","Heilige Geometrie"],
    goal:"Tiefenreinigung und Stärkung des Energiekörpers",
    homework:"Täglich 5 Minuten in Stille sitzen und den Energiefluss wahrnehmen.",
    notes:"",
  },
  {
    id:"tpl_ahnen", name:"Ahnen & DNA", emoji:"🧬", builtin:true,
    type:"followup", category:"Ahnen", resonanceSource:"Muskeltest",
    levels:{dna:80,spirituell:60,emotional:50},
    techniques:["Ahnenlinie Mutter","Ahnenlinie Vater","DNS-Programm","Loyalitäten & Schwüre","Zeitlinienarbeit"],
    goal:"Auflösung von Ahnenthemen und DNS-Programmen",
    homework:"Schreibe einen Brief an deine Ahnen — ohne ihn zu schicken.",
    notes:"",
  },
  {
    id:"tpl_emotion", name:"Emotionale Transformation", emoji:"💚", builtin:true,
    type:"followup", category:"Emotion", resonanceSource:"Kinesiologie",
    levels:{emotional:80,mental:70,struktur:40},
    techniques:["EFT (Klopftechnik)","Atemtechnik 5-5-5-5","Emotions-Entkopplung","Glaubenssatz-Shift","Anker setzen"],
    goal:"Transformation blockierter Emotionen und limitierender Glaubenssätze",
    homework:"Klopfe täglich 2 Minuten auf die EFT-Punkte beim Aufwachen.",
    notes:"",
  },
  {
    id:"tpl_closing", name:"Abschluss-Sitzung", emoji:"✨", builtin:true,
    type:"closing", category:"Bewusstsein", resonanceSource:"Intuition",
    levels:{energetisch:50,emotional:50,mental:50,spirituell:60},
    techniques:["Ritual & Abschluss","Schutz & Stärkung","Anker setzen","Heiliger Raum öffnen"],
    goal:"Integration & würdevoller Abschluss des Prozesses",
    homework:"Feiere deinen Weg. Schreibe auf, was du gewonnen hast.",
    notes:"",
  },
];

// ─── TEMPLATE PICKER MODAL ────────────────────
function TemplatePickerModal({ templates, onSelect, onSkip, onClose }) {
  const allTemplates = [...DEFAULT_TEMPLATES, ...templates.filter(t=>!t.builtin)];
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(15,48,48,0.5)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:T.bgCard,borderRadius:"24px 24px 0 0",width:"100%",maxWidth:"480px",maxHeight:"85vh",overflowY:"auto",padding:"22px 20px 48px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"}}>
          <div style={{fontFamily:"Cinzel",fontSize:"17px",color:T.text,fontWeight:700}}>📋 Vorlage wählen</div>
          <button onClick={onClose} style={{fontSize:"20px",color:T.textSoft,background:"none",border:"none",cursor:"pointer"}}>✕</button>
        </div>
        <p style={{fontFamily:"Raleway",fontSize:"12px",color:T.textSoft,fontWeight:500,marginBottom:"18px"}}>Vorlage wählen oder ohne starten</p>

        <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"14px"}}>
          {allTemplates.map(tpl=>(
            <div key={tpl.id} onClick={()=>onSelect(tpl)} style={{background:T.bgSoft,borderRadius:"16px",padding:"14px 16px",cursor:"pointer",border:`1.5px solid ${T.border}`,display:"flex",alignItems:"center",gap:"14px",transition:"all 0.15s"}}>
              <span style={{fontSize:"28px",flexShrink:0}}>{tpl.emoji||"📋"}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:"Raleway",fontSize:"13px",fontWeight:700,color:T.text}}>{tpl.name}</div>
                <div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textMid,fontWeight:500,marginTop:"3px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {tpl.goal||"Kein Thema"}
                </div>
                <div style={{display:"flex",gap:"5px",marginTop:"6px",flexWrap:"wrap"}}>
                  {(tpl.techniques||[]).slice(0,3).map(t=>(
                    <span key={t} style={{fontSize:"9px",padding:"2px 8px",borderRadius:"10px",background:T.tealL,color:T.tealD,fontFamily:"Raleway",fontWeight:700}}>{t}</span>
                  ))}
                  {(tpl.techniques||[]).length>3&&<span style={{fontSize:"9px",color:T.textSoft,fontFamily:"Raleway",fontWeight:600}}>+{(tpl.techniques||[]).length-3}</span>}
                </div>
              </div>
              <span style={{color:T.textSoft,fontSize:"18px",flexShrink:0}}>›</span>
            </div>
          ))}
        </div>

        <button onClick={onSkip} style={{width:"100%",fontFamily:"Raleway",fontWeight:700,fontSize:"13px",padding:"13px",borderRadius:"12px",border:`1.5px solid ${T.border}`,background:"white",color:T.textMid,cursor:"pointer"}}>
          Ohne Vorlage starten →
        </button>
      </div>
    </div>
  );
}

// ─── TEMPLATES SCREEN ─────────────────────────
function TemplatesScreen({ templates, onSave, onStartSession }) {
  const [editing, setEditing]   = useState(null); // null | template object
  const [showPicker, setShowPicker] = useState(false);
  const allBuiltin = DEFAULT_TEMPLATES;
  const custom = templates.filter(t=>!t.builtin);

  const saveCustom = (tpl) => {
    const isNew = !templates.find(t=>t.id===tpl.id);
    const next = isNew ? [...templates,tpl] : templates.map(t=>t.id===tpl.id?tpl:t);
    onSave(next);
    setEditing(null);
  };
  const deleteCustom = (id) => { onSave(templates.filter(t=>t.id!==id)); };
  const newTemplate = () => setEditing({id:uid(),name:"",emoji:"📋",builtin:false,type:"followup",category:"",resonanceSource:"Intuition",levels:{},techniques:[],goal:"",homework:"",notes:""});

  // ── Template Editor ──
  if(editing) return (
    <div style={{padding:"0 16px 96px"}}>
      <button onClick={()=>setEditing(null)} style={{fontFamily:"Raleway",fontSize:"13px",color:T.teal,fontWeight:700,background:"none",border:"none",cursor:"pointer",paddingTop:"8px",display:"block",marginBottom:"12px"}}>← Zurück</button>
      <h2 style={{fontFamily:"Cinzel",fontSize:"20px",color:T.text,fontWeight:700,marginBottom:"16px"}}>{editing.id&&templates.find(t=>t.id===editing.id)?"Vorlage bearbeiten":"Neue Vorlage"}</h2>

      <Card style={{marginBottom:"12px"}}>
        <SL>Name & Emoji</SL>
        <div style={{display:"grid",gridTemplateColumns:"60px 1fr",gap:"8px",marginBottom:"12px"}}>
          <TI value={editing.emoji||""} onChange={v=>setEditing({...editing,emoji:v})} placeholder="📋"/>
          <TI value={editing.name||""} onChange={v=>setEditing({...editing,name:v})} placeholder="z.B. Mein Ablauf"/>
        </div>
        <SL>Sitzungstyp</SL>
        <div style={{display:"flex",gap:"8px",marginBottom:"12px",flexWrap:"wrap"}}>
          {[["first","🌱 Erst"],["followup","🔄 Folge"],["closing","✨ Abschluss"]].map(([v,l])=>(
            <button key={v} onClick={()=>setEditing({...editing,type:v})} style={{padding:"8px 14px",borderRadius:"12px",border:`1.5px solid ${editing.type===v?T.teal:T.border}`,background:editing.type===v?T.tealL:"white",cursor:"pointer",fontFamily:"Raleway",fontSize:"11px",fontWeight:700,color:editing.type===v?T.tealD:T.textMid}}>
              {l}
            </button>
          ))}
        </div>
        <SL>Kategorie</SL>
        <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:"12px"}}>
          {["Körper","Emotion","Beziehung","Beruf","Ahnen","Bewusstsein","Trauma","Sonstiges"].map(o=>(
            <Pill key={o} label={o} active={editing.category===o} onClick={()=>setEditing({...editing,category:editing.category===o?"":o})}/>
          ))}
        </div>
        <SL>Resonanz-Quelle</SL>
        <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
          {["Intuition","Muskeltest","Pendel","Kinesiologie","Sonstiges"].map(o=>(
            <Pill key={o} label={o} active={editing.resonanceSource===o} onClick={()=>setEditing({...editing,resonanceSource:o})}/>
          ))}
        </div>
      </Card>

      <Card style={{marginBottom:"12px"}}>
        <SL>Ebenen-Vorwerte</SL>
        {LEVELS.map(l=>(
          <LBar key={l.key} levelKey={l.key} value={editing.levels?.[l.key]||0}
            onChange={(k,v)=>setEditing({...editing,levels:{...(editing.levels||{}),[k]:v}})}/>
        ))}
      </Card>

      <Card style={{marginBottom:"12px"}}>
        <SL>Techniken</SL>
        {Object.entries(TECHNIQUES).map(([cat,items])=>(
          <div key={cat} style={{marginBottom:"12px"}}>
            <div style={{fontFamily:"Raleway",fontSize:"9px",letterSpacing:"1.5px",fontWeight:800,color:T.textSoft,textTransform:"uppercase",marginBottom:"6px"}}>{cat}</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
              {items.map(t=>{
                const sel=(editing.techniques||[]).includes(t);
                return <button key={t} onClick={()=>setEditing({...editing,techniques:sel?(editing.techniques||[]).filter(x=>x!==t):[...(editing.techniques||[]),t]})} style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:600,padding:"6px 12px",borderRadius:"16px",border:`1.5px solid ${sel?T.teal:T.border}`,background:sel?T.teal:"white",color:sel?"white":T.textMid,cursor:"pointer"}}>{t}</button>;
              })}
            </div>
          </div>
        ))}
      </Card>

      <Card style={{marginBottom:"12px"}}>
        <SL>Thema / Ziel</SL>
        <div style={{marginBottom:"10px"}}><TI value={editing.goal||""} onChange={v=>setEditing({...editing,goal:v})} placeholder="Voreingestelltes Thema…" multiline rows={2}/></div>
        <SL>Integrationsauftrag</SL>
        <div style={{marginBottom:"10px"}}><TI value={editing.homework||""} onChange={v=>setEditing({...editing,homework:v})} placeholder="Voreingestellter Auftrag…" multiline rows={2}/></div>
        <SL>Notiz-Vorlage</SL>
        <TI value={editing.notes||""} onChange={v=>setEditing({...editing,notes:v})} placeholder="Private Notiz-Vorlage…" multiline rows={2}/>
      </Card>

      <div style={{display:"flex",gap:"8px"}}>
        <Btn onClick={()=>saveCustom(editing)} style={{flex:2}}>💾 Speichern</Btn>
        <Btn variant="soft" onClick={()=>setEditing(null)} style={{flex:1}}>Abbrechen</Btn>
      </div>
    </div>
  );

  return (
    <div style={{padding:"0 16px 96px"}}>
      {/* Hero */}
      <div style={{position:"relative",borderRadius:"22px",overflow:"hidden",padding:"22px 24px",marginBottom:"20px",background:`linear-gradient(140deg,${T.tealL} 0%,#FFFFFF 50%,${T.violetL} 100%)`,boxShadow:`0 6px 28px ${T.shadowDeep}`,border:`1.5px solid ${T.border}`}}>
        <Flower size={200} opacity={0.09}/>
        <div style={{position:"relative",zIndex:1,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <h2 style={{fontFamily:"Cinzel",fontSize:"20px",color:T.text,margin:"0 0 4px",fontWeight:700}}>Vorlagen</h2>
            <p style={{fontFamily:"Raleway",fontSize:"11px",color:T.textMid,margin:0,fontWeight:600}}>{allBuiltin.length} Standard · {custom.length} Eigene</p>
          </div>
          <Btn onClick={newTemplate} style={{fontSize:"12px",padding:"9px 16px"}}>+ Neu</Btn>
        </div>
      </div>

      {/* Built-in templates */}
      <SL>Standard-Vorlagen</SL>
      <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"20px"}}>
        {allBuiltin.map(tpl=>(
          <Card key={tpl.id} style={{padding:"13px 14px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
              <span style={{fontSize:"26px",flexShrink:0}}>{tpl.emoji}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:"Raleway",fontSize:"13px",fontWeight:700,color:T.text}}>{tpl.name}</div>
                <div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textSoft,fontWeight:500,marginTop:"2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{tpl.goal}</div>
                <div style={{display:"flex",gap:"4px",marginTop:"6px",flexWrap:"wrap"}}>
                  {(tpl.techniques||[]).slice(0,3).map(t=><span key={t} style={{fontSize:"9px",padding:"2px 8px",borderRadius:"10px",background:T.tealL,color:T.tealD,fontFamily:"Raleway",fontWeight:700}}>{t}</span>)}
                </div>
              </div>
              <button onClick={()=>onStartSession(tpl)} style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:700,padding:"7px 12px",borderRadius:"10px",border:"none",cursor:"pointer",background:`linear-gradient(135deg,${T.teal},${T.tealD})`,color:"white",flexShrink:0}}>
                ✦ Start
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Custom templates */}
      {custom.length>0&&(<>
        <SL>Eigene Vorlagen</SL>
        <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"20px"}}>
          {custom.map(tpl=>(
            <Card key={tpl.id} style={{padding:"13px 14px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                <span style={{fontSize:"26px",flexShrink:0}}>{tpl.emoji||"📋"}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:"Raleway",fontSize:"13px",fontWeight:700,color:T.text}}>{tpl.name||"Unbenannt"}</div>
                  <div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textSoft,fontWeight:500,marginTop:"2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{tpl.goal||"—"}</div>
                </div>
                <div style={{display:"flex",gap:"6px",flexShrink:0}}>
                  <button onClick={()=>setEditing({...tpl})} style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:700,padding:"7px 10px",borderRadius:"10px",border:`1.5px solid ${T.border}`,cursor:"pointer",background:T.bgSoft,color:T.textMid}}>✏️</button>
                  <button onClick={()=>onStartSession(tpl)} style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:700,padding:"7px 12px",borderRadius:"10px",border:"none",cursor:"pointer",background:`linear-gradient(135deg,${T.teal},${T.tealD})`,color:"white"}}>✦</button>
                  <button onClick={()=>{if(window.confirm("Vorlage löschen?"))deleteCustom(tpl.id);}} style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:700,padding:"7px 10px",borderRadius:"10px",border:"1.5px solid #FCA5A5",cursor:"pointer",background:"#FEE2E2",color:"#9B1C1C"}}>🗑</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </>)}

      <div style={{background:T.bgSoft,borderRadius:"16px",padding:"14px 16px",border:`1.5px solid ${T.border}`,textAlign:"center"}}>
        <div style={{fontFamily:"Raleway",fontSize:"12px",color:T.textMid,fontWeight:600,marginBottom:"10px"}}>
          Vorlage direkt als Sitzung starten
        </div>
        <Btn onClick={()=>setShowPicker(true)} style={{fontSize:"12px",padding:"10px 20px"}}>
          📋 Vorlage auswählen
        </Btn>
      </div>

      {showPicker&&<TemplatePickerModal templates={templates} onSelect={tpl=>{setShowPicker(false);onStartSession(tpl);}} onSkip={()=>{setShowPicker(false);onStartSession(null);}} onClose={()=>setShowPicker(false)}/>}
    </div>
  );
}

// ─── ONBOARDING FRAGEBOGEN ────────────────────
const LEBENSBEREICH_OPTIONS = ["Körper & Gesundheit","Beziehung & Familie","Beruf & Finanzen","Spiritualität","Persönlichkeit","Sinnfrage & Lebensweg"];
const ENERGIE_OPTIONS = ["Operationen","Unfälle","Traumata","Chronische Erkrankungen","Burnout","Schwere Verluste"];
const THERAPIE_OPTIONS = ["Psychotherapie","Physiotherapie","Homöopathie","Osteopathie","Andere Energetik","Coaching","Keine bisherige Therapie"];

function OnboardingScreen({ onSave, onCancel }) {
  const ONBOARDING_STEPS = ["Person","Beschwerden","Vorgeschichte","Lebensbereiche","Ziele","Ahnen","Abschluss"];
  const [step, setStep] = useState(0);
  const [clientMode, setClientMode] = useState(null); // null | "self" | "together"
  const [form, setForm] = useState({
    // Person
    name:"", birthDate:"", contact:"", address:"",
    // Beschwerden
    complaints:"", symptoms:[], symptomFreeText:"",
    // Vorgeschichte
    previousTherapies:[], previousTherapiesFreeText:"", energeticHistory:[], energeticFreeText:"",
    // Lebensbereiche
    lifeareas:{}, lifeareaFreeText:"",
    // Ziele
    goals:"", expectations:"", sessionType:"first",
    // Ahnen
    ancestorThemes:"", familyPatterns:"", ancestorNotes:"",
    // Abschluss
    ownQuestions:"", consent:false,
    tags:"",
  });
  const [showPreview, setShowPreview] = useState(false);
  const up = u => setForm(f=>({...f,...u}));

  // Mode selection
  if(!clientMode) return (
    <div style={{padding:"0 16px 96px"}}>
      <button onClick={onCancel} style={{fontFamily:"Raleway",fontSize:"13px",color:T.teal,fontWeight:700,background:"none",border:"none",cursor:"pointer",paddingTop:"8px",display:"block",marginBottom:"16px"}}>← Zurück</button>
      <div style={{position:"relative",borderRadius:"22px",overflow:"hidden",padding:"26px 24px",marginBottom:"24px",background:`linear-gradient(140deg,${T.tealL} 0%,#FFFFFF 50%,${T.violetL} 100%)`,boxShadow:`0 6px 28px ${T.shadowDeep}`,border:`1.5px solid ${T.border}`}}>
        <Flower size={200} opacity={0.09}/>
        <div style={{position:"relative",zIndex:1}}>
          <h2 style={{fontFamily:"Cinzel",fontSize:"22px",color:T.text,margin:"0 0 6px",fontWeight:700}}>Erstanamnese</h2>
          <p style={{fontFamily:"Raleway",fontSize:"12px",color:T.textMid,margin:0,fontWeight:600}}>Vollständige Erstbefragung · 7 Bereiche</p>
        </div>
      </div>
      <SL>Wer füllt den Fragebogen aus?</SL>
      <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
        {[
          {mode:"together",icon:"🤝",title:"Gemeinsam ausfüllen",sub:"Therapeut und Klient sitzen zusammen — du führst durch den Fragebogen"},
          {mode:"mail_text",icon:"✉️",title:"Per Mail versenden — Textformat",sub:"Öffnet dein Mailprogramm mit allen Fragen als lesbaren Text — Klient antwortet per Mail"},
          {mode:"mail_pdf",icon:"📄",title:"Per Mail versenden — PDF",sub:"Generiert einen druckbaren Leer-Fragebogen als PDF zum Herunterladen & Versenden"},
        ].map(opt=>(
          <div key={opt.mode} onClick={()=>setClientMode(opt.mode)} style={{background:"white",borderRadius:"18px",padding:"18px 20px",cursor:"pointer",border:`1.5px solid ${T.border}`,boxShadow:`0 3px 14px ${T.shadow}`,display:"flex",gap:"16px",alignItems:"center"}}>
            <span style={{fontSize:"32px",flexShrink:0}}>{opt.icon}</span>
            <div>
              <div style={{fontFamily:"Raleway",fontSize:"14px",fontWeight:700,color:T.text}}>{opt.title}</div>
              <div style={{fontFamily:"Raleway",fontSize:"12px",color:T.textSoft,fontWeight:500,marginTop:"4px"}}>{opt.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Mail modes: send questionnaire via email or PDF
  const [mailEmail,setMailEmail] = useState("");
  if(clientMode==="mail_text"||clientMode==="mail_pdf"){
    const sendMailText = () => {
      const subject = encodeURIComponent("Erstanamnese · Lichtkern");
      const body = encodeURIComponent(`Liebe/r Klient/in,

bitte fülle diesen Fragebogen vor unserer ersten Sitzung aus und sende ihn ausgefüllt zurück.

─── PERSÖNLICHE DATEN ───────────────────────
Name:
Geburtsdatum:
Kontakt (Email / Telefon):
Adresse:

─── AKTUELLE BESCHWERDEN ───────────────────
Was beschäftigt dich am meisten?


Symptome (bitte ankreuzen oder ergänzen):
□ Schmerzen  □ Schlafstörungen  □ Erschöpfung  □ Angstzustände
□ Depressionen  □ Verdauungsprobleme  □ Hautprobleme  □ Kopfschmerzen
□ Rückenschmerzen  □ Herzprobleme  □ Hormonstörungen  □ Immunschwäche
□ Weitere:

─── BISHERIGE THERAPIEN ────────────────────
□ Psychotherapie  □ Physiotherapie  □ Homöopathie  □ Osteopathie
□ Andere Energetik  □ Coaching  □ Keine bisherige Therapie
□ Weitere:

─── ENERGETISCHE VORGESCHICHTE ─────────────
□ Operationen  □ Unfälle  □ Traumata  □ Chronische Erkrankungen
□ Burnout  □ Schwere Verluste
□ Weitere:

─── LEBENSBEREICHE (Belastung 0–10) ────────
Körper & Gesundheit: /10
Beziehung & Familie: /10
Beruf & Finanzen: /10
Spiritualität: /10
Persönlichkeit: /10
Sinnfrage & Lebensweg: /10

─── ZIELE & ERWARTUNGEN ────────────────────
Was möchtest du in der Arbeit mit mir erreichen?


Was erwartest du von der ersten Sitzung?


─── AHNEN & FAMILIENMUSTER ─────────────────
Bekannte Ahnenthemen in deiner Familie:


Wiederkehrende Familienmuster:


─── EIGENE FRAGEN ──────────────────────────
Was möchtest du mich fragen?


───────────────────────────────────────────
✦ Lichtkern · powered by Resonanz Akademie
Deine Angaben werden vertraulich behandelt.`);
      window.location.href = `mailto:${mailEmail}?subject=${subject}&body=${body}`;
    };

    const sendMailPDF = () => {
      const html = `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"/>
<title>Erstanamnese · Lichtkern</title>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Raleway:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Raleway,sans-serif;color:#0F3030;background:#F0FAFA;-webkit-print-color-adjust:exact;print-color-adjust:exact;}.page{max-width:700px;margin:0 auto;padding:40px;}.no-print{text-align:right;margin-bottom:20px;}.section{background:white;border-radius:14px;padding:18px 20px;margin-bottom:14px;border:1.5px solid #B2E0DC;}.line{border-bottom:1px solid #B2E0DC;height:28px;margin:8px 0;}.check{display:inline-block;width:16px;height:16px;border:1.5px solid #B2E0DC;border-radius:3px;margin-right:6px;vertical-align:middle;}h3{font-family:Cinzel,serif;font-size:12px;color:#0F3030;margin:0 0 12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;}p{font-size:12px;color:#2D6B68;font-weight:600;margin-bottom:6px;}@media print{.no-print{display:none;}}</style>
</head><body><div class="page">
<div class="no-print"><button onclick="window.print()" style="font-family:Raleway;font-weight:700;font-size:13px;padding:10px 24px;background:linear-gradient(135deg,#0D9488,#0F6B63);color:white;border:none;border-radius:12px;cursor:pointer;">🖨 PDF drucken / speichern</button></div>
<div style="background:linear-gradient(140deg,#CCFBF1,#FFFFFF,#EDE9FE);border-radius:20px;padding:28px;margin-bottom:20px;border:1.5px solid #B2E0DC;">
  <p style="font-size:9px;letter-spacing:3px;color:#6AABA7;text-transform:uppercase;margin-bottom:6px;font-weight:700;">ERSTANAMNESE</p>
  <h1 style="font-family:Cinzel,serif;font-size:24px;color:#0F3030;font-weight:700;margin-bottom:4px;">Lichtkern</h1>
  <p style="font-size:11px;color:#2D6B68;">powered by Resonanz Akademie · Vertraulicher Fragebogen</p>
</div>
<div class="section"><h3>Persönliche Daten</h3>
  <p>Name:</p><div class="line"></div>
  <p>Geburtsdatum:</p><div class="line"></div>
  <p>Kontakt (Email / Telefon):</p><div class="line"></div>
  <p>Adresse:</p><div class="line"></div><div class="line"></div>
</div>
<div class="section"><h3>Aktuelle Beschwerden</h3>
  <p>Was beschäftigt dich am meisten?</p>
  <div class="line"></div><div class="line"></div><div class="line"></div>
  <p style="margin-top:10px;">Symptome:</p>
  ${["Schmerzen","Schlafstörungen","Erschöpfung","Angstzustände","Depressionen","Verdauungsprobleme","Hautprobleme","Kopfschmerzen","Rückenschmerzen","Herzprobleme","Hormonstörungen","Immunschwäche"].map(s=>`<span class="check"></span>${s} &nbsp;&nbsp;`).join("")}
  <p style="margin-top:8px;">Weitere:</p><div class="line"></div>
</div>
<div class="section"><h3>Bisherige Therapien</h3>
  ${["Psychotherapie","Physiotherapie","Homöopathie","Osteopathie","Andere Energetik","Coaching","Keine bisherige Therapie"].map(s=>`<span class="check"></span>${s} &nbsp;&nbsp;`).join("")}
  <p style="margin-top:8px;">Weitere:</p><div class="line"></div>
</div>
<div class="section"><h3>Energetische Vorgeschichte</h3>
  ${["Operationen","Unfälle","Traumata","Chronische Erkrankungen","Burnout","Schwere Verluste"].map(s=>`<span class="check"></span>${s} &nbsp;&nbsp;`).join("")}
  <p style="margin-top:8px;">Weitere:</p><div class="line"></div>
</div>
<div class="section"><h3>Lebensbereiche (Belastung 0–10)</h3>
  ${["Körper & Gesundheit","Beziehung & Familie","Beruf & Finanzen","Spiritualität","Persönlichkeit","Sinnfrage & Lebensweg"].map(s=>`<p>${s}: <span style="display:inline-block;width:120px;border-bottom:1px solid #B2E0DC;margin-left:8px;">&nbsp;</span>/10</p>`).join("")}
</div>
<div class="section"><h3>Ziele & Erwartungen</h3>
  <p>Was möchtest du in der Arbeit mit mir erreichen?</p>
  <div class="line"></div><div class="line"></div><div class="line"></div>
  <p>Was erwartest du von der ersten Sitzung?</p>
  <div class="line"></div><div class="line"></div>
</div>
<div class="section"><h3>Ahnen & Familienmuster</h3>
  <p>Bekannte Ahnenthemen:</p><div class="line"></div><div class="line"></div>
  <p>Wiederkehrende Muster:</p><div class="line"></div><div class="line"></div>
</div>
<div class="section"><h3>Eigene Fragen</h3>
  <div class="line"></div><div class="line"></div><div class="line"></div>
</div>
<div style="border-top:1.5px solid #B2E0DC;margin-top:20px;padding-top:14px;text-align:center;">
  <p style="font-family:Cinzel,serif;font-size:11px;color:#0D9488;font-weight:700;">✦ Lichtkern · powered by Resonanz Akademie</p>
  <p style="font-size:9px;color:#6AABA7;margin-top:4px;">Vertraulich · Nicht für Dritte bestimmt</p>
</div>
</div></body></html>`;
      const w=window.open("","_blank");
      if(w){w.document.write(html);w.document.close();}
    };

    return (
      <div style={{padding:"0 16px 96px"}}>
        <button onClick={()=>setClientMode(null)} style={{fontFamily:"Raleway",fontSize:"13px",color:T.teal,fontWeight:700,background:"none",border:"none",cursor:"pointer",paddingTop:"8px",display:"block",marginBottom:"16px"}}>← Zurück</button>
        <div style={{position:"relative",borderRadius:"22px",overflow:"hidden",padding:"22px 24px",marginBottom:"20px",background:`linear-gradient(140deg,${T.tealL} 0%,#FFFFFF 50%,${T.violetL} 100%)`,boxShadow:`0 6px 28px ${T.shadowDeep}`,border:`1.5px solid ${T.border}`}}>
          <Flower size={180} opacity={0.09}/>
          <div style={{position:"relative",zIndex:1}}>
            <div style={{fontFamily:"Cinzel",fontSize:"18px",color:T.text,fontWeight:700}}>{clientMode==="mail_text"?"✉️ Fragebogen per Mail":"📄 Fragebogen als PDF"}</div>
            <div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textMid,marginTop:"3px",fontWeight:500}}>{clientMode==="mail_text"?"Klient erhält alle Fragen als Mailtext":"Leerer Fragebogen als druckbares PDF"}</div>
          </div>
        </div>

        {clientMode==="mail_text"&&(<>
          <SL>E-Mail Adresse des Klienten</SL>
          <div style={{marginBottom:"16px"}}><TI type="email" value={mailEmail} onChange={setMailEmail} placeholder="klient@beispiel.de"/></div>
          <div style={{background:"#EDFAF2",borderRadius:"14px",padding:"14px",marginBottom:"18px",border:"1.5px solid #4DC98A"}}>
            <div style={{fontFamily:"Raleway",fontSize:"12px",color:"#0A3B20",lineHeight:"1.7",fontWeight:500}}>
              Dein Mailprogramm öffnet sich mit dem vollständigen Fragebogen als Text. Klient füllt aus und antwortet per Mail — du überträgst die Angaben dann in Lichtkern.
            </div>
          </div>
          <Btn onClick={sendMailText} disabled={!mailEmail.trim()} style={{width:"100%",marginBottom:"8px"}}>
            ✉️ Mail öffnen & senden
          </Btn>
        </>)}

        {clientMode==="mail_pdf"&&(<>
          <div style={{background:"#EDFAF2",borderRadius:"14px",padding:"14px",marginBottom:"18px",border:"1.5px solid #4DC98A"}}>
            <div style={{fontFamily:"Raleway",fontSize:"12px",color:"#0A3B20",lineHeight:"1.7",fontWeight:500}}>
              Ein leerer, druckbarer Fragebogen öffnet sich als PDF. Speichere ihn und sende ihn per Mail an deinen Klienten. Klient füllt ihn aus, schickt ihn zurück — du überträgst die Angaben in Lichtkern.
            </div>
          </div>
          <Btn onClick={sendMailPDF} style={{width:"100%",marginBottom:"8px"}}>
            📄 Leeren Fragebogen öffnen
          </Btn>
        </>)}

        <Btn variant="soft" onClick={()=>setClientMode(null)} style={{width:"100%"}}>Zurück zur Auswahl</Btn>
      </div>
    );
  }

  // Together mode only now
  const isSelf = false;
  const bgStyle = {};

  // Preview & save
  if(showPreview) {
    const tags = form.tags.split(",").map(t=>t.trim()).filter(Boolean);
    const clientObj = {
      id:uid(), createdAt:new Date().toISOString(),
      name:form.name, contact:form.contact, address:form.address,
      birthDate:form.birthDate, notes:"",
      tags:[...tags,...(form.symptoms||[]),...(form.energeticHistory||[])].filter(Boolean),
      anamnesis:{...form},
    };

    const exportPDF = () => {
      const html = `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"/>
<title>Anamnese · ${form.name}</title>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Raleway:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Raleway,sans-serif;color:#0F3030;background:#F0FAFA;-webkit-print-color-adjust:exact;print-color-adjust:exact;}.page{max-width:700px;margin:0 auto;padding:40px;}.no-print{text-align:right;margin-bottom:20px;}@media print{.no-print{display:none;}}</style>
</head><body><div class="page">
<div class="no-print"><button onclick="window.print()" style="font-family:Raleway;font-weight:700;font-size:13px;padding:10px 24px;background:linear-gradient(135deg,#0D9488,#0F6B63);color:white;border:none;border-radius:12px;cursor:pointer;">🖨 PDF drucken</button></div>
<div style="background:linear-gradient(140deg,#CCFBF1,#FFFFFF,#EDE9FE);border-radius:20px;padding:30px;margin-bottom:24px;border:1.5px solid #B2E0DC;">
  <p style="font-size:9px;letter-spacing:3px;color:#6AABA7;text-transform:uppercase;margin-bottom:6px;font-weight:700;">ERSTANAMNESE</p>
  <h1 style="font-family:Cinzel,serif;font-size:26px;color:#0F3030;font-weight:700;margin-bottom:4px;">${form.name}</h1>
  <p style="font-size:12px;color:#2D6B68;font-weight:500;">*${form.birthDate||"—"} · ${form.contact||"—"} · ${new Date().toLocaleDateString("de-DE")}</p>
</div>
${[
  ["Beschwerden & Symptome", form.complaints||"—"],
  ["Vorherige Therapien", [...(form.previousTherapies||[]),form.previousTherapiesFreeText].filter(Boolean).join(", ")||"—"],
  ["Energetische Vorgeschichte", [...(form.energeticHistory||[]),form.energeticFreeText].filter(Boolean).join(", ")||"—"],
  ["Lebensbereiche", Object.entries(form.lifeareas||{}).filter(([,v])=>v).map(([k])=>k).join(", ")||"—"],
  ["Ziele & Erwartungen", [form.goals,form.expectations].filter(Boolean).join("\n")||"—"],
  ["Ahnen & Familienmuster", [form.ancestorThemes,form.familyPatterns,form.ancestorNotes].filter(Boolean).join("\n")||"—"],
  ["Eigene Fragen", form.ownQuestions||"—"],
].map(([title,content])=>`<div style="background:white;border-radius:14px;padding:18px 20px;margin-bottom:14px;border:1.5px solid #B2E0DC;">
  <h3 style="font-family:Cinzel,serif;font-size:12px;color:#0F3030;margin:0 0 8px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">${title}</h3>
  <p style="font-size:13px;color:#0F3030;line-height:1.8;white-space:pre-wrap;font-weight:500;">${content}</p>
</div>`).join("")}
<div style="border-top:1.5px solid #B2E0DC;margin-top:24px;padding-top:14px;text-align:center;">
  <p style="font-family:Cinzel,serif;font-size:11px;color:#0D9488;font-weight:700;">✦ Lichtkern · powered by Resonanz Akademie</p>
  <p style="font-size:9px;color:#6AABA7;margin-top:4px;">Vertrauliche Erstanamnese · Nicht für Dritte bestimmt</p>
</div>
</div></body></html>`;
      const w=window.open("","_blank");
      if(w){w.document.write(html);w.document.close();}
    };

    return (
      <div style={{padding:"0 16px 96px"}}>
        <button onClick={()=>setShowPreview(false)} style={{fontFamily:"Raleway",fontSize:"13px",color:T.teal,fontWeight:700,background:"none",border:"none",cursor:"pointer",paddingTop:"8px",display:"block",marginBottom:"14px"}}>← Bearbeiten</button>
        <div style={{background:`linear-gradient(140deg,${T.tealL},#FFFFFF,${T.violetL})`,borderRadius:"20px",padding:"20px",marginBottom:"14px",border:`1.5px solid ${T.border}`}}>
          <div style={{fontFamily:"Cinzel",fontSize:"20px",color:T.text,fontWeight:700}}>{form.name||"—"}</div>
          <div style={{fontFamily:"Raleway",fontSize:"12px",color:T.textMid,marginTop:"4px",fontWeight:500}}>
            {form.birthDate&&`*${form.birthDate} · `}{form.contact||""}
          </div>
        </div>
        {[
          {t:"Beschwerden",v:form.complaints},
          {t:"Vorherige Therapien",v:[...(form.previousTherapies||[]),form.previousTherapiesFreeText].filter(Boolean).join(", ")},
          {t:"Energetische Vorgeschichte",v:[...(form.energeticHistory||[]),form.energeticFreeText].filter(Boolean).join(", ")},
          {t:"Lebensbereiche",v:Object.entries(form.lifeareas||{}).filter(([,v])=>v).map(([k])=>k).join(", ")},
          {t:"Ziele",v:form.goals},
          {t:"Ahnenthemen",v:form.ancestorThemes},
          {t:"Familienmuster",v:form.familyPatterns},
          {t:"Eigene Fragen",v:form.ownQuestions},
        ].filter(x=>x.v).map(x=>(
          <Card key={x.t} style={{marginBottom:"10px",padding:"12px 14px"}}>
            <div style={{fontFamily:"Raleway",fontSize:"9px",fontWeight:800,color:T.textSoft,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:"5px"}}>{x.t}</div>
            <div style={{fontFamily:"Raleway",fontSize:"13px",color:T.text,lineHeight:"1.7",fontWeight:500}}>{x.v}</div>
          </Card>
        ))}

        {/* Consent */}
        <div style={{background:"#EDFAF2",borderRadius:"14px",padding:"14px",marginBottom:"18px",border:"1.5px solid #4DC98A",display:"flex",gap:"12px",alignItems:"flex-start"}}>
          <button onClick={()=>up({consent:!form.consent})} style={{width:"44px",height:"24px",borderRadius:"12px",border:"none",cursor:"pointer",flexShrink:0,marginTop:"2px",background:form.consent?T.teal:"#CBD5E1",position:"relative",transition:"background 0.2s"}}>
            <div style={{position:"absolute",top:"3px",left:form.consent?"23px":"3px",width:"18px",height:"18px",borderRadius:"50%",background:"white",transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}}/>
          </button>
          <div style={{fontFamily:"Raleway",fontSize:"12px",color:"#0A3B20",fontWeight:600,lineHeight:"1.6"}}>
            Ich stimme der Speicherung meiner Daten im Lichtkern-System zu. Meine Daten werden vertraulich behandelt und nicht an Dritte weitergegeben.
          </div>
        </div>

        <div style={{display:"flex",gap:"8px",flexDirection:"column"}}>
          <Btn onClick={()=>form.consent&&onSave(clientObj)} disabled={!form.consent} style={{width:"100%",fontSize:"14px",padding:"14px"}}>
            ✅ Als Klient speichern
          </Btn>
          <button onClick={exportPDF} style={{width:"100%",fontFamily:"Raleway",fontWeight:700,fontSize:"13px",padding:"13px",borderRadius:"12px",border:`1.5px solid ${T.border}`,background:T.bgSoft,color:T.textMid,cursor:"pointer"}}>
            📄 Anamnese als PDF
          </button>
          <Btn variant="soft" onClick={onCancel} style={{width:"100%"}}>Abbrechen</Btn>
        </div>
      </div>
    );
  }

  // Step content
  const StepWrap = ({children}) => (
    <div style={{padding:"0 16px 96px",...bgStyle}}>
      {/* Progress */}
      <div style={{padding:"12px 0 0"}}>
        <div style={{display:"flex",gap:"4px",marginBottom:"8px"}}>
          {ONBOARDING_STEPS.map((s,i)=>(
            <div key={s} style={{flex:1,height:"4px",borderRadius:"2px",background:i<step?T.teal:i===step?`linear-gradient(to right,${T.teal},${T.violet})`:T.border,transition:"all 0.3s"}}/>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
          <span style={{fontFamily:"Raleway",fontSize:"10px",color:T.textMid,fontWeight:700,letterSpacing:"1px"}}>{ONBOARDING_STEPS[step].toUpperCase()} · {step+1}/{ONBOARDING_STEPS.length}</span>
          {isSelf&&<span style={{fontFamily:"Raleway",fontSize:"10px",color:T.textSoft,fontWeight:600}}>📱 Klient-Modus</span>}
        </div>
      </div>
      <div style={{background:`linear-gradient(140deg,${T.tealL},#FFFFFF,${T.violetL})`,borderRadius:"18px",padding:"18px 20px",marginBottom:"16px",border:`1.5px solid ${T.border}`}}>
        <div style={{fontFamily:"Cinzel",fontSize:"18px",color:T.text,fontWeight:700}}>{ONBOARDING_STEPS[step]}</div>
        <div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textMid,marginTop:"3px",fontWeight:500}}>
          {["Persönliche Angaben","Aktuelle Beschwerden","Medizinische Vorgeschichte","Lebensbereiche & Belastungen","Ziele & Erwartungen","Ahnen & Familienmuster","Eigene Fragen & Abschluss"][step]}
        </div>
      </div>
      {children}
      <div style={{display:"flex",gap:"8px",marginTop:"20px"}}>
        <Btn variant="soft" onClick={step===0?onCancel:()=>setStep(s=>s-1)} style={{flex:1}}>{step===0?"✕":"← Zurück"}</Btn>
        {step<ONBOARDING_STEPS.length-1
          ? <Btn onClick={()=>setStep(s=>s+1)} style={{flex:2}}>Weiter →</Btn>
          : <Btn onClick={()=>setShowPreview(true)} style={{flex:2}}>Vorschau & Speichern →</Btn>
        }
      </div>
    </div>
  );

  const MultiCheck = ({options,field,freeField,freePlaceholder}) => (
    <>
      <div style={{display:"flex",flexWrap:"wrap",gap:"7px",marginBottom:"10px"}}>
        {options.map(o=>{
          const sel=(form[field]||[]).includes(o);
          return <button key={o} onClick={()=>up({[field]:sel?(form[field]||[]).filter(x=>x!==o):[...(form[field]||[]),o]})} style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:600,padding:"7px 14px",borderRadius:"16px",border:`1.5px solid ${sel?T.teal:T.border}`,background:sel?T.tealL:"white",color:sel?T.tealD:T.textMid,cursor:"pointer"}}>{o}</button>;
        })}
      </div>
      {freeField&&<TI value={form[freeField]||""} onChange={v=>up({[freeField]:v})} placeholder={freePlaceholder||"Weitere…"} multiline rows={2}/>}
    </>
  );

  if(step===0) return <StepWrap>
    <Card>
      <SL>Name *</SL><div style={{marginBottom:"12px"}}><TI value={form.name} onChange={v=>up({name:v})} placeholder="Vor- und Nachname"/></div>
      <SL>Geburtsdatum</SL><div style={{marginBottom:"12px"}}><TI type="date" value={form.birthDate} onChange={v=>up({birthDate:v})}/></div>
      <SL>Kontakt (Email / Telefon)</SL><div style={{marginBottom:"12px"}}><TI value={form.contact} onChange={v=>up({contact:v})} placeholder="email@beispiel.de oder +41 79 …"/></div>
      <SL>Adresse</SL><TI value={form.address} onChange={v=>up({address:v})} placeholder="Strasse, PLZ, Ort" multiline rows={2}/>
    </Card>
  </StepWrap>;

  if(step===1) return <StepWrap>
    <Card>
      <SL>Aktuelle Hauptbeschwerden</SL>
      <div style={{marginBottom:"12px"}}><TI value={form.complaints} onChange={v=>up({complaints:v})} placeholder="Was beschäftigt dich am meisten?" multiline rows={4}/></div>
      <SL>Symptome (Mehrfachauswahl)</SL>
      <MultiCheck options={["Schmerzen","Schlafstörungen","Erschöpfung","Angstzustände","Depressionen","Verdauungsprobleme","Hautprobleme","Kopfschmerzen","Rückenschmerzen","Herzprobleme","Hormonstörungen","Immunschwäche"]} field="symptoms" freeField="symptomFreeText" freePlaceholder="Weitere Symptome…"/>
    </Card>
  </StepWrap>;

  if(step===2) return <StepWrap>
    <Card>
      <SL>Bisherige Therapien & Behandlungen</SL>
      <div style={{marginBottom:"12px"}}><MultiCheck options={THERAPIE_OPTIONS} field="previousTherapies" freeField="previousTherapiesFreeText" freePlaceholder="Weitere Behandlungen…"/></div>
      <SL>Energetische Vorgeschichte</SL>
      <MultiCheck options={ENERGIE_OPTIONS} field="energeticHistory" freeField="energeticFreeText" freePlaceholder="Weitere relevante Ereignisse…"/>
    </Card>
  </StepWrap>;

  if(step===3) return <StepWrap>
    <Card>
      <SL>Welche Lebensbereiche belasten dich? (1–10)</SL>
      {LEBENSBEREICH_OPTIONS.map(area=>{
        const val=form.lifeareas?.[area]||0;
        return(
          <div key={area} style={{marginBottom:"12px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
              <span style={{fontFamily:"Raleway",fontSize:"12px",color:T.text,fontWeight:600}}>{area}</span>
              <span style={{fontFamily:"Raleway",fontSize:"11px",color:T.teal,fontWeight:800,background:T.tealL,padding:"1px 8px",borderRadius:"8px"}}>{val}/10</span>
            </div>
            <div style={{position:"relative",height:"9px"}}>
              <div style={{position:"absolute",inset:0,borderRadius:"5px",background:T.bgSoft,border:`1px solid ${T.border}`}}/>
              <div style={{position:"absolute",top:0,left:0,height:"100%",width:`${val*10}%`,borderRadius:"5px",background:T.teal,transition:"width 0.1s"}}/>
              <input type="range" min="0" max="10" value={val} onChange={e=>up({lifeareas:{...form.lifeareas,[area]:+e.target.value}})} style={{position:"absolute",inset:0,width:"100%",opacity:0,cursor:"pointer",height:"9px"}}/>
            </div>
          </div>
        );
      })}
      <div style={{marginTop:"10px"}}><SL>Weiteres</SL><TI value={form.lifeareaFreeText||""} onChange={v=>up({lifeareaFreeText:v})} placeholder="Was möchtest du noch ergänzen?" multiline rows={2}/></div>
    </Card>
  </StepWrap>;

  if(step===4) return <StepWrap>
    <Card>
      <SL>Was möchtest du in der Arbeit mit mir erreichen?</SL>
      <div style={{marginBottom:"12px"}}><TI value={form.goals} onChange={v=>up({goals:v})} placeholder="Deine Ziele & Wünsche…" multiline rows={4}/></div>
      <SL>Was erwartest du von der ersten Sitzung?</SL>
      <TI value={form.expectations} onChange={v=>up({expectations:v})} placeholder="Deine Erwartungen…" multiline rows={3}/>
    </Card>
  </StepWrap>;

  if(step===5) return <StepWrap>
    <Card>
      <SL>Bekannte Ahnenthemen in deiner Familie</SL>
      <div style={{marginBottom:"12px"}}><TI value={form.ancestorThemes} onChange={v=>up({ancestorThemes:v})} placeholder="z.B. frühe Todesfälle, Kriege, Vertreibung, Sucht…" multiline rows={3}/></div>
      <SL>Wiederkehrende Familienmuster</SL>
      <div style={{marginBottom:"12px"}}><TI value={form.familyPatterns} onChange={v=>up({familyPatterns:v})} placeholder="z.B. Armut, Krankheit, Beziehungsprobleme…" multiline rows={3}/></div>
      <SL>Weitere Anmerkungen zu Ahnen & Herkunft</SL>
      <TI value={form.ancestorNotes} onChange={v=>up({ancestorNotes:v})} placeholder="Was möchtest du noch teilen?" multiline rows={2}/>
    </Card>
  </StepWrap>;

  if(step===6) return <StepWrap>
    <Card>
      <SL>Deine eigenen Fragen an mich</SL>
      <div style={{marginBottom:"12px"}}><TI value={form.ownQuestions} onChange={v=>up({ownQuestions:v})} placeholder="Was möchtest du mich fragen?" multiline rows={4}/></div>
      <SL>Tags / Themen für dein Profil</SL>
      <TI value={form.tags} onChange={v=>up({tags:v})} placeholder="z.B. Angst, Rücken, Ahnen (kommagetrennt)"/>
      <div style={{marginTop:"14px",background:T.bgSoft,borderRadius:"12px",padding:"12px",border:`1.5px solid ${T.border}`}}>
        <div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textMid,fontWeight:600,lineHeight:"1.7"}}>
          Im nächsten Schritt kannst du alles prüfen, als PDF exportieren und als Klient speichern.
        </div>
      </div>
    </Card>
  </StepWrap>;

  return null;
}

// ─── CLIENT ANALYSIS ──────────────────────────
function ClientAnalysis({ clientId, clients, sessions, onBack }) {
  const client = clients.find(c=>c.id===clientId);
  const cs = sessions.filter(s=>s.clientId===clientId).sort((a,b)=>a.createdAt?.localeCompare(b.createdAt));

  if(!client||cs.length===0) return (
    <div style={{padding:"0 16px 96px"}}>
      <button onClick={onBack} style={{fontFamily:"Raleway",fontSize:"13px",color:T.teal,fontWeight:700,background:"none",border:"none",cursor:"pointer",paddingTop:"8px",display:"block",marginBottom:"16px"}}>← Zurück</button>
      <div style={{textAlign:"center",padding:"60px 0"}}>
        <div style={{fontSize:"40px",opacity:0.3,marginBottom:"12px"}}>📊</div>
        <div style={{fontFamily:"Raleway",fontSize:"14px",color:T.textMid,fontWeight:600}}>Keine Sitzungsdaten vorhanden</div>
      </div>
    </div>
  );

  // ── Data prep ──
  const first = cs[0];
  const last  = cs[cs.length-1];
  const stopwords = new Set(["und","die","der","das","ich","ist","von","mit","für","ein","eine","bei","sich","im","in","an","auf","zu","nicht","es","hat","wie","was","dem","den","aus","als"]);

  // Ebenen über Zeit (line chart data)
  const levelKeys = LEVELS.map(l=>l.key);
  const lineData = cs.map(s=>({
    date: s.createdAt?.slice(0,10)||"",
    label: new Date(s.createdAt).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit"}),
    total: Object.values(s.levels||{}).reduce((a,v)=>a+(v||0),0),
    levels: s.levels||{},
  }));

  // Fortschrittskurve — Gesamtbelastung
  const maxTotal = Math.max(...lineData.map(d=>d.total),1);
  const firstTotal = lineData[0]?.total||0;
  const lastTotal  = lineData[lineData.length-1]?.total||0;
  const trend = lastTotal < firstTotal ? "abnehmend 📉" : lastTotal > firstTotal ? "zunehmend 📈" : "stabil ➡️";
  const trendColor = lastTotal < firstTotal ? "#0A3B20" : lastTotal > firstTotal ? "#9B1C1C" : T.tealD;
  const trendBg    = lastTotal < firstTotal ? "#DCFCE7" : lastTotal > firstTotal ? "#FEE2E2" : T.tealL;

  // Technik-Entwicklung
  const techBySession = cs.map(s=>({date:s.createdAt?.slice(0,10),techniques:s.techniques||[]}));
  const allTechs = [...new Set(cs.flatMap(s=>s.techniques||[]))];

  // Wordcloud per client
  const wordCount = {};
  cs.forEach(s=>{
    (s.goal||"").toLowerCase().replace(/[^\wäöüß\s]/g,"").split(/\s+/).forEach(w=>{
      if(w.length>3&&!stopwords.has(w))wordCount[w]=(wordCount[w]||0)+1;
    });
  });
  const topWords = Object.entries(wordCount).sort(([,a],[,b])=>b-a).slice(0,12);

  // Compare first vs last
  const compareData = LEVELS.map(l=>({
    ...l,
    first: first.levels?.[l.key]||0,
    last:  last.levels?.[l.key]||0,
    diff:  (last.levels?.[l.key]||0)-(first.levels?.[l.key]||0),
  })).filter(l=>l.first>0||l.last>0);

  // Sitzungsfrequenz
  const freqMap = {};
  cs.forEach(s=>{
    const m=s.createdAt?.slice(0,7);
    if(m) freqMap[m]=(freqMap[m]||0)+1;
  });
  const freqData = Object.entries(freqMap).sort(([a],[b])=>a.localeCompare(b));
  const maxFreq  = Math.max(...Object.values(freqMap),1);

  const SC = ({title,icon,children}) => (
    <Card style={{marginBottom:"14px"}}>
      <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"12px"}}>
        <span style={{fontSize:"18px"}}>{icon}</span>
        <span style={{fontFamily:"Cinzel",fontSize:"13px",color:T.text,fontWeight:700}}>{title}</span>
      </div>
      {children}
    </Card>
  );

  return (
    <div style={{padding:"0 16px 96px"}}>
      <button onClick={onBack} style={{fontFamily:"Raleway",fontSize:"13px",color:T.teal,fontWeight:700,background:"none",border:"none",cursor:"pointer",paddingTop:"8px",display:"block",marginBottom:"12px"}}>← Zurück</button>

      {/* Hero */}
      <div style={{position:"relative",borderRadius:"22px",overflow:"hidden",padding:"22px 24px",marginBottom:"16px",background:`linear-gradient(140deg,${T.tealL} 0%,#FFFFFF 50%,${T.violetL} 100%)`,boxShadow:`0 6px 28px ${T.shadowDeep}`,border:`1.5px solid ${T.border}`}}>
        <Flower size={200} opacity={0.09}/>
        <div style={{position:"relative",zIndex:1}}>
          <h2 style={{fontFamily:"Cinzel",fontSize:"20px",color:T.text,margin:"0 0 4px",fontWeight:700}}>{client.name}</h2>
          <p style={{fontFamily:"Raleway",fontSize:"11px",color:T.textMid,margin:"0 0 10px",fontWeight:600}}>{cs.length} Sitzungen · {first.createdAt?.slice(0,10)} – {last.createdAt?.slice(0,10)}</p>
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
            <span style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:700,padding:"4px 12px",borderRadius:"12px",background:trendBg,color:trendColor}}>Gesamtbelastung {trend}</span>
            {client.tags?.slice(0,2).map(t=><span key={t} style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:700,padding:"4px 12px",borderRadius:"12px",background:T.tealL,color:T.tealD}}>{t}</span>)}
          </div>
        </div>
      </div>

      {/* Fortschrittskurve — Gesamtbelastung */}
      <SC title="Fortschrittskurve" icon="📈">
        <div style={{display:"flex",alignItems:"flex-end",gap:"4px",height:"72px",marginBottom:"8px"}}>
          {lineData.map((d,i)=>{
            const h=Math.max((d.total/maxTotal)*100,4);
            const col = i===0?T.border:d.total<lineData[i-1].total?T.teal:d.total>lineData[i-1].total?"#F87171":T.gold;
            return(
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",height:"100%",gap:"2px"}}>
                <div style={{width:"100%",borderRadius:"4px 4px 0 0",background:col,height:`${h}%`,transition:"height 0.4s"}}/>
                <div style={{fontFamily:"Raleway",fontSize:"7px",color:T.textSoft,fontWeight:600,textAlign:"center",lineHeight:"1.1"}}>{d.label}</div>
              </div>
            );
          })}
        </div>
        <div style={{display:"flex",gap:"10px",justifyContent:"center"}}>
          {[{c:T.teal,l:"Besser"},{c:"#F87171",l:"Mehr Aktivität"},{c:T.gold,l:"Gleich"}].map((x,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:"4px"}}>
              <div style={{width:"8px",height:"8px",borderRadius:"2px",background:x.c}}/>
              <span style={{fontFamily:"Raleway",fontSize:"9px",color:T.textSoft,fontWeight:600}}>{x.l}</span>
            </div>
          ))}
        </div>
      </SC>

      {/* Vergleich Erst- vs. letzte Sitzung */}
      {cs.length>1 && (
        <SC title="Erst- vs. letzte Sitzung" icon="🔄">
          {compareData.map(l=>(
            <div key={l.key} style={{marginBottom:"10px"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"3px"}}>
                <span style={{fontFamily:"Raleway",fontSize:"11px",color:T.text,fontWeight:700}}>{l.icon} {l.name}</span>
                <span style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:800,color:l.diff<0?T.tealD:l.diff>0?"#C0392B":T.textSoft}}>
                  {l.diff<0?`▼ ${Math.abs(l.diff)}%`:l.diff>0?`▲ ${l.diff}%`:"="}
                </span>
              </div>
              <div style={{display:"flex",gap:"4px",alignItems:"center"}}>
                <span style={{fontFamily:"Raleway",fontSize:"9px",color:T.textSoft,fontWeight:600,width:"24px",textAlign:"right"}}>{l.first}%</span>
                <div style={{flex:1,height:"7px",borderRadius:"4px",background:T.bgSoft,position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,height:"100%",width:`${l.first}%`,background:T.border,borderRadius:"4px"}}/>
                  <div style={{position:"absolute",top:0,left:0,height:"100%",width:`${l.last}%`,background:l.diff<0?T.teal:l.diff>0?"#F87171":T.gold,borderRadius:"4px",opacity:0.85}}/>
                </div>
                <span style={{fontFamily:"Raleway",fontSize:"9px",color:l.diff<0?T.tealD:l.diff>0?"#C0392B":T.textSoft,fontWeight:700,width:"24px"}}>{l.last}%</span>
              </div>
            </div>
          ))}
          <div style={{display:"flex",gap:"10px",marginTop:"8px",justifyContent:"center"}}>
            <span style={{fontFamily:"Raleway",fontSize:"9px",color:T.textSoft,fontWeight:600}}>Grau = Erste Sitzung &nbsp;·&nbsp; Farbe = Letzte Sitzung</span>
          </div>
        </SC>
      )}

      {/* Ebenen-Verlauf (heatmap style) */}
      <SC title="Ebenen-Verlauf über Zeit" icon="⚡">
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:"9px"}}>
            <thead>
              <tr>
                <th style={{fontFamily:"Raleway",fontWeight:700,color:T.textSoft,textAlign:"left",padding:"2px 4px",width:"80px"}}>Ebene</th>
                {cs.map((s,i)=><th key={i} style={{fontFamily:"Raleway",fontWeight:600,color:T.textSoft,textAlign:"center",padding:"2px 3px",minWidth:"28px"}}>{new Date(s.createdAt).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit"})}</th>)}
              </tr>
            </thead>
            <tbody>
              {LEVELS.filter(l=>cs.some(s=>(s.levels?.[l.key]||0)>0)).map(l=>(
                <tr key={l.key}>
                  <td style={{fontFamily:"Raleway",fontWeight:700,color:T.text,padding:"3px 4px",fontSize:"9px"}}>{l.icon} {l.name.slice(0,8)}</td>
                  {cs.map((s,i)=>{
                    const v=s.levels?.[l.key]||0;
                    const alpha=v/100;
                    return<td key={i} style={{textAlign:"center",padding:"2px 3px"}}>
                      <div style={{width:"22px",height:"22px",borderRadius:"5px",margin:"0 auto",background:v>0?l.bar:"#F0FAFA",opacity:v>0?0.3+alpha*0.7:1,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"8px",fontWeight:700,color:v>60?"white":T.textSoft}}>
                        {v>0?v:""}
                      </div>
                    </td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SC>

      {/* Sitzungsfrequenz */}
      <SC title="Sitzungsfrequenz" icon="📅">
        <div style={{display:"flex",alignItems:"flex-end",gap:"8px",height:"60px",marginBottom:"6px"}}>
          {freqData.map(([month,count],i)=>(
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",height:"100%",gap:"3px"}}>
              <span style={{fontFamily:"Raleway",fontSize:"9px",color:T.teal,fontWeight:700}}>{count}</span>
              <div style={{width:"100%",borderRadius:"4px 4px 0 0",background:T.teal,height:`${(count/maxFreq)*100}%`}}/>
              <span style={{fontFamily:"Raleway",fontSize:"8px",color:T.textSoft,fontWeight:600}}>{month.slice(5)}</span>
            </div>
          ))}
        </div>
        <div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textSoft,fontWeight:500,textAlign:"center"}}>
          Ø {(cs.length / Math.max(freqData.length,1)).toFixed(1)} Sitzungen/Monat
        </div>
      </SC>

      {/* Technik-Entwicklung */}
      {allTechs.length>0 && (
        <SC title="Technik-Entwicklung" icon="🏆">
          <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
            {allTechs.slice(0,8).map(tech=>{
              const usedIn = cs.filter(s=>(s.techniques||[]).includes(tech));
              const firstUsed = usedIn[0]?.createdAt?.slice(0,10)||"";
              const count = usedIn.length;
              return(
                <div key={tech} style={{display:"flex",alignItems:"center",gap:"10px"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:700,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{tech}</div>
                    <div style={{fontFamily:"Raleway",fontSize:"9px",color:T.textSoft,fontWeight:500}}>Erstmals: {firstUsed}</div>
                  </div>
                  <div style={{display:"flex",gap:"3px",flexShrink:0}}>
                    {cs.map((s,i)=>(
                      <div key={i} style={{width:"10px",height:"10px",borderRadius:"2px",background:(s.techniques||[]).includes(tech)?T.teal:T.bgSoft,border:`1px solid ${T.border}`}}/>
                    ))}
                  </div>
                  <span style={{fontFamily:"Raleway",fontSize:"10px",color:T.teal,fontWeight:800,flexShrink:0,background:T.tealL,padding:"2px 7px",borderRadius:"8px"}}>{count}×</span>
                </div>
              );
            })}
          </div>
        </SC>
      )}

      {/* Wordcloud Themen */}
      {topWords.length>0 && (
        <SC title="Themen-Wordcloud" icon="💬">
          <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
            {topWords.map(([word,count],i)=>{
              const size=11+Math.round((count/(topWords[0][1]||1))*7);
              return(
                <span key={word} style={{fontFamily:"Raleway",fontSize:`${size}px`,fontWeight:700,color:i<3?T.tealD:T.textMid,background:i<3?T.tealL:T.bgSoft,padding:"5px 12px",borderRadius:"16px",border:`1px solid ${i<3?T.borderMid:T.border}`}}>
                  {word}<span style={{fontSize:"9px",opacity:0.6}}> ×{count}</span>
                </span>
              );
            })}
          </div>
        </SC>
      )}

    </div>
  );
}
