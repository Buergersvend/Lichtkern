import React, { useState, useEffect, useCallback, useRef } from "react";
import { Flower } from "../components/Decorations";
import { T } from "../config/theme.js";
import { Card, Btn, TI } from "../components/UI.jsx";

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

export { TemplatePickerModal, TemplatesScreen };
