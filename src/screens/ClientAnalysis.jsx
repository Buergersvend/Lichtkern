import React, { useState, useEffect, useCallback, useRef } from "react";
import { T } from "../config/theme.js";
import { Card, Btn, Pill } from "../components/UI.jsx";

  const client = clients.find(c=>c.id===clientId);
  const cs = sessions.filter(s=>s.clientId===clientId).sort((a,b)=>a.createdAt?.localeCompare(b.createdAt));

  if(!client||cs.length===0) return (
    <div style={{padding:"0 16px 96px"}}>
      <button onClick={onBack} style={{fontFamily:"Raleway",fontSize:"13px",color:T.teal,fontWeight:700,background:"none",border:"none",cursor:"pointer",paddingTop:"8px",display:"block",marginBottom:"16px"}}>← Zurück</button>
      <div style={{textAlign:"center",padding:"60px 0"}}>
        <div style={{fontSize:"40px",opacity:0.3,marginBottom:"12px"}}>📊</div>
        <div style={{fontFamily:"Raleway",fontSize:"14px",color:T.textMid,fontWeight:600}}>Keine Sitzungsdaten vorhanden</div>
      </div>
    </div>
  );

  // ── Data prep ──
  const first = cs[0];
  const last  = cs[cs.length-1];
  const stopwords = new Set(["und","die","der","das","ich","ist","von","mit","für","ein","eine","bei","sich","im","in","an","auf","zu","nicht","es","hat","wie","was","dem","den","aus","als"]);

  // Ebenen über Zeit (line chart data)
  const levelKeys = LEVELS.map(l=>l.key);
  const lineData = cs.map(s=>({
    date: s.createdAt?.slice(0,10)||"",
    label: new Date(s.createdAt).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit"}),
    total: Object.values(s.levels||{}).reduce((a,v)=>a+(v||0),0),
    levels: s.levels||{},
  }));

  // Fortschrittskurve — Gesamtbelastung
  const maxTotal = Math.max(...lineData.map(d=>d.total),1);
  const firstTotal = lineData[0]?.total||0;
  const lastTotal  = lineData[lineData.length-1]?.total||0;
  const trend = lastTotal < firstTotal ? "abnehmend 📉" : lastTotal > firstTotal ? "zunehmend 📈" : "stabil ➡️";
  const trendColor = lastTotal < firstTotal ? "#0A3B20" : lastTotal > firstTotal ? "#9B1C1C" : T.tealD;
  const trendBg    = lastTotal < firstTotal ? "#DCFCE7" : lastTotal > firstTotal ? "#FEE2E2" : T.tealL;

  // Technik-Entwicklung
  const techBySession = cs.map(s=>({date:s.createdAt?.slice(0,10),techniques:s.techniques||[]}));
  const allTechs = [...new Set(cs.flatMap(s=>s.techniques||[]))];

  // Wordcloud per client
  const wordCount = {};
  cs.forEach(s=>{
    (s.goal||"").toLowerCase().replace(/[^\wäöüß\s]/g,"").split(/\s+/).forEach(w=>{
      if(w.length>3&&!stopwords.has(w))wordCount[w]=(wordCount[w]||0)+1;
    });
  });
  const topWords = Object.entries(wordCount).sort(([,a],[,b])=>b-a).slice(0,12);

  // Compare first vs last
  const compareData = LEVELS.map(l=>({
    ...l,
    first: first.levels?.[l.key]||0,
    last:  last.levels?.[l.key]||0,
    diff:  (last.levels?.[l.key]||0)-(first.levels?.[l.key]||0),
  })).filter(l=>l.first>0||l.last>0);

  // Sitzungsfrequenz
  const freqMap = {};
  cs.forEach(s=>{
    const m=s.createdAt?.slice(0,7);
    if(m) freqMap[m]=(freqMap[m]||0)+1;
  });
  const freqData = Object.entries(freqMap).sort(([a],[b])=>a.localeCompare(b));
  const maxFreq  = Math.max(...Object.values(freqMap),1);

  const SC = ({title,icon,children}) => (
    <Card style={{marginBottom:"14px"}}>
      <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"12px"}}>
        <span style={{fontSize:"18px"}}>{icon}</span>
        <span style={{fontFamily:"Cinzel",fontSize:"13px",color:T.text,fontWeight:700}}>{title}</span>
      </div>
      {children}
    </Card>
  );

  return (
    <div style={{padding:"0 16px 96px"}}>
      <button onClick={onBack} style={{fontFamily:"Raleway",fontSize:"13px",color:T.teal,fontWeight:700,background:"none",border:"none",cursor:"pointer",paddingTop:"8px",display:"block",marginBottom:"12px"}}>← Zurück</button>

      {/* Hero */}
      <div style={{position:"relative",borderRadius:"22px",overflow:"hidden",padding:"22px 24px",marginBottom:"16px",background:`linear-gradient(140deg,${T.tealL} 0%,#FFFFFF 50%,${T.violetL} 100%)`,boxShadow:`0 6px 28px ${T.shadowDeep}`,border:`1.5px solid ${T.border}`}}>
        <Flower size={200} opacity={0.09}/>
        <div style={{position:"relative",zIndex:1}}>
          <h2 style={{fontFamily:"Cinzel",fontSize:"20px",color:T.text,margin:"0 0 4px",fontWeight:700}}>{client.name}</h2>
          <p style={{fontFamily:"Raleway",fontSize:"11px",color:T.textMid,margin:"0 0 10px",fontWeight:600}}>{cs.length} Sitzungen · {first.createdAt?.slice(0,10)} – {last.createdAt?.slice(0,10)}</p>
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
            <span style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:700,padding:"4px 12px",borderRadius:"12px",background:trendBg,color:trendColor}}>Gesamtbelastung {trend}</span>
            {client.tags?.slice(0,2).map(t=><span key={t} style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:700,padding:"4px 12px",borderRadius:"12px",background:T.tealL,color:T.tealD}}>{t}</span>)}
          </div>
        </div>
      </div>

      {/* Fortschrittskurve — Gesamtbelastung */}
      <SC title="Fortschrittskurve" icon="📈">
        <div style={{display:"flex",alignItems:"flex-end",gap:"4px",height:"72px",marginBottom:"8px"}}>
          {lineData.map((d,i)=>{
            const h=Math.max((d.total/maxTotal)*100,4);
            const col = i===0?T.border:d.total<lineData[i-1].total?T.teal:d.total>lineData[i-1].total?"#F87171":T.gold;
            return(
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",height:"100%",gap:"2px"}}>
                <div style={{width:"100%",borderRadius:"4px 4px 0 0",background:col,height:`${h}%`,transition:"height 0.4s"}}/>
                <div style={{fontFamily:"Raleway",fontSize:"7px",color:T.textSoft,fontWeight:600,textAlign:"center",lineHeight:"1.1"}}>{d.label}</div>
              </div>
            );
          })}
        </div>
        <div style={{display:"flex",gap:"10px",justifyContent:"center"}}>
          {[{c:T.teal,l:"Besser"},{c:"#F87171",l:"Mehr Aktivität"},{c:T.gold,l:"Gleich"}].map((x,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:"4px"}}>
              <div style={{width:"8px",height:"8px",borderRadius:"2px",background:x.c}}/>
              <span style={{fontFamily:"Raleway",fontSize:"9px",color:T.textSoft,fontWeight:600}}>{x.l}</span>
            </div>
          ))}
        </div>
      </SC>

      {/* Vergleich Erst- vs. letzte Sitzung */}
      {cs.length>1 && (
        <SC title="Erst- vs. letzte Sitzung" icon="🔄">
          {compareData.map(l=>(
            <div key={l.key} style={{marginBottom:"10px"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"3px"}}>
                <span style={{fontFamily:"Raleway",fontSize:"11px",color:T.text,fontWeight:700}}>{l.icon} {l.name}</span>
                <span style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:800,color:l.diff<0?T.tealD:l.diff>0?"#C0392B":T.textSoft}}>
                  {l.diff<0?`▼ ${Math.abs(l.diff)}%`:l.diff>0?`▲ ${l.diff}%`:"="}
                </span>
              </div>
              <div style={{display:"flex",gap:"4px",alignItems:"center"}}>
                <span style={{fontFamily:"Raleway",fontSize:"9px",color:T.textSoft,fontWeight:600,width:"24px",textAlign:"right"}}>{l.first}%</span>
                <div style={{flex:1,height:"7px",borderRadius:"4px",background:T.bgSoft,position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,height:"100%",width:`${l.first}%`,background:T.border,borderRadius:"4px"}}/>
                  <div style={{position:"absolute",top:0,left:0,height:"100%",width:`${l.last}%`,background:l.diff<0?T.teal:l.diff>0?"#F87171":T.gold,borderRadius:"4px",opacity:0.85}}/>
                </div>
                <span style={{fontFamily:"Raleway",fontSize:"9px",color:l.diff<0?T.tealD:l.diff>0?"#C0392B":T.textSoft,fontWeight:700,width:"24px"}}>{l.last}%</span>
              </div>
            </div>
          ))}
          <div style={{display:"flex",gap:"10px",marginTop:"8px",justifyContent:"center"}}>
            <span style={{fontFamily:"Raleway",fontSize:"9px",color:T.textSoft,fontWeight:600}}>Grau = Erste Sitzung &nbsp;·&nbsp; Farbe = Letzte Sitzung</span>
          </div>
        </SC>
      )}

      {/* Ebenen-Verlauf (heatmap style) */}
      <SC title="Ebenen-Verlauf über Zeit" icon="⚡">
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:"9px"}}>
            <thead>
              <tr>
                <th style={{fontFamily:"Raleway",fontWeight:700,color:T.textSoft,textAlign:"left",padding:"2px 4px",width:"80px"}}>Ebene</th>
                {cs.map((s,i)=><th key={i} style={{fontFamily:"Raleway",fontWeight:600,color:T.textSoft,textAlign:"center",padding:"2px 3px",minWidth:"28px"}}>{new Date(s.createdAt).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit"})}</th>)}
              </tr>
            </thead>
            <tbody>
              {LEVELS.filter(l=>cs.some(s=>(s.levels?.[l.key]||0)>0)).map(l=>(
                <tr key={l.key}>
                  <td style={{fontFamily:"Raleway",fontWeight:700,color:T.text,padding:"3px 4px",fontSize:"9px"}}>{l.icon} {l.name.slice(0,8)}</td>
                  {cs.map((s,i)=>{
                    const v=s.levels?.[l.key]||0;
                    const alpha=v/100;
                    return<td key={i} style={{textAlign:"center",padding:"2px 3px"}}>
                      <div style={{width:"22px",height:"22px",borderRadius:"5px",margin:"0 auto",background:v>0?l.bar:"#F0FAFA",opacity:v>0?0.3+alpha*0.7:1,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"8px",fontWeight:700,color:v>60?"white":T.textSoft}}>
                        {v>0?v:""}
                      </div>
                    </td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SC>

      {/* Sitzungsfrequenz */}
      <SC title="Sitzungsfrequenz" icon="📅">
        <div style={{display:"flex",alignItems:"flex-end",gap:"8px",height:"60px",marginBottom:"6px"}}>
          {freqData.map(([month,count],i)=>(
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",height:"100%",gap:"3px"}}>
              <span style={{fontFamily:"Raleway",fontSize:"9px",color:T.teal,fontWeight:700}}>{count}</span>
              <div style={{width:"100%",borderRadius:"4px 4px 0 0",background:T.teal,height:`${(count/maxFreq)*100}%`}}/>
              <span style={{fontFamily:"Raleway",fontSize:"8px",color:T.textSoft,fontWeight:600}}>{month.slice(5)}</span>
            </div>
          ))}
        </div>
        <div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textSoft,fontWeight:500,textAlign:"center"}}>
          Ø {(cs.length / Math.max(freqData.length,1)).toFixed(1)} Sitzungen/Monat
        </div>
      </SC>

      {/* Technik-Entwicklung */}
      {allTechs.length>0 && (
        <SC title="Technik-Entwicklung" icon="🏆">
          <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
            {allTechs.slice(0,8).map(tech=>{
              const usedIn = cs.filter(s=>(s.techniques||[]).includes(tech));
              const firstUsed = usedIn[0]?.createdAt?.slice(0,10)||"";
              const count = usedIn.length;
              return(
                <div key={tech} style={{display:"flex",alignItems:"center",gap:"10px"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:700,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{tech}</div>
                    <div style={{fontFamily:"Raleway",fontSize:"9px",color:T.textSoft,fontWeight:500}}>Erstmals: {firstUsed}</div>
                  </div>
                  <div style={{display:"flex",gap:"3px",flexShrink:0}}>
                    {cs.map((s,i)=>(
                      <div key={i} style={{width:"10px",height:"10px",borderRadius:"2px",background:(s.techniques||[]).includes(tech)?T.teal:T.bgSoft,border:`1px solid ${T.border}`}}/>
                    ))}
                  </div>
                  <span style={{fontFamily:"Raleway",fontSize:"10px",color:T.teal,fontWeight:800,flexShrink:0,background:T.tealL,padding:"2px 7px",borderRadius:"8px"}}>{count}×</span>
                </div>
              );
            })}
          </div>
        </SC>
      )}

      {/* Wordcloud Themen */}
      {topWords.length>0 && (
        <SC title="Themen-Wordcloud" icon="💬">
          <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
            {topWords.map(([word,count],i)=>{
              const size=11+Math.round((count/(topWords[0][1]||1))*7);
              return(
                <span key={word} style={{fontFamily:"Raleway",fontSize:`${size}px`,fontWeight:700,color:i<3?T.tealD:T.textMid,background:i<3?T.tealL:T.bgSoft,padding:"5px 12px",borderRadius:"16px",border:`1px solid ${i<3?T.borderMid:T.border}`}}>
                  {word}<span style={{fontSize:"9px",opacity:0.6}}> ×{count}</span>
                </span>
              );
            })}
          </div>
        </SC>
      )}

    </div>
  );
}

export { ClientAnalysis };
