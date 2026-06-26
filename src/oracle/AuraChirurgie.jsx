import React, { useState } from "react";
import { OT, AURA_SCHICHTEN, OCard, OLabel } from "./OracleUI.jsx";

function AuraChirurgie({ groqFetch }){
  const [gewaehlt, setGewaehlt] = useState(null);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
      {gewaehlt !== null ? (
        <div>
          <button onClick={()=>setGewaehlt(null)} style={{fontFamily:"Raleway",fontSize:"13px",color:"#C9A84C",fontWeight:700,background:"none",border:"none",cursor:"pointer",marginBottom:"12px",display:"block"}}>← Alle Schichten</button>
          {(() => {
            const s = AURA_SCHICHTEN[gewaehlt];
            return (
              <OCard>
                <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"12px"}}>
                  <div style={{width:"14px",height:"14px",borderRadius:"50%",background:s.farbe,border:"2px solid rgba(0,0,0,0.1)",flexShrink:0}}/>
                  <div>
                    <div style={{fontFamily:"Cinzel",fontSize:"16px",color:OT.text,fontWeight:700}}>{s.nameDe}</div>
                    <div style={{fontFamily:"Raleway",fontSize:"11px",color:OT.textMid,fontWeight:500,fontStyle:"italic"}}>{s.nameKlassisch}</div>
                  </div>
                </div>
                <div style={{fontFamily:"Raleway",fontSize:"13px",color:OT.text,lineHeight:"1.75",fontWeight:500,marginBottom:"14px",padding:"12px",background:OT.bgSoft,borderRadius:"10px"}}>{s.beschreibung}</div>
                <div style={{background:OT.bgSoft,padding:"10px",borderRadius:"10px",marginBottom:"12px"}}>
                  <div style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:800,color:OT.textSoft,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"4px"}}>Nähe</div>
                  <div style={{fontFamily:"Raleway",fontSize:"12px",color:OT.text,fontWeight:700}}>{s.naehe}</div>
                </div>
                <OLabel color="#A87D3A">Was sich hier zeigen kann</OLabel>
                <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:"14px"}}>
                  {s.themen.map(t=><span key={t} style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:700,padding:"4px 10px",borderRadius:"10px",background:"rgba(201,168,76,0.12)",color:"#A87D3A"}}>{t}</span>)}
                </div>
                <div style={{padding:"12px 14px",borderRadius:"10px",background:"rgba(201,168,76,0.08)",border:`1px solid ${OT.borderMid}`}}>
                  <div style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:800,color:OT.textSoft,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"6px"}}>Impuls zur Selbstwahrnehmung</div>
                  <div style={{fontFamily:"Raleway",fontSize:"12px",color:OT.text,fontWeight:500,fontStyle:"italic",lineHeight:"1.75"}}>{s.impuls}</div>
                </div>
              </OCard>
            );
          })()}
        </div>
      ) : (
        <>
          <OCard style={{background:OT.bgSoft,padding:"16px"}}>
            <div style={{fontFamily:"Cinzel",fontSize:"15px",color:OT.text,fontWeight:700,marginBottom:"4px"}}>Die 7 Aura-Schichten</div>
            <div style={{fontFamily:"Raleway",fontSize:"12px",color:OT.textMid,fontWeight:500}}>Jede Schicht trägt ihre eigene Qualität — von körpernah bis weit geöffnet.</div>
          </OCard>
          {AURA_SCHICHTEN.map((s, idx) => (
            <button key={idx} onClick={()=>setGewaehlt(idx)} style={{background:OT.bgCard,borderRadius:"14px",padding:"14px 16px",border:`1.5px solid ${OT.border}`,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:"14px",boxShadow:`0 2px 10px ${OT.shadow}`,transition:"all 0.15s"}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"3px",flexShrink:0}}>
                <div style={{width:"28px",height:"28px",borderRadius:"50%",background:s.farbe,border:"2px solid rgba(0,0,0,0.08)"}}/>
                <span style={{fontFamily:"Cinzel",fontSize:"11px",color:OT.textSoft,fontWeight:700}}>{s.nr}</span>
              </div>
              <div style={{flex:1}}>
                <div style={{fontFamily:"Raleway",fontSize:"13px",color:OT.text,fontWeight:700,marginBottom:"2px"}}>{s.nameDe}</div>
                <div style={{fontFamily:"Raleway",fontSize:"11px",color:OT.textMid,fontWeight:500,fontStyle:"italic"}}>{s.nameKlassisch}</div>
                <div style={{fontFamily:"Raleway",fontSize:"10px",color:OT.textSoft,fontWeight:500,marginTop:"2px"}}>{s.naehe}</div>
              </div>
              <span style={{color:OT.textSoft,fontSize:"18px"}}>›</span>
            </button>
          ))}
          <div style={{marginTop:"4px",padding:"12px 14px",borderRadius:"10px",background:"rgba(201,168,76,0.06)",border:`1px solid ${OT.borderMid}`}}>
            <span style={{fontFamily:"Raleway",fontSize:"11px",color:OT.textSoft,fontWeight:500,lineHeight:"1.7"}}>Diese Betrachtung bewegt sich auf einer seelisch-symbolischen Ebene und ersetzt keine medizinische oder therapeutische Beratung. Bei körperlichen, seelischen oder gesundheitlichen Beschwerden wende dich an Ärzte, Heilpraktiker oder Therapeuten.</span>
          </div>
        </>
      )}
    </div>
  );
}

export { AuraChirurgie };
