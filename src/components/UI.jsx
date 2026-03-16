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

export function Flower({size=280,opacity=0.09,color}){
  const c=color||T.teal,r=44,cx=size/2,cy=size/2;
  const pts=[[0,0],[r,0],[-r,0],[r/2,r*0.866],[-r/2,r*0.866],[r/2,-r*0.866],[-r/2,-r*0.866]];
  return(<svg width={size} height={size} style={{position:"absolute",top:0,left:0,opacity,pointerEvents:"none"}} viewBox={`0 0 ${size} ${size}`}>
    {pts.map(([dx,dy],i)=><circle key={i} cx={cx+dx} cy={cy+dy} r={r} fill="none" stroke={c} strokeWidth="1.1"/>)}
    <circle cx={cx} cy={cy} r={r*2} fill="none" stroke={c} strokeWidth="0.5"/>
  </svg>);
}

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
    soft:{background:T.bgSoft
