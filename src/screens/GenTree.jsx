import React, { useState, useEffect, useCallback, useRef } from "react";
import { Flower } from "../components/Decorations";
import { T } from "../config/theme.js";
import { Card, Btn, TI, Select, SL, Pill } from "../components/UI.jsx";
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
         fill={p.name?(isDead?"#2a1f3d":isMe?T.tealL:T.bgSoft):"#1a1a2e"}
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
      <div style={{position:"relative",borderRadius:"22px",overflow:"hidden",padding:"24px",marginBottom:"20px",background:T.bgSoft,border:`1.5px solid ${T.border}`}}>
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
      <div style={{position:"relative",borderRadius:"18px",overflow:"hidden",padding:"16px 18px",marginBottom:"12px",background:T.bgSoft,border:`1.5px solid ${T.border}`}}>
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
            <button onClick={exportPDF} style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:700,padding:"7px 12px",borderRadius:"10px",border:`1.5px solid ${T.border}`,background:T.bgCard,color:T.textMid,cursor:"pointer"}}>📄</button>
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
              <div key={theme} style={{background:T.bgCard,borderRadius:"20px",padding:"5px 12px",border:`1.5px solid ${T.violet}66`,display:"flex",alignItems:"center",gap:"6px"}}>
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

export { GenTree };
