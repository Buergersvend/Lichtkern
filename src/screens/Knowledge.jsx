import React, { useState, useEffect, useCallback, useRef } from "react";
import { T } from "../config/theme.js";
import { APPT_TYPES, LEVELS, TECHNIQUES, KNOWLEDGE, DE_DAYS, DE_DAYS_F, DE_MONTHS, HOURS } from "../config/constants.js";
import { Card, Btn, Pill } from "../components/UI.jsx";

function Knowledge(){
  const [sel,setSel]=useState(null);const [tab,setTab]=useState("soft");
  if(sel)return(<div style={{padding:"0 16px 96px"}}>
    <button onClick={()=>setSel(null)} style={{fontFamily:"Raleway",fontSize:"13px",color:T.teal,fontWeight:700,background:"none",border:"none",cursor:"pointer",paddingTop:"8px",display:"block",marginBottom:"14px"}}>← Zurück</button>
    <div style={{position:"relative",borderRadius:"22px",overflow:"hidden",padding:"28px 24px",marginBottom:"16px",background:`linear-gradient(140deg,${T.tealL} 0%,#FFFFFF 50%,${T.violetL} 100%)`,boxShadow:`0 6px 28px ${T.shadowDeep}`,border:`1.5px solid ${T.border}`}}>
      <Flower size={200} opacity={0.11}/>
      <div style={{position:"relative",zIndex:1}}><div style={{fontSize:"50px",marginBottom:"12px"}}>{sel.icon}</div><h2 style={{fontFamily:"Cinzel",fontSize:"24px",color:T.text,margin:0,fontWeight:700}}>{sel.title}</h2></div>
    </div>
    <div style={{display:"flex",gap:"8px",marginBottom:"14px"}}>{[["soft","🌱 Erklärung"],["deep","🎓 Schulung"]].map(([v,l])=><button key={v} onClick={()=>setTab(v)} style={{flex:1,padding:"12px",borderRadius:"12px",border:`1.5px solid ${tab===v?T.teal:T.border}`,background:tab===v?T.teal:"white",cursor:"pointer",fontFamily:"Raleway",fontSize:"12px",fontWeight:700,color:tab===v?"white":T.textMid,transition:"all 0.15s"}}>{l}</button>)}</div>
    <Card>{tab==="soft"?<div style={{fontFamily:"Raleway",fontSize:"14px",color:T.text,lineHeight:"1.9",fontWeight:500}}>{sel.soft}</div>:<div style={{textAlign:"center",padding:"38px 0"}}><div style={{fontSize:"44px",marginBottom:"14px"}}>🎓</div><div style={{fontFamily:"Cinzel",fontSize:"15px",color:T.text,fontWeight:700}}>Schulung folgt</div><div style={{fontFamily:"Raleway",fontSize:"12px",color:T.textMid,marginTop:"6px",fontWeight:500}}>Resonanz Akademie · In Vorbereitung</div></div>}</Card>
    {sel.tags?.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginTop:"12px"}}>{sel.tags.map(t=><span key={t} style={{fontSize:"10px",padding:"4px 13px",borderRadius:"12px",background:T.tealL,color:T.tealD,fontFamily:"Raleway",fontWeight:700,border:`1px solid ${T.borderMid}`}}>{t}</span>)}</div>}
  </div>);
  return(<div style={{padding:"0 16px 96px"}}>
    <div style={{position:"relative",borderRadius:"22px",overflow:"hidden",padding:"26px 24px",marginBottom:"20px",background:`linear-gradient(140deg,${T.tealL} 0%,#FFFFFF 50%,${T.violetL} 100%)`,boxShadow:`0 6px 28px ${T.shadowDeep}`,border:`1.5px solid ${T.border}`}}>
      <Flower size={220} opacity={0.1}/>
      <div style={{position:"relative",zIndex:1}}><h2 style={{fontFamily:"Cinzel",fontSize:"22px",color:T.text,margin:"0 0 4px",fontWeight:700}}>Wissensbasis</h2><p style={{fontFamily:"Raleway",fontSize:"11px",color:T.textMid,margin:0,fontWeight:600}}>10 Kernthemen · Soft & Deep</p></div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
      {KNOWLEDGE.map(item=><div key={item.id} onClick={()=>{setSel(item);setTab("soft");}} style={{background:"#FFFFFF",borderRadius:"18px",padding:"18px",cursor:"pointer",border:`1.5px solid ${T.border}`,boxShadow:`0 3px 14px ${T.shadow}`}}>
        <span style={{fontSize:"32px",display:"block",marginBottom:"10px"}}>{item.icon}</span>
        <div style={{fontFamily:"Raleway",fontWeight:800,fontSize:"13px",color:T.text,marginBottom:"7px"}}>{item.title}</div>
        <div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textMid,lineHeight:"1.65",fontWeight:500,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{item.soft}</div>
        {item.tags?.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:"4px",marginTop:"10px"}}>{item.tags.map(t=><span key={t} style={{fontSize:"9px",padding:"2px 9px",borderRadius:"10px",background:T.tealL,color:T.tealD,fontFamily:"Raleway",fontWeight:700}}>{t}</span>)}</div>}
      </div>)}
    </div>
  </div>);
}

