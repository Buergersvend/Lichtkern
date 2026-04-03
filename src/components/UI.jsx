// v4

import React from "react";
import { T } from "../config/theme.js";

const LEVELS=[
  {key:"struktur",name:"Struktur",icon:"🌍",bg:"#FEF9EC",border:"#D9A84E",bar:"#B07D2A",text:"#4A2E00"},
  {key:"stoffwechsel",name:"Stoffwechsel",icon:"🔥",bg:"#FFF1EE",border:"#E8836A",bar:"#C05A3E",text:"#4A1500"},
  {key:"energetisch",name:"Energetisch",icon:"⚡",bg:"#E6FAF7",border:"#2CB8AA",bar:"#0D9488",text:"#0A3B37"},
  {key:"emotional",name:"Emotional",icon:"💚",bg:"#EDFAF2",border:"#4DC98A",bar:"#17956A",text:"#0A3B20"},
  {key:"mental",name:"Mental",icon:"🌟",bg:"#FDFBE8",border:"#C8B040",bar:"#9A820A",text:"#3A2E00"},
  {key:"spirituell",name:"Spirituell",icon:"🔮",bg:"#F0EDFC",border:"#9B7EE0",bar:"#6D3FCC",text:"#2A1660"},
  {key:"universell",name:"Universell",icon:"🌌",bg:"#F5EFFE",border:"#B890EC",bar:"#8B4ED4",text:"#3A1260"},
  {key:"dna",name:"DNA / Ahnen",icon:"🧬",bg:"#EAF4FE",border:"#6BAEE8",bar:"#2C7FD4",text:"#0A2A50"},
];


export function Card({children,style={},onClick}){
  return(<div onClick={onClick} style={{background:T.bgCard,borderRadius:"18px",border:`1.5px solid ${T.border}`,padding:"16px",boxShadow:`0 3px 18px ${T.shadow}`,cursor:onClick?"pointer":"default",...style}}>{children}</div>);
}

export function SL({children,color}){
  return <div style={{fontSize:"10px",letterSpacing:"2.5px",color:color||T.textMid,fontFamily:"Raleway",fontWeight:800,textTransform:"uppercase",marginBottom:"9px"}}>{children}</div>;
}

export function Btn({children,variant="primary",onClick,disabled,style={}}){
  const base={fontFamily:"Raleway",fontWeight:700,fontSize:"13px",border:"none",borderRadius:"12px",padding:"12px 22px",cursor:disabled?"not-allowed":"pointer",transition:"all 0.2s",opacity:disabled?0.45:1,...style};
  const v={
    primary:{background:`linear-gradient(135deg,${T.teal},${T.tealD})`,color:"#FFF",boxShadow:`0 4px 16px ${T.shadowDeep}`},
    ghost:{background:T.tealL,color:T.tealD,border:`1.5px solid ${T.borderMid}`},
    soft:{background:T.bgSoft,color:T.textMid,border:`1.5px solid ${T.border}`},
    success:{background:`linear-gradient(135deg,${T.teal},${T.tealD})`,color:"#FFF",boxShadow:`0 4px 14px ${T.shadowDeep}`},
    violet:{background:`linear-gradient(135deg,${T.violet},${T.violetD})`,color:"#FFF"},
    danger:{background:"#FEE2E2",color:"#9B1C1C",border:"1.5px solid #FCA5A5"},
  };
  return <button onClick={disabled?undefined:onClick} style={{...base,...v[variant]}}>{children}</button>;
}

export function TI({value,onChange,placeholder,multiline=false,rows=3,type="text"}){
 const s={width:"100%",background:"#1A1A1A",border:`1.5px solid ${T.border}`,borderRadius:"12px",padding:"11px 14px",color:T.text,fontFamily:"Raleway",fontSize:"13px",fontWeight:500,outline:"none",boxSizing:"border-box",resize:"none"};
  return multiline?<textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={s}/>:<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={s}/>;
}

export function LBar({levelKey,value=0,onChange,compact=false}){
  const info=LEVELS.find(l=>l.key===levelKey);if(!info)return null;
  return(<div style={{display:"flex",alignItems:"center",gap:"10px",padding:compact?"4px 0":"8px 0"}}>
    <span style={{fontSize:compact?"14px":"18px",width:"22px",textAlign:"center"}}>{info.icon}</span>
    <div style={{flex:1}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"5px"}}>
        <span style={{fontSize:"12px",color:info.text,fontFamily:"Raleway",fontWeight:700}}>{info.name}</span>
        <span style={{fontSize:"11px",color:info.text,fontFamily:"Raleway",fontWeight:800,background:info.bg,padding:"1px 8px",borderRadius:"8px",border:`1px solid ${info.border}`}}>{value}%</span>
      </div>
      {onChange?(
        <div style={{position:"relative",height:"9px"}}>
          <div style={{position:"absolute",inset:0,borderRadius:"5px",background:info.bg,border:`1px solid ${info.border}`}}/>
          <div style={{position:"absolute",top:0,left:0,height:"100%",width:`${value}%`,borderRadius:"5px",background:info.bar,transition:"width 0.1s"}}/>
          <input type="range" min="0" max="100" value={value} onChange={e=>onChange(levelKey,+e.target.value)} style={{position:"absolute",inset:0,width:"100%",opacity:0,cursor:"pointer",height:"9px"}}/>
        </div>
      ):(
        <div style={{height:"6px",borderRadius:"3px",background:info.bg,border:`1px solid ${info.border}`}}>
          <div style={{height:"100%",width:`${value}%`,borderRadius:"3px",background:info.bar}}/>
        </div>
      )}
    </div>
  </div>);
}

export function Pill({label,active,onClick}){
  return <button onClick={onClick} style={{fontFamily:"Raleway",fontSize:"12px",fontWeight:600,padding:"7px 16px",borderRadius:"20px",border:`1.5px solid ${active?T.teal:T.border}`,background:active?T.teal:T.bgCard,color:active?"#FFF":T.textMid,cursor:"pointer",transition:"all 0.15s"}}>{label}</button>;
}

export function Select({value,onChange,options}){
return(<select value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",background:"#1A1A1A",border:`1.5px solid ${T.border}`,borderRadius:"12px",padding:"11px 14px",color:T.text,fontFamily:"Raleway",fontSize:"13px",fontWeight:500,outline:"none",appearance:"none"}}>
    {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
  </select>);
}
export const NAV=[
  {id:"dashboard",label:"Übersicht", icon:"◉"},
  {id:"clients",  label:"Klienten",  icon:"◈"},
  {id:"session",  label:"Sitzung",   icon:"✦"},
  {id:"calendar", label:"Kalender",  icon:"◷"},
  {id:"history",  label:"Verlauf",   icon:"◎"},
 {id:"oracle", label:"Resonanz", icon:"✦"},
];

export function BottomNav({active,onChange}){
  return(<nav style={{position:"fixed",bottom:0,left:0,right:0,background:"#0F0F0F",borderTop:`1.5px solid ${T.border}`,display:"flex",zIndex:100,paddingBottom:"env(safe-area-inset-bottom)"}}>
    {NAV.map(n=>(
      <button key={n.id} onClick={()=>onChange(n.id)} style={{flex:1,padding:"10px 4px 8px",border:"none",background:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"3px"}}>
        <span style={{fontSize:"18px",opacity:active===n.id?1:0.4}}>{n.icon}</span>
        <span style={{fontSize:"9px",fontFamily:"Raleway",fontWeight:700,letterSpacing:"1px",color:active===n.id?T.teal:T.textSoft,textTransform:"uppercase"}}>{n.label}</span>
      </button>
    ))}
  </nav>);
}
