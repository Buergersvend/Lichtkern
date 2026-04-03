// v3
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Flower } from "../components/Decorations";
import { T } from "../config/theme.js";
import { APPT_TYPES, LEVELS, TECHNIQUES, KNOWLEDGE, DE_DAYS, DE_DAYS_F, DE_MONTHS, HOURS } from "../config/constants.js";
import { lvl, top2, dynGrad, uid } from "../config/helpers";
import { groqFetch } from "../config/groq.js";
import { Card, Btn, TI, Select, LBar, Pill, SL } from "../components/UI.jsx";
import { PDFModal } from "./PDFModal.jsx";
const STEPS = ["Klient","Ziel","Ebenen","Techniken","Abschluss"];

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
      <div style={{position:"relative",margin:"12px 16px",borderRadius:"18px",overflow:"hidden",padding:"20px 22px",background:dynGrad(wizard.levels||{})||T.bgSoft,boxShadow:`0 3px 18px ${T.shadow}`,border:`1.5px solid ${T.border}`}}>
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
  <div><SL>Klient</SL><div style={{display:"flex",flexDirection:"column",gap:"6px",maxHeight:"200px",overflowY:"auto"}}>{clients.length===0&&<div style={{fontFamily:"Raleway",fontSize:"13px",color:T.textMid,fontWeight:500}}>Noch keine Klienten angelegt</div>}{clients.map(c=><button key={c.id} onClick={()=>upd({clientId:c.id,clientName:c.name})} style={{textAlign:"left",padding:"12px 14px",borderRadius:"12px",border:`1.5px solid ${wizard.clientId===c.id?T.teal:T.border}`,background:wizard.clientId===c.id?T.tealL:T.bgCard,cursor:"pointer"}}><div style={{fontFamily:"Raleway",fontWeight:700,fontSize:"13px",color:T.text}}>{c.name}</div></button>)}</div></div>
  <div><SL>Oder freier Name</SL><TI value={wizard.clientName||""} onChange={v=>upd({clientName:v,clientId:null})} placeholder="Name oder Kürzel…"/></div>
  <div><SL>Sitzungstyp</SL><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"}}>{[["first","🌱 Erst"],["followup","🔄 Folge"],["closing","✨ Abschluss"]].map(([v,l])=><button key={v} onClick={()=>upd({type:v})} style={{padding:"11px 6px",borderRadius:"12px",border:`1.5px solid ${wizard.type===v?T.teal:T.border}`,background:wizard.type===v?T.tealL:T.bgCard,cursor:"pointer",fontFamily:"Raleway",fontSize:"11px",fontWeight:700,color:wizard.type===v?T.tealD:T.textMid}}>{l}</button>)}</div></div>
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
     <SL>✦ Resonanz-Zusammenfassung</SL>
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
        <select value={wizard.payStatus||"open"} onChange={e=>upd({payStatus:e.target.value})} style={{width:"100%",background:T.bgCard,border:`1.5px solid ${T.border}`,borderRadius:"12px",padding:"11px 14px",color:T.text,fontFamily:"Raleway",fontSize:"13px",fontWeight:500,outline:"none",appearance:"none"}}>
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

export { Session, STEPS };
