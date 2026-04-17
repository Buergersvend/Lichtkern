import React, { useState, useEffect, useCallback, useRef } from "react";
import { todayStr, addDays, parseDate, toDateStr, getMondayOf, getWeekDays, getMonthDays, uid } from '../config/helpers';
import { T } from "../config/theme.js";
import { APPT_TYPES, LEVELS, TECHNIQUES, KNOWLEDGE, DE_DAYS, DE_DAYS_F, DE_MONTHS, HOURS } from "../config/constants.js";
import { Card, Btn, TI, SL, Select, Pill } from "../components/UI.jsx";
function ApptModal({appt, clients, onSave, onDelete, onClose}){
  const isNew = !appt.id;
  const [form,setForm] = useState({
    type: appt.type||"session",
    title: appt.title||"",
    clientId: appt.clientId||"",
    clientName: appt.clientName||"",
    date: appt.date||todayStr(),
    startTime: appt.startTime||"09:00",
    endTime: appt.endTime||"10:00",
    notes: appt.notes||"",
    status: appt.status||"planned",
  });
  const up = u => setForm({...form,...u});
  const at = APPT_TYPES[form.type]||APPT_TYPES.session;

  const handleClientChange = (id) => {
    const c = clients.find(c=>c.id===id);
    up({clientId:id, clientName:c?.name||""});
  };

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(15,48,48,0.45)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:T.bgCard,borderRadius:"24px 24px 0 0",width:"100%",maxWidth:"480px",maxHeight:"88vh",overflowY:"auto",padding:"20px 20px 100px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"18px"}}>
          <div style={{fontFamily:"Cinzel",fontSize:"17px",color:T.text,fontWeight:700}}>
            {isNew?"Neuer Termin":"Termin bearbeiten"}
          </div>
          <button onClick={onClose} style={{fontFamily:"Raleway",fontSize:"20px",color:T.textSoft,background:"none",border:"none",cursor:"pointer",lineHeight:1}}>✕</button>
        </div>
        <SL>Terminart</SL>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"7px",marginBottom:"16px"}}>
          {Object.entries(APPT_TYPES).map(([key,t])=>(
            <button key={key} onClick={()=>up({type:key})} style={{padding:"9px 10px",borderRadius:"12px",border:`1.5px solid ${form.type===key?t.color:T.border}`,background:form.type===key?t.bg:T.bgCard,cursor:"pointer",fontFamily:"Raleway",fontSize:"11px",fontWeight:700,color:form.type===key?t.color:T.textMid,textAlign:"left",transition:"all 0.15s"}}>
              <span style={{display:"block",fontSize:"7px",letterSpacing:"1px",textTransform:"uppercase",marginBottom:"2px",opacity:0.7}}>{key==="session"?"●":"○"}</span>
              {t.label}
            </button>
          ))}
        </div>
        {["session","first","followup"].includes(form.type)&&(<>
          <SL>Klient</SL>
          <div style={{marginBottom:"14px"}}>
            <Select value={form.clientId} onChange={handleClientChange} options={[{value:"",label:"— Klient wählen —"},...clients.map(c=>({value:c.id,label:c.name}))]}/>
            {!form.clientId&&<div style={{marginTop:"6px",background:T.bgCard,borderRadius:"10px"}}><TI value={form.clientName} onChange={v=>up({clientName:v,clientId:""})} placeholder="Oder freier Name…"/></div>}
          </div>
        </>)}
        <SL>Titel / Thema</SL>
        <div style={{marginBottom:"14px"}}>
          <TI value={form.title} onChange={v=>up({title:v})} placeholder={at.label+"…"}/>
        </div>
        <SL>Datum & Zeit</SL>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"14px"}}>
          <div style={{gridColumn:"1/-1"}}><TI type="date" value={form.date} onChange={v=>up({date:v})}/></div>
          <div><TI type="time" value={form.startTime} onChange={v=>up({startTime:v})} placeholder="Von"/></div>
          <div><TI type="time" value={form.endTime} onChange={v=>up({endTime:v})} placeholder="Bis"/></div>
          <div>
            <Select value={form.status} onChange={v=>up({status:v})} options={[
              {value:"planned",label:"📅 Geplant"},
              {value:"done",label:"✅ Abgeschlossen"},
              {value:"cancelled",label:"❌ Abgesagt"},
            ]}/>
          </div>
        </div>
        <SL>Notizen</SL>
        <div style={{marginBottom:"18px"}}>
          <TI value={form.notes} onChange={v=>up({notes:v})} placeholder="Vorbereitungsnotizen…" multiline rows={2}/>
        </div>
        <div style={{display:"flex",gap:"8px",flexDirection:"column"}}>
          <Btn onClick={()=>onSave({...appt,...form,id:appt.id||uid()})} style={{width:"100%"}}>
            {isNew?"Termin speichern":"Änderungen speichern"}
          </Btn>
          {!isNew&&(<div style={{display:"flex",gap:"8px"}}>
            <Btn variant="danger" onClick={()=>onDelete(appt.id)} style={{flex:1,fontSize:"12px",padding:"10px"}}>🗑 Löschen</Btn>
          </div>)}
          <Btn variant="soft" onClick={onClose} style={{width:"100%"}}>Abbrechen</Btn>
        </div>
      </div>
    </div>
  );
}

