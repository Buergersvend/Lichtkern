import React, { useState } from "react";
import { todayStr } from '../config/helpers';

const GOLD = "#C9A84C";
const DARK = "#0F0F0F";
const DARK2 = "#1A1A1A";
const DARK3 = "#242424";
const LOGO = "/Firmenlogo_ohne_Hintergrund_Herz_20260414-removebg-preview.png";

function Dashboard({clients,sessions,appointments,onNav,settings}){
  const [showMore,setShowMore]=useState(false);
  const today=todayStr();
  const todayAppts=(appointments||[]).filter(a=>a.date===today).sort((a,b)=>a.startTime.localeCompare(b.startTime));
  const hour=new Date().getHours();
  const greeting=hour<12?"Guten Morgen":hour<17?"Guten Tag":"Guten Abend";
  const name=settings?.therapistName?settings.therapistName.split(" ")[0]:"";
  const praxis=settings?.praxisname||"";

  const tiles=[
    {id:"clients",icon:"◆",label:"Klienten"},
    {id:"session",icon:"✦",label:"Sitzung"},
    {id:"calendar",icon:"◎",label:"Kalender"},
    {id:"history",icon:"◎",label:"Verlauf"},
    {id:"knowledge",icon:"◆",label:"Akademie"},
    {id:"clientanalysis",icon:"⊕",label:"Analyse"},
  ];

  const more=[
    {id:"synergy",icon:"✦",label:"Synergy Engine"},
    {id:"gentree",icon:"⊛",label:"Generationsbaum"},
    {id:"billing",icon:"◈",label:"Abrechnung"},
    {id:"templates",icon:"◉",label:"Templates"},
  ];

  return(
    <div style={{minHeight:"100vh",background:DARK,padding:"0 20px 120px"}}>

      {/* Header mit Logo */}
      <div style={{textAlign:"center",padding:"32px 0 20px",borderBottom:`1px solid rgba(201,168,76,0.2)`,marginBottom:"20px"}}>
        <img src={LOGO} style={{width:"80px",height:"80px",objectFit:"contain",marginBottom:"12px"}}/>
        <div style={{fontFamily:"Raleway",fontSize:"9px",letterSpacing:"5px",color:GOLD,marginBottom:"4px"}}>HUMAN RESONANZ</div>
        <div style={{fontFamily:"Cinzel",fontSize:"26px",letterSpacing:"6px",color:"#F5F0E8",fontWeight:700,textShadow:`0 0 30px rgba(201,168,76,0.2)`}}>LICHTKERN</div>
        <div style={{fontFamily:"Raleway",fontSize:"8px",letterSpacing:"3px",color:"rgba(245,240,232,0.3)",marginTop:"4px"}}>POWERED BY HUMAN RESONANZ</div>
      </div>

      {/* Begrüßung */}
      <div style={{textAlign:"center",marginBottom:"24px"}}>
        <div style={{fontFamily:"Cinzel",fontSize:"14px",color:GOLD,letterSpacing:"2px",marginBottom:"6px"}}>{greeting}{name?`, ${name}`:""} ✦</div>
        {praxis&&<div style={{fontFamily:"Raleway",fontSize:"11px",color:"rgba(245,240,232,0.45)",letterSpacing:"2px"}}>— {praxis} —</div>}
      </div>

      {/* Heutiger Termin */}
      {todayAppts.length>0&&(
        <div style={{background:"rgba(201,168,76,0.08)",border:`1px solid rgba(201,168,76,0.25)`,borderRadius:"14px",padding:"14px 18px",marginBottom:"20px"}}>
          <div style={{fontFamily:"Raleway",fontSize:"9px",color:GOLD,letterSpacing:"3px",marginBottom:"10px",fontWeight:700}}>HEUTE</div>
          {todayAppts.map(a=>(
            <div key={a.id} style={{display:"flex",gap:"12px",marginBottom:"6px",alignItems:"center"}}>
              <div style={{fontFamily:"Cinzel",fontSize:"13px",color:GOLD,fontWeight:600,flexShrink:0}}>{a.startTime}</div>
              <div style={{fontFamily:"Raleway",fontSize:"13px",color:"rgba(245,240,232,0.8)"}}>{a.clientName||a.title||"Termin"}</div>
            </div>
          ))}
        </div>
      )}

      {/* Kacheln 3x2 */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px",marginBottom:"16px"}}>
        {tiles.map(t=>(
          <button key={t.id} onClick={()=>onNav(t.id)}
            style={{background:DARK2,border:`1px solid rgba(201,168,76,0.2)`,borderRadius:"12px",padding:"16px 8px",textAlign:"center",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"6px"}}
            onMouseEnter={e=>{e.currentTarget.style.border=`1px solid rgba(201,168,76,0.5)`;e.currentTarget.style.background=DARK3;}}
            onMouseLeave={e=>{e.currentTarget.style.border=`1px solid rgba(201,168,76,0.2)`;e.currentTarget.style.background=DARK2;}}>
            <span style={{fontSize:"22px",color:GOLD}}>{t.icon}</span>
            <span style={{fontFamily:"Raleway",fontSize:"11px",color:"rgba(245,240,232,0.85)",fontWeight:600}}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Weitere Funktionen Dropdown */}
      <div style={{background:DARK2,border:`1px solid rgba(201,168,76,0.15)`,borderRadius:"12px",overflow:"hidden",marginBottom:"16px"}}>
        <button onClick={()=>setShowMore(!showMore)} style={{width:"100%",padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",background:"none",border:"none",cursor:"pointer",borderBottom:showMore?`1px solid rgba(201,168,76,0.1)`:"none"}}>
          <span style={{fontFamily:"Raleway",fontSize:"10px",letterSpacing:"2px",color:"rgba(201,168,76,0.7)",fontWeight:700}}>WEITERE FUNKTIONEN</span>
          <span style={{color:GOLD,fontSize:"11px",transition:"transform 0.2s",transform:showMore?"rotate(180deg)":"rotate(0deg)"}}>▼</span>
        </button>
        {showMore&&more.map((m,i)=>(
          <button key={m.id} onClick={()=>onNav(m.id)} style={{width:"100%",padding:"11px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",background:"none",border:"none",borderTop:`1px solid rgba(201,168,76,0.08)`,cursor:"pointer"}}
            onMouseEnter={e=>e.currentTarget.style.background=DARK3}
            onMouseLeave={e=>e.currentTarget.style.background="none"}>
            <span style={{display:"flex",gap:"8px",alignItems:"center"}}>
              <span style={{color:GOLD,fontSize:"14px"}}>{m.icon}</span>
              <span style={{fontFamily:"Raleway",fontSize:"13px",color:"rgba(245,240,232,0.7)"}}>{m.label}</span>
            </span>
            <span style={{color:"rgba(201,168,76,0.5)"}}>→</span>
          </button>
        ))}
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px",marginTop:"4px"}}>
        <div style={{background:DARK2,border:`1px solid rgba(201,168,76,0.15)`,borderRadius:"12px",padding:"14px 12px",textAlign:"center"}}>
          <div style={{fontFamily:"Cinzel",fontSize:"22px",color:GOLD,fontWeight:700}}>{(clients||[]).length}</div>
          <div style={{fontFamily:"Raleway",fontSize:"9px",color:"rgba(245,240,232,0.45)",letterSpacing:"2px",marginTop:"4px"}}>KLIENTEN</div>
        </div>
        <div style={{background:DARK2,border:`1px solid rgba(201,168,76,0.15)`,borderRadius:"12px",padding:"14px 12px",textAlign:"center"}}>
          <div style={{fontFamily:"Cinzel",fontSize:"22px",color:GOLD,fontWeight:700}}>{(sessions||[]).length}</div>
          <div style={{fontFamily:"Raleway",fontSize:"9px",color:"rgba(245,240,232,0.45)",letterSpacing:"2px",marginTop:"4px"}}>SITZUNGEN</div>
        </div>
        <div style={{background:DARK2,border:`1px solid rgba(201,168,76,0.15)`,borderRadius:"12px",padding:"14px 12px",textAlign:"center"}}>
          <div style={{fontFamily:"Cinzel",fontSize:"22px",color:GOLD,fontWeight:700}}>
            {(()=>{const next=(appointments||[]).filter(a=>a.date>=today).sort((a,b)=>a.date.localeCompare(b.date)||a.startTime.localeCompare(b.startTime))[0];return next?next.startTime:"—";})()}
          </div>
          <div style={{fontFamily:"Raleway",fontSize:"9px",color:"rgba(245,240,232,0.45)",letterSpacing:"2px",marginTop:"4px"}}>NÄCHSTER TERMIN</div>
        </div>
      </div>

    </div>
  );
}

export { Dashboard };
export default Dashboard;
