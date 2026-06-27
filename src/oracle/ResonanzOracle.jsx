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
    { id:"scanner",    icon:"💫", label:"Hellsinn-Wahrnehmung" },
    { id:"organmap",   icon:"🫀", label:"Organsprache"    },
    { id:"chakra",     icon:"🌈", label:"Chakren"         },
    { id:"aura",       icon:"🌐", label:"Aura-Schichten"  },
    { id:"heilung",    icon:"💚", label:"Resonanz-Guide"   },
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
      {/* Header */}
      <div style={{position:"relative",margin:"0 0 20px",padding:"26px 20px 22px",background:OT.bgSoft,borderBottom:`1.5px solid ${OT.border}`,overflow:"hidden"}}>
        <div style={{position:"relative",zIndex:1}}>
          <div style={{fontFamily:"Cinzel",fontSize:"22px",color:OT.text,fontWeight:700,letterSpacing:"2px",marginBottom:"6px"}}>✦ Resonanz-Räume</div>
          <div style={{fontFamily:"Raleway",fontSize:"12px",color:OT.textMid,fontWeight:500,lineHeight:"1.6",marginBottom:"14px"}}>Werkzeuge zur Selbstwahrnehmung und Reflexion — Organsprache, Chakren, Aura-Schichten und der Resonanz-Guide laden dazu ein, die eigene innere Landschaft zu erkunden.</div>
          <div style={{padding:"12px 14px",borderRadius:"10px",background:"rgba(201,168,76,0.07)",border:`1px solid ${OT.borderMid}`}}>
            <span style={{fontFamily:"Raleway",fontSize:"11px",color:OT.textSoft,fontWeight:500,lineHeight:"1.75"}}>Die Resonanz-Räume sind ein Angebot zur persönlichen Reflexion und Selbstwahrnehmung. Sie ersetzen keine ärztliche, psychotherapeutische oder heilkundliche Behandlung, Diagnose oder Beratung. Bei gesundheitlichen Beschwerden wende dich bitte an eine Ärztin, einen Arzt, eine Heilpraktikerin oder einen Heilpraktiker. Die hier angebotenen Inhalte stellen keine Heilaussagen dar und versprechen keine bestimmte Wirkung.</span>
          </div>
        </div>
      </div>

      {/* Tab-Navigation (horizontal scrollbar) */}
      <div style={{overflowX:"auto",paddingBottom:"2px"}}>
        <div style={{display:"flex",gap:"6px",padding:"0 16px",minWidth:"max-content"}}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={()=>setAktiv(tab.id)} style={{display:"flex",alignItems:"center",gap:"6px",padding:"9px 14px",borderRadius:"20px",border:`1.5px solid ${aktiv===tab.id?"#C9A84C":OT.border}`,background:aktiv===tab.id?"#C9A84C":OT.bgCard,color:aktiv===tab.id?"white":OT.textMid,fontFamily:"Raleway",fontSize:"11px",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",boxShadow:aktiv===tab.id?`0 3px 12px rgba(201,168,76,0.3)`:"none",transition:"all 0.15s"}}>
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
