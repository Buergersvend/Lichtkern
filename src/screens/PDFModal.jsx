import React, { useState, useEffect, useCallback, useRef } from "react";
import { T } from "../config/theme.js";
import { APPT_TYPES, LEVELS, TECHNIQUES, KNOWLEDGE, DE_DAYS, DE_DAYS_F, DE_MONTHS, HOURS } from "../config/constants.js";
import { Btn } from "../components/UI.jsx";

function PDFModal({ session, onClose }){
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

export { PDFModal };
