import React, { useState, useEffect, useCallback, useRef } from "react";
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

// ─── GROQ KI-API (sicher via Serverless Proxy) ────
// Der API-Key liegt nur auf dem Vercel-Server – nie im Browser sichtbar!
const _GROQ_PLACEHOLDER = null; // Key nur serverseitig in /api/ki.js
const groqFetch = async (prompt) => {
  const r = await fetch("/api/ki", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error);
  return d.text || "Fehler.";
};

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

function TreeOfLife({width=220,height=300,opacity=0.22,color,style={}}){
  const c=color||T.teal;
  const vw=220, vh=300;
  return(
    <svg width={width} height={height} viewBox={`0 0 ${vw} ${vh}`} style={{pointerEvents:"none",opacity,...style}}>
      {/* ── ROOTS ── */}
      <path d="M110 245 Q95 252 78 258 Q62 263 45 266" fill="none" stroke={c} strokeWidth="2.8" strokeLinecap="round"/>
      <path d="M110 245 Q104 255 98 263 Q92 270 86 277" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M110 245 Q108 256 107 266 Q106 274 105 282" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M110 245 Q110 257 110 267 Q110 276 110 285" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M110 245 Q112 256 113 266 Q114 274 115 282" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M110 245 Q116 255 122 263 Q128 270 134 277" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M110 245 Q125 252 142 258 Q158 263 175 266" fill="none" stroke={c} strokeWidth="2.8" strokeLinecap="round"/>
      <path d="M45 266 Q32 269 20 272" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M45 266 Q36 270 30 276" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M86 277 Q78 281 70 285" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M134 277 Q142 281 150 285" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M175 266 Q184 269 196 272" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M175 266 Q184 270 190 276" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
      {/* ── MEDITATING FIGURE ── */}
      {/* Lotus base / legs spread */}
      <path d="M72 243 Q78 234 92 230 Q101 227 110 228 Q119 227 128 230 Q142 234 148 243" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
      {/* Left foot */}
      <path d="M72 243 Q67 245 62 243 Q58 240 60 236" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      {/* Right foot */}
      <path d="M148 243 Q153 245 158 243 Q162 240 160 236" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      {/* Robe body */}
      <path d="M92 230 Q88 220 90 210 Q92 202 96 195" fill="none" stroke={c} strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M128 230 Q132 220 130 210 Q128 202 124 195" fill="none" stroke={c} strokeWidth="3.5" strokeLinecap="round"/>
      {/* Robe folds */}
      <path d="M93 224 Q99 218 106 215" fill="none" stroke={c} strokeWidth="1" strokeLinecap="round"/>
      <path d="M127 224 Q121 218 114 215" fill="none" stroke={c} strokeWidth="1" strokeLinecap="round"/>
      <path d="M91 213 Q98 208 105 205" fill="none" stroke={c} strokeWidth="0.9" strokeLinecap="round"/>
      <path d="M129 213 Q122 208 115 205" fill="none" stroke={c} strokeWidth="0.9" strokeLinecap="round"/>
      {/* Hands in lap */}
      <path d="M96 208 Q103 212 110 213 Q117 212 124 208" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      {/* Shoulders */}
      <path d="M96 195 Q89 191 84 185" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M124 195 Q131 191 136 185" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
      {/* Neck into trunk */}
      <path d="M103 195 Q102 186 102 178" fill="none" stroke={c} strokeWidth="4" strokeLinecap="round"/>
      <path d="M117 195 Q118 186 118 178" fill="none" stroke={c} strokeWidth="4" strokeLinecap="round"/>
      {/* Head */}
      <ellipse cx="110" cy="170" rx="10" ry="12" fill="none" stroke={c} strokeWidth="1.8"/>
      {/* Eyes closed */}
      <path d="M104 168 Q107 166 110 168" fill="none" stroke={c} strokeWidth="1.1" strokeLinecap="round"/>
      <path d="M110 168 Q113 166 116 168" fill="none" stroke={c} strokeWidth="1.1" strokeLinecap="round"/>
      {/* Smile */}
      <path d="M106 174 Q110 177 114 174" fill="none" stroke={c} strokeWidth="0.9" strokeLinecap="round"/>
      {/* ── TRUNK merging from head ── */}
      <path d="M103 160 Q101 148 102 136 Q103 126 104 116" fill="none" stroke={c} strokeWidth="7" strokeLinecap="round"/>
      <path d="M117 160 Q119 148 118 136 Q117 126 116 116" fill="none" stroke={c} strokeWidth="7" strokeLinecap="round"/>
      <path d="M104 116 Q105 104 106 94 Q107 85 108 76" fill="none" stroke={c} strokeWidth="5.5" strokeLinecap="round"/>
      <path d="M116 116 Q115 104 114 94 Q113 85 112 76" fill="none" stroke={c} strokeWidth="5.5" strokeLinecap="round"/>
      <path d="M108 76 Q109 65 110 55 Q110 46 110 38" fill="none" stroke={c} strokeWidth="4" strokeLinecap="round"/>
      <path d="M112 76 Q111 65 110 55" fill="none" stroke={c} strokeWidth="3.5" strokeLinecap="round"/>
      {/* ── MAIN BRANCHES ── */}
      {/* Lower left */}
      <path d="M104 128 Q88 120 70 114 Q54 109 36 107" fill="none" stroke={c} strokeWidth="3.5" strokeLinecap="round"/>
      {/* Mid left */}
      <path d="M105 112 Q86 102 66 94 Q48 87 28 84" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round"/>
      {/* Upper-mid left */}
      <path d="M106 96 Q88 82 70 72 Q54 63 36 56" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
      {/* Upper left */}
      <path d="M107 80 Q90 65 74 52 Q59 40 44 30" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"/>
      {/* Top left */}
      <path d="M108 64 Q93 48 80 34 Q68 21 56 10" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
      {/* Lower right */}
      <path d="M116 128 Q132 120 150 114 Q166 109 184 107" fill="none" stroke={c} strokeWidth="3.5" strokeLinecap="round"/>
      {/* Mid right */}
      <path d="M115 112 Q134 102 154 94 Q172 87 192 84" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round"/>
      {/* Upper-mid right */}
      <path d="M114 96 Q132 82 150 72 Q166 63 184 56" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
      {/* Upper right */}
      <path d="M113 80 Q130 65 146 52 Q161 40 176 30" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"/>
      {/* Top right */}
      <path d="M112 64 Q127 48 140 34 Q152 21 164 10" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
      {/* Center top */}
      <path d="M110 38 Q109 26 108 16 Q107 8 107 2" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"/>
      <path d="M110 38 Q111 26 112 16 Q113 8 113 2" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      {/* ── SECONDARY BRANCHES ── */}
      <path d="M36 107 Q26 103 16 100" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M36 107 Q28 104 24 110" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M28 84 Q18 80 10 77" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M36 56 Q24 50 14 46" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M44 30 Q32 22 22 16" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M56 10 Q46 4 38 0" fill="none" stroke={c} strokeWidth="1" strokeLinecap="round"/>
      <path d="M184 107 Q194 103 204 100" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M184 107 Q192 104 196 110" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M192 84 Q202 80 210 77" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M184 56 Q196 50 206 46" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M176 30 Q188 22 198 16" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M164 10 Q174 4 182 0" fill="none" stroke={c} strokeWidth="1" strokeLinecap="round"/>
      {/* ── LEAF CLUSTERS ── */}
      {[
        [16,98],[10,75],[14,44],[22,14],[38,-2],[56,8],[80,32],[107,0],[110,-1],[113,0],
        [140,32],[164,8],[182,-2],[198,14],[206,44],[210,75],[204,98],
        [24,108],[24,82],[26,52],[196,108],[196,82],[194,52]
      ].map(([x,y],i)=>(
        <g key={i}>
          <circle cx={x} cy={y} r={7} fill={c} opacity="0.18"/>
          <circle cx={x} cy={y} r={4.5} fill={c} opacity="0.28"/>
          <circle cx={x} cy={y} r={2} fill={c} opacity="0.45"/>
        </g>
      ))}
      {/* Small scattered leaves */}
      {[
        [30,100],[20,78],[28,48],[36,22],[50,5],[72,20],[100,4],[120,4],[148,20],
        [170,5],[184,22],[192,48],[200,78],[190,100],[42,108],[178,108]
      ].map(([x,y],i)=>(
        <circle key={`s${i}`} cx={x} cy={y} r={3} fill={c} opacity="0.16"/>
      ))}
    </svg>
  );
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
  {id:"dashboard",label:"Übersicht", icon:"◉"},
  {id:"clients",  label:"Klienten",  icon:"◈"},
  {id:"session",  label:"Sitzung",   icon:"✦"},
  {id:"calendar", label:"Kalender",  icon:"⊡"},
  {id:"oracle",   label:"Oracle",    icon:"🔮"},
  {id:"billing",  label:"Abrechnung",icon:"◎"},
];

