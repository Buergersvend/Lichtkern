import React, { useState, useEffect, useCallback, useRef } from "react";
import { T } from "../config/theme.js";
import { Card, Btn, Pill } from "../components/UI.jsx";

function Analytics({sessions,clients}){
  // ── compute all stats ──
  const total = sessions.length;

  // Ebenen frequency
  const ebenenCount = {};
  const ebenenSum   = {};
  LEVELS.forEach(l => { ebenenCount[l.key]=0; ebenenSum[l.key]=0; });
  sessions.forEach(s => Object.entries(s.levels||{}).forEach(([k,v]) => {
    if(v>0){ ebenenCount[k]=(ebenenCount[k]||0)+1; ebenenSum[k]=(ebenenSum[k]||0)+v; }
  }));
  const ebenenSorted = LEVELS.map(l=>({...l, count:ebenenCount[l.key]||0, avg:ebenenCount[l.key]?(ebenenSum[l.key]/ebenenCount[l.key]).toFixed(0):0})).sort((a,b)=>b.count-a.count);
  const maxEbene = Math.max(...ebenenSorted.map(e=>e.count),1);

  // Technik ranking
  const techCount = {};
  sessions.forEach(s => (s.techniques||[]).forEach(t => { techCount[t]=(techCount[t]||0)+1; }));
  const techSorted = Object.entries(techCount).sort(([,a],[,b])=>b-a).slice(0,10);
  const maxTech = Math.max(...techSorted.map(([,c])=>c),1);

  // Sessions per month (last 6 months)
  const monthMap = {};
  const now = new Date();
  for(let i=5;i>=0;i--){
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    monthMap[key] = { label: DE_MONTHS[d.getMonth()].slice(0,3), count:0 };
  }
  sessions.forEach(s => {
    const key = s.createdAt?.slice(0,7);
    if(monthMap[key]) monthMap[key].count++;
  });
  const monthData = Object.values(monthMap);
  const maxMonth = Math.max(...monthData.map(m=>m.count),1);

  // Session types
  const typeCount = { first:0, followup:0, closing:0 };
  sessions.forEach(s => { if(typeCount[s.type]!==undefined) typeCount[s.type]++; });
  const typeTotal = Math.max(total,1);

  // Categories
  const catCount = {};
  sessions.forEach(s => { if(s.category){ catCount[s.category]=(catCount[s.category]||0)+1; } });
  const catSorted = Object.entries(catCount).sort(([,a],[,b])=>b-a);
  const maxCat = Math.max(...catSorted.map(([,c])=>c),1);

  // Resonanz sources
  const resCount = {};
  sessions.forEach(s => { if(s.resonanceSource){ resCount[s.resonanceSource]=(resCount[s.resonanceSource]||0)+1; } });
  const resSorted = Object.entries(resCount).sort(([,a],[,b])=>b-a);

  // Klienten activity
  const clientActivity = clients.map(c => ({
    ...c,
    sessionCount: sessions.filter(s=>s.clientId===c.id).length,
    lastSession: sessions.filter(s=>s.clientId===c.id).sort((a,b)=>b.createdAt?.localeCompare(a.createdAt))[0]
  })).sort((a,b)=>b.sessionCount-a.sessionCount).slice(0,8);
  const maxClientSessions = Math.max(...clientActivity.map(c=>c.sessionCount),1);

  // Tags / Krankheitsbilder
  const tagCount = {};
  clients.forEach(c => (c.tags||[]).forEach(t => { tagCount[t]=(tagCount[t]||0)+1; }));
  const tagSorted = Object.entries(tagCount).sort(([,a],[,b])=>b-a).slice(0,12);

  // Goal keywords (simple word frequency)
  const stopwords = new Set(["und","die","der","das","ich","ist","von","mit","für","ein","eine","bei","sich","im","in","an","auf","zu","nicht","es","hat","wie","was","dem","den","aus","als"]);
  const wordCount = {};
  sessions.forEach(s => {
    (s.goal||"").toLowerCase().replace(/[^\wäöüß\s]/g,"").split(/\s+/).forEach(w => {
      if(w.length>3 && !stopwords.has(w)){ wordCount[w]=(wordCount[w]||0)+1; }
    });
  });
  const topWords = Object.entries(wordCount).sort(([,a],[,b])=>b-a).slice(0,10);

  // ── sub-components ──
  const SectionCard = ({title,icon,children,style={}}) => (
    <Card style={{marginBottom:"16px",...style}}>
      <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"14px"}}>
        <span style={{fontSize:"18px"}}>{icon}</span>
        <span style={{fontFamily:"Cinzel",fontSize:"13px",color:T.text,fontWeight:700}}>{title}</span>
      </div>
      {children}
    </Card>
  );

  const HBar = ({label,value,max,color,bg,suffix="",sublabel=""}) => (
    <div style={{marginBottom:"10px"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
        <span style={{fontFamily:"Raleway",fontSize:"12px",color:T.text,fontWeight:600}}>{label}</span>
        <span style={{fontFamily:"Raleway",fontSize:"11px",color:color,fontWeight:800}}>{value}{suffix}</span>
      </div>
      {sublabel && <div style={{fontFamily:"Raleway",fontSize:"10px",color:T.textSoft,fontWeight:500,marginBottom:"3px"}}>{sublabel}</div>}
      <div style={{height:"8px",borderRadius:"4px",background:bg||T.bgSoft,border:`1px solid ${T.border}`}}>
        <div style={{height:"100%",width:`${Math.round((value/max)*100)}%`,borderRadius:"4px",background:color,transition:"width 0.4s"}}/>
      </div>
    </div>
  );

  const DonutSlice = ({percent,color,offset}) => {
    const r=38, c=50, circ=2*Math.PI*r;
    const dash = (percent/100)*circ;
    return <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth="14"
      strokeDasharray={`${dash} ${circ-dash}`}
      strokeDashoffset={-offset*(circ/100)}
      style={{transform:"rotate(-90deg)",transformOrigin:"50% 50%"}}/>;
  };

  if(total===0) return (
    <div style={{padding:"0 16px 96px"}}>
      <div style={{position:"relative",borderRadius:"22px",overflow:"hidden",padding:"26px 24px",marginBottom:"20px",background:`linear-gradient(140deg,${T.tealL} 0%,#FFFFFF 50%,${T.violetL} 100%)`,boxShadow:`0 6px 28px ${T.shadowDeep}`,border:`1.5px solid ${T.border}`}}>
        <Flower size={220} opacity={0.1}/>
        <div style={{position:"relative",zIndex:1}}>
          <h2 style={{fontFamily:"Cinzel",fontSize:"22px",color:T.text,margin:"0 0 4px",fontWeight:700}}>Analyse</h2>
          <p style={{fontFamily:"Raleway",fontSize:"11px",color:T.textMid,margin:0,fontWeight:600}}>Noch keine Daten vorhanden</p>
        </div>
      </div>
      <div style={{textAlign:"center",padding:"48px 0"}}>
        <div style={{fontSize:"40px",marginBottom:"12px",opacity:0.3}}>📊</div>
        <div style={{fontFamily:"Raleway",fontSize:"14px",color:T.textMid,fontWeight:600}}>Starte deine erste Sitzung</div>
        <div style={{fontFamily:"Raleway",fontSize:"12px",color:T.textSoft,fontWeight:500,marginTop:"6px"}}>Daten erscheinen nach der ersten Sitzung</div>
      </div>
    </div>
  );

  // Donut data for session types
  let offset=0;
  const donutData=[
    {label:"Erstsitzung",  value:typeCount.first,   color:T.teal,   pct:Math.round(typeCount.first/typeTotal*100)},
    {label:"Folgesitzung", value:typeCount.followup, color:T.violet, pct:Math.round(typeCount.followup/typeTotal*100)},
    {label:"Abschluss",    value:typeCount.closing,  color:T.gold,   pct:Math.round(typeCount.closing/typeTotal*100)},
  ].filter(d=>d.value>0);

  return (
    <div style={{padding:"0 16px 96px"}}>
      {/* Hero */}
      <div style={{position:"relative",borderRadius:"22px",overflow:"hidden",padding:"24px",marginBottom:"20px",background:`linear-gradient(140deg,${T.tealL} 0%,#FFFFFF 50%,${T.violetL} 100%)`,boxShadow:`0 6px 28px ${T.shadowDeep}`,border:`1.5px solid ${T.border}`}}>
        <Flower size={220} opacity={0.1}/>
        <div style={{position:"relative",zIndex:1}}>
          <h2 style={{fontFamily:"Cinzel",fontSize:"22px",color:T.text,margin:"0 0 4px",fontWeight:700}}>Analyse</h2>
          <p style={{fontFamily:"Raleway",fontSize:"11px",color:T.textMid,margin:0,fontWeight:600}}>{total} Sitzungen · {clients.length} Klienten</p>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px",marginBottom:"16px"}}>
        {[
          {label:"Sitzungen",  value:total,                        bg:T.tealL,   border:T.borderMid, color:T.tealD},
          {label:"Klienten",   value:clients.length,               bg:T.violetL, border:"#A78BFA",   color:T.violetD},
          {label:"Ø pro Klient",value:clients.length?(total/clients.length).toFixed(1):"—", bg:T.goldL, border:"#F59E0B", color:"#7C4A00"},
        ].map((s,i)=>(
          <div key={i} style={{background:s.bg,borderRadius:"16px",border:`1.5px solid ${s.border}`,padding:"14px 8px",textAlign:"center",boxShadow:`0 2px 10px ${T.shadow}`}}>
            <div style={{fontFamily:"Cinzel",fontSize:"22px",color:s.color,fontWeight:700}}>{s.value}</div>
            <div style={{fontFamily:"Raleway",fontSize:"9px",color:s.color,marginTop:"4px",fontWeight:700,opacity:0.85}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Ebenen Häufigkeit */}
      <SectionCard title="Ebenen-Häufigkeit" icon="⚡">
        {ebenenSorted.map(e=>(
          <HBar key={e.key} label={`${e.icon} ${e.name}`} value={e.count} max={maxEbene} color={e.bar} bg={e.bg}
            sublabel={e.count>0?`Ø ${e.avg}% Aktivierung · ${e.count} Sitzung${e.count!==1?"en":""}`:""}/>
        ))}
      </SectionCard>

      {/* Zeitverlauf */}
      <SectionCard title="Sitzungen pro Monat" icon="📅">
        <div style={{display:"flex",alignItems:"flex-end",gap:"8px",height:"80px",marginBottom:"8px"}}>
          {monthData.map((m,i)=>(
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"4px",height:"100%",justifyContent:"flex-end"}}>
              <div style={{fontFamily:"Raleway",fontSize:"10px",color:T.teal,fontWeight:800}}>{m.count||""}</div>
              <div style={{width:"100%",borderRadius:"6px 6px 0 0",background:m.count>0?T.teal:T.bgSoft,height:`${Math.max((m.count/maxMonth)*100,4)}%`,border:`1px solid ${m.count>0?T.borderMid:T.border}`,transition:"height 0.4s"}}/>
              <div style={{fontFamily:"Raleway",fontSize:"9px",color:T.textSoft,fontWeight:700}}>{m.label}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Session types donut */}
      <SectionCard title="Sitzungstypen" icon="🔄">
        <div style={{display:"flex",alignItems:"center",gap:"20px"}}>
          <svg width="100" height="100" viewBox="0 0 100 100" style={{flexShrink:0}}>
            {donutData.map((d,i)=>{
              const el = <DonutSlice key={i} percent={d.pct} color={d.color} offset={offset}/>;
              offset+=d.pct; return el;
            })}
            <text x="50" y="54" textAnchor="middle" style={{fontFamily:"Cinzel,serif",fontSize:"16px",fontWeight:"700",fill:T.text}}>{total}</text>
          </svg>
          <div style={{flex:1}}>
            {donutData.map((d,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
                <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                  <div style={{width:"10px",height:"10px",borderRadius:"50%",background:d.color,flexShrink:0}}/>
                  <span style={{fontFamily:"Raleway",fontSize:"12px",color:T.text,fontWeight:600}}>{d.label}</span>
                </div>
                <span style={{fontFamily:"Raleway",fontSize:"12px",color:d.color,fontWeight:800}}>{d.value} <span style={{color:T.textSoft,fontWeight:500}}>({d.pct}%)</span></span>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Technik Ranking */}
      {techSorted.length>0 && (
        <SectionCard title="Top Techniken" icon="🏆">
          {techSorted.map(([name,count])=>(
            <HBar key={name} label={name} value={count} max={maxTech} color={T.teal} bg={T.tealL} suffix={` ×`}/>
          ))}
        </SectionCard>
      )}

      {/* Kategorien */}
      {catSorted.length>0 && (
        <SectionCard title="Themengebiete" icon="🎯">
          {catSorted.map(([cat,count])=>(
            <HBar key={cat} label={cat} value={count} max={maxCat} color={T.violet} bg={T.violetL} suffix=" Sitzungen"/>
          ))}
        </SectionCard>
      )}

      {/* Resonanz-Quellen */}
      {resSorted.length>0 && (
        <SectionCard title="Resonanz-Quellen" icon="🔮">
          <div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
            {resSorted.map(([src,count])=>(
              <div key={src} style={{background:T.bgSoft,borderRadius:"12px",padding:"8px 14px",border:`1.5px solid ${T.border}`}}>
                <div style={{fontFamily:"Raleway",fontSize:"13px",color:T.text,fontWeight:700}}>{src}</div>
                <div style={{fontFamily:"Raleway",fontSize:"10px",color:T.textSoft,fontWeight:600,marginTop:"2px"}}>{count}× verwendet</div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Klienten Aktivität */}
      {clientActivity.length>0 && (
        <SectionCard title="Klienten-Aktivität" icon="👥">
          {clientActivity.map(c=>(
            <div key={c.id} style={{marginBottom:"12px"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
                <span style={{fontFamily:"Raleway",fontSize:"12px",color:T.text,fontWeight:700}}>{c.name}</span>
                <span style={{fontFamily:"Raleway",fontSize:"11px",color:T.teal,fontWeight:800}}>{c.sessionCount} Sitzung{c.sessionCount!==1?"en":""}</span>
              </div>
              {c.lastSession && <div style={{fontFamily:"Raleway",fontSize:"10px",color:T.textSoft,fontWeight:500,marginBottom:"4px"}}>Letzte: {new Date(c.lastSession.createdAt).toLocaleDateString("de-DE")}</div>}
              <div style={{height:"6px",borderRadius:"3px",background:T.tealL,border:`1px solid ${T.border}`}}>
                <div style={{height:"100%",width:`${Math.round((c.sessionCount/maxClientSessions)*100)}%`,borderRadius:"3px",background:T.teal}}/>
              </div>
              <button onClick={()=>onSelectClient&&onSelectClient(c.id)} style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:700,marginTop:"5px",color:T.teal,background:"none",border:"none",cursor:"pointer",padding:0}}>📊 Detail-Analyse →</button>
            </div>
          ))}
        </SectionCard>
      )}

      {/* Tags / Krankheitsbilder */}
      {tagSorted.length>0 && (
        <SectionCard title="Themen & Krankheitsbilder" icon="🏷">
          <div style={{display:"flex",flexWrap:"wrap",gap:"7px"}}>
            {tagSorted.map(([tag,count])=>(
              <div key={tag} style={{background:T.bgSoft,borderRadius:"20px",padding:"6px 14px",border:`1.5px solid ${T.border}`,display:"flex",alignItems:"center",gap:"6px"}}>
                <span style={{fontFamily:"Raleway",fontSize:"12px",color:T.text,fontWeight:700}}>{tag}</span>
                <span style={{fontFamily:"Raleway",fontSize:"10px",color:T.teal,fontWeight:800,background:T.tealL,padding:"1px 7px",borderRadius:"10px"}}>{count}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Häufige Themen-Keywords */}
      {topWords.length>0 && (
        <SectionCard title="Häufige Themen-Begriffe" icon="💬">
          <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
            {topWords.map(([word,count],i)=>{
              const size = 11 + Math.round((count / (topWords[0][1]||1)) * 6);
              return(
                <span key={word} style={{fontFamily:"Raleway",fontSize:`${size}px`,fontWeight:700,color:i<3?T.tealD:T.textMid,background:i<3?T.tealL:T.bgSoft,padding:"5px 12px",borderRadius:"16px",border:`1px solid ${i<3?T.borderMid:T.border}`}}>
                  {word} <span style={{fontSize:"10px",opacity:0.7}}>×{count}</span>
                </span>
              );
            })}
          </div>
        </SectionCard>
      )}

    </div>
  );
}

export { Analytics };
