import React, { useState } from "react";
import { OT, AURA_SCHICHTEN, AURA_CHIRURGIE_TECHNIKEN, OCard, OLabel } from "./OracleUI.jsx";

function AuraChirurgie({ groqFetch }){
  const [ansicht, setAnsicht]       = useState("schichten");
  const [gewaehlt, setGewaehlt]     = useState(null);
  const [technikSel, setTechnikSel] = useState(null);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
      {/* Tab-Switcher */}
      <div style={{display:"flex",gap:"8px"}}>
        {[["schichten","🌐 Aura-Schichten"],["chirurgie","✂️ Aura-Chirurgie"]].map(([id,label])=>(
          <button key={id} onClick={()=>{setAnsicht(id);setGewaehlt(null);setTechnikSel(null);}} style={{flex:1,padding:"11px",borderRadius:"12px",border:`1.5px solid ${ansicht===id?OT.violet:OT.border}`,background:ansicht===id?OT.violet:OT.bgCard,color:ansicht===id?"white":OT.textMid,fontFamily:"Raleway",fontSize:"12px",fontWeight:700,cursor:"pointer"}}>
            {label}
          </button>
        ))}
      </div>

      {ansicht === "schichten" && (
        <>
          {gewaehlt !== null ? (
            <div>
              <button onClick={()=>setGewaehlt(null)} style={{fontFamily:"Raleway",fontSize:"13px",color:"#C9A84C",fontWeight:700,background:"none",border:"none",cursor:"pointer",marginBottom:"12px",display:"block"}}>← Alle Schichten</button>
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
                    <OLabel color="#A87D3A">Heilungsmethoden</OLabel>
                    <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:"12px"}}>
                      {s.heilung.map(h=><span key={h} style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:700,padding:"4px 10px",borderRadius:"10px",background:"rgba(201,168,76,0.15)",color:"#A87D3A"}}>💚 {h}</span>)}
                    </div>
                    <OLabel color={OT.violetD}>Chirurgische Eingriffe</OLabel>
                    <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
                      {s.chirurgie.map(c=><span key={c} style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:700,padding:"4px 10px",borderRadius:"10px",background:OT.bgCard,color:OT.violet}}>✂️ {c}</span>)}
                    </div>
                  </OCard>
                );
              })()}
            </div>
          ) : (
            <>
              <OCard style={{background:OT.bgSoft,padding:"16px"}}>
                <div style={{fontFamily:"Cinzel",fontSize:"15px",color:OT.text,fontWeight:700,marginBottom:"4px"}}>Die 7 Aura-Schichten</div>
                <div style={{fontFamily:"Raleway",fontSize:"12px",color:OT.textMid,fontWeight:500}}>Jede Schicht trägt ihre eigene Frequenz und Aufgabe. Von physisch-nah (1) bis kosmisch (7).</div>
              </OCard>
              {AURA_SCHICHTEN.map((s, idx) => (
                <button key={idx} onClick={()=>setGewaehlt(idx)} style={{background:OT.bgCard,borderRadius:"14px",padding:"14px 16px",border:`1.5px solid ${OT.border}`,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:"14px",boxShadow:`0 2px 10px ${OT.shadow}`,transition:"all 0.15s"}}>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"3px",flexShrink:0}}>
                    <div style={{width:"28px",height:"28px",borderRadius:"50%",background:s.farbe,border:"2px solid rgba(0,0,0,0.08)"}}/>
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
              <button onClick={()=>setTechnikSel(null)} style={{fontFamily:"Raleway",fontSize:"13px",color:"#C9A84C",fontWeight:700,background:"none",border:"none",cursor:"pointer",marginBottom:"12px",display:"block"}}>← Alle Techniken</button>
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
                    <OLabel color="#A87D3A">Schritt-für-Schritt</OLabel>
                    <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                      {t.schritte.map((schritt, i) => (
                        <div key={i} style={{display:"flex",alignItems:"flex-start",gap:"10px",padding:"8px 12px",background:OT.bgCard,borderRadius:"10px",border:`1px solid ${OT.border}`}}>
                          <span style={{fontFamily:"Cinzel",fontSize:"12px",color:"#C9A84C",fontWeight:700,flexShrink:0,marginTop:"1px"}}>{i+1}.</span>
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
              <OCard style={{background:OT.bgSoft,padding:"16px"}}>
                <div style={{fontFamily:"Cinzel",fontSize:"15px",color:OT.text,fontWeight:700,marginBottom:"4px"}}>Aura-Chirurgie Techniken</div>
                <div style={{fontFamily:"Raleway",fontSize:"12px",color:OT.textMid,fontWeight:500}}>Präzise energetische Eingriffe. Nur nach fundierter Ausbildung anwenden. Stufe 3–5.</div>
              </OCard>
              {AURA_CHIRURGIE_TECHNIKEN.map((t, idx) => (
                <button key={idx} onClick={()=>setTechnikSel(idx)} style={{background:OT.bgCard,borderRadius:"14px",padding:"14px 16px",border:`1.5px solid ${OT.border}`,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:"12px",boxShadow:`0 2px 10px ${OT.shadow}`,transition:"all 0.15s"}}>
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

export { AuraChirurgie };