function CalendarScreen({appointments,clients,onSaveAppt,onDeleteAppt,onStartSession}){
  const [view,setView]         = useState("week");
  const [currentDate,setCurrent] = useState(todayStr());
  const [modal,setModal]       = useState(null);

  const today = todayStr();

  const navigate = (dir) => {
    if(view==="day")   setCurrent(addDays(currentDate, dir));
    if(view==="week")  setCurrent(addDays(currentDate, dir*7));
    if(view==="month"){
      const d=parseDate(currentDate);
      d.setMonth(d.getMonth()+dir);
      setCurrent(toDateStr(d));
    }
  };

  const apptsByDate = {};
  appointments.forEach(a=>{ if(!apptsByDate[a.date])apptsByDate[a.date]=[]; apptsByDate[a.date].push(a); });

  const openNew = (date,startTime="09:00") => setModal({date,startTime,endTime:"10:00",type:"session",title:"",clientId:"",clientName:"",notes:"",status:"planned"});
  const openEdit = (a) => setModal(a);

  const headerLabel = () => {
    if(view==="day"){
      const d=parseDate(currentDate);
      return `${DE_DAYS_F[d.getDay()===0?6:d.getDay()-1]}, ${d.getDate()}. ${DE_MONTHS[d.getMonth()]}`;
    }
    if(view==="week"){
      const mon=getMondayOf(currentDate);
      const sun=addDays(mon,6);
      const dm=parseDate(mon),ds=parseDate(sun);
      return `${dm.getDate()}. – ${ds.getDate()}. ${DE_MONTHS[ds.getMonth()]} ${ds.getFullYear()}`;
    }
    const d=parseDate(currentDate);
    return `${DE_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  };

  const ApptChip = ({a,onClick}) => {
    const at=APPT_TYPES[a.type]||APPT_TYPES.other;
    return(
      <div onClick={e=>{e.stopPropagation();onClick(a);}} style={{background:at.bg,border:`1px solid ${at.border}`,borderRadius:"7px",padding:"3px 7px",marginBottom:"2px",cursor:"pointer",overflow:"hidden"}}>
        <div style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:700,color:at.color,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
          {a.startTime} {a.title||at.label}
        </div>
      </div>
    );
  };

  const DayView = () => {
    const dayAppts = (apptsByDate[currentDate]||[]).sort((a,b)=>a.startTime.localeCompare(b.startTime));
    return(
      <div style={{padding:"0 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
          <button onClick={()=>setCurrent(today)} style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:700,color:T.gold,background:"none",border:`1.5px solid ${T.goldL}`,borderRadius:"10px",padding:"5px 12px",cursor:"pointer"}}>Heute</button>
          <button onClick={()=>openNew(currentDate)} style={{fontFamily:"Raleway",fontSize:"12px",fontWeight:700,color:"white",background:`linear-gradient(135deg,${T.gold},${T.goldD})`,border:"none",borderRadius:"10px",padding:"7px 16px",cursor:"pointer"}}>+ Termin</button>
        </div>
        {dayAppts.length===0?(
          <div style={{textAlign:"center",padding:"48px 0",color:T.textSoft}}>
            <div style={{fontSize:"32px",marginBottom:"8px",opacity:0.4}}>⊡</div>
            <div style={{fontFamily:"Raleway",fontSize:"13px",fontWeight:500}}>Keine Termine</div>
            <button onClick={()=>openNew(currentDate)} style={{marginTop:"12px",fontFamily:"Raleway",fontSize:"12px",fontWeight:700,color:T.gold,background:"none",border:`1.5px solid ${T.goldL}`,borderRadius:"10px",padding:"7px 16px",cursor:"pointer"}}>+ Termin hinzufügen</button>
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
            {dayAppts.map(a=>{
              const at=APPT_TYPES[a.type]||APPT_TYPES.other;
              return(
                <div key={a.id} onClick={()=>openEdit(a)} style={{background:at.bg,border:`1.5px solid ${at.border}`,borderRadius:"16px",padding:"14px 16px",cursor:"pointer",position:"relative",overflow:"hidden"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:700,color:at.color,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"4px"}}>{at.label}</div>
                      <div style={{fontFamily:"Raleway",fontSize:"14px",fontWeight:700,color:T.text,marginBottom:"4px"}}>{a.title||a.clientName||at.label}</div>
                      {a.clientName&&a.title&&<div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textMid,fontWeight:500}}>{a.clientName}</div>}
                    </div>
                    <div style={{textAlign:"right",flexShrink:0,marginLeft:"12px"}}>
                      <div style={{fontFamily:"Raleway",fontSize:"12px",fontWeight:700,color:at.color}}>{a.startTime}</div>
                      <div style={{fontFamily:"Raleway",fontSize:"10px",color:T.textSoft,fontWeight:500}}>{a.endTime}</div>
                      <div style={{marginTop:"4px",fontSize:"9px",padding:"2px 7px",borderRadius:"8px",background:"rgba(255,255,255,0.6)",fontFamily:"Raleway",fontWeight:700,color:at.color}}>
                        {a.status==="done"?"✅":a.status==="cancelled"?"❌":"📅"}
                      </div>
                    </div>
                  </div>
                  {a.notes&&<div style={{fontFamily:"Raleway",fontSize:"11px",color:T.textMid,marginTop:"8px",fontWeight:500,fontStyle:"italic"}}>{a.notes}</div>}
                  {["session","first","followup"].includes(a.type)&&a.status!=="done"&&(
                    <button onClick={e=>{e.stopPropagation();onStartSession({clientId:a.clientId,name:a.clientName||a.title,apptId:a.id,goal:a.title,type:a.type==="first"?"first":"followup"});}}
                      style={{marginTop:"10px",width:"100%",fontFamily:"Raleway",fontSize:"12px",fontWeight:700,padding:"9px",borderRadius:"10px",border:"none",cursor:"pointer",background:`linear-gradient(135deg,${T.gold},${T.goldD})`,color:"white",boxShadow:`0 3px 10px ${T.shadowDeep}`}}>
                      ✦ Sitzung starten
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const WeekView = () => {
    const monday = getMondayOf(currentDate);
    const days   = getWeekDays(monday);
    return(
      <div style={{padding:"0 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
          <button onClick={()=>setCurrent(today)} style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:700,color:T.gold,background:"none",border:`1.5px solid ${T.goldL}`,borderRadius:"10px",padding:"5px 12px",cursor:"pointer"}}>Heute</button>
          <button onClick={()=>openNew(currentDate)} style={{fontFamily:"Raleway",fontSize:"12px",fontWeight:700,color:"white",background:`linear-gradient(135deg,${T.gold},${T.goldD})`,border:"none",borderRadius:"10px",padding:"7px 16px",cursor:"pointer"}}>+ Termin</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"4px"}}>
          {days.map((d,i)=>{
            const pd=parseDate(d);
            const isToday=d===today;
            const isSelected=d===currentDate;
            const dayAppts=(apptsByDate[d]||[]).sort((a,b)=>a.startTime.localeCompare(b.startTime));
            return(
              <div key={d} onClick={()=>{setCurrent(d);setView("day");}} style={{cursor:"pointer"}}>
                <div style={{textAlign:"center",marginBottom:"5px"}}>
                  <div style={{fontFamily:"Raleway",fontSize:"9px",fontWeight:700,color:"#C9A84C",letterSpacing:"0.5px"}}>{DE_DAYS[i]}</div>
                  <div style={{width:"28px",height:"28px",borderRadius:"50%",margin:"3px auto",display:"flex",alignItems:"center",justifyContent:"center",background:isToday?T.gold:isSelected?T.goldL:"transparent",border:isToday?"none":isSelected?`1.5px solid ${T.goldD}`:"none"}}>
                    <span style={{fontFamily:"Raleway",fontSize:"13px",fontWeight:700,color:isToday?"white":isSelected?T.goldD:"rgba(245,240,232,0.85)"}}>{pd.getDate()}</span>
                  </div>
                </div>
                <div style={{minHeight:"80px",background:isSelected?"rgba(168,125,58,0.15)":"transparent",borderRadius:"10px",padding:"2px"}}>
                  {dayAppts.map(a=><ApptChip key={a.id} a={a} onClick={openEdit}/>)}
                  {dayAppts.length===0&&<div style={{height:"4px",borderRadius:"2px",background:"transparent"}}/>}
                </div>
              </div>
            );
          })}
        </div>
        {(apptsByDate[currentDate]||[]).length>0&&(
          <div style={{marginTop:"16px"}}>
            <SL>{currentDate===today?"Heutige Termine":"Termine am "+parseDate(currentDate).getDate()+". "+DE_MONTHS[parseDate(currentDate).getMonth()]}</SL>
            <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
              {(apptsByDate[currentDate]||[]).sort((a,b)=>a.startTime.localeCompare(b.startTime)).map(a=>{
                const at=APPT_TYPES[a.type]||APPT_TYPES.other;
                return(
                  <div key={a.id} onClick={()=>openEdit(a)} style={{background:at.bg,border:`1.5px solid ${at.border}`,borderRadius:"14px",padding:"12px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:"12px"}}>
                    <div style={{width:"36px",height:"36px",borderRadius:"50%",background:"rgba(255,255,255,0.7)",border:`1.5px solid ${at.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <div style={{width:"10px",height:"10px",borderRadius:"50%",background:at.dot}}/>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:"Raleway",fontSize:"13px",fontWeight:700,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.title||a.clientName||at.label}</div>
                      <div style={{fontFamily:"Raleway",fontSize:"11px",color:at.color,fontWeight:600,marginTop:"2px"}}>{a.startTime} – {a.endTime} · {at.label}</div>
                    </div>
                    {["session","first","followup"].includes(a.type)&&a.status!=="done"&&(
                      <button onClick={e=>{e.stopPropagation();onStartSession({clientId:a.clientId,name:a.clientName||a.title,apptId:a.id,goal:a.title,type:a.type==="first"?"first":"followup"});}}
                        style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:700,padding:"6px 10px",borderRadius:"9px",border:"none",cursor:"pointer",background:`linear-gradient(135deg,${T.gold},${T.goldD})`,color:"white",flexShrink:0}}>
                        ✦ Start
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const MonthView = () => {
    const days = getMonthDays(currentDate);
    const curMonth = parseDate(currentDate).getMonth();
    return(
      <div style={{padding:"0 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
          <button onClick={()=>setCurrent(today)} style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:700,color:T.gold,background:"none",border:`1.5px solid ${T.goldL}`,borderRadius:"10px",padding:"5px 12px",cursor:"pointer"}}>Heute</button>
          <button onClick={()=>openNew(currentDate)} style={{fontFamily:"Raleway",fontSize:"12px",fontWeight:700,color:"white",background:`linear-gradient(135deg,${T.gold},${T.goldD})`,border:"none",borderRadius:"10px",padding:"7px 16px",cursor:"pointer"}}>+ Termin</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"2px",marginBottom:"4px"}}>
          {DE_DAYS.map(d=><div key={d} style={{textAlign:"center",fontFamily:"Raleway",fontSize:"11px",fontWeight:700,color:"#C9A84C",letterSpacing:"1px",padding:"4px 0"}}>{d}</div>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"2px"}}>
          {days.map(d=>{
            const pd=parseDate(d);
            const isThisMonth=pd.getMonth()===curMonth;
            const isToday=d===today;
            const isSelected=d===currentDate;
            const dayAppts=apptsByDate[d]||[];
            return(
              <div key={d} onClick={()=>{setCurrent(d);}} style={{minHeight:"52px",borderRadius:"10px",padding:"3px",cursor:"pointer",background:isSelected?"rgba(168,125,58,0.2)":isToday?"rgba(168,125,58,0.1)":"transparent",border:isSelected?`1.5px solid ${T.borderMid}`:"1.5px solid transparent",opacity:isThisMonth?1:0.35}}>
                <div style={{fontFamily:"Raleway",fontSize:"11px",fontWeight:isToday?800:600,color:isToday?"white":"rgba(245,240,232,0.85)",marginBottom:"3px",textAlign:"center",width:"22px",height:"22px",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 3px",background:isToday?T.gold:"transparent"}}>{pd.getDate()}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:"2px",justifyContent:"center"}}>
                  {dayAppts.slice(0,3).map(a=>{
                    const at=APPT_TYPES[a.type]||APPT_TYPES.other;
                    return <div key={a.id} style={{width:"7px",height:"7px",borderRadius:"50%",background:at.dot}}/>;
                  })}
                  {dayAppts.length>3&&<div style={{fontSize:"8px",color:T.textSoft,fontFamily:"Raleway",fontWeight:700}}>+{dayAppts.length-3}</div>}
                </div>
              </div>
            );
          })}
        </div>
        {(apptsByDate[currentDate]||[]).length>0&&(
          <div style={{marginTop:"14px"}}>
            <SL>{parseDate(currentDate).getDate()}. {DE_MONTHS[parseDate(currentDate).getMonth()]}</SL>
            <div style={{display:"flex",flexDirection:"column",gap:"7px"}}>
              {(apptsByDate[currentDate]||[]).sort((a,b)=>a.startTime.localeCompare(b.startTime)).map(a=>{
                const at=APPT_TYPES[a.type]||APPT_TYPES.other;
                return(
                  <div key={a.id} onClick={()=>openEdit(a)} style={{background:at.bg,border:`1.5px solid ${at.border}`,borderRadius:"13px",padding:"10px 13px",cursor:"pointer",display:"flex",alignItems:"center",gap:"10px"}}>
                    <div style={{width:"8px",height:"8px",borderRadius:"50%",background:at.dot,flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:"Raleway",fontSize:"12px",fontWeight:700,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.title||a.clientName||at.label}</div>
                      <div style={{fontFamily:"Raleway",fontSize:"10px",color:at.color,fontWeight:600}}>{a.startTime} – {a.endTime}</div>
                    </div>
                    {["session","first","followup"].includes(a.type)&&a.status!=="done"&&(
                      <button onClick={e=>{e.stopPropagation();onStartSession({clientId:a.clientId,name:a.clientName||a.title,apptId:a.id,goal:a.title,type:a.type==="first"?"first":"followup"});}}
                        style={{fontFamily:"Raleway",fontSize:"10px",fontWeight:700,padding:"5px 9px",borderRadius:"8px",border:"none",cursor:"pointer",background:T.gold,color:"white",flexShrink:0}}>
                        ✦
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return(
    <div style={{paddingBottom:"96px"}}>
      <div style={{padding:"8px 16px 12px"}}>
        <div style={{display:"flex",background:T.bgSoft,borderRadius:"14px",padding:"3px",marginBottom:"12px",border:`1.5px solid ${T.border}`}}>
          {[["day","Tag"],["week","Woche"],["month","Monat"]].map(([v,l])=>(
            <button key={v} onClick={()=>setView(v)} style={{flex:1,padding:"7px",borderRadius:"11px",border:"none",cursor:"pointer",fontFamily:"Raleway",fontSize:"11px",fontWeight:700,transition:"all 0.2s",background:view===v?T.gold:"transparent",color:view===v?"#FFFFFF":T.textSoft,boxShadow:view===v?`0 2px 8px ${T.shadow}`:"none"}}>{l}</button>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={()=>navigate(-1)} style={{width:"36px",height:"36px",borderRadius:"50%",border:`1.5px solid ${T.border}`,background:T.bgCard,cursor:"pointer",fontSize:"16px",color:T.textMid,display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
          <div style={{fontFamily:"Cinzel",fontSize:"14px",color:T.text,fontWeight:700,textAlign:"center"}}>{headerLabel()}</div>
          <button onClick={()=>navigate(1)} style={{width:"36px",height:"36px",borderRadius:"50%",border:`1.5px solid ${T.border}`,background:T.bgCard,cursor:"pointer",fontSize:"16px",color:T.textMid,display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
        </div>
      </div>

      {view==="day"   && <DayView/>}
      {view==="week"  && <WeekView/>}
      {view==="month" && <MonthView/>}

      {modal&&(
        <ApptModal
          appt={modal}
          clients={clients}
          onSave={a=>{onSaveAppt(a);setModal(null);}}
          onDelete={id=>{onDeleteAppt(id);setModal(null);}}
          onClose={()=>setModal(null)}
        />
      )}
    </div>
  );
}

export { ApptModal, CalendarScreen };