// ─── PDF GENERATOR ────────────────────────────
const LEVEL_COLORS = {
  struktur:"#B07D2A",stoffwechsel:"#C05A3E",energetisch:"#0D9488",
  emotional:"#17956A",mental:"#9A820A",spirituell:"#6D3FCC",
  universell:"#8B4ED4",dna:"#2C7FD4",
};

function flowerSVG(size=500,color="#0D9488",opacity=0.07){
  const r=55,cx=size/2,cy=size/2;
  const pts=[[0,0],[r,0],[-r,0],[r/2,r*0.866],[-r/2,r*0.866],[r/2,-r*0.866],[-r/2,-r*0.866]];
  const circles=pts.map(([dx,dy])=>`<circle cx="${cx+dx}" cy="${cy+dy}" r="${r}" fill="none" stroke="${color}" stroke-width="1.2"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="position:absolute;top:0;left:50%;transform:translateX(-50%);opacity:${opacity};pointer-events:none;">${circles}<circle cx="${cx}" cy="${cy}" r="${r*2}" fill="none" stroke="${color}" stroke-width="0.6"/></svg>`;
}

function buildPDF(session, opts){
  const {version,praxisname,showGoal,showLevels,showTechniques,showOutcome,showHomework,showAI,showReflection} = opts;
  const t2 = top2(session.levels||{});
  const c1 = t2[0] ? (LEVEL_COLORS[t2[0][0]]||"#0D9488") : "#0D9488";
  const c2 = t2[1] ? (LEVEL_COLORS[t2[1][0]]||"#6D3FCC") : "#6D3FCC";
  const gradBg = `linear-gradient(140deg,${c1}18 0%,#FFFFFF 45%,${c2}18 100%)`;
  const dateStr = new Date(session.createdAt).toLocaleDateString("de-DE",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
  const typeLabel = session.type==="first"?"Erstsitzung":session.type==="followup"?"Folgesitzung":"Abschlusssitzung";

  const levelRows = LEVELS.filter(l=>(session.levels?.[l.key]||0)>0).map(l=>{
    const val=session.levels[l.key]||0;
    const bar=`<div style="height:8px;border-radius:4px;background:#E5E0F5;margin-top:4px;"><div style="height:100%;width:${val}%;border-radius:4px;background:${l.bar};"></div></div>`;
    return `<div style="margin-bottom:10px;"><div style="display:flex;justify-content:space-between;"><span style="font-family:Raleway,sans-serif;font-size:13px;font-weight:700;color:${l.text};">${l.icon} ${l.name}</span><span style="font-family:Raleway,sans-serif;font-size:12px;font-weight:800;color:${l.text};background:${l.bg};padding:2px 10px;border-radius:8px;">${val}%</span></div>${bar}</div>`;
  }).join("");

  const techPills = (session.techniques||[]).map(t=>`<span style="display:inline-block;background:#CCFBF1;color:#0F6B63;font-family:Raleway,sans-serif;font-size:11px;font-weight:700;padding:4px 12px;border-radius:14px;margin:3px 3px 3px 0;border:1px solid #7EC8C2;">${t}</span>`).join("");

  const reflectionQuestions = version==="detail" && showReflection ? `
    <div style="page-break-before:auto;background:#F5FDFD;border-radius:16px;padding:20px 24px;margin-bottom:24px;border:1.5px solid #B2E0DC;">
      <h3 style="font-family:Cinzel,serif;font-size:14px;color:#0F3030;margin:0 0 14px;font-weight:700;">🌿 Reflexionsraum</h3>
      ${["Was hat mich in dieser Sitzung am meisten berührt?","Welche Veränderung spüre ich bereits jetzt in mir?","Was möchte ich in den nächsten Tagen besonders beobachten?","Welcher Moment der Sitzung bleibt mir im Herzen?"].map(q=>`<div style="margin-bottom:16px;"><p style="font-family:Raleway,sans-serif;font-size:12px;color:#2D6B68;font-weight:700;margin:0 0 6px;">${q}</p><div style="border-bottom:1.5px solid #B2E0DC;height:28px;margin-bottom:4px;"></div><div style="border-bottom:1.5px solid #B2E0DC;height:28px;margin-bottom:4px;"></div></div>`).join("")}
    </div>` : "";

  const html = `<!DOCTYPE html><html lang="de"><head>
<meta charset="UTF-8"/>
<title>Lichtkern · ${session.clientName||"Sitzung"}</title>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Raleway:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#F0FAFA;font-family:Raleway,sans-serif;color:#0F3030;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  @page{margin:0;size:A4;}
  @media print{body{background:white;}.no-print{display:none!important;}}
  .page{max-width:720px;margin:0 auto;padding:40px 40px 60px;}
</style>
</head><body>
<div class="page">

  <!-- Print button -->
  <div class="no-print" style="text-align:right;margin-bottom:20px;">
    <button onclick="window.print()" style="font-family:Raleway,sans-serif;font-weight:700;font-size:13px;padding:10px 24px;background:linear-gradient(135deg,#0D9488,#0F6B63);color:white;border:none;border-radius:12px;cursor:pointer;box-shadow:0 4px 14px rgba(13,148,136,0.3);">🖨 PDF speichern / Drucken</button>
  </div>

  <!-- Header -->
  <div style="position:relative;overflow:hidden;border-radius:20px;padding:36px 36px 28px;background:${gradBg};margin-bottom:28px;border:1.5px solid #B2E0DC;">
    ${flowerSVG(420,c1,0.09)}
    <div style="position:relative;z-index:1;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
        <div>
          <p style="font-family:Raleway,sans-serif;font-size:9px;letter-spacing:3px;color:#6AABA7;text-transform:uppercase;margin-bottom:6px;font-weight:700;">SITZUNGSDOKUMENTATION</p>
          <h1 style="font-family:Cinzel,serif;font-size:28px;color:#0F3030;font-weight:700;margin-bottom:4px;">${session.clientName||"Klient"}</h1>
          <p style="font-family:Raleway,sans-serif;font-size:12px;color:#2D6B68;font-weight:500;">${dateStr}</p>
          <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
            <span style="font-size:10px;padding:4px 13px;border-radius:14px;background:rgba(255,255,255,0.8);color:#0F6B63;font-family:Raleway,sans-serif;font-weight:700;border:1px solid #7EC8C2;">${typeLabel}</span>
            ${t2.map(([k,v])=>{const i=lvl(k);return`<span style="font-size:10px;padding:4px 13px;border-radius:14px;background:rgba(255,255,255,0.8);color:${i?.text};font-family:Raleway,sans-serif;font-weight:700;border:1px solid ${i?.border};">${i?.icon} ${i?.name} ${v}%</span>`;}).join("")}
          </div>
        </div>
        <div style="text-align:right;">
          ${praxisname?`<p style="font-family:Cinzel,serif;font-size:14px;color:#0F3030;font-weight:700;">${praxisname}</p>`:""}
          <p style="font-family:Raleway,sans-serif;font-size:10px;color:#6AABA7;font-weight:700;margin-top:4px;">✦ Lichtkern</p>
        </div>
      </div>
    </div>
  </div>

  ${showGoal && session.goal ? `
  <div style="background:white;border-radius:16px;padding:20px 24px;margin-bottom:20px;border:1.5px solid #B2E0DC;box-shadow:0 3px 14px rgba(13,148,136,0.08);">
    <h3 style="font-family:Cinzel,serif;font-size:13px;color:#0F3030;margin:0 0 10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Thema & Anliegen</h3>
    <p style="font-family:Raleway,sans-serif;font-size:14px;color:#0F3030;line-height:1.8;font-weight:500;">${session.goal}</p>
  </div>` : ""}

  ${showLevels && Object.values(session.levels||{}).some(v=>v>0) ? `
  <div style="background:white;border-radius:16px;padding:20px 24px;margin-bottom:20px;border:1.5px solid #B2E0DC;box-shadow:0 3px 14px rgba(13,148,136,0.08);">
    <h3 style="font-family:Cinzel,serif;font-size:13px;color:#0F3030;margin:0 0 16px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Ebenen-Analyse</h3>
    ${levelRows}
  </div>` : ""}

  ${showTechniques && (session.techniques||[]).length>0 ? `
  <div style="background:white;border-radius:16px;padding:20px 24px;margin-bottom:20px;border:1.5px solid #B2E0DC;box-shadow:0 3px 14px rgba(13,148,136,0.08);">
    <h3 style="font-family:Cinzel,serif;font-size:13px;color:#0F3030;margin:0 0 12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Angewandte Methoden</h3>
    <div>${techPills}</div>
  </div>` : ""}

  ${showOutcome && session.outcome ? `
  <div style="background:white;border-radius:16px;padding:20px 24px;margin-bottom:20px;border:1.5px solid #B2E0DC;box-shadow:0 3px 14px rgba(13,148,136,0.08);">
    <h3 style="font-family:Cinzel,serif;font-size:13px;color:#0F3030;margin:0 0 10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Ergebnis & Beobachtungen</h3>
    <p style="font-family:Raleway,sans-serif;font-size:14px;color:#0F3030;line-height:1.8;font-weight:500;">${session.outcome}</p>
  </div>` : ""}

  ${showHomework && session.homework ? `
  <div style="background:#EDFAF2;border-radius:16px;padding:20px 24px;margin-bottom:20px;border:1.5px solid #4DC98A;">
    <h3 style="font-family:Cinzel,serif;font-size:13px;color:#0A3B20;margin:0 0 10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">🌱 Integrationsauftrag</h3>
    <p style="font-family:Raleway,sans-serif;font-size:14px;color:#0A3B20;line-height:1.8;font-weight:500;">${session.homework}</p>
  </div>` : ""}

  ${showAI && session.aiSummary ? `
  <div style="background:${gradBg};border-radius:16px;padding:20px 24px;margin-bottom:20px;border:1.5px solid #B2E0DC;position:relative;overflow:hidden;">
    ${flowerSVG(300,c1,0.07)}
    <div style="position:relative;z-index:1;">
      <h3 style="font-family:Cinzel,serif;font-size:13px;color:#0F3030;margin:0 0 12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">✦ Sitzungsresonanz</h3>
      <p style="font-family:Raleway,sans-serif;font-size:13px;color:#0F3030;line-height:1.9;font-weight:500;white-space:pre-wrap;">${session.aiSummary}</p>
    </div>
  </div>` : ""}

  ${reflectionQuestions}

  <!-- Footer -->
  <div style="border-top:1.5px solid #B2E0DC;margin-top:32px;padding-top:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
    <div>
      <p style="font-family:Cinzel,serif;font-size:11px;color:#0D9488;font-weight:700;">✦ Lichtkern · powered by Human Resonanz</p>
      ${praxisname?`<p style="font-family:Raleway,sans-serif;font-size:10px;color:#6AABA7;margin-top:2px;">${praxisname}</p>`:""}
    </div>
    <p style="font-family:Raleway,sans-serif;font-size:9px;color:#6AABA7;text-align:right;line-height:1.6;">Keine medizinische Diagnose.<br/>Kein Ersatz für ärztliche oder therapeutische Behandlung.</p>
  </div>

</div>
</body></html>`;
  return html;
}

export { Knowledge };
