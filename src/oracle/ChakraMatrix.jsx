import React, { useState, useEffect, useCallback, useRef } from "react";
import { OT } from "./OracleUI.jsx";

function ChakraMatrix({ groqFetch }){
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

export { ChakraMatrix };