function BottomNav({active,onChange}){
  return(<nav style={{position:"fixed",bottom:0,left:0,right:0,maxWidth:"480px",margin:"0 auto",height:"74px",background:"rgba(240,250,250,0.98)",backdropFilter:"blur(24px)",borderTop:`1.5px solid ${T.border}`,display:"flex",zIndex:100,boxShadow:"0 -4px 24px rgba(13,148,136,0.12)"}}>
    {NAV.map(item=>{
      const isA=active===item.id,isC=item.id==="session";
      return(<button key={item.id} onClick={()=>onChange(item.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"4px",border:"none",background:"transparent",cursor:"pointer",position:"relative",paddingBottom:"6px"}}>
        {isC&&<div style={{position:"absolute",top:"-28px",width:"56px",height:"56px",borderRadius:"50%",background:`linear-gradient(135deg,${T.teal},${T.tealD})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 6px 24px rgba(13,148,136,0.45)`,border:`3px solid #F0FAFA`}}><span style={{fontSize:"24px",color:"white"}}>{item.icon}</span></div>}
        {!isC&&<span style={{fontSize:"19px",color:isA?T.teal:T.textSoft,transition:"color 0.2s"}}>{item.icon}</span>}
        {isA&&!isC&&<div style={{position:"absolute",top:"6px",width:"4px",height:"4px",borderRadius:"50%",background:T.teal}}/>}
        <span style={{fontSize:"9px",fontFamily:"Raleway",fontWeight:800,letterSpacing:"0.5px",color:isA?T.teal:T.textSoft,marginTop:isC?"28px":"0",transition:"color 0.2s",textTransform:"uppercase"}}>{item.label}</span>
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
function Dashboard({clients,sessions,appointments,onNav,reminders,onDismissReminder,onAddReminder,settings}){
  const lC={};sessions.forEach(s=>Object.entries(s.levels||{}).forEach(([k,v])=>{if(v>50)lC[k]=(lC[k]||0)+1;}));
  const tL=Object.entries(lC).sort(([,a],[,b])=>b-a)[0];
  const tI=tL?lvl(tL[0]):null;
  const today=todayStr();
  const todayAppts=(appointments||[]).filter(a=>a.date===today).sort((a,b)=>a.startTime.localeCompare(b.startTime));
  const recentSessions=sessions.slice(0,3);
  const hour=new Date().getHours();
  const greeting=hour<12?"Guten Morgen":hour<17?"Guten Tag":"Guten Abend";
  const name=settings?.therapistName?settings.therapistName.split(" ")[0]:"";

  return(
    <div style={{padding:"0 16px 120px"}}>

      {/* Stats row */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"16px"}}>
        <div style={{background:"white",borderRadius:"18px",border:`1.5px solid ${T.border}`,padding:"16px",boxShadow:`0 2px 12px ${T.shadow}`,display:"flex",alignItems:"center",gap:"12px"}} onClick={()=>onNav("analytics")}>
          <div style={{width:"42px",height:"42px",borderRadius:"12px",background:T.violetL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",flexShrink:0}}>◇</div>
          <div>
            <div style={{fontFamily:"Cinzel",fontSize:"22px",color:T.violetD,fontWeight:700,lineHeight:1}}>{sessions.length}</div>
            <div style={{fontFamily:"Raleway",fontSize:"10px",color:T.textSoft,fontWeight:700,letterSpacing:"0.5px",marginTop:"2px"}}>Sitzungen</div>
          </div>
        </div>
        <div style={{background:"white",borderRadius:"18px",border:`1.5px solid ${tI?.border||T.border}`,padding:"16px",boxShadow:`0 2px 12px ${T.shadow}`,display:"flex",alignItems:"center",gap:"12px"}}>
          <div style={{width:"42px",height:"42px",borderRadius:"12px",background:tI?.bg||T.bgSoft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",flexShrink:0}}>{tI?.icon||"–"}</div>
          <div>
            <div style={{fontFamily:"Raleway",fontSize:"12px",color:tI?.text||T.textMid,fontWeight:700,lineHeight:1.3}}>{tI?.name||"Noch keine"}</div>
            <div style={{fontFamily:"Raleway",fontSize:"10px",color:T.textSoft,fontWeight:600,marginTop:"2px"}}>Top-Ebene</div>
          </div>
        </div>
      </div>

      {/* Today's appointments */}
      {todayAppts.length>0&&(<>
        <SL>Heute</SL>
        <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"16px"}}>
          {todayAppts.map(a=>{
            const at=APPT_TYPES[a.type]||APPT_TYPES.other;
            return(
              <div key={a.id} onClick={()=>onNav("calendar")} style={{background:"white",border:`1.5px solid ${at.border}`,borderLeft:`4px solid ${at.dot}`,borderRadius:"14px",padding:"12px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:"12px",boxShadow:`0 2px 8px ${T.shadow}`}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:"Raleway",fontSize:"13px",fontWeight:700,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.title||a.clientName||at.label}</div>
                  <div style={{fontFamily:"Raleway",fontSize:"11px",color:at.color,fontWeight:600,marginTop:"2px"}}>{a.startTime} – {a.endTime}</div>
                </div>
                <span style={{color:T.textSoft,fontSize:"14px"}}>→</span>
              </div>
            );
          })}
        </div>
      </>)}

      {/* Empty state if no clients */}
      {clients.length===0&&(
        <div style={{background:"rgba(255,255,255,0.7)",borderRadius:"14px",border:`1px dashed ${T.borderMid}`,padding:"14px 18px",marginBottom:"16px",display:"flex",alignItems:"center",gap:"12px"}}>
          <span style={{fontSize:"22px"}}>🌱</span>
          <div>
            <div style={{fontFamily:"Raleway",fontSize:"13px",color:T.text,fontWeight:700}}>Noch keine Klienten</div>
            <div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textSoft,marginTop:"2px"}}>Leg deinen ersten Klienten an →</div>
          </div>
          <button onClick={()=>onNav("clients")} style={{marginLeft:"auto",fontFamily:"Raleway",fontWeight:700,fontSize:"12px",padding:"8px 14px",borderRadius:"12px",background:T.tealL,color:T.tealD,border:`1.5px solid ${T.borderMid}`,cursor:"pointer",flexShrink:0}}>◈ Anlegen</button>
        </div>
      )}

      {/* Quick actions with Tree of Life background */}
      <SL>Schnellzugriff</SL>
      <div style={{position:"relative",borderRadius:"20px",overflow:"hidden",padding:"4px 0 8px"}}>
        <div style={{position:"relative",zIndex:1,display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"16px"}}>
        {[
          {label:"Klient anlegen",   icon:"◈", s:"clients",   bg:"rgba(255,255,255,0.82)", border:T.borderMid,  c:T.tealD},
          {label:"Kalender",         icon:"⊡", s:"calendar",  bg:"rgba(255,255,255,0.82)", border:"#A78BFA",    c:T.violetD},
          {label:"Wissensbasis",     icon:"◆", s:"knowledge", bg:"rgba(255,255,255,0.82)", border:"#6BAEE8",    c:"#0A2A50"},
          {label:"Generationsbaum",  icon:"🧬",s:"gentree",   bg:"rgba(255,255,255,0.82)", border:"#9B7EE0",    c:"#2A1660"},
          {label:"Synergy Engine",    icon:"⚡",s:"synergy",   bg:"rgba(255,255,255,0.82)", border:"#6D3FCC",    c:"#3D1A8A"},
          {label:"Abrechnung",       icon:"◎", s:"billing",   bg:"rgba(255,255,255,0.82)", border:"#4ADE80",    c:"#0A3B20"},
          {label:"Analyse",          icon:"◇", s:"analytics", bg:"rgba(255,255,255,0.82)", border:T.borderMid,  c:T.tealD},
        ].map((a,i)=>(
          <div key={i} onClick={()=>onNav(a.s)} style={{background:a.bg,borderRadius:"18px",padding:"18px 16px",cursor:"pointer",border:`1.5px solid ${a.border}`,boxShadow:`0 2px 12px rgba(0,0,0,0.06)`,display:"flex",alignItems:"center",gap:"12px",backdropFilter:"blur(4px)"}}>
            <div style={{width:"36px",height:"36px",borderRadius:"10px",background:a.border+"33",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",flexShrink:0}}>{a.icon}</div>
            <span style={{fontFamily:"Raleway",fontSize:"13px",color:a.c,fontWeight:700}}>{a.label}</span>
          </div>
        ))}
        </div>
      </div>

      {/* Recent sessions */}
      {recentSessions.length>0&&(<>
        <SL>Letzte Sitzungen</SL>
        <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"16px"}}>
          {recentSessions.map(s=>(
            <div key={s.id} onClick={()=>onNav("clients")} style={{background:"white",borderRadius:"14px",border:`1.5px solid ${T.border}`,padding:"12px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:"12px",boxShadow:`0 1px 8px ${T.shadow}`}}>
              <div style={{width:"36px",height:"36px",borderRadius:"50%",background:T.tealL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",fontFamily:"Cinzel",fontWeight:700,color:T.tealD,flexShrink:0}}>{(s.clientName||"?")[0]}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:"Raleway",fontSize:"13px",fontWeight:700,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.clientName||"—"}</div>
                <div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textSoft,marginTop:"1px"}}>{s.createdAt?.slice(0,10)||"—"}</div>
              </div>
              <span style={{color:T.textSoft,fontSize:"14px"}}>→</span>
            </div>
          ))}
        </div>
      </>)}
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

✦ Lichtkern · powered by Human Resonanz`);window.location.href=`mailto:${h.email}?subject=${s}&body=${b}`;}} style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:700,padding:"4px 10px",borderRadius:"8px",border:`1px solid ${h.border}`,background:"rgba(255,255,255,0.7)",color:h.color,cursor:"pointer"}}>✉️ Glückwunsch senden</button>}
                    {h.email&&h.type==="nosession"&&<button onClick={()=>{const s=encodeURIComponent(`Wie geht es dir? · Lichtkern`);const b=encodeURIComponent(`Liebe/r ${h.clientName},

ich denke an dich und frage mich, wie es dir geht. Magst du eine neue Sitzung vereinbaren?

Ich freue mich von dir zu hören. 🌿

✦ Lichtkern · powered by Human Resonanz`);window.location.href=`mailto:${h.email}?subject=${s}&body=${b}`;}} style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:700,padding:"4px 10px",borderRadius:"8px",border:`1px solid ${h.border}`,background:"rgba(255,255,255,0.7)",color:h.color,cursor:"pointer"}}>✉️ Kontakt aufnehmen</button>}
                    {h.email&&h.type==="followup"&&<button onClick={()=>{const s=encodeURIComponent(`Follow-up · Lichtkern`);const b=encodeURIComponent(`Liebe/r ${h.clientName},

wie integrierst du die Impulse aus unserer letzten Sitzung? Ich würde mich freuen, von dir zu hören und eventuell einen Folgetermin zu vereinbaren.

✦ Lichtkern · powered by Human Resonanz`);window.location.href=`mailto:${h.email}?subject=${s}&body=${b}`;}} style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:700,padding:"4px 10px",borderRadius:"8px",border:`1px solid ${h.border}`,background:"rgba(255,255,255,0.7)",color:h.color,cursor:"pointer"}}>✉️ Follow-up Mail</button>}
                    {h.email&&h.type==="invoice"&&<button onClick={()=>{const s=encodeURIComponent(`Zahlungserinnerung · Lichtkern`);const b=encodeURIComponent(`Liebe/r ${h.clientName},

dies ist eine freundliche Erinnerung bezüglich der ausstehenden Rechnung von ${h.sub}.

Vielen Dank für deine baldige Begleichung.

✦ Lichtkern · powered by Human Resonanz`);window.location.href=`mailto:${h.email}?subject=${s}&body=${b}`;}} style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:700,padding:"4px 10px",borderRadius:"8px",border:`1px solid ${h.border}`,background:"rgba(255,255,255,0.7)",color:h.color,cursor:"pointer"}}>✉️ Rechnung erinnern</button>}
                    {h.isManual&&<button onClick={()=>onDismissReminder(h.id)} style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:700,padding:"4px 10px",borderRadius:"8px",border:`1px solid ${h.border}`,background:"rgba(255,255,255,0.7)",color:h.color,cursor:"pointer"}}>✅ Erledigt</button>}
                    {!h.isManual&&<button onClick={()=>onDismissReminder(h.id)} style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:600,padding:"4px 10px",borderRadius:"8px",border:"1px solid #CBD5E1",background:"rgba(255,255,255,0.5)",color:"#6AABA7",cursor:"pointer"}}>Ausblenden</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>);
      })()}

    </div>
  );
}

// ─── HUMAN DESIGN ENGINE ──────────────────────
const HD_GATE_CENTER={
  64:'head',61:'head',63:'head',
  47:'ajna',24:'ajna',4:'ajna',17:'ajna',43:'ajna',11:'ajna',
  62:'throat',23:'throat',56:'throat',35:'throat',12:'throat',45:'throat',33:'throat',8:'throat',31:'throat',20:'throat',16:'throat',
  1:'g',13:'g',25:'g',46:'g',2:'g',15:'g',10:'g',7:'g',
  21:'heart',40:'heart',26:'heart',51:'heart',
  30:'sp',22:'sp',36:'sp',49:'sp',55:'sp',37:'sp',6:'sp',
  5:'sacral',14:'sacral',29:'sacral',59:'sacral',9:'sacral',3:'sacral',42:'sacral',27:'sacral',34:'sacral',
  48:'spleen',57:'spleen',44:'spleen',50:'spleen',32:'spleen',28:'spleen',18:'spleen',
  58:'root',38:'root',54:'root',53:'root',60:'root',19:'root',39:'root',41:'root',52:'root'
};
const HD_CHANNELS=[[4,63],[24,61],[47,64],[11,56],[17,62],[23,43],[1,8],[7,31],[10,20],[13,33],[21,45],[12,22],[35,36],[16,48],[20,57],[2,14],[5,15],[10,34],[29,46],[25,51],[26,44],[37,40],[27,50],[34,57],[6,59],[3,60],[9,52],[42,53],[18,58],[28,38],[32,54],[19,49],[30,41],[39,55]];
const HD_CENTER_CFG={
  head:   {label:'Kopf',       color:'#7C3AED',bg:'#EDE9FE',size:52,shape:'tri-down'},
  ajna:   {label:'Ajna',       color:'#2563EB',bg:'#DBEAFE',size:48,shape:'tri-up'},
  throat: {label:'Kehle',      color:'#D97706',bg:'#FEF3C7',size:44,shape:'rect'},
  g:      {label:'G / Selbst', color:'#F59E0B',bg:'#FEF9C3',size:46,shape:'diamond'},
  heart:  {label:'Herz',       color:'#DC2626',bg:'#FEE2E2',size:40,shape:'tri-down'},
  sp:     {label:'Solarplexus',color:'#EA580C',bg:'#FFEDD5',size:48,shape:'tri-up'},
  sacral: {label:'Sakral',     color:'#B91C1C',bg:'#FEE2E2',size:50,shape:'rect'},
  spleen: {label:'Milz',       color:'#16A34A',bg:'#DCFCE7',size:44,shape:'tri-up'},
  root:   {label:'Wurzel',     color:'#92400E',bg:'#FEF3C7',size:42,shape:'rect'}
};
const HD_TYPE_DESC={
  'Manifestor':    {strategy:'Informieren vor dem Handeln',signature:'Frieden',notself:'Wut',desc:'Manifestoren sind Initiatoren – sie haben die Fähigkeit, Dinge zu starten und andere zu bewegen. Ihre Energie ist bündelnd und fokussiert.'},
  'Generator':     {strategy:'Warten & auf Resonanz antworten',signature:'Befriedigung',notself:'Frustration',desc:'Generatoren sind die Lebenskraft der Welt. Ihre Sakralenergie ist zyklusartig und nachhaltig. Sie gedeihen, wenn sie auf echte Resonanz reagieren.'},
  'Manifesting Generator':{strategy:'Warten, informieren, dann handeln',signature:'Befriedigung',notself:'Frustration/Wut',desc:'Manifesting Generatoren verbinden Initiationskraft mit Sakralenergie. Sie sind schnell, multitaskingfähig und erschaffen Neues durch direkte Energie.'},
  'Projektor':     {strategy:'Warten auf Einladung',signature:'Erfolg',notself:'Bitterkeit',desc:'Projektoren haben die Fähigkeit, andere tiefgründig zu führen und zu leiten. Sie brauchen Anerkennung und Einladung, um ihre Weisheit optimal einzusetzen.'},
  'Reflektor':     {strategy:'Warten einen Mondmonat',signature:'Überraschung',notself:'Enttäuschung',desc:'Reflektoren sind Spiegel der Gemeinschaft. Sie sind selten und kostbar – ihre offenen Zentren reflektieren das Umfeld mit klarer Wahrheit.'}
};
const HD_AUTHORITY_DESC={
  'Emotional':   'Entscheidungen brauchen Zeit – erst wenn die emotionale Welle abklingt, wird Klarheit sichtbar.',
  'Sakral':      'Die Sakralkraft antwortet spontan mit Ja/Nein. Auf die körperliche Resonanz hören.',
  'Milz':        'Spontane, intuitive Eingebungen im Moment. Der erste Impuls trägt die Wahrheit.',
  'Ego':         'Entscheidungen aus dem Herzensimpuls – was will ich wirklich? Was lohnt sich?',
  'Selbst':      'Der Körper führt in die richtigen Orte und zu den richtigen Menschen.',
  'Mental':      'Entscheidungen durch Austausch und Reflexion mit vertrauten Menschen.',
  'Lunar':       'Entscheidungen erst nach einem vollständigen Mondzyklus (28-29 Tage).'
};

function hdCalcDefinedCenters(allGates){
  const s=new Set(allGates.map(Number));
  const def=new Set();
  HD_CHANNELS.forEach(([a,b])=>{if(s.has(a)&&s.has(b)){def.add(HD_GATE_CENTER[a]);def.add(HD_GATE_CENTER[b]);}});
  return def;
}
function hdDetermineType(def){
  if(def.size===0)return'Reflektor';
  const hasSacral=def.has('sacral'),hasThroat=def.has('throat'),hasHeart=def.has('heart'),hasSP=def.has('sp'),hasRoot=def.has('root');
  if(hasSacral&&hasThroat)return'Manifesting Generator';
  if(hasSacral)return'Generator';
  if(hasThroat&&(hasHeart||hasSP||hasRoot))return'Manifestor';
  return'Projektor';
}

// ─── BODYGRAPH SVG ────────────────────────────
function BodygraphSVG({pgates=[],dgates=[],size=260}){
  const allGates=[...pgates,...dgates].map(Number);
  const defined=hdCalcDefinedCenters(allGates);
  const pSet=new Set(pgates.map(Number));
  const dSet=new Set(dgates.map(Number));

  // Center positions in 200x380 viewBox
  const CP={
    head:   {x:100,y:30},
    ajna:   {x:100,y:95},
    throat: {x:100,y:158},
    g:      {x:63,y:220},
    heart:  {x:152,y:205},
    sp:     {x:158,y:298},
    sacral: {x:100,y:285},
    spleen: {x:48,y:298},
    root:   {x:100,y:360}
  };

  const cDef=(c)=>defined.has(c);
  const cc=(c)=>cDef(c)?HD_CENTER_CFG[c].color:'#CBD5E1';
  const cb=(c)=>cDef(c)?HD_CENTER_CFG[c].bg:'#F1F5F9';

  // Shape renderers
  function TriDown({cx,cy,s,c,fill,label}){
    const h=s*0.8;
    const pts=`${cx},${cy-h/2} ${cx+s/2},${cy+h/2} ${cx-s/2},${cy+h/2}`;
    return(<g>
      <polygon points={pts} fill={fill} stroke={c} strokeWidth="2"/>
      <text x={cx} y={cy+4} textAnchor="middle" style={{fontFamily:'Raleway',fontSize:'7px',fill:c,fontWeight:700}}>{label}</text>
    </g>);
  }
  function TriUp({cx,cy,s,c,fill,label}){
    const h=s*0.8;
    const pts=`${cx},${cy+h/2} ${cx+s/2},${cy-h/2} ${cx-s/2},${cy-h/2}`;
    return(<g>
      <polygon points={pts} fill={fill} stroke={c} strokeWidth="2"/>
      <text x={cx} y={cy+4} textAnchor="middle" style={{fontFamily:'Raleway',fontSize:'7px',fill:c,fontWeight:700}}>{label}</text>
    </g>);
  }
  function Rect({cx,cy,w,h,c,fill,label}){
    return(<g>
      <rect x={cx-w/2} y={cy-h/2} width={w} height={h} rx="5" fill={fill} stroke={c} strokeWidth="2"/>
      <text x={cx} y={cy+4} textAnchor="middle" style={{fontFamily:'Raleway',fontSize:'7px',fill:c,fontWeight:700}}>{label}</text>
    </g>);
  }
  function Diamond({cx,cy,s,c,fill,label}){
    const pts=`${cx},${cy-s/2} ${cx+s/2},${cy} ${cx},${cy+s/2} ${cx-s/2},${cy}`;
    return(<g>
      <polygon points={pts} fill={fill} stroke={c} strokeWidth="2"/>
      <text x={cx} y={cy+4} textAnchor="middle" style={{fontFamily:'Raleway',fontSize:'7px',fill:c,fontWeight:700}}>{label}</text>
    </g>);
  }

  // Channel lines
  function chanColor(a,b){
    const hasPboth=pSet.has(a)&&pSet.has(b);
    const hasDboth=dSet.has(a)&&dSet.has(b);
    if(hasPboth&&hasDboth)return'#7C3AED';
    if(hasPboth)return'#0D9488';
    if(hasDboth)return'#DC2626';
    if((pSet.has(a)||dSet.has(a))&&(pSet.has(b)||dSet.has(b)))return'#7C3AED';
    return null;
  }
  const CHAN_PATHS=[
    // Head-Ajna
    {a:4,b:63,x1:93,y1:52,x2:93,y2:80},{a:24,b:61,x1:100,y1:52,x2:100,y2:80},{a:47,b:64,x1:107,y1:52,x2:107,y2:80},
    // Ajna-Throat
    {a:17,b:62,x1:93,y1:112,x2:93,y2:142},{a:43,b:23,x1:100,y1:112,x2:100,y2:142},{a:11,b:56,x1:107,y1:112,x2:107,y2:142},
    // Throat-G
    {a:8,b:1,x1:80,y1:170,x2:75,y2:205},{a:31,b:7,x1:85,y1:172,x2:70,y2:207},{a:20,b:10,x1:90,y1:172,x2:65,y2:210},{a:33,b:13,x1:95,y1:172,x2:60,y2:213},
    // Throat-Heart
    {a:45,b:21,x1:118,y1:165,x2:138,y2:195},
    // Throat-SP
    {a:12,b:22,x1:118,y1:168,x2:148,y2:280},{a:35,b:36,x1:122,y1:168,x2:152,y2:280},
    // Throat-Spleen
    {a:16,b:48,x1:80,y1:168,x2:60,y2:282},{a:20,b:57,x1:78,y1:168,x2:56,y2:284},
    // G-Sacral
    {a:2,b:14,x1:68,y1:232,x2:82,y2:270},{a:5,b:15,x1:72,y1:234,x2:86,y2:270},{a:10,b:34,x1:76,y1:234,x2:90,y2:270},{a:29,b:46,x1:80,y1:234,x2:94,y2:270},
    // G-Heart
    {a:25,b:51,x1:78,y1:218,x2:138,y2:210},
    // Heart-Spleen
    {a:26,b:44,x1:143,y1:218,x2:62,y2:286},
    // Heart-SP
    {a:37,b:40,x1:155,y1:220,x2:152,y2:280},
    // Sacral-Spleen
    {a:27,b:50,x1:78,y1:290,x2:62,y2:290},{a:34,b:57,x1:82,y1:294,x2:64,y2:294},
    // Sacral-SP
    {a:6,b:59,x1:120,y1:290,x2:148,y2:290},
    // Sacral-Root
    {a:3,b:60,x1:93,y1:303,x2:93,y2:345},{a:9,b:52,x1:100,y1:303,x2:100,y2:345},{a:42,b:53,x1:107,y1:303,x2:107,y2:345},
    // Spleen-Root
    {a:18,b:58,x1:52,y1:312,x2:80,y2:348},{a:28,b:38,x1:56,y1:312,x2:84,y2:348},{a:32,b:54,x1:60,y1:312,x2:88,y2:348},
    // SP-Root
    {a:19,b:49,x1:152,y1:312,x2:120,y2:348},{a:30,b:41,x1:155,y1:312,x2:115,y2:348},{a:39,b:55,x1:158,y1:312,x2:110,y2:348},
  ];

  const scale=size/200;
  return(
    <svg viewBox="0 0 200 380" width={size} height={size*1.9} style={{display:'block',margin:'0 auto'}}>
      {/* Channel lines */}
      {CHAN_PATHS.map((ch,i)=>{
        const col=chanColor(ch.a,ch.b);
        if(!col)return null;
        return<line key={i} x1={ch.x1} y1={ch.y1} x2={ch.x2} y2={ch.y2} stroke={col} strokeWidth="3.5" strokeLinecap="round" opacity="0.85"/>;
      })}
      {/* Inactive channel lines (faint) */}
      {CHAN_PATHS.map((ch,i)=>{
        const col=chanColor(ch.a,ch.b);
        if(col)return null;
        return<line key={'g'+i} x1={ch.x1} y1={ch.y1} x2={ch.x2} y2={ch.y2} stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>;
      })}
      {/* Centers */}
      <TriDown cx={CP.head.x}   cy={CP.head.y}   s={44} c={cc('head')}   fill={cb('head')}   label="KOPF"/>
      <TriUp   cx={CP.ajna.x}   cy={CP.ajna.y}   s={40} c={cc('ajna')}   fill={cb('ajna')}   label="AJNA"/>
      <Rect    cx={CP.throat.x} cy={CP.throat.y} w={70} h={28} c={cc('throat')} fill={cb('throat')} label="KEHLE"/>
      <Diamond cx={CP.g.x}      cy={CP.g.y}      s={46} c={cc('g')}      fill={cb('g')}      label="G"/>
      <TriDown cx={CP.heart.x}  cy={CP.heart.y}  s={36} c={cc('heart')}  fill={cb('heart')}  label="HERZ"/>
      <Rect    cx={CP.sacral.x} cy={CP.sacral.y} w={74} h={32} c={cc('sacral')} fill={cb('sacral')} label="SAKRAL"/>
      <TriUp   cx={CP.spleen.x} cy={CP.spleen.y} s={38} c={cc('spleen')} fill={cb('spleen')} label="MILZ"/>
      <TriUp   cx={CP.sp.x}     cy={CP.sp.y}     s={38} c={cc('sp')}     fill={cb('sp')}     label="S.PLEXUS"/>
      <Rect    cx={CP.root.x}   cy={CP.root.y}   w={68} h={26} c={cc('root')}   fill={cb('root')}   label="WURZEL"/>
      {/* Gate dots */}
      {[...pSet].filter(g=>HD_GATE_CENTER[g]).map(g=>{
        const cp=CP[HD_GATE_CENTER[g]];
        return<circle key={'p'+g} cx={cp.x+(Math.random()*12-6)} cy={cp.y+(Math.random()*12-6)} r="3" fill={T.teal} opacity="0.7"/>;
      })}
    </svg>
  );
}

// ─── HD TAB COMPONENT ─────────────────────────
function HDTab({client,onSave}){
  const [form,setForm]=useState({
    hdBirthDate:client.hdBirthDate||'',
    hdBirthTime:client.hdBirthTime||'',
    hdBirthPlace:client.hdBirthPlace||'',
    hdType:client.hdType||'',
    hdProfile:client.hdProfile||'',
    hdAuthority:client.hdAuthority||'',
    hdPGates:client.hdPGates||'',  // comma-separated
    hdDGates:client.hdDGates||'',
  });
  const [editing,setEditing]=useState(!client.hdType&&!client.hdPGates);
  const [gateStep,setGateStep]=useState(0); // 0=Typ, 1=Tore
  const [aiLoading,setAiLoading]=useState(false);
  const [aiText,setAiText]=useState('');
  // gateMap: {gateNum: 'p'|'d'} 
  const initGateMap=()=>{
    const m={};
    (client.hdPGates||'').split(',').map(s=>s.trim()).filter(Boolean).forEach(g=>{if(+g>=1&&+g<=64)m[+g]='p';});
    (client.hdDGates||'').split(',').map(s=>s.trim()).filter(Boolean).forEach(g=>{if(+g>=1&&+g<=64)m[+g]=m[+g]==='p'?'b':'d';});
    return m;
  };
  const [gateMap,setGateMap]=useState(initGateMap);
  
  const pgates=Object.entries(gateMap).filter(([,v])=>v==='p'||v==='b').map(([k])=>+k);
  const dgates=Object.entries(gateMap).filter(([,v])=>v==='d'||v==='b').map(([k])=>+k);
  const allGates=[...new Set([...pgates,...dgates])];
  const defined=hdCalcDefinedCenters(allGates);
  const calcType=allGates.length>0?hdDetermineType(defined):'';
  const displayType=form.hdType||calcType||'—';
  const hasData=form.hdType||allGates.length>0;

  const tapGate=(g)=>{
    setGateMap(prev=>{
      const cur=prev[g];
      const next={...prev};
      // Zyklus: leer → Persönlichkeit (teal) → Beide (violett) → Design (rot) → leer
      if(!cur)next[g]='p';
      else if(cur==='p')next[g]='b';
      else if(cur==='b')next[g]='d';
      else delete next[g];
      return next;
    });
  };

  const save=()=>{
    const pg=pgates.join(',');
    const dg=dgates.join(',');
    onSave({...client,...form,hdPGates:pg,hdDGates:dg});
    setEditing(false);
  };
  
  const mybodygraphUrl=()=>{
    if(!form.hdBirthDate)return'https://www.mybodygraph.com';
    const [y,m,d]=(form.hdBirthDate||'').split('-');
    const [h,min]=(form.hdBirthTime||'00:00').split(':');
    const place=encodeURIComponent(form.hdBirthPlace||'');
    return`https://www.mybodygraph.com/chart?day=${d||''}&month=${m||''}&year=${y||''}&hour=${h||'0'}&minute=${min||'0'}&city=${place}`;
  };

  const genAI=async()=>{
    if(!hasData)return;
    setAiLoading(true);
    try{
      const _aiPrompt1=`Du bist ein erfahrener Human Design Analytiker in einer ganzheitlichen Heilpraxis. Analysiere diesen Klienten für die therapeutische Begleitung:

Klient: ${client.name}
HD-Typ: ${displayType}
Profil: ${form.hdProfile||'—'}
Autorität: ${form.hdAuthority||'—'}
Bewusste Tore (Persönlichkeit): ${pgates.join(', ')||'keine'}
Unbewusste Tore (Design): ${dgates.join(', ')||'keine'}
Definierte Zentren: ${[...defined].map(c=>HD_CENTER_CFG[c]?.label||c).join(', ')||'keine'}

Bitte gib:
1. **Kernthema** (2 Sätze): Was prägt diesen Menschen fundamental?
2. **Heilungsansätze** (3 konkrete Impulse für die Praxisarbeit): Welche Themen/Zentren verdienen besondere Aufmerksamkeit?
3. **Konditionierungsfelder** (offene Zentren): Was nimmt dieser Mensch von anderen auf – und was ist echt?
4. **Integrationsauftrag**: Ein kraftvoller Satz für die Arbeit mit diesem Klienten.

Warmherzig, präzise, ohne Heilversprechen.`;
      setAiText(await groqFetch(_aiPrompt1));
    }catch{setAiText('Netzwerkfehler.');}
    setAiLoading(false);
  };

  const sel=(label,opts,key)=>(
    <div style={{marginBottom:'10px'}}>
      <div style={{fontFamily:'Raleway',fontSize:'10px',color:T.textMid,fontWeight:700,letterSpacing:'1px',textTransform:'uppercase',marginBottom:'4px'}}>{label}</div>
      <select value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} style={{width:'100%',padding:'10px',borderRadius:'10px',border:`1.5px solid ${T.border}`,fontFamily:'Raleway',fontSize:'13px',color:T.text,background:'#fff',outline:'none'}}>
        <option value=''>— wählen</option>
        {opts.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return(
    <div style={{paddingBottom:'20px'}}>
      {/* Header */}
      <div style={{background:`linear-gradient(135deg,${T.violetL},${T.tealL})`,borderRadius:'16px',padding:'18px',marginBottom:'16px',border:`1.5px solid ${T.border}`,position:'relative',overflow:'hidden'}}>
        <Flower size={160} opacity={0.12} color={T.violet}/>
        <div style={{position:'relative',zIndex:1}}>
          <div style={{fontFamily:'Cinzel',fontSize:'13px',color:T.violetD,letterSpacing:'2px',marginBottom:'4px'}}>⚙ HUMAN DESIGN</div>
          <div style={{fontFamily:'Raleway',fontWeight:800,fontSize:'20px',color:T.text}}>{displayType}</div>
          {form.hdProfile&&<div style={{fontFamily:'Raleway',fontSize:'13px',color:T.textMid,fontWeight:600,marginTop:'2px'}}>Profil {form.hdProfile} · {form.hdAuthority||''}</div>}
          {form.hdBirthDate&&<div style={{fontFamily:'Raleway',fontSize:'11px',color:T.textSoft,marginTop:'6px'}}>📅 {form.hdBirthDate}{form.hdBirthTime?' · '+form.hdBirthTime:''}{form.hdBirthPlace?' · '+form.hdBirthPlace:''}</div>}
          <div style={{display:'flex',gap:'6px',marginTop:'10px',flexWrap:'wrap'}}>
            {[...defined].map(c=><span key={c} style={{fontSize:'10px',padding:'3px 10px',borderRadius:'20px',background:'rgba(255,255,255,0.8)',color:HD_CENTER_CFG[c]?.color,fontFamily:'Raleway',fontWeight:700,border:`1px solid ${HD_CENTER_CFG[c]?.color}`}}>{HD_CENTER_CFG[c]?.label}</span>)}
          </div>
        </div>
      </div>

      {/* Bodygraph */}
      {allGates.length>0&&(
        <Card style={{marginBottom:'16px',padding:'16px'}}>
          <div style={{fontFamily:'Raleway',fontSize:'11px',color:T.textMid,fontWeight:700,letterSpacing:'1px',textTransform:'uppercase',marginBottom:'12px'}}>⚙ Bodygraph</div>
          <div style={{display:'flex',gap:'12px',alignItems:'flex-start'}}>
            <div style={{flex:'0 0 auto'}}>
              <BodygraphSVG pgates={pgates} dgates={dgates} size={160}/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:'Raleway',fontSize:'10px',color:T.textSoft,fontWeight:600,marginBottom:'8px'}}>Legende</div>
              {[[T.teal,'Persönlichkeit (bewusst)'],[T.violetD,'Beide Seiten'],['#DC2626','Design (unbewusst)']].map(([col,lbl])=>(
                <div key={lbl} style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'5px'}}>
                  <div style={{width:'20px',height:'3px',borderRadius:'2px',background:col}}/>
                  <span style={{fontFamily:'Raleway',fontSize:'10px',color:T.textMid,fontWeight:600}}>{lbl}</span>
                </div>
              ))}
              <div style={{marginTop:'12px',fontFamily:'Raleway',fontSize:'11px',color:T.textMid,fontWeight:600}}>Definierte Zentren: <strong>{defined.size}</strong>/9</div>
              <div style={{fontFamily:'Raleway',fontSize:'11px',color:T.textMid}}>Offene Zentren: <strong>{9-defined.size}</strong>/9</div>
            </div>
          </div>
        </Card>
      )}

      {/* Type info */}
      {form.hdType&&HD_TYPE_DESC[form.hdType]&&(
        <Card style={{marginBottom:'16px',background:T.bgSoft,border:`1.5px solid ${T.borderMid}`}}>
          <div style={{fontFamily:'Raleway',fontSize:'11px',color:T.tealD,fontWeight:700,letterSpacing:'1px',textTransform:'uppercase',marginBottom:'8px'}}>✦ Strategie & Signatur</div>
          <div style={{fontFamily:'Raleway',fontSize:'12px',color:T.text,lineHeight:'1.6',marginBottom:'8px'}}>{HD_TYPE_DESC[form.hdType].desc}</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
            {[['Strategie',HD_TYPE_DESC[form.hdType].strategy,T.tealL,T.tealD],['Signatur',HD_TYPE_DESC[form.hdType].signature,T.bgSoft,T.tealD],['Not-Self',HD_TYPE_DESC[form.hdType].notself,'#FEE2E2','#DC2626'],form.hdAuthority?['Autorität',HD_AUTHORITY_DESC[form.hdAuthority]||form.hdAuthority,T.violetL,T.violetD]:null].filter(Boolean).map(([k,v,bg,col])=>(
              <div key={k} style={{background:bg,borderRadius:'10px',padding:'10px',border:`1px solid ${T.border}`}}>
                <div style={{fontFamily:'Raleway',fontSize:'9px',fontWeight:800,color:col,letterSpacing:'1px',textTransform:'uppercase',marginBottom:'3px'}}>{k}</div>
                <div style={{fontFamily:'Raleway',fontSize:'11px',color:T.text,fontWeight:600,lineHeight:'1.4'}}>{v}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Edit / Form */}
      {editing?(
        <div style={{marginBottom:'16px'}}>
          {/* Step indicator */}
          <div style={{display:'flex',gap:'6px',marginBottom:'14px'}}>
            {['① Geburt & Typ','② Tore eingeben'].map((s,i)=>(
              <button key={i} onClick={()=>setGateStep(i)} style={{flex:1,padding:'9px',borderRadius:'12px',border:`1.5px solid ${gateStep===i?T.teal:T.border}`,background:gateStep===i?T.teal:'white',fontFamily:'Raleway',fontSize:'11px',fontWeight:700,color:gateStep===i?'white':T.textMid,cursor:'pointer'}}>
                {s}
              </button>
            ))}
          </div>

          {gateStep===0&&(
            <Card style={{border:`1.5px solid ${T.borderMid}`,background:T.bgSoft}}>
              <SL color={T.tealD}>Geburtsdaten</SL>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'10px'}}>
                <div><div style={{fontFamily:'Raleway',fontSize:'10px',color:T.textMid,fontWeight:700,marginBottom:'4px'}}>Datum</div><TI value={form.hdBirthDate} onChange={v=>setForm({...form,hdBirthDate:v})} placeholder="1990-06-15"/></div>
                <div><div style={{fontFamily:'Raleway',fontSize:'10px',color:T.textMid,fontWeight:700,marginBottom:'4px'}}>Uhrzeit</div><TI value={form.hdBirthTime} onChange={v=>setForm({...form,hdBirthTime:v})} placeholder="14:30"/></div>
              </div>
              <div style={{marginBottom:'12px'}}><div style={{fontFamily:'Raleway',fontSize:'10px',color:T.textMid,fontWeight:700,marginBottom:'4px'}}>Geburtsort</div><TI value={form.hdBirthPlace} onChange={v=>setForm({...form,hdBirthPlace:v})} placeholder="München, Deutschland"/></div>
              
              {/* mybodygraph link */}
              <a href={mybodygraphUrl()} target="_blank" rel="noreferrer" style={{display:'block',background:`linear-gradient(135deg,${T.violetL},${T.tealL})`,borderRadius:'12px',padding:'14px',marginBottom:'12px',border:`1.5px solid ${T.borderMid}`,textDecoration:'none'}}>
                <div style={{fontFamily:'Raleway',fontWeight:800,fontSize:'13px',color:T.violetD,marginBottom:'3px'}}>🔗 Chart auf mybodygraph.com öffnen →</div>
                <div style={{fontFamily:'Raleway',fontSize:'11px',color:T.textMid}}>Öffnet deinen persönlichen HD-Chart{form.hdBirthDate?' mit den eingetragenen Daten':' (Daten erst oben eingeben)'}</div>
              </a>
              
              {sel('HD-Typ (aus Chart ablesen)',['Manifestor','Generator','Manifesting Generator','Projektor','Reflektor'],'hdType')}
              {sel('Profil',['1/3','1/4','2/4','2/5','3/5','3/6','4/6','4/1','5/1','5/2','6/2','6/3'],'hdProfile')}
              {sel('Autorität',['Emotional','Sakral','Milz','Ego','Selbst','Mental','Lunar'],'hdAuthority')}
              
              <Btn onClick={()=>setGateStep(1)} style={{width:'100%',marginTop:'4px'}}>Weiter → Tore eingeben</Btn>
            </Card>
          )}

          {gateStep===1&&(
            <Card style={{border:`1.5px solid ${T.borderMid}`,background:T.bgSoft}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                <SL color={T.tealD}>Tore antippen</SL>
                <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                  {[['p',T.teal,'Persönl.'],['d','#DC2626','Design'],['b',T.violet,'Beide']].map(([v,col,lbl])=>(
                    <div key={v} style={{display:'flex',alignItems:'center',gap:'4px'}}>
                      <div style={{width:'10px',height:'10px',borderRadius:'2px',background:col}}/>
                      <span style={{fontFamily:'Raleway',fontSize:'9px',color:T.textMid,fontWeight:600}}>{lbl}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{fontFamily:'Raleway',fontSize:'11px',color:T.textMid,marginBottom:'10px',lineHeight:'1.5',background:'white',borderRadius:'8px',padding:'8px',border:`1px dashed ${T.border}`}}>
                👆 <strong>1× tippen</strong> = Persönlichkeit · <strong>2× tippen</strong> = Beide · <strong>3× tippen</strong> = nur Design · <strong>4× tippen</strong> = entfernen
              </div>
              {/* Gate Grid 8x8 */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(8,1fr)',gap:'4px',marginBottom:'12px'}}>
                {Array.from({length:64},(_,i)=>i+1).map(g=>{
                  const st=gateMap[g];
                  const bg=st==='p'?T.teal:st==='d'?'#DC2626':st==='b'?T.violet:'#F1F5F9';
                  const col=st?'white':T.textSoft;
                  return(
                    <button key={g} onClick={()=>tapGate(g)} style={{aspectRatio:'1',borderRadius:'6px',border:`1px solid ${st?(st==='p'?T.tealD:st==='d'?'#B91C1C':T.violetD):'#E2E8F0'}`,background:bg,fontFamily:'Raleway',fontSize:'10px',fontWeight:st?800:500,color:col,cursor:'pointer',transition:'all 0.1s',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      {g}
                    </button>
                  );
                })}
              </div>
              <div style={{display:'flex',gap:'6px',background:'white',borderRadius:'10px',padding:'10px',marginBottom:'12px',border:`1px solid ${T.border}`}}>
                <div style={{flex:1}}>
                  <div style={{fontFamily:'Raleway',fontSize:'9px',color:T.teal,fontWeight:700,marginBottom:'3px'}}>PERSÖNLICHKEIT ({pgates.length})</div>
                  <div style={{fontFamily:'Raleway',fontSize:'11px',color:T.text}}>{pgates.sort((a,b)=>a-b).join(', ')||'–'}</div>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:'Raleway',fontSize:'9px',color:'#DC2626',fontWeight:700,marginBottom:'3px'}}>DESIGN ({dgates.length})</div>
                  <div style={{fontFamily:'Raleway',fontSize:'11px',color:T.text}}>{dgates.sort((a,b)=>a-b).join(', ')||'–'}</div>
                </div>
              </div>
              {allGates.length>0&&calcType&&(
                <div style={{background:T.tealL,borderRadius:'10px',padding:'10px',marginBottom:'12px',border:`1px solid ${T.borderMid}`,fontFamily:'Raleway',fontSize:'12px',color:T.tealD,fontWeight:700}}>
                  ⚙ Berechneter Typ: {calcType}
                </div>
              )}
              <div style={{display:'flex',gap:'8px'}}>
                <Btn variant="soft" onClick={()=>setGateStep(0)} style={{flex:1}}>← Zurück</Btn>
                <Btn onClick={save} style={{flex:2}}>✓ Speichern</Btn>
              </div>
            </Card>
          )}
        </div>
      ):(
        <Btn variant="soft" onClick={()=>setEditing(true)} style={{width:'100%',marginBottom:'16px'}}>✏ HD-Daten bearbeiten</Btn>
      )}

      {/* KI Analysis */}
      <div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
          <SL>✦ KI-Analyse</SL>
          <Btn onClick={genAI} disabled={!hasData||aiLoading} style={{padding:'8px 16px',fontSize:'11px',opacity:(!hasData||aiLoading)?0.5:1}}>
            {aiLoading?'…':'⚙ Analysieren'}
          </Btn>
        </div>
        {!hasData&&<div style={{fontFamily:'Raleway',fontSize:'12px',color:T.textSoft,fontStyle:'italic',padding:'12px 0'}}>Bitte zuerst HD-Daten eingeben.</div>}
        {aiText&&<div style={{background:T.bgSoft,borderRadius:'14px',padding:'16px',border:`1.5px solid ${T.borderMid}`,fontFamily:'Raleway',fontSize:'13px',color:T.text,lineHeight:'1.7',whiteSpace:'pre-wrap'}}>{aiText}</div>}
      </div>
    </div>
  );
}

// ─── CLIENT DETAIL MODAL ──────────────────────
function ClientDetailModal({client,sessions,onClose,onSave,onStart,onAnalyse}){
  const [tab,setTab]=useState('profil');
  const sc=sessions.filter(s=>s.clientId===client.id);
  const tabs=[['profil','👤 Profil'],['hd','⚙ Human Design'],['sessions','📋 Sitzungen']];
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:'#FFFFFF',borderRadius:'24px 24px 0 0',width:'100%',maxWidth:'480px',maxHeight:'92vh',overflowY:'auto',padding:'0 0 80px'}}>
        {/* Handle */}
        <div style={{display:'flex',justifyContent:'center',padding:'12px 0 4px'}}><div style={{width:'40px',height:'4px',borderRadius:'2px',background:T.border}}/></div>
        {/* Header */}
        <div style={{padding:'12px 20px 0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontFamily:'Cinzel',fontSize:'18px',color:T.text,fontWeight:700}}>{client.name}</div>
            {client.hdType&&<div style={{fontFamily:'Raleway',fontSize:'12px',color:T.violet,fontWeight:600,marginTop:'2px'}}>⚙ {client.hdType}{client.hdProfile?' · '+client.hdProfile:''}</div>}
          </div>
          <button onClick={onClose} style={{width:'32px',height:'32px',borderRadius:'50%',border:`1.5px solid ${T.border}`,background:T.bgSoft,cursor:'pointer',fontSize:'16px',display:'flex',alignItems:'center',justifyContent:'center',color:T.textMid}}>✕</button>
        </div>
        {/* Quick actions */}
        <div style={{display:'flex',gap:'8px',padding:'12px 20px 0'}}>
          <button onClick={()=>onStart(client)} style={{flex:1,padding:'9px',borderRadius:'12px',background:T.tealL,border:`1.5px solid ${T.borderMid}`,fontFamily:'Raleway',fontWeight:700,fontSize:'12px',color:T.tealD,cursor:'pointer'}}>✦ Sitzung</button>
          <button onClick={()=>{onAnalyse(client.id);onClose();}} style={{flex:1,padding:'9px',borderRadius:'12px',background:T.violetL,border:`1.5px solid #A78BFA`,fontFamily:'Raleway',fontWeight:700,fontSize:'12px',color:T.violetD,cursor:'pointer'}}>📊 Analyse</button>
        </div>
        {/* Tabs */}
        <div style={{display:'flex',gap:'6px',padding:'12px 20px',borderBottom:`1px solid ${T.border}`}}>
          {tabs.map(([v,l])=><button key={v} onClick={()=>setTab(v)} style={{flex:1,padding:'9px 4px',borderRadius:'10px',border:`1.5px solid ${tab===v?T.teal:T.border}`,background:tab===v?T.teal:'white',fontFamily:'Raleway',fontSize:'11px',fontWeight:700,color:tab===v?'white':T.textMid,cursor:'pointer'}}>{l}</button>)}
        </div>
        <div style={{padding:'16px 20px'}}>
          {tab==='profil'&&(
            <div>
              {[['Email / Tel.',client.contact],['Notizen',client.notes]].filter(([,v])=>v).map(([k,v])=>(
                <div key={k} style={{marginBottom:'12px'}}><div style={{fontFamily:'Raleway',fontSize:'10px',color:T.textSoft,fontWeight:700,letterSpacing:'1px',textTransform:'uppercase',marginBottom:'3px'}}>{k}</div><div style={{fontFamily:'Raleway',fontSize:'13px',color:T.text,lineHeight:'1.5'}}>{v}</div></div>
              ))}
              {client.tags?.length>0&&<div style={{marginBottom:'12px'}}><div style={{fontFamily:'Raleway',fontSize:'10px',color:T.textSoft,fontWeight:700,letterSpacing:'1px',textTransform:'uppercase',marginBottom:'6px'}}>Tags</div><div style={{display:'flex',flexWrap:'wrap',gap:'5px'}}>{client.tags.map(t=><span key={t} style={{fontSize:'11px',padding:'4px 12px',borderRadius:'12px',background:T.tealL,color:T.tealD,fontFamily:'Raleway',fontWeight:700,border:`1px solid ${T.borderMid}`}}>{t}</span>)}</div></div>}
              <div style={{fontFamily:'Raleway',fontSize:'12px',color:T.textSoft,marginTop:'16px'}}>Seit: {new Date(client.createdAt).toLocaleDateString('de-DE')} · {sc.length} Sitzung{sc.length!==1?'en':''}</div>
            </div>
          )}
          {tab==='hd'&&<HDTab client={client} onSave={updated=>{onSave(updated);}}/>}
          {tab==='sessions'&&(
            <div>
              {sc.length===0&&<div style={{textAlign:'center',padding:'32px 0',color:T.textSoft,fontFamily:'Raleway',fontSize:'13px'}}>Noch keine Sitzungen</div>}
              {sc.slice().reverse().map(s=>(
                <div key={s.id} style={{background:T.bgSoft,borderRadius:'12px',padding:'12px',marginBottom:'8px',border:`1px solid ${T.border}`}}>
                  <div style={{fontFamily:'Raleway',fontWeight:700,fontSize:'12px',color:T.text}}>{new Date(s.createdAt).toLocaleDateString('de-DE')}</div>
                  {s.goal&&<div style={{fontFamily:'Raleway',fontSize:'12px',color:T.textMid,marginTop:'3px',lineHeight:'1.4'}}>{s.goal}</div>}
                  {s.aiSummary&&<div style={{fontFamily:'Raleway',fontSize:'11px',color:T.textSoft,marginTop:'6px',lineHeight:'1.5',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{s.aiSummary}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SYNERGY ENGINE ───────────────────────────
function SynergyEngine({clients,onBack}){
  const [clientA,setClientA]=useState(null);
  const [clientB,setClientB]=useState(null);
  const [aiText,setAiText]=useState('');
  const [aiLoading,setAiLoading]=useState(false);

  const hdClients=clients.filter(c=>c.hdType||c.hdPGates||c.hdDGates);

  const getGates=c=>{
    const p=(c?.hdPGates||'').split(',').map(s=>s.trim()).filter(Boolean).map(Number).filter(n=>n>=1&&n<=64);
    const d=(c?.hdDGates||'').split(',').map(s=>s.trim()).filter(Boolean).map(Number).filter(n=>n>=1&&n<=64);
    return{p,d,all:[...p,...d]};
  };

  const calcSynergy=(cA,cB)=>{
    if(!cA||!cB)return{shared:[],electromagnetic:[],dominance:[]};
    const gA=getGates(cA);
    const gB=getGates(cB);
    const setA=new Set(gA.all);
    const setB=new Set(gB.all);
    // Shared gates
    const shared=[...setA].filter(g=>setB.has(g));
    // Electromagnetic connections: A has one gate of channel, B has the other
    const electromagnetic=HD_CHANNELS.filter(([a,b])=>(setA.has(a)&&setB.has(b))||(setA.has(b)&&setB.has(a))).map(([a,b])=>({gate1:setA.has(a)?a:b,gate2:setA.has(a)?b:a,center1:HD_GATE_CENTER[setA.has(a)?a:b],center2:HD_GATE_CENTER[setA.has(a)?b:a]}));
    return{shared,electromagnetic};
  };

  const syn=calcSynergy(clientA,clientB);

  const genAI=async()=>{
    if(!clientA||!clientB)return;
    setAiLoading(true);
    const gA=getGates(clientA);
    const gB=getGates(clientB);
    const defA=hdCalcDefinedCenters(gA.all);
    const defB=hdCalcDefinedCenters(gB.all);
    try{
      const _aiPrompt2=`Du bist ein Human Design Beziehungsanalytiker in einer ganzheitlichen Heilpraxis. Analysiere diese zwei Menschen:

PERSON A: ${clientA.name}
Typ: ${clientA.hdType||'unbekannt'} · Profil: ${clientA.hdProfile||'—'} · Autorität: ${clientA.hdAuthority||'—'}
Definierte Zentren: ${[...defA].map(c=>HD_CENTER_CFG[c]?.label).join(', ')||'—'}

PERSON B: ${clientB.name}
Typ: ${clientB.hdType||'unbekannt'} · Profil: ${clientB.hdProfile||'—'} · Autorität: ${clientB.hdAuthority||'—'}
Definierte Zentren: ${[...defB].map(c=>HD_CENTER_CFG[c]?.label).join(', ')||'—'}

Elektromagnetische Verbindungen: ${syn.electromagnetic.length} Kanäle
${syn.electromagnetic.slice(0,5).map(e=>`Kanal ${e.gate1}-${e.gate2} (${HD_CENTER_CFG[e.center1]?.label||e.center1}↔${HD_CENTER_CFG[e.center2]?.label||e.center2})`).join(', ')||'keine'}

Bitte analysiere:
1. **Energiedynamik**: Wie interagieren diese zwei Menschen energetisch?
2. **Wachstumsfelder**: Was aktiviert/konditioniert A bei B und umgekehrt?
3. **Stärken der Verbindung**: Was macht diese Begegnung wertvoll?
4. **Herausforderungen**: Wo können Reibungspunkte entstehen?
5. **Empfehlung für die Praxisarbeit**: Ein konkreter Ansatz für gemeinsame oder individuelle Begleitung.

Warmherzig, präzise.`;
      setAiText(await groqFetch(_aiPrompt2));
    }catch{setAiText('Netzwerkfehler.');}
    setAiLoading(false);
  };

  const ClientPicker=({label,value,onChange})=>(
    <div style={{flex:1}}>
      <div style={{fontFamily:'Raleway',fontSize:'10px',color:T.textMid,fontWeight:700,letterSpacing:'1px',textTransform:'uppercase',marginBottom:'6px'}}>{label}</div>
      <select value={value?.id||''} onChange={e=>onChange(clients.find(c=>c.id===e.target.value)||null)} style={{width:'100%',padding:'12px',borderRadius:'12px',border:`1.5px solid ${T.border}`,fontFamily:'Raleway',fontSize:'13px',color:T.text,background:'#fff',outline:'none'}}>
        <option value=''>— Klient wählen</option>
        {clients.map(c=><option key={c.id} value={c.id}>{c.name}{c.hdType?' ('+c.hdType+')':''}</option>)}
      </select>
    </div>
  );

  const gA=clientA?getGates(clientA):{p:[],d:[],all:[]};
  const gB=clientB?getGates(clientB):{p:[],d:[],all:[]};

  return(
    <div style={{padding:'0 16px 96px'}}>
      <div style={{display:'flex',alignItems:'center',gap:'12px',paddingTop:'8px',marginBottom:'20px'}}>
        <button onClick={onBack} style={{background:T.bgSoft,border:`1.5px solid ${T.border}`,borderRadius:'12px',padding:'8px 14px',fontFamily:'Raleway',fontWeight:700,fontSize:'13px',color:T.textMid,cursor:'pointer'}}>← Zurück</button>
        <h2 style={{fontFamily:'Cinzel',fontSize:'20px',color:T.text,margin:0,fontWeight:700}}>Synergy Engine</h2>
      </div>

      {/* Description */}
      <div style={{background:`linear-gradient(135deg,${T.violetL},${T.tealL})`,borderRadius:'16px',padding:'16px',marginBottom:'20px',border:`1.5px solid ${T.border}`,position:'relative',overflow:'hidden'}}>
        <Flower size={150} opacity={0.1} color={T.violet}/>
        <div style={{position:'relative',zIndex:1,fontFamily:'Raleway',fontSize:'13px',color:T.textMid,lineHeight:'1.6'}}>Lege zwei Charts übereinander und entdecke elektromagnetische Verbindungen, Dominanzfelder und die energetische Dynamik zwischen zwei Menschen.</div>
      </div>

      {/* Client Pickers */}
      <div style={{display:'flex',gap:'12px',marginBottom:'20px'}}>
        <ClientPicker label="Person A" value={clientA} onChange={setClientA}/>
        <div style={{display:'flex',alignItems:'center',paddingTop:'18px',fontSize:'20px',color:T.textSoft}}>⇄</div>
        <ClientPicker label="Person B" value={clientB} onChange={setClientB}/>
      </div>

      {/* Synergy Results */}
      {clientA&&clientB&&(
        <>
          {/* Charts side by side */}
          {(gA.all.length>0||gB.all.length>0)&&(
            <Card style={{marginBottom:'16px'}}>
              <SL>Bodygraphs</SL>
              <div style={{display:'flex',gap:'8px',justifyContent:'space-around'}}>
                <div style={{textAlign:'center'}}>
                  <div style={{fontFamily:'Raleway',fontSize:'11px',fontWeight:700,color:T.tealD,marginBottom:'6px'}}>{clientA.name}</div>
                  <BodygraphSVG pgates={gA.p} dgates={gA.d} size={120}/>
                </div>
                <div style={{textAlign:'center'}}>
                  <div style={{fontFamily:'Raleway',fontSize:'11px',fontWeight:700,color:T.violetD,marginBottom:'6px'}}>{clientB.name}</div>
                  <BodygraphSVG pgates={gB.p} dgates={gB.d} size={120}/>
                </div>
              </div>
            </Card>
          )}

          {/* Electromagnetic connections */}
          <Card style={{marginBottom:'16px',background:T.bgSoft,border:`1.5px solid ${T.borderMid}`}}>
            <SL color={T.violetD}>⚡ Elektromagnetische Verbindungen</SL>
            {syn.electromagnetic.length===0?(
              <div style={{fontFamily:'Raleway',fontSize:'13px',color:T.textSoft,fontStyle:'italic',padding:'8px 0'}}>Keine direkten elektromagnetischen Verbindungen gefunden.</div>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                {syn.electromagnetic.map((e,i)=>(
                  <div key={i} style={{background:'white',borderRadius:'10px',padding:'10px 12px',border:`1px solid ${T.border}`,display:'flex',alignItems:'center',gap:'10px'}}>
                    <span style={{fontFamily:'Cinzel',fontSize:'13px',color:T.violetD,fontWeight:700}}>Tor {e.gate1}–{e.gate2}</span>
                    <span style={{fontFamily:'Raleway',fontSize:'11px',color:T.textMid}}>
                      {HD_CENTER_CFG[e.center1]?.label||e.center1} ↔ {HD_CENTER_CFG[e.center2]?.label||e.center2}
                    </span>
                    <span style={{marginLeft:'auto',fontSize:'11px',padding:'3px 8px',borderRadius:'8px',background:T.violetL,color:T.violetD,fontFamily:'Raleway',fontWeight:700}}>{clientA.name.split(' ')[0]} → {clientB.name.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Type comparison */}
          <Card style={{marginBottom:'16px'}}>
            <SL>Typ-Dynamik</SL>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
              {[clientA,clientB].map(c=>(
                <div key={c.id} style={{background:T.bgSoft,borderRadius:'12px',padding:'12px',border:`1px solid ${T.border}`}}>
                  <div style={{fontFamily:'Raleway',fontWeight:800,fontSize:'13px',color:T.text,marginBottom:'4px'}}>{c.name}</div>
                  <div style={{fontFamily:'Raleway',fontSize:'12px',color:T.violet,fontWeight:600}}>{c.hdType||'Typ unbekannt'}</div>
                  {c.hdProfile&&<div style={{fontFamily:'Raleway',fontSize:'11px',color:T.textMid}}>Profil {c.hdProfile}</div>}
                  {c.hdAuthority&&<div style={{fontFamily:'Raleway',fontSize:'11px',color:T.textMid}}>Auth: {c.hdAuthority}</div>}
                </div>
              ))}
            </div>
          </Card>

          {/* AI Analysis */}
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
              <SL>✦ KI-Beziehungsanalyse</SL>
              <Btn onClick={genAI} disabled={aiLoading} style={{padding:'8px 16px',fontSize:'11px',opacity:aiLoading?0.5:1}}>{aiLoading?'…':'⚙ Analysieren'}</Btn>
            </div>
            {aiText&&<div style={{background:T.bgSoft,borderRadius:'14px',padding:'16px',border:`1.5px solid ${T.borderMid}`,fontFamily:'Raleway',fontSize:'13px',color:T.text,lineHeight:'1.7',whiteSpace:'pre-wrap'}}>{aiText}</div>}
          </div>
        </>
      )}

      {!clientA&&!clientB&&hdClients.length<2&&(
        <div style={{textAlign:'center',padding:'40px 0'}}>
          <div style={{fontSize:'40px',marginBottom:'12px',opacity:0.4}}>⚙</div>
          <div style={{fontFamily:'Raleway',fontSize:'14px',color:T.textMid,fontWeight:600,marginBottom:'6px'}}>Mindestens 2 Klienten mit HD-Daten</div>
          <div style={{fontFamily:'Raleway',fontSize:'12px',color:T.textSoft}}>Füge zuerst HD-Tore oder Typen in den Klientenprofilen ein.</div>
        </div>
      )}
    </div>
  );
}

// ─── CLIENTS ──────────────────────────────────
function Clients({clients,sessions,onSave,onStart,onDelete,onOnboarding,reminders,onAddReminder,onDismissReminder,onAnalyse,settings={}}){
  const [showAdd,setShowAdd]=useState(false);
  const [search,setSearch]=useState("");
  const [selClient,setSelClient]=useState(null);
  const [form,setForm]=useState({name:"",contact:"",notes:"",tags:"",hdType:"",hdProfile:"",hdAuthority:""});
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
          {settings?.modules?.includes("heilarbeit")&&(
            <div style={{marginTop:"12px",paddingTop:"12px",borderTop:`1px dashed ${T.border}`}}>
              <div style={{fontFamily:"Raleway",fontSize:"10px",color:T.tealD,letterSpacing:"2px",fontWeight:700,textTransform:"uppercase",marginBottom:"8px"}}>✦ Human Design (optional)</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"}}>
                <div>
                  <div style={{fontFamily:"Raleway",fontSize:"10px",color:T.textMid,marginBottom:"4px",fontWeight:600}}>Typ</div>
                  <select value={form.hdType} onChange={e=>setForm({...form,hdType:e.target.value})} style={{width:"100%",padding:"9px 10px",borderRadius:"10px",border:`1.5px solid ${T.border}`,fontFamily:"Raleway",fontSize:"12px",color:T.text,background:"#FFF",outline:"none"}}>
                    <option value="">—</option>
                    <option value="Manifestor">Manifestor</option>
                    <option value="Generator">Generator</option>
                    <option value="Manifesting Generator">Man. Generator</option>
                    <option value="Projektor">Projektor</option>
                    <option value="Reflektor">Reflektor</option>
                  </select>
                </div>
                <div>
                  <div style={{fontFamily:"Raleway",fontSize:"10px",color:T.textMid,marginBottom:"4px",fontWeight:600}}>Profil</div>
                  <select value={form.hdProfile} onChange={e=>setForm({...form,hdProfile:e.target.value})} style={{width:"100%",padding:"9px 10px",borderRadius:"10px",border:`1.5px solid ${T.border}`,fontFamily:"Raleway",fontSize:"12px",color:T.text,background:"#FFF",outline:"none"}}>
                    <option value="">—</option>
                    {["1/3","1/4","2/4","2/5","3/5","3/6","4/6","4/1","5/1","5/2","6/2","6/3"].map(p=><option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{fontFamily:"Raleway",fontSize:"10px",color:T.textMid,marginBottom:"4px",fontWeight:600}}>Autorität</div>
                  <select value={form.hdAuthority} onChange={e=>setForm({...form,hdAuthority:e.target.value})} style={{width:"100%",padding:"9px 10px",borderRadius:"10px",border:`1.5px solid ${T.border}`,fontFamily:"Raleway",fontSize:"12px",color:T.text,background:"#FFF",outline:"none"}}>
                    <option value="">—</option>
                    <option value="Emotional">Emotional</option>
                    <option value="Sakral">Sakral</option>
                    <option value="Milz">Milz</option>
                    <option value="Ego">Ego</option>
                    <option value="Selbst">Selbst</option>
                    <option value="Mental">Mental</option>
                    <option value="Lunar">Lunar</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          <div style={{display:"flex",gap:"8px",marginTop:"12px"}}><Btn onClick={add} style={{flex:1}}>Speichern</Btn><Btn variant="soft" onClick={()=>setShowAdd(false)} style={{flex:1}}>Abbrechen</Btn></div>
        </Card>
      )}
      <div style={{marginBottom:"14px"}}><TI value={search} onChange={setSearch} placeholder="Klient suchen…"/></div>
      {filtered.length===0&&<div style={{textAlign:"center",padding:"52px 0"}}><div style={{fontSize:"40px",marginBottom:"10px",opacity:0.4}}>◈</div><div style={{fontFamily:"Raleway",fontSize:"14px",color:T.textMid,fontWeight:600}}>Noch keine Klienten</div></div>}
      <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
        {filtered.map(c=>{
          const sc=sessions.filter(s=>s.clientId===c.id).length;
          const hasHD=c.hdType||c.hdPGates;
          return(
            <Card key={c.id} style={{cursor:'pointer'}} onClick={()=>setSelClient(c)}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:"Raleway",fontWeight:800,fontSize:"15px",color:T.text}}>{c.name}</div>
                  {c.contact&&<div style={{fontFamily:"Raleway",fontSize:"12px",color:T.textMid,marginTop:"3px",fontWeight:500}}>{c.contact}</div>}
                  {hasHD&&<div style={{fontFamily:"Raleway",fontSize:'11px',color:T.violet,fontWeight:700,marginTop:'4px'}}>⚙ {c.hdType||'HD'}{c.hdProfile?' · Profil '+c.hdProfile:''}</div>}
                  {c.tags?.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:"5px",marginTop:"8px"}}>{c.tags.map(t=><span key={t} style={{fontSize:"10px",padding:"3px 11px",borderRadius:"12px",background:T.tealL,color:T.tealD,fontFamily:"Raleway",fontWeight:700,border:`1px solid ${T.borderMid}`}}>{t}</span>)}</div>}
                </div>
                <div style={{textAlign:"right",flexShrink:0,marginLeft:"12px"}}>
                  <div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textSoft,fontWeight:600}}>{sc} Sitzung{sc!==1?"en":""}</div>
                  <div style={{fontFamily:"Raleway",fontSize:"10px",color:T.textSoft,marginTop:'6px'}}>→ Profil öffnen</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      {selClient&&<ClientDetailModal
        client={selClient}
        sessions={sessions}
        onClose={()=>setSelClient(null)}
        onSave={updated=>{onSave(clients.map(c=>c.id===updated.id?updated:c));setSelClient(updated);}}
        onStart={c=>{onStart(c);setSelClient(null);}}
        onAnalyse={id=>{onAnalyse&&onAnalyse(id);}}
      />}
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
    try{const _aiPrompt3=`Du bist ein einfühlsamer Begleiter im Lichtkern-System. Schreibe eine warmherzige Sitzungsdokumentation (kein KI-Ton):\nKlient: ${wizard.clientName||"Anonym"} | Typ: ${wizard.type==="first"?"Erstsitzung":wizard.type==="followup"?"Folgesitzung":"Abschluss"}\nThema: ${wizard.goal||"—"} | Ebenen: ${t2.map(([k,v])=>`${lvl(k)?.name} (${v}%)`).join(", ")||"—"}\nTechniken: ${wizard.techniques?.join(", ")||"—"} | Ergebnis: ${wizard.outcome||"—"} | Integration: ${wizard.homework||"—"}\n1. Warmherzige Zusammenfassung (3-4 Sätze) 2. 2-3 Integrationsimpulse mit Reflexionsfragen. Keine Heilversprechen.`;
      setAiText(await groqFetch(_aiPrompt3));}catch{setAiText("Netzwerkfehler.");}
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
    <div style={{textAlign:"center",marginTop:"16px",fontFamily:"Raleway",fontSize:"9px",letterSpacing:"2px",color:T.textSoft,lineHeight:"2",fontWeight:700}}>LICHTKERN · powered by Human Resonanz<br/>Kein Ersatz für medizinische Behandlung</div>
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
      <p style="font-family:Cinzel,serif;font-size:11px;color:#0D9488;font-weight:700;">✦ Lichtkern · powered by Human Resonanz</p>
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

${praxisname ? praxisname + "\n" : ""}✦ Lichtkern · powered by Human Resonanz

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
  const [mode, setMode]           = useState("login");
  const [dsgvo, setDsgvo]         = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [pwVisible, setPwVisible] = useState(false);
  // useRef for inputs — prevents focus loss on every keystroke
  const refEmail    = useRef();
  const refPassword = useRef();
  const refName     = useRef();
  const refPraxis   = useRef();

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
    const email    = refEmail.current?.value?.trim() || "";
    const password = refPassword.current?.value || "";
    const name     = refName.current?.value?.trim() || "";
    const praxis   = refPraxis.current?.value?.trim() || "";
    setError(""); setLoading(true);
    try {
      if (mode === "register") {
        if (!dsgvo)        { setError("Bitte Datenschutzerklärung akzeptieren."); setLoading(false); return; }
        if (!name)         { setError("Bitte deinen Namen eingeben."); setLoading(false); return; }
        if (!email)        { setError("Bitte E-Mail eingeben."); setLoading(false); return; }
        if (!password)     { setError("Bitte Passwort eingeben."); setLoading(false); return; }
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", cred.user.uid, "data", "lk_settings"), {
          value: JSON.stringify({ theme:"kristallwasser", currency:"CHF", defaultDuration:"60", autoLock:"5", pinEnabled:false, praxisname:praxis, subtitle:"", therapistName:name, defaultFee:"", disclaimer:"", modules:[], setupDone:false })
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

  const inp = { width:"100%", padding:"14px 16px", borderRadius:"14px", border:`1.5px solid ${T.border}`, fontFamily:"Raleway", fontSize:"16px", color:T.text, background:"#FAFFFE", outline:"none", boxSizing:"border-box", WebkitAppearance:"none" };

  return (
    <div style={{background:`linear-gradient(160deg, #E8FAF8 0%, #F0EFFE 100%)`, minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px", position:"relative", overflow:"hidden"}}>
      <div style={{position:"fixed",top:"-100px",right:"-100px",width:"350px",height:"350px",borderRadius:"50%",background:`radial-gradient(circle,${T.tealL} 0%,transparent 70%)`,opacity:0.8,pointerEvents:"none"}}/>
      <div style={{position:"fixed",bottom:"5%",left:"-80px",width:"280px",height:"280px",borderRadius:"50%",background:`radial-gradient(circle,${T.violetL} 0%,transparent 70%)`,opacity:0.6,pointerEvents:"none"}}/>
      <div style={{width:"100%", maxWidth:"400px", position:"relative", zIndex:1}}>
        {/* Logo */}
        <div style={{textAlign:"center", marginBottom:"36px"}}>
          <div style={{width:"80px",height:"80px",borderRadius:"50%",background:`linear-gradient(135deg,${T.teal},#6D3FCC)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"32px",margin:"0 auto 16px",boxShadow:`0 8px 32px rgba(13,148,136,0.35)`,color:"white"}}>✦</div>
          <div style={{fontFamily:"Cinzel", fontSize:"28px", color:T.text, fontWeight:700, letterSpacing:"3px"}}>LICHTKERN</div>
          <div style={{fontFamily:"Raleway", fontSize:"11px", color:T.textSoft, letterSpacing:"3px", marginTop:"5px", fontWeight:600}}>POWERED BY HUMAN RESONANZ</div>
        </div>

        {/* Card */}
        <div style={{background:"rgba(255,255,255,0.92)", backdropFilter:"blur(12px)", borderRadius:"24px", padding:"28px", boxShadow:"0 12px 48px rgba(13,148,136,0.15)", border:`1px solid rgba(178,224,220,0.6)`}}>
          {/* Tabs */}
          <div style={{display:"flex", background:T.bgSoft, borderRadius:"12px", padding:"4px", marginBottom:"24px"}}>
            {["login","register"].map(m => (
              <button key={m} onClick={()=>{setMode(m);setError("");}} style={{flex:1,padding:"10px",borderRadius:"10px",border:"none",fontFamily:"Raleway",fontWeight:700,fontSize:"14px",cursor:"pointer",background:mode===m?"white":"transparent",color:mode===m?T.teal:T.textMid,boxShadow:mode===m?`0 2px 10px rgba(13,148,136,0.15)`:"none",transition:"all 0.2s"}}>
                {m === "login" ? "Anmelden" : "Registrieren"}
              </button>
            ))}
          </div>

          <div style={{display:"flex", flexDirection:"column", gap:"14px"}}>
            {mode === "register" && <>
              <input ref={refName} style={inp} placeholder="Dein Name *" autoComplete="name" />
              <input ref={refPraxis} style={inp} placeholder="Praxisname (optional)" autoComplete="organization" />
            </>}
            <input ref={refEmail} style={inp} type="email" placeholder="E-Mail *" autoComplete="email" onKeyDown={e=>e.key==="Enter"&&refPassword.current?.focus()} />
            <div style={{position:"relative"}}>
              <input ref={refPassword} style={{...inp, paddingRight:"52px"}} type={pwVisible?"text":"password"} placeholder="Passwort *" autoComplete={mode==="register"?"new-password":"current-password"} onKeyDown={e=>e.key==="Enter"&&submit()} />
              <button onClick={()=>setPwVisible(!pwVisible)} style={{position:"absolute",right:"14px",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:"18px",opacity:0.45,padding:"4px"}}>{pwVisible?"🙈":"👁️"}</button>
            </div>

            {mode === "register" && (
              <label style={{display:"flex", gap:"10px", alignItems:"flex-start", cursor:"pointer", padding:"4px 0"}}>
                <input type="checkbox" checked={dsgvo} onChange={e=>setDsgvo(e.target.checked)} style={{marginTop:"3px", accentColor:T.teal, width:"16px", height:"16px", flexShrink:0}} />
                <span style={{fontFamily:"Raleway", fontSize:"12px", color:T.textMid, lineHeight:"1.6"}}>
                  Ich akzeptiere die <span style={{color:T.teal, fontWeight:700}}>Datenschutzerklärung</span> und willige in die Verarbeitung meiner Daten gemäß DSGVO ein.
                </span>
              </label>
            )}

            {error && (
              <div style={{background:"#FFF0F0", border:"1px solid #FFCCCC", borderRadius:"12px", padding:"12px 16px", fontFamily:"Raleway", fontSize:"13px", color:"#CC0000", display:"flex", gap:"8px", alignItems:"center"}}>
                <span>⚠️</span><span>{error}</span>
              </div>
            )}

            <button style={{width:"100%",padding:"16px",borderRadius:"14px",background:loading?"#ccc":`linear-gradient(135deg,${T.teal},${T.tealD})`,color:"white",border:"none",fontFamily:"Raleway",fontWeight:700,fontSize:"16px",cursor:loading?"not-allowed":"pointer",boxShadow:loading?"none":`0 6px 24px rgba(13,148,136,0.35)`,marginTop:"4px",letterSpacing:"0.5px",transition:"all 0.2s"}} onClick={submit} disabled={loading}>
              {loading ? "⏳ Bitte warten..." : mode === "login" ? "Anmelden" : "Konto erstellen →"}
            </button>
          </div>
        </div>

        <div style={{textAlign:"center", marginTop:"20px", fontFamily:"Raleway", fontSize:"11px", color:T.textSoft, letterSpacing:"1px"}}>
          ✦ Deine Daten sind sicher in Europa gespeichert
        </div>
      </div>
    </div>
  );
}

// ─── ROOT WRAPPER ─────────────────────────────

// ════════════════════════════════════════════════════════════════
//  RESONANZ ORACLE · Human Resonanz
// ════════════════════════════════════════════════════════════════

// ─── DESIGN TOKENS (aus Hauptdatei übernommen) ────────────────
const OT = {
  bg:"#F0FAFA", bgCard:"#FFFFFF", bgSoft:"#E6F7F7", bgSofter:"#F5FDFD",
  border:"#B2E0DC", borderMid:"#7EC8C2",
  text:"#0F3030", textMid:"#2D6B68", textSoft:"#6AABA7",
  teal:"#0D9488", tealL:"#CCFBF1", tealD:"#0F6B63",
  violet:"#6D3FCC", violetL:"#EDE9FE", violetD:"#4C1D95",
  gold:"#D97706", goldL:"#FEF3C7",
  rose:"#E11D48", roseL:"#FFE4E6",
  shadow:"rgba(13,148,136,0.12)", shadowDeep:"rgba(13,148,136,0.22)",
};

// ════════════════════════════════════════════════════════════════
//  WISSENSNETZ · Das verbundene Datensystem
// ════════════════════════════════════════════════════════════════

const CHAKRA_SYSTEM = [
  { id:"wurzel",       nr:1, name:"Wurzel-Chakra",   de:"Muladhara",   farbe:"#DC2626", hex:"#DC2626",
    symbol:"▼", mantra:"LAM", hz:396,
    themen:["Sicherheit","Überleben","Erdung","Vertrauen","Familie","Geld","Körper"],
    emotion_block:["Angst","Panik","Unsicherheit","Existenzangst","Misstrauen"],
    organe:["Nebennieren","Nieren","Blase","Dickdarm","Beine","Füße","Steißbein","Knochen"],
    aura_schicht:"Ätherischer Körper",
    hd_zentren:["Wurzel","Milz"],
    heilung:["Rote Erdkristalle","Barfußlaufen","Rhodonit","Hämatit","Affirmation: Ich bin sicher"],
    lernpfad_soft:"Das Wurzel-Chakra ist unser energetischer Anker. Es verbindet uns mit der Erde und dem physischen Leben.",
    lernpfad_deep:"Im energetischen Scan zeigt sich das Wurzel-Chakra durch Temperatur (kalt = unteraktiv, heiß = überaktiv) und Pulsation. Blockaden entstehen durch frühe Kindheitstraumata, Mangelerfahrungen oder transgenerationale Armutsmuster."
  },
  { id:"sakral",       nr:2, name:"Sakral-Chakra",   de:"Svadhisthana", farbe:"#EA580C", hex:"#EA580C",
    symbol:"◎", mantra:"VAM", hz:417,
    themen:["Kreativität","Sexualität","Gefühle","Genuss","Freude","Beziehungen","Fluss"],
    emotion_block:["Schuld","Scham","Unterdrückung","Rigidität","Frigidität","Sucht"],
    organe:["Gebärmutter","Eierstöcke","Prostata","Blase","Darm","Hüfte","Lende"],
    aura_schicht:"Emotionalkörper",
    hd_zentren:["Sakral","Milz"],
    heilung:["Mondstein","Orangencalcit","Tantra-Atmung","Hüftkreise","Wasserelement"],
    lernpfad_soft:"Das Sakral-Chakra trägt unsere Lebensenergie, Kreativität und die Fähigkeit, Freude zu empfangen.",
    lernpfad_deep:"In der energetischen Arbeit ist das Sakral-Chakra oft durch transgenerationale Sexualwunden belastet. Ahnenlinien-Arbeit und Auflösung von Loyalitätsmustern sind hier zentral."
  },
  { id:"solar",        nr:3, name:"Solarplexus",     de:"Manipura",    farbe:"#CA8A04", hex:"#CA8A04",
    symbol:"▲", mantra:"RAM", hz:528,
    themen:["Kraft","Wille","Selbstwert","Identität","Kontrolle","Durchsetzung","Verdauung des Lebens"],
    emotion_block:["Scham","Ohnmacht","Kontrollzwang","Perfektionismus","Aggression","Opferhaltung"],
    organe:["Magen","Leber","Milz","Bauchspeicheldrüse","Gallenblase","Zwölffingerdarm"],
    aura_schicht:"Mentalkörper",
    hd_zentren:["Ego","G-Zentrum","Milz"],
    heilung:["Citrin","Tigerauge","Atemarbeit","Sonnenbad","Grenzen setzen"],
    lernpfad_soft:"Der Solarplexus ist unser Kraftzentrum. Er regiert Selbstvertrauen, innere Stärke und die Fähigkeit, das Leben aktiv zu gestalten.",
    lernpfad_deep:"Im Scan zeigt sich der Solarplexus durch einen Sog-Effekt (Energie wird gezogen = Fremdenergie) oder Enge (Kontrollmuster). Karmische Themen von Macht und Ohnmacht sind häufig."
  },
  { id:"herz",         nr:4, name:"Herz-Chakra",     de:"Anahata",     farbe:"#16A34A", hex:"#16A34A",
    symbol:"✦", mantra:"YAM", hz:639,
    themen:["Liebe","Mitgefühl","Verbindung","Selbstliebe","Vergebung","Heilung","Brücke"],
    emotion_block:["Trauer","Einsamkeit","Verlust","Verhärtung","Selbstablehnung","Grenzverlust"],
    organe:["Herz","Lunge","Thymus","Arme","Hände","Brustkorb","Schultern"],
    aura_schicht:"Astralkörper",
    hd_zentren:["G-Zentrum","Milz","Ego"],
    heilung:["Rosenquarz","Malachit","Ho'oponopono","Herz-Kohärenz-Atmung","Vergebungsrituale"],
    lernpfad_soft:"Das Herz-Chakra ist die Brücke zwischen dem Unteren (Materie) und dem Oberen (Geist). Es trägt die höchste Heilfrequenz.",
    lernpfad_deep:"Herzheilungen sind oft mehrstufig: 1. Schutzpanzer auflösen 2. Alten Schmerz entlassen 3. Selbstliebe aktivieren 4. Verbindungsfaden zum höheren Selbst stärken. Besondere Methode: Blutreinigung durch Lichtarbeit im Herzraum."
  },
  { id:"kehle",        nr:5, name:"Kehlkopf-Chakra", de:"Vishuddha",   farbe:"#0284C7", hex:"#0284C7",
    symbol:"◈", mantra:"HAM", hz:741,
    themen:["Wahrheit","Ausdruck","Kommunikation","Stimme","Kreativität","Integrität","Zuhören"],
    emotion_block:["Schlucken von Gefühlen","Lügen","Schweigen","Überreden","Stimmverlust"],
    organe:["Kehle","Schilddrüse","Nebenschilddrüse","Mund","Zähne","Kiefer","Hals","Nacken","Ohren"],
    aura_schicht:"Äther-Schablone",
    hd_zentren:["Kehle","G-Zentrum"],
    heilung:["Lapislazuli","Aquamarin","Tönen","Singen","Wahrheit sprechen","Blauäther-Licht"],
    lernpfad_soft:"Das Kehlkopf-Chakra trägt unsere Stimme und Wahrheit. Hier manifestieren sich alle unausgesprochenen Worte als Energie.",
    lernpfad_deep:"Im Human Design ist das Kehle-Zentrum das einzige Manifestationszentrum. Nicht-definierte Kehle = hohe Empfindlichkeit für Fremdenergie. Klassische Muster: 'Ich darf nicht' oder 'niemand hört mir zu'."
  },
  { id:"stirn",        nr:6, name:"Stirn-Chakra",    de:"Ajna",        farbe:"#4338CA", hex:"#4338CA",
    symbol:"◉", mantra:"OM", hz:852,
    themen:["Intuition","Weisheit","Wahrnehmung","Vision","Hellsicht","Unterscheidung","Gedanken"],
    emotion_block:["Realitätsverlust","Skepsis","Übeaktion","Kopfschmerzen","Zwang","Delusion"],
    organe:["Augen","Stirn","Hypophyse","Pinealdrüse","Kleinhirn","Nase","Stirnhöhlen"],
    aura_schicht:"Kausalkörper",
    hd_zentren:["Ajna","Krone"],
    heilung:["Amethyst","Sodalith","Traumarbeit","Meditation","Dritte-Auge-Aktivierung"],
    lernpfad_soft:"Das Stirnchakra ist das Tor zur inneren Wahrnehmung – Hellsehen, Hellspüren, Hellfühlen und Hellwissen sind hier verwurzelt.",
    lernpfad_deep:"Für Heiler: Das Stirnchakra benötigt regelmäßige Reinigung nach intensiver Wahrnehmungsarbeit. Schutzvisualisierung vor und Erdung nach Sitzungen ist essenziell."
  },
  { id:"krone",        nr:7, name:"Kronen-Chakra",   de:"Sahasrara",   farbe:"#7C3AED", hex:"#7C3AED",
    symbol:"✧", mantra:"AUM", hz:963,
    themen:["Einheit","Transzendenz","Göttliche Verbindung","Bewusstsein","Erleuchtung","Stille"],
    emotion_block:["Geistige Starre","Dogmatismus","Entkörperung","Überstimulation","Depression"],
    organe:["Großhirn","Schädeldecke","Zentralnervensystem","Haut"],
    aura_schicht:"Kether-Körper",
    hd_zentren:["Krone","Ajna"],
    heilung:["Bergkristall","Selenit","Stilles Gebet","Lichtkanal öffnen","Kosmische Verbindung"],
    lernpfad_soft:"Das Kronenchakra verbindet uns mit dem Universum. Es ist weniger ein Energiezentrum als ein offenes Tor zum Unendlichen.",
    lernpfad_deep:"Kronen-Aktivierung ist nicht Ziel, sondern Nebenprodukt tiefer Reinigungsarbeit. Überstimulation führt zu Dissoziation. Erdung und Wurzel-Chakra-Stärkung ist immer parallel notwendig."
  },
];

const ORGAN_MAP = {
  "kopf / gehirn": { emoji:"🧠",
    symbolik:["Kontrolle","Überdenken","Gedankenlast","Intellekt überdominiert"],
    emotion:["Überanalyse","mentaler Stress","Überforderung","innerer Lärm"],
    chakra:"stirn", seiten:{links:"Vergangenheit / Weibliches",rechts:"Zukunft / Männliches"},
    ahnen:"Väter- oder Mutterlinie: Verbotenes Denken, unterdrückte Meinung",
    heilung:["Stirnchakra-Balance","Gehirn-Hemisphären-Sync","Mentalkörper-Reinigung","Ahnen: Recht auf eigene Gedanken"],
    keywords:["kopfschmerzen","migräne","schwindel","gedanken","mental"]
  },
  "augen": { emoji:"👁️",
    symbolik:["Nicht-sehen-wollen","Angst vor Wahrheit","Hellsicht blockiert","blinder Fleck"],
    emotion:["Verleugnung","Schutz vor Schmerz","Überforderung"],
    chakra:"stirn", seiten:{links:"Innenschau / was du dir selbst nicht zeigst",rechts:"Außenwelt / was du anderen nicht zeigen willst"},
    ahnen:"Generationenmuster: 'Sieh nicht hin' / Zeugen von Gewalt oder Schmerz",
    heilung:["Ajna-Chakra-Öffnung","Augen-Meridian-Arbeit","innere Kind-Arbeit: darf sehen"],
    keywords:["augen","sehen","blind","wahrnehmung","blick"]
  },
  "ohren": { emoji:"👂",
    symbolik:["Nicht-hören-wollen","Botschaften überhören","innere Stimme ignoriert"],
    emotion:["Überwältigung durch Geräusche","Konfliktvermeidung","Gehorsam"],
    chakra:"kehle", seiten:{links:"eigene innere Stimme",rechts:"äußere Botschaften / Autorität"},
    ahnen:"'Kinder haben zu schweigen' / Verbote zu hören oder zu sprechen",
    heilung:["Kehlchakra-Balance","Ohr-Meridian","Stille-Meditation","Selbstermächtigung der inneren Stimme"],
    keywords:["ohren","hören","tinnitus","stille","ohr"]
  },
  "mund / zähne / kiefer": { emoji:"🦷",
    symbolik:["Schlucken von Worten","Verbissenes Festhalten","aufgebissene Zähne","Ausdruck blockiert"],
    emotion:["Unterdrückte Worte","Wut","Ohnmacht","Perfektionismus","Kontrolle"],
    chakra:"kehle", seiten:{links:"Weibliches / Empfangen",rechts:"Männliches / Geben"},
    ahnen:"Muster: 'Sprich nicht darüber' / verbotene Wahrheiten",
    heilung:["Kiefer-Entspannung","Kehlchakra-Befreiung","Tönen","die eigene Wahrheit sprechen"],
    keywords:["mund","zähne","kiefer","schlucken","beißen","zähneknirschen"]
  },
  "hals / schilddrüse": { emoji:"🌀",
    symbolik:["Stimme unterdrückt","Lebensfluss gebremst","Nicht authentisch","Metabolismus des Lebens"],
    emotion:["Angst vor Ablehnung","Schweigen","Isolation","Erschöpfung (Hashimoto=Selbstangriff)"],
    chakra:"kehle", seiten:{links:"Empfangen von Liebe und Wahrheit",rechts:"Geben / Aussenden"},
    ahnen:"Generationen: verbotene Sprache, Emigration, Sprachverlust",
    heilung:["Schilddrüsen-Meridian","Kehle-Licht-Infusion","Singen","Aquamarin","Wahrheitsbotschaft"],
    keywords:["hals","schilddrüse","stimme","nacken","kehle","hashimoto"]
  },
  "schultern": { emoji:"💪",
    symbolik:["Last tragen","Verantwortung","Bürde","Schulterlast der Familie"],
    emotion:["Überlastung","Pflichtgefühl","Selbstaufopferung","Hilfsbereitschaft als Flucht"],
    chakra:"herz", seiten:{links:"emotionale Last / Familienthemen",rechts:"berufliche Last / männliche Linie"},
    ahnen:"Muster: 'Wir müssen funktionieren' / traumatische Familienbelastungen",
    heilung:["Herz-Chakra-Öffnung","Schultern freisprechen","Lasten rituell abgeben","Familienaufstellung"],
    keywords:["schultern","schulter","last","verantwortung","verspannt","nacken"]
  },
  "ellenbogen": { emoji:"🦾",
    symbolik:["anecken","sich behaupten","Raum einnehmen","Reibungspunkte","Grenzen"],
    emotion:["Frustration","unterdrückte Durchsetzung","Ärger auf Hindernisse","Rigidität"],
    chakra:"solar", seiten:{links:"innere Blockade / Selbstbeziehung",rechts:"äußere Reibung / Beziehungen"},
    ahnen:"'Streit nicht an' / 'Pass dich an' / Rebellion unterdrückt",
    heilung:["Solarplexus-Kraft-Aktivierung","Grenzen-Ritual","Dickdarm-Meridian","das Recht auf Reibung"],
    keywords:["ellenbogen","anecken","reibung","grenzen","behaupten","ärger"]
  },
  "hände / finger": { emoji:"🤲",
    symbolik:["Greifen und Loslassen","Berühren und Berührt-werden","Kontrolle","Schöpfung"],
    emotion:["Festhalten","Kontrollzwang","Kreativitätsblockade","Berührungsarmut"],
    chakra:"herz", seiten:{links:"empfangen",rechts:"geben"},
    ahnen:"'Nicht anfassen' / körperliche Kälte in der Familie / Gewalt durch Hände",
    heilung:["Herzchakra-Öffnung","Daumenmassage für Lungenmeridian","Handchakras aktivieren","loslassen üben"],
    keywords:["hände","finger","greifen","halten","loslassen","hände"]
  },
  "herz": { emoji:"❤️",
    symbolik:["Zentrum des Lebens","Liebe und Verlust","Herzschmerz","emotionale Wunde","Einheit"],
    emotion:["Trauer","Liebeskummer","Einsamkeit","Selbstablehnung","Sehnsucht","Verhärtung"],
    chakra:"herz", seiten:{links:"Empfangen von Liebe / Selbstliebe",rechts:"Geben von Liebe"},
    ahnen:"Verlust, Krieg, früher Tod von Geliebten, Trennungen über Generationen",
    heilung:["Herzheilung (Lichtinfusion)","Blutreinigung","Ho'oponopono","Rosenquarz","Herz-Kohärenz","Vergebungsarbeit"],
    keywords:["herz","herzschmerz","liebe","verlust","trauer","einsamkeit","herzrythmus"]
  },
  "lunge": { emoji:"🫁",
    symbolik:["Atem des Lebens","Raum einnehmen","Lebensfreude","Loslassen beim Ausatmen","Trauer"],
    emotion:["Unterdrückte Trauer","Lebensangst","Nicht atmen dürfen","Lebensraum verloren"],
    chakra:"herz", seiten:{links:"emotionale Trauer / Loslassen",rechts:"aktive Kraft / Lebenswille"},
    ahnen:"Verlust, Asthma-Muster, 'kein Raum für mich' / enge Verhältnisse",
    heilung:["Atemtherapie","Herzchakra-Öffnung","Lungenmeridian","Trauer-Ritual","Lebensraum beanspruchen"],
    keywords:["lunge","atmen","atem","asthma","husten","trauer"]
  },
  "leber / galle": { emoji:"🫀",
    symbolik:["Verarbeitung","aufgestauter Ärger","Vergiftetes","Entgiftung","Urteile"],
    emotion:["Wut","Bitterkeit","Neid","aufgestauter Ärger","unkontrollierbare Emotionen"],
    chakra:"solar", seiten:{links:"innere Bitterkeit",rechts:"äußerer Ärger / Konflikt"},
    ahnen:"Muster: unterdrückte Wut, Alkohol als Flucht, Bitterkeit über das Leben",
    heilung:["Leberentgiftung energetisch","Gallenblasen-Meridian","Wut rituell entladen","Solarplexus-Reinigung"],
    keywords:["leber","galle","wut","ärger","bitterkeit","entgiftung"]
  },
  "magen / milz": { emoji:"🫃",
    symbolik:["Verdauung des Lebens","Assimilation","Sorgen","Grübeln","Unverarbeitetes"],
    emotion:["Sorgen","Grübeln","Nicht-annehmen-können","Zu viel auf einmal","Überwältigung"],
    chakra:"solar", seiten:{links:"emotionale Assimilation",rechts:"äußere Themen / Beruf"},
    ahnen:"'Das Leben ist schwer' / Mangelernährung / Hungermuster",
    heilung:["Magenmeridian-Arbeit","Sorgen rituell entladen","Solarplexus","Milz-Stärkung","Erd-Frequenz"],
    keywords:["magen","milz","verdauung","sorgen","grübeln","bauch","übelkeit"]
  },
  "nieren / nebennieren": { emoji:"🫘",
    symbolik:["Urangst","Lebenskraft","Vitalität","Filtern des Lebens","Schockstarre"],
    emotion:["Tiefe Angst","Erschöpfung","Schock","Trauma","Lebensangst","Überlebensstress"],
    chakra:"wurzel", seiten:{links:"weibliche Linie / Mutter",rechts:"männliche Linie / Vater"},
    ahnen:"Kriegstrauma, Überlebensangst, existenzielle Not über Generationen",
    heilung:["Nierenmeridian-Stärkung","Nebennieren-Reset","Tiefes Trauma-Release","Ahnen-Frieden","Wurzelchakra"],
    keywords:["nieren","nebennieren","angst","erschöpfung","trauma","schock","burnout"]
  },
  "rücken oben": { emoji:"🔼",
    symbolik:["Liebesbedürfnis unerfüllt","fehlende Unterstützung","emotionale Last"],
    emotion:["Mangel an Liebe","Unsupportedness","emotionale Bürde","Verlassenheit"],
    chakra:"herz",  seiten:{links:"Selbstliebe / innere Unterstützung",rechts:"äußere Unterstützung durch andere"},
    ahnen:"Liebesarmut, emotionale Kälte in der Herkunftsfamilie",
    heilung:["Herzchakra-Öffnung","Selbstliebe-Ritual","Rückenmeridian-Arbeit","Unterstützung annehmen lernen"],
    keywords:["rücken oben","oberer rücken","schulterblatt","verspannung"]
  },
  "rücken mitte": { emoji:"🟡",
    symbolik:["Schuldgefühle","Vergangenheit","Festhalten","Steckenbleiben"],
    emotion:["Schuld","Scham","Ohnmacht","alte Wunden","Verbitterung"],
    chakra:"solar", seiten:{links:"innere Schuld",rechts:"Schuld durch andere zugewiesen"},
    ahnen:"Muster: Strafe, Sühne, 'schuldig sein' als Familienprogramm",
    heilung:["Solarplexus","Vergebungsarbeit","Schuld-Ritual","Gallenmeridian","Zeitlinienarbeit"],
    keywords:["rücken mitte","mittlerer rücken","solar","schuld","vergangenheit"]
  },
  "rücken unten / lendenwirbel": { emoji:"🔽",
    symbolik:["Existenzangst","Geldsorgen","Mangel","Unterstützung fehlt","Familie"],
    emotion:["Finanzielle Angst","Überlebensangst","Verlassenheit","Erschöpfung"],
    chakra:"wurzel", seiten:{links:"weibliche Linie",rechts:"männliche Linie"},
    ahnen:"Existenzmuster, Armut, Krieg, Heimatverlust",
    heilung:["Wurzelchakra-Erdung","Ahnenfrieden","Nierenmeridian","Blasenmeridian","Abundanzprogramm aktivieren"],
    keywords:["rücken unten","lendenwirbel","ischias","hüfte","kreuz","exist"]
  },
  "hüfte / becken": { emoji:"🦵",
    symbolik:["Vorwärtsgehen","Sexualität","Kreativität","Familiensystem","Gleichgewicht"],
    emotion:["Stagnation","Angst vor Veränderung","sexuelle Blockaden","Familienthemen"],
    chakra:"sakral", seiten:{links:"Weibliches / Yin / Mutter",rechts:"Männliches / Yang / Vater"},
    ahnen:"Sexualität als Tabu, Bindung an Herkunftsfamilie, Bewegungsunfreiheit",
    heilung:["Sakralchakra-Öffnung","Hüftöffner","Ahnen-Sexualitätsmuster","Becken-Entspannung"],
    keywords:["hüfte","becken","hüftschmerzen","sexualität","kreativität","fortbewegung"]
  },
  "knie": { emoji:"🦿",
    symbolik:["Flexibilität","Demut","Sturheit","Ego","Niederbeugen"],
    emotion:["Starrsinn","Stolz","Angst vor Niederlage","Unterwerfung","Autoritätskonflikte"],
    chakra:"wurzel", seiten:{links:"innere Flexibilität",rechts:"äußere Anpassung / Autorität"},
    ahnen:"Kniefall vor Autoritäten / Unterwerfungsmuster / Stolz als Überlebensstrategie",
    heilung:["Magenmeridian","Flexibilitäts-Übung mental","Wurzelchakra","Ego-Auflösung","Demut als Kraft"],
    keywords:["knie","knieschmerzen","starrheit","flexibilität","beugen","autorität"]
  },
  "sprunggelenk / füße": { emoji:"🦶",
    symbolik:["Richtung im Leben","Schritt-für-Schritt","Erdung","Vorwärtskommen","Standpunkt"],
    emotion:["Orientierungslosigkeit","Angst vor dem nächsten Schritt","Erdungsdefizit"],
    chakra:"wurzel", seiten:{links:"Vergangenheit / Herkunft",rechts:"Zukunft / Richtung"},
    ahnen:"Entwurzelung, Flucht, Migration, heimatlose Vorfahren",
    heilung:["Fußreflexzonen","Barfußlaufen","Erdungsritual","Wurzelchakra","Ahnen-Heimat-Heilung"],
    keywords:["füße","fuß","sprunggelenk","knöchel","erdung","richtung","schritt"]
  },
  "haut": { emoji:"🧑",
    symbolik:["Grenze","Berührung","Abgrenzung","Kontakt","Schutz","Identität"],
    emotion:["Grenzverlust","Hypersensitivität","Berührungsangst","Kontaktangst","Identitätsverlust"],
    chakra:"wurzel", seiten:{ links:"Selbstbezug",rechts:"Außenwelt"},
    ahnen:"Generationelle Berührungsarmut, Übergriffe, zu viel oder zu wenig Nähe",
    heilung:["Hautmeridian","Schutz-Visualisierung","Aura-Stärkung","Körpergrenzen-Ritual","Berührungs-Therapie"],
    keywords:["haut","neurodermitis","ekzem","psoriasis","jucken","kontakt","berührung"]
  },
  "blut / kreislauf": { emoji:"🩸",
    symbolik:["Lebensfluss","Kraft","Familie (Blut ist dicker)","Ahnenverbindung","Vitalität"],
    emotion:["Lebensunlust","Erschöpfung","Familienthemen","Blutsbande","Kreislauf des Lebens"],
    chakra:"herz", seiten:{links:"Vergangenheit",rechts:"Zukunft"},
    ahnen:"Zentrales Ahnenthema – Blut trägt alle Generationenmuster",
    heilung:["Blutreinigung (Lichtarbeit)","Herzchakra-Pump-Übung","DNA-Aktivierung","Ahnen-Blutlinie-Reinigung","Ferritheilung"],
    keywords:["blut","kreislauf","blutdruck","anämie","durchblutung","vitalität"]
  },
};

const AURA_SCHICHTEN = [
  { nr:1, name:"Ätherischer Körper",    farbe:"#CBD5E1", thema:"Vitalität · Körperblaupause",
    abstand:"2–5 cm", wahrnehmung:"Kribbeln, Wärme, Pulsation direkt am Körper",
    blockaden:["Erschöpfung","Chronische Erkrankungen","Energieverlust","Schmerz"],
    heilung:["Pranic Healing","Quantenheilung am Ätherfeld","Lebensenergie-Infusion","Akupunktur-Meridiane"],
    chirurgie:["Ätherische Wunden nähen","Depleted areas auffüllen","Energielecks schließen"]
  },
  { nr:2, name:"Emotionalkörper",       farbe:"#FCA5A5", thema:"Gefühle · Wünsche · Reaktionen",
    abstand:"5–15 cm", wahrnehmung:"Temperaturveränderungen, Farben, emotionale Eindrücke",
    blockaden:["Unterdrückte Gefühle","Altes Herzweh","Traumata","emotionale Verstrickungen"],
    heilung:["Emotions-Entleerung","Emotionalkörper-Reinigung","Traumaarbeit","Farbheilung"],
    chirurgie:["Emotionale Schichten ablösen","alte Gefühlsknoten lösen","Schutzpanzer auflösen"]
  },
  { nr:3, name:"Mentalkörper",          farbe:"#FEF08A", thema:"Gedanken · Überzeugungen · Muster",
    abstand:"15–25 cm", wahrnehmung:"Impulse, Gedanken die kommen, Druckgefühl am Kopf",
    blockaden:["Glaubenssätze","Negative Gedankenmuster","Mentale Programme","Fremdgedanken"],
    heilung:["Glaubenssatz-Clearing","Mentalkörper-Reinigung","Lichtsprache","Affirmationsfeld"],
    chirurgie:["Mentale Implantate entfernen","Fremdgedanken auslösen","Mentales Gitter reparieren"]
  },
  { nr:4, name:"Astralkörper",          farbe:"#86EFAC", thema:"Verbindungen · Liebe · Beziehungen",
    abstand:"25–45 cm", wahrnehmung:"Energiefäden zu Personen, Herzöffnung, Expansionsgefühl",
    blockaden:["Kord-Verbindungen","Symbiotische Bindungen","Liebeswunden","Beziehungsverstrickungen"],
    heilung:["Kord-Schneiden","Astralreisen-Reinigung","Liebeswunden-Heilung","Herzverbindungen stärken"],
    chirurgie:["Energetische Korde durchtrennen","Parasitäre Verbindungen lösen","Liebesfäden heilen"]
  },
  { nr:5, name:"Äther-Schablone",       farbe:"#7DD3FC", thema:"Göttlicher Bauplan · Identität",
    abstand:"45–60 cm", wahrnehmung:"Kristalline Struktur, Blaupausen-Qualität, Ordnung/Chaos",
    blockaden:["Identitätsverlust","Nicht authentisch leben","Lebensplan blockiert"],
    heilung:["Blaupausen-Aktivierung","Göttliche Struktur wiederherstellen","Identitätsheilung"],
    chirurgie:["Verzerrte Blaupausen korrigieren","Göttliches Muster reinstallieren"]
  },
  { nr:6, name:"Kausalkörper",          farbe:"#C4B5FD", thema:"Karma · Seelenmuster · Lebensthemen",
    abstand:"60–80 cm", wahrnehmung:"Leuchten, hohe Frequenz, Sphärenklang intern",
    blockaden:["Karmische Muster","Seelenwunden","ungelöste Lebensthemen","Seelensplitter"],
    heilung:["Karma-Auflösung","Seelenheilung","Zeitlinienarbeit","Inkarnationsthemen lösen"],
    chirurgie:["Karmische Korde trennen","Seelensplitter zurückrufen","Lebensthemen umprogrammieren"]
  },
  { nr:7, name:"Kether-Körper",         farbe:"#FFFFFF", thema:"Göttliche Verbindung · Einheit",
    abstand:"80–100+ cm", wahrnehmung:"Stille, Licht, absolute Präsenz, Grenzenlosigkeit",
    blockaden:["Spirituelle Trennung","Gottvertrauen verloren","Sinnkrise","Disconnect"],
    heilung:["Lichtkanal öffnen","Göttliche Verbindung herstellen","Quellenlicht einlassen"],
    chirurgie:["Lichtkanal reparieren","Verbindung zum Höheren reinstallieren"]
  },
];

const AURA_CHIRURGIE_TECHNIKEN = [
  { name:"Kord-Schneidung",            icon:"✂️", beschreibung:"Energetische Verbindungsfäden zu Personen, Orten oder Situationen durchtrennen. Nicht zu verwechseln mit Liebesbanden.", anwendung:"Symbiotische Abhängigkeiten, toxische Beziehungen, nicht ablösbare Bindungen", schritte:["Feld scannen nach Korden","Ursprung bestimmen","Intention setzen","Arkturanisches Lichtschwert oder Goldenes Licht","Wunde versiegeln","Neue Grenze setzen"] },
  { name:"Implantat-Entfernung",       icon:"🔮", beschreibung:"Fremdenergetische Strukturen im Aurafeld finden und auflösen. Diese können aus anderen Inkarnationen, Verträgen oder Magie stammen.", anwendung:"Unerklärliche Schwere, fremde Gedanken, blockierte Manifestation", schritte:["Scan mit Hellspürsinn","Lokalisierung (oft Chakren oder Gelenke)","Lichtzange / Goldenes Licht","Entfernen und Entsorgen im Licht","Wunde füllen mit Reines Licht"] },
  { name:"Energieleck-Versiegelung",   icon:"💧", beschreibung:"Löcher oder Risse in der Aura finden und reparieren. Entstehen durch Schock, Operationen, Drogen oder intensive emotionale Verluste.", anwendung:"Chronische Erschöpfung, das Gefühl 'immer leer zu sein'", schritte:["Aura abtasten auf Temperaturdifferenzen","Leck lokalisieren","Goldenes Licht oder Silberlicht einfüllen","Aura-Gewebe nähen (visualisiert)","Versiegeln und schützen"] },
  { name:"Fremdenergien-Clearing",     icon:"🌊", beschreibung:"Im Alltag, in Menschenmassen oder bei intensiver Kontaktarbeit sammeln sich Fremdenergien im Feld. Regelmäßige Reinigung ist essenziell.", anwendung:"Nach intensiver Sitzungsarbeit, in Menschenmassen, nach Konflikten", schritte:["Violettes Feuer / Lichtdusche","Feld von außen nach innen bürsten","Ins Licht entlassen","Schutz reaktivieren"] },
  { name:"Schutzmatrix-Stärkung",      icon:"🛡️", beschreibung:"Aufbau eines bewussten energetischen Schutzschildes für sensible Praktizierende und deren Klienten.", anwendung:"Vor Sitzungen, bei empathischen Überwältigungen, für Schutz im Alltag", schritte:["Erdung aktivieren","Lichtschutzblase aufbauen (Goldlicht oder Kristall)","Spiegel-Außenhülle","Intention: Nur das Höchste und Heilsamste darf ein und aus"] },
  { name:"Seelensplitter-Rückruf",     icon:"🌟", beschreibung:"Teile der Seele, die durch Trauma abgespalten wurden, werden zurückgerufen und reintegriert. Schamanische Kerntechnik.", anwendung:"Bei Dissoziationstendenzen, Gefühl 'nicht ganz da zu sein', nach Traumata", schritte:["Heiligen Raum öffnen","Seelensplitter lokalisieren (Zeit / Ort)","Liebevoller Ruf","Empfangen und integrieren","Mit Licht versiegeln"] },
  { name:"DNA-Aktivierung",            icon:"🧬", beschreibung:"Aktivierung von Licht-Codes in den Ahnen-DNS-Schichten. Entfernt generationelle Programme und aktiviert das volle Potenzial.", anwendung:"Bei tiefen Familienmustern, Wiederholung generationeller Themen", schritte:["Verbindung mit dem höheren Selbst","DNS-Doppelhelix visualisieren","Licht-Codes einschleusen","Altes Programm auflösen","Neues Programm verankern"] },
];

const HELLSINN_TAGS = {
  wahrnehmung: {
    label:"💫 Wahrnehmungsart", farbe:"#7C3AED", bgfarbe:"#EDE9FE",
    items:["Wärme","Kälte","Schwere","Leichtigkeit","Kribbeln","Pulsation","Enge","Druck","Zug","Leere","Fülle","Prickeln","Schmerz gespürt","Starre","Vibration","Weichheit","Härte"]
  },
  farben: {
    label:"🎨 Farben / Licht", farbe:"#EA580C", bgfarbe:"#FFF7ED",
    items:["Rot","Orange","Gelb","Grün","Hellblau","Dunkelblau","Violett","Weiß","Schwarz","Grau","Braun","Rosa","Gold","Silber","Türkis","Dunkel","Hell","Trüb","Leuchtend"]
  },
  koerper: {
    label:"🫀 Körperzone", farbe:"#0D9488", bgfarbe:"#CCFBF1",
    items:["Kopf","Herz","Bauch","Brust","Rücken","Schultern","Arme","Beine","Füße","Hände","Kehle","Gesicht","Becken","Hüfte","Knie","Wirbelsäule","Links","Rechts","Oben","Unten"]
  },
  energetisch: {
    label:"⚡ Energetisches Feld", farbe:"#6D3FCC", bgfarbe:"#EDE9FE",
    items:["Aura groß","Aura klein","Löcher im Feld","Korde","Fremdenergie","Schutzwand","Chakra aktiv","Chakra blockiert","Strudel","Lichtkörper","Dunkelfeld","Implantate","Seelensplitter","Verbindungsfäden"]
  },
  bildlich: {
    label:"🌿 Bilder / Symbole", farbe:"#16A34A", bgfarbe:"#DCFCE7",
    items:["Mauer","Käfig","Netz","Panzer","Schleier","Schnur","Knoten","Stein","Schwert","Licht","Fluss","Baum","Wurzel","Wasser","Feuer","Erde","Wind","Höhle","Brücke","Spiegel"]
  },
  ahnen: {
    label:"🧬 Ahnen / Karma", farbe:"#B45309", bgfarbe:"#FEF3C7",
    items:["Mutter-Linie","Vater-Linie","Großeltern","Krieg","Verlust","Emigration","Trauma","Schwur","Loyalität","Karma","Wiederholung","Verstrickung","Schicksal","Ahnen anwesend"]
  },
};

const HEILMETHODEN_KATALOG = [
  { id:"blutreinigung",  name:"Blutreinigung",      icon:"🩸", kategorie:"Energetische Heilung",
    beschreibung:"Reinigung des energetischen Blutfeldes von niedrigen Frequenzen, Schockmustern und Ahnenbelastungen. Das Blut ist der Träger aller Lebensinformation.",
    anwendung:"Chronische Erkrankungen, Erschöpfung, Ahnenthemen, Kreislaufprobleme, Bluterkrankungen",
    ablauf:["Verbindung mit dem Herzfeld","Licht durch das Blut strömen lassen","Dunkle Partikel im Licht auflösen","Neue vitale Frequenz einprogrammieren","Versiegelung"],
    stufe:3
  },
  { id:"herzheilung",    name:"Herzheilung",         icon:"💚", kategorie:"Energetische Heilung",
    beschreibung:"Tiefe Heilungsarbeit am Herzfeld: Öffnen, Reinigen, Integrieren von Herzwunden, Liebeskummer, Verlust und emotionalen Panzerungen.",
    anwendung:"Herzschmerz, Trauer, Verlust, Beziehungsprobleme, Selbstablehnung, Angststörungen",
    ablauf:["Herzraum öffnen","Schmerzschichten ablösen","Rohes Licht einlassen","Selbstliebe ankern","Herz-Kohärenz stabilisieren"],
    stufe:2
  },
  { id:"chakraheilung",  name:"Chakraheilung",        icon:"🌈", kategorie:"Energetische Heilung",
    beschreibung:"Systematische Reinigung, Balancierung und Aktivierung der sieben Hauptchakren und ihrer Verbindungskanäle (Sushumna, Ida, Pingala).",
    anwendung:"Energieimbalancen, Körperbeschwerden, emotionale Blockaden, spirituelle Stagnation",
    ablauf:["Chakren-Scan (Pendeltest/Intuition)","Blockiertes Chakra identifizieren","Reinigung","Aktivierung mit Farb-/Tonfrequenz","Nadis ausbalancieren"],
    stufe:1
  },
  { id:"meridianheilung",name:"Meridian-Ausgleich",  icon:"🌊", kategorie:"Energetische Heilung",
    beschreibung:"Energetische Aktivierung der 12 Hauptmeridiane und 2 Gefäße (Renmai/Dumai) zur Harmonisierung des gesamten Energiesystems.",
    anwendung:"Organprobleme, Schmerzbilder, emotionale Muster, TCM-Diagnoseprinzipien",
    ablauf:["Meridian-Scan","Schwache Meridiane bestimmen","Sedierung / Tonisierung","Energie nachführen","Ausleitung"],
    stufe:2
  },
  { id:"auraoperation",  name:"Aura-Chirurgie",      icon:"✂️", kategorie:"Aura-Arbeit",
    beschreibung:"Präzise energetische Eingriffe im Aurakörper: Kord-Schnitte, Implantat-Entfernung, Energieleck-Versiegelung, Schutzmatrix-Aufbau.",
    anwendung:"Energielecks, Fremdeinflüsse, toxische Beziehungen, chronische Energielosigkeit",
    ablauf:["Aura-Scan","Befund festhalten","Gezielte Intervention","Wunden heilen","Schutz aufbauen"],
    stufe:4
  },
  { id:"ahnenarbeit",    name:"Ahnenlinien-Heilung", icon:"🧬", kategorie:"Systemische Energie",
    beschreibung:"Heilungsarbeit an transgenerationellen Mustern, Loyalitäten, Schwüren und Traumata in Mutter- und Vaterlinie bis zur 7. Generation.",
    anwendung:"Wiederholungsmuster, Beziehungsthemen, Erkrankungsmuster die sich wiederholen",
    ablauf:["Ahnen-Feld öffnen","Thema und Ursprung finden","Anerkennung der Ahnen","Lösung/Vergebung","DNS-Reinigung","Integration"],
    stufe:3
  },
  { id:"dnaheilung",     name:"DNA / Licht-Codes",   icon:"🔮", kategorie:"Quantenheilung",
    beschreibung:"Aktivierung von Licht-Codes in der DNS über Intention, Klang und höherdimensionale Verbindung. Epigenetische Umprogrammierung.",
    anwendung:"Tiefe Familienmuster, spirituelles Erwachen, Potential-Entfaltung",
    ablauf:["Verbindung höheres Selbst","DNS-Visualisierung","Lichtcodes einsenden","Altes Programm auflösen","Neues Muster verankern"],
    stufe:5
  },
  { id:"zeitlinie",      name:"Zeitlinienarbeit",    icon:"⏳", kategorie:"Quantenheilung",
    beschreibung:"Energetische Heilungsarbeit in der Zeit: Vergangenheitshealing, Inkarnationsthemen, Zukunftsprogrammierung.",
    anwendung:"Nicht-heilende Wunden, Traumatas die 'tief' sitzen, Karma-Auflösung",
    ablauf:["Zeitlinie öffnen","Heilungspunkt identifizieren","Intervention im Energiefeld der Zeit","Integration ins Jetzt"],
    stufe:4
  },
  { id:"lichtsprache",   name:"Licht-Sprache",       icon:"✨", kategorie:"Frequenzarbeit",
    beschreibung:"Übertragung von Heilfrequenzen durch Laut, Geste und Intention jenseits des Verstandes. Direkte Arbeit mit dem Energiefeld.",
    anwendung:"Tiefe Blockaden, wenn Worte nicht reichen, Frequenzübertragung",
    ablauf:["Verbindung herstellen","Kanal öffnen","Lichtsprache fließen lassen","Empfangen und integrieren"],
    stufe:3
  },
  { id:"fernheilung",    name:"Fernheilung",         icon:"🌐", kategorie:"Quantenheilung",
    beschreibung:"Quantenenergetische Heilungsarbeit über Raum und Zeit. Intention als primäres Werkzeug. Gleiche Wirksamkeit wie Präsenz-Sitzung.",
    anwendung:"Nicht anwesende Klienten, Nachsorge, internationale Arbeit",
    ablauf:["Heiligen Raum öffnen","Verbindung mit Klientenfeld aufnehmen","Absicht setzen","Arbeit durchführen","Schließen und loslassen"],
    stufe:4
  },
];

const LERNPFAD_STUFEN = [
  { nr:1, name:"Einführung",    farbe:"#16A34A", icon:"🌱", beschreibung:"Grundverständnis, Terminologie, erste Wahrnehmungen. Für Einsteiger." },
  { nr:2, name:"Grundlagen",   farbe:"#0D9488", icon:"📚", beschreibung:"Systematisches Wissen, erste Technikanwendung, Klienten-Grundarbeit." },
  { nr:3, name:"Vertiefung",   farbe:"#0284C7", icon:"🎯", beschreibung:"Komplexe Fälle, Kombination von Methoden, eigene Wahrnehmungsschärfung." },
  { nr:4, name:"Meisterschaft",farbe:"#7C3AED", icon:"⚡", beschreibung:"Aura-Chirurgie, Quantenarbeit, Fern-Anwendungen, Ausbildungsleitung." },
  { nr:5, name:"Zertifizierung",farbe:"#D97706",icon:"🏆", beschreibung:"Geprüfte Kompetenz, Resonanz Akademie Zertifikat, Lehrerlizenz." },
];

// ════════════════════════════════════════════════════════════════
//  UI HILFSKOMPONENTEN
// ════════════════════════════════════════════════════════════════
const OCard = ({children, style={}}) => (
  <div style={{background:"#FFFFFF",borderRadius:"18px",padding:"18px",border:`1.5px solid ${OT.border}`,boxShadow:`0 2px 14px ${OT.shadow}`,...style}}>{children}</div>
);
const OBtn = ({children,onClick,variant="primary",disabled,style={}}) => {
  const variants = {
    primary:{background:`linear-gradient(135deg,${OT.teal},${OT.tealD})`,color:"white",border:"none"},
    soft:{background:OT.bgSoft,color:OT.textMid,border:`1.5px solid ${OT.border}`},
    violet:{background:`linear-gradient(135deg,${OT.violet},${OT.violetD})`,color:"white",border:"none"},
    ghost:{background:"transparent",color:OT.teal,border:`1.5px solid ${OT.teal}`},
  };
  return <button onClick={onClick} disabled={disabled} style={{fontFamily:"Raleway",fontWeight:700,fontSize:"13px",padding:"10px 18px",borderRadius:"12px",cursor:disabled?"wait":"pointer",opacity:disabled?0.6:1,transition:"all 0.15s",...variants[variant],...style}}>{children}</button>;
};
const OTag = ({label, aktiv, onClick, farbe="#0D9488", bgFarbe="#CCFBF1"}) => (
  <button onClick={onClick} style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:700,padding:"5px 12px",borderRadius:"20px",border:`1.5px solid ${aktiv?farbe:OT.border}`,background:aktiv?bgFarbe:"white",color:aktiv?farbe:OT.textSoft,cursor:"pointer",transition:"all 0.12s"}}>{label}</button>
);
const OLabel = ({children, color}) => (
  <div style={{fontFamily:"Raleway",fontSize:"10px",letterSpacing:"2px",fontWeight:800,color:color||OT.textSoft,textTransform:"uppercase",marginBottom:"10px"}}>{children}</div>
);

// ════════════════════════════════════════════════════════════════
//  HELLSINN-SCANNER · Kern-Feature
// ════════════════════════════════════════════════════════════════
function HellsinnScanner({ groqFetch }) {
  const [eingabe, setEingabe]       = useState("");
  const [tags, setTags]             = useState([]);
  const [aktivKat, setAktivKat]    = useState("wahrnehmung");
  const [lokalInfo, setLokalInfo]  = useState([]);
  const [kiAntwort, setKiAntwort]  = useState("");
  const [kiLaed, setKiLaed]        = useState(false);
  const [kiGestellt, setKiGestellt]= useState(false);
  const debounceRef                 = useRef();

  // Lokale Sofort-Analyse bei Änderung der Tags/Eingabe
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => analysiereLokal(), 300);
  }, [eingabe, tags]);

  const analysiereLokal = () => {
    const alleWorte = [...tags, ...eingabe.toLowerCase().split(/[\s,;]+/)].filter(Boolean);
    const treffer = [];

    // Organ-Treffer
    Object.entries(ORGAN_MAP).forEach(([organ, daten]) => {
      const matchScore = daten.keywords.filter(k => alleWorte.some(w => w.includes(k) || k.includes(w))).length;
      if (matchScore > 0) treffer.push({ typ:"organ", organ, daten, score: matchScore });
    });

    // Chakra-Treffer
    CHAKRA_SYSTEM.forEach(chakra => {
      const matchScore = [...chakra.themen, ...chakra.emotion_block, ...chakra.organe]
        .filter(t => alleWorte.some(w => t.toLowerCase().includes(w) || w.includes(t.toLowerCase().split(" ")[0]))).length;
      if (matchScore > 0) treffer.push({ typ:"chakra", chakra, score: matchScore });
    });

    // Aura-Treffer
    const auraWorte = ["aura","feld","schicht","korde","leck","schutz","implantat","splitter","fremdenergie"];
    if (alleWorte.some(w => auraWorte.some(a => a.includes(w) || w.includes(a)))) {
      treffer.push({ typ:"aura_hinweis", score:1 });
    }

    treffer.sort((a,b) => b.score - a.score);
    setLokalInfo(treffer.slice(0, 4));
  };

  const tagToggle = (tag) => setTags(t => t.includes(tag) ? t.filter(x=>x!==tag) : [...t, tag]);

  const kiAnalyse = async () => {
    if (!groqFetch) { setKiAntwort("⚠️ Kein API-Zugang. Verbinde die App mit /api/ki."); return; }
    setKiLaed(true); setKiGestellt(true); setKiAntwort("");
    const kontext = `Stichworte: ${eingabe}\nWahrnehmungs-Tags: ${tags.join(", ")}`;
    const organTreffer = lokalInfo.filter(i=>i.typ==="organ").map(i=>`Organ: ${i.organ} (${i.daten.symbolik.join(", ")})`).join("\n");
    const chakraTreffer = lokalInfo.filter(i=>i.typ==="chakra").map(i=>`Chakra: ${i.chakra.name} - Themen: ${i.chakra.themen.slice(0,3).join(", ")}`).join("\n");
    
    const prompt = `Du bist ein erfahrener energetischer Heiler und feinstofflicher Berater im Lichtkern-System. Du erhältst die Wahrnehmungen eines Praktizierers an einem Klienten und gibst sofort strukturierte Handlungsempfehlungen. Antworte auf Deutsch, klar und professionell.

WAHRNEHMUNGEN:
${kontext}

AUTOMATISCH ERKANNTE BEZÜGE:
${organTreffer}
${chakraTreffer}

Gib eine strukturierte Analyse in GENAU diesem Format (nutze diese Überschriften):

🫀 ORGANSPRACHE & KÖRPERSYMBOLIK
[Was sagen diese Körperregionen/Symptome auf der energetischen Ebene? Welche Themen, Gefühle, Lebensbereiche sind gemeint?]

⚡ CHAKRA & ENERGIEFELD
[Welche Chakren sind betroffen? Was zeigt das Energiefeld? Offen/geschlossen/überaktiv?]

🧬 MÖGLICHE AHNENMUSTER / GENERATIONENTHEMEN
[Welche generationellen Themen könnten dahinterstecken?]

💚 HEILUNGSEMPFEHLUNGEN (Priorität: Energetisch)
1. [Erste Maßnahme, z.B. Chakraheilung / Blutreinigung / Herzheilung]
2. [Zweite Maßnahme]
3. [Dritte Maßnahme]
[Weitere wenn relevant]

🎯 FRAGEN AN DEN KLIENTEN
[2-3 gezielte Fragen die mehr Klarheit bringen]

Sei präzise, praxisnah und einfühlsam. Keine Heilversprechen, keine Diagnosen.`;

    try {
      const antwort = await groqFetch(prompt);
      setKiAntwort(antwort);
    } catch (e) {
      setKiAntwort("❌ Fehler bei der KI-Analyse. Bitte Verbindung prüfen.");
    }
    setKiLaed(false);
  };

  const reset = () => { setEingabe(""); setTags([]); setLokalInfo([]); setKiAntwort(""); setKiGestellt(false); };

  const alleTagsKat = HELLSINN_TAGS[aktivKat];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
      {/* Eingabe */}
      <OCard>
        <OLabel>✦ Hellsinn-Eingabe · Was nimmst du wahr?</OLabel>
        <textarea
          value={eingabe}
          onChange={e=>setEingabe(e.target.value)}
          placeholder="Notiere frei, was du wahrnimmst... z.B. 'Wärme im Herzbereich, Enge links, schwerer Energiepanzer, Bild: graue Mauer, Korde zur Mutter spürbar...'"
          style={{width:"100%",minHeight:"90px",padding:"12px 14px",borderRadius:"12px",border:`1.5px solid ${OT.border}`,fontFamily:"Raleway",fontSize:"13px",color:OT.text,resize:"vertical",outline:"none",background:OT.bgSofter,lineHeight:"1.7",boxSizing:"border-box",fontWeight:500}}
        />
        <div style={{display:"flex",gap:"8px",marginTop:"10px",flexWrap:"wrap"}}>
          <OBtn onClick={kiAnalyse} disabled={kiLaed||(!eingabe.trim()&&tags.length===0)}>
            {kiLaed?"⏳ KI analysiert...":"✦ KI-Analyse starten"}
          </OBtn>
          {(eingabe||tags.length>0)&&<OBtn variant="ghost" onClick={reset}>← Neu</OBtn>}
        </div>
      </OCard>

      {/* Tag-Auswahl nach Kategorie */}
      <OCard>
        <OLabel>Wahrnehmungs-Tags schnell hinzufügen</OLabel>
        <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"10px"}}>
          {Object.entries(HELLSINN_TAGS).map(([key,kat])=>(
            <button key={key} onClick={()=>setAktivKat(key)} style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:700,padding:"6px 12px",borderRadius:"20px",border:`1.5px solid ${aktivKat===key?kat.farbe:OT.border}`,background:aktivKat===key?kat.bgfarbe:"white",color:aktivKat===key?kat.farbe:OT.textSoft,cursor:"pointer"}}>
              {kat.label}
            </button>
          ))}
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
          {alleTagsKat.items.map(item=>(
            <OTag key={item} label={item} aktiv={tags.includes(item)} onClick={()=>tagToggle(item)} farbe={alleTagsKat.farbe} bgFarbe={alleTagsKat.bgfarbe}/>
          ))}
        </div>
        {tags.length>0&&(
          <div style={{marginTop:"10px",padding:"10px 14px",background:OT.tealL,borderRadius:"12px",border:`1px solid ${OT.borderMid}`}}>
            <span style={{fontFamily:"Raleway",fontSize:"11px",color:OT.tealD,fontWeight:700}}>Aktive Tags: </span>
            <span style={{fontFamily:"Raleway",fontSize:"11px",color:OT.tealD,fontWeight:500}}>{tags.join(" · ")}</span>
          </div>
        )}
      </OCard>

      {/* Lokale Sofort-Bezüge */}
      {lokalInfo.length > 0 && (
        <OCard style={{background:`linear-gradient(135deg,${OT.bgSoft},#FAFFFE)`,border:`1.5px solid ${OT.borderMid}`}}>
          <OLabel color={OT.tealD}>⚡ Sofortige Resonanz-Bezüge</OLabel>
          {lokalInfo.map((info, idx) => {
            if (info.typ === "organ") {
              const { organ, daten } = info;
              return (
                <div key={idx} style={{marginBottom:"12px",padding:"12px",background:"white",borderRadius:"12px",border:`1px solid ${OT.border}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"6px"}}>
                    <span style={{fontSize:"20px"}}>{daten.emoji}</span>
                    <span style={{fontFamily:"Cinzel",fontSize:"13px",color:OT.text,fontWeight:700,textTransform:"capitalize"}}>{organ}</span>
                    <span style={{marginLeft:"auto",fontFamily:"Raleway",fontSize:"10px",fontWeight:700,padding:"3px 8px",borderRadius:"8px",background:OT.tealL,color:OT.tealD}}>Organsprache</span>
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:"5px",marginBottom:"6px"}}>
                    {daten.symbolik.map(s=><span key={s} style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:700,padding:"3px 9px",borderRadius:"10px",background:"#FEF3C7",color:OT.gold}}>{s}</span>)}
                  </div>
                  <div style={{fontFamily:"Raleway",fontSize:"11px",color:OT.textMid,fontWeight:500}}>
                    Chakra-Bezug: <b>{CHAKRA_SYSTEM.find(c=>c.id===daten.chakra)?.name||daten.chakra}</b>
                    {daten.seiten && <span style={{marginLeft:"8px"}}>· L: {daten.seiten.links} · R: {daten.seiten.rechts}</span>}
                  </div>
                </div>
              );
            }
            if (info.typ === "chakra") {
              const { chakra } = info;
              return (
                <div key={idx} style={{marginBottom:"12px",padding:"12px",background:"white",borderRadius:"12px",border:`1px solid ${OT.border}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"6px"}}>
                    <span style={{fontSize:"20px",color:chakra.hex}}>●</span>
                    <span style={{fontFamily:"Cinzel",fontSize:"13px",color:OT.text,fontWeight:700}}>{chakra.name}</span>
                    <span style={{marginLeft:"auto",fontFamily:"Raleway",fontSize:"10px",fontWeight:700,padding:"3px 8px",borderRadius:"8px",background:"#EDE9FE",color:OT.violet}}>Chakra</span>
                  </div>
                  <div style={{fontFamily:"Raleway",fontSize:"11px",color:OT.textMid,fontWeight:500,marginBottom:"6px"}}>
                    Mögliche Blockaden: {chakra.emotion_block.slice(0,3).join(" · ")}
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:"4px"}}>
                    {chakra.heilung.slice(0,3).map(h=><span key={h} style={{fontFamily:"Raleway",fontSize:"10px",padding:"3px 9px",borderRadius:"10px",background:OT.tealL,color:OT.tealD,fontWeight:700}}>{h}</span>)}
                  </div>
                </div>
              );
            }
            if (info.typ === "aura_hinweis") {
              return (
                <div key={idx} style={{padding:"12px",background:"white",borderRadius:"12px",border:`1px solid ${OT.border}`}}>
                  <div style={{fontFamily:"Raleway",fontSize:"12px",color:OT.violet,fontWeight:700}}>🔮 Aura-Feld-Arbeit indiziert</div>
                  <div style={{fontFamily:"Raleway",fontSize:"11px",color:OT.textMid,fontWeight:500,marginTop:"4px"}}>
                    Wechsle zur "Aura & Chirurgie" Karte für detaillierte Feinstoffarbeit
                  </div>
                </div>
              );
            }
            return null;
          })}
        </OCard>
      )}

      {/* KI-Antwort */}
      {kiGestellt && (
        <OCard style={{background:`linear-gradient(135deg,${OT.violetL} 0%,${OT.tealL} 100%)`,border:`1.5px solid ${OT.borderMid}`}}>
          <OLabel color={OT.violetD}>✦ KI-Analyse · Stiller Berater</OLabel>
          {kiLaed ? (
            <div style={{textAlign:"center",padding:"30px 0"}}>
              <div style={{fontSize:"30px",marginBottom:"12px",animation:"pulse 1.5s infinite"}}>✦</div>
              <div style={{fontFamily:"Raleway",fontSize:"13px",color:OT.textMid,fontWeight:600}}>Energetische Analyse läuft...</div>
            </div>
          ) : (
            <div style={{fontFamily:"Raleway",fontSize:"13px",color:OT.text,lineHeight:"1.9",whiteSpace:"pre-wrap",fontWeight:500}}>{kiAntwort}</div>
          )}
        </OCard>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  ORGANSPRACHE-KARTE
// ════════════════════════════════════════════════════════════════
function OrganspracheKarte({ groqFetch }) {
  const [gewaehltes, setGewaehltes] = useState(null);
  const [seite, setSeite]           = useState("links");
  const [kiDetail, setKiDetail]     = useState("");
  const [kiLaed, setKiLaed]         = useState(false);

  const ladeKiDetail = async (organ, daten) => {
    if (!groqFetch) return;
    setKiLaed(true); setKiDetail("");
    const chkr = CHAKRA_SYSTEM.find(c=>c.id===daten.chakra);
    const prompt = `Du bist ein energetischer Heiler und erklärst Organsprache präzise und praxisnah.

Organ: ${organ} (Emoji: ${daten.emoji})
Seite: ${seite} = ${daten.seiten?.[seite]||"universal"}
Symbolik: ${daten.symbolik.join(", ")}
Emotionen: ${daten.emotion.join(", ")}
Chakra-Bezug: ${chkr?.name}
Ahnen-Thema: ${daten.ahnen}

Gib eine PRAXISNAHE Erklärung in 3 kurzen Abschnitten:

1. 🎯 WAS DIESES ORGAN JETZT SAGEN WILL (3-4 Sätze, direkt zum Punkt)
2. 💬 TYPISCHE SÄTZE DES KLIENTEN (3 konkrete Sätze die der Klient oft sagt wenn dieses Muster aktiv ist)  
3. 🌟 NÄCHSTE SCHRITTE IN DER SITZUNG (2-3 konkrete Handlungsimpulse)

Keine langen Einleitungen. Sofort in die Praxis.`;

    try {
      const antwort = await groqFetch(prompt);
      setKiDetail(antwort);
    } catch { setKiDetail("Fehler bei der Analyse."); }
    setKiLaed(false);
  };

  const waehleOrgan = (organ) => {
    setGewaehltes(organ);
    setKiDetail("");
    ladeKiDetail(organ, ORGAN_MAP[organ]);
  };

  if (gewaehltes && ORGAN_MAP[gewaehltes]) {
    const daten = ORGAN_MAP[gewaehltes];
    const chkr = CHAKRA_SYSTEM.find(c=>c.id===daten.chakra);
    return (
      <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
        <button onClick={()=>{setGewaehltes(null);setKiDetail("");}} style={{fontFamily:"Raleway",fontSize:"13px",color:OT.teal,fontWeight:700,background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>← Alle Organe</button>
        
        <OCard style={{background:`linear-gradient(135deg,${OT.tealL},${OT.violetL})`,border:`1.5px solid ${OT.borderMid}`}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"14px"}}>
            <span style={{fontSize:"36px"}}>{daten.emoji}</span>
            <div>
              <div style={{fontFamily:"Cinzel",fontSize:"18px",color:OT.text,fontWeight:700,textTransform:"capitalize"}}>{gewaehltes}</div>
              <div style={{fontFamily:"Raleway",fontSize:"11px",color:OT.textMid,fontWeight:600,marginTop:"2px"}}>Chakra: {chkr?.name||daten.chakra} · {chkr?.symbol}</div>
            </div>
          </div>

          {/* Seiten-Toggle */}
          {daten.seiten && (
            <div style={{display:"flex",gap:"8px",marginBottom:"14px"}}>
              {["links","rechts"].map(s=>(
                <button key={s} onClick={()=>setSeite(s)} style={{flex:1,padding:"9px",borderRadius:"10px",border:`1.5px solid ${seite===s?OT.teal:OT.border}`,background:seite===s?OT.teal:"white",color:seite===s?"white":OT.textMid,fontFamily:"Raleway",fontSize:"11px",fontWeight:700,cursor:"pointer"}}>
                  {s==="links"?"◀ Links":"Rechts ▶"}<br/>
                  <span style={{fontSize:"9px",fontWeight:500,opacity:0.85}}>{daten.seiten[s]}</span>
                </button>
              ))}
            </div>
          )}

          <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:"12px"}}>
            {daten.symbolik.map(s=><span key={s} style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:700,padding:"4px 11px",borderRadius:"12px",background:"rgba(255,255,255,0.9)",color:OT.gold,border:"1px solid #D97706"}}>{s}</span>)}
          </div>
          <div style={{fontFamily:"Raleway",fontSize:"12px",color:OT.textMid,fontWeight:500,lineHeight:"1.6",marginBottom:"10px"}}>
            <b>Ahnen-Thema:</b> {daten.ahnen}
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
            {daten.heilung.map(h=><span key={h} style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:700,padding:"3px 10px",borderRadius:"10px",background:"rgba(255,255,255,0.8)",color:OT.teal,border:`1px solid ${OT.borderMid}`}}>💚 {h}</span>)}
          </div>
        </OCard>

        {/* KI-Detailanalyse */}
        <OCard>
          <OLabel color={OT.violetD}>✦ KI-Praxisanalyse</OLabel>
          {kiLaed ? (
            <div style={{textAlign:"center",padding:"24px",fontFamily:"Raleway",fontSize:"13px",color:OT.textMid}}>⏳ Analysiere...</div>
          ) : kiDetail ? (
            <div style={{fontFamily:"Raleway",fontSize:"13px",color:OT.text,lineHeight:"1.9",whiteSpace:"pre-wrap",fontWeight:500}}>{kiDetail}</div>
          ) : (
            <OBtn onClick={()=>ladeKiDetail(gewaehltes,daten)}>✦ KI-Praxisanalyse laden</OBtn>
          )}
        </OCard>
      </div>
    );
  }

  // Organ-Raster
  const kategorien = {
    "Kopf & Sinne":["kopf / gehirn","augen","ohren","mund / zähne / kiefer"],
    "Hals & Torso":["hals / schilddrüse","schultern","herz","lunge","leber / galle","magen / milz"],
    "Bauch & Becken":["nieren / nebennieren","hüfte / becken","blut / kreislauf"],
    "Extremitäten":["ellenbogen","hände / finger","knie","sprunggelenk / füße"],
    "Rücken":["rücken oben","rücken mitte","rücken unten / lendenwirbel"],
    "Systemisch":["haut"],
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
      <OCard style={{background:`linear-gradient(135deg,${OT.tealL},${OT.violetL})`,padding:"16px"}}>
        <div style={{fontFamily:"Cinzel",fontSize:"15px",color:OT.text,fontWeight:700,marginBottom:"4px"}}>Organsprache-Navigator</div>
        <div style={{fontFamily:"Raleway",fontSize:"12px",color:OT.textMid,fontWeight:500}}>Wähle ein Organ → sofortige energetische Deutung + KI-Praxisanalyse</div>
      </OCard>
      {Object.entries(kategorien).map(([kat, organe]) => (
        <OCard key={kat}>
          <OLabel>{kat}</OLabel>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
            {organe.filter(o=>ORGAN_MAP[o]).map(organ => (
              <button key={organ} onClick={()=>waehleOrgan(organ)} style={{padding:"10px 12px",borderRadius:"12px",border:`1.5px solid ${OT.border}`,background:OT.bgSofter,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:"8px",transition:"all 0.15s"}}>
                <span style={{fontSize:"18px"}}>{ORGAN_MAP[organ].emoji}</span>
                <span style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:700,color:OT.text,textTransform:"capitalize",lineHeight:"1.3"}}>{organ}</span>
              </button>
            ))}
          </div>
        </OCard>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  AURA & CHIRURGIE
// ════════════════════════════════════════════════════════════════
function AuraChirurgie({ groqFetch }) {
  const [ansicht, setAnsicht]     = useState("schichten");
  const [gewaehlt, setGewaehlt]   = useState(null);
  const [technikSel, setTechnikSel] = useState(null);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
      {/* Tab-Switcher */}
      <div style={{display:"flex",gap:"8px"}}>
        {[["schichten","🌐 Aura-Schichten"],["chirurgie","✂️ Aura-Chirurgie"]].map(([id,label])=>(
          <button key={id} onClick={()=>{setAnsicht(id);setGewaehlt(null);setTechnikSel(null);}} style={{flex:1,padding:"11px",borderRadius:"12px",border:`1.5px solid ${ansicht===id?OT.violet:OT.border}`,background:ansicht===id?OT.violetL:"white",color:ansicht===id?OT.violetD:OT.textMid,fontFamily:"Raleway",fontSize:"12px",fontWeight:700,cursor:"pointer"}}>
            {label}
          </button>
        ))}
      </div>

      {ansicht === "schichten" && (
        <>
          {gewaehlt !== null ? (
            <div>
              <button onClick={()=>setGewaehlt(null)} style={{fontFamily:"Raleway",fontSize:"13px",color:OT.teal,fontWeight:700,background:"none",border:"none",cursor:"pointer",marginBottom:"12px",display:"block"}}>← Alle Schichten</button>
              {(() => {
                const s = AURA_SCHICHTEN[gewaehlt];
                return (
                  <OCard>
                    <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"14px"}}>
                      <div style={{width:"14px",height:"14px",borderRadius:"50%",background:s.farbe,border:"2px solid rgba(0,0,0,0.1)",flexShrink:0}}/>
                      <div>
                        <div style={{fontFamily:"Cinzel",fontSize:"16px",color:OT.text,fontWeight:700}}>{s.name}</div>
                        <div style={{fontFamily:"Raleway",fontSize:"11px",color:OT.textMid,fontWeight:600}}>{s.thema}</div>
                      </div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"12px"}}>
                      <div style={{background:OT.bgSoft,padding:"10px",borderRadius:"10px"}}>
                        <div style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:800,color:OT.textSoft,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"4px"}}>Abstand</div>
                        <div style={{fontFamily:"Raleway",fontSize:"12px",color:OT.text,fontWeight:700}}>{s.abstand}</div>
                      </div>
                      <div style={{background:OT.bgSoft,padding:"10px",borderRadius:"10px"}}>
                        <div style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:800,color:OT.textSoft,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"4px"}}>Wahrnehmung</div>
                        <div style={{fontFamily:"Raleway",fontSize:"11px",color:OT.text,fontWeight:500}}>{s.wahrnehmung}</div>
                      </div>
                    </div>
                    <OLabel color="#C0392B">Typische Blockaden</OLabel>
                    <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:"12px"}}>
                      {s.blockaden.map(b=><span key={b} style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:700,padding:"4px 10px",borderRadius:"10px",background:"#FEE2E2",color:"#9B1C1C"}}>{b}</span>)}
                    </div>
                    <OLabel color={OT.tealD}>Heilungsmethoden</OLabel>
                    <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:"12px"}}>
                      {s.heilung.map(h=><span key={h} style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:700,padding:"4px 10px",borderRadius:"10px",background:OT.tealL,color:OT.tealD}}>💚 {h}</span>)}
                    </div>
                    <OLabel color={OT.violetD}>Chirurgische Eingriffe</OLabel>
                    <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
                      {s.chirurgie.map(c=><span key={c} style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:700,padding:"4px 10px",borderRadius:"10px",background:OT.violetL,color:OT.violetD}}>✂️ {c}</span>)}
                    </div>
                  </OCard>
                );
              })()}
            </div>
          ) : (
            <>
              <OCard style={{background:`linear-gradient(135deg,${OT.violetL},${OT.tealL})`,padding:"16px"}}>
                <div style={{fontFamily:"Cinzel",fontSize:"15px",color:OT.text,fontWeight:700,marginBottom:"4px"}}>Die 7 Aura-Schichten</div>
                <div style={{fontFamily:"Raleway",fontSize:"12px",color:OT.textMid,fontWeight:500}}>Jede Schicht trägt ihre eigene Frequenz und Aufgabe. Von physisch-nah (1) bis kosmisch (7).</div>
              </OCard>
              {AURA_SCHICHTEN.map((s, idx) => (
                <button key={idx} onClick={()=>setGewaehlt(idx)} style={{background:"white",borderRadius:"14px",padding:"14px 16px",border:`1.5px solid ${OT.border}`,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:"14px",boxShadow:`0 2px 10px ${OT.shadow}`,transition:"all 0.15s"}}>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"3px",flexShrink:0}}>
                    <div style={{width:"28px",height:"28px",borderRadius:"50%",background:s.farbe,border:"2px solid rgba(0,0,0,0.08)",boxShadow:`0 2px 8px ${s.farbe}44`}}/>
                    <span style={{fontFamily:"Cinzel",fontSize:"11px",color:OT.textSoft,fontWeight:700}}>{s.nr}</span>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"Raleway",fontSize:"13px",color:OT.text,fontWeight:700,marginBottom:"2px"}}>{s.name}</div>
                    <div style={{fontFamily:"Raleway",fontSize:"11px",color:OT.textMid,fontWeight:500}}>{s.thema}</div>
                    <div style={{fontFamily:"Raleway",fontSize:"10px",color:OT.textSoft,fontWeight:500,marginTop:"2px"}}>{s.abstand}</div>
                  </div>
                  <span style={{color:OT.textSoft,fontSize:"18px"}}>›</span>
                </button>
              ))}
            </>
          )}
        </>
      )}

      {ansicht === "chirurgie" && (
        <>
          {technikSel !== null ? (
            <div>
              <button onClick={()=>setTechnikSel(null)} style={{fontFamily:"Raleway",fontSize:"13px",color:OT.teal,fontWeight:700,background:"none",border:"none",cursor:"pointer",marginBottom:"12px",display:"block"}}>← Alle Techniken</button>
              {(() => {
                const t = AURA_CHIRURGIE_TECHNIKEN[technikSel];
                return (
                  <OCard>
                    <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"14px"}}>
                      <span style={{fontSize:"32px"}}>{t.icon}</span>
                      <div>
                        <div style={{fontFamily:"Cinzel",fontSize:"16px",color:OT.text,fontWeight:700}}>{t.name}</div>
                        <div style={{fontFamily:"Raleway",fontSize:"11px",color:OT.textMid,fontWeight:600}}>{t.anwendung}</div>
                      </div>
                    </div>
                    <div style={{fontFamily:"Raleway",fontSize:"13px",color:OT.text,lineHeight:"1.75",fontWeight:500,marginBottom:"14px",padding:"12px",background:OT.bgSoft,borderRadius:"10px"}}>{t.beschreibung}</div>
                    <OLabel color={OT.tealD}>Schritt-für-Schritt</OLabel>
                    <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                      {t.schritte.map((schritt, i) => (
                        <div key={i} style={{display:"flex",alignItems:"flex-start",gap:"10px",padding:"8px 12px",background:"white",borderRadius:"10px",border:`1px solid ${OT.border}`}}>
                          <span style={{fontFamily:"Cinzel",fontSize:"12px",color:OT.teal,fontWeight:700,flexShrink:0,marginTop:"1px"}}>{i+1}.</span>
                          <span style={{fontFamily:"Raleway",fontSize:"12px",color:OT.text,fontWeight:500,lineHeight:"1.6"}}>{schritt}</span>
                        </div>
                      ))}
                    </div>
                  </OCard>
                );
              })()}
            </div>
          ) : (
            <>
              <OCard style={{background:`linear-gradient(135deg,#FDE68A,${OT.violetL})`,padding:"16px"}}>
                <div style={{fontFamily:"Cinzel",fontSize:"15px",color:OT.text,fontWeight:700,marginBottom:"4px"}}>Aura-Chirurgie Techniken</div>
                <div style={{fontFamily:"Raleway",fontSize:"12px",color:OT.textMid,fontWeight:500}}>Präzise energetische Eingriffe. Nur nach fundierter Ausbildung anwenden. Stufe 3–5.</div>
              </OCard>
              {AURA_CHIRURGIE_TECHNIKEN.map((t, idx) => (
                <button key={idx} onClick={()=>setTechnikSel(idx)} style={{background:"white",borderRadius:"14px",padding:"14px 16px",border:`1.5px solid ${OT.border}`,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:"12px",boxShadow:`0 2px 10px ${OT.shadow}`,transition:"all 0.15s"}}>
                  <span style={{fontSize:"28px",flexShrink:0}}>{t.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"Raleway",fontSize:"13px",color:OT.text,fontWeight:700,marginBottom:"3px"}}>{t.name}</div>
                    <div style={{fontFamily:"Raleway",fontSize:"11px",color:OT.textMid,fontWeight:500}}>{t.anwendung}</div>
                  </div>
                  <span style={{color:OT.textSoft,fontSize:"18px"}}>›</span>
                </button>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  CHAKREN-MATRIX
// ════════════════════════════════════════════════════════════════
function ChakraMatrix({ groqFetch }) {
  const [gewaehltes, setGewaehltes] = useState(null);
  const [kiDetail, setKiDetail]     = useState("");
  const [kiLaed, setKiLaed]         = useState(false);
  const [status, setStatus]         = useState({}); // chakra.id -> "ok"|"block"|"uber"

  const statusLabels = { ok:"✓ Aktiv", block:"▼ Blockiert", uber:"▲ Überaktiv" };
  const statusColors = { ok:{bg:"#DCFCE7",color:"#16A34A"}, block:{bg:"#FEE2E2",color:"#9B1C1C"}, uber:{bg:"#FEF3C7",color:"#92400E"} };

  const ladeKiDetail = async (chakra) => {
    if (!groqFetch) return;
    setKiLaed(true); setKiDetail("");
    const st = status[chakra.id] || "unbekannt";
    const prompt = `Du bist ein Chakra-Spezialist. Analysiere dieses Chakra praxisnah.

Chakra: ${chakra.name} (${chakra.de}) · Nr. ${chakra.nr}
Status laut Scan: ${statusLabels[st]||st}
Mantra: ${chakra.mantra} · ${chakra.hz} Hz
Themen: ${chakra.themen.join(", ")}
Mögliche Blockaden: ${chakra.emotion_block.join(", ")}
Verbundene Organe: ${chakra.organe.slice(0,5).join(", ")}

Antworte in diesen Abschnitten (kurz & präzise):

🎯 WAS JETZT ZU TUN IST (je nach Status: ${statusLabels[st]||"unbekannt"})
[2-3 konkrete Schritte für diese Sitzung]

💬 WAS DER KLIENT MÖGLICHERWEISE ERLEBT
[3-4 Sätze zu Symptomen/Gefühlen/Mustern]

🌟 HEILUNGSIMPULSE
[3 spezifische Techniken mit kurzer Erklärung]

⚡ VERBINDUNG ZU ANDEREN CHAKREN
[Mit welchen anderen Chakren interagiert dieses? Was sind typische Ketten-Reaktionen?]`;

    try { setKiDetail(await groqFetch(prompt)); }
    catch { setKiDetail("Fehler."); }
    setKiLaed(false);
  };

  const toggleStatus = (id) => {
    const reihe = [undefined, "ok", "block", "uber"];
    const aktuell = status[id];
    const next = reihe[(reihe.indexOf(aktuell)+1) % reihe.length];
    setStatus(s => ({...s, [id]: next}));
  };

  if (gewaehltes) {
    return (
      <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
        <button onClick={()=>{setGewaehltes(null);setKiDetail("");}} style={{fontFamily:"Raleway",fontSize:"13px",color:OT.teal,fontWeight:700,background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>← Alle Chakren</button>
        <OCard style={{background:`linear-gradient(135deg,${gewaehltes.hex}22,${OT.violetL})`,border:`1.5px solid ${gewaehltes.hex}44`}}>
          <div style={{display:"flex",alignItems:"center",gap:"14px",marginBottom:"14px"}}>
            <div style={{width:"48px",height:"48px",borderRadius:"50%",background:gewaehltes.hex,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 4px 16px ${gewaehltes.hex}55`,flexShrink:0}}>
              <span style={{fontFamily:"Cinzel",fontSize:"20px",color:"white",fontWeight:700}}>{gewaehltes.symbol}</span>
            </div>
            <div>
              <div style={{fontFamily:"Cinzel",fontSize:"18px",color:OT.text,fontWeight:700}}>{gewaehltes.name}</div>
              <div style={{fontFamily:"Raleway",fontSize:"11px",color:OT.textMid,fontWeight:600}}>{gewaehltes.de} · {gewaehltes.mantra} · {gewaehltes.hz} Hz</div>
            </div>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:"12px"}}>
            {gewaehltes.themen.map(t=><span key={t} style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:700,padding:"4px 10px",borderRadius:"10px",background:"rgba(255,255,255,0.85)",color:gewaehltes.hex,border:`1px solid ${gewaehltes.hex}44`}}>{t}</span>)}
          </div>
          <div style={{marginBottom:"12px"}}>
            <OLabel color="#C0392B">Blockaden-Muster</OLabel>
            <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
              {gewaehltes.emotion_block.map(e=><span key={e} style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:700,padding:"4px 10px",borderRadius:"10px",background:"#FEE2E2",color:"#9B1C1C"}}>{e}</span>)}
            </div>
          </div>
          <div>
            <OLabel color={OT.tealD}>Organe & Körperzonen</OLabel>
            <div style={{fontFamily:"Raleway",fontSize:"12px",color:OT.textMid,fontWeight:500}}>{gewaehltes.organe.join(" · ")}</div>
          </div>
        </OCard>
        <OCard>
          <OLabel color={OT.tealD}>Lernpfad</OLabel>
          <div style={{fontFamily:"Raleway",fontSize:"13px",color:OT.text,lineHeight:"1.8",fontWeight:500,marginBottom:"10px"}}>{gewaehltes.lernpfad_soft}</div>
          <div style={{background:OT.violetL,padding:"12px",borderRadius:"12px",border:`1px solid ${OT.violet}33`}}>
            <div style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:800,color:OT.violetD,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:"6px"}}>🎓 Vertiefung</div>
            <div style={{fontFamily:"Raleway",fontSize:"12px",color:OT.text,lineHeight:"1.8",fontWeight:500}}>{gewaehltes.lernpfad_deep}</div>
          </div>
        </OCard>
        <OCard>
          <OLabel color={OT.violetD}>✦ KI-Sitzungsanalyse</OLabel>
          {kiLaed ? <div style={{textAlign:"center",padding:"20px",fontFamily:"Raleway",fontSize:"13px",color:OT.textMid}}>⏳ Analysiere...</div>
          : kiDetail ? <div style={{fontFamily:"Raleway",fontSize:"13px",color:OT.text,lineHeight:"1.9",whiteSpace:"pre-wrap",fontWeight:500}}>{kiDetail}</div>
          : <OBtn onClick={()=>ladeKiDetail(gewaehltes)}>✦ KI-Analyse für diese Sitzung</OBtn>}
        </OCard>
      </div>
    );
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
      <OCard style={{background:`linear-gradient(135deg,${OT.violetL},${OT.tealL})`,padding:"16px"}}>
        <div style={{fontFamily:"Cinzel",fontSize:"15px",color:OT.text,fontWeight:700,marginBottom:"4px"}}>Chakren-Matrix</div>
        <div style={{fontFamily:"Raleway",fontSize:"12px",color:OT.textMid,fontWeight:500}}>Tippe auf Status um Scan-Ergebnis zu vermerken · Dann KI-Analyse per Klick</div>
      </OCard>
      {CHAKRA_SYSTEM.map(chakra => {
        const st = status[chakra.id];
        const sc = st ? statusColors[st] : null;
        return (
          <div key={chakra.id} style={{background:"white",borderRadius:"14px",padding:"14px 16px",border:`1.5px solid ${st?chakra.hex+"44":OT.border}`,boxShadow:`0 2px 10px ${OT.shadow}`,display:"flex",alignItems:"center",gap:"14px"}}>
            <button onClick={()=>setGewaehltes(chakra)} style={{display:"flex",alignItems:"center",gap:"12px",flex:1,background:"none",border:"none",cursor:"pointer",textAlign:"left",padding:0}}>
              <div style={{width:"38px",height:"38px",borderRadius:"50%",background:chakra.hex,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 3px 10px ${chakra.hex}44`,flexShrink:0}}>
                <span style={{fontFamily:"Cinzel",fontSize:"16px",color:"white",fontWeight:700}}>{chakra.symbol}</span>
              </div>
              <div>
                <div style={{fontFamily:"Raleway",fontSize:"13px",color:OT.text,fontWeight:700}}>{chakra.name}</div>
                <div style={{fontFamily:"Raleway",fontSize:"10px",color:OT.textSoft,fontWeight:500}}>{chakra.themen.slice(0,3).join(" · ")}</div>
              </div>
            </button>
            <button onClick={()=>toggleStatus(chakra.id)} style={{padding:"6px 12px",borderRadius:"10px",border:`1.5px solid ${sc?sc.color:OT.border}`,background:sc?sc.bg:OT.bgSofter,color:sc?sc.color:OT.textSoft,fontFamily:"Raleway",fontSize:"10px",fontWeight:700,cursor:"pointer",flexShrink:0,minWidth:"72px",textAlign:"center"}}>
              {sc?statusLabels[st]:"— Scan"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  HEILUNGS-GUIDE
// ════════════════════════════════════════════════════════════════
function HeilungsGuide({ groqFetch }) {
  const [gewaehlt, setGewaehlt] = useState(null);
  const [kiDetail, setKiDetail] = useState("");
  const [kiLaed, setKiLaed]     = useState(false);

  const ladeKiDetail = async (methode) => {
    if (!groqFetch) return;
    setKiLaed(true); setKiDetail("");
    const prompt = `Du bist ein erfahrener energetischer Heiler und erklärst diese Heilmethode für den praktischen Einsatz.

Methode: ${methode.name} (${methode.kategorie})
Beschreibung: ${methode.beschreibung}
Anwendungsgebiet: ${methode.anwendung}

Gib eine PRAXISANLEITUNG:

🎯 WANN GENAU ANWENDEN
[Konkrete Indikatoren, wann diese Methode die richtige ist - inkl. Kontraindikationen]

⚡ SCHRITT-FÜR-SCHRITT ANLEITUNG 
[Detaillierte Anleitung in Schritten]

💬 KOMMUNIKATION MIT DEM KLIENTEN
[Was sagst du dem Klienten vorher / während / nachher? Wie erklärst du es?]

🌟 INTEGRATION NACH DER SITZUNG
[Was empfiehlst du dem Klienten mitzunehmen / zu üben?]

⚠️ WICHTIGE HINWEISE
[Sicherheit, Grenzen, wann zur Begleitung durch andere Fachleute verweisen]`;

    try { setKiDetail(await groqFetch(prompt)); }
    catch { setKiDetail("Fehler."); }
    setKiLaed(false);
  };

  if (gewaehlt) {
    return (
      <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
        <button onClick={()=>{setGewaehlt(null);setKiDetail("");}} style={{fontFamily:"Raleway",fontSize:"13px",color:OT.teal,fontWeight:700,background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>← Alle Methoden</button>
        <OCard style={{background:`linear-gradient(135deg,${OT.tealL},${OT.violetL})`,border:`1.5px solid ${OT.borderMid}`}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"14px"}}>
            <span style={{fontSize:"36px"}}>{gewaehlt.icon}</span>
            <div>
              <div style={{fontFamily:"Cinzel",fontSize:"18px",color:OT.text,fontWeight:700}}>{gewaehlt.name}</div>
              <div style={{fontFamily:"Raleway",fontSize:"11px",color:OT.textMid,fontWeight:600}}>{gewaehlt.kategorie} · Stufe {gewaehlt.stufe}/5</div>
            </div>
          </div>
          <div style={{fontFamily:"Raleway",fontSize:"13px",color:OT.text,lineHeight:"1.75",fontWeight:500,marginBottom:"12px"}}>{gewaehlt.beschreibung}</div>
          <OLabel>Anwendungsgebiet</OLabel>
          <div style={{fontFamily:"Raleway",fontSize:"12px",color:OT.textMid,fontWeight:500,marginBottom:"12px"}}>{gewaehlt.anwendung}</div>
          <OLabel color={OT.tealD}>Basis-Ablauf</OLabel>
          <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
            {gewaehlt.ablauf.map((s,i)=>(
              <div key={i} style={{display:"flex",gap:"10px",padding:"8px 12px",background:"rgba(255,255,255,0.8)",borderRadius:"10px"}}>
                <span style={{fontFamily:"Cinzel",fontSize:"12px",color:OT.teal,fontWeight:700,flexShrink:0}}>{i+1}.</span>
                <span style={{fontFamily:"Raleway",fontSize:"12px",color:OT.text,fontWeight:500}}>{s}</span>
              </div>
            ))}
          </div>
        </OCard>
        <OCard>
          <OLabel color={OT.violetD}>✦ KI-Praxisanleitung (detailliert)</OLabel>
          {kiLaed ? <div style={{textAlign:"center",padding:"24px",fontFamily:"Raleway",fontSize:"13px",color:OT.textMid}}>⏳ Lade Praxiswissen...</div>
          : kiDetail ? <div style={{fontFamily:"Raleway",fontSize:"13px",color:OT.text,lineHeight:"1.9",whiteSpace:"pre-wrap",fontWeight:500}}>{kiDetail}</div>
          : <OBtn onClick={()=>ladeKiDetail(gewaehlt)}>✦ Detaillierte Praxisanleitung laden</OBtn>}
        </OCard>
      </div>
    );
  }

  const kategorien = [...new Set(HEILMETHODEN_KATALOG.map(m=>m.kategorie))];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
      <OCard style={{background:`linear-gradient(135deg,${OT.tealL},${OT.violetL})`,padding:"16px"}}>
        <div style={{fontFamily:"Cinzel",fontSize:"15px",color:OT.text,fontWeight:700,marginBottom:"4px"}}>Heilungs-Guide</div>
        <div style={{fontFamily:"Raleway",fontSize:"12px",color:OT.textMid,fontWeight:500}}>Priorisiert: Energetische Heilung zuerst. KI gibt detaillierte Praxisanleitungen.</div>
      </OCard>
      {kategorien.map(kat => (
        <div key={kat}>
          <OLabel>{kat}</OLabel>
          <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
            {HEILMETHODEN_KATALOG.filter(m=>m.kategorie===kat).map(methode => (
              <button key={methode.id} onClick={()=>{setGewaehlt(methode);ladeKiDetail(methode);}} style={{background:"white",borderRadius:"14px",padding:"14px 16px",border:`1.5px solid ${OT.border}`,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:"12px",boxShadow:`0 2px 10px ${OT.shadow}`,transition:"all 0.15s"}}>
                <span style={{fontSize:"26px",flexShrink:0}}>{methode.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"Raleway",fontSize:"13px",color:OT.text,fontWeight:700,marginBottom:"2px"}}>{methode.name}</div>
                  <div style={{fontFamily:"Raleway",fontSize:"11px",color:OT.textMid,fontWeight:500,marginBottom:"4px"}}>{methode.anwendung.split(",")[0]}...</div>
                  <div style={{display:"flex",gap:"4px"}}>
                    {Array.from({length:5},(_,i)=>(
                      <div key={i} style={{width:"12px",height:"4px",borderRadius:"2px",background:i<methode.stufe?OT.violet:OT.border}}/>
                    ))}
                    <span style={{fontFamily:"Raleway",fontSize:"9px",color:OT.textSoft,fontWeight:600,marginLeft:"4px"}}>Stufe {methode.stufe}</span>
                  </div>
                </div>
                <span style={{color:OT.textSoft,fontSize:"18px"}}>›</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  LERNPFAD
// ════════════════════════════════════════════════════════════════
function Lernpfad({ groqFetch }) {
  const [gewStufe, setGewStufe]   = useState(null);
  const [gewThema, setGewThema]   = useState(null);
  const [kiInhalt, setKiInhalt]   = useState("");
  const [kiLaed, setKiLaed]       = useState(false);

  const THEMEN = [
    {id:"organsprache", name:"Organsprache", icon:"🫀"},
    {id:"chakren", name:"Chakralehre", icon:"🌈"},
    {id:"aura", name:"Aura & Feinstoff", icon:"🌐"},
    {id:"ahnen", name:"Ahnen & DNA", icon:"🧬"},
    {id:"hellsinne", name:"Hellsinne", icon:"👁️"},
    {id:"aura_chirurgie", name:"Aura-Chirurgie", icon:"✂️"},
    {id:"fernheilung", name:"Fernheilung", icon:"🌐"},
    {id:"lichtsprache", name:"Licht-Sprache", icon:"✨"},
    {id:"humandesign", name:"Human Design", icon:"⚙️"},
    {id:"schamanismus", name:"Schamanismus", icon:"🪶"},
    {id:"meridiane", name:"Meridiane & TCM", icon:"🌊"},
    {id:"kristalle", name:"Kristallarbeit", icon:"💎"},
  ];

  const ladeKiInhalt = async (thema, stufe) => {
    if (!groqFetch) { setKiInhalt("⚠️ API nicht verbunden."); return; }
    setKiLaed(true); setKiInhalt("");
    const stufenNamen = {1:"Einführung",2:"Grundlagen",3:"Vertiefung",4:"Meisterschaft",5:"Zertifizierungswissen"};
    const prompt = `Du bist Leiter der Resonanz Akademie und vermittelst professionelles energetisches Heiler-Wissen.

Thema: ${thema.name}
Lernstufe: ${stufenNamen[stufe]} (${stufe}/5)

Erstelle einen LEHRINHALT in dieser Struktur:

📚 KERNWISSEN FÜR DIESE STUFE
[Essentielles Wissen das auf dieser Stufe vermittelt wird - 3-5 Kernpunkte]

🎯 PRAXISÜBUNGEN
[2-3 konkrete Übungen die der Lernende jetzt durchführen kann]

${stufe >= 3 ? `⚡ FORTGESCHRITTENE TECHNIKEN\n[Auf dieser Stufe spezifische Techniken und Vertiefungen]\n` : ""}
${stufe >= 4 ? `🔮 MEISTERSCHAFTSWISSEN\n[Was unterscheidet einen Meister von einem Fortgeschrittenen?]\n` : ""}

💬 TYPISCHE FRAGEN AUF DIESER STUFE
[3 Fragen die Lernende auf dieser Stufe häufig stellen, mit Antworten]

🌟 NÄCHSTE SCHRITTE
[Was kommt als nächstes? Wie geht die Lernreise weiter?]

Schreibe klar, strukturiert und inspirierend. Auf Deutsch.`;

    try { setKiInhalt(await groqFetch(prompt)); }
    catch { setKiInhalt("Fehler beim Laden."); }
    setKiLaed(false);
  };

  if (gewThema && gewStufe) {
    return (
      <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
        <button onClick={()=>{setGewThema(null);setGewStufe(null);setKiInhalt("");}} style={{fontFamily:"Raleway",fontSize:"13px",color:OT.teal,fontWeight:700,background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>← Zurück</button>
        <OCard style={{background:`linear-gradient(135deg,${OT.tealL},${OT.violetL})`,border:`1.5px solid ${OT.borderMid}`}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            <span style={{fontSize:"32px"}}>{gewThema.icon}</span>
            <div>
              <div style={{fontFamily:"Cinzel",fontSize:"18px",color:OT.text,fontWeight:700}}>{gewThema.name}</div>
              <div style={{display:"flex",alignItems:"center",gap:"6px",marginTop:"4px"}}>
                <div style={{width:"12px",height:"12px",borderRadius:"50%",background:LERNPFAD_STUFEN[gewStufe-1].farbe}}/>
                <span style={{fontFamily:"Raleway",fontSize:"12px",color:OT.textMid,fontWeight:700}}>{LERNPFAD_STUFEN[gewStufe-1].icon} Stufe {gewStufe}: {LERNPFAD_STUFEN[gewStufe-1].name}</span>
              </div>
            </div>
          </div>
        </OCard>
        <OCard>
          {kiLaed ? (
            <div style={{textAlign:"center",padding:"36px"}}>
              <div style={{fontSize:"32px",marginBottom:"14px"}}>📚</div>
              <div style={{fontFamily:"Raleway",fontSize:"13px",color:OT.textMid,fontWeight:600}}>Lerninhalt wird generiert...</div>
            </div>
          ) : kiInhalt ? (
            <div style={{fontFamily:"Raleway",fontSize:"13px",color:OT.text,lineHeight:"1.95",whiteSpace:"pre-wrap",fontWeight:500}}>{kiInhalt}</div>
          ) : (
            <OBtn onClick={()=>ladeKiInhalt(gewThema,gewStufe)}>📚 Lerninhalt laden</OBtn>
          )}
        </OCard>
      </div>
    );
  }

  if (gewThema) {
    return (
      <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
        <button onClick={()=>setGewThema(null)} style={{fontFamily:"Raleway",fontSize:"13px",color:OT.teal,fontWeight:700,background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>← Themen</button>
        <OCard style={{background:`linear-gradient(135deg,${OT.tealL},${OT.violetL})`,padding:"16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"6px"}}>
            <span style={{fontSize:"28px"}}>{gewThema.icon}</span>
            <div style={{fontFamily:"Cinzel",fontSize:"16px",color:OT.text,fontWeight:700}}>{gewThema.name}</div>
          </div>
          <div style={{fontFamily:"Raleway",fontSize:"12px",color:OT.textMid,fontWeight:500}}>Wähle deine Lernstufe</div>
        </OCard>
        {LERNPFAD_STUFEN.map(stufe => (
          <button key={stufe.nr} onClick={()=>{setGewStufe(stufe.nr);ladeKiInhalt(gewThema,stufe.nr);}} style={{background:"white",borderRadius:"14px",padding:"16px",border:`1.5px solid ${stufe.farbe}44`,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:"14px",boxShadow:`0 2px 10px ${OT.shadow}`,transition:"all 0.15s"}}>
            <div style={{width:"42px",height:"42px",borderRadius:"50%",background:stufe.farbe,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",flexShrink:0,boxShadow:`0 3px 12px ${stufe.farbe}44`}}>
              {stufe.icon}
            </div>
            <div style={{flex:1}}>
              <div style={{fontFamily:"Raleway",fontSize:"13px",color:OT.text,fontWeight:700,marginBottom:"3px"}}>Stufe {stufe.nr}: {stufe.name}</div>
              <div style={{fontFamily:"Raleway",fontSize:"11px",color:OT.textMid,fontWeight:500}}>{stufe.beschreibung}</div>
            </div>
            <span style={{color:OT.textSoft,fontSize:"18px"}}>›</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
      <OCard style={{background:`linear-gradient(135deg,${OT.goldL},${OT.violetL})`,padding:"16px"}}>
        <div style={{fontFamily:"Cinzel",fontSize:"15px",color:OT.text,fontWeight:700,marginBottom:"4px"}}>🏆 Resonanz Akademie · Lernpfad</div>
        <div style={{fontFamily:"Raleway",fontSize:"12px",color:OT.textMid,fontWeight:500}}>Von Einführung bis Zertifizierung. KI generiert individuellen Lerninhalt für deine Stufe.</div>
        <div style={{display:"flex",gap:"6px",marginTop:"10px",flexWrap:"wrap"}}>
          {LERNPFAD_STUFEN.map(s=>(
            <div key={s.nr} style={{display:"flex",alignItems:"center",gap:"4px",padding:"4px 10px",borderRadius:"10px",background:"rgba(255,255,255,0.8)",border:`1px solid ${s.farbe}44`}}>
              <div style={{width:"8px",height:"8px",borderRadius:"50%",background:s.farbe}}/>
              <span style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:700,color:s.farbe}}>{s.name}</span>
            </div>
          ))}
        </div>
      </OCard>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
        {THEMEN.map(thema=>(
          <button key={thema.id} onClick={()=>setGewThema(thema)} style={{background:"white",borderRadius:"14px",padding:"16px",border:`1.5px solid ${OT.border}`,cursor:"pointer",textAlign:"left",boxShadow:`0 2px 10px ${OT.shadow}`,transition:"all 0.15s",display:"flex",flexDirection:"column",gap:"8px"}}>
            <span style={{fontSize:"28px"}}>{thema.icon}</span>
            <div style={{fontFamily:"Raleway",fontSize:"12px",color:OT.text,fontWeight:700,lineHeight:"1.3"}}>{thema.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  RESONANZ ORACLE · HAUPT-KOMPONENTE
// ════════════════════════════════════════════════════════════════
function ResonanzOracle({ groqFetch }) {
  const [aktiv, setAktiv] = useState("scanner");

  const TABS = [
    { id:"scanner",    icon:"💫", label:"Hellsinn-Scanner" },
    { id:"organmap",   icon:"🫀", label:"Organsprache"    },
    { id:"chakra",     icon:"🌈", label:"Chakren"         },
    { id:"aura",       icon:"🌐", label:"Aura & Chirurgie"},
    { id:"heilung",    icon:"💚", label:"Heilungs-Guide"  },
    { id:"lernpfad",   icon:"🏆", label:"Lernpfad"        },
  ];

  useEffect(() => {
    if (!document.querySelector("#oracle-fonts")) {
      const l = document.createElement("link");
      l.id = "oracle-fonts";
      l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Raleway:wght@400;500;600;700;800&display=swap";
      document.head.appendChild(l);
    }
  }, []);

  return (
    <div style={{background:OT.bg,minHeight:"100%",paddingBottom:"40px"}}>
      {/* Hero */}
      <div style={{position:"relative",margin:"0 0 20px",padding:"26px 20px 22px",background:`linear-gradient(145deg,${OT.tealL} 0%,#FFFFFF 45%,${OT.violetL} 100%)`,borderBottom:`1.5px solid ${OT.border}`,overflow:"hidden"}}>
        <div style={{position:"absolute",top:-60,right:-60,width:"200px",height:"200px",borderRadius:"50%",background:`radial-gradient(circle,${OT.violetL} 0%,transparent 70%)`,opacity:0.6,pointerEvents:"none"}}/>
        <div style={{position:"relative",zIndex:1}}>
          <div style={{fontFamily:"Cinzel",fontSize:"22px",color:OT.text,fontWeight:700,letterSpacing:"2px",marginBottom:"4px"}}>✦ Resonanz Oracle</div>
          <div style={{fontFamily:"Raleway",fontSize:"10px",color:OT.textSoft,letterSpacing:"3px",fontWeight:700,textTransform:"uppercase"}}>KI als stiller Berater im Hintergrund</div>
          <div style={{fontFamily:"Raleway",fontSize:"12px",color:OT.textMid,fontWeight:500,marginTop:"8px",lineHeight:"1.6"}}>Organsprache · Chakren · Aura-Chirurgie · Heilungs-Guide · Lernpfad</div>
        </div>
      </div>

      {/* Tab-Navigation (horizontal scrollbar) */}
      <div style={{overflowX:"auto",paddingBottom:"2px"}}>
        <div style={{display:"flex",gap:"6px",padding:"0 16px",minWidth:"max-content"}}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={()=>setAktiv(tab.id)} style={{display:"flex",alignItems:"center",gap:"6px",padding:"9px 14px",borderRadius:"20px",border:`1.5px solid ${aktiv===tab.id?OT.teal:OT.border}`,background:aktiv===tab.id?OT.teal:"white",color:aktiv===tab.id?"white":OT.textMid,fontFamily:"Raleway",fontSize:"11px",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",boxShadow:aktiv===tab.id?`0 3px 12px rgba(13,148,136,0.3)`:"none",transition:"all 0.15s"}}>
              <span>{tab.icon}</span><span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Inhalt */}
      <div style={{padding:"16px 16px 0"}}>
        {aktiv === "scanner"  && <HellsinnScanner groqFetch={groqFetch}/>}
        {aktiv === "organmap" && <OrganspracheKarte groqFetch={groqFetch}/>}
        {aktiv === "chakra"   && <ChakraMatrix groqFetch={groqFetch}/>}
        {aktiv === "aura"     && <AuraChirurgie groqFetch={groqFetch}/>}
        {aktiv === "heilung"  && <HeilungsGuide groqFetch={groqFetch}/>}
        {aktiv === "lernpfad" && <Lernpfad groqFetch={groqFetch}/>}
      </div>

      {/* Disclaimer */}
      <div style={{textAlign:"center",padding:"32px 20px 0",fontFamily:"Raleway",fontSize:"9px",color:OT.textSoft,letterSpacing:"1px",fontWeight:600,lineHeight:"2"}}>
        LICHTKERN · RESONANZ ORACLE · powered by Human Resonanz<br/>
        Kein Ersatz für medizinische oder therapeutische Behandlung
      </div>
    </div>
  );
}

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


// ─── WELCOME SETUP ────────────────────────────
function WelcomeSetup({onComplete}){
  const [selected,setSelected]=useState([]);
  const MODULES=[
    {id:"heilarbeit", icon:"🌿", title:"Heilarbeit & Energie",     desc:"Energetische Arbeit, Human Design, Generationsthemen"},
    {id:"massage",    icon:"💆", title:"Massage & Körperarbeit",   desc:"Behandlungsprotokolle, Körpertherapie"},
    {id:"coaching",   icon:"🧠", title:"Coaching & Beratung",      desc:"Zielarbeit, Ressourcen, Persönlichkeitsentwicklung"},
    {id:"paedagogik", icon:"👨‍👩‍👧", title:"Pädagogik & Familie",     desc:"Eltern-Coaching, Lernbegleitung"},
    {id:"b2b",        icon:"👥", title:"B2B / Teams",              desc:"Teamanalyse, Unternehmensberatung, HR"},
    {id:"allgemein",  icon:"📋", title:"Allgemeine Praxis",        desc:"Klassische Praxisverwaltung"},
  ];
  const toggle=id=>setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);
  return(
    <div style={{position:"fixed",inset:0,background:"linear-gradient(145deg,#E8F8F5 0%,#F8FAFF 50%,#F0EBF8 100%)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",overflowY:"auto"}}>
      <div style={{maxWidth:"640px",width:"100%",textAlign:"center",padding:"20px 0"}}>
        <div style={{fontFamily:"Cinzel",fontSize:"32px",color:"#0F4F4A",fontWeight:700,letterSpacing:"4px",marginBottom:"6px"}}>✦ LICHTKERN</div>
        <div style={{fontFamily:"Raleway",fontSize:"10px",color:"#6AABA7",letterSpacing:"4px",textTransform:"uppercase",fontWeight:700,marginBottom:"32px"}}>Human Resonanz</div>
        <div style={{background:"rgba(255,255,255,0.85)",borderRadius:"24px",padding:"32px",boxShadow:"0 8px 40px rgba(13,148,136,0.12)",border:"1.5px solid rgba(13,148,136,0.15)",backdropFilter:"blur(20px)"}}>
          <div style={{fontFamily:"Cinzel",fontSize:"20px",color:"#0F4F4A",fontWeight:700,marginBottom:"8px"}}>Willkommen! Wie nutzt du Lichtkern?</div>
          <div style={{fontFamily:"Raleway",fontSize:"13px",color:"#6B7280",marginBottom:"24px",lineHeight:1.6}}>Wähle deine Schwerpunkte — jederzeit in den Einstellungen anpassbar.</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"24px",textAlign:"left"}}>
            {MODULES.map(m=>{
              const sel=selected.includes(m.id);
              return(
                <button key={m.id} onClick={()=>toggle(m.id)} style={{padding:"16px",borderRadius:"16px",border:`2px solid ${sel?"#0D9488":"rgba(13,148,136,0.18)"}`,background:sel?"rgba(13,148,136,0.07)":"rgba(255,255,255,0.7)",cursor:"pointer",textAlign:"left",transition:"all 0.2s",boxShadow:sel?"0 4px 16px rgba(13,148,136,0.18)":"none"}}>
                  <div style={{fontSize:"22px",marginBottom:"5px"}}>{m.icon}</div>
                  <div style={{fontFamily:"Raleway",fontSize:"13px",fontWeight:700,color:sel?"#0F4F4A":"#374151",marginBottom:"3px"}}>{m.title}</div>
                  <div style={{fontFamily:"Raleway",fontSize:"11px",color:"#9CA3AF",lineHeight:1.4}}>{m.desc}</div>
                  {sel&&<div style={{marginTop:"6px",fontFamily:"Raleway",fontSize:"10px",color:"#0D9488",fontWeight:700,letterSpacing:"1px"}}>✓ AKTIV</div>}
                </button>
              );
            })}
          </div>
          <button onClick={()=>onComplete(selected.length>0?selected:["allgemein"])}
            style={{width:"100%",padding:"15px",borderRadius:"14px",background:selected.length>0?"linear-gradient(135deg,#0D9488,#0B6E63)":"#E5E7EB",color:selected.length>0?"white":"#9CA3AF",fontFamily:"Raleway",fontWeight:700,fontSize:"15px",border:"none",cursor:selected.length>0?"pointer":"default",letterSpacing:"0.5px",transition:"all 0.2s"}}>
            {selected.length>0?`Loslegen →`:"Bitte mindestens ein Modul wählen"}
          </button>
          <div style={{marginTop:"10px",fontFamily:"Raleway",fontSize:"11px",color:"#9CA3AF"}}>Module lassen sich jederzeit in den Einstellungen ändern.</div>
        </div>
      </div>
    </div>
  );
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
  const [settings,setSettings]       = useState({theme:'kristallwasser',currency:'CHF',defaultDuration:'60',autoLock:'5',pinEnabled:false,praxisname:'',subtitle:'',therapistName:'',defaultFee:'',disclaimer:'',modules:[],setupDone:false});
  const [showSettings,setShowSettings] = useState(false);
  const [locked,setLocked]           = useState(false);
  const [ready,setReady]             = useState(false);
  const [isDesktop, setIsDesktop]    = useState(window.innerWidth >= 900);

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

  if(locked)return<PinLock mode="enter" onSuccess={()=>setLocked(false)} onSetup={()=>{}}/>;
  if(!ready)return(<div style={{background:T.bg,height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"16px"}}>
    <div style={{width:"70px",height:"70px",borderRadius:"50%",background:`linear-gradient(135deg,${T.tealL},${T.violetL})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"30px",boxShadow:`0 6px 28px ${T.shadowDeep}`,border:`1.5px solid ${T.border}`}}>✦</div>
    <div style={{fontFamily:"Raleway",fontSize:"12px",color:T.textMid,letterSpacing:"3px",fontWeight:700}}>LICHTKERN</div>
  </div>);

  if(!settings.setupDone) return(<WelcomeSetup onComplete={async(modules)=>{const newS={...settings,modules,setupDone:true};await saveSettings(newS);}}/>);

  return(<div style={{background:T.bg,minHeight:"100vh",display:"flex",flexDirection:"row"}}>
    {/* Desktop sidebar */}
    {isDesktop && (
      <div style={{width:"260px",flexShrink:0,background:"rgba(242,251,250,0.99)",borderRight:`1.5px solid rgba(13,148,136,0.12)`,display:"flex",flexDirection:"column",position:"fixed",top:0,left:0,bottom:0,zIndex:100,backdropFilter:"blur(20px)",boxShadow:"2px 0 24px rgba(13,148,136,0.06)"}}>
        {/* Nav items */}
        <div style={{padding:"24px 14px 4px",flex:1,display:"flex",flexDirection:"column",gap:"3px",overflowY:"auto"}}>
          {NAV.filter(n=>n.id!=="session").map(item=>{
            const isA=screen===item.id;
            return(
              <React.Fragment key={item.id}>
              <button onClick={()=>nav(item.id)} style={{display:"flex",alignItems:"center",gap:"13px",padding:"12px 14px",borderRadius:"14px",border:"none",background:isA?T.tealL:"transparent",color:isA?T.tealD:T.textMid,cursor:"pointer",fontFamily:"Raleway",fontWeight:700,fontSize:"13px",textAlign:"left",boxShadow:isA?`0 2px 10px rgba(13,148,136,0.12)`:"none",transition:"all 0.15s"}}>
                <span style={{fontSize:"17px",width:"22px",textAlign:"center",opacity:isA?1:0.65}}>{item.icon}</span>
                <span>{item.label}</span>
                {isA&&<div style={{marginLeft:"auto",width:"6px",height:"6px",borderRadius:"50%",background:T.teal,flexShrink:0}}/>}
              </button>
              {item.id==="clients"&&<button onClick={()=>startSession()} style={{display:"flex",alignItems:"center",gap:"13px",padding:"12px 14px",borderRadius:"14px",border:"none",background:"transparent",color:T.textMid,cursor:"pointer",fontFamily:"Raleway",fontWeight:700,fontSize:"13px",textAlign:"left",transition:"all 0.15s"}}>
                <span style={{fontSize:"17px",width:"22px",textAlign:"center",opacity:0.65}}>✦</span>
                <span>Sitzung</span>
              </button>}
              </React.Fragment>
            );
          })}
        </div>
        {/* Settings bottom */}
        <div style={{padding:"12px 14px 24px",borderTop:`1.5px solid ${T.border}`}}>
          {/* Tree of Life - real image */}
          <div style={{display:"flex",justifyContent:"center",padding:"8px 0 14px",pointerEvents:"none"}}>
            <img src="data:image/jpeg;base64,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PoO/BBlFjcfQd+Cbj6DvwQZRY3H0Hfgm4+g78EGUWNx9B34JuPoO/BBlFjcfQd+Cbj6DvwQZRY3H0Hfgm4+g78EGUWNx9B34JuPoO/BBlFjcfQd+Cbj6DvwQZRY3H0Hfgm4+g78EGUWNx9B34JuPoO/BBlFjcfQd+Cbj6DvwQZRY3H0Hfgm4+g78EGUWNx9B34JuPoO/BBlFjcfQd+Cbj6DvwQZRY3H0Hfgm4+g78EGUWNx9B34JuPoO/BBlFjcfQd+Cbj6DvwQZRY3H0Hfgm4+g78EGUWNx9B34JuPoO/BBlFjcfQd+Cbj6DvwQZRY3H0Hfgm4+g78EGUWNx9B34JuPoO/BBlFjcfQd+Cbj6DvwQZRY3H0Hfgm4+g78EGUWNx9B34JuPoO/BBlFjcfQd+Cbj6DvwQZRY3H0Hfgm4+g78EGUWNx9B34JuPoO/BBlFjcfQd+Cbj6DvwQZRY3H0Hfgm4+g78EGUWNx9B34JuPoO/BBlFjcfQd+Cbj6DvwQZRY3H0Hfgm4+g78EGUWNx9B34JuPoO/BBlFjcfQd+Cbj6DvwQZRY3H0Hfgm4+g78EGUWNx9B34JuPoO/BBlFjcfQd+Cbj6DvwQZRY3H0Hfgm4+g78EGUWNx9B34JuPoO/BBlFjcfQd+Cbj6DvwQZRY3H0Hfgm4+g78EGUWNx9B34JuPoO/BBlFjcfQd+Cbj6DvwQZRY3H0Hfgm4+g78EGUWNx9B34JuPoO/BBlFjcfQd+Cbj6DvwQZRY3H0Hfgm4+g78EGUWNx9B34JuPoO/BBlFjcfQd+Cbj6DvwQZRY3H0Hfgm4+g78EGUWNx9B34JuPoO/BBlFjcfQd+Cbj6DvwQZRY3H0Hfgm4+g78EGUWNx9B34JuPoO/BBlFjcfQd+Cbj6DvwQZRY3H0Hfgm4+g78EGUWNx9B34JuPoO/BBlFjcfQd+Cbj6DvwQZRY3H0Hfgm4+g78EGUWNx9B34JuPoO/BBlFjcfQd+Cbj6DvwQZRY3H0Hfgm4+g78EGUWNx9B34JuPoO/BBlFjcfQd+Cbj6DvwQZRY3H0Hfgm4+g78EGUWNx9B34JuPoO/BBlFjcfQd+Cbj6DvwQZRY3H0Hfgm4+g78EGUWNx9B34JuPoO/BBlFjcfQd+Cbj6DvwQZRY3H0Hfgm4+g78EGUWNx9B34JuPoO/BBlFjcfQd+Cbj6DvwQZR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aIuMU9U6quUT2VkklQ9/GbwHPAcCSORaMeZd71XS1Nbpe7UVGSKmoopooSDjx3MIb+JCDrA1PqK9U0tx09TWegszHlsVwu8rwKgA43sY3GGE8gXOGeXJbCz6iusN+hsGqLdT0lXUxufR1VJK59PUloy5g3AOY8DntOcgHBXUb/SXTUngkoZNNXJzaVlDTwyW2KjbI4yMewOaXfCaWkcx/wAP0rb6lgr46nS9lrbuLteHXqOsZIKdsLmU8bSZCWt5Abctz5S/CD0BERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREEFd8n/xs/UFhZrvk/8AjZ+oLCAiIgIiICIiAiIgIiICIiCtav5XSfcs/SFZVa1fyuk+5Z+kKygq3W30V1t01vuNOyopZ27ZI39ThnP9DkA58mF13/V1pP5nX/8AmtV/7i7YiDU6d05abBx/4XDPHx9vE4tXLNnbnGOI52Os9WMrbIiAiIgYAJOBk9a196s1uvLYGXGGSaOCQStjEz2MLgQRua0gPAIBw4ELYIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiIC0Wt/wCVRffj9LlvVotb/wAqi+/H6XIN5H8W36gsrEfxbfqCygIiICIiAiIgIiICIiDg75RT/bP6XK2qjvlFP9s/pcraCOp+LH22/qCqS/Gu+tW6j4sfbb+oKpL8a761qly0uxxREW3EREQEREBEWEGURFbAseVZRBhZRELCIiKIiICIiAiLBQZXFwytJaNTUdy1bfdNwwTtqbK2mdPI8DY/jsc5u3BzyDTnIHX5V16r8KNkp7FeLmaG4yutt9dYm0scbXS1VUC0BsY3YIduzzI6j/UXh3Cqi3A8l5zr/wAGto1NO6ry6ir3cjURNBD/ALbf9r6+R6ufJbO4eEmmtejrtqG/acvVqNpqIqeqpJ42b3GRzGtfG8OMb2ZeMkO8h/rYptbWu63O+22w0s16qLRBBM8UUsLmz8bdhsbi8NyNhzuI+srrotNXoataibS4V0U1PKGeBGtM+11/hEXLxhSku+nlu/8AVekaA0DZ9LMMlJG+ase3bJUzYLyPMPI0fQPoznCqW/wmUE/g+uWuZ9N3qktNE3c0y8AvqMSuieGBshwWubg7tv0ZW0PhBs40vqDU1PR11TaLI5zDVxtbsrHM5ScDLhuDXeLuOASDgnC9en+pdo09OpXVh5JTEzFru500e0K0F0GTwk0tPoqTU9RYLlHGKyGjjpWz0skkr5XMa0gslLAMvA8ZwI8yiqfC3YqLR101JcLZdqRlpuYtdfSvjjfNDNuYCfEeWuaA8HLXHyrwO0TTD0NZwuvaU1fatS3a7UFrc+Zts6MXVA2mKZs8LZmOjIJyNrh1gLsSjcY4iIiKIiwgyiwSsZVGUJWESwIiKgiIgIiICJlYygysckWEBEWUGFNSfHj+qiwpqX48f1UnYsbVqm+TRfYH5KRR03yaL7A/JSLg7iItfV3yyUhrBVXi3wdBDHVnFqWN6OH/AADJk+Ju8mcZ8iDYEAjBAIPkKIOYyFXoq6hrjOKKsp6k08xgnEMrX8KQYyx2D4rhkZB580FhAAMkADPWoK6to6Cjnra6rp6Wlp2F8800gYyJoGS5zjyAA8pUsb2SRtkje17HAOa5pyCD1EFByWAACSAMnrKyiAiIg6xcdE22evnr7fX3WyVNS/fUOttUYmzO9JzCCwu+nGfpVzTul7XZKiWsg6TVV87AyatrJ3TTvaOYbud1D6BgfQt2iAiKvBXUM9bUUMFZTy1dKGmogZK0yRBwy3c0HLcgEjPWgsIiICIoLjW0duopq64VdPR0kLd8s88gjjjb53OPID60E6Lrc2v9BwU1HVTa201FBWhzqSV91gDagNcWOLCXYdhwLTjOCCF2RAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREEFd8n/AMbP1BYWa75P/jZ+oLCAiIgIiICIiAiIgIiICIiCtav5XSfcs/SFZVa1fyuk+5Z+kKygIuva+utdbbNDDaixtyuNVHQ0j3jLY3vzl5Hl2tDnY+hdNvrNMaQqIyyhq9Qapj4bmVNUXybJpXbI3yyE7IgXZwOXVy86D1NF1rTVdW0Vzh0vd6mSuuIt/Tn1hwGyEylr2NaAMBpLQPoI8y7KepJwBF55pfV2or1NT1UBsdQx9U6KrtMbiyto49xbvcXPwS3GSNoyOpbmTX1gZWSwOFfwqerNHUVXQ39HglDtu18mMDJI5/SM4yhODtSLrjtaWRt1NDmsMbanojqwUzujNnzjhmTGN2eXmzyzlYpNa2SpucdFGawRyzmmhrHUzhTSzAkGNsmME5BHmJBwSkYk4bXZEXRbp4QqU1Fuhs8FRKyqusVEKmekkFPK0uLZOG/kC4YPXy5HGcLdXa/TUGr6O1uZF0OW31FXM/aS8GMsxjnjGHHyeZS+F84Rf2W2Ns7bOwIur2zXlgr5Iw11ZTxTUz6qCeopXxxzRsbueWEjntHM/hlU6vX9sktFXUUxqaCaOmFTA64UMgZLEXNbxGgEFzfGHlB5g4VsjuiLqt217YbZNWtqBXvhoSGVVVDRvfBFIcf3ZeBjdzH0DIBOVRpPCBTQ3O7U12p52QUdxFM2pgpXuiiYWs2ulfzAJc4jl9GQOtIxm0ZzcnCLu8Ium0/hAt4uF9gr6Cvo6e0ybXVDqaQteNrTz8Xk4l2GjnuGCOtbrTuoaK9yVEEMFbSVVNtM1NWU7opGh2drsHrBweY8yRjiTg3CIiAiIgIiICIiAiIgIiIC0Wt/5VF9+P0uW9Wi1v8AyqL78fpcg3kfxbfqCysR/Ft+oLKAiIgIiICIiAiIgIiIODvlFP8AbP6XK2qjvlFP9s/pcraCOo+LH22/qCqS/Gu+tW6n4sfbb+oKpL8a761qly0uxxREW3ERYWVbAiIgwiyiAiIi2EREBERAREQEWMrGUGUysE/SsZQcsHl9KYzjmOf0rXVFqpZjVOcZA6qLHSHkfggAAAgjHi+UHrK4TWakklqZDJUZqIjC8b8jaQBkZ8vLOfO49aM3q4OsSaHu0XhIrdW2jV9Rbobk+lNfQNoYpG1DIBtDN78uaCC4EtwRu+gKvN4LqGWxXq3m7Vcc9x1A7UFLVxRtElHUlzXM2g5Dg0t8o5gnq6126SyUcgqA502KgxF4yP8A7ngDHL6Oa5ttVO2lrafizFtYXmTmBjfnOOX/ABHmcnkPMqlp4OmXPwaVV60HdtOai1hcrvU3aohnnrJomiOMRPY5rIoAdkbTs5gdZJJytzpLQdl0tqq83iy09LQw3SGnjNDTUzIYojEH+MA3AJdv58vIuwUVDBSOY6MvcWQthbuOfFb5frPLJ+geZVYbHRxOp3MknzTtkazLgfhgAk8uvln+pRYidtnVf9WlG7wQVHg5/is3AqBL/wB74I3jfUOmPi5xyLiOvyKMeCuhh01qrTFuuctHZL9l0NG2IFlve4YfwufwXEA7OQBzhdvFkpAwM4s4ApzT5BaDtO7y4/4vwHmC5/wmnLXB1RVODoHQHMmfFcSSer4XPr+gIlp4Oh0ngkpm6Bl0jXXamqKeW5w1znQ2inpWOEbmO4bo4mta7dswXOycHB6lZofBVb6HS0+m6S4vitxvrLvTsFO3+4DZWy8HkfGblpAJ5gHy4C7xSW+GnqW1AkkfI2HgjftPLOc5xnJ7PoUTLTAyoinFRUufE972guGCX43ZGOfMZ+gk/RiLFPJoPB14PrRoa43+ezSSMpbvUsnFKWgMptrSNjP+HmcDyDA8i7ieRI83WtZDaKeIUwbPUO6OHhpc4Enf15OM9i4w2Wmhlp3smqBwI+G1ocA12A4AkY5nx3K4LGtEbG1ByMjqTKqUdHDSzVEsbnl07ml27HLAAGP6BWcpZqNmLllYTKK2UREQEREBEWMoMosIgZRYRARZwgCAmFlEWxhERFFLS/HD+qiUtL8cP6qTsI2rVN8mi+wPyUijpvk0X2B+SkXB2F4Nr651dpvHhdrrfOIauKls7o3bWuIzyJwQQeRPkXvK1Vw03p24Vk1bX2C1VdVPAKeWaejje+SIODhG5xGS0OAO08sgFB5IbvcrlU6n1DcfCTV6Zmsl+FBTUQijkpWQgxhglh275DLvJzuBGRtwAtHI692Wl1pq616ludJJR64ETKCMRillbJNBHJxGlpc4lrz/ALQxgYwc59zq9KaXrL9Df6vTloqLvBjhV0lFG6dmOrEhG4Y8nPkrMlisklNUU0lmtz4KqoFTURupmFsswIIkcMYc/LWnceeQPMg+fb1aZKa1+HiofqG61HDbM00k0kRjfvoYnB7gGB2W/BGCBgcwTzVmXwg6vg0bqy8z9Msd1tdppjarJMyM8Olk2t6c45Ie7m7LSdsezDh5V7lW6X0zXXCouNbp20VNbU05paiomoo3ySwnkY3OIy5h9E8lZns9onqI6ie1UMs0UDqaOR9OwuZE7G6MEjIYcDLeo4CD59uGqNeWLT+ro47ndIY4NPtrqaS53OgrKyCoMoaJGNgJPCe0n4Q2gt5YzhdvrqDUkvhCtOj36/1GKSewVNwqaiPo7J5ZRNG1uHNiAY0bjgNHVyJPNeh23Rmj7Zbau2W7StjpKGt+VU0NBEyKfzb2huHf1W1NvoDcGXA0NMayOEwMqDE3iNjJBLA7GQ0kA46uQQeSUGrNQXHwA2+7098jfqyCjNxMQLGy1sVNMRKDH5Q9jS0kADLh1LQap8ImpLraLlqjTNyqv4DcL3Q2W3PpnQtc2PGZ5mPl8Rr3SOEQc84G3zr3Gj0/YaKSCSjsltpn08L6eF0VKxhjic7c5jSByaXcyByJ5rjHpzT8dgdp+OxWtlnc0tdQNpIxTkE5I4eNuCST1daDwt+ote01prrP/Grhbtmo7XRU1RUVtFW19PHUOxLHLwi5vmLd4zh3lwt7dJLpNqfVFouHhNvNgp9LW2mmpKjMG+bexz31U4Mf980OGza0BvIjGTlep2/SumLdbIrZQactFLQwztqYqaGijZGyZpyJA0DAeCAQ7rS/aV0xf6umq75p20XSopfk8tZRxzPi558UuBI58+SDwjVusNcV1+1B/DrtchHZLbST0VVR1dFQUbnSQCQ1NRHVO3Ojc7I25w0Aj4XNd28Hd4jh8Imtbrfqmitz32+zy1Ln1DBFG90DsgPztI3HAOefJegXvSml73X01fedOWi5VdLjo89VRRyyRYORtc4Ejnz5eVc7jpnTdyrJay46ftNZUzQiCWaejjke+IODgxziCS0OAIB5ZAKDw7WGtb9Raik1Bab9fqikh1RDaSZX0kFtDDMyOSnbAXOmleAXEyENORkeKFxv2o9Qi2+EXUsfhBr6et0vfJYrdamGEQOYNmyKRhZukEhJaPG5eTnle0VOhtFVVwqrjU6QsE9ZWN21M8luidJMOXJ7i3LuodfmHmVG1+DbR1FeKq8S2WjuFwnuMlwZU1tNFLLTSP28onbctaC0EDOQfKg8kvWpdRS27wkaiOvrhbq7S9wJt1qYYREBwY3NjlaWF0ge4uYBnrzjmu9/6Q03SPAbVT1kTYuJU2t8zH9TQa6mLgc+Qc8rsFD4NtHQXyuvdVZaO53CquLri2orqaKV9NKWsbiJxbljRw2kcyc88rtFxoqO40M1DcKSnrKSZuyWCeMSRyN8zmnkR9aD5/8AD1YNGXyz3S5ah1HbGaZs9CTa7ZYuCanjOPjyuBc0PIJO1gIbzJPNfQ66rS+DbwdUtRHU02gdKwTxOD45I7PTtcxw6iCGZBXakBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQQV3yf/ABs/UFhZrvk/+Nn6gsICIiAiIgIiICIiAiIgIiIK1q/ldJ9yz9IVlVrV/K6T7ln6QrKDr+u7XWXG0wT21rH3C3VUddSxvdhsr2Zywnybmuc3Pkyldpa0Xi4015uNHPHVhkRlhFQ4MeWHcwSNadr9jicZyuwIg61aLZcZtcXPUFyibBEyBtBb4g4OLogd75HY6tzsADrAbzXZSMgjJH0oiDzyu0pqa5z0UVzFjmlpKxkzb2zcysMTH7g0MDAA4jxTh+MeRa+j07qm6WzUVjNPR0tsuN8nkfPUGRk7IuKCSxm3Dw4AbXbh1r1NEjDPh0Jxz49XmMXg5qorpLC6nt9TQSXE1fSJq6qEjWF+/ZwGkRlwd1O3Y8pBKzY/B1V0Fwo4Jqe3z0VJWmpZVPrqoyuaHFzAIARG14JA3ZI/4TlemokRaIjOcCcb88/Lzel0hqqK3WWxGWz/AMMtFzjqmT8WTjTRMkLg0s2Ya4AnykHA6utdj1BYKy4algucMkDYY7ZVUha9xDt8pZtPIYx4pzz/AKFdlRSYvFp5+sW9libTfOE393R2aQuQotKwGeg3Wi3TUtRvBkY574BGCGkDc3I5g4yFo5NB6nmtFVbYpaC200lFwOix3Gongll3scHhkjf7kANPJuevC9URavjfO/qkYREcHjesaO/RQ6l01aqerfBdKrjMY+1yvc98mzdsmaTEI8jm55BbzGOortNfo651GnNTW5k9GJbrcG1UBL3bWsAi5O8Xkf7s9WfIu9opGGfDoTi6RctMXqSr1PHTss89HeeHKzpZe4texjW7HMDcFp2/CDsjOcHCuaGsl6tNZWyV0rIKGSONlNQsuE1Y2Jzc7nB8oDgDkeKOXJdrRIwznPMnEREQEREBERAREQEREBERAWi1v/Kovvx+ly3q0Wt/5VF9+P0uQbyP4tv1BZWI/i2/UFlAREQEREBERAREQEREHB3yin+2f0uVtVHfKKf7Z/S5W0EdT8WPtt/UFUl+Nd9at1PxY+239QVSX4131lboctLscPKiyi24iIiLYREQEREBERARYTKDKLBKwgzlYREBYJCFRuJLg0dZOAg5F2FxL1sYqWJrBuaHnylwyufAg9TH7IWdeG+7lqy9Y3radHp/UReyE6PT+oi9kJrwd3PFq96b1tOj0/qIvZCdHp/UReyE14O7ni1e9OIFtOj0/qIvZCdHp/UReyE14O7ni1e8JvC2nRqb1EXshOjU3qIvYCa8HdzxaveE4n0radGpvURewFjo1N6iL2QmvB3c8Ws4n0pxPpW06NT+pj9kJ0en9TH7ITXhdSWr3rIfzWz6PT+pj9kLPAh9Uz2QrrwaktYHLkCrlRSscwmNoa4dWOWVQY7IWoquzMTG1KCi4g81kqjJKxlYRARZTCDCLkAiLZjCyiICIiKIiICLGUygypKU/wB+P6qFTUnx4/qpOySNq3TfJovsD8lIo6b5NF9gfkpFwdhERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREEFd8n/xs/UFhZrvk/wDjZ+oLCAiIgIiICIiAiIgIiICIiCtav5XSfcs/SFZVa1fyuk+5Z+kKygIi0VfrLSlBXmgrdRWyCpadro31LQWHzO5+Kfrwg3qLjFIyWNssT2vY8BzXNOQ4HqIK5ICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiIC0Wt/5VF9+P0uW9Wi1v/Kovvx+lyDeR/Ft+oLKxH8W36gsoCIiAiIgIiICIiAiIg4O+UU/2z+lytqo75RT/bP6XK2gjqfix9tv6gqkvxrvrVuo+LH22/qCqS/Gu+tboc9JscURFtxEREBEWMoMosZWEGUysIgIiICLICItmFnCysFFcHKKM/8AeYvtt/Nc3KKI/wDeYvtj81WZ2t55FXa6WXLmOaxuSByzlWD1FQUZHAwOsEg/RzXB3naztm9a32P/AJWMS5xxm+z/APKmPUV1O96Urrhep7lFqGrpONHHAIoQWhsTXsfjc1wduJEg3Z6n4xyydRbexpJqpi9NN/y7Ntm9c32f/lMS+ub7H/yumT6LvrhK6LWlxZJI0gk8QtBMu/IbxOXigM5Y5A+chRyaEu3TqiqptWVNOXmThARO/uhJKyRzRiQcvE8gBJcSSRhq1ani4d5pr/8A6584d42zeub7H/ymyb1rfY/+VrtNWuqtcFRHVXOe4GWbiNdKSSwbWgtGSeWQT5hu6ltliXpoiZiJmLKkss0UmxxaeWQcLj0mT6OxYriDUtAOcN5qJbpiJcKqpiq0Sm6TJ/wrHSZM48XK6E7Q1wjudTW0OqKqkbVVZqJo4otpcC+V23IdzOHtAc4O+DzBG0Nrt0NfqihZHV6uqoJXxzR1HBfLJuD+JtG9zwSG7243AnxOvmraHLva+D0XpMn/AArPSZfoXR26QurKiKoj1XWMeKlkswxI4SMa+R3DGZCWtxI1oGSPEyQclRM0XemvYP7a3MsaIiATITvZC5hJPE5h0hbJt6uWDkYw1YO9r4O+9Jk+jsUkFS50gY4Dn5VUUlP8c361JiHWmuq7YnqWihPLC3p6loIj500e900u5ZaVyXBqkXRIYTCyiKIiIoiIgImVjKDKErCwgzlYRFbAiIgKak+PH9VCpqT48f1Uq2LEYrdN8mi+wPyUijpvk0X2B+SkXndRdfu2qY6K5VNDS2e6XN9HG2SrdSNjxCHAkA73tLjgZw0E4XYF0TVTaaLUdVUT0uoLZUuij6PcbRHNOKnAPiSRsY5m5p6t7TkHkUHZaTUlkqp6GGC4ROkr6bpNMDkb48gZ59R8Ycjz7FfbW0b55adtXTumhGZYxIC5g87h1j+q6JTQVkl90zeNRWV81Y+2yQzSR0Rk4dQXxlm/YDwzgOOTgNOeYWgsdJUG/afqG2OWl21UjK6GKyTM4LJGPBbLO/Jmy4jLh4vlOOSD1K0Xi2XahirbfWRzQynDDnBJ58sHnnkVZnq6SCGSaephiiiOJHvkAaw/ST1da8zs9J/DdK2EtslbBNarq19xZHbpA/GJW7wA3MoG5vNm7koayjkrIrjcJ7ZdI4H6g6VCZbU+duzo7Wh8lOQHvZ1jlhzTg8sFB6tFJHLG2WJ7XseMtc05BHnBXJda8G7JWade19sZb2dKlMTWQSQNkaXZ4jYpCXRAknxD1f1XZUBERAWguWpXU17mtNJYbtc54YWTSupeAGta8uDeckjTnxT1Bb9edampmt19XVNXNqqkgkoadsUtopp3tkcHSbg4xscMjI6/Og77BVxvihdMDSyytaeBM5u9pP8AsnBIz19RPUuBudv4VTKK2neylBM5ZIHcPAyd2OorqcNpgr9WmvmttVVxRWSFtLPVwFsok3ydReBtlxjPURnyLr2kbZ/fst8NhMkf8MmgllqLRJRzQ8m7Y5Xk8KoJPlaPJnyoPSaW9WqptUV1jr6cUUrWubM94a3xhkA56jz6jzUV0vtHb6yOllZM90lJNVtdGAW7Itu4dfWdwx+YXmRthFu0xKbXUUtFSUL4KuOSwSVHDqtseXmHaC7IDhxAHDyZ5rYUNqraSktELKO5vjfbLlDGJKMtMRkLXRsc1pcIxgHaHEYwByPJB3u3aitNdUU1LHUhlTU0jKtkMnJ3Df1Z8mfoytsvO9M0cMWo7DXVdlqhxLFDTNmfbpCYqhjsEPO3MZx1OdgEdRXoiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiCCu+T/42fqCws13yf8Axs/UFhAREQEREBERAREQEREBERBWtX8rpPuWfpCsqtav5XSfcs/SFZQdV8KFwrbdppjqSofRxVFVHT1lcxu51HA7IdKB5xyGfJuz5F0q9Vk2m66psNjbT09JEymFvtnQBML0JMcRz5MEk8yCQeWMnIK9cniinhfBNGySKRpa9jxlrmkYII8oXUI9E1lHG6is2r7zbbW7kKRgjk4TfRjke0uYPMMnCCHRgbatbXXTVokM9kggFQWcy2gqHOH9w0+ZwJft/wBnH0rvB6itfp6zW+w21tBboiyIOL3uc4ufK8/Ce9x5ucfKStgpMXgfPtmoX0ek7VfRpiK3xwVzJJb/AAVgMwZ0ghxMQwSD8EjJ5c8Fdwq9balku9xqLdSVc9PQXE0jaKG0ySsmYxwa9xnBw1/MkDGBgZzldop/B5pCB8RbbJXsik4jIpa2eSIOznPDc8t6+fUrlXo/TtVc33Gegc6WSVs0jBUSCGSRuMPdEHbHOGBzIK1E2mL52dJKsb54uqz6p1G221erGVVH/C6W5GjNs6N474xMIi7ibsiTJyBjHkWptFzv9j0/eb/S11EbdR36obJQup9z5muqNriZN2Wu8bkAPJzzld/k0dp2S7G5uoHGZ1QKlzOPIIXTDqkMW7YXfTjOefWom6G0u2tNW23P3uqTVvZ0qUxPm3bt7o921xBPLI5cvMFKMLXz/L0nzKsb549YdXrtY3mm1DDLHWxVlDJdm290EFuk4EbHP2Z6S7AMgPWG5Gcj6Vf09eNT3WlodRG6WiG3VtW6H+HzRbCyMPc0bZckul8XO3GDkjktxNoTTE0z5JKGY76g1IYKyYRxyl24yMaH7WOz5WgHr8hKmg0bpyC6i5R0DhM2c1DWGeQwslPXI2Iu2B3PrAys2vTac7P2Ttm2dv6dC8H1dqK3ac0jEy5UjqK68WljgNJzpyGyPbJu3Zcct5jkMHHLrVGhdqOo03pGonvcNTUzX5zKeSogJMJHHaS478v84HLGAF6pS6bstLTWymgotkVreZKJvFeeE4hwJ5nxuTndeetUJdC6XlgMD7fKYekdJZGKyYMjl8bxmN34YfHcfFxzwesDG5m9V+d/WJ6k7Lcuv6dbqNT3+iluVhqrvRdOpK2CFla2gkkkljljMmGQR7t0gwR5G45lQUOsNTVdFS0UMtPFXG/Otb6iqonMLo+CZA90W4bXdXLIHLyZXbv7E6cFGKYUc4IqelCcVkwn42Nu/i7t+ccuvqXOg0bpyhmZNS29zHsqW1YJqJXf3wYWcQ5ccuIJyT19ZyeakbceXxf58ydmHP5/ToVh1BXUGqbrpyCaNldW37E9wmpyIGDgR8mjq4j9jtrSe3lmzDrbUtRdJaukpKyopIrk6j6HHaZHsdE2TY6Q1A5B/W7GMeRd8qNM2Sopa6mmoQ6KvqBVVA4rwXSjbh4IOWkbW/Bx1Ku7R2nXXT+IuoXmYzipLOkScEzDqkMW7YX/APERnPPrSnDVvut8dJKsb233+f06DbKq+VdXpMWu5U9qiqa25RuhipiYyWPlO5zd43ZA6j1HJ+heurRSaR0++ipaToUkcdJPJPTuiqZY3xveSXkPa4O5lxyM4W9SNlicZmc7ZEREBERAREQEREHVdezzW59DdLdVS/xRr+DTUAcSyvDsF0Zb5DgZ4n+zjJ5ZC7S0ktBcMEjmM9ShfR0j65le6midVRxmNkxaN7WkgloPmJAU6AtFrf8AlUX34/S5b1aLW/8AKovvx+lyDeR/Ft+oLKxH8W36gsoCIiAiIgIiICIiAiIg4O+UU/2z+lytqo75RT/bP6XK2gjqPix9tv6gqkvxrvrVup+LH22/qCqS/Gu+srdDnpNjiixlYW3FlMrCICIiAizhAEWzCzhZRFYwsoiAiIgLBTKwSgjeoY/lEf2x+ameoYvlMf2x+a1uZna3qhkpYZHFzm4J68HGVN5FAC+QbhIWg8wBjq/qvO7zZx6HD6LvaPenQ4fRd7R71z2v9dJ+Hcm1/rpPw7lbs6scHDocPou9o96dDh9F3tHvXPa/10n4dybX+uk/DuS5qxwcOhw+i72j3p0OH0Xe0e9c9r/XSfh3Jtf66T8O5LmrHBhlJA3qZ+JXLo0PofiVja/10n4dybX+uk/DuS62jgz0aH0PxKdGh9D8SsbX+uk/DuTa/wBdJ+Hcly0cGejQ+h+JTo0PofiVja/10n4dybX+uk/DuS5aODPRofQ/ErkyKNhy1uCuG1/rpPw7kBcwjc8uBODnCXIiOCV3wStBF5Fvz8ErQRda3o97Gl3LLepSKJqlXQgRFjKKymVhYQZymVhFbAiIgIiIWERZVVhFnCygxhS0vxzVGpaX48f1WatiwtUvyaL7A/JSKOl+TRfYH5KRed0ERQVVZR0pa2pq4IC74IkkDc/VlGaqqaYvVNoTojSHAOaQQeYI8q0uotW6V05NFDqHU1ls8szS6JldXxQOeByJaHuGR9SNN0igt1bR3GiirrfV09ZSzN3RTwSCSN484cORH1KdARFWprhQVM9TT01dTTTUkgiqY45WudC8gODXgHLSQQcHyEFBZREQERQwVdLPPUU8FTDLNTPDJ42SBzonFocA4Dm0lrgcHyEHyoJkUFFW0dcySSiq4KlkcroXuhkDw2Rpw5hx1OBGCOsFToCKjfLxabFbn3G93OitlFGQH1FXO2KNpPIAucQMlSWm5W+72+G42qvpa+imG6KoppWyRvHnDmkgoLSKrbLjb7nA+e219LWxMlfC99PM2RrZGnDmEtJw4HkR1gqChvtkrxAaG826qFRJJFDwalj+I+PPEa3B5luDkDqxzQbFERARAQRkEEHyhEBERAREQEWk1BrDSWnquOkv+qLJaaiVm+OKur4oHvbnGQHuBIyCMrb008FVTx1NNNHPDK0PjkjcHNe09RBHIhBIiIgIiICIiAiIgIsPc1jC97g1rRkknAAUdHU01bSRVdHURVNPMwSRSxPD2SNIyHNcORBHlCCVF0/XmrZbNMygoI2PqnN3ve/mIweoY8p/Ll15Wo/tdN/ZvpnTmfxPd8VuOMbsfB6updo0FcxE8Xir7foKK6qJnGIvnm9HRdP0Hq2S8zPoK+NjKprd7Hs5CQDrGPIfL9PPqwu4LnXRNE2l6NBp6NPRFdE4CIiy6iIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIggrvk/+Nn6gsLNd8n/xs/UFhAREQEREBERAREQEREBERBWtX8rpPuWfpCsqtav5XSfcs/SFZQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAWi1v/Kovvx+ly3q0Wt/5VF9+P0uQbyP4tv1BZWI/i2/UFlAREQEREBERAREQEREHB3yin+2f0uVtVHfKKf7Z/S5W0EdT8WPtt/UFTm+Nf8AWrlT8UPtt/UFSmP96/6yt0Oek2OKLBKwujlZyWQFxBTKFnLCysArKiiIiAiwmVRlYWESwzlYREsCFEKojk6lDF8pi+2PzUz1DF8oi+2PzSWZ2t4epa65wVFTZJaeleGTyQ7WOLtoBx58HHYfqK2QUYYASQ4jPk8i87vLS1NvuctJRtirOjyxM2SBsmRzaGk52gOIG4jxRzA5Kvb7ZfY+BHV1sD44hGBtc4l21zSSSRnmG4xnmefLJXY9p86bT51UQ0sAp2OYJJZNz3PzI8uI3HOBnyDqA8gUybT502nzoCJtPnTafOgIm0+dNp86AibT502/8SAiY+lMf8Sii4TfBH2m/mFz2n0lgMG8OJJx1Ko5H4K0MXWt+7qK0EXWt6NnSblhqkyo2rmuiMrCIqoiIqWERZRWEWcJhBhZwsogIsZWEHIlYysIgypaT48f1UKmpPj2/wBVmrYsLdL8mi+wPyUijpfk0X2B+SkXndBePa06V/aat6Vu3cQ7M+h/s4+jC9hUFVR0dUWuqaSCct+CZIw7H1ZW6KtWXx/rX0ur6loY0dNWrMTfk0Xg36V/ZlnSd23iO4O70OX4ZyvOvCo28O8OlkFll0zHP/Zyp3G/RvfBt6RF8ENcDu6v6ZXtLQGgNaAAOQA8i0uotJaV1HNFNqHTNlvEsLS2J9dQRTuYDzIaXtOB9SzM3m739j7P/DaCjQ3vqxa755suorxZdDQWCxEx1FXrWpoLnPY5oY4CXMdNso5JsRxNcdrfG5g7gCTgrdUN/wBeVT7TpybUNfbGzasNuFUKuiq65tN0N8jopXR74xI1zeRLd2C0nPl9wfpjTb9P/wBnXaftJs2Mfw/ocfR8Zz8Xjb18+rrWaDTWnLfSUVJQ2C1UtPQSmajihpI2Np5CCC+MAYa4hzhkYPM+dR6XgeqtU6+ivurXW+43cO01VQ0lE+W52+mo9vCjcHVTZi10hlLj4wwOY2YIKz4SZ7nfafUcdbea2gjoNa2eKNtMYmiNsjaUnJLTna55cCfLjORyXu9y0ppe53qnvVx05aKy502OBWT0Ub5o8HI2vIyMHmOfJT1en7DV09fT1dkttRDcXB9dHLSsc2qcAADICMPIDWjLs8gPMgtWynNJbqemdWT1pijDDUTlpklwPhOLQBk/QAFYUFBR0lvooaGgpYKSlgYI4YIYwyONoGA1rRyAHmCnQF5b4Q74zweazqtSOYDS3y1OgEeccS4U4JgYP+KRj3N+nhgL1JVLnbLbc2QsuVvpK1sEzZ4RUQtkEcrfgvbuBw4eQjmEHlNkslxprpQaFqdVXCxRW+wsuU0lA+OKStq5ZXmeVzntdlrHDJaOX94N2RgKTQt51Hqu86YFZqGtpYTZHV9QKSONja58dSI2vduYcMezxiG4+EMEBej6j0zpzUkUMWobBa7uyBxdE2upGTiMnrLd4OP6K9FQUMVSyqjoqZk8cPAZK2Joe2LIOwHGQ3IBx1ckHnHhPpbpcfCroi30lwpbdCIK6dk9RTCfE7REG8NriG8XY6TBOcAvwD5N14IayWotF3p6hlufPRXioppayhpxBFWvaWkzbASA8k7XYJ8ZrvqXZNQWKy6hoP4ffrRQXWk3B/ArKdszNw6jtcCM/SrFrt9BarfDb7ZRU1DRwN2xU9PE2OOMeZrWgAD6kHzro+9VWiLRqCgo3nj6qnq5rK1xJH8QNa+me0f0dBJjzB5XYPBZTv0tDp3TVuncKSK9XunfuAcZBEJC0knnnIzyXsRsNiLqRxsttJopnz0h6KzMEjyS57OXiuJJyRgnJUkdotMcrJY7XRMkjkklY9sDQWvkzxHA45Odk7j1nPNB5Vou4aiip9AXmr1Lc7hLqKlkZXQT8Pg5FM6VjmNa0bXNLMZB5gnOeWJbRqW73K1eDCCS9Sia+UdQa98bmCSUtpXHd1ci1+DyHIr1GG1WuGOijhttHGyg5UbWQNAp/FLf7sAeJ4pI5Y5HCo23SOlLZcn3O3aZs1HXSSGV9TBQxslc8gguLg3OSHO5/wDEfOUHjNjnvlp8Fvg+tNoul5mZfJTHPJFUwRzMDIXuEMUj2hrNzm/S7kQDk8tzZK/VlfcLJpyv1FWU0Ml2rqWSWCrp5qt0EdOJGxyyRgtbI1xLSQA7AB6zlelv0fpJ9urba7S9kNFXzcesp+gRcOol9N7duHO/4jkq3brDY7bT0VPb7NbqSGh3dEZBTMY2n3DDtgA8XIJzjGcoOv8AgxqbjX6TrqSvudTVT0dxraCOsk28ZzI5nsY5xAALg0DnjnjJXn1XrvVbrBNDS1Z/iulbRWy3x3DDhJUxl0MO5oHwXbXz4GOTW+Qr2yjpKWjY9lJTQ07ZJHSvbFGGhz3HLnHHWSSST1kqKmtdspqqsq6a3UcNRXEOq5Y4WtfUEDaDIQMuwOQznkg8lvlwvOkzUwW7WdyvrK3S9fczJWOikdBLE1hjnjLGANa4vI2828hgDBz2DSkl4tuu7TQVOoLjdYLtYZK2oZVlhDJ43wjdGGtGwESuBaOXIeXJParTo/Sdop62ntWmLLQQ17S2sjp6GONtQCCCHhrQHDmeR85WzbQ0TaqGqbR04ngiMMUoiG+OM4JY04yGna3kOXIeZB5nqluo3+GKuZp3+z292nqcTfxcSFmOPPjaGdflzlarwO3aeldpOxQ1EUNMXXmGrjgc0001RFO05gOB/dAuk2DyN5HOMr03UOj9Jaiqo6rUGlrHd6iNnDZLXW+Kd7W5ztBe0kDJPJc7jpPS1xtFNZ7hpuz1dtpSDT0k1FG+GEgYGxhGG8iRyHlQeN0eqdW6hjsFqguF1mirpbvM+a3VUFPNOIKwxxMEsgxtaw5w3xjgc8ZzvNI3HVl8venbfcdSzxCO3VlTObfLTydMMFWyOMSPa1zclpw8R7eecY6l6PcNI6UuFoZZ6/TNmqrbHIZWUktDG6FrySS4MIwCSSc4zzPnV6ktVro3U7qS20dO6mg6PAYoGtMUWQeG3A8Vvit8UcuQ8yDxKz6pq5J9G3A+EOqmvd4vDYLrYjJCWRDbJvhEQbvi4ZaGk5yceNkkKbQt/wBa3C4WDUFTX1jW3W5vp6unrLhSNpCzMgMMMIAkbLHt8+47Xbs+TvdD4NqGn1HBeKi/XmvZTVJqoaWpMDgJMODS+URCaUMD3bRJI7HLrwMdgpdK6ZpdQS6hptO2mC8TAiWvjo421D89eZANxz9aDyiKq1XV6KtFw/tbdampvN1kilo4qqmpZ3wxunAipHPYGh52tc7e7JDThzVaoNbVen6G3Xy63m6VVopp6613OO5QxMnp52DiwiQxFzHvAYY97Dh29vlyvULhpvT1wsv8Er7Da6q17t3Q5qRj4d2S7OwjbnJJzjrOVhmmdOMsUdhbYLULRGQ5lD0OPo7SHbgRHjaCHc+rr5oPGpbj4QKy4ttNdcrzBU0dkhukhoaylpgyaZ8rnGQzDx44trWBo8Xkd2SQt3T1ep9SVVRFWanqra6DSlHcCLRLEYnVTzPmRr9rtzPEbgA7SOvK9J1DpfTWonU7tQaftV2NMSYDW0cc3CJ69u4HHUOrzK8LfQColqOhU3GlhbBJJwm7nxtzhhOMlo3OwOrmfOg8eo7vdtXsqZblrCssAoNMUdxZHRmKNsr5onuknkD2u3MaWhu3k0c88yMd+8DZz4JtJHOc2al5+f8AumrY3LSGk7n0D+I6ZstZ/DmhtEJ6GN/RgMYEeW+IBgchjqHmW2pKano6WKkpIIqenhYGRRRMDWMaBgNAHIADyBB5p4Q7TcJ7rUXFsIdBGzx3bwMAE+TOerC6UvbdUWyavtdVFSbONLGW7XHAcfJz8684/sRft2zgx7vrOO3GF9Hs+njUtVOx+Z+p9grnTa2ipmb4yveDy03CC601xdCBBI3xH7xzyR5M56sr1FabS1smoLXSxVezjRRhu1pyGny8/OtyvHpq9euZfb7F2eNBoYpjx/IiIuT1iIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIggrvk/8AjZ+oLCzXfJ/8bP1BYQEREBERAREQEREBERAREQVrV/K6T7ln6QrKrWr+V0n3LP0hWUHVPCXd6m00Nq6PcJ7e2ruTaeaogpekSNZwpH+Kza7JJY0fBPIldFbqi8S0N/dTax1FNV0cskdvjbp9pExELHMD/wDu/ikvcQQS3lg8s5XdPCmyo6LYqiCoraVtPdmyS1NJSmokhZwJm7tm12ebgPgn4So116ofB9o+fUNTPc7yLnXNmc+WBsMhe+NrRlu1oYA2IdYByg56Hu90qtTMo5LxdbpRutz5ZnVtq6KIZw+MBrTwmZyHP5c/grvh6l534Dda12sLTcv4jHiajqfEeB1xvyWNJ8pbgjPmxnnkn0Q9RUnYOqWLWovLYJqLTGoDSTvLW1TooREAHFpcf73OMg+Rb6gudPVUMFU/NKZmB4inewPaCcc8Ejr8xK6N4NtKVtLpmiraq7ahppmiZzrbJKGwjx34BjLN2DyPX5VrNG6annrdO/xSyv8A+6acc1jqumO2Co4w253DAeBkjyq8c7pn4J254xHy9RFdRGaaEVlOZYBmVglG6Medwzy/qpuJGZBHxGby3cG55kefHmXiWlNK1tVNarZcKergqYuOyvLbGYshzXNeJKovxKH7sgt3E8jgYRlFrKCjGoha7g+50EP8CjgETt0kQic3jgeVvFLHbvM0pOzOdtswb852XezPuFAx8LH11M105xCDK0GQ/wDDz5/0WmqtYWynr56N8FWZILjBbnEMbgyTNDmkeN8EA8z1/QV5pq3T09PTXKx0Vhc6WC2wU9JUNtMtVJVlsfMsmLuHAGuzkAZJ58yQrcsF06TUVUtpu783i2XFx6DK5zomxMa84DclwOct+EPMrTETVbdh7x8XSZm34+Or2JERRRERAREQEREBERAREQEREBERBSqrrQ0t1pbZUSmOoq2uMG5pDZC3raHdW7HPb14BPkV1dc1tQVt7jp7HT0wZTzu4s9wcRmmDCCOGOvik/Bd1N5nn1HsTRtaG5JwMZPWUGVotb/yqL78fpct6tFrf+VRffj9LkG8j+Lb9QWViP4tv1BZQEREBERAREQEREBERBwd8op/tn9LlbVR3yin+2f0uVtBFVfFf42/qCozE8V/1lXqv4n/G39QVCU/3rvrXTRsVsIsIutmArOVhEsMrkDyXALKiWc8rGUCKWQREVBERAREygIepYJQnkg4P6lDF8oj+2PzUr+pRRfKI/tj80ZnbDe+RU5ZIYqU1VR8AN3OO3cR9QHP+iueRVJKeGpojS1DA+Nzdj2ny/QvO7y4R1lueBtqKfOQ3BcAQ4nABB5g5BGDz5Lk2poHs3tqKZzME7g9uORwewkKsbHbulCoERa9pBZh3JmABho/2RgeTznzlcG6ftYa0CFw2xmMYkIAaQRgAcgPG8nmb5ggtx1NBJI2KOopnyOG5rWvaSRjOQPqUlNJS1MLZ6d0UsTvgvZgg+TrUNHbaSke98DXBz5DK8lxO5xaASfZHYrYAAwMAIMbGeg3sTYz0G9i5Ig47Geg3sTYz0G9i5Ig47Geg3sThx+g3sXJEHHhx+rZ2Jw4/Vs7FyRBrm3O2OqDAJYzIHbSNh7erqyCM9WeWcq8WtZhzAG+MAQPLk4Wv/gdu/iHTuEeLt2f4c5xnrxnyZx9C2EmDtaOsuB7DlIvvJtuSn4JWghW/PwStBF1rro97Gk3LDVzXBq5rqQIs4QBFYWQFlEDCJlYygysZWEQZysIiAiIgIiICmpPj2/1UKlpD/wB4b/X8lmrYsLlL8mi+wPyUijpfk0X2B+SkXndBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREEFd8n/xs/UFhZrvk/8AjZ+oLCAiIgIiICIiAiIgIiICIiCtav5XSfcs/SFZVa1fyuk+5Z+kKygKGrpaasiEVVBHPGHtkDZGhwDmuDmnn5QQCPqUyIIqelpqeSeSCCOJ87+JM5jQDI7AbuPnOAB/QKVEQEREBERAREQEREBERAREQEREBERAREQEREBERAREQFotb/yqL78fpct6tFrf+VRffj9LkG8j+Lb9QWViP4tv1BZQEREBERAREQEREBERBwd8op/tn9LlbVR3yin+2f0uVtBDWfEf42fqCoyfGO+tXq34j/Gz9QVCT4bvrXXRM1MIsZRdrMMosArKgIERSUlyWVxXIKJIixlCURlYyiwgzlYRZQYQrOEPUio39Sii+Uxj/jH5qV/UoovlMX2x+aMTtbtzsBai8Xyw2yRjbrcrdSPeMsFTOyMuH0bjzWwqnbWEr4s1jX1Nz1Tc62rkdJLJUyZJOcAOIAH0AAAD6FNDou8l836x9W/2+mmYpvMvrP8Atjov/eKw/wDjYu9Y/tlor/eOw/8Ajou9fGxK4Er0fwscXwI/1Vpf6ceb7M/tlor/AHjsH/joe9P7Z6K/3jsP/joe9fGJ85XAnKn8LHFqP9UaX+nHm+0P7Z6J/wB47D/46HvQ600T/vJYP/HQ96+ObVa6+7zyQW6mdPJFE6Z7QQMNb1nmR5SAB1kkAZJCnh0zqOobE6nsVzmE0XGi2UrzvZy8YcuY8ZvPq8YedT+Gpje7U/6h7RVF40WH56Pr7+2mif8AeTT/AP46H9yf210T/vLp/wD8dD+5fH40zqEukDrLXRCPib3SwmNoLGOe4ZdgZDWOOOs4KzU6S1PTlonsNxY5zGv28Bxc0OcWN3Ac2kuaQAcH8FO4p4tx9e7Tt7r36Pr/APtroj/eXT3/AI6H9yx/bbQ/+82nv/HQ/uXxZcqOtt1Y+kr6SekqGAF0UzCxwBGQcHnzBB+oqqSr/DxxZ/8AyLSxNp0cPt3+2+h/95tPf+Ph/cn9t9Df7z6e/wDHw/uXw+4rgSn8PHFqP9Q6T/sh9xf230N/vPp3/wAfD+5biyXmy3WJ8tnuNvrY2nD3Uk7JAD5iWk818BEru/gIudXbvCnZTTTOY2omMEzQeT2OByD5+eD9YCxVoIiMJejs/wBdrr0kU1URaX20MELQs+EtzTuJbzWmZ1lctHvfoq5vZYZ5FLhRtXPK6rDKxlFhBnKLCICIiAiIgIiZQEWCUQZysZREWwpaT5Sz+v5KJS0nyln9fyWatixtXab5NF9gfkpFHTfJovsD8lIvO2ISBzJA+tF0V9HZbxq7UE2qY6Opgtxggpoq7aYYY3xh28Nd4u5ziRu6/FACDvSLz7Stzq7fc4LDTScS3NvVVRwukJe4Qsh4gYHE/wCy7LfLybhV63WF7lkbbqYmKea51tOJ4KI1D44oCMBsYPNx3DmeQAPJB6Si88obhdLjetMyXemfDUxVNdFufAYTM0QnbJsJJbkHqz1grU2S/wB3hslgslqfPThtqbVSTQ281b3EvLWt2ggNbyOT18wBhB6yi1ulq2tuOn6OsuVGaOskj/voS0ja4Eg8jzAOMgHyFbJAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREEFd8n/xs/UFhZrvk/wDjZ+oLCAiIgIiICIiAiIgIiICIiCtav5XSfcs/SFZVa1fyuk+5Z+kKygLX1d8slHWNo6u8W+nqXfBhlqWNef8ACTlaPwp3C50enYaOzbxX3SsjoYXseGOZuDnOIceQO1rgD5CQV5r/AGdnGndXdG0baGRQv4fElr98kBgja/POI8QlxLiSRuzt6hlB7sCCMg5BRec+C+evt1+qLBPQGht1VRNuVvp+lcdsDchsjWuIBDSXNIaRy5r0OeRsML5XZ2saXHHmAypMxEXlYi+EOaLz+zHW1803Dqeiv0cNTVYqKa2Op4+jcInlG5+3iZLcZcHDBPUpGO1TedWahpaLU0lrjtz6dsEHQ4Zo8vha924lu4jOepw61bTe0peJ2O+IvJKfX+oH3i2V84iZbIaF0l4po2AhpbUOgfMx2N2GkB2M/Bz9a7xpG6VdxvGo4Z6gTQUle2Kmw1oDYzDG7GQOfNxOTnrSMdnP0mxOGE5wu7GiIgIiICIiAiIgIiICIiAiIgIiICIiAi0Wq7rW2LhXZzIpbPCCK9oGJYgSMSt54cB5W4zg5GSMHeNcHNDmnIIyEGVotb/yqL78fpct6tFrf+VRffj9LkG8j+Lb9QWViP4tv1BZQEREBERAREQEREBERBwd8op/tn9LlbVR3yin+2f0uVtBDW/Ef42fqCoS/Dd9av1vxH+Nn6gqEnw3fWu2iZqcFhcsLGF1ZZWVhMpKMoiLJLIWVhFGZEWUwiWYWcLKItgBERAQ9SIionhRR/KIvtj81M9QtIbPG89TXAlXcxVtbGuB4ZC+LNX0dTbtUXOjqonxyx1L8hwxkFxII+gjBH1r7alaHs5YIK6/e9NWq6va6422jrNvwePA2TH1ZBws6HS93tfK+s/Sp7fTTq1WmHxcSuK+vzoLS/8Au1Zv/BR9yx/YLS3+7Vm/8FH3L0/xUcH5+P8ATGm/748nx+TlcHFfYf8AYHS3+7Nm/wDBR9yf2B0t/uzZv/BR/tU/iY4Nx/prS/8AfHk+TNP6gu+n6mSps1Y+jlkDWvexrSSA4OA5g8tzRkdR6jkK1FrTUsLGNiuIY2NjWNAgj5BoiA/2fNBF7P0nP1R/YHSv+7Nl/wDAxftT+wGlf92LL/4GL9qk6emdztR9C7TRFo0mH5fLEuutVS0oppbqXRAvLRwY8jex0bsHbkAtc7l5znr5qR/hE1g5zz/Fmt3ljnBtJC1uWPMjSAGYB3OcTjrzg5C+o/7AaU/3Ysn/AICL9qf6v9Kf7r2T/wABF+1Z76ng6R9G7VH/APT36vjm519XcakVFZLxZWxsiDtoHisaGtHIDqAAVNx8i+0f9X+lP917J/4CL9qf6vtJeXS9k/8AARftV7+ngxP0HTTN5qfFZK4Er7X/ANX2kv8Adayf+Ai/an+r7SX+61k/8vi/an8RHBqPoOl/7ofExK7r4C6Cqr/CnZRTQve2nl48zgMhjGg8z5ueB9ZC+pB4PdJZ/wD2Vsf/AJfF+1buxaetlojMVst1JQxOOSynhbG3P1NAWatPFrWd9B9Frp0kVVVYQ29MCI8rURLeeLFEXOOABzWliC5aPe/SVboTtXNcWrkujQiIgIiICJlYKDJKxlERbCIiAiIiiIiApaP5Qz+v5KLCmox/3hv9VmrYQuU3yaL7A/JSKOm+TRfYH5KRedsWlv8Apay3yfj19PNxjEYHyQVMkDpIz1scY3Dc36DkLdIg69TaOskFho7MI6jo9DIZKZ7J3QyxOOep8e13U4jOckdZJ5rl/Y/T7beyhjpJoY2VDqlkkVVKyVkruTniQO3gny8+a36INPT6YslPHRMhpHs6DM6eBwnk373Z3Oc7dl+7JzuJz5VWfozT5pqenZT1cDaYPbC6GunjkYxxy5m9rw7YT/s5wPIF2FEEFvo6W30MNFRQMgpoGBkcbByaB5FOiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIggrvk/+Nn6gsLNd8n/AMbP1BYQEREBERAREQEREBERAREQVrV/K6T7ln6QrKrWr+V0n3LP0hWUHXvCFpz+1GmZrcyRsVSx7Z6aRxIa2VhyM454PNpxzwTheTVVnuNPQ322v0hqqnq63h9FZTVs89O1zmBkhc8SbXAYLhv5nO08gvekQdG8Gek5LRW118rKE0E9WxsNPRuqnVDqeFvPDpHE5c48yAcDAAXeHNa5pa4AtIwQfKFlEnEdIZoq7Q2p+nqTU5gsDnkNhFJmpjhJyYWzb8AdYBLSQDhTVGk77De7pXWTU8VthuPC3xutwmfHw4wwbXmQDOBnm0ruKIOqWLRFBaK+KSGZ01Iy1m3vgmZuMu6QyPe52eZcScjHl/opdAaTGk6e4U7bjJWx1VTxY+IzDomBjWNYTk7sNaBnl9S7MiXz+b+5n0sIiICIiAiIgIiICIiAiIgIiICIiAiIg1l0stPc7lR1VZLLJDSEvZSkjhOlyNsjhjLi3ngHkCc4yAVs0RAWi1v/ACqL78fpct6tFrf+VRffj9LkG8j+Lb9QWViP4tv1BZQEREBERAREQEREBERBwd8op/tn9LlbVR3yin+2f0uVtBDWfEf42fqCoy/GO+tX6v4kfbZ+oKhL8a76110bNTgmSsout2GOtMcllEBAiBSSWVywsBZUQREQERYygyixlEAlMrCJYYcoZG5U5C4kBWEmLomVNRC3ax+WjqBGcIa6p87PZWXMXAxqasMYs9OqfNH7KdOqfNH7Kpxw15hHGkh4omJzGCGmPJwOeeeMZXDg3Tht8ak3k+P4rsAY8nPz+f8ABNWGL1L/AE6p80fsp06p80fsqpJBXCoLo3wmIuHivByG8urA6/hdf0fSsQxV4fFxnUzm8+IGtIPVyxz86urC3qXOnVPmj9lOnVPmj9la98N24Ttr6PiEnGWuwB5D+fJTSw1pe7hOga3aNu9pJz5c4/BLQXqWunVPmj9lOnVPmj9lU4oa8SM4j6csx4+Gncev6ceZYkguDmStbJA05bw3AHIGfGzn6OpLQXqXenVPmj9lOnVPmj9lUpo7kATEKU8xyO7q55/9Mf1XF7Lk2nlLW0rpRt4QAOD6WefZzS0F6ua/06p80fsp06p80fsqk6K4b27XUxac5y05HPl5efJYENy2sBlpd3+2Qw4+jHP/APD6FdWC9XNe6dU+aP2VkV1T52eyqkMVbuBmfT4DupjT1c/Lnr6v/wAOuyI1NWGo1pZlnmnwJH8vMOQWWNwFlrFI0YVwhuI3shZWEyjTKErCItjKIiAiIiiIiAizhMIMIAsplAwiErGUsMqWkP8A3hv9fyUKlpPlLP6/kpVskhdpvk0X2B+SkUdN8mi+wPyUi8zYuo6p/wDtj6N//wB7/wC8hduXluvtI3+56orayjt3S5ak038MuXTeH/CdmOIdhOTkgu8UHOcFBV1/arpV+EN9JTQGouFxjimtFaKss/hbIS0TEs8xJzy+Fux5F6HrLUMGmbM25T0VXW76mGmjgpQziPklkbGwDe5rfhOHWQotNaaitNXUXKqrqm6XapYGTVtTgO2DmGMa0BrGZ57QOvrypNYWL+0NtpqPpXRuBX0tZu4e/dwZmybcZGM7cZ8mc4PUg63Y/CfSXPpP/wDDGoYHQ0k9RHHwI5ZKh0MvBliY2N7iXtkIbzwD1g45rZ2HWUl1N3pHaautHeLXGyWS2TS0xlkZIHcMteyUx89rhhzhgjnywToqrwXSS2moootRSQPlgr4myspsY6TVtqOYD+bRt2FuRuBPNq56O8H110vcbpcbVctM0U1woo4Oj0enjBSwyRucWPEbZwSMPcHAuyTghzQMEL9i1of7H6k1Dd6W4RCzVVVx6WWKETRNiaH8McOR7H4aeTt3P6Ff03q9t2vbrRVWK52ipfSCtpemGIiog3Bpc3hvdtIJblrsEbh9ONDQ6C1KbFqqzXXVNoqafULal73U1lkgfBNMwMLgXVLw5gA+DgHP+0uzx6d2asoL90zPRLXJb+Dwvh7nxu37s8scPGMeXr5IN8iIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiIIK75P/AI2fqCws13yf/Gz9QWEBERAREQEREBERAREQEREFa1fyuk+5Z+kKcyNBxh/sFQWr+V0n3LP0hWUHDiN8z/YPcnEb5n+we5c0QcOI3zP9g9ycRvmf7B7lzRBw4jfM/wBg9ycRvmf7B7lzRBw4jfM/2D3JxG+Z/sHuXNEHDiN8z/YPcnEb5n+we5c0QcOI3zP9g9ycRvmf7B7lzRBw4jfM/wBg9ycRvmf7B7lzRBw4jfM/2D3JxG+Z/sHuXNEHDiN8z/YPcnEb5n+we5c0QcOI3zP9g9ycRvmf7B7lzRBw4jfM/wBg9ycRvmf7B7lzRBw4jfM/2D3JxG+Z/sHuXNEHDiN8z/YPcnEb5n+we5c0QcOI3zP9g9ycRvmf7B7lzRBw4jfM/wBg9y0ut/5VF9+P0uW9Wi1v/Kovvx+lyDeR/Ft+oLKxH8W36gsoCIiAiIgIiICIiAiIg4O+UU/2z+lytqo75RT/AGz+lytoIqr4ofbb+oKjN8c/6yr9T8WPtt/UFRn+Of8AWV00bFaNEKLqyIizhBhcgOSALOUQRYJRQZysErCIMrCIrYEREBERVbCLOFlBwwhC5ogj2ptXPKIWhw2ptXNELOG1Nq5ooOG1MLmio4YWMLmig4YTC55WFRxws4WURbCIiFhERFEREBEwsgIMJhZRAwiZWCUGUysIlgyiIqCIiApaP5Qz+v5KJS0fyhv9fyWathC7TfJovsD8lIo6b5NF9gfkpF5mxEXnuvdQampoxSy219itUteymmvTKyN7o4HPxvDcf3ZdyG4/B3edB6Ei8ytV1u1q1TVWfTE9VrOgFIyeXpFxY51JKXEBvGI5hwGdh5jGeorvtUbrU2AupXQWy5yQNcOPH0lkD8AkENc3fjmOTh50GwRfP1otd2t/+jvfdU1dxoaqvuNkM/Hjp5YZy8kuJkldM/fzPWGtx+C7ZqHW+qdEx17dQOtV5ebLJcqI0NHLBw3skjjMT275C9uZmEOGDgO5dSD1VF5xobUmr7tc7haK3c//ALlx6W6S6YrLfDFNu2mJ0c78ydYcC14JAIOOtdJsNNqCz+CvVOuKi8UE9zljr4+lx0UkdRERUvYZDI6Z42tDchoaNoa0Z5cw99RfOVHPHp2su9dYLhVWnTt309XPpBCXSvJgMUcdf4zsullfK/Dsjc0RknPNbnRlazwfX2qrtR2Q6Qov7Ouq5aSOv6ZHWSxPaZZnOzylbva3mPH3/COEHuiLxbwR6qt978Ld1qHavtt0rLlZoJxR0lwZNFSlssv9zGGkgljNm5w6ySeQIC9M8In/ANr/AFF/+aqr/wC9OQb1F4xU6bsGj9M6O1HpS1Ulnu89ZbaaQULRA2uZM5jZWSsbhsnilz8kEgtyMYKmn19qGn1dSyMuUVfa6i+C1yU9PZpm00THSGNrm1j9rZJQ4DcGhzchzcDG5B7Ci8QpNS6wsGl62Z16NzqrhqqotdK51vdM6lAmlLnhgfmTxWENZkAHHkWxg1HqOako6bUNuNT0fUlBDS1tbbDSunjk5l3CLjtkY4EbhyPI4CD15F45orXetL3c7RdeiVNRa7pVmKSjbZnxxUkBLg2VtUXYe4YbuyMHJwBjne03qnV839l71cLjb5qG9XSe3SUMdGWcNrePskEm4kvzDzGMYdyAIyQ9VRdJ1vcdSv1rY9M6fulFa2XCjq6ioqZqTjvbwjCG7GlwGTxDnORjyLpdR4QtW1VTRaailEFyjlr4664W+0PrOKKWVkYMcO/xN28FxcXbcEDrBAe1IvLrTqfXV3rtL2t4o7JV1lPWy17qm3vcXtp5omNcyMyAx8Rr84cXbd3lwr/hdqrjR37Q9RarX/FKtt4l2U3HbDv/AO5z58d3IYGT/RB6Ei8VrdV6jtmrNW3qt07DarnHZrbBSwT1baiMukqp42yPczHihz8kdeG9fNbHUOrNY6Nq6qzXK52y+VlVRxTW+qNEadsEslTHTkSsa87owZmuGCDhrgSetB6yi8g8I8WsKTStVbbpqKy3WU11rlo5uimGaN5rYweJC1xDo8gYIcD1g+dR6xuN8FNedOXu4QXJ1BdLJUQVTKYQOLJqxmWOaCQdpjOCMciM8xkh7Gi8e1Rr7UFr1NNU0txirLdTXiC3y0VNZpnQNjfKyNxfWu2s4wLydrNwBw0gnJVDVdy1ZqHTDdQy3a2xWZ+p6alZa+hkvZHFcWRB3G35MhczcRt24OMZ5oPcEXjY15rSsv8AWVtrpKqooKS8vtwtsdle9kkMc3CkkNVuw2Tk5wGNoADSCeav/wBqtXtBvz7jb/4dDqg2c0AojmSE1XADzJuyHjIIwMYGCDnID1VF5/4U4blUat0LDaq2GiqXXKoHHkh4uxvRJckNyAXY6s8h1kHqWtsuoLpW3rTVHeWUFbW02oLjbX1Yp9hcIYJdsjG5OxzgAHY5czjGUHqSLynTuqdYTt0xeq+5W+WivV0nt0lDHRFvCa3j7JBJuJL8wjIxtIdgAEZNu03jWNRqS5GmvtDc7FaYJm1lQbbwRJVBpxDE4PO7Yfhu6gcNGTu2h6Wi85odW3yvdoWmbLTQv1BZJ6upkEO7ZK2GJzS0Z6g555eXzrqng1oza9A6HgqYbZWjUt2ZNXvNC1j5HCGWYPe4El8gkiYd7ufLCD3FF5FQ6kvIrpdIWF1ts3E1JV26mqei7208McAnOGbgHSOc52MnHWcHGFRq9faxppqjTslbSVNyOoJbYy4UFqfMWQx0jJyRAHnMpLsHJ2jmccsIPa0Xk9v1VrqsFks83Dt1XWXeooXV1VbHRunp2UzpWzNgc/xH5G3mS3IJxjku4eDa7XS6WetjvM0FRW265VNA+oii4bZxE/DX7MnaSMZAOM5xjqQdoREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQQV3yf/Gz9QWFmu+T/wCNn6gsICIiAiIgIiICIiAiIgIiIK1q/ldJ9yz9IVlVrV/K6T7ln6QrKDWajv8AatPUkNVd6h8EU0wgjLIXylzyC4ANYCepp8nkWm/1i6T+eV//AJVVf+2nhE+W6S//AMgi/wDvMy56lrbRpKgir6+tvE3D28OGOoklkl4bHk+LnmNpc5xPLxWk9QQW7BrDT99uTrbbauaSrbCZzHLRzQnYHBpOXsAPNwH9Vvl0zTNwt+o9ZvvdO6so6qhoZaGWgq6cMk5zDMgcHEEB0Tm8s8weY8vcz1FSZsCLyG3RXOl8F7dbU+pL1/EqdktQ+OorXzU8wbK4bHRvyAC0YGMEFdjuGsr3i7XC2WmjmtdlIFZxp3NnlIjbI/hgNIG0O/2uv6FcIw4Fne0XndTry9GK4XO32ehqLXQ10dK4vqXMmmEgj2lo24bgyNzkqS6alvDrdf7Vcqagpa6idAw1ENyNNAyObmHmV2HN24Occzyx1puvnd1Ixl6Ai8vsmua1lI+ko4KW5V0l6ZR8Xp0jqd3GjdI17HPaXNaNuNoBAxy6wrlf4Qqy2W+oguVJbobpDdP4cZDO5tKMxiTikkbgA0/BxnKZ9usEZ9ekvREXm9t8IlwuUtJbrdRWyquEtc+jdKypf0Y4hMgladu7GAQW4zkEZ8q7Xoq9VV6t9Ua6migrKKslo5xC8ujc9hHjNJGcHI60tny6wZ9+kt6iIgIiICIiAiIgIiICIiAiIgIiIC0Wt/5VF9+P0uW9Wi1v/Kovvx+lyDeR/Ft+oLKxH8W36gsoCIiAiIgIiICIiAiIg4O+UU/2z+lytqo75RT/AGz+lytoI6j4sfbb+oKlN8a/61dqfis+ZzT+IVKb41/1lboYrcMJhMoSurBhAVhEGcrCIrYEREBEWVSzCLOEwisLIWUQYwsplYygysZWEQZyiwiAiIgIiICImUBFgoimURELCIiKIiICIs4QYRZCIGERMoCFYRLDOVhEVBERAREQEREBERAUtJ8pZ/X8lEpaQgVDSeoZ/IrNWyVXab5NF9gfkpFwpgRTxg9YYPyXNeZoXCeKKeF8M0bJYntLXse0FrgesEHrC5ogq223W+2U/R7bQ0tFDndw6eFsbc+fDQBlWiAQQeooiDSyaVsEmj3aRfbw6yOpjSupTK8gxH/Z3Z3fjlUbXoDSlvZXMjt81U2vpuiT9OrJqv8A7vz/ALlpme7ZHzPitwPoXaEQaHTGkbHpyeeotsVY+onY2N89bXz1cvDbktjD5nuc1gyfFBA8uFcobFaaKyy2Wnomfw+YymSB5L2v4rnOkB3E5BLncurnjqWyRB1Sz+DvSNroq2jhts1RBW0oo5m11ZNV/wDdxnELTK9xZGMnxW4CsaZ0Tp/T1wdcKCO4TVZh6OyavuVRWPiiyDsYZnv2NJAyG4zgZzgLsaIKTLVQMvct6bBivlp2Uz5d7ucTXOc1uM45F7jnGeamuNHT3C31NBWR8WmqYnQzM3EbmOBDhkcxyJ6lOiDqlg8Hek7Jcaa4UdDVzVVIzZSyV9yqa3owxj+6E8jxGccstwccupQyeDLRslX0h9DXHbV9Nii/itUIYJ9/EMkUYk2RuLsklgGcuHUSD3FEHWKnQWlqhlzZLQ1PDuc4qaiNtfUNY2YO3CWJofiGTdz3xhrieZK523Q2mrfStghop5SK6OvdNU1k088lQzGx75XvL34AAAcSMDGMLsiIOr0OgNK0V9ZeKehqBPHO+ohhdXTvpoZn53SR05eYmPO53jNaD4x85V+n0tYqejttHDQ7YLZVOq6NvFeeHK7fl2Scn4x/I5HPq5BblEHUtY6Ft+qdS2m73Cqq4m22nqIo2UlRLTS7pTH47ZontezAYRgdYcc/TJUeD7SstooLZHQ1NJFby80s1JXz09RGX85Dx43iQ7zzdlx3HmcldpRBpbRpTT9pkt0lutzad1tglp6UtkedjJXNdJnJ8YucxpLnZJOTnmc3bhaqCvraCsq4OJPb5nT0rt7hw3ljmE4BwfFe4YORz86uog1Fy01YrlPcJq+3R1LrjRtoqsSOcWywtLy1hbnAwXu5gZ59fILWUHg90nSUNwozQVFbHcYRT1TrhXT1kj4hnbGJJnuc1oJJABAB59fNdqRB1Wg8H2laOnniFHV1RqJYJZZqy41FTM4wPD4hxZHufta4ZDc7evlzObt50jp+8OuDq+he99wbA2peypljc7gOL4i1zHAsLXEkFuD9K3qIOm3DwY6Nr56mWqoa+RtRP0l8AutU2ET5B4zYxIGMkyAd7QHZyc5JK51Hg10bUXR9xlttQXvq21pgFwqBTdJa4OEwgD+GJMtBLtuTzz1nPb0QdXq9AaVqr868zUNQZ31DaqSAV07aWSduNsr6cP4TnjAO4tJyAesBXzpawmgdQmh/7u64fxIs4z+dTxRLvznPwxnHV5MY5LcogpV1qoK6voK6qg4lRb5HS0r97hw3OYWOOAcHLXEc89apwaWsUFbDWxUO2eGtmr438V5xPK0tkfjOOYcRjqGeQC3KINJHpSwR2+30EdAW01uqXVVIwTSf3crt+XZ3ZPxj+RJHP6Bihpnwf6b046EWkXmKGFjmR0019rZ6YNcCCODJK6Pyn/Z5LtSIOq2DweaUsdxpbhb6GqFRRxyQ0hnuNRO2mjeAHRxtke5rGch4rQAMDHUrNZovTlVpuh086jmioLe5j6MQVc0UtO5mdrmSscJGnBIyHcwSDyK7CiDoOofBna59Mvs1i6LRskrxX1DbjC+vZUy7dpc8vkEoccA72SNduGSTlwMelfBXZbbpme03MQzyT3A3HiW1klvFPNsDAYCyQyRkNbgu4hc4lxJ8YhehIg6/aNGactTaEUdA8PoaiSqhlkqZZJDNIwsfI97nF0ji1xGXl3k8wW0tVroLU2qbQQcEVVTJVTeO526V5y53MnGT5ByVxEBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERBBXfJ/8bP1BYWa75P8A42fqCwgIiICIiAiIgIiICIiAiIgrWr+V0n3LP0hWVWtX8rpPuWfpCsoNXqWx0t+ooqeomqad8E7aiCemfskhkaCA5pII6iRzBHNdP8IOirpW6epWW2trrtWUkdRGBV1piklbM0db2bQdpa3xXDBGQV6IiDz/AMGml7pbr1WXq5009DvbNFBTTXB9U8tknMm5xLnNBADByJJO4k816AepEQdLo/BzbYaaChnvN8rbZBJxG2+ednAcd24BwYxpcN3PBOFbu+iKC4VddILlc6SmuJaa+jp5WtiqSABzy0ubkAA7SMgLtKIOuu0fazQXGibLVMhuFbHWyBrmjY9hjIa3xeTf7tvI5PXzUd50XbrncKq4OrK6nq55qadskTmf3UkAcGFoc0j/AGjkOyD9C7MiZz5DqVNoO3xXQXKa6XWqqTWRVsjppIyJJY2uaCQGDA2uxgYHIYx5bFdoy21MtXUCqroKqor217KiJ7Q+CZrAzLMtIwWjBDgc5K7KiZ9ukeRn36y69SaTpoqugram6XSuqqKpkqWy1MzXb3PjLCCA0BrQDya0NC2Fjs9NZxXCmfM/ptZJWScQg4e/GQMAcuX0/WtiiZz5Gc+ciIiAiIgIiICIiAiIgIiICIiAiIgLRa3/AJVF9+P0uW9Wi1v/ACqL78fpcg3kfxbfqCysR/Ft+oLKAiIgIiICIiAiIgIiIODvlFP9s/pcraqO+UU/2z+lytoBAIIIyCqrqFhcSJpm58gIP5hWkViZhJi6p0Bvzib/AC9ydAb84m/y9ytorrSasKnQG/OJv8vcnQG/OJv8vcraJrSasKnQG/OJv8vcnQG/OJv8vcraJrSWhU6A35xN/l7k6A35xN/l7lbRNaS0KnQG/OJv8vcnQR84m/y9ytomtJaFToI+cTf5e5Ogj5xN/l7lbRNaS0KnQR84m/y9ydAb84m/y9ytomtJaFToDfnE3+XuToDfnE3+XuVtE1pLQqdAb84m/wAvcnQG/OJv8vcraJrSWhU6A35xN/l7k6A35xN/l7lbRNaS0KnQG/OJv8vcnQG/OJv8vcraJrSWhU6A35xN/l7ljoDfnE3+XuVxE1pLQp9Ab84n/wAvcnQG/OJ/8vcriJrSWhT6A35xP/l7k6A35xP/AJe5XETWksp9Ab84n/y9ydAb84n/AMvcriJrSWU+gN+cT/5e5OgN+cT/AOXuVxE1pLKfQG/OJ/8AL3J0Bvzif/L3K4ia0llToDfnE3+XuToDfnE3+XuVtE1pLKnQG/OJv8vcsdAb84n/AMvcriJrSWU+gN+cT/5e5OgN+cT/AOXuVxE16uJZT6A35xP/AJe5OgN+cT/5e5XETXq4llPoDfnE/wDl7k6A35xP/l7lcRNeriWU+gN+cT/5e5OgN+cT/wCXuVxE16uJZT6A35xP/l7k6A35xP8A5e5XETXq4llPoDfnE/8Al7k6A35xP/l7lcRNeriWU+gN+cT/AOXuToDfnE/+XuVxE16uKqfQG/OJ/wDL3LlHRRseHGWV+PI4jH4AK0ia0giIsgiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiCCu+T/wCNn6gsLNd8n/xs/UFhAREQEREBERAREQEREBERBWtX8rpPuWfpCsqtav5XSfcs/SFZQEWt1Leaaw2iS41TJZA1zWRxRN3STSOIaxjR5SSQFpReddEZGh6IA+Q3tuf6/wB0g7Yi0WmdQSXKsq7Zcbc+2XWkDXy0xlEjXRuztex4ADmnBHUMEEFb1ARVLPcqK726K426bj0s2dj9pbnBIPIgHrBUstXSw1UFLLURMnqN3Bjc8B0m0ZdtHlwOtBMiIgIihqqulpeF0moih40gii4jw3e89TRnrJ8yCZFXpqyCoqKmniMhkpnhku6NzQCQCMEjDuR6xlWEBERAREQEREBERAREQEREBERAREQFotb/AMqi+/H6XLerRa3/AJVF9+P0uQbyP4tv1BZWI/i2/UFlAREQEREBERAREQEREEcm7jQbSAd55kZ/2XKxif1kfsHvUDvlFP8AbP6XK2gjxP6yP2D3pif1kfsHvUiII8T+sj9g96Yn9ZH7B71IiCPE/rI/YPemJ/WR+we9SIgjxP6yP2D3pif1kfsHvUiII8T+sj9g96Yn9ZH7B71IiCPE/rI/YPemJ/WR+we9SIgjxP6yP2D3pif1kfsHvUiII8T+sj9g96Yn9ZH7B71IiCPE/rI/YPemJ/WR+we9SIgjxP6yP2D3pif1kfsHvUiII8T+sj9g96Yn9ZH7B71IiCPE/rI/YPemJ/WR+we9SIgjxP6yP2D3pif1kfsHvUiII8T+sj9g96Yn9ZH7B71IiCPE/rI/YPemJ/WR+we9SIgjxP6yP2D3pif1kfsHvUiII8T+sj9g96Yn9ZH7B71IiCPE/rI/YPemJ/WR+we9SIgjxP6yP2D3pif1kfsHvUiII8T+sj9g96Yn9ZH7B71IiCPE/rI/YPemJ/WR+we9SIgjxP6yP2D3pif1kfsHvUiII8T+sj9g96Yn9ZH7B71IiCPE/rI/YPemJ/WR+we9SIgjxP6yP2D3pif1kfsHvUiII8T+sj9g96Yn9ZH7B71IiCPE/rI/YPemJ/WR+we9SIgjxP6yP2D3pif1kfsHvUiII8T+sj9g96Yn9ZH7B71IiCPE/rI/YPemJ/WR+we9SIgjxP6yP2D3pif1kfsHvUiII8T+sj9g96Yn9ZH7B71IiCPE/rI/YPemJ/WR+we9SIgjxP6yP2D3pif1kfsHvUiII8T+sj9g96Yn9ZH7B71IiCPE/rI/YPemJ/WR+we9SIgjxP6yP2D3pif1kfsHvUiII8T+sj9g96Yn9ZH7B71IiCPE/rI/YPemJ/WR+we9SIgjxP6yP2D3pif1kfsHvUiII8T+sj9g96Yn9ZH7B71IiCPE/rI/YPemJ/WR+we9SIgjxP6yP2D3pif1kfsHvUiII8T+sj9g96Yn9ZH7B71IiCPE/rI/YPemJ/WR+we9SIgjxP6yP2D3pif1kfsHvUiII8T+sj9g96Yn9ZH7B71IiCPE/rI/YPemJ/WR+we9SIgjxP6yP2D3pif1kfsHvUiII8T+sj9g96Yn9ZH7B71IiCPE/rI/YPemJ/WR+we9SIgjxP6yP2D3pif1kfsHvUiII8T+sj9g96Yn9ZH7B71IiCPE/rI/YPemJ/WR+we9SIgjxP6yP2D3pif1kfsHvUiII8T+sj9g96Yn9ZH7B71IiCPE/rI/YPemJ/WR+we9SIgjxP6yP2D3pif1kfsHvUiII8T+sj9g96Yn9ZH7B71IiCPE/rI/YPemJ/WR+we9SIgjxP6yP2D3pif1kfsHvUiII8T+sj9g96Yn9ZH7B71IiCPE/rI/YPemJ/WR+we9SIgjxP6yP2D3pif1kfsHvUiII8T+sj9g96Yn9ZH7B71IiCPE/rI/YPemJ/WR+we9SIgjxP6yP2D3pif1kfsHvUiII8T+sj9g96Yn9ZH7B71IiCPE/rI/YPemJ/WR+we9SIgjxP6yP2D3pif1kfsHvUiII8T+sj9g96Yn9ZH7B71IiCPE/rI/YPemJ/WR+we9SIgjxP6yP2D3pif1kfsHvUiII8T+sj9g96Yn9ZH7B71IiCrWCXgjc9hG9nIMI/2h9K5LNd8n/wAbP1BYQEREBERAREQEREBERAREQVrV/K6T7ln6QrKrWr+V0n3LP0hWUHTfC5TirslqpXSyxCa90UZfE7a9uZQMtPkIzyK6zf7DpG36jisFzueqKme8GI1xFRuiqC55ZFxyAMZcNo2Y6hlekagsttv9AKC607p6cSNlDWyvjIc05BDmEEY+tddk8GGipZRLJa6l8gxh7rlUkjByOfE8h5hBT0taBZvCnXUouFwr91jgfxa2YSPH99I0NBAHIBo/E+Vd+PUVo9PaTsVgrJqy10k0dRNGInySVUsxLQcgeO445k9S3ikxeB45pCjiukOi7XVyVJopaK4umhjnfG2XbMMB20jIGcqrQwW6V+jK6/1c4p46i40bqmaskYAGPeIWl4cMHljrycYOcL21FeH5956k455Zl4Zp+pvEt8opP4lRQ6jdcpGVUb62pfVPYHO3RvgDCxse3GDyaMA5CntE9NDU6TaJr3HqCS6xsvQndOGueWvyH7vEPMeKB5M/Sva8DJOBkjBWht2jtP2+tgqqakmBpnufTRPq5XwwOdnJZG5xYw8z1AYzySjCY5W9OpVjfnfP4ebU/Q6fQVsr7jU100tzuUkE8lTdpIKba2SXa2V/jbI/F6mgZOMla2N1FW2OJt0qt1FbNURMDo6ybhU9JIxpBD3EO4ZPwXn+hAK96IBGCAR9KJThnw6eqzj6/PX0eN3KriN8raepuFQ3S/8AF6eOqlZUv2NhNG0xgvByI3P25OcHIyea40DWXDUVvtVJXV02mJLzNFRubVSASxilLnsa/OXRh4IHPHWF7MeYwUAAGByCR0+Onqn7+evo8RuM1bTUEdsNS1tiptQ1lLJ0yslihYxrQYY5JW5cGZLsA8sgAqzpynmut10/bK+5Pq7VNNceEylq6jhuha2LbHvcGukY127B5gjlkjkvZSARgjIKJGG3OFicdmdvV1TwUySu0nwpZpZhT1tVTxGR5e4Rsme1oyeZwABzXa0RAREQEREBERAREQEREBERAWi1v/Kovvx+ly3q0Wt/5VF9+P0uQbyP4tv1BZWI/i2/UFlAREQEREBERAREQEREHB3yin+2f0uVtVHfKKf7Z/S5W0BU23S3uvD7OKuPp7IROYCcO4ZJG4ecZGOXVyz1hXF0jwtdB6DRcDj/ANpeKf4J0THH42OfXy4WPh7vF29fPCDu6guFbR26hmr7hVwUlJAwyTTzyBkcbR1uc48gB5ysWzpn8Npf4jwem8FnSODnZxMDdtzzxnOF07/SB/8AtI6z/wDzPUfoKzXVq0zPBqinWqiOLf6e1dpTUU8kGn9T2W7yxN3SMoa+KdzB5yGOOAt0vnWhlu1t8J2g7hfjo2qmfBV09BHptjo6kvdTF39+HFxfEA0jxSMOc081x8Fmr9e3O56QvVXV3GSO/TSCvjrrnQClkZseSKWBruMx0TgOWCcB28Z6t1Wj8ftzirC8+L6MVetr6GidTtraynpnVMwgpxNK1hlkIJDG5PjOIBOBz5FfO1PqTXMPgm0ZeH6mvtzrdV3GKlqnRupIHU8YbMRHA57GsY95a1pe9zif9nBIC2Vp1HrBptNruVdO2NmtoLfE+espKurbA6lke6GZ0Jc0Pa8ZBOHYLc555RTOtq84j1iP/aM7dVTqxflM+k9Jzs9+BDuog+TkhIaMkgeTmvm3TFPfLL4Nb6+y60rxWVOr6mhMVVW08L3tFY8PbC90e1lRKPK7xcnlt5JrGoq7x4Pqq2VmptUQVFn1dbYZYbg2lFTStkmgLWPmj3xzBu4yNeCCDgOzjnKfutbfb11f7o+bYE4Xvuv6X6f5fSa11XfbHRvqmVd5t1O6j4XShLUsaYOKcR78nxdx5Nz1nqyvBtdag1vDqzVFotl4v3C0zbqV1FVtuNvponOfEXmpq+Pt4rS7xTtAYA13U48qOtqyprKXwgVlwZDDWT02lpp445A5jXmZpdtIJBaCTggkfSrTF7c5iPMqwz4dX0wi8R1xri8WuxeGCRl96NU2V9P/AAvJYHQCSmiLdoI57nl2M5ycqlrq7ardL4ULvSawu1A3SkNLU2ykpxEIt5pGSu4mWEva458XOOZ+jGb4X5X/ABh1WIvMRxvHlbq97RfO+vNZXFr9fXCu8IdTpm5WOjjNktkT4WMqGvpWyCQskaXTF8jnMGD4u3lgrnq3UeqxPPdnamvEdBbbBRVj3WWekc+3yuj3yTVdLMWumY7rAY48gQADzV8eXrefjFmJva2/9R8voVV6WvoaqpqqalrKeeekeI6mKOVrnQuLQ4NeActJaQcHyEFfOuq9b65rb3qy5WevuEDLFNAy3ltfQ0dvax8McjX1MdQ4SPEpeeeeQwGnIK3Wo9T6oFXqeno7vLa5/wC11mt8ckMcT3U8c8VPxGjLSHc3u5nPYkXmYjjb1mIj3JmNvj6RMz7PeFgkNGSQPJzXgl8umrrS7WGlLfrCqm6FdrZHRz19XDFWSR1LN8tPFO5mwSOIIYXDlnGepajWNRV3jwfVVsrNTaogqLPq62wyw3BtKKmlbJNAWsfNHvjmDdxka8EEHAdnHNGM2jl66vtrZwvZwi88JnyiemcX0mtdV32x0b6plXebdTuo+F0oS1LGmDinEe/J8XceTc9Z6srwbXWoNbw6s1RaLZeL9wtM26ldRVbbjb6aJznxF5qavj7eK0u8U7QGANd1OPKjrasqayl8IFZcGQw1k9NpaaeOOQOY15maXbSCQWgk4IJH0q0xe3OYjzKsM+HV9MIvFtba1u9so/DFsvfRpbLS00lp3FoMHEpWkFuRz3SZxnPPktRq+8atlh8JV6ptY3ahGlqWkqrdS04iERkNGyV/Eywl7XHPi5xzP0YzeMZ4RE+axF5iOP66voBF4HrnVtab/rGS5+EGo0pLZbRT1Fko4nwxsq3SQF7pCyRpM+Zf7sNb1Y5YcQV1+o1nr28CQRXG8wutml7dXwzUlfQ0kRmlg4j6mp6QRxGbxtIHigNd5SrOF77v30SPutbf+ur6cReB3C7ayvz9U1M+qrhZZLPpOgu0VNbJIXQirfDM9xL9rt8eYwNodtcD5eS9m0ZX1F10fZbpVlpqKy3wVEpaMDe+NrjgeQZJV1f5o4fvpKX2c+kT8w2FTMYxtb8I/gqbnFxy4k/WpKvPHP8ARdT8Ijr1JbIKC02+uqYquTh1stHJE2aKDHjBnEe0bnfBznxck9YC9fZ9FFdUU3tffLzabSasTO23B2FlXSyUhq2VMLqYAuMoeCzA6zu6sDBUNBdLZXvdHQ3GjqntGXNhna8gec4K880kceAC5QtopqSOGiuEcbJC05aHS4xtceQzjn5WnyYJ11Jd4KLQtZUWO/aWdcIqKAj+E0rWVEWZI2kyf3j9w54OQOZX0v8Ab4mqumJxirVjz2za7wT22YpoqmNsXn02Xs9gReZVUl8t9xuDmamuc8dtvVDTxRzcMiSOcw8Rr8MBd8YcdW3yKjY9Q11TdaVsOqaqqukt9qKOW2ExkMpBLIN4Zt3eK1ocHk4yNv0LEfT6qqdamqJj88L8OE+DVXbaaZtVE+nGY48perQ1FPM+WOGeKR8TtsjWPBLD5jjqK5CaIzugErDK1oc5m4bg05wcebkexeF2uouVlsdoZFejQ0Vwkrpqiqnq4qMOmZOQ1pmELuZG521w8Y5AOBtW2mkvVVNcby+9z0txpdJ09WZaRgayeRrp3NLmyMB2nHNuG5yeXUu1f0uaZmdeLbPKbe8ezFPb74auOHrbrHq9eimhlfIyOVj3RO2yBrgSw4BwfMcEH+q5ryiK+S22vu1Ua6OjB1JRSV5Lg0MppKaFu52fgsLhjd1cjz5FSW+9XLUF8paKnv8AVxUFXdbjEJqUsBdDHGx0Ya4tPLnkOHWDyK5T9Orte+Fr+l2o7dRe1sZm3rMR7er1NF41NqO+PsslTc79dKJ8Fpc+3yUtMCKyoY+Vjy/xCCQGx+LyADi7l1jndtS6lF/4YvVPQyxxURoYJ6rZ0riMaXu4LYXun3OLm+K4FuPJ1rUfS9JM2iqPXpnFKvqOjpi8xPp4vYlNBO5rgHHLfp8i8ws1fejcqC5S3usmZPqGrtr6V4ZweC0zbQAG53Axt8bOfJ1L0leLtHZ+6mImbvXodPrzNotZs0XGPPDbnrwFyXznuEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREEFd8n/AMbP1BYWa75P/jZ+oLCAiIgIiICIiAiIgIiICIiCtav5XSfcs/SFZVa1fyuk+5Z+kKygIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAtFrf+VRffj9LlvVotb/yqL78fpcg3kfxbfqCysR/Ft+oLKAiIgIiICIiAiIgIiIODvlFP9s/pcrapyuDJoHHq4n/SVcQFTba7e28PvApI+nvhEBnIy7hgk7R5hk55dfLPUFcRAUFwoqO40M1BcKSCrpJ2GOaCeMPjkaetrmnkQfMVOibRorBozR+n6x1ZYNKWK01LmbHTUVvigeW+YuY0HH0KS3aT0tbr3UXy36bs9JdKndx62CijZPJuOXbngbjk8zk81uUQaubTun57B/Z+axWySz7Q3oDqRhp8A5A4eNuM8+rrXGg0zpygoKOgobBaqakopukUkEVHGxkEvP8AvGNAw13jO8Yc+Z862yJzGkqNH6SqH3F8+l7JK+6Y/iDn0ERNXg5HFJb4+DzG7KzSaS0rSWCXT9LpqzQ2eYky0DKGMU8hOMl0eNpPIdY8gW6RLYWObr9bojRlb0DpmkrDUfw5gjouLbondGYOpseW+IB5AMAK3ctNacudVPV3HT9praiopuiTS1FHHI+SDO7hOLgSWZAO08s+RbVENjQV2idGV9TFU12krDVTRU3RY5JrfE9zIcFvDBLeTMEjb1YJCvzWOyzx18c1nt8jLk0NrmvpmEVQDdoEuR44DQG+NnlyWwRB0LWPgvt+prnVVU+ob7R01ZTimqKOB0DouHtLXNjMsT3wBzThwiczPX181vblojRtzko5LppWy3CWhibFSyVVDHM+Jjfgta5wJAC7AiRgTi01z0npa6XinvNy03Z625023gVlRRRyTRbTlu15GRg8xg8irEtisc0ssstmt0kk1RHVSvdTMJkmjxw5XHHN7drcOPMYGOpbFE2DWV+nrBcI66OvsdsqmXEMFa2alY8VOzkziZHj7fJnOPIoKTSWlaSwS6fpdNWaGzzEmWgZQxinkJxkujxtJ5DrHkC3SIOv1uiNGVvQOmaSsNR/DmCOi4tuid0Zg6mx5b4gHkAwArdy01py51U9XcdP2mtqKim6JNLUUccj5IM7uE4uBJZkA7Tyz5FtUQ2NDX6K0dcKiCor9J2Krmp6fosL5rfE90cOCOG0lvJmCRtHLBPnV2WxWOWKuiks1ufHcWhlcx1MwipaG7AJBjxwGgNAdnly6lsUQdG1p4NqTU1zkrHajvltZLSilkp6V0D4wzBaTFxonmBxa7BMRZkAZ5jK29ToXRtXS2ymr9L2evZaoWQUJq6OOd0DGgBrWueCR1DsXYkSMNmc3JxzngpSWi1SS1k0lsonyV0Igq3ugaTURgEBkhx4zQHOAByPGPnVmmggpaaKmpoY4IIWCOOONoa1jQMBoA5AAcsBSIghqYTINzfhD8VTc0tOHAgrZIulOkmMGKqIlrEWzRa73kz3fNrFVtluo7ZTOp6GEQxOlklLdxPjveXuOSfK5xP9VvUV76bWTuonFrCAesZRbNFO95L3fNrCARgjIRbNE73kd3zdTvml7HeqkVFxo3SS8PhPLJ5I+LHnOx4Y4B7ck+K7I5nzrbsYxjWtYxrWtGGgDAA8wW1RantNVURTOyObMaCmJmqNstYpoIHOcC4Yb9PlV1FidLM7G40cCIi5OgiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIggrvk/+Nn6gsJXuAha3yukZj2giAiIgIiICIiAiIgIiICIiCtav5XSfcs/SFZVa1fyuk+5Z+kKyg6v4Vq6vt+g7hUWuZ0NWXQxRva7aRxJmMOD5Dhx5+TrXS47DamR7Lj4LL9PXHrl6e2o3Hz8UzAjsH1LunhWt1RddB3CipaaWpkc6GQxRfDe1kzHuDfp2tOPpXS47rpiGPgt8JmqqFvUaWpBMzfoHEhL/wA0G88FMl0gveoLNXUtTQ01K2mmpaOorelPgEgkyOJz5HYDjJx516Aepef+CmgZHe9QXWj/AItLb6xtMyCquZfxqh0Yk3u8fDtvjtA5AcuQ5L0A9Sk7BotCXmovukqO71rIY5phIXiIEMG17m8sknqHnVa3a4sVdWMgaayCKZr301TUUzo4KhrAS8seRg4AJ545Dlla7Rdq1pYrVSWWWKwmjhLwaiOqlMoDnOdkMMYaSN3VlaEaC1HUz26pur6SolpWzR1c38SnmlqmyRPY5zBI0MiIDshg5E+VoCVTtmFwdrt+vbDWVVJBivphW73UktTSPijnYxpeXtcRjbgZ54PVy5rnb9c2OsccCugY6B9TTyVFI+NlVGwZc6IkeNgc8cjg5xhdCtlBf9Q1unrPWx1LaK301RBK91qmpnxMdTuiBkc87C/mBtjLh1nOFtbL4PbjTsijqqa1sfS0M1PFUtr6qZ0sj4zGHBjyGRDBOQA/6MK1YXt+PX9Z2SNsX/Lt1l1jZrvU0UFJ00GuY99K6alfG2VrGtc4tLgMjDhzHIqKo1xY4204jFdUy1UtRFBDT0r5JJHwu2yAADyHynljmqEmm73Rw6TqrcbfPW2SldSzQzzPjjlD4mtcWvDCRgsBGW8xnqUOmNH3e3XKy1lbUULzRTXCSfhOd43SHhzdoI8nPOTy+lWYjWtGzH9JEzqxM7W0OubG6ioaimbX1cldv4VLT0r3zjhnEm5mMt2nkc/0ytrpy92/UFuNfbJJHwCV8WXxlh3NODyPMc/OvPamz3nSdZb7lS5kqzLXMe+Ohmq6cRTTcVoeI/7xrurBDSM5BI5E9n8E9FX0elXm5RyRz1NbUVOJIjE8tfISCWHmwnr2nmMqU4xeeHreMPJasJ/Ppji7aiIgIiICIiAiIgIiICIiAiIgIiIC0Wt/5VF9+P0uW9Wi1v8AyqL78fpcg3kfxbfqCysR/Ft+oLKAiIgIiICIiAiIgIiIIpwHOiBGQXn9JQdKjG2OVpb5A9uSP65CzL8ZD9v/AKSpEEXErfSg92f3JxK30oPdn9ylRBFxK30oPdn9ycSt9KD3Z/cpUQRcSt9KD3Z/cnErfSg92f3KVEEXErfSg92f3JxK30oPdn9ylRBFxK30oPdn9ycSt9KD3Z/cpUQRcSt9KD3Z/cnErfSg92f3KVEEXErfSg92f3JxK30oPdn9ylRBFxK30oPdn9ycSt9KD3Z/cpUQRcSt9KD3Z/cnErfSg92f3KVEEXErfSg92f3JxK30oPdn9ylRBFxK30oPdn9ycSt9KD3Z/cpUQRcSt9KD3Z/cnErfSg92f3KVEEXErfSg92f3JxK30oPdn9ylRBFxK30oPdn9ycSt9KD3Z/cpUQRcSt9KD3Z/cnErfSg92f3KVEEXErfSg92f3JxK30oPdn9ylRBFxK30oPdn9ycSt9KD3Z/cpUQRcSt9KD3Z/cnErfSg92f3KVEEXErfSg92f3JxK30oPdn9ylRBFxK30oPdn9ycSt9KD3Z/cpUQRcSt9KD3Z/cnErfSg92f3KVEEXErfSg92f3JxK30oPdn9ylRBFxK30oPdn9ycSt9KD3Z/cpUQRcSt9KD3Z/cnErfSg92f3KVEEXErfSg92f3JxK30oPdn9ylRBFxK30oPdn9ycSt9KD3Z/cpUQRcSt9KD3Z/cnErfSg92f3KVEEXErfSg92f3JxK30oPdn9ylRBFxK30oPdn9ycSt9KD3Z/cpUQRcSt9KD3Z/cnErfSg92f3KVEEXErfSg92f3JxK30oPdn9ylRBFxK30oPdn9ycSt9KD3Z/cpUQRcSt9KD3Z/cnErfSg92f3KVEEXErfSg92f3JxK30oPdn9ylRBFxK30oPdn9ycSt9KD3Z/cpUQRcSt9KD3Z/cnErfSg92f3KVEEXErfSg92f3JxK30oPdn9ylRBFxK30oPdn9ycSt9KD3Z/cpUQRcSt9KD3Z/cnErfSg92f3KVEEXErfSg92f3JxK30oPdn9ylRBFxK30oPdn9ycSt9KD3Z/cpUQRcSt9KD3Z/cnErfSg92f3KVEEXErfSg92f3JxK30oPdn9ylRBFxK30oPdn9ycSt9KD3Z/cpUQRcSt9KD3Z/cnErfSg92f3KVEEXErfSg92f3JxK30oPdn9ylRBFxK30oPdn9ycSt9KD3Z/cpUQRcSt9KD3Z/cnErfSg92f3KVEEXErfSg92f3JxK30oPdn9ylRBFxK30oPdn9ycSt9KD3Z/cpUQRcSt9KD3Z/cnErfSg92f3KVEEXErfSg92f3JxK30oPdn9ylRBFxK30oPdn9ycSt9KD3Z/cpUQRcSt9KD3Z/cnErfSg92f3KVEEXErfSg92f3JxK30oPdn9ylRBFxK30oPdn9ycSt9KD3Z/cpUQRcSt9KD3Z/cnErfSg92f3KVEEXErfSg92f3JxK30oPdn9ylRBFxK30oPdn9ycSt9KD3Z/cpUQRcSt9KD3Z/cnErfSg92f3KVEEXErfSg92f3JxK30oPdn9ylRBFxK30oPdn9ycSt9KD3Z/cpUQRcSt9KD3Z/cnErfSg92f3KVEEXErfSg92f3JxK30oPdn9ylRBFxK30oPdn9ycSt9KD3Z/cpUQRcSt9KD3Z/cnErfSg92f3KVEEXErfSg92f3JxK30oPdn9ylRBFxK30oPdn9ycSt9KD3Z/cpUQRcSt9KD3Z/cn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" alt="Baum des Lebens" style={{width:"210px",opacity:0.25,filter:"grayscale(1) opacity(0.4) sepia(0.5) hue-rotate(120deg) saturate(3)",mixBlendMode:"multiply",pointerEvents:"none"}}/>
          </div>
          <button onClick={()=>setShowSettings(true)} style={{display:"flex",alignItems:"center",gap:"13px",padding:"12px 14px",borderRadius:"14px",border:"none",background:"transparent",color:T.textMid,cursor:"pointer",fontFamily:"Raleway",fontWeight:700,fontSize:"13px",width:"100%",textAlign:"left",transition:"all 0.15s"}}>
            <span style={{fontSize:"17px",opacity:0.65}}>⚙️</span>
            <span>Einstellungen</span>
          </button>
        </div>
      </div>
    )}

    {/* Main content */}
    <div style={{flex:1,marginLeft:isDesktop?"260px":"0",minWidth:0}}>
      <div style={{position:"fixed",top:"-60px",right:"-60px",width:"280px",height:"280px",borderRadius:"50%",background:`radial-gradient(circle,${T.tealL} 0%,transparent 70%)`,pointerEvents:"none",zIndex:0,opacity:0.6}}/>
      <div style={{position:"fixed",bottom:"12%",left:isDesktop?"200px":"-50px",width:"220px",height:"220px",borderRadius:"50%",background:`radial-gradient(circle,${T.violetL} 0%,transparent 70%)`,pointerEvents:"none",zIndex:0,opacity:0.5}}/>
      <div style={{position:"relative",zIndex:1,paddingTop:"12px",maxWidth:isDesktop?"none":"480px",margin:"0 auto"}}>
        {/* Mobile header */}
        {!isDesktop&&<header style={{padding:"12px 16px 10px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",borderBottom:`1.5px solid ${T.border}`,marginBottom:"4px"}}>
          <div>
            <div style={{fontFamily:"Cinzel",fontSize:"20px",color:T.text,fontWeight:700,letterSpacing:"1px"}}>✦ Lichtkern</div>
            <div style={{fontFamily:"Raleway",fontSize:"9px",color:T.textSoft,letterSpacing:"2px",textTransform:"uppercase",fontWeight:600,marginTop:"2px"}}>powered by Human Resonanz</div>
            {settings.praxisname&&<div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textMid,fontWeight:700,marginTop:"2px"}}>{settings.praxisname}</div>}
          </div>
          <button onClick={()=>setShowSettings(true)} style={{width:"38px",height:"38px",borderRadius:"50%",background:T.bgSoft,border:`1.5px solid ${T.border}`,fontSize:"17px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>⚙️</button>
        </header>}
        {/* Brand hero banner - left: greeting+praxis, center: LICHTKERN+flower */}
        {isDesktop&&screen==="dashboard"&&(()=>{
          const h=new Date().getHours();
          const g=h<12?"Guten Morgen":h<17?"Guten Tag":"Guten Abend";
          const n=settings?.therapistName?settings.therapistName.split(" ")[0]:"";
          return(
            <div style={{position:"relative",margin:"0 32px 28px",borderRadius:"28px",overflow:"hidden",padding:"36px 48px",background:`linear-gradient(145deg,${T.tealL} 0%,#FAFFFE 45%,${T.violetL} 100%)`,boxShadow:`0 8px 40px rgba(13,148,136,0.18)`,border:`1.5px solid rgba(13,148,136,0.2)`,display:"flex",alignItems:"center",gap:"0"}}>
              {/* Flower watermark - centered */}
              <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",pointerEvents:"none",zIndex:0}}>
                <Flower size={420} opacity={0.2}/>
              </div>
              {/* Left: greeting + praxis */}
              <div style={{position:"relative",zIndex:1,flex:"0 0 220px",display:"flex",flexDirection:"column",gap:"6px"}}>
                {n&&<div style={{fontFamily:"Raleway",fontSize:"10px",color:T.tealD,letterSpacing:"2.5px",textTransform:"uppercase",fontWeight:700,opacity:0.85}}>{g}, {n} ✦</div>}
                {settings.praxisname&&<div style={{fontFamily:"Raleway",fontSize:"13px",color:T.tealD,fontWeight:700,letterSpacing:"1px"}}>— {settings.praxisname} —</div>}
              </div>
              {/* Center: LICHTKERN + Flower */}
              <div style={{position:"relative",zIndex:1,flex:1,textAlign:"center"}}>
                <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-55%)",pointerEvents:"none",zIndex:0}}>
                  <Flower size={320} opacity={0.22}/>
                </div>
                <div style={{position:"relative",zIndex:1}}>
                  <div style={{fontFamily:"Cinzel",fontSize:"46px",color:T.text,fontWeight:700,letterSpacing:"6px",lineHeight:1,textShadow:"0 2px 20px rgba(13,148,136,0.15)"}}>✦ LICHTKERN</div>
                  <div style={{fontFamily:"Raleway",fontSize:"9px",color:T.textSoft,letterSpacing:"5px",textTransform:"uppercase",fontWeight:700,marginTop:"8px"}}>powered by Human Resonanz</div>
                </div>
              </div>
              {/* Right spacer */}
              <div style={{flex:"0 0 220px"}}/>
            </div>
          );
        })()}
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
      {screen==="oracle"    &&<ResonanzOracle groqFetch={groqFetch}/>}
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
  <p style="font-family:Cinzel,serif;font-size:11px;color:#0D9488;font-weight:700;">✦ Lichtkern · powered by Human Resonanz</p>
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
function SettingsRow({label,children}){
  return(<div style={{marginBottom:"16px"}}><SL>{label}</SL>{children}</div>);
}

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

  return (
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:T.bg,zIndex:200,overflowY:"auto",paddingBottom:"40px",paddingLeft:typeof window!=="undefined"&&window.innerWidth>=900?"260px":"0"}}>
      {/* Header */}
      <div style={{padding:"16px 24px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1.5px solid ${T.border}`,background:T.bg,position:"sticky",top:0,zIndex:10}}>
        <div style={{fontFamily:"Cinzel",fontSize:"18px",color:T.text,fontWeight:700}}>⚙️ Einstellungen</div>
        <button onClick={onClose} style={{fontFamily:"Raleway",fontSize:"20px",color:T.textSoft,background:"none",border:"none",cursor:"pointer"}}>✕</button>
      </div>

      <div style={{padding:"20px 24px"}}>

        {/* Branding lock notice */}
        <div style={{background:`linear-gradient(135deg,${T.tealL},${T.violetL})`,borderRadius:"16px",padding:"14px 16px",marginBottom:"16px",border:`1.5px solid ${T.borderMid}`,display:"flex",gap:"12px",alignItems:"center"}}>
          <div style={{fontSize:"24px",flexShrink:0}}>✦</div>
          <div>
            <div style={{fontFamily:"Cinzel",fontSize:"13px",color:T.text,fontWeight:700}}>Lichtkern · Human Resonanz</div>
            <div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textMid,fontWeight:500,marginTop:"3px"}}>Markenname & Branding sind fest verankert und können nicht geändert werden.</div>
          </div>
        </div>

        {/* Module */}
        <div style={{background:`linear-gradient(140deg,${T.violetL},#FFFFFF)`,borderRadius:"18px",padding:"16px",marginBottom:"20px",border:`1.5px solid ${T.border}`}}>
          <SL color={T.tealD}>Aktive Module</SL>
          <div style={{display:"flex",flexWrap:"wrap",gap:"8px",marginBottom:"4px"}}>
            {[{id:"heilarbeit",icon:"🌿",label:"Heilarbeit"},{id:"massage",icon:"💆",label:"Massage"},{id:"coaching",icon:"🧠",label:"Coaching"},{id:"paedagogik",icon:"👨‍👩‍👧",label:"Pädagogik"},{id:"b2b",icon:"👥",label:"B2B"},{id:"allgemein",icon:"📋",label:"Allgemein"}].map(m=>{
              const active=(form.modules||[]).includes(m.id);
              return(
                <button key={m.id} onClick={()=>{const cur=form.modules||[];up({modules:active?cur.filter(x=>x!==m.id):[...cur,m.id]});}}
                  style={{padding:"8px 14px",borderRadius:"20px",border:`1.5px solid ${active?T.teal:T.border}`,background:active?T.tealL:"white",fontFamily:"Raleway",fontSize:"12px",fontWeight:700,color:active?T.tealD:T.textMid,cursor:"pointer"}}>
                  {m.icon} {m.label}
                </button>
              );
            })}
          </div>
          <div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textMid,marginTop:"8px"}}>Aktivierte Module schalten zusätzliche Felder frei (z.B. Human Design bei Heilarbeit).</div>
        </div>

        {/* Praxis */}
        <div style={{background:`linear-gradient(140deg,${T.tealL},#FFFFFF)`,borderRadius:"18px",padding:"16px",marginBottom:"20px",border:`1.5px solid ${T.border}`}}>
          <SL color={T.tealD}>Praxis & Person</SL>
          <SettingsRow label="Praxisname">
            <TI value={form.praxisname||""} onChange={v=>up({praxisname:v})} placeholder="z.B. Praxis Sonnenlicht"/>
          </SettingsRow>
          <SettingsRow label="Untertitel">
            <TI value={form.subtitle||""} onChange={v=>up({subtitle:v})} placeholder="z.B. Energetische Heilarbeit"/>
          </SettingsRow>
          <SettingsRow label="Therapeuten-Name">
            <TI value={form.therapistName||""} onChange={v=>up({therapistName:v})} placeholder="Dein vollständiger Name"/>
          </SettingsRow>
        </div>

        {/* Session defaults */}
        <div style={{background:"#FFFFFF",borderRadius:"18px",padding:"16px",marginBottom:"20px",border:`1.5px solid ${T.border}`}}>
          <SL color={T.tealD}>Sitzungs-Standards</SL>
          <SettingsRow label="Standard-Sitzungsdauer">
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
          </SettingsRow>
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
          <SettingsRow label="Währung">
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
          </SettingsRow>
          <SettingsRow label="Standard-Honorar pro Sitzung">
            <TI value={form.defaultFee||""} onChange={v=>up({defaultFee:v})} placeholder={`z.B. 120 ${form.currency||"CHF"}`}/>
          </SettingsRow>
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
  <p style="font-family:Cinzel,serif;font-size:11px;color:#0D9488;font-weight:700;">✦ Lichtkern · powered by Human Resonanz</p>
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
✦ Lichtkern · powered by Human Resonanz
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
  <p style="font-size:11px;color:#2D6B68;">powered by Human Resonanz · Vertraulicher Fragebogen</p>
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
  <p style="font-family:Cinzel,serif;font-size:11px;color:#0D9488;font-weight:700;">✦ Lichtkern · powered by Human Resonanz</p>
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
  <p style="font-family:Cinzel,serif;font-size:11px;color:#0D9488;font-weight:700;">✦ Lichtkern · powered by Human Resonanz</p>
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
