import React, { useState, useEffect, useCallback, useRef } from "react";
import { T } from "../config/theme.js";

function Flower({size=280,opacity=0.09,color}){
  const c=color||T.teal,r=44,cx=size/2,cy=size/2;
  const pts=[[0,0],[r,0],[-r,0],[r/2,r*0.866],[-r/2,r*0.866],[r/2,-r*0.866],[-r/2,-r*0.866]];
  return(<svg width={size} height={size} style={{position:"absolute",top:0,left:0,opacity,pointerEvents:"none"}} viewBox={`0 0 ${size} ${size}`}>
    {pts.map(([dx,dy],i)=><circle key={i} cx={cx+dx} cy={cy+dy} r={r} fill="none" stroke={c} strokeWidth="1.1"/>)}
    <circle cx={cx} cy={cy} r={r*2} fill="none" stroke={c} strokeWidth="0.5"/>
  </svg>);
}

function TreeOfLife({width=220,height=300,opacity=0.22,color,style={}}){
  const c=color||T.teal;
  const vw=220, vh=300;
  return(
    <svg width={width} height={height} viewBox={`0 0 ${vw} ${vh}`} style={{pointerEvents:"none",opacity,...style}}>
      {/* ── ROOTS ── */}
      <path d="M110 245 Q95 252 78 258 Q62 263 45 266" fill="none" stroke={c} strokeWidth="2.8" strokeLinecap="round"/>
      <path d="M110 245 Q104 255 98 263 Q92 270 86 277" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M110 245 Q108 256 107 266 Q106 274 105 282" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M110 245 Q110 257 110 267 Q110 276 110 285" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M110 245 Q112 256 113 266 Q114 274 115 282" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M110 245 Q116 255 122 263 Q128 270 134 277" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M110 245 Q125 252 142 258 Q158 263 175 266" fill="none" stroke={c} strokeWidth="2.8" strokeLinecap="round"/>
      <path d="M45 266 Q32 269 20 272" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M45 266 Q36 270 30 276" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M86 277 Q78 281 70 285" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M134 277 Q142 281 150 285" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M175 266 Q184 269 196 272" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M175 266 Q184 270 190 276" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
      {/* ── MEDITATING FIGURE ── */}
      {/* Lotus base / legs spread */}
      <path d="M72 243 Q78 234 92 230 Q101 227 110 228 Q119 227 128 230 Q142 234 148 243" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
      {/* Left foot */}
      <path d="M72 243 Q67 245 62 243 Q58 240 60 236" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      {/* Right foot */}
      <path d="M148 243 Q153 245 158 243 Q162 240 160 236" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      {/* Robe body */}
      <path d="M92 230 Q88 220 90 210 Q92 202 96 195" fill="none" stroke={c} strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M128 230 Q132 220 130 210 Q128 202 124 195" fill="none" stroke={c} strokeWidth="3.5" strokeLinecap="round"/>
      {/* Robe folds */}
      <path d="M93 224 Q99 218 106 215" fill="none" stroke={c} strokeWidth="1" strokeLinecap="round"/>
      <path d="M127 224 Q121 218 114 215" fill="none" stroke={c} strokeWidth="1" strokeLinecap="round"/>
      <path d="M91 213 Q98 208 105 205" fill="none" stroke={c} strokeWidth="0.9" strokeLinecap="round"/>
      <path d="M129 213 Q122 208 115 205" fill="none" stroke={c} strokeWidth="0.9" strokeLinecap="round"/>
      {/* Hands in lap */}
      <path d="M96 208 Q103 212 110 213 Q117 212 124 208" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      {/* Shoulders */}
      <path d="M96 195 Q89 191 84 185" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M124 195 Q131 191 136 185" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
      {/* Neck into trunk */}
      <path d="M103 195 Q102 186 102 178" fill="none" stroke={c} strokeWidth="4" strokeLinecap="round"/>
      <path d="M117 195 Q118 186 118 178" fill="none" stroke={c} strokeWidth="4" strokeLinecap="round"/>
      {/* Head */}
      <ellipse cx="110" cy="170" rx="10" ry="12" fill="none" stroke={c} strokeWidth="1.8"/>
      {/* Eyes closed */}
      <path d="M104 168 Q107 166 110 168" fill="none" stroke={c} strokeWidth="1.1" strokeLinecap="round"/>
      <path d="M110 168 Q113 166 116 168" fill="none" stroke={c} strokeWidth="1.1" strokeLinecap="round"/>
      {/* Smile */}
      <path d="M106 174 Q110 177 114 174" fill="none" stroke={c} strokeWidth="0.9" strokeLinecap="round"/>
      {/* ── TRUNK merging from head ── */}
      <path d="M103 160 Q101 148 102 136 Q103 126 104 116" fill="none" stroke={c} strokeWidth="7" strokeLinecap="round"/>
      <path d="M117 160 Q119 148 118 136 Q117 126 116 116" fill="none" stroke={c} strokeWidth="7" strokeLinecap="round"/>
      <path d="M104 116 Q105 104 106 94 Q107 85 108 76" fill="none" stroke={c} strokeWidth="5.5" strokeLinecap="round"/>
      <path d="M116 116 Q115 104 114 94 Q113 85 112 76" fill="none" stroke={c} strokeWidth="5.5" strokeLinecap="round"/>
      <path d="M108 76 Q109 65 110 55 Q110 46 110 38" fill="none" stroke={c} strokeWidth="4" strokeLinecap="round"/>
      <path d="M112 76 Q111 65 110 55" fill="none" stroke={c} strokeWidth="3.5" strokeLinecap="round"/>
      {/* ── MAIN BRANCHES ── */}
      {/* Lower left */}
      <path d="M104 128 Q88 120 70 114 Q54 109 36 107" fill="none" stroke={c} strokeWidth="3.5" strokeLinecap="round"/>
      {/* Mid left */}
      <path d="M105 112 Q86 102 66 94 Q48 87 28 84" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round"/>
      {/* Upper-mid left */}
      <path d="M106 96 Q88 82 70 72 Q54 63 36 56" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
      {/* Upper left */}
      <path d="M107 80 Q90 65 74 52 Q59 40 44 30" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"/>
      {/* Top left */}
      <path d="M108 64 Q93 48 80 34 Q68 21 56 10" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
      {/* Lower right */}
      <path d="M116 128 Q132 120 150 114 Q166 109 184 107" fill="none" stroke={c} strokeWidth="3.5" strokeLinecap="round"/>
      {/* Mid right */}
      <path d="M115 112 Q134 102 154 94 Q172 87 192 84" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round"/>
      {/* Upper-mid right */}
      <path d="M114 96 Q132 82 150 72 Q166 63 184 56" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
      {/* Upper right */}
      <path d="M113 80 Q130 65 146 52 Q161 40 176 30" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"/>
      {/* Top right */}
      <path d="M112 64 Q127 48 140 34 Q152 21 164 10" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
      {/* Center top */}
      <path d="M110 38 Q109 26 108 16 Q107 8 107 2" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"/>
      <path d="M110 38 Q111 26 112 16 Q113 8 113 2" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      {/* ── SECONDARY BRANCHES ── */}
      <path d="M36 107 Q26 103 16 100" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M36 107 Q28 104 24 110" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M28 84 Q18 80 10 77" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M36 56 Q24 50 14 46" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M44 30 Q32 22 22 16" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M56 10 Q46 4 38 0" fill="none" stroke={c} strokeWidth="1" strokeLinecap="round"/>
      <path d="M184 107 Q194 103 204 100" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M184 107 Q192 104 196 110" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M192 84 Q202 80 210 77" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M184 56 Q196 50 206 46" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M176 30 Q188 22 198 16" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M164 10 Q174 4 182 0" fill="none" stroke={c} strokeWidth="1" strokeLinecap="round"/>
      {/* ── LEAF CLUSTERS ── */}
      {[
        [16,98],[10,75],[14,44],[22,14],[38,-2],[56,8],[80,32],[107,0],[110,-1],[113,0],
        [140,32],[164,8],[182,-2],[198,14],[206,44],[210,75],[204,98],
        [24,108],[24,82],[26,52],[196,108],[196,82],[194,52]
      ].map(([x,y],i)=>(
        <g key={i}>
          <circle cx={x} cy={y} r={7} fill={c} opacity="0.18"/>
          <circle cx={x} cy={y} r={4.5} fill={c} opacity="0.28"/>
          <circle cx={x} cy={y} r={2} fill={c} opacity="0.45"/>
        </g>
      ))}
      {/* Small scattered leaves */}
      {[
        [30,100],[20,78],[28,48],[36,22],[50,5],[72,20],[100,4],[120,4],[148,20],
        [170,5],[184,22],[192,48],[200,78],[190,100],[42,108],[178,108]
      ].map(([x,y],i)=>(
        <circle key={`s${i}`} cx={x} cy={y} r={3} fill={c} opacity="0.16"/>
      ))}
    </svg>
  );
}
// ─── ATOMS ────────────────────────────────────
function Card({children,style={},onClick}){
  return(<div onClick={onClick} style={{background:T.bgCard,borderRadius:"18px",border:`1.5px solid ${T.border}`,padding:"16px",boxShadow:`0 3px 18px ${T.shadow}`,cursor:onClick?"pointer":"default",...style}}>{children}</div>);
}
function SL({children,color}){
  return <div style={{fontSize:"10px",letterSpacing:"2.5px",color:color||T.textMid,fontFamily:"Raleway",fontWeight:800,textTransform:"uppercase",marginBottom:"9px"}}>{children}</div>;
}
function Btn({children,variant="primary",onClick,disabled,style={}}){
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
function TI({value,onChange,placeholder,multiline=false,rows=3,type="text"}){
  const s={width:"100%",background:"#FFF",border:`1.5px solid ${T.border}`,borderRadius:"12px",padding:"11px 14px",color:T.text,fontFamily:"Raleway",fontSize:"13px",fontWeight:500,outline:"none",boxSizing:"border-box",resize:"none"};
  return multiline?<textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={s}/>:<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={s}/>;
}
function LBar({levelKey,value=0,onChange,compact=false}){
  const info=lvl(levelKey);if(!info)return null;
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
function Pill({label,active,onClick}){
  return <button onClick={onClick} style={{fontFamily:"Raleway",fontSize:"12px",fontWeight:600,padding:"7px 16px",borderRadius:"20px",border:`1.5px solid ${active?T.teal:T.border}`,background:active?T.teal:"#FFF",color:active?"#FFF":T.textMid,cursor:"pointer",transition:"all 0.15s"}}>{label}</button>;
}
function Select({value,onChange,options}){
  return(<select value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",background:"#FFF",border:`1.5px solid ${T.border}`,borderRadius:"12px",padding:"11px 14px",color:T.text,fontFamily:"Raleway",fontSize:"13px",fontWeight:500,outline:"none",appearance:"none"}}>
    {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
  </select>);
}

// ─── NAV ──────────────────────────────────────
const NAV=[
  {id:"dashboard",label:"Übersicht", icon:"◉"},
  {id:"clients",  label:"Klienten",  icon:"◈"},
  {id:"session",  label:"Sitzung",   icon:"✦"},
  {id:"calendar", label:"Kalender",  icon:"⊡"},
  {id:"oracle",   label:"Oracle",    icon:"🔮"},
  {id:"billing",  label:"Abrechnung",icon:"◎"},
];

function BottomNav({active,onChange}){
  return(<nav style={{position:"fixed",bottom:0,left:0,right:0,maxWidth:"480px",margin:"0 auto",height:"74px",background:"rgba(240,250,250,0.98)",backdropFilter:"blur(24px)",borderTop:`1.5px solid ${T.border}`,display:"flex",zIndex:100,boxShadow:"0 -4px 24px rgba(13,148,136,0.12)"}}>
    {NAV.map(item=>{
      const isA=active===item.id,isC=item.id==="session";
      return(<button key={item.id} onClick={()=>onChange(item.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"4px",border:"none",background:"transparent",cursor:"pointer",position:"relative",paddingBottom:"6px"}}>
        {isC&&<div style={{position:"absolute",top:"-28px",width:"56px",height:"56px",borderRadius:"50%",background:`linear-gradient(135deg,${T.teal},${T.tealD})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 6px 24px rgba(13,148,136,0.45)`,border:`3px solid #F0FAFA`}}><span style={{fontSize:"24px",color:"white"}}>{item.icon}</span></div>}
        {!isC&&<span style={{fontSize:"19px",color:isA?T.teal:T.textSoft,transition:"color 0.2s"}}>{item.icon}</span>}
        {isA&&!isC&&<div style={{position:"absolute",top:"6px",width:"4px",height:"4px",borderRadius:"50%",background:T.teal}}/>}
        <span style={{fontSize:"9px",fontFamily:"Raleway",fontWeight:800,letterSpacing:"0.5px",color:isA?T.teal:T.textSoft,marginTop:isC?"28px":"0",transition:"color 0.2s",textTransform:"uppercase"}}>{item.label}</span>
      </button>);
    })}
  </nav>);
}

// ─── APPOINTMENT MODAL ────────────────────────

export { Flower, TreeOfLife, Card, SL, Btn, TI, LBar, Pill, Select, NAV, BottomNav };
