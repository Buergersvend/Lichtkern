// ─── LICHTKERN KONSTANTEN ────────────────────────
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

export { APPT_TYPES, LEVELS, TECHNIQUES, KNOWLEDGE, DE_DAYS, DE_DAYS_F, DE_MONTHS, HOURS };
