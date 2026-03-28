import React from "react";
import { todayStr } from '../config/helpers';
import { T } from "../config/theme.js";

const GOLD = "#C9A84C";
const GOLD_L = "rgba(201,168,76,0.12)";
const DARK = "#0F0F0F";
const DARK2 = "#1A1A1A";
const DARK3 = "#242424";

function Dashboard({clients,sessions,appointments,onNav,settings}){
  const today=todayStr();
  const todayAppts=(appointments||[]).filter(a=>a.date===today).sort((a,b)=>a.startTime.localeCompare(b.startTime));
  const hour=new Date().getHours();
  const greeting=hour<12?"Guten Morgen":hour<17?"Guten Tag":"Guten Abend";
  const name=settings?.therapistName?settings.therapistName.split(" ")[0]:"";

  const quickLinks=[
    {id:"clients",icon:"◈",label:"Klienten"},
    {id:"calendar",icon:"⊙",label:"Kalender"},
    {id:"knowledge",icon:"◆",label:"Wissensbasis"},
    {id:"gentree",icon:"⊛",label:"Generationsbaum"},
    {id:"synergy",icon:"⚡",label:"Synergy Engine"},
    {id:"analytics",icon:"⊕",label:"Abrechnung"},
    {id:"clientanalysis",icon:"◎",label:"Analyse"},
  ];

  return(
    <div style={{minHeight:"100vh",background:DARK,padding:"0 20px 120px"}}>

      {/* Header */}
      <div style={{textAlign:"center",padding:"40px 0 32px",borderBottom:`1px solid rgba(201,168,76,0.2)`}}>
        <div style={{fontFamily:"Raleway",fontSize:"9px",color:GOLD,letterSpacing:"5px",textTransform:"uppercase",marginBottom:"8px",opacity:0.8}}>HUMAN RESONANZ</div>
        <div style={{fontFamily:"Cinzel",fontSize:"32px",color:"#F5F0E8",fontWeight:700,letterSpacing:"4px",lineHeight:1,textShadow:`0 0 40px rgba(201,168,76,0.3)`}}>LICHTKERN</div>
        <div style={{fontFamily:"Raleway",fontSize:"9px",color:"rgba(245,240,232,0.4)",letterSpacing:"4px",textTransform:"uppercase",marginTop:"6px"}}>POWERED BY HUMAN RESONANZ</div>
      </div>

      {/* Greeting */}
      <div style={{textAlign:"center",padding:"28px 0 24px"}}>
        <div style={{fontFamily:"Cinzel",fontSize:"15px",color:GOLD,fontWeight:600,letterSpacing:"2px"}}>{greeting}{name?`, ${name}`:""} ✦</div>
        <div style={{fontFamily:"Raleway",fontSize:"11px",color:"rgba(245,240,232,0.4)",marginTop:"6px",letterSpacing:"1px"}}>
          {clients.length} Klient{clients.length!==1?"en":""} · {sessions.length} Sitzung{sessions.length!==1?"en":""}
        </div>
      </div>

      {/* Heutiger Termin */}
      {todayAppts.length>0&&(
        <div style={{background:GOLD_L,border:`1px solid rgba(201,168,76,0.3)`,borderRadius:"16px",padding:"16px 20px",marginBottom:"24px"}}>
          <div style={{fontFamily:"Raleway",fontSize:"9px",color:GOLD,letterSpacing:"3px",textTransform:"uppercase",marginBottom:"10px",fontWeight:700}}>Heute</div>
          {todayAppts.map(a=>(
            <div key={a.id} style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"6px"}}>
              <div style={{fontFamily:"Cinzel",fontSize:"13px",color:GOLD,fontWeight:600,flexShrink:0}}>{a.startTime}</div>
              <div style={{fontFamily:"Raleway",fontSize:"13px",color:"rgba(245,240,232,0.8)"}}>{a.clientName||a.title||"Termin"}</div>
            </div>
          ))}
        </div>
      )}

      {/* Schnellzugriff */}
      <div style={{marginBottom:"8px"}}>
        <div style={{fontFamily:"Raleway",fontSize:"9px",color:"rgba(201,168,76,0.6)",letterSpacing:"3px",textTransform:"uppercase",marginBottom:"16px",fontWeight:700}}>Schnellzugriff</div>
        <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
          {quickLinks.map(l=>(
            <button key={l.id} onClick={()=>onNav(l.id)} style={{background:DARK2,border:`1px solid rgba(201,168,76,0.15)`,borderRadius:"14px",padding:"16px 20px",display:"flex",alignItems:"center",gap:"14px",cursor:"pointer",textAlign:"left",transition:"all 0.2s"}}
              onMouseEnter={e=>{e.currentTarget.style.border=`1px solid rgba(201,168,76,0.4)`;e.currentTarget.style.background=DARK3;}}
              onMouseLeave={e=>{e.currentTarget.style.border=`1px solid rgba(201,168,76,0.15)`;e.currentTarget.style.background=DARK2;}}>
              <span style={{fontSize:"18px",color:GOLD,opacity:0.8,flexShrink:0}}>{l.icon}</span>
              <span style={{fontFamily:"Raleway",fontSize:"14px",color:"rgba(245,240,232,0.85)",fontWeight:600}}>{l.label}</span>
              <span style={{marginLeft:"auto",color:"rgba(201,168,76,0.4)",fontSize:"14px"}}>→</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}

export default Dashboard;
