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
          <TI value={form.notes} onChange={v=>up({notes:v})} placeholder=
