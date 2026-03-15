import React, { useState, useEffect, useCallback, useRef } from "react";
import { OT } from "./OracleUI.jsx";
import { HellsinnScanner } from "./HellsinnScanner.jsx";
import { OrganspracheKarte } from "./OrganspracheKarte.jsx";
import { AuraChirurgie } from "./AuraChirurgie.jsx";
import { ChakraMatrix } from "./ChakraMatrix.jsx";
import { HeilungsGuide } from "./HeilungsGuide.jsx";
import { Lernpfad } from "./Lernpfad.jsx";

function ResonanzOracle({ groqFetch }){
  const [aktiv, setAktiv] = useState("scanner");

  const TABS = [
    { id:"scanner",    icon:"💫", label:"Hellsinn-Scanner" },
    { id:"organmap",   icon:"🫀", label:"Organsprache"    },
    { id:"chakra",     icon:"🌈", label:"Chakren"         },
    { id:"aura",       icon:"🌐", label:"Aura & Chirurgie"},
    { id:"heilung",    icon:"💚", label:"Heilungs-Guide"  },
    { id:"lernpfad",   icon:"🏆", label:"Lernpfad"        },
  ];

  useEffect(() => {
    if (!document.querySelector("#oracle-fonts")) {
      const l = document.createElement("link");
      l.id = "oracle-fonts";
      l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Raleway:wght@400;500;600;700;800&display=swap";
      document.head.appendChild(l);
    }
  }, []);

  return (
    <div style={{background:OT.bg,minHeight:"100%",paddingBottom:"40px"}}>
      {/* Hero */}
      <div style={{position:"relative",margin:"0 0 20px",padding:"26px 20px 22px",background:`linear-gradient(145deg,${OT.tealL} 0%,#FFFFFF 45%,${OT.violetL} 100%)`,borderBottom:`1.5px solid ${OT.border}`,overflow:"hidden"}}>
        <div style={{position:"absolute",top:-60,right:-60,width:"200px",height:"200px",borderRadius:"50%",background:`radial-gradient(circle,${OT.violetL} 0%,transparent 70%)`,opacity:0.6,pointerEvents:"none"}}/>
        <div style={{position:"relative",zIndex:1}}>
          <div style={{fontFamily:"Cinzel",fontSize:"22px",color:OT.text,fontWeight:700,letterSpacing:"2px",marginBottom:"4px"}}>✦ Resonanz Oracle</div>
          <div style={{fontFamily:"Raleway",fontSize:"10px",color:OT.textSoft,letterSpacing:"3px",fontWeight:700,textTransform:"uppercase"}}>KI als stiller Berater im Hintergrund</div>
          <div style={{fontFamily:"Raleway",fontSize:"12px",color:OT.textMid,fontWeight:500,marginTop:"8px",lineHeight:"1.6"}}>Organsprache · Chakren · Aura-Chirurgie · Heilungs-Guide · Lernpfad</div>
        </div>
      </div>

      {/* Tab-Navigation (horizontal scrollbar) */}
      <div style={{overflowX:"auto",paddingBottom:"2px"}}>
        <div style={{display:"flex",gap:"6px",padding:"0 16px",minWidth:"max-content"}}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={()=>setAktiv(tab.id)} style={{display:"flex",alignItems:"center",gap:"6px",padding:"9px 14px",borderRadius:"20px",border:`1.5px solid ${aktiv===tab.id?OT.teal:OT.border}`,background:aktiv===tab.id?OT.teal:"white",color:aktiv===tab.id?"white":OT.textMid,fontFamily:"Raleway",fontSize:"11px",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",boxShadow:aktiv===tab.id?`0 3px 12px rgba(13,148,136,0.3)`:"none",transition:"all 0.15s"}}>
              <span>{tab.icon}</span><span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Inhalt */}
      <div style={{padding:"16px 16px 0"}}>
        {aktiv === "scanner"  && <HellsinnScanner groqFetch={groqFetch}/>}
        {aktiv === "organmap" && <OrganspracheKarte groqFetch={groqFetch}/>}
        {aktiv === "chakra"   && <ChakraMatrix groqFetch={groqFetch}/>}
        {aktiv === "aura"     && <AuraChirurgie groqFetch={groqFetch}/>}
        {aktiv === "heilung"  && <HeilungsGuide groqFetch={groqFetch}/>}
        {aktiv === "lernpfad" && <Lernpfad groqFetch={groqFetch}/>}
      </div>

      {/* Disclaimer */}
      <div style={{textAlign:"center",padding:"32px 20px 0",fontFamily:"Raleway",fontSize:"9px",color:OT.textSoft,letterSpacing:"1px",fontWeight:600,lineHeight:"2"}}>
        LICHTKERN · RESONANZ ORACLE · powered by Human Resonanz<br/>
        Kein Ersatz für medizinische oder therapeutische Behandlung
      </div>
    </div>
  );
}

export { ResonanzOracle };
