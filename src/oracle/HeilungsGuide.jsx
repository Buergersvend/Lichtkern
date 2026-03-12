import React, { useState, useEffect, useCallback, useRef } from "react";
import { OT } from "./OracleUI.jsx";

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

// ════════════════════════════════════════════════════════════════
//  ORGANSPRACHE LERNMODUL · Pilot-Modul · Resonanz Akademie
// ════════════════════════════════════════════════════════════════

//  INTEGRATION: Ersetze in Lernpfad die KI-Generierung für
//  thema.id === "organsprache" durch:
//  <OrganspracheLernmodul stufe={gewStufe} onBack={...}/>
// ════════════════════════════════════════════════════════════════


// ─── STUFEN-FARBEN ────────────────────────────────────────────
const STUFEN_CFG = {

export { HeilungsGuide };
