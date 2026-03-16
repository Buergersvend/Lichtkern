import React, { useState, useEffect, useCallback, useRef } from "react";
import { todayStr } from '../config/helpers';
import { T } from "../config/theme.js";
import { APPT_TYPES, LEVELS, TECHNIQUES, KNOWLEDGE, DE_DAYS, DE_DAYS_F, DE_MONTHS, HOURS } from "../config/constants.js";
import { Card, Btn, Pill, SL, TI, Select, LBar } from "../components/UI.jsx";
function Dashboard({clients,sessions,appointments,onNav,reminders,onDismissReminder,onAddReminder,settings}){
  const lC={};sessions.forEach(s=>Object.entries(s.levels||{}).forEach(([k,v])=>{if(v>50)lC[k]=(lC[k]||0)+1;}));
  const tL=Object.entries(lC).sort(([,a],[,b])=>b-a)[0];
  const tI=tL?lvl(tL[0]):null;
  const today=todayStr();
  const todayAppts=(appointments||[]).filter(a=>a.date===today).sort((a,b)=>a.startTime.localeCompare(b.startTime));
  const recentSessions=sessions.slice(0,3);
  const hour=new Date().getHours();
  const greeting=hour<12?"Guten Morgen":hour<17?"Guten Tag":"Guten Abend";
  const name=settings?.therapistName?settings.therapistName.split(" ")[0]:"";

  return(
    <div style={{padding:"0 16px 120px"}}>

      {/* Stats row */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"16px"}}>
        <div style={{background:"white",borderRadius:"18px",border:`1.5px solid ${T.border}`,padding:"16px",boxShadow:`0 2px 12px ${T.shadow}`,display:"flex",alignItems:"center",gap:"12px"}} onClick={()=>onNav("analytics")}>
          <div style={{width:"42px",height:"42px",borderRadius:"12px",background:T.violetL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",flexShrink:0}}>◇</div>
          <div>
            <div style={{fontFamily:"Cinzel",fontSize:"22px",color:T.violetD,fontWeight:700,lineHeight:1}}>{sessions.length}</div>
            <div style={{fontFamily:"Raleway",fontSize:"10px",color:T.textSoft,fontWeight:700,letterSpacing:"0.5px",marginTop:"2px"}}>Sitzungen</div>
          </div>
        </div>
        <div style={{background:"white",borderRadius:"18px",border:`1.5px solid ${tI?.border||T.border}`,padding:"16px",boxShadow:`0 2px 12px ${T.shadow}`,display:"flex",alignItems:"center",gap:"12px"}}>
          <div style={{width:"42px",height:"42px",borderRadius:"12px",background:tI?.bg||T.bgSoft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",flexShrink:0}}>{tI?.icon||"–"}</div>
          <div>
            <div style={{fontFamily:"Raleway",fontSize:"12px",color:tI?.text||T.textMid,fontWeight:700,lineHeight:1.3}}>{tI?.name||"Noch keine"}</div>
            <div style={{fontFamily:"Raleway",fontSize:"10px",color:T.textSoft,fontWeight:600,marginTop:"2px"}}>Top-Ebene</div>
          </div>
        </div>
      </div>

      {/* Today's appointments */}
      {todayAppts.length>0&&(<>
        <SL>Heute</SL>
        <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"16px"}}>
          {todayAppts.map(a=>{
            const at=APPT_TYPES[a.type]||APPT_TYPES.other;
            return(
              <div key={a.id} onClick={()=>onNav("calendar")} style={{background:"white",border:`1.5px solid ${at.border}`,borderLeft:`4px solid ${at.dot}`,borderRadius:"14px",padding:"12px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:"12px",boxShadow:`0 2px 8px ${T.shadow}`}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:"Raleway",fontSize:"13px",fontWeight:700,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.title||a.clientName||at.label}</div>
                  <div style={{fontFamily:"Raleway",fontSize:"11px",color:at.color,fontWeight:600,marginTop:"2px"}}>{a.startTime} – {a.endTime}</div>
                </div>
                <span style={{color:T.textSoft,fontSize:"14px"}}>→</span>
              </div>
            );
          })}
        </div>
      </>)}

      {/* Empty state if no clients */}
      {clients.length===0&&(
        <div style={{background:"rgba(255,255,255,0.7)",borderRadius:"14px",border:`1px dashed ${T.borderMid}`,padding:"14px 18px",marginBottom:"16px",display:"flex",alignItems:"center",gap:"12px"}}>
          <span style={{fontSize:"22px"}}>🌱</span>
          <div>
            <div style={{fontFamily:"Raleway",fontSize:"13px",color:T.text,fontWeight:700}}>Noch keine Klienten</div>
            <div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textSoft,marginTop:"2px"}}>Leg deinen ersten Klienten an →</div>
          </div>
          <button onClick={()=>onNav("clients")} style={{marginLeft:"auto",fontFamily:"Raleway",fontWeight:700,fontSize:"12px",padding:"8px 14px",borderRadius:"12px",background:T.tealL,color:T.tealD,border:`1.5px solid ${T.borderMid}`,cursor:"pointer",flexShrink:0}}>◈ Anlegen</button>
        </div>
      )}

      {/* Quick actions with Tree of Life background */}
      <SL>Schnellzugriff</SL>
      <div style={{position:"relative",borderRadius:"20px",overflow:"hidden",padding:"4px 0 8px"}}>
        <div style={{position:"relative",zIndex:1,display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"16px"}}>
        {[
          {label:"Klient anlegen",   icon:"◈", s:"clients",   bg:"rgba(255,255,255,0.82)", border:T.borderMid,  c:T.tealD},
          {label:"Kalender",         icon:"⊡", s:"calendar",  bg:"rgba(255,255,255,0.82)", border:"#A78BFA",    c:T.violetD},
          {label:"Wissensbasis",     icon:"◆", s:"knowledge", bg:"rgba(255,255,255,0.82)", border:"#6BAEE8",    c:"#0A2A50"},
          {label:"Generationsbaum",  icon:"🧬",s:"gentree",   bg:"rgba(255,255,255,0.82)", border:"#9B7EE0",    c:"#2A1660"},
          {label:"Synergy Engine",    icon:"⚡",s:"synergy",   bg:"rgba(255,255,255,0.82)", border:"#6D3FCC",    c:"#3D1A8A"},
          {label:"Abrechnung",       icon:"◎", s:"billing",   bg:"rgba(255,255,255,0.82)", border:"#4ADE80",    c:"#0A3B20"},
          {label:"Analyse",          icon:"◇", s:"analytics", bg:"rgba(255,255,255,0.82)", border:T.borderMid,  c:T.tealD},
        ].map((a,i)=>(
          <div key={i} onClick={()=>onNav(a.s)} style={{background:a.bg,borderRadius:"18px",padding:"18px 16px",cursor:"pointer",border:`1.5px solid ${a.border}`,boxShadow:`0 2px 12px rgba(0,0,0,0.06)`,display:"flex",alignItems:"center",gap:"12px",backdropFilter:"blur(4px)"}}>
            <div style={{width:"36px",height:"36px",borderRadius:"10px",background:a.border+"33",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",flexShrink:0}}>{a.icon}</div>
            <span style={{fontFamily:"Raleway",fontSize:"13px",color:a.c,fontWeight:700}}>{a.label}</span>
          </div>
        ))}
        </div>
      </div>

      {/* Recent sessions */}
      {recentSessions.length>0&&(<>
        <SL>Letzte Sitzungen</SL>
        <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"16px"}}>
          {recentSessions.map(s=>(
            <div key={s.id} onClick={()=>onNav("clients")} style={{background:"white",borderRadius:"14px",border:`1.5px solid ${T.border}`,padding:"12px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:"12px",boxShadow:`0 1px 8px ${T.shadow}`}}>
              <div style={{width:"36px",height:"36px",borderRadius:"50%",background:T.tealL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",fontFamily:"Cinzel",fontWeight:700,color:T.tealD,flexShrink:0}}>{(s.clientName||"?")[0]}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:"Raleway",fontSize:"13px",fontWeight:700,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.clientName||"—"}</div>
                <div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textSoft,marginTop:"1px"}}>{s.createdAt?.slice(0,10)||"—"}</div>
              </div>
              <span style={{color:T.textSoft,fontSize:"14px"}}>→</span>
            </div>
          ))}
        </div>
      </>)}
      {(()=>{
        const now=new Date();
        const today=now.toISOString().slice(0,10);
        const hints=[];

        // Auto: days without session per client
        clients.forEach(c=>{
          const cs=sessions.filter(s=>s.clientId===c.id).sort((a,b)=>b.createdAt?.localeCompare(a.createdAt));
          if(cs.length>0){
            const last=new Date(cs[0].createdAt);
            const days=Math.floor((now-last)/(1000*60*60*24));
            if(days>=30) hints.push({id:`nosession_${c.id}`,type:"nosession",icon:"⏰",color:"#C0392B",bg:"#FEE2E2",border:"#FCA5A5",title:`${c.name}`,sub:`Letzte Sitzung vor ${days} Tagen`,email:c.contact,clientName:c.name});
          }
        });

        // Auto: birthdays this week
        clients.forEach(c=>{
          if(!c.birthDate) return;
          const bd=new Date(c.birthDate);
          const thisYear=new Date(now.getFullYear(),bd.getMonth(),bd.getDate());
          const diff=Math.floor((thisYear-now)/(1000*60*60*24));
          if(diff>=0&&diff<=7) hints.push({id:`bday_${c.id}`,type:"bday",icon:"🎂",color:"#7C4A00",bg:"#FEF3C7",border:"#F59E0B",title:`${c.name}`,sub:diff===0?"Geburtstag heute! 🎉":`Geburtstag in ${diff} Tag${diff!==1?"en":""}`,email:c.contact,clientName:c.name});
        });

        // Auto: follow-up (7 days after session, if no follow-up booked)
        sessions.slice(0,20).forEach(s=>{
          if(!s.createdAt) return;
          const sd=new Date(s.createdAt);
          const days=Math.floor((now-sd)/(1000*60*60*24));
          if(days>=7&&days<=14){
            const hasFollowup=sessions.some(x=>x.clientId===s.clientId&&x.createdAt>s.createdAt);
            if(!hasFollowup){
              const cl=clients.find(x=>x.id===s.clientId);
              hints.push({id:`followup_${s.id}`,type:"followup",icon:"🔄",color:T.tealD,bg:T.tealL,border:T.borderMid,title:`Follow-up: ${s.clientName||"—"}`,sub:`Sitzung vor ${days} Tagen — noch keine Folgesitzung`,email:cl?.contact,clientName:s.clientName});
            }
          }
        });

        // Auto: open invoices older than 14 days
        sessions.forEach(s=>{
          if((s.payStatus==="open"||s.payStatus==="partial")&&s.fee&&s.createdAt){
            const days=Math.floor((now-new Date(s.createdAt))/(1000*60*60*24));
            if(days>=14){
              const cl=clients.find(x=>x.id===s.clientId);
              hints.push({id:`invoice_${s.id}`,type:"invoice",icon:"💰",color:"#7C4A00",bg:"#FEF3C7",border:"#F59E0B",title:`Offene Rechnung: ${s.clientName||"—"}`,sub:`${s.fee} CHF · vor ${days} Tagen`,email:cl?.contact,clientName:s.clientName});
            }
          }
        });

        // Manual reminders
        (reminders||[]).forEach(r=>{
          if(!r.done) hints.push({...r,isManual:true});
        });

        // Filter dismissed
        const active=hints.filter(h=>!(reminders||[]).find(r=>r.id===h.id&&r.dismissed));

        if(active.length===0) return null;
        return(<>
          <SL>🔔 Hinweise ({active.length})</SL>
          <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"18px"}}>
            {active.map(h=>(
              <div key={h.id} style={{background:h.bg,borderRadius:"14px",padding:"12px 14px",border:`1.5px solid ${h.border}`,display:"flex",gap:"10px",alignItems:"flex-start"}}>
                <span style={{fontSize:"20px",flexShrink:0,marginTop:"1px"}}>{h.icon}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:"Raleway",fontSize:"13px",fontWeight:700,color:"#0F3030"}}>{h.title}</div>
                  <div style={{fontFamily:"Raleway",fontSize:"11px",color:h.color,fontWeight:600,marginTop:"2px"}}>{h.sub}</div>
                  <div style={{display:"flex",gap:"6px",marginTop:"8px",flexWrap:"wrap"}}>
                    {h.email&&h.type==="bday"&&<button onClick={()=>{const s=encodeURIComponent(`Herzlichen Glückwunsch zum Geburtstag! 🎂`);const b=encodeURIComponent(`Liebe/r ${h.clientName},

herzlichen Glückwunsch zu deinem Geburtstag!

Ich wünsche dir einen wundervollen Tag voller Licht und Freude. 🌿

✦ Lichtkern · powered by Human Resonanz`);window.location.href=`mailto:${h.email}?subject=${s}&body=${b}`;}} style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:700,padding:"4px 10px",borderRadius:"8px",border:`1px solid ${h.border}`,background:"rgba(255,255,255,0.7)",color:h.color,cursor:"pointer"}}>✉️ Glückwunsch senden</button>}
                    {h.email&&h.type==="nosession"&&<button onClick={()=>{const s=encodeURIComponent(`Wie geht es dir? · Lichtkern`);const b=encodeURIComponent(`Liebe/r ${h.clientName},

ich denke an dich und frage mich, wie es dir geht. Magst du eine neue Sitzung vereinbaren?

Ich freue mich von dir zu hören. 🌿

✦ Lichtkern · powered by Human Resonanz`);window.location.href=`mailto:${h.email}?subject=${s}&body=${b}`;}} style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:700,padding:"4px 10px",borderRadius:"8px",border:`1px solid ${h.border}`,background:"rgba(255,255,255,0.7)",color:h.color,cursor:"pointer"}}>✉️ Kontakt aufnehmen</button>}
                    {h.email&&h.type==="followup"&&<button onClick={()=>{const s=encodeURIComponent(`Follow-up · Lichtkern`);const b=encodeURIComponent(`Liebe/r ${h.clientName},

wie integrierst du die Impulse aus unserer letzten Sitzung? Ich würde mich freuen, von dir zu hören und eventuell einen Folgetermin zu vereinbaren.

✦ Lichtkern · powered by Human Resonanz`);window.location.href=`mailto:${h.email}?subject=${s}&body=${b}`;}} style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:700,padding:"4px 10px",borderRadius:"8px",border:`1px solid ${h.border}`,background:"rgba(255,255,255,0.7)",color:h.color,cursor:"pointer"}}>✉️ Follow-up Mail</button>}
                    {h.email&&h.type==="invoice"&&<button onClick={()=>{const s=encodeURIComponent(`Zahlungserinnerung · Lichtkern`);const b=encodeURIComponent(`Liebe/r ${h.clientName},

dies ist eine freundliche Erinnerung bezüglich der ausstehenden Rechnung von ${h.sub}.

Vielen Dank für deine baldige Begleichung.

✦ Lichtkern · powered by Human Resonanz`);window.location.href=`mailto:${h.email}?subject=${s}&body=${b}`;}} style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:700,padding:"4px 10px",borderRadius:"8px",border:`1px solid ${h.border}`,background:"rgba(255,255,255,0.7)",color:h.color,cursor:"pointer"}}>✉️ Rechnung erinnern</button>}
                    {h.isManual&&<button onClick={()=>onDismissReminder(h.id)} style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:700,padding:"4px 10px",borderRadius:"8px",border:`1px solid ${h.border}`,background:"rgba(255,255,255,0.7)",color:h.color,cursor:"pointer"}}>✅ Erledigt</button>}
                    {!h.isManual&&<button onClick={()=>onDismissReminder(h.id)} style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:600,padding:"4px 10px",borderRadius:"8px",border:"1px solid #CBD5E1",background:"rgba(255,255,255,0.5)",color:"#6AABA7",cursor:"pointer"}}>Ausblenden</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>);
      })()}

    </div>
  );
}

export { Dashboard };
