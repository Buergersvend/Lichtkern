import React, { useState, useEffect, useCallback, useRef } from "react";
import { Flower } from "../components/Decorations";
import { T } from "../config/theme.js";
import { Card, Btn, SL, TI, LBar } from "../components/UI.jsx";
import { top2, lvl, dynGrad } from "../config/helpers";
import { LEVELS } from "../config/constants";
import { PDFModal } from "./PDFModal.jsx";
function History({sessions, onDelete}){
  const [detail,setDetail]=useState(null);
  const [pdfSession,setPdfSession]=useState(null);
  if(detail)return(<div style={{padding:"0 16px 96px"}}>
    <button onClick={()=>setDetail(null)} style={{fontFamily:"Raleway",fontSize:"13px",color:T.gold,fontWeight:700,background:"none",border:"none",cursor:"pointer",paddingTop:"8px",display:"block",marginBottom:"14px"}}>← Zurück</button>
    <div style={{position:"relative",borderRadius:"20px",overflow:"hidden",padding:"24px",marginBottom:"14px",background:T.bgSoft,boxShadow:`0 4px 22px ${T.shadowDeep}`,border:`1.5px solid ${T.border}`}}>
      <Flower size={200} opacity={0.1}/>
      <div style={{position:"relative",zIndex:1}}>
        <div style={{fontFamily:"Cinzel",fontSize:"22px",color:T.text,fontWeight:700}}>{detail.clientName||"—"}</div>
        <div style={{fontFamily:"Raleway",fontSize:"12px",color:T.textMid,marginTop:"3px",fontWeight:500}}>{new Date(detail.createdAt).toLocaleDateString("de-DE",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginTop:"10px"}}>{top2(detail.levels||{}).map(([k,v])=>{const i=lvl(k);return<span key={k} style={{fontSize:"11px",padding:"5px 13px",borderRadius:"20px",background:"rgba(255,255,255,0.85)",color:i?.text,fontFamily:"Raleway",fontWeight:700,border:`1.5px solid ${i?.border}`}}>{i?.icon} {i?.name} {v}%</span>;})}</div>
      </div>
    </div>
    {detail.goal&&<Card style={{marginBottom:"10px"}}><SL>Thema</SL><div style={{fontFamily:"Raleway",fontSize:"14px",color:T.text,lineHeight:"1.75",fontWeight:500}}>{detail.goal}</div></Card>}
    {Object.values(detail.levels||{}).some(v=>v>0)&&<Card style={{marginBottom:"10px"}}><SL>Ebenen</SL>{LEVELS.map(l=><LBar key={l.key} levelKey={l.key} value={detail.levels?.[l.key]||0} compact/>)}</Card>}
    {detail.techniques?.length>0&&<Card style={{marginBottom:"10px"}}><SL>Techniken</SL><div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>{detail.techniques.map(t=><span key={t} style={{fontSize:"11px",padding:"5px 13px",borderRadius:"20px",background:'rgba(201,168,76,0.15)',color:T.goldD,fontFamily:"Raleway",fontWeight:700,border:`1px solid ${T.borderMid}`}}>{t}</span>)}</div></Card>}
    {detail.outcome&&<Card style={{marginBottom:"10px"}}><SL>Ergebnis</SL><div style={{fontFamily:"Raleway",fontSize:"14px",color:T.text,lineHeight:"1.75",fontWeight:500}}>{detail.outcome}</div></Card>}
    {detail.homework&&<div style={{marginBottom:"10px",background:"#EDFAF2",borderRadius:"16px",padding:"16px",border:"1.5px solid #4DC98A"}}><SL color="#0A3B20">🌱 Integrationsauftrag</SL><div style={{fontFamily:"Raleway",fontSize:"14px",color:"#0A3B20",lineHeight:"1.75",fontWeight:500}}>{detail.homework}</div></div>}
    {detail.aiSummary&&<div style={{marginBottom:"10px",background:T.bgSoft,borderRadius:"16px",padding:"16px",border:`1.5px solid ${T.borderMid}`}}><SL color={T.goldD}>✦ Zusammenfassung</SL><div style={{fontFamily:"Raleway",fontSize:"13px",color:T.text,lineHeight:"1.85",whiteSpace:"pre-wrap",fontWeight:500}}>{detail.aiSummary}</div></div>}
    <div style={{display:"flex",gap:"8px",marginTop:"16px"}}>
      <button onClick={()=>setPdfSession(detail)} style={{flex:2,fontFamily:"Raleway",fontWeight:700,fontSize:"13px",padding:"12px",borderRadius:"12px",border:`1.5px solid ${T.border}`,background:T.bgSoft,color:T.textMid,cursor:"pointer"}}>
        📄 PDF erstellen
      </button>
      <button onClick={()=>{if(window.confirm("Sitzung wirklich löschen?")){{onDelete(detail.id);setDetail(null);}}}} style={{flex:1,fontFamily:"Raleway",fontWeight:700,fontSize:"13px",padding:"12px",borderRadius:"12px",border:"1.5px solid #FCA5A5",background:"#FEE2E2",color:"#9B1C1C",cursor:"pointer"}}>
        🗑 Löschen
      </button>
    </div>
    <div style={{textAlign:"center",marginTop:"16px",fontFamily:"Raleway",fontSize:"9px",letterSpacing:"2px",color:T.textSoft,lineHeight:"2",fontWeight:700}}>LICHTKERN · powered by Human Resonanz<br/>Kein Ersatz für medizinische Behandlung</div>
    {pdfSession&&<PDFModal session={pdfSession} onClose={()=>setPdfSession(null)}/>}
  </div>);
  return(<div style={{padding:"0 16px 96px"}}>
    <h2 style={{fontFamily:"Cinzel",fontSize:"22px",color:T.text,paddingTop:"8px",marginBottom:"16px",fontWeight:700}}>Sitzungsverlauf</h2>
    {sessions.length===0&&<div style={{textAlign:"center",padding:"60px 0"}}><div style={{fontSize:"40px",marginBottom:"10px",opacity:0.3}}>◎</div><div style={{fontFamily:"Raleway",fontSize:"14px",color:T.textMid,fontWeight:600}}>Noch keine Sitzungen</div></div>}
    <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
      {sessions.map(s=>{const t=top2(s.levels||{});const li=t[0]?lvl(t[0][0]):null;return(
        <Card key={s.id} onClick={()=>setDetail(s)} style={{cursor:"pointer"}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            <div style={{width:"46px",height:"46px",borderRadius:"50%",background:li?.bg||T.bgSoft,border:`1.5px solid ${li?.border||T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",flexShrink:0}}>{li?.icon||"✦"}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontFamily:"Raleway",fontWeight:700,fontSize:"14px",color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.clientName||"—"}</span><span style={{fontFamily:"Raleway",fontSize:"10px",color:T.textSoft,fontWeight:600,flexShrink:0,marginLeft:"8px"}}>{new Date(s.createdAt).toLocaleDateString("de-DE")}</span></div>
              <div style={{fontFamily:"Raleway",fontSize:"12px",color:T.textMid,fontWeight:500,marginTop:"3px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.goal||"Kein Thema"}</div>
              <div style={{display:"flex",gap:"5px",marginTop:"7px",flexWrap:"wrap"}}>{t.map(([k,v])=>{const i=lvl(k);return<span key={k} style={{fontSize:"10px",padding:"3px 10px",borderRadius:"10px",background:i?.bg,color:i?.text,fontFamily:"Raleway",fontWeight:700,border:`1px solid ${i?.border}`}}>{i?.name}</span>;})}</div>
            </div>
            <span style={{color:T.textSoft,fontSize:"20px"}}>›</span>
          </div>
        </Card>
      );})}
    </div>
  </div>);
}

export { History };
