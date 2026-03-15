import React, { useState, useEffect, useCallback, useRef } from "react";
import { OT } from "./OracleUI.jsx";
import { OrganspracheLernmodul } from "./OrganspracheKarte.jsx";

function Lernpfad({ groqFetch }){
  const [gewStufe, setGewStufe]   = useState(null);
  const [gewThema, setGewThema]   = useState(null);
  const [kiInhalt, setKiInhalt]   = useState("");
  const [kiLaed, setKiLaed]       = useState(false);

  // ── Pilot-Modul: Organsprache vollständig ausgearbeitet ──
  if (gewThema?.id === "organsprache" && gewStufe) {
    return (
      <OrganspracheLernmodul
        stufe={gewStufe}
        onBack={()=>{ setGewStufe(null); setGewThema(null); }}
        onZertifikat={(pkt)=>console.log("Zertifikat verdient:", pkt)}
      />
    );
  }

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

export { Lernpfad };
