import React, { useState, useEffect, useCallback, useRef } from "react";
import { T } from "../config/theme.js";
import { Flower } from "../components/Decorations";
import { Card, Btn, TI, Select, Pill, SL } from "../components/UI.jsx";

import { BodygraphSVG, HDTab, HD_CHANNELS, HD_CENTER_CFG, HD_GATE_CENTER } from "../components/HumanDesign.jsx";
import { uid } from "../config/helpers.js";
async function groqFetch(prompt) {
 const res = await fetch("/api/ki", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) throw new Error("KI Netzwerkfehler");
  const data = await res.json();
  return data.text || data.result || "";
}

function hdCalcDefinedCenters(gates) {
  return new Set(gates);
}
function ClientDetailModal({client,sessions,onClose,onSave,onStart,onAnalyse,onDelete}){
  const [tab,setTab]=useState('profil');
  const sc=sessions.filter(s=>s.clientId===client.id);
  const tabs=[['profil','👤 Profil'],['hd','⚙ Human Design'],['sessions','📋 Sitzungen']];
  return(
  <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center'}}>
   <div style={{background:'#FFFFFF',borderRadius:'24px',width:'95%',maxWidth:'560px',maxHeight:'92vh',overflowY:'auto',padding:'0 0 40px'}}>
        {/* Handle */}
        <div style={{display:'flex',justifyContent:'center',padding:'12px 0 4px'}}><div style={{width:'40px',height:'4px',borderRadius:'2px',background:T.border}}/></div>
        {/* Header */}
        <div style={{padding:'12px 20px 0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontFamily:'Cinzel',fontSize:'18px',color:T.text,fontWeight:700}}>{client.name}</div>
            {client.hdType&&<div style={{fontFamily:'Raleway',fontSize:'12px',color:T.violet,fontWeight:600,marginTop:'2px'}}>⚙ {client.hdType}{client.hdProfile?' · '+client.hdProfile:''}</div>}
          </div>
          <button onClick={onClose} style={{width:'32px',height:'32px',borderRadius:'50%',border:`1.5px solid ${T.border}`,background:T.bgSoft,cursor:'pointer',fontSize:'16px',display:'flex',alignItems:'center',justifyContent:'center',color:T.textMid}}>✕</button>
        </div>
        {/* Quick actions */}
        <div style={{display:'flex',gap:'8px',padding:'12px 20px 0'}}>
          <button onClick={()=>onStart(client)} style={{flex:1,padding:'9px',borderRadius:'12px',background:T.tealL,border:`1.5px solid ${T.borderMid}`,fontFamily:'Raleway',fontWeight:700,fontSize:'12px',color:T.tealD,cursor:'pointer'}}>✦ Sitzung</button>
          <button onClick={()=>{onAnalyse(client.id);onClose();}} style={{flex:1,padding:'9px',borderRadius:'12px',background:T.violetL,border:`1.5px solid #A78BFA`,fontFamily:'Raleway',fontWeight:700,fontSize:'12px',color:T.violetD,cursor:'pointer'}}>📊 Analyse</button>
       <button onClick={()=>{if(window.confirm('Klient wirklich löschen?')){onDelete(client.id);onClose();}}} style={{flex:1,padding:'9px',borderRadius:'12px',background:'#FEE2E2',border:'1.5px solid #FCA5A5',fontFamily:'Raleway',fontWeight:700,fontSize:'12px',color:'#DC2626',cursor:'pointer'}}>🗑 Löschen</button> </div>
        {/* Tabs */}
        <div style={{display:'flex',gap:'6px',padding:'12px 20px',borderBottom:`1px solid ${T.border}`}}>
          {tabs.map(([v,l])=><button key={v} onClick={()=>setTab(v)} style={{flex:1,padding:'9px 4px',borderRadius:'10px',border:`1.5px solid ${tab===v?T.teal:T.border}`,background:tab===v?T.teal:'white',fontFamily:'Raleway',fontSize:'11px',fontWeight:700,color:tab===v?'white':T.textMid,cursor:'pointer'}}>{l}</button>)}
        </div>
        <div style={{padding:'16px 20px'}}>
          {tab==='profil'&&(
            <div>
              {[['Email / Tel.',client.contact],['Notizen',client.notes]].filter(([,v])=>v).map(([k,v])=>(
                <div key={k} style={{marginBottom:'12px'}}><div style={{fontFamily:'Raleway',fontSize:'10px',color:T.textSoft,fontWeight:700,letterSpacing:'1px',textTransform:'uppercase',marginBottom:'3px'}}>{k}</div><div style={{fontFamily:'Raleway',fontSize:'13px',color:T.text,lineHeight:'1.5'}}>{v}</div></div>
              ))}
              {client.tags?.length>0&&<div style={{marginBottom:'12px'}}><div style={{fontFamily:'Raleway',fontSize:'10px',color:T.textSoft,fontWeight:700,letterSpacing:'1px',textTransform:'uppercase',marginBottom:'6px'}}>Tags</div><div style={{display:'flex',flexWrap:'wrap',gap:'5px'}}>{client.tags.map(t=><span key={t} style={{fontSize:'11px',padding:'4px 12px',borderRadius:'12px',background:T.tealL,color:T.tealD,fontFamily:'Raleway',fontWeight:700,border:`1px solid ${T.borderMid}`}}>{t}</span>)}</div></div>}
              <div style={{fontFamily:'Raleway',fontSize:'12px',color:T.textSoft,marginTop:'16px'}}>Seit: {new Date(client.createdAt).toLocaleDateString('de-DE')} · {sc.length} Sitzung{sc.length!==1?'en':''}</div>
            </div>
          )}
          {tab==='hd'&&<HDTab client={client} onSave={updated=>{onSave(updated);}}/>}
          {tab==='sessions'&&(
            <div>
              {sc.length===0&&<div style={{textAlign:'center',padding:'32px 0',color:T.textSoft,fontFamily:'Raleway',fontSize:'13px'}}>Noch keine Sitzungen</div>}
              {sc.slice().reverse().map(s=>(
                <div key={s.id} style={{background:T.bgSoft,borderRadius:'12px',padding:'12px',marginBottom:'8px',border:`1px solid ${T.border}`}}>
                  <div style={{fontFamily:'Raleway',fontWeight:700,fontSize:'12px',color:T.text}}>{new Date(s.createdAt).toLocaleDateString('de-DE')}</div>
                  {s.goal&&<div style={{fontFamily:'Raleway',fontSize:'12px',color:T.textMid,marginTop:'3px',lineHeight:'1.4'}}>{s.goal}</div>}
                  {s.aiSummary&&<div style={{fontFamily:'Raleway',fontSize:'11px',color:T.textSoft,marginTop:'6px',lineHeight:'1.5',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{s.aiSummary}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SYNERGY ENGINE ───────────────────────────
function SynergyEngine({clients,onBack}){
  const [clientA,setClientA]=useState(null);
  const [clientB,setClientB]=useState(null);
  const [aiText,setAiText]=useState('');
  const [aiLoading,setAiLoading]=useState(false);

  const hdClients=clients.filter(c=>c.hdType||c.hdPGates||c.hdDGates);

  const getGates=c=>{
    const p=(c?.hdPGates||'').split(',').map(s=>s.trim()).filter(Boolean).map(Number).filter(n=>n>=1&&n<=64);
    const d=(c?.hdDGates||'').split(',').map(s=>s.trim()).filter(Boolean).map(Number).filter(n=>n>=1&&n<=64);
    return{p,d,all:[...p,...d]};
  };

  const calcSynergy=(cA,cB)=>{
    if(!cA||!cB)return{shared:[],electromagnetic:[],dominance:[]};
    const gA=getGates(cA);
    const gB=getGates(cB);
    const setA=new Set(gA.all);
    const setB=new Set(gB.all);
    // Shared gates
    const shared=[...setA].filter(g=>setB.has(g));
    // Electromagnetic connections: A has one gate of channel, B has the other
    const electromagnetic=HD_CHANNELS.filter(([a,b])=>(setA.has(a)&&setB.has(b))||(setA.has(b)&&setB.has(a))).map(([a,b])=>({gate1:setA.has(a)?a:b,gate2:setA.has(a)?b:a,center1:HD_GATE_CENTER[setA.has(a)?a:b],center2:HD_GATE_CENTER[setA.has(a)?b:a]}));
    return{shared,electromagnetic};
  };

  const syn=calcSynergy(clientA,clientB);

  const genAI=async()=>{
    if(!clientA||!clientB)return;
    setAiLoading(true);
    const gA=getGates(clientA);
    const gB=getGates(clientB);
    const defA=hdCalcDefinedCenters(gA.all);
    const defB=hdCalcDefinedCenters(gB.all);
    try{
      const _aiPrompt2=`Du bist ein Human Design Beziehungsanalytiker in einer ganzheitlichen Heilpraxis. Analysiere diese zwei Menschen:

PERSON A: ${clientA.name}
Typ: ${clientA.hdType||'unbekannt'} · Profil: ${clientA.hdProfile||'—'} · Autorität: ${clientA.hdAuthority||'—'}
Definierte Zentren: ${[...defA].map(c=>HD_CENTER_CFG[c]?.label).join(', ')||'—'}

PERSON B: ${clientB.name}
Typ: ${clientB.hdType||'unbekannt'} · Profil: ${clientB.hdProfile||'—'} · Autorität: ${clientB.hdAuthority||'—'}
Definierte Zentren: ${[...defB].map(c=>HD_CENTER_CFG[c]?.label).join(', ')||'—'}

Elektromagnetische Verbindungen: ${syn.electromagnetic.length} Kanäle
${syn.electromagnetic.slice(0,5).map(e=>`Kanal ${e.gate1}-${e.gate2} (${HD_CENTER_CFG[e.center1]?.label||e.center1}↔${HD_CENTER_CFG[e.center2]?.label||e.center2})`).join(', ')||'keine'}

Bitte analysiere:
1. **Energiedynamik**: Wie interagieren diese zwei Menschen energetisch?
2. **Wachstumsfelder**: Was aktiviert/konditioniert A bei B und umgekehrt?
3. **Stärken der Verbindung**: Was macht diese Begegnung wertvoll?
4. **Herausforderungen**: Wo können Reibungspunkte entstehen?
5. **Empfehlung für die Praxisarbeit**: Ein konkreter Ansatz für gemeinsame oder individuelle Begleitung.

Warmherzig, präzise.`;
      setAiText(await groqFetch(_aiPrompt2));
    }catch{setAiText('Netzwerkfehler.');}
    setAiLoading(false);
  };

  const ClientPicker=({label,value,onChange})=>(
    <div style={{flex:1}}>
      <div style={{fontFamily:'Raleway',fontSize:'10px',color:T.textMid,fontWeight:700,letterSpacing:'1px',textTransform:'uppercase',marginBottom:'6px'}}>{label}</div>
      <select value={value?.id||''} onChange={e=>onChange(clients.find(c=>c.id===e.target.value)||null)} style={{width:'100%',padding:'12px',borderRadius:'12px',border:`1.5px solid ${T.border}`,fontFamily:'Raleway',fontSize:'13px',color:T.text,background:'#fff',outline:'none'}}>
        <option value=''>— Klient wählen</option>
        {clients.map(c=><option key={c.id} value={c.id}>{c.name}{c.hdType?' ('+c.hdType+')':''}</option>)}
      </select>
    </div>
  );

  const gA=clientA?getGates(clientA):{p:[],d:[],all:[]};
  const gB=clientB?getGates(clientB):{p:[],d:[],all:[]};

  return(
    <div style={{padding:'0 16px 96px'}}>
      <div style={{display:'flex',alignItems:'center',gap:'12px',paddingTop:'8px',marginBottom:'20px'}}>
        <button onClick={onBack} style={{background:T.bgSoft,border:`1.5px solid ${T.border}`,borderRadius:'12px',padding:'8px 14px',fontFamily:'Raleway',fontWeight:700,fontSize:'13px',color:T.textMid,cursor:'pointer'}}>← Zurück</button>
        <h2 style={{fontFamily:'Cinzel',fontSize:'20px',color:T.text,margin:0,fontWeight:700}}>Synergy Engine</h2>
      </div>

      {/* Description */}
      <div style={{background:`linear-gradient(135deg,${T.violetL},${T.tealL})`,borderRadius:'16px',padding:'16px',marginBottom:'20px',border:`1.5px solid ${T.border}`,position:'relative',overflow:'hidden'}}>
        <Flower size={150} opacity={0.1} color={T.violet}/>
        <div style={{position:'relative',zIndex:1,fontFamily:'Raleway',fontSize:'13px',color:T.textMid,lineHeight:'1.6'}}>Lege zwei Charts übereinander und entdecke elektromagnetische Verbindungen, Dominanzfelder und die energetische Dynamik zwischen zwei Menschen.</div>
      </div>

      {/* Client Pickers */}
      <div style={{display:'flex',gap:'12px',marginBottom:'20px'}}>
        <ClientPicker label="Person A" value={clientA} onChange={setClientA}/>
        <div style={{display:'flex',alignItems:'center',paddingTop:'18px',fontSize:'20px',color:T.textSoft}}>⇄</div>
        <ClientPicker label="Person B" value={clientB} onChange={setClientB}/>
      </div>

      {/* Synergy Results */}
      {clientA&&clientB&&(
        <>
          {/* Charts side by side */}
          {(gA.all.length>0||gB.all.length>0)&&(
            <Card style={{marginBottom:'16px'}}>
              <SL>Bodygraphs</SL>
              <div style={{display:'flex',gap:'8px',justifyContent:'space-around'}}>
                <div style={{textAlign:'center'}}>
                  <div style={{fontFamily:'Raleway',fontSize:'11px',fontWeight:700,color:T.tealD,marginBottom:'6px'}}>{clientA.name}</div>
                  <BodygraphSVG pgates={gA.p} dgates={gA.d} size={120}/>
                </div>
                <div style={{textAlign:'center'}}>
                  <div style={{fontFamily:'Raleway',fontSize:'11px',fontWeight:700,color:T.violetD,marginBottom:'6px'}}>{clientB.name}</div>
                  <BodygraphSVG pgates={gB.p} dgates={gB.d} size={120}/>
                </div>
              </div>
            </Card>
          )}

          {/* Electromagnetic connections */}
          <Card style={{marginBottom:'16px',background:T.bgSoft,border:`1.5px solid ${T.borderMid}`}}>
            <SL color={T.violetD}>⚡ Elektromagnetische Verbindungen</SL>
            {syn.electromagnetic.length===0?(
              <div style={{fontFamily:'Raleway',fontSize:'13px',color:T.textSoft,fontStyle:'italic',padding:'8px 0'}}>Keine direkten elektromagnetischen Verbindungen gefunden.</div>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                {syn.electromagnetic.map((e,i)=>(
                  <div key={i} style={{background:'white',borderRadius:'10px',padding:'10px 12px',border:`1px solid ${T.border}`,display:'flex',alignItems:'center',gap:'10px'}}>
                    <span style={{fontFamily:'Cinzel',fontSize:'13px',color:T.violetD,fontWeight:700}}>Tor {e.gate1}–{e.gate2}</span>
                    <span style={{fontFamily:'Raleway',fontSize:'11px',color:T.textMid}}>
                      {HD_CENTER_CFG[e.center1]?.label||e.center1} ↔ {HD_CENTER_CFG[e.center2]?.label||e.center2}
                    </span>
                    <span style={{marginLeft:'auto',fontSize:'11px',padding:'3px 8px',borderRadius:'8px',background:T.violetL,color:T.violetD,fontFamily:'Raleway',fontWeight:700}}>{clientA.name.split(' ')[0]} → {clientB.name.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Type comparison */}
          <Card style={{marginBottom:'16px'}}>
            <SL>Typ-Dynamik</SL>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
              {[clientA,clientB].map(c=>(
                <div key={c.id} style={{background:T.bgSoft,borderRadius:'12px',padding:'12px',border:`1px solid ${T.border}`}}>
                  <div style={{fontFamily:'Raleway',fontWeight:800,fontSize:'13px',color:T.text,marginBottom:'4px'}}>{c.name}</div>
                  <div style={{fontFamily:'Raleway',fontSize:'12px',color:T.violet,fontWeight:600}}>{c.hdType||'Typ unbekannt'}</div>
                  {c.hdProfile&&<div style={{fontFamily:'Raleway',fontSize:'11px',color:T.textMid}}>Profil {c.hdProfile}</div>}
                  {c.hdAuthority&&<div style={{fontFamily:'Raleway',fontSize:'11px',color:T.textMid}}>Auth: {c.hdAuthority}</div>}
                </div>
              ))}
            </div>
          </Card>

          {/* AI Analysis */}
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
              <SL>✦ KI-Beziehungsanalyse</SL>
              <Btn onClick={genAI} disabled={aiLoading} style={{padding:'8px 16px',fontSize:'11px',opacity:aiLoading?0.5:1}}>{aiLoading?'…':'⚙ Analysieren'}</Btn>
            </div>
            {aiText&&<div style={{background:T.bgSoft,borderRadius:'14px',padding:'16px',border:`1.5px solid ${T.borderMid}`,fontFamily:'Raleway',fontSize:'13px',color:T.text,lineHeight:'1.7',whiteSpace:'pre-wrap'}}>{aiText}</div>}
          </div>
        </>
      )}

      {!clientA&&!clientB&&hdClients.length<2&&(
        <div style={{textAlign:'center',padding:'40px 0'}}>
          <div style={{fontSize:'40px',marginBottom:'12px',opacity:0.4}}>⚙</div>
          <div style={{fontFamily:'Raleway',fontSize:'14px',color:T.textMid,fontWeight:600,marginBottom:'6px'}}>Mindestens 2 Klienten mit HD-Daten</div>
          <div style={{fontFamily:'Raleway',fontSize:'12px',color:T.textSoft}}>Füge zuerst HD-Tore oder Typen in den Klientenprofilen ein.</div>
        </div>
      )}
    </div>
  );
}

// ─── CLIENTS ──────────────────────────────────
function Clients({clients,sessions,onSave,onStart,onDelete,onOnboarding,reminders,onAddReminder,onDismissReminder,onAnalyse,settings={}}){
  const [showAdd,setShowAdd]=useState(false);
  const [search,setSearch]=useState("");
  const [selClient,setSelClient]=useState(null);
  const [form,setForm]=useState({name:"",contact:"",notes:"",tags:"",hdType:"",hdProfile:"",hdAuthority:""});
  const filtered=clients.filter(c=>c.name.toLowerCase().includes(search.toLowerCase()));
  const add=()=>{if(!form.name.trim())return;onSave([...clients,{id:uid(),createdAt:new Date().toISOString(),...form,tags:form.tags.split(",").map(t=>t.trim()).filter(Boolean)}]);setForm({name:"",contact:"",notes:"",tags:""});setShowAdd(false);};
  return(
    <div style={{padding:"0 16px 96px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:"8px",marginBottom:"16px"}}>
        <h2 style={{fontFamily:"Cinzel",fontSize:"22px",color:T.text,margin:0,fontWeight:700}}>Klienten</h2>
        <div style={{display:"flex",gap:"8px"}}>
          <button onClick={onOnboarding} style={{fontFamily:"Raleway",fontWeight:700,fontSize:"11px",padding:"9px 14px",borderRadius:"12px",border:`1.5px solid ${T.border}`,background:T.bgSoft,color:T.textMid,cursor:"pointer"}}>📋 Anamnese</button>
          <Btn onClick={()=>setShowAdd(!showAdd)} style={{padding:"9px 18px",fontSize:"12px"}}>+ Neu</Btn>
        </div>
      </div>
      {showAdd&&(
        <Card style={{marginBottom:"16px",background:T.bgSoft,border:`1.5px solid ${T.borderMid}`}}>
          <SL color={T.tealD}>Neuer Klient</SL>
          {[{k:"name",p:"Name *"},{k:"contact",p:"Email / Telefon"},{k:"notes",p:"Notizen"},{k:"tags",p:"Tags: Angst, Rücken, Ahnen…"}].map(f=>(
            <div key={f.k} style={{marginBottom:"8px"}}><TI value={form[f.k]} onChange={v=>setForm({...form,[f.k]:v})} placeholder={f.p}/></div>
          ))}
          {settings?.modules?.includes("heilarbeit")&&(
            <div style={{marginTop:"12px",paddingTop:"12px",borderTop:`1px dashed ${T.border}`}}>
              <div style={{fontFamily:"Raleway",fontSize:"10px",color:T.tealD,letterSpacing:"2px",fontWeight:700,textTransform:"uppercase",marginBottom:"8px"}}>✦ Human Design (optional)</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"}}>
                <div>
                  <div style={{fontFamily:"Raleway",fontSize:"10px",color:T.textMid,marginBottom:"4px",fontWeight:600}}>Typ</div>
                  <select value={form.hdType} onChange={e=>setForm({...form,hdType:e.target.value})} style={{width:"100%",padding:"9px 10px",borderRadius:"10px",border:`1.5px solid ${T.border}`,fontFamily:"Raleway",fontSize:"12px",color:T.text,background:"#FFF",outline:"none"}}>
                    <option value="">—</option>
                    <option value="Manifestor">Manifestor</option>
                    <option value="Generator">Generator</option>
                    <option value="Manifesting Generator">Man. Generator</option>
                    <option value="Projektor">Projektor</option>
                    <option value="Reflektor">Reflektor</option>
                  </select>
                </div>
                <div>
                  <div style={{fontFamily:"Raleway",fontSize:"10px",color:T.textMid,marginBottom:"4px",fontWeight:600}}>Profil</div>
                  <select value={form.hdProfile} onChange={e=>setForm({...form,hdProfile:e.target.value})} style={{width:"100%",padding:"9px 10px",borderRadius:"10px",border:`1.5px solid ${T.border}`,fontFamily:"Raleway",fontSize:"12px",color:T.text,background:"#FFF",outline:"none"}}>
                    <option value="">—</option>
                    {["1/3","1/4","2/4","2/5","3/5","3/6","4/6","4/1","5/1","5/2","6/2","6/3"].map(p=><option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{fontFamily:"Raleway",fontSize:"10px",color:T.textMid,marginBottom:"4px",fontWeight:600}}>Autorität</div>
                  <select value={form.hdAuthority} onChange={e=>setForm({...form,hdAuthority:e.target.value})} style={{width:"100%",padding:"9px 10px",borderRadius:"10px",border:`1.5px solid ${T.border}`,fontFamily:"Raleway",fontSize:"12px",color:T.text,background:"#FFF",outline:"none"}}>
                    <option value="">—</option>
                    <option value="Emotional">Emotional</option>
                    <option value="Sakral">Sakral</option>
                    <option value="Milz">Milz</option>
                    <option value="Ego">Ego</option>
                    <option value="Selbst">Selbst</option>
                    <option value="Mental">Mental</option>
                    <option value="Lunar">Lunar</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          <div style={{display:"flex",gap:"8px",marginTop:"12px"}}><Btn onClick={add} style={{flex:1}}>Speichern</Btn><Btn variant="soft" onClick={()=>setShowAdd(false)} style={{flex:1}}>Abbrechen</Btn></div>
        </Card>
      )}
      <div style={{marginBottom:"14px"}}><TI value={search} onChange={setSearch} placeholder="Klient suchen…"/></div>
      {filtered.length===0&&<div style={{textAlign:"center",padding:"52px 0"}}><div style={{fontSize:"40px",marginBottom:"10px",opacity:0.4}}>◈</div><div style={{fontFamily:"Raleway",fontSize:"14px",color:T.textMid,fontWeight:600}}>Noch keine Klienten</div></div>}
      <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
        {filtered.map(c=>{
          const sc=sessions.filter(s=>s.clientId===c.id).length;
          const hasHD=c.hdType||c.hdPGates;
          return(
            <Card key={c.id} style={{cursor:'pointer'}} onClick={()=>setSelClient(c)}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:"Raleway",fontWeight:800,fontSize:"15px",color:T.text}}>{c.name}</div>
                  {c.contact&&<div style={{fontFamily:"Raleway",fontSize:"12px",color:T.textMid,marginTop:"3px",fontWeight:500}}>{c.contact}</div>}
                  {hasHD&&<div style={{fontFamily:"Raleway",fontSize:'11px',color:T.violet,fontWeight:700,marginTop:'4px'}}>⚙ {c.hdType||'HD'}{c.hdProfile?' · Profil '+c.hdProfile:''}</div>}
                  {c.tags?.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:"5px",marginTop:"8px"}}>{c.tags.map(t=><span key={t} style={{fontSize:"10px",padding:"3px 11px",borderRadius:"12px",background:T.tealL,color:T.tealD,fontFamily:"Raleway",fontWeight:700,border:`1px solid ${T.borderMid}`}}>{t}</span>)}</div>}
                </div>
                <div style={{textAlign:"right",flexShrink:0,marginLeft:"12px"}}>
                  <div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textSoft,fontWeight:600}}>{sc} Sitzung{sc!==1?"en":""}</div>
                  <div style={{fontFamily:"Raleway",fontSize:"10px",color:T.textSoft,marginTop:'6px'}}>→ Profil öffnen</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      {selClient&&<ClientDetailModal
        client={selClient}
        sessions={sessions}
        onClose={()=>setSelClient(null)}
        onSave={updated=>{onSave(clients.map(c=>c.id===updated.id?updated:c));setSelClient(updated);}}
        onStart={c=>{onStart(c);setSelClient(null);}}
        onAnalyse={id=>{onAnalyse&&onAnalyse(id);}}
           onDelete={id=>{onDelete&&onDelete(id);}}        
      />}
    </div>
  );
}

export { ClientDetailModal, SynergyEngine, Clients };
